import { ArrowLeft, ExternalLink, Heart, Info, Pencil, StickyNote } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copertina } from "@/components/copertina";
import { EliminaRicetta } from "@/components/elimina-ricetta";
import { Etichette } from "@/components/etichette";
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

      <div className="mt-3 grid gap-6 md:grid-cols-[5fr_6fr] md:gap-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border shadow-sm md:aspect-square">
          <Copertina tipo={r.tipo} immagine={r.immagine_url} titolo={r.titolo} grande />
        </div>

        <div className="flex flex-col justify-center">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
            <IconaTipo tipo={r.tipo} className="size-4" /> {ETICHETTA_TIPO[r.tipo]}
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {r.titolo}
          </h1>

          <div className="mt-5 flex flex-wrap gap-1.5">
            <Etichette r={r} estese />
            {r.proteina && <Badge variant="outline">Proteina: {r.proteina}</Badge>}
          </div>

          {(r.scheda_parziale || r.etichette_stimate) && (
            <div className="mt-5 flex gap-3 rounded-2xl border border-ambra/20 bg-ambra-tenue p-4 text-sm">
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
                className={cn("rounded-full", r.preferita && "border-primary/40 bg-accent text-accent-foreground hover:bg-accent/80")}
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

      <div className="mt-10 grid gap-6 md:grid-cols-[5fr_6fr] md:gap-10">
        <section className="h-fit rounded-3xl border bg-card p-5 shadow-sm sm:p-6 md:sticky md:top-24">
          <h2 className="flex items-baseline justify-between font-serif text-2xl font-semibold">
            Ingredienti
            {r.ingredienti.length > 0 && (
              <span className="font-sans text-sm font-normal text-muted-foreground">{r.ingredienti.length}</span>
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

        <section className="px-1">
          <h2 className="font-serif text-2xl font-semibold">Procedimento</h2>
          <div className="mt-4">
            {r.procedimento ? (
              <TestoSemplice testo={r.procedimento} />
            ) : (
              <p className="text-muted-foreground">Non indicato.</p>
            )}
          </div>
          {r.note && (
            <div className="mt-8 rounded-2xl bg-secondary p-5 text-sm">
              <h3 className="mb-1 flex items-center gap-2 font-medium">
                <StickyNote className="size-4 text-primary" /> Note
              </h3>
              <div className="text-muted-foreground">
                <TestoSemplice testo={r.note} />
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-12 border-t pt-4">
        <EliminaRicetta slug={r.slug} titolo={r.titolo} />
      </div>
    </main>
  );
}
