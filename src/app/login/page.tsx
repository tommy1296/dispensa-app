import { Logo } from "@/components/logo";
import { FormAccesso } from "./form-accesso";

export const metadata = { title: "Accedi · Dispensa" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)]"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo grande />
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight">Dispensa</h1>
          <p className="mt-1 text-muted-foreground">Il ricettario di casa</p>
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-xl shadow-primary/5">
          <FormAccesso next={typeof next === "string" ? next : "/"} />
        </div>
      </div>
    </main>
  );
}
