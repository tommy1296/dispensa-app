export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-protocol-version",
};

export function json(corpo: unknown, status = 200) {
  return Response.json(corpo, {
    status,
    headers: { ...CORS, "Cache-Control": "no-store" },
  });
}

export function opzioni() {
  return new Response(null, { status: 204, headers: CORS });
}
