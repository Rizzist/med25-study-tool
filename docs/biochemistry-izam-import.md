# Biochemistry IZAM import — 25 September 2026

## Delivered

| Collection | Questions | Main bank / Core eligibility |
| --- | ---: | --- |
| Pharm.D, 23 June 2021 (IZAM) | 40 | Main |
| Biochemistry II, 13 July 2024 (IZAM) | 52 | Main |
| Pharmacy, 5 December 2024 (IZAM) | 36 | Main |
| Undated photographed 50-item report (IZAM) | 50 | Optional supplement; excluded from Select all and Core recurrence |

The bank now has 19 collections / 819 question occurrences: 717 main questions in 17 collections, plus 102 questions in two optional supplements. All 641 pre-existing question records are unchanged, including IDs, keys, and answer-review dates.

Core now selects 203 representatives: 97 repeated patterns and 106 additional coverage questions, mapped to 32 existing review sections. Its repeated patterns have 321 source-question occurrences. These counts describe the archived sources, not predicted exam probabilities.

## Deduplication

The read-only batch is `Downloads/Biochemistry-Izaam-2026-09-24`: 166 downloaded files and 24 archive members, with 163 distinct SHA-256 values. `data/biochemistry/izam-source-audit.json` records every file, disposition and canonical paper ID. Downloads were not deleted or renamed during import.

- Identical files, alternate scans, reordered questions and partial photographs of an existing sitting are attached to that paper, not made into another exam card.
- Existing September 2017, theory-42, January 2022, January 2023, July 2023 and February 2025 copies were recognized. Misleading filenames alone were not used to establish dates or identities.
- The `metabolismMM` and related photographed fragments belong to the newly imported June 2021 paper and do not add independent recurrence votes.
- `Biochemistry key.pdf` is an undated edited compilation mixing questions from different sources. It is not a verified separate sitting and is not published as a new exam.
- The two copies of the 2024 Arabic-named answer report have stems and keyed answers but no distractor sets. They are recorded as incomplete sources; no missing choices were invented.
- Foundation biochemistry, practical papers, lecture notes, Quizlet exports and mixed-subject archive contents do not become metabolism-II past-exam cards.
- Two student roster/answer-sheet images are excluded. The December downloadable cover has its handwritten student name redacted; its original remains untouched in Downloads.

Different actual papers may legitimately repeat a question. Their original question occurrences remain available within each paper, while Core uses one representative per audited repeated pattern.

## Answers and source fidelity

All 178 new entries use editorial/inferred answer provenance, not an authenticated official-key claim. The existing slightly darker answer styling applies. Ambiguous sources retain alternative accepted answers and explanatory caveats. Twelve defective items have explicit study repairs; their original wording/options remain available in source records and downloads. Legacy ATP accounting is identified rather than silently presented as modern accounting.

The review PDF is unchanged. All new questions map to its existing sections and page references. Source PDFs and question/key/combined Markdown downloads are included in the versioned runtime and PDF catalogs.

## Regeneration

Portable authoritative inputs are `data/biochemistry/past-papers.json`, `ai-resolutions.json`, `review-coverage.json`, and `core-selection.mjs`. The three IZAM TSV files preserve the manual transcription input. The one-time Python importer additionally requires the local extraction inventory under `tmp/izam-biochem`; ordinary app builds do not require Downloads, Python or this temporary inventory.

```sh
npm run biochemistry:papers:generate
npm run biochemistry:core:generate
npm run mcq:generate
npm run biochemistry:papers:check
npm run biochemistry:core:check
npm run mcq:check
npm run pdfs:check
npm run reviews:check
npm run build
```

## Verification

- Twenty targeted import/Core/source tests pass, including unchanged source IDs, duplicate-source accounting, optional-report exclusion, answer qualifications and saved-attempt isolation.
- Production build passed. Source PDF derivatives were rendered and visually inspected.
- Browser checks confirm 19 cards, the 203-question Core launch, individual new-paper counts, optional-supplement labeling, and correct instant grading with a source caveat on July 2024 Q1. The browser smoke test leaves a one-answer July-paper draft and an unanswered Core draft on localhost only; no completed score was written.
- All 68 general MCQ and nine PDF-cache tests pass, as does the review-runtime check: 97 tests in total including the targeted tests above. The download-catalog test now expects the four additional collections.
