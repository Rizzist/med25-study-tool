import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fullPracticalSpecimens } from "./histology-practical-full-data.mjs";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "data/lessons/histology-practicals-full.json");

const lessons = fullPracticalSpecimens.map((specimen) => ({
  id: `hpr-${specimen.slug}`,
  exam: "aug22",
  subject: "histology",
  topic: specimen.topic,
  title: specimen.title,
  subtitle: specimen.landmark,
  kind: "recognition",
  topicPatterns: [specimen.topic, specimen.title],
  questionPatterns: [specimen.slug.replaceAll("-", " "), specimen.title.toLowerCase(), "histo practical"],
  visual: {
    type: "map",
    caption: "Low power → defining landmark → cell identity → closest discriminator",
    items: [
      { label: "1 · Orient", detail: specimen.identification, cue: "Name the overall arrangement before focusing on one cell." },
      { label: "2 · Landmark", detail: specimen.landmarkExplanation, cue: `Commit to: ${specimen.landmark}.` },
      { label: "3 · Cells", detail: specimen.cell, cue: "Use nuclear shape, cytoplasm, matrix, and position together." },
      { label: "4 · Separate", detail: specimen.discriminator, cue: "State why the closest look-alike loses." },
    ],
  },
  essentials: [specimen.identification, specimen.landmarkExplanation, specimen.cell, specimen.discriminator],
  traps: [{ wrong: specimen.trap[0], right: specimen.trap[1] }],
  recognition: [specimen.landmark, specimen.discriminator],
  source: {
    label: "PRACTICAL.pptx — full course practical deck",
    detail: `Slide ${specimen.slide}; central label-free crop derived from the supplied deck and cross-referenced with the existing MED//25 histology sources.`,
  },
  asset: `/study/histology/practicals/full/${specimen.slug}.jpg`,
}));

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify({ version: 1, lessons }, null, 2)}\n`);
console.log(`Wrote ${lessons.length} supplemental practical atlas lessons.`);
