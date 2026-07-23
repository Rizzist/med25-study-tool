import { badRequest, json } from "@/src/lib/server/http";
import { questionSetByIds } from "@/src/lib/server/study-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return json(questionSetByIds(await request.json()));
  } catch (error) {
    return badRequest(error);
  }
}
