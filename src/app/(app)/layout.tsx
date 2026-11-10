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
      <header className="sticky top-0 z-20 px-3 pt-3 sm:px-4">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-[22px] bg-card/90 pr-2.5 pl-3 shadow-morbida backdrop-blur-xl sm:pl-4">
          <Link href="/" className="mr-auto flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <Logo /> Dispensa
          </Link>
          <NavigazioneDesktop />
          <Button
            asChild
            className="ml-2 hidden h-10 rounded-full bg-lime px-4 font-semibold text-[#142019] hover:bg-lime/85 md:inline-flex"
          >
            <Link href="/ricette/nuova">
              <Plus /> Nuova ricetta
            </Link>
          </Button>
          <form action={esci}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/70"
                  aria-label="Esci"
                >
                  <LogOut />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Esci</TooltipContent>
            </Tooltip>
          </form>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-28 md:pb-16">{children}</div>
      <NavigazioneMobile />
    </>
  );
}
