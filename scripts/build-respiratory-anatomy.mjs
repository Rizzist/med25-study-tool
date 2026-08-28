import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { anatomyValidationErrors, buildAnatomyQuestions } from "../src/lib/mcq/dynamic-anatomy.mjs";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(resolve(root, "data/term2/anatomy-images.json"), "utf8"));
const images = Array.isArray(catalog) ? catalog : catalog.images;
const questions = buildAnatomyQuestions(images);
for (const question of questions) {
  const errors = anatomyValidationErrors(question);
  if (errors.length) throw new Error(`${question.id}: ${errors.join("; ")}`);
}
writeFileSync(resolve(root, "data/bank/questions/term2-respiratory-dynamic.jsonl"), questions.map((question) => JSON.stringify(question)).join("\n") + "\n");
console.log(`Generated ${questions.length} dynamic variants from ${images.length} source images and ${images.reduce((total, image) => total + image.regions.length, 0)} annotated structures.`);
