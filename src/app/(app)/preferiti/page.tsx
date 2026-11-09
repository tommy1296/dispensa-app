import Link from "next/link";
import { SchedaRicetta } from "@/components/scheda-ricetta";
import { EMOJI_TIPO, ETICHETTA_TIPO, TIPI, cercaRicette, type RicettaInElenco, type Tipo } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Preferite · Dispensa" };

export default async function Preferite() {
  const db = await supabaseServer();
  const ricette: RicettaInElenco[] = [];
  // Le preferite sono poche, ma leggile tutte a blocchi da 100 (il massimo per richiesta).
  for (let offset = 0; ; offset += 100) {
    const blocco = await cercaRicette(db, { preferita: true, limite: 100, offset });
    ricette.push(...blocco.ricette);
    if (ricette.length >= blocco.totale || blocco.ricette.length === 0) break;
  }

  const perTipo = new Map<Tipo, RicettaInElenco[]>();
  for (const r of ricette) perTipo.set(r.tipo, [...(perTipo.get(r.tipo) ?? []), r]);

  return (
    <main>
      <h1 className="font-serif text-3xl font-semibold">Preferite</h1>
      <p className="mt-1 text-testo-tenue">
        {ricette.length === 0
          ? "Nessuna ricetta preferita."
          : ricette.length === 1
            ? "1 ricetta preferita"
            : `${ricette.length} ricette preferite`}
      </p>

      {ricette.length === 0 && (
        <p className="mt-6 text-testo-tenue">
          Apri una ricetta e tocca <strong>☆ Preferita</strong> per ritrovarla qui.{" "}
          <Link href="/" className="text-accento hover:underline">
            Vai alle ricette
          </Link>
        </p>
      )}

      {TIPI.filter((t) => perTipo.has(t)).map((t) => (
        <section key={t} className="mt-8">
          <h2 className="mb-3 text-lg font-medium">
            <span aria-hidden>{EMOJI_TIPO[t]}</span> {ETICHETTA_TIPO[t]}{" "}
            <span className="text-sm text-testo-tenue">· {perTipo.get(t)!.length}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {perTipo.get(t)!.map((r) => (
              <SchedaRicetta key={r.id} r={r} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
