import { Check, Clock, Leaf, Snowflake, Sprout, WheatOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Ricetta, RicettaInElenco } from "@/lib/ricette";
import { cn } from "@/lib/utils";

type ConComponenti = Pick<Ricetta, "ha_proteina" | "ha_carboidrato" | "ha_verdura" | "pasto_completo">;

const MACRO = [
  { chiave: "ha_proteina", nome: "Proteina", corto: "Prot.", colore: "bg-proteina", testo: "text-proteina" },
  { chiave: "ha_carboidrato", nome: "Carboidrato", corto: "Carbo", colore: "bg-carboidrato", testo: "text-carboidrato" },
  { chiave: "ha_verdura", nome: "Verdura", corto: "Verdura", colore: "bg-verdura", testo: "text-verdura" },
] as const;

/**
 * Proteina, carboidrato e verdura come i "macro" di un'app nutrizionale:
 * una barretta colorata se la ricetta contiene la componente, grigia se manca.
 */
export function Componenti({ r, grande = false }: { r: ConComponenti; grande?: boolean }) {
  if (grande) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {MACRO.map((m) => {
          const presente = r[m.chiave];
          return (
            <div key={m.chiave} className={cn("rounded-2xl bg-secondary p-3 sm:p-4", !presente && "opacity-60")}>
              <div className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", presente ? m.colore : "bg-muted-foreground/30")} />
                <span className="text-xs font-medium text-muted-foreground">{m.nome}</span>
              </div>
              <p className={cn("mt-1.5 text-sm font-bold sm:text-base", !presente && "text-muted-foreground")}>
                {presente ? "Presente" : "Da abbinare"}
              </p>
              <div className="mt-2.5 h-1.5 rounded-full bg-background/80">
                <div className={cn("h-full rounded-full", presente ? `${m.colore} w-full` : "w-0")} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div
      className="grid grid-cols-3 gap-1.5"
      title={r.pasto_completo ? "Pasto completo" : "Da completare con un abbinamento"}
    >
      {MACRO.map((m) => {
        const presente = r[m.chiave];
        return (
          <div key={m.chiave} className="min-w-0">
            <div className={cn("h-1.5 rounded-full", presente ? m.colore : "bg-secondary")} />
            <p
              className={cn(
                "mt-1 truncate text-[10.5px] font-medium sm:text-[11px]",
                presente ? "text-foreground/80" : "text-muted-foreground/60 line-through",
              )}
            >
              <span className="sm:hidden">{m.corto}</span>
              <span className="hidden sm:inline">{m.nome}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Pillola "Pasto completo" per le ricette che hanno tutte e tre le componenti. */
export function PastoCompleto({ className }: { className?: string }) {
  return (
    <Badge className={cn("bg-accent text-accent-foreground", className)}>
      <Check /> Pasto completo
    </Badge>
  );
}

type ConEtichette = Pick<RicettaInElenco, "tempo" | "adatta_asporto" | "vegana" | "vegetariana"> & {
  senza_glutine?: Ricetta["senza_glutine"];
};

/** Le etichette di una ricetta come badge con icona. */
export function Etichette({ r, estese = false }: { r: ConEtichette; estese?: boolean }) {
  return (
    <>
      {r.tempo && (
        <Badge variant="secondary">
          <Clock /> {r.tempo}
        </Badge>
      )}
      {r.adatta_asporto && (
        <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
          <Snowflake /> {estese ? "da asporto" : "asporto"}
        </Badge>
      )}
      {r.vegana ? (
        <Badge variant="secondary" className="bg-verde-tenue text-verde">
          <Sprout /> vegana
        </Badge>
      ) : (
        r.vegetariana && (
          <Badge variant="secondary" className="bg-verde-tenue text-verde">
            <Leaf /> vegetariana
          </Badge>
        )
      )}
      {estese && r.senza_glutine === "si" && (
        <Badge variant="secondary" className="bg-ambra-tenue text-ambra">
          <WheatOff /> senza glutine
        </Badge>
      )}
      {estese && r.senza_glutine === "da_verificare" && (
        <Badge variant="outline" className="text-muted-foreground">
          <WheatOff /> glutine da verificare
        </Badge>
      )}
    </>
  );
}

/** Riga compatta di metadati per le card: tempo, asporto, vegana/vegetariana. */
export function MetaRicetta({ r }: { r: ConEtichette }) {
  const voci: { icona: typeof Clock; testo: string; classe?: string }[] = [];
  if (r.tempo) voci.push({ icona: Clock, testo: r.tempo });
  if (r.adatta_asporto) voci.push({ icona: Snowflake, testo: "asporto", classe: "text-sky-700 dark:text-sky-300" });
  if (r.vegana) voci.push({ icona: Sprout, testo: "vegana", classe: "text-verde" });
  else if (r.vegetariana) voci.push({ icona: Leaf, testo: "vegetariana", classe: "text-verde" });
  if (!voci.length) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {voci.map(({ icona: Icona, testo, classe }) => (
        <li key={testo} className={cn("flex items-center gap-1 font-medium", classe)}>
          <Icona className="size-3.5" /> {testo}
        </li>
      ))}
    </ul>
  );
}
