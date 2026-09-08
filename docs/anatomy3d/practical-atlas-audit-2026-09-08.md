# Practical anatomy atlas audit — 8 September 2026

## Study workflow

Open **Anatomy · 2D / 3D → Study 2D figures**. Select Upper limb, Lower limb,
CVS & thorax, Respiratory, or All anatomy. Use Previous/Next figure, search,
Hide/Reveal labels, or **Practice · find the label**. The latter asks for a name,
then requires a numbered location and explicit submission. The normal anatomy
test also supports identification MCQs, reverse-location questions and a
drag-label board. New reviewed figures feed these modes and the ordinary bank;
the genuine Past Exams collection is unchanged.

**Explore 3D atlas** opens the figure's corresponding region. Returning to 2D
retains the gallery, filter, current target and answer. Regional 3D context is
not an exact reconstruction of every source-image detail. True mapped targets
can use paired 3D grading; unmapped callouts are graded only in the source image.

## Implemented additions and corrections

- 55 additional individually named source meshes: 15 upper-limb and 40 lower-limb.
  The eight carpals are separately selectable. Upper additions separate biceps
  and triceps heads, both rhomboids and the oblique adductor-pollicis head.
- Lower additions include all five metatarsals, fourteen toe phalanges, both
  hallux sesamoids, four lumbricals, three plantar interossei, individual muscle
  heads and the leg interosseous membrane. All seven tarsals were already present.
- 49 bone-surface landmark pins: 18 humeral and 31 lower-limb. These mark locations
  on actual source vertices, not independently segmented boundaries. Humeral
  additions include both ends, tubercles/grooves, epicondyles, capitulum/trochlea,
  and olecranon, coronoid and radial fossae.
- Shoulder/elbow reference overlays now use local bone-end coordinates, rather
  than whole-shaft centers. Original source muscle geometry retains its common
  anatomical transform; no arbitrary real-mesh repositioning was used.
- Eleven added diagrammatic tendon/ligament routes and six limited cartilage
  samples, with separate Tendons and Ligaments layer controls. Cartilage samples
  exclude the tibial intercondylar attachment zone and femoral-head fovea region;
  the calcaneofibular route was corrected to run posteroinferiorly.
- 45 added/expanded image records; three expanded figures supersede sparse gallery
  views without changing old question IDs, answer choices or stored history.
  The resulting all-region study gallery has 103 entries. Source art comes from
  the local Gray's Anatomy 42nd edition; the pre-existing slide/book figures remain.
- Dense numeral buttons have collision-avoiding display positions with leader
  lines to unchanged source callouts. Pointer, keyboard and drag/drop target IDs
  are explicit. Study hiding retains original numbered callouts and hides the
  answer key. Unreviewed study-only or gallery-only figures cannot be graded.
- Immersive pages can scroll on laptop/macOS. Plain wheel/trackpad input over the
  3D canvas scrolls the page; modifier-wheel or +/- controls zoom the model.

## Coverage and limitations

The lower-limb audit has **379 practical-study targets**, not a university-issued
exam blueprint. Its current representation is:

| Representation | Targets |
| --- | ---: |
| Source-mesh structures or explicitly described groups | 118 |
| Diagrammatic routes, landmarks or limited cartilage samples | 93 |
| Named 2D callouts without dedicated 3D | 117 |
| Regional 2D context only | 9 |
| Book references without an exact mapped gallery target | 42 |

Thus **168 targets still lack dedicated 3D**, including the 117 that can now be
studied and tested through named 2D callouts. Do not present the atlas as an
exhaustive, specimen-validated anatomical reconstruction. The searchable
in-app **Practical coverage checklist** exposes every audited row, representation
type, source figure and available chapter/PDF locator; select **Needs book review**
for the 51 context-only/book-reference rows.

The companion `lower-limb-remaining-book-review.md` groups those 51 rows into
28 revision checkboxes with Gray's chapter/PDF locators. Treat it as a supplement
to the gallery and your course's practical list, not a prediction of the paper.

The upper-limb muscle checklist has 55 entries: 52 source-mesh/group entries and
three now covered by named 2D figures but without dedicated meshes (latissimus
dorsi, deep flexor-pollicis-brevis head, palmaris brevis). Some hand muscles and
finger bones remain grouped. The upper-limb 3D source is right-sided; several
source-book figures are left-sided and explicitly described as such.

Intercostal layers, costal groove and their neurovascular bundle are under the
thoracic-wall/CVS source figures, also accessible in Respiratory and All anatomy.
They are not mislabeled as humeral structures.

## Source and verification trail

- Book: *Gray's Anatomy: The Anatomical Basis of Clinical Practice*, 42nd edition.
  Upper limb chapters 48–51; lower limb chapters 76–79; appropriate plexus figures
  also use chapters 61 and 71. Per-image source metadata preserves figure/page IDs.
- Mesh source: pinned BodyParts3D revision
  `4fd65571dd078ddcb2ceba9f9e3b02cffcb5774b`, with original attribution/license and
  verified file hashes in `public/anatomy3d/practical-detail/source-attribution.json`.
- Independent agent reviews, native-callout coordinate checks, source-vertex pin
  checks and residual coverage live in `data/term2/provenance/practical-anatomy/`.
- Regression tests cover source meshes, landmark parents, cartilage exclusions,
  mask/answer integrity, both response directions, study-only grading holds,
  retained history, paired catalogs, dense badges and scrolling.
- Final full test run: **112/112 passed**. Bank validation passed for 10,710
  study records and the unchanged 518 genuine final-exam records. The anatomy
  visual builder contains 2,786 identification variants and the location builder
  1,429 reverse-direction records (including existing respiratory figures).
  Variant counts are not counts of distinct anatomical concepts.
- Both the Vinext build and Next/Vercel production build passed; changed-file
  lint and TypeScript checks passed. All eight registered 3D factories were
  instantiated and validated with their actual local geometry assets.
- Browser verification: ordinary scrolling over the loaded lower-limb model
  advanced the document by 560 pixels; both document overflow settings are auto.
  A patellar-facet practice round retained its lower-limb filter, figure, target
  and selected location after visiting 3D. Explicit submission produced the
  expected correct-target feedback. A fresh patella label board accepted a
  selected label at its numbered location and graded 1/15 correctly; QA-only
  placements were reset and the previous board selection restored.
- An independent handler harness passed 958 checks for explicit mouse/keyboard
  selection, drop target IDs and dense source-number placement. Native OS drag
  transport was not separately automated; the click-to-place alternative was
  verified end to end in the browser.

All changes are local until explicitly committed and deployed. Original books
and slides were not modified. No question was added to genuine Past Exams.
