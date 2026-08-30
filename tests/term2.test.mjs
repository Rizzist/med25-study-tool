import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { anatomyValidationErrors, buildAnatomyQuestions } from "../src/lib/mcq/dynamic-anatomy.mjs";
import { selectRespiratorySprint } from "../src/lib/mcq/respiratory-selection.mjs";
import { examIds, isExamId, isTerm2Exam, isTerm2Question, matchesTerm2Exam, term2Exams } from "../src/lib/mcq/exams.mjs";
import { createEmptyProgress, parseProgress } from "../src/lib/mcq/study-progress.mjs";

const sampleImage = {
  id: "test-image", title: "Test diagram", path: "test.png", alt: "Test diagram",
  source: { title: "Local source", chapter: "Test chapter", slide: "1" },
  regions: ["one", "two", "three", "four", "five"].map((id, index) => ({ id, label: `Structure ${id}`, x: index / 6, y: 0.2, width: 0.1, height: 0.1, description: `Distinct relationship for structure ${id}.` })),
};

async function route(path, body) {
  const { default: worker } = await import("../dist/server/index.js");
  return worker.fetch(new Request(`http://localhost${path}`, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("Term 2 catalog has five exams with explicit membership and only the user-reported practical date", () => {
  assert.equal(term2Exams.length, 5);
  assert.equal(examIds.length, 8);
  assert(term2Exams.filter((exam) => exam.id !== "term2-physiology-practical").every((exam) => exam.date === null));
  assert.equal(term2Exams.find((exam) => exam.id === "term2-physiology-practical").date, "2026-08-31");
  assert(isExamId("july25"));
  assert(isTerm2Exam("term2-respiratory"));
  assert(!isExamId("toString"));
  assert(!matchesTerm2Exam({ tags: [] }, "term2-respiratory"));
  assert(matchesTerm2Exam({ tags: ["exam-term2-respiratory"] }, "term2-respiratory"));
  assert(!matchesTerm2Exam({ tags: ["exam-term2-respiratory"] }, "term2-cvs"));
});

test("Term 1 progress survives migration and Term 2 progress round-trips independently", () => {
  const progress = parseProgress(JSON.stringify({ version: 1, exams: { july25: { wrongIds: ["old-question", "hpr-old-slide"], flaggedIds: ["old-question"] }, july29: { wrongIds: ["old-biochemistry"], flaggedIds: [] } } }));
  assert.deepEqual(progress.exams.july25.wrongIds, ["old-question"]);
  assert.deepEqual(progress.exams.aug22.wrongIds, ["hpr-old-slide"]);
  assert.deepEqual(progress.exams.july29.wrongIds, ["old-biochemistry"]);
  assert.deepEqual(progress.exams["term2-respiratory"], { wrongIds: [], flaggedIds: [] });
  progress.exams["term2-respiratory"].wrongIds = ["resp-dyn-image-target-v2"];
  assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
  assert.deepEqual(parseProgress("bad json"), createEmptyProgress());
  assert.deepEqual(parseProgress("null"), createEmptyProgress());
});

test("dynamic variants are deterministic, target-correct and change distractors", () => {
  const questions = buildAnatomyQuestions([sampleImage]);
  assert.equal(questions.length, 10);
  assert.deepEqual(questions, buildAnatomyQuestions([sampleImage]));
  assert.equal(new Set(questions.map((question) => question.id)).size, 10);
  for (const question of questions) assert.deepEqual(anatomyValidationErrors(question), []);
  for (const target of sampleImage.regions) {
    const variants = questions.filter((question) => question.anatomy.targetRegionId === target.id);
    assert.notDeepEqual(variants[0].options.map((option) => option.text).sort(), variants[1].options.map((option) => option.text).sort());
  }
  const corrupt = structuredClone(questions[0]);
  corrupt.correctOptionId = corrupt.options.find((option) => option.id !== corrupt.correctOptionId).id;
  assert(anatomyValidationErrors(corrupt).some((error) => error.includes("answer does not identify")));
  corrupt.media[0].annotations[0].width = 2;
  assert(anatomyValidationErrors(corrupt).some((error) => error.includes("outside image")));
});

test("Respiratory mocks balance subjects and do not repeat the same image target", () => {
  const items = ["anatomy", "histology", "embryology", "physiology"].flatMap((subject) => Array.from({ length: 30 }, (_, index) => ({ id: `${subject}-${index}`, subject })));
  const sample = selectRespiratorySprint(items, { limit: 20, studyMode: "exam", random: () => 0.32 });
  for (const subject of ["anatomy", "histology", "embryology", "physiology"]) assert.equal(sample.questions.filter((question) => question.subject === subject).length, 5);
  const variants = buildAnatomyQuestions([sampleImage]);
  const unique = selectRespiratorySprint(variants, { limit: 20, studyMode: "exam" });
  assert.equal(unique.questions.length, 5);
  assert.equal(new Set(unique.questions.map((question) => question.anatomy.targetRegionId)).size, 5);
  const repair = selectRespiratorySprint(variants, { limit: 1, repairIds: [variants[1].id] });
  assert.equal(repair.questions[0].id, variants[1].id);
  assert.deepEqual(selectRespiratorySprint([], { limit: 20 }).questions, []);
});

test("deployed API exposes Respiratory only in its own exam and keeps placeholders empty", async () => {
  const response = await route("/api/bank/summary");
  assert.equal(response.status, 200);
  const summary = await response.json();
  for (const exam of term2Exams) {
    const found = summary.exams.find((item) => item.id === exam.id);
    assert(found);
    assert.equal(found.date, exam.date);
    if (exam.status === "planned") assert.equal(found.questionCount, 0);
  }
  const respiratory = summary.exams.find((exam) => exam.id === "term2-respiratory");
  assert(respiratory.questionCount >= 150);
  assert(respiratory.collectionCounts.anatomy >= 48);
  assert(respiratory.collectionCounts.histology >= 32);
  assert(respiratory.collectionCounts.embryology >= 24);
  assert(respiratory.collectionCounts.physiology >= 48);
  assert(respiratory.collectionCounts["dynamic-anatomy"] >= 16);
  assert(respiratory.dynamicImageCount >= 4);
  assert.equal(respiratory.finalExamQuestionCount, 0, "generated questions must not masquerade as past papers");
  for (const exam of summary.exams.filter((item) => !isTerm2Exam(item.id))) {
    const ids = new Set(exam.collectionQuestionIds.all);
    assert(respiratory.collectionQuestionIds.all.every((id) => !ids.has(id)));
  }
});

test("Respiratory API supports mixed mocks, dynamic media and exact resume", async () => {
  const response = await route("/api/questions/sprint", { exam: "term2-respiratory", collection: "all", limit: 20, studyMode: "exam" });
  assert.equal(response.status, 200);
  const { questions } = await response.json();
  assert.equal(questions.length, 20);
  assert(questions.every((question) => isTerm2Question(question) && question.source.title && (question.source.page || question.source.slide)));
  for (const subject of ["anatomy", "histology", "embryology", "physiology"]) assert.equal(questions.filter((question) => question.subject === subject).length, 5);
  const ids = questions.map((question) => question.id);
  const saved = await (await route("/api/questions/by-ids", { exam: "term2-respiratory", ids, limit: ids.length, preserveOrder: true })).json();
  assert.deepEqual(saved.questions, questions);
  const crossExam = await (await route("/api/questions/by-ids", { exam: "july25", ids, limit: ids.length, preserveOrder: true })).json();
  assert.deepEqual(crossExam.questions, []);
  const dynamic = await (await route("/api/questions?exam=term2-respiratory&collection=dynamic-anatomy&limit=250")).json();
  assert(dynamic.questions.length >= 16);
  for (const question of dynamic.questions) {
    assert.deepEqual(anatomyValidationErrors(question), []);
    const image = await route(`/api/media?questionId=${encodeURIComponent(question.id)}&mediaId=${encodeURIComponent(question.media[0].id)}`);
    assert.equal(image.status, 307);
    assert.match(image.headers.get("location"), /\/study\/term2\/respiratory\//);
  }
});

test("Respiratory source contract includes labels only after feedback and supports keyboard/touch", async () => {
  const [page, image, manifest] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/AnatomyImage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/bank/embedded-bank.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /studyMode === "learn" && hasAnswer/);
  assert.match(page, /StudyMedia question=\{question\} review=\{hasImmediateFeedback\}/);
  assert.match(image, /revealed && regions\.map/);
  assert.match(image, /!revealed && media\.labelMasks/);
  assert.match(image, /onPointerEnter/);
  assert.match(image, /onFocus/);
  assert.match(image, /onClick/);
  assert.match(image, /All annotated structures/);
  const respiratory = JSON.parse(manifest).questions.filter((question) => matchesTerm2Exam(question, "term2-respiratory"));
  for (const question of respiratory) {
    assert.equal(question.status, "verified");
    assert(question.tags.includes("source-grounded"));
    assert(question.source.page || question.source.slide, `${question.id} needs a precise source locator`);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.text.toLowerCase())).size, 4);
    assert(question.options.every((option) => option.id === question.correctOptionId || question.distractorExplanations[option.id]?.length > 20));
    assert(!/transcript|past.paper|wikipedia|question.bank/i.test(question.source.title));
  }
});
