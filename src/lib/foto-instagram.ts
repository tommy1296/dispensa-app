import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Recupera la copertina di un post o reel pubblico di Instagram e ne salva una
// copia nel bucket "foto-ricette". Gli indirizzi delle immagini di Instagram
// scadono dopo qualche giorno, quindi non si possono salvare così come sono.
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

function decodificaHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
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

    const img = await scarica(indirizzo);
    const tipo = img.headers.get("content-type") ?? "";
    if (!img.ok || !tipo.startsWith("image/")) return { ok: false, motivo: "Download dell'immagine non riuscito." };
    const dati = await img.arrayBuffer();
    if (dati.byteLength > MAX_BYTE) return { ok: false, motivo: "Immagine troppo grande." };

    const estensione = tipo.includes("png") ? "png" : tipo.includes("webp") ? "webp" : "jpg";
    const percorso = `instagram/${slug}-${Date.now()}.${estensione}`;
    const { error } = await db.storage.from("foto-ricette").upload(percorso, dati, { contentType: tipo, upsert: true });
    if (error) return { ok: false, motivo: `Salvataggio non riuscito: ${error.message}` };
    return { ok: true, url: db.storage.from("foto-ricette").getPublicUrl(percorso).data.publicUrl };
  } catch (e) {
    const nome = (e as Error).name;
    return { ok: false, motivo: nome === "TimeoutError" ? "Instagram non ha risposto in tempo." : (e as Error).message };
  }
}
