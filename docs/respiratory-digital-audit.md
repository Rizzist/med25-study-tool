# Respiratory native-text report audit

Audited 27 September 2026. Scope: imports `respiratory-01`, `02`, `03` and `04`. All 40 preferred source PDF pages were rendered and visually inspected against native text. The archived reports and course review PDF were not changed.

## Result

| Import | Source pages | Questions | Supplied selections | Scored answers | Unscored |
| --- | ---: | ---: | ---: | ---: | ---: |
| 01: report dated 9 February 2021 | 8 | 40 | 40 | 36 | 4 |
| 02: report dated 17 April 2021 | 12 | 40 | 40 | 36 | 4 |
| 03: report dated 24 July 2021 | 12 | 39 | 39 | 35 | 4 |
| 04: 15 January 2022 filename label | 8 | 38 | 38 | 34 | 4 |
| Total | 40 | 157 | 157 | 141 | 16 |

`SHIP` means transcription and answer audit are complete, including explicitly unscored defects. Supplied report check marks are preserved in `providedKey`; they are not independently authenticated official keys. Only non-null audited `key` values support single-answer scoring.

Report dates are not automatically exam dates. Sources 01 and 02 share TestId 19422, with substantial overlap but different ordering and some different content. Their separate report provenance is retained; neither the dates nor reordered questions alone establish separate sittings. Source 03 uses TestId 22549 and visibly ends at Q39; no Q40 was invented. Source 04's date is an archive filename/caption label, not a printed sitting date.

## Source and page accounting

Paths are relative to `/Users/rizzist/Documents/MED SLIDES/TERM 2/02 Respiratory/Past Exams`.

| Import | Preferred source PDF | Page coverage |
| --- | --- | --- |
| 01 | `01_Theory/2021-02-09_report/respiratory_2021-02-09_report.pdf` | p1 Q1–5; p2 Q6–10; p3 Q11–15; p4 Q16–20; p5 Q21–25; p6 Q26–30; p7 Q31–35; p8 Q36–40 |
| 02 | `01_Theory/2021-04-17_report/respiratory_2021-04-17_report.pdf` | p1 Q1–3; p2 Q4–7; p3 Q8–11; p4 Q12–15; p5 Q16–18; p6 Q19–22; p7 Q23–25; p8 Q26–28; p9 Q29–32; p10 Q33–36; p11 Q37–39; p12 Q40 |
| 03 | `01_Theory/2021-07-24_report/respiratory_2021-07-24_report.pdf` | p1 Q1–3; p2 Q4–7; p3 Q8–11; p4 Q12–14; p5 Q15–18; p6 Q19–21; p7 Q22–24; p8 Q25–27; p9 Q28–30; p10 Q31–33; p11 Q34–36; p12 Q37–39 |
| 04 | `01_Theory/2022-01-15_filename/respiratory_2022-01-15_filename.pdf` | p1 Q1–5; p2 Q6–11 number; p3 Q11 text–16 stem; p4 Q16 options–21 first choices; p5 Q21 last choices–25 first choices; p6 Q25 last choice–30 first choices; p7 Q30 last choice–35 first choices; p8 Q35 last choices–38 |

No standalone cover or non-question page occurs in these four reports. Repeated report headers/footers are not question records. Every source page is covered by retained questions. Source 04 Q11, Q16, Q21, Q25, Q30 and Q35 cite both pages of their split content.

## Transcription repairs

- Source 03 Q1: restored four chemical-pair choices, including bicarbonate/chloride and H2CO3/bicarbonate. Subscripts and superscripts were not treated as separate options.
- Source 03 Q2: restored Helium, CO2, CO and O2 in that order; the visible marked CO is option C, not the extraction artifact's D.
- Source 03 Q3 and Q11: restored O2 in the stem. Q12: rejoined the CO2 option. Q15: rejoined the VA/Q subscript and retained the marked fourth choice as D.
- Source 03 Q25: recovered the second bold stem line, “Goblet Cell?” Q38: restored the four month choices 3rd/4th/5th/6th in source order and supplied D. Q39: recovered the detached alveolar-duct development stem.
- Source 04 Q11: recovered the Laplace-law stem on the next page. Q14: rejoined VA/Q and restored four choices with supplied D. Q17: restored PO2 and PCO2 in the correct order.
- Source 04 Q22, Q24 and Q30: recovered detached incisive-canal, middle-meatus and thyrohyoid-membrane stems. Q29: restored rib 8/10/6/7 choices. Q30: restored four choices, retaining the internal laryngeal nerve as supplied C and the inferior laryngeal artery as D across the page boundary.
- Minor extraction spacing was repaired. Source-specific unusual spellings such as Celara/Celera and Nomocyte II remain identifiable and are explained in notes; no missing distractors were fabricated.

## Answer corrections and quarantines

Five non-null audited answers differ from the correctly indexed supplied selections:

| Import / question | Supplied → audited | Reason |
| --- | --- | --- |
| 01 / 28 | C → A | Ethmoid contributes both nasal roof and medial septal wall; palatine does not fit that combination. |
| 02 / 32 | B → A | Same ethmoid correction, with reordered distractors. |
| 03 / 18 | D → B | Transpulmonary pressure is about +5 cm water at start inspiration; the negative value confuses pleural pressure with transpulmonary pressure. |
| 03 / 30 | C → A | Same roof-and-medial-wall ethmoid correction. |
| 04 / 29 | A → C | Inferior lung border is conventionally rib 6 at the midclavicular line; rib 8 is the pleural reflection. |

The 16 unscored records preserve their supplied marks:

| Items | Reason |
| --- | --- |
| 01 Q1; 02 Q15; 03 Q15 | Physiological shunt includes both low/zero-V/Q flow and anatomical bronchial venous admixture, both offered by the broad stem. |
| 01 Q14; 02 Q11 | Histamine is not a defensible absolute glomus-cell transmitter exclusion across unspecified species/conditions. |
| 01 Q23; 02 Q24 | Stratified squamous epithelium occurs in vestibule and oro-/laryngopharyngeal regions. |
| 01 Q26; 02 Q23; 03 Q26 | Elastic fibers occur in several offered airway/lung locations; a specific ligament or structure is not named. |
| 03 Q21 | An absolute exclusion of noradrenaline release/signaling from glomus cells is not justified. |
| 03 Q25 | Vestibular squamous and olfactory epithelium both lack goblet cells; pharyngeal lining also varies by region. |
| 04 Q14 | Both high V/Q and reduced perfusion with maintained ventilation can contribute to wasted ventilation. |
| 04 Q16 | Ventral networks contribute to baseline rhythm and increased ventilatory drive; the older single-answer contrast is not exclusive under modern physiology. |
| 04 Q36 | Bronchial cartilage-bearing wall layer is not precisely offered among mucosa, muscularis, adventitia or nothing. |
| 04 Q37 | Alveolar macrophage/dust cell is not a standard pneumocyte I–IV designation. |

Numerical reference values, quiet-breathing assumptions, simplified West zones, and the traditional pneumotaxic/ramp model are explicitly qualified in individual notes. No modern network claim is inferred solely from the old source mark.

## Evidence and verification

All questions have source PDF/page evidence, a concise explanation, subject and topic-specific review terms, plus links to relevant pages of the unchanged 186-page [Respiratory Review](../public/study/reviews/respiratory.pdf). External uncertainty checks use primary research:

- [Histamine localization and carotid-body signaling](https://pubmed.ncbi.nlm.nih.gov/18824142/) informs the histamine-exclusion quarantines.
- [Adrenergic mechanisms in cat/rabbit carotid bodies](https://pubmed.ncbi.nlm.nih.gov/6809933/) informs the noradrenaline-exclusion quarantine. Species-specific experimental evidence is not presented as an exclusive human transmitter list.
- [Human respiratory ciliary-beat measurements](https://pubmed.ncbi.nlm.nih.gov/7307626/) support 03 Q7's approximate 10–20 beats/second answer, with temperature and sampling caveats.

Verified: JSON parsing, continuous unique source numbering, exactly four ordered choices, allowed A–D/null keys, complete explanations/terms/evidence, existing archive evidence paths, all 40 source pages covered and `git diff --check`. No application integration or deployment is claimed by this audit lane.
