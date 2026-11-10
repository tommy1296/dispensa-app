import { Check, Clock, Leaf, Snowflake, Sprout, WheatOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Ricetta, RicettaInElenco } from "@/lib/ricette";
import { cn } from "@/lib/utils";

type ConComponenti = Pick<Ricetta, "ha_proteina" | "ha_carboidrato" | "ha_verdura" | "pasto_completo">;

const MACRO = [
  { chiave: "ha_proteina", nome: "Proteina", breve: "Proteina", corto: "P", colore: "bg-proteina" },
  { chiave: "ha_carboidrato", nome: "Carboidrato", breve: "Carbo", corto: "C", colore: "bg-carboidrato" },
  { chiave: "ha_verdura", nome: "Verdura", breve: "Verdura", corto: "V", colore: "bg-verdura" },
] as const;

/**
 * Proteina, carboidrato e verdura come i riquadri dei macro di Plate:
 * etichetta, valore e una barretta colorata (grigia se la componente manca).
 */
export function Componenti({ r, grande = false }: { r: ConComponenti; grande?: boolean }) {
  return (
    <div
      className={cn("grid grid-cols-3", grande ? "gap-2.5" : "gap-1.5")}
      title={r.pasto_completo ? "Pasto completo" : "Da completare con un abbinamento"}
    >
      {MACRO.map((m) => {
        const valore = r[m.chiave];
        return (
          <div key={m.chiave} className={cn("min-w-0 rounded-xl border bg-[#fbf9f4]", grande ? "p-3" : "px-2 py-1.5")}>
            <p className={cn("truncate font-medium text-muted-foreground", grande ? "text-xs" : "text-[10px]")}>
              {grande ? (
                m.nome
              ) : (
                <>
                  <span className="sm:hidden">{m.corto}</span>
                  <span className="hidden sm:inline">{m.breve}</span>
                </>
              )}
            </p>
            <p
              className={cn(
                "font-serif leading-tight font-semibold",
                grande ? "mt-0.5 text-xl" : "text-sm",
                !valore && "text-muted-foreground/70",
              )}
            >
              {valore ? "Sì" : valore === false ? "No" : "?"}
            </p>
            <div className={cn("overflow-hidden rounded-full bg-secondary", grande ? "mt-2 h-1.5" : "mt-1 h-1")}>
              <div className={cn("h-full rounded-full", valore ? `w-full ${m.colore}` : "w-0")} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Pillola "Pasto completo" per le ricette che hanno tutte e tre le componenti. */
export function PastoCompleto({ className }: { className?: string }) {
  return (
    <Badge className={cn("border-primary/15 bg-accent text-accent-foreground", className)}>
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
        <Badge variant="secondary" className="bg-sky-50 text-sky-800">
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

/** Riga compatta di metadati per le card, come "640 kcal · 38 g protein · 15 min". */
export function MetaRicetta({ r }: { r: ConEtichette }) {
  const voci: { testo: string; classe?: string }[] = [];
  if (r.tempo) voci.push({ testo: r.tempo });
  if (r.adatta_asporto) voci.push({ testo: "asporto" });
  if (r.vegana) voci.push({ testo: "vegana", classe: "text-verde" });
  else if (r.vegetariana) voci.push({ testo: "vegetariana", classe: "text-verde" });
  if (!voci.length) return null;
  return (
    <p className="text-xs font-medium text-muted-foreground">
      {voci.map(({ testo, classe }, i) => (
        <span key={testo}>
          {i > 0 && <span className="mx-1 opacity-50">·</span>}
          <span className={classe}>{testo}</span>
        </span>
      ))}
    </p>
  );
}
