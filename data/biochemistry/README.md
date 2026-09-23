# Biochemistry II metabolism past papers

`past-papers.json` is the editable source of truth. It preserves original question numbers, choice order, supplied answer marks separately from editorial keys, provenance, duplicate-file memberships, absent source numbers, and the exclusion manifest.

Imported 2026-09-23 from the user's newly downloaded papers. Theory/metabolism and related clinical-biochemistry papers belong here; practicals, the foundations paper and a lecture-MCQ compilation do not. Academic-year, report-date and reconstructed-paper labels are not authenticated sitting dates.

`node scripts/build-biochemistry-papers.mjs` regenerates the scored JSONL bank, paper exports, shared source catalog and question-to-review mappings. `--check` is read-only. `npm run mcq:generate` then refreshes lazy runtime banks, PDF cache versions and review metadata.

`node --test tests/biochemistry-papers.test.mjs` checks memberships, excluded material, source hashes, question numbering, answer regressions, export parsing and saved-session isolation.

Answers are editorial study keys, not an official university key. Source marks were transcribed and obvious conflicts checked; this does not certify every source claim. Flawed questions stay in the downloadable transcript but are not automatically scored. Accepted alternatives are explicit. Historical ATP conventions and ambiguous wording are qualified in feedback. Unmapped clinical details are not falsely assigned to an exact review heading.

Originals are immutable in `public/study/biochemistry/past-papers/`. They load only on request and use the application's content-hash PDF caching. The February 2025 PDF is a lossless page-ordered container of the original photographs; individual photos and alternate copies remain in the local medical archive.

The July-2026-labelled reconstruction is selectable as a clearly labelled supplement, excluded from Select all; it is not an authenticated original paper. Do not silently promote it to official-exam status.
