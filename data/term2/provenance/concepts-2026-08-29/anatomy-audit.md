# Respiratory anatomy concepts and question audit

Completed 2026-08-29. Research/content artifacts only; no site, source-book, source-deck, original-bank, image or deployment edits.

## Deliverables and sampling

`concepts.json` contains 4 modules, 33 substantive concepts, 243 study points, 66 retrieval prompts with model answers, 94 explicit objectives and 202 source-inventory entries. `gap-questions.jsonl` adds 76 original single-best-answer questions, IDs `resp-anat-gap-001` through `resp-anat-gap-076`.

All 56 existing regular questions and all 56 existing dynamic records are linked to exactly one primary objective. Both variants of a dynamic target remain identification samples of the same target: 56 variants = 28 distinct image/target pairs, not 56 different anatomy facts. With the additions, there are 188 mapped records: 132 regular MCQs and 56 dynamic variants, representing 160 distinct regular-question/visual-target samples.

Every one of the 94 objectives has at least one direct question sample. This is **sampling**, not proof that every clause or study note has been tested, that the student has mastered it, or that the actual examination is completely covered. Image identification is not counted as testing a muscle's function, a nerve's territory or a vessel's physiology unless the stem asks that fact; the current dynamic stems only ask identification.

## Reading ranges and scope

The local book is *Gray's Anatomy for Students*, **3rd edition**, clean PDF. For the inspected Arabic-numbered pages, physical PDF page = printed page + 12. No edition substitution was made.

| Material | Printed pages | Physical PDF pages | Scope note |
|---|---:|---:|---|
| Pharynx | 1040-1052 | 1052-1064 | Regional anatomy and neurovascular/lymphatic details; adjacent general cervical-node oncology continuation excluded. |
| Larynx | 1052-1069 | 1064-1081 | Cartilage, membranes, joints, cavity, muscles, function and supply. Clinical boxes used for anatomy only. |
| Nasal cavities/sinuses | 1069-1087 | 1081-1099 | Includes posterior nasal lymph prose continuing onto p1087; the oral-cavity section beginning there is excluded. |
| Intercostal respiratory framework | 150-155 | 162-167 | **Book-only extension**: layers, VAN plane, representative actions/attachments, Table3.2 and flail-segment mechanics. Full thoracic-wall arterial network and neighboring nonrespiratory boxes excluded. |
| Diaphragm | 161-162 | 173-174 | Book details supplement the explicit slide phrenic-nerve diagram; not all openings/supply details are slide-confirmed. |
| Breathing movements, pleura, lungs, bronchi, vessels, nerves, lymph | 162-178 | 174-190 | Core respiratory regional material. Dedicated pump/bucket-handle teaching was not found in the decks. |
| Lung-cancer clinical box | 179 | 191 | Only anatomical nodal spread and neighboring-structure relations; not staging, prognosis or current treatment. |
| Surface anatomy / listening locations | 238-240 | 250-252 | Additional inspected book pages corroborate the slide surface maps; approximate anatomical contours, not a clinical protocol. |

Compared with the earlier 162-178 / 1040-1086 reading map, the new guide should explicitly show p161, p179, p1087 and surface pp238-240, plus the separately labeled book-only pp150-155 framework. These additions do not establish teacher emphasis. The final exam blueprint, weighting and date are unavailable.

## Eleven-deck audit

All eleven local PPTX decks were audited using native-text extraction, their previously verified full-slide renders/OCR, the source images and scoped book text. New or uncertain relationships were checked against complete rendered pages/slides rather than OCR alone. The inventory accounts for **all 179 slides**, including title/reference/end pages and a directly checked blank slide.

| Deck | Slides accounted for | Substantive material mapped |
|---|---:|---|
| Nasal Bones 1 | 14/14 | External nose, cavity relationships, speculum view, regions, coronal sinuses, functions. |
| Nasal Bones 2 | 17/17 | Sinus/orbital/skull-base relations, imaging orientation, drainage complex, development illustration, bony lateral wall. |
| Nasal Bones 3 | 20/20 | Wall/choanal skeleton, gateways, arterial supply and venous connections. Slide5 is blank; the hand-drawn slide3 was inspected without inventing fine label translations. |
| Nasal Bones 4 | 9/9 | V1/V2 and nasopalatine routes, autonomic ganglia/petrosal paths, regional lymph drainage. |
| LARYNX 1 | 19/19 | Pharyngeal relations, cartilage/facets/processes, epiglottic ligaments and extrinsic framework. |
| LARYNX 2 | 16/16 | Intrinsic/extrinsic membranes, free margins, cartilage and inlet relationships. |
| LARYNX 3 | 14/14 | Chambers, ventricles/saccules, intrinsic muscles, pull directions and extrinsic movement. |
| LARYNX 4 | 18/18 | Normal configurations, paralysis context, arteries/veins/lymphatics, sensory/motor nerve routes and airway landmarks. |
| Trachea and lung 1 | 19/19 | Tracheal extent/relations, bronchial hierarchy, pleural cupola and surface contours. Cardiac-plexus detail excluded. |
| trachea and lungs 2 | 17/17 | Lobes/fissures, medial relations, roots, segments, recesses and an explicitly labeled azygos variant. Unsubstantiated smoking-comparison claims excluded. |
| trachea and lung 3 | 16/16 | Segments, circulation, pulmonary autonomics/lymph, phrenic nerves, surface anatomy and cross-sectional roots. |

The machine-readable source inventory has **180 mapped**, **21 outside-scope** and **1 source-missing** entries. It names all substantive headings and relevant tables/clinical boxes in the commissioned book ranges, with explicit exclusions for adjacent material. Every concept appears in a mapped inventory row. Source-inventory entries are not counts of independent facts or independent sources.

## Existing-question audit and correction proposal

The current 56 regular records were checked against the scoped local sources for answer validity, laterality, terminology and what the stem actually tests. No answer-key correction was required. The dynamic records were mapped using their actual `imageId`, `targetRegionId`, variant and identification-only stem; their established source images/anchors were not rewritten.

One citation precision enhancement is proposed in `proposed-corrections.json`:

- **resp-anat-054**: replace `source.page` with `1086-1087 (printed); PDF pages 1098-1099`. P1086 contains the lymph figure, while p1087 contains the explicit posterior-route text continuation. Keep the ID, answer, options, prompt and explanation; no answer correction is required. This proposal has **not** been applied to the bank. Revision handling belongs to the root/site owner.

Specific safeguards retained:

- The right-bronchus dynamic target remains generic; its crop does not justify forcing “main” versus “lobar.”
- Existing resp-anat-056 and new notes say lymph **above** the vocal folds, avoiding the loose slide caption that groups the cords themselves with the upper region.
- Standard segment names and left fusion are kept as the source convention, not a universal exact left-segment count.
- Posterior lung/pleural levels are identified as T10/T12 in the scoped text, not silently converted into anterior rib numbers.
- The differing transversus-thoracis insertion rib descriptions in Table3.2 versus prose are not turned into an exact-number MCQ.
- Source wording around pharyngeal sensory supply is interpreted against the labeled nerve figure; no OCR “artery” typo is propagated as a nerve pathway.

## New questions and remaining limits

The 76 additions sample meaningful gaps: choanal boundaries, mucosal regions/clearance, bulla/infundibulum, frontal and skull-base relations, gateways, arterial origins and venous connections, pharyngeal fascia/passages, tonsillar vessels/lymph, laryngeal cavity/tension/function, recurrent laterality, regional venous/lymph routes, named segments, pulmonary vascular/lymph/autonomic topology, pleural surfaces/recesses/clinical mechanics, intercostal mechanics and diaphragm openings/supply.

Each addition has four options, one best answer, a correct-answer explanation, three individual distractor explanations, a direct objective link and a precise local book or slide locator. Correct positions are balanced A=19, B=19, C=19, D=19 and deterministically shuffled rather than cycling predictably through the letters.

Remaining limits are source/scope limits, not hidden empty objectives:

- No official final exam blueprint or teacher weighting was supplied.
- No audio, transcripts, internet or past-question banks were factual sources.
- Detailed pleural-fluid stomatal resorption, a complete thoracentesis/drain-placement procedure, current airway-procedure guidance and cancer management were not established by this source commission.
- Small named ethmoidal-cell variants, exhaustive distal bronchial-generation labels and every incidental skull/neck label are not converted into examination targets.
- The sinus-growth illustration supports developmental pneumatization, not universal ages of radiological visibility. The azygos illustration supports a variant relationship, not a frequency estimate.
- No new media were needed. The existing four source images and their 28 targets remain unchanged.

## Validation

Passed: exact bank schema for all76 new records; unique IDs; four unique option labels; correct option present; all distractors explained; required tags; numeric ranges; source locators; one primary mapping for each of188 records; no unknown question/objective/concept references; all94 objectives sampled; every concept represented in sourceAudit; 5-10 key points and 1-3 retrieval prompts per concept; actual book+slide sources for every mixed-scope concept; correct printed/PDF offsets; all179 slide numbers accounted for; 28 distinct dynamic image/target pairs. `qa-stats.json` contains the final counts.

All authored files and new source-render intermediates are confined to this anatomy work folder. Existing app files, questions, revisions, IDs, source decks/books and finalized prior anatomy artifacts were left unchanged.
