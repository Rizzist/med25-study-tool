# Term 2 CVS independent validation report

## Outcome

**PASS.** The verified bundle contains 151 source-substantiated questions. No unsupported question was retained, no unresolved item remains, and the original application repository was not modified.

## Final counts

| Measure | Count |
|---|---:|
| Questions | 151 |
| Anatomy | 52 |
| Physiology | 51 |
| Histology | 21 |
| Embryology | 27 |
| Single-best-answer | 111 |
| Image single-best-answer | 12 |
| Dynamic 3D | 28 |
| Course modules | 21 |
| Course-scope modules | 11 |
| Book-extension modules | 10 |
| Unique staged image assets | 11 |
| Image-question references | 12 |
| 3D registry/manifest pairs | 28 |
| Unsupported/excluded questions | 0 |

## Validation results

- **Repository MCQ schema:** 151/151 records pass the repository Draft 2020-12 schema.
- **Answer-key uniqueness:** 151/151 records have one keyed option, unique option ids/text, and a rationale for every distractor.
- **Term2CourseCatalog:** exact standard shape; 21 modules map all 151 questions once.
- **Local-source substantiation:** 151/151 items resolve to a cited local course deck or textbook locator; 0 unsupported items retained.
- **Media integrity and visual QA:** 11/11 assets visually passed; 12 question references resolve; hashes and dimensions verified.
- **Live 3D registry:** 28/28 unique modelKey/structureId pairs exist, are quizable, are registered, and match the keyed manifest label.
- **Claim hygiene:** question records are source-based study practice and contain 0 past-paper/final-exam claims.

- **Medical correctness and SBA quality:** all 151 stems, keys, explanations, and distractors were independently reviewed. Keys are medically correct and unique; distractors are mutually exclusive and plausible at the stated level. The two stems whose displayed media did not substantiate the authored wording were corrected.
- **Status/flags:** 151/151 records are `verified`; 0 retain `independent-verification-required`. All records carry `source-locator-verified`; image and 3D records carry their corresponding completed-QA flags.
- **Course/book scope:** all Junqueira and Langman modules are `book-extension`; the mixed coronary module is also `book-extension` because Gray's 42e supplies its dominance/smallest-vein evidence. Other modules remain course scope.

## Corrections applied

| Correction class | Questions affected |
|---|---:|
| Exact question-source object changed | 53 |
| Stem changed | 3 |
| Option/key set changed | 2 |
| Explanation changed | 3 |
| Media reference/metadata changed | 3 |
| Catalog module scope changed | 10 |
| 3D source-map locator changed | 8 |
| Ledger entries | 56 |

Material corrections include: replacing the unsupported Heart 3 slide-3 image with slide 9; rewriting the Mediastinum slide-4 item to the superficial cardiac plexus and renaming its asset; correcting the Circulation 4 slide-20 baroreceptor error in learner-facing text; rewriting the vitamin B12/folate item to the exact course claim of maturation failure; sourcing coronary dominance and smallest cardiac veins to exact Gray's 42e pages; remapping phrenic, moderator-band, azygos, thoracic-duct, flow-velocity, compliance, edema, erythropoietin, tissue-factor, and action-potential locators; and correcting Junqueira/Langman PDF pages.

## Visual inspection of all 11 assets

| Asset | Pixels | Question(s) | Result |
|---|---:|---|---|
| heart1-slide6-pericardium-wall.png | 1200×900 | cvs-anat-002 | Upright and readable; epicardium/visceral serous pericardium relation is visible. |
| heart2-slide8-coronary-anterior.png | 1200×900 | cvs-anat-009, cvs-anat-016 | Upright and readable anterior coronary view; supports both chamber-surface and great-cardiac-vein questions. |
| heart3-slide9-coronary-ostia.png | 1200×900 | cvs-anat-014 | Replacement image; coronary ostia and aortic sinuses/cusps are explicitly visible and labeled. |
| mediastinum1-slide4-cardiac-plexus.png | 1200×900 | cvs-anat-021 | Renamed to cardiac-plexus provenance; superficial/deep plexus labels are visible in panels A/B. |
| circulation2-slide5-laplace.png | 1600×900 | cvs-phys-005 | Upright and readable Laplace-law diagram. |
| circulation3-slide9-isovolumic.png | 1600×900 | cvs-phys-011 | Upright and readable isovolumic-phase summary. |
| circulation4-slide20-reflexes.png | 1600×900 | cvs-phys-026 | Upright/readable; manifest and question explicitly correct the source slide's erroneous baroreceptor O2 label. |
| junqueira-pdf229-purkinje.png | 1235×1544 | cvs-histo-004 | Upright page crop; Purkinje cells labeled P are legible. |
| junqueira-pdf240-capillaries.png | 1235×1544 | cvs-histo-012 | Upright page crop; capillary-type comparison is legible. |
| langman-pdf205-atrial-septation.png | 1075×1521 | cvs-embryo-009 | Upright page crop; atrial-septation sequence is legible. |
| langman-pdf218-conotruncal-defects.png | 1075×1521 | cvs-embryo-018 | Scientific figure is upright and readable; an inverted page watermark does not affect the figure. |

All retained crops are correctly oriented for their scientific content, sufficiently legible for the keyed task, and fair: the answer is visible or inferable from the displayed source without relying on a hidden label. SHA-256 hashes are recorded in the media manifest.

## 3D verification

The repository registry imports `heartManifest`, `mediastinumManifest`, and `thoracicInnervationManifest`. Each of the 28 mapping pairs was checked against those live manifests; all structure ids exist, none is marked non-quizable, all pairs are unique, and every keyed option exactly matches the manifest label.

| Question | modelKey | structureId | Manifest label |
|---|---|---|---|
| cvs-3d-001 | heart | fibrous-pericardium | Fibrous pericardium |
| cvs-3d-002 | heart | pericardial-cavity | Pericardial cavity |
| cvs-3d-003 | heart | transverse-pericardial-sinus | Transverse pericardial sinus |
| cvs-3d-004 | heart | oblique-pericardial-sinus | Oblique pericardial sinus |
| cvs-3d-005 | heart | cardiac-apex | Apex of the heart |
| cvs-3d-006 | heart | base-of-heart | Base of the heart |
| cvs-3d-007 | heart | sternocostal-surface | Sternocostal (anterior) surface |
| cvs-3d-008 | heart | diaphragmatic-surface | Diaphragmatic (inferior) surface |
| cvs-3d-009 | heart | right-atrium | Right atrium |
| cvs-3d-010 | heart | crista-terminalis | Crista terminalis |
| cvs-3d-011 | heart | right-ventricle | Right ventricle |
| cvs-3d-012 | heart | septomarginal-trabecula | Septomarginal trabecula |
| cvs-3d-013 | heart | left-ventricle | Left ventricle |
| cvs-3d-014 | heart | aortic-valve | Aortic valve |
| cvs-3d-015 | heart | chordae-tendineae | Chordae tendineae |
| cvs-3d-016 | heart | anterior-interventricular-artery | Anterior interventricular artery |
| cvs-3d-017 | heart | posterior-interventricular-artery | Posterior interventricular artery |
| cvs-3d-018 | heart | coronary-sinus | Coronary sinus |
| cvs-3d-019 | heart | great-cardiac-vein | Great cardiac vein |
| cvs-3d-020 | heart | middle-cardiac-vein | Middle cardiac vein |
| cvs-3d-021 | mediastinum | arch-of-aorta | Arch of the aorta |
| cvs-3d-022 | mediastinum | brachiocephalic-trunk | Brachiocephalic trunk |
| cvs-3d-023 | mediastinum | left-common-carotid-artery | Left common carotid artery |
| cvs-3d-024 | mediastinum | left-subclavian-artery | Left subclavian artery |
| cvs-3d-025 | mediastinum | azygos-vein | Azygos vein |
| cvs-3d-026 | mediastinum | thoracic-duct | Thoracic duct |
| cvs-3d-027 | mediastinum | left-recurrent-laryngeal-nerve | Left recurrent laryngeal nerve |
| cvs-3d-028 | mediastinum | left-phrenic-nerve | Left phrenic nerve |

## Source and claim audit

The machine-readable source audit has one substantiation record per question. Course sources resolve to exact local deck filenames and slide locators; book extensions resolve to exact local PDF page locators. The question bank is labeled only as source-based study practice and contains no claim of past-paper or final-exam provenance.
