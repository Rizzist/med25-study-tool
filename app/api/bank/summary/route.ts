import { badRequest, json } from "@/src/lib/server/http";
import { bankSummary } from "@/src/lib/server/study-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return json(bankSummary());
  } catch (error) {
    return badRequest(error);
  }
}
