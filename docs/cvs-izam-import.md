# CVS import — IZAM — 19 September 2026

## Delivered

| Addition | Questions with worked answers | Provenance |
|---|---:|---|
| IUMS circulation test (IZAM) | 24 | IUMS online-test screenshots, 14 December 2021 |
| IUMS cardiac physiology set A (IZAM) | 13 | IUMS screenshot collection; not claimed as a complete sitting |
| IUMS cardiac physiology set B (IZAM) | 10 | Separate IUMS screenshot collection |
| Cardiac physiology ionic/ECG fragment (IZAM) | 11 | Supplied test panels; institution/date not visible |
| CVS & blood mixed fragments (IZAM) | 12 | Mixed photographed exam pages, not one reconstructed sitting |
| Existing February 2023-semester paper, clearer copy (IZAM) | 11 recovered answers within the existing 99 questions | Reconciled against the new ordered PDF; not added twice |

The five additions contain **70 playable questions**, each with a chosen answer, explanation, source image, and review-topic mapping. No default answer letters are used. They enter the existing individual-paper and combined-paper interfaces through the catalog. Total catalog: **16 papers/fragments, 1,012 questions**.

IUMS is Iran University of Medical Sciences, not TUMS. These entries are explicitly identified as supplied test fragments. The question bank does not invent a university, sitting date or official answer key.

The clearer 2023-semester PDF supplies all 99 MCQ stems/options. Its cover also lists eight short answers that are absent from the supplied pages. Its semester label conflicts with a printed 2021 date, so neither is silently treated as an unambiguous examination date. Original question IDs remain unchanged. Corrected question text uses the existing correction-revision mechanism; responses attached to changed wording may need re-answering.

## Download reconciliation

The inspected batch contained 33 downloaded files. Fifteen were byte-identical to files already archived; six more repeated a copy in the same batch. The remaining twelve distinct PDFs were compared by content as follows:

| File | Disposition |
|---|---|
| `2023Cardiovascular_CVS#.pdf` | Clearer copy of the existing 99-question student paper; restore cropped content/answers, no duplicate paper |
| `Heart physiology past exam (1).pdf` | New set A, 13 answerable questions |
| `circulation (1).pdf` | New circulation set, 24 answerable questions |
| `فسلجة قلب.pdf` | New set B, 10 answerable questions |
| `اسئلة-فسلجة-قلب (1).pdf` | New ionic/ECG set, 11 answerable questions |
| `New Document(27) (1).pdf` | New CVS/blood subset, 12 answerable questions |
| `Sajid CVS.pdf` | Alternate copy of the existing 17 April 2021 report |
| `cardio.pdf` | Alternate copy of the existing 22 October 2021 report |
| `Sarmad CVS.pdf` | Alternate copy of an existing unconfirmed reference collection; not reclassified as a final |
| `Cardio vascular system answer key ppt.pdf` | Correction/reference deck for the existing student paper; markings are not automatically trusted |
| `MCQ CVS.pdf` | Generic question bank without examination provenance; archive/reference only |
| `Photo.pdf` | Flashcard collection, not a past examination; archive/reference only |

All twelve unique originals and their OCR transcripts are copied into the local medical archive under `Past Exams/IZAM - 2026-09-19/`, one source directory each. New test collections have a combined `Exam - Questions and Answer Key.md`. Downloads are preserved: nothing was deleted or moved out of Downloads. Existing matched files remain where already organized.

Full originals and account/toolbars stay local. Public question images are cropped to the question panels; full screenshot collections and PDFs containing account details are not published.

## Answer decisions and exclusions

Answers were worked against the source wording and the existing CVS course/book review, with physiology references for the new material. The answer overlay distinguishes these teaching answers from original supplied marks. They are not an official university key or independently human-certified answers.

- Original marks can be wrong: the supplied correction deck labels capillaries as the location of greatest velocity; the appropriate general-systemic answer is the aorta. Its mark was not copied.
- Ambiguous, defective, incomplete or non-CVS questions remain in each source's local transcript and exclusion list, rather than being assigned an arbitrary key.
- Examples include a context-free edema-pressure threshold, questions offering several valid preload measures, and an erroneous claim that adult humeral marrow cannot produce erythrocytes.
- Two pre-existing questions in the repaired 99-item paper still lack a defensible unique answer: the sign-ambiguous potassium-equilibrium-potential item and an item asking for fibrocartilage when none of its joint options fits. These remain ungraded, not falsely keyed.
- Source numbers, missing numbers and duplicate pages are preserved/documented. Similar concepts in genuinely different question wordings are not silently removed.

## Regeneration and scope

- `data/cvs-izam-import.json`: manually selected source questions, worked keys, explanations and exclusion decisions.
- `data/cvs-izam-clear-2023.json`: clearer-copy transcription and the eleven answer repairs.
- `scripts/content/import-cvs-izam.py`: reproducible local import from the preserved OCR workspace.
- `public/study/cvs-past-papers/`: generated catalog, source panels, paper transcripts, answer overlays and topic mappings.
- `izam-reference-guide.md` in that public directory: existing course/book locators and review pointers.

Repeated “AI graded/proposed” labels were removed and answer feedback changed to gentler green/red shades in the preceding commit. Expandable provenance remains available. Mobile, progress, grading, UI and build checks were **not rerun**, as requested. Test count fixtures were updated for the new catalog but not executed.
