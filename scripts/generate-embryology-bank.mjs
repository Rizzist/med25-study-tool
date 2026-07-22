#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const sourceDirectory = process.env.MED_SCHOOL_EMBRYOLOGY_MCQS_DIR
  ?? path.join(homedir(), "Documents", "MED SCHOOL BOOKS", "MCQs", "EMBRYOLOGY");
const outputPath = path.join(projectDirectory, "data/bank/questions/embryology-generated.jsonl");

const topicSpecs = [
  {
    file: "embryo_ch4.csv",
    chapter: "Chapter 4",
    topic: "Second week: bilaminar disc and implantation",
    patterns: [
      /week of 2s/i, /day 8/i, /cytotrophoblast/i, /syncytiotrophoblast/i,
      /epiblast/i, /hypoblast/i, /amniotic/i, /exocoelomic/i, /lacuna/i,
      /extraembryonic mesoderm/i, /chorionic cavity/i, /connecting stalk/i,
      /primary vill/i, /uteroplacental/i, /implantation.*complete/i,
    ],
  },
  {
    file: "embryo_ch5.csv",
    chapter: "Chapter 5",
    topic: "Third week: gastrulation and axial patterning",
    patterns: [
      /hallmark process/i, /primitive streak/i, /primitive node/i, /ingression/i,
      /definitive endoderm/i, /intraembryonic mesoderm/i, /ectoderm/i,
      /notochord/i, /prechordal/i, /oropharyngeal/i, /cloacal/i,
      /allantois/i, /left.right/i, /situs/i, /teratoma/i,
    ],
  },
  {
    file: "embryo_ch5_5.csv",
    chapter: "Chapter 5 supplement",
    topic: "Fourth week: body folding",
    patterns: [
      /two key processes/i, /mechanical driver/i, /cranial.*lateral.*caudal/i,
      /ventral midline/i, /gut tube/i, /foregut.*midgut.*hindgut/i,
      /vitelline duct/i, /cranial fold/i, /septum transversum/i,
      /cardiogenic/i, /caudal fold/i, /connecting stalk/i,
      /lateral fold/i, /umbilical ring/i, /ectoderm/i,
    ],
  },
  {
    file: "embryo_ch6.csv",
    chapter: "Chapter 6",
    topic: "Embryonic period and germ-layer derivatives",
    patterns: [
      /embryonic period start/i, /organogenic period/i, /teratogenic period/i,
      /neural plate/i, /neural fold/i, /neuropore/i, /neural crest/i,
      /paraxial/i, /intermediate mesoderm/i, /lateral plate/i,
      /somite/i, /dermomyotome/i, /sclerotome/i, /endoderm/i, /blood vessels/i,
    ],
  },
  {
    file: "embryo_ch7.csv",
    chapter: "Chapter 7",
    topic: "Fetal period, placenta, and fetal membranes",
    patterns: [
      /fetal period begins/i, /maturation.*rapid growth/i, /crown.rump/i,
      /gestational age/i, /third month/i, /quickening/i, /surfactant/i,
      /placenta/i, /chorion frondosum/i, /decidua basalis/i, /placental barrier/i,
      /umbilical vein/i, /umbilical arteries/i, /amnion/i, /twin/i,
    ],
  },
  {
    file: "embryo_ch8*.csv",
    chapter: "Chapter 8",
    topic: "Morphogenesis and developmental mechanisms",
    patterns: [
      /morphogenesis/i, /differential growth/i, /malformation/i, /deformation/i,
      /syndrome/i, /teratogen/i, /induction/i, /competence/i, /epithelial/i,
      /mesenchymal/i, /apoptosis/i, /cell adhesion/i, /extracellular matrix/i,
      /migration/i, /patterning/i,
    ],
  },
  {
    file: "embryo_ch9.csv",
    chapter: "Chapter 9",
    topic: "Birth defects and prenatal diagnosis",
    patterns: [
      /teratology/i, /major structural anomaly/i, /etiologic categories/i,
      /malformation/i, /disruption/i, /deformation/i, /syndrome/i,
      /critical period/i, /all.or.none/i, /dose/i, /maternal diabetes/i,
      /folic acid/i, /ultrasonography/i, /amniocentesis/i, /chorionic villus/i,
    ],
  },
  {
    file: "embryo_ch10.csv",
    chapter: "Chapter 10",
    topic: "Neurulation, gut tube, and body cavities",
    patterns: [
      /tube on top of a tube/i, /neural plate/i, /neurulation/i,
      /neural tube is dorsal/i, /lateral plate mesoderm split/i,
      /splanchnic/i, /somatic/i, /intraembryonic coelom/i, /body cavity/i,
      /dorsal mesentery/i, /ventral mesentery/i, /septum transversum/i,
      /pleuropericardial/i, /pleuroperitoneal/i, /diaphragm/i,
    ],
  },
];

const responseSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      minItems: 15,
      maxItems: 15,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sourceIndex", "prompt", "options", "correctOptionId", "explanation",
          "distractorExplanations", "learningObjective", "subtopic", "difficulty",
          "examPriority", "tags",
        ],
        properties: {
          sourceIndex: { type: "integer", minimum: 0 },
          prompt: { type: "string", minLength: 20 },
          options: {
            type: "array", minItems: 4, maxItems: 4,
            items: {
              type: "object", additionalProperties: false,
              required: ["id", "text"],
              properties: {
                id: { enum: ["A", "B", "C", "D"] },
                text: { type: "string", minLength: 1 },
              },
            },
          },
          correctOptionId: { enum: ["A", "B", "C", "D"] },
          explanation: { type: "string", minLength: 40 },
          distractorExplanations: {
            type: "object", additionalProperties: false,
            required: ["A", "B", "C", "D"],
            properties: {
              A: { type: "string", minLength: 10 },
              B: { type: "string", minLength: 10 },
              C: { type: "string", minLength: 10 },
              D: { type: "string", minLength: 10 },
            },
          },
          learningObjective: { type: "string", minLength: 10 },
          subtopic: { type: "string", minLength: 2 },
          difficulty: { type: "integer", minimum: 2, maximum: 5 },
          examPriority: { enum: ["core", "high", "standard"] },
          tags: {
            type: "array", minItems: 2, maxItems: 5,
            items: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          },
        },
      },
    },
  },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.length >= 2 && candidate[0].trim() && candidate[1].trim());
}

function cleanText(text) {
  return text
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[•◦]/g, "•")
    .replace(/\s+/g, " ")
    .trim();
}

function selectRows(rows, patterns) {
  const selected = [];
  const used = new Set();
  for (const pattern of patterns) {
    const index = rows.findIndex((row, rowIndex) => !used.has(rowIndex) && pattern.test(`${row[0]} ${row[1]}`));
    if (index >= 0) {
      used.add(index);
      selected.push({ index, question: cleanText(rows[index][0]), answer: cleanText(rows[index][1]), tags: cleanText(rows[index][2] ?? "") });
    }
    if (selected.length === 15) break;
  }
  if (selected.length < 15) {
    const step = Math.max(1, Math.floor(rows.length / (15 - selected.length)));
    for (let index = 0; index < rows.length && selected.length < 15; index += step) {
      if (used.has(index)) continue;
      used.add(index);
      selected.push({ index, question: cleanText(rows[index][0]), answer: cleanText(rows[index][1]), tags: cleanText(rows[index][2] ?? "") });
    }
  }
  for (let index = 0; index < rows.length && selected.length < 15; index += 1) {
    if (used.has(index)) continue;
    used.add(index);
    selected.push({ index, question: cleanText(rows[index][0]), answer: cleanText(rows[index][1]), tags: cleanText(rows[index][2] ?? "") });
  }
  return selected;
}

function makePrompt(spec, selectedRows) {
  return `You are building a high-stakes medical-school embryology MCQ bank. Convert each of the 15 supplied source cards into exactly one rigorous single-best-answer question.

Non-negotiable rules:
- Use ONLY the factual content in the supplied source card for the keyed answer and explanation. Do not add an unsupported fact, number, timing, or clinical association.
- Preserve the sourceIndex exactly. Return all 15 source indices once each.
- Four options labeled A-D, with exactly one unambiguously best answer. Randomize the correct answer position across the set.
- Distractors must be medically plausible, parallel in grammar/category, and clearly wrong in the context of the stem. Do not use joke options, "all/none of the above," or near-duplicate choices.
- Prefer application, comparison, sequence, identification, and short clinical/vignette framing where the source supports it; straightforward recall is acceptable for a precise foundational fact.
- The explanation must teach why the keyed answer follows from the source. The four distractorExplanations entries should each explain that option; for the correct option, reinforce why it is correct.
- Do not mention "source card," the generation process, or unavailable images.
- This set belongs to ${spec.topic}. Keep it appropriate for a first-semester medical embryology exam.

Source cards:
${JSON.stringify(selectedRows, null, 2)}`;
}

function slug(text) {
  return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
}

function stableId(spec, sourceIndex) {
  const digest = createHash("sha1").update(`${spec.file}:${sourceIndex}`).digest("hex").slice(0, 12);
  return `embr-gen-${slug(spec.chapter)}-${sourceIndex + 1}-${digest}`;
}

function runCodex(spec, selectedRows, schemaPath, responsePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "codex",
      [
        "exec", "--ephemeral", "--ignore-rules", "--sandbox", "read-only",
        "--skip-git-repo-check", "--output-schema", schemaPath,
        "--output-last-message", responsePath, "-",
      ],
      { cwd: projectDirectory, stdio: ["pipe", "pipe", "pipe"] },
    );
    let output = "";
    const timeout = setTimeout(() => child.kill("SIGTERM"), 10 * 60 * 1000);
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Codex failed for ${spec.file}:\n${output}`));
        return;
      }
      try {
        resolve(JSON.parse(readFileSync(responsePath, "utf8")));
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end(makePrompt(spec, selectedRows));
  });
}

function normalizeQuestion(spec, generated, sourceRows) {
  const source = sourceRows.find((row) => row.index === generated.sourceIndex);
  if (!source) throw new Error(`${spec.file}: unknown sourceIndex ${generated.sourceIndex}`);
  const optionIds = generated.options.map((option) => option.id);
  if (new Set(optionIds).size !== 4 || !optionIds.includes(generated.correctOptionId)) {
    throw new Error(`${spec.file}: invalid option ids at sourceIndex ${generated.sourceIndex}`);
  }
  const correctText = generated.options.find((option) => option.id === generated.correctOptionId).text;
  const originalTags = source.tags
    .split(/[;:\s]+/)
    .map(slug)
    .filter(Boolean);
  return {
    schemaVersion: "1.0.0",
    id: stableId(spec, generated.sourceIndex),
    revision: 1,
    status: "verified",
    kind: "single_best_answer",
    subject: "embryology",
    topic: spec.topic,
    subtopic: generated.subtopic,
    chapter: spec.chapter,
    difficulty: generated.difficulty,
    prompt: generated.prompt.trim(),
    options: generated.options.map((option) => ({ id: option.id, text: option.text.trim() })),
    correctOptionId: generated.correctOptionId,
    acceptedFreeText: [generated.correctOptionId, correctText.trim()],
    explanation: generated.explanation.trim(),
    distractorExplanations: Object.fromEntries(
      Object.entries(generated.distractorExplanations).map(([id, explanation]) => [id, explanation.trim()]),
    ),
    learningObjective: generated.learningObjective.trim(),
    source: {
      title: "Course-aligned embryology study notes",
      chapter: spec.chapter,
      excerpt: `Source prompt: ${source.question} Source answer: ${source.answer}`.slice(0, 900),
    },
    tags: [...new Set(["embryology", ...generated.tags.map(slug), ...originalTags])].filter(Boolean).slice(0, 8),
    examPriority: generated.examPriority,
    qualityFlags: ["source-grounded-generation", "needs-faculty-review"],
  };
}

if (process.argv.includes("--rekey-existing")) {
  const bank = readFileSync(outputPath, "utf8").trim().split("\n").map(JSON.parse);
  for (const question of bank) {
    const spec = topicSpecs.find((candidate) => candidate.chapter === question.chapter);
    const sourceNumber = Number(question.id.match(/-(\d+)-[0-9a-f]{12}$/)?.[1]);
    if (!spec || !Number.isInteger(sourceNumber) || sourceNumber < 1) {
      throw new Error(`Cannot derive stable source key for ${question.id}`);
    }
    question.id = stableId(spec, sourceNumber - 1);
  }
  writeFileSync(outputPath, `${bank.map((question) => JSON.stringify(question)).join("\n")}\n`);
  process.stderr.write(`Re-keyed ${bank.length} questions in ${outputPath}\n`);
  process.exit(0);
}

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "embryology-bank-"));
const schemaPath = path.join(temporaryDirectory, "response-schema.json");
writeFileSync(schemaPath, JSON.stringify(responseSchema));

try {
  const jobs = topicSpecs.map((spec, topicIndex) => {
    const rows = parseCsv(readFileSync(path.join(sourceDirectory, spec.file), "utf8"));
    const selectedRows = selectRows(rows, spec.patterns);
    if (selectedRows.length !== 15) throw new Error(`${spec.file}: selected ${selectedRows.length}, expected 15`);
    return { spec, topicIndex, selectedRows, responsePath: path.join(temporaryDirectory, `response-${topicIndex}.json`) };
  });
  const responses = new Array(jobs.length);
  let nextJob = 0;
  async function worker() {
    while (nextJob < jobs.length) {
      const jobIndex = nextJob;
      nextJob += 1;
      const job = jobs[jobIndex];
      process.stderr.write(`[${jobIndex + 1}/${jobs.length}] Generating ${job.spec.topic}...\n`);
      responses[jobIndex] = await runCodex(job.spec, job.selectedRows, schemaPath, job.responsePath);
      process.stderr.write(`[${jobIndex + 1}/${jobs.length}] Finished ${job.spec.topic}.\n`);
    }
  }
  await Promise.all([worker(), worker(), worker()]);

  const bank = [];
  for (const [topicIndex, response] of responses.entries()) {
    const { spec, selectedRows } = jobs[topicIndex];
    const sourceIndices = response.questions.map((question) => question.sourceIndex);
    if (new Set(sourceIndices).size !== 15) throw new Error(`${spec.file}: duplicate sourceIndex in generated response`);
    bank.push(...response.questions.map((question) => normalizeQuestion(spec, question, selectedRows)));
  }
  const ids = bank.map((question) => question.id);
  if (new Set(ids).size !== ids.length) throw new Error("Generated duplicate question IDs");
  writeFileSync(outputPath, `${bank.map((question) => JSON.stringify(question)).join("\n")}\n`);
  process.stderr.write(`Wrote ${bank.length} questions to ${outputPath}\n`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
