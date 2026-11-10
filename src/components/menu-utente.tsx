"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { esci } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Cerchietto con l'iniziale dell'email: al clic apre il menu dell'account. */
export function MenuUtente({ email }: { email: string }) {
  const iniziale = email.trim().charAt(0).toUpperCase() || "?";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:ring-[3px] data-[state=open]:ring-primary/20"
        aria-label="Menu account"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary font-semibold text-primary-foreground">{iniziale}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary font-semibold text-primary-foreground">{iniziale}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Accesso effettuato come</p>
            <p className="truncate text-sm font-semibold" title={email}>
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-lg py-2 font-medium">
          <Link href="/impostazioni">
            <Settings /> Impostazioni
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="rounded-lg py-2 font-medium" onSelect={() => esci()}>
          <LogOut /> Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
