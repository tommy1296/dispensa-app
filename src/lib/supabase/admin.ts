import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Client con la chiave segreta: salta le regole di accesso del database.
 * Usato solo dal server MCP, dopo aver verificato il token di Claude.
 */
export function supabaseAdmin() {
  const chiave = process.env.SUPABASE_SECRET_KEY;
  if (!chiave) throw new Error("Manca la variabile SUPABASE_SECRET_KEY");
  return createClient(SUPABASE_URL, chiave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
