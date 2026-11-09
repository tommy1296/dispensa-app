import Link from "next/link";
import type { RicettaInElenco } from "@/lib/ricette";
import { Copertina } from "./copertina";
import { Componenti } from "./etichette";

export function SchedaRicetta({ r }: { r: RicettaInElenco }) {
  return (
    <Link
      href={`/ricette/${r.slug}`}
      className="scheda group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Copertina tipo={r.tipo} immagine={r.immagine_url} titolo={r.titolo} />
        {r.preferita && (
          <span className="absolute right-2 top-2 rounded-full bg-superficie/90 px-2 py-0.5 text-sm" title="Preferita">
            ★
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-serif text-lg leading-snug font-medium group-hover:text-accento">{r.titolo}</h3>
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {r.tipo === "pasto" && <Componenti r={r} />}
          {r.tempo && <span className="chip">⏱ {r.tempo}</span>}
          {r.adatta_asporto && <span className="chip">🧊 asporto</span>}
          {r.vegana ? <span className="chip">🌱 vegana</span> : r.vegetariana && <span className="chip">🥚 vegetariana</span>}
        </div>
      </div>
    </Link>
  );
}
