"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvaRicetta } from "@/app/(app)/ricette/actions";
import { ETICHETTA_TIPO, PROTEINE, TEMPI, TIPI, type Ricetta } from "@/lib/ricette";

function TreStati({ nome, etichetta, valore }: { nome: string; etichetta: string; valore: boolean | null | undefined }) {
  const v = valore === true ? "si" : valore === false ? "no" : "";
  return (
    <label>
      <span className="etichetta">{etichetta}</span>
      <select name={nome} defaultValue={v} className="campo">
        <option value="">Non indicato</option>
        <option value="si">Sì</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}

export function FormRicetta({ ricetta }: { ricetta?: Ricetta }) {
  const [stato, azione, inCorso] = useActionState(salvaRicetta, undefined);
  const r = ricetta;

  return (
    <form action={azione} className="space-y-6">
      {r && <input type="hidden" name="slug" value={r.slug} />}

      <section className="scheda space-y-4 p-4 sm:p-6">
        <label className="block">
          <span className="etichetta">Titolo *</span>
          <input name="titolo" required defaultValue={r?.titolo} className="campo text-lg" />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className="etichetta">Tipo</span>
            <select name="tipo" defaultValue={r?.tipo ?? "pasto"} className="campo">
              {TIPI.map((t) => (
                <option key={t} value={t}>
                  {ETICHETTA_TIPO[t]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="etichetta">Proteina principale</span>
            <select name="proteina" defaultValue={r?.proteina ?? ""} className="campo">
              <option value="">Non indicata</option>
              {PROTEINE.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="etichetta">Tempo</span>
            <select name="tempo" defaultValue={r?.tempo ?? ""} className="campo">
              <option value="">Non indicato</option>
              {TEMPI.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="etichetta">Link alla fonte (Instagram, sito…)</span>
          <input name="fonte_url" type="url" defaultValue={r?.fonte_url ?? ""} className="campo" placeholder="https://" />
        </label>
      </section>

      <section className="scheda space-y-4 p-4 sm:p-6">
        <h2 className="font-serif text-lg font-semibold">Ingredienti e procedimento</h2>
        <label className="block">
          <span className="etichetta">Ingredienti, uno per riga</span>
          <textarea
            name="ingredienti"
            rows={8}
            defaultValue={r?.ingredienti.join("\n")}
            className="campo font-mono text-sm"
            placeholder={"200 g ceci cotti\n1 zucchina\nOlio EVO e sale"}
          />
        </label>
        <label className="block">
          <span className="etichetta">Procedimento</span>
          <textarea
            name="procedimento"
            rows={8}
            defaultValue={r?.procedimento ?? ""}
            className="campo text-sm"
            placeholder={"1. Primo passaggio\n2. Secondo passaggio"}
          />
        </label>
        <label className="block">
          <span className="etichetta">Note</span>
          <textarea name="note" rows={3} defaultValue={r?.note ?? ""} className="campo text-sm" />
        </label>
      </section>

      <section className="scheda space-y-4 p-4 sm:p-6">
        <h2 className="font-serif text-lg font-semibold">Etichette</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <TreStati nome="ha_proteina" etichetta="Contiene proteina" valore={r?.ha_proteina} />
          <TreStati nome="ha_carboidrato" etichetta="Contiene carboidrato" valore={r?.ha_carboidrato} />
          <TreStati nome="ha_verdura" etichetta="Contiene verdura" valore={r?.ha_verdura} />
          <TreStati nome="adatta_asporto" etichetta="Da asporto" valore={r?.adatta_asporto} />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <label>
            <span className="etichetta">Senza glutine</span>
            <select name="senza_glutine" defaultValue={r?.senza_glutine ?? "no"} className="campo">
              <option value="no">No</option>
              <option value="si">Sì</option>
              <option value="da_verificare">Da verificare</option>
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2 pb-2 text-sm sm:col-span-3">
            {[
              ["vegana", "🌱 Vegana", r?.vegana],
              ["vegetariana", "Vegetariana", r?.vegetariana],
              ["scheda_parziale", "Scheda incompleta", r?.scheda_parziale],
              ["preferita", "★ Preferita", r?.preferita],
            ].map(([nome, etichetta, valore]) => (
              <label key={nome as string} className="flex items-center gap-1.5">
                <input type="checkbox" name={nome as string} defaultChecked={!!valore} className="accent-accento" />
                {etichetta}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="scheda space-y-3 p-4 sm:p-6">
        <h2 className="font-serif text-lg font-semibold">Foto</h2>
        <input name="foto" type="file" accept="image/*" className="block text-sm" />
        {r?.immagine_url && (
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="rimuovi_foto" className="accent-accento" /> Rimuovi la foto attuale
          </label>
        )}
        <p className="text-xs text-testo-tenue">Massimo 5 MB.</p>
      </section>

      {stato?.errore && <p className="text-sm text-red-700 dark:text-red-400">{stato.errore}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={inCorso} className="bottone-primario">
          {inCorso ? "Salvataggio…" : "Salva ricetta"}
        </button>
        <Link href={r ? `/ricette/${r.slug}` : "/"} className="bottone-secondario">
          Annulla
        </Link>
      </div>
    </form>
  );
}
