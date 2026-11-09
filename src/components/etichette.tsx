import { Clock, Leaf, Snowflake, Sprout, WheatOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Ricetta, RicettaInElenco } from "@/lib/ricette";
import { cn } from "@/lib/utils";

type ConComponenti = Pick<Ricetta, "ha_proteina" | "ha_carboidrato" | "ha_verdura" | "pasto_completo">;

/** Tre lettere P · C · V: piene se la ricetta contiene la componente. */
export function Componenti({ r }: { r: ConComponenti }) {
  const voci = [
    ["P", "proteina", r.ha_proteina],
    ["C", "carboidrato", r.ha_carboidrato],
    ["V", "verdura", r.ha_verdura],
  ] as const;
  return (
    <Badge
      variant="secondary"
      className={cn("gap-1 font-mono tracking-wider", r.pasto_completo && "bg-verde-tenue text-verde")}
      title={r.pasto_completo ? "Pasto completo" : "Da completare con un abbinamento"}
    >
      {voci.map(([lettera, nome, presente]) => (
        <span key={lettera} title={nome} className={presente ? "font-bold" : "opacity-35 line-through"}>
          {lettera}
        </span>
      ))}
    </Badge>
  );
}

type ConEtichette = Pick<
  RicettaInElenco,
  "tipo" | "tempo" | "adatta_asporto" | "vegana" | "vegetariana" | "ha_proteina" | "ha_carboidrato" | "ha_verdura" | "pasto_completo"
> & { senza_glutine?: Ricetta["senza_glutine"] };

/** Le etichette di una ricetta come badge con icona. */
export function Etichette({ r, estese = false }: { r: ConEtichette; estese?: boolean }) {
  return (
    <>
      {r.tipo === "pasto" && <Componenti r={r} />}
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
