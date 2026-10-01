# Biochemistry Retake — Term 2 (Cells & Molecules source content)

Requested 2026-09-30; expanded 2026-10-01. Separate course; existing Cell & Molecules and Biochemistry II progress must not change. Navigation now places Retake in Term 2; its persistent `term1-biochemistry-retake` ID is intentionally retained for saved attempts and bookmarks.

| Lane | Status | Acceptance |
| --- | --- | --- |
| Resources and scope | Audited | Teacher decks + latest confirmed original Term 1 syllabus, not the Term 2 bank |
| Review PDF | Complete (v2, 2026-10-01) | 170 pages, 36 topics in 10 units, 256 concepts, 20 figures; typeset-notes design; every practice question anchored |
| Practice | Complete | All 703 existing Cells & Molecules biochemistry Practice MCQs reused verbatim with isolated IDs; no physiology/histology |
| Past papers | Complete | Four papers: 243 biochemistry-only or 314 full-paper occurrences. Independent attempts, combined selections, scoped downloads and preserved source figures |
| Guided / unguided | Complete with explicit reference limits | Both practice and papers; 721 exact paragraph anchors, 61 additional section references. 164 additional Practice and 71 non-biochemistry paper items have no linked review section; topic feedback remains available |
| Verification | Passed | 10 retake regression tests, 76 shared MCQ tests, review-map validation, production build and isolated browser checks |

## Review PDF v2: typeset notes, full practice coverage (2026-10-01)

The review was rebuilt in the "typeset handwritten notes" style chosen from the style trials (modelled on Zahraa Fawzi's CVS anatomy notes): dot-grid paper, coral handwritten headings and numbered key points (Nanum Pen Script), Patrick Hand body text, blue clinical links, grey "past paper asked" boxes, and a "Test yourself" box per topic with three linked practice MCQs and upside-down answers.

| Change | Detail |
| --- | --- |
| Organization | 36 topics in 10 units following the teacher decks: Foundations, Proteins, Enzymes and energy, Carbohydrates, Lipids, Nitrogen metabolism, Metabolic integration, Nutrition and vitamins, Molecular biology, Laboratory. Section IDs are unchanged; only order and units are presentational. |
| Coverage | Lippincott Chapters 8–13 (existing curated concepts) and new Chapters 19–22 are now taught, clearly marked "practice-bank topic" because the reused Cells & Molecules practice bank tests them; the confirmed syllabus statement is unchanged. 256 concepts (was 171). |
| Guided anchors | Every one of the 703 practice questions now opens an exact review paragraph (was 478); 946 anchors in total. Links for the 225 previously unanchored questions live in `data/teacher-materials/biochemistry-concepts-retake-expansion.json` (`links`), so the Practice set itself is unchanged. |
| Figures | 16 process diagrams generated with Codex image generation (gpt-5.6), each checked for labels and science (strand polarity, compartments, enzyme placement); 4 graphs computed from their equations (weak-acid titration, Hb/Mb O₂ binding, Michaelis–Menten, Lineweaver–Burk with inhibitors). |
| Corrections | Two curated statements fixed: GALT transfers UMP (not UDP); TCA dehydrogenases are activated by signals of a low-energy state. |
| Size | 170 pages, about 10.6 MB (dense diagrams print at full width). Figure originals (lossless PNG) are archived in `MED SLIDES/BIOCHEM/08 Retake Review/figures-original/`; the repo keeps high-quality JPEGs. |
| Review fixes | An independent gpt-5.6 review checked all figures, graphs, 133 new-chapter concepts and 89 Test-yourself keys. Fixed: Ehlers–Danlos leader in the collagen figure (now lysyl hydroxylase and N-procollagen peptidase), per-enzyme TCA regulation, graph axis and legend placement, list-number overflow at page breaks, larger dense figures; one ambiguous practice question (`retake-practice-lippincott-ch1-bank-023-v1`, two defensible options) is excluded from Test-yourself boxes. |

Authoring sources: `data/teacher-materials/biochemistry-concepts-retake-expansion.json` (60 new concepts and four comparison tables, written by gpt-5.6 from Lippincott 6e with page citations, then reviewed), `data/biochemistry-retake/figures/` (+ `figures.json` captions), `data/biochemistry-retake/fonts/` (OFL fonts with licences).

Regenerate:

```sh
node scripts/build-biochemistry-retake.mjs          # writes review.json; stops at the layout-hash check
python3 scripts/render-biochemistry-retake.py        # needs PyMuPDF + Pillow and Google Chrome; writes the PDF and pdf-layout.json
node scripts/build-biochemistry-retake.mjs          # publishes anchors, course file, locks and downloads
npm run mcq:generate && npm run biochemistry:retake:check
python3 scripts/verify-biochemistry-retake-pdf.py   # every anchored paragraph is on its recorded page
```

The renderer prints HTML with headless Chrome, measures each section, concept and past-paper paragraph from the PDF text layer, and keeps every anchored paragraph on one page so Guided mode opens it exactly.

## Scope decision

The latest archived scope (`data/teacher-materials/exam-scope.md`, 2026-08-20) confirms Lippincott Chapters 1–7, 14–18 and 23–33, foundations, water/buffers and practical-derived theory. Chapters 8–13 and 19–22 are not independently included. The retake announcement has not been supplied; this is the original confirmed course scope, not a claim of a newly issued official syllabus.

The 2026-10-01 request explicitly expands Practice to the existing Cells & Molecules biochemistry bank: 552 curated questions plus 151 existing authored-core questions. This does not establish a new official syllabus or expand the PDF. Existing 478 retake Practice IDs and answers are preserved; no new AI-generated replacement bank was created.

Teacher resources: INTRODUCTION; Water and Buffer 1404; Vitamin 2024; Amino acids and Proteins; Lipid structure; Enzyme Kinetics and regulation; DNA structure/replication; Transcription; Translation; Regulation of Gene Expression; laboratory equipment/titration/carbohydrate tests. Textbook: Lippincott Illustrated Reviews: Biochemistry, Ferrier, sixth edition.

## Past-paper policy

Biochemistry only remains the default: Cell Block Theory Q27–84 (58), February 2021 Q1–57 (57), Biochemistry 1 Finals 2022 Q1–64 (64), September 2021 Q1–64 (64). September Q64 was omitted in the initial import and is now included using its already-reviewed 2022 equivalent.

Full paper includes all available numbered questions in those same four PDFs: 84 / 80 / 64 / 86 respectively. The 71 non-biochemistry items are excluded from Practice and biochemistry-only tests. The native extraction retains original option order, printed answer marks and five additional diagrams. Incorrect source keys for April Q4 and February Q79 are corrected explicitly; ambiguous February Q58 accepts both valid choices. Study keys are not certified university keys.

Full-paper collection IDs append `--full`, and combined/all-bank scopes have independent IDs. Original biochemistry-only collection IDs remain unchanged. February alternate copies are one paper; PharmD Clinical Biochemistry and Term 2 metabolism papers are not included. Downloads follow the chosen scope; original PDFs always remain complete.

## Current verification (2026-10-01)

- `npm run biochemistry:retake:check`: 10 passed. Exact Practice equality against the existing Cells & Molecules bank; 314 contiguous source occurrences; 243 biochemistry occurrences; strict schema; 8 source figures; keys; all eight scoped downloads; independent sessions and combined selection IDs.
- `npm run mcq:check`: 76 passed. `npm run reviews:check` and `git diff --check`: passed.
- `npm run build`: successful production compilation and TypeScript; auth/PWA, hooks, guided and respiratory checks passed.
- Isolated file-backed QA account: Term 2 selected with 703 MCQs; full select-all gives 314; biochemistry counts 58/57/64/64. Full April paper starts with histology Q1 of 84. Biochemistry April paper starts with Q27 of 58; a Guided answer opens the exact PDF paragraph at p.62. Each saved one-answer attempt survives reload without leaking into the other scope. Browser error log empty.
- Original additional figures visually checked; Q79's printed letter incorrectly points to an open channel and is corrected to the pictured inactivated channel.
- No production accounts, passwords or student progress were changed. No commit/push requested in this turn.

## Initial verification evidence (2026-09-30)

- `node --test tests/biochemistry-retake.test.mjs tests/mcq-refactor.test.mjs tests/final-exam-completion.test.mjs tests/wrong-answer-review.test.mjs tests/guided-exam.test.mjs`: 46 passed.
- `npm run build`: successful optimized production build and TypeScript, including existing auth/PWA, hooks, guided and respiratory checks.
- `scripts/verify-biochemistry-retake-pdf.py`: 92 pages, 26 bookmarks, all 413 unique concept/source-occurrence paragraph anchors found on their actual pages. All pages rendered and inspected in contact sheets; detailed table/page checks and orphan-source correction completed.
- Isolated local QA account (not the production database): course visible under Term 1; Guided practice answer jumps to p.33; practice report includes its review section; four paper counts 58/57/64/63; select-all totals 242; Guided paper answer jumps to p.9 and reload/resume retains answer and mode; Unguided paper has no PDF pane. PDF reports device-cache reuse. Mobile 390px layout has no horizontal overflow; reference appears below questions. Browser error log empty.
- QA images are local ignored artifacts in `tmp/pdfs/retake/`.
- Original 2022 Q10 reaction figure loaded and rendered successfully in the live player; deployment asset validation passed. Retake checks are now part of both production build commands.
- Review copy saved in `MED SLIDES/BIOCHEM/08 Retake Review/Biochemistry Retake Review.pdf`.

## Maintenance / next steps

Adjust the official-scope review if a specific retake announcement changes the original confirmed syllabus. The newly reused additional Practice content is not all in the existing PDF; expanding the PDF is a separate content task. Hosting deployment status must be checked separately from Git push success.

Source/transcription audit: `data/biochemistry-retake/`. Full-source extraction: `scripts/extract-retake-full-papers.py` (pdfplumber + pypdf). Regenerate with `scripts/build-biochemistry-retake.mjs` and `npm run mcq:generate`. The original biochemistry extract stays as a legacy input to preserve the PDF manuscript; expansion is applied separately. If the manuscript changes, render with `scripts/render-biochemistry-retake.py`, rerun generation, then verify the PDF. Preserve stable question IDs for saved progress.
