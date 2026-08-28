# Respiratory physiology source and coverage audit

Completed 29 August 2026. Book-only educational content; not a faculty-approved exam blueprint or clinical management guide.

## Deliverables and scope

`concepts.json` contains five chapter modules, 41 standalone concepts, 101 learning objectives, and 165 source-inventory entries. `gap-questions.jsonl` adds 54 original single-best-answer questions to the 56 existing respiratory physiology questions. `question-mapping.json` gives each of these 110 questions exactly one primary objective home. `existing-question-corrections.json` records review of all 56 existing questions and proposes no changes.

The existing questions directly sampled 53 of the selected objectives. The new questions directly sample the other 48 and add complementary testing within some previously sampled objectives. No selected in-scope objective remains without a direct question. This measures sampling, not mastery of every detail in every key point; one question is not a sufficient reliability or mastery test.

| Chapter | Core content | Concepts | New questions |
| --- | --- | ---: | ---: |
| 38 | Mechanics; pressures; compliance and work; surfactant; volumes; helium dilution and nitrogen washout; dead space and effective ventilation; airway patency and resistance; neural and humoral airway tone; conditioning, clearance, protective reflexes, and voice | 10 | 12 |
| 39 | Pulmonary versus bronchial circulation; pressures and reservoir function; regional flow zones and hypoxic flow redistribution; exercise recruitment; Starling forces, edema, lymphatic protection, pleural fluid | 6 | 7 |
| 40 | Partial pressures and gas solubility; humidification and alveolar gas balance; alveolar gas renewal; respiratory membrane and diffusion capacity; V/Q extremes and regional mismatch; shunt and physiological dead-space calculations | 7 | 9 |
| 41 | Lung-to-tissue gas gradients; tissue flow/metabolism; oxygen content, delivery, utilization, and hemoglobin buffering; dissociation shifts; dissolved oxygen and CO; carbon dioxide chemistry and Haldane effect; respiratory exchange ratio | 9 | 13 |
| 42 | Respiratory networks and inspiratory ramp; central and peripheral chemical control; glomus-cell signaling; integrated responses and acclimatization within this chapter; stretch, irritant, and J-receptor reflexes; exercise; periodic breathing; sleep apnea; voluntary and depressed central drive | 9 | 13 |

## Source identity and locators

The sole factual source is the local **Guyton and Hall Textbook of Medical Physiology, 15th edition (2026)**, ISBN 978-0-443-11101-3. The title/copyright pages and contents were checked directly. Physical PDF page numbers are one-based and differ from printed page numbers; the offset changes after Chapter 38.

| Chapter and exact title | Printed pages | Physical PDF pages |
| --- | --- | --- |
| 38: Pulmonary Ventilation | 501–511 | 492–502 |
| 39: Pulmonary Circulation, Pulmonary Edema, and Pleural Fluid | 513–520 | 503–510 |
| 40: Principles of Gas Exchange; Diffusion of Oxygen and Carbon Dioxide Through Respiratory Membranes | 521–530 | 511–520 |
| 41: Transport of Oxygen and Carbon Dioxide in Blood and Tissue Fluids | 531–540 | 521–530 |
| 42: Regulation of Respiration | 541–550 | 531–540 |

Source text was read directly from the prior local page extraction in `work/term2-content/physiology/source-pages`; it is not a secondary factual source. Every delivered locator was checked against the extracted printed footer and the chapter boundary. Layout-sensitive material was visually inspected: the compliance/saline figure previously, and in this audit the nitrogen-washout area calculation (printed p. 507), capillary-force table and edema callout (p. 518), shunt/dead-space equations (p. 529), and integrated chemical-response curves (p. 546).

The inventory accounts for substantive headings and subheadings, the three numbered tables (38.1, 38.2, 40.1), the unnumbered fluid-force table, all 56 figures (38.1–38.9, 39.1–39.9, 40.1–40.11, 41.1–41.15, and 42.1–42.12), and substantive clinical/physiological callouts. Related headings can share an inventory row, but each is named. A figure is an illustration of a mechanism, not automatically a separate objective. Bibliographies were not followed or treated as additional factual sources.

Inventory status totals: 160 mapped entries, two source-missing entries, three outside-scope entries. Every one of the 41 concepts appears in the mapped source inventory.

## Source and answer review

Source and answer audit completed for all 54 new items.

All new stems, keys, explanations, distractor explanations, and objective links were reviewed against the cited local pages. Existing question text and source records were reviewed without modifying the repository bank. New distractors were revised where needed to keep options plausible, comparable, and aimed at actual physiological confusions. Answer positions are balanced (A: 14, B: 14, C: 13, D: 13); option permutation preserves the correct explanation and all three wrong-option explanations.

Selected independently checked calculations:

- Gap 003: RV = FRC − ERV = 2.4 − 1.0 = **1.4 L**; TLC = FRC + IC = 2.4 + 3.0 = **5.4 L**.
- Gap 004: nitrogen-washout area fraction = 25 / (25 + 75); dead-space volume = fraction × 600 = **150 mL**.
- Gap 017: net outward pressure = (10 − (−5)) − (25 − 12) = **2 mm Hg**, using the stated simplified Starling model.
- Gap 021: with the stated unchanged gas-pressure conditions and proportional balance, fourfold oxygen uptake requires **fourfold alveolar ventilation**.
- Gap 023: gas transfer = 20 mL/min/mm Hg × 10 mm Hg = **200 mL/min**.
- Gap 024: shunt fraction = (20 − 19) / (20 − 15) = **0.20**, using explicitly supplied oxygen contents.
- Gap 048: mixed arterial oxygen content = 0.8 × 20 + 0.2 × 15 = **19 mL O2/dL**.
- Gap 049: alveolar dead space = physiological − anatomical dead space = 300 − 150 = **150 mL**.
- Gap 051: when hemoglobin-derived oxygen content and flow each halve, neglecting dissolved oxygen as stated, oxygen delivery becomes 0.5 × 0.5 = **one quarter**.

All numerical items state the information and assumptions needed for a single defensible answer. Ranges and rounded textbook examples were not converted into arbitrary universal diagnostic cutoffs.

## Textbook cautions retained in the teaching material

- Table 38.1 lists a female inspiratory capacity of 2400 mL although the listed tidal and inspiratory reserve volumes sum to 2300 mL. Teach the capacity equation; do not test the inconsistent total as trivia.
- The rounded venous oxygen-content example on printed p. 534 does not exactly reproduce the separately stated hemoglobin concentration, saturation, and binding constant. New calculations provide internally consistent inputs instead of requiring that rounded result.
- The carbon-dioxide transport prose and diagram use somewhat different approximate carbamino fractions. Teach mechanisms and the predominance of bicarbonate, not one compulsory percentage.
- Pleural-pressure examples use cm H2O in Chapter 38 and approximate mm Hg values in Chapter 39. Preserve units and pressure relationships; do not present them as interchangeable exact normal values.
- The dead-space equation printed in this book uses arterial PCO2. Preserve that stated formula and its assumptions; distinguish mixed-expired PCO2 from end-tidal PCO2 and do not assume arterial and mean alveolar PCO2 are identical in every disease.
- Hypoxic response thresholds, edema safety margins/timing, acclimatization percentages, and particle-size deposition bands are approximate physiological models, not universal single-answer cutoffs.
- The full respiratory rhythm-generating network and some chemoreceptor mechanisms are not exhaustively resolved. J-receptor effects are described with the book's qualification rather than as an exclusive proven explanation of dyspnea.

## Limits and exclusions

No physiology teacher slides, recordings, Telegram content, past papers, online explanations, or external clinical guidelines were used. Respiratory physiology instructor material and the final TUMS exam blueprint are unavailable: the content cannot establish faculty emphasis, exact exam weighting, or whether additional chapters are assigned. The embedded Video 38.1 was unavailable; the surrounding book text and static illustrations cover the mechanics taught here.

Chapter 43 begins on printed p. 551 / PDF p. 541 and is explicitly outside this five-chapter core. Respiratory-insufficiency diagnosis, forced-spirometric disease classification, and oxygen-therapy management are not silently added. Later dedicated altitude/diving chapters are also not added; only the acclimatization, exercise, and pressure effects actually discussed in Chapters 38–42 are included.

Historical treatment details in the carbon-monoxide paragraph, therapy choices in the sleep-apnea and brain-edema discussions, drug ranking/dose advice, epidemiological statistics, and breath-holding records are not used as current clinical management teaching. Their relevant underlying physiological mechanisms remain covered. A short voluntary-hyperventilation question tests CO2/pH feedback, not a breath-hold or diving protocol.

The objective list intentionally prioritizes meaningful mechanisms and applications rather than separate memorization objectives for every rounded normal value, every point on a response curve, each particle threshold, or every vocal-fold muscle position. The full normal-value table, exact graph coordinates, and all named anatomical details are not individually tested. The detailed concept notes and retrieval prompts still support broader reading. Direct question sampling across all selected objectives is not a claim that every possible book sentence, faculty objective, or clinical application is examined.

`verified` means that the new items passed this source/answer audit and structural validation. It does not mean faculty approval, clinical guideline currency, empirical item discrimination, or validation on student responses. `examPriority: core` is an editorial scope label, not evidence of TUMS exam frequency.

## Mechanical validation and provenance

The assembly validates all 54 new questions against the existing MCQ JSON schema using Ajv 2020-12. It checks unique IDs, four distinct options, exactly three correctly aligned distractor explanations, unique primary objective homes for all 110 questions, nonempty question sampling for all 101 objectives, all 41 concepts in the inventory, required concept cardinalities, source-page footers, answer-position balance, and no exact duplicate new prompts or exact duplication of existing prompts.

The existing bank was left unchanged. Its SHA-256 at audit assembly is `7f58cc039175c377d217ab081e369ec7a49ccd9b3e1983bc51bc9e019aa722de`. No correction to an existing key or locator was required; any future correction should be handled explicitly through the separate corrections artifact.

All authored and generated files remain in this physiology research folder. The site checkout was read only for its existing question bank, schema, and validator dependency. There were no site edits, integrations, deployments, or external writes in this subtask.
