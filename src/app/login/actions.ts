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
  if (error) {
    // Visibile nei log di Vercel (Logs) per capire la causa.
    console.error("Login non riuscito:", error.status, error.code, error.message);
    const motivi: Record<string, string> = {
      invalid_credentials: "Email o password non corretti.",
      email_not_confirmed: "L'utente non è confermato: su Supabase confermalo o ricrealo con Auto Confirm User.",
    };
    return {
      errore:
        (error.code && motivi[error.code]) ||
        `Accesso non riuscito (${error.status ?? "rete"}): ${error.message}. Controlla le variabili Supabase su Vercel.`,
    };
  }
  redirect(destinazioneSicura(form.get("next")));
}

export async function esci() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
