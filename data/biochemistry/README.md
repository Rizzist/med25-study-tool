# Biochemistry II metabolism past papers

`past-papers.json` preserves original question numbers, choice order, supplied answer marks separately from the initial editorial keys, provenance, duplicate-file memberships, absent source numbers, and the exclusion manifest. `ai-resolutions.json` is a separate study layer for the 23 originally ungraded items; it must not replace the original transcription.

Imported 2026-09-23 from the user's newly downloaded papers. Theory/metabolism and related clinical-biochemistry papers belong here; practicals, the foundations paper and a lecture-MCQ compilation do not. Academic-year, report-date and reconstructed-paper labels are not authenticated sitting dates.

`node scripts/build-biochemistry-papers.mjs` regenerates the scored JSONL bank, paper exports, shared source catalog and question-to-review mappings. `--check` is read-only. `npm run mcq:generate` then refreshes lazy runtime banks, PDF cache versions and review metadata.

`node --test tests/biochemistry-papers.test.mjs` checks memberships, excluded material, source hashes, question numbering, answer regressions, export parsing and saved-session isolation.

Answers are editorial study keys, not an official university key. All 641 items are now scored: the 23 previously ungraded items have 22 explicitly repaired study versions and one original item accepting both defensible alternatives. These resolutions use the existing darker AI-answer colors. Edited versions are visibly identified, with original stems, choices and marks retained in source notes and downloads. The initial 618 scored questions are unchanged. Historical ATP conventions and ambiguous wording are qualified in feedback. Concept-level review destinations do not authenticate a supplied answer key or prove examiner intent.

Originals are immutable in `public/study/biochemistry/past-papers/`. They load only on request and use the application's content-hash PDF caching. The February 2025 PDF is a lossless page-ordered container of the original photographs; individual photos and alternate copies remain in the local medical archive.

The July-2026-labelled reconstruction is selectable as a clearly labelled supplement, excluded from Select all; it is not an authenticated original paper. Do not silently promote it to official-exam status.

## Review expansion and regeneration

`REVIEW-COVERAGE.md` and `review-coverage.json` record all 641 source occurrences, including the 23 AI-resolved items. `review-routing.json` is the explicit question-by-question destination audit; its sequence follows each paper's original question order. The PDF was expanded against available lecture PDFs/notes, Ferrier and Guyton, with supplemental clinical references identified separately. Missing later lecture decks and an unseen exam blueprint are not claimed complete.

The editable review remains in the private medical archive at `10 Review Summaries/_build/content/biochemistry.json`. The pre-audit authoring JSON and PDF are preserved under `_build/audit/biochemistry-before-past-paper-audit-2026-09-23/`.

For future partial edits, edit that private authoring JSON, render with the archive's `_build/build.py --only biochemistry`, then run `scripts/sync-biochemistry-review.py` using Python with PyMuPDF installed. Finally run `npm run mcq:generate`, `npm run biochemistry:papers:check`, `npm run reviews:check` and `npm run pdfs:check`. The sync reads actual PDF bookmarks, updates page links and SHA-256 cache versions, and regenerates the coverage audit. It does not change answer keys.

`scripts/expand-biochemistry-review.py` records this one-time expansion reproducibly. **Do not rerun it after making later authoring edits:** it deliberately rebuilds from the preserved pre-audit JSON and would replace those later edits. The original notes, slides and books remain read-only.
