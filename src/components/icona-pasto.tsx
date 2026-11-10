import { Coffee, Moon, Sun } from "lucide-react";
import type { Pasto } from "@/lib/ricette";

export const STILE_PASTO: Record<Pasto, { icona: typeof Sun; classe: string }> = {
  colazione: { icona: Coffee, classe: "bg-ambra-tenue text-ambra" },
  pranzo: { icona: Sun, classe: "bg-accent text-accent-foreground" },
  cena: { icona: Moon, classe: "bg-indigo-100 text-indigo-700" },
};
