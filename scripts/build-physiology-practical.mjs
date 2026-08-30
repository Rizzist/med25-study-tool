import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { practicalScope, stations } from "../data/term2/physiology-practical-source.mjs";

const root = resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");
const letters = ["A", "B", "C", "D"];
let sequence = 0;
const questions = stations.flatMap((station) => station.questions.map((item) => {
  assert(station.objectives[item.objective], `${station.id}/${item.id}: unknown objective`);
  assert.equal(item.distractors.length, 3);
  const correctSlot = sequence++ % 4;
  const choices = [...item.distractors];
  choices.splice(correctSlot, 0, [item.answer, item.explanation]);
  assert.equal(new Set(choices.map(([answer]) => answer.toLowerCase().trim())).size, 4);
  const source = { title: station.source, chapter: station.title, [station.source.endsWith(".pdf") ? "page" : "slide"]: item.slide };
  return {
    schemaVersion: "1.0.0", id: `pp-${station.id}-${item.id}`, revision: 1, status: "verified",
    kind: item.media ? "image_single_best_answer" : "single_best_answer",
    subject: "physiology", topic: station.title, subtopic: station.objectives[item.objective],
    chapter: `Physiology practical · ${station.title}`, difficulty: 2,
    prompt: item.prompt, options: choices.map(([text], index) => ({ id: letters[index], text })),
    correctOptionId: letters[correctSlot], explanation: item.explanation,
    distractorExplanations: Object.fromEntries(choices.flatMap(([, why], index) => index === correctSlot ? [] : [[letters[index], why]])),
    learningObjective: station.objectives[item.objective], source,
    ...(item.media ? { media: [{ id: "figure", type: "image", path: `physiology-practical/${item.media}.png`, alt: "Course practical figure; identify or calculate the feature specified in the question.", attribution: `${station.source}, ${item.slide}` }] } : {}),
    tags: ["term-2", `exam-${practicalScope.examId}`, "source-grounded", "physiology-practical", `practical-station-${station.id}`, `practical-objective-${station.id}-${item.objective + 1}`],
    examPriority: "core", qualityFlags: [],
  };
}));
assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
assert.equal(new Set(questions.map((q) => q.prompt)).size, questions.length);
const catalogStations = stations.map(({ questions: authored, ...station }) => {
  const questionIds = authored.map((q) => `pp-${station.id}-${q.id}`);
  const objectiveCoverage = station.objectives.map((title, index) => ({
    id: `${station.id}-${index + 1}`, title,
    questionIds: authored.filter((q) => q.objective === index).map((q) => `pp-${station.id}-${q.id}`),
  }));
  assert(objectiveCoverage.every((item) => item.questionIds.length >= 2), `${station.id}: insufficient objective coverage`);
  for (const image of station.images) assert(existsSync(resolve(root, "public/study", image.path)), `Missing ${image.path}`);
  for (const video of station.videos) assert(/^[\w-]{11}$/.test(video.id), `Invalid video ID: ${video.id}`);
  return { ...station, questionIds, objectiveCoverage };
});
for (const question of questions) for (const media of question.media ?? []) assert(existsSync(resolve(root, "public/study", media.path)), `Missing ${media.path}`);
const totals = {
  stations: stations.length, objectives: stations.reduce((n, s) => n + s.objectives.length, 0), questions: questions.length,
  imageQuestions: questions.filter((q) => q.media).length,
  images: new Set(stations.flatMap((s) => s.images.map((i) => i.path))).size,
  videos: new Set(stations.flatMap((s) => s.videos.map((v) => v.id))).size,
  studyMinutes: stations.reduce((n, s) => n + s.minutes, 0),
};
const coverage = {
  basis: practicalScope.basis, totals,
  stations: catalogStations.map((s) => ({ id: s.id, title: s.title, source: s.source, sourceRange: s.sourceRange, objectives: s.objectiveCoverage })),
  unresolved: [
    "The official station blueprint, marking rubric and timetable have not been supplied.",
    "The clotting-time slides disagree on the timer start: confirm the laboratory SOP.",
    "The spirometry paper trace does not justify a single precise answer from the resized image; use the original scale and document units.",
    "Reference intervals and spirometry correction factors shown are course/method conventions, not universal clinical thresholds.",
    "Video metadata was verified, not every frame; external videos supplement the local pack and do not establish exam scope.",
  ],
};
for (const [path, content] of [
  ["data/bank/questions/term2-physiology-practical.jsonl", questions.map((q) => JSON.stringify(q)).join("\n") + "\n"],
  ["data/term2/physiology-practical.json", JSON.stringify({ ...practicalScope, totals, stations: catalogStations, unresolved: coverage.unresolved }, null, 2) + "\n"],
  ["data/term2/physiology-practical-coverage.json", JSON.stringify(coverage, null, 2) + "\n"],
]) {
  const absolute = resolve(root, path);
  if (check) assert.equal(readFileSync(absolute, "utf8"), content, `${path} is stale; run npm run physiology:generate`);
  else writeFileSync(absolute, content);
}
console.log(`Physiology practical: ${totals.stations} stations, ${totals.objectives} objectives, ${totals.questions} MCQs (${totals.imageQuestions} image questions), ${totals.images} figures, ${totals.videos} videos. ${check ? "Validated." : "Generated."}`);
