import type { Tipo } from "@/lib/ricette";
import { cn } from "@/lib/utils";
import { IconaTipo } from "./icona-tipo";

const SFUMATURE: Record<Tipo, string> = {
  pasto: "from-orange-200 via-amber-100 to-orange-50 text-orange-700/70 dark:from-orange-950 dark:via-amber-950 dark:to-stone-900 dark:text-orange-300/60",
  colazione: "from-yellow-200 via-amber-100 to-orange-50 text-amber-700/70 dark:from-yellow-950 dark:via-amber-950 dark:to-stone-900 dark:text-amber-300/60",
  dolce: "from-rose-200 via-pink-100 to-orange-50 text-rose-700/60 dark:from-rose-950 dark:via-pink-950 dark:to-stone-900 dark:text-rose-300/60",
  spuntino: "from-lime-200 via-green-100 to-amber-50 text-lime-800/60 dark:from-lime-950 dark:via-green-950 dark:to-stone-900 dark:text-lime-300/60",
  salsa: "from-emerald-200 via-teal-100 to-lime-50 text-emerald-800/60 dark:from-emerald-950 dark:via-teal-950 dark:to-stone-900 dark:text-emerald-300/60",
  pane: "from-stone-300 via-amber-100 to-orange-50 text-stone-700/70 dark:from-stone-800 dark:via-amber-950 dark:to-stone-900 dark:text-stone-300/60",
};

export function Copertina({
  tipo,
  immagine,
  titolo,
  grande = false,
  className,
}: {
  tipo: Tipo;
  immagine: string | null;
  titolo: string;
  grande?: boolean;
  className?: string;
}) {
  if (immagine) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={immagine} alt={titolo} className={cn("h-full w-full object-cover", className)} loading="lazy" />
    );
  }
  return (
    <div
      className={cn("relative flex h-full w-full items-center justify-center bg-gradient-to-br", SFUMATURE[tipo], className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
      <IconaTipo tipo={tipo} className={cn("relative", grande ? "size-24" : "size-12")} />
    </div>
  );
}
