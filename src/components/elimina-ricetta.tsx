"use client";

import { Trash2 } from "lucide-react";
import { cancellaRicetta } from "@/app/(app)/ricette/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function EliminaRicetta({ slug, titolo }: { slug: string; titolo: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 /> Elimina ricetta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare «{titolo}»?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;eliminazione è definitiva e non si può annullare.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <form action={cancellaRicetta}>
            <input type="hidden" name="slug" value={slug} />
            <Button type="submit" variant="destructive" className="w-full sm:w-auto">
              <Trash2 /> Elimina
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
