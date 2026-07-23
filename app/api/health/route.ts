import { json } from "@/src/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return json({
    ok: true,
    service: "med25-vercel-api",
    codex: {
      available: false,
      version: null,
      message: "Codex reasoning audits are available only in the local app.",
    },
  });
}
