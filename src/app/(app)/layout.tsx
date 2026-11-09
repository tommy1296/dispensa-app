import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { esci } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { NavigazioneDesktop, NavigazioneMobile } from "@/components/navigazione";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <Link href="/" className="mr-auto flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight">
            <Logo /> Dispensa
          </Link>
          <NavigazioneDesktop />
          <Button asChild className="ml-2 hidden rounded-full md:inline-flex">
            <Link href="/ricette/nuova">
              <Plus /> Nuova ricetta
            </Link>
          </Button>
          <form action={esci}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" aria-label="Esci">
                  <LogOut />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Esci</TooltipContent>
            </Tooltip>
          </form>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:pb-16">{children}</div>
      <NavigazioneMobile />
    </>
  );
}
