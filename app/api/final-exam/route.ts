import { badRequest, json } from "@/src/lib/server/http";
import {
  defaultFinalExamBank,
  finalExamSet,
  isExamId,
  isFinalExamBankId,
} from "@/src/lib/server/study-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const exam = searchParams.get("exam");
    if (!isExamId(exam)) throw new Error("A valid exam is required");
    const requestedBank = searchParams.get("bank");
    const bank = requestedBank === null ? defaultFinalExamBank(exam) : requestedBank;
    if (!isFinalExamBankId(bank)) throw new Error("A valid final-exam bank is required");
    const payload=finalExamSet(exam,bank);
    const etag='"'+payload.fingerprint+'"';
    const headers={'etag':etag,'cache-control':'private, no-cache'};
    if(request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers});
    return json(payload,{headers});
  } catch (error) {
    return badRequest(error);
  }
}
