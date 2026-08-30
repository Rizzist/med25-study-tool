# Term 2 physiology practical

Open `/?exam=term2-physiology-practical`. The new exam is isolated from Respiratory and the Term 1 banks.

Nine source-based stations cover BP, heart sounds, ECG, spirometry, RBC count, WBC count, differential count, hematocrit, and bleeding/clotting times. There are 36 revision objectives, 72 newly authored MCQs (nine image questions), 16 unchanged course figures and 12 external YouTube links.

The organized local source pack is in `Documents/MED SLIDES/TERM 2/08 Physiology Practical`. It contains one copy of each unique source, numbered in study order, plus a correction sheet. Originals were preserved. Raw slide decks, PDFs and downloaded videos are not added to the repository.

## Study behavior

- Understand/rehearse, figures/video, and recall/coverage views for each station.
- Videos load only on deliberate selection, with an external YouTube fallback. Video metadata was checked, not every frame audited.
- The station checklist is device-local and separate from attempted-question, wrong-answer and flag history.
- Learning mode gives immediate option explanations; mock mode withholds them until grading. A 36-question mixed mock selects four per station. Exact question sets survive session resume.
- The practical date (31 August 2026) is user-reported, not an official timetable.

## Content and limitations

`data/term2/physiology-practical-source.mjs` is the authored source of truth. Run `npm run physiology:generate` after edits, then rebuild the embedded bank. The generated catalog and coverage report connect every objective to its questions.

Source inconsistencies are taught explicitly: BP inflation/valve-area errors, ECG territory errors, Neubauer dimensions, plasma versus serum, spirometry course-only conventions, and the unresolved clotting-time timer/checking interval. Blood-based procedures require trained supervision and institutional SOPs. An official station blueprint, rubric and some exact laboratory conventions remain unavailable; this is not a claim of exhaustive exam coverage or an official past-paper bank.

## Validation

`npm run bank:validate`, `npm run lessons:validate`, `npm run deploy:validate`, TypeScript, both builds and `node --test tests/*.test.mjs` check data, objective coverage, exam isolation, balanced mocks, resume order, media routes, and rendered lesson panels. No browser visual or interaction QA was requested.
