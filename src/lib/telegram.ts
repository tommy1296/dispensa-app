import "server-only";
import { timingSafeEqual } from "node:crypto";

// Bot Telegram per salvare ricette in bozza mandando un link Instagram.
// Variabili d'ambiente (solo su Vercel, mai nel codice):
//   TELEGRAM_BOT_TOKEN       token dato da @BotFather
//   TELEGRAM_WEBHOOK_SECRET  stringa casuale: Telegram la rimanda in ogni chiamata al webhook
//   TELEGRAM_USER_ID         il tuo id numerico: il bot risponde solo a te

export const PERCORSO_WEBHOOK = "/telegram";

export function configTelegram() {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN?.trim() || null,
    segreto: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || null,
    utente: process.env.TELEGRAM_USER_ID?.trim() || null,
  };
}

/** Confronto a tempo costante del segreto mandato da Telegram nell'intestazione. */
export function segretoValido(ricevuto: string | null, atteso: string) {
  if (!ricevuto) return false;
  const a = Buffer.from(ricevuto);
  const b = Buffer.from(atteso);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function chiamaApi<T = unknown>(token: string, metodo: string, corpo: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const dati = (await r.json().catch(() => null)) as { ok: boolean; result?: T; description?: string } | null;
  if (!dati?.ok) throw new Error(dati?.description ?? `Telegram ha risposto ${r.status}`);
  return dati.result as T;
}

/** Risponde in chat. Il testo usa l'HTML di Telegram (<b>, <i>, <a>). */
export async function inviaMessaggio(token: string, chatId: number, testo: string, rispondiA?: number) {
  return chiamaApi(token, "sendMessage", {
    chat_id: chatId,
    text: testo,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(rispondiA ? { reply_parameters: { message_id: rispondiA, allow_sending_without_reply: true } } : {}),
  });
}

export async function segnaInScrittura(token: string, chatId: number) {
  await chiamaApi(token, "sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => undefined);
}

export interface InfoWebhook {
  url: string;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
}

export async function leggiWebhook(token: string) {
  return chiamaApi<InfoWebhook>(token, "getWebhookInfo", {});
}

export async function impostaWebhook(token: string, url: string, segreto: string) {
  await chiamaApi(token, "setWebhook", {
    url,
    secret_token: segreto,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  await chiamaApi(token, "setMyCommands", {
    commands: [{ command: "start", description: "Come si usa" }],
  }).catch(() => undefined);
}

export async function nomeBot(token: string) {
  const me = await chiamaApi<{ username?: string }>(token, "getMe", {});
  return me.username ?? null;
}

/** Escape per i testi in parse_mode HTML. */
export function html(testo: string) {
  return testo.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Messaggi in arrivo
// ---------------------------------------------------------------------------

interface Entita {
  type: string;
  offset: number;
  length: number;
  url?: string;
}

export interface MessaggioTelegram {
  message_id: number;
  from?: { id: number; first_name?: string };
  chat: { id: number; type: string };
  text?: string;
  caption?: string;
  entities?: Entita[];
  caption_entities?: Entita[];
}

/** Tutti i link presenti nel messaggio (testo, didascalia, link nascosti dietro una parola). */
export function linkNelMessaggio(m: MessaggioTelegram) {
  const trovati = new Set<string>();
  for (const [testo, entita] of [
    [m.text, m.entities],
    [m.caption, m.caption_entities],
  ] as const) {
    if (!testo) continue;
    for (const e of entita ?? []) {
      if (e.type === "text_link" && e.url) trovati.add(e.url);
      // Gli offset di Telegram sono in unità UTF-16, come le stringhe JavaScript.
      if (e.type === "url") trovati.add(testo.slice(e.offset, e.offset + e.length));
    }
    for (const u of testo.match(/https?:\/\/[^\s<>"]+/gi) ?? []) trovati.add(u);
  }
  return [...trovati];
}
