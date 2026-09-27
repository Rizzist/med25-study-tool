# Respiratory scanned-paper transcription and answer audit

Audit completed 2026-09-27. This lane owns imports `respiratory-05`, `respiratory-06`, `respiratory-09` and `respiratory-12` only. It does not change the archived PDFs or certify their answer marks as official.

## Result

| Import | Supplied PDF pages | Retained questions | Visible supplied marks | Audited single answers | Unresolved |
| --- | ---: | ---: | ---: | ---: | ---: |
| 05: July 4, 2022 | 12 | 34 | 33 | 32 | 2 |
| 06: July 2, 2023 | 10 | 40 | 0 | 33 | 7 |
| 09: archive-labelled August 2026 report | 6 | 38 | 38 | 33 | 5 |
| 12: undated teacher-named paper | 7 | 40 | 40 | 34 | 6 |
| Total | 35 | 152 | 111 | 132 | 20 |

`audit.status: SHIP` means the transcription and audit are complete, including explicit quarantines. Only questions with a non-null `key` are suitable for single-answer scoring. `providedKey` independently preserves a visible source highlight, circle, tick or asterisk. An unmarked source is represented by `providedKey: null`, even when an editorial answer is defensible. No official-key status is inferred from handwritten “Key,” ticks, asterisks or a filename.

All 35 supplied pages were rendered from the actual study PDFs with PyMuPDF and visually inspected. OCR was used only as a locator and draft reference, not accepted as the transcript. Visual inspection recovered option order, Persian numerals, answer-cell highlights, handwritten circles, crossed-out stems and replacement questions. Minor spelling, grammar and unit formatting are normalized; substantive repairs are disclosed in question notes. Every retained question has four ordered options, printed source number, actual one-based PDF page, answer reasoning, curriculum review terms and evidence references.

## Sources and page accounting

Archive root: `/Users/rizzist/Documents/MED SLIDES/TERM 2/02 Respiratory/Past Exams`.

| Import | Source path beneath archive root | Actual PDF-page coverage |
| --- | --- | --- |
| 05 | `01_Theory/2022-07-04_exam/respiratory_2022-07-04_ordered.pdf` | p1 cover; p2 Q1–3; p3 Q9–11; p4 Q6–8; p5 Q4–5; p6 Q12–14; p7 Q15–18; p8 Q19–21; p9 Q22–24; p10 Q25–27; p11 Q28–31; p12 Q32–34 |
| 06 | `01_Theory/2023-07-02_exam/respiratory_2023-07-02_ordered.pdf` | p1 cover; p2 Q1–5; p3 Q6–10; p4 Q11–15; p5 Q16–20; p6 Q21–25; p7 Q26–30; p8 Q31–33 plus cancelled renal Q34–35; p9 replacement respiratory Q34–35; p10 Q36–40 |
| 09 | `01_Theory/2026-08_key-report/respiratory_2026-08_key-report.pdf` | p1 Q1–7; p2 Q8–14; p3 Q15–21; p4 Q22–28; p5 Q29–35; p6 Q36–38 |
| 12 | `01_Theory/Undated_Dr-Imani_key-and-alternate/dr-imani_ordered.pdf` | p1 Q1–6; p2 Q7–11; p3 Q12–17; p4 Q18–22; p5 Q23–28; p6 Q29–34; p7 Q35–40 |

The July 2022 study PDF remains partly out of numerical question order despite its filename. Imports sort questions by printed number while retaining actual PDF-page references. Its cover lists 34 MCQs and six short answers, but the supplied file contains only the 34 MCQs. The six absent short answers are explicitly noted; no content is fabricated.

The July 2023 paper has 42 visible stems: 40 retained respiratory questions and two visibly crossed-out renal embryology questions. The renal items are individually recorded in `excludedItems`; the respiratory replacements on the next page retain source numbers 34 and 35. The source footer numbering is not used for PDF citations.

The August report has 38 visible questions, not an assumed 40. August 15, 2026 is a photograph timestamp; it is not established as an exam date. No cover or further question pages are supplied. The undated paper names Dr Imani, Dr Hasanzadeh and Dr Rastegar in its section headings. Its printed page numbers start at 3, but all references use the seven supplied PDF pages.

## Unresolved items excluded from scoring

| Import / question | Supplied mark | Reason |
| --- | --- | --- |
| 05 / 14 | D | Acetazolamide effects depend on dose and time: substantial acute enzyme inhibition may retain tissue CO2, while oral treatment can lower arterial PCO2 through metabolic acidosis and increased ventilation. Context omitted. |
| 05 / 18 | D | “True elastic fiber” does not distinguish larynx from trachea/bronchi; the likely intended vocal ligament is not specified. |
| 06 / 1 | None | Undefined alveolar hypoxia threshold conflates different oxygen-sensitive responses; no unique 73-versus-60-mmHg criterion follows from the stem. |
| 06 / 9 | None | Blocking alveolar perfusion makes V/Q infinite and reduces alveolar CO2; both “V/Q zero” and “CO2 higher” fail, and ventilation increase is not guaranteed. |
| 06 / 14 | None | Both zero-V/Q units and bronchial venous admixture cause physiological shunt. |
| 06 / 17 | None | Absolute “not released” glomus-cell neurotransmitter claim is insufficiently specified. VIP is present in human chief cells in primary histology; presence alone does not prove release, but it prevents confidently teaching an absolute exclusion. |
| 06 / 26 | None | Major bone contributing to roof and medial nasal wall is ethmoid, absent from options. |
| 06 / 36 | None | Vocal-cord question offers nasal zones and pharynx; neither the requested location nor a specified epithelial comparison has a unique answer. |
| 06 / 38 | None | Alveolar macrophage/dust cell is absent; unqualified pneumocyte III/IV are not standard replacements. |
| 09 / 10 | C | Source seems to mean the apical alveolar-dead-space contribution, but physiological dead space includes anatomical dead space throughout conducting airways. |
| 09 / 13 | A | “VRG inactive” is an overbroad older center-model claim; ventral inspiratory neurons participate in quiet breathing. |
| 09 / 24 | C | Elastic-fiber bundle question does not specify vocal ligament; bronchial walls also contain elastic fibers. |
| 09 / 25 | C | Small/terminal bronchioles and respiratory bronchioles both have simple cuboidal epithelial regions. |
| 09 / 26 | A | Undefined “pneumocyte type III” cannot be silently converted into alveolar macrophage or another cell. |
| 12 / 12 | A | Chloride is the intended chloride-shift answer, but the broad venous-versus-arterial intracellular-ion comparison also includes H+ and bicarbonate changes; chloride is not uniquely established by the wording. |
| 12 / 13 | C | Marked high V/Q is incompatible with shunt; several low-V/Q/admixture alternatives can contribute, so no single corrected letter is assigned. |
| 12 / 24 | A | Recurrent laryngeal nerve supplies transverse arytenoid and also contributes to inferior-constrictor innervation; both A and B are defensible. |
| 12 / 27 | A | Recurrent and inferior laryngeal names overlap for the nerve supplying mucosa below the vocal folds. |
| 12 / 36 | C | Marked option places tracheal glands in lamina propria; usual layer-specific description is submucosal, and the question does not state its layer convention. |
| 12 / 37 | C | Olfactory region is intended, but Bowman's glands occupy its lamina propria, not the epithelium offered by C. |

## Notable editorial decisions

- 05 Q33 has no unambiguous marked answer; the audited A is inferred from the endoderm/splanchnic-mesoderm lineage distinction. Q34 options are visually confirmed as 12, 6, 17 and 4.
- 05 Q8 retains C as the nearest conventional answer with the missing baseline assumption stated: doubling thickness halves a resting CO2 diffusing capacity of roughly 400–450 to roughly 200–225 mL/min/mmHg.
- 06 Q30 normalizes the apparent translation “transvers pyramidal muscles” to transverse arytenoid and records this repair. Q31 removes the printed answer leak “Vecalis muscle” from the stem while recording its presence.
- 09 Q37 normalizes the translated lung “umbilicus” to hilum. Q38 removes the nonsensical trailing “the and the calyx,” leaving the printed thyroid-attachment question and original options intact.
- 12 Q38 visibly prints “Pneumococcus Type I/II/III.” These are explicitly repaired to the intended cell name “Pneumocyte” in the options, with roman numerals and order unchanged. Type I then gives the defensible A answer.
- Cross-lane peer review changed 12 Q12 from the intended chloride-shift key to unscored, consistently with analogous broadly worded ion-concentration questions in the photo lane. Its supplied A mark remains unchanged.
- Approximate numerical conventions, usual bronchial-artery origin, classic ramp/pneumotaxic models, and simplified flow-zone assumptions are explained in notes instead of being taught as exceptionless rules.

## Evidence

Each item links the relevant section of the course [Respiratory Review](../public/study/reviews/respiratory.pdf); curriculum headings guided subject and topic mapping. The following primary sources address uncertainties outside a simple course lookup:

- [Brzezinski et al., 1967: brain CO2 after carbonic-anhydrase inhibition](https://pubmed.ncbi.nlm.nih.gov/6032197/) and [2019 comparison of methazolamide and acetazolamide in human breathing control](https://pubmed.ncbi.nlm.nih.gov/31595565/) support retaining the timing/context ambiguity of 05 Q14.
- [Smith et al., 1990: peptide distribution in human carotid bodies](https://pubmed.ncbi.nlm.nih.gov/1700931/) and [Kåhlin et al., 2014: human carotid-body ACh and ATP release during hypoxia](https://pubmed.ncbi.nlm.nih.gov/24887113/) informed the caution on 06 Q17. Immunoreactivity is not treated as proof of neurotransmitter release.
- [Human pulmonary endothelial ACE experiments](https://pubmed.ncbi.nlm.nih.gov/6253244/) support 09 Q9's non-respiratory metabolic function.
- [Pre-Bötzinger/ventral respiratory neuronal recordings in adult cats](https://pubmed.ncbi.nlm.nih.gov/7643160/) support rejecting the blanket inactivity claim in 09 Q13 alongside the course's explicit network-model warning.
- [Das et al., 1984: thyroid hormone and fetal lung surfactant release](https://pubmed.ncbi.nlm.nih.gov/6203883/) supports the endocrine maturation comparison in 12 Q20.
- [Sakamoto, 2013: inferior-constrictor innervation in human cadavers](https://pubmed.ncbi.nlm.nih.gov/23515953/) and [Brok et al., 1999: intraoperative motor-innervation evidence](https://pubmed.ncbi.nlm.nih.gov/10334217/) establish the overlapping valid options in 12 Q24.

## Verification

JSON parsing, sequential unique numbers, source-number preservation, four nonempty ordered options, allowed letter/null answer values, required notes/terms/evidence and actual-page coverage were checked for all four files. All retained question numbers are continuous in their own paper. All 35 actual PDF pages are represented by questions or explicit exclusions. `git diff --check` passed. No application integration, runtime build or deployment is claimed by this lane.
