import { Beef, CalendarPlus, X } from "lucide-react";
import Link from "next/link";
import { FormPasto } from "@/components/form-pasto";
import { STILE_PASTO } from "@/components/icona-pasto";
import { Button } from "@/components/ui/button";
import { eCarneRossa, leggiStorico } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { togliPasto } from "./actions";

export const metadata = { title: "Storico pasti · Dispensa" };

const formatoData = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const ORDINE_PASTO = { colazione: 0, pranzo: 1, cena: 2 };
const OBIETTIVO_CARNE_ROSSA = 2;

export default async function Storico() {
  const db = await supabaseServer();
  const oggi = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const [voci, { data: titoli }] = await Promise.all([
    leggiStorico(db, { limite: 300 }),
    db.from("ricette").select("titolo").order("titolo"),
  ]);
  const meseCorrente = oggi.slice(0, 7);
  const carneRossa = voci.filter((v) => v.data.startsWith(meseCorrente) && eCarneRossa(v)).length;
  const oltre = carneRossa >= OBIETTIVO_CARNE_ROSSA;

  const perGiorno = new Map<string, typeof voci>();
  for (const v of voci) perGiorno.set(v.data, [...(perGiorno.get(v.data) ?? []), v]);

  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Storico pasti</h1>
      <p className="mt-1 text-muted-foreground">Quello che hai mangiato, giorno per giorno.</p>

      <div className="mt-6 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-morbida">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            oltre ? "bg-ambra-tenue text-ambra" : "bg-verde-tenue text-verde",
          )}
        >
          <Beef className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Carne rossa o affettati questo mese</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex flex-1 gap-1">
              {Array.from({ length: Math.max(OBIETTIVO_CARNE_ROSSA, carneRossa) }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    i < carneRossa ? (i >= OBIETTIVO_CARNE_ROSSA ? "bg-destructive" : "bg-primary") : "bg-secondary",
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              <strong className={cn("text-base", oltre ? "text-ambra" : "text-foreground")}>{carneRossa}</strong> / circa{" "}
              {OBIETTIVO_CARNE_ROSSA}
            </span>
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-[28px] bg-card p-5 shadow-morbida sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <CalendarPlus className="size-5 text-primary" /> Registra un pasto
        </h2>
        <FormPasto titoli={(titoli ?? []).map((t) => t.titolo)} oggi={oggi} />
      </section>

      <div className="mt-10 space-y-8">
        {voci.length === 0 && <p className="text-center text-muted-foreground">Ancora nessun pasto registrato.</p>}
        {[...perGiorno.entries()].map(([data, lista]) => (
          <section key={data}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground capitalize">
              {data === oggi ? "Oggi" : formatoData.format(new Date(`${data}T00:00:00Z`))}
              <span className="h-px flex-1 bg-border" />
            </h2>
            <ul className="space-y-2">
              {lista
                .sort((a, b) => ORDINE_PASTO[a.pasto] - ORDINE_PASTO[b.pasto])
                .map((v) => {
                  const { icona: Icona, classe } = STILE_PASTO[v.pasto];
                  const componenti = [v.proteina, v.carboidrato, v.verdura].filter(Boolean);
                  return (
                    <li key={v.id} className="group flex items-center gap-3 rounded-3xl bg-card p-3 shadow-morbida">
                      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", classe)} title={v.pasto}>
                        <Icona className="size-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground capitalize">{v.pasto}</p>
                        {v.ricette ? (
                          <Link href={`/ricette/${v.ricette.slug}`} className="font-medium transition hover:text-primary">
                            {v.piatto}
                          </Link>
                        ) : (
                          <span className="font-medium">{v.piatto}</span>
                        )}
                        {componenti.length > 0 && (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">{componenti.join(" · ")}</p>
                        )}
                      </div>
                      <form action={togliPasto}>
                        <input type="hidden" name="id" value={v.id} />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Elimina"
                          aria-label="Elimina"
                        >
                          <X />
                        </Button>
                      </form>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
