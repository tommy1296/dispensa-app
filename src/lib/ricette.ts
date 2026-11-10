import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Valori ammessi (gli stessi dei vincoli in supabase/schema.sql)
// ---------------------------------------------------------------------------
export const TIPI = ["pasto", "colazione", "dolce", "spuntino", "salsa", "pane"] as const;
export const PROTEINE = [
  "legumi",
  "latticini",
  "tofu",
  "pesce",
  "uova",
  "carne bianca",
  "carne rossa o affettati",
  "frutta secca",
  "nessuna",
] as const;
export const TEMPI = ["veloce", "medio", "lungo"] as const;
export const SENZA_GLUTINE = ["si", "no", "da_verificare"] as const;
export const PASTI = ["colazione", "pranzo", "cena"] as const;

export type Tipo = (typeof TIPI)[number];
export type Proteina = (typeof PROTEINE)[number];
export type Tempo = (typeof TEMPI)[number];
export type SenzaGlutine = (typeof SENZA_GLUTINE)[number];
export type Pasto = (typeof PASTI)[number];

export const ETICHETTA_TIPO: Record<Tipo, string> = {
  pasto: "Pranzo e cena",
  colazione: "Colazione",
  dolce: "Dolce",
  spuntino: "Spuntino",
  salsa: "Salsa",
  pane: "Pane",
};

export const EMOJI_TIPO: Record<Tipo, string> = {
  pasto: "🍲",
  colazione: "🥣",
  dolce: "🍰",
  spuntino: "🥨",
  salsa: "🥫",
  pane: "🍞",
};

export interface Ricetta {
  id: number;
  slug: string;
  titolo: string;
  tipo: Tipo;
  proteina: Proteina | null;
  ha_proteina: boolean | null;
  ha_carboidrato: boolean | null;
  ha_verdura: boolean | null;
  pasto_completo: boolean;
  adatta_asporto: boolean | null;
  tempo: Tempo | null;
  vegana: boolean;
  vegetariana: boolean;
  senza_glutine: SenzaGlutine;
  scheda_parziale: boolean;
  etichette_stimate: boolean;
  ingredienti: string[];
  procedimento: string | null;
  note: string | null;
  fonte_tipo: string | null;
  fonte_url: string | null;
  fonte_post: number | null;
  immagine_url: string | null;
  preferita: boolean;
  creata_il: string;
  modificata_il: string;
}

/** Campi che si possono scrivere (gli altri li calcola il database). */
export type DatiRicetta = Partial<
  Omit<Ricetta, "id" | "slug" | "pasto_completo" | "creata_il" | "modificata_il">
>;

export interface VoceStorico {
  id: number;
  data: string;
  pasto: Pasto;
  ricetta_id: number | null;
  piatto: string;
  proteina: string | null;
  carboidrato: string | null;
  verdura: string | null;
  note: string | null;
  ricette?: { slug: string; titolo: string; proteina: Proteina | null } | null;
}

const COLONNE_RICETTA =
  "id, slug, titolo, tipo, proteina, ha_proteina, ha_carboidrato, ha_verdura, pasto_completo, adatta_asporto, tempo, vegana, vegetariana, senza_glutine, scheda_parziale, etichette_stimate, ingredienti, procedimento, note, fonte_tipo, fonte_url, fonte_post, immagine_url, preferita, creata_il, modificata_il";

const COLONNE_ELENCO =
  "id, slug, titolo, tipo, proteina, ha_proteina, ha_carboidrato, ha_verdura, pasto_completo, adatta_asporto, tempo, vegana, vegetariana, senza_glutine, scheda_parziale, immagine_url, preferita, fonte_url";

export type RicettaInElenco = Pick<
  Ricetta,
  | "id"
  | "slug"
  | "titolo"
  | "tipo"
  | "proteina"
  | "ha_proteina"
  | "ha_carboidrato"
  | "ha_verdura"
  | "pasto_completo"
  | "adatta_asporto"
  | "tempo"
  | "vegana"
  | "vegetariana"
  | "senza_glutine"
  | "scheda_parziale"
  | "immagine_url"
  | "preferita"
  | "fonte_url"
>;

// ---------------------------------------------------------------------------
// Utilità
// ---------------------------------------------------------------------------

/** Minuscolo e senza accenti, come nel database. */
export function normalizza(testo: string) {
  return testo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function slugDa(titolo: string) {
  return (
    normalizza(titolo)
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "ricetta"
  );
}

/** Rende sicuro un valore dentro un filtro PostgREST `ilike`. */
function perIlike(valore: string) {
  return normalizza(valore).replace(/[%_,()*\\]/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Ricerca
// ---------------------------------------------------------------------------

export interface FiltriRicerca {
  testo?: string;
  tipi?: Tipo[];
  proteine?: Proteina[];
  escludiProteine?: Proteina[];
  tempi?: Tempo[];
  adattaAsporto?: boolean;
  pastoCompleto?: boolean;
  vegana?: boolean;
  vegetariana?: boolean;
  senzaGlutine?: boolean;
  preferita?: boolean;
  ingredienti?: string[];
  escludiIngredienti?: string[];
  escludiSlug?: string[];
  ordine?: "titolo" | "recenti";
  limite?: number;
  offset?: number;
}

export async function cercaRicette(db: SupabaseClient, f: FiltriRicerca) {
  const limite = Math.min(Math.max(f.limite ?? 24, 1), 100);
  const offset = Math.max(f.offset ?? 0, 0);

  const costruisci = (modoTesto: "fts" | "titolo" | "nessuno") => {
    let q = db.from("ricette").select(COLONNE_ELENCO, { count: "exact" });

    const testo = f.testo?.trim();
    if (testo && modoTesto === "fts") {
      q = q.textSearch("ricerca", normalizza(testo), { config: "italian", type: "websearch" });
    } else if (testo && modoTesto === "titolo") {
      const t = perIlike(testo);
      q = q.or(`titolo.ilike.*${t}*,ingredienti_testo.ilike.*${t}*`);
    }

    if (f.tipi?.length) q = q.in("tipo", f.tipi);
    if (f.proteine?.length) q = q.in("proteina", f.proteine);
    if (f.escludiProteine?.length)
      q = q.or(`proteina.is.null,proteina.not.in.(${f.escludiProteine.map((p) => `"${p}"`).join(",")})`);
    if (f.tempi?.length) q = q.in("tempo", f.tempi);
    if (f.adattaAsporto !== undefined) q = q.eq("adatta_asporto", f.adattaAsporto);
    if (f.pastoCompleto !== undefined) q = q.eq("pasto_completo", f.pastoCompleto);
    if (f.vegana) q = q.eq("vegana", true);
    if (f.vegetariana) q = q.eq("vegetariana", true);
    if (f.senzaGlutine) q = q.eq("senza_glutine", "si");
    if (f.preferita) q = q.eq("preferita", true);
    for (const ing of f.ingredienti ?? []) {
      const t = perIlike(ing);
      if (t) q = q.ilike("ingredienti_testo", `%${t}%`);
    }
    for (const ing of f.escludiIngredienti ?? []) {
      const t = perIlike(ing);
      if (t) q = q.not("ingredienti_testo", "ilike", `%${t}%`);
    }
    if (f.escludiSlug?.length) q = q.not("slug", "in", `(${f.escludiSlug.map((s) => `"${s}"`).join(",")})`);

    q =
      f.ordine === "recenti"
        ? q.order("creata_il", { ascending: false }).order("id", { ascending: false })
        : q.order("titolo", { ascending: true });
    return q.range(offset, offset + limite - 1);
  };

  let risultato = await costruisci(f.testo?.trim() ? "fts" : "nessuno");
  // La ricerca a parole intere non trova le parole a metà ("zucc"): riprova sul titolo.
  if (!risultato.error && f.testo?.trim() && (risultato.count ?? 0) === 0) {
    risultato = await costruisci("titolo");
  }
  if (risultato.error) throw new Error(risultato.error.message);
  return {
    ricette: (risultato.data ?? []) as RicettaInElenco[],
    totale: risultato.count ?? 0,
    limite,
    offset,
  };
}

// ---------------------------------------------------------------------------
// Singola ricetta
// ---------------------------------------------------------------------------

export async function leggiRicetta(db: SupabaseClient, slug: string) {
  const { data, error } = await db.from("ricette").select(COLONNE_RICETTA).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Ricetta | null;
}

async function slugLibero(db: SupabaseClient, titolo: string) {
  const base = slugDa(titolo);
  const { data, error } = await db.from("ricette").select("slug").like("slug", `${base}%`);
  if (error) throw new Error(error.message);
  const usati = new Set((data ?? []).map((r) => r.slug));
  if (!usati.has(base)) return base;
  let n = 2;
  while (usati.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function creaRicetta(db: SupabaseClient, dati: DatiRicetta & { titolo: string; tipo: Tipo }) {
  const slug = await slugLibero(db, dati.titolo);
  const { data, error } = await db
    .from("ricette")
    .insert({ ...dati, slug })
    .select(COLONNE_RICETTA)
    .single();
  if (error) throw new Error(error.message);
  return data as Ricetta;
}

export async function aggiornaRicetta(db: SupabaseClient, slug: string, dati: DatiRicetta) {
  const { data, error } = await db
    .from("ricette")
    .update(dati)
    .eq("slug", slug)
    .select(COLONNE_RICETTA)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Ricetta | null;
}

export async function eliminaRicetta(db: SupabaseClient, slug: string) {
  const { error } = await db.from("ricette").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function contaPerTipo(db: SupabaseClient) {
  const conteggi: Partial<Record<Tipo, number>> = {};
  await Promise.all(
    TIPI.map(async (tipo) => {
      const { count } = await db.from("ricette").select("id", { count: "exact", head: true }).eq("tipo", tipo);
      conteggi[tipo] = count ?? 0;
    }),
  );
  return conteggi;
}

// ---------------------------------------------------------------------------
// Storico pasti
// ---------------------------------------------------------------------------

export async function leggiStorico(db: SupabaseClient, opzioni: { dal?: string; limite?: number } = {}) {
  let q = db
    .from("storico_pasti")
    .select("id, data, pasto, ricetta_id, piatto, proteina, carboidrato, verdura, note, ricette(slug, titolo, proteina)")
    .order("data", { ascending: false })
    .order("id", { ascending: false })
    .limit(opzioni.limite ?? 200);
  if (opzioni.dal) q = q.gte("data", opzioni.dal);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as VoceStorico[];
}

export async function registraPasto(
  db: SupabaseClient,
  voce: {
    data: string;
    pasto: Pasto;
    slug?: string | null;
    piatto?: string | null;
    proteina?: string | null;
    carboidrato?: string | null;
    verdura?: string | null;
    note?: string | null;
  },
) {
  let ricetta: Ricetta | null = null;
  if (voce.slug) {
    ricetta = await leggiRicetta(db, voce.slug);
    if (!ricetta) throw new Error(`Nessuna ricetta con slug "${voce.slug}"`);
  }
  const piatto = voce.piatto?.trim() || ricetta?.titolo;
  if (!piatto) throw new Error("Serve il nome del piatto oppure lo slug di una ricetta");
  const { data, error } = await db
    .from("storico_pasti")
    .insert({
      data: voce.data,
      pasto: voce.pasto,
      ricetta_id: ricetta?.id ?? null,
      piatto,
      proteina: voce.proteina?.trim() || ricetta?.proteina || null,
      carboidrato: voce.carboidrato?.trim() || null,
      verdura: voce.verdura?.trim() || null,
      note: voce.note?.trim() || null,
    })
    .select("id, data, pasto, piatto")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function eliminaPasto(db: SupabaseClient, id: number) {
  const { error } = await db.from("storico_pasti").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Vero se il pasto conta come carne rossa o affettati. */
export function eCarneRossa(v: VoceStorico) {
  const testo = normalizza(`${v.proteina ?? ""} ${v.ricette?.proteina ?? ""}`);
  return /carne rossa|affettat|salum|prosciutt|speck|manzo|maiale|vitello|salsicc/.test(testo);
}

// ---------------------------------------------------------------------------
// Foto da Instagram
// ---------------------------------------------------------------------------

/** Ricette senza foto con un link Instagram come fonte (per prendere la copertina). */
export async function ricetteSenzaFotoInstagram(db: SupabaseClient, f: { escludiSlug?: string[]; limite?: number } = {}) {
  let q = db
    .from("ricette")
    .select("slug, fonte_url", { count: "exact" })
    .is("immagine_url", null)
    .ilike("fonte_url", "%instagram.com%")
    .order("id", { ascending: true });
  if (f.escludiSlug?.length) q = q.not("slug", "in", `(${f.escludiSlug.map((s) => `"${s}"`).join(",")})`);
  const { data, error, count } = await q.limit(f.limite ?? 10);
  if (error) throw new Error(error.message);
  return { ricette: (data ?? []) as { slug: string; fonte_url: string }[], totale: count ?? 0 };
}

/** Ricette con una foto non ancora nel formato unico (cartella "ottimizzate" del bucket). */
export async function ricetteConFotoDaOttimizzare(db: SupabaseClient, f: { escludiSlug?: string[]; limite?: number } = {}) {
  let q = db
    .from("ricette")
    .select("slug, immagine_url", { count: "exact" })
    .ilike("immagine_url", "http%")
    .not("immagine_url", "ilike", "%/foto-ricette/ottimizzate/%")
    .order("id", { ascending: true });
  if (f.escludiSlug?.length) q = q.not("slug", "in", `(${f.escludiSlug.map((s) => `"${s}"`).join(",")})`);
  const { data, error, count } = await q.limit(f.limite ?? 10);
  if (error) throw new Error(error.message);
  return { ricette: (data ?? []) as { slug: string; immagine_url: string }[], totale: count ?? 0 };
}

/** Indirizzi di tutte le foto usate dalle ricette. */
export async function fotoUsate(db: SupabaseClient) {
  const { data, error } = await db.from("ricette").select("immagine_url").not("immagine_url", "is", null).limit(10000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.immagine_url as string);
}
