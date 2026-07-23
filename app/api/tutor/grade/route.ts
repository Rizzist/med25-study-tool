import { json } from "@/src/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST() {
  return json(
    {
      error: "Codex reasoning audits are available only in the local app.",
      code: "CODEX_LOCAL_ONLY",
    },
    { status: 501 },
  );
}
