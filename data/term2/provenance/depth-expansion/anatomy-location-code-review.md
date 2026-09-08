# Independent code QA: two-way anatomy location mode

Reviewed 2026-09-07 by `/root/anatomy_depth`. Repository was inspected read-only; no repository or browser automation was used.

## Outcome

The reverse questions are generated and integrated, and the focused test suite passes, but the current implementation should not be treated as a full pass. I found one high-impact answer leak, two medium scoring/selection defects, and one lower-frequency hit-testing defect.

## Findings

### High — Learn-mode feedback leaks answers for later questions from the same figure

`selectAnatomySession` deduplicates only the exact `imageId:targetRegionId` pair and then deliberately cycles back through the same figure for other targets (`src/lib/anatomy3d/visual-session.mjs:20-34`). The main Term 2 selectors do the same exact-target-only deduplication (`src/lib/mcq/term2-selection.mjs:54-60`; `src/lib/mcq/respiratory-selection.mjs:41-49`). After any answer in Learn mode, `AnatomyImage` reveals a named button and description for **every** annotated region, not just the current target (`src/components/AnatomyImage.tsx:20-23,39-45`). `AnatomyTrainer` defaults to Learn mode and reveals immediately after an answer (`src/components/anatomy3d/AnatomyTrainer.tsx:44,87`).

This makes later sibling questions answerable from prior feedback. It is not hypothetical: the default 30-question trainer session has 11 repeated-image questions in CVS, 10 in respiratory, and 8 in limbs. In 50 deterministic 30-question main-bank dynamic-anatomy samples, every run repeated figures (median duplicate-image counts: CVS 13, respiratory 19, limbs 12).

Suggested resolution: in Learn mode, either allow at most one target per `imageId` per session, or reveal only the current target until the session ends. Exam mode can safely retain sibling targets because feedback is delayed until grading.

### Medium — Restored location scores can disagree with the restored location

`parseAnatomySession` restores the saved option ID independently of the saved region and never checks that `locationOptionId(question, regionId)` equals the saved answer (`src/lib/anatomy3d/visual-session.mjs:61-65`). A saved record containing answer `A` and a valid wrong region restores both, so the trainer counts it correct even though the displayed saved location is wrong (`src/components/anatomy3d/AnatomyTrainer.tsx:85-87`). If the region is invalid, the location is discarded but answer `A` remains and is still counted as correct.

Focused reproduction against the current catalog:

- saved `A` + wrong valid region: restored answer `A`, restored wrong region, expected derived outcome `B`;
- saved `A` + unknown region: restored answer `A`, no restored region, expected invalid/outside outcome.

The main sprint has the analogous trust path: `cleanAnswers` accepts `selectedOptionId` and `selectedRegionId` independently (`app/page.tsx:191-208`), `answerForQuestion` returns the saved record unchanged (`app/page.tsx:336-339`), and scoring checks only the option ID (`app/page.tsx:419-421`).

Suggested resolution: once the question is available, validate the region against the question's own anatomy media and recompute the outcome from that region. Reject both fields when no valid region exists; never restore a location question's score from `selectedOptionId` alone.

### Medium — “Start in 3D” with mixed direction silently drops eligible identification targets

`selectAnatomySession` resolves the identify/locate pair by exact-target deduplication before it applies the 3D-format filter (`src/lib/anatomy3d/visual-session.mjs:16-23,37-39`). If the shuffled locate variant wins, the identify counterpart is removed by `seen`, then the locate variant is discarded because it cannot start in 3D. The target disappears even though a valid paired identification question exists.

Across eight deterministic full-pool checks, `format: "3d", direction: "mixed"` returned only 345–377 image targets, while the same seeds with `direction: "identify"` returned 547. Standalone model questions can conceal the shortfall at small requested counts, but the paired image target coverage is still randomly reduced.

Suggested resolution: apply the direction/format eligibility rule before target deduplication, treating `format: "3d"` as identify-only for paired 2D questions, or explicitly substitute the identify counterpart when a locate variant wins.

### Low — Overlapping hotspot clicks bypass the authored nearest-center resolver

`regionAtPoint` defines deterministic overlap handling by nearest center (`src/lib/mcq/anatomy-location.mjs:6-10`), but the rendered hotspot buttons each stop propagation and directly select their own region (`src/components/AnatomyImage.tsx:28-30,35-38`). In an overlap, normal pointer input therefore selects whichever button is topmost in DOM order, not the nearest-center result that the unit test covers.

The current source catalog has 19 overlapping hotspot pairs, including femoral artery/profunda femoris, left hilum/bronchial arteries, and adjacent basal bronchi. The overlaps are generally small, so this is lower frequency, but a click in one can be scored differently solely because of annotation order.

Suggested resolution: route pointer selection through one coordinate-based stage handler even over hotspot elements, or have hotspot handlers compute the same coordinate resolver before saving. Preserve neutral keyboard labels separately.

## Confirmed passes

- `node --test tests/anatomy-location.test.mjs`: 5/5 tests passed.
- `node scripts/build-anatomy-location.mjs --check`: output is current; 711 name-to-location questions.
- Embedded bank contains all 711 reverse questions with unique IDs: 193 CVS, 173 respiratory, 345 limbs.
- All 711 are present in their exam question indexes and referenced by concept objectives.
- Pre-feedback 2D markup uses neutral numbered hotspot labels, hides the correct marker and named region list, and disables pre-feedback 3D switching for locate questions.
- Exact identify/locate counterparts for the same target are not placed in one selected session.

## Test gaps worth adding with a fix

1. A Learn-mode session must not expose a named region that will be tested later from the same image.
2. Restored location outcomes must be derived from the restored region, including malformed and stale records.
3. Mixed-direction 3D selection must retain every otherwise eligible paired identification target.
4. A rendered pointer event in overlapping boxes must agree with `regionAtPoint`, not DOM order.

## Final resolution review — approved

Re-reviewed the latest implementation read-only on 2026-09-07. **All four findings above are resolved; no blocker remains.**

### Resolution evidence

- **Learn-mode figure leak: resolved.** New Learn sessions deduplicate by `imageId` in the trainer, general Term 2 selector, and respiratory selector. Exam sessions still deduplicate by physical target, which is safe because feedback is delayed. `canRevealAnatomyFigure` also protects resumed or explicitly assembled legacy sessions: full-figure feedback remains closed until every sibling target on that figure has an answer.
- **Restored scoring mismatch: resolved.** `restoredLocationResponse` validates the region against the question's own anatomy media and derives the option outcome from that region. The trainer parser ignores the separately stored location answer. The main app normalizes restored location answers the same way and `selectedOptionId` derives location scoring from `selectedRegionId`, so a stale saved `A` cannot override a wrong or invalid saved region.
- **Mixed-direction 3D target loss: resolved.** 3D format eligibility is now applied before target deduplication. For the tested seeds, mixed-direction 3D selection returns the same complete physical-target key set as identify-direction 3D selection and contains no locate variants.
- **Overlapping hotspot hit testing: resolved.** Pointer clicks on hotspot buttons bubble to the stage and use `regionAtPoint`; keyboard/synthetic activation with `detail === 0` stops at the focused button and selects that numbered hotspot. The rendered-handler regression test demonstrates the important overlap case: a pointer click on a topmost small box resolves to the nearer wide-box center, while keyboard activation selects the focused small box. This pointer-versus-keyboard distinction is intentional and appropriate because keyboard activation has no image coordinate. I found no remaining real defect in this path.

### Final verification

- `node --test tests/anatomy-location.test.mjs tests/anatomy-visual.test.mjs`: **16/16 passed** (9 anatomy-location tests and 7 anatomy-visual tests).
- `node scripts/build-anatomy-location.mjs --check`: passed; generated 711 name-to-location questions and reported current output.
- Direct source inspection confirmed the fixes in `anatomy-location.mjs`, `visual-session.mjs`, `AnatomyImage.tsx`, `AnatomyTrainer.tsx`, the main app resume/scoring path, and both Term 2 selectors.
- Repository remained read-only during both review rounds.

**Final result: APPROVED.**
