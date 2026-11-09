"use server";

import { revalidatePath } from "next/cache";
import { PASTI, eliminaPasto, registraPasto, type Pasto } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";

export type StatoStorico = { errore?: string; ok?: boolean } | undefined;

export async function aggiungiPasto(_stato: StatoStorico, form: FormData): Promise<StatoStorico> {
  const db = await supabaseServer();
  const titolo = String(form.get("ricetta") ?? "").trim();
  let slug: string | null = null;
  if (titolo) {
    const { data } = await db.from("ricette").select("slug").ilike("titolo", titolo).limit(1).maybeSingle();
    slug = data?.slug ?? null;
  }
  const pasto = String(form.get("pasto")) as Pasto;
  const aggiunte = String(form.get("aggiunte") ?? "").trim();
  try {
    await registraPasto(db, {
      data: String(form.get("data")),
      pasto: PASTI.includes(pasto) ? pasto : "pranzo",
      slug,
      piatto: slug ? (aggiunte ? `${titolo} + ${aggiunte}` : null) : [titolo, aggiunte].filter(Boolean).join(" + "),
      proteina: String(form.get("proteina") ?? ""),
      carboidrato: String(form.get("carboidrato") ?? ""),
      verdura: String(form.get("verdura") ?? ""),
    });
  } catch (e) {
    return { errore: (e as Error).message };
  }
  revalidatePath("/storico");
  return { ok: true };
}

export async function togliPasto(form: FormData) {
  const db = await supabaseServer();
  await eliminaPasto(db, Number(form.get("id")));
  revalidatePath("/storico");
}
