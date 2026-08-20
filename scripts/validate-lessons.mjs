import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const lessonDir = resolve(root, "data/lessons");
const files = ["embryology.json", "histology.json", "july29-cell-molecules.json", "curriculum-gaps.json", "july29-comprehensive.json", "histology-practicals.json", "histology-practicals-full.json"];
const failures = [];
const ids = new Set();
const lessons = [];

function requiredString(value, location) {
  if (typeof value !== "string" || !value.trim()) failures.push(`${location} must be a non-empty string`);
}

function requiredArray(value, location, minimum = 1) {
  if (!Array.isArray(value) || value.length < minimum) failures.push(`${location} must contain at least ${minimum} item(s)`);
}

for (const filename of files) {
  const path = resolve(lessonDir, filename);
  if (!existsSync(path)) {
    failures.push(`${filename} is missing`);
    continue;
  }
  let collection;
  try { collection = JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { failures.push(`${filename} is not valid JSON: ${error.message}`); continue; }
  if (collection.version !== 1) failures.push(`${filename} must use version 1`);
  requiredArray(collection.lessons, `${filename}.lessons`);
  for (const [index, lesson] of (collection.lessons ?? []).entries()) {
    const location = `${filename}.lessons[${index}]`;
    for (const key of ["id", "exam", "subject", "topic", "title", "subtitle", "kind"]) requiredString(lesson[key], `${location}.${key}`);
    if (ids.has(lesson.id)) failures.push(`duplicate lesson id ${lesson.id}`);
    ids.add(lesson.id);
    requiredArray(lesson.topicPatterns, `${location}.topicPatterns`);
    requiredArray(lesson.questionPatterns, `${location}.questionPatterns`);
    requiredArray(lesson.visual?.items, `${location}.visual.items`, 2);
    requiredString(lesson.visual?.type, `${location}.visual.type`);
    requiredString(lesson.visual?.caption, `${location}.visual.caption`);
    for (const [itemIndex, item] of (lesson.visual?.items ?? []).entries()) {
      for (const key of ["label", "detail", "cue"]) requiredString(item[key], `${location}.visual.items[${itemIndex}].${key}`);
    }
    requiredArray(lesson.essentials, `${location}.essentials`, 3);
    requiredArray(lesson.traps, `${location}.traps`);
    requiredArray(lesson.recognition, `${location}.recognition`);
    requiredString(lesson.source?.label, `${location}.source.label`);
    requiredString(lesson.source?.detail, `${location}.source.detail`);
    if (lesson.asset) {
      const assetPath = resolve(root, "public", lesson.asset.replace(/^\//, ""));
      if (!existsSync(assetPath)) failures.push(`${location}.asset does not exist: ${lesson.asset}`);
    }
    lessons.push(lesson);
  }
}

const bridge = readFileSync(resolve(root, "scripts/codex-bridge.mjs"), "utf8");
function topicsFromBridge(name) {
  const match = bridge.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) { failures.push(`Could not read ${name} from the exam scope`); return []; }
  const topics = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  if (!topics.length) failures.push(`Could not parse ${name}`);
  return topics;
}

const expected = [
  ...topicsFromBridge("JULY_25_HISTOLOGY_TOPICS").map((topic) => ["july25", "histology", topic]),
  ...topicsFromBridge("JULY_25_EMBRYOLOGY_TOPICS").map((topic) => ["july25", "embryology", topic]),
  ...topicsFromBridge("JULY_25_PHYSIOLOGY_TOPICS").map((topic) => ["july25", "physiology", topic]),
  ...topicsFromBridge("JULY_29_BIOCHEMISTRY_TOPICS").map((topic) => ["july29", "biochemistry", topic]),
  ...topicsFromBridge("JULY_29_PHYSIOLOGY_TOPICS").map((topic) => ["july29", "physiology", topic]),
  ...topicsFromBridge("JULY_29_HISTOLOGY_TOPICS").map((topic) => ["july29", "histology", topic]),
  ...["Digestive tract", "Endocrine glands", "Immune system and lymphoid organs", "Respiratory system", "Special sense organs", "Urinary system"].map((topic) => ["july25", "histology", topic]),
  ["july25", "embryology", "Respiratory system development"],
];
for (const [exam, subject, topic] of expected) {
  if (!lessons.some((lesson) => (lesson.exam === exam || lesson.exam === "both") && lesson.subject === subject && lesson.topicPatterns.includes(topic))) {
    failures.push(`No core lesson covers ${exam} / ${subject} / ${topic}`);
  }
}

if (failures.length) {
  console.error(`Lesson validation failed with ${failures.length} problem(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const july25Count = lessons.filter((lesson) => lesson.exam === "july25" || lesson.exam === "both").length;
const july29Count = lessons.filter((lesson) => lesson.exam === "july29" || lesson.exam === "both").length;
console.log(`Validated ${lessons.length} core lessons (${july25Count} available for July 25, ${july29Count} available for July 29).`);
