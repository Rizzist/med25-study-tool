# Respiratory source papers - MED25

Completed 27 September 2026. Source archive:
`MED SLIDES/TERM 2/02 Respiratory/Past Exams`.

## Published coverage

| Item | Count / treatment |
| --- | --- |
| Organized archive folders | 24; all source pages accounted for |
| App source cards | 23; source 14 is merged into source 10 |
| Playable collections | 20; includes explicitly marked supplementary material |
| Reference-only cards | 3; two labelled teaching sets and one unmatched key |
| Retained question / short-answer records | 690 |
| Distinct scored MCQs | 579 |
| Ungraded source occurrences | 85, retained in question/key downloads |
| Shared screenshot IDs | 26 graded source-22 captures reuse source-05 IDs |
| Review mapping | All 579; 354 exact paragraphs and 225 section-level links |
| Published original figure crops | 29; checked for answer-mark leakage |

Do not add the source counts as a count of independent exam sittings. Report dates,
unconfirmed dates, reordered reports, fragments, and reference materials are
qualified in each card's Source details. A different date/file alone does not prove
an independent sitting. The unmatched bubble key is not assigned to any paper.

## Authoring and reproducible generation

- `imports/respiratory-NN.json`: reviewed transcript, study key, supplied mark,
  evidence, limitations and page-by-page coverage.
- `source-manifest.json`: published source hashes, archive hashes and relative
  archive paths. Full-resolution archive originals were not modified.
- `review-section-overrides.json`: 69 separately audited topic corrections.
- `../guided-review/respiratory-past-paragraphs.json`: 110 unique PDF text-block
  locators covering 354 scored canonical IDs.
- `papers/`, `import-audit.json`, the final JSONL bank and Markdown downloads:
  generated artifacts, not the editing source.

After editing transcripts or mapping overrides, run:

```sh
npm run mcq:generate
python scripts/content/build-guided-respiratory.py
npm run respiratory:papers:check
npm run guided:check
npm run reviews:check
npm run pdfs:check
npm run build
```

The paragraph builder requires PyMuPDF; the normal application/deployment build
uses the checked-in anchors and needs no Python or private archive access.
Publication of new original sources is a separate, explicit operation through
`scripts/content/publish-respiratory-sources.py --archive <path>`.

## Core exam

`core-selection.mjs` curates repeated relationships and coverage gaps from the
475 scored questions in 14 main theory collections. Practical/reference sets,
duplicate screenshot aliases and ungraded items do not inflate recurrence.
The first exam card has 193 questions: 99 repeated patterns plus 94 coverage
items (59 anatomy, 102 physiology, 20 histology, 12 embryology). Collection counts
are not claims of independent sittings or predictions of the next examination.

After source or review mapping updates, run `npm run respiratory:core:generate`,
then `npm run respiratory:core:check`. Build/deployment checks reproducibility.
Full Core, Repeats Only and section scopes retain original bank IDs and separate
saved attempts, with Guided/Unguided modes and immutable initial-result review.
See `docs/respiratory-core-exam.md` for every representative and its selection basis.

## Grading and fidelity

Supplied marks are preserved separately from independently reviewed/inferred
study answers. They are not claimed to be authenticated official university keys.
Inferred or corrected answers use the existing subtle darker feedback styling.
Defective, ambiguous, unreadable, unmatched and short-answer records are not given
default A answers or silently forced into scored single-best-answer questions.

Source 23 Q59 (`elevate hypoxia`) and Q63 (two defensible choices) are explicitly
withheld after independent review. Sources 06 Q30 and 12 Q38 preserve the exact
original typo choices in `sourceOptions` and original question downloads while
the practice choices use disclosed editorial corrections. The original scans
remain available alongside all generated downloads.

The large July 2023 scan has a 6.1 MB web PDF retaining all ten pages and their
orientation; the 114.7 MB archive original is unchanged. Rendered overview and
full-page readability were checked. Other published originals retain byte hashes.

## Verification

All three source lanes received independent cross-review. See:

- `docs/respiratory-photo-audit.md`
- `docs/respiratory-scanned-audit.md`
- `docs/respiratory-digital-audit.md`
- `docs/respiratory-reference-audit.md`
- `docs/respiratory-review-mapping-audit.md`
- `docs/guided-exams.md`

Integration tests cover every source page, schema, answer exclusion, source hash,
download/export, duplicate alias, current-PDF destination, API boundary, media
redirect, ETag response and distinct runtime count. Guided browser checks cover
desktop, portrait and landscape, committed-answer navigation, free scrolling,
cached loading, saved mode/answers, completion and section-specific review.
