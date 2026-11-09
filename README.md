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
