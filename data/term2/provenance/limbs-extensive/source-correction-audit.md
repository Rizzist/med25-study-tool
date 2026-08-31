# Upper & Lower Limbs extensive independent verification

## Outcome

The normalized catalog contains **79 accepted concepts** in **14 modules**. No concept record was excluded. All 79 were schema-normalized, and **21 distinct concept records received material medical, source-locator or scope corrections**. All **156 baseline questions** were preserved byte-for-byte; **6 primary mappings** were corrected after reviewing all 156 stems, keys and learning objectives. All **17 gap SBAs** were accepted only after correction; none was excluded. They are revision 2, status `verified`, and carry the required `term-2`, `exam-term2-limbs`, `study-practice`, `source-grounded` and `gap-audit` tags with no past/final/official tags.

Machine validation **PASSED**: AJV accepted the catalog and all 17 emitted MCQs; the repository concept audit returned 0 errors; all 32 baseline 3D pairs resolve to registered manifest structures; exact and thresholded prompt-duplicate checks found 0 pair(s).

## Source boundary and completeness

Only local course materials and Gray's were used. No web question bank, past paper or official-exam item was consulted. The local checklist assigns selected Chapter 1 foundations plus complete upper- and lower-limb chapter topics, surface anatomy and clinical cases.

The author's chapter boundaries were incomplete. Chapter 6 runs from printed pp. 535-681 (local PDF pp. 547-693), including **7 clinical cases on pp. 672-681**. Chapter 7 runs from printed pp. 685-834 (local PDF pp. 697-846), including **9 clinical cases on pp. 829-834**. All 16 cases are now separately inventoried. The checklist, Chapter 1 readings, seven TXT transcripts, seven duplicate SRT representations, both limb manifests and the live registry are also included. SRT files are not double-counted as independent evidence.

## Material corrections

- Corrected palmar aponeurosis from superficial fascia to a condensation of deep fascia; removed unsupported fascial-space wording; clarified the carpal and digital synovial sheaths.
- Corrected lumbrical/interosseous insertion wording and the extensor-hood apex relation.
- Removed the unsupported windlass attribution from Gray's pp. 649-650 and replaced the proposed question with a directly stated plantar-aponeurosis attachment.
- Rewrote foot-arch notes to Gray's directly stated relative heights, transverse-arch plane, passive supports and three dynamic supports.
- Corrected wrist articular wording, internal-pudendal wording and the non-monotonic upper-limb mobility summary.
- Replaced wrong transcript spans for posterior arm, arm nerves/vessels, cubital fossa, anterior-forearm neurovascular anatomy and distal-forearm surface relations. Added direct transcript support for shoulder joints, axillary vein and axillary lymph nodes and upgraded those three concepts to `course`.
- Replaced the duplicate posterior-tibial-pulse gap item with a distinct dorsalis-pedis landmark item. Repaired every keyed explanation, including the contradictory axillary-node explanation.

The detailed before/after evidence trail is in `term2-limbs-correction-ledger.json`.

## Objective sampling and mappings

The author's 79 generic objectives overclaimed direct sampling. The final catalog uses **173 question-aligned objectives**: one per preserved or gap question, with each question's own learning-objective text. Consequently every claimed objective is directly sampled, every question is mapped once, and all 79 concepts have at least one direct sample. The complete baseline-plus-gap mapping is in `term2-limbs-question-to-concept-index.json`.

The repository baseline predates the concept audit's `study-practice` routing requirement. For the audit only, that tag was added to an in-memory view; no baseline file or record was edited. This adapter is explicit in machine validation.

## Unresolved limitations

- No lower-limb teacher transcript, slides or notes were found; lower-limb content therefore remains `book-extension`.
- The transcripts promise a later hand session, but that material was not found; hand content remains `book-extension`.
- Gray's PDF text extraction is malformed. Page contents were verified by rendering and local OCR, and locators use the checked +12 local-page offset in limb chapters.
- No official blueprint or weighting source was available, and the checklist warns that limb anatomy is Semester 1 carryover.
- Clinical cases are classified only as anatomical applications; this bundle makes no diagnosis, treatment or lecturer-emphasis claim.
