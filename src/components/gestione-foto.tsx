"use client";

import { ImageDown, Loader2, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  contaFotoInutilizzate,
  eliminaFotoInutilizzate,
  ottimizzaFotoLotto,
  type EsitoPulizia,
} from "@/app/(app)/foto/actions";
import { Button } from "@/components/ui/button";

const mb = (byte: number) => `${(byte / 1024 / 1024).toLocaleString("it-IT", { maximumFractionDigits: 1 })} MB`;

function Riquadro({ icona, titolo, children }: { icona: React.ReactNode; titolo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border bg-card p-5 shadow-morbida sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-crema text-terracotta">{icona}</span>
        <h2 className="font-serif text-xl font-semibold">{titolo}</h2>
      </div>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </section>
  );
}

/** Converte nel formato unico tutte le foto, a piccoli gruppi. */
export function OttimizzaFoto({ totale }: { totale: number }) {
  const [inCorso, setInCorso] = useState(false);
  const [riuscite, setRiuscite] = useState(0);
  const [fallite, setFallite] = useState<{ slug: string; motivo: string }[]>([]);
  const [byte, setByte] = useState({ prima: 0, dopo: 0 });
  const [finito, setFinito] = useState(false);
  const router = useRouter();

  async function avvia() {
    setInCorso(true);
    const scartate = fallite.map((f) => f.slug);
    let ok = 0;
    try {
      for (let giri = 0; giri < 200; giri++) {
        const esito = await ottimizzaFotoLotto(scartate);
        ok += esito.riuscite;
        scartate.push(...esito.fallite.map((f) => f.slug));
        setRiuscite((n) => n + esito.riuscite);
        setFallite((l) => [...l, ...esito.fallite]);
        setByte((b) => ({ prima: b.prima + esito.bytePrima, dopo: b.dopo + esito.byteDopo }));
        if (esito.rimaste === 0 || esito.riuscite + esito.fallite.length === 0) break;
      }
      setFinito(true);
      if (ok) router.refresh();
    } catch (e) {
      toast.error(`Interrotto: ${(e as Error).message}`);
    } finally {
      setInCorso(false);
    }
  }

  return (
    <Riquadro icona={<Sparkles className="size-4" />} titolo="Ottimizza le foto">
      <p className="text-muted-foreground">
        Ritaglia ogni foto in 4:3 (1200×900, centrata sul piatto) e la salva in WebP, molto più leggera. Gli originali restano
        nello spazio di archiviazione finché non fai la pulizia qui sotto.
      </p>
      {finito || inCorso ? (
        <p>
          {inCorso ? "Lavoro sulle foto… " : "Fatto: "}
          {riuscite} {riuscite === 1 ? "foto ottimizzata" : "foto ottimizzate"} su {totale}
          {byte.prima > 0 && ` (da ${mb(byte.prima)} a ${mb(byte.dopo)})`}
          {fallite.length > 0 && `, ${fallite.length} non riuscite`}.
        </p>
      ) : (
        <p>{totale === 0 ? "Tutte le foto sono già nel formato unico." : totale === 1 ? "1 foto da ottimizzare." : `${totale} foto da ottimizzare.`}</p>
      )}
      {fallite.length > 0 && (
        <details className="text-muted-foreground">
          <summary className="cursor-pointer">Quali non sono riuscite</summary>
          <ul className="mt-1 list-disc pl-5">
            {fallite.map((f) => (
              <li key={f.slug}>
                <Link href={`/ricette/${f.slug}`} className="underline">
                  {f.slug}
                </Link>
                : {f.motivo}
              </li>
            ))}
          </ul>
        </details>
      )}
      {!finito && totale > 0 && (
        <Button onClick={avvia} disabled={inCorso} className="rounded-xl">
          {inCorso ? <Loader2 className="animate-spin" /> : <ImageDown />} Ottimizza {totale === 1 ? "la foto" : `le ${totale} foto`}
        </Button>
      )}
    </Riquadro>
  );
}

/** Elimina dallo Storage i file che nessuna ricetta usa più, dopo averli contati. */
export function PuliziaFoto() {
  const [stato, setStato] = useState<"pronto" | "conto" | "contate" | "elimino" | "fatto">("pronto");
  const [conteggio, setConteggio] = useState<EsitoPulizia | null>(null);

  async function conta() {
    setStato("conto");
    try {
      setConteggio(await contaFotoInutilizzate());
      setStato("contate");
    } catch (e) {
      toast.error((e as Error).message);
      setStato("pronto");
    }
  }

  async function elimina() {
    setStato("elimino");
    try {
      setConteggio(await eliminaFotoInutilizzate());
      setStato("fatto");
    } catch (e) {
      toast.error((e as Error).message);
      setStato("contate");
    }
  }

  return (
    <Riquadro icona={<Trash2 className="size-4" />} titolo="Pulizia">
      <p className="text-muted-foreground">
        Elimina definitivamente i file che nessuna ricetta usa più: gli originali sostituiti dall&apos;ottimizzazione e le foto
        tolte o cambiate. Prima controlla bene qualche ricetta.
      </p>
      {stato === "contate" && conteggio && (
        <p>{conteggio.file === 0 ? "Non ci sono file inutilizzati." : `${conteggio.file} file inutilizzati, ${mb(conteggio.byte)}.`}</p>
      )}
      {stato === "fatto" && conteggio && (
        <p>
          Eliminati {conteggio.file} file, liberati {mb(conteggio.byte)}.
        </p>
      )}
      {(stato === "pronto" || stato === "conto") && (
        <Button variant="outline" onClick={conta} disabled={stato === "conto"} className="rounded-xl">
          {stato === "conto" && <Loader2 className="animate-spin" />} Cerca i file inutilizzati
        </Button>
      )}
      {(stato === "contate" || stato === "elimino") && conteggio && conteggio.file > 0 && (
        <Button variant="destructive" onClick={elimina} disabled={stato === "elimino"} className="rounded-xl">
          {stato === "elimino" ? <Loader2 className="animate-spin" /> : <Trash2 />} Elimina {conteggio.file} file
        </Button>
      )}
    </Riquadro>
  );
}
