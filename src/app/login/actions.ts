"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

function destinazioneSicura(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "/";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function accedi(_stato: { errore?: string } | undefined, form: FormData) {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { errore: "Email o password non corretti." };
  redirect(destinazioneSicura(form.get("next")));
}

export async function esci() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
