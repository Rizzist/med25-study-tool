import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const definitions = [
  { examId: "term2-cvs", bank: "data/bank/questions/term2-cvs.jsonl", catalog: "data/term2/cvs-course.json" },
  { examId: "term2-limbs", bank: "data/bank/questions/term2-limbs.jsonl", catalog: "data/term2/limbs-course.json" },
  { examId: "term2-biochemistry", bank: "data/bank/questions/term2-biochemistry.jsonl", catalog: "data/term2/biochemistry-course.json" },
];
const subjects = new Set(["anatomy", "histology", "embryology", "physiology", "biochemistry"]);
const scopes = new Set(["course", "book-extension"]);
const forbiddenAssessmentTags = /(?:^|-)past(?:-|$)|final-bank|telegram-final|downloaded-final|official-exam/;
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const errors = [];
const summaries = [];

for (const definition of definitions) {
  const questions = readFileSync(resolve(root, definition.bank), "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const catalog = JSON.parse(readFileSync(resolve(root, definition.catalog), "utf8"));
  const questionById = new Map(questions.map((question) => [question.id, question]));
  if (questionById.size !== questions.length) errors.push(`${definition.examId}: duplicate question IDs`);
  if (catalog.examId !== definition.examId) errors.push(`${definition.examId}: catalog examId mismatch`);
  if (!catalog.title || !catalog.scopeNote || !Array.isArray(catalog.sources) || !catalog.sources.length) errors.push(`${definition.examId}: incomplete catalog header/source map`);
  if (!Array.isArray(catalog.modules) || !catalog.modules.length) errors.push(`${definition.examId}: no catalog modules`);
  if (!Array.isArray(catalog.unresolved)) errors.push(`${definition.examId}: unresolved must be an array`);

  const moduleIds = new Set();
  const mappedCounts = new Map();
  for (const courseModule of catalog.modules ?? []) {
    if (!courseModule.id || moduleIds.has(courseModule.id)) errors.push(`${definition.examId}: duplicate/empty module ID ${courseModule.id ?? "(missing)"}`);
    moduleIds.add(courseModule.id);
    if (!subjects.has(courseModule.subject)) errors.push(`${definition.examId}/${courseModule.id}: invalid subject ${courseModule.subject}`);
    if (!scopes.has(courseModule.scope)) errors.push(`${definition.examId}/${courseModule.id}: invalid scope ${courseModule.scope}`);
    if (!courseModule.title || !courseModule.summary || !courseModule.sourceLocator) errors.push(`${definition.examId}/${courseModule.id}: incomplete teaching metadata`);
    if (!Array.isArray(courseModule.keyPoints) || !courseModule.keyPoints.length) errors.push(`${definition.examId}/${courseModule.id}: no key points`);
    if (!Array.isArray(courseModule.retrieval) || !courseModule.retrieval.length || courseModule.retrieval.some((item) => !item.prompt || !item.answer)) errors.push(`${definition.examId}/${courseModule.id}: incomplete retrieval practice`);
    if (!Array.isArray(courseModule.questionIds) || !courseModule.questionIds.length) errors.push(`${definition.examId}/${courseModule.id}: no linked questions`);
    for (const id of courseModule.questionIds ?? []) {
      mappedCounts.set(id, (mappedCounts.get(id) ?? 0) + 1);
      const question = questionById.get(id);
      if (!question) errors.push(`${definition.examId}/${courseModule.id}: unknown question ${id}`);
      else {
        if (question.subject !== courseModule.subject) errors.push(`${definition.examId}/${courseModule.id}: ${id} subject mismatch`);
        const markedExtension = (question.tags ?? []).includes("book-extension");
        if (courseModule.scope === "course" && markedExtension) errors.push(`${definition.examId}/${courseModule.id}: ${id} is marked book-extension inside a course module`);
      }
    }
  }

  const promptKeys = new Set();
  const answerKeys = { A: 0, B: 0, C: 0, D: 0 };
  for (const question of questions) {
    if (question.status !== "verified") errors.push(`${definition.examId}/${question.id}: not verified`);
    if (!(question.tags ?? []).includes("term-2") || !(question.tags ?? []).includes(`exam-${definition.examId}`)) errors.push(`${definition.examId}/${question.id}: missing explicit exam routing`);
    if ((question.tags ?? []).some((tag) => forbiddenAssessmentTags.test(tag))) errors.push(`${definition.examId}/${question.id}: forbidden past/final assessment tag`);
    if (!question.source?.title || !question.source?.chapter || !(question.source.page || question.source.slide)) errors.push(`${definition.examId}/${question.id}: source needs a precise page or slide locator`);
    if (mappedCounts.get(question.id) !== 1) errors.push(`${definition.examId}/${question.id}: must map to exactly one module`);
    if (question.kind !== "dynamic_anatomy_3d") {
      const promptKey = normalize(question.prompt);
      if (promptKeys.has(promptKey)) errors.push(`${definition.examId}/${question.id}: duplicate normalized prompt`);
      promptKeys.add(promptKey);
    }
    if (Object.hasOwn(answerKeys, question.correctOptionId)) answerKeys[question.correctOptionId] += 1;
  }
  const keyCounts = Object.values(answerKeys);
  if (Math.max(...keyCounts) - Math.min(...keyCounts) > 2) errors.push(`${definition.examId}: answer keys are materially imbalanced ${JSON.stringify(answerKeys)}`);
  summaries.push(`${definition.examId}: ${questions.length} questions, ${catalog.modules.length} modules, ${questions.filter((question) => question.kind === "dynamic_anatomy_3d").length} 3D, ${questions.filter((question) => question.media?.length).length} image`);
}

if (errors.length) {
  console.error(`Term 2 course validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Term 2 courses valid: ${summaries.join("; ")}. Past/final assessment tags: 0.`);
