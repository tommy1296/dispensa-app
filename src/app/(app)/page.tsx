import { ChevronDown, Lightbulb, ChevronLeft, ChevronRight, LayoutGrid, Search, SearchX, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { RecuperoFotoMancanti } from "@/components/foto-instagram";
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
  ricetteSenzaFotoInstagram,
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
  const [{ ricette, totale }, conteggi, senzaFoto] = await Promise.all([
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
    ricetteSenzaFotoInstagram(db, { limite: 1 }),
  ]);
  const tutte = Object.values(conteggi).reduce((a, b) => a + (b ?? 0), 0);
  const pagine = Math.max(1, Math.ceil(totale / PER_PAGINA));
  const filtriAttivi = [proteina, tempo, ...["asporto", "completo", "vegana", "vegetariana", "sg"].filter(si)].filter(
    Boolean,
  ).length;

  return (
    <main>
      <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-terracotta uppercase">
        <span className="size-1.5 rounded-full bg-terracotta" /> Il tuo ricettario
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Cosa cuciniamo oggi?</h1>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-morbida sm:p-5 lg:flex-row lg:items-center">
        <dl className="flex flex-1 divide-x">
          <Statistica etichetta="Ricette" valore={tutte} />
          {TIPI.filter((t) => conteggi[t])
            .slice(0, 3)
            .map((t, i) => (
              <Statistica key={t} etichetta={ETICHETTA_TIPO[t]} valore={conteggi[t] ?? 0} className={cn(i === 2 && "hidden sm:block")} />
            ))}
        </dl>
        <div className="flex items-start gap-3 rounded-xl border border-crema-bordo bg-crema px-4 py-3 lg:max-w-sm">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-terracotta shadow-sm">
            <Lightbulb className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-ambra uppercase">Promemoria</p>
            <p className="font-serif text-[15px] leading-snug italic">«A pranzo un piatto da asporto, a cena pane o pita.»</p>
          </div>
        </div>
      </div>

      {senzaFoto.totale > 0 && <RecuperoFotoMancanti totale={senzaFoto.totale} />}

      <form action="/" className="mt-6 flex gap-2">
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
            placeholder="Cerca ricette, ingredienti…"
            className="h-11 bg-card pl-10 shadow-xs"
            type="search"
          />
        </div>
        <Button size="lg" className="h-11 px-5 font-semibold">
          Cerca
        </Button>
      </form>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Chip href={link(sp, { tipo: null })} attivo={!tipo}>
          <LayoutGrid className="size-4" /> Tutte <span className="opacity-60">{tutte}</span>
        </Chip>
        {TIPI.filter((t) => conteggi[t]).map((t) => (
          <Chip key={t} href={link(sp, { tipo: t })} attivo={tipo === t}>
            <IconaTipo tipo={t} className="size-4" /> {ETICHETTA_TIPO[t]} <span className="opacity-60">{conteggi[t]}</span>
          </Chip>
        ))}
      </div>

      <details className="group mt-3 rounded-2xl border bg-card shadow-xs" open={filtriAttivi > 0}>
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
                className="cursor-pointer rounded-full border bg-card px-3.5 py-2 font-medium transition hover:bg-secondary has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground"
              >
                <Checkbox name={k} value="1" defaultChecked={si(k)} />
                {nome}
              </Label>
            ))}
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <Button className="rounded-xl">Applica</Button>
            <Button asChild variant="ghost" className="rounded-xl">
              <Link href={link({}, { tipo: tipo || null, q: testo || null })}>Azzera</Link>
            </Button>
          </div>
        </form>
      </details>

      <div className="mt-8 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">{tipo ? ETICHETTA_TIPO[tipo] : "Tutte le ricette"}</h2>
        <p className="text-sm text-muted-foreground">
          {totale === 1 ? "1 ricetta" : `${totale} ricette`}
          {testo && <> per «{testo}»</>}
        </p>
      </div>

      {totale === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-16 text-center">
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
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={link(sp, { pagina: String(pagina - 1) })}>
                <ChevronLeft /> Indietro
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-xl" disabled>
              <ChevronLeft /> Indietro
            </Button>
          )}
          <span className="text-muted-foreground tabular-nums">
            {pagina} / {pagine}
          </span>
          {pagina < pagine ? (
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={link(sp, { pagina: String(pagina + 1) })}>
                Avanti <ChevronRight />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-xl" disabled>
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
        "flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition hover:bg-secondary",
        attivo && "border-inchiostro bg-inchiostro text-white hover:bg-inchiostro/90",
      )}
    >
      {children}
    </Link>
  );
}

function Statistica({ etichetta, valore, className }: { etichetta: string; valore: number; className?: string }) {
  return (
    <div className={cn("min-w-0 px-3 first:pl-0 sm:px-6", className)}>
      <dt className="truncate text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">{etichetta}</dt>
      <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{valore}</dd>
    </div>
  );
}
