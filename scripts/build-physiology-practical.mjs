import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { practicalScope, stations as originalStations } from "../data/term2/physiology-practical-source.mjs";
import { theoryUnits, sources, additionalImages, pageExceptions, supplementalPageUnits } from "../data/term2/practical/expansion.mjs";

const root = resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");
const letters = ["A", "B", "C", "D"];
assert.equal(new Set(theoryUnits.map((unit) => unit.id)).size, theoryUnits.length);
const stations = originalStations.map((station) => {
  const units = theoryUnits.filter((unit) => unit.stationId === station.id);
  return { ...station,
    objectives: [...station.objectives, ...units.map((unit) => unit.title)],
    sourceRange: `${station.sourceRange}; expanded theory sets include additional source pages listed below`,
    images: [...station.images, ...(additionalImages[station.id] ?? [])],
    questions: [...station.questions, ...units.flatMap((unit, index) => unit.questions.map((item) => ({
      ...item, objective: station.objectives.length + index, unitId: unit.id,
      sourceTitle: sources[unit.sourceKey].title, sourceKind: sources[unit.sourceKey].kind,
      slide: unit.pages.join(", "),
    })))],
    theorySets: units.map((unit) => ({ id: unit.id, title: unit.title, source: sources[unit.sourceKey].title,
      file: sources[unit.sourceKey].file, locator: `${sources[unit.sourceKey].kind}s ${unit.pages.join(", ")}`,
      questionIds: unit.questions.map((q) => `pp-${station.id}-${q.id}`),
    })),
    coreQuestionIds: station.questions.map((q) => `pp-${station.id}-${q.id}`),
  };
});
const questions = stations.flatMap((station) => station.questions.map((item, index) => {
  assert(station.objectives[item.objective], `${station.id}/${item.id}: unknown objective`);
  assert.equal(item.distractors.length, 3);
  // Every original station had eight items starting at slot A. Station-local
  // rotation preserves all 72 saved option IDs when new items are appended.
  const correctSlot = index % 4;
  const choices = [...item.distractors];
  choices.splice(correctSlot, 0, [item.answer, item.explanation]);
  assert.equal(new Set(choices.map(([answer]) => answer.toLowerCase().trim())).size, 4);
  const title = item.sourceTitle ?? station.source;
  const source = { title, chapter: station.title, [item.sourceKind ?? (title.endsWith(".pdf") ? "page" : "slide")]: item.slide };
  return {
    schemaVersion: "1.0.0", id: `pp-${station.id}-${item.id}`, revision: 1, status: "verified",
    kind: item.media ? "image_single_best_answer" : "single_best_answer",
    subject: "physiology", topic: station.title, subtopic: station.objectives[item.objective],
    chapter: `Physiology practical · ${station.title}`, difficulty: 2,
    prompt: item.prompt, options: choices.map(([text], index) => ({ id: letters[index], text })),
    correctOptionId: letters[correctSlot], explanation: item.explanation,
    distractorExplanations: Object.fromEntries(choices.flatMap(([, why], index) => index === correctSlot ? [] : [[letters[index], why]])),
    learningObjective: station.objectives[item.objective], source,
    ...(item.media ? { media: [{ id: "figure", type: "image", path: `physiology-practical/${item.media}.png`, alt: "Course practical figure; identify or calculate the feature specified in the question.", attribution: `${title}, ${item.slide}` }] } : {}),
    tags: ["term-2", `exam-${practicalScope.examId}`, "source-grounded", "physiology-practical", `practical-station-${station.id}`, `practical-objective-${station.id}-${item.objective + 1}`,
      ...(item.unitId ? ["practical-theory-expansion", `practical-set-${item.unitId}`, `practical-style-${item.style}`] : ["practical-core"])],
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
  theorySets: theoryUnits.length, newQuestions: theoryUnits.reduce((n, unit) => n + unit.questions.length, 0),
  sourcePages: Object.values(sources).reduce((n, source) => n + source.pages, 0),
  calculationQuestions: questions.filter((q) => q.tags.includes("practical-style-calculation")).length,
};
const pageAudit = Object.entries(sources).map(([key, source]) => ({ key, ...source,
  audit: Array.from({ length: source.pages }, (_, index) => {
    const page = index + 1;
    const unitIds = [...new Set([...theoryUnits.filter((unit) => unit.sourceKey === key && unit.pages.includes(page)).map((unit) => unit.id), ...(supplementalPageUnits[key]?.[page] ?? [])])];
    const exception = pageExceptions[key]?.[page];
    assert(exception || unitIds.length, `Unaccounted source page ${key}/${page}`);
    return { page, status: exception?.[0] ?? "mapped", note: exception?.[1] ?? "Core concepts mapped to the linked theory sets; not a guarantee of every possible exam question.", unitIds };
  }),
}));
const questionIndex = questions.map((q) => ({ id: q.id, prompt: q.prompt, objective: q.learningObjective, source: q.source.title, image: Boolean(q.media),
  calculation: q.tags.includes("practical-style-calculation"), expanded: q.tags.includes("practical-theory-expansion") }));
const coverage = {
  basis: practicalScope.basis, totals,
  pageAudit,
  stations: catalogStations.map((s) => ({ id: s.id, title: s.title, source: s.source, sourceRange: s.sourceRange, objectives: s.objectiveCoverage })),
  unresolved: [
    "The official station blueprint, marking rubric and timetable have not been supplied.",
    "The clotting-time slides disagree on the timer start: confirm the laboratory SOP.",
    "The spirometry paper trace does not justify a single precise answer from the resized image; use the original scale and document units.",
    "Reference intervals and spirometry correction factors shown are course/method conventions, not universal clinical thresholds.",
    "Video metadata was verified, not every frame; external videos supplement the local pack and do not establish exam scope.",
    "Historical dates/biographical pictures and the full hematopoietic developmental chronology are not exhaustively assessed; see the page-by-page audit.",
    "Unkeyed ECG examples support descriptive transfer exercises, not fabricated official diagnoses. The embedded-video placeholder could not be recovered from the rendered deck.",
  ],
};
for (const [path, content] of [
  ["data/bank/questions/term2-physiology-practical.jsonl", questions.map((q) => JSON.stringify(q)).join("\n") + "\n"],
  ["data/term2/physiology-practical.json", JSON.stringify({ ...practicalScope, version: 2, totals, stations: catalogStations, questionIndex, pageAudit, unresolved: coverage.unresolved }, null, 2) + "\n"],
  ["data/term2/physiology-practical-coverage.json", JSON.stringify(coverage, null, 2) + "\n"],
]) {
  const absolute = resolve(root, path);
  if (check) assert.equal(readFileSync(absolute, "utf8"), content, `${path} is stale; run npm run physiology:generate`);
  else writeFileSync(absolute, content);
}
console.log(`Physiology practical: ${totals.stations} stations, ${totals.objectives} objectives, ${totals.questions} MCQs (${totals.imageQuestions} image questions), ${totals.images} figures, ${totals.videos} videos. ${check ? "Validated." : "Generated."}`);
