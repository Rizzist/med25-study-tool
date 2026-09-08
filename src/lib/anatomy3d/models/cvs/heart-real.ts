import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { heartManifest } from "../../manifests/cvs/heart-real.manifest.mjs";

// Same-origin assets — no cross-origin network.
const MODEL_URL = "/anatomy3d/cvs/heart.glb";
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
const TARGET_SPAN = 1.9;

const KNOWN_IDS = new Set(heartManifest.structures.map((s) => s.id));
function structureTissue(id: string): Tissue {
  return (heartManifest.structures.find((s) => s.id === id)?.tissue ?? "muscle") as Tissue;
}

// glTF `extras` land on Object3D.userData via GLTFLoader. The GLB is authored with the
// structureId on each part node; fall back to the node name (which == structureId).
function localStructureId(object: Object3D): string | undefined {
  const fromExtras = object.userData?.structureId;
  if (typeof fromExtras === "string" && KNOWN_IDS.has(fromExtras)) return fromExtras;
  if (object.name && KNOWN_IDS.has(object.name)) return object.name;
  return undefined;
}
function resolveStructureId(mesh: Object3D): { id: string; owner: Object3D } | undefined {
  let node: Object3D | null = mesh;
  while (node) {
    const id = localStructureId(node);
    if (id) return { id, owner: node };
    node = node.parent;
  }
  return undefined;
}

export async function createHeartModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();
  await attachImageMeshSupplement(gltf.scene, "heart");

  const root = new Group();
  root.name = "cvs-heart-real";
  root.add(gltf.scene);
  const structures = new Map<string, Object3D[]>();
  const pushMesh = (id: string, mesh: Object3D) => structures.set(id, [...(structures.get(id) ?? []), mesh]);

  // --- Real meshes from the GLB: chambers, papillary muscles, the 4 valves, and the
  //     six heart-region coronary arteries + four coronary veins (19 in total). -----------
  const meshes: Mesh[] = [];
  gltf.scene.traverse((o) => { if ((o as { isMesh?: boolean }).isMesh) meshes.push(o as Mesh); });
  for (const mesh of meshes) {
    const resolved = resolveStructureId(mesh);
    if (!resolved) continue;
    const { id, owner } = resolved;
    const tissue = (owner.userData?.tissue as Tissue) ?? structureTissue(id);
    mesh.userData.structureId = id;
    mesh.name = id;
    const old = mesh.material;
    const material = tissueMaterial(tissue);
    // The real cavity meshes are the four chamber shells (RA/LA/RV/LV) — the heart's recognizable
    // outline. At the palette's 0.48 they stack into one muddy translucent blue mass that buries the
    // interior. Drop them further so the septa, valves, papillary muscles, trabeculae and conduction
    // system read cleanly through the walls in the all-layers view.
    if (tissue === "cavity") material.opacity = 0.32;
    mesh.material = material;
    if (old) for (const m of Array.isArray(old) ? old : [old]) (m as Material).dispose?.();
    pushMesh(id, mesh);
  }

  // --- Procedural (schematic) structures with no separable BodyParts3D mesh -------------
  // Placed from the real meshes' bounding boxes (baked ~1.9-unit space) so they self-align to
  // the loaded anatomy: the auricle, right-atrial interior (crista/pectinate/IVC+CS valves),
  // the septa, ventricular trabeculae + moderator band + chordae, the smooth outflow tracts,
  // the fibrous skeleton, the external surfaces/sulci, the conduction system and the pericardium.
  gltf.scene.updateMatrixWorld(true);
  const boxOf = (ids: string[]): Box3 => {
    const box = new Box3();
    for (const id of ids) for (const obj of structures.get(id) ?? []) box.expandByObject(obj);
    return box;
  };
  const centre = (id: string): Vector3 => {
    const b = boxOf([id]);
    return b.isEmpty() ? new Vector3() : b.getCenter(new Vector3());
  };
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const mid = (a: Vector3, b: Vector3) => a.clone().add(b).multiplyScalar(0.5);

  // `opacity` (only meaningful when `translucent`) tunes how faint a schematic shell is, so the big
  // enclosing layers (pericardium especially) can be kept much fainter than the small interior blobs
  // instead of every translucent mesh sharing one alpha — the same per-mesh override nasal-real.ts uses.
  const addProcedural = (id: string, mesh: Mesh, translucent = false, opacity = 0.2) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    const mat = tissueMaterial(structureTissue(id));
    if (translucent) {
      mat.transparent = true;
      mat.opacity = opacity;
      mat.depthWrite = false;
      mat.side = DoubleSide;
    }
    mesh.material = mat;
    gltf.scene.add(mesh);
    pushMesh(id, mesh);
  };
  // Solid, smoothly-curving cord (arc-length-even control points, rounded cross-section).
  const tube = (id: string, pts: Vector3[], radius: number) => {
    const path = new CatmullRomCurve3(pts, false, "centripetal", 0.5);
    const divisions = Math.max(24, (pts.length - 1) * 14);
    const smooth = new CatmullRomCurve3(path.getSpacedPoints(divisions), false, "centripetal", 0.5);
    addProcedural(id, new Mesh(new TubeGeometry(smooth, divisions, radius, 8, false)));
  };
  const blob = (id: string, at: Vector3, sx: number, sy: number, sz: number, translucent = false, opacity = 0.2) => {
    const m = new Mesh(new SphereGeometry(1, 16, 12));
    m.position.copy(at); m.scale.set(sx, sy, sz);
    addProcedural(id, m, translucent, opacity);
  };
  // Thin oriented slab (a schematic septum). `normal` is the through-plane (thin) direction.
  const slab = (id: string, at: Vector3, normal: Vector3, w: number, h: number, t: number) => {
    const m = new Mesh(new BoxGeometry(w, h, t));
    m.position.copy(at);
    m.lookAt(at.clone().add(normal)); // orient local +Z along the plane normal (t is the thin axis)
    addProcedural(id, m);
  };
  // A small myocardial ridge (short oriented box) — pectinate / trabecula element.
  const ridge = (id: string, at: Vector3, dir: Vector3, len: number, thick: number) => {
    const m = new Mesh(new BoxGeometry(thick, len, thick));
    m.position.copy(at);
    m.lookAt(at.clone().add(dir)); // local +Z along dir; box is tall on +Y, so tilt toward dir
    addProcedural(id, m);
  };
  // A fibrous ring (torus) in a plane whose axis points along `axis` — a valve annulus.
  const ring = (id: string, at: Vector3, axis: Vector3, radius: number, tube_: number) => {
    const m = new Mesh(new TorusGeometry(radius, tube_, 10, 28));
    m.position.copy(at);
    m.lookAt(at.clone().add(axis)); // torus axis is local +Z
    addProcedural(id, m);
  };
  // Concentric translucent ellipsoid shell around a centre (a pericardial layer). These are the
  // largest meshes in the model — each fully encloses the heart — so they default to a very faint
  // alpha and grade even fainter toward the outermost layer, keeping the whole heart visible through
  // them instead of a muddy translucent fog dominating the all-layers view.
  const shell = (id: string, at: Vector3, rx: number, ry: number, rz: number, opacity = 0.08) => {
    blob(id, at, rx, ry, rz, true, opacity);
  };

  // ---- anchors (baked ~1.9u space) -------------------------------------------------------
  const heartBox = boxOf(["right-atrium", "left-atrium", "right-ventricle", "left-ventricle"]);
  const heartC = heartBox.isEmpty() ? new Vector3() : heartBox.getCenter(new Vector3());
  const heartS = heartBox.isEmpty() ? new Vector3(1.7, 1.6, 1.7) : heartBox.getSize(new Vector3());
  const half = heartS.clone().multiplyScalar(0.5);
  const raBox = boxOf(["right-atrium"]);
  const laBox = boxOf(["left-atrium"]);
  const rvBox = boxOf(["right-ventricle"]);
  const lvBox = boxOf(["left-ventricle"]);
  const cRA = centre("right-atrium");
  const cLA = centre("left-atrium");
  const cRV = centre("right-ventricle");
  const cLV = centre("left-ventricle");
  const cPap = centre("papillary-muscles");
  const cTri = centre("tricuspid-valve");
  const cMit = centre("mitral-valve");
  const cAo = centre("aortic-valve");
  const cPul = centre("pulmonary-valve");
  const cCS = centre("coronary-sinus");
  const cRCA = centre("right-coronary-artery");
  const cLCA = centre("left-coronary-artery");
  const cLAD = centre("anterior-interventricular-artery");
  const cCx = centre("circumflex-artery");
  const cPDA = centre("posterior-interventricular-artery");
  const cRM = centre("right-marginal-artery");

  // ==== Right-atrial interior ============================================================
  // Right auricle — ear-shaped pouch off the anterosuperior RA, over the aortic root.
  blob("right-auricle", v(cRA.x + 0.12, cRA.y + 0.34, cRA.z + 0.22), 0.17, 0.14, 0.13, true);
  // Crista terminalis — vertical ridge between the smooth sinus venarum and the pectinate wall.
  tube("crista-terminalis", [
    v(cRA.x + 0.04, raBox.max.y - 0.10, cRA.z + 0.12),
    v(cRA.x + 0.10, cRA.y + 0.06, cRA.z + 0.16),
    v(cRA.x + 0.12, raBox.min.y + 0.14, cRA.z + 0.04),
  ], 0.028);
  // Right atrial pectinate muscles — comb-like ridges fanning anterior to the crista.
  for (let i = 0; i < 6; i++) {
    const t = (i - 2.5) / 2.5;
    ridge(
      "right-atrial-pectinate-muscles",
      v(cRA.x + 0.18 + t * 0.02, cRA.y + 0.16 + t * 0.14, cRA.z + 0.20 + t * 0.02),
      v(1, 0.2 * t, 0.6),
      0.20,
      0.018,
    );
  }
  // Valve of the IVC (Eustachian) — crescentic fold at the IVC orifice, posteroinferior RA.
  tube("valve-of-inferior-vena-cava", [
    v(cRA.x + 0.14, raBox.min.y + 0.18, cRA.z - 0.18),
    v(cRA.x + 0.28, raBox.min.y + 0.12, cRA.z - 0.06),
    v(cRA.x + 0.40, raBox.min.y + 0.18, cRA.z + 0.04),
  ], 0.022);
  // Valve of the coronary sinus (Thebesian) — small fold at the CS ostium into the RA.
  tube("valve-of-coronary-sinus", [
    v(cCS.x + 0.06, cCS.y + 0.10, cCS.z + 0.22),
    v(cCS.x + 0.16, cCS.y + 0.06, cCS.z + 0.30),
    v(cCS.x + 0.26, cCS.y + 0.10, cCS.z + 0.34),
  ], 0.018);

  // ==== Septa ============================================================================
  // Interatrial septum — thin slab between the atria (plane faces antero-leftward).
  slab("interatrial-septum", mid(cRA, cLA), v(0.7, 0.0, 0.7),
    Math.max(0.3, heartS.z * 0.42), Math.max(0.3, heartS.y * 0.42), 0.04);
  // Interventricular septum — oblique slab between the ventricles (bulging into the RV).
  slab("interventricular-septum", mid(cRV, cLV), v(0.7, 0.0, 0.7),
    Math.max(0.35, heartS.z * 0.5), Math.max(0.4, heartS.y * 0.6), 0.05);

  // ==== Ventricular interior =============================================================
  // Trabeculae carneae — fleshy ridges lining the ventricular walls (more in the LV).
  const trabAnchors: Array<[Vector3, Vector3]> = [
    [v(cLV.x + 0.18, cLV.y - 0.06, cLV.z + 0.14), v(0.2, 1, 0.3)],
    [v(cLV.x + 0.10, cLV.y - 0.18, cLV.z - 0.16), v(-0.2, 1, -0.2)],
    [v(cLV.x - 0.12, cLV.y - 0.10, cLV.z + 0.02), v(0.1, 1, 0.1)],
    [v(cLV.x + 0.24, cLV.y - 0.20, cLV.z + 0.02), v(0.0, 1, 0.0)],
    [v(cRV.x - 0.06, cRV.y - 0.14, cRV.z + 0.18), v(0.2, 1, 0.2)],
    [v(cRV.x + 0.14, cRV.y - 0.20, cRV.z + 0.06), v(-0.1, 1, 0.1)],
    [v(cRV.x - 0.14, cRV.y - 0.06, cRV.z - 0.04), v(0.1, 1, -0.1)],
  ];
  for (const [at, dir] of trabAnchors) ridge("trabeculae-carneae", at, dir, 0.24, 0.022);
  // Septomarginal trabecula (moderator band) — RV septum to the anterior papillary muscle base.
  tube("septomarginal-trabecula", [
    v(mid(cRV, cLV).x - 0.04, mid(cRV, cLV).y - 0.10, mid(cRV, cLV).z + 0.06),
    v(cRV.x + 0.10, cRV.y - 0.20, cRV.z + 0.10),
    v(cPap.x - 0.06, cPap.y + 0.10, cPap.z + 0.02),
  ], 0.030);
  // Chordae tendineae — fine cords from the papillary-muscle heads to the AV valves.
  for (const target of [cTri, cMit]) {
    for (const [ox, oz] of [[-0.08, -0.05], [0.0, 0.05], [0.08, -0.03]] as const) {
      tube("chordae-tendineae", [
        v(cPap.x + ox, cPap.y + 0.06, cPap.z + oz),
        v((cPap.x + target.x) / 2 + ox * 0.5, (cPap.y + target.y) / 2 + 0.02, (cPap.z + target.z) / 2 + oz * 0.5),
        v(target.x + ox * 0.6, target.y - 0.04, target.z + oz * 0.6),
      ], 0.010);
    }
  }
  // Conus arteriosus (infundibulum) — smooth RV outflow toward the pulmonary valve.
  blob("conus-arteriosus", v((cRV.x + cPul.x) / 2 + 0.02, (cRV.y + cPul.y) / 2 + 0.06, (cRV.z + cPul.z) / 2), 0.20, 0.28, 0.18, true);
  // Aortic vestibule — smooth, fibrous LV outflow below the aortic valve.
  blob("aortic-vestibule", v((cLV.x + cAo.x) / 2, (cLV.y + cAo.y) / 2 + 0.06, (cLV.z + cAo.z) / 2), 0.16, 0.22, 0.16, true);

  // ==== Fibrous cardiac skeleton =========================================================
  // Four fibrous rings at the valve planes, joined by right/left fibrous trigone blobs.
  ring("cardiac-skeleton", cTri, cTri.clone().sub(heartC), 0.16, 0.02);
  ring("cardiac-skeleton", cMit, cMit.clone().sub(heartC), 0.15, 0.02);
  ring("cardiac-skeleton", cAo, cAo.clone().sub(heartC).multiplyScalar(-1), 0.12, 0.02);
  ring("cardiac-skeleton", cPul, cPul.clone().sub(heartC), 0.12, 0.02);
  blob("cardiac-skeleton", mid(cAo, cMit), 0.05, 0.05, 0.05); // left fibrous trigone
  blob("cardiac-skeleton", mid(cAo, cTri), 0.05, 0.05, 0.05); // right fibrous trigone

  // ==== External surfaces, borders & sulci ===============================================
  // Apex — inferolateral-left tip formed by the LV.
  blob("cardiac-apex", v(lvBox.max.x - 0.12, lvBox.min.y + 0.10, cLV.z + 0.16), 0.16, 0.14, 0.16, true);
  // Base — posterior surface, mainly the LA. These broad surface films are kept fainter than the
  // interior blobs so they read as thin face-markings rather than adding another translucent veil.
  blob("base-of-heart", v(cLA.x, cLA.y - 0.04, laBox.min.z + 0.08), 0.30, 0.28, 0.06, true, 0.14);
  // Sternocostal (anterior) surface — mostly RV, facing the sternum.
  blob("sternocostal-surface", v(cRV.x + 0.04, cRV.y + 0.06, rvBox.max.z - 0.06), 0.32, 0.34, 0.06, true, 0.14);
  // Diaphragmatic (inferior) surface — LV + part of RV, on the diaphragm.
  blob("diaphragmatic-surface", v(heartC.x + 0.05, heartBox.min.y + 0.08, heartC.z + 0.08), 0.36, 0.06, 0.32, true, 0.14);
  // Coronary & interventricular sulci — the AV groove ring plus anterior & posterior IV grooves.
  ring("coronary-sulcus", v(heartC.x, heartC.y + 0.02, heartC.z), v(0.15, 1, 0.0), Math.max(0.55, half.x * 0.85), 0.02);
  tube("coronary-sulcus", [ // anterior interventricular sulcus
    v(cRV.x + 0.05, cRV.y + 0.20, rvBox.max.z - 0.06),
    v(mid(cRV, cLV).x, mid(cRV, cLV).y, heartBox.max.z - 0.12),
    v(lvBox.max.x - 0.14, lvBox.min.y + 0.14, cLV.z + 0.14),
  ], 0.018);
  tube("coronary-sulcus", [ // posterior interventricular sulcus
    v(heartC.x, heartC.y - 0.05, heartBox.min.z + 0.10),
    v(mid(cRV, cLV).x, mid(cRV, cLV).y - 0.10, cCS.z + 0.02),
    v(lvBox.max.x - 0.16, lvBox.min.y + 0.16, cLV.z + 0.02),
  ], 0.018);

  // ==== Conduction system ================================================================
  const saAt = v(cRA.x + 0.05, raBox.max.y - 0.12, cRA.z + 0.14);
  blob("sinoatrial-node", saAt, 0.05, 0.07, 0.05);
  const avAt = v(cCS.x + 0.10, cCS.y + 0.14, cCS.z + 0.22);
  blob("atrioventricular-node", avAt, 0.05, 0.05, 0.05);
  const hisTop = v(avAt.x, avAt.y - 0.06, avAt.z + 0.04);
  const hisBottom = v(mid(cRV, cLV).x, mid(cRV, cLV).y + 0.14, mid(cRV, cLV).z);
  tube("atrioventricular-bundle", [avAt, hisTop, hisBottom], 0.022);
  // Right bundle branch — down the right side of the septum toward the moderator band.
  tube("right-bundle-branch", [
    hisBottom, v(cRV.x + 0.06, mid(cRV, cLV).y - 0.14, cRV.z + 0.04), v(cPap.x - 0.06, cPap.y + 0.06, cPap.z + 0.02),
  ], 0.015);
  // Left bundle branch — broader, down the left side of the septum.
  tube("left-bundle-branch", [
    hisBottom, v(cLV.x - 0.06, mid(cRV, cLV).y - 0.12, cLV.z), v(cLV.x - 0.04, cLV.y - 0.22, cLV.z),
  ], 0.017);

  // ==== Cardiac autonomic nerves ========================================================
  // Nerve paths are derived from the real chamber and coronary-vessel bounding boxes.  Keeping
  // them in this same model makes "Nerves" an ordinary layer beside arteries, veins and muscle,
  // while also ensuring the coronary plexuses sit directly on their named arteries.
  const superficialPlexusAt = v(heartC.x + half.x * 0.03, heartBox.max.y - half.y * 0.10, heartBox.max.z - half.z * 0.22);
  const deepPlexusAt = v(heartC.x, heartBox.max.y - half.y * 0.06, heartBox.min.z + half.z * 0.12);
  const nervePlexus = (id: string, at: Vector3, radius: number) => {
    blob(id, at, radius * 0.9, radius * 0.75, radius * 0.65);
    tube(id, [
      v(at.x - radius, at.y + radius * 0.35, at.z), at.clone().add(v(0, 0, radius * 0.25)),
      v(at.x + radius, at.y - radius * 0.35, at.z),
    ], radius * 0.14);
    tube(id, [
      v(at.x + radius * 0.8, at.y + radius * 0.45, at.z - radius * 0.2), at,
      v(at.x - radius * 0.75, at.y - radius * 0.5, at.z + radius * 0.2),
    ], radius * 0.13);
  };
  nervePlexus("superficial-cardiac-plexus", superficialPlexusAt, Math.max(0.045, half.x * 0.065));
  nervePlexus("deep-cardiac-plexus", deepPlexusAt, Math.max(0.06, half.x * 0.085));

  // Superior/middle/inferior cervical cardiac branches enter at the superior heart border.  Their
  // proximal neck portions live in the mediastinum module; the displayed distal portions converge
  // precisely on the superficial/deep plexuses rather than floating above the cardiac silhouette.
  const inletY = heartBox.max.y + half.y * 0.05;
  for (const side of [1, -1]) {
    tube("superior-cervical-cardiac-nerve", [
      v(heartC.x + side * half.x * 0.32, inletY, heartC.z - half.z * 0.15),
      v(heartC.x + side * half.x * 0.20, heartBox.max.y - half.y * 0.02, heartC.z - half.z * 0.12),
      superficialPlexusAt,
    ], 0.007);
    tube("middle-cervical-cardiac-nerve", [
      v(heartC.x + side * half.x * 0.24, inletY - half.y * 0.03, heartC.z - half.z * 0.30),
      v(heartC.x + side * half.x * 0.14, heartBox.max.y - half.y * 0.09, heartC.z - half.z * 0.30),
      deepPlexusAt,
    ], 0.007);
    tube("inferior-cervical-cardiac-nerve", [
      v(heartC.x + side * half.x * 0.42, heartBox.max.y - half.y * 0.10, heartC.z - half.z * 0.35),
      v(heartC.x + side * half.x * 0.20, heartBox.max.y - half.y * 0.14, heartC.z - half.z * 0.25),
      deepPlexusAt,
    ], 0.007);
    tube("thoracic-cardiac-nerves", [
      v(heartC.x + side * half.x * 0.58, heartC.y + half.y * 0.30, heartBox.min.z + half.z * 0.08),
      v(heartC.x + side * half.x * 0.36, heartC.y + half.y * 0.38, heartBox.min.z + half.z * 0.10),
      deepPlexusAt,
    ], 0.0065);
  }
  // Two short vagal contributors approach from the posterolateral superior border.
  for (const side of [1, -1]) tube("vagal-cardiac-branches", [
    v(heartC.x + side * half.x * 0.42, heartBox.max.y - half.y * 0.02, heartBox.min.z + half.z * 0.04),
    v(heartC.x + side * half.x * 0.20, heartBox.max.y - half.y * 0.10, heartBox.min.z + half.z * 0.08),
    deepPlexusAt,
  ], 0.0065);

  // Periarterial cardiac plexuses: branch directly over the centres of the real coronary meshes.
  tube("right-coronary-plexus", [deepPlexusAt, cRCA, cRM], 0.006);
  tube("right-coronary-plexus", [cRCA, v((cRCA.x + cPDA.x) / 2, (cRCA.y + cPDA.y) / 2, (cRCA.z + cPDA.z) / 2), cPDA], 0.0055);
  tube("left-coronary-plexus", [deepPlexusAt, cLCA, cLAD], 0.006);
  tube("left-coronary-plexus", [cLCA, v((cLCA.x + cCx.x) / 2, (cLCA.y + cCx.y) / 2, (cLCA.z + cCx.z) / 2), cCx], 0.0055);

  // Pain afferents return from ventricular myocardium with sympathetics; reflex afferents return
  // from the atria/great-vessel root with the vagi.  Both paths terminate within the visible heart.
  tube("cardiac-visceral-afferents", [
    v(cLV.x, cLV.y, lvBox.max.z - half.z * 0.04), cLAD, deepPlexusAt,
    v(heartC.x + half.x * 0.42, heartBox.max.y - half.y * 0.02, heartBox.min.z + half.z * 0.04),
  ], 0.0055);
  tube("cardiac-visceral-afferents", [
    v(cRA.x, cRA.y + half.y * 0.15, raBox.max.z - half.z * 0.04), superficialPlexusAt,
    v(heartC.x - half.x * 0.42, heartBox.max.y - half.y * 0.02, heartBox.min.z + half.z * 0.04),
  ], 0.0055);

  // ==== Pericardium ======================================================================
  // Nested translucent shells (outer → inner): fibrous, parietal serous, cavity, visceral/epicardium.
  // Alpha grades up from the outermost fibrous sac (faintest, so it never dominates) to the visceral
  // layer hugging the myocardium — four stacked shells would otherwise compound into an opaque haze.
  shell("fibrous-pericardium", heartC, half.x + 0.22, half.y + 0.24, half.z + 0.22, 0.05);
  shell("parietal-serous-pericardium", heartC, half.x + 0.15, half.y + 0.17, half.z + 0.15, 0.06);
  shell("pericardial-cavity", heartC, half.x + 0.10, half.y + 0.12, half.z + 0.10, 0.07);
  shell("visceral-serous-pericardium", heartC, half.x + 0.05, half.y + 0.06, half.z + 0.05, 0.09);
  // Transverse pericardial sinus — behind the arterial poles (aorta/pulmonary trunk), above the atria.
  tube("transverse-pericardial-sinus", [
    v(cRA.x + 0.14, cRA.y + 0.40, cRA.z - 0.02),
    v(cAo.x, cAo.y + 0.18, cAo.z - 0.08),
    v(cLV.x + 0.10, cLA.y + 0.34, cLA.z + 0.10),
  ], 0.030);
  // Oblique pericardial sinus — blind cul-de-sac behind the left atrium.
  blob("oblique-pericardial-sinus", v(cLA.x, cLA.y - 0.04, laBox.min.z - 0.10), 0.22, 0.20, 0.10, true);

  // Defensive normalization to the contract (~2-unit bbox centred at origin). The GLB is baked
  // normalized to the heart; this folds in the procedural additions (pericardium included).
  const bbox = new Box3().setFromObject(root);
  if (!bbox.isEmpty()) {
    const size = bbox.getSize(new Vector3());
    const center = bbox.getCenter(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    gltf.scene.position.sub(center);
    root.scale.setScalar(TARGET_SPAN / maxDim);
  }

  return {
    root,
    structures,
    dispose() {
      const geometries = new Set<{ dispose(): void }>();
      const materials = new Set<Material>();
      root.traverse((object) => {
        const mesh = object as Object3D & {
          geometry?: { dispose(): void };
          material?: Material | Material[];
        };
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material) {
          const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of list) materials.add(material as MeshStandardMaterial);
        }
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      root.clear();
      structures.clear();
    },
  };
}
import { attachImageMeshSupplement } from "../image-mesh-supplement.ts";
