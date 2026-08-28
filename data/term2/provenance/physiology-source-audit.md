# Respiratory physiology bank: source and coverage

Source audit: completed for all 56 items.

## Deliverable and meaning of verified

- `physiology.jsonl`: 56 original undergraduate single-best-answer items, IDs `resp-phys-001` through `resp-phys-056`; four options each and an explanation for the correct answer and every wrong option.
- Sole factual source: `/Users/rizzist/Documents/MED SCHOOL BOOKS/Guyton and Hall Textbook of Medical Physiology (2026).pdf`.
- Edition confirmed from physical PDF title/copyright pages 4-5: **15th edition, copyright 2026**, ISBN 978-0-443-11101-3. Contents on physical PDF page 14 confirms Chapters **38-42** for this scope.
- `verified` means the authored keys, explanations, and locators have been checked against this local book and the numerical reasoning has been recalculated. It does **not** mean faculty-approved, psychometrically validated, a TUMS past-paper question, or guaranteed exam coverage.
- No web sources, transcripts, past papers, or respiratory physiology slides were used. No app or site checkout files were changed. No clinical-management recommendations were used as questions.
- Required tags are present on every item: `exam-term2-respiratory`, `term-2`, `source-grounded`, `respiratory-physiology`, `book-only`. Schema version is `1.0.0`.

## Chapter and question coverage

| Local 15th-edition chapter | Printed pages / physical PDF pages | Items | Directly tested subtopics |
| --- | --- | --- | --- |
| 38. Pulmonary Ventilation | 501-511 / 492-502 | 001-014, 049-052 (18) | Quiet-breathing muscles; alveolar/pleural/transpulmonary pressures; static compliance; saline versus air-filled lungs; surfactant and type II cells; radius/surface-tension relationship; airway resistance work; FRC; limitations of spirometry; vital capacity; helium dilution; minute and alveolar ventilation; dead space and breathing pattern; cough; mucociliary clearance; sneeze; phonation versus articulation/resonance. |
| 39. Pulmonary Circulation, Pulmonary Edema, and Pleural Fluid | 513-520 / 503-510 | 015-022 (8) | Local hypoxic vasoconstriction; blood-flow zones; exercise capillary recruitment/distension; wedge pressure and left atrial pressure; hydrostatic versus permeability edema; chronic lymphatic adaptation; pleural effusion from impaired drainage. |
| 40. Principles of Gas Exchange; Diffusion of Oxygen and Carbon Dioxide Through Respiratory Membranes | 521-530 / 511-520 | 023-030, 056 (9) | Humidified inspired oxygen pressure at reduced barometric pressure; alveolar ventilation versus PCO2; diffusion area/thickness; solubility and relative CO2/O2 diffusion; CO diffusing-capacity method; V/Q = 0 and V/Q approaching infinity; upright regional V/Q; physiological dead-space calculation using mixed-expired CO2. |
| 41. Transport of Oxygen and Carbon Dioxide in Blood and Tissue Fluids | 531-540 / 521-530 | 031-040 (10) | Hemoglobin-bound O2 content; extraction/utilization coefficient; upper plateau of the O2-Hb curve; Bohr effect; temperature and BPG shifts; CO exposure with normal PO2 but reduced O2 content; bicarbonate and chloride shift; Haldane effect; respiratory exchange ratio. |
| 42. Regulation of Respiration | 541-550 / 531-540 | 041-048, 053-055 (11) | Pre-Botzinger rhythm generation; pneumotaxic control of the inspiratory ramp; Hering-Breuer inflation reflex; CO2/H+ central chemoreception; adaptation to hypercapnia; hypoxic peripheral drive and carotid/aortic afferents; anticipatory exercise ventilation; Cheyne-Stokes delayed feedback; obstructive versus central sleep apnea; ventilatory acclimatization to hypoxia. |

## Source and calculation audit

Each item's source records the full book title, edition, chapter title/number, printed page(s), and corresponding physical PDF page(s). The physical-to-printed offset changes at Chapter 39, so a single whole-book offset was not assumed. All cited footers were mechanically checked against the extracted local pages. Figure 38.4 is the only figure locator used, and its rendered page was visually inspected; the other items are supported by chapter text and do not require an image.

| Calculation items | Independently recalculated result |
| --- | --- |
| 003 transpulmonary pressure | -1 - (-7) = +6 cm H2O |
| 004 compliance | 400 / (7 - 5) = 200 mL/cm H2O |
| 007 constant-tension radius change | Halving radius doubles collapse pressure |
| 011 vital capacity | 3000 + 500 + 1000 = 4500 mL |
| 012 helium dilution | 3 x (10/6 - 1) = 2.0 L |
| 013 alveolar ventilation | 12 x (500 - 150) = 4.2 L/min |
| 014 changed breathing pattern | Both minute ventilations 6.0 L/min; alveolar ventilation 4.2 versus 2.4 L/min |
| 023 humidified inspired PO2 | 0.21 x (500 - 47) = 95.13 mm Hg |
| 024 ventilation-PCO2 relation | 40/2 = 20 mm Hg |
| 025 diffusion area/thickness | (1/2)/2 = 1/4 |
| 031 Hb-bound O2 content | 10 x 1.34 x 0.90 = 12.06 mL/dL |
| 032 utilization coefficient | (20 - 15)/20 = 25% |
| 040 respiratory exchange ratio | 200/250 = 0.80 |
| 056 physiological dead space | (40 - 28)/40 x 500 = 150 mL |

The numerical stems state necessary assumptions: equilibrium or steady state when needed; constant surface tension for the idealized radius problem; physiological dead space held fixed; negligible helium loss with gas-exchange correction; full humidification at 37 degrees C; fixed diffusion coefficient/pressure gradient; stated oxygen capacity with dissolved O2 ignored; and mixed-expired, not end-tidal, CO2. The pressure-zone item 016 also uses explicit local pressures.

The set avoids reproducing the inconsistent female inspiratory-capacity total in Table 38.1 and avoids calculating from the internally inconsistent rounded venous oxygen-content example on printed page 534. It instead uses explicit, mutually consistent values. The dead-space item names the equation directly as printed, without implying that a mixed-expired CO2 value is an end-tidal value or that arterial substitution is exact in every lung disease.

## Remaining limits and omissions

All requested broad respiratory physiology domains have at least one direct item, including the added airway/speech and sleep/periodic-breathing topics. This is not an exhaustive assessment of every paragraph in Chapters 38-42. There are no dedicated questions on:

- Chapter 38: detailed autonomic/local mediators of bronchiolar tone, quantitative particle deposition, nasal warming/filtration, or individual laryngeal muscles. Lung-volume equations are sampled, not separately tested for every capacity.
- Chapter 39: pulmonary-versus-bronchial circuit anatomy, lung blood-volume reservoir, memorization of every normal vascular pressure, exact capillary transit time, or a numerical Starling-force calculation.
- Chapter 40: enumeration of the respiratory membrane layers, single-breath nitrogen washout, or the quantitative physiological shunt equation.
- Chapter 41: the normal bronchial venous-admixture oxygen gradient, tissue PO2/PCO2 versus flow/metabolism curves, ADP control of cellular O2 use, detailed capillary oxygen-equilibration reserve during exercise, or separate substrate-specific exchange-ratio questions.
- Chapter 42: glomus-cell ion-channel signaling, lung J receptors, detailed irritant-receptor signaling, voluntary breath holding, and drug/brain-injury respiratory depression. The inspiratory ramp is assessed through pontine termination rather than a separate waveform item.

Outside this commissioned bank: respiratory histology, gross anatomy and embryology; Chapter 43 disease diagnosis/oxygen therapy and forced-spirometry interpretation; the separate aviation/high-altitude and diving chapters. Altitude is included only through partial pressure and the hypoxic/ventilatory-acclimatization mechanisms explicitly covered in Chapters 40-42. Full erythropoiesis and other blood physiology are outside this respiratory subset.

## Validation and integration handoff

`validation-report.json` records the final check. The bank passes the existing `mcq-question.schema.json` with Ajv 2020-12. Additional checks confirm 56 unique IDs and prompts, four unique options each, all three wrong-option explanations, valid page mappings, all required tags, and answer balance **A/B/C/D = 14/14/14/14**. Difficulty is 1 basic recall, 30 level-2, and 25 level-3 items. Exam-priority labels are editorial study priorities, not observed TUMS exam frequencies.

Only `physiology.jsonl` is the integration payload. `authored-items.json`, `assemble-and-check.cjs`, source text extracts, and the single rendered source-page check are working/audit materials, not additional question sets. The parent task handles integration and any later instructor-content reconciliation.
