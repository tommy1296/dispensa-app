import { FormAccesso } from "./form-accesso";

export const metadata = { title: "Accedi · Dispensa" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <div className="text-5xl">🫙</div>
        <h1 className="mt-3 font-serif text-3xl font-semibold">Dispensa</h1>
        <p className="mt-1 text-sm text-testo-tenue">Il ricettario di casa</p>
      </div>
      <div className="scheda p-6">
        <FormAccesso next={typeof next === "string" ? next : "/"} />
      </div>
    </main>
  );
}
