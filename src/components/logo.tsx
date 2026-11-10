import { Salad } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center bg-primary text-lime dark:bg-lime dark:text-[#142019]",
        grande ? "size-16 rounded-[22px]" : "size-9 rounded-xl",
      )}
      aria-hidden
    >
      <Salad className={grande ? "size-8" : "size-5"} strokeWidth={2.25} />
    </span>
  );
}
