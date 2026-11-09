import type { Ricetta } from "@/lib/ricette";

type ConComponenti = Pick<Ricetta, "ha_proteina" | "ha_carboidrato" | "ha_verdura" | "pasto_completo">;

/** Tre pallini P · C · V: pieni se la ricetta contiene la componente. */
export function Componenti({ r }: { r: ConComponenti }) {
  const voci = [
    ["P", "proteina", r.ha_proteina],
    ["C", "carboidrato", r.ha_carboidrato],
    ["V", "verdura", r.ha_verdura],
  ] as const;
  return (
    <span
      className={`chip gap-0.5 ${r.pasto_completo ? "bg-verde-tenue text-verde" : ""}`}
      title={r.pasto_completo ? "Pasto completo" : "Da completare con un abbinamento"}
    >
      {voci.map(([lettera, nome, presente]) => (
        <span key={lettera} title={nome} className={presente ? "font-bold" : "opacity-35 line-through"}>
          {lettera}
        </span>
      ))}
    </span>
  );
}
