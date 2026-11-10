import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OttimizzaFoto, PuliziaFoto } from "@/components/gestione-foto";
import { Button } from "@/components/ui/button";
import { ricetteConFotoDaOttimizzare } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Impostazioni · Dispensa" };

export default async function Impostazioni() {
  const db = await supabaseServer();
  const { totale } = await ricetteConFotoDaOttimizzare(db, { limite: 1 });

  return (
    <main className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-xl text-muted-foreground">
        <Link href="/">
          <ArrowLeft /> Tutte le ricette
        </Link>
      </Button>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Impostazioni</h1>

      <h2 id="foto" className="mt-8 scroll-mt-24 font-serif text-2xl font-semibold">Foto delle ricette</h2>
      <p className="mt-1 text-muted-foreground">Tutte nello stesso formato (4:3, WebP), leggere da caricare.</p>
      <div className="mt-4 space-y-4">
        <OttimizzaFoto totale={totale} />
        <PuliziaFoto />
      </div>
    </main>
  );
}
