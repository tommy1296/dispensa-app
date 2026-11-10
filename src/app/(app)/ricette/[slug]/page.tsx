import { ArrowLeft, ExternalLink, Heart, Info, Pencil, StickyNote } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copertina } from "@/components/copertina";
import { EliminaRicetta } from "@/components/elimina-ricetta";
import { Componenti, Etichette, PastoCompleto } from "@/components/etichette";
import { IconaTipo } from "@/components/icona-tipo";
import { ListaIngredienti } from "@/components/lista-ingredienti";
import { TestoSemplice } from "@/components/testo-semplice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ETICHETTA_TIPO, leggiRicetta } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { invertiPreferita } from "../actions";

export async function generateMetadata({ params }: PageProps<"/ricette/[slug]">) {
  const { slug } = await params;
  const r = await leggiRicetta(await supabaseServer(), slug);
  return { title: r ? `${r.titolo} · Dispensa` : "Dispensa" };
}

export default async function PaginaRicetta({ params }: PageProps<"/ricette/[slug]">) {
  const { slug } = await params;
  const r = await leggiRicetta(await supabaseServer(), slug);
  if (!r) notFound();

  return (
    <main className="mx-auto max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full text-muted-foreground">
        <Link href="/">
          <ArrowLeft /> Tutte le ricette
        </Link>
      </Button>

      <div className="mt-3 grid gap-5 rounded-[32px] bg-card p-2 shadow-morbida sm:p-3 md:grid-cols-[5fr_6fr] md:gap-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[26px] md:aspect-square">
          <Copertina tipo={r.tipo} immagine={r.immagine_url} titolo={r.titolo} grande />
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
            <IconaTipo tipo={r.tipo} className="size-4" /> {ETICHETTA_TIPO[r.tipo]}
          </span>
        </div>

        <div className="flex flex-col justify-center px-3 pb-4 md:py-4 md:pr-6 md:pl-0">
          {r.tipo === "pasto" && r.pasto_completo && <PastoCompleto className="mb-3" />}
          <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">{r.titolo}</h1>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Etichette r={r} estese />
            {r.proteina && <Badge variant="outline">Proteina: {r.proteina}</Badge>}
          </div>

          {r.tipo === "pasto" && (
            <div className="mt-5">
              <Componenti r={r} grande />
            </div>
          )}

          {(r.scheda_parziale || r.etichette_stimate) && (
            <div className="mt-5 flex gap-3 rounded-2xl bg-ambra-tenue p-4 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-ambra" />
              <div className="space-y-1">
                {r.scheda_parziale && <p>Scheda incompleta: per dosi o passaggi mancanti guarda la fonte.</p>}
                {r.etichette_stimate && (
                  <p className="text-muted-foreground">Etichette stimate automaticamente: controllale e salva per confermarle.</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {r.fonte_url && (
              <Button asChild size="lg" className="rounded-full">
                <a href={r.fonte_url} target="_blank" rel="noopener noreferrer">
                  Apri la fonte <ExternalLink />
                </a>
              </Button>
            )}
            <form action={invertiPreferita}>
              <input type="hidden" name="slug" value={r.slug} />
              <Button
                variant="outline"
                size="lg"
                className={cn("rounded-full", r.preferita && "border-transparent bg-accent text-accent-foreground hover:bg-accent/80")}
                title={r.preferita ? "Togli dalle preferite" : "Aggiungi alle preferite"}
              >
                <Heart className={cn(r.preferita && "fill-current")} /> {r.preferita ? "Preferita" : "Aggiungi alle preferite"}
              </Button>
            </form>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href={`/ricette/${r.slug}/modifica`}>
                <Pencil /> Modifica
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[5fr_6fr]">
        <section className="h-fit rounded-[28px] bg-card p-5 shadow-morbida sm:p-6 md:sticky md:top-24">
          <h2 className="flex items-baseline justify-between text-2xl font-bold tracking-tight">
            Ingredienti
            {r.ingredienti.length > 0 && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-semibold text-muted-foreground">{r.ingredienti.length}</span>
            )}
          </h2>
          <div className="mt-4">
            {r.ingredienti.length ? (
              <ListaIngredienti ingredienti={r.ingredienti} />
            ) : (
              <p className="text-muted-foreground">Non indicati.</p>
            )}
          </div>
        </section>

        <section className="rounded-[28px] bg-card p-5 shadow-morbida sm:p-6">
          <h2 className="text-2xl font-bold tracking-tight">Procedimento</h2>
          <div className="mt-4">
            {r.procedimento ? (
              <TestoSemplice testo={r.procedimento} />
            ) : (
              <p className="text-muted-foreground">Non indicato.</p>
            )}
          </div>
          {r.note && (
            <div className="mt-8 rounded-2xl bg-accent/60 p-5 text-sm">
              <h3 className="mb-1 flex items-center gap-2 font-medium">
                <StickyNote className="size-4" /> Note
              </h3>
              <div className="text-muted-foreground">
                <TestoSemplice testo={r.note} />
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 pt-2">
        <EliminaRicetta slug={r.slug} titolo={r.titolo} />
      </div>
    </main>
  );
}
