# Wrong-answer review

Implemented locally, 21 September 2026.

| Area | Status |
| --- | --- |
| Religion, nutrition and Term 1 past papers, including combined selections | Implemented |
| CVS past papers, combined selections, Core and Non-core | Implemented through the shared CVS results component |
| Completed practice sprints and saved practice results | Implemented |
| Redo all originally wrong answers or one review section | Implemented |
| Fullscreen retry, instant feedback and save/resume | Implemented |
| Original score and original green bars unchanged | Verified in unit and browser checks |
| Separate yellow review bars beside original bars | Verified in rendered HTML and browser |
| Persistent review state, attempt isolation and content invalidation | Covered by regression tests |

## Semantics

- Wrong means **answered, gradable and incorrect in the original attempt**. Skipped and ungraded items are not included. Manually marked items without a usable automatic key are disclosed but not auto-scored.
- The green bar retains original section accuracy (correct / answered and graded).
- The yellow bar is **latest review answers correct / originally wrong, retryable items in that section**. Unreviewed items remain uncorrected. The count reviewed is shown separately. This is repair progress, not a replacement exam percentage.
- Starting another review clears that run's answer locks, not the original attempt. The latest reviewed answer for each question replaces its prior review result; duplicates never add extra credit.
- Saved partial runs can be resumed. Finishing a review returns to the original result; exiting early preserves the run.
- Starting a new original attempt gets separate review state.

## Implementation

- `src/lib/mcq/wrong-answer-review.mjs`: pure eligibility, adapters, serialization, grading and summary functions.
- `src/components/WrongAnswerReview.tsx`: shared fullscreen review controller. It only writes `med25-wrong-review-v1:<encoded attempt identity>` in localStorage; no writes to original exam, CVS or practice records.
- `src/components/CourseReview.tsx`: original and yellow review comparison, per-section retry.
- Content signatures include prompt, options, accepted keys and revision. Changed entries lose stale review answers without discarding unaffected entries.
- Generic question media remain supported, including image-location questions, audio and video. Existing accepted alternative answers and inferred-answer colors are retained.

## Verification

- `npm run mcq:check`: 68 regression tests, including eight new review tests.
- `npm run vercel-build`: production build/type check passed.
- Isolated production browser at `127.0.0.1:3100` (not the user's localhost:3000 study storage):
  - February Religion: original 6/20, 30% unchanged after per-section and all-wrong reviews.
  - Originally 0/1 section remained 0/1; yellow review became 1/1, 100%.
  - Partial 14-item review survived reload with 1/14 run answers and two corrected items across runs.
  - CVS ten-item paper: one incorrect answer and nine skipped; retry included exactly one. Correcting it left the original 0% untouched.
  - Existing saved practice report opened the new panel and correctly excluded its skipped question.
  - A fresh one-question practice attempt remained 0% after its retry was correct; its separate yellow section bar showed 100%.
  - No browser console errors during these checks.

No commit or push was requested for this change.
