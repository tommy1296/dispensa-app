import { EMOJI_TIPO, type Tipo } from "@/lib/ricette";

const SFUMATURE: Record<Tipo, string> = {
  pasto: "from-orange-200 to-amber-100 dark:from-orange-950 dark:to-amber-900",
  colazione: "from-yellow-200 to-orange-100 dark:from-yellow-950 dark:to-orange-900",
  dolce: "from-rose-200 to-pink-100 dark:from-rose-950 dark:to-pink-900",
  spuntino: "from-lime-200 to-green-100 dark:from-lime-950 dark:to-green-900",
  salsa: "from-emerald-200 to-teal-100 dark:from-emerald-950 dark:to-teal-900",
  pane: "from-stone-300 to-amber-100 dark:from-stone-800 dark:to-amber-950",
};

export function Copertina({
  tipo,
  immagine,
  titolo,
  grande = false,
}: {
  tipo: Tipo;
  immagine: string | null;
  titolo: string;
  grande?: boolean;
}) {
  if (immagine) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={immagine} alt={titolo} className="h-full w-full object-cover" loading="lazy" />;
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${SFUMATURE[tipo]}`}
      aria-hidden
    >
      <span className={grande ? "text-7xl" : "text-5xl"}>{EMOJI_TIPO[tipo]}</span>
    </div>
  );
}
