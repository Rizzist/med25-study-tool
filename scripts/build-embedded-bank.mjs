import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import "./build-respiratory-anatomy.mjs";
import "./build-respiratory-concepts.mjs";

const root = resolve(import.meta.dirname, "..");
const questionDirectory = resolve(root, "data/bank/questions");
const finalExamDirectory = resolve(root, "data/telegram-final");
const downloadedFinalExamDirectory = resolve(root, "data/final-exams");
const outputPath = resolve(root, "data/bank/embedded-bank.json");

function readJsonLines(filepath) {
  return readFileSync(filepath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

const questions = readdirSync(questionDirectory)
  .filter((name) => name.endsWith(".jsonl"))
  .sort()
  .flatMap((name) => readJsonLines(resolve(questionDirectory, name)));

const embeddedBank = {
  manifest: JSON.parse(readFileSync(resolve(root, "data/bank/manifest.json"), "utf8")),
  questions,
  finalExams: {
    "july25:telegram-past-papers": readJsonLines(resolve(finalExamDirectory, "july25.jsonl")),
    "july29:telegram-past-papers": readJsonLines(resolve(finalExamDirectory, "july29.jsonl")),
    "july29:downloaded-core": readJsonLines(resolve(downloadedFinalExamDirectory, "aug25-downloaded-core.jsonl")),
  },
};

writeFileSync(outputPath, `${JSON.stringify(embeddedBank)}\n`);
console.log(`Embedded ${questions.length} study questions and ${Object.values(embeddedBank.finalExams).reduce((total, bank) => total + bank.length, 0)} final-exam questions across ${Object.keys(embeddedBank.finalExams).length} banks.`);
