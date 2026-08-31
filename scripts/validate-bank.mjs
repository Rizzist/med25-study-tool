import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { anatomyValidationErrors } from "../src/lib/mcq/dynamic-anatomy.mjs";
import { getAnatomyModule } from "../src/lib/anatomy3d/registry.ts";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(resolve(root, "data/bank/manifest.json"), "utf8"));
const schema = JSON.parse(readFileSync(resolve(root, "schemas/mcq-question.schema.json"), "utf8"));
const validateSchema = new Ajv2020({ allErrors: true }).compile(schema);
const questionDir = resolve(root, manifest.questionDirectory);
const finalExamDir = resolve(root, "data/telegram-final");
const downloadedFinalExamDir = resolve(root, "data/final-exams");
const assetRoots = manifest.assetDirectories.map((directory) => resolve(root, directory));
const errors = [];
const ids = new Set();
let count = 0;
let finalExamCount = 0;
let downloadedFinalExamCount = 0;
const downloadedPrompts = new Set();
const normalizeLabel = (value) => value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function validate(question, location, finalMetadata) {
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
  if ((question.kind === "image_single_best_answer" || question.kind === "dynamic_anatomy") && !question.media?.length) errors.push(`${location}: image question has no media`);
  if (question.kind === "dynamic_anatomy_3d") {
    const registration = getAnatomyModule(question.anatomy3d?.modelKey);
    if (!registration) errors.push(`${location}: unknown 3D model ${question.anatomy3d?.modelKey ?? "(missing)"}`);
    else {
      const namesFor = (structure) => [structure.label, structure.shortLabel, ...(structure.aliases ?? [])].map(normalizeLabel);
      const target = registration.manifest.structures.find((structure) => structure.id === question.anatomy3d?.structureId && structure.quizable !== false);
      if (!target) errors.push(`${location}: unknown or non-quizable 3D structure ${question.anatomy3d?.structureId ?? "(missing)"}`);
      else {
        const keyedText = question.options?.find((option) => option.id === question.correctOptionId)?.text;
        if (!namesFor(target).includes(normalizeLabel(keyedText))) errors.push(`${location}: keyed option does not name the highlighted 3D target`);
      }
      for (const option of question.options ?? []) {
        if (!registration.manifest.structures.some((structure) => structure.quizable !== false && namesFor(structure).includes(normalizeLabel(option.text)))) {
          errors.push(`${location}: 3D option is not a quizable structure in ${registration.manifest.modelKey}: ${option.text}`);
        }
      }
    }
    if (question.media?.length) errors.push(`${location}: 3D question must use the registered model rather than image media`);
  }
  for (const error of anatomyValidationErrors(question)) errors.push(`${location}: ${error}`);
  for (const media of question.media ?? []) {
    const found = assetRoots.some((assetRoot) => existsSync(resolve(assetRoot, media.path)));
    if (!found) errors.push(`${location}: missing media ${media.path}`);
  }
  if (finalMetadata) {
    if (question.status !== "verified") errors.push(`${location}: final-exam questions must be verified`);
    if (!(question.tags ?? []).includes(finalMetadata.requiredTag)) errors.push(`${location}: missing ${finalMetadata.requiredTag} tag`);
    if (!(question.tags ?? []).includes(`exam-${finalMetadata.exam}`)) errors.push(`${location}: missing exam-${finalMetadata.exam} tag`);
    if (finalMetadata.bank === "downloaded-core") {
      if (question.subject !== "biochemistry") errors.push(`${location}: downloaded-core item must be biochemistry`);
      if (!(question.tags ?? []).includes("distilled-core")) errors.push(`${location}: missing distilled-core tag`);
      const normalizedPrompt = question.prompt?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (downloadedPrompts.has(normalizedPrompt)) errors.push(`${location}: repeated normalized downloaded-core stem`);
      downloadedPrompts.add(normalizedPrompt);
    }
  }
}

for (const source of [
  { directory: questionDir },
  { directory: finalExamDir, metadataFor: (filename) => ({ exam: filename.replace(/\.jsonl$/, ""), requiredTag: "telegram-final", bank: "telegram-past-papers" }) },
  { directory: downloadedFinalExamDir, metadataFor: () => ({ exam: "july29", requiredTag: "final-bank-aug25-downloaded-core", bank: "downloaded-core" }) },
]) {
  if (!existsSync(source.directory)) continue;
  for (const filename of readdirSync(source.directory).filter((name) => name.endsWith(".jsonl")).sort()) {
    const finalMetadata = source.metadataFor?.(filename);
    const lines = readFileSync(resolve(source.directory, filename), "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      try {
        validate(JSON.parse(line), `${finalMetadata ? `${finalMetadata.bank}/` : ""}${filename}:${index + 1}`, finalMetadata);
        count += 1;
        if (finalMetadata) finalExamCount += 1;
        if (finalMetadata?.bank === "downloaded-core") downloadedFinalExamCount += 1;
      }
      catch (error) { errors.push(`${filename}:${index + 1}: invalid JSON (${error.message})`); }
    });
  }
}
if (downloadedFinalExamCount < 100 || downloadedFinalExamCount > 200) errors.push(`downloaded-core: expected a distilled 100–200 question bank, found ${downloadedFinalExamCount}`);

if (errors.length) {
  console.error(`Bank validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Bank valid: ${count} question(s), including ${finalExamCount} final-exam item(s) (${downloadedFinalExamCount} downloaded-core), schema ${manifest.schemaVersion}.`);
