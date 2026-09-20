# Review curriculum source metadata

The files in `courses/` are editable canonical navigation metadata, not answer keys. The public runtime files are generated from them. The full evidence and confidence records are preserved in `evidence/question-review-map-v2.json`; raw Nutrition/Religion paper occurrences live in `evidence/source-occurrence-review-map.json`. Mapping uncertainty is unrelated to question grading status.

## Build and check

Run from the checkout, after copying this package's `data/review-curriculum/` and `scripts/build-review-runtime.mjs` into it:

```sh
node scripts/build-review-runtime.mjs --check
node scripts/build-review-runtime.mjs
```

`--repo ROOT` makes the command independent of the current directory. `--data DIR` and `--output DIR` support staging. `--check` performs no writes and fails if any generated JSON differs. Normal builds require only Node and repository-local files: no username, archive mount, PDF library, or network access is required.

The generator recomputes actual PDF SHA-256 hashes, course JSON hashes, cache-version URLs, and the ordered course index hash. It checks IDs, exact section headings, hash-locked bookmark destinations/page bounds, in-course references, source/final occurrence retention, canonical/evidence agreement, live runtime membership, and privacy strings. It never modifies or regenerates PDFs. A PDF hash change fails closed: validate its actual outline and page count before intentionally updating `source-locks.json` and the canonical section locators. The pinned original byte hash ties the prior outline validation to the bounds check; the normal build does not re-extract bookmarks.

## Source documents and editing

The original editable review documents remain in the review archive at the relative paths recorded in `source-locks.json`, such as `_build/content/cvs.json`. Original authoring JSON hashes and original PDF filenames are recorded without machine-specific paths. Optional authoring drift verification:

```sh
node scripts/build-review-runtime.mjs --check --archive /path/to/review-archive
```

Use the original authoring JSON to change teaching content or the PDF. Use canonical course files plus the evidence maps to curate navigation. Preserve every `volumeId/sourceSectionId`; changing a title must follow the authoritative authoring document and PDF outline. No answer text, source occurrence, question revision, scoring key or attempt fingerprint is rewritten by this build.

For an individual mapping correction, update the course entry and its full evidence entry together. Keep method, evidence, confidence and uncertainty explicit. The retained `concept-crosswalk-v2.mjs` and `question-overrides-v2.mjs` are curation references explaining the initial expansion; `concept-review-crosswalk-v2.json` is the materialized evidence crosswalk. This minimal runtime build does not infer new mappings or automatically propagate curation-code edits. Add newly imported question IDs deliberately to both canonical and evidence data; coverage checks fail until they are handled. Keep unsupported targets null and uncertain rather than fabricating coverage.

Per-course original archive aliases (for example `F1` and `O1`) coexist with scored final IDs (`nutrition-past-f1`, etc.). They must never become practice IDs merely because they have a review section. Retired practice IDs remain available for historical results with `livePractice: false`.

Baseline: 8 courses, 9 original PDFs, 513 source sections, 8,100 map records, 6,268 live questions (5,868 established, 389 suggested, 11 unmapped), 308 original Nutrition/Religion occurrence aliases, and 146 Nutrition/Religion scored final IDs. These are audit counts, not hardcoded generator assumptions.
