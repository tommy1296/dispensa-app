import { json, opzioni } from "@/lib/cors";
import { emettiToken, leggiCodice, leggiRinnovo, verificaPkce } from "@/lib/oauth";

const errore = (codice: string, descrizione: string) => json({ error: codice, error_description: descrizione }, 400);

async function leggiParametri(req: Request) {
  const tipo = req.headers.get("content-type") ?? "";
  if (tipo.includes("application/json")) {
    const corpo = (await req.json()) as Record<string, unknown>;
    return new Map(Object.entries(corpo).map(([k, v]) => [k, String(v ?? "")]));
  }
  const form = new URLSearchParams(await req.text());
  return new Map(form.entries());
}

export async function POST(req: Request) {
  const p = await leggiParametri(req);
  const grant = p.get("grant_type");

  if (grant === "authorization_code") {
    const codice = await leggiCodice(p.get("code") ?? "");
    if (!codice) return errore("invalid_grant", "Codice non valido o scaduto");
    if (p.get("client_id") && p.get("client_id") !== codice.cid) return errore("invalid_grant", "client_id diverso");
    if (p.get("redirect_uri") !== codice.ruri) return errore("invalid_grant", "redirect_uri diverso");
    const verifier = p.get("code_verifier") ?? "";
    if (!(await verificaPkce(verifier, codice.cc))) return errore("invalid_grant", "code_verifier errato");
    return json({ ...(await emettiToken(codice.sub, codice.cid, codice.res)), scope: "ricette" });
  }

  if (grant === "refresh_token") {
    const rinnovo = await leggiRinnovo(p.get("refresh_token") ?? "");
    if (!rinnovo) return errore("invalid_grant", "Refresh token non valido o scaduto");
    if (p.get("client_id") && p.get("client_id") !== rinnovo.cid) return errore("invalid_grant", "client_id diverso");
    return json({ ...(await emettiToken(rinnovo.sub, rinnovo.cid, rinnovo.res)), scope: "ricette" });
  }

  return errore("unsupported_grant_type", "Sono supportati authorization_code e refresh_token");
}

export const OPTIONS = opzioni;
