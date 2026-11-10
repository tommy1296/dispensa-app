import { Plus } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { MenuUtente } from "@/components/menu-utente";
import { NavigazioneDesktop, NavigazioneMobile } from "@/components/navigazione";
import { Button } from "@/components/ui/button";
import { utenteCorrente } from "@/lib/supabase/server";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const utente = await utenteCorrente();
  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-[#fbf8f2]/90 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <Link href="/" className="mr-auto flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight">
            <Logo /> Dispensa
          </Link>
          <NavigazioneDesktop />
          <Button asChild className="ml-3 hidden h-9 rounded-xl px-4 font-semibold shadow-sm md:inline-flex">
            <Link href="/ricette/nuova">
              <Plus /> Nuova ricetta
            </Link>
          </Button>
          <div className="ml-2">
            <MenuUtente email={utente?.email ?? ""} />
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-28 md:pb-16">{children}</div>
      <NavigazioneMobile />
    </>
  );
}
