import { json, opzioni } from "@/lib/cors";
import { redirectValido, registraClient } from "@/lib/oauth";

/** Registrazione dinamica del client (RFC 7591), usata da Claude al primo collegamento. */
export async function POST(req: Request) {
  let corpo: { client_name?: unknown; redirect_uris?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return json({ error: "invalid_client_metadata", error_description: "JSON non valido" }, 400);
  }
  const uris = Array.isArray(corpo.redirect_uris) ? corpo.redirect_uris.filter((u) => typeof u === "string") : [];
  if (!uris.length || !uris.every(redirectValido)) {
    return json({ error: "invalid_redirect_uri", error_description: "redirect_uris mancanti o non validi" }, 400);
  }
  const nome = typeof corpo.client_name === "string" && corpo.client_name.trim() ? corpo.client_name.trim().slice(0, 100) : "Client MCP";
  const client = await registraClient(nome, uris);
  return json(
    {
      client_id: client.clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: client.nome,
      redirect_uris: client.redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    201,
  );
}

export const OPTIONS = opzioni;
