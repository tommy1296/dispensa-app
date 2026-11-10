import { Heart } from "lucide-react";
import Link from "next/link";
import { IconaTipo } from "@/components/icona-tipo";
import { SchedaRicetta } from "@/components/scheda-ricetta";
import { Button } from "@/components/ui/button";
import { ETICHETTA_TIPO, TIPI, cercaRicette, type RicettaInElenco, type Tipo } from "@/lib/ricette";
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
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Preferite</h1>
      <p className="mt-1 text-muted-foreground">
        {ricette.length === 0
          ? "Nessuna ricetta preferita, per ora."
          : ricette.length === 1
            ? "1 ricetta preferita"
            : `${ricette.length} ricette preferite`}
      </p>

      {ricette.length === 0 && (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <Heart className="size-6" />
          </span>
          <p className="mt-4 max-w-sm text-muted-foreground">
            Apri una ricetta e tocca <strong className="text-foreground">Aggiungi alle preferite</strong> per ritrovarla qui.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link href="/">Vai alle ricette</Link>
          </Button>
        </div>
      )}

      {TIPI.filter((t) => perTipo.has(t)).map((t) => (
        <section key={t} className="mt-10">
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <IconaTipo tipo={t} className="size-4" />
            </span>
            {ETICHETTA_TIPO[t]}
            <span className="text-sm font-normal text-muted-foreground">{perTipo.get(t)!.length}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {perTipo.get(t)!.map((r) => (
              <SchedaRicetta key={r.id} r={r} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
