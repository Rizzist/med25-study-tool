# Respiratory photo-paper transcription audit

Reviewed 2026-09-27 against all 46 preferred source images, the respiratory review PDF and its curriculum headings. OCR was a drafting aid only. The seven imports contain all 216 visible question instances, including 24 deliberately unscored items. `audit.status: SHIP` means the source transcription and answer audit have been reviewed; it does not certify a unique answer for questions whose `key` is null.

| Import | Source images | Questions | Audited non-null answers | Unscored |
| --- | ---: | ---: | ---: | ---: |
| respiratory-08 | 9 | 40 | 35 | 5 |
| respiratory-10 | 7 | 42 | 38 | 4 |
| respiratory-11 | 7 | 36 | 31 | 5 |
| respiratory-13 | 13 | 40 | 34 | 6 |
| respiratory-14 | 7 | 42 | 38 | 4 |
| respiratory-20 | 1 | 9 | 9 | 0 |
| respiratory-21 | 2 | 7 | 7 | 0 |
| Total | 46 | 216 | 192 | 24 |

## Provenance and transcription

- The February 2025 cover is accounted for as non-question content. It establishes the semester, 40 items and 40 minutes, not an exact sitting date. Its question pages contain no visible selected options.
- Posting/forwarding dates are not treated as exam dates. Preferred image provenance comes from each archive folder's `_metadata/sources.json`. Redundant PDFs and Sarwar recaptures were not counted as additional papers.
- Tabiya image 9 actually contains anatomy 5-8; image 10 contains anatomy 1-4. Their archive filenames reverse those ranges. Imported `sourceNumber` follows the printed paper, and `page` follows the preferred-image index.
- The 42-item source's image 5 ends at Q31; Q32 starts on image 6 despite their filename labels.
- Sections that restart numbering use IDs such as `physiology-1` and `anatomy-1`. Numbered options and Persian letters/numerals are normalized to A-D and Arabic numerals in source order.
- Questions crossing image boundaries include evidence for both images. Incidental background fragments in the Tabiya photograph are accounted for as duplicates rather than fabricated extra questions.
- respiratory-10 and respiratory-14 substantially duplicate question wording but have different numbering and annotations. Both supplied versions are retained as distinct source instances; downstream random practice should avoid over-weighting this duplication if its generator does not already deduplicate.
- DDS question numbers are clipped/unreliable; `fragment-N` is an explicitly local top-to-bottom identifier and `sourceNumber` says `not visible`. Its two cardiovascular questions remain transcribed and identified as outside respiratory scope. Both supplied fragments have `defaultEligible: false`.
- MidPul contains only Q34-40. Enlarged inspection confirms Q37 says 80%, not the OCR's 50%. Q36's third option is printed only as `Respiratory`; the implied bronchiole is explained in the note rather than fabricated in the option.

## Answer audit

Source highlighting, stars, circled selections and pencil strokes are unofficial. `providedKey` records only an identifiable selection; ambiguous/multiple marks remain null and are described. There are 171 identifiable source selections, of which twenty differ from defensible non-null audited answers. Further source-selected items are intentionally left unscored.

Important corrections include the Haldane effect (Tabiya physiology 7: A to C), the rightward oxygen-dissociation shift (September 5 physiology 16: B to C), and the DDS M3 bronchodilation, expiratory pressure and pneumotaxic-center selections. Clinical and numerical shortcuts retain explanatory limits: DRG questions use the traditional exam model while recognizing modern ventral rhythm-generating networks; the 80% FEV1/FVC value is not presented as an age-independent diagnostic threshold.

The unscored items are:

- 08: Q15, 17, 18, 30, 31.
- 10: Q13, 27, 36, 39.
- 11: physiology 18; anatomy 10; histology 2, 3, 4.
- 13: physiology 4, 13, 18; anatomy 11; histology 3, 4.
- 14: physiology 13; anatomy 5; histology 2, 5.

Reasons include missing standard options, more than one correct region or mechanism, obsolete/nonstandard `pneumocyte III` terminology, mixed anatomical definitions, and insufficient localization. Tabiya physiology 18 is visibly crossed out with the Persian annotation for deletion and offers no defensible reduced-consumption answer. No questions were repaired by inventing new choices.

For mechanisms not fully established by the local review, primary research was consulted: thyroid-hormone stimulation of fetal surfactant phospholipid synthesis ([Ballard et al., JCI, 1984](https://www.jci.org/articles/view/111507)) and hypoxia-induced acetylcholine/ATP release from human carotid bodies ([Kahlin et al., 2014](https://pubmed.ncbi.nlm.nih.gov/24887113/)). The two DDS cardiovascular facts were checked against the publisher's [OpenStax blood-flow chapter](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-2-blood-flow-blood-pressure-and-resistance).

## Verification

All seven JSON files parse. Every question has four transcribed options, a unique local identifier, subject, source image, audit explanation and review terms. All 46 preferred images are accounted for by questions or explicit excluded-content records. All source-image evidence paths resolve to actual archive files. No app integration or unrelated files were edited and no commit was created.

Remaining limitations are source limitations, not omitted transcription: 24 items cannot be assigned a reliable unique key, unofficial annotations do not establish an official answer key, and undated papers remain undated.

## Independent peer review of adjacent lanes

The second pass reviewed all question/option/answer records in imports 05, 06, 09, 12, 16, 19, 22 and 23, with all 35 scanned-paper pages and all 29 live practical figure crops inspected visually. The practical crops preserve original arrows and contain no answer ticks or highlighted choices. Source 19 Q8 visibly has bronchial wall cartilage; its supplied bronchus answer is consistent with the image. Source 16 Q14's original continuation page confirms the top-to-bottom choice order and trachea tick.

All 28 source-22 MCQ records were compared with their explicit source-05 matches; the content and option order agree after spelling/spacing normalization. The three filled radio selections (pages 3, 4 and 6) and the final four open responses were independently checked against their screenshots. Student names in browser chrome were not incorporated into prompts or treated as exam provenance. No dropped questions were identified in the reviewed records; cover-stated but absent questions remain documented source gaps.

Peer-review corrections: source 12 Q12's non-unique venous-RBC ion answer was withheld; source 23 Q63 was withheld because both wasted perfusion and approximately 5% of cardiac output are defensible descriptions; source 23 Q59 was withheld because its literal “elevate hypoxia” stem supports the proposed answer only after reversing the verb to “alleviate.” The original source-23 pages 8-9 were inspected for both latter decisions. Original printed options for source 06 Q30 and source 12 Q38 are now retained in `sourceOptions`, separately from explicitly disclosed editorial corrections used for practice. Source 23 ends with 56 keyed and 16 unscored items. After these fixes, no further blocking content issue was identified in this peer-review scope; the documented source ambiguities remain unscored.
