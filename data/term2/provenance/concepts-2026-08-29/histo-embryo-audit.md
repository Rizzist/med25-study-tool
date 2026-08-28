# Respiratory histology and embryology: concept and MCQ gap audit

Audit date: 2026-08-29. Content artifacts only; the site checkout was read-only. No website tools, deployment, child agents, external question banks, web facts or transcripts were used.

## Result

- 10 coherent modules: 6 histology and 4 embryology.
- 42 standalone concepts: 25 histology and 17 embryology, with 101 testable objectives and 84 answered retrieval prompts.
- Existing bank: all 32 histology and 24 embryology questions mapped explicitly below; IDs and revisions unchanged.
- New bank: 36 histology and 17 embryology original single-best-answer questions, all source-audited and marked verified after review.
- All 101 objectives have at least one direct question sample; all 109 existing/new records have objective links. This measures sampling of stated objectives, not mastery of every note or guaranteed exam completeness.
- 81 source-inventory entries cover chapter headings, both histology comparison tables, the embryology maturation table, relevant clinical boxes, figures and all meaningful E1/E2 teaching slides. Every concept appears in the inventory.
- New answer positions: histology A/B/C/D = 9/9/9/9; embryology = 4/5/4/4. Positions and distractors were shuffled with their explanations, so there is no repeated four-item answer cycle.

## Deliverables

- concepts.json: final contract shape with modules, substantive concepts, objective links and complete sourceAudit.
- gap-questions.jsonl: 53 new records, existing MCQ schemaVersion1.0.0.
- corrections.json: no required existing answer-key corrections; two optional source-qualified stem clarifications, plus the repaired new-item distractor noted below.
- validation-report.json: successful final structural and linkage checks, counts and existing-bank SHA-256 values.
- validate.mjs: reproducible read-only schema-keyword/semantic checker for these artifacts.

## Local sources and what was actually inspected

1. Junqueira's Basic Histology: Text and Atlas,16th edition, Chapter17, printed349–369/PDF360–380. The full assigned chapter prose and complete relevant source pages were audited, using the prior verified extraction and page renders. Printed370 assessment questions were excluded as sources.
   Original PDF: /Users/rizzist/Documents/MED SCHOOL BOOKS/Junqueira's Basic Histology 16th Edition.pdf
2. Langman's Medical Embryology,15th edition, Chapter14, printed225–231/PDF237–243. The complete assigned chapter was audited; the rotated printed229 page was visually checked to recover material missing from OCR. Printed231 summary was used but its Problems to Solve were not a factual source.
   Original PDF: /Users/rizzist/Documents/MED SCHOOL BOOKS/embryology/Langman's Medical Embryology 15th Edition - OCR.pdf
3. E1,19slides: /Users/rizzist/Documents/MED SLIDES/TERM 2/02 Respiratory/Embryology/Embryology  of respiratory system E1.pptx
4. E2,15slides: /Users/rizzist/Documents/MED SLIDES/TERM 2/02 Respiratory/Embryology/Embryology  of respiratory system E2.pptx

The decks' image-only teaching material was inspected visually, not inferred from blank text extraction: especially E1 slides7–13 and E2 slides5–7 and12. Page/figure/slide identifiers refer to the local sources, not guessed edition offsets from websites.

Verified existing extraction paths:

- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/junqueira-chapter.txt
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/langman-chapter.txt
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/Embryology  of respiratory system E1.txt
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/Embryology  of respiratory system E2.txt
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/jq-360.png through jq-380.png (21 actual page renders)
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/lm-237.png through lm-243.png (7 actual page renders)
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/e1/slide-1.png through slide-19.png
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/e2/slide-1.png through slide-15.png
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/junqueira-chapter-locations.json
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/langman-chapter-locations.json
- /Users/rizzist/Documents/Codex/2026-08-26/look/work/term2-content/histo-embryo/source-inspection/images/manifest.json (prior extracted image provenance; no new images commissioned)

The eight existing histology image questions remain mapped. No new image extraction, alteration, redistribution or rights clearance was performed.

## Important source distinctions and limits

### Timing is source-specific, not a blended timeline

Langman15e Table14-1 says pseudoglandular5–16wk, canalicular16–26wk, terminal sac26wk–birth, alveolar36wk–childhood. E2slide5 depicts overlapping approximate periods, including saccular onset about24wk; slide6 labels sample morphologies at16,19,28weeks,birth and7years. These are preserved separately. No ambiguous generic boundary-age question was added. New precise table questions name Langman15e Table14-1 in their stems.

The book's statement that mature alveoli are absent before birth sits beside a table starting the alveolar period at36wk. Notes distinguish period onset from fully mature architecture instead of forcing an absolute before/after-birth rule. E2's end-of-sixth-month surfactant wording is not silently converted into a separate exact24-week claim. The local sources do not consistently define an obstetric-versus-postfertilization conversion; none is imposed. The seventh-month developmental gas-exchange description is not a clinical viability guarantee.

### Histological look-alikes and disputed shorthand

- Alveolar capillary endothelium is continuous and nonfenestrated. Thin typeI cytoplasm, fused basal laminae and thin endothelium form the tissue diffusion route.
- TypeI coverage of about95% refers to surface area, not cell count.
- TypeII cells are attached alveolar epithelial cells with lamellar bodies; macrophages are phagocytic cells with ingested material, not the continuous lining.
- Larger bronchioles may remain pseudostratified; absence of cartilage and glands plus regional context is more reliable than an absolute simple-cuboidal rule.
- Terminal bronchioles can be surrounded by alveoli without openings in their own walls. Respiratory bronchioles retain cuboidal stretches; ducts are bordered by alveolar openings; sacs are clusters.
- The main nasal text locates conchae on lateral walls; the chapter summary's medial-wall wording is not propagated.
- Langman's/E2's schematic lymph-capillary label is not used to override Junqueira's explicit lack of lymphatic vessels in terminal regions beyond alveolar ducts.
- Junqueira's CO2/H2CO3 paragraph is not adopted as a complete transport account; the physiology source must establish that topic.
- The RA/TBX4 account and the lung–macrophage–labor proposal remain attributed to the actual local sources. The latter is presented as a proposed contribution, not a proven sole trigger.
- Clinical boxes are used as source-present mechanism examples. Historical mortality proportions and clinical treatment regimens are not presented as current guidance. The COVID box is limited to the edition's typeII-injury example.

### Teacher-source and examination limits

The parent inspected Histology/Respiratory ENG.rar read-only using an archive listing: it contains exactly one file, Respiratory ENG.mp4 (123740425bytes, dated2020-04-21), and no PPTX/PDF deck. It was not extracted or copied. Histology teacher emphasis in that video remains unverified because video/transcript facts were outside this commissioned source basis. Histology concepts are consequently book-only, not falsely labeled slide-corroborated.

Final TUMS exam date, final blueprint and weighting remain unavailable. Detailed first/second/third-arch ear/tongue/hyoid material shown as context in E1 was not expanded into a separate head-and-neck block. There are no remaining in-scope **stated objectives** without a direct MCQ; these source and scope limits are not hidden by that result.

## Question-authoring and correction QA

Every new item has four distinct options, exactly one best answer, an answer explanation, three individually keyed distractor explanations, a concrete objective and precise local-source citation. Vignettes are original source-grounded applications, not copied from book assessments or historical exams. No calculations or unit-conversion questions were added. Anatomical laterality, developmental timing and cell/compartment terminology were checked against the assigned sources.

The initial new resp-emb-gap-001 draft inadvertently had two semantically equivalent no-fistula atresia distractors. Parent review caught this. Figure14-3D on printed226/PDF238 was inspected again, and a distinct proximal-fistula/blind-distal-segment pattern replaced the redundant choice. Source figure citation and explanation were updated before verification.

No required factual/key correction was identified in the 56 existing records. corrections.json proposes only optional source anchors for resp-emb-003 (RA/TBX4 account) and resp-emb-019 (exact book timing). These are not applied to the repository.

Some existing questions have one limited cross-link where they genuinely test the same mechanism in two related concepts. A fact appearing only as a distractor is not counted as a separate objective. Several initially broad objectives were tightened to the actual correct-answer reasoning rather than claiming that a single item tests an entire chapter sequence.

## Explicit mapping of every existing question

| Existing ID | Concept home / genuine cross-link | Objective actually sampled |
|---|---|---|
| resp-hist-001 | resp-hist-functional-map | resp-hist-functional-map-o1: Locate the conducting-respiratory boundary using the wall itself. |
| resp-hist-002 | resp-hist-nasal-conditioning | resp-hist-nasal-conditioning-o2: Relate mucosal vessels and glands to conditioning inspired air. |
| resp-hist-003 | resp-hist-olfactory-mucosa | resp-hist-olfactory-mucosa-o3: Distinguish mucosal regeneration from traumatic axonal disruption. |
| resp-hist-004 | resp-hist-respiratory-cell-types | resp-hist-respiratory-cell-types-o2: Distinguish chemosensory and neuroendocrine airway cells. |
| resp-hist-005 | resp-hist-respiratory-cell-types; resp-hist-cancer-lineages | resp-hist-respiratory-cell-types-o2: Distinguish chemosensory and neuroendocrine airway cells.<br>resp-hist-cancer-lineages-o1: Recognize the normal neuroendocrine counterpart of a bronchial tumor. |
| resp-hist-006 | resp-hist-respiratory-cell-types | resp-hist-respiratory-cell-types-o3: Explain loss of clearance after ciliary injury and squamous metaplasia. |
| resp-hist-007 | resp-hist-laryngeal-support | resp-hist-laryngeal-support-o1: Identify the epiglottic supporting tissue. |
| resp-hist-008 | resp-hist-vocal-folds | resp-hist-vocal-folds-o1: Distinguish true from vestibular folds by histology and position. |
| resp-hist-009 | resp-hist-tracheal-wall | resp-hist-tracheal-wall-o1: Explain the mechanical role of trachealis during cough and swallowing. |
| resp-hist-010 | resp-hist-bronchus-bronchiole | resp-hist-bronchus-bronchiole-o1: Differentiate bronchi and bronchioles using cartilage and glands. |
| resp-hist-011 | resp-hist-club-cell-defense | resp-hist-club-cell-defense-o1: Recognize club-cell morphology and detoxifying organelles. |
| resp-hist-012 | resp-hist-airway-obstruction-injury | resp-hist-airway-obstruction-injury-o1: Identify the structural basis of bronchiolar bronchospasm. |
| resp-hist-013 | resp-hist-alveolar-septa; resp-hist-respiratory-movement | resp-hist-alveolar-septa-o1: Identify the septal element producing passive recoil.<br>resp-hist-respiratory-movement-o2: Explain passive recoil during quiet expiration. |
| resp-hist-014 | resp-hist-alveolar-septa | resp-hist-alveolar-septa-o2: Explain the normal route of collateral alveolar ventilation. |
| resp-hist-015 | resp-hist-blood-air-barrier | resp-hist-blood-air-barrier-o1: Reconstruct the principal tissue layers of the blood-air barrier. |
| resp-hist-016 | resp-hist-blood-air-barrier | resp-hist-blood-air-barrier-o2: Explain continuous nonfenestrated alveolar capillary ultrastructure. |
| resp-hist-017 | resp-hist-type-one-cells | resp-hist-type-one-cells-o1: Interpret the type I surface-coverage figure correctly. |
| resp-hist-018 | resp-hist-distal-transitions | resp-hist-distal-transitions-o1: Recognize an alveolar duct and its smooth-muscle rims. |
| resp-hist-019 | resp-hist-surfactant-film | resp-hist-surfactant-film-o1: Distinguish the biophysical and immune surfactant protein pairs. |
| resp-hist-020 | resp-hist-surfactant-film | resp-hist-surfactant-film-o1: Distinguish the biophysical and immune surfactant protein pairs. |
| resp-hist-021 | resp-hist-alveolar-injury-repair | resp-hist-alveolar-injury-repair-o1: Identify the epithelial reserve for repair. |
| resp-hist-022 | resp-hist-alveolar-macrophages | resp-hist-alveolar-macrophages-o1: Interpret hemosiderin-laden macrophages in pulmonary congestion. |
| resp-hist-023 | resp-hist-lung-blood-vessels | resp-hist-lung-blood-vessels-o1: Identify the airway-associated oxygen-poor arterial supply. |
| resp-hist-024 | resp-hist-pleural-membranes | resp-hist-pleural-membranes-o1: Recognize the lung-surface membrane and its mesothelial lining. |
| resp-hist-025 | resp-hist-respiratory-cell-types | resp-hist-respiratory-cell-types-o1: Classify respiratory epithelium from its cell arrangement. |
| resp-hist-026 | resp-hist-olfactory-mucosa | resp-hist-olfactory-mucosa-o1: Recognize the olfactory neuronal zone and nonmotile receptor specialization. |
| resp-hist-027 | resp-hist-vocal-folds | resp-hist-vocal-folds-o1: Distinguish true from vestibular folds by histology and position. |
| resp-hist-028 | resp-hist-tracheal-wall | resp-hist-tracheal-wall-o2: Identify glandular contribution to the tracheal surface. |
| resp-hist-029 | resp-hist-bronchus-bronchiole | resp-hist-bronchus-bronchiole-o1: Differentiate bronchi and bronchioles using cartilage and glands. |
| resp-hist-030 | resp-hist-bronchus-bronchiole | resp-hist-bronchus-bronchiole-o1: Differentiate bronchi and bronchioles using cartilage and glands. |
| resp-hist-031 | resp-hist-club-cell-defense | resp-hist-club-cell-defense-o1: Recognize club-cell morphology and detoxifying organelles. |
| resp-hist-032 | resp-hist-type-two-cells | resp-hist-type-two-cells-o1: Identify type II pneumocytes by lamellar bodies. |
| resp-emb-001 | resp-emb-bud-induction | resp-emb-bud-induction-o1: Locate the early respiratory diverticulum. |
| resp-emb-002 | resp-emb-tissue-lineages | resp-emb-tissue-lineages-o1: Separate endodermal epithelial and mesodermal support-tissue derivatives. |
| resp-emb-003 | resp-emb-bud-induction | resp-emb-bud-induction-o2: Reconstruct the source-specific induction signal between adjacent tissues. |
| resp-emb-004 | resp-emb-foregut-septation | resp-emb-foregut-septation-o1: Explain the orientation and result of foregut septation. |
| resp-emb-005 | resp-emb-foregut-septation; resp-emb-tef-patterns | resp-emb-foregut-septation-o2: Connect faulty partitioning to atresia with distal fistula.<br>resp-emb-tef-patterns-o1: Connect the common atresia-distal-fistula anatomy to faulty foregut partitioning. |
| resp-emb-006 | resp-emb-tef-consequences | resp-emb-tef-consequences-o1: Explain excess amniotic fluid from impaired esophageal passage. |
| resp-emb-007 | resp-emb-tef-consequences | resp-emb-tef-consequences-o2: Recognize VACTERL anomaly categories. |
| resp-emb-008 | resp-emb-laryngeal-arches | resp-emb-laryngeal-arches-o1: Identify the laryngeal arch pair. |
| resp-emb-009 | resp-emb-laryngeal-arches | resp-emb-laryngeal-arches-o2: Match sixth-arch derivatives to recurrent laryngeal innervation. |
| resp-emb-010 | resp-emb-laryngeal-remodeling | resp-emb-laryngeal-remodeling-o1: Explain how the laryngeal ventricles form. |
| resp-emb-011 | resp-emb-branching-pattern | resp-emb-branching-pattern-o1: Relate lobar and segmental branching to territory. |
| resp-emb-012 | resp-emb-branching-pattern | resp-emb-branching-pattern-o1: Relate lobar and segmental branching to territory. |
| resp-emb-013 | resp-emb-branching-pattern | resp-emb-branching-pattern-o2: Explain mesodermal FGF participation in branching. |
| resp-emb-014 | resp-emb-tissue-lineages | resp-emb-tissue-lineages-o2: Distinguish the origins of visceral and parietal pleura. |
| resp-emb-015 | resp-emb-pleural-cavities | resp-emb-pleural-cavities-o1: Distinguish the two cavity-separating fold systems. |
| resp-emb-016 | resp-emb-maturation-periods | resp-emb-maturation-periods-o1: Recognize the structural limit of the pseudoglandular period. |
| resp-emb-017 | resp-emb-maturation-periods | resp-emb-maturation-periods-o2: Identify canalicular differentiation from age and morphology. |
| resp-emb-018 | resp-emb-saccular-barrier | resp-emb-saccular-barrier-o1: Connect epithelial thinning and capillary apposition to exchange capability. |
| resp-emb-019 | resp-emb-surfactant-development | resp-emb-surfactant-development-o1: Identify fetal surfactant-producing cells. |
| resp-emb-020 | resp-emb-neonatal-rds | resp-emb-neonatal-rds-o1: Explain the surface-tension mechanism of neonatal RDS. |
| resp-emb-021 | resp-emb-fetal-fluid-birth | resp-emb-fetal-fluid-birth-o3: Explain predominant fluid clearance and surfactant retention at birth. |
| resp-emb-022 | resp-emb-fetal-fluid-birth | resp-emb-fetal-fluid-birth-o2: Explain fetal breathing movements. |
| resp-emb-023 | resp-emb-postnatal-growth | resp-emb-postnatal-growth-o1: Distinguish alveolar multiplication from enlargement alone. |
| resp-emb-024 | resp-emb-congenital-variants | resp-emb-congenital-variants-o1: Connect bronchial cysts with dilation and impaired drainage. |

## New gap questions and direct source locators

| New ID | Local source locator | Gap sampled | Linked objective |
|---|---|---|---|
| resp-hist-gap-001 | 16th ed.; p. 349, 356 | Trace the normal epithelial transition from the nasal vestibule into the respiratory cavity. | resp-hist-nasal-conditioning-o1 |
| resp-hist-gap-002 | 16th ed.; p. 349 | Identify the cellular source of IgA in nasal secretions. | resp-hist-nasal-conditioning-o3 |
| resp-hist-gap-003 | 16th ed.; p. 350-351 | Use basement-membrane contact to distinguish pseudostratified from stratified epithelium. | resp-hist-respiratory-cell-types-o1 |
| resp-hist-gap-004 | 16th ed.; p. 350, 352 | Distinguish nonmotile olfactory receptor cilia from respiratory motile cilia. | resp-hist-olfactory-mucosa-o1 |
| resp-hist-gap-005 | 16th ed.; p. 351-352 | Explain how Bowman glands support repeated olfactory sampling. | resp-hist-olfactory-mucosa-o2 |
| resp-hist-gap-006 | 16th ed.; p. 350, 352 | Relate cribriform-plate trauma to disruption of olfactory axons. | resp-hist-olfactory-mucosa-o3 |
| resp-hist-gap-007 | 16th ed.; p. 351 | Explain sinus mucus retention when ciliary action is defective. | resp-hist-sinuses-pharynx-o1 |
| resp-hist-gap-008 | 16th ed.; p. 351-352 | Match pharyngeal regions to respiratory or protective squamous epithelium. | resp-hist-sinuses-pharynx-o2 |
| resp-hist-gap-009 | 16th ed.; p. 352-353 | Recognize normal variability in epiglottic epithelial transitions. | resp-hist-laryngeal-support-o2 |
| resp-hist-gap-010 | 16th ed.; p. 354 | Explain the histological basis of hoarseness in laryngitis. | resp-hist-vocal-folds-o3 |
| resp-hist-gap-011 | 16th ed.; p. 353-354 | Relate vocalis and the vocal ligament to tension-dependent phonation. | resp-hist-vocal-folds-o2 |
| resp-hist-gap-012 | 16th ed.; p. 354 | Explain the swallowing function of the posterior tracheal wall. | resp-hist-tracheal-wall-o1 |
| resp-hist-gap-013 | 16th ed.; p. 355 | Explain the anatomical organization supporting segmental lung resection. | resp-hist-branching-units-o1 |
| resp-hist-gap-014 | 16th ed.; p. 357 | Recognize normal bronchial MALT and its branch-point distribution. | resp-hist-bronchus-bronchiole-o3 |
| resp-hist-gap-015 | 16th ed.; p. 357, 359 | Avoid misclassifying a larger bronchiole from epithelial height alone. | resp-hist-bronchus-bronchiole-o2 |
| resp-hist-gap-016 | 16th ed.; p. 349, 360; 17-10 | Separate club-cell support of IgA transfer from plasma-cell antibody production. | resp-hist-club-cell-defense-o2 |
| resp-hist-gap-017 | 16th ed.; p. 357 | Differentiate fibrotic small-airway obliteration from smooth-muscle bronchospasm. | resp-hist-airway-obstruction-injury-o2 |
| resp-hist-gap-018 | 16th ed.; p. 358 | Explain gas-volume loss after complete airway obstruction. | resp-hist-airway-obstruction-injury-o3 |
| resp-hist-gap-019 | 16th ed.; p. 358-362 | Recognize an alveolar duct from the distribution of alveolar openings. | resp-hist-functional-map-o2; resp-hist-distal-transitions-o1 |
| resp-hist-gap-020 | 16th ed.; p. 363 | Relate alveolar tight junctions to restriction of fluid leakage. | resp-hist-type-one-cells-o2 |
| resp-hist-gap-021 | 16th ed.; p. 363, 365-366 | Distinguish a type II pneumocyte from an alveolar macrophage using position and epithelial attachments. | resp-hist-type-two-cells-o2 |
| resp-hist-gap-022 | 16th ed.; p. 364 | Explain cellular participation in surfactant turnover. | resp-hist-surfactant-film-o2 |
| resp-hist-gap-023 | 16th ed.; p. 364 | Connect surfactant surface-tension reduction with reduced inspiratory effort. | resp-hist-surfactant-film-o3 |
| resp-hist-gap-024 | 16th ed.; p. 365 | Trace clearance of an alveolar macrophage into the conducting-airway escalator. | resp-hist-alveolar-macrophages-o2 |
| resp-hist-gap-025 | 16th ed.; p. 360 | Identify the epithelial and endothelial targets in diffuse alveolar damage. | resp-hist-alveolar-injury-repair-o2 |
| resp-hist-gap-026 | 16th ed.; p. 358, 367 | Differentiate permanent emphysematous tissue loss from potentially reversible obstructive collapse. | resp-hist-alveolar-injury-repair-o3 |
| resp-hist-gap-027 | 16th ed.; p. 367-368 | Explain the distal connection between bronchial and pulmonary arterial circulations. | resp-hist-lung-blood-vessels-o2 |
| resp-hist-gap-028 | 16th ed.; p. 368 | Locate lung lymphatic networks and recognize the distal limit in the source. | resp-hist-lymphatics-nerves-o1 |
| resp-hist-gap-029 | 16th ed.; p. 368 | Distinguish pneumothorax from pleural effusion by the material and compartment involved. | resp-hist-pleural-membranes-o2 |
| resp-hist-gap-030 | 16th ed.; p. 368 | Explain the mechanical role of normal pleural serous fluid. | resp-hist-pleural-membranes-o3 |
| resp-hist-gap-031 | 16th ed.; p. 369 | Describe the relative ductal and alveolar dimensional changes during inspiration. | resp-hist-respiratory-movement-o1 |
| resp-hist-gap-032 | 16th ed.; p. 369 | Compare the chapter's bronchial and peripheral carcinoma associations. | resp-hist-cancer-lineages-o2 |
| resp-hist-gap-033 | 16th ed.; p. 355-356 | Distinguish a bronchiole-centered pulmonary lobule from a lobe or segment. | resp-hist-branching-units-o2 |
| resp-hist-gap-034 | 16th ed.; p. 359, 361-362 | Distinguish an alveolar sac from one alveolus and the proximal conducting airway. | resp-hist-distal-transitions-o2 |
| resp-hist-gap-035 | 16th ed.; p. 366-367; 17-16, 17-17 | Trace surfactant processing, storage and apical release in type II cells. | resp-hist-type-two-cells-o3 |
| resp-hist-gap-036 | 16th ed.; p. 357, 368 | Relate autonomic innervation to bronchiolar smooth-muscle contraction. | resp-hist-lymphatics-nerves-o2 |
| resp-emb-gap-001 | 15th ed.; p. 226-227; 14-3C, 14-3D; Embryology of respiratory system E1 slides 7-8 | Recognize H-type fistula as an abnormal communication without esophageal atresia. | resp-emb-tef-patterns-o2 |
| resp-emb-gap-002 | 15th ed.; p. 226-227; Embryology of respiratory system E1 slides 10 | Interpret feeding-associated symptoms through abnormal foregut partitioning. | resp-emb-tef-consequences-o3 |
| resp-emb-gap-003 | 15th ed.; p. 227; Embryology of respiratory system E1 slides 12 | Apply the fourth-arch origin and superior-laryngeal innervation of cricothyroid. | resp-emb-laryngeal-arches-o3 |
| resp-emb-gap-004 | 15th ed.; p. 228 | Recognize that prenatal establishment of the bronchial tree is followed by further postnatal branching. | resp-emb-branching-pattern-o3; resp-emb-postnatal-growth-o2 |
| resp-emb-gap-005 | 15th ed.; p. 227-228; Embryology of respiratory system E1 slides 15-17 | Explain posterior continuity around the initial septum transversum. | resp-emb-pleural-cavities-o2 |
| resp-emb-gap-006 | 15th ed.; p. 230; Table 14-1 | Identify terminal-sac maturation using a named source's range and morphological feature. | resp-emb-maturation-periods-o3 |
| resp-emb-gap-007 | 15th ed.; p. 230; Table 14-1 | Recognize the source-defined alveolar period as extending from late gestation into childhood. | resp-emb-maturation-periods-o3 |
| resp-emb-gap-008 | 15th ed.; p. 230; Embryology of respiratory system E2 slides 8 | Describe normal fetal lung-fluid composition and its glandular and epithelial contributions. | resp-emb-fetal-fluid-birth-o1 |
| resp-emb-gap-009 | 15th ed.; p. 230; Embryology of respiratory system E2 slides 8-9 | Distinguish first surfactant production from its later increase in quantity. | resp-emb-surfactant-development-o2 |
| resp-emb-gap-010 | 15th ed.; p. 231; Embryology of respiratory system E2 slides 10 | Explain the developmental rationale for glucocorticoids in the source's neonatal RDS discussion. | resp-emb-neonatal-rds-o2 |
| resp-emb-gap-011 | 15th ed.; p. 230-231; Embryology of respiratory system E2 slides 8, 10 | Distinguish normal fetal lung fluid from the alveolar contents described in neonatal RDS. | resp-emb-neonatal-rds-o3 |
| resp-emb-gap-012 | 15th ed.; p. 231; Embryology of respiratory system E2 slides 11 | Distinguish independent ectopic lung budding from main-tree branching and bronchial cyst formation. | resp-emb-congenital-variants-o2 |
| resp-emb-gap-013 | 15th ed.; p. 231; Embryology of respiratory system E2 slides 11 | Recognize procedural consequences of supernumerary bronchial branching. | resp-emb-congenital-variants-o3 |
| resp-emb-gap-014 | 15th ed.; p. 230; Embryology of respiratory system E2 slides 12 | Reconstruct the source's proposed lung–macrophage–uterine signaling pathway without treating it as proven sole causation. | resp-emb-labor-signal-hypothesis-o1 |
| resp-emb-gap-015 | 15th ed.; p. 227 | Distinguish mesenchymal laryngeal shaping from epithelial lumen remodeling. | resp-emb-laryngeal-remodeling-o2 |
| resp-emb-gap-016 | 15th ed.; p. 229-230; 14-8, 14-9; Embryology of respiratory system E2 slides 7 | Separate functional blood-air-barrier maturation from branching alone. | resp-emb-saccular-barrier-o2 |
| resp-emb-gap-017 | 15th ed.; p. 230; Embryology of respiratory system E2 slides 9, 12-13 | Distinguish surfactant's alveolar mechanical function from the proposed lung–immune labor signal. | resp-emb-labor-signal-hypothesis-o2 |

## Complete objective sampling ledger

| Objective ID | Objective | Direct question samples |
|---|---|---|
| resp-hist-functional-map-o1 | Locate the conducting-respiratory boundary using the wall itself. | resp-hist-001 |
| resp-hist-functional-map-o2 | Identify a distal airway from the distribution of alveolar openings in its wall. | resp-hist-gap-019 |
| resp-hist-nasal-conditioning-o1 | Explain the nasal epithelial transition from skin to respiratory mucosa. | resp-hist-gap-001 |
| resp-hist-nasal-conditioning-o2 | Relate mucosal vessels and glands to conditioning inspired air. | resp-hist-002 |
| resp-hist-nasal-conditioning-o3 | Identify the local cellular source of mucosal IgA. | resp-hist-gap-002 |
| resp-hist-respiratory-cell-types-o1 | Classify respiratory epithelium from its cell arrangement. | resp-hist-025, resp-hist-gap-003 |
| resp-hist-respiratory-cell-types-o2 | Distinguish chemosensory and neuroendocrine airway cells. | resp-hist-004, resp-hist-005 |
| resp-hist-respiratory-cell-types-o3 | Explain loss of clearance after ciliary injury and squamous metaplasia. | resp-hist-006 |
| resp-hist-olfactory-mucosa-o1 | Recognize the olfactory neuronal zone and nonmotile receptor specialization. | resp-hist-026, resp-hist-gap-004 |
| resp-hist-olfactory-mucosa-o2 | Explain Bowman-gland fluid renewal. | resp-hist-gap-005 |
| resp-hist-olfactory-mucosa-o3 | Distinguish mucosal regeneration from traumatic axonal disruption. | resp-hist-003, resp-hist-gap-006 |
| resp-hist-sinuses-pharynx-o1 | Explain impaired sinus drainage in defective ciliary activity. | resp-hist-gap-007 |
| resp-hist-sinuses-pharynx-o2 | Predict pharyngeal epithelial type from region and exposure. | resp-hist-gap-008 |
| resp-hist-laryngeal-support-o1 | Identify the epiglottic supporting tissue. | resp-hist-007 |
| resp-hist-laryngeal-support-o2 | Interpret normal variation in epiglottic epithelial transitions. | resp-hist-gap-009 |
| resp-hist-vocal-folds-o1 | Distinguish true from vestibular folds by histology and position. | resp-hist-008, resp-hist-027 |
| resp-hist-vocal-folds-o2 | Connect vocalis and ligament tension to phonation. | resp-hist-gap-011 |
| resp-hist-vocal-folds-o3 | Explain hoarseness from lamina-propria edema. | resp-hist-gap-010 |
| resp-hist-tracheal-wall-o1 | Explain the mechanical role of trachealis during cough and swallowing. | resp-hist-009, resp-hist-gap-012 |
| resp-hist-tracheal-wall-o2 | Identify glandular contribution to the tracheal surface. | resp-hist-028 |
| resp-hist-branching-units-o1 | Relate segmental organization to selective resection. | resp-hist-gap-013 |
| resp-hist-branching-units-o2 | Recognize a bronchiole-centered pulmonary lobule and distinguish it from larger territories. | resp-hist-gap-033 |
| resp-hist-bronchus-bronchiole-o1 | Differentiate bronchi and bronchioles using cartilage and glands. | resp-hist-010, resp-hist-029, resp-hist-030 |
| resp-hist-bronchus-bronchiole-o2 | Recognize permitted epithelial variation in a larger bronchiole. | resp-hist-gap-015 |
| resp-hist-bronchus-bronchiole-o3 | Recognize bronchial MALT at branching points. | resp-hist-gap-014 |
| resp-hist-club-cell-defense-o1 | Recognize club-cell morphology and detoxifying organelles. | resp-hist-011, resp-hist-031 |
| resp-hist-club-cell-defense-o2 | Explain club-cell support of mucosal IgA transport. | resp-hist-gap-016 |
| resp-hist-airway-obstruction-injury-o1 | Identify the structural basis of bronchiolar bronchospasm. | resp-hist-012 |
| resp-hist-airway-obstruction-injury-o2 | Differentiate fibrotic obliteration from acute muscle constriction. | resp-hist-gap-017 |
| resp-hist-airway-obstruction-injury-o3 | Explain absorption atelectasis after obstruction. | resp-hist-gap-018 |
| resp-hist-distal-transitions-o1 | Recognize an alveolar duct and its smooth-muscle rims. | resp-hist-018, resp-hist-gap-019 |
| resp-hist-distal-transitions-o2 | Distinguish a duct, sac and individual alveolus in section. | resp-hist-gap-034 |
| resp-hist-alveolar-septa-o1 | Identify the septal element producing passive recoil. | resp-hist-013 |
| resp-hist-alveolar-septa-o2 | Explain the normal route of collateral alveolar ventilation. | resp-hist-014 |
| resp-hist-blood-air-barrier-o1 | Reconstruct the principal tissue layers of the blood-air barrier. | resp-hist-015 |
| resp-hist-blood-air-barrier-o2 | Explain continuous nonfenestrated alveolar capillary ultrastructure. | resp-hist-016 |
| resp-hist-type-one-cells-o1 | Interpret the type I surface-coverage figure correctly. | resp-hist-017 |
| resp-hist-type-one-cells-o2 | Relate epithelial tight junctions to limiting alveolar fluid leakage. | resp-hist-gap-020 |
| resp-hist-type-two-cells-o1 | Identify type II pneumocytes by lamellar bodies. | resp-hist-032 |
| resp-hist-type-two-cells-o2 | Separate attached type II epithelium from free alveolar phagocytes. | resp-hist-gap-021 |
| resp-hist-type-two-cells-o3 | Describe surfactant packaging and release. | resp-hist-gap-035 |
| resp-hist-surfactant-film-o1 | Distinguish the biophysical and immune surfactant protein pairs. | resp-hist-019, resp-hist-020 |
| resp-hist-surfactant-film-o2 | Explain continuous cellular turnover of surfactant. | resp-hist-gap-022 |
| resp-hist-surfactant-film-o3 | Connect reduced surface tension to easier inflation. | resp-hist-gap-023 |
| resp-hist-alveolar-macrophages-o1 | Interpret hemosiderin-laden macrophages in pulmonary congestion. | resp-hist-022 |
| resp-hist-alveolar-macrophages-o2 | Trace alveolar particulate clearance into the mucociliary route. | resp-hist-gap-024 |
| resp-hist-alveolar-injury-repair-o1 | Identify the epithelial reserve for repair. | resp-hist-021 |
| resp-hist-alveolar-injury-repair-o2 | Recognize the epithelial and endothelial targets of diffuse alveolar damage. | resp-hist-gap-025 |
| resp-hist-alveolar-injury-repair-o3 | Distinguish permanent emphysematous wall loss from reversible collapse. | resp-hist-gap-026 |
| resp-hist-cancer-lineages-o1 | Recognize the normal neuroendocrine counterpart of a bronchial tumor. | resp-hist-005 |
| resp-hist-cancer-lineages-o2 | Compare central bronchial and peripheral epithelial cancer associations. | resp-hist-gap-032 |
| resp-hist-lung-blood-vessels-o1 | Identify the airway-associated oxygen-poor arterial supply. | resp-hist-023 |
| resp-hist-lung-blood-vessels-o2 | Explain nutritive bronchial flow and its distal anastomosis. | resp-hist-gap-027 |
| resp-hist-lymphatics-nerves-o1 | Locate pulmonary lymphatics and recognize their distal limit in this source. | resp-hist-gap-028 |
| resp-hist-lymphatics-nerves-o2 | Relate autonomic control to airway smooth muscle. | resp-hist-gap-036 |
| resp-hist-pleural-membranes-o1 | Recognize the lung-surface membrane and its mesothelial lining. | resp-hist-024 |
| resp-hist-pleural-membranes-o2 | Distinguish pleural air from pleural fluid accumulation. | resp-hist-gap-029 |
| resp-hist-pleural-membranes-o3 | Explain serous-film lubrication. | resp-hist-gap-030 |
| resp-hist-respiratory-movement-o1 | Relate inspiration to airway and alveolar-duct expansion. | resp-hist-gap-031 |
| resp-hist-respiratory-movement-o2 | Explain passive recoil during quiet expiration. | resp-hist-013 |
| resp-emb-bud-induction-o1 | Locate the early respiratory diverticulum. | resp-emb-001 |
| resp-emb-bud-induction-o2 | Reconstruct the source-specific induction signal between adjacent tissues. | resp-emb-003 |
| resp-emb-tissue-lineages-o1 | Separate endodermal epithelial and mesodermal support-tissue derivatives. | resp-emb-002 |
| resp-emb-tissue-lineages-o2 | Distinguish the origins of visceral and parietal pleura. | resp-emb-014 |
| resp-emb-foregut-septation-o1 | Explain the orientation and result of foregut septation. | resp-emb-004 |
| resp-emb-foregut-septation-o2 | Connect faulty partitioning to atresia with distal fistula. | resp-emb-005 |
| resp-emb-tef-patterns-o1 | Connect the common atresia-distal-fistula anatomy to faulty foregut partitioning. | resp-emb-005 |
| resp-emb-tef-patterns-o2 | Recognize a fistula with preserved esophageal continuity. | resp-emb-gap-001 |
| resp-emb-tef-consequences-o1 | Explain excess amniotic fluid from impaired esophageal passage. | resp-emb-006 |
| resp-emb-tef-consequences-o2 | Recognize VACTERL anomaly categories. | resp-emb-007 |
| resp-emb-tef-consequences-o3 | Explain the TEF-associated feeding presentation through faulty foregut partitioning. | resp-emb-gap-002 |
| resp-emb-laryngeal-arches-o1 | Identify the laryngeal arch pair. | resp-emb-008 |
| resp-emb-laryngeal-arches-o2 | Match sixth-arch derivatives to recurrent laryngeal innervation. | resp-emb-009 |
| resp-emb-laryngeal-arches-o3 | Apply the fourth-arch cricothyroid exception. | resp-emb-gap-003 |
| resp-emb-laryngeal-remodeling-o1 | Explain how the laryngeal ventricles form. | resp-emb-010 |
| resp-emb-laryngeal-remodeling-o2 | Distinguish mesenchymal shaping from epithelial lumen remodeling. | resp-emb-gap-015 |
| resp-emb-branching-pattern-o1 | Relate lobar and segmental branching to territory. | resp-emb-011, resp-emb-012 |
| resp-emb-branching-pattern-o2 | Explain mesodermal FGF participation in branching. | resp-emb-013 |
| resp-emb-branching-pattern-o3 | Recognize continued branching after the prenatal tree is established. | resp-emb-gap-004 |
| resp-emb-pleural-cavities-o1 | Distinguish the two cavity-separating fold systems. | resp-emb-015 |
| resp-emb-pleural-cavities-o2 | Explain why lung buds can enter the posterior canals despite the ventral partition. | resp-emb-gap-005 |
| resp-emb-maturation-periods-o1 | Recognize the structural limit of the pseudoglandular period. | resp-emb-016 |
| resp-emb-maturation-periods-o2 | Identify canalicular differentiation from age and morphology. | resp-emb-017 |
| resp-emb-maturation-periods-o3 | Distinguish the terminal-sac and alveolar periods in the specified table. | resp-emb-gap-006, resp-emb-gap-007 |
| resp-emb-saccular-barrier-o1 | Connect epithelial thinning and capillary apposition to exchange capability. | resp-emb-018 |
| resp-emb-saccular-barrier-o2 | Separate functional barrier maturation from branching alone. | resp-emb-gap-016 |
| resp-emb-surfactant-development-o1 | Identify fetal surfactant-producing cells. | resp-emb-019 |
| resp-emb-surfactant-development-o2 | Distinguish initial production from the late-gestation increase. | resp-emb-gap-009 |
| resp-emb-fetal-fluid-birth-o1 | Describe normal fetal lung-fluid composition and sources. | resp-emb-gap-008 |
| resp-emb-fetal-fluid-birth-o2 | Explain fetal breathing movements. | resp-emb-022 |
| resp-emb-fetal-fluid-birth-o3 | Explain predominant fluid clearance and surfactant retention at birth. | resp-emb-021 |
| resp-emb-neonatal-rds-o1 | Explain the surface-tension mechanism of neonatal RDS. | resp-emb-020 |
| resp-emb-neonatal-rds-o2 | Identify the rationale for promoting surfactant production. | resp-emb-gap-010 |
| resp-emb-neonatal-rds-o3 | Distinguish RDS alveolar contents from normal fetal fluid. | resp-emb-gap-011 |
| resp-emb-postnatal-growth-o1 | Distinguish alveolar multiplication from enlargement alone. | resp-emb-023 |
| resp-emb-postnatal-growth-o2 | Recognize continuing airway development after prenatal branching. | resp-emb-gap-004 |
| resp-emb-congenital-variants-o1 | Connect bronchial cysts with dilation and impaired drainage. | resp-emb-024 |
| resp-emb-congenital-variants-o2 | Distinguish independent ectopic budding from branching within the main tree. | resp-emb-gap-012 |
| resp-emb-congenital-variants-o3 | Recognize procedural implications of supernumerary lobules. | resp-emb-gap-013 |
| resp-emb-labor-signal-hypothesis-o1 | Reconstruct the source's proposed lung–macrophage–uterine pathway with appropriate uncertainty. | resp-emb-gap-014 |
| resp-emb-labor-signal-hypothesis-o2 | Distinguish the proposed labor signal from alveolar surface-tension reduction. | resp-emb-gap-017 |

## Final validation

The final validator read the actual repository schema and both existing subject files without editing them. It checked relevant schema constraints for existing/new records, exact distractor keys, four distinct options, valid correct letters, required tags, source locators, unique IDs, valid modules/source scopes, source-inventory inclusion, all objective links and all question links.

Result: PASS;0errors;10modules;42concepts;101objectives;81sourceAuditrows;56existing+53new=109mappedquestions; all new statuses verified.

Existing read-only bank fingerprints:

- Histology: 28027e79bf6315682dfcfd62979eaa12be8ca00f50d6244334b25927f6f3d808
- Embryology: 856d652c7f3911ef32b9d31d3a82453f510cdb3c5d1572c053b99beb42e4bd90

Run the local checker with the bundled Node runtime and this folder's validate.mjs. The complete machine-readable heading/table/clinical-box/slide inventory is in concepts.json → sourceAudit.
