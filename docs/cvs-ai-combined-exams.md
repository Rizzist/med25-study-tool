# CVS AI answer review and combined exams

Implemented 18 September 2026. Original papers, keys, IDs and fingerprints are unchanged.

## Coverage

| Paper | Supplied-key items | AI-proposed answers | Unresolved |
| --- | ---: | ---: | ---: |
| April 2021 | 99 | 1 | 0 |
| September 2021 | 98 | 1 | 1 |
| October 2021 | 96 | 4 | 0 |
| Practical 2021 | 12 | 2 | 0 |
| May 2022 | 0 | 80 | 9 |
| January 2023 | 0 | 81 | 19 |
| February 2025 | 0 | 91 | 8 |
| Undated histology-first | 0 | 85 | 15 |
| Student paper filename 2023 | 0 | 86 | 13 |
| Photographed Q1–91 | 0 | 80 | 11 |
| Answered Q1–50 fragment | 50 | 0 | 0 |
| **All** | **355** | **511** | **76** |

All 587 non-source-keyed/flagged items were researched and reviewed by a second AI agent in three crossed lanes. This is AI educational review, not faculty certification or an official university answer key. Sources, confidence and qualifications are included per item. Ambiguous or incomplete items remain ungraded; some explain the likely intended convention without asserting a uniquely correct answer.

There are 55 source-checked transcription corrections in the integrated data: 54 involving choices and one prompt-only repair. Corrections are displayed as overlays. Original PDFs, transcripts and `paper.json` files remain unchanged.

## Data and maintenance

- `public/study/cvs-past-papers/ai-answers.json`: editable review overlay, revision, explanations, references, confidence, reviewer and review status.
- `ai-summary.json`: chooser totals, checked against the overlay by the test suite.
- `docs/cvs-ai-review-{a,b,c}.md`: independent answer-review logs and changes.
- Each overlay carries SHA-256 of `JSON.stringify({prompt, options, issues})` for the original question. Stale or unreviewed annotations do not apply.
- Only source-verified `correctedOptions` / `correctedPrompt` may alter displayed text. Old answers/self-marks to changed question text are invalidated; unrelated answers are retained. A failed overlay load cannot overwrite corrected-choice attempts.
- Source keys have priority over AI proposals. No AI-generated question stems were added to Final Exam.

## Experience

- Supplied-key grading stays pale green/red; AI grading is deep green/red with explicit text labels, explanations and reference links. Color is not the only distinction.
- Select any subset or Select all (11 papers, 942 items) for one continuous session. Source paper, original number and source links stay attached to each question. Repeated questions across different papers are deliberately retained.
- Combined IDs are stable for each paper set. They have independent attempts/latest results in the existing device-local store; single-paper progress is untouched. Saved combined sessions can be resumed after reload.
- Instant teaching and mark-at-end modes both work. First committed responses stay locked; review does not inflate the score.
- Section reports aggregate original topic mappings across all selected papers. They show weak subjects, exact review headings, wrong/unanswered/unresolved questions, and filtered review links.
- Section accuracy uses answered graded items; source/AI matching totals and self-marks remain separately labeled. Untested content is not represented as mastered.

## Verification

- Independent code reviewer found and verified fixes for symmetric correction migration, stale self-mark totals, and malformed combined-session metadata. Final verdict: SHIP.
- 31 focused tests: original source preservation, full 587-entry review/hash coverage, source precedence, unresolved exclusion, correction migration (including prompt-only repairs), combined identity/persistence, and section counts.
- Browser checks at desktop and 390px mobile: Select all gives 942; selected two-paper session gives149; deep-color AI grading and pale source grading differ; original source attribution survives paper boundaries; section report and wrong-answer drill function.
- Build/deployment checks are recorded in the task handoff after completion.

## Boundaries

76 items need clearer scans, corrected faculty wording or a defensible faculty key before automatic marking. They remain available for study, with explanations, and are never silently assigned forced answers. Supplied keys themselves remain supplied marks rather than independently medically verified official keys.
