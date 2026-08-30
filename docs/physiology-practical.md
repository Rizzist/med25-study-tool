# Term 2 physiology practical

Open `/?exam=term2-physiology-practical`. The new exam is isolated from Respiratory and the Term 1 banks.

Nine source-based stations cover BP, heart sounds, ECG, spirometry, RBC count, WBC count, differential count, hematocrit, and bleeding/clotting times. The expanded bank has **320 MCQs**, including the original 72 plus 248 additional questions in 62 focused theory sets. There are 98 mapped objectives, 30 image questions, 56 new calculation cases, 29 unchanged course figures and 12 external YouTube links. All 198 pages/slides in eight source files were inspected visually as well as through text extraction.

| Station | MCQs | New theory sets |
|---|---:|---:|
| Blood pressure | 40 | 8 |
| Heart sounds | 28 | 5 |
| ECG | 52 | 11 |
| Spirometry | 40 | 8 |
| RBC count and microscopy | 36 | 7 |
| WBC count | 28 | 5 |
| Differential count | 32 | 6 |
| Hematocrit | 28 | 5 |
| Bleeding/clotting time | 36 | 7 |

The organized local source pack is in `Documents/MED SLIDES/TERM 2/08 Physiology Practical`. It contains one copy of each unique source, numbered in study order, plus a correction sheet. Originals were preserved. Raw slide decks, PDFs and downloaded videos are not added to the repository.

## Study behavior

- Question-first view with focused sets, previewable prompts (no answer keys), 20-question sprints and full-station practice/mocks. Search within a station and filter new, unattempted, repair, image or new calculation questions.
- Understand/rehearse, figures/video, and recall/coverage views remain available for each station.
- Videos load only on deliberate selection, with an external YouTube fallback. Video metadata was checked, not every frame audited.
- The station checklist is device-local and separate from attempted-question, wrong-answer and flag history.
- Learning mode gives immediate option explanations; mock mode withholds them until grading. A 36-question mixed mock selects four per station. Exact question sets survive session resume.
- The practical date (31 August 2026) is user-reported, not an official timetable.

## Content and limitations

`data/term2/physiology-practical-source.mjs` preserves the original station lessons and 72 questions. `data/term2/practical/` contains the expanded hand-authored theory bank, source inventory and page-audit dispositions. Run `npm run physiology:generate` after edits, then rebuild the embedded bank. The generated catalog and coverage report connect every objective to its questions. Original IDs, option labels, correct answers and explanations are regression-tested against `tests/fixtures/physiology-practical-v1.jsonl` so saved answers retain their meaning.

Source inconsistencies are taught explicitly: BP inflation/valve-area/inter-arm errors, ECG territory errors, Neubauer dimensions, plasma versus serum, spirometry slide 22's reversal of the reduced-TLC concept, course-only reference conventions, g versus rpm, BT screening limitations, and the unresolved clotting-time timer/checking interval. Blood-based procedures require trained supervision and institutional SOPs.

The page-by-page audit distinguishes mapped content from decorative/title pages, background history, correction-only notes, unavailable embedded video and limited unkeyed examples. ECG pages 31–44 contain real traces over unrelated hidden vendor text; the text was excluded, the visual material audited, and no new patient-labelled trace was republished. Additional rhythm questions use clean, unlabelled course strips and observable features, not invented official diagnoses. The final spirometry trace still has no reliable exact numerical key at the displayed resolution; all requested calculation types are tested with explicit calibrated values, including a verified lookup from the course's predicted-VC table. Historical dates and the full developmental hematopoiesis chronology are not exhaustively tested. An official station blueprint and rubric remain unavailable: this is extensive source-based practice, not a guarantee of exhaustive exam coverage or an official past-paper bank.

## Validation

`npm run bank:validate`, `npm run lessons:validate`, `npm run deploy:validate`, TypeScript, both builds and `node --test tests/*.test.mjs` check data, objective coverage, exam isolation, balanced mocks, resume order, media routes, and rendered lesson panels. No browser visual or interaction QA was requested.
