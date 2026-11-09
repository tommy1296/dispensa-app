// Accetta anche l'URL copiato dalla pagina Data API (…supabase.co/rest/v1/):
// al client serve solo l'origine del progetto.
const grezzo = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_URL = /^https?:\/\//.test(grezzo) ? new URL(grezzo).origin : grezzo;
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
