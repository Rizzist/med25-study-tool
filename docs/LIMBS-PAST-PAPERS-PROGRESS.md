# Upper/lower limb past papers

Started 2026-09-30. Source retrieval uses Telegram's Chrome UI only.

## 5 October 2026 — one original PDF per paper

- Every shared past-paper card now offers one **Original PDF** instead of separate numbered image links. Images retain their full pixel data, aspect ratio and source order; existing PDF pages are copied without rasterizing. Mixed PDF/image originals are combined too. A single existing PDF keeps its direct cached download.
- Original downloads always contain the complete paper regardless of Full / Upper / Lower exam filters. The on-demand source manifest covers 106 collection identities (including four full-retake variants) and 256 published assets. Legacy CVS image collections include their already-published question source pages, not just the first image. Private/unpublished account screenshots remain excluded.
- Generation and PDF code load only on click, with spinner/error feedback. PDFs and source bytes are cached on the device by content hash; changed sources invalidate the bundle without redownloading unchanged images. Authentication remains required, storage is bounded, and unavailable browser storage does not prevent an online save.
- Verification: eight new bundle/cache/render tests, ten existing PDF-cache tests, eleven limb checks, two scoped-PDF checks, 76 MCQ regressions, TypeScript, manifest freshness and the complete production build pass. The broader legacy PDF suite's previously documented unrelated failures are not included in this claim.
- Chrome verification used an isolated file-backed QA account against the production build. The 12-image example saved a valid 12-page PDF; its second click reported **Downloaded from device cache**. First, middle and final pages were rendered and visually inspected for readability/cropping, and all twelve embedded JPEG byte streams matched the originals. No production accounts, attempts or results were changed.

The user authorized committing and pushing this feature together with the pending download-deduplication/import below. Deployment is handled by the existing push pipeline.

## 5 October 2026 — Downloads dedupe and addition

Inspected and organized **51 new downloads**, preserving all original Downloads files. SHA-256 comparisons, source-page inspection and question/choice comparisons distinguish byte duplicates from photographed/reordered reposts.

| Disposition | Files | Action |
| --- | ---: | --- |
| Exact duplicates | 36 | 32 match the existing archive; four repeat files within this batch. Point to one canonical original. |
| January 2023 midterm photos | 6 | Renamed cover + Q1–40 pages under the existing midterm. No new questions; Q31 is still defective. |
| Reordered fibular-attachment question | 1 | Same stem/choices as January 2023 Q2; duplicate retained locally, not scored twice. |
| Reformatted reference duplicate | 1 | 32-page version of the existing 107-question, 18-page reference booklet; cross-linked, not a new bank. |
| New supplemental references | 6 | Four PDFs and two book crops. Reference-only; not mislabeled as TUMS finals. |
| Additional complete question | 1 | Original screenshot Q12, ischial-tuberosity attachment exception. Added as an optional exam-unconfirmed supplement. |

**MED25 totals: 23 collections, 547 source items, 537 scored, 10 ungraded.** Scored scopes: 296 upper, 228 lower, 13 Full-only. The default final selection remains 17 collections / 410 scored; six optional supplements now have 127 scored. No existing question IDs, answers or saved-progress keys were changed. No new complete dated exam was found.

The new answer is C, superior gemellus. Its ischial-spine origin was checked against the University of Washington muscle atlas; the other three choices' tuberosity attachments were also checked. The screenshot's blue text selection is not treated as an official key. The new record is `limbs-lower-attachment-screenshot-q012`, mapped to the hip-bone review section (PDF p. 41), available in Full and Lower only.

Reference folders: `lower-test-question-compilation` (alternate format of the existing `lower-revision-book/01-source.pdf`), `lower-322-mcq-booklet`, `lower-82-mcq-booklet`, `lower-quizlet-muscles`, `lower-khanfour-revision-fragments`. The first compilation describes old tests but has no identifiable institution/sitting; the other files are revision-book/Quizlet material. Their keys are not represented as verified app answers. The Quizlet test and answer export have different question ordering. Generic booklets were classified by source and file duplicates; their entire question sets were not answer-audited or imported.

Archive inventory: **154 download entries**; 15 new canonical originals copied with descriptive names, no deletions. Audit: `data/limbs/download-audit-2026-10-05.json` and the same file in the MED SLIDES archive. The per-question source, answer rationale, references and duplicate note are included in the new collection's `exam-and-answer-key.md`.

Regenerate this batch with `node scripts/content/import-limbs-oct5.mjs`, the normal MCQ generation chain, then the helper again to sync the combined Markdown. The helper validates hashes, refuses conflicting source overwrites, and does not reclassify the September/2 October sources. It requires the original batch still in Downloads. Do not run the historical archive finalizer.

Verification: **11/11 limb checks, 2/2 limb PDF-scope checks, 76/76 MCQ regressions**, limb/review generator freshness checks, and `git diff --check` pass. All 51 download originals and canonical archive paths were SHA-256 checked; the previous 103 inventory entries, all 536 existing scored limb records, and all existing course collection objects are unchanged. The 18-page and 32-page reference variants also have matching numbered question starts and 99.87% normalized native-text similarity. No new UI code or standalone PDF was introduced; no fresh browser/full production build was run for this data-only update. Changes are local, not committed or pushed in this turn.

## 2 October 2026 — new Downloads import

Three distinct question sets from seven new PDFs are now imported. Duplicate/subset copies were merged; the May 2025 midterm was already present, and the 48-page revision book remains reference-only.

| New collection | Source items | Full scored | Upper only | Lower only | Availability |
| --- | ---: | ---: | ---: | ---: | --- |
| IUMS upper-limb screenshots · 1399/11/08 | 25 | 23 | 20 | 0 | Optional supplement; non-TUMS source |
| Upper-limb & axial photographed fragment (`Past year 3`) | 27 | 26 | 21 | 0 | Main bank |
| Lower-limb & axial photographed fragment (`Past year 2`) | 19 | 19 | 0 | 14 | Main bank |
| **Added** | **71** | **68** | **41** | **14** | **13 scored axial/general questions are Full-only** |

Current total: **103 source files, 22 collections, 546 source items, 536 scored and 10 ungraded**. Scored scope totals are 296 upper, 227 lower and 13 Full-only. The default main bank has 17 collections / 410 scored; five optional supplements have 126 scored.

The three newly ungraded items are IUMS Q15 (scapular-anastomosis network ambiguity and an incorrect supplied key), IUMS Q18 (insufficient localization of an ulnar lesion), and upper/axial Q19 (all supplied lumbrical statements are false). All remain in the source exports with explanations. Corrected or inferred answers, multiple defensible answers, and reconstructed wording retain provenance; the photographed key is not silently overwritten. Axial items cite CVS or development references explicitly rather than receiving false limb-review mappings.

Originals and one combined exam-and-answer-key Markdown file per new collection are in the MED SLIDES archive. The IUMS originals contain student-identifying UI and stay local; anonymous question/key exports are available in MED25. Full / Upper only / Lower only scopes also govern generated bundle PDFs and combined sessions. Individual paper downloads and original-source PDFs remain whole.

Verification: 10/10 limb checks, 2/2 scoped PDF checks, 76/76 MCQ regressions, and production build pass. All 468 previously scored limb records and unrelated course records are unchanged. A generator-ordering issue was repaired so a limbs check no longer depends on which course was rebuilt last. Chrome checks against an isolated file-backed QA account verified the three scope selectors, new collection counts, a 21-question upper session with a correctly rendered source figure and instant feedback, a 14-question lower combined session, and independent Full/Upper saved progress. No production accounts or results were modified.

Regenerate safely:

1. `node scripts/content/import-limbs-october.mjs`
2. `npm run mcq:generate`
3. `node scripts/content/import-limbs-october.mjs` (copies updated combined Markdown into the local archive)
4. `npm run limbs:papers:check` and `npm run mcq:check`

Do not use the older `finish-limbs-archive.mjs` to rebuild the current inventory: it describes the original September corpus only. The October helper is append-only and checks existing archive bytes before copying. The user authorized committing and pushing this import on 2 October 2026; deployment remains handled by the existing pipeline.

## Historical baseline — 30 September 2026

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

The September implementation was prepared for `http://localhost:3000/?exam=term2-limbs` (normal login required). The user authorized committing and pushing that worktree, including the preceding account/PWA lanes. For current regeneration, use the October workflow above rather than the historical archive finalizer.

Two large lower-2023 PDF scans have web-optimized full-resolution image encodings for GitHub/web delivery (JPEG quality 90, all pages and text retained). Their untouched originals remain in Downloads and the local archive. `data/limbs/source-manifest.json` records both original and web hashes. Rebuilding those copies via `scripts/content/archive-limbs.mjs` requires Python with pypdf and Pillow; set `MED25_PDF_PYTHON` to the desired interpreter. A size-budget test prevents future oversized published files.

Existing account/PWA edits predate this task and are included by the user's explicit "commit everything" direction.
