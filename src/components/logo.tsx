import { CookingPot } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary to-[#d9814f] text-primary-foreground shadow-sm shadow-primary/30",
        grande ? "size-16 rounded-2xl" : "size-8 rounded-[10px]",
      )}
      aria-hidden
    >
      <CookingPot className={grande ? "size-8" : "size-[18px]"} />
    </span>
  );
}
