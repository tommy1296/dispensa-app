import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NonTrovato() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent text-primary">
        <SearchX className="size-7" />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight">Qui non c&apos;è niente</h1>
      <p className="mt-2 text-muted-foreground">La pagina che cerchi non esiste o la ricetta è stata eliminata.</p>
      <Button asChild className="mt-6 rounded-xl">
        <Link href="/">
          <ArrowLeft /> Torna alle ricette
        </Link>
      </Button>
    </main>
  );
}
