@AGENTS.md

# Dispensa

- Lingua del codice e dell'interfaccia: italiano (nomi di funzioni, colonne, testi).
- Le query stanno in `src/lib/ricette.ts` e sono usate sia dalla web app (client Supabase con la sessione dell'utente, soggetto a RLS) sia dal server MCP (client con chiave segreta, dopo la verifica del token OAuth).
- I valori ammessi di `tipo`, `proteina`, `tempo`, `senza_glutine` sono duplicati in `supabase/schema.sql` (vincoli check) e in `src/lib/ricette.ts`: cambiali insieme.
- Lo schema si applica a mano dall'SQL Editor di Supabase; `supabase/schema.sql` deve restare rieseguibile.
- Mai committare dati personali (import SQL, `.env*`).
- Prima di pubblicare: `npx tsc --noEmit`, `npx eslint src`, `npm run build`.
