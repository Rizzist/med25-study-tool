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
    const bank = requestedBank === null ? defaultFinalExamBank() : requestedBank;
    if (!isFinalExamBankId(bank)) throw new Error("A valid final-exam bank is required");
    return json(finalExamSet(exam, bank));
  } catch (error) {
    return badRequest(error);
  }
}
