# Nutrition in MED25 — 14 September 2026

Implemented locally as `term2-nutrition`, separate from Biochemistry II.

## What is where

| Area | Count | Content |
|---|---:|---|
| Practice / Topics | 89 MCQs | Newly authored Nutrition Review + Nutrition & Diet Therapy questions; 23 topic sets |
| Final Exam / Scored past-paper MCQs | 57 MCQs | Original general-nutrition stems and four choices, source order retained; checked explanations, not an official key |
| Final Exam / All papers + answer notes | 128 source items | Every source item, including ungraded and duplicated entries; original PDF page, answer/correction notes, review progress |

The 57 scored questions are a subset of the 128 source items, not an additional 57 recovered questions. There are 92 general-nutrition source items and 36 from the separate Nutrition in Oral Health paper. Neither source item counts nor topic coverage are an official exam blueprint.

| Paper | Original items retained | Scored MCQs | Remaining in source review |
|---|---:|---:|---:|
| F — nutrition final exam.pdf | 24 | 18 | 6 |
| N — Nutrition .pdf | 28 | 10 | 18 |
| D — تغذیه.docx, locally rendered PDF | 40 | 29 | 11 |
| O — تغذیه.pdf, Nutrition in Oral Health | 36 | 0 | 36 |
| Total | 128 | 57 | 71 |

All source-review items stay in **Final Exam**, not Practice. A source page may contain more than one question or may span into the following page. The document links support opening the complete paper, so no surrounding text/options are discarded. Original student marks are visible in original PDFs and are not official answer keys.

## Practice scope

Review sections 02–24: nutrients/DRIs/food choices; carbohydrate/fiber; lipids; protein; digestion; energy; assessment; malnutrition/refeeding; vitamins A, D, E/K, B vitamins, folate/B12 and C; iron; other minerals/water; pregnancy/lactation; infancy; ageing; clinical diets; oral health; numerical checkpoints; integrated cases.

The 3 oral-health practice questions are explicitly supplementary. **Mixed core practice** excludes them. The ordinary all-questions collection includes them with source/scope labels.

Book: DeBruyne, Pinna & Whitney, *Nutrition & Diet Therapy*, 9th edition (2016), local 866-page PDF. References use the PDF page counter, not a guessed printed folio. Nutrition Review is a secondary source, with its book locators retained. Current NIH/CDC/FDA/NIDDK/NHLBI references already used in the review qualify changing recommendations. No matching Nutrition lectures, transcript or official syllabus has been confirmed.

Every MCQ includes a keyed answer, teaching explanation, three specific distractor explanations, source locator and explicit exam-routing tags. Practice answer positions are balanced. Past-paper option order is preserved, so its key positions are not artificially balanced.

## Quality boundaries

- Software `verified` status means eligible after content/schema checks; it does not mean an official university key or independent clinician approval.
- English spelling/punctuation can be normalized; Persian N items are translated, not rewritten as invented cases. Original files remain available for comparison.
- Historical/qualified items expose a warning before answering and explain the convention afterward. Examples: chromium, the approximate pregnancy energy increment, kwashiorkor's historical simplification, and traditional high-linoleic oils.
- Ambiguous items are retained ungraded rather than given a forced answer. F21 is not merely a wrong key: renal 1-alpha **activation** and renal 24-hydroxylation both occur, so its unqualified wording is problematic. F11 lacks the exact 2.4-microgram adult B12 choice. F13 omits sex. F16 uses an ambiguous 'cyclic' description.
- N18 and N24 are explicit repeated scans and remain visible without extra scored weight.
- The separate Oral Health paper is kept in full, but its course match/keys remain unconfirmed.
- Some ungraded items require a clearer original, lecture convention, stronger evidence or a validated single-best-answer interpretation. Their topic and review notes are not a fabricated official key.

## Regeneration and checks

Editable question inputs:

- `scripts/content/nutrition-practice.mjs`
- `scripts/content/nutrition-past-papers.mjs`
- `data/nutrition/sources.json` (source inventory, book locators, original-item ledger)

Run `node scripts/build-nutrition.mjs` to regenerate the two JSONL banks and the catalog. Run `node scripts/build-nutrition.mjs --check` to check reproducibility. The normal embedded-bank build also regenerates Nutrition.

The optional one-time `scripts/import-nutrition-sources.mjs <review _build path>` imports the existing review ledger and copies the four original PDFs. Ordinary builds do not require the author's local Downloads or book paths.

Verification includes schema and option/key checks, all 128 source IDs, original PDF hashes, balanced practice keys, review-module mapping, saved-progress migration, final/practice disjointness, cross-exam routing, and production API tests. Existing 518 non-Nutrition final questions remain hash-identical.

Tests: `tests/nutrition.test.mjs`, `tests/nutrition-routes.test.mjs`, plus the existing Term 2 integration and comprehensive-bank regressions. Production API tests require a fresh app build.

## Local handoff / remaining source questions

- No deployment, git commit or push was requested or performed.
- Original past-paper PDFs can contain student-identifying header text. This addition is local; review/redact that material before any future public publishing. Original Downloads files were not changed or deleted.
- Confirm the Oral Health course match and supply official keys/clearer originals if those source-review items should enter automated scoring later.
- The existing Vinext development runner encountered a runtime string-conversion error on this machine. The already-installed Next.js development server is serving port 3000 instead; package scripts were not replaced. Production Vinext build and API tests pass.
