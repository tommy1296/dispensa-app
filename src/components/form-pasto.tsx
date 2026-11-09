"use client";

import { Loader2, Plus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { aggiungiPasto } from "@/app/(app)/storico/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function FormPasto({ titoli, oggi }: { titoli: string[]; oggi: string }) {
  const [stato, azione, inCorso] = useActionState(aggiungiPasto, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (stato?.ok) {
      form.current?.reset();
      toast.success("Pasto aggiunto allo storico");
    } else if (stato?.errore) {
      toast.error(stato.errore);
    }
  }, [stato]);

  return (
    <form ref={form} action={azione} className="grid gap-4 sm:grid-cols-6">
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="p-data">Data</Label>
        <Input id="p-data" type="date" name="data" defaultValue={oggi} required />
      </div>
      <div className="grid gap-1.5 sm:col-span-1">
        <Label htmlFor="p-pasto">Pasto</Label>
        <NativeSelect id="p-pasto" name="pasto" defaultValue="pranzo">
          <NativeSelectOption>colazione</NativeSelectOption>
          <NativeSelectOption>pranzo</NativeSelectOption>
          <NativeSelectOption>cena</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="grid gap-1.5 sm:col-span-3">
        <Label htmlFor="p-ricetta">Ricetta o piatto</Label>
        <Input id="p-ricetta" name="ricetta" list="titoli-ricette" required placeholder="Inizia a scrivere…" />
        <datalist id="titoli-ricette">
          {titoli.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="p-aggiunte">Aggiunte</Label>
        <Input id="p-aggiunte" name="aggiunte" placeholder="es. quinoa" />
      </div>
      <div className="grid gap-1.5 sm:col-span-1">
        <Label htmlFor="p-proteina">Proteina</Label>
        <Input id="p-proteina" name="proteina" />
      </div>
      <div className="grid gap-1.5 sm:col-span-1">
        <Label htmlFor="p-carboidrato">Carboidrato</Label>
        <Input id="p-carboidrato" name="carboidrato" />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="p-verdura">Verdura</Label>
        <Input id="p-verdura" name="verdura" />
      </div>
      <div className="sm:col-span-6">
        <Button disabled={inCorso} className="rounded-full">
          {inCorso ? <Loader2 className="animate-spin" /> : <Plus />}
          {inCorso ? "Salvataggio…" : "Aggiungi allo storico"}
        </Button>
      </div>
    </form>
  );
}
