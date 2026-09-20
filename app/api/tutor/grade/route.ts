import { json } from "@/src/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST() {
  return json(
    {
      error: "Tutor integration has been retired. Use question explanations and review sections.",
      code: "FEATURE_RETIRED",
    },
    { status: 410 },
  );
}
