# Divine Ethics — source-based teaching and practice

Updated 17 September 2026. Local implementation; not committed, pushed or deployed by this task.

## Source and boundaries

- New download: `-2475820633012625661_26493396295830.pdf`, a 15-page scanned textbook extract.
- PDF 1–3 are contents pages. PDF 4–15 are twelve teaching pages (out of textbook order).
- Organized original: `/Users/rizzist/Documents/Med Slides/TERM 2/06 Other Courses/Divine Ethics/Divine Ethics - Selected Textbook Pages - 2026-09-17.pdf`.
- Full book identity/edition, official exam weighting and official answer key are unconfirmed.
- No past-paper questions were supplied in this extract. The older `Divine Ethics Exam PDF.pdf` also contains teaching pages, not an authenticated exam.
- Final Exam/Past Exams therefore remains empty. Newly authored questions only enter Practice.

## Coverage

| Topic | New PDF pages | Practice MCQs |
| --- | --- | ---: |
| Planning and organization | 4, 5 | 10 |
| Sincerity and ostentation | 6, 7 | 8 |
| Seven sincerity practices | 7 | 8 |
| Trust, effort and signs | 8, 13 | 10 |
| Remembrance and apple case | 9 | 6 |
| Gratitude levels and benefactors | 10, 11 | 8 |
| Gratitude effects and obstacles | 11, 12 | 8 |
| Prayer and wise response | 14 | 8 |
| Immediate repentance and habits | 15 | 9 |
| **Total** | **All twelve teaching pages** | **75** |

Questions mix definitions, comparisons and applications, with a rationale for every option and both PDF and printed-page locators. Correct keys rotate evenly. Topic subsets, mixed practice, immediate teaching, end-graded testing, and existing per-exam saved progress are supported. Religion and Divine Ethics are separate exams despite sharing the internal subject taxonomy.

## Review and editable material

- Review: `/Users/rizzist/Documents/Med Slides/TERM 2/10 Review Summaries/10 - Divine Ethics Review.pdf`.
- Canonical review: same folder, `_build/content/divine-ethics.json`.
- New teaching/MCQ authoring: `scripts/content/divine-ethics-teaching.mjs` and `scripts/content/divine-ethics-practice.mjs`.
- Generated catalog and page coverage: `data/divine-ethics/`.
- Regenerate app data: `node scripts/build-divine-ethics.mjs`, then `node scripts/build-embedded-bank.mjs`.
- Validate deterministic app output: `node scripts/build-divine-ethics.mjs --check`.
- Optional shared-notes sync: run `_build/update_divine_ethics_sep17.py` after generating the catalog. It replaces only `sep17-*` sections; older-packet sections are retained. Subsequent direct PDF-only edits should use the canonical JSON and `build.py`, not this sync script.
- PDF regeneration and source-manifest details are in `_build/sources/divine-ethics-sep17/README.md`.

## Verification

- Author visually inspected all fifteen source-page images, with archived OCR as a secondary aid.
- Full rendered PDF inspected; mechanical PDF bounds/glyph checks have no findings.
- Schema, IDs, option/explanation alignment, page coverage, exam isolation and final-bank separation tested.
- Production build and TypeScript check passed. Existing Religion and Nutrition tests passed alongside the new tests.
- Browser checked topic filtering, page references, empty past-paper view, Learn answer feedback and saved results. Mobile question layout at 390px had no horizontal overflow.
- Verification used a separate local test port to avoid replacing the main localhost:3000 unfinished sprint.
- No independent theological reviewer or official exam certification is claimed.

## Still needed from the course

The contents list references absent pages: full piety, detailed repentance elements, levels of intention, later planning and social ethics. Do not populate these as if supplied. Obtain those pages only if the lecturer confirms they are required. The older packet's self-building/prayer material remains distinctly labeled review background; these 75 new MCQs cover the new extract.
