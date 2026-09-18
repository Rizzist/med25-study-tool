# CVS review topic mapping audit

`topic-map.json` is a standalone study-navigation sidecar. It covers all 942 existing question IDs across all 11 supplied papers. The source repository was read only. No source question, answer, key, issue, page, paper ID, or question ID was changed.

## Catalog and interpretation

The 64 substantive topic IDs and titles are copied exactly from the local review's `_build/content/cvs.json`, the metadata for **01 - Cardiovascular Review.pdf**. The orientation and correction-ledger sections are omitted; one explicit `unclassified` topic is added. `reviewLocator` identifies the exact section by ID and title. PDF page numbers were not inferred.

The catalog uses six subjects. Blood-cell physiology, immunity, and antibodies are in `blood-immune`. Thymus, lymph-node, and spleen/tonsil architecture are in `histology`, alongside heart and vessel histology. These are study-navigation boundaries, not claims about the exam board's subject weighting. Some review sections combine concepts across disciplines.

Each question has one principal topic, chosen from its visible stem and options. The mapping is manually curated and reproducible from `build-topic-map.cjs`; it does not depend on a probabilistic classifier or on question position alone. Repeated stems were checked for consistency. Generic stems are resolved from their options, so identical generic prompts may correctly map differently.

## Coverage

| Subject | Questions |
|---|---:|
| Anatomy | 235 |
| Physiology | 417 |
| Blood & immunity | 132 |
| Histology | 87 |
| Embryology | 69 |
| Unclassified | 2 |
| Total | 942 |

The two unclassified records are `cvs-2021-october-q61` (a template placeholder with only ordinal options) and `cvs-undated-student-2023-q84` (pelvic pectineal-line anatomy outside the CVS review's substantive scope).

## Limits and ambiguous records

`mapping-audit.json` lists image-dependent, cropped, mixed-topic, and contaminated records. A topic can remain identifiable when a record is not safely answerable. These flags are about the precision of the navigation target; they do not alter grading or imply that an answer key is correct.

The practical image questions were classified only from the available stem/options; this audit did not identify structures from arrows. For example, the options in practical q13 establish lymphoid-organ comparison but do not identify the organ pictured. Cross-topic anatomy questions receive the closest broad regional section. The histology-first q10 has a 13,942-character option that contains later questions; its own tonsil stem determines its topic, and the contamination is left untouched.

This mapping does not validate medical facts or answer keys, fix OCR, resolve exam disputes, or make source images unnecessary. Questions about general circulation may map to the broad pressure/flow review section. Questions combining chamber pressure, the ECG, and valve timing map to their principal review concept.

## Active-attempt preservation

Load this file separately and look up `questions[question.id]` during rendering/report aggregation. Do not spread these properties into the persisted paper/question objects or into the input to an existing attempt fingerprint. Keep attempt IDs, storage keys, scoring keys, supplied keys, and resume records unchanged. An unavailable mapping should fall back to `unclassified` without changing or clearing an attempt.

`sourceFingerprints` contains the SHA-256 of every source `paper.json`. Initial and final byte hashes were compared. All source bytes remained unchanged. Validation also checked 942 unique source IDs, exact one-to-one mapping coverage, source question numbering/order, all topic/subject references, and exact review section titles. All substantive duplicated stems retain the same topic; only generic stems with differing options differ.

## Reproduction

Run `node build-topic-map.cjs` from this deliverable directory to emit an `apply_patch` patch on stdout. The script only reads the source repository and review metadata. It deliberately fails if a source question count/order changes; updated papers require a fresh manual mapping review. Applying the emitted patch writes only `topic-map.json` in this deliverable directory.
