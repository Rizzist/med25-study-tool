# MED//25 · MCQ study

MCQ-first medical revision: **Practice MCQs**, **Past exams**, **Review topics**, and **Results**. Text questions, source images, dynamic 2D identify/locate questions and on-demand audio/video use the same question contract. Learn mode reveals explanations immediately; Test mode withholds feedback until grading. Shared-figure answers are protected from early label disclosure.

Study Concepts, 3D anatomy, Practical Atlas, Visual Guide and Codex Tutor are no longer app destinations or initial-bundle dependencies. Historical source/assets remain in the repository for provenance and saved-result compatibility; they are not automatically downloaded. No tutor bridge is needed.

## Interface

A slim dark rail (bottom tab bar on phones) holds the four destinations; one compact strip switches term and course. Every tab shares a course header with the exam chip, count and pill downloads for the review PDF. Practice starts from collection chips with counts, segmented session length and feedback controls; past papers expose their questions, answer key and originals as download pills on each card, with a combine-papers panel and an all-downloads panel at the top of every course. Design record: [docs/ui-revamp-2026-09-20.md](docs/ui-revamp-2026-09-20.md).

## Run locally

Node 22.13+ and npm:

```bash
npm install
npm run dev:local
```

Open [localhost:3000](http://localhost:3000). Next serves both the interface and APIs. Existing browser progress keys remain unchanged; clearing site data, changing origin or changing browser profile creates a separate history.

## Review standard

Term 1 retains its existing topic/chapter routing. Term 2 uses **513 exact table-of-contents sections from 9 review PDFs across 8 courses**. Download PDFs or open their verified bookmark pages in Review topics. Results use this same section map, separating correct, skipped, ungraded, suggested matches and unmapped material. An untested section is not a weakness or proof of mastery.

- `data/review-curriculum/courses/`: canonical section/mapping metadata.
- `data/review-curriculum/evidence/`: evidence-bearing question maps and curated crosswalks.
- `data/review-curriculum/source-locks.json`: original PDF/authoring hashes and verified page destinations.
- `public/study/reviews/`: downloadable PDFs and generated, privacy-safe course JSON.

```bash
npm run reviews:generate
npm run reviews:check
```

The metadata generator never rewrites PDFs. If a PDF or heading changes, revalidate the actual PDF outline and update the canonical evidence/source locks; do not simply bypass the hash check. Optional `--archive` verifies the original review-authoring JSON too. Review PDFs include locally sourced course/book material: confirm distribution rights before publishing them beyond your intended study audience.

## Questions, media and provenance

Keep stable question IDs and source references. Author in `data/bank/questions/` using `schemas/mcq-question.schema.json`; increment revisions when answers change. `media.type` supports `image`, `audio`, `video`. Media paths are relative to `public/study/`. Audio/video preload is disabled; transcripts appear with feedback. Do not create an image-based question without its required figure/markers.

```bash
npm run mcq:generate
```

This rebuilds the authoring corpus, splits selected-course runtime files, and checks/regenerates review metadata. New Term 2 IDs need explicit review mapping, or an honestly marked null/uncertain mapping. Legacy course policy lives in the build-only `scripts/content/source-bank-policy.ts`; the app never imports the monolithic authoring corpus.

Question, answer-key and combined downloads are typeset as PDFs in the browser on demand (pdfmake, fonts under `public/fonts`) from the Markdown exports under `public/study/past-paper-downloads/`, and cached in Cache Storage keyed by a content hash, so an edited export or a bumped layout template regenerates automatically. No PDF files are committed for these; see `src/lib/paper-pdf/` and `tests/paper-pdf.test.mjs`.

Past exams are gated by `data/mcq-refactor/past-source-catalog.json`. Only source-approved IDs are built into final banks. The 151 authored “Core Distilled” questions moved to July29 **practice**. Their old saved final records remain intact. Unknown sitting dates, cross-course papers, uncertain keys and source-only items remain qualified. Download questions, current answer notes/key and originals from the paper chooser; no generated bank fills an empty Final Exam course.

## Loading and storage

- ~9 KB initial question catalog, followed by only the selected course’s metadata.
- Server reads selected course/paper files with a bounded two-file cache.
- Selected question payloads are cached separately from answers; course content hashes invalidate stale question data.
- Requested source images use content-addressed URLs and a bounded cache; unchanged images survive app updates.
- PDFs download on demand, then stay in a separate versioned device cache. Repeat opens/saves reuse the complete bytes, including PDF-viewer range requests; file SHA-256 changes invalidate the saved version. Download links indicate cache hits. The cache is bounded to 256 MiB / 48 PDFs and gracefully falls back to online downloads if browser storage is unavailable.
- Audio/video remain on demand. This is not a guarantee of cold-start offline app-shell support.
- Cache failures cannot prevent normal online study. Existing localStorage session, wrong-answer, flag and past-paper result keys are preserved.

## Validation

```bash
npm run mcq:check
npm run reviews:check
npm run pdfs:check
npm test
npm run vercel-build
```

`npm test` runs the active MCQ/source/progress tests, 2D identification tests, review checks and production build. `test:legacy` retains the historical wider suite (including expectations for retired UI). See [the refactor record](docs/mcq-only-refactor.md) for scope, verified counts, known mapping limits and verification evidence. No publishing is part of local development.
