"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  PROTEINE,
  SENZA_GLUTINE,
  TEMPI,
  TIPI,
  aggiornaRicetta,
  creaRicetta,
  eliminaRicetta,
  leggiRicetta,
  type DatiRicetta,
  type Proteina,
  type SenzaGlutine,
  type Tempo,
  type Tipo,
} from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";

export type StatoForm = { errore?: string } | undefined;

const TRE_STATI = (v: FormDataEntryValue | null) => (v === "si" ? true : v === "no" ? false : null);
const testoONull = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s || null;
};

async function caricaFoto(db: Awaited<ReturnType<typeof supabaseServer>>, foto: File, slug: string) {
  const estensione = (foto.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const percorso = `${slug}-${Date.now()}.${estensione}`;
  const { error } = await db.storage.from("foto-ricette").upload(percorso, foto, {
    contentType: foto.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(`Caricamento foto non riuscito: ${error.message}`);
  return db.storage.from("foto-ricette").getPublicUrl(percorso).data.publicUrl;
}

function leggiForm(form: FormData): DatiRicetta & { titolo: string; tipo: Tipo } {
  const tipo = String(form.get("tipo")) as Tipo;
  const proteina = String(form.get("proteina") ?? "");
  const tempo = String(form.get("tempo") ?? "");
  const sg = String(form.get("senza_glutine") ?? "no");
  return {
    titolo: String(form.get("titolo") ?? "").trim(),
    tipo: TIPI.includes(tipo) ? tipo : "pasto",
    proteina: PROTEINE.includes(proteina as Proteina) ? (proteina as Proteina) : null,
    ha_proteina: TRE_STATI(form.get("ha_proteina")),
    ha_carboidrato: TRE_STATI(form.get("ha_carboidrato")),
    ha_verdura: TRE_STATI(form.get("ha_verdura")),
    adatta_asporto: TRE_STATI(form.get("adatta_asporto")),
    tempo: TEMPI.includes(tempo as Tempo) ? (tempo as Tempo) : null,
    vegana: form.get("vegana") === "on",
    vegetariana: form.get("vegetariana") === "on" || form.get("vegana") === "on",
    senza_glutine: SENZA_GLUTINE.includes(sg as SenzaGlutine) ? (sg as SenzaGlutine) : "no",
    scheda_parziale: form.get("scheda_parziale") === "on",
    preferita: form.get("preferita") === "on",
    ingredienti: String(form.get("ingredienti") ?? "")
      .split("\n")
      .map((r) => r.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean),
    procedimento: testoONull(form.get("procedimento")),
    note: testoONull(form.get("note")),
    fonte_url: testoONull(form.get("fonte_url")),
    fonte_tipo: testoONull(form.get("fonte_url"))?.includes("instagram.com") ? "instagram" : testoONull(form.get("fonte_url")) ? "web" : null,
  };
}

export async function salvaRicetta(_stato: StatoForm, form: FormData): Promise<StatoForm> {
  const db = await supabaseServer();
  const dati = leggiForm(form);
  if (dati.titolo.length < 2) return { errore: "Il titolo è obbligatorio." };
  const slugEsistente = String(form.get("slug") ?? "");
  let slug = slugEsistente;

  try {
    if (slugEsistente) {
      // Chi modifica a mano conferma le etichette.
      const r = await aggiornaRicetta(db, slugEsistente, { ...dati, etichette_stimate: false });
      if (!r) return { errore: "Ricetta non trovata." };
    } else {
      slug = (await creaRicetta(db, dati)).slug;
    }

    const foto = form.get("foto");
    if (foto instanceof File && foto.size > 0) {
      if (foto.size > 5 * 1024 * 1024) return { errore: "La foto supera i 5 MB." };
      await aggiornaRicetta(db, slug, { immagine_url: await caricaFoto(db, foto, slug) });
    } else if (form.get("rimuovi_foto") === "on") {
      await aggiornaRicetta(db, slug, { immagine_url: null });
    }
  } catch (e) {
    return { errore: (e as Error).message };
  }

  revalidatePath("/", "layout");
  redirect(`/ricette/${slug}`);
}

export async function cancellaRicetta(form: FormData) {
  const db = await supabaseServer();
  await eliminaRicetta(db, String(form.get("slug")));
  revalidatePath("/", "layout");
  redirect("/");
}

export async function invertiPreferita(form: FormData) {
  const db = await supabaseServer();
  const slug = String(form.get("slug"));
  const r = await leggiRicetta(db, slug);
  if (r) await aggiornaRicetta(db, slug, { preferita: !r.preferita });
  revalidatePath(`/ricette/${slug}`);
  revalidatePath("/preferiti");
}
