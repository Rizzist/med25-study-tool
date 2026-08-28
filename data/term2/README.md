# Term 2 Respiratory release

Implemented 2026-08-28. This adds four independent Term 2 exam sections. Only Respiratory is populated. Dates are `null` / “Date TBA”; no date or official exam weighting has been invented.

| Section | Status | Scope |
| --- | --- | --- |
| CVS | Section ready; bank intentionally empty | Cardiovascular block |
| Respiratory | 224 source-grounded practice items | Anatomy, histology, embryology and physiology |
| Upper & Lower Limbs | Section ready; bank intentionally empty | Both limbs confirmed by the user |
| Biochemistry II | Section ready; bank intentionally empty | Second-half Lippincott and local slides; metabolism scope to reconcile |

## Respiratory content

| Collection | Items | Factual sources |
| --- | ---: | --- |
| Anatomy SBAs | 56 | Gray’s Anatomy for Students 3e + 11 local respiratory anatomy decks |
| Histology SBAs | 32, including 8 image questions | Junqueira 16e, Chapter 17, printed pp. 349–369 |
| Embryology SBAs | 24 | Langman 15e, Chapter 14, printed pp. 225–231 + E1/E2 decks |
| Physiology SBAs | 56 | Guyton 15e (2026), Chapters 38–42; explicitly book-only |
| Dynamic anatomy | 56 variants | 28 annotated targets on 4 unchanged diagrams extracted from local slides |

There are 168 regular MCQs plus 56 dynamic variants, using 12 unique source images in total. Each item has four options, one key, correct-answer teaching, an explanation for every distractor, and a page/slide locator. All regular-item answer letters are balanced (42 each). Generated dynamic choices are deterministic, with different distractor sets per target variant. The complete catalog is not 224 unrelated learning objectives: some concepts intentionally recur across subjects and image targets have two variants.

“Verified” means checked against the cited local sources and structural validation, not faculty-approved, psychometrically validated, an official past paper, or complete coverage of every possible examination question. No web question banks, past papers, AI-generated anatomical pictures, or video transcripts supplied factual content. Physiology teacher slides are still missing. Chapter 43 physiology pathology/therapy is outside this bank. Detailed omissions and the final 11-deck gap check are recorded in `provenance/`.

## Behavior

- Term 2 membership requires an explicit `exam-term2-*` tag. Legacy subject-based routing cannot pull these items into Term 1.
- Learn mode reveals the key, all option explanations, source citation and image exploration after an answer is submitted. Mock mode hides these until finish-and-grade.
- Before answering, source labels on dynamic diagrams are masked and a hollow marker identifies the target without covering it. After answering, hover, keyboard focus or tap an annotated anchor to see its name and description; a full-size button list provides a touch/keyboard alternative.
- Anchors identify verified points, not pixel-perfect segmentation of the whole organ. Source image pixels and attribution are unchanged. Enlarging an image does not create new detail.
- Mixed mocks balance the four subjects for practice, not as a claimed official blueprint. One image/target variant is used per session; another variant can appear on a later attempt.
- Stable question IDs preserve selected options and target variants on resume. Existing device-local Term 1 progress and practical migration are preserved; new exams get independent progress records.
- CVS, limbs and Biochemistry II are intentionally not populated with relabeled Term 1 material.

## Data and maintenance

Question files: `data/bank/questions/term2-respiratory-*.jsonl`.
Image catalog: `data/term2/anatomy-images.json`.
Image bytes: `public/study/term2/respiratory/`.
Provenance, image hashes and source audits: `data/term2/provenance/`.

`npm run respiratory:generate` regenerates dynamic variants. The embedded-bank build also runs this generator so source catalog changes cannot silently leave a stale deployed bank. New targets must have verified coordinates, source locators, descriptions and plausible same-image distractors. Keep IDs stable; increment revision for substantive changes. Do not add uncited material or infer missing exam dates.

Run `npm run bank:validate`, `npm run lessons:validate`, `npx tsc --noEmit`, `npm test`, and `npm run deploy:validate`. Tests cover exam isolation, source contracts, deterministic dynamic keys, subject balance, target deduplication, media routing, exact session reload and legacy progress migration. Source diagrams and micrographs were visually checked separately; no browser UI automation was requested.

The excerpts are from the user’s local library for this private study workflow. No public redistribution license or permission to republish complete books is asserted. Preserve owner-only hosting access.
