import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { auditTerm2ConceptCatalog } from "../src/lib/term2/concept-audit.mjs";

const root = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

async function allQuestionsFor(examId) {
  const directory = new URL("data/bank/questions/", root);
  const files = (await readdir(directory)).filter((name) => name.endsWith(".jsonl")).sort();
  const questions = [];
  for (const file of files) {
    const content = await readFile(new URL(file, directory), "utf8");
    questions.push(...content.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse));
  }
  return questions.filter((item) => item.tags?.includes(`exam-${examId}`));
}

const question = {
  id: "cvs-gap-example",
  status: "verified",
  kind: "single_best_answer",
  subject: "physiology",
  prompt: "Which variable most directly determines this relationship?",
  learningObjective: "Apply the relationship to a new physiological condition.",
  source: { title: "Local CVS slides", slide: "12" },
  tags: ["term-2", "exam-term2-cvs", "study-practice", "gap-audit"],
};
const catalog = {
  examId: "term2-cvs",
  updatedAt: "2026-08-31",
  modules: [{ id: "cvs-hemodynamics", subject: "physiology", title: "Hemodynamics" }],
  concepts: [{
    id: "cvs-flow-resistance",
    moduleId: "cvs-hemodynamics",
    subject: "physiology",
    scope: "course",
    sources: [{ title: "Local CVS slides", locator: "slide 12", basis: "slides" }],
    objectives: [{ id: "cvs-flow-resistance-objective", questionIds: [question.id] }],
  }],
  sourceAudit: [{ source: "Local CVS slides", locator: "slide 12", topic: "Flow and resistance", status: "mapped", conceptIds: ["cvs-flow-resistance"] }],
};

test("generic Term 2 concept audit creates a complete objective/question index", () => {
  const result = auditTerm2ConceptCatalog(catalog, [question]);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.index[question.id].conceptIds, ["cvs-flow-resistance"]);
  assert.equal(result.index[question.id].addedForGap, true);
  assert.equal(result.report.objectivesFirstSampledByExpansion, 1);
  assert.equal(result.report.unsampledObjectiveIds.length, 0);
});

test("generic Term 2 concept audit rejects assessment relabeling and unsupported course scope", () => {
  const badQuestion = structuredClone(question);
  badQuestion.tags.push("official-exam");
  const badCatalog = structuredClone(catalog);
  badCatalog.concepts[0].sources = [{ title: "Local textbook", locator: "page 12", basis: "book" }];
  const result = auditTerm2ConceptCatalog(badCatalog, [badQuestion]);
  assert(result.errors.some((error) => error.includes("forbidden past/final")));
  assert(result.errors.some((error) => error.includes("course scope needs direct course evidence")));
});

test("verified CVS, limbs and biochemistry concept maps remain exhaustive and internally linked", async () => {
  const expected = [
    { stem: "cvs", examId: "term2-cvs", concepts: 106, modules: 18, objectives: 106, questions: 194, gaps: 43, images: 12, interactive3d: 28 },
    { stem: "limbs", examId: "term2-limbs", concepts: 79, modules: 14, objectives: 173, questions: 173, gaps: 17, images: 0, interactive3d: 32 },
    { stem: "biochemistry", examId: "term2-biochemistry", concepts: 50, modules: 12, objectives: 94, questions: 196, gaps: 38, images: 0, interactive3d: 0 },
  ];

  for (const item of expected) {
    const [catalog, storedIndex, storedCoverage, questions] = await Promise.all([
      readJson(`data/term2/${item.stem}-concepts.json`),
      readJson(`data/term2/${item.stem}-question-index.json`),
      readJson(`data/term2/${item.stem}-coverage.json`),
      allQuestionsFor(item.examId),
    ]);
    const result = auditTerm2ConceptCatalog(catalog, questions);
    assert.deepEqual(result.errors, [], `${item.examId} audit errors`);
    assert.deepEqual(result.index, storedIndex, `${item.examId} generated question index drifted`);
    assert.deepEqual(result.report, storedCoverage, `${item.examId} generated coverage report drifted`);
    assert.equal(catalog.concepts.length, item.concepts);
    assert.equal(catalog.modules.length, item.modules);
    assert.equal(catalog.concepts.flatMap((concept) => concept.objectives).length, item.objectives);
    assert.equal(questions.length, item.questions);
    assert.equal(storedCoverage.addedQuestionCount, item.gaps);
    assert.equal(storedCoverage.imageQuestionCount, item.images);
    assert.equal(storedCoverage.interactive3dCount, item.interactive3d);
    assert.deepEqual(storedCoverage.unmappedQuestionIds, []);
    assert.deepEqual(storedCoverage.unsampledObjectiveIds, []);
    assert(questions.every((entry) => !entry.tags.some((tag) => /past|final|official-exam/.test(tag))));
  }
});

test("the Term 2 theory UI exposes source scope, objective practice and post-answer concept repair", async () => {
  const [page, hub] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("src/components/Term2ConceptHub.tsx", root), "utf8"),
  ]);
  assert.match(page, /<Term2ConceptHub/);
  assert.match(page, /<Term2ConceptFeedback/);
  assert.match(page, /hasImmediateFeedback && selectedConceptDataset/);
  assert.match(hub, /Course-supported/);
  assert.match(hub, /Book extension/);
  assert.match(hub, /Practice objective/);
  assert.match(hub, /Coverage & source audit/);
  assert.match(hub, /added after gap audit/);
});
