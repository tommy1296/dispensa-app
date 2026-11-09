import { json, opzioni } from "@/lib/cors";
import { origine, risorsaMcp } from "@/lib/oauth";

export function GET(req: Request) {
  const o = origine(req.headers, req.url);
  return json({
    resource: risorsaMcp(o),
    authorization_servers: [o],
    scopes_supported: ["ricette"],
    bearer_methods_supported: ["header"],
    resource_name: "Dispensa",
  });
}

export const OPTIONS = opzioni;
