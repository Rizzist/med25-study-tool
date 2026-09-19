# CVS Non-core Anatomy

Secondary revision card immediately after the gold Core Exam. Original past-paper questions only; not a newly authored exam or a prediction.

## Archive partition

| Disposition | Source questions |
| --- | ---: |
| Anatomy questions in the existing topic map | 237 |
| Core questions, known repeat variants and reviewed equivalents | 98 |
| Remaining duplicate copies represented once | 6 |
| Playable Non-core Anatomy questions | 119 |
| Held for unresolved answers or source ambiguity | 14 |

The 119 include 10 original practical image spotters. Different details within the same anatomy topic remain. Conservative wording matching is supplemented by explicit same-fact groups; this is not a guarantee of zero semantic similarity. No arbitrary size cap or difficulty-based omissions.

## Sources and grading

- Uses original IDs, text, options, source scans, media, and the existing answer-review overlay.
- Does not invent keys for unresolved questions or mutate original source papers/Core.
- A conflicting supplied thoracic-duct mark, conflated deep-back-muscle wording, and an underspecified aortic relation are held in addition to the 11 previously unresolved items. The source references and reasons are visible under Coverage & excluded items.
- Existing source keys remain source keys, not newly certified medical answers. This change is a selection/deduplication pass, not a complete answer-key audit.

## Behavior

- Separate attempt/result ID: `cvs-noncore-anatomy`.
- Same instant-feedback/deferred exam controls, source provenance, local saved progress, latest result, and detailed anatomy review-section reports.
- A changed curated manifest can resume retained questions without merging with Core or whole-paper aggregate attempts.
- The loader rejects missing/changed sources, ungraded selected items and stale Core linkage.

## Regeneration

1. If source papers change, update their answer/topic data and regenerate Core first.
2. Review `data/cvs-noncore-anatomy-review.json` for same-fact groups, Core equivalents and unresolved source holds.
3. Run `node scripts/content/build-cvs-noncore-anatomy.mjs`.
4. Run `node --test tests/cvs-core-exam.test.mjs tests/cvs-noncore-anatomy.test.mjs`.

The generated manifest records every included/excluded anatomy source ID, so omissions and duplicate removal are auditable. `--check` validates reproducibility without writing.
