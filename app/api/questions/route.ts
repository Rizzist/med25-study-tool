import { badRequest, json } from "@/src/lib/server/http";
import { questionSet } from "@/src/lib/server/study-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    return json(questionSet(new URL(request.url).searchParams));
  } catch (error) {
    return badRequest(error);
  }
}
