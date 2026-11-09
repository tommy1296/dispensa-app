import { CakeSlice, Coffee, Cookie, CookingPot, Soup, Wheat, type LucideIcon } from "lucide-react";
import type { Tipo } from "@/lib/ricette";

export const ICONA_TIPO: Record<Tipo, LucideIcon> = {
  pasto: CookingPot,
  colazione: Coffee,
  dolce: CakeSlice,
  spuntino: Cookie,
  salsa: Soup,
  pane: Wheat,
};

export function IconaTipo({ tipo, className }: { tipo: Tipo; className?: string }) {
  const Icona = ICONA_TIPO[tipo];
  return <Icona className={className} aria-hidden />;
}
