# Term 2 Respiratory release

Implemented 2026-08-28; expanded with the concept curriculum and gap audit on 2026-08-29. Four independent Term 2 exam sections exist. Only Respiratory is populated. Dates are `null` / “Date TBA”; no date or official exam weighting has been invented.

| Section | Status | Scope |
| --- | --- | --- |
| CVS | Section ready; bank intentionally empty | Cardiovascular block |
| Respiratory | 408 question records; 116 study concepts | Anatomy, histology, embryology and physiology |
| Upper & Lower Limbs | Section ready; bank intentionally empty | Both limbs confirmed by the user |
| Biochemistry II | Section ready; bank intentionally empty | Second-half Lippincott and local slides; metabolism scope to reconcile |

## Respiratory content

| Collection | Items | Factual sources |
| --- | ---: | --- |
| Anatomy SBAs | 133 (77 added) | Gray’s Anatomy for Students 3e + 11 local respiratory anatomy decks |
| Histology SBAs | 68 (36 added), including 8 image questions | Junqueira 16e, Chapter 17, printed pp. 349–369 |
| Embryology SBAs | 41 (17 added) | Langman 15e, Chapter 14, printed pp. 225–231 + E1/E2 decks |
| Physiology SBAs | 110 (54 added) | Guyton 15e (2026), Chapters 38–42; explicitly book-only |
| Dynamic anatomy | 56 variants | 28 annotated targets on 4 unchanged diagrams extracted from local slides |

There are 352 regular MCQs plus 56 dynamic variants, using the same 12 unique source images. This is 380 distinct regular-question/visual-target samples, not 408 independent learning objectives. Each item has four options, one key, correct-answer teaching, an explanation for every distractor, and a page/slide locator. New answer positions are balanced within subject and shuffled. Generated dynamic choices are deterministic, with different distractor sets per target variant.

## Concept curriculum and coverage

The Study concepts section contains 19 ordered reading modules and 116 detailed concepts: 33 anatomy, 25 histology, 17 embryology and 41 physiology. Across them are 795 study points, 233 exam distinctions and 234 answered retrieval prompts, with exact book/slide locators, explicit learning objectives and direct practice links.

All 297 stated learning objectives have at least one direct question sample. The original bank sampled 153; 144 received their first direct sample through this expansion. All 408 question records have a concept home. The 184 additions target genuine coverage gaps and complementary applications. These counts measure objective sampling, not mastery, examination probability or testing of every statement in the notes.

The Coverage & source audit view includes module-level coverage, remaining source limits and 448 inventory entries mapping source headings, tables, figures and slide material to concepts. Anatomy accounts for all 179 slides in the eleven decks. The detailed author audits and correction proposals are preserved in `provenance/concepts-2026-08-29/`.

Theory checkmarks are device-local reading bookmarks, deliberately separate from answered-question/repair counts. Search covers concepts, notes, retrieval answers and source locators. Practice can target a module, the shown filtered concepts, a single concept, an objective or a specific question. Post-answer theory links reinforce the same concepts; mock questions withhold them until grading.

Source distinctions are retained: embryology table/slide timing conventions are not merged into one falsely precise timeline; Guyton examples keep their assumptions and units. Anatomy reading includes the nasal lymph continuation on p. 1087, diaphragm p. 161, anatomical spread on p. 179, and surface pp. 238–240. Intercostal pp. 150–155 are labeled as an inspected book-only extension.

“Verified” means checked against the cited local sources and structural validation, not faculty-approved, psychometrically validated, an official past paper, or complete coverage of every possible examination question. No web question banks, past papers, AI-generated anatomical pictures, or video transcripts supplied factual content. Physiology teacher slides are still missing. The histology archive was inspected read-only and contains a video, not a standalone slide deck; that video's teacher emphasis remains unverified under the books/slides-only constraint. Chapter 43 physiology pathology/therapy is outside this bank. The final blueprint, weighting and date remain unconfirmed. Detailed omissions are recorded in `provenance/` and the visible source audit.

## Behavior

- Term 2 membership requires an explicit `exam-term2-*` tag. Legacy subject-based routing cannot pull these items into Term 1.
- Learn mode reveals the key, all option explanations, source citation and image exploration after an answer is submitted. Mock mode hides these until finish-and-grade.
- Before answering, source labels on dynamic diagrams are masked and a hollow marker identifies the target without covering it. After answering, hover, keyboard focus or tap an annotated anchor to see its name and description; a full-size button list provides a touch/keyboard alternative.
- Anchors identify verified points, not pixel-perfect segmentation of the whole organ. Source image pixels and attribution are unchanged. Enlarging an image does not create new detail.
- Mixed mocks balance subjects, then modules and concepts for practice, not as a claimed official blueprint. Learn mode prioritizes repair, then unseen items. One image/target variant is used per session; another variant can appear on a later attempt but is not mislabeled an unseen anatomical target.
- Stable question IDs preserve selected options, target variants and the exact scoped practice pool on resume. Existing device-local Term 1 progress and practical migration are preserved; new exams get independent progress records. Starting a new session warns before replacing an unfinished one.
- CVS, limbs and Biochemistry II are intentionally not populated with relabeled Term 1 material.

## Data and maintenance

Question files: `data/bank/questions/term2-respiratory-*.jsonl`.
Image catalog: `data/term2/anatomy-images.json`.
Image bytes: `public/study/term2/respiratory/`.
Provenance, image hashes and source audits: `data/term2/provenance/`.

Concept source: `data/term2/respiratory-concepts.json`.
Generated MCQ cross-reference: `data/term2/respiratory-question-index.json`.
Generated coverage report: `data/term2/respiratory-coverage.json`.
Catalog schema and referential audit: `schemas/respiratory-concepts.schema.json` and `src/lib/respiratory/audit.mjs`.

`npm run respiratory:generate` regenerates dynamic variants and the concept cross-reference. `npm run respiratory:concepts` validates the concept schema, source-basis labels, inventory and every objective/question link, then writes deterministic index/coverage files. `bank:validate` checks those generated files are current. The embedded-bank build runs both generators, so incomplete links or stale content cannot silently ship. New targets must have verified coordinates, source locators, descriptions and plausible same-image distractors. Keep IDs stable; increment revision for substantive changes. Do not add uncited material or infer missing exam dates.

Three existing items received revision 2 without changing keys or options: resp-anat-054 extends its page citation to 1086–1087/PDF1098–1099; resp-emb-003 and resp-emb-019 now explicitly attribute their molecular/timing accounts to the local Langman edition. All original question IDs remain. The new resp-emb-gap-001 draft's redundant distractor was corrected against Figure 14-3D before integration.

Run `npm run bank:validate`, `npm run lessons:validate`, `npx tsc --noEmit`, `npm test`, and `npm run deploy:validate`. Tests cover exam isolation, source contracts, deterministic dynamic keys, hierarchical balance, target deduplication, media routing, exact session reload/scoped pools, legacy progress migration, reading-bookmark corruption, cross-reference completeness and server-rendered study content. Source diagrams and micrographs were visually checked separately; no browser UI automation was requested.

The excerpts are from the user’s local library for this private study workflow. No public redistribution license or permission to republish complete books is asserted. Preserve owner-only hosting access.

The final independent review separated the central-tendon/pericardial relation from peripheral diaphragm attachments. `resp-anat-gap-072` now maps to the central relation; `resp-anat-gap-077` directly tests the xiphoid attachment alongside the existing vascular-supply question. The release therefore has one additional objective and one additional question beyond the frozen author-audit counts.
