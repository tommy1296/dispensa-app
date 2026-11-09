"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { creaCodice, origine, risorsaMcp, trovaClient } from "@/lib/oauth";
import { utenteCorrente } from "@/lib/supabase/server";

export async function rispondi(form: FormData) {
  const campo = (k: string) => String(form.get(k) ?? "");
  const clientId = campo("client_id");
  const redirectUri = campo("redirect_uri");
  const state = campo("state");

  const client = await trovaClient(clientId);
  if (!client || !client.redirectUris.includes(redirectUri)) throw new Error("Richiesta non valida");
  const utente = await utenteCorrente();
  if (!utente) throw new Error("Sessione scaduta, rifai il login");

  const o = origine(await headers());
  const destinazione = new URL(redirectUri);
  if (state) destinazione.searchParams.set("state", state);
  destinazione.searchParams.set("iss", o);

  if (campo("decisione") !== "consenti") {
    destinazione.searchParams.set("error", "access_denied");
    redirect(destinazione.toString());
  }

  const codice = await creaCodice({
    utente: utente.id,
    clientId,
    redirectUri,
    codeChallenge: campo("code_challenge"),
    risorsa: risorsaMcp(o),
  });
  destinazione.searchParams.set("code", codice);
  redirect(destinazione.toString());
}
