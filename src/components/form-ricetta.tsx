"use client";

import { ImageUp, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { salvaRicetta } from "@/app/(app)/ricette/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ETICHETTA_TIPO, PROTEINE, TEMPI, TIPI, type Ricetta } from "@/lib/ricette";

function Campo({ id, etichetta, children, className }: { id: string; etichetta: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{etichetta}</Label>
      {children}
    </div>
  );
}

function TreStati({ nome, etichetta, valore }: { nome: string; etichetta: string; valore: boolean | null | undefined }) {
  const v = valore === true ? "si" : valore === false ? "no" : "";
  return (
    <Campo id={`r-${nome}`} etichetta={etichetta}>
      <NativeSelect id={`r-${nome}`} name={nome} defaultValue={v}>
        <NativeSelectOption value="">Non indicato</NativeSelectOption>
        <NativeSelectOption value="si">Sì</NativeSelectOption>
        <NativeSelectOption value="no">No</NativeSelectOption>
      </NativeSelect>
    </Campo>
  );
}

function Sezione({ titolo, descrizione, children }: { titolo?: string; descrizione?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-[22px] border bg-card p-5 shadow-morbida sm:p-6">
      {titolo && (
        <div>
          <h2 className="font-serif text-xl font-semibold">{titolo}</h2>
          {descrizione && <p className="mt-0.5 text-sm text-muted-foreground">{descrizione}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function FormRicetta({ ricetta }: { ricetta?: Ricetta }) {
  const [stato, azione, inCorso] = useActionState(salvaRicetta, undefined);
  const r = ricetta;

  return (
    <form action={azione} className="space-y-6">
      {r && <input type="hidden" name="slug" value={r.slug} />}

      <Sezione>
        <Campo id="r-titolo" etichetta="Titolo *">
          <Input id="r-titolo" name="titolo" required defaultValue={r?.titolo} className="h-11 text-lg md:text-lg" />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="r-tipo" etichetta="Tipo">
            <NativeSelect id="r-tipo" name="tipo" defaultValue={r?.tipo ?? "pasto"}>
              {TIPI.map((t) => (
                <NativeSelectOption key={t} value={t}>
                  {ETICHETTA_TIPO[t]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Campo>
          <Campo id="r-proteina" etichetta="Proteina principale">
            <NativeSelect id="r-proteina" name="proteina" defaultValue={r?.proteina ?? ""}>
              <NativeSelectOption value="">Non indicata</NativeSelectOption>
              {PROTEINE.map((p) => (
                <NativeSelectOption key={p}>{p}</NativeSelectOption>
              ))}
            </NativeSelect>
          </Campo>
          <Campo id="r-tempo" etichetta="Tempo">
            <NativeSelect id="r-tempo" name="tempo" defaultValue={r?.tempo ?? ""}>
              <NativeSelectOption value="">Non indicato</NativeSelectOption>
              {TEMPI.map((t) => (
                <NativeSelectOption key={t}>{t}</NativeSelectOption>
              ))}
            </NativeSelect>
          </Campo>
        </div>
        <Campo id="r-fonte" etichetta="Link alla fonte (Instagram, sito…)">
          <Input id="r-fonte" name="fonte_url" type="url" defaultValue={r?.fonte_url ?? ""} placeholder="https://" />
        </Campo>
      </Sezione>

      <Sezione titolo="Ingredienti e procedimento">
        <Campo id="r-ingredienti" etichetta="Ingredienti, uno per riga">
          <Textarea
            id="r-ingredienti"
            name="ingredienti"
            rows={8}
            defaultValue={r?.ingredienti.join("\n")}
            className="font-mono text-sm"
            placeholder={"200 g ceci cotti\n1 zucchina\nOlio EVO e sale"}
          />
        </Campo>
        <Campo id="r-procedimento" etichetta="Procedimento">
          <Textarea
            id="r-procedimento"
            name="procedimento"
            rows={8}
            defaultValue={r?.procedimento ?? ""}
            placeholder={"1. Primo passaggio\n2. Secondo passaggio"}
          />
        </Campo>
        <Campo id="r-note" etichetta="Note">
          <Textarea id="r-note" name="note" rows={3} defaultValue={r?.note ?? ""} />
        </Campo>
      </Sezione>

      <Sezione titolo="Etichette" descrizione="Servono a Claude per comporre pasti completi.">
        <div className="grid gap-4 sm:grid-cols-4">
          <TreStati nome="ha_proteina" etichetta="Contiene proteina" valore={r?.ha_proteina} />
          <TreStati nome="ha_carboidrato" etichetta="Contiene carboidrato" valore={r?.ha_carboidrato} />
          <TreStati nome="ha_verdura" etichetta="Contiene verdura" valore={r?.ha_verdura} />
          <TreStati nome="adatta_asporto" etichetta="Da asporto" valore={r?.adatta_asporto} />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Campo id="r-sg" etichetta="Senza glutine">
            <NativeSelect id="r-sg" name="senza_glutine" defaultValue={r?.senza_glutine ?? "no"}>
              <NativeSelectOption value="no">No</NativeSelectOption>
              <NativeSelectOption value="si">Sì</NativeSelectOption>
              <NativeSelectOption value="da_verificare">Da verificare</NativeSelectOption>
            </NativeSelect>
          </Campo>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-3">
            {(
              [
                ["vegana", "Vegana", r?.vegana],
                ["vegetariana", "Vegetariana", r?.vegetariana],
                ["scheda_parziale", "Scheda incompleta", r?.scheda_parziale],
                ["preferita", "Preferita", r?.preferita],
              ] as const
            ).map(([nome, etichetta, valore]) => (
              <Label
                key={nome}
                className="cursor-pointer rounded-full border bg-background px-3 py-2 font-normal transition hover:bg-secondary has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground"
              >
                <Checkbox name={nome} defaultChecked={!!valore} />
                {etichetta}
              </Label>
            ))}
          </div>
        </div>
      </Sezione>

      <Sezione titolo="Foto" descrizione="Massimo 5 MB.">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-accent/30">
          <ImageUp className="size-7 text-primary" />
          <span>Scegli una foto dal telefono o dal computer</span>
          <input name="foto" type="file" accept="image/*" className="max-w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:font-medium file:text-foreground" />
        </label>
        {r?.immagine_url && (
          <Label className="cursor-pointer font-normal">
            <Checkbox name="rimuovi_foto" /> Rimuovi la foto attuale
          </Label>
        )}
      </Sezione>

      {stato?.errore && (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{stato.errore}</p>
      )}
      <div className="sticky bottom-20 z-10 flex gap-3 rounded-full border bg-background/85 p-2 shadow-lg backdrop-blur-lg md:bottom-4">
        <Button type="submit" disabled={inCorso} size="lg" className="flex-1 rounded-xl sm:flex-none">
          {inCorso ? <Loader2 className="animate-spin" /> : <Save />}
          {inCorso ? "Salvataggio…" : "Salva ricetta"}
        </Button>
        <Button asChild variant="ghost" size="lg" className="rounded-xl">
          <Link href={r ? `/ricette/${r.slug}` : "/"}>Annulla</Link>
        </Button>
      </div>
    </form>
  );
}
