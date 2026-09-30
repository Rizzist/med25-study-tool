# Upper/lower limb past papers

Started 2026-09-30. Source retrieval uses Telegram's Chrome UI only.

| Lane | Status | Remaining |
| --- | --- | --- |
| Collect originals | Complete for the three accessible channels below | 96 source files indexed; no unclassified files |
| Archive + deduplication | Complete | 19 paper collections, numbered originals, one exam-and-answer-key Markdown file per collection; duplicate/reference-only groups retained separately |
| Transcription + answer review | Complete with explicit source limitations | 475 source items; 468 scored; 7 incomplete/ambiguous items preserved without grading |
| MED25 import | Complete locally | All / Upper only / Lower only, including within mixed papers; independent saved results; combined sessions; downloads; review-section mapping |
| Verification | Passed | 9 limb tests, 68 MCQ regression tests, production build, and actual browser exam/download checks |
| Publish | Authorized 30 September 2026 | User explicitly requested committing and pushing all pending work, including account/PWA lanes; deployment handled by the existing pipeline |

## Sources

- McQ_ANS (`@mcqtums`): limb-paper searches inspected back to January 2023; source files classified in the archive manifest.
- TUMS MCQ BANK (`@TUMS_2020`): upper/lower limb 2023 PDFs and two separate answer-key photos.
- McQ (`@vipargantina`), Anatomy limbs topic (peer -2391450967, topic message 4294967300): scanned full history from its creation (27 Dec 2024) to latest post (8 Dec 2025). PDFs plus 18 lower-limb revision photos, 15 occupational-therapy mixed photos, 21 January-7 upper-limb photos, five Lower2025 photos, five July-2023 final photos, five May-2025 midterm photos.

Downloaded originals remain in Downloads. Organization copied, not removed, them. Exact reposts/shuffled exports are grouped, while repeated concepts across distinct papers remain. Dates in filenames/posts are not automatically examination dates. Generic books/TBL material is excluded from Final Exam. The three midterms and one scope-unconfirmed online screenshot collection are optional supplements, excluded from Select all and the default final bank.

This is the collected accessible corpus, not a claim that no other Telegram channel has additional papers. The 180 MB `Limb_TUMS_translated_AI.pdf` post explicitly describes lecture notes, not a past exam, and was excluded. Source files containing student-identifying account UI remain local, not public app downloads.

## Inventory and location

- Archive: `/Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Past Exams/INDEX.md`.
- 19 collections: 475 source items; 468 scored (255 upper, 213 lower).
- Default/main bank: 15 collections, 365 scored (211 upper, 154 lower).
- Optional supplements: 4 collections, 103 scored.
- Machine-readable audit: `data/limbs/import-audit.json`.
- Coverage/source ledger: `data/limbs/source-manifest.json` and `data/limbs/collection-inventory.json`.
- Questions, answer provenance, corrected translations/choices and review mappings: `data/limbs/papers/`.
- Stable runtime bank: `data/final-exams/limbs-past-papers.jsonl`.

## Seven items not graded

| Source | Item | Limitation |
| --- | --- | --- |
| Lower midterm 2023 | Q31 | Incomplete predicate |
| Mixed practical 2022 | Q1 | Missing figure |
| Upper photographed A | Q10 | Stem/choices mismatch |
| Upper photographed B | Q14 | Cropped stem |
| Upper photographed B | Q15 | Cropped choices |
| Upper photographed B | Q16 | All supplied alternatives true; cannot justify a unique keyed answer |
| Upper Kish 2025 fragment | Q4 | Ambiguous thumb lymphatic-drainage wording/options |

These are retained in source downloads and counted as ungraded, not silently discarded or supplied with invented distractors. Editorial answers and source-key corrections preserve their provenance.

## Verification evidence

- `npm run limbs:papers:check`: 9/9 passing; schemas, counts, scope independence, stable IDs, key parsing, source hashes, media, authenticated route responses and PDF document definitions.
- `npm run mcq:check`: 68/68 passing.
- `npm run build`: successful optimized Next.js build, TypeScript and included auth/activity/PWA/hook/map checks.
- `git diff --check`: clean.
- All 77 pre-existing source collections remain unchanged.
- Actual Chrome UI checks used an isolated file-backed fixture account on port 3912, never the production Neon store or real student progress.
- Upper/lower scoping verified in mixed theory paper: 45 full questions split to 25 upper and 20 lower, with separate progress.
- Lower Select all: 8 main collections, 154 scored, supplements unticked.
- Practical image loaded; answer click feedback and completion/results verified.
- Completed upper theory test: original 10/25 score retained while wrong-answer review added a separate yellow review bar. Results reopen correctly rather than resuming completed attempts.
- Browser check found and fixed unstable scoped-course object identity triggering repeated result reloads; transformation now memoized.
- Browser-generated questions-and-key PDF: 23 pages, full 45-source-item mixed paper even when Upper only is selected. First two and final pages rendered and visually checked. Downloads intentionally preserve the complete original paper.
- Broader legacy `tests/paper-pdf.test.mjs` still has an obsolete hard-coded 30-collection expectation (already 77 before this import) and missing math glyph coverage in other-course PDFs. These unrelated failures are not represented as passing.

## Resume / publish

Implementation is ready locally at `http://localhost:3000/?exam=term2-limbs` (normal login required). The user authorized committing and pushing the entire pending worktree, including the preceding account/PWA lanes. To re-run generation: `npm run limbs:papers:generate`, `npm run mcq:generate`, and `node scripts/content/finish-limbs-archive.mjs`, then the verification commands above.

Two large lower-2023 PDF scans have web-optimized full-resolution image encodings for GitHub/web delivery (JPEG quality 90, all pages and text retained). Their untouched originals remain in Downloads and the local archive. `data/limbs/source-manifest.json` records both original and web hashes. Rebuilding those copies via `scripts/content/archive-limbs.mjs` requires Python with pypdf and Pillow; set `MED25_PDF_PYTHON` to the desired interpreter. A size-budget test prevents future oversized published files.

Existing account/PWA edits predate this task and are included by the user's explicit "commit everything" direction.
