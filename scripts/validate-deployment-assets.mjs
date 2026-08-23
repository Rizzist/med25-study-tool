import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalogPath = resolve(root, "data/bank/biochemistry-core-concepts.json");
const embeddedBankPath = resolve(root, "data/bank/embedded-bank.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const embeddedBank = JSON.parse(readFileSync(embeddedBankPath, "utf8"));
const concepts = catalog.chapters?.flatMap((chapter) => chapter.concepts ?? []) ?? [];
const selectedQuestionIds = concepts.flatMap((concept) => concept.selectedQuestionIds ?? []);
const questionById = new Map((embeddedBank.questions ?? []).map((question) => [question.id, question]));

assert(catalog.schemaVersion === "1.0.0", "Unsupported biochemistry concept catalog schema");
assert(catalog.chapterCount === catalog.chapters?.length, "Biochemistry catalog chapter count is stale");
assert(catalog.conceptCount === concepts.length, "Biochemistry catalog concept count is stale");
assert(catalog.questionCount === selectedQuestionIds.length, "Biochemistry catalog question count is stale");
assert(new Set(selectedQuestionIds).size === selectedQuestionIds.length, "Biochemistry catalog repeats selected question IDs");
assert(concepts.every((concept) => concept.selectedQuestionIds?.length >= 2 && concept.selectedQuestionIds.length <= 3), "Every biochemistry concept must have 2–3 questions");

for (const questionId of selectedQuestionIds) {
  const question = questionById.get(questionId);
  assert(question, `Embedded bank is missing curated question ${questionId}`);
  assert(question.status === "verified", `Curated question ${questionId} is not verified`);
  assert(question.subject === "biochemistry", `Curated question ${questionId} is not biochemistry`);
}

assert(Array.isArray(embeddedBank.finalExams?.july25), "Embedded July 25 final exam is missing");
assert(Array.isArray(embeddedBank.finalExams?.july29), "Embedded August 25 final exam is missing");

console.log(`Deployment assets valid: ${catalog.chapterCount} chapters, ${catalog.conceptCount} concepts, ${catalog.questionCount} curated questions, ${embeddedBank.questions.length} embedded questions.`);
