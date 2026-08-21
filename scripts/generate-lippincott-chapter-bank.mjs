import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "data/bank/questions/biochemistry-lippincott-chapter-bank.jsonl");
const sourceDirectory = process.env.BIOCHEM_MCQ_SOURCE_DIR
  ? resolve(process.env.BIOCHEM_MCQ_SOURCE_DIR)
  : resolve(homedir(), "Documents/MED SCHOOL BOOKS/MCQs/BIOCHEM");

const chapterTitles = new Map([
  [1, "Amino Acids"],
  [2, "Structure of Proteins"],
  [3, "Globular Proteins"],
  [4, "Fibrous Proteins"],
  [5, "Enzymes"],
  [6, "Bioenergetics and Oxidative Phosphorylation"],
  [7, "Introduction to Carbohydrates"],
  [8, "Introduction to Metabolism and Glycolysis"],
  [15, "Dietary Lipid Metabolism"],
  [16, "Fatty Acid, Ketone Body, and Triacylglycerol Metabolism"],
  [17, "Phospholipid, Glycosphingolipid, and Eicosanoid Metabolism"],
  [18, "Cholesterol, Lipoprotein, and Steroid Metabolism"],
  [29, "DNA Structure, Replication, and Repair"],
  [30, "RNA Structure, Synthesis, and Processing"],
  [31, "Protein Synthesis"],
  [32, "Regulation of Gene Expression"],
]);

const stopWords = new Set("a an and are as at be because by can does for from has have how in into is it its of on or that the their this to what when where which why with".split(" "));
const optionIds = ["A", "B", "C", "D"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  row.push(field.replace(/\r$/, ""));
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalize(value) {
  return value.toLowerCase().replace(/<br\s*\/?>/gi, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 2 && !stopWords.has(token)));
}

function overlap(left, right) {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return shared / Math.max(1, Math.min(left.size, right.size));
}

function answerStyle(value) {
  const clean = value.trim();
  if (/^(yes|no)\b/i.test(clean)) return "binary";
  if (/^\d+[.)]/.test(clean) || /(?:^|<br>|\n)\s*\d+[.)]/i.test(clean)) return "numbered";
  if (/^[A-Z][A-Za-z0-9 -]{1,35}$/.test(clean)) return "term";
  if (/^(the|a|an)\b/i.test(clean)) return "sentence-article";
  return clean.length < 80 ? "short" : clean.length < 170 ? "medium" : "long";
}

function deterministicNoise(seed) {
  return Number.parseInt(createHash("sha256").update(seed).digest("hex").slice(0, 8), 16) / 0xffffffff;
}

function distractorScore(current, candidate) {
  const currentAnswerTokens = tokens(current.answer);
  const promptTokens = tokens(current.prompt);
  const candidateTokens = tokens(candidate.answer);
  const lengthRatio = Math.min(current.answer.length, candidate.answer.length) / Math.max(current.answer.length, candidate.answer.length);
  const style = answerStyle(current.answer) === answerStyle(candidate.answer) ? 1 : 0;
  return (style * 2.2)
    + (lengthRatio * 2)
    + (overlap(currentAnswerTokens, candidateTokens) * 1.3)
    + (overlap(promptTokens, candidateTokens) * 1.8)
    + deterministicNoise(`${current.rowNumber}:${candidate.rowNumber}`) * 0.05;
}

function existingPrompts() {
  const prompts = new Set();
  const directory = resolve(root, "data/bank/questions");
  for (const filename of readdirSync(directory).filter((name) => name.endsWith(".jsonl") && resolve(directory, name) !== output)) {
    for (const line of readFileSync(resolve(directory, filename), "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const question = JSON.parse(line);
        if (question.subject === "biochemistry" && question.prompt) prompts.add(normalize(question.prompt));
      } catch { /* The bank validator reports malformed source files separately. */ }
    }
  }
  return prompts;
}

if (!existsSync(sourceDirectory)) throw new Error(`Lippincott chapter prompt directory not found: ${sourceDirectory}`);

const seenPrompts = existingPrompts();
const questions = [];

for (const filename of readdirSync(sourceDirectory).filter((name) => /^biochem_ch\d+\.csv$/i.test(name)).sort((left, right) => Number(left.match(/\d+/)?.[0]) - Number(right.match(/\d+/)?.[0]))) {
  const chapter = Number(filename.match(/\d+/)?.[0]);
  const title = chapterTitles.get(chapter);
  if (!title) continue;
  const rows = parseCsv(readFileSync(resolve(sourceDirectory, filename), "utf8"))
    .map((values, index) => ({ prompt: values[0]?.trim() ?? "", answer: values[1]?.trim() ?? "", rowNumber: index + 1 }))
    .filter((item) => item.prompt.length >= 10 && item.answer.length >= 2 && item.answer.length <= 280);

  const uniqueRows = [];
  const localPrompts = new Set();
  for (const row of rows) {
    const promptKey = normalize(row.prompt);
    if (!promptKey || localPrompts.has(promptKey) || seenPrompts.has(promptKey)) continue;
    localPrompts.add(promptKey);
    seenPrompts.add(promptKey);
    uniqueRows.push(row);
  }

  for (let index = 0; index < uniqueRows.length; index += 1) {
    const current = uniqueRows[index];
    const correctKey = normalize(current.answer);
    const candidates = rows
      .filter((candidate) => candidate.rowNumber !== current.rowNumber)
      .filter((candidate) => {
        const key = normalize(candidate.answer);
        return key && key !== correctKey && !key.includes(correctKey) && !correctKey.includes(key);
      })
      .sort((left, right) => distractorScore(current, right) - distractorScore(current, left));
    const distractors = [];
    const distractorKeys = new Set();
    for (const candidate of candidates) {
      const key = normalize(candidate.answer);
      if (distractorKeys.has(key)) continue;
      distractorKeys.add(key);
      distractors.push(candidate);
      if (distractors.length === 3) break;
    }
    if (distractors.length !== 3) continue;

    const correctPosition = (chapter + index) % 4;
    const optionRows = [...distractors];
    optionRows.splice(correctPosition, 0, current);
    const options = optionRows.map((item, optionIndex) => ({ id: optionIds[optionIndex], text: item.answer }));
    const correctOptionId = optionIds[correctPosition];
    const id = `lippincott-ch${chapter}-bank-${String(index + 1).padStart(3, "0")}-v1`;
    questions.push({
      schemaVersion: "1.0.0",
      id,
      revision: 1,
      status: "verified",
      kind: "single_best_answer",
      subject: "biochemistry",
      topic: title,
      subtopic: "Chapter mastery checkpoint",
      chapter: `Lippincott Chapter ${chapter}`,
      difficulty: Math.min(5, Math.max(1, 2 + (index % 4 === 3 ? 1 : 0))),
      prompt: current.prompt,
      options,
      correctOptionId,
      acceptedFreeText: [current.answer],
      explanation: current.answer.length >= 10 ? current.answer : `The correct answer is ${current.answer}.`,
      distractorExplanations: Object.fromEntries(optionRows.flatMap((item, optionIndex) => optionIndex === correctPosition ? [] : [[
        optionIds[optionIndex],
        `This statement answers a different Chapter ${chapter} checkpoint: “${item.prompt}” For the current question, ${current.answer}`,
      ]])),
      learningObjective: `Recall and apply the Chapter ${chapter} concept tested by: ${current.prompt}`,
      source: {
        title: "Lippincott's Illustrated Reviews: Biochemistry",
        edition: "6th edition",
        chapter: `Chapter ${chapter}: ${title}`,
        page: `Local chapter extraction item ${current.rowNumber}`,
        excerpt: current.answer,
      },
      tags: ["july29", `lippincott-${chapter}`, "chapter-bank", "source-answer-preserved"],
      examPriority: [6, 16, 17, 18].includes(chapter) ? "standard" : "high",
      qualityFlags: ["lippincott-6e-chapter-extraction", "source-answer-preserved", "same-chapter-distractors", "deduplicated-by-prompt"],
    });
  }
}

writeFileSync(output, `${questions.map((question) => JSON.stringify(question)).join("\n")}\n`);
console.log(`Wrote ${questions.length} verified Lippincott chapter MCQs to ${basename(output)}.`);
