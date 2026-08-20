# MED//25 Study Tool

A local-first medical-school study app built for three 2026 exams. It combines focused MCQ sprints, image recognition, visual lessons, persistent review lists, and an optional Codex tutor.

## What is included

- **July 25 — Tissue Development & Function:** 713 focused questions across histology, embryology, and physiology
- **August 22 — Histology Practical:** 165 image questions across 55 microscope specimens
- **August 25 — Cell & Molecules:** 744 focused questions across biochemistry, cellular histology, and physiology
- **Master bank:** 1,837 verified study questions plus 367 sourced past-paper questions
- A dedicated 55-specimen Histology Practical Atlas with 165 image questions, plus stains, embryo diagrams, and other image-based questions
- 159 validated visual lessons, including 55 specimen atlas lessons and 55 available for August 25
- Select-an-option and typed-answer modes, plus optional reasoning and confidence capture
- End-of-sprint grading with explanations for every missed answer
- Persistent wrong-answer, flagged-question, active-sprint, and completed-result history in the same browser profile
- Optional local Codex reasoning audits; all ordinary scoring and stored explanations work without Codex

Answers, hints, explanations, and topic navigation remain hidden while a sprint is in progress.

> Raw teacher decks, Telegram exports, textbooks, and temporary extraction files are intentionally not included in this repository. The derived questions, lessons, app-ready study images, and provenance metadata are included.

## Run locally

Requirements:

- Node.js 22.13 or newer
- npm
- Codex CLI only if you want the optional tutor/reasoning audit

```bash
npm install
npm run dev:local
```

Open [http://localhost:3000](http://localhost:3000). The same command starts the local study API and optional tutor bridge at `http://127.0.0.1:4111`. Press `Ctrl+C` in the terminal to stop both services.

Study progress is stored in browser `localStorage`. Closing the tab or restarting the local server does not erase it, provided you reopen the app in the same browser profile. Clearing site data or using another browser/profile starts a separate history.

## Validate the project

```bash
npm run bank:validate
npm run lessons:validate
npm run lint
npm test
```

`npm test` validates lessons, creates a production build, and runs the rendered-page checks.

## Repository map

- `app/` — main application shell and interface
- `src/components/` — study and visual-guide components
- `src/lib/` — question, lesson, and session helpers
- `data/bank/questions/` — JSONL question collections
- `schemas/mcq-question.schema.json` — question-bank contract
- `data/lessons/` — visual lesson definitions
- `public/study/` — app-ready local study images
- `data/teacher-materials/` — scope maps and source provenance, without the raw private decks
- `scripts/codex-bridge.mjs` — question/media API, exam routing, and optional Codex tutor bridge
- `scripts/generate-histology-practicals.mjs` — reproducible original 45-question histology practical bank
- `scripts/generate-histology-practical-lessons.mjs` — reproducible original 15-specimen practical atlas
- `scripts/generate-full-histology-practicals.mjs` — 120 supplemental questions cross-referenced to the full practical deck
- `scripts/generate-full-histology-practical-lessons.mjs` — 40 supplemental specimen atlas lessons
- `scripts/extract-full-histology-practical-images.py` — source-slide and crop ledger for the 40 full-deck image assets

## Add questions

Question files use JSON Lines: one complete JSON object per line.

1. Add the question to an existing `.jsonl` file in `data/bank/questions/`, or create a new file there.
2. Follow `schemas/mcq-question.schema.json`. Use a unique, stable lowercase-hyphenated `id` and set a new question's `revision` to `1`.
3. Set `status` to `verified` for questions that should appear in sessions. Use `draft` while editing.
4. Supply the subject, topic, chapter, stem, four to six lettered options, correct option, explanation, source, and tags. Every incorrect option should have a distractor explanation.
5. For an image question, use `image_single_best_answer`, place the app-ready image under `public/study/` or `data/assets/`, and point `media.path` to its path relative to that asset root.
6. If the question introduces a new topic, add that exact topic to the appropriate `JULY_25_*_TOPICS` or `JULY_29_*_TOPICS` set in `scripts/codex-bridge.mjs` so it is routed to the intended exam.
7. Run `npm run bank:validate`, then restart `npm run dev:local` if the app is already open.

The existing files in `data/bank/questions/` are useful copyable examples for every supported question kind.

## Remove or hide questions

The safest way to remove a released question is to change its `status` from `verified` to `retired`. This hides it from new sessions while preserving its ID and history. Use `draft` for a temporarily unfinished question. Delete its JSONL line only if it was never released or referenced.

To remove a question topic from only one exam, remove that topic from the corresponding exam-routing set in `scripts/codex-bridge.mjs` instead of retiring all its questions. Validate the bank and restart the local process afterward.

## Add or remove visual lessons

Visual lessons live in `data/lessons/`. Add or edit a lesson JSON file, route it to `july25`, `aug22`, `july29` (the stable internal ID for the rescheduled August 25 bank), or `both` through its exam field, then run:

```bash
npm run lessons:validate
```

Removing a lesson file removes it from the visual guide but does not remove related MCQs.
