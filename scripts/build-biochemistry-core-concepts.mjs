import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { biochemistryChapterIdForQuestion, biochemistryChapterIds } from "../src/lib/biochemistry/chapter-mapping.mjs";

const root = resolve(import.meta.dirname, "..");
const fragmentPaths = [
  "data/teacher-materials/biochemistry-concepts-protein.json",
  "data/teacher-materials/biochemistry-concepts-metabolism.json",
  "data/teacher-materials/biochemistry-concepts-genetics-lab.json",
];
const outputPath = resolve(root, "data/teacher-materials/biochemistry-core-concepts.json");
const questionDirectory = resolve(root, "data/bank/questions");
const priorities = new Set(["exam-core", "medical-core", "supplement"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizedPrompt(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedSourceEvidence(value, conceptId) {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (value && typeof value === "object") {
    const parts = [value.source, value.locator, value.scope]
      .filter((part) => typeof part === "string" && part.trim().length > 0)
      .map((part) => part.trim());
    if (parts.length > 0) return parts.join(" · ");
  }
  throw new Error(`${conceptId} has empty source evidence`);
}

function loadQuestions() {
  const questions = [];
  for (const filename of readdirSync(questionDirectory).filter((name) => name.endsWith(".jsonl")).sort()) {
    for (const [index, line] of readFileSync(resolve(questionDirectory, filename), "utf8").split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      try {
        questions.push(JSON.parse(line));
      } catch (error) {
        throw new Error(`Malformed question at ${filename}:${index + 1}: ${error.message}`);
      }
    }
  }
  return questions;
}

const questions = loadQuestions();
const questionById = new Map();
for (const question of questions) {
  assert(typeof question.id === "string" && question.id.length > 0, "Every archived question must have a non-empty id");
  assert(!questionById.has(question.id), `Duplicate archived question id: ${question.id}`);
  questionById.set(question.id, question);
}
const seenConceptIds = new Set();
const seenQuestionIds = new Set();
const seenPrompts = new Map();
const chapters = [];

for (const relativePath of fragmentPaths) {
  const filepath = resolve(root, relativePath);
  assert(existsSync(filepath), `Missing concept fragment: ${relativePath}`);
  const fragment = JSON.parse(readFileSync(filepath, "utf8"));
  assert(Array.isArray(fragment.chapters), `${relativePath} must contain a chapters array`);

  for (const chapter of fragment.chapters) {
    assert(biochemistryChapterIds.includes(chapter.chapterId), `Unknown chapterId ${chapter.chapterId} in ${relativePath}`);
    assert(Array.isArray(chapter.concepts) && chapter.concepts.length > 0, `${chapter.chapterId} has no concepts`);

    const concepts = chapter.concepts.map((concept) => {
      assert(typeof concept.id === "string" && concept.id.length > 0, `${chapter.chapterId} has a concept without an id`);
      assert(!seenConceptIds.has(concept.id), `Duplicate concept id: ${concept.id}`);
      seenConceptIds.add(concept.id);
      assert(typeof concept.title === "string" && concept.title.length > 0, `${concept.id} has no title`);
      assert(priorities.has(concept.priority), `${concept.id} has invalid priority ${concept.priority}`);
      assert(typeof concept.rationale === "string" && concept.rationale.length > 0, `${concept.id} has no rationale`);
      assert(typeof concept.summary === "string" && concept.summary.length > 0, `${concept.id} has no summary`);
      assert(Array.isArray(concept.keyPoints) && concept.keyPoints.length >= 2, `${concept.id} needs at least two key points`);
      assert(concept.keyPoints.every((point) => typeof point === "string" && point.trim().length > 0), `${concept.id} has an empty key point`);
      assert(Array.isArray(concept.clinicalLinks), `${concept.id} clinicalLinks must be an array`);
      assert(concept.clinicalLinks.every((link) => typeof link === "string" && link.trim().length > 0), `${concept.id} has an empty clinical link`);
      assert(Array.isArray(concept.sourceEvidence) && concept.sourceEvidence.length > 0, `${concept.id} needs source evidence`);
      const sourceEvidence = concept.sourceEvidence.map((source) => normalizedSourceEvidence(source, concept.id));
      assert(Array.isArray(concept.selectedQuestionIds) && concept.selectedQuestionIds.length >= 2 && concept.selectedQuestionIds.length <= 3, `${concept.id} must select 2–3 questions`);

      for (const questionId of concept.selectedQuestionIds) {
        assert(!seenQuestionIds.has(questionId), `Question ${questionId} is selected by more than one concept`);
        const question = questionById.get(questionId);
        assert(question, `${concept.id} selects missing question ${questionId}`);
        assert(question.status === "verified", `${concept.id} selects unverified question ${questionId}`);
        assert(question.subject === "biochemistry", `${concept.id} selects non-biochemistry question ${questionId}`);
        assert(typeof question.prompt === "string" && question.prompt.trim().length > 0, `${concept.id} selects ${questionId} without a prompt`);
        assert(typeof question.explanation === "string" && question.explanation.trim().length > 0, `${concept.id} selects ${questionId} without an explanation`);
        assert(typeof question.learningObjective === "string" && question.learningObjective.trim().length > 0, `${concept.id} selects ${questionId} without a learning objective`);
        assert(Boolean(question.source?.title) && Boolean(question.source?.chapter), `${concept.id} selects ${questionId} without a traceable source`);
        const mappedChapterId = biochemistryChapterIdForQuestion(question);
        assert(mappedChapterId === chapter.chapterId, `${concept.id} selects ${questionId}, mapped to ${mappedChapterId ?? "no chapter"} instead of ${chapter.chapterId}`);
        const promptKey = normalizedPrompt(question.prompt);
        const duplicateQuestionId = seenPrompts.get(promptKey);
        assert(!duplicateQuestionId, `${concept.id} selects a repeated stem: ${questionId} duplicates ${duplicateQuestionId}`);
        seenQuestionIds.add(questionId);
        seenPrompts.set(promptKey, questionId);
      }

      return {
        ...concept,
        sourceEvidence,
        chapterId: chapter.chapterId,
      };
    });

    chapters.push({ chapterId: chapter.chapterId, concepts });
  }
}

const chapterOrder = new Map(biochemistryChapterIds.map((chapterId, index) => [chapterId, index]));
chapters.sort((left, right) => chapterOrder.get(left.chapterId) - chapterOrder.get(right.chapterId));
const duplicateChapters = chapters.filter((chapter, index) => chapters.findIndex((candidate) => candidate.chapterId === chapter.chapterId) !== index);
assert(duplicateChapters.length === 0, `Chapter appears in more than one fragment: ${duplicateChapters.map((chapter) => chapter.chapterId).join(", ")}`);

const missingChapters = biochemistryChapterIds.filter((chapterId) => !chapters.some((chapter) => chapter.chapterId === chapterId));
assert(missingChapters.length === 0, `Missing concept coverage for: ${missingChapters.join(", ")}`);

const catalog = {
  schemaVersion: "1.0.0",
  generatedFrom: fragmentPaths,
  chapterCount: chapters.length,
  conceptCount: seenConceptIds.size,
  questionCount: seenQuestionIds.size,
  chapters,
};

writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Built ${catalog.conceptCount} biochemistry concepts with ${catalog.questionCount} focused questions across ${catalog.chapterCount} chapters.`);
