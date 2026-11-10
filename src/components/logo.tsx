import { CookingPot } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-inchiostro text-[#f6f2ea] ring-4 ring-inchiostro/10",
        grande ? "size-16" : "size-9",
      )}
      aria-hidden
    >
      <CookingPot className={grande ? "size-7" : "size-[18px]"} />
    </span>
  );
}
