"use client";

import { ImageDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { recuperaFotoInstagram, recuperaFotoMancanti } from "@/app/(app)/ricette/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Bottone sulla pagina della ricetta: usa la copertina del post Instagram come foto. */
export function BottoneFotoInstagram({ slug, className }: { slug: string; className?: string }) {
  const [inCorso, avvia] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn("rounded-xl bg-white/95 shadow-sm hover:bg-white", className)}
      disabled={inCorso}
      onClick={() =>
        avvia(async () => {
          const esito = await recuperaFotoInstagram(slug);
          if (esito.ok) {
            toast.success(esito.messaggio);
            router.refresh();
          } else {
            toast.error(esito.messaggio);
          }
        })
      }
    >
      {inCorso ? <Loader2 className="animate-spin" /> : <ImageDown />} Prendi la foto da Instagram
    </Button>
  );
}

/** Riquadro in home: prende le copertine di tutte le ricette Instagram senza foto. */
export function RecuperoFotoMancanti({ totale }: { totale: number }) {
  const [inCorso, setInCorso] = useState(false);
  const [riuscite, setRiuscite] = useState(0);
  const [fallite, setFallite] = useState<{ slug: string; motivo: string }[]>([]);
  const [rimaste, setRimaste] = useState(totale);
  const [finito, setFinito] = useState(false);
  const router = useRouter();

  async function avvia() {
    setInCorso(true);
    const scartate = fallite.map((f) => f.slug);
    let ok = 0;
    try {
      for (let giri = 0; giri < 100; giri++) {
        const esito = await recuperaFotoMancanti(scartate);
        ok += esito.riuscite.length;
        scartate.push(...esito.fallite.map((f) => f.slug));
        setRiuscite((n) => n + esito.riuscite.length);
        setFallite((l) => [...l, ...esito.fallite]);
        setRimaste(esito.rimaste);
        if (esito.rimaste === 0 || esito.riuscite.length + esito.fallite.length === 0) break;
      }
      setFinito(true);
      if (ok) router.refresh();
    } catch (e) {
      toast.error(`Interrotto: ${(e as Error).message}`);
    } finally {
      setInCorso(false);
    }
  }

  const fatte = riuscite + fallite.length;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-crema-bordo bg-crema p-4 text-sm sm:flex-row sm:items-center">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-terracotta shadow-sm">
        <ImageDown className="size-4" />
      </span>
      <div className="flex-1">
        {finito ? (
          <p>
            Fatto: {riuscite} {riuscite === 1 ? "foto presa" : "foto prese"} da Instagram
            {fallite.length > 0 && `, ${fallite.length} non disponibili (puoi caricarle a mano)`}.
          </p>
        ) : inCorso ? (
          <p>
            Prendo le foto da Instagram… {fatte} di {totale}
          </p>
        ) : (
          <p>
            {totale === 1 ? "1 ricetta con link Instagram non ha" : `${totale} ricette con link Instagram non hanno`} la foto. Posso
            usare la copertina del post.
          </p>
        )}
        {finito && fallite.length > 0 && (
          <details className="mt-1 text-muted-foreground">
            <summary className="cursor-pointer">Quali non sono riuscite</summary>
            <ul className="mt-1 list-disc pl-5">
              {fallite.map((f) => (
                <li key={f.slug}>
                  <a href={`/ricette/${f.slug}`} className="underline">
                    {f.slug}
                  </a>
                  : {f.motivo}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      {!finito && (
        <Button onClick={avvia} disabled={inCorso || rimaste === 0} className="rounded-xl">
          {inCorso && <Loader2 className="animate-spin" />} Prendi le foto
        </Button>
      )}
    </div>
  );
}
