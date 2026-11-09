"use client";

import { useActionState, useEffect, useRef } from "react";
import { aggiungiPasto } from "@/app/(app)/storico/actions";

export function FormPasto({ titoli, oggi }: { titoli: string[]; oggi: string }) {
  const [stato, azione, inCorso] = useActionState(aggiungiPasto, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (stato?.ok) form.current?.reset();
  }, [stato]);

  return (
    <form ref={form} action={azione} className="grid gap-3 sm:grid-cols-6">
      <label className="sm:col-span-2">
        <span className="etichetta">Data</span>
        <input type="date" name="data" defaultValue={oggi} required className="campo" />
      </label>
      <label className="sm:col-span-1">
        <span className="etichetta">Pasto</span>
        <select name="pasto" defaultValue="pranzo" className="campo">
          <option>colazione</option>
          <option>pranzo</option>
          <option>cena</option>
        </select>
      </label>
      <label className="sm:col-span-3">
        <span className="etichetta">Ricetta o piatto</span>
        <input name="ricetta" list="titoli-ricette" required className="campo" placeholder="Inizia a scrivere…" />
        <datalist id="titoli-ricette">
          {titoli.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </label>
      <label className="sm:col-span-2">
        <span className="etichetta">Aggiunte</span>
        <input name="aggiunte" className="campo" placeholder="es. quinoa" />
      </label>
      <label className="sm:col-span-1">
        <span className="etichetta">Proteina</span>
        <input name="proteina" className="campo" />
      </label>
      <label className="sm:col-span-1">
        <span className="etichetta">Carboidrato</span>
        <input name="carboidrato" className="campo" />
      </label>
      <label className="sm:col-span-2">
        <span className="etichetta">Verdura</span>
        <input name="verdura" className="campo" />
      </label>
      <div className="flex items-center gap-3 sm:col-span-6">
        <button disabled={inCorso} className="bottone-primario">
          {inCorso ? "Salvataggio…" : "Aggiungi allo storico"}
        </button>
        {stato?.errore && <span className="text-sm text-red-700 dark:text-red-400">{stato.errore}</span>}
        {stato?.ok && <span className="text-sm text-verde">Aggiunto.</span>}
      </div>
    </form>
  );
}
