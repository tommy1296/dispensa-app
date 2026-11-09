"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/** Ingredienti da spuntare mentre si cucina (la spunta non viene salvata). */
export function ListaIngredienti({ ingredienti }: { ingredienti: string[] }) {
  const [presi, setPresi] = useState<Set<number>>(new Set());
  return (
    <ul className="space-y-1">
      {ingredienti.map((i, n) => {
        const preso = presi.has(n);
        return (
          <li key={n}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 transition hover:bg-secondary">
              <Checkbox
                checked={preso}
                onCheckedChange={() =>
                  setPresi((p) => {
                    const nuovo = new Set(p);
                    if (nuovo.has(n)) nuovo.delete(n);
                    else nuovo.add(n);
                    return nuovo;
                  })
                }
                className="mt-0.5 rounded-full"
              />
              <span className={cn("transition", preso && "text-muted-foreground line-through")}>{i}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
