# Practice crash audit — 2026-09-21

## Cause

The setup-screen subject lookup in `Home` used `useMemo` below the active and
review early returns. Entering either screen skipped that hook, causing React
error 300 (rendered fewer hooks than expected). This was reproduced by clicking
Start practice on the deployed site; the console matched the reported stack.

## Fix

- Move the memoized subject lookup above both early returns. The lookup and
  review-topic mapping are unchanged; every screen now runs the same hooks.
- Audit hook order throughout `app` and `src` using the existing ESLint rules.
- Add a negative regression fixture that proves the guard detects this exact
  setup/active/review mistake.
- Run the guard in MCQ tests and both production build commands, including
  `vercel-build`. TypeScript/build compilation alone did not catch this error.

## Verification

- 57 MCQ checks passed, including the two hook-order checks.
- Nine PDF-cache tests passed.
- `npm run vercel-build` passed, including content/asset checks and TypeScript.
- Computer-use checks against the optimized local production build passed:
  setup → practice, option selection and immediate feedback, next question,
  finish → section review, return to setup, reopen saved review, test-mode
  start, reload → resume. No console errors in the fixed test tab.
- Browser verification used a separate local origin on port 3100 so the
  user's localhost:3000 study progress was not changed.

No question content, grading rules, saved-data formats, or UI design changed.
