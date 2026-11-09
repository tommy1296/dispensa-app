import { notFound } from "next/navigation";
import { FormRicetta } from "@/components/form-ricetta";
import { leggiRicetta } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";

export default async function ModificaRicetta({ params }: PageProps<"/ricette/[slug]/modifica">) {
  const { slug } = await params;
  const ricetta = await leggiRicetta(await supabaseServer(), slug);
  if (!ricetta) notFound();
  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Modifica ricetta</h1>
      <FormRicetta ricetta={ricetta} />
    </main>
  );
}
