# Anatomy 3D Trainer — Engine Contract & Build Spec

Single source of truth for the `anatomy3d` modular study-tool item. Every scaffolding, model, and
finishing task MUST conform to this contract. Respiratory is the first content pack; the engine is
subject-agnostic so future regions are "author one model factory + one manifest + register it."

## 0. Non-negotiables

- **Stack:** Next.js 16 (app router), React 19, TypeScript. Raw **three.js** (add dep `three` +
  `@types/three`). NO react-three-fiber / drei. NO external 3D/model/image assets — all geometry is
  procedural. NO network at runtime.
- **Client-only 3D.** three.js must never execute during SSR/prerender. The viewer initialises three
  **inside `useEffect`** and imports the heavy bits with `await import("three")`. The trainer is pulled
  into `app/page.tsx` via `next/dynamic` with `ssr: false`.
- **Determinism.** MCQ generation is seeded (reuse the FNV/LCG shuffle pattern already in
  `src/lib/mcq/dynamic-anatomy.mjs`). Same seed ⇒ same questions/options order.
- **Node-runnable validation.** Within `src/lib/anatomy3d/`, engine↔model files use **relative
  imports only** (never the `@/` alias) so node can run/instantiate them headlessly. App files
  (`app/`, `src/components/…` top level) may use `@/` as usual.
- **Erasable-syntax TS in model + engine libs** (no `enum`, no `namespace`, no parameter properties) so
  node's native TS type-stripping can execute them for validation.
- Match existing app conventions: lock-on-answer + reveal explanation + per-distractor explanations
  (see `dynamic-anatomy.mjs` / `app/page.tsx`), `localStorage` progress, styling in `app/globals.css`.

## 1. Directory layout

```
src/lib/anatomy3d/
  types.ts            # pure types: Tissue, AnatomyStructure, AnatomyModuleManifest, AnatomyModelHandle, CameraView
  materials.ts        # tissueMaterial(tissue), HIGHLIGHT/ DIM helpers (imports three)
  camera.ts           # framing math: bounding-sphere -> fly-to pose; applyView(view, bbox)
  registry.ts         # modelKey -> { manifest, createModel }; getAnatomyModule(id); listAnatomyModules()
  quiz.mjs            # buildAnatomyQuiz(manifest, {seed, count?, structureIds?}) -> AnatomyQuestion[]
  quiz.d.mts          # types for quiz.mjs
  validate.mjs        # validateManifest(manifest) -> string[]  (pure-data checks, node-testable)
  models/
    respiratory/
      larynx.ts        # createLarynxModel(): AnatomyModelHandle   + export larynxManifest? NO -> see below
      nasal.ts
      trachea-lung.ts
      index.ts         # re-exports the three createX + manifests
  manifests/
    respiratory/
      larynx.manifest.mjs      # PURE DATA (no three import) -> node-testable
      nasal.manifest.mjs
      trachea-lung.manifest.mjs
src/components/anatomy3d/
  AnatomyViewer.tsx   # the three.js canvas (client). auto-rotate, fly-to, highlight, raycast-pick, labels
  AnatomyTrainer.tsx  # left viewer + right panel; Quiz mode + Training mode; progress
scripts/
  validate-anatomy3d.mjs   # instantiates each .ts model factory headless, checks manifest<->mesh coverage
tests/
  anatomy3d-quiz.test.mjs      # quiz builder determinism + validity
  anatomy3d-manifest.test.mjs  # every manifest passes validateManifest()
```

> Manifests are **separate pure-data `.mjs`** files (no `three` import) so `node --test` can import them
> directly. The `.ts` model factory imports its manifest from the sibling `.mjs`. The `scripts/validate-anatomy3d.mjs`
> script (run with node's native TS support, e.g. `node scripts/validate-anatomy3d.mjs`) imports the `.ts`
> factories, instantiates them, and cross-checks mesh coverage against the manifests.

## 2. Types (`types.ts`)

```ts
export type Tissue =
  | "cartilage" | "bone" | "mucosa" | "muscle" | "ligament" | "membrane"
  | "airway" | "lung" | "nerve" | "artery" | "vein" | "gland" | "cavity";

export type CameraView = {
  // Preferred viewing direction for framing this structure, in spherical terms.
  azimuth: number;   // radians, around +Y (0 = +Z front, PI = behind)
  elevation: number; // radians, from horizontal (+ up)
  zoom?: number;     // multiplier on the auto distance (1 = fit; <1 closer). default 1.
};

export type AnatomyStructure = {
  id: string;                 // stable, kebab-case, unique within module (== mesh userData.structureId)
  label: string;              // full anatomical name shown as the answer
  shortLabel?: string;        // compact label for on-model tags
  aliases?: string[];         // accepted synonyms (typed-answer / dedupe)
  tissue: Tissue;             // drives color
  description: string;        // 1-3 sentence identification note (shown in training + as explanation)
  keyPoints?: string[];       // extra bullet facts (optional)
  difficulty: 1 | 2 | 3;      // 1 easy … 3 hard
  distractorIds?: string[];   // preferred MCQ distractors (must be other ids in this module)
  view?: CameraView;          // optional framing override; else engine frames from bbox front-ish
  quizable?: boolean;         // default true; set false for scene-only scaffolding parts
};

export type AnatomyModuleManifest = {
  id: string;                 // e.g. "resp-larynx"
  region: string;             // e.g. "respiratory"
  modelKey: string;           // registry key, matches the factory (e.g. "larynx")
  title: string;              // "Larynx"
  subject: "anatomy";
  blurb: string;              // one line describing the model
  structures: AnatomyStructure[];
};

// Runtime handle produced by a model factory (client-side).
export type AnatomyModelHandle = {
  root: import("three").Group;                       // add to scene
  structures: Map<string, import("three").Object3D[]>; // structureId -> its meshes (for highlight/pick)
  dispose(): void;                                   // free geometries/materials
};
```

## 3. Model factory contract (what the Opus 5 model tasks build)

Each `models/respiratory/<key>.ts` exports:

```ts
export function create<Name>Model(): AnatomyModelHandle
```

Rules:
1. Build **procedural** three.js geometry (BufferGeometry / Lathe / Extrude / Tube / Shape etc.). No loaders.
2. Recognisable stylised forms, roughly anatomically arranged and to relative scale. Model fits within a
   ~2-unit bounding box centred near origin, oriented anatomically: **+Y = superior, +Z = anterior,
   +X = the subject's left** (viewer looks along −Z at the front by default).
3. Every quizable part is a named mesh (or small group) with `obj.userData.structureId = "<id>"` for
   EACH mesh that belongs to that structure, and is pushed into the returned `structures` map under its id.
4. Use **`tissueMaterial(tissue)`** from `../../materials` for every mesh (gives consistent color +
   emissive-ready `MeshStandardMaterial` so highlight works). Do not hand-roll materials.
5. Import the sibling manifest (`../../manifests/respiratory/<key>.manifest.mjs`) and ensure EVERY
   `structure.id` (where `quizable !== false`) resolves to ≥1 mesh, and NO mesh carries a `structureId`
   absent from the manifest. `node scripts/validate-anatomy3d.mjs --model <key>` MUST pass.
6. Use only **erasable TS syntax** and **relative imports**. `dispose()` must traverse `root` and dispose
   geometries + materials.
7. Deterministic (no `Math.random` without a fixed seed; prefer fixed construction).

### Manifest (`manifests/respiratory/<key>.manifest.mjs`) — pure data
Plain `export const <key>Manifest = { ... }` object matching `AnatomyModuleManifest`, JSDoc-typed via
`/** @type {import("../../types").AnatomyModuleManifest} */`. Content (labels, descriptions, keyPoints,
distractors, difficulty, view) is sourced from standard Gray's/Snell respiratory anatomy (the slide decks
are Gray's/Snell plates). Every structure needs a real identification `description`.

## 4. Engine helpers

- `materials.ts`: `tissueMaterial(tissue): MeshStandardMaterial` (cloneable palette per tissue);
  `applyHighlight(objs)`, `clearHighlight(objs)` (emissive glow), `applyDim(all, exceptIds)` /
  `clearDim(all)` (fade non-targets). Palette: cartilage `#c8d4e0`, bone `#efe6d2`, mucosa `#d98a8a`,
  muscle `#b5544d`, ligament/membrane `#d9c9a3`, airway `#cdb9a0`, lung `#e0a3a0`, nerve `#e8d24a`,
  artery `#c0392b`, vein `#2b5fa0`, gland `#c98f6b`, cavity `#8fb0c8` (semi-transparent).
- `camera.ts`: `frameStructure(objs, camera, controls?, view?)` → computes target = combined bbox center,
  distance from bbox radius / camera fov, direction from `view` (azimuth/elevation) or a default
  front-three-quarter. Returns `{ position, target }` for the animator to lerp to.
- The viewer owns a manual RAF loop: idle = slow auto-rotate of the model group; on focus = smoothly lerp
  camera position + orbit target to the framed pose (ease), then hold; highlight target + dim others.

## 5. Quiz builder (`quiz.mjs`)

```ts
buildAnatomyQuiz(manifest, { seed, count?, structureIds? }) => AnatomyQuestion[]
```
- One question per quizable structure (or the subset in `structureIds`), shuffled by `seed`.
- 4 options: correct = target.label; 3 distractors from `distractorIds` first, then other same-module
  structures (prefer same `tissue`/nearby), seeded shuffle. Never duplicate labels.
- `AnatomyQuestion` shape (align with app usage): `{ id, moduleId, structureId, prompt, options:[{id:'A'..,text}],
  correctOptionId, explanation, distractorExplanations:{[optId]:string}, difficulty, view?, label }`.
  `prompt`: "Which structure is highlighted?" `explanation`: the target description; distractor
  explanations: "<label> — <its description>".
- Export `validateQuizQuestion(q)` returning errors[] (4 opts, unique labels, correct present, target
  matches). Determinism + validity are covered by `tests/anatomy3d-quiz.test.mjs`.

## 6. Trainer UI (`AnatomyTrainer.tsx`) — two modes

Layout: **left** = `AnatomyViewer` (rotating model, fly-to + highlight), **right** = mode panel.

- **Module switcher**: Larynx / Nasal & sinuses / Trachea & lungs (from `listAnatomyModules("respiratory")`).
- **Quiz mode:** viewer auto-rotates, then cuts/zooms to the current question's structure & highlights it;
  right shows the 4-option MCQ. Choosing locks the question, reveals correct answer + explanation +
  per-distractor notes (existing pattern), then Next. Track score + wrong list in `localStorage`
  (key `anatomy3d.progress.v1`). "Restart" reseeds.
- **Training mode:** big **"Show me a random location"** button → camera flies to a random structure,
  highlights it, reveals name + description + keyPoints. Plus **free-explore**: click any part in the
  viewer to select+frame+describe it; a **Labels** toggle shows on-model tags for all parts. No scoring.
- Keep it responsive; stack vertically on narrow screens. Style via classes added to `app/globals.css`
  (match the app's existing card/nav aesthetic; do not restyle unrelated components).

## 7. Integration

- New tab **"3D Anatomy"** in the `tabs` array in `app/page.tsx`, rendered only when
  `exam === "term2-respiratory"` (like "Study concepts"). Render `<AnatomyTrainer />` in that tab,
  imported via `next/dynamic(() => import("@/src/components/anatomy3d/AnatomyTrainer"), { ssr:false })`.
- Do not break existing tabs, sessions, or `npm test`.

## 8. Acceptance (every phase must keep these green)

- `npm run build`  (Next production build) succeeds.
- `node --test tests/anatomy3d-*.test.mjs` passes.
- `node scripts/validate-anatomy3d.mjs` passes for all registered models (full manifest↔mesh coverage).
- `npm run lint` clean for new files.
- App boots; "3D Anatomy" tab renders the viewer; quiz + training modes work; every structure is
  reachable, highlightable, and correctly labelled.

## 9. Respiratory content scope (from the slide decks — Gray's/Snell)

**Larynx:** thyroid cartilage (laminae + laryngeal prominence + superior/inferior horns), cricoid
cartilage (arch + lamina), arytenoid cartilages, corniculate cartilages, cuneiform cartilages, epiglottis,
hyoid bone, thyrohyoid membrane, median cricothyroid ligament, cricothyroid muscle, vocal folds (true),
vestibular folds (false).

**Nasal / paranasal:** nasal bones, nasal septum (bony + septal cartilage), superior/middle/inferior
nasal conchae, superior/middle/inferior meatuses, frontal sinus, maxillary sinus, ethmoidal air cells,
sphenoid sinus, hard palate, choanae (posterior nasal apertures).

**Trachea & lungs:** trachea, tracheal (C-shaped) cartilage rings, trachealis muscle, carina, right main
bronchus, left main bronchus, right lung upper/middle/lower lobes, left lung upper/lower lobes, horizontal
fissure, oblique fissure(s), cardiac notch, lingula, hilum / root of lung.
