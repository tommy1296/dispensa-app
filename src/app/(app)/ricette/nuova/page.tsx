import { FormRicetta } from "@/components/form-ricetta";

export const metadata = { title: "Nuova ricetta · Dispensa" };

export default function NuovaRicetta() {
  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Nuova ricetta</h1>
      <FormRicetta />
    </main>
  );
}
