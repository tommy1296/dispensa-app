"use server";

import { revalidatePath } from "next/cache";
import { BUCKET, percorsoNelBucket, salvaFotoOttimizzata } from "@/lib/foto";
import { aggiornaRicetta, fotoUsate, ricetteConFotoDaOttimizzare } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";

const MAX_BYTE = 25 * 1024 * 1024;
const ATTESA_MS = 15_000;
/** I file più recenti di così non si eliminano: potrebbero essere caricamenti in corso. */
const ETA_MINIMA_MS = 60 * 60 * 1000;

export type EsitoOttimizzazione = {
  riuscite: number;
  fallite: { slug: string; motivo: string }[];
  rimaste: number;
  bytePrima: number;
  byteDopo: number;
};

/**
 * Converte nel formato unico le foto di un piccolo gruppo di ricette.
 * La pagina la richiama finché ne restano, saltando quelle già fallite.
 * Le foto originali restano nello Storage finché non si fa la pulizia.
 */
export async function ottimizzaFotoLotto(giaFallite: string[]): Promise<EsitoOttimizzazione> {
  const db = await supabaseServer();
  const { ricette, totale } = await ricetteConFotoDaOttimizzare(db, { escludiSlug: giaFallite, limite: 3 });
  const esito: EsitoOttimizzazione = { riuscite: 0, fallite: [], rimaste: 0, bytePrima: 0, byteDopo: 0 };

  for (const r of ricette) {
    try {
      const risposta = await fetch(r.immagine_url, { cache: "no-store", signal: AbortSignal.timeout(ATTESA_MS) });
      if (!risposta.ok) throw new Error(`la foto non si scarica (errore ${risposta.status})`);
      const dati = await risposta.arrayBuffer();
      if (dati.byteLength > MAX_BYTE) throw new Error("foto troppo grande");
      const nuova = await salvaFotoOttimizzata(db, r.slug, dati);
      await aggiornaRicetta(db, r.slug, { immagine_url: nuova.url });
      esito.riuscite++;
      esito.bytePrima += dati.byteLength;
      esito.byteDopo += nuova.byte;
    } catch (e) {
      const errore = e as Error;
      esito.fallite.push({ slug: r.slug, motivo: errore.name === "TimeoutError" ? "il download non ha risposto in tempo" : errore.message });
    }
  }

  esito.rimaste = Math.max(totale - ricette.length, 0);
  if (esito.riuscite) revalidatePath("/", "layout");
  return esito;
}

type FileBucket = { percorso: string; byte: number; creato: number };

async function elencaBucket(db: Awaited<ReturnType<typeof supabaseServer>>, cartella = ""): Promise<FileBucket[]> {
  const file: FileBucket[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from(BUCKET).list(cartella, { limit: 1000, offset });
    if (error) throw new Error(`Elenco delle foto non riuscito: ${error.message}`);
    for (const voce of data ?? []) {
      const percorso = cartella ? `${cartella}/${voce.name}` : voce.name;
      if (voce.id === null) file.push(...(await elencaBucket(db, percorso)));
      else if (voce.name !== ".emptyFolderPlaceholder")
        file.push({
          percorso,
          byte: Number(voce.metadata?.size ?? 0),
          creato: Date.parse(voce.created_at ?? "") || Date.now(),
        });
    }
    if ((data ?? []).length < 1000) break;
  }
  return file;
}

/** File del bucket che nessuna ricetta usa più (gli originali sostituiti, le foto rimosse…). */
async function fileInutilizzati(db: Awaited<ReturnType<typeof supabaseServer>>) {
  const usati = new Set((await fotoUsate(db)).map(percorsoNelBucket).filter(Boolean));
  const tutti = await elencaBucket(db);
  if (tutti.length === 0 && usati.size > 0) {
    throw new Error("Non riesco a vedere i file del bucket: riesegui supabase/schema.sql nell'SQL Editor di Supabase.");
  }
  const limite = Date.now() - ETA_MINIMA_MS;
  return tutti.filter((f) => !usati.has(f.percorso) && f.creato < limite);
}

export type EsitoPulizia = { file: number; byte: number };

/** Conta i file inutilizzati, senza eliminarli. */
export async function contaFotoInutilizzate(): Promise<EsitoPulizia> {
  const db = await supabaseServer();
  const file = await fileInutilizzati(db);
  return { file: file.length, byte: file.reduce((a, f) => a + f.byte, 0) };
}

/** Elimina definitivamente i file che nessuna ricetta usa più. */
export async function eliminaFotoInutilizzate(): Promise<EsitoPulizia> {
  const db = await supabaseServer();
  const file = await fileInutilizzati(db);
  for (let i = 0; i < file.length; i += 100) {
    const gruppo = file.slice(i, i + 100);
    const { error } = await db.storage.from(BUCKET).remove(gruppo.map((f) => f.percorso));
    if (error) throw new Error(`Eliminazione non riuscita: ${error.message}`);
  }
  return { file: file.length, byte: file.reduce((a, f) => a + f.byte, 0) };
}
