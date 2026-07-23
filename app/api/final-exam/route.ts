import { badRequest, json } from "@/src/lib/server/http";
import { finalExamSet, isExamId } from "@/src/lib/server/study-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const exam = new URL(request.url).searchParams.get("exam");
    if (!isExamId(exam)) throw new Error("A valid exam is required");
    return json(finalExamSet(exam));
  } catch (error) {
    return badRequest(error);
  }
}
