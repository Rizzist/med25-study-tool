# Term 2 paired visual anatomy

## Source-image scope

| Exam | New original figures | Labeled targets | Separate 3D targets | Regional context only |
| --- | ---: | ---: | ---: | ---: |
| CVS | 19 | 193 | 167 | 26 |
| Upper / lower limbs | 22 | 345 | 281 | 64 |
| Respiratory | 16 | 145 | 99 | 46 |
| Total | 57 | 683 | 547 | 136 |

The new figures generate 1,350 image-identification variants (1,079 have a separate 3D target). Variants change distractors, not just answer-letter order. The four earlier respiratory diagrams and their 56 question IDs are retained, with regional 3D links added. These are source-based study questions, never past-exam questions.

Figures are original local lecture/Gray’s 42nd edition illustrations, not generated drawings. Each has a source locator and inspected callout boxes. Sixteen are lecture figures and 41 are direct Gray’s crops. No limb slide diagrams were found in the available limb folder, so the limb figure set is explicitly book-derived. Source masks hide answer text; callout A stays at the original label leader. Unmasked originals and hover/tap explanations appear only when feedback is permitted.

## 3D correspondence and limits

84 source-derived structures were added: 50 limb structures, 12 cardiovascular structures, 3 nasal/laryngeal structures and 19 contextual bronchial trees. These extend eight regional models. The 19 trees are not quiz targets for a proximal segmental-bronchus callout. A tree, a bronchus and a lung-tissue segment are not interchangeable.

Of the 547 separate source-image targets, 162 are represented schematically. “Separate” therefore does not mean that every target is scan-segmented. Fidelity is disclosed in the UI. The remaining 136 source-image callouts retain their complete 2D questions and regional context; they do not receive an invented exact highlight.

All upper-limb meshes show the right limb; several Gray’s source figures show the left. The UI explicitly describes these as homologous, not same-side, views. Original illustrations were not mirrored.

Heart and mediastinal models can share a calibrated source frame for CVS images. Other modules are not arbitrarily resized and overlaid. The thoracic wall remains a separate selectable regional view where relevant.

## Source geometry and alignment

New meshes use the BodyParts3D 4.3 mirror pinned to `4fd65571dd078ddcb2ceba9f9e3b02cffcb5774b`. `public/anatomy3d/image-detail/source-attribution.json` records source URLs, hashes, uniform transforms, DBCLS attribution and CC-BY-SA 2.1 Japan licensing. Source-frame transforms permute X/Z/−Y and apply a uniform scale plus translation; geometry is not stretched per object to force a match.

Nasal/laryngeal reference fits are essentially exact; independent trachea/main-bronchus anchors agree within 0.447% of source extent. Seventeen parenchymal-segment overlays with incompatible lobe envelopes, a mirrored/mislabeled whole flexor-pollicis-brevis source, partial artery sources and hierarchical duplicate tree assemblies were withheld. The valid superficial flexor-pollicis-brevis head remains available as its own entity.

Complete thenar, hypothenar, tarsal, iliopsoas and fibularis groups reuse their component objects through selection aliases. The transverse adductor-pollicis duplicate is removed without removing its oblique head. Partially subdivided older groups retain residual anatomy; added source surfaces use deterministic depth priority.

## Interaction and persistence

The Anatomy tab is a visual test: figure/model above the prompt and choices; one Settings control. Mixed sessions use roughly four source-image items to one 3D-first item and rotate across source figures. Only one distractor variant per callout enters a test. Source-image and paired-model switches retain the question and answer. Some 3D-first questions offer the corresponding source image when a suitable figure exists.

Learn mode reveals after answering; Test mode reveals only after grading. Labels, picking and callout explanations obey the same gate. Settings contain view mixture, region, size, answer timing, anatomical layers, slicing and the full atlas explorer. Sessions save independently by exam, validate restored IDs/options and preserve deferred-feedback mode.

On desktop, the test fills the available viewport: one compact title/settings row, a height-adaptive source diagram or model, the prompt, four choices in a two-by-two grid, and navigation. There is no app sidebar, branded top bar or separate progress bar. Grading does not grow the page: full option explanations and source references open in a keyboard-accessible review dialog. Figure notes and the structure list live in Settings; unlocked labels remain interactive on the visual. Intentional image enlargement scrolls within the visual only. Mobile uses a readable single-column layout and permits page scrolling.

Browser QA confirmed all four choices and navigation fit at actual CSS viewports of 1837×974, 1707×960 and 1025×600, with page height equal to viewport height. The 338-pixel in-app browser verified mobile behavior, view switching and deferred-feedback gating before/after grading.

Verification: 69 regression tests pass; the Vinext production build and the Next.js/Vercel production build both pass. All eight registered regional models and the shared thoracic composite pass headless geometry/structure-map validation. CVS source views frame cardiac structures without using the full abdominal/neck extent of the venae cavae as the camera target. Dimming preserves authored shell translucency instead of making faint pericardial/compartment surfaces more opaque.

The source catalog and source locators are in `data/term2/anatomy-visual-images.json`. The image bank is in `data/bank/questions/term2-anatomy-visual.jsonl`. Figure concepts and one retrieval objective per target are integrated into the existing course/book maps. This inventory is not an official exam blueprint or a claim that every structure in the complete textbook has a 3D mesh.
