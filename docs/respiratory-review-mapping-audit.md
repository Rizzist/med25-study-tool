# Respiratory review mapping audit

Status: **SHIP — final generated papers and guided manifest verified after parent integration.** Generated paper files and the guided manifest were intentionally not authored in this lane.

## Scope and result

- Audited all **579 distinct scored canonical questions** in the final generated files: 343 physiology, 170 anatomy, 44 histology and 22 embryology. These are the generated rows with `graded === true` and `id === canonicalQuestionId`; source 14 and source 22 aliases are not counted again.
- Retained 510 existing section assignments and supplied **69 explicit overrides** in `data/respiratory/review-section-overrides.json`. Every key is a scored canonical ID and every value is one of the 158 existing review-section IDs. All 69 final generated assignments match the override object.
- Added **110 exact block locators covering 354 distinct scored canonical IDs** in `data/guided-review/respiratory-past-paragraphs.json`. Each quote occurs within exactly one normalized PDF text block on its stated one-based page. No question has competing paragraph locators.
- The other **225** scored questions retain section-level navigation. They are not given a paragraph locator merely because a nearby paragraph contains a keyword.
- Final guided manifest contains **158 section headings and 363 paragraph-linked questions**: 354 past-paper questions and 9 existing practice questions. Every past-paper paragraph ID is still scored and canonical.
- The original 581-row sweep also inspected `respiratory-23-q059` and `respiratory-23-q063`; final answer integration made these ungraded (reversed source wording and ambiguity, respectively). Both now have `key: null`, neither had a paragraph locator, and the 354-question paragraph coverage is unchanged.
- Review PDF: 186 pages; SHA-256 `61a505ea17f25a35a707cb0e5d252c59d93dfaca3bc7b0fcc1a6ba2f26a5f8b7`. The PDF, import answers, source provenance and original evidence arrays were not changed.

## Method and boundaries

Read every scored prompt and accepted option beside its assigned section and review-page evidence. Compared the topic with the review's actual text blocks, including continuations before the next heading. Existing evidence often names a section's opening page rather than the page holding the exact answer; the paragraph file supplies precise locations for selected common concepts.

Inspected rendered review pages 70, 76 and 127 to verify the same-page boundaries: surfactant versus macrophages; histological breathing movement versus embryological bud induction; RER versus brainstem control. Page 70's dust-cell mapping was already correct and retained. Additional continuation traps on pages 25, 49, 100, 102, 108, 114, 116 and 125 were checked against the extracted blocks.

The 69 overrides include clear wrong-topic corrections and some finer routing to the direct answer-bearing section. A related prior section is not necessarily factually false. In particular, alveolar-duct lining questions are routed to distal architecture rather than the adjacent cell-type discussion; the answer needs that structural context, so no forced single-paragraph locator was attached.

This is a navigation audit, not a replacement for the separate source/answer audits. A section link is not a claim that its text independently proves every detail of an exam answer. Examples with only broader review context include `respiratory-09-q009` (pulmonary ACE), `respiratory-20-qfragment-8` (vascular cross-sectional area), `respiratory-23-q003` (diving depth/ambient pressure), and `respiratory-23-q056` (cyanosis in severe anemia); no exact-answer paragraph was invented for these.

## Explicit overrides

Question labels below omit the shared `respiratory-` prefix. Page ranges identify inspected answer-bearing review text, not source-exam pages.

| Canonical questions | Target section | Review PDF page(s) | Reason |
| --- | --- | --- | --- |
| 01-q032, 02-q033, 03-q027, 04-q024, 07-q003, 15-q033 | `resp-anat-nasal-drainage` | 9 | Drainage openings belong to the conchae/meatuses map, including the bulla and semilunar hiatus. |
| 10-q025 | `resp-anat-nasal-gateways` | 13 | The incisive canal and nasopalatine nerve are described directly. |
| 04-q026 | `resp-anat-nasal-vessels` | 14–15 | Nasal arterial supply, not laryngeal nerve supply. |
| 19-q014 | `resp-anat-pharyngeal-regions` | 17 | The piriform fossae are explicitly localized lateral to the laryngeal inlet. |
| 05-q027, 19-q020 | `resp-anat-laryngeal-skeleton` | 24–25 | Cartilage attachments and the hyoepiglottic connection precede the next section's p25 heading. |
| 15-q040 | `resp-anat-laryngeal-membranes` | 26–27 | The lower quadrangular margin forms the vestibular ligament. |
| 07-q005, 09-q028, 12-q028 | `resp-anat-pleural-recesses` | 49 | Exact rib-6 lung / rib-8 pleural midclavicular contours. |
| 08-q016 | `resp-hist-laryngeal-support` | 58 | Epiglottic elastic cartilage and epithelial transition, not true vocal-fold tissue. |
| 04-q038 | `resp-hist-tracheal-wall` | 60 | Tracheal respiratory mucosa and glands, not bronchiolar club cells. |
| 15-q027 | `resp-hist-club-cell-defense` | 63 | Direct club-cell secretion and defense section instead of a later summary. |
| 04-q034, 10-q038, 13-qhistology-2 | `resp-hist-distal-transitions` | 65–68 | Route the alveolar-duct lining questions to distal airway organization, with type-I lining as supporting context. |
| 08-q013, 10-q042 | `resp-emb-bud-induction` | 76–77 | Ventral foregut origin is in the embryology section beginning at the bottom of p76. |
| 13-qembryology-1, 15-q029 | `resp-emb-tissue-lineages` | 77–78 | Endodermal epithelium versus mesodermal support/muscle. |
| 04-q032 | `resp-emb-maturation-periods` | 86 | The table explicitly locates well-developed epithelial–endothelial contacts in the alveolar period. |
| 02-q017, 03-q018 | `resp-phys-mechanics` | 94 | The signed transpulmonary-pressure definition belongs to breathing mechanics. |
| 07-q017, 13-qphysiology-12 | `resp-phys-compliance-work` | 95–96 | Saline versus air and the three work components are explicitly distinguished. |
| 04-q021 | `resp-phys-surfactant` | 96–97 | Surfactant is the central tested mechanism; the prior lymphatic-protection assignment is too indirect. |
| 15-q008, 21-q040 | `resp-phys-lung-volumes` | 97–98 | Residual volume and directly measurable spirometric excursions precede the gas-dilution heading. |
| 01-q020, 02-q005, 03-q016, 04-q020 | `resp-phys-alveolar-ventilation` | 99–100 | The conducting-passage dead-space definition is before the airway-patency heading on p100. |
| 15-q001 | `resp-phys-airway-tone` | 101–102 | Vagal cholinergic bronchoconstriction precedes the airway-defense heading. |
| 04-q004 | `resp-phys-pulmonary-pressures` | 105 | Mean pulmonary arterial pressure is explicitly stated here. |
| 05-q006, 06-q003, 12-q006, 12-q021, 15-q009 | `resp-phys-flow-distribution` | 107–108 | West zones, gravity and exercise continue on p108 before the edema section begins. |
| 01-q017, 02-q010, 03-q005, 04-q019, 07-q014, 08-q036, 11-qphysiology-3, 13-qphysiology-20 | `resp-phys-gas-physics` | 111 | The approximate twentyfold CO2/O2 diffusion comparison is explicit here. |
| 06-q013, 23-q018 | `resp-phys-respiratory-membrane` | 113–114 | CO uptake for diffusing-capacity measurement precedes the V/Q section on p114. |
| 07-q021, 15-q013 | `resp-phys-regional-vq` | 115–116 | Apical/basal ventilation and perfusion gradients precede the physiological-shunt section. |
| 04-q017, 11-qphysiology-15, 13-qphysiology-15, 15-q014 | `resp-phys-gas-cascade` | 118 | The explicit arterial/venous/tissue CO2 reference values are here, not the following flow/metabolism section. |
| 03-q009 | `resp-phys-carbon-dioxide-transport` | 125–126 | CO2 carriage and carbamino compounds, not oxygen carriage/carbon-monoxide toxicity. |
| 23-q048 | `resp-phys-exchange-ratio` | 127 | The 200 mL/min CO2 / 250 mL/min O2 example is in the RER section. |
| 04-q012, 08-q028, 11-qphysiology-19, 12-q022, 13-qphysiology-8, 15-q012, 15-q017 | `resp-phys-brainstem-pattern` | 127–128 | Brainstem, DRG/VRG, ramp and pontine control, not respiratory exchange ratio above the p127 heading. |

## Paragraph QA and integration

The quote strings are literal substrings of whitespace-normalized extracted blocks, preserving the PDF's wording, signs and capitalization. Matching is page-specific and must return exactly one block. Source questions remain associated with canonical IDs; this file contains no source-14 or source-22 duplicate IDs and no ungraded item.

For the 110 locators, checked the block against its preceding section heading. After the overrides, all paragraph links fall within their assigned review section. This avoids silently pairing a correct page with the other section on that page.

Final integration checks completed:

1. All 69 override assignments are applied in the current generated canonical rows.
2. The new paragraph array is integrated alongside the existing practice locators: 354 past-paper plus 9 practice entries, 363 total.
3. All 579 scored canonical rows resolve to valid review sections; all 354 authored paragraph IDs resolve in the final guided manifest. There are no unknown, ungraded or duplicate authored paragraph IDs.
4. All 158 section headings are present. The heading matcher handles the p20 PDF `vascular-lymphatic` versus course `vascular–lymphatic` and p92 PDF `lung-immune` versus course `lung–immune` dash variants. Exact paragraph quote matching remains unchanged.

All checks are deterministic read-only PDF extraction except the three authored data/audit files. No source paper or review PDF was re-exported.
