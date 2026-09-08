# Anatomy clarity, bidirectional practice and advanced selection

Implemented 2026-09-07 for CVS, respiratory, upper and lower limbs.

## Visible interaction

- Solid surfaces are the default. Arteries remain red, veins blue and nerves yellow. X-ray is an explicit option, not an automatic consequence of highlighting.
- Selected targets retain their tissue color with emissive illumination and a cyan Fresnel contour, including an occlusion-visible target-only overlay. The overlay obeys the active anatomical clipping plane.
- Camera orbit and optional auto-orbit pivot around the selected structure. The anatomy itself does not rotate, so sagittal/coronal/transverse planes remain stable. Resize preserves the chosen direction and pivot; portrait fitting accounts for horizontal field of view.
- Thin schematic guide envelopes are hidden initially; Show coverings, layer controls, Isolate target and Center target provide deliberate inspection.
- Anatomy exposes Identify MCQs, Find/click location, Mixed and Drag labels directly. Location answers require explicit submission. Correctness and named labels remain hidden until the chosen feedback mode permits reveal.
- The label game supports drag/drop, tap-select followed by placement, and keyboard preview followed by explicit placement. Grading is one-to-one, handles identically worded source labels fairly, and reports unplaced labels separately. Correctness never depends on a saved score.

## Advanced practice policy

`src/lib/mcq/advanced-anatomy.mjs` removes elementary whole-organ/bone and major-vessel recognition, plus ten individually audited simple written recalls. It does **not** remove a question merely because it mentions the trachea, aorta or SVC. Branches, anatomical relations, named nerves, procedural hazards and clinical reasoning remain. The old “which system?” generator is replaced with identification for every eligible detailed model target.

| Exam | Elementary bank records retired | Active anatomy bank records | Source targets in both directions | Model targets in both directions |
| --- | ---: | ---: | ---: | ---: |
| CVS | 218 | 441 | 123 | 143 |
| Respiratory | 49 | 610 | 158 | 96 |
| Upper/lower limbs | 87 | 1,142 | 319 | 238 |
| Total | 354 | 2,193 | 600 | 477 |

The game covers 61 source figures and 44 model rounds. All 711 source labels and 529 registered model targets remain in the full anatomy/context data; only requested practice targets are reduced. These are records/targets, not independent concepts or a guarantee of exam scope.

Of the retained source targets, 450 have unambiguous selectable 3D counterparts; 150 remain 2D for assessment. Context-only models do not silently stand in for missing segmentation. Diagram clicking uses authored callout/hotspot boxes, not whole-organ pixel segmentation. Existing schematic meshes remain explicitly identified as schematic.

## Cartilage repair and provenance

Replaced floating procedural costal bars with 20 original BodyParts3D 4.3 cartilage meshes, transformed together into the existing thoracic-wall coordinate frame. The costal margin aliases eight of those same objects, without duplicate geometry. Fourteen sternocostal and two sternoclavicular markers are surface-anchored; sternal angle/notch follow native bone.

Public source provenance, pinned revision, transformation, geometry hash, authorship and modification notice are recorded in `public/anatomy3d/cvs/costal-cartilages.provenance.json`. Attribution: BodyParts3D / Database Center for Life Science, CC BY-SA 2.1 Japan. No local machine paths are published in that record.

Independent actual-factory verification passed 34 geometry/ownership checks. Cartilage attachment gaps are below 0.001 in the native model coordinate units (not a clinical millimetre claim). The factory validates 54 structures / 196 meshes.

## Persistence and scope

Practice retrieval, repair, resume, summary and live concept/depth links use the same retirement policy. Raw source records and all theory remain intact. Completed results can retrieve their original questions/media through the history-only route. Genuine past-exam banks remain unchanged at 518 records; no generated questions enter Final Exam.

Trainer migration keeps surviving source answers and restores the current question by ID. A new model-generation seed prevents old elementary system answers from being reinterpreted as new identification answers. Game snapshots store the requested label inventory; changed inventories preserve valid placements but require regrading.

## Verification

- `npm test`: 100/100 tests passed, including production-worker API tests and server-rendered interaction contracts.
- Eight actual anatomy factories validated; independent cartilage checks passed.
- Targeted ESLint, TypeScript, deployment-asset validation and `npm run vercel-build` passed.
- Independent paired-answer checks: 450 correct and 5,269 incorrect selectable mappings scored consistently.
- No browser/GPU visual QA was performed in this pass. The checks establish geometry, data, shader integration and interaction contracts, not a pixel-level appearance certification.

Local implementation only; no Git commit, push or public deployment was performed for this request.
