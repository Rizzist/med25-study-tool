# Term 1 past-paper integration — 9 October 2026

36 originals map to 35 takeable paper collections: 11 Tissue Development papers and 24 Cell & Molecules / Biochemistry papers. The two January 2023 Tissue scans share one 80-question session and retain both original downloads. The 35 collections retain 2,073 source occurrences, including repeated source pages and question numbers. There are 1,909 scored and 164 explicitly ungraded occurrences.

## One paper pipeline

Original PDF/DOCX → reviewed occurrence JSON → canonical collection and shared runtime bank → existing Take paper / saved attempt / combine flow → questions, answer key and Q+A exports → browser-generated PDFs. Every occurrence retains its source ordinal, printed number, original page, options, figure and answer provenance where available. Missing source questions are never invented.

`data/term1-telegram/catalog.json` is the original-file inventory; its historical `source-only` flag describes that inventory, not the application’s paper capability. `scripts/build-term1-papers.mjs` maps every inventory record to the same canonical catalog used by older papers. The build fails if a required extraction is missing.

New papers expose `takeableQuestionIds` containing every retained occurrence. `gradedQuestionIds` contains only defensible keys. This allows incomplete recall and written responses to be taken, saved and combined without false wrong answers or inflated scores. Source marks and editorial answers are distinguished; accepted alternative options grade consistently in the app and appear in keyed PDFs.

Existing collection IDs, question revisions and saved attempt storage remain intact. Biochemistry Retake uses the same new source questions with separate Biochemistry-only and Full-paper selections. Combined selections use stable identities, deduplicate repeated question IDs, and preserve source occurrences. Their PDFs use the same paper ordering.

## Original-to-paper map

Each row supports Take/Resume, combine, questions PDF, answer key PDF, Q+A PDF and original download. The alternate Tissue scan uses its shared session.

| Original / paper | Source ID | Session items | Scored | Ungraded | Mapping |
|---|---|---:|---:|---:|---|
| Tissue Development & Function · September 2019 semester | `tissue-sep2019` | 53 | 53 | 0 | Canonical paper |
| Tissue Development · February 2021 report | `tissue-test20162` | 83 | 81 | 2 | Canonical paper |
| Tissue Development · June 2021 file | `tissue-test22204` | 75 | 75 | 0 | Canonical paper |
| Tissue Development & Functions · September 2021 | `tissue-sep2021` | 80 | 79 | 1 | Canonical paper |
| Tissue Development · undated February file | `tissue-feb` | 75 | 75 | 0 | Canonical paper |
| Tissue Development · 2023 annotated scan | `tissue-2023-annotated` | 80 | 77 | 3 | Alternate original of `tissue-jan2023` |
| Tissue Development & Function · 21 January 2023 | `tissue-jan2023` | 80 | 77 | 3 | Canonical paper |
| Tissue Development · 20 January 2025 | `tissue-jan2025` | 80 | 73 | 7 | Canonical paper |
| Tissue Development · Tehran 2026 photo paper | `tissue-tehran2026` | 84 | 80 | 4 | Canonical paper |
| Tissue Development practical · report 20172 | `tissue-practical20172` | 10 | 10 | 0 | Canonical paper |
| Histology and anatomy · report 22196 | `tissue-anatomy22196` | 66 | 64 | 2 | Canonical paper |
| Anatomical sciences 1 · DDS compilation | `tissue-dds-compilation` | 308 | 303 | 5 | Canonical paper |
| Cell & Molecules · 22 January 2024 | `cell-jan2024` | 92 | 90 | 2 | Canonical paper |
| Biochemistry I · 29 January 2023 | `bio-jan2023` | 50 | 47 | 3 | Canonical paper |
| Biochemistry I · September 2019 recall | `bio-sep2019` | 55 | 12 | 43 | Canonical paper |
| Biochemistry · Dr Nowrouzi question scan | `bio-nourozi` | 48 | 48 | 0 | Canonical paper |
| Biochemistry · annotated paper fragment | `bio-marked-2023` | 37 | 30 | 7 | Canonical paper |
| Biochemistry · undated TUMS paper | `bio-undated-t3` | 35 | 32 | 3 | Canonical paper |
| Biochemistry · undated DDS paper | `bio-dds-t2` | 40 | 31 | 9 | Canonical paper |
| Biochemistry · PharmD midterm, January 2024 | `bio-pharmd-jan2024` | 64 | 60 | 4 | Canonical paper |
| Biochemistry · DDS / PharmD, 12 July 2023 | `bio-dds-jul2023` | 57 | 52 | 5 | Canonical paper |
| Cell & Molecules · online exam screenshots | `cell-online-theory` | 73 | 70 | 3 | Canonical paper |
| Cell block · June 2022 scan file | `cell-online-scan2022` | 30 | 30 | 0 | Canonical paper |
| Cell & Molecules · February 2021 answer version | `cell-feb2021-answers` | 80 | 79 | 1 | Canonical paper |
| Biochemistry · FINAL EXAM answer document | `cell-final-docx` | 39 | 37 | 2 | Canonical paper |
| Cell & Molecules · Kish theory photo compilation | `bio-kish-theory` | 71 | 65 | 6 | Canonical paper |
| Biochemistry practical · Kish photo paper | `bio-kish-practical` | 20 | 15 | 5 | Canonical paper |
| Biochemistry practical · 22 January 2024 | `bio-practical-jan2024` | 25 | 22 | 3 | Canonical paper |
| Cell & Molecules practical · report 20203 | `cell-practical20203` | 22 | 19 | 3 | Canonical paper |
| Cell & Molecules practical · flame photometry paper | `cell-practical-flame` | 27 | 24 | 3 | Canonical paper |
| Cell & Molecules practical · Molisch test paper | `cell-practical-molisch` | 27 | 24 | 3 | Canonical paper |
| Cell & Molecules practical · online screenshots | `cell-practical-online` | 31 | 24 | 7 | Canonical paper |
| Biochemistry practical · DDS / PharmD, 15 July 2023 | `bio-practical-dds2023` | 17 | 15 | 2 | Canonical paper |
| Biochemistry · comprehensive quiz, 27 February 2016 | `bio-quiz2016` | 20 | 15 | 5 | Canonical paper |
| Biochemistry · comprehensive quiz alternate version | `bio-quiz2016-variant` | 20 | 15 | 5 | Canonical paper |
| Biochemistry · Dr Pasalar student MCQ compilation | `bio-dna-student-mcqs` | 99 | 83 | 16 | Canonical paper |

## Validation and review

GPT-6 Astra authors and independent reviewers compared source wording, options, ordering, figures and answer evidence. Repeated review repaired incorrect source keys, ambiguous questions, cropped labels, missing February figures, numbering mistakes and answer leakage. Tissue, theory and practical content scopes received SHIP. Final integration review received SHIP, including exam persistence, combined selections, downloads, accepted-answer PDF highlighting and preserved legacy identities. The retake review registration adds all 1,079 imported occurrences as explicitly unmapped and preserves all 1,051 legacy mappings; no textbook bookmark is inferred from an imported question.

Browser QA on an isolated local account verified a 92-item imported paper; a combined 142-item session with answers preserved after reload; written-response saving with ungraded feedback; and actual generated questions, key and Q+A PDFs with rendered figure inspection. Automated checks cover all 36 original file hashes, all new collection members/exports, missing-member failures, ungraded/alternative-answer scoring, written-response persistence, original downloads, PDF glyphs and figure errors.

Regenerate app data with `node scripts/build-mcq-runtime.mjs` and `node scripts/build-pdf-manifest.mjs`. Run `npm run term1:papers:check`, `node --test tests/paper-pdf.test.mjs`, `npm run mcq:check`, `npm run pdfs:check`, `npm run deploy:validate`, and `npm run build`. Tissue extraction inputs and ordered review stages are documented in `data/term1-telegram/README.md`. Biochemistry theory regeneration uses `scripts/content/extract-term1-biochem-theory.py` and its committed reviewed source data. Practical regeneration runs `scripts/extract-term1-biochem-practical.py` followed by `scripts/extract-term1-biochem-practical-reviewed.py`.
