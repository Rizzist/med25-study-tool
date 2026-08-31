import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { auditTerm2ConceptCatalog } from "../src/lib/term2/concept-audit.mjs";

const root = resolve(import.meta.dirname, "..");
const schema = JSON.parse(readFileSync(resolve(root, "schemas/term2-concepts.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const definitions = [
  { examId: "term2-cvs", stem: "cvs" },
  { examId: "term2-limbs", stem: "limbs" },
  { examId: "term2-biochemistry", stem: "biochemistry" },
];
const summaries = [];

for (const definition of definitions) {
  const catalog = JSON.parse(readFileSync(resolve(root, `data/term2/${definition.stem}-concepts.json`), "utf8"));
  if (!validate(catalog)) throw new Error(`${definition.examId} concept schema: ${JSON.stringify(validate.errors)}`);
  if (catalog.examId !== definition.examId) throw new Error(`${definition.examId}: catalog exam mismatch`);
  const questionDir = resolve(root, "data/bank/questions");
  const questions = readdirSync(questionDir).filter((name) => name.endsWith(".jsonl")).sort()
    .flatMap((name) => readFileSync(resolve(questionDir, name), "utf8").trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)))
    .filter((question) => (question.tags ?? []).includes(`exam-${definition.examId}`));
  const { errors, index, report } = auditTerm2ConceptCatalog(catalog, questions);
  if (errors.length) throw new Error(`${definition.examId} concept audit failed:\n${errors.join("\n")}`);
  for (const [filename, value] of [
    [`${definition.stem}-question-index.json`, index],
    [`${definition.stem}-coverage.json`, report],
  ]) {
    const path = resolve(root, "data/term2", filename);
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    if (process.argv.includes("--check")) {
      if (readFileSync(path, "utf8") !== serialized) throw new Error(`Stale generated file: ${filename}`);
    } else writeFileSync(path, serialized);
  }
  summaries.push(`${definition.examId}: ${report.conceptCount} concepts, ${report.objectiveCount} objectives, ${report.questionCount} questions, ${report.addedQuestionCount} gap additions`);
}

console.log(`Term 2 concepts valid: ${summaries.join("; ")}. Past/final tags: 0.`);
