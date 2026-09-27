# Guided Respiratory exams

## Implemented

- Respiratory-only Guided / Unguided chooser at practice or sourced-paper start.
- Guided renders the actual versioned review PDF, cached on-device, beside the MCQ
  on desktop and landscape; below it on portrait mobile. No PDF download in Unguided.
- Answer commitment jumps to an exact passage when audited, otherwise the mapped
  section heading. Learners can scroll freely, change pages, zoom, and disable jumps.
- Guided choice persists with the attempt. Grades and wrong-answer reviews retain
  their existing semantics. Other courses remain unchanged.
- Biochemistry Core uses the shared exam-card grid rather than a full-width banner.

## Reference authoring

`data/review-curriculum/courses/term2-respiratory.json` is the question-to-section
crosswalk. `data/guided-review/respiratory-paragraphs.json` and
`data/guided-review/respiratory-past-paragraphs.json` hold explicit, source-
checked quotes. Run `scripts/content/build-guided-respiratory.py` with PyMuPDF
Python dependencies to validate quote uniqueness and derive page coordinates.
The review SHA-256 is part of each reference. Stale exact anchors fall back to the
current course section rather than jumping to an old paragraph. New past-paper
question IDs use the same mechanism; do not claim exact matching for heuristic links.

## Verification completed (27 September 2026)

- Production build and hook-order checks passed.
- Guided reference tests passed across the existing Respiratory practice bank.
- Browser: answer-to-paragraph jump, manual navigation, auto-jump off, PDF cache on
  reload, saved Guided resume, results, new-sprint chooser, and Unguided verified.
- Browser: 1280x800 desktop, 390x844 portrait and 844x390 landscape checked; rotation
  and zoom preserve the reading location. Only nearby pages render canvas elements.
- MCQ regression, PDF-cache, and review-index checks passed.
- Paper-specific browser flow: mode chooser, exact p108 paragraph jump, 1/36 saved
  Guided resume, complete 7-question Unguided paper, section-result bars, and
  per-section wrong-answer controls verified on the separate QA origin.
- Portrait final-exam overflow fixed and rechecked: document width equals 390px,
  PDF is below the question, and landscape 844x390 has the PDF on the right.
- Biochemistry Core visually verified as the first card in the paper grid.
- Independent reviewer SHIP: source import, answer provenance, review mappings,
  API/persistence integration. Production build and deployment asset checks pass.

### UI follow-up: start gate and stable reader toolbar

- Paper and combined-session mode choices now appear centered over the catalog,
  before mounting the exam or creating/replacing an attempt. Cancel keeps the
  catalog and saved answers untouched; resume reuses the saved mode.
- PDF controls occupy one fixed 44px row, including page navigation, a compact
  reference trigger, cache indicator and external-PDF link. Zoom and auto-jump
  are in the ellipsis menu. Settings and linked passages overlay the PDF instead
  of growing the header. Loading and errors stay inside the reading area.
- Browser checked at 1280×720, 390×844, 320×700 and 667×375. Header stays 44px before/after
  answering and with reference details open. No horizontal overflow, cancellation
  leaves the source card “Not attempted”, and saved Guided resume retains answers.
- Production build, TypeScript, hook-order and 13 Guided regression tests pass.

### Respiratory Core

- The first exam card offers 193 original PYQs: 99 repeated patterns and 94
  coverage items, with Full Core, Repeats Only and 66 review-section scopes.
- Guided/Unguided choice is before start. Verified Guided auto-jump to a current
  paragraph, Unguided without PDF, separate section completion, and wrong-answer
  review (original 0% unchanged; yellow review bar 100% corrected).
- Seven dedicated Core tests, 12 existing Biochemistry/Nutrition tests, 68 MCQ
  regressions and production build pass. See `docs/respiratory-core-exam.md` for
  the complete selection and recurrence limitations.

## Respiratory archive import completed

All 24 archive groups are represented in 23 cards: the same 42-question paper's
two photo layouts are merged. There are 20 playable source collections and three
download-only references/keys, not 23 independently confirmed exam sittings.

690 records retained; 579 distinct scored MCQs; 85 ungraded records preserved in
downloads. Twenty-six screenshot MCQs share July 2022 canonical IDs and do not
repeat in combined sessions. Question counts report distinct bank IDs.

The 158 review headings and 363 paragraph anchors are tied to the unchanged PDF
hash. Past papers contribute 354 paragraph-linked questions, with 225 remaining
on audited section-level links. No exact paragraph match is claimed for those.

See `data/respiratory/README.md` for regeneration, preservation policy and audits.
