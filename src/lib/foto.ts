import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Tutte le foto delle ricette hanno lo stesso formato: WebP 4:3 da 1200×900,
// come le schede in home. Il ritaglio segue il punto più interessante della
// foto (di solito il piatto) invece di tagliare sempre al centro.

export const BUCKET = "foto-ricette";
/** Cartella delle foto già nel formato unico. */
export const CARTELLA_OTTIMIZZATE = "ottimizzate";
export const LARGHEZZA = 1200;
export const ALTEZZA = 900;
const QUALITA = 78;

/** Converte una foto qualsiasi (JPG, PNG, HEIC, WebP…) nel formato unico. */
export async function ottimizzaFoto(dati: ArrayBuffer | Buffer) {
  return sharp(Buffer.isBuffer(dati) ? dati : Buffer.from(dati), { failOn: "none" })
    .rotate() // raddrizza le foto del telefono secondo i dati EXIF
    .resize(LARGHEZZA, ALTEZZA, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: QUALITA, effort: 4 })
    .toBuffer();
}

/** Converte la foto, la salva nello Storage e ne restituisce l'indirizzo pubblico. */
export async function salvaFotoOttimizzata(db: SupabaseClient, slug: string, dati: ArrayBuffer | Buffer) {
  const webp = await ottimizzaFoto(dati);
  const percorso = `${CARTELLA_OTTIMIZZATE}/${slug}-${Date.now()}.webp`;
  const { error } = await db.storage.from(BUCKET).upload(percorso, webp, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(`Salvataggio della foto non riuscito: ${error.message}`);
  return { url: db.storage.from(BUCKET).getPublicUrl(percorso).data.publicUrl, byte: webp.byteLength };
}

/** Percorso dentro il bucket a partire dall'indirizzo pubblico, oppure null se la foto sta altrove. */
export function percorsoNelBucket(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(new RegExp(`/storage/v1/object/public/${BUCKET}/([^?#]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** True se la foto è già nel formato unico. */
export function eOttimizzata(url: string | null | undefined) {
  return percorsoNelBucket(url)?.startsWith(`${CARTELLA_OTTIMIZZATE}/`) ?? false;
}
