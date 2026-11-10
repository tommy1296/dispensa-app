import { Check, Heart } from "lucide-react";
import Link from "next/link";
import { ETICHETTA_TIPO, type RicettaInElenco } from "@/lib/ricette";
import { Copertina } from "./copertina";
import { Componenti, MetaRicetta } from "./etichette";
import { IconaTipo } from "./icona-tipo";

export function SchedaRicetta({ r }: { r: RicettaInElenco }) {
  return (
    <Link
      href={`/ricette/${r.slug}`}
      className="group flex flex-col rounded-[26px] bg-card p-1.5 shadow-morbida transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none sm:p-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
        <Copertina
          tipo={r.tipo}
          immagine={r.immagine_url}
          titolo={r.titolo}
          className="transition duration-500 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
          <IconaTipo tipo={r.tipo} className="size-3.5" /> {ETICHETTA_TIPO[r.tipo]}
        </span>
        {r.preferita && (
          <span
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-card/90 text-proteina shadow-sm backdrop-blur"
            title="Preferita"
          >
            <Heart className="size-3.5 fill-current" />
          </span>
        )}
        {r.tipo === "pasto" && r.pasto_completo && (
          <span
            className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-lime px-2 py-1 text-[11px] font-semibold text-[#142019] shadow-sm"
            title="Pasto completo"
          >
            <Check className="size-3.5" strokeWidth={3} /> Completo
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pt-3 pb-1.5 sm:px-2.5 sm:pb-2">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-bold tracking-tight text-balance sm:text-base">{r.titolo}</h3>
        <MetaRicetta r={r} />
        {r.tipo === "pasto" && (
          <div className="mt-auto border-t border-dashed pt-2.5">
            <Componenti r={r} />
          </div>
        )}
      </div>
    </Link>
  );
}
