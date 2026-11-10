"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { collegaBotTelegram } from "@/app/(app)/impostazioni/actions";
import { Button } from "@/components/ui/button";

/** Pulsante che registra il webhook del bot su Telegram. */
export function CollegaBot({ collegato }: { collegato: boolean }) {
  const [inCorso, setInCorso] = useState(false);
  const router = useRouter();

  async function collega() {
    setInCorso(true);
    try {
      const esito = await collegaBotTelegram();
      if (esito.ok) toast.success(esito.messaggio);
      else toast.error(esito.messaggio);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setInCorso(false);
    }
  }

  return (
    <Button onClick={collega} disabled={inCorso} variant={collegato ? "outline" : "default"} className="rounded-xl">
      {inCorso ? <Loader2 className="animate-spin" /> : <Send />}
      {collegato ? "Ricollega a questo sito" : "Collega il bot"}
    </Button>
  );
}
