# Religion question bank — local handoff

Updated 2026-09-15. Exam ID: `term2-religion`. This implements the user's request for review-based practice and genuine-paper finals. It does not publish, commit or push the project, alter the atlas, scrape Telegram, or change the Religion Review PDF.

## Completed

| Area | Result |
| --- | --- |
| Practice | 75 original MCQs, 3 per each of the 25 teaching modules in the expanded review |
| Practice feedback | Explanation for the correct answer and every distractor; balanced A–D keys; review PDF page and reference locators |
| Practice modes | Topic sets or all topics; immediate teaching or feedback after grading; existing wrong/flagged repair and saved results |
| Final Exam | 89 scored original items; stems and option order preserved, with source-reviewed editorial keys |
| Full source archive | All 180 occurrences, searchable/filterable by paper, with four original PDFs, answer/correction notes and source-review progress |
| Unscored source items | 65 ambiguous, imprecise or insufficiently verified originals retained with notes, never automatically graded |
| Repeated copies | 26 occurrences retained without extra scored weight; all 20 February occurrences plus six A-paper repeats |
| Original media | D100's embedded Quranic verse restored to its image question and source archive |
| Exam isolation | Religion has its own subject, exam tag, final-bank descriptor and progress keys; practice cannot import final-paper IDs |
| Responsive presentation | Topic grid and source archive collapse to one column at 760px; controls have at least 44px targets, visible keyboard focus and readable text |

The original paper labels and marks are not official university keys. Source review is an editorial comparison against the available review and its identified references, not independent certification by a lecturer. Coverage of these materials is not an exam guarantee.

## Per-paper reconciliation

| Paper | All occurrences | Scored | Ungraded originals | Repeated copies |
| --- | ---: | ---: | ---: | ---: |
| O — original 40-item paper | 40 | 35 | 5 | 0 |
| D — 100-item compilation | 100 | 44 | 56 | 0 |
| A — Introduction to Religion, 2021/6/21 | 20 | 10 | 4 | 6 |
| F — February, year unconfirmed | 20 | 0 | 0 | 20 |
| Total | 180 | 89 | 65 | 26 |

The duplicate policy identifies repeated source items, not every paraphrase of a concept. Legitimately different questions about the same concept may still be scored.

## Review map

Page numbers are PDF counters in the 41-page Religion Review, not book folios. Archive counts include repeats.

| Teaching module | Review page | Practice | Scored source items | All source occurrences |
| --- | ---: | ---: | ---: | ---: |
| Lexical and terminological definitions | 6 | 3 | 1 | 1 |
| Four introductory interpretations | 7 | 3 | 0 | 0 |
| Course definition of din | 7 | 3 | 1 | 1 |
| Beliefs, practice and structure | 8 | 3 | 4 | 4 |
| Religious inquiry | 9 | 3 | 6 | 6 |
| Benefits, support and responsibility | 11 | 3 | 8 | 9 |
| Taqdir, qada and knowledge records | 12 | 3 | 1 | 2 |
| Human agency and divine dependence | 13 | 3 | 2 | 2 |
| Infallibility: scope and agency | 14 | 3 | 5 | 5 |
| Infallibility: arguments | 15 | 3 | 3 | 3 |
| Infallibility: objections | 16 | 3 | 0 | 2 |
| Opposition to prophets | 18 | 3 | 2 | 2 |
| Noah: verse versus report | 18 | 3 | 2 | 3 |
| Religion, sharia and functions | 19 | 3 | 6 | 20 |
| Attributes and justice | 21 | 3 | 3 | 6 |
| Revealed unity and finality | 22 | 3 | 11 | 18 |
| Pluralism, tolerance and salvation | 23 | 3 | 4 | 16 |
| Faith, intention and degrees | 24 | 3 | 2 | 6 |
| Present life and the Hereafter | 25 | 3 | 2 | 5 |
| Biography: childhood and family | 26 | 3 | 7 | 10 |
| Revelation, invitation and migration | 27 | 3 | 6 | 16 |
| Scripture foundations | 28 | 3 | 7 | 15 |
| Jesus, Mary and comparative claims | 29 | 3 | 4 | 13 |
| Thaqalayn and authority | 30 | 3 | 2 | 8 |
| Religious ethics and medical items | 31 | 3 | 0 | 7 |

## Important corrections and limits

- D11: source sheet C becomes reviewed A. The asserted common foundation is monotheism, not monotheism plus polytheism.
- D60: source sheet C becomes reviewed A. Paraclete/helper/advocate/comforter terminology is not lexically identical to “the praised.” Confessional interpretation is a separate issue.
- A11: highlighted D becomes reviewed B. Putting things in their proper place is the general justice definition; a particular allocation by capacity is an application.
- A20/F20: the original psychological-function classification is preserved in notes, with noetic/psychological overlap explained; no forced replacement key.
- “Demise of the Holy Quran,” two Bibles versus two Testaments, ascension versus resurrection, unnamed faith stages, and disputed biographical/hadith details are not silently rewritten into apparently original exam questions.
- Salvation, doctrinal truth and freedom/tolerance are separated. No blanket individual salvation/condemnation verdicts or group judgments are inferred.
- Medical religious-ethics items remain condition-qualified study material, not operational medical/legal advice; the source does not establish universal permission or liability immunity.
- The four introductory interpretations and some objection topics have practice even where no reliable scored past-paper discriminator exists.

## Editable sources and regeneration

All paths below are relative to this repository.

- `data/religion/sources.json`: frozen import; all source stems/options, raw source evidence, review module content and references, paper hashes and duplicate links.
- `scripts/import-religion-sources.py`: optional reimport from the user's local review `_build` folder. It is not run in ordinary application builds.
- `scripts/content/religion-practice.mjs`: authored practice questions and option-specific teaching.
- `scripts/content/religion-past-papers.mjs`: explicit editorial decisions. A null key means ungraded, never “use the supplied key automatically.”
- `scripts/build-religion.mjs`: validates source coverage and produces the two banks and catalog. `node scripts/build-religion.mjs --check` detects stale generated artifacts.
- `data/bank/questions/term2-religion.jsonl`: practice only.
- `data/final-exams/religion-past-papers.jsonl`: scored original items only.
- `data/religion/catalog.json`: module roster, all-paper archive and correction notes consumed by the UI.
- `public/study/religion/`: unchanged source PDFs and recovered original verse image.
- `scripts/build-embedded-bank.mjs`: runs the Religion generator and includes practice/finals in distinct embedded containers.
- `src/components/ReligionExam.tsx`: topic practice and full source archive; the shared `FinalExam` provides scored sessions.

Run `npm run religion:generate` after an editorial content change, then rebuild the embedded bank/application. Change question revisions when a keyed answer or grading-relevant wording changes. Original files/choice order must not be overwritten to hide a correction. Add new papers only after establishing their provenance and preserving their original question occurrences.

## Verification record

- Question schema, global IDs, correct-key membership, original option order and media existence: passed.
- All 180 source occurrences and original-PDF SHA-256 checks: passed.
- Every practice module represented; each distractor rationale remains attached to its option after key rotation: passed.
- Corrected keys and withheld cases have regression assertions: passed.
- Religion, Nutrition and Term 2 integration suite: 30 tests passed.
- TypeScript no-emit check: passed.
- Scoped new-file ESLint: passed.
- Full bank validation: 11,760 questions including 664 final items; passed.
- Deployment asset validation: passed. This is a consistency check, not a deployment.
- Sites build workflow: passed; existing large-chunk and route-classification warnings remain.
- Live local bridge: Religion summary 75 practice / 89 scored; final API and original verse image return 200.
- Live MED25 `localhost:3000/?exam=term2-religion`, four source PDFs and verse image: HTTP 200 after restarting the stalled development server.
- No interactive browser/screenshot inspection was performed this turn. Responsive layout and affordances were checked in implementation and static tests, not claimed visually certified.

## Future work requiring more evidence, not silently completed

- Official lecturer keys or clarifications for the 65 ungraded originals.
- Specific references for unnamed classifications and attributed narrations, and a confirmed course blueprint/date.
- Browser interaction/visual review if requested.
- Commit, push or deployment only on the user's request.
