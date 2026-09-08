# Term 2 depth expansion and two-way anatomy

Implemented locally on 2026-09-07. This is original, source-mapped study practice, not a new past-paper bank or a guarantee of exam coverage.

## Start studying

Refresh the local app, open an exam's Anatomy trainer, then choose **Settings → Both directions → Start new test**. Existing saved sessions retain their questions until a new test is started.

- **Identify:** name the marked structure using four MCQ options.
- **Locate:** read a structure name, select its numbered hotspot or masked callout, and press **Submit location**. Keyboard users can focus and activate locations too.
- Learn reveals feedback after an answer. New Learn sessions use one target per source figure so full-figure exploration cannot disclose later sibling answers. Test mode can include multiple targets from a figure and reveals feedback after grading.
- Legacy sessions with repeated figures delay feedback until their sibling targets have been answered or the session is graded/reviewed.
- Locate questions remain in 2D before feedback; switching to an answer-highlighted 3D view is disabled until feedback. Afterward, the existing paired 3D target or clearly labeled regional context is available.
- Saved location responses are validated against the current image and scored from the saved region, not from a separately persisted answer letter.

The click targets are authored annotation boxes. On labeled textbook diagrams they are often the masked label/leader-line callouts. This is **not** pixel-level segmentation of every anatomical structure.

## New material in this expansion

| Exam | New authored questions | Core (1–3) | Challenge (4–5) | New reverse-location items |
| --- | ---: | ---: | ---: | ---: |
| CVS | 211 | 86 | 125 | 193 |
| Respiratory | 46 | 16 | 30 | 173 |
| Upper & lower limbs | 33 | 18 | 15 | 345 |
| Biochemistry II | 9 | 4 | 5 | 0 |
| Total | 299 | 124 | 175 | 711 |

Reverse-location items reuse existing annotated targets; they are a second retrieval direction, not 711 new anatomical concepts. The content expansion also adds 41 concept/QA groups and six reviewed Junqueira micrographs.

CVS histology increases from 28 to 107 questions; CVS embryology from 30 to 114. Current total records are CVS 968, respiratory 917, limbs 1,241, and biochemistry II 205. These totals include dynamic variants and both anatomy directions and must not be interpreted as distinct concepts.

The overview's Core/Challenge controls and theory-map filters use the final editorial difficulty ratings. These are not faculty-calibrated difficulty estimates.

## Evidence and review

Authoring lanes independently covered histology, embryology, anatomy, and physiology/biochemistry. Another agent reviewed each lane (the main agent reviewed anatomy). Reviews corrected source locators, scientific wording, unsupported course-scope claims, duplicate questions, difficulty inflation, and answer-position bias.

Reviewed source payloads are digest-pinned before import. The importer leaves clinical wording and keyed answers unchanged while promoting approved status, adding review provenance, and deriving Core/Challenge tags from the final reviewed difficulty.

See `data/term2/provenance/depth-expansion/manifest.json` and each lane's independent review, coverage, and source-gap records. Author self-check records remain historical artifacts; the independent report and digest-pinned gate are the final import approval.

## Remaining scope limits

- Book extensions are distinguished from material directly supported by a supplied lecture. A matched textbook topic alone does not prove that every tested detail appears in the course.
- No dedicated hand or lower-limb lecture set was found in the supplied source inventory used for this pass; those new anatomy items remain book extensions. Limb embryology is also an optional book extension, not confirmed exam scope.
- Additional respiratory physiology material and detailed pharyngeal lecture coverage were not established from the supplied files.
- Anatomy images retain their existing target-specific 3D versus regional-context distinction. This work does not claim a fully segmented, anatomically exact 3D equivalent for every 2D structure.
- The 518 existing final-exam records are preserved. No generated item was added to Term 2 Past Exams.

## Verification

The independent anatomy-code review approved the resolved feedback, restore-scoring, selection, and overlapping-pointer issues. Automated checks include rendered pre/post-feedback markup, actual rendered pointer/keyboard handlers, saved-session reconciliation, source/question/concept links, image hashes, and strict exam separation. Browser visual verification was not performed in this pass.

Final checks passed: `npm test` (83/83), `npm run vercel-build`, TypeScript, targeted ESLint, and `git diff --check`. The code review is preserved at `data/term2/provenance/depth-expansion/anatomy-location-code-review.md`.

Changes are local. No commit, push, or deployment was requested or performed for this pass.

The usual `vinext dev` runtime failed twice with `Network connection lost`. The already-built app is therefore running at `http://localhost:3000` with `npx next start --hostname 127.0.0.1 --port 3000`. Health, bank summary, new location questions in all three anatomy exams, and the six new micrographs returned successful HTTP responses. This fallback has no development hot reload; its health endpoint reports local Codex reasoning audits unavailable. The requested anatomy and question-bank features are served successfully.
