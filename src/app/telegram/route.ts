import { after } from "next/server";
import { creaBozzaDaInstagram, type EsitoBozza } from "@/lib/bozze";
import { codiceInstagram } from "@/lib/foto-instagram";
import { origine } from "@/lib/oauth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  configTelegram,
  html,
  inviaMessaggio,
  linkNelMessaggio,
  segnaInScrittura,
  segretoValido,
  type MessaggioTelegram,
} from "@/lib/telegram";

// Webhook del bot Telegram. Telegram chiama questo indirizzo a ogni messaggio
// mandato al bot, con il segreto concordato nell'intestazione
// X-Telegram-Bot-Api-Secret-Token. Si risponde subito 200 e il lavoro
// (lettura del post, foto, risposta in chat) continua dopo, con `after`.

export const maxDuration = 60;

const MAX_LINK = 5;

const AIUTO =
  "Mandami il link di un post o reel di Instagram (da Instagram: <b>Condividi → Telegram</b>, oppure copia il link) " +
  "e lo salvo come <b>bozza</b> nella Dispensa, con didascalia e foto.\n\n" +
  "Poi la completi dall'app, nella pagina <b>Bozze</b>, o chiedendo a Claude.";

export async function POST(request: Request) {
  const { token, segreto, utente } = configTelegram();
  if (!token || !segreto) return new Response("Bot non configurato", { status: 503 });
  if (!segretoValido(request.headers.get("x-telegram-bot-api-secret-token"), segreto)) {
    return new Response("Non autorizzato", { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as { message?: MessaggioTelegram } | null;
  const m = update?.message;
  if (!m?.from || m.chat.type !== "private") return new Response("ok");
  const sito = origine(request.headers, request.url);

  // Primo avvio: senza TELEGRAM_USER_ID il bot dice solo l'id di chi scrive, per configurarlo.
  if (!utente) {
    after(() =>
      inviaMessaggio(
        token,
        m.chat.id,
        `Il tuo id Telegram è <code>${m.from!.id}</code>.\nImpostalo su Vercel come <b>TELEGRAM_USER_ID</b> e rifai il deploy: da quel momento risponderò solo a te.`,
      ).catch(() => undefined),
    );
    return new Response("ok");
  }
  // Chiunque altro viene ignorato in silenzio.
  if (String(m.from.id) !== utente) return new Response("ok");

  after(() => gestisci(token, m, sito).catch((e) => console.error("Bot Telegram:", e)));
  return new Response("ok");
}

async function gestisci(token: string, m: MessaggioTelegram, sito: string) {
  const link = linkNelMessaggio(m);
  const instagram = [...new Map(link.filter((u) => codiceInstagram(u)).map((u) => [codiceInstagram(u), u])).values()];

  if (instagram.length === 0) {
    const testo = link.length
      ? "Per ora so salvare solo i link di post e reel di <b>Instagram</b>."
      : AIUTO;
    await inviaMessaggio(token, m.chat.id, testo, m.message_id);
    return;
  }

  await segnaInScrittura(token, m.chat.id);
  const db = supabaseAdmin();
  const righe: string[] = [];
  for (const url of instagram.slice(0, MAX_LINK)) {
    let esito: EsitoBozza;
    try {
      esito = await creaBozzaDaInstagram(db, url);
    } catch (e) {
      esito = { tipo: "errore", motivo: (e as Error).message };
    }
    righe.push(descrivi(esito, sito));
  }
  if (instagram.length > MAX_LINK) righe.push(`Ho preso solo i primi ${MAX_LINK} link: manda gli altri in un nuovo messaggio.`);
  await inviaMessaggio(token, m.chat.id, righe.join("\n\n"), m.message_id);
}

function descrivi(e: EsitoBozza, sito: string) {
  if (e.tipo === "errore") return `❌ Non sono riuscito a salvarla: ${html(e.motivo)}`;
  const link = `<a href="${sito}/ricette/${e.slug}">${html(e.titolo)}</a>`;
  if (e.tipo === "esistente") {
    return e.bozza ? `📝 È già tra le bozze: ${link}` : `📗 È già nella Dispensa: ${link}`;
  }
  const mancano = [!e.didascalia && "didascalia", !e.foto && "foto"].filter(Boolean).join(" e ");
  return (
    `✅ Salvata in bozza: ${link}` +
    (mancano ? `\n⚠️ Senza ${mancano}${e.avviso ? ` (${html(e.avviso)})` : ""}.` : "")
  );
}
