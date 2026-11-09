import { json, opzioni } from "@/lib/cors";
import { origine } from "@/lib/oauth";

export function GET(req: Request) {
  const o = origine(req.headers, req.url);
  return json({
    issuer: o,
    authorization_endpoint: `${o}/oauth/authorize`,
    token_endpoint: `${o}/oauth/token`,
    registration_endpoint: `${o}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["ricette"],
    client_id_metadata_document_supported: true,
  });
}

export const OPTIONS = opzioni;
