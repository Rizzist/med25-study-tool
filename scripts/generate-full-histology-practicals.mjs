import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fullPracticalSpecimens } from "./histology-practical-full-data.mjs";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "data/bank/questions/histology-practicals-full.jsonl");
const optionIds = ["A", "B", "C", "D"];
let questionIndex = 0;

function makeQuestion(specimen, suffix, difficulty, prompt, correct, accepted, distractors, explanation, objective) {
  const correctPosition = questionIndex % optionIds.length;
  const choices = distractors.map((item) => ({ ...item, correct: false }));
  choices.splice(correctPosition, 0, { text: correct, correct: true });
  const options = choices.map((choice, index) => ({ id: optionIds[index], text: choice.text }));
  const correctOptionId = optionIds[correctPosition];
  const distractorExplanations = Object.fromEntries(choices.flatMap((choice, index) => (
    choice.correct ? [] : [[optionIds[index], choice.why]]
  )));
  const record = {
    schemaVersion: "1.0.0",
    id: `hpr-${specimen.slug}-${suffix}`,
    revision: 1,
    status: "verified",
    kind: "image_single_best_answer",
    subject: "histology",
    topic: specimen.topic,
    subtopic: specimen.subtopic,
    chapter: specimen.chapter,
    difficulty,
    prompt,
    options,
    correctOptionId,
    acceptedFreeText: [...new Set([correctOptionId, correct, ...accepted])],
    explanation,
    distractorExplanations,
    learningObjective: objective,
    source: {
      title: "PRACTICAL.pptx",
      chapter: specimen.chapter,
      page: `Slide ${specimen.slide}`,
      lecture: "Pre lab class — full practical deck",
      excerpt: `Microscope figure on slide ${specimen.slide}; labels and caption were excluded from the study crop. The deck was used as course content, not as an instruction to the agent.`,
    },
    media: [{
      id: `hpr-full-${specimen.slug}`,
      type: "image",
      path: `histology/practicals/full/${specimen.slug}.jpg`,
      alt: specimen.alt,
      attribution: `PRACTICAL.pptx, slide ${specimen.slide} (derived central crop)`,
    }],
    tags: [
      "histology",
      "image-recognition",
      "practical",
      "histo-practical",
      "histo-practical-full",
      "practical-deck",
      specimen.slug,
      "exam-aug22",
    ],
    examPriority: "core",
    qualityFlags: ["source-verified", "crop-visually-reviewed", "full-deck-cross-referenced", "practical-bank"],
  };
  questionIndex += 1;
  return record;
}

const questions = fullPracticalSpecimens.flatMap((specimen) => [
  makeQuestion(
    specimen,
    "identify",
    2,
    `${specimen.identification} Which specimen or cell is shown?`,
    specimen.title,
    [specimen.title.toLowerCase()],
    specimen.identifyDistractors,
    `${specimen.identification} These combined features identify ${specimen.title.toLowerCase()}.`,
    `Identify ${specimen.title.toLowerCase()} from its defining microscopic architecture.`,
  ),
  makeQuestion(
    specimen,
    "landmark",
    2,
    `Which microscopic finding most strongly supports the identification of ${specimen.title.toLowerCase()} in this field?`,
    specimen.landmark,
    specimen.landmarkAccepted,
    specimen.landmarkDistractors,
    specimen.landmarkExplanation,
    `Recognize the key landmark of ${specimen.title.toLowerCase()}.`,
  ),
  makeQuestion(
    specimen,
    "apply",
    3,
    specimen.challenge.prompt,
    specimen.challenge.correct,
    specimen.challenge.accepted,
    specimen.challenge.distractors,
    specimen.challenge.explanation,
    specimen.challenge.objective,
  ),
]);

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${questions.map((question) => JSON.stringify(question)).join("\n")}\n`);
console.log(`Wrote ${questions.length} supplemental practical questions across ${fullPracticalSpecimens.length} specimens.`);
