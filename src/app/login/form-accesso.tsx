"use client";

import { useActionState } from "react";
import { accedi } from "./actions";

export function FormAccesso({ next }: { next: string }) {
  const [stato, azione, inCorso] = useActionState(accedi, undefined);
  return (
    <form action={azione} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="etichetta">Email</span>
        <input name="email" type="email" autoComplete="email" required className="campo" />
      </label>
      <label className="block">
        <span className="etichetta">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="campo" />
      </label>
      {stato?.errore && <p className="text-sm text-red-700 dark:text-red-400">{stato.errore}</p>}
      <button type="submit" disabled={inCorso} className="bottone-primario w-full">
        {inCorso ? "Accesso…" : "Entra"}
      </button>
    </form>
  );
}
