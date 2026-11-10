"use client";

import { BookOpen, CalendarDays, Heart, Plus, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const VOCI: { href: string; nome: string; icona: LucideIcon }[] = [
  { href: "/", nome: "Ricette", icona: BookOpen },
  { href: "/preferiti", nome: "Preferite", icona: Heart },
  { href: "/storico", nome: "Storico", icona: CalendarDays },
  { href: "/impostazioni", nome: "Impostazioni", icona: Settings },
];

function attiva(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || (pathname.startsWith("/ricette/") && pathname !== "/ricette/nuova") : pathname.startsWith(href);
}

/** Link della barra in alto, visibili da tablet in su. */
export function NavigazioneDesktop() {
  const pathname = usePathname();
  return (
    <div className="hidden items-center gap-1 md:flex">
      {VOCI.map(({ href, nome, icona: Icona }) => (
        <Link
          key={href}
          href={href}
          title={nome}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground",
            attiva(pathname, href) && "bg-inchiostro text-white hover:bg-inchiostro hover:text-white",
          )}
        >
          <Icona className="size-4" />
          {/* Impostazioni solo icona sui tablet, per non affollare la barra. */}
          <span className={cn(href === "/impostazioni" && "sr-only lg:not-sr-only")}>{nome}</span>
        </Link>
      ))}
    </div>
  );
}

/** Barra in basso sul telefono, con il pulsante centrale per una nuova ricetta. */
export function NavigazioneMobile() {
  const pathname = usePathname();
  const voci = [VOCI[0], VOCI[1], null, VOCI[2], VOCI[3]];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-[#fbf8f2]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-1">
        {voci.map((v) =>
          v ? (
            <Link
              key={v.href}
              href={v.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground transition",
                attiva(pathname, v.href) && "text-terracotta",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition",
                  attiva(pathname, v.href) && "bg-terracotta-tenue",
                )}
              >
                <v.icona className={cn("size-5", attiva(pathname, v.href) && v.href === "/preferiti" && "fill-current")} />
              </span>
              {v.nome}
            </Link>
          ) : (
            <Link
              key="nuova"
              href="/ricette/nuova"
              className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition active:scale-95"
              aria-label="Nuova ricetta"
            >
              <Plus className="size-6" />
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
