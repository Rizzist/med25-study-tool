import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { biochemistryChapterIdForQuestion } from "../src/lib/biochemistry/chapter-mapping.mjs";
import { filterFinalExamQuestions, isCarbohydrateOrLipidMetabolism } from "../src/lib/mcq/final-exam-scope.mjs";
import { parseFinalExamProgress, reconcileFinalExamSession } from "../src/lib/mcq/final-exam-state.mjs";
import { classifySessionCompletion, selectCoverageSprint } from "../src/lib/mcq/sprint-selection.mjs";

async function fetchBuiltRoute(pathname, init) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, init),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function render() {
  return fetchBuiltRoute("/", { headers: { accept: "text/html" } });
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
  const [page, bridge, finalExam, finalExamState, lessonGuide, manifestText, questionFiles, finalExamFiles, practicalQuestionText, fullPracticalQuestionText, identificationQuestionText, transferQuestionText, transferCatalogText, practicalLessonText, fullPracticalLessonText] = await Promise.all([
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
    readFile(new URL("../data/bank/questions/histology-transfer-100.jsonl", import.meta.url), "utf8"),
    readFile(new URL("../data/teacher-materials/histology-internet-example-catalog.json", import.meta.url), "utf8"),
    readFile(new URL("../data/lessons/histology-practicals.json", import.meta.url), "utf8"),
    readFile(new URL("../data/lessons/histology-practicals-full.json", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const practicalQuestions = [practicalQuestionText, fullPracticalQuestionText].flatMap((text) => text.trim().split(/\r?\n/).map((line) => JSON.parse(line)));
  const identificationQuestions = identificationQuestionText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const transferQuestions = transferQuestionText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const transferCatalog = JSON.parse(transferCatalogText);
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
  assert.match(page, /100\+ unfamiliar-field transfer bank/);
  assert.match(page, /histo-identification/);
  assert.match(page, /histo-transfer/);
  assert.match(page, /110\+ field unfamiliar-slide transfer lab/);
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
  assert.match(page, /repair → unseen → mastered/);
  assert.match(page, /visitedQuestionIds/);
  assert.match(page, /untouched .* remain.* unseen and will return with priority/);
  assert.match(page, /historicalSeenIds/);
  assert.match(bridge, /coverageQuestionSet/);
  assert.match(bridge, /collectionQuestionIds/);
  assert.match(bridge, /"histo-practical"/);
  assert.match(bridge, /"histo-identification"/);
  assert.match(bridge, /"histo-transfer"/);
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
  assert.equal(transferCatalog.count, 112);
  assert.equal(transferQuestions.length, 114);
  assert.ok(transferQuestions.every((question) => question.tags.includes("histo-transfer-100") && question.tags.includes("written-answer")));
  assert.ok(transferQuestions.every((question) => question.options.length === 4 && Object.keys(question.distractorExplanations).length === 3));
  assert.ok(transferQuestions.every((question) => question.qualityFlags.includes("answer-neutral-image")));
  assert.ok(transferQuestions.some((question) => question.options.find((option) => option.id === question.correctOptionId)?.text === "Synovial joint (diarthrosis)"));
  assert.ok(transferQuestions.some((question) => question.options.find((option) => option.id === question.correctOptionId)?.text === "Articular hyaline cartilage"));
  assert.ok(transferQuestions.some((question) => question.options.find((option) => option.id === question.correctOptionId)?.text === "Synovium (synovial membrane)"));
  assert.ok(transferQuestions.some((question) => question.options.find((option) => option.id === question.correctOptionId)?.text === "Woven (immature) bone"));
  assert.ok(transferQuestions.some((question) => question.options.find((option) => option.id === question.correctOptionId)?.text === "Autonomic ganglion"));
  assert.ok(transferQuestions.some((question) => question.options.find((option) => option.id === question.correctOptionId)?.text === "Simple cuboidal epithelium"));
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

test("focused sprints exhaust repair before unseen and mastered questions", () => {
  const questions = Array.from({ length: 100 }, (_, index) => ({ id: `q-${index}` }));
  const seenIds = questions.slice(0, 40).map((question) => question.id);
  const repairIds = questions.slice(0, 8).map((question) => question.id);
  const selected = selectCoverageSprint(questions, { limit: 20, seenIds, repairIds, random: () => 0.5 });
  const selectedIds = selected.questions.map((question) => question.id);

  assert.equal(selected.questions.length, 20);
  assert.equal(new Set(selectedIds).size, 20);
  assert.equal(selected.repairCount, 8);
  assert.equal(selected.unseenCount, 12);
  assert.equal(selected.reviewCount, 8);
  assert.equal(selected.ordinaryReviewCount, 0);
  assert.ok(selectedIds.slice(0, 8).every((id) => repairIds.includes(id)));
  assert.ok(selectedIds.slice(8).every((id) => !seenIds.includes(id)));
});

test("a large repair queue fills a focused sprint before any unseen question", () => {
  const questions = Array.from({ length: 100 }, (_, index) => ({ id: `q-${index}` }));
  const repairIds = questions.slice(0, 30).map((question) => question.id);
  const selected = selectCoverageSprint(questions, {
    limit: 20,
    seenIds: repairIds,
    repairIds,
    random: () => 0.5,
  });

  assert.equal(selected.repairCount, 20);
  assert.equal(selected.unseenCount, 0);
  assert.equal(selected.ordinaryReviewCount, 0);
  assert.ok(selected.questions.every((question) => repairIds.includes(question.id)));
});

test("ending a 100-question session early leaves untouched questions unseen", () => {
  const questionIds = Array.from({ length: 100 }, (_, index) => `q-${index}`);
  const completion = classifySessionCompletion(questionIds, {
    visitedIds: questionIds.slice(0, 6),
    answeredIds: questionIds.slice(0, 5),
    correctIds: questionIds.slice(0, 4),
  });

  assert.deepEqual(completion.seenIds, questionIds.slice(0, 6));
  assert.deepEqual(completion.correctIds, questionIds.slice(0, 4));
  assert.deepEqual(completion.repairIds, questionIds.slice(4, 6));
  assert.deepEqual(completion.unansweredIds, [questionIds[5]]);
  assert.deepEqual(completion.untouchedIds, questionIds.slice(6));
});

test("biochemistry chapter mode is source-traceable, scoped and fully explanatory", async () => {
  const [page, chapterHub, chapterDefinitions, bridge, lippincottText, carbohydrateText] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/BiochemistryChapterHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/biochemistry/chapters.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/codex-bridge.mjs", import.meta.url), "utf8"),
    readFile(new URL("../data/bank/questions/biochemistry-lippincott-chapter-bank.jsonl", import.meta.url), "utf8"),
    readFile(new URL("../data/bank/questions/biochemistry-carbohydrate-metabolism-chapters.jsonl", import.meta.url), "utf8"),
  ]);
  const lippincottQuestions = lippincottText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const carbohydrateQuestions = carbohydrateText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const questions = [...lippincottQuestions, ...carbohydrateQuestions];

  assert.equal(lippincottQuestions.length, 2366);
  assert.equal(carbohydrateQuestions.length, 100);
  assert.ok(questions.every((question) => question.status === "verified" && question.options.length === 4));
  assert.ok(questions.every((question) => Object.keys(question.distractorExplanations).length === 3));
  assert.ok(questions.every((question) => biochemistryChapterIdForQuestion(question)));
  assert.deepEqual(new Set(carbohydrateQuestions.map((question) => biochemistryChapterIdForQuestion(question))), new Set(["ch-9", "ch-10", "ch-11", "ch-12", "ch-13"]));
  assert.match(page, /studyMode === "learn" && hasAnswer/);
  assert.match(page, /hasImmediateFeedback && <small className/);
  assert.match(page, /BiochemistryChapterHub/);
  assert.match(page, /BiochemistryMasteryGrid/);
  assert.match(chapterHub, /Learn/);
  assert.match(chapterHub, /Chapter exam/);
  assert.match(chapterHub, /Teacher-confirmed/);
  assert.match(chapterHub, /Lippincott supplement/);
  assert.match(chapterHub, /Not teacher-confirmed/);
  assert.match(chapterHub, /inclusion in the August 25 exam is not confirmed/);
  for (const chapter of [8, 9, 10, 11, 12, 13]) {
    assert.match(chapterDefinitions, new RegExp(`chapterNumber: ${chapter},[^\\n]+coverage: "unconfirmed"`));
  }
  for (const chapter of [6, 7, 14, 15, 16, 17, 18, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33]) {
    assert.match(chapterDefinitions, new RegExp(`chapterNumber: ${chapter},[^\\n]+coverage: "confirmed"`));
  }
  assert.match(chapterHub, /Repair \$\{chapter\.repairCount\}/);
  assert.match(bridge, /biochemistryChapterId/);
  assert.match(bridge, /biochemistryChapters/);
});

test("the active biochemistry bank is concept-curated without deleting the generated archive", async () => {
  const [catalogText, questionFiles, page, chapterHub, bridge, finalExamText, summaryResponse, finalResponse] = await Promise.all([
    readFile(new URL("../data/bank/biochemistry-core-concepts.json", import.meta.url), "utf8"),
    readdir(new URL("../data/bank/questions/", import.meta.url)),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/BiochemistryChapterHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/codex-bridge.mjs", import.meta.url), "utf8"),
    readFile(new URL("../data/telegram-final/july29.jsonl", import.meta.url), "utf8"),
    fetchBuiltRoute("/api/bank/summary"),
    fetchBuiltRoute("/api/final-exam?exam=july29"),
  ]);
  const catalog = JSON.parse(catalogText);
  const allQuestions = (await Promise.all(questionFiles.filter((name) => name.endsWith(".jsonl")).map(async (name) => {
    const text = await readFile(new URL(`../data/bank/questions/${name}`, import.meta.url), "utf8");
    return text.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  }))).flat();
  const questionById = new Map(allQuestions.map((question) => [question.id, question]));
  const concepts = catalog.chapters.flatMap((chapter) => chapter.concepts);
  const selectedQuestionIds = concepts.flatMap((concept) => concept.selectedQuestionIds);
  const selectedQuestionIdSet = new Set(selectedQuestionIds);
  const selectedQuestions = selectedQuestionIds.map((questionId) => questionById.get(questionId));
  const normalizedSelectedPrompts = selectedQuestions.map((question) => question.prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
  const summary = await summaryResponse.json();
  const august25 = summary.exams.find((exam) => exam.id === "july29");
  const finalExam = await finalResponse.json();
  const expectedFinalExamCount = finalExamText.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)).filter((question) => (
    question.status === "verified"
    && question.tags?.includes("telegram-final")
    && question.tags?.includes("exam-july29")
    && question.source?.title
    && question.source?.chapter
  )).length;
  const chapterQuestionIds = august25.biochemistryChapters.flatMap((chapter) => chapter.questionIds);
  const archiveOnlyQuestion = allQuestions.find((question) => question.subject === "biochemistry"
    && question.status === "verified"
    && !selectedQuestionIdSet.has(question.id));

  assert.equal(catalog.chapterCount, 32);
  assert.equal(catalog.chapterCount, catalog.chapters.length);
  assert.equal(catalog.conceptCount, concepts.length);
  assert.equal(catalog.questionCount, selectedQuestionIds.length);
  assert.ok(catalog.conceptCount >= 100, "expected a comprehensive concept map");
  assert.ok(catalog.questionCount < 1000, "active bank should be dramatically smaller than the generated archive");
  assert.ok(allQuestions.filter((question) => question.subject === "biochemistry").length > 2500, "generated archive should remain intact");
  assert.ok(archiveOnlyQuestion, "expected the generated archive to retain non-curated questions");
  assert.equal(questionById.size, allQuestions.length, "archived question IDs must be unique");
  assert.equal(new Set(concepts.map((concept) => concept.id)).size, concepts.length);
  assert.equal(new Set(selectedQuestionIds).size, selectedQuestionIds.length);
  assert.equal(new Set(normalizedSelectedPrompts).size, normalizedSelectedPrompts.length, "selected stems must not repeat");
  assert.ok(concepts.every((concept) => concept.selectedQuestionIds.length >= 2 && concept.selectedQuestionIds.length <= 3));
  assert.ok(catalog.chapters.every((chapter) => chapter.concepts.every((concept) => concept.selectedQuestionIds.every((questionId) => (
    questionById.get(questionId)?.subject === "biochemistry"
    && questionById.get(questionId)?.status === "verified"
    && biochemistryChapterIdForQuestion(questionById.get(questionId)) === chapter.chapterId
    && Boolean(questionById.get(questionId)?.source?.title)
    && Boolean(questionById.get(questionId)?.source?.chapter)
  )))));
  assert.equal(august25.collectionCounts.biochemistry, selectedQuestionIds.length);
  assert.equal(new Set(chapterQuestionIds).size, selectedQuestionIds.length);
  assert.deepEqual(new Set(chapterQuestionIds), selectedQuestionIdSet);
  assert.equal(finalExam.availableCount, expectedFinalExamCount, "past-paper final exam must remain independent of curation");

  const byIdsResponse = await fetchBuiltRoute("/api/questions/by-ids", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      exam: "july29",
      ids: [selectedQuestionIds[0], archiveOnlyQuestion.id],
      limit: 2,
      preserveOrder: true,
    }),
  });
  const byIds = await byIdsResponse.json();
  assert.deepEqual(byIds.questions.map((question) => question.id), [selectedQuestionIds[0]], "saved sessions must drop retired archive-only items");

  assert.match(chapterHub, /Study \{chapterConcepts\.length\} ideas/);
  assert.match(chapterHub, /Know this cold/);
  assert.match(chapterHub, /Clinical connection/);
  assert.match(page, /BiochemistryConceptFeedback/);
  assert.match(page, /Connect this answer back to/);
  assert.match(page, /Why a doctor cares/);
  assert.match(bridge, /biochemistryCoreQuestionIds\.has\(question\.id\)/);
  assert.match(bridge, /chapterConcept/);
  assert.match(bridge, /question\.source/);
});

test("focused sprints fall back to mastered questions only after unseen is exhausted", () => {
  const questions = Array.from({ length: 20 }, (_, index) => ({ id: `q-${index}` }));
  const seenIds = questions.slice(0, 18).map((question) => question.id);
  const selected = selectCoverageSprint(questions, { limit: 10, seenIds, random: () => 0.5 });

  assert.equal(selected.questions.length, 10);
  assert.equal(selected.repairCount, 0);
  assert.equal(selected.unseenCount, 2);
  assert.equal(selected.reviewCount, 8);
  assert.equal(selected.ordinaryReviewCount, 8);
  assert.ok(selected.questions.slice(0, 2).every((question) => !seenIds.includes(question.id)));
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
    "july25:telegram-past-papers": {
      fingerprint: "bank-2",
      questions: [
        questions[0],
        { id: "q-3", revision: 1, options: [{ id: "A" }, { id: "B" }], correctOptionId: "B" },
      ],
    },
  });

  const migrated = parsed.sessions["july25:telegram-past-papers"];
  assert.equal(parsed.version, 2);
  assert.deepEqual(migrated.questionIds, ["q-1", "q-3"]);
  assert.equal(migrated.answers["q-1"].correct, true);
  assert.equal(migrated.currentIndex, 1);
  assert.equal(migrated.bankFingerprint, "bank-2");
  assert.equal(parsed.sessions["july29:downloaded-core"], null);
});

test("August 25 exposes two independent final banks and keeps the original archive stable", async () => {
  const [component, oldText, downloadedText, summaryResponse, defaultResponse, downloadedResponse, invalidResponse] = await Promise.all([
    readFile(new URL("../src/components/FinalExam.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/telegram-final/july29.jsonl", import.meta.url), "utf8"),
    readFile(new URL("../data/final-exams/aug25-downloaded-core.jsonl", import.meta.url), "utf8"),
    fetchBuiltRoute("/api/bank/summary"),
    fetchBuiltRoute("/api/final-exam?exam=july29"),
    fetchBuiltRoute("/api/final-exam?exam=july29&bank=downloaded-core"),
    fetchBuiltRoute("/api/final-exam?exam=july25&bank=downloaded-core"),
  ]);
  const oldQuestions = oldText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const downloadedQuestions = downloadedText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const summary = await summaryResponse.json();
  const defaultBank = await defaultResponse.json();
  const downloadedBank = await downloadedResponse.json();
  const august25 = summary.exams.find((exam) => exam.id === "july29");
  const normalizedPrompts = downloadedQuestions.map((question) => question.prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());

  assert.equal(oldQuestions.length, 199, "the original Telegram bank must remain unchanged");
  assert.equal(defaultBank.bank, "telegram-past-papers");
  assert.equal(defaultBank.availableCount, 199);
  assert.equal(downloadedBank.bank, "downloaded-core");
  assert.equal(downloadedBank.availableCount, downloadedQuestions.length);
  assert.ok(downloadedQuestions.length >= 100 && downloadedQuestions.length <= 200);
  assert.equal(new Set(normalizedPrompts).size, normalizedPrompts.length);
  assert.ok(downloadedQuestions.every((question) => question.subject === "biochemistry"
    && question.status === "verified"
    && question.tags.includes("distilled-core")
    && question.tags.includes("final-bank-aug25-downloaded-core")
    && Object.keys(question.distractorExplanations).length === 3));
  assert.deepEqual(august25.finalExamBanks.map((bank) => bank.id), ["telegram-past-papers", "downloaded-core"]);
  assert.equal(invalidResponse.status, 400);
  assert.match(component, /New Downloads · Core Distilled/);
  assert.match(component, /sessionKey/);
  assert.match(component, /bank=\$\{bank\}/);
});

test("August 25 final banks default to the no carbohydrate/lipid metabolism exam scope", async () => {
  const [component, stateSource, oldText, downloadedText] = await Promise.all([
    readFile(new URL("../src/components/FinalExam.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/mcq/final-exam-state.mjs", import.meta.url), "utf8"),
    readFile(new URL("../data/telegram-final/july29.jsonl", import.meta.url), "utf8"),
    readFile(new URL("../data/final-exams/aug25-downloaded-core.jsonl", import.meta.url), "utf8"),
  ]);
  const telegram = oldText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const downloaded = downloadedText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const filteredTelegram = filterFinalExamQuestions(telegram, true);
  const filteredDownloaded = filterFinalExamQuestions(downloaded, true);

  assert.equal(filteredTelegram.length, 194);
  assert.equal(filteredDownloaded.length, 79);
  assert.ok(filteredTelegram.every((question) => !isCarbohydrateOrLipidMetabolism(question)));
  assert.ok(filteredDownloaded.every((question) => !isCarbohydrateOrLipidMetabolism(question)));
  assert.match(component, /useState\(true\)/, "the exam-scope filter should be enabled by default");
  assert.match(component, /Exclude carbohydrate \+ lipid metabolism/);
  assert.match(component, /without-carb-lipid-metabolism/);
  assert.match(stateSource, /july29:telegram-past-papers:no-carb-lipid-metabolism/);
  assert.match(stateSource, /july29:downloaded-core:no-carb-lipid-metabolism/);
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
