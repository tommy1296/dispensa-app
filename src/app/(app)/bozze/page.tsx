import { ArrowLeft, FilePen, Send } from "lucide-react";
import Link from "next/link";
import { SchedaRicetta } from "@/components/scheda-ricetta";
import { Button } from "@/components/ui/button";
import { cercaRicette, type RicettaInElenco } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Bozze · Dispensa" };

export default async function Bozze() {
  const db = await supabaseServer();
  const ricette: RicettaInElenco[] = [];
  for (let offset = 0; ; offset += 100) {
    const blocco = await cercaRicette(db, { bozze: true, ordine: "recenti", limite: 100, offset });
    ricette.push(...blocco.ricette);
    if (ricette.length >= blocco.totale || blocco.ricette.length === 0) break;
  }

  return (
    <main>
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-xl text-muted-foreground">
        <Link href="/">
          <ArrowLeft /> Tutte le ricette
        </Link>
      </Button>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Bozze</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">
        Ricette salvate al volo dal bot Telegram, con didascalia e foto del post. Aprile per completarle: finché restano in bozza
        non compaiono nella ricerca né nelle proposte di Claude.
      </p>

      {ricette.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <FilePen className="size-6" />
          </span>
          <p className="mt-4 max-w-sm text-muted-foreground">
            Nessuna bozza. Da Instagram tocca <strong className="text-foreground">Condividi</strong> e manda il post al tuo bot
            Telegram: lo ritrovi qui.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Send className="size-3.5" /> Il bot si collega da Impostazioni.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">{ricette.length === 1 ? "1 bozza" : `${ricette.length} bozze`}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {ricette.map((r) => (
              <SchedaRicetta key={r.id} r={r} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
