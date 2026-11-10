import { Check, Heart } from "lucide-react";
import Link from "next/link";
import { ETICHETTA_TIPO, type RicettaInElenco } from "@/lib/ricette";
import { Copertina } from "./copertina";
import { Componenti, MetaRicetta } from "./etichette";

export function SchedaRicetta({ r }: { r: RicettaInElenco }) {
  return (
    <Link
      href={`/ricette/${r.slug}`}
      className="group flex flex-col overflow-hidden rounded-[18px] border bg-card shadow-morbida transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#3c2d19]/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Copertina
          tipo={r.tipo}
          immagine={r.immagine_url}
          titolo={r.titolo}
          className="transition duration-500 group-hover:scale-105"
        />
        <span className="absolute top-2.5 left-2.5 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold tracking-wider text-foreground uppercase shadow-sm">
          {ETICHETTA_TIPO[r.tipo]}
        </span>
        {r.preferita && (
          <span
            className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-terracotta px-1.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm"
            title="Preferita"
          >
            <Heart className="size-3 fill-current" />
            <span className="hidden sm:inline">Preferita</span>
          </span>
        )}
        {r.tipo === "pasto" && r.pasto_completo && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-semibold text-primary-foreground shadow-sm">
            <Check className="size-3" strokeWidth={3} /> Pasto completo
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 font-serif text-base leading-snug font-semibold text-balance sm:text-[17px]">{r.titolo}</h3>
        <MetaRicetta r={r} />
        {r.tipo === "pasto" && (
          <div className="mt-auto pt-2">
            <Componenti r={r} />
          </div>
        )}
      </div>
    </Link>
  );
}
