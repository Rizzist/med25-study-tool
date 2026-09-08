# Term 2 book/slide expansion — 8 September 2026

This pass adds original, source-grounded practice to the existing problem sets. It does not reproduce a publisher's question bank, create simulated past papers, or establish faculty exam weighting. Each authoring batch has a separate agent reviewer; that is not faculty approval or empirical difficulty calibration.

## Added in this pass

| Exam | Anatomy | Physiology | Histology | Embryology | New MCQs | Core / challenge |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CVS, including back/spinal anatomy | 94 | 47 | 7 | 5 | 153 | 91 / 62 |
| Respiratory | 16 | 38 | 11 | 6 | 71 | 37 / 34 |
| Upper and lower limbs | 60 | 5 | 10 | 5 | 80 | 48 / 32 |
| Total | 170 | 90 | 28 | 16 | 304 | 176 / 128 |

These are additions, not the total existing bank. All are single-best-answer questions with four options and option-specific teaching explanations. The new catalog contains 70 concepts across 49 modules, 272 short-answer retrieval prompts, and objective links for every new MCQ. Four original Gray's figures accompany applied back/spinal questions. They retain labels because the questions test relationships and mechanisms rather than merely asking students to copy a visible name.

Core here is difficulty 3; challenge is difficulty 4–5. Reviewers reduced inflated ratings and removed redundant/elementary drafts rather than targeting a percentage. A difficult-looking stem or rare name alone was not enough to count as challenge.

## CVS: back and spinal cord

Back is placed in CVS at the user's request. It is a book extension, not evidence that a supplied cardiovascular lecture assigned all of these topics. The 64 back/spinal questions cover:

- Vertebral canal/foraminal boundaries; craniovertebral and regional joints; discs and ligaments.
- Exiting versus traversing roots, cervical numbering, roots versus rami, recurrent meningeal branches, segment-versus-vertebra relationships, conus and cauda equina.
- Meninges, dural sleeves, lumbar cistern, epidural veins, cord anchoring, spinal arterial reinforcement and relevant clinical localization.
- Intrinsic and suboccipital muscles, motor versus cutaneous nerve territories, thoracolumbar fascial compartments and spinal curves.

Primary reading is **Gray's Anatomy for Students, 3rd edition, Chapter 2 (Back), printed pp. 57–120 / local PDF pp. 69–132**, supplemented by explicitly cited regional detail in Gray's Anatomy, 42nd edition. Printed pages and PDF positions are kept distinct. The four figures are 2.22, 2.49B, 2.51 and 2.52.

In the app, use **CVS → Study concepts** and the four modules starting **Back:**. Each has explanations, retrieval Q&As, exact source locations and objective-level practice. The ordinary CVS subject/challenge pools also include these questions.

## Other gaps addressed

| Area | Focus of the additions | Main source basis |
| --- | --- | --- |
| CVS anatomy | Valve support and conduction relationships; coronary territories and variants; thoracic wall, nerve routes, mediastinal continuity and diaphragmatic mechanics | Gray's 3rd-edition Thorax and Gray's 42nd-edition regional anatomy; compared with the existing course-mapped bank |
| CVS physiology | Pacemaker competition/reentry, ECG vectors and calibration, reflex/renal pressure regulation, venous-return curves, spinal sympathetic loss, pump/valve failure and shock | Local Guyton and Hall, 15th edition; exact PDF locations on each item |
| CVS histology/embryology | Follicular antigen processing, splenic compartments, primary lymph sacs, lymphatic specification and duct remodeling | Junqueira 16th edition, Chapter 14; Langman 15th edition, Chapter 13 |
| Respiratory anatomy | Nasal neurovascular injury localization, laryngeal tissue planes, pleural procedures and shared hilar/segmental relationships | Gray's 42nd edition; compared against the existing nasal/larynx/trachea-lung course sets |
| Respiratory physiology | Flow limitation, compliance, dead space, pressure/flow interactions, V/Q and shunt reasoning, oxygen delivery, respiratory control and ventilatory support | Guyton respiratory chapters; labeled book-only where local physiology lectures were not found |
| Respiratory histology/embryology | Airway defense and repair, alveolar barrier/surfactant, developmental compartments and maturation defects | Junqueira Chapter 17; Langman Chapter 14 and the respiratory embryology slides |
| Limbs anatomy | Shoulder/plexus localization, forearm load transfer and neurovascular pathways, tendon/hand mechanics, hip/thigh relations, knee/ankle stability, leg lesion localization and foot mechanics | Gray's 42nd-edition regional pages; existing Gray's Student/course-mapped questions retained |
| Limb-related sciences | Limb growth and compartment development; cartilage/bone mechanics; skeletal-muscle architecture, excitation and force | Langman Chapter 12; Junqueira Chapters 7, 8 and 10; Guyton Chapters 6 and 7 |

The previously recorded CVS lymphatic-development sampling gap is reconciled with the five new questions, including primary lymph-sac positions. Existing CVS cardiac/vessel histology and embryology sets are retained rather than duplicated simply to increase counts.

## Audit limits that remain visible

- Lower-limb inclusion in the exam was confirmed by the user. Local lower-limb lecture files were not located, so detailed lecturer emphasis cannot be inferred from the book extension. Some expected later hand teaching material is also missing locally.
- No local respiratory physiology lecture set was found. Book-grounded practice is available, but it is not represented as slide-confirmed.
- Gray's Student 3rd-edition extraction is encoding-corrupted. Back pages were checked with OCR/rendered source evidence; new limb claims were verified against readable, explicitly cited Gray's 42nd-edition pages instead of inventing Student-edition locators.
- Image-dominant slides with insufficient readable content were not treated as evidence for unverified anatomical claims. The existing visual atlas remains available.
- This is a gap-driven source audit, not a claim that every textbook paragraph, variant, treatment protocol or possible university question has been sampled. The supplied files do not provide a complete official exam blueprint.

## Review and regression evidence

Final verification on 8 September 2026: all 103 tests passed; the Vite/Vinext build and the Next/Vercel production build passed; TypeScript and scoped ESLint checks passed. The restarted local Next server served all 304 additions with exact matching question payloads and all four image hashes. The Term 2 genuine-final endpoints correctly remain unavailable. These checks were performed locally before the subsequent Git commit/push; production deployment completion is a separate check.

The import script requires an independent-review gate for every batch, matching SHA-256 hashes for the five reviewed payloads, exact approved question inventories and hashes for new figures. The exact reviewed files are archived under `data/term2/provenance/comprehensive-expansion/<lane>/reviewed/`; publication changes only status and practice-routing metadata, not the reviewed clinical payload.

Source/audit records and the machine-readable count summary are in `data/term2/provenance/comprehensive-expansion/manifest.json`. Tests verify source locators, four distinct options, all-option explanations, theory links, active-practice eligibility, review hashes, image files, and preservation of the existing 518 genuine past-paper records. No Term 2 past-paper content is fabricated.

Reproduce after the reviewed import:

```sh
node scripts/build-embedded-bank.mjs
npm test
npm run vercel-build
node scripts/check-comprehensive-live.mjs http://127.0.0.1:3000
```

The final command is a read-only API and image check against a running local server. It does not answer questions, change study progress, automate a browser, or deploy the site.
