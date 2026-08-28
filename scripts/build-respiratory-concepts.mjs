import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { auditRespiratoryCatalog } from "../src/lib/respiratory/audit.mjs";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(resolve(root, "data/term2/respiratory-concepts.json"), "utf8"));
const schema = JSON.parse(readFileSync(resolve(root, "schemas/respiratory-concepts.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
if (!validate(catalog)) throw new Error(`Respiratory concept schema: ${JSON.stringify(validate.errors)}`);
const questionDir = resolve(root, "data/bank/questions");
const questions = readdirSync(questionDir).filter((name) => name.endsWith(".jsonl")).sort()
  .flatMap((name) => readFileSync(resolve(questionDir, name), "utf8").trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)))
  .filter((question) => question.tags?.includes("exam-term2-respiratory"));
const { errors, index, report } = auditRespiratoryCatalog(catalog, questions);
if (errors.length) throw new Error(`Respiratory concept audit failed:\n${errors.join("\n")}`);
for (const [filename, value] of [["respiratory-question-index.json", index], ["respiratory-coverage.json", report]]) {
  const path = resolve(root, "data/term2", filename);
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (readFileSync(path, "utf8") !== serialized) throw new Error(`Stale generated file: ${filename}`);
  } else writeFileSync(path, serialized);
}
console.log(`Respiratory concepts valid: ${report.conceptCount} concepts, ${report.objectiveCount} MCQ-linked objectives, ${report.questionCount} records (${report.distinctPracticeItems} distinct items), ${report.addedQuestionCount} gap questions.`);
