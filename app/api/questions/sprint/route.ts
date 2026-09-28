import { badRequest, json } from "@/src/lib/server/http";
import { coverageQuestionSet } from "@/src/lib/server/study-bank";

import {requireApiSession} from "@/src/lib/server/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied=await requireApiSession(request);if(denied)return denied;
  try {
    return json(coverageQuestionSet(await request.json()));
  } catch (error) {
    return badRequest(error);
  }
}
