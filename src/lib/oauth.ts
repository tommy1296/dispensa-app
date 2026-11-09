import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Server di autorizzazione OAuth 2.1 minimo, solo per il connettore Claude.
 *
 * Non salva nulla nel database: client, codici e token sono JWT firmati con
 * OAUTH_SECRET. Cambiare quel segreto su Vercel revoca tutti gli accessi.
 */

const DURATA_CODICE = 120; // secondi
export const DURATA_ACCESSO = 60 * 60; // 1 ora
const DURATA_RINNOVO = 60 * 60 * 24 * 60; // 60 giorni

function segreto() {
  const s = process.env.OAUTH_SECRET;
  if (!s || s.length < 32) throw new Error("OAUTH_SECRET mancante o troppo corto (almeno 32 caratteri)");
  return new TextEncoder().encode(s);
}

type TipoToken = "client" | "code" | "access" | "refresh";

async function firma(tipo: TipoToken, dati: JWTPayload, durataSecondi?: number) {
  const jwt = new SignJWT({ ...dati, typ: tipo }).setProtectedHeader({ alg: "HS256" }).setIssuedAt();
  if (durataSecondi) jwt.setExpirationTime(`${durataSecondi}s`);
  return jwt.sign(segreto());
}

async function verifica<T extends JWTPayload>(tipo: TipoToken, token: string) {
  try {
    const { payload } = await jwtVerify(token, segreto(), { algorithms: ["HS256"] });
    return payload.typ === tipo ? (payload as T) : null;
  } catch {
    return null;
  }
}

/** Indirizzo pubblico dell'app, ricavato dalla richiesta (funziona anche dietro Vercel). */
export function origine(headers: Headers, urlRichiesta?: string) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
  return new URL(urlRichiesta ?? "http://localhost:3000").origin;
}

export const risorsaMcp = (orig: string) => `${orig}/mcp`;

// ---------------------------------------------------------------------------
// Client (registrazione dinamica o documento di metadati via URL)
// ---------------------------------------------------------------------------

export interface ClientOAuth {
  clientId: string;
  nome: string;
  redirectUris: string[];
}

export function redirectValido(uri: string) {
  try {
    const u = new URL(uri);
    if (u.hash) return false;
    if (u.protocol === "https:") return true;
    return u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  } catch {
    return false;
  }
}

export async function registraClient(nome: string, redirectUris: string[]) {
  const clientId = await firma("client", { nome, redirect_uris: redirectUris });
  return { clientId, nome, redirectUris } satisfies ClientOAuth;
}

export async function trovaClient(clientId: string): Promise<ClientOAuth | null> {
  // Client ID Metadata Document: il client_id è un URL https che descrive il client.
  if (clientId.startsWith("https://")) {
    try {
      const risposta = await fetch(clientId, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      });
      if (!risposta.ok) return null;
      const doc = (await risposta.json()) as { client_id?: string; client_name?: string; redirect_uris?: string[] };
      if (doc.client_id !== clientId || !Array.isArray(doc.redirect_uris)) return null;
      return {
        clientId,
        nome: doc.client_name || new URL(clientId).hostname,
        redirectUris: doc.redirect_uris.filter(redirectValido),
      };
    } catch {
      return null;
    }
  }
  const dati = await verifica<{ nome: string; redirect_uris: string[] }>("client", clientId);
  return dati ? { clientId, nome: dati.nome, redirectUris: dati.redirect_uris } : null;
}

// ---------------------------------------------------------------------------
// Codici di autorizzazione e token
// ---------------------------------------------------------------------------

export async function creaCodice(dati: {
  utente: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  risorsa: string;
}) {
  return firma(
    "code",
    {
      sub: dati.utente,
      cid: dati.clientId,
      ruri: dati.redirectUri,
      cc: dati.codeChallenge,
      res: dati.risorsa,
    },
    DURATA_CODICE,
  );
}

export async function leggiCodice(codice: string) {
  return verifica<{ sub: string; cid: string; ruri: string; cc: string; res: string }>("code", codice);
}

export async function verificaPkce(verifier: string, challenge: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const calcolato = Buffer.from(hash).toString("base64url");
  return calcolato === challenge;
}

export async function emettiToken(utente: string, clientId: string, risorsa: string) {
  const [access_token, refresh_token] = await Promise.all([
    firma("access", { sub: utente, cid: clientId, aud: risorsa }, DURATA_ACCESSO),
    firma("refresh", { sub: utente, cid: clientId, res: risorsa }, DURATA_RINNOVO),
  ]);
  return { access_token, refresh_token, token_type: "Bearer", expires_in: DURATA_ACCESSO };
}

export async function leggiRinnovo(token: string) {
  return verifica<{ sub: string; cid: string; res: string }>("refresh", token);
}

export async function leggiAccesso(token: string) {
  return verifica<{ sub: string; cid: string; aud: string; exp: number }>("access", token);
}
