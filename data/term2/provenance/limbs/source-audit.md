# Term 2 Upper & Lower Limbs - independent source audit

## Result

Accepted bundle: 156 verified records across 14 modules (124 single-best-answer and 32 answer-gated 3D records). Every accepted record has four unique options, one keyed answer, three distractor explanations, a valid module assignment, and a traceable source locator.

No accepted record contains a `media` property. The 3D records reference registered interactive structures only; their labels and explanations remain answer-gated. Tags and quality flags contain no restricted assessment-origin labels and no verification-queue markers.

## Course/source boundary

Upper-limb course scope is limited to the seven local teacher transcripts. Transcript wording was treated as noisy ASR and was normalized only where Gray's Anatomy for Students, 3rd edition corroborated the anatomy. The dedicated hand/carpal module is Gray's-only because Forearm 2 ends at lines 210-211 by announcing a later hand session that is not present. The scaphoid vascular-complication item was therefore moved into that extension.

No local lower-limb teacher slide, recording, transcript, or note was located in the audited course-source locations. All lower-limb modules remain Gray's-only extensions and carry no lecturer-weighting claim.

## Teacher transcript inventory

- /Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Videos/Arm 1.transcript.txt - 150 lines - SHA-256 b6e6c724d7f0d1780c48d10f7e55113dd9101f57e2fe6bdbcfa86028211c6027
- /Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Videos/Arm 2.transcript.txt - 44 lines - SHA-256 04e050e775a1e9ece920819c5347ce0ea0bd6b43ee63f8df62189e6af3ca6fef
- /Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Videos/Axilla 1.transcript.txt - 109 lines - SHA-256 c67be7bedba731cb50d1887c01451c3de6e9efcac0fa397f6a3ee8ca39fe0abd
- /Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Videos/Axilla 2.transcript.txt - 174 lines - SHA-256 a3cb89f8642632bf50b2b6b4f010bcb93f06b17d7e445fbcf18ad10e8665edfd
- /Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Videos/Forearm 1.transcript.txt - 116 lines - SHA-256 a78bf93a23c924e7d95717c0dcc2a20f710d2e6c7b97871dd1094daf3fc3a121
- /Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Videos/Forearm 2.transcript.txt - 211 lines - SHA-256 32969c5360c9fd8fcb1fdaa7324fb08e7ba9b44e0ffb3a5506dda91e40447e84
- /Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Videos/Osteology of the upper limb 1.transcript.txt - 137 lines - SHA-256 0c2abfc2be731116cf2f520a6a9a5a459da8d9899886e5de901478657fcac94e

Seven same-named SRT companions are present and were checked as duplicate time-coded exports. Exact TXT line locators are stored on every upper-limb course record.

## Textbook verification

- /Users/rizzist/Documents/TUMS Term 2 Theory/90 Official Book Access/Gray's Anatomy for Students 3rd Edition - Clean.pdf
- 1,173 PDF pages; SHA-256 b112cf0c47919a524dc37c32192a9fb865c85e5f04db01a75a54575d81e9ec3c.
- Gray's chapter 6 lower limb is printed pp. 535-672; chapter 7 upper limb is printed pp. 685-829.
- The local PDF locator is consistently printed page +12 throughout both limb chapters. Every record stores both forms.
- `source.excerpt` is an evidence summary, not a verbatim quotation.

## 3D registry and implementation verification

All 32 modelKey/structureId pairs exist in the checked-in upper- or lower-limb manifest, are quizable, match the keyed option label, and are registered by /Users/rizzist/Documents/CODING/med-school-prep/src/lib/anatomy3d/registry.ts. Real targets were found in the corresponding GLB node/extras data; schematic targets were found in the checked-in model factory. Both GLB assets exist locally. BodyParts3D attribution remains required under CC BY 4.0.

## Material corrections

- limb-ul-006: Replaced an action-based shoulder stem not stated in the transcript with the lecturer's explicit suprascapular-nerve muscle pair.
- limb-ul-029: Replaced a deltoid-abduction range stem with the lecturer's explicit axillary-nerve motor distribution.
- limb-ul-030: Replaced an untaught rotator-cuff classification stem with an explicitly taught quadrangular-space boundary.
- limb-ul-031: Reframed an untaught muscle-action stem around two explicit transcript facts.
- limb-ul-032: Replaced an action-based stem with the lecturer's explicit posterior-wall relation.
- limb-ul-034: Replaced an uncited dislocation mechanism with the lecturer's explicit axillary-nerve lesion sign.
- limb-ul-036: Removed the ambiguous word 'deepest' and used a single, explicit positional discriminator.
- limb-ul-019: Clarified the exception wording so a partially ulnar-supplied muscle cannot create ambiguity.
- limb-ul-060: Moved the scaphoid complication from transcript-confirmed wrist scope to the Gray's-only hand/carpal extension.
- limb-ll-040: Restricted the stem to a nerve and replaced the competing descending-genicular-artery option, which also leaves before the hiatus.
- limb-ll-046: Replaced an imprecise claim about relaxing fascia with the relevant relaxed muscular boundaries.
- limb-ll-051: Removed an unsupported temporal claim ('first threatens') while preserving the correct compartment-localization test.
- limb-ll-024: Corrected the over-narrow two-tendon sling claim to the exact three-muscle set on Gray's printed p. 649.

The remaining records were retained after anatomy, lesion-localization, source-boundary, locator, option-parallelism, and distractor checks. No accepted item lacks the evidence required by its assigned scope.
