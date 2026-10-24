export const dynamic = "force-dynamic";

// The server's clock, so phones with a wrong clock still show correct timers.
export function GET() {
  return Response.json({ now: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}
