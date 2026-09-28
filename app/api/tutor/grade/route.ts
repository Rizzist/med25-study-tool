import { json } from "@/src/lib/server/http";

import {requireApiSession} from "@/src/lib/server/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied=await requireApiSession(request);if(denied)return denied;
  return json(
    {
      error: "Tutor integration has been retired. Use question explanations and review sections.",
      code: "FEATURE_RETIRED",
    },
    { status: 410 },
  );
}
