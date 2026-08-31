# Term 2 source-grounded release

Respiratory was implemented on 2026-08-28 and expanded on 2026-08-29. CVS, Upper & Lower Limbs, and Biochemistry II were independently authored and independently verified on 2026-08-31. Dates remain `null` / “Date TBA” except for the user-reported Physiology Practical date; no theory-exam date, weighting, or lecturer emphasis has been invented.

| Section | Verified questions | Concepts / objectives | Gap additions | Multimodal |
| --- | ---: | ---: | ---: | --- |
| CVS | 194 | 106 / 106 | 43 | 12 image SBAs + 28 interactive 3D |
| Respiratory | 408 | 116 / 297 | 184 | 56 dynamic image variants; existing respiratory 3D trainer |
| Upper & Lower Limbs | 173 | 79 / 173 | 17 | 32 interactive 3D |
| Biochemistry II | 196 | 50 / 94 | 38 | Text SBAs only |

The **Past exams** section for every Term 2 exam is deliberately empty. Only a genuine, traceable past paper may populate it. Source-derived book, slide, transcript, image, or 3D questions are study/practice material and must never be relabeled as a past paper, final bank, or official exam.

## CVS

The verified bank now has 71 anatomy, 65 physiology, 28 histology, and 30 embryology questions. The exhaustive theory map contains 106 concepts in 18 reading modules and 106 directly sampled objectives; 43 objectives received a new SBA after the baseline cross-reference. It retains 12 image SBAs using 11 visually inspected local slide images and 28 rotatable 3D targets. All 28 model/structure references resolve through the anatomy registry.

Of the 106 concepts, 104 have direct local course evidence and two are clearly marked book extensions. The independent verifier corrected 62 catalog concepts and all 43 additions, including three material rewrites. It reconciled swapped blood decks, ECG and recording inventory, physiology-session locators, embryology page offsets, the aortic-arch convention conflict, baroreceptor versus chemoreceptor physiology, immunoglobulin functions, V6 placement, and fetal shunts. The original source errors and every correction remain disclosed in provenance.

## Upper & Lower Limbs

The verified anatomy bank now has 173 questions across 14 reading modules, including 17 new gap-closing SBAs. Its 79 concepts contain 173 directly sampled objectives. It contains 141 text SBAs and 32 rotatable 3D targets; every model/structure pair resolves through the registry.

The local material supports 34 concepts; 45 remain clearly labeled Gray’s-only book extensions. No local teacher hand session or lower-limb teacher source was found, so those limits are explicit rather than assigned invented lecturer weighting. The independent verifier corrected 21 concepts, six primary mappings, and all 17 additions. It caught omitted Gray chapter-end ranges and clinical cases, errors involving the palmar aponeurosis, lumbricals and windlass mechanism, and inaccurate transcript locators.

## Biochemistry II

The verified bank now has 196 text SBAs across 12 reading modules and Lippincott Chapters 8–12 and 15. Its 50 concepts contain 94 directly sampled objectives; the cross-reference added 38 SBAs, with 22 objectives receiving their first direct sample. Thirty-four concepts have direct course evidence and 16 are clearly marked Lippincott extensions. All stems use realistic single-best-answer form, with balanced answer positions and explanations for every option.

The independent verifier corrected six substantive gap items, three locators, and 18 concept/source mappings. In particular, it honors the local Lippincott sixth-edition convention of 12 ATP per acetyl-CoA, removes unsupported mechanistic overreach, and records the missing original carbohydrate slide deck. No fair, clean, self-contained local course image was available for an unlabeled biochemistry visual question, so the bank intentionally contains no synthetic or decorative media.

## Respiratory

Respiratory contains 352 regular MCQs plus 56 deterministic dynamic-image variants, using 12 unique source images. The subject totals are 133 anatomy, 68 histology, 41 embryology, and 110 physiology regular/source-derived questions. The Study concepts section contains 19 reading modules and 116 detailed concepts with source locators, key distinctions, answered retrieval prompts, and direct question links.

All 297 stated learning objectives have at least one direct question sample and all 408 records have a concept home. These counts measure sampling, not mastery, official weighting, or certainty that every possible examination statement has been captured. Physiology teacher slides remain missing, and the respiratory physiology bank is explicitly Guyton-only.

## Behavior and provenance

- Term 2 membership requires an explicit `exam-term2-*` tag, preventing accidental import into Term 1 or another Term 2 exam.
- Source-based tests balance subject, chapter, and modality for practice; they do not claim to reproduce an official blueprint.
- Learn mode reveals answers, option teaching, citations, and anatomy exploration after answering. Closed-book test mode withholds feedback until grading.
- A 3D target is highlighted before answering. Structure names, picking, and free exploration unlock only after feedback. Selection state is scoped to the current question.
- Image anatomy labels are masked before feedback and are keyboard, hover, tap, and full-list accessible after feedback.
- Concept catalogs distinguish `course` from `book-extension` per concept. Extensions remain visible by default because confirmed exam scope can exceed the local teacher archive.
- Every verified record has four unique options, one key, a correct explanation, distractor explanations, explicit exam routing, and a page or slide locator.
- Answer positions are balanced within each new bank. Duplicate normalized prompts, broken media, invalid 3D targets, and cross-exam leakage fail validation.

“Verified” means checked against the cited local sources plus structural and independent review. It does not mean faculty-approved, psychometrically validated, an official past paper, or guaranteed complete.

Question banks live in `data/bank/questions/term2-*.jsonl`. Exhaustive theory maps live in `data/term2/*-concepts.json`, with generated question indexes and coverage reports beside them. Earlier course catalogs remain as provenance. Source audits, correction ledgers, and validation reports are preserved in `data/term2/provenance/`. CVS image bytes live in `public/study/term2/cvs/`; respiratory images live in `public/study/term2/respiratory/`.

Run `npm run bank:validate`, `npm run lessons:validate`, `npx tsc --noEmit`, `npm test`, and `npm run deploy:validate` before release. The user’s local books and slide excerpts are used only in this private study workflow; no right to redistribute the source library publicly is asserted. Preserve owner-only hosting access.
