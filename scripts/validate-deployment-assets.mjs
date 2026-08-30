import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { auditRespiratoryCatalog } from "../src/lib/respiratory/audit.mjs";

const root = resolve(import.meta.dirname, "..");
const catalogPath = resolve(root, "data/bank/biochemistry-core-concepts.json");
const embeddedBankPath = resolve(root, "data/bank/embedded-bank.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const embeddedBank = JSON.parse(readFileSync(embeddedBankPath, "utf8"));
const practicalCatalog = JSON.parse(readFileSync(resolve(root, "data/term2/physiology-practical.json"), "utf8"));
const practicalQuestions = embeddedBank.questions.filter((q) => q.tags?.includes("exam-term2-physiology-practical"));
const practicalSource = readFileSync(resolve(root, "data/bank/questions/term2-physiology-practical.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
assert(JSON.stringify(practicalQuestions) === JSON.stringify(practicalSource), "Embedded physiology practical bank is stale");
assert(practicalQuestions.length === practicalCatalog.totals.questions, "Practical question count is stale");
for (const station of practicalCatalog.stations) {
  for (const objective of station.objectiveCoverage) assert(objective.questionIds.every((id) => practicalQuestions.some((q) => q.id === id)), `Missing practical objective question: ${objective.id}`);
  for (const image of station.images) assert(existsSync(resolve(root, "public/study", image.path)), `Missing practical figure: ${image.path}`);
}
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

const july25Telegram = embeddedBank.finalExams?.["july25:telegram-past-papers"];
const july29Telegram = embeddedBank.finalExams?.["july29:telegram-past-papers"];
const july29Downloaded = embeddedBank.finalExams?.["july29:downloaded-core"];
assert(Array.isArray(july25Telegram), "Embedded July 25 Telegram final exam is missing");
assert(Array.isArray(july29Telegram), "Embedded August 25 Telegram final exam is missing");
assert(Array.isArray(july29Downloaded), "Embedded August 25 downloaded-core final exam is missing");
assert(july29Telegram.length === 199, `August 25 Telegram bank changed unexpectedly (${july29Telegram.length})`);
assert(july29Downloaded.length >= 100 && july29Downloaded.length <= 200, `Downloaded-core bank is not distilled (${july29Downloaded.length})`);
assert(july29Downloaded.every((question) => question.status === "verified"
  && question.subject === "biochemistry"
  && question.tags?.includes("final-bank-aug25-downloaded-core")
  && question.tags?.includes("distilled-core")), "Downloaded-core bank contains an unverified or incorrectly tagged item");
const allFinalIds = [july25Telegram, july29Telegram, july29Downloaded].flat().map((question) => question.id);
assert(new Set(allFinalIds).size === allFinalIds.length, "Final-exam question IDs are not globally unique");

const respiratory = embeddedBank.questions.filter((question) => question.tags?.includes("exam-term2-respiratory"));
assert(respiratory.length > 224, "Respiratory gap expansion is incomplete");
const respiratoryCatalog = JSON.parse(readFileSync(resolve(root, "data/term2/respiratory-concepts.json"), "utf8"));
const respiratoryAudit = auditRespiratoryCatalog(respiratoryCatalog, respiratory);
assert(!respiratoryAudit.errors.length, `Respiratory concept errors: ${respiratoryAudit.errors.join("; ")}`);
const respiratoryIndex = JSON.parse(readFileSync(resolve(root, "data/term2/respiratory-question-index.json"), "utf8"));
assert(JSON.stringify(respiratoryIndex) === JSON.stringify(respiratoryAudit.index), "Respiratory concept index and embedded questions disagree");
const respiratoryReport = JSON.parse(readFileSync(resolve(root, "data/term2/respiratory-coverage.json"), "utf8"));
assert(JSON.stringify(respiratoryReport) === JSON.stringify(respiratoryAudit.report), "Respiratory coverage report is stale");
const respiratoryImages = new Set(respiratory.flatMap((question) => (question.media ?? []).map((media) => media.path)));
assert(respiratoryImages.size === 12, "Expected 4 anatomy source diagrams and 8 histology micrographs");
for (const path of respiratoryImages) assert(existsSync(resolve(root, "public/study", path)), `Missing Respiratory image: ${path}`);
const imageProvenance = JSON.parse(readFileSync(resolve(root, "data/term2/provenance/histology-images.json"), "utf8"));
for (const image of imageProvenance) {
  const hash = createHash("sha256").update(readFileSync(resolve(root, "public/study", image.path))).digest("hex");
  assert(hash === image.sha256, `Histology source image changed: ${image.path}`);
}

console.log(`Deployment assets valid: ${catalog.chapterCount} chapters, ${catalog.conceptCount} concepts, ${catalog.questionCount} curated questions, ${embeddedBank.questions.length} embedded questions, ${july29Downloaded.length} downloaded-core final questions.`);
