# Limb embryology gap audit

Author: `/root/limb_embryology_audit`  
Date: 2026-09-13  
State: independent content/source review complete and approved by `/root/limb_physiology_audit`. All new questions remain `draft`; the signed review gate controls parent integration.

## Before and after

The existing bank contains 17 questions tagged `exam-term2-limbs` with subject `embryology`. All 17 stems, options, correct explanations, and distractor explanations were read, together with their two concept mappings. The new draft adds 40 distinct assessments in 11 topic-level concepts and 5 modules. If approved and integrated without changes, the embryo-limb bank would contain 57 questions.

After independent difficulty calibration there are 32 new `knowledge-core` questions and 8 `knowledge-challenge` questions. Every question has four options and specific reasoning for the correct option and each of the three distractors. Correct answer positions are balanced at 10 per letter. Every item has an exact physical PDF page and printed page locator, plus the relevant figure/table where useful. All 40 are `book-extension`; none is represented as a recovered lecture question, official question, or past examination question. Independent content review is recorded separately from publication status.

| Topic | New IDs, prefix `limb-audit-emb-` | Added assessment |
| --- | --- | --- |
| External milestones | 001–002 | Initial upper/lower lag and plate versus separated-digit stages |
| Skeletal maturation | 003–006 | Cartilage template, primary-center chronology, plate distribution, interpretation of bone age |
| Limb field and skeletal pattern | 007, 012–013 | HOXB8 position versus identity, moving ZPA, HOXA/D bone pattern |
| AER induction and boundary | 008–011, 014 | BMP–MSX2 induction, RADICAL FRINGE/SER2 boundary, AP2, differentiation front, EN1 border action |
| Myogenic domains | 015–017 | Lateral somitic frontier, upper-girdle primaxial exceptions, VLL inductive environment |
| Muscle assembly and function | 018–022 | SCLERAXIS, myoblast fusion, innervation requirement, mixed segmental contributions, sensory continuity |
| Defect morphology | 023–026 | Phocomelia, distribution of shortening, central-ray cleft, incomplete functional integration of an extra digit |
| Disruptions and teratogen timing | 027–029 | Sensitive developmental window, amniotic-band morphology, nonunique cause of transverse loss |
| Syndromic limb findings | 030–033 | Holt–Oram, Baller–Gerold, osteogenesis imperfecta, Marfan phenotype discrimination |
| Joint and muscle-pattern disorders | 034–037 | Prenatal hip abnormality, limits of PITX1 inference, Poland sequence, muscle absence versus dysfunction |
| Appendicular dysplasia extensions | 038–040 | FGFR3 endochondral growth, RUNX2 clavicle phenotype, limb findings in FGFR2-associated syndromes |

## Existing material deliberately retained

The 17 original questions are unmodified. No extra paraphrase was added for the existing tissue tracer, early AER removal, proximal marker selection, two-stage digital apoptosis, opposite adult limb rotation, interzone derivatives, WNT14, connective-tissue pattern template, TBX identity switch, anterior SHH mirror duplication, WNT7a-mediated dorsalization, WNT7a–SHH maintenance, loss of growth-plate length contribution, dorsal divisions versus dorsal primary rami, HOXA13/HOXD13 phenotype comparison, or oligohydramnios-associated contractures.

Some new questions extend a concept mentioned in an old distractor or explanation. The coverage file explicitly identifies those relationships. For example, TBX5 and type I collagen previously appeared in distractor explanations; the new set assesses their characteristic clinical combinations directly. The existing muscle-template question mentions splitting and fusion, while the new question directly asks why one muscle can contain several original segmental contributions. These are assessment gaps rather than claims that the old bank never mentioned the words.

The closest linked new pair is 009/014: 009 tests the ectodermal boundary where SER2/AER appears, and 014 tests the upstream ventral EN1 repression that establishes that boundary. The existing EN1 item tests its separate WNT7a output. Independent duplication review retained both: 009 tests the downstream location at a positive/negative ectodermal interface, whereas 014 tests the upstream repressor action that creates that interface. Both are calibrated to difficulty 3.

## Source hierarchy and checked locations

- **Primary textbook:** local Langman 15th edition OCR and original PDFs. Chapter 12 runs physical PDF181–192, printed169–180. The main narrative and clinical material are PDF181–190; PDF191–192 contain figures, summary, and the final problem. Limb-applicable Chapter 11 content was inspected at PDF174–180, printed162–168. The selected Chapter 10 skeletal-dysplasia text and table are PDF166–167, printed154–155. Adjacent craniofacial/axial content was screened and excluded.
- **Secondary review:** `02 - Upper and Lower Limbs Review.pdf`, physical/printed pp79–82, plus its `_build/content/limbs.json` sections `limbs-43-development` and `limbs-44-congenital-growth`, and `_build/limbs_author.py`. The review explicitly labels embryology as book support. It was used to audit the saved review's breadth, not to prove teacher coverage.
- **Primary local anatomy transcripts:** all seven TXT files under `TERM 2/04 Upper Limb Carryover/Videos` were searched for developmental vocabulary and matches inspected in context. They cover osteology, axilla, arm, and forearm anatomy. Cartilage and rotation hits refer to adult anatomy/actions. No dedicated limb embryology teaching source was recovered from them.
- **Additional notes:** `/Users/rizzist/Downloads/Embryology 1-9.pdf` is a 12-page condensed general-embryology summary. Its cover and relevant pp6–7,9–10,12 were inspected. It corroborates broad somite/lateral-plate, milestone, primary-center, and teratogen concepts, but neither authorship nor lecturer provenance is established. It does not contain a dedicated limb-development chapter.

The local Med Slides inventory yielded no dedicated limb embryology slides, notes, recordings, or syllabus. Foundation histology material is a neighboring subject and does not establish an embryology lecture scope. Existing primary-source absence is recorded explicitly, not replaced by an inference from the review.

## Source issues and limits

1. The review's broad `PDF180–190` limb citation includes the last page of Chapter 11 and omits the last two pages of Chapter 12. New item citations use inspected pages and do not repeat that range as the complete chapter.
2. OCR corrupts gene names and table alignment. The original rendered Table10.1 and Figure12.8 were inspected to confirm gene spelling and phenotype associations; for example, OCR confuses LMX1 with LMX7 and letter I with numeral 1 in collagen genes. Original-page renderings are retained in `source-extracts` for reviewer inspection.
3. `Osteology of the upper limb 1.transcript.txt` line99 contains an ASR use of “embryo” in a scapula description. It is not evidence of embryology teaching.
4. Langman distinguishes limb-field position from muscle innervation. PDF184 describes a lower-limb innervation range, while PDF191 gives a different lower-limb field range. The audit does not collapse them into a universal adult nerve-root map.
5. The Chapter 11 muscle-origin table qualifies the precision of pelvic/lower-limb origins. The general tendon-origin paragraph is not generalized to every regional limb tendon. The new tendon item assesses SCLERAXIS regulation only.
6. The source's general epiphyseal account is not converted into an absolute statement that every epiphysis lacks a prenatal ossification center. No universal bone-by-bone appearance/fusion age table was invented.
7. AER boundary and differentiation-front questions follow the explicitly cited Langman teaching models. Statements qualified as markers or possible roles remain qualified. These items do not claim an independent contemporary research consensus beyond the inspected source.
8. The additional general notes include a varicella–limb hypoplasia row. Infectious teratology is a residual extension: no question was authored from the abbreviated row without inspection of its primary infection source. The full limb-development assessment is therefore bounded, not a claim to exhaust every cause of abnormal limbs in every chapter.
9. Clinical vignettes assess developmental mechanisms and phenotype associations; they are not diagnostic certainty rules for real patients or instructions for management.

## Deliverables and self-audit

`questions.jsonl`, `modules.json`, `concepts.json`, `source-audit.json`, and `coverage.json` are the integration assets. `coverage.json` contains 40 new-item rows, 15 retained-coverage rows accounting for every existing embryo-limb question, and one unresolved course-source row. Source-audit entries use the repository schema's permitted statuses; source caveats and errors are carried in their notes rather than invented status values.

`self_audit.cjs` validates each question against `mcq-question.schema.json` and every module/concept/audit item against the corresponding definitions in `term2-concepts.schema.json`. It also checks old/new ID collisions, exact prompt duplicates, status and tags, four-option reasoning, module/concept references, one-to-one mapping of all 40 new questions, coverage of all 17 old questions, and source page fields. The author self-audit passes with zero errors. This is structural and author verification, not independent verification of medical content.

All IDs for new questions, modules, concepts, and objectives begin `limb-audit-emb-`. Only the assigned research-output directory was written. The medical-prep repository and all original source documents were treated as read-only. No review gate was created by the author. Independent content/source and duplication review is now complete; all question statuses remain draft while the parent validates the review gate. The author self-audit files preserve the pre-review snapshot; the current post-review validation and hashes are recorded in `independent-review.json` and `review-gate.json`.

## Independent review outcome

Reviewer `/root/limb_physiology_audit` read all 40 new questions, all 17 existing questions, the 11 concept mappings, and the complete cited Langman chapter pages. Fresh original-page inspection confirmed Table10.1, Table11.1, Figure12.8 and Figure12.9 where OCR or layout could mislead. All 40 keys were supported; none was changed or deleted. Twenty-five items received content/distractor and/or difficulty revisions. The most common change replaced distant alternatives with competing developmental mechanisms; 14 previously challenge-labelled items were recalibrated to core. Question037 and its concept now explicitly distinguish the text's muscle-absence example from present but dysfunctional muscle without implying complete absence of all body muscles. Every draft remains a textbook extension because dedicated primary limb-embryology teaching remains unavailable. Post-revision validation passes with zero errors, and the signed gate fixes hashes for the five integration assets.
