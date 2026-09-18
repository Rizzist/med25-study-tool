# Biochemistry II practical coverage

Added 13 September 2026. These are authored study questions, not reproduced past-paper or official exam items. They are routed only to Biochemistry II; all existing final/past-paper banks remain separate.

## Local source map

Primary pack: `/Users/rizzist/Documents/Med Slides/TERM 2/09 Biochemistry Practical/`

Cross-reference: `/Users/rizzist/Documents/Med Slides/TERM 2/10 Review Summaries/06 - Biochemistry Practical Review.pdf`

| Station | Questions | Primary source | Coverage |
| --- | ---: | --- | --- |
| Safety and equipment | 12 | 01 PDF, pp. 3–44 | Volumetric glassware, pipette delivery, meniscus, centrifuge balancing, fume hood/water bath, filtration, balance tare, chemical precautions |
| Titration | 12 | 02 PDF, pp. 3–9 | Normality, equivalents, nonzero burette readings, endpoint, overshoot, wet burette, tip air, dilution, reporting invalid runs |
| Spectrophotometry | 18 | 03 PPTX, slides 3–31 | A/T/%T, Beer–Lambert, path length, wavelength maximum, standard dilution, blanks, Biuret ratio, pre-dilution, intercept, linearity and controls |
| Qualitative protein tests | 18 | 04A PPTX, slides 15–29; 04B PDF, pp. 13–27 | Ninhydrin, xanthoproteic, Pauly, Hopkins–Cole, Biuret, TCA, reaction patterns, controls, denaturation versus hydrolysis |
| Enzyme experiments | 16 | 05 PPTX, slides 3–21 | Rennin/chymosin, enzyme/substrate dilution tables, temperature, pH, urease specificity and zinc, indicator controls, saturation and inference limits |
| Flame photometry | 10 | 06 PPTX, slides 2–11; review | Emission, wavelength versus visible colour, calibration/blank, matrix effects, restricted elements, ion charge units, saline calculation, ISE alternative |

86 questions total: 44 at difficulty 2–3, 42 at difficulty 4. Seven reasoning questions use six source figures. Difficulty is editorial, not validated against university performance. This bank covers the listed practical material; it is not a promise that every possible exam item has been predicted.

## Figures

Copied without modification from the saved review assets in `10 Review Summaries/_build/assets/biochemistry-practical/` to `public/study/biochemistry-practical/`:

| File | Original teaching locator | Use |
| --- | --- | --- |
| lab-19.png | 01, PDF p. 19 | Mohr delivery error from the marked interval |
| beer-lambert-graphs.png | 03, slide 14, embedded graphs | Concentration doubling and nonlinear transmittance |
| photometry-28.png | 03, physical slide 28 (printed 26); same Biuret chemistry in 04A slide 26 | Peptide hydrolysis and loss of copper coordination |
| enzymes-17.png | 05, slide 17 | Volume controls and 4:2:1 enzyme ratio |
| enzymes-18.png | 05, slide 18 | Substrate-series controlled quantities |
| enzymes-20.png | 05, slide 20 | Correct zinc-effect comparator |

Full slide tables remain visible because interpreting their design is the task; these are not label-identification questions. Captions and explanations follow the existing learn/test feedback gate.

## Source disagreements retained

- Ninhydrin: Ebrahimi 5-minute versus Emamgholipour 10-minute boiling-water bath.
- TCA: Ebrahimi 1+1 mL versus Emamgholipour 2+2 mL; same 1:1 ratio and 7.5% final TCA from 15% stock.
- Xanthoproteic: Emamgholipour explicitly includes cooling and alkaline orange development. Phenylalanine caveat follows the saved review.
- Absorbance is logarithmic; it is not the intensity difference `I₀ − I` written in one lecture explanation.
- “Renin” in a milk table refers to the intended rennin/chymosin experiment, not renal renin.
- A zinc/urease colour endpoint cannot establish competitive inhibition. Milk clotting times alone cannot establish Km.
- Flame colour and analytical wavelength are distinct; a blanket claim that all ISE measurements are less precise is not accepted.

Calculation cases provide their own inputs. They are not asserted to be the student's raw measurements. The protein example `0.225/0.243 × 7 = 6.48 g/dL` is arithmetically checked; `6.83/7` determines only a ratio, not two unique OD values.

## Integration and checks

- New sidebar and overview entry: **Biochemistry practicals**, inside Biochemistry II.
- Six station selectors, challenge/image/unseen/repair filters, session length, learn/test feedback, existing saved progress.
- Six linked Study concepts modules, each with source map, recall answers, traps and question-level objectives.
- Practical collection excludes unrelated metabolism-pathway images on both the Next server and local bridge.
- `npm run biochemistry:practical` regenerates tracked data; `npm run biochemistry:practical:validate` checks deterministic output, schemas, routing, arithmetic, images and concept mapping.
- `node scripts/build-embedded-bank.mjs` refreshes deployment data. Deployment validation rejects a stale practical bank or missing figures.

No commit, push or production deployment is part of this change request.
