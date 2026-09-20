# MCQ-only refactor · 2026-09-20

## Implementation / review checklist

| Lane | Implemented | Verification |
| --- | --- | --- |
| MCQ shell | Four destinations: Practice MCQs, Past exams, Review topics, Results. No standalone concepts, 3D, atlas, guide or tutor flow. Shared immersive exams and responsive controls. | SHIP — independent import-graph/static review; TypeScript and production build |
| Media | Text, image, audio/video, dynamic 2D identify/locate; ordinary-image A markers; label masks and delayed figure disclosure preserved | SHIP — SSR marker/media tests + existing location tests |
| Term 2 review standard | 8 courses, 9 unchanged PDFs, 513 exact TOC headings/bookmark pages; canonical editable metadata + evidence + hash-locked generator | SHIP — independent 12-check audit; portable generator --check |
| Feedback | Shared section bar charts for Practice and all Past Exams; separate skip/ungraded states; suggested/unmapped links explicit; PDF section links | SHIP — independent real-source grading repro + regression tests |
| Source-only finals | 30 source collections across 11 course slots; no generated replacement for empty finals; originals/questions/current key downloads; preserved CVS Core/Non-Core/combined exams | SHIP — independent provenance review + memberships/download checks |
| Saved state | Existing localStorage keys retained; source-collection keys added; legacy filtered July29 seeds preserved; async guards prevent cross-course restore races | SHIP — regression tests + independent code review |
| Traffic/cache | Compact catalog; per-course server files; selected-set cache; versioned images; ETag finals; no tutor bridge dependency; optional-storage fallbacks | SHIP — independent cache mock tests + fresh function-trace checks |

## Counts and honest limits

- 8,197 course memberships / 8,023 distinct live practice IDs; overlapping Term 1 course routing is retained.
- 6,268 live Term 2 non-3D practice IDs, including 3,915 dynamic 2D identify/locate variants.
- Review mapping: 5,868 established source/concept links; 389 suggested broader/partial links; 11 explicitly unmapped peripheral-nerve histology questions. All remain in the practice bank; no false precise map was manufactured.
- 1,687 source-paper occurrences in 30 collections. Nutrition's 128 and Religion's 180 archive occurrences are preserved even where there is no separate graded MCQ.
- Ordinary scored final banks: July25 168, July29 199, Nutrition 57, Religion 89. CVS keeps its independent 16-paper source collection/combined engine (1,012 source items; key availability stays explicit).
- 151 authored Term 1 “Core Distilled” questions now belong to Practice, not Final Exam. Historical results are not erased.
- 90 Markdown downloads (questions, current answer key/notes, combined per collection), with original-source links. Eight additional original Term 1 PDF copies included; existing CVS/Nutrition/Religion originals retained.
- Some source collections are undated, partial or cross-course; those qualifications remain visible. An ungraded record is not automatically counted as wrong.

## Regeneration / resuming edits

1. Edit authored MCQs in `data/bank/questions/` with stable IDs/revisions; use `scripts/content/source-bank-policy.ts` for legacy routing, not the retired bridge.
2. Edit canonical review mappings in `data/review-curriculum/`, keeping evidence maps/crosswalks in agreement. Section IDs use `volume/sourceSectionId`; headings/pages must match the source-locked PDF outline.
3. Run `npm run mcq:generate`, then `npm run reviews:check` and `npm run mcq:check`.
4. New source papers require explicit source membership and current answer provenance in the source catalog, regenerated downloads, and course mapping. Do not infer an exact sitting date from a print/report date.
5. Changed PDFs require outline/page verification and new source locks. `scripts/build-review-runtime.mjs` only generates JSON; it never edits PDF bytes. Optional `--archive` verifies original authoring JSON hashes.
6. Run `npm run vercel-build`; ensure route traces include `data/mcq-runtime` files without tracing the whole workspace.

## Cache / persistence contract

- Preserve `med25-study-progress-v1`, `med25-session-archive-v1`, `med25-final-exam-v1`, `med25-cvs-papers-v1` and Nutrition/Religion source-review keys.
- CacheStorage contains expendable question/media data only, never the authoritative answer/result records.
- Never cache randomized POST sprint responses by request URL. Cache individual selected questions under course-content version + ID + purpose.
- Retired history data cannot populate the practice cache. Current-version practice cache may satisfy history viewing.
- Unchanged versioned images survive app updates. Mutable catalogs/answer overlays revalidate; final banks support ETag/304.
- PDF requests are on demand and then cached separately by SHA-256; repeat opens and Blob downloads use the same cache. Single-byte ranges, suffix ranges and full downloads all reuse the complete entity. No partial PDF is stored as a full file. The cache keeps up to 256 MiB / 48 PDFs; only older PDF entries can be evicted, never answers or results.
- `scripts/build-pdf-manifest.mjs` fingerprints all 37 local study PDFs on dev/build/regeneration. Existing explicit review hashes remain valid; unversioned source-paper links resolve through the small revalidated manifest. Wrong-hash and non-PDF responses are not cached. Updated worker modules bypass script HTTP caches during update checks.
- Audio/video remain on demand; offline cold-start shell functionality is not claimed.

### PDF cache follow-up

Implemented a shared module for the service worker and explicit download links. A first successful download saves bytes locally; repeated downloads create the saved file from the cache without another PDF transfer. A newer hash downloads once and removes the superseded cached version. Cache-disabled/quota-limited browsers still permit online download and report that persistence was unavailable. Nine dedicated cache/range/version/storage tests pass (`npm run pdfs:check`).

## Delivery status

Implemented locally at `http://localhost:3000`. Independent source, review-map and runtime/UI-code lanes returned SHIP after their findings were fixed. No live-browser screenshots or interaction audit was performed; validation used static rendering, logic tests, HTTP checks and production build. No commit/push/deployment requested or performed in this refactor turn. Source study assets and historical code/data are preserved but no longer eagerly imported by the app.
