import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(resolve(root, "data/bank/manifest.json"), "utf8"));
const schema = JSON.parse(readFileSync(resolve(root, "schemas/mcq-question.schema.json"), "utf8"));
const validateSchema = new Ajv2020({ allErrors: true }).compile(schema);
const questionDir = resolve(root, manifest.questionDirectory);
const assetRoots = manifest.assetDirectories.map((directory) => resolve(root, directory));
const errors = [];
const ids = new Set();
let count = 0;

function validate(question, location) {
  if (!validateSchema(question)) {
    for (const error of validateSchema.errors ?? []) errors.push(`${location}: ${error.instancePath || "/"} ${error.message}`);
  }
  if (question.schemaVersion !== manifest.schemaVersion) errors.push(`${location}: schema version mismatch`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(question.id ?? "")) errors.push(`${location}: invalid id`);
  if (ids.has(question.id)) errors.push(`${location}: duplicate id ${question.id}`);
  ids.add(question.id);
  if (!Array.isArray(question.options) || question.options.length < 4 || question.options.length > 6) errors.push(`${location}: options must contain 4-6 items`);
  const optionIds = new Set((question.options ?? []).map((option) => option.id));
  if (optionIds.size !== (question.options ?? []).length) errors.push(`${location}: option ids must be unique`);
  if (!optionIds.has(question.correctOptionId)) errors.push(`${location}: correctOptionId is not present in options`);
  for (const id of optionIds) {
    if (id !== question.correctOptionId && !question.distractorExplanations?.[id]) errors.push(`${location}: missing distractor explanation for ${id}`);
  }
  if (question.kind === "image_single_best_answer" && !question.media?.length) errors.push(`${location}: image question has no media`);
  for (const media of question.media ?? []) {
    const found = assetRoots.some((assetRoot) => existsSync(resolve(assetRoot, media.path)));
    if (!found) errors.push(`${location}: missing media ${media.path}`);
  }
}

if (existsSync(questionDir)) {
  for (const filename of readdirSync(questionDir).filter((name) => name.endsWith(".jsonl")).sort()) {
    const lines = readFileSync(resolve(questionDir, filename), "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      try { validate(JSON.parse(line), `${filename}:${index + 1}`); count += 1; }
      catch (error) { errors.push(`${filename}:${index + 1}: invalid JSON (${error.message})`); }
    });
  }
}

if (errors.length) {
  console.error(`Bank validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Bank valid: ${count} question(s), schema ${manifest.schemaVersion}.`);
