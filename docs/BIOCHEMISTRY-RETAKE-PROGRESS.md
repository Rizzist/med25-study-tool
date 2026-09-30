# Biochemistry Retake — Term 1

Requested 2026-09-30. Separate course; existing Cell & Molecules and Biochemistry II progress must not change.

| Lane | Status | Acceptance |
| --- | --- | --- |
| Resources and scope | Audited | Teacher decks + latest confirmed original Term 1 syllabus, not the Term 2 bank |
| Review PDF | Complete | 92 pages, 26 sections, 171 concepts; bookmarks, comparison tables, source references and source-paper checkpoints |
| Practice | Complete | 478 scoped MCQs with isolated IDs; no physiology/histology |
| Past papers | Complete | Four paper sections, all 242 source occurrences, 30 explicitly editorial study keys; original locators/transcriptions, images and downloads |
| Guided / unguided | Complete | Both practice and papers; all 720 questions mapped to current PDF paragraphs, cached PDF and saved results |
| Verification | Passed | 46 focused tests, full production build, all-page PDF render inspection and browser workflow checks |

## Scope decision

The latest archived scope (`data/teacher-materials/exam-scope.md`, 2026-08-20) confirms Lippincott Chapters 1–7, 14–18 and 23–33, foundations, water/buffers and practical-derived theory. Chapters 8–13 and 19–22 are not independently included. The retake announcement has not been supplied; this is the original confirmed course scope, not a claim of a newly issued official syllabus.

Teacher resources: INTRODUCTION; Water and Buffer 1404; Vitamin 2024; Amino acids and Proteins; Lipid structure; Enzyme Kinetics and regulation; DNA structure/replication; Transcription; Translation; Regulation of Gene Expression; laboratory equipment/titration/carbohydrate tests. Textbook: Lippincott Illustrated Reviews: Biochemistry, Ferrier, sixth edition.

## Past-paper policy

Use only the biochemistry sections of Cell Block Theory, February 2021, September 2021 and Biochemistry 1 Finals 2022. February alternate copies are one paper. PharmD Clinical Biochemistry and Term 2 metabolism papers are excluded. Existing canonical transcriptions may normalize option order: clearly label study selections and retain original page/question locators. Missing source items and ambiguous keys must be accounted for, not silently discarded or called official keys.

## Verification evidence

- `node --test tests/biochemistry-retake.test.mjs tests/mcq-refactor.test.mjs tests/final-exam-completion.test.mjs tests/wrong-answer-review.test.mjs tests/guided-exam.test.mjs`: 46 passed.
- `npm run build`: successful optimized production build and TypeScript, including existing auth/PWA, hooks, guided and respiratory checks.
- `scripts/verify-biochemistry-retake-pdf.py`: 92 pages, 26 bookmarks, all 413 unique concept/source-occurrence paragraph anchors found on their actual pages. All pages rendered and inspected in contact sheets; detailed table/page checks and orphan-source correction completed.
- Isolated local QA account (not the production database): course visible under Term 1; Guided practice answer jumps to p.33; practice report includes its review section; four paper counts 58/57/64/63; select-all totals 242; Guided paper answer jumps to p.9 and reload/resume retains answer and mode; Unguided paper has no PDF pane. PDF reports device-cache reuse. Mobile 390px layout has no horizontal overflow; reference appears below questions. Browser error log empty.
- QA images are local ignored artifacts in `tmp/pdfs/retake/`.
- Original 2022 Q10 reaction figure loaded and rendered successfully in the live player; deployment asset validation passed. Retake checks are now part of both production build commands.
- Review copy saved in `MED SLIDES/BIOCHEM/08 Retake Review/Biochemistry Retake Review.pdf`.

## Maintenance / next steps

Commit and push authorized by the user after verification. Only outstanding scope dependency: adjust if a specific retake announcement changes the original confirmed syllabus. Hosting deployment status must be checked separately from Git push success.

Source/transcription audit: `data/biochemistry-retake/`. Regenerate with `scripts/build-biochemistry-retake.mjs`; if the manuscript changes, render with `scripts/render-biochemistry-retake.py`, rerun the generator, then `npm run mcq:generate`. Rendering requires Python reportlab and pypdf. Run `npm run biochemistry:retake:check` and the PDF verification script afterwards. Preserve stable question IDs for existing saved progress.
