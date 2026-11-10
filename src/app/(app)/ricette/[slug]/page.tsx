import { ArrowLeft, CheckCheck, ExternalLink, FilePen, Heart, Info, Pencil, StickyNote } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copertina } from "@/components/copertina";
import { EliminaRicetta } from "@/components/elimina-ricetta";
import { BottoneFotoInstagram } from "@/components/foto-instagram";
import { Componenti, Etichette, PastoCompleto } from "@/components/etichette";
import { IconaTipo } from "@/components/icona-tipo";
import { ListaIngredienti } from "@/components/lista-ingredienti";
import { TestoSemplice } from "@/components/testo-semplice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { codiceInstagram } from "@/lib/foto-instagram";
import { ETICHETTA_TIPO, leggiRicetta } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { completaBozza, invertiPreferita } from "../actions";

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
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-xl text-muted-foreground">
        <Link href={r.bozza ? "/bozze" : "/"}>
          <ArrowLeft /> {r.bozza ? "Bozze" : "Tutte le ricette"}
        </Link>
      </Button>

      {r.bozza && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-crema-bordo bg-crema p-4 text-sm sm:flex-row sm:items-center">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-terracotta shadow-sm">
            <FilePen className="size-4" />
          </span>
          <p className="flex-1">
            <strong>Bozza da completare.</strong> Non compare nella ricerca né nelle proposte di Claude finché non la completi.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" className="rounded-xl">
              <Link href={`/ricette/${r.slug}/modifica`}>
                <Pencil /> Completa
              </Link>
            </Button>
            <form action={completaBozza}>
              <input type="hidden" name="slug" value={r.slug} />
              <Button variant="outline" size="sm" className="rounded-xl bg-white" title="Toglila dalle bozze così com'è">
                <CheckCheck /> È pronta
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="mt-3 grid overflow-hidden rounded-[22px] border bg-card shadow-morbida md:grid-cols-[5fr_6fr]">
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[26rem]">
          <Copertina tipo={r.tipo} immagine={r.immagine_url} titolo={r.titolo} grande />
          {!r.immagine_url && codiceInstagram(r.fonte_url) && (
            <BottoneFotoInstagram slug={r.slug} className="absolute bottom-4 left-1/2 -translate-x-1/2" />
          )}
          <span className="absolute top-4 left-4 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase shadow-sm">
            <IconaTipo tipo={r.tipo} className="size-3.5" /> {ETICHETTA_TIPO[r.tipo]}
          </span>
          {r.preferita && (
            <span className="absolute top-4 right-4 flex items-center gap-1 rounded-md bg-terracotta px-2 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-sm">
              <Heart className="size-3 fill-current" /> Preferita
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-7">
          {r.tipo === "pasto" && r.pasto_completo && <PastoCompleto className="mb-3" />}
          <h1 className="font-serif text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">{r.titolo}</h1>

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
            <div className="mt-5 flex gap-3 rounded-xl border border-crema-bordo bg-crema p-4 text-sm">
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
              <Button asChild size="lg" className="rounded-xl">
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
                className={cn("rounded-xl", r.preferita && "border-terracotta/30 bg-terracotta-tenue text-terracotta hover:bg-terracotta-tenue/80 hover:text-terracotta")}
                title={r.preferita ? "Togli dalle preferite" : "Aggiungi alle preferite"}
              >
                <Heart className={cn(r.preferita && "fill-current")} /> {r.preferita ? "Preferita" : "Aggiungi alle preferite"}
              </Button>
            </form>
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href={`/ricette/${r.slug}/modifica`}>
                <Pencil /> Modifica
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[5fr_6fr]">
        <section className="h-fit rounded-[22px] border bg-card p-5 shadow-morbida sm:p-6 md:sticky md:top-24">
          <h2 className="flex items-baseline justify-between font-serif text-2xl font-semibold tracking-tight">
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

        <section className="rounded-[22px] border bg-card p-5 shadow-morbida sm:p-6">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Procedimento</h2>
          <div className="mt-4">
            {r.procedimento ? (
              <TestoSemplice testo={r.procedimento} />
            ) : (
              <p className="text-muted-foreground">Non indicato.</p>
            )}
          </div>
          {r.note && (
            <div className="mt-8 rounded-xl border border-crema-bordo bg-crema p-5">
              <h3 className="mb-1.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-ambra uppercase">
                <StickyNote className="size-3.5" /> Note
              </h3>
              <div className="font-serif italic">
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
