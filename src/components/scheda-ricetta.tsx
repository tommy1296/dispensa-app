import { Heart } from "lucide-react";
import Link from "next/link";
import { ETICHETTA_TIPO, type RicettaInElenco } from "@/lib/ricette";
import { Copertina } from "./copertina";
import { Etichette } from "./etichette";

export function SchedaRicetta({ r }: { r: RicettaInElenco }) {
  return (
    <Link
      href={`/ricette/${r.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Copertina
          tipo={r.tipo}
          immagine={r.immagine_url}
          titolo={r.titolo}
          className="transition duration-500 group-hover:scale-105"
        />
        {r.preferita && (
          <span
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-card/90 text-primary shadow-sm backdrop-blur"
            title="Preferita"
          >
            <Heart className="size-4 fill-current" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">{ETICHETTA_TIPO[r.tipo]}</p>
        <h3 className="font-serif text-base leading-snug font-medium text-balance transition-colors group-hover:text-primary sm:text-lg">
          {r.titolo}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <Etichette r={r} />
        </div>
      </div>
    </Link>
  );
}
