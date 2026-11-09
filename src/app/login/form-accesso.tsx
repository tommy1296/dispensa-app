"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accedi } from "./actions";

export function FormAccesso({ next }: { next: string }) {
  const [stato, azione, inCorso] = useActionState(accedi, undefined);
  return (
    <form action={azione} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-10" />
      </div>
      {stato?.errore && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{stato.errore}</p>
      )}
      <Button type="submit" disabled={inCorso} size="lg" className="w-full rounded-full">
        {inCorso && <Loader2 className="animate-spin" />}
        {inCorso ? "Accesso…" : "Entra"}
      </Button>
    </form>
  );
}
