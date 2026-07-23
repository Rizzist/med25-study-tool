import { badRequest, json } from "@/src/lib/server/http";
import { coverageQuestionSet } from "@/src/lib/server/study-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return json(coverageQuestionSet(await request.json()));
  } catch (error) {
    return badRequest(error);
  }
}
