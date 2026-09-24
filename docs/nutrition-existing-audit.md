# General Nutrition source audit - 2026-09-24

## Scope and disposition

Reviewed the existing F (English final), N (mixed-language scans), and D (bilingual compilation) collections against the original PDF pages, preserved OCR/source text, the local Nutrition & Diet Therapy 9th edition, the review source map, and named primary/institutional references. The O oral-health collection is a separate, unconfirmed-course supplement and is not expanded by this lane. The downloaded `nutrition-f-questions-and-answer-key.pdf` is a generated MED25 export, not independent recurrence evidence.

**Content-lane verdict: SHIP with explicit held-item exclusions.** This is a complete accounting of the 92 F/N/D source occurrences, not a claim that all 92 original stems are valid single-answer questions. App integration and other newly downloaded papers require their own review.

| Item class | Before | After this resolution layer |
| --- | ---: | ---: |
| General source occurrences | 92 | 92 |
| Scored source occurrences, before duplicate exclusion | 57 | 84 |
| Duplicate copies (same question, reordered options) | 2 ungraded | 2 transcribed and keyed, excluded as independent repeat evidence |
| Scorable distinct F/N/D entries after these two copies are collapsed | 57 | 82 |
| Held original claims | 33 plus 2 duplicate copies | 8 |
| Explicit study repairs in this new layer | 0 | 24, including one duplicate copy |

No original PDF is overwritten. `data/nutrition/legacy-resolutions.json` is an additive layer. Every changed stem/choice stores `originalQuestion`, sets `repair: true`, and explains the alteration. The source-selected letter is stored separately as `providedKey`; it is never described as an authenticated university key. Eight held items retain their complete original choices and source selection but `key: null`.

## Original-page checks and important corrections

- Rendered all three general source PDFs for page inspection. Visually checked all new F items; all uncertain N translations, ticks and duplicate option orders; every held/changed D item and its marked answer. Reviewed all existing 57 scored tuples and their qualifications against the preserved source text and textbook/topic map. No additional key change to those 57 is justified by this audit. This is an educational source audit, not independent authentication of a university answer key or exam sitting date.
- N18 is the same pectin question as N6, but its order is **lignin, lactose, hemicellulose, pectin**. Do not copy N6's letter C into N18: the local answer is **D**. The N18 scan is clipped; no reliable tick is claimed.
- N24 is the same amino-acid question as N3, with gluconeogenesis first rather than fourth. Local answers are **N3 D / N24 A**. Source ticks agree, but the study stem is clarified to carbon skeletons because nitrogen removal can also generate ammonia.
- N23 visibly selects **C (cardiovascular diseases)**, not A. The source is not a reliable key. The study repair explicitly asks folic acid/NTD prevention and preserves the broad original wording.
- N27 visibly selects **D (year-long occult stool blood loss)** in an EXCEPT stem. The scientifically defensible answer is **B (chronic infection)** for the usual anemia-of-inflammation versus absolute iron-deficiency contrast. Coexistence remains qualified.
- F21's screenshot chooses the ill-defined **C (25-1 hydroxylation)**. Renal activating **1-alpha hydroxylation is B**. The stem now specifies activation to avoid conflation with renal 24-hydroxylation.
- F11's B12 option is explicitly changed from 2 to 2.4 micrograms; F13 specifies adult men for 11 mg zinc; F16 specifies a ring closing onto the amino nitrogen, rather than pretending phenylalanine/tryptophan contain no rings.

## Complete new resolution ledger

| Source ID | Disposition | Key | Main reason / condition |
| --- | --- | --- | --- |
| F4 | Repair | B | Names FAO/WHO 3-9-unit convention; original ranges inconsistent |
| F11 | Repair | C | Adult B12 RDA 2.4 micrograms, not rounded 2 |
| F13 | Repair | C | Zinc 11 mg applies to adult men |
| F16 | Repair | C | Proline ring includes alpha-amino nitrogen |
| F19 | Repair | D | Ceruloplasmin carries copper; not a storage-depot claim |
| F21 | Repair + source-selection correction | B | Renal activating 1-alpha hydroxylation |
| N1 | Repair | A | Adult protein AMDR 10-35%, not unspecified 10-15% convention |
| N2 | Repair | A | Tests why albumin is not a standalone intake/muscle marker |
| N3 | Repair | D | Glucogenic carbon skeletons, not ammonia/nitrogen confusion |
| N4 | Repair | D | BMI plus WHR describes size and distribution, not universal superiority |
| N8 | Repair | A | Vitamin D inadequacy concern; avoids blanket restriction/supplements |
| N9 | Repair | B | Historical TLC saturated-fat framework named |
| N11 | Repair | D | Central-adiposity risk assessment, not automatic weight loss |
| N13 | Repair | C | FDA/EPA lower-mercury Best Choices 2-3 servings |
| N17 | Resolved original | D | Tyrosine in PKU; source misspelling in distractor preserved |
| N18 | Duplicate of N6 | D | Reordered pectin options; not another independent paper |
| N19 | Repair + source-selection correction | D | Individualized stable nondialysis CKD advice |
| N21 | Explicit cropped-stem reconstruction | A | Dialysis fluid monitoring; visible choices preserve context |
| N22 | Repair | D | Maternal expansion/hemodilution explicitly named |
| N23 | Repair + source-selection correction | A | Folic acid/NTD; source C retained separately |
| N24 | Reordered duplicate of N3 | A | Same carbon-skeleton study repair; no repeat inflation |
| N26 | Repair + source-selection correction | A | Direct heat measurement, not undefined 'most accurate' |
| N27 | Corrected source selection | B | Infection/inflammation rather than chronic blood loss |
| N28 | Repair | C | Qualified iron-food/tea advice, not all-person supplements or dairy ban |
| D14 | Repair | B | Named methotrexate/folate relationship, no universal ranking |
| D21 | Hold | None | ABCD1-related ALD not established as vitamin-A deficiency |
| D23 | Hold | None | No supplied comparative study uniquely supports ADHD nutrient pair |
| D24 | Hold | None | Universal cognitive-prevention supplement recommendation unsupported |
| D26 | Hold | None | Local infant feeding sequence not supplied; preparation matters |
| D27 | Hold | None | Both folate and B12 associations; causality/single answer unproven |
| D28 | Hold | None | Breastfeeding infection/medication exceptions under-specified |
| D29 | Hold | None | No verified universal four-fruit infant allergy ranking |
| D30 | Hold | None | No established universal B12 auditory-brainstem prevention benefit |
| D36 | Repair | B | Alpha-linolenic specified; oleic is omega-9 |
| D40 | Repair | C | 20% lower fat-AMDR boundary, not sharp deficiency threshold |

## Sources and limits

Local originals: `public/study/nutrition/past-papers/english-final.pdf` (24 pages), `nutrition-scans.pdf` (28 pages), `bilingual-compilation.pdf` (19 pages/40 source items). Textbook: Nutrition & Diet Therapy, DeBruyne/Pinna/Whitney, 9th ed.; page locators in the JSON are **PDF counters**, not printed folios. Existing source map/book hash is in `data/nutrition/sources.json`.

Primary/institutional checks include [FAO/WHO carbohydrate classification](https://www.fao.org/4/w8079e/w8079e07.htm), [NIH B12](https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/), [NIH zinc](https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/), [NIH vitamin D](https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/), [NIH folate](https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/), [FDA/EPA fish guidance](https://www.fda.gov/food/consumers/advice-about-eating-fish), [NIDDK CKD diet guidance](https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/healthy-eating-adults-chronic-kidney-disease), [ASPEN position paper repository](https://open.bu.edu/items/01636723-8f00-477e-9307-117d2f24c238), [CDC breastfeeding contraindications](https://www.cdc.gov/breastfeeding-special-circumstances/hcp/contraindications/index.html), and [MedlinePlus ALD](https://medlineplus.gov/genetics/condition/x-linked-adrenoleukodystrophy/).

Hearing claims were specifically checked against the original studies: [1999 B12/folate association](https://pubmed.ncbi.nlm.nih.gov/10075346/), [2010 adjusted associations](https://pubmed.ncbi.nlm.nih.gov/21109085/), [2007 supplementation/hearing study](https://pubmed.ncbi.nlm.nih.gov/18032219/), [2019 ABR study](https://pubmed.ncbi.nlm.nih.gov/32002975/), and [2021 ABR study](https://pubmed.ncbi.nlm.nih.gov/33496416/). These do not establish the broad source prevention claim. Study population, association versus causation, and conflicting outcomes must not be erased to manufacture a single answer.

## Integration requirements

- [x] Every F/N/D source occurrence represented by either the old 57 tuples or this 35-entry layer.
- [x] Repairs retain original stem/options and separate source selections.
- [x] Two duplicate copies carry correct local answer letters.
- [x] Held items have explanatory notes and no fabricated score key.
- [x] Builder/UI display repair provenance and retain held items in source/archive downloads.
- [x] Core recurrence counts source-question identity before repair, not shared edited answer text; repaired versions cannot be presented as verbatim repeats.
- [x] Only answerable checked originals or explicitly labeled study repairs form the default scored/core deck; oral supplement remains separate.
- [ ] Integrated tests, reviewer inspection and browser behavior checked by the main implementation lane.

Automated layer checks at authoring: JSON parses; all 35 IDs exist in the source manifest; every item has four options; each key is A-D or null; every repair has its original question; union with the old 57 leaves zero unrepresented F/N/D IDs.

## Independent integration review

The legacy-audit lane also independently reviewed the import helper, Core builder, shared Core selection/state namespace, Nutrition archive and final-exam integration. **Code/pipeline verdict: SHIP**, subject to regenerated-artifact tests and browser checks in the main lane. Two initial blockers were resolved: the source archive now labels edited study questions before revealing the answer and exposes the original transcript; qualified-item text no longer falsely says corrections follow the source's intended key. Regression coverage preserves N18's fourth-option pectin and N24's first-option gluconeogenesis while excluding both duplicate IDs from scored weight.

The first 17 manual Core merge groups were checked against their complete stems/options: they represent the same tested relationship (including inverse precursor/product questions), not mere shared topics. Repaired questions are excluded from repeat evidence and may appear only as labeled coverage additions. For example, a thermic-effect definition is not merged with a question asking its numerical fraction of total expenditure.

Separate peer review of the five incoming paper transcriptions found a clinically important defect in the proposed January 2025 Q45 repair: zinc deficiency can impair dark adaptation/night vision, so night blindness cannot be its EXCEPT choice. This was returned to the owner with [primary trial evidence](https://pubmed.ncbi.nlm.nih.gov/11382658/) and [National Academies discussion](https://www.ncbi.nlm.nih.gov/books/NBK222318/). The broad catch-up-growth nutrient-combination question (January Q40) was also returned for qualification because all listed nutrient groups matter. Both fixes were rechecked: Q45 now distinguishes vitamin-C scurvy; Q40 specifies a unique sequence of nutrient roles. Both explicitly preserve the original question and remain excluded from repeat evidence.

**Incoming-data peer verdict: SHIP with the documented exclusions.** All 196 new stems/options/rationales were reviewed independently for answer truth, unfair alternative choices, and repair provenance; high-risk claims were checked against primary/institutional evidence. This does not claim a second complete visual transcription of all new source pages: that full-page visual check belongs to their source-owner lanes. DDS Q17 (fetal versus combined maternal fat/muscle mass) and Q30 (ordinary fat oxidation conflated with fetal harm) remain ungraded with explanations. February Q33 accepts both nested numerical criteria; DDS Q24 and Q32 and SUMS Q6 accept defensible alternatives. January Q33 explicitly describes cataract associations, not proven supplement prevention. The shared Biochemistry Core regression suite was independently run with **7/7 passing** after the shared-helper/UI edits.
