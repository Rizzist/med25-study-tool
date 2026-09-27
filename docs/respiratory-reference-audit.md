# Respiratory practical and reference import audit

Audited 27 September 2026. Scope: sources respiratory-16, 17, 18, 19, 22, 23 and 24 from the organized Respiratory Past Exams archive. All seven sources are explicitly `defaultEligible: false`.

| Source | Pages accounted for | Question records | Validated MCQ keys | Unscored MCQs | Short answers |
| --- | ---: | ---: | ---: | ---: | ---: |
| 16 - January 2022 practical | 13 | 14 | 14 | 0 | 0 |
| 17 - January 2024 histology reference | 10 | 0 | 0 | 0 | 0 |
| 18 - mixed CVS/respiratory reference | 30 | 0 | 0 | 0 | 0 |
| 19 - undated practical key | 8 | 20 | 18 | 2 | 0 |
| 22 - online screenshots | 29 | 32 | 26 | 2 | 4 |
| 23 - physiology MCQ collection | 10 | 72 | 56 | 16 | 0 |
| 24 - unmatched bubbles | 1 | 0 | 0 | 0 | 0 |
| Total | 101 | 138 | 114 | 20 | 4 |

Source 24 separately preserves 40 visually transcribed rows in `unmatchedAnswers`; Q9 is deleted in the source. These are not question records, have no validated keys, and must never be applied to any other paper. Rows 41-160 on the printed form are blank.

## Source fidelity and page accounting

The original PDFs/images are authoritative. The scratch `pages.json` maps study-page indices to source files and source pages. Extracted text was used for text-native PDFs; OCR was only a search aid. Each source page is represented by question records, explicit continuation/shared-figure accounting, or a reference-only exclusion.

- Source 16: all 14 questions are MCQs, not invented spotters. Twelve anatomy questions have original figures and arrows. Q5 was transcribed visually because its page had no extractable text. Q14 begins on page 12 and its choices/tick continue on page 13. The visible choices are terminal bronchiole, alveolar duct, printed “Theracea” (trachea), and vestibular zone, in that order; the OCR order was reversed.
- Source 17: cover, seven sets of labelled micrographs, and two handwritten recap pages. Each page is retained in `excludedItems` with its subject matter. There are no original question stems/options to import.
- Source 18: decorative cover, 28 labelled teaching pages and a credits/epithelial-model page. Respiratory, cardiovascular, vertebral, rib and sacral material is accounted for page by page. No MCQs were invented from the labels.
- Source 19: page 1 is the shared spirogram for Q1-2; pages 2-8 contain all 20 MCQs. Yellow-highlighted answers are preserved as `providedKey`, separately from validated `key`.
- Source 22: 28 screenshot MCQs plus four open-response prompts on page 29. All option sequences were checked top-to-bottom against the actual images; the OCR often reversed them. Filled blue radio buttons on pages 3, 4 and 6 are preserved as student selections, not official answers. Hollow blue outlines are not treated as reliable selected answers.
- Source 23: all 72 numbered MCQs with all five original options. No supplied key was visible. Different wording, option order, respiratory-cycle phase and distractors are preserved.
- Source 24: one unmatched answer-only image, explicitly isolated.

## Figure handling

Twenty-nine PNG figure regions were extracted directly from original PDF page renders: twelve for source 16, and one shared spirogram plus sixteen spotter figures for source 19. The extraction preserves the source arrow/letter overlays and does not regenerate anatomy. Every output was visually inspected. No option text, answer tick, or yellow answer highlight appears inside the live figure extracts. Filenames and alt text identify source/question numbers without revealing the answer. Source 19 Q6 retains the non-answer labels B/C and contextual tissue abbreviations.

## Unresolved or defective items

These items retain their exact source choices and a null validated key:

| Item | Reason |
| --- | --- |
| 19 Q1 | Source highlights 330 mL, but the plotted tidal swing is 1000-1400 mL; applying the stated 1.1 factor yields 440 mL, absent from the choices. |
| 19 Q5 | Highlighted “Pneumococcus Type III” is not a valid alveolar epithelial identification. The printing and microscopic identification cannot support that key. |
| 22 p19 / source Q14 | Acetazolamide effect depends on acute tissue enzyme inhibition versus later ventilatory/metabolic response; dose and time are absent. |
| 22 p20 / source Q31 | “True elastic fiber” is ambiguous; elastic fibres occur at several airway sites. An intended reference to true vocal folds is not explicit. |
| 23 Q4 | Extent/time of respiratory-alkalosis compensation is unspecified; normal versus still-high pH is not uniquely determined. |
| 23 Q20 | Short-term hypoxic ventilatory decline versus longer acclimatization makes the unqualified time statement ambiguous. |
| 23 Q23 | FRC rises with age, and an approximate 3 L can also be plausible for an adult male. |
| 23 Q25 | No unambiguously correct option on ventilatory control. |
| 23 Q33 | Maximum expiration is not specified as forced or relaxed; intrapleural pressure depends on maneuver and effort. |
| 23 Q35 | Hyperventilation is likely intended, but increased output and alkalosis-related left shift can also be acute altitude responses. |
| 23 Q41 | Oxygen-debt recovery phase and comparison point are not specified. |
| 23 Q47 | Single-breath nitrogen tracing and multiple-breath nitrogen washout measure different listed quantities. |
| 23 Q51 | No listed statement describes ordinary mixed-venous pulmonary-trunk blood correctly. |
| 23 Q53 | “Initiated” does not distinguish pre-Botzinger rhythm generation from inspiratory-ramp output. |
| 23 Q59 | The printed “elevate hypoxia” reverses the probable intended “alleviate hypoxia”; a key would require changing the stem's meaning, so the literal original remains ungraded. |
| 23 Q63 | Both wasted perfusion (A) and an approximate normal shunt of 5% of cardiac output (E) are defensible; the unqualified stem does not support one unique answer. |
| 23 Q67 | Both C and D are false at normal no-flow end-expiration. |
| 23 Q69 | More than one parameter may rise with age; the stem is not a unique single-answer question. |
| 23 Q70 | A 50 cm x 6 mm tube adds about 14 mL; total dead space is about 164 mL using 150 mL baseline, not one of the listed values. |
| 23 Q71 | Unspecified spinal-cord transection overlaps the explicitly listed C1 transection. |

Source 22 p29-1 through p29-4 remain open responses with `options: []`, `key: null` and explanatory `shortAnswer`. The first visible typed response was preserved in the note; the second is only the unfinished “Du”; the third is blank and the fourth answer field is obscured by the keyboard. None is converted to an invented MCQ.

Source 23 Q55 retains the malformed “ml” units but explains the intended mL/min/mmHg and closest numerical choice. Q59's printed “elevate hypoxia” is preserved literally and is not scored under an inferred wording correction. Source 19 Q4's 80% value is labelled a young-adult teaching approximation rather than a universal diagnostic threshold.

## Duplicate and variant audit

No question was dropped across separate sources/exams. Source 22 is a reference collection, not a separately verified July 2022 sitting.

The archive's preferred 29-page screenshot PDF already removes nine repeated captures from its 38-page original: original pages 7->6, 8->3, 19->3, 25->5, 27->6, 28->18, 30->2, 34->6, 37->3. These are source-PDF page numbers, not the renumbered study-page index. All originals remain in the archive.

All 28 preferred screenshot MCQs match July 2022 content after spelling/spacing normalization. Source 22 pages 1-28 correspond to source 05 question numbers:
25, 8, 23, 7, 30, 28, 4, 3, 5, 12, 2, 31, 13, 11, 9, 26, 10, 16, 14, 18, 29, 24, 15, 17, 34, 33, 27, 32.
The explicit map is also saved in `audit.overlapWithJuly2022`. The four final-page open-response prompts have a different format and remain intact.

Source 23 retains these close variants: Q9/Q45 (reordered choices), Q22/Q31 (different C statement), Q39/Q57 (different distractors), Q28/Q46 (different stem direction), and Q24/Q37 (inspiration versus expiration). They are not exact duplicate records.

## Evidence and validation

Per-item evidence links the original archive page and the local 186-page Respiratory Review. The local PDF was read directly for lung volumes, respiratory mechanics, airway histology, pneumocyte distinctions, chemical control, laryngeal anatomy and spirometry. Important external checks use primary studies or official scientific material:

- [Acute acetazolamide and tissue PCO2 in volunteers](https://pubmed.ncbi.nlm.nih.gov/10849018/) supports the acute tissue-response qualification; [three-day acetazolamide trial](https://pubmed.ncbi.nlm.nih.gov/10556126/) supports the different later ventilatory/metabolic response.
- [Sustained hypoxia study](https://pubmed.ncbi.nlm.nih.gov/2496083/) supports short-term biphasic ventilatory response; the local review explains later acclimatization.
- [ERS/ATS nitrogen-washout standards](https://pubmed.ncbi.nlm.nih.gov/11405534/) support FRC measurement by a washout protocol, distinct from the local review's single-breath anatomical-dead-space method.
- [Static lung mechanics across age](https://pubmed.ncbi.nlm.nih.gov/597637/) supports reduced recoil/increased specific compliance with age.
- [NOAA pressure explanation](https://oceanservice.noaa.gov/facts/pressure.html) confirms the additional atmosphere at about 33 feet of seawater.

Validation completed: JSON parsing; unique question IDs within each source; allowed answer letters within option bounds; all referenced media files present; all 101 study pages accounted for; 134 MCQs and four open responses; all 29 output figure regions visually inspected; source 16 ticks and source 19 highlights checked against the rendered originals. No main integration files were edited and no commit was created in this lane.

## Final independent sign-off — SHIP with documented source limitations

Verified against the regenerated files on 27 September 2026. The seven sources above contain 138 records: 114 keyed MCQ occurrences, 20 withheld MCQs and four ungraded short answers. Source 23 Q63 is definitively withheld because A and E are both defensible. Source 23 Q59 is also withheld because changing “elevate” to “alleviate” would change the printed stem's meaning. Neither question enters grading. This sign-off does not authenticate the remaining study keys as official university answers.

The integrated archive contains 24 source folders represented by 23 cards, 690 retained records, 579 distinct scored questions and 85 ungraded records. The 10/14 photo family has one card with both original layouts. The 26 keyed source-22 screenshots reuse source-05 question IDs; these aliases explain why scored source occurrences exceed the distinct question count. Source 22's two disputed MCQs remain withheld, and source 24's unmatched bubbles never enter grading. Original question downloads for source 06 Q30 and source 12 Q38 retain the printed typo choices through `sourceOptions`; the scored study versions retain separately disclosed corrections in `options`.

All 579 scored questions validate against the application schema and resolve to the current, hash-verified 186-page review PDF. All 69 audited section overrides are enforced. The generated anchor file contains 158 section headings and 363 paragraph links in total: 354 canonical past-paper question IDs are linked through 110 explicit source-PDF quotes, alongside the nine existing practice anchors. Questions without a paragraph anchor resolve to their current section; stale paragraph metadata falls back to that section.

Independent verification passed:

- `npm run respiratory:papers:check`: builder freshness check and all **9/9 integration tests**, covering every source/page, duplicate-family handling, canonical screenshot IDs, withheld records, schema/provenance, source and download SHA-256 hashes, export fidelity, current review destinations, overrides/anchors, and final API/media/cache behavior.
- `node --test tests/guided-exam.test.mjs tests/final-exam-completion.test.mjs tests/react-hooks.test.mjs tests/pdf-cache.test.mjs`: **25/25 tests**, including the new mobile CSS regression guard. Together with the integration suite, **34/34 tests** passed.
- `npx tsc --noEmit --incremental false`: passed against the regenerated runtime.
- Final API checks return exactly 579 distinct source questions, reject mismatched course/bank combinations, preserve ETag 304 behavior, and resolve every scored image through the media endpoint. Runtime course totals also report 579 rather than counting screenshot aliases again.
- The mobile CSS guard requires zero-minimum grid tracks on both guided shells, a shrinkable guided layout, PDF-after-question ordering in portrait, and the two-column split in landscape. This is a structural regression guard, not a substitute for the browser viewport check.

No blocking integration defect was found in this lane. This sign-off covers the source/reference audit and automated integration checks; the final browser walkthrough and production build are separate main-agent checks. The final integration-review work changed only this audit and the assigned regression tests; the shared builder was reviewed without edits.
