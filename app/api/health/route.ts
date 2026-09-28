import { json } from "@/src/lib/server/http";

import {requireApiSession} from "@/src/lib/server/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied=await requireApiSession(request);if(denied)return denied;
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
