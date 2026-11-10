# Dispensa

Ricettario personale: una web app per sfogliare e gestire le ricette, e un server
MCP che permette a Claude di cercarle, aggiungerle e registrare i pasti scelti.

- **Web app**: Next.js 16 (App Router) su Vercel.
- **Dati, login e foto**: Supabase (Postgres + Auth + Storage).
- **Server MCP**: `/mcp` nella stessa app, protetto da OAuth (login Supabase).

## Struttura

| Percorso | Cosa contiene |
|---|---|
| `supabase/schema.sql` | Tabelle `ricette` e `storico_pasti`, ricerca, regole di accesso, bucket foto |
| `scripts/genera_import.py` | Genera l'SQL di import da una cartella di ricette Markdown |
| `src/lib/ricette.ts` | Query condivise da web app e server MCP |
| `src/lib/oauth.ts` | Server OAuth minimo per il connettore Claude (token JWT firmati) |
| `src/app/mcp/route.ts` | Strumenti MCP |
| `src/app/telegram/route.ts` | Webhook del bot Telegram (link Instagram → bozza) |
| `src/app/(app)/` | Pagine della web app |

## Strumenti MCP

| Strumento | A cosa serve |
|---|---|
| `cerca_ricette` | Testo libero e filtri (tipo, proteina, tempo, asporto, pasto completo, ingredienti…) |
| `leggi_ricetta` | Scheda completa |
| `aggiungi_ricetta` | Nuova ricetta |
| `modifica_ricetta` | Aggiorna i campi indicati |
| `registra_pasto` | Aggiunge un pasto allo storico |
| `storico_pasti` | Ultimi pasti e conteggio carne rossa/affettati del mese |

## Messa in funzione

1. **Supabase**: crea il progetto, poi in *SQL Editor* esegui `supabase/schema.sql`
   ed eventualmente l'SQL di import delle ricette.
2. **Utente**: in *Authentication > Users* crea il tuo utente con email e password
   (*Add user > Create new user*, spunta *Auto Confirm User*). Poi in
   *Authentication > Sign In / Providers* disattiva *Allow new users to sign up*.
3. **Vercel**: importa il repository e imposta le variabili di `.env.example`.
4. **Claude**: su claude.ai, *Impostazioni > Connettori > Aggiungi connettore personalizzato*,
   URL `https://<tuo-dominio>.vercel.app/mcp`.

## Bot Telegram (facoltativo)

Mandi al bot il link di un post o reel Instagram e lui crea una **bozza** con
didascalia e copertina. Le bozze stanno nella pagina *Bozze* e restano fuori dalla
ricerca (e dalle proposte di Claude) finché non le completi.

1. Su Telegram scrivi a **@BotFather** → `/newbot` → scegli nome e username. Copia il token.
2. Su Vercel (*Settings > Environment Variables*) aggiungi `TELEGRAM_BOT_TOKEN` e
   `TELEGRAM_WEBHOOK_SECRET` (stringa casuale), poi rifai il deploy.
3. Nell'app, *Impostazioni > Bot Telegram > Collega il bot*.
4. Scrivi al bot: ti risponde con il tuo id. Mettilo in `TELEGRAM_USER_ID` su Vercel e
   rifai il deploy. Da lì il bot risponde solo a te.

## Sviluppo in locale

```bash
cp .env.example .env.local   # e compila i valori
npm install
npm run dev
```

Per rigenerare l'import da una cartella di ricette Markdown:

```bash
python3 scripts/genera_import.py percorso/ricette percorso/storico-pasti.md > import.sql
```

L'SQL di import contiene i dati personali: non va committato.
