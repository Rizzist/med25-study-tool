# CVS course portions

Implemented 8 October 2026. Independent implementation/review loops: SHIP for the shared classifier, practice/API persistence, past-paper sessions/exports, and scoped review PDF.

| Content | All | Physio | Non-Physio |
| --- | ---: | ---: | ---: |
| Live practice questions | 929 | 135 | 794 |
| Past-paper source records (including ungraded) | 1,012 | 602 | 410 |
| Automatically gradable source records | 947 | 563 | 384 |
| Core Exam | 183 | 89 | 94 |
| Existing Non-core Anatomy | 119 | Not shown | 119 |
| Review PDF | Original 98 pages | 29 pages / 27 sections | Not available yet |

## Scope contract

- `src/lib/mcq/cvs-scope.mjs` defines `all`, `physio`, and `non-physio`.
- Practice uses the authoritative question subject, not its review-section mapping. Physio is `subject === 'physiology'`.
- Papers/Core use `topic-map.json`: physiology plus blood physiology/hemostasis. The histology-taught `immune-foundations` topic stays Non-Physio.
- Two existing unclassified source records stay in the Non-Physio complement, retain their unclassified/source-review labels, and are not silently discarded. A missing whole topic map blocks scoped launches.
- `All` remains the default and retains original questions, paper IDs, fingerprints, attempts, and review URLs. Scoped paper/combined/Core attempts have distinct IDs and fingerprints.
- Scoped practice history stores its portion. Legacy history defaults to All and is never retrospectively repartitioned or re-scored. Wrong/flagged IDs are shared by question but filtered for each portion; filtering does not erase the other portion's mistakes.
- The selector is shared across practice, past exams, review topics and results; `?cvsScope=physio` or `?cvsScope=non-physio` survives reload. It is hidden during a running test.

## Downloads and review

- Generated practice and past-paper PDFs contain only the selected portion, including standalone answer keys and combined exports. Cache paths and filenames distinguish portions. Complete original scans remain available and explicitly labeled as complete originals.
- Physio's PDF is regenerated from frozen, hash-locked manuscript sections and figure assets in `data/review-variants/cvs-physio`, not sliced from mixed-discipline PDF pages. The full review is unchanged.
- `public/study/reviews/cvs-physio.json` maps original section IDs to the new PDF's page destinations and content-hashed URL. The PDF is registered in the normal device-cache manifest.
- Non-Physio retains mapped topic labels, practice actions, weakness reports and wrong-answer review, but has no review PDF download or section PDF links pending the user's future review.
- One physiology practice question (`depth-cvs-phys-017`) maps to the integrated pericardium section. It remains reachable as practice, without pretending that anatomy chapter exists in the physiology-only PDF.

## Rebuilding and verification

Run `npm run cvs:scope:check`; it is included in both build and Vercel build validation. It checks the frozen PDF/source hashes and scoped data/API/session/export/review regressions.

To update the physiology PDF after the canonical source changes:

1. Update the canonical review/source locks using the existing review workflow.
2. Run `node scripts/import-cvs-physio-review.mjs /path/to/locked/authoring/cvs.json` to import the selected source sections and figures. This refuses a source that differs from the current source lock.
3. Run `python3 scripts/build-cvs-physio-review.py` with ReportLab and pypdf available. Render and inspect the output before publishing.
4. Run `node scripts/check-cvs-physio-review.mjs` and `node scripts/build-pdf-manifest.mjs`.

Verification completed: 120 focused/compatibility tests, production build, strict canonical-review check, deterministic PDF rebuild, all-page PDF visual review, and isolated desktop/mobile browser checks. Browser checks confirmed correct counts, scoped practice, review links, Core launch/resume, result isolation, no Non-Physio PDF links, and 390px layout without horizontal overflow (44px scope buttons).

Known unrelated baseline: the broader global paper-PDF glyph audit flags unsupported characters in existing respiratory/nutrition/retake exports; it is not a CVS scope regression. No commit/push is part of this task.
