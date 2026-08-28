import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { auditRespiratoryCatalog } from "../src/lib/respiratory/audit.mjs";
import { distinctQuestionIds, questionProgress, parseConceptReading, normalizeRespiratoryPractice } from "../src/lib/respiratory/progress.mjs";
import { selectRespiratorySprint } from "../src/lib/mcq/respiratory-selection.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(new URL("../data/term2/respiratory-concepts.json", import.meta.url), "utf8"));
const index = JSON.parse(await readFile(new URL("../data/term2/respiratory-question-index.json", import.meta.url), "utf8"));
const dir = new URL("../data/bank/questions/", import.meta.url);
const questions = (await Promise.all((await readdir(dir)).filter((name) => name.startsWith("term2-respiratory-") && name.endsWith(".jsonl")).sort().map(async (name) => (await readFile(new URL(name, dir), "utf8")).trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))))).flat();

async function route(path, body) {
  const { default: worker } = await import("../dist/server/index.js");
  return worker.fetch(new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("respiratory source inventory, concept objectives and every question cross-reference without gaps", async () => {
  const { errors, index: expectedIndex, report } = auditRespiratoryCatalog(catalog, questions);
  assert.deepEqual(errors, []);
  assert.deepEqual(index, expectedIndex);
  assert.deepEqual(JSON.parse(await readFile(new URL("../data/term2/respiratory-coverage.json", import.meta.url), "utf8")), report);
  assert(report.conceptCount >= 70);
  assert(report.addedQuestionCount > 60);
  assert.equal(report.questionCount - report.addedQuestionCount, 224, "all original respiratory records retained");
  assert.equal(report.dynamicTargetCount, 28);
  assert.equal(report.dynamicVariantCount, 56);
  assert.equal(report.distinctPracticeItems, report.questionCount - 28);
  assert.deepEqual(report.unmappedQuestionIds, []);
  assert.deepEqual(report.unsampledObjectiveIds, []);
  assert(report.objectivesFirstSampledByExpansion > 30);
  assert(catalog.sourceAudit.some((entry) => entry.status === "source-missing" && /physiology/i.test(`${entry.topic} ${entry.note}`)));
  assert(catalog.sourceAudit.some((entry) => entry.status === "source-missing" && /blueprint/i.test(`${entry.topic} ${entry.note}`)));
  assert(catalog.concepts.every((concept) => concept.keyPoints.length >= 4 && concept.retrievalPrompts.length > 0 && concept.sources.length > 0));
  assert(catalog.concepts.filter((concept) => concept.subject === "physiology").every((concept) => concept.scope === "book-only"));
});

test("audit catches stale IDs, incorrect evidence labels, empty objectives and missing inventory", () => {
  const broken = structuredClone(catalog);
  broken.concepts[0].objectives[0].questionIds = ["resp-missing-question"];
  const errors = auditRespiratoryCatalog(broken, questions).errors;
  assert(errors.some((error) => /unknown question resp-missing-question/.test(error)));
  broken.concepts[0].objectives[0].questionIds = [];
  broken.concepts[0].scope = "book-and-slides";
  broken.concepts[0].sources = broken.concepts[0].sources.filter((source) => source.basis === "book");
  broken.sourceAudit = [];
  const missing = auditRespiratoryCatalog(broken, questions).errors;
  assert(missing.some((error) => /unsampled/.test(error)));
  assert(missing.some((error) => /needs both/.test(error)));
  assert(missing.some((error) => /absent from mapped source/.test(error)));
});

test("reading bookmarks tolerate corruption and do not imply answered or mastered questions", () => {
  assert.deepEqual(parseConceptReading(null, ["a"]), []);
  assert.deepEqual(parseConceptReading("not json", ["a"]), []);
  assert.deepEqual(parseConceptReading('{"version":1,"readIds":["a","a","old",null]}', ["a"]), ["a"]);
  assert.deepEqual(parseConceptReading('{"version":2,"readIds":["a"]}', ["a"]), []);
  const sample = { v1: { dedupeKey: "target" }, v2: { dedupeKey: "target" }, q3: { dedupeKey: "q3" } };
  assert.deepEqual(distinctQuestionIds(["v1", "v2", "q3"], sample), ["v1", "q3"]);
  assert.deepEqual(questionProgress(["v1", "v2", "q3"], ["v2"], ["v1"], sample), { total: 2, attempted: 1, repair: 1 });
  assert.deepEqual(questionProgress(["v1", "v2", "q3"], [], [], sample), { total: 2, attempted: 0, repair: 0 });
});

test("saved concept scopes preserve the exact practice pool and cannot leak into other exams", () => {
  const concept = catalog.concepts[0];
  const ids = [...new Set(concept.objectives.flatMap((objective) => objective.questionIds))];
  const saved = normalizeRespiratoryPractice("term2-respiratory", concept.id, [...ids, "legacy-id", ids[0]], index);
  assert.deepEqual(saved, { respiratoryScopeId: concept.id, respiratoryPracticeIds: ids });
  assert.deepEqual(normalizeRespiratoryPractice("july25", concept.id, ids, index), {});
  assert.deepEqual(normalizeRespiratoryPractice("term2-respiratory", "invalid", ids, index), {});
  assert.deepEqual(normalizeRespiratoryPractice("term2-respiratory", concept.id, null, index), {});
  assert.deepEqual(normalizeRespiratoryPractice("term2-respiratory", concept.id, ["constructor", "__proto__"], index), {});
});

test("anatomy variants share concept homes and a seen target is not relabeled unseen", () => {
  const grouped = new Map();
  for (const question of questions.filter((question) => question.anatomy)) {
    const key = index[question.id].dedupeKey;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(question);
  }
  for (const variants of grouped.values()) {
    assert.equal(variants.length, 2);
    assert.deepEqual(index[variants[0].id].conceptIds, index[variants[1].id].conceptIds);
    const result = selectRespiratorySprint([variants[1]], { limit: 1, seenIds: [variants[0].id] });
    assert.equal(result.unseenCount, 0);
    assert.equal(result.ordinaryReviewCount, 1);
  }
});

test("scoped respiratory API uses deduplicated mode-aware sampling and exact resume", async () => {
  const ids = questions.filter((question) => question.anatomy).map((question) => question.id);
  for (const studyMode of ["learn", "exam"]) {
    const response = await route("/api/questions/by-ids", { exam: "term2-respiratory", ids, limit: 250, prioritize: true, studyMode });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.questions.length, 28);
    assert.equal(new Set(payload.questions.map((question) => index[question.id].dedupeKey)).size, 28);
    const chosenIds = payload.questions.map((question) => question.id).reverse();
    const restored = await (await route("/api/questions/by-ids", { exam: "term2-respiratory", ids: chosenIds, limit: 250, preserveOrder: true })).json();
    assert.deepEqual(restored.questions.map((question) => question.id), chosenIds);
  }
  const phys = questions.filter((question) => question.subject === "physiology");
  const mock = selectRespiratorySprint(phys, { limit: 20, studyMode: "exam", random: () => 0.31 });
  assert.equal(new Set(mock.questions.map((question) => index[question.id].moduleId)).size, 5);
  const hidden = await (await route("/api/questions/by-ids", { exam: "term2-cvs", ids, limit: 250, prioritize: true })).json();
  assert.deepEqual(hidden.questions, []);
});

test("concept interface renders substantive notes, retrieval and objective practice without browser automation", async () => {
  const result = await build({
    stdin: { contents: `import React from "react"; import {renderToStaticMarkup} from "react-dom/server"; import {RespiratoryConceptHub, RespiratoryConceptFeedback} from "./src/components/RespiratoryConceptHub"; export const renderHub = () => renderToStaticMarkup(<RespiratoryConceptHub attemptedIds={[]} repairIds={[]} disabled={false} onPractice={() => {}} />); export const renderFeedback = (questionId) => renderToStaticMarkup(<RespiratoryConceptFeedback questionId={questionId} />);`, loader: "tsx", resolveDir: root },
    platform: "node", format: "cjs", bundle: true, packages: "external", write: false,
    alias: { "@": root },
  });
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(import.meta.url), compiledModule, compiledModule.exports);
  const html = compiledModule.exports.renderHub();
  assert.match(html, /Study concepts/);
  assert.match(html, /Read at the source/);
  assert.match(html, /Reveal model answer/);
  assert.match(html, /Practice objective/);
  assert.match(html, /Inspect linked questions/);
  assert.match(html, /Marked theory|Mark theory as read/);
  assert.match(html, /source audit/i);
  const feedback = compiledModule.exports.renderFeedback(questions[0].id);
  assert.match(feedback, /Connect the answer to the theory/);
  assert.equal(compiledModule.exports.renderFeedback("not-a-respiratory-id"), "");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /hasImmediateFeedback && exam === "term2-respiratory" && <RespiratoryConceptFeedback/);
  assert.match(page, /startSession\(collection, activeRespiratoryPracticeIds/);
  assert.match(page, /studyMode: nextStudyMode/);
});
