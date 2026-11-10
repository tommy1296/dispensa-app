import type { Tipo } from "@/lib/ricette";
import { cn } from "@/lib/utils";
import { IconaTipo } from "./icona-tipo";

const SFUMATURE: Record<Tipo, string> = {
  pasto: "from-[#f3e2c4] via-[#f7ecd8] to-[#fbf6ec] text-[#b9653a]",
  colazione: "from-[#f6e3b4] via-[#f9eed2] to-[#fdf8ec] text-[#b5781a]",
  dolce: "from-[#f5d6cc] via-[#f9e6df] to-[#fdf5f1] text-[#c2502d]",
  spuntino: "from-[#dfe8cf] via-[#edf2e2] to-[#f8faf2] text-[#5b7d3a]",
  salsa: "from-[#d5e6d8] via-[#e7f0e8] to-[#f6faf5] text-[#2f6b45]",
  pane: "from-[#eadcc5] via-[#f3eadb] to-[#fbf7ef] text-[#8a6438]",
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent_60%)]" />
      <IconaTipo tipo={tipo} className={cn("relative opacity-80", grande ? "size-20" : "size-10")} />
    </div>
  );
}
