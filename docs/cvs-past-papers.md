# CVS Final Exam papers

Imported 15 September 2026. This is a separate source-paper workflow, not an AI-generated practice bank.

## Entry point

Open `http://localhost:3000/?exam=term2-cvs`, then **Final exam**.

Choose a paper, answer in original order, finish and mark. Latest completed results and unfinished attempts are stored per paper in browser localStorage under `med25-cvs-papers-v1`. New attempts retain the latest finished result. Source-question fingerprints prevent resuming against changed options/questions. Browser storage errors are visible.

## Focused exam UI and weakness report — 18 September 2026

- Opening a paper hides the application sidebar and exam-selector bar, including during results/review. Save & exit restores the chooser/navigation. A session DOM marker drives the layout directly as well as the parent state callback, so hot updates cannot leave stale navigation visible.
- Learn mode is the default: whole answer rows are keyboard/touch buttons with immediate supplied-key feedback. The first answer is locked to avoid inflating results after seeing the key. Optional deferred-feedback mode waits until final marking. Incomplete-choice questions use a typed draft with explicit submission.
- The 942 source records are mapped to 64 substantive review headings, plus an explicit unclassified category for two unsuitable/out-of-scope records. `topic-map.json` is a separate sidecar: original paper bytes, fingerprints and storage key are unchanged.
- Completed reports show subject and detailed-topic accuracy, answered coverage, mistakes, unanswered items and answered-but-ungraded items separately. Manual marks are labeled. Accuracy uses only graded answers; the legacy overall source-key result retains its original all-keyed-question denominator.
- Topic rows match the headings in `01 - Cardiovascular Review.pdf`. Review-wrong, unanswered, needs-checking and per-topic question filters preserve the scored attempt. Untested review headings are listed; absence from one paper never means mastery.
- Latest per-paper results include the section breakdown in local storage; older saved attempts/results remain readable. Closing/reopening computes the report from the saved answers and current navigation metadata.

Verification: 22 focused data/state/UI-contract tests pass, including all paper hashes and mapping references. TypeScript and production build pass. Browser checks on an isolated local origin verified hidden navigation, whole-row correct/wrong feedback, 390px mobile layout without horizontal overflow, report/filter behavior, reload persistence, deferred feedback, and neutral handling of unkeyed answers. No user study answers were changed during testing. A requested independent review agent hit the account usage limit; final UI verification was completed by the main agent, not falsely reported as an independent SHIP verdict.

Only supplied, unambiguous transcribed keys are compared automatically; scores say **source-key matches**, not officially correct. Missing, disputed or OCR-uncertain answers remain ungraded and support separate manual marking. The ungraded count is always visible; no missing answer is guessed. Original pages and Markdown remain accessible for checking, with a warning that handwritten answers may be visible.

## Imported source inventory

| Paper / fragment | Records | Source-keyed |
|---|---:|---:|
| April 2021 report | 100 | 99 |
| September 2021 theory | 100 | 98 |
| October 2021 report | 100 | 96 |
| September 2021 practical / 19 December | 14 | 12 |
| May 2022 | 89 | 0 |
| January 2023 | 100 | 0 |
| February 2025 | 99 | 0 |
| Undated histology-first paper | 100 | 0 |
| Undated student PDF, filename 2023 | 99 | 0 |
| Undated photographed Q1–91 fragment | 91 | 0 |
| Undated answered Q1–50 fragment | 50 | 50 |
| **Total** | **942** | **355** |

Record counts include visibly flagged cropped/OCR-provisional items, not a claim of 942 fully verified MCQs. The May 2022 short-answer pages are missing. Do not infer original total exam length from fragment counts. All 86 downloaded originals (17 PDFs, 69 photos) remain unchanged in the medical archive. Duplicates are preserved but not double-counted. Reference books and unconfirmed/mixed sources do not enter Final Exam.

## Files

- Medical archive: `/Users/rizzist/Documents/MED SLIDES/TERM 2/01 Cardiovascular/Past Exams`; start at `00 - Start Here.md`.
- Each paper has `Exam - Questions and Answer Key.md`, source files, answer status and full source-text appendix.
- Original/current names and SHA-256: medical archive `_source-ledger.json`.
- Rebuild workspace: `/Users/rizzist/Documents/Codex/2026-08-26/look/cvs-papers-work`; see `PROGRESS.md`.
- Public data: `public/study/cvs-past-papers/index.json` and one `paper.json` per paper. Loaded on demand; source images are not eagerly downloaded.
- UI: `src/components/CvsPastExams.tsx` and CSS module.
- Persistence/grading: `src/lib/mcq/cvs-paper-state.mjs`.

## Verification boundary

38 targeted regression tests and TypeScript passed. Production build passed with existing large-bundle/plugin-timing warnings. Local root/catalog/paper/Markdown/image requests returned HTTP 200. All 86 originals passed post-move hash verification. Header overlap fixed by content-sized grid header and remaining-height flex content, with mobile flow preserved.

The original import did not include browser visual QA; the 18 September UI pass above does. No full independent medical answer-key review is claimed. Remaining OCR/cropped text is exposed for source checking. No deployment or Git push was requested.
