import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { selectPracticalSprint } from "../src/lib/mcq/practical-selection.mjs";
import { createEmptyProgress, parseProgress } from "../src/lib/mcq/study-progress.mjs";
const root = new URL("../", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("data/term2/physiology-practical.json", root), "utf8"));
const bank = readFileSync(new URL("data/bank/questions/term2-physiology-practical.jsonl", root), "utf8").trim().split("\n").map((line) => JSON.parse(line));

async function route(path, body) {
  const { default: worker } = await import("../dist/server/index.js");
  return worker.fetch(new Request(`http://localhost${path}`, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}
test("practical catalog maps every objective to source-linked questions and existing figures", () => {
  assert.equal(catalog.stations.length, 9);
  assert.equal(catalog.totals.objectives, 36);
  assert.equal(bank.length, 72);
  assert.equal(catalog.totals.imageQuestions, 9);
  const ids = new Set(bank.map((q) => q.id));
  assert.equal(ids.size, 72);
  const mapped = catalog.stations.flatMap((station) => {
    assert.equal(station.objectiveCoverage.length, 4);
    assert(station.steps.length >= 5 && station.worked.length && station.traps.length);
    for (const image of station.images) assert(existsSync(new URL(`public/study/${image.path}`, root)));
    for (const video of station.videos) assert.match(video.id, /^[\w-]{11}$/);
    return station.objectiveCoverage.flatMap((objective) => {
      assert.equal(objective.questionIds.length, 2);
      for (const id of objective.questionIds) assert.equal(bank.find((q) => q.id === id).learningObjective, objective.title);
      return objective.questionIds;
    });
  });
  assert.deepEqual(new Set(mapped), ids);
  for (const question of bank) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.text)).size, 4);
    assert(question.explanation.length > 30 && question.source.title && (question.source.page || question.source.slide));
    for (const option of question.options.filter((option) => option.id !== question.correctOptionId)) assert(question.distractorExplanations[option.id].length > 20);
    for (const media of question.media ?? []) assert(existsSync(new URL(`public/study/${media.path}`, root)));
  }
  for (const letter of ["A", "B", "C", "D"]) assert.equal(bank.filter((q) => q.correctOptionId === letter).length, 18);
});
test("practical mocks balance stations, respect limits and do not mutate the bank", () => {
  const original = JSON.stringify(bank);
  for (const limit of [18, 36, 54, 72]) {
    const selection = selectPracticalSprint(bank, { limit, studyMode: "exam", random: () => 0.42 });
    assert.equal(selection.questions.length, limit);
    assert.equal(new Set(selection.questions.map((q) => q.id)).size, limit);
    for (const station of catalog.stations) assert.equal(selection.questions.filter((q) => station.questionIds.includes(q.id)).length, limit / 9);
  }
  assert.equal(JSON.stringify(bank), original);
  assert.equal(selectPracticalSprint([], { limit: 36, studyMode: "exam" }).questions.length, 0);
  const station = bank.filter((q) => q.tags.includes("practical-station-ecg"));
  assert.equal(selectPracticalSprint(station, { limit: 36, studyMode: "exam" }).questions.length, 8);
  assert.equal(selectPracticalSprint(bank, { limit: 1, repairIds: [bank[5].id] }).questions[0].id, bank[5].id);
});
test("practical progress is isolated and older progress survives migration", () => {
  const progress = createEmptyProgress();
  progress.exams.july25.wrongIds = ["old-question"];
  progress.exams[catalog.examId].wrongIds = [bank[0].id];
  assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
  assert.deepEqual(progress.exams["term2-respiratory"].wrongIds, []);
});
test("practical API supports balanced mocks, exact resume, media and strict exam separation", async () => {
  const summary = await (await route("/api/bank/summary")).json();
  const practical = summary.exams.find((exam) => exam.id === catalog.examId);
  assert.equal(practical.questionCount, 72);
  assert.equal(practical.imageQuestionCount, 9);
  assert.equal(practical.finalExamQuestionCount, 0);
  assert.equal(practical.collectionCounts.practical, 72);
  const { questions } = await (await route("/api/questions/sprint", { exam: catalog.examId, collection: "all", limit: 36, studyMode: "exam" })).json();
  assert.equal(questions.length, 36);
  for (const station of catalog.stations) assert.equal(questions.filter((q) => station.questionIds.includes(q.id)).length, 4);
  const ids = questions.map((q) => q.id);
  const resumed = await (await route("/api/questions/by-ids", { exam: catalog.examId, ids, limit: 36, preserveOrder: true })).json();
  assert.deepEqual(resumed.questions, questions);
  for (const exam of ["july25", "july29", "aug22", "term2-respiratory", "term2-cvs"]) {
    const leaked = await (await route("/api/questions/by-ids", { exam, ids, limit: 36 })).json();
    assert.deepEqual(leaked.questions, []);
  }
  const targeted = await (await route("/api/questions/by-ids", { exam: catalog.examId, ids: catalog.stations[2].questionIds, limit: 8, prioritize: true, studyMode: "exam" })).json();
  assert.equal(targeted.questions.length, 8);
  assert(targeted.questions.every((q) => q.tags.includes("practical-station-ecg")));
  for (const question of bank.filter((q) => q.media)) {
    const response = await route(`/api/media?questionId=${question.id}&mediaId=figure`);
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location"), /\/study\/physiology-practical\//);
  }
});
test("practical UI includes video fallback, deliberate checklist, source caveats and feedback gating", () => {
  const ui = readFileSync(new URL("src/components/PhysiologyPracticalHub.tsx", root), "utf8");
  const page = readFileSync(new URL("app/page.tsx", root), "utf8");
  assert.match(ui, /youtube-nocookie\.com\/embed/);
  assert.match(ui, /Watch on YouTube/);
  assert.match(ui, /playing\s*\?/);
  assert.match(ui, /I can explain & rehearse this/);
  assert.match(ui, /not a guarantee/);
  assert.match(page, /studyMode === "learn" && hasAnswer/);
  assert.match(page, /practicalPracticeIds: activePracticalPracticeIds/);
  assert.match(page, /activeRespiratoryPracticeIds \?\? activePracticalPracticeIds/);
  assert.match(catalog.safety, /Never mouth-pipette/);
  assert(catalog.unresolved.some((note) => /timer start/.test(note)));
});

test("practical lessons render substantive study, image/video and recall panels without browser automation", async () => {
  const result = await build({
    stdin: { contents: `import React from "react"; import {renderToStaticMarkup} from "react-dom/server"; import {PhysiologyPracticalHub} from "./src/components/PhysiologyPracticalHub"; export const render = (initialPanel) => renderToStaticMarkup(<PhysiologyPracticalHub initialPanel={initialPanel} attemptedIds={[]} repairIds={[]} disabled={false} onPractice={() => {}} />);`, loader: "tsx", resolveDir: fileURLToPath(root) },
    platform: "node", format: "cjs", bundle: true, packages: "external", write: false, alias: { "@": fileURLToPath(root) },
  });
  const compiled = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
  const learned = compiled.exports.render("learn");
  assert.match(learned, /Physiology, in practice/);
  assert.match(learned, /What you need to understand/);
  assert.match(learned, /Auscultatory|auscultatory/);
  assert.match(learned, /bp-setup\.png/);
  assert.match(learned, /Rehearse aloud/);
  assert.match(learned, /Do not memorise the mistake/);
  assert.match(learned, /36-question mixed mock/);
  const watch = compiled.exports.render("watch");
  assert.match(watch, /HMSTSZVWhMI/);
  assert.match(watch, /Load demonstration/);
  assert.doesNotMatch(watch, /<iframe/);
  assert.match(watch, /Watch on YouTube/);
  const recall = compiled.exports.render("recall");
  assert.match(recall, /Objective → question coverage/);
  assert.match(recall, /Test this/);
  assert.match(recall, /Station mock/);
});
