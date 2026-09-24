# Nutrition import lane A — 2026-09-24

Status: **SHIP** after independent factual/key review and correction loop.

## Imported source collections

| ID | Source pages | Source items | Scored study items | Explicit study repairs | Supplied key form |
| --- | ---: | ---: | ---: | ---: | --- |
| `kish-2019` | 3 | 21 | 21 | 5 | Green highlighting/underlines |
| `sums-retake` | 6 | 40 | 40 | 3 | Printed answer text |
| `tums-jan-2025` | 21 | 55 | 55 | 16 | Printed stars beside options |
| Total | 30 | 116 | 116 | 24 | Not authenticated as official university keys |

- All source pages were rendered and visually inspected, including options split across pages and the star/highlight positions. Text extraction alone was insufficient for TUMS's scanned options and marks.
- The TUMS filename `Nutrition Final Exam Tehran 2025.pdf` is byte-identical to `Final exam of nutrition of TUMS, Jan 2025.pdf` (SHA-256 `cc3f1d126709f85d3b6227cdd5823ab4e775c6ba9dc65c521bdcf92eabd35095`). It is recorded as an alias, not another paper or repeat occurrence.
- Kish June 2019 is printed in the document. SUMS/1st batch and TUMS/January 2025 are filename attributions; do not promote these into independently verified sitting dates.
- No student names, IDs, results or other student identifiers were visible on these 30 pages. Public PDFs are byte-preserving copies of these inspected sources; originals in Downloads are unchanged. Kish names its tutor, not a student.
- Canonical data: `data/nutrition/imports/{kish-2019,sums-retake,tums-jan-2025}.json`. Immutable source copies: matching slugs in `public/study/nutrition/past-papers/`.

## Answer policy

Each question preserves source number, start page, option order, supplied mark, audited study key, section ID, explanation, references and caveats. Original spelling is substantially retained; obvious OCR/font-ligature errors and typographic whitespace are normalized. `providedKey` is evidence of what the downloaded document marks, not a claim of official authorship or scientific correctness.

When a defective stem cannot be fairly scored as written, `repair: true` identifies an edited study version and `originalQuestion` preserves the original stem/options. These must not be described as verbatim PYQ repetitions. The original question and supplied key remain accessible for audit. Repaired questions should not inflate exact-repeat evidence.

SUMS Q6 is not rewritten: both B (whole grains instead of refined grains) and C (less added sugar/more fiber) are accepted because the original provides no basis for uniquely rejecting either. The provided answer remains C.

## Repairs and qualifications

| Paper | Items | Change |
| --- | --- | --- |
| Kish | 15 | Tests tryptophan as the serotonin precursor instead of promising mood improvement. |
| Kish | 16 | Retinoic-acid gene regulation/differentiation rather than universal proliferation stimulation. |
| Kish | 19 | Correct smoker vitamin C increment: +35 mg/day; original 90 mg/day answer is not treated as a smoker-specific RDA. |
| Kish | 20 | Specifies unnecessary excess iron in an iron-replete person, not a blanket prohibition for all cancer/CVD patients. |
| Kish | 21 | Consistent vitamin K intake with warfarin, not blanket cabbage avoidance. |
| SUMS | 18 | Supplies explicit illustrative amounts for a 20% dietary share; protein turnover has no universal fixed 20% dietary contribution. |
| SUMS | 19 | Specifies nondialysis CKD instead of claiming high-protein diets universally injure healthy kidneys. |
| SUMS | 29 | Specifies micrograms RAE, preformed vitamin A and pregnancy for teratogenicity. |
| TUMS | 5 | Clearly labels the source's historical 50-g protein-sparing teaching estimate; not the 130-g adult RDA or a universal requirement. |
| TUMS | 6 | Removes absolute neural glucose dependence; neurons can use ketones during prolonged fasting. |
| TUMS | 18–19 | Distinguishes NG decompression from feeding; distinguishes retinol from its retinyl-ester storage form. |
| TUMS | 23 | Restores deficiency to the Wernicke–Korsakoff stem. |
| TUMS | 32 | Geriatrics includes prevention and acute/chronic care, not chronic disease alone. |
| TUMS | 35 | Asks specifically for the enriched arginine/zinc/antioxidant supplement; original nutrition options overlap. |
| TUMS | 38 | States age 51+ for fiber intakes of 30 g/day (men) and 21 g/day (women). |
| TUMS | 40 | Adds a unique vitamin A/iron/zinc role sequence; all original nutrient combinations matter for growth. |
| TUMS | 45 | Replaces the unsafe developmental-disability exception with scurvy from impaired collagen hydroxylation. A first draft using night blindness was rejected by peer review because zinc deficiency can impair dark adaptation. |
| TUMS | 48 | Replaces ordinary dietary iron exclusion with unneeded high-dose iron supplementation. |
| TUMS | 49 | Adds a unique folate/B12/zinc/retinoid-related clue instead of claiming only one set matters for embryogenesis. |
| TUMS | 52 | Removes unsupported categorical exclusion of placental abruption; the false option instead claims lead protects against miscarriage. |
| TUMS | 53 | Tests the reliable within-feed fat difference, rather than ambiguous high-protein/mineral claims about foremilk. |
| TUMS | 54–55 | Adds the B12-specific infant neurologic clue after gastric bypass; specifies breast milk for maternal-diet responsiveness. |

Other qualifications remain explicit: fructose sweetness and calcium absorption vary; rickets age peaks are population-dependent; cataract/lutein/sodium evidence is associative; kwashiorkor is multifactorial; enteral feeding benefits are conditional; vitamin E interactions depend on dose/context; historical pregnancy energy increments are not universal individualized prescriptions.

## Evidence and verification

- Local course reference: DeBruyne, Pinna & Whitney, *Nutrition & Diet Therapy*, 9th ed. (2016), with PDF-counter page locators for each item.
- Numerical and clinical cross-checks: NIH Office of Dietary Supplements; CDC; WHO; NIDDK; NICE nutrition support; ESPEN geriatrics guidance; NPIAP pressure-injury nutrition; National Academies DRI tables; primary studies for cataract associations and infant body-fat trajectory. Every item has its own evidence field; unsupported official-key status is never inferred.
- Structural validation: 116 sequential source numbers; four options each; all current nutrition section IDs; all keys in A–D; explanations/references present; repair originals present; public source SHA-256 matches every import record.
- Independent reviewer examined all 116 stems/options/keys/rationales and targeted references. Review initially returned two blockers (TUMS Q40 non-unique nutrient sets and Q45 zinc-related night blindness). Both were corrected and re-reviewed. Reviewer then issued **SHIP**, with explicit scope: semantic/key review plus targeted reference checks, relying on this lane's full-page visual inspection for source transcription.

Lane frozen for integration/regeneration. No shared builders, catalog files or generated final-exam assets were edited by this lane.
