import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const questionDirectory = resolve(root, "data/bank/questions");
const finalExamDirectory = resolve(root, "data/telegram-final");
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
    july25: readJsonLines(resolve(finalExamDirectory, "july25.jsonl")),
    july29: readJsonLines(resolve(finalExamDirectory, "july29.jsonl")),
  },
};

writeFileSync(outputPath, `${JSON.stringify(embeddedBank)}\n`);
console.log(`Embedded ${questions.length} study questions and ${embeddedBank.finalExams.july25.length + embeddedBank.finalExams.july29.length} final-exam questions.`);
