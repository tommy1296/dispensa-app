import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aggiornaRicetta, creaRicetta, ricettaDaPostInstagram } from "./ricette";
import { codiceInstagram, leggiPostInstagram, salvaImmagineInstagram } from "./foto-instagram";

// Bozze di ricette create da un link Instagram (per ora dal bot Telegram).
// Si salvano didascalia e copertina del post; se la didascalia ha le sezioni
// "Ingredienti" e "Procedimento" si prova a dividerle, senza AI: il resto si
// completa a mano nell'app o chiedendo a Claude.

const TITOLO_MAX = 90;

/** Toglie emoji, hashtag e menzioni da una riga, per usarla come titolo. */
function rigaPulita(riga: string) {
  return riga
    .replace(/[#@][\p{L}\p{N}_.]+/gu, "")
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—*•:|.,!]+|[\s\-–—*•:|,]+$/g, "")
    .trim();
}

function tronca(testo: string, max: number) {
  if (testo.length <= max) return testo;
  const taglio = testo.slice(0, max);
  const spazio = taglio.lastIndexOf(" ");
  return `${(spazio > max * 0.6 ? taglio.slice(0, spazio) : taglio).trim()}…`;
}

/** Titolo provvisorio: la prima riga sensata della didascalia. */
export function titoloDaDidascalia(didascalia: string | null, autore: string | null) {
  for (const riga of (didascalia ?? "").split("\n")) {
    const pulita = rigaPulita(riga);
    if (pulita.length >= 4 && !/^ingredient/i.test(pulita)) return tronca(pulita, TITOLO_MAX);
  }
  return autore ? `Ricetta da Instagram (@${autore})` : "Ricetta da Instagram";
}

const INTESTAZIONE_INGREDIENTI = /^\W*ingredienti\b[^\n]*$/i;
const INTESTAZIONE_PROCEDIMENTO = /^\W*(procedimento|preparazione|come si fa|metodo|istruzioni|passaggi)\b[^\n]*$/i;

/**
 * Divide la didascalia in ingredienti e procedimento se trova le intestazioni.
 * Senza intestazioni restituisce ingredienti vuoti e tutta la didascalia come procedimento.
 */
export function dividiDidascalia(didascalia: string | null) {
  const righe = (didascalia ?? "").split("\n");
  const iIng = righe.findIndex((r) => INTESTAZIONE_INGREDIENTI.test(rigaPulita(r) || r));
  if (iIng < 0) return { ingredienti: [] as string[], procedimento: didascalia?.trim() || null };

  const iProc = righe.findIndex((r, i) => i > iIng && INTESTAZIONE_PROCEDIMENTO.test(rigaPulita(r) || r));
  const fine = iProc < 0 ? righe.length : iProc;
  const ingredienti: string[] = [];
  let resto = fine;
  for (let i = iIng + 1; i < fine; i++) {
    const r = righe[i].replace(/^\s*(?:[-*•▪️◦·]|\d+[.)])\s*/u, "").trim();
    if (!r) {
      // Una riga vuota dopo qualche ingrediente chiude l'elenco se non c'è un'intestazione del procedimento.
      if (ingredienti.length && iProc < 0) {
        resto = i;
        break;
      }
      continue;
    }
    if (/^#/.test(r)) continue;
    ingredienti.push(r);
  }

  // Il testo prima degli ingredienti si tiene solo se è più del titolo.
  const intro = righe.slice(0, iIng).filter((r) => r.trim());
  const prima = intro.length > 1 ? intro.join("\n").trim() : "";
  const dopo = righe
    .slice(iProc < 0 ? resto : iProc + 1)
    .join("\n")
    .trim();
  const procedimento = [dopo, prima && `Dalla didascalia:\n${prima}`].filter(Boolean).join("\n\n") || null;
  return { ingredienti, procedimento };
}

export type EsitoBozza =
  | { tipo: "creata"; slug: string; titolo: string; foto: boolean; didascalia: boolean; avviso?: string }
  | { tipo: "esistente"; slug: string; titolo: string; bozza: boolean }
  | { tipo: "errore"; motivo: string };

/** Crea una bozza dal link di un post o reel Instagram. Se esiste già una ricetta con quel post, non la duplica. */
export async function creaBozzaDaInstagram(db: SupabaseClient, url: string): Promise<EsitoBozza> {
  const codice = codiceInstagram(url);
  if (!codice) return { tipo: "errore", motivo: "Il link non è un post o reel di Instagram." };

  const esistente = await ricettaDaPostInstagram(db, codice);
  if (esistente) return { tipo: "esistente", ...esistente };

  let post: Awaited<ReturnType<typeof leggiPostInstagram>> | null = null;
  let avviso: string | undefined;
  try {
    post = await leggiPostInstagram(codice);
  } catch (e) {
    avviso =
      (e as Error).name === "TimeoutError" ? "Instagram non ha risposto in tempo." : "Instagram non ha mostrato il post.";
  }
  if (post && !post.didascalia && !post.immagine) avviso = "Instagram non ha mostrato il post (privato, rimosso o richiesta bloccata).";

  const { ingredienti, procedimento } = dividiDidascalia(post?.didascalia ?? null);
  const ricetta = await creaRicetta(db, {
    titolo: titoloDaDidascalia(post?.didascalia ?? null, post?.autore ?? null),
    tipo: "pasto",
    bozza: true,
    scheda_parziale: true,
    ingredienti,
    procedimento,
    note: post?.autore ? `Post di @${post.autore}` : null,
    fonte_tipo: "instagram",
    fonte_url: `https://www.instagram.com/p/${codice}/`,
  });

  let foto = false;
  if (post?.immagine) {
    const esito = await salvaImmagineInstagram(db, ricetta.slug, post.immagine);
    if (esito.ok) foto = Boolean(await aggiornaRicetta(db, ricetta.slug, { immagine_url: esito.url }));
    else avviso ??= `Foto non salvata: ${esito.motivo}`;
  }

  return { tipo: "creata", slug: ricetta.slug, titolo: ricetta.titolo, foto, didascalia: Boolean(post?.didascalia), avviso };
}
