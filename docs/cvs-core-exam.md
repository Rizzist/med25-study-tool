# Core Exam — CVS

An anatomy-heavy revision composite of existing sourced past-paper questions, **not a newly invented past examination**. First-position gold card in CVS → Final Exam. A subtle shine respects reduced-motion preferences.

| Scope | Questions |
|---|---:|
| Anatomy | 50 |
| Physiology | 25 |
| Embryology | 10 |
| Blood & immunity | 8 |
| Histology | 7 |
| Total | 100 |

Anatomy 50 is also available separately. Both reuse the existing instant/deferred feedback, source provenance, locally saved attempts/results, and subject/topic weakness reporting. Core attempt IDs are distinct from individual-paper and aggregate attempts.

## Selection and evidence

The selection is manually curated for a spread of core knowledge and recurring anatomy concepts. All entries retain original question IDs, source pages, answer provenance and explanations where available. No unresolved questions are substituted to reach 100.

Historical topic coverage counts six dated theory sources: April/September/October 2021, May 2022, January 2023 and February 2025. Each topic counts once per paper. IUMS/IZAM collections, practicals, undated fragments and alternate file copies do not inflate that denominator. Some core questions are selected from undated TUMS fragments to cover additional anatomy; their displayed recurrence still refers to the six-paper **topic**, not that exact wording.

The archive is small, non-random and not a calibrated prediction dataset. A topic appearing in 6/6 papers is not a 100% probability for the next examination. No claim is made that 20–30 questions will repeat. Learn the relationship behind each answer, particularly if the examiner changes the wording or choices.

## Regeneration

- Selection: `data/cvs-core-selection.json`
- Generator: `node scripts/content/build-cvs-core.mjs`
- Generated evidence/manifest: `public/study/cvs-past-papers/core-exam.json`
- Runtime composition: `src/lib/mcq/cvs-core-exam.mjs`
- Integration: `src/components/CvsPastExams.tsx`

The manifest is separate from the historical paper catalog, so adding Core Exam cannot masquerade as a newly discovered past paper or alter raw paper totals.
