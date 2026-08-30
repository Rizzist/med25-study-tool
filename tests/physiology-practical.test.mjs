import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { selectPracticalSprint } from "../src/lib/mcq/practical-selection.mjs";
import { createEmptyProgress, parseProgress } from "../src/lib/mcq/study-progress.mjs";
import { filterPracticalQuestions } from "../src/lib/mcq/practical-filter.mjs";
const root = new URL("../", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("data/term2/physiology-practical.json", root), "utf8"));
const bank = readFileSync(new URL("data/bank/questions/term2-physiology-practical.jsonl", root), "utf8").trim().split("\n").map((line) => JSON.parse(line));

async function route(path, body) {
  const { default: worker } = await import("../dist/server/index.js");
  return worker.fetch(new Request(`http://localhost${path}`, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}
test("practical catalog maps every objective to source-linked questions and existing figures", () => {
  assert.equal(catalog.stations.length, 9);
  assert.equal(catalog.totals.objectives, 129);
  assert.equal(catalog.totals.theorySets, 93);
  assert.equal(bank.length, 444);
  assert.equal(catalog.totals.imageQuestions, 154);
  const ids = new Set(bank.map((q) => q.id));
  assert.equal(ids.size, bank.length);
  const mapped = catalog.stations.flatMap((station) => {
    assert.equal(station.objectiveCoverage.length, 4 + station.theorySets.length);
    assert(station.steps.length >= 5 && station.worked.length && station.traps.length);
    for (const image of station.images) assert(existsSync(new URL(`public/study/${image.path}`, root)));
    for (const video of station.videos) assert.match(video.id, /^[\w-]{11}$/);
    return station.objectiveCoverage.flatMap((objective) => {
      assert(objective.questionIds.length >= 2);
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
  for (const letter of ["A", "B", "C", "D"]) assert.equal(bank.filter((q) => q.correctOptionId === letter).length, 111);
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
  assert.equal(selectPracticalSprint(station, { limit: 36, studyMode: "exam" }).questions.length, 36);
  assert.equal(selectPracticalSprint(station, { limit: 200, studyMode: "exam" }).questions.length, 140);
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
  assert.equal(practical.questionCount, 444);
  assert.equal(practical.imageQuestionCount, 154);
  assert.equal(practical.finalExamQuestionCount, 0);
  assert.equal(practical.collectionCounts.practical, 444);
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
  const questionSets = compiled.exports.render("questions");
  assert.match(questionSets, /Theory, one problem set at a time/);
  assert.match(questionSets, /44 questions for this station/);
  assert.match(questionSets, /Search this station/);
  assert.match(questionSets, /Preview question prompts/);
  assert.match(questionSets, /Slide-by-slide audit/);
  assert.doesNotMatch(questionSets, /distractorExplanations|correctOptionId/);
});

test("all 72 original question IDs, options, answers and explanations remain unchanged", () => {
  const original = readFileSync(new URL("tests/fixtures/physiology-practical-v1.jsonl", root), "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(original.length, 72);
  for (const old of original) {
    const current = bank.find((q) => q.id === old.id);
    for (const field of ["id", "prompt", "options", "correctOptionId", "explanation", "distractorExplanations", "learningObjective", "source", "media"]) assert.deepEqual(current[field], old[field], `${old.id}: ${field}`);
  }
});

test("theory sets and page audit account for all eight files without hiding unresolved content", () => {
  assert.equal(catalog.pageAudit.length, 8);
  assert.equal(catalog.pageAudit.reduce((n, source) => n + source.audit.length, 0), 198);
  const sets = catalog.stations.flatMap((s) => s.theorySets);
  const setIds = new Set(sets.map((set) => set.id));
  assert.equal(setIds.size, 93);
  assert.equal(sets.flatMap((s) => s.questionIds).length, 372);
  for (const source of catalog.pageAudit) {
    assert.deepEqual(source.audit.map((row) => row.page), Array.from({ length: source.pages }, (_, i) => i + 1));
    for (const row of source.audit) {
      assert(row.note && row.status);
      if (row.status === "mapped") assert(row.unitIds.length);
      assert(row.unitIds.every((id) => setIds.has(id)));
    }
  }
  assert.equal(catalog.pageAudit.find((s) => s.key === "ecg").audit[29].status, "unavailable");
  assert.equal(catalog.pageAudit.find((s) => s.key === "spiro").audit[23].status, "limited");
  for (const set of sets) {
    assert.equal(set.questionIds.length, 4);
    assert(set.locator && set.source);
    for (const id of set.questionIds) assert(bank.find((q) => q.id === id).tags.includes(`practical-set-${set.id}`));
  }
});

test("question filters give exact launch pools, combine search and progress, and expose no answer keys", () => {
  const ids = bank.map((q) => q.id);
  const index = catalog.questionIndex;
  assert(index.every((q) => !q.answer && !q.correctOptionId && !q.explanation));
  assert.equal(filterPracticalQuestions(index, ids, { filter: "new" }).length, 372);
  assert.equal(filterPracticalQuestions(index, ids, { filter: "images" }).length, 154);
  assert.equal(filterPracticalQuestions(index, ids, { filter: "calculations" }).length, catalog.totals.calculationQuestions);
  const attemptedIds = ids.slice(0, 40);
  assert.equal(filterPracticalQuestions(index, ids, { filter: "unseen", attemptedIds }).length, 404);
  assert.deepEqual(filterPracticalQuestions(index, ids, { filter: "repair", repairIds: [ids[5], "invalid"] }), [ids[5]]);
  assert.deepEqual(filterPracticalQuestions(index, [ids[0], ids[0], "invalid"]), [ids[0]]);
  assert.deepEqual(filterPracticalQuestions(index, ids, { query: "zzzz-nonexistent" }), []);
  const ecg = catalog.stations.find((s) => s.id === "ecg");
  const result = filterPracticalQuestions(index, ecg.questionIds, { query: "  PAPER speed ", filter: "new" });
  assert(result.length > 0 && result.every((id) => ecg.questionIds.includes(id) && bank.find((q) => q.id === id).tags.includes('practical-theory-expansion')));
});

test("independent worked-value checks protect common calculation traps", () => {
  const expected = {
    "pp-ecg-theory-small-box-voltage": `${8 / 10} mV`,
    "pp-ecg-theory-rate-fifty-speed": `${60 / (25 / 50)} beats/min`,
    "pp-ecg-theory-timed-strip-rate": `${13 * 6} beats/min`,
    "pp-spirometry-theory-percent-predicted-case": `${Math.round(3.24 / 4 * 100)}%`,
    "pp-spirometry-theory-mixed-volume-units": `${2800 / 3500 * 100}%`,
    "pp-rbc-theory-rbc-five-counts": `${((96 + 102 + 100 + 104 + 98) * 200 / 0.02 / 1e6).toFixed(1)} million cells/µL`,
    "pp-wbc-theory-wbc-four-counts": `${((32 + 28 + 30 + 34) * 20 / 0.4).toLocaleString("en-US")}/µL`,
    "pp-differential-theory-dlc-twohundred": `${Math.round(112 / 200 * 100)}%`,
    "pp-hematocrit-theory-hct-18-45": `${18 / 45 * 100}%`,
  };
  for (const [id, answer] of Object.entries(expected)) {
    const question = bank.find((q) => q.id === id);
    assert.equal(question.options.find((option) => option.id === question.correctOptionId).text, answer, id);
  }
});
