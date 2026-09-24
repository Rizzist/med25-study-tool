# Nutrition past-paper and Core expansion — 24 September 2026

## Scope

The latest six downloaded exam filenames contain five distinct PDFs. `Nutrition Final Exam Tehran 2025.pdf` is byte-identical to `Final exam of nutrition of TUMS, Jan 2025.pdf`; it is an alias, not a second examination. `nutrition-f-questions-and-answer-key.pdf` is MED25's own export, not independent recurrence evidence. Original Downloads are not modified.

| Lane | State | Evidence / remaining work |
|---|---|---|
| Inventory / duplicates | Complete | Five new distinct papers; existing four collections retained |
| Kish / SUMS retake / TUMS January 2025 | SHIP | 21 + 40 + 55 scored; 24 explicit study repairs with original wording preserved; source-page and independent answer audit passed |
| DDS / TUMS February-2024 semester | SHIP | 40 + 40 source items; 78 scored, 2 held; shuffled pages checked; public copies privacy-redacted, original Downloads unchanged |
| Existing general-nutrition gaps / keys | SHIP | 57 → 82 scored; all 35 gaps audited; two duplicate scans excluded from scoring, eight defective originals held |
| Core / UI / review mapping | SHIP | 127 selected: 17 repeated patterns + 110 additional coverage questions; 20 review sections; full, repeats-only and section sessions isolated |
| Integration regression | SHIP | Nutrition 12/12, Biochemistry Core 7/7, Biochemistry papers 8/8, shared MCQ 68/68, PDF cache 9/9; TypeScript, production build and deployment-asset validation passed |
| Browser verification | SHIP | Production on isolated 127.0.0.1:3100: gold Core card, immersive questions, instant feedback, save/reload, section results and wrong-answer review; original 2/3 score remains 2/3 after 1/1 review correction; no console errors |
| Independent reviewer verdicts | SHIP | Peer content review covers all 196 new items and legacy gaps; separate code/data integration review passed; concrete wording/key blockers resolved before approval |
| Commit / push | Ready | All lanes verified; release commit follows this handoff update |

The 36-item Oral Health supplement remains separately labelled, not silently promoted into the general-nutrition scored exam. Review destinations are topical study links, not claims of an official syllabus or authenticated answer key. Nutrition review PDF outline/page hashes already match the redesigned 56-page file; no PDF regeneration is needed for this import.

## Delivered scope and exclusions

- **276 scored past-paper questions**, up from 57: 194 newly imported plus 25 recovered legacy questions.
- **324 source occurrences in nine collections**: 288 general-nutrition source items and 36 supplementary oral-health items. Every original occurrence stays accessible.
- **48 source-only occurrences** = 10 held ambiguous/defective items + 2 duplicated scans + 36 unconfirmed oral-health items. These are intentionally not given fabricated single-answer keys.
- **127 Core questions**: 17 conservative repeat groups represent 38 source occurrences; 110 additional selected questions broaden coverage. This is a study-priority selection, not an exam prediction or a count of independent exam sittings.
- All 89 authored Nutrition practice questions and all other course question banks are unchanged. The redesigned review PDF remains unchanged, with outline/page mappings checked.
- Editorial/inferred keys use existing darker feedback styling. Source marks, original stems and explicit study repairs remain distinct in the archive, final exam and downloadable questions/keys.

## Editable inputs / regeneration

1. `data/nutrition/imports/*.json`: five new source transcriptions, keys, evidence, original wording and PDF hashes.
2. `data/nutrition/legacy-resolutions.json`: reviewed answers/holds/duplicate links for the older bank.
3. `data/nutrition/core-selection.mjs`: reviewed equivalent-question groups and additional coverage selections.
4. `scripts/lib/nutrition-imports.mjs`: common import, source-download and curriculum synchronization.
5. `scripts/content/build-nutrition-core.mjs`: deterministic manifest and [Core audit](nutrition-core-exam.md).

Regenerate with `npm run mcq:generate && npm run nutrition:core:generate`; verify with `npm run nutrition:check`, `npm run biochemistry:core:check`, `npm run biochemistry:papers:check`, `npm run mcq:check`, `npm run pdfs:check`, `npm run reviews:check`, `npm run build` and `npm run deploy:validate`.

Reviewer evidence: [legacy/key audit](nutrition-existing-audit.md), [lane A](nutrition-import-a.md), [lane B](nutrition-import-b.md). SHIP means the bounded imported bank, source qualifications and software checks passed; it is not authentication of university answer keys or independent clinical certification.
