import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { salvaFotoOttimizzata } from "./foto";

// Recupera la copertina di un post o reel pubblico di Instagram e ne salva una
// copia nel bucket "foto-ricette", già nel formato unico (vedi foto.ts). Gli
// indirizzi delle immagini di Instagram scadono dopo qualche giorno, quindi non
// si possono salvare così come sono.
//
// L'immagine si legge dalla pagina di incorporamento pubblica del post
// (instagram.com/p/<codice>/embed/), la stessa che usano i siti per mostrare
// un post. Instagram può rifiutare le richieste da server, quindi è un
// tentativo: se non va, la foto si carica a mano.

const MAX_BYTE = 5 * 1024 * 1024;
const ATTESA_MS = 10_000;

/** Codice del post da un link Instagram (/p/, /reel/, /reels/, /tv/), oppure null. */
export function codiceInstagram(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reels?|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

const ENTITA: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };

function decodificaHtml(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tutto, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : tutto;
    }
    return ENTITA[e.toLowerCase()] ?? tutto;
  });
}

function decodificaJson(s: string) {
  try {
    return JSON.parse(`"${s}"`) as string;
  } catch {
    return s.replace(/\\\//g, "/").replace(/\\u0026/g, "&");
  }
}

/** Cerca l'indirizzo dell'immagine nell'HTML della pagina di incorporamento. */
export function immagineDaHtml(html: string) {
  const img = html.match(/<img[^>]*class="[^"]*EmbeddedMediaImage[^"]*"[^>]*>/i)?.[0];
  const src = img?.match(/\ssrc="([^"]+)"/i)?.[1];
  if (src) return decodificaHtml(src);

  const json = html.match(/\\?"display_url\\?"\s*:\s*\\?"((?:[^"\\]|\\.)+?)\\?"/)?.[1];
  if (json) {
    // Può essere JSON dentro una stringa JSON: si decodifica finché servono.
    let url = json;
    for (let i = 0; i < 3 && url.includes("\\"); i++) url = decodificaJson(url);
    return url;
  }

  const og =
    html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1];
  if (og) return decodificaHtml(og);

  return null;
}

/**
 * Didascalia del post dalla pagina di incorporamento "con didascalia"
 * (instagram.com/p/<codice>/embed/captioned/), oppure null.
 */
export function didascaliaDaHtml(html: string) {
  // 1) Il blocco visibile: <div class="Caption"><a class="CaptionUsername">utente</a><br/>testo… <div class="CaptionComments">
  const blocco = html.match(/<div class="Caption">([\s\S]*?)(?:<div class="CaptionComments"|<\/div>)/i)?.[1];
  if (blocco) {
    const testo = decodificaHtml(
      blocco
        .replace(/<a[^>]*class="[^"]*CaptionUsername[^"]*"[^>]*>[\s\S]*?<\/a>/i, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, ""),
    );
    const pulito = pulisciDidascalia(testo);
    if (pulito) return pulito;
  }

  // 2) I dati JSON della pagina: "edge_media_to_caption":{"edges":[{"node":{"text":"…"}}]}
  const json = html.match(/\\?"edge_media_to_caption\\?"[\s\S]{0,80}?\\?"text\\?"\s*:\s*\\?"((?:[^"\\]|\\.)*?)\\?"/)?.[1];
  if (json) {
    let testo = json;
    for (let i = 0; i < 3 && testo.includes("\\"); i++) testo = decodificaJson(testo);
    const pulito = pulisciDidascalia(testo);
    if (pulito) return pulito;
  }
  return null;
}

/** Nome dell'account che ha pubblicato il post, oppure null. */
export function autoreDaHtml(html: string) {
  const nome =
    html.match(/class="[^"]*CaptionUsername[^"]*"[^>]*>([^<]+)</i)?.[1] ??
    html.match(/class="[^"]*UsernameText[^"]*"[^>]*>([^<]+)</i)?.[1];
  return nome ? decodificaHtml(nome).trim().replace(/^@/, "") || null : null;
}

function pulisciDidascalia(testo: string) {
  return testo
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((r) => r.replace(/[ \t\u00a0]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function scarica(url: string) {
  return fetch(url, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(ATTESA_MS) });
}

/** Indirizzo (temporaneo) della copertina del post, oppure null. */
export async function trovaImmagineInstagram(codice: string) {
  const r = await scarica(`https://www.instagram.com/p/${codice}/embed/`);
  if (!r.ok) return null;
  const url = immagineDaHtml(await r.text());
  return url && /^https:\/\//.test(url) ? url : null;
}

export interface PostInstagram {
  codice: string;
  /** Indirizzo temporaneo della copertina. */
  immagine: string | null;
  didascalia: string | null;
  autore: string | null;
}

/** Copertina, didascalia e autore di un post pubblico. Lancia un errore se Instagram non risponde. */
export async function leggiPostInstagram(codice: string): Promise<PostInstagram> {
  const r = await scarica(`https://www.instagram.com/p/${codice}/embed/captioned/`);
  const html = r.ok ? await r.text() : "";
  let immagine = html ? immagineDaHtml(html) : null;
  if (!immagine || !/^https:\/\//.test(immagine)) immagine = await trovaImmagineInstagram(codice).catch(() => null);
  return {
    codice,
    immagine,
    didascalia: html ? didascaliaDaHtml(html) : null,
    autore: html ? autoreDaHtml(html) : null,
  };
}

export type EsitoFoto = { ok: true; url: string } | { ok: false; motivo: string };

/**
 * Scarica la copertina del post Instagram e la salva nello Storage.
 * Restituisce l'indirizzo pubblico della copia, senza toccare la ricetta.
 */
export async function salvaFotoInstagram(db: SupabaseClient, slug: string, fonteUrl: string | null): Promise<EsitoFoto> {
  const codice = codiceInstagram(fonteUrl);
  if (!codice) return { ok: false, motivo: "La fonte non è un post Instagram." };

  try {
    const indirizzo = await trovaImmagineInstagram(codice);
    if (!indirizzo) return { ok: false, motivo: "Instagram non ha mostrato l'anteprima (post privato, rimosso o richiesta bloccata)." };
    return await salvaImmagineInstagram(db, slug, indirizzo);
  } catch (e) {
    return { ok: false, motivo: motivoErrore(e) };
  }
}

function motivoErrore(e: unknown) {
  return (e as Error).name === "TimeoutError" ? "Instagram non ha risposto in tempo." : (e as Error).message;
}

/** Scarica un'immagine di Instagram già trovata e la salva nello Storage nel formato unico. */
export async function salvaImmagineInstagram(db: SupabaseClient, slug: string, indirizzo: string): Promise<EsitoFoto> {
  try {
    const img = await scarica(indirizzo);
    const tipo = img.headers.get("content-type") ?? "";
    if (!img.ok || !tipo.startsWith("image/")) return { ok: false, motivo: "Download dell'immagine non riuscito." };
    const dati = await img.arrayBuffer();
    if (dati.byteLength > MAX_BYTE) return { ok: false, motivo: "Immagine troppo grande." };

    return { ok: true, url: (await salvaFotoOttimizzata(db, slug, dati)).url };
  } catch (e) {
    return { ok: false, motivo: motivoErrore(e) };
  }
}
