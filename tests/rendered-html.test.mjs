import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { parseFinalExamProgress, reconcileFinalExamSession } from "../src/lib/mcq/final-exam-state.mjs";
import { selectCoverageSprint } from "../src/lib/mcq/sprint-selection.mjs";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the MED//25 exam dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>MED\/\/25 Exam Sprint<\/title>/i);
  assert.match(html, /July 25 · Aug 22 · Aug 25/i);
  assert.match(html, /Tissue Development &amp; Function/i);
  assert.match(html, /Cell &amp; Molecules/i);
  assert.match(html, /Histology Practical/i);
  assert.match(html, /Priority exam/i);
  assert.match(html, /Codex tutor/i);
  assert.match(html, /Visual Guide/i);
  assert.match(html, /Practical Atlas/i);
  assert.match(html, /Histology Practical/i);
  assert.match(html, /VISUAL LESSONS/i);
  assert.match(html, /histology/i);
  assert.match(html, /embryology/i);
  assert.doesNotMatch(html, /Your site is taking shape|starter loading skeleton/i);
});

test("source provides immediate answer feedback and supports the confirmed exam split", async () => {
  const [page, bridge, finalExam, finalExamState, lessonGuide, manifestText, questionFiles, finalExamFiles, practicalQuestionText, fullPracticalQuestionText, identificationQuestionText, practicalLessonText, fullPracticalLessonText] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/codex-bridge.mjs", import.meta.url), "utf8"),
    readFile(new URL("../src/components/FinalExam.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/mcq/final-exam-state.mjs", import.meta.url), "utf8"),
    readFile(new URL("../src/components/LessonGuide.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/bank/manifest.json", import.meta.url), "utf8"),
    readdir(new URL("../data/bank/questions/", import.meta.url)),
    readdir(new URL("../data/telegram-final/", import.meta.url)),
    readFile(new URL("../data/bank/questions/histology-practicals.jsonl", import.meta.url), "utf8"),
    readFile(new URL("../data/bank/questions/histology-practicals-full.jsonl", import.meta.url), "utf8"),
    readFile(new URL("../data/bank/questions/histology-identification-15.jsonl", import.meta.url), "utf8"),
    readFile(new URL("../data/lessons/histology-practicals.json", import.meta.url), "utf8"),
    readFile(new URL("../data/lessons/histology-practicals-full.json", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const practicalQuestions = [practicalQuestionText, fullPracticalQuestionText].flatMap((text) => text.trim().split(/\r?\n/).map((line) => JSON.parse(line)));
  const identificationQuestions = identificationQuestionText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const practicalLessons = [...JSON.parse(practicalLessonText).lessons, ...JSON.parse(fullPracticalLessonText).lessons];

  assert.deepEqual(manifest.examDates, ["2026-07-25", "2026-08-22", "2026-08-25"]);
  assert.deepEqual(manifest.subjects.map((subject) => subject.id), [
    "histology",
    "embryology",
    "physiology",
    "biochemistry",
  ]);
  assert.ok(questionFiles.filter((name) => name.endsWith(".jsonl")).length >= 10);
  assert.deepEqual(finalExamFiles.filter((name) => name.endsWith(".jsonl")).sort(), ["july25.jsonl", "july29.jsonl"]);

  assert.match(page, /if \(phase === "active"\)/);
  assert.match(page, /hasImmediateFeedback/);
  assert.match(page, /option-inline-explanation/);
  assert.match(page, /Why this is right/);
  assert.match(page, /Why this is wrong/);
  assert.doesNotMatch(page, /Why the other three lose/);
  assert.match(page, /Write the tissue or marked structure/);
  assert.match(page, /no word bank/);
  assert.match(page, /Check tissue/);
  assert.match(page, /interpretWrittenAnswer/);
  assert.match(page, /What confirms it across both magnifications/);
  assert.match(page, /Ask Codex: why my tissue differs/);
  assert.match(page, /study-image-pair/);
  assert.match(page, /option\.id === question\.correctOptionId \? "correct"/);
  assert.match(page, /End session/);
  assert.match(page, /Finish & grade/);
  assert.match(page, /if \(phase === "review"\)/);
  assert.match(page, /Ask Codex to audit my reasoning/);
  assert.match(page, /Open 90-second visual lesson/);
  assert.match(page, /tab === "Visual Guide" && <LessonGuide/);
  assert.match(page, /lessonForQuestion/);
  assert.match(page, /Tabs disappear during MCQs/);
  assert.match(page, /Guyton Chapters 1–8/);
  assert.match(page, /GUYTON 1–8/);
  assert.match(page, /Membrane physiology/);
  assert.match(page, /Biochemistry/);
  assert.match(page, /Practical \+ spotters/);
  assert.match(page, /55-specimen practical bank/);
  assert.match(page, /paired wide\/close views for the confirmed 15 slides/);
  assert.match(page, /histo-identification/);
  assert.match(page, /Structure identification · name marker A/);
  assert.match(page, /study-image-marker/);
  assert.match(page, /Test all \{examCount\("histo-practical"\)\}/);
  assert.match(page, /tab === "Practical Atlas"/);
  assert.match(page, /startSession\("histo-practical"/);
  assert.match(page, /if \(exactIds \|\| isSavedCollection\(nextCollection\)\)/);
  assert.match(page, /reproductive histology/i);
  assert.match(page, /med25-study-progress-v1/);
  assert.match(page, /med25-session-archive-v1/);
  assert.match(page, /Final exam/);
  assert.match(page, /<FinalExam/);
  assert.match(finalExam, /FINAL_EXAM_STORAGE_KEY/);
  assert.match(finalExamState, /med25-final-exam-v1/);
  assert.match(finalExam, /Continue final exam/);
  assert.match(finalExam, /instant-feedback/);
  assert.match(finalExam, /Previous/);
  assert.match(finalExam, /Next question/);
  assert.match(finalExam, /Delete progress & restart/);
  assert.match(bridge, /\/api\/final-exam/);
  assert.match(bridge, /loadFinalExamQuestions/);
  assert.match(page, /Past sprint results/);
  assert.match(page, /history: \[completedSession, \.\.\.current\.history\]/);
  assert.match(page, /Continue sprint/);
  assert.match(page, /Delete unfinished sprint/);
  assert.doesNotMatch(page, /maxSavedSessions/);
  assert.match(page, /active: null/);
  assert.match(page, /Wrong answers/);
  assert.match(page, /Retry these/);
  assert.match(page, /Clear .* saved progress/);
  assert.match(page, /window\.localStorage\.setItem/);
  assert.match(page, /wrongIds: \[\.\.\.new Set/);
  assert.match(page, /flaggedIds: flagged \? \[\.\.\.existing, questionId\] : existing/);
  assert.doesNotMatch(page, /cellbiology|Cell biology/);
  assert.match(page, /\/api\/questions\/sprint/);
  assert.match(page, /80% unseen \/ 20% review/);
  assert.match(page, /historicalSeenIds/);
  assert.match(bridge, /coverageQuestionSet/);
  assert.match(bridge, /collectionQuestionIds/);
  assert.match(bridge, /"histo-practical"/);
  assert.match(bridge, /"histo-identification"/);
  assert.match(bridge, /histo-identification-15/);
  assert.match(page, /builder-coverage/);
  assert.match(page, /seenCollectionCount/);
  assert.match(page, /unseenCollectionCount/);
  assert.match(bridge, /selectCoverageSprint/);
  assert.match(bridge, /JULY_25_HISTOLOGY_TOPICS/);
  assert.match(bridge, /Male reproductive system/);
  assert.match(bridge, /Female reproductive system/);
  assert.match(bridge, /JULY_25_EMBRYOLOGY_TOPICS/);
  assert.match(bridge, /JULY_25_PHYSIOLOGY_TOPICS/);
  assert.match(bridge, /"Cell physiology and homeostasis"/);
  assert.match(bridge, /"Membrane transport"/);
  assert.match(bridge, /"Membrane potentials"/);
  assert.match(bridge, /"Action potentials"/);
  assert.match(bridge, /Birth defects and prenatal diagnosis/);
  assert.match(bridge, /Neurotransmission and neurotransmitters/);
  assert.match(bridge, /JULY_29_BIOCHEMISTRY_TOPICS/);
  assert.match(bridge, /Practical biochemistry/);
  assert.match(bridge, /dna repair mechanisms/);
  assert.match(bridge, /Spectrophotometry/);
  assert.match(bridge, /DNA extraction/);
  assert.match(bridge, /POST" && url\.pathname === "\/api\/questions\/by-ids/);
  assert.match(bridge, /idSet\.has\(question\.id\) && matchesExam\(question, exam\)/);
  assert.match(bridge, /body\.preserveOrder === true/);
  assert.match(lessonGuide, /Full screen/);
  assert.match(lessonGuide, /Escape/);
  assert.match(lessonGuide, /Test this slide/);
  assert.equal(practicalQuestions.length, 165);
  assert.equal(identificationQuestions.length, 60);
  assert.equal(identificationQuestions.filter((question) => question.media[0].annotations?.length).length, 30);
  assert.equal(identificationQuestions.filter((question) => question.tags.includes("specimen-identification") && question.media.length === 2).length, 30);
  assert.equal(identificationQuestions.filter((question) => question.tags.includes("structure-identification") && question.media.length === 1).length, 30);
  assert.ok(identificationQuestions.every((question) => question.tags.includes("written-answer") && question.tags.some((tag) => tag.startsWith("priority-"))));
  assert.equal(new Set(identificationQuestions.map((question) => question.tags.find((tag) => [
    "trachea", "bladder", "bone", "cartilage", "joint", "nerve", "ganglion", "skin-with-hair", "skin-without-hair", "white-adipose", "brown-adipose", "thyroid", "skeletal-muscle", "cardiac-muscle", "tendon",
  ].includes(tag)))).size, 15);
  assert.ok(identificationQuestions.every((question) => question.tags.includes("histo-identification-15") && question.tags.includes("identification-only")));
  assert.ok(identificationQuestions.every((question) => question.options.length === 4 && Object.keys(question.distractorExplanations).length === 3));
  assert.ok(identificationQuestions.every((question) => question.options.filter((option) => option.id !== question.correctOptionId).every((option) => question.distractorExplanations[option.id]?.length >= 45)));
  assert.ok(identificationQuestions.every((question) => question.qualityFlags.includes("student-labels-independent")));
  assert.ok(identificationQuestions.some((question) => question.id === "hpi15-bone-identify-overview" && question.options.find((option) => option.id === question.correctOptionId)?.text === "Spongy (trabecular) bone"));
  assert.equal(practicalLessons.length, 55);
  assert.ok(practicalQuestions.every((question) => question.tags.includes("exam-aug22")));
  assert.ok(practicalQuestions.every((question) => question.revision === 2));
  assert.ok(practicalQuestions.every((question) => question.options.filter((option) => option.id !== question.correctOptionId).every((option) => question.distractorExplanations[option.id]?.length >= 45)));
  assert.ok(practicalQuestions.every((question) => question.qualityFlags.includes("complete-distractor-reasoning")));
  assert.ok(practicalLessons.every((lesson) => lesson.exam === "aug22"));
  assert.ok(practicalLessons.every((lesson) => practicalQuestions.filter((question) => question.id.startsWith(`${lesson.id}-`)).length === 3));
  assert.ok(practicalQuestions.every((question) => question.tags.includes("histo-practical") && question.kind === "image_single_best_answer"));
  assert.ok(practicalLessons.every((lesson) => lesson.id.startsWith("hpr-") && lesson.asset));
  assert.doesNotMatch(bridge, /JULY_29_CELL_BIOLOGY_TOPICS/);
});

test("coverage-first sprints use 80 percent unseen and prioritize repair questions", () => {
  const questions = Array.from({ length: 100 }, (_, index) => ({ id: `q-${index}` }));
  const seenIds = questions.slice(0, 40).map((question) => question.id);
  const repairIds = questions.slice(0, 8).map((question) => question.id);
  const selected = selectCoverageSprint(questions, { limit: 20, seenIds, repairIds, random: () => 0.5 });
  const selectedIds = selected.questions.map((question) => question.id);

  assert.equal(selected.questions.length, 20);
  assert.equal(new Set(selectedIds).size, 20);
  assert.equal(selected.unseenCount, 16);
  assert.equal(selected.reviewCount, 4);
  assert.equal(selectedIds.filter((id) => repairIds.includes(id)).length, 4);
});

test("coverage-first sprints fill from the available pool when an 80/20 split is impossible", () => {
  const questions = Array.from({ length: 20 }, (_, index) => ({ id: `q-${index}` }));
  const seenIds = questions.slice(0, 18).map((question) => question.id);
  const selected = selectCoverageSprint(questions, { limit: 10, seenIds, random: () => 0.5 });

  assert.equal(selected.questions.length, 10);
  assert.equal(selected.unseenCount, 2);
  assert.equal(selected.reviewCount, 8);
});

test("final-exam progress survives reloads and reconciles a revised bank", () => {
  const questions = [
    { id: "q-1", revision: 1, options: [{ id: "A" }, { id: "B" }], correctOptionId: "A" },
    { id: "q-2", revision: 1, options: [{ id: "A" }, { id: "B" }], correctOptionId: "B" },
  ];
  const first = reconcileFinalExamSession(null, questions, "bank-1");
  first.currentIndex = 1;
  first.answers["q-1"] = {
    selectedOptionId: "A",
    correct: true,
    answeredAt: "2026-07-23T00:00:00.000Z",
    questionRevision: 1,
    correctOptionId: "A",
  };

  const parsed = parseFinalExamProgress(JSON.stringify({
    version: 1,
    exams: { july25: first, july29: null },
  }), {
    july25: {
      fingerprint: "bank-2",
      questions: [
        questions[0],
        { id: "q-3", revision: 1, options: [{ id: "A" }, { id: "B" }], correctOptionId: "B" },
      ],
    },
  });

  assert.deepEqual(parsed.exams.july25.questionIds, ["q-1", "q-3"]);
  assert.equal(parsed.exams.july25.answers["q-1"].correct, true);
  assert.equal(parsed.exams.july25.currentIndex, 1);
  assert.equal(parsed.exams.july25.bankFingerprint, "bank-2");
});

test("final-exam reconciliation follows the current question and unlocks revised items", () => {
  const original = [
    { id: "q-1", revision: 1, options: [{ id: "A" }, { id: "B" }], correctOptionId: "A" },
    { id: "q-2", revision: 1, options: [{ id: "A" }, { id: "B" }], correctOptionId: "B" },
    { id: "q-3", revision: 1, options: [{ id: "A" }, { id: "B" }], correctOptionId: "A" },
  ];
  const saved = reconcileFinalExamSession(null, original, "bank-1");
  saved.currentIndex = 1;
  saved.answers["q-2"] = {
    selectedOptionId: "B",
    correct: true,
    answeredAt: "2026-07-23T00:00:00.000Z",
    questionRevision: 1,
    correctOptionId: "B",
  };

  const revised = [
    { id: "q-2", revision: 2, options: [{ id: "A" }, { id: "B" }], correctOptionId: "A" },
    original[2],
  ];
  const next = reconcileFinalExamSession(saved, revised, "bank-2");

  assert.deepEqual(next.questionIds, ["q-2", "q-3"]);
  assert.equal(next.currentIndex, 0);
  assert.equal(next.answers["q-2"], undefined);
});
