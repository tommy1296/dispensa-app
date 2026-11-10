import { ArrowLeft, CircleAlert, CircleCheck, Send } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { CollegaBot } from "@/components/bot-telegram";
import { OttimizzaFoto, PuliziaFoto } from "@/components/gestione-foto";
import { Button } from "@/components/ui/button";
import { ricetteConFotoDaOttimizzare } from "@/lib/ricette";
import { origine } from "@/lib/oauth";
import { supabaseServer } from "@/lib/supabase/server";
import { PERCORSO_WEBHOOK, configTelegram, leggiWebhook, nomeBot, type InfoWebhook } from "@/lib/telegram";

export const metadata = { title: "Impostazioni · Dispensa" };

export default async function Impostazioni() {
  const db = await supabaseServer();
  const [{ totale }, telegram] = await Promise.all([ricetteConFotoDaOttimizzare(db, { limite: 1 }), statoTelegram()]);

  return (
    <main className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-xl text-muted-foreground">
        <Link href="/">
          <ArrowLeft /> Tutte le ricette
        </Link>
      </Button>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Impostazioni</h1>

      <h2 id="foto" className="mt-8 scroll-mt-24 font-serif text-2xl font-semibold">Foto delle ricette</h2>
      <p className="mt-1 text-muted-foreground">Tutte nello stesso formato (4:3, WebP), leggere da caricare.</p>
      <div className="mt-4 space-y-4">
        <OttimizzaFoto totale={totale} />
        <PuliziaFoto />
      </div>

      <h2 id="telegram" className="mt-10 scroll-mt-24 font-serif text-2xl font-semibold">Bot Telegram</h2>
      <p className="mt-1 text-muted-foreground">
        Mandi al bot il link di un post Instagram e lui lo salva tra le <Link href="/bozze" className="font-medium text-terracotta underline-offset-2 hover:underline">bozze</Link>, con didascalia e foto.
      </p>
      <section className="mt-4 space-y-3 rounded-[22px] border bg-card p-5 text-sm shadow-morbida sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-crema text-terracotta">
            <Send className="size-4" />
          </span>
          <h3 className="font-serif text-xl font-semibold">{telegram.bot ? `@${telegram.bot}` : "Il tuo bot"}</h3>
        </div>
        {telegram.mancanti.length > 0 ? (
          <p className="flex gap-2 text-muted-foreground">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-ambra" />
            <span>
              Mancano le variabili su Vercel: {telegram.mancanti.map((v, i) => (
                <span key={v}>
                  {i > 0 && ", "}
                  <code className="rounded bg-secondary px-1 py-0.5 text-xs">{v}</code>
                </span>
              ))}
              .{telegram.mancanti.includes("TELEGRAM_USER_ID") && telegram.mancanti.length === 1 && " Collega il bot e scrivigli: ti dirà il tuo id."}
            </span>
          </p>
        ) : null}
        {telegram.errore && (
          <p className="flex gap-2 text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {telegram.errore}
          </p>
        )}
        {telegram.webhook && (
          <p className="flex gap-2">
            {telegram.collegatoQui ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-ambra" />
            )}
            <span>
              {telegram.webhook.url ? (
                <>
                  {telegram.collegatoQui ? "Collegato a questo sito" : "Collegato a un altro indirizzo"}:{" "}
                  <code className="rounded bg-secondary px-1 py-0.5 text-xs break-all">{telegram.webhook.url}</code>
                </>
              ) : (
                "Non ancora collegato."
              )}
              {telegram.webhook.last_error_message && (
                <span className="mt-1 block text-muted-foreground">
                  Ultimo errore ({new Date((telegram.webhook.last_error_date ?? 0) * 1000).toLocaleString("it-IT")}):{" "}
                  {telegram.webhook.last_error_message}
                </span>
              )}
            </span>
          </p>
        )}
        {telegram.pronto && <CollegaBot collegato={telegram.collegatoQui} />}
      </section>
    </main>
  );
}

async function statoTelegram() {
  const { token, segreto, utente } = configTelegram();
  const mancanti = [
    !token && "TELEGRAM_BOT_TOKEN",
    !segreto && "TELEGRAM_WEBHOOK_SECRET",
    !utente && "TELEGRAM_USER_ID",
  ].filter((v): v is string => Boolean(v));
  const atteso = `${origine(await headers())}${PERCORSO_WEBHOOK}`;
  let webhook: InfoWebhook | null = null;
  let bot: string | null = null;
  let errore: string | null = null;
  if (token) {
    try {
      [webhook, bot] = await Promise.all([leggiWebhook(token), nomeBot(token)]);
    } catch (e) {
      errore = `Telegram non riconosce il token: ${(e as Error).message}`;
    }
  }
  return {
    mancanti,
    webhook,
    bot,
    errore,
    pronto: Boolean(token && segreto && !errore),
    collegatoQui: webhook?.url === atteso,
  };
}
