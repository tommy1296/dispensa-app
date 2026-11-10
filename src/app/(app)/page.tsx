import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Search, SearchX, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { IconaTipo } from "@/components/icona-tipo";
import { SchedaRicetta } from "@/components/scheda-ricetta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
import { cn } from "@/lib/utils";

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
      <section className="relative overflow-hidden rounded-[32px] bg-primary px-5 pt-6 pb-5 text-primary-foreground sm:px-8 sm:pt-9 sm:pb-7 dark:bg-card dark:text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-lime/25 blur-3xl dark:bg-lime/10"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-70">Il tuo ricettario</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Cosa cuciniamo oggi?</h1>
          </div>
          <div className="flex items-baseline gap-2 rounded-2xl bg-white/10 px-4 py-2.5 dark:bg-secondary">
            <span className="text-2xl font-bold text-lime tabular-nums">{tutte}</span>
            <span className="text-sm opacity-80">ricette in dispensa</span>
          </div>
        </div>

      <form action="/" className="relative mt-6 flex gap-2">
        {Object.entries(sp)
          .filter(([k]) => !["q", "pagina"].includes(k))
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={uno(v)} />
          ))}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={testo}
            placeholder="Cerca per nome o ingrediente: zucca, ceci, tofu…"
            className="h-12 rounded-full border-transparent bg-card pl-10 text-foreground shadow-sm dark:bg-secondary"
            type="search"
          />
        </div>
        <Button size="lg" className="h-12 rounded-full bg-lime px-6 font-semibold text-[#142019] hover:bg-lime/85">
          Cerca
        </Button>
      </form>
      </section>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Chip href={link(sp, { tipo: null })} attivo={!tipo}>
          <LayoutGrid className="size-4" /> Tutte <span className="opacity-60">{tutte}</span>
        </Chip>
        {TIPI.filter((t) => conteggi[t]).map((t) => (
          <Chip key={t} href={link(sp, { tipo: t })} attivo={tipo === t}>
            <IconaTipo tipo={t} className="size-4" /> {ETICHETTA_TIPO[t]} <span className="opacity-60">{conteggi[t]}</span>
          </Chip>
        ))}
      </div>

      <details className="group mt-3 rounded-3xl bg-card shadow-morbida" open={filtriAttivi > 0}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          Filtri
          {filtriAttivi > 0 && <Badge className="h-5 min-w-5 rounded-full px-1.5">{filtriAttivi}</Badge>}
          <ChevronDown className="ml-auto size-4 text-muted-foreground transition group-open:rotate-180" />
        </summary>
        <form action="/" className="grid gap-4 border-t border-dashed px-5 pt-4 pb-5 sm:grid-cols-3">
          {testo && <input type="hidden" name="q" value={testo} />}
          {tipo && <input type="hidden" name="tipo" value={tipo} />}
          <div className="grid gap-1.5">
            <Label htmlFor="f-proteina">Proteina</Label>
            <NativeSelect id="f-proteina" name="proteina" defaultValue={proteina}>
              <NativeSelectOption value="">Tutte</NativeSelectOption>
              {PROTEINE.map((p) => (
                <NativeSelectOption key={p}>{p}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-tempo">Tempo</Label>
            <NativeSelect id="f-tempo" name="tempo" defaultValue={tempo}>
              <NativeSelectOption value="">Qualsiasi</NativeSelectOption>
              {TEMPI.map((t) => (
                <NativeSelectOption key={t}>{t}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-ordine">Ordine</Label>
            <NativeSelect id="f-ordine" name="ordine" defaultValue={uno(sp.ordine)}>
              <NativeSelectOption value="">Alfabetico</NativeSelectOption>
              <NativeSelectOption value="recenti">Aggiunte di recente</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-3">
            {[
              ["asporto", "Da asporto"],
              ["completo", "Pasto completo"],
              ["vegana", "Vegana"],
              ["vegetariana", "Vegetariana"],
              ["sg", "Senza glutine"],
            ].map(([k, nome]) => (
              <Label
                key={k}
                className="cursor-pointer rounded-full border border-transparent bg-secondary px-3.5 py-2 font-medium transition hover:bg-secondary/70 has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground"
              >
                <Checkbox name={k} value="1" defaultChecked={si(k)} />
                {nome}
              </Label>
            ))}
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <Button className="rounded-full">Applica</Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link href={link({}, { tipo: tipo || null, q: testo || null })}>Azzera</Link>
            </Button>
          </div>
        </form>
      </details>

      <div className="mt-8 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight">{tipo ? ETICHETTA_TIPO[tipo] : "Tutte le ricette"}</h2>
        <p className="text-sm text-muted-foreground">
          {totale === 1 ? "1 ricetta" : `${totale} ricette`}
          {testo && <> per «{testo}»</>}
        </p>
      </div>

      {totale === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-[28px] border-2 border-dashed px-6 py-16 text-center">
          <SearchX className="size-10 text-muted-foreground/60" />
          <p className="mt-3 font-medium">Nessuna ricetta trovata</p>
          <p className="mt-1 text-sm text-muted-foreground">Prova con un altro ingrediente o togli qualche filtro.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {ricette.map((r) => (
            <SchedaRicetta key={r.id} r={r} />
          ))}
        </div>
      )}

      {pagine > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3 text-sm">
          {pagina > 1 ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={link(sp, { pagina: String(pagina - 1) })}>
                <ChevronLeft /> Indietro
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-full" disabled>
              <ChevronLeft /> Indietro
            </Button>
          )}
          <span className="text-muted-foreground tabular-nums">
            {pagina} / {pagine}
          </span>
          {pagina < pagine ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={link(sp, { pagina: String(pagina + 1) })}>
                Avanti <ChevronRight />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-full" disabled>
              Avanti <ChevronRight />
            </Button>
          )}
        </nav>
      )}
    </main>
  );
}

function Chip({ href, attivo, children }: { href: string; attivo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold whitespace-nowrap shadow-morbida transition hover:bg-accent/60",
        attivo && "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {children}
    </Link>
  );
}
