import Link from "next/link";
import { notFound } from "next/navigation";
import { Copertina } from "@/components/copertina";
import { Componenti } from "@/components/etichette";
import { TestoSemplice } from "@/components/testo-semplice";
import { ETICHETTA_TIPO, leggiRicetta } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";
import { cancellaRicetta, invertiPreferita } from "../actions";

export async function generateMetadata({ params }: PageProps<"/ricette/[slug]">) {
  const { slug } = await params;
  const r = await leggiRicetta(await supabaseServer(), slug);
  return { title: r ? `${r.titolo} · Dispensa` : "Dispensa" };
}

export default async function PaginaRicetta({ params }: PageProps<"/ricette/[slug]">) {
  const { slug } = await params;
  const r = await leggiRicetta(await supabaseServer(), slug);
  if (!r) notFound();

  const glutine = { si: "Senza glutine", no: null, da_verificare: "Glutine da verificare" }[r.senza_glutine];

  return (
    <main className="mx-auto max-w-4xl">
      <Link href="/" className="text-sm text-testo-tenue hover:text-accento">
        ← Tutte le ricette
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-[2fr_3fr]">
        <div className="scheda aspect-[4/3] overflow-hidden md:aspect-square">
          <Copertina tipo={r.tipo} immagine={r.immagine_url} titolo={r.titolo} grande />
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-accento">{ETICHETTA_TIPO[r.tipo]}</p>
          <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold sm:text-4xl">{r.titolo}</h1>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {r.tipo === "pasto" && <Componenti r={r} />}
            {r.proteina && <span className="chip">Proteina: {r.proteina}</span>}
            {r.tempo && <span className="chip">⏱ {r.tempo}</span>}
            {r.adatta_asporto && <span className="chip">🧊 da asporto</span>}
            {r.vegana ? <span className="chip">🌱 vegana</span> : r.vegetariana && <span className="chip">vegetariana</span>}
            {glutine && <span className="chip">{glutine}</span>}
          </div>

          {(r.scheda_parziale || r.etichette_stimate) && (
            <div className="mt-4 space-y-1 rounded-xl bg-accento-tenue p-3 text-sm">
              {r.scheda_parziale && <p>Scheda incompleta: per dosi o passaggi mancanti guarda la fonte.</p>}
              {r.etichette_stimate && <p className="text-testo-tenue">Etichette stimate automaticamente: controllale e salva per confermarle.</p>}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {r.fonte_url && (
              <a href={r.fonte_url} target="_blank" rel="noopener noreferrer" className="bottone-primario">
                Apri la fonte ↗
              </a>
            )}
            <Link href={`/ricette/${r.slug}/modifica`} className="bottone-secondario">
              Modifica
            </Link>
            <form action={invertiPreferita}>
              <input type="hidden" name="slug" value={r.slug} />
              <button className="bottone-secondario" title={r.preferita ? "Togli dalle preferite" : "Aggiungi alle preferite"}>
                {r.preferita ? "★ Preferita" : "☆ Preferita"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[2fr_3fr]">
        <section className="scheda p-5">
          <h2 className="font-serif text-xl font-semibold">Ingredienti</h2>
          {r.ingredienti.length ? (
            <ul className="mt-3 space-y-2">
              {r.ingredienti.map((i, n) => (
                <li key={n} className="flex gap-2">
                  <span className="text-accento">•</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-testo-tenue">Non indicati.</p>
          )}
        </section>

        <section className="scheda p-5">
          <h2 className="font-serif text-xl font-semibold">Procedimento</h2>
          <div className="mt-3">
            {r.procedimento ? <TestoSemplice testo={r.procedimento} /> : <p className="text-testo-tenue">Non indicato.</p>}
          </div>
          {r.note && (
            <div className="mt-5 border-t border-bordo pt-4 text-sm text-testo-tenue">
              <h3 className="mb-1 font-medium text-testo">Note</h3>
              <TestoSemplice testo={r.note} />
            </div>
          )}
        </section>
      </div>

      <details className="mt-10 text-sm">
        <summary className="cursor-pointer text-testo-tenue">Elimina ricetta</summary>
        <form action={cancellaRicetta} className="mt-3 flex items-center gap-3">
          <input type="hidden" name="slug" value={r.slug} />
          <span>L&apos;eliminazione è definitiva.</span>
          <button className="rounded-xl bg-red-700 px-3 py-1.5 font-medium text-white hover:bg-red-800">Elimina</button>
        </form>
      </details>
    </main>
  );
}
