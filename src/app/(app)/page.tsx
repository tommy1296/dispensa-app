import Link from "next/link";
import { SchedaRicetta } from "@/components/scheda-ricetta";
import {
  ETICHETTA_TIPO,
  PROTEINE,
  TEMPI,
  TIPI,
  cercaRicette,
  contaPerTipo,
  type Proteina,
  type Tempo,
  type Tipo,
} from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";

const PER_PAGINA = 24;

type Parametri = Record<string, string | string[] | undefined>;

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function link(sp: Parametri, modifiche: Record<string, string | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const valore = uno(v);
    if (valore && k !== "pagina") u.set(k, valore);
  }
  for (const [k, v] of Object.entries(modifiche)) {
    if (v === null || v === "") u.delete(k);
    else u.set(k, v);
  }
  const s = u.toString();
  return s ? `/?${s}` : "/";
}

export default async function Elenco({ searchParams }: PageProps<"/">) {
  const sp = (await searchParams) as Parametri;
  const tipo = uno(sp.tipo) as Tipo | "";
  const proteina = uno(sp.proteina) as Proteina | "";
  const tempo = uno(sp.tempo) as Tempo | "";
  const testo = uno(sp.q);
  const pagina = Math.max(1, Number(uno(sp.pagina)) || 1);
  const si = (k: string) => uno(sp[k]) === "1";

  const db = await supabaseServer();
  const [{ ricette, totale }, conteggi] = await Promise.all([
    cercaRicette(db, {
      testo,
      tipi: TIPI.includes(tipo as Tipo) ? [tipo as Tipo] : undefined,
      proteine: PROTEINE.includes(proteina as Proteina) ? [proteina as Proteina] : undefined,
      tempi: TEMPI.includes(tempo as Tempo) ? [tempo as Tempo] : undefined,
      adattaAsporto: si("asporto") ? true : undefined,
      pastoCompleto: si("completo") ? true : undefined,
      vegana: si("vegana"),
      vegetariana: si("vegetariana"),
      senzaGlutine: si("sg"),
      ordine: uno(sp.ordine) === "recenti" ? "recenti" : "titolo",
      limite: PER_PAGINA,
      offset: (pagina - 1) * PER_PAGINA,
    }),
    contaPerTipo(db),
  ]);
  const tutte = Object.values(conteggi).reduce((a, b) => a + (b ?? 0), 0);
  const pagine = Math.max(1, Math.ceil(totale / PER_PAGINA));
  const filtriAttivi = [proteina, tempo, ...["asporto", "completo", "vegana", "vegetariana", "sg"].filter(si)].filter(
    Boolean,
  ).length;

  return (
    <main>
      <form action="/" className="flex gap-2">
        {Object.entries(sp)
          .filter(([k]) => !["q", "pagina"].includes(k))
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={uno(v)} />
          ))}
        <input
          name="q"
          defaultValue={testo}
          placeholder="Cerca per nome o ingrediente: zucca, ceci, tofu…"
          className="campo flex-1 py-2.5"
          type="search"
        />
        <button className="bottone-primario">Cerca</button>
      </form>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={link(sp, { tipo: null })} className={`chip shrink-0 px-3 py-1 text-sm ${!tipo ? "chip-attivo" : ""}`}>
          Tutte · {tutte}
        </Link>
        {TIPI.filter((t) => conteggi[t]).map((t) => (
          <Link
            key={t}
            href={link(sp, { tipo: t })}
            className={`chip shrink-0 px-3 py-1 text-sm ${tipo === t ? "chip-attivo" : ""}`}
          >
            {ETICHETTA_TIPO[t]} · {conteggi[t]}
          </Link>
        ))}
      </div>

      <details className="scheda mt-3 p-3" open={filtriAttivi > 0}>
        <summary className="cursor-pointer text-sm font-medium">
          Filtri{filtriAttivi > 0 && <span className="chip chip-attivo ml-2">{filtriAttivi}</span>}
        </summary>
        <form action="/" className="mt-3 grid gap-3 sm:grid-cols-4">
          {testo && <input type="hidden" name="q" value={testo} />}
          {tipo && <input type="hidden" name="tipo" value={tipo} />}
          <label>
            <span className="etichetta">Proteina</span>
            <select name="proteina" defaultValue={proteina} className="campo">
              <option value="">Tutte</option>
              {PROTEINE.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="etichetta">Tempo</span>
            <select name="tempo" defaultValue={tempo} className="campo">
              <option value="">Qualsiasi</option>
              {TEMPI.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="etichetta">Ordine</span>
            <select name="ordine" defaultValue={uno(sp.ordine)} className="campo">
              <option value="">Alfabetico</option>
              <option value="recenti">Aggiunte di recente</option>
            </select>
          </label>
          <div className="flex flex-wrap content-end gap-x-4 gap-y-2 text-sm sm:col-span-4">
            {[
              ["asporto", "🧊 Da asporto"],
              ["completo", "Pasto completo"],
              ["vegana", "🌱 Vegana"],
              ["vegetariana", "Vegetariana"],
              ["sg", "Senza glutine"],
            ].map(([k, nome]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input type="checkbox" name={k} value="1" defaultChecked={si(k)} className="accent-accento" />
                {nome}
              </label>
            ))}
          </div>
          <div className="flex gap-2 sm:col-span-4">
            <button className="bottone-primario">Applica</button>
            <Link href={link({}, { tipo: tipo || null, q: testo || null })} className="bottone-secondario">
              Azzera
            </Link>
          </div>
        </form>
      </details>

      <p className="mt-5 text-sm text-testo-tenue">
        {totale === 0 ? "Nessuna ricetta trovata." : totale === 1 ? "1 ricetta" : `${totale} ricette`}
        {testo && <> per «{testo}»</>}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {ricette.map((r) => (
          <SchedaRicetta key={r.id} r={r} />
        ))}
      </div>

      {pagine > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && (
            <Link className="bottone-secondario" href={link(sp, { pagina: String(pagina - 1) })}>
              ← Indietro
            </Link>
          )}
          <span className="text-testo-tenue">
            Pagina {pagina} di {pagine}
          </span>
          {pagina < pagine && (
            <Link className="bottone-secondario" href={link(sp, { pagina: String(pagina + 1) })}>
              Avanti →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
