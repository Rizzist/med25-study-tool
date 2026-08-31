# Term 2 source-grounded release

Respiratory was implemented on 2026-08-28 and expanded on 2026-08-29. CVS, Upper & Lower Limbs, and Biochemistry II were independently authored and independently verified on 2026-08-31. Dates remain `null` / “Date TBA” except for the user-reported Physiology Practical date; no theory-exam date, weighting, or lecturer emphasis has been invented.

| Section | Verified questions | Multimodal | Source boundary |
| --- | ---: | --- | --- |
| CVS | 151 | 12 image SBAs + 28 interactive 3D | 93 course-grounded; 58 explicit book extensions |
| Respiratory | 408 | 56 dynamic image variants; existing respiratory 3D trainer | Books plus local respiratory decks; physiology remains book-only |
| Upper & Lower Limbs | 156 | 32 interactive 3D | 71 course-grounded; 85 explicit Gray’s extensions |
| Biochemistry II | 158 | Text SBAs only | 86 course-grounded; 72 explicit Lippincott extensions |

The **Past exams** section for every Term 2 exam is deliberately empty. Only a genuine, traceable past paper may populate it. Source-derived book, slide, transcript, image, or 3D questions are study/practice material and must never be relabeled as a past paper, final bank, or official exam.

## CVS

The verified bank has 52 anatomy, 51 physiology, 21 histology, and 27 embryology questions across 21 modules. It contains 111 text SBAs, 12 image SBAs using 11 visually inspected local slide images, and 28 rotatable 3D targets. All 28 model/structure references resolve through the anatomy registry.

The verifier made 56 corrections. Notable corrections replaced an unsupported coronary image, rewrote a mediastinal slide question around the cardiac plexus, corrected source locators, and explicitly repaired a source typo: arterial baroreceptors sense stretch/pressure, whereas peripheral chemoreceptors respond to O2, CO2, and H+. The original source error remains disclosed in provenance.

## Upper & Lower Limbs

The verified anatomy bank has 156 questions across 14 modules: 80 upper-limb and 76 lower-limb items. It contains 124 text SBAs and 32 rotatable 3D targets; every model/structure pair resolves through the registry.

The local material supports the course-tagged upper-limb modules. No local teacher hand session or lower-limb teacher source was found, so the hand and lower-limb content remains clearly labeled as Gray’s-only book extension without invented lecturer weighting. The verifier corrected 13 substantive or sourcing issues, including the adductor canal and foot-arch question set.

## Biochemistry II

The verified bank has 158 text SBAs across 12 modules and Lippincott Chapters 8–12 and 15: 40/20/19/20/15/44 questions respectively. The local carbohydrate and dietary-lipid materials directly support 86 questions; 72 are visible Lippincott book extensions. All stems and options were rewritten into realistic single-best-answer form, with balanced answer positions and explanations for every option.

No fair, clean, self-contained local course image was available for an unlabeled biochemistry visual question, so the bank intentionally contains no synthetic or decorative media. The reconstructed local note/transcript boundary is disclosed in the course catalog and source audit.

## Respiratory

Respiratory contains 352 regular MCQs plus 56 deterministic dynamic-image variants, using 12 unique source images. The subject totals are 133 anatomy, 68 histology, 41 embryology, and 110 physiology regular/source-derived questions. The Study concepts section contains 19 reading modules and 116 detailed concepts with source locators, key distinctions, answered retrieval prompts, and direct question links.

All 297 stated learning objectives have at least one direct question sample and all 408 records have a concept home. These counts measure sampling, not mastery, official weighting, or certainty that every possible examination statement has been captured. Physiology teacher slides remain missing, and the respiratory physiology bank is explicitly Guyton-only.

## Behavior and provenance

- Term 2 membership requires an explicit `exam-term2-*` tag, preventing accidental import into Term 1 or another Term 2 exam.
- Source-based tests balance subject, chapter, and modality for practice; they do not claim to reproduce an official blueprint.
- Learn mode reveals answers, option teaching, citations, and anatomy exploration after answering. Closed-book test mode withholds feedback until grading.
- A 3D target is highlighted before answering. Structure names, picking, and free exploration unlock only after feedback. Selection state is scoped to the current question.
- Image anatomy labels are masked before feedback and are keyboard, hover, tap, and full-list accessible after feedback.
- Course catalogs distinguish `course` from `book-extension` at module level. Extensions remain visible by default because confirmed exam scope can exceed the local teacher archive.
- Every verified record has four unique options, one key, a correct explanation, distractor explanations, explicit exam routing, and a page or slide locator.
- Answer positions are balanced within each new bank. Duplicate normalized prompts, broken media, invalid 3D targets, and cross-exam leakage fail validation.

“Verified” means checked against the cited local sources plus structural and independent review. It does not mean faculty-approved, psychometrically validated, an official past paper, or guaranteed complete.

Question banks live in `data/bank/questions/term2-*.jsonl`. Course catalogs live in `data/term2/*-course.json`. Source audits, correction ledgers, and validation reports are preserved in `data/term2/provenance/`. CVS image bytes live in `public/study/term2/cvs/`; respiratory images live in `public/study/term2/respiratory/`.

Run `npm run bank:validate`, `npm run lessons:validate`, `npx tsc --noEmit`, `npm test`, and `npm run deploy:validate` before release. The user’s local books and slide excerpts are used only in this private study workflow; no right to redistribute the source library publicly is asserted. Preserve owner-only hosting access.
