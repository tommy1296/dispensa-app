import Link from "next/link";
import { esci } from "@/app/login/actions";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-bordo bg-sfondo/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 sm:gap-3">
          <Link href="/" className="mr-auto flex items-center gap-2 font-serif text-xl font-semibold">
            <span aria-hidden>🫙</span> Dispensa
          </Link>
          <Link href="/" className="rounded-lg px-2 py-1 text-sm hover:bg-superficie-2 sm:px-3">
            Ricette
          </Link>
          <Link href="/storico" className="rounded-lg px-2 py-1 text-sm hover:bg-superficie-2 sm:px-3">
            Storico
          </Link>
          <Link href="/ricette/nuova" className="bottone-primario px-3 py-1.5 text-sm">
            <span aria-hidden>＋</span>
            <span className="hidden sm:inline">Nuova</span>
          </Link>
          <form action={esci}>
            <button className="rounded-lg px-2 py-1 text-sm text-testo-tenue hover:bg-superficie-2" title="Esci">
              Esci
            </button>
          </form>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">{children}</div>
    </>
  );
}
