import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Material,
  Matrix4,
  Mesh,
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
import { tracheaLungRealManifest } from "../../manifests/respiratory/trachea-lung-real.manifest.mjs";

// Same-origin assets — no cross-origin network.
const MODEL_URL = "/anatomy3d/respiratory/trachea-lung-real.glb";
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
const TARGET_SPAN = 1.9;

const KNOWN_IDS = new Set(tracheaLungRealManifest.structures.map((s) => s.id));
function structureTissue(id: string): Tissue {
  return (tracheaLungRealManifest.structures.find((s) => s.id === id)?.tissue ?? "lung") as Tissue;
}

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

export async function createRealTracheaLungModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();
  await attachImageMeshSupplement(gltf.scene, "trachea-lung-real");

  const root = new Group();
  root.name = "respiratory-trachea-lung-real";
  root.add(gltf.scene);
  const structures = new Map<string, Object3D[]>();

  const pushMesh = (id: string, mesh: Object3D) => {
    structures.set(id, [...(structures.get(id) ?? []), mesh]);
  };

  // --- Real meshes from the GLB -------------------------------------------------
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
    mesh.material = tissueMaterial(tissue);
    if (old) for (const m of Array.isArray(old) ? old : [old]) (m as Material).dispose?.();
    pushMesh(id, mesh);
  }

  // --- Procedural (schematic) fills for structures with no BodyParts3D mesh -----
  // Placed from the real meshes' bounding boxes so they self-align to the real anatomy.
  gltf.scene.updateMatrixWorld(true); // ensure world matrices are current before bbox math
  const boxOf = (ids: string[]): Box3 => {
    const box = new Box3();
    for (const id of ids) for (const obj of structures.get(id) ?? []) box.expandByObject(obj);
    return box;
  };
  const addProcedural = (id: string, mesh: Mesh) => {
    const tissue = structureTissue(id);
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    mesh.material = tissueMaterial(tissue);
    gltf.scene.add(mesh);
    pushMesh(id, mesh);
  };
  const vec = (x: number, y: number, z: number) => new Vector3(x, y, z);
  // Solid, smoothly-curving cord: densify the coarse control polyline into arc-length-even points
  // (so the path is graceful with no kinks), give the tube a rounded cross-section (radialSegments
  // 10) and a finely-tessellated length (tubularSegments), then radius sets the visible thickness.
  const tube = (id: string, pts: Vector3[], radius: number) => {
    const path = new CatmullRomCurve3(pts, false, "centripetal", 0.5);
    const divisions = Math.max(28, (pts.length - 1) * 16);
    const smooth = new CatmullRomCurve3(path.getSpacedPoints(divisions), false, "centripetal", 0.5);
    addProcedural(id, new Mesh(new TubeGeometry(smooth, divisions, radius, 10, false)));
  };

  const tracheaBox = boxOf(["trachea"]);
  const rightLungBox = boxOf(["right-upper-lobe", "right-middle-lobe", "right-lower-lobe"]);
  const leftLungBox = boxOf(["left-upper-lobe", "left-lower-lobe"]);
  const thoraxBox = boxOf([
    "trachea", "right-main-bronchus", "left-main-bronchus",
    "right-upper-lobe", "right-middle-lobe", "right-lower-lobe",
    "left-upper-lobe", "left-lower-lobe",
  ]);
  const thoraxCenter = thoraxBox.getCenter(new Vector3());
  const thoraxSize = thoraxBox.getSize(new Vector3());
  const at = (fx: number, fy: number, fz: number) => vec(
    thoraxCenter.x + thoraxSize.x * fx,
    thoraxCenter.y + thoraxSize.y * fy,
    thoraxCenter.z + thoraxSize.z * fz,
  );

  // Lobe centres (real meshes) drive fissure orientation + the lobe separation below.
  const lobeCenter = (id: string): Vector3 => {
    const box = boxOf([id]);
    return box.isEmpty() ? new Vector3() : box.getCenter(new Vector3());
  };
  const mid2 = (a: Vector3, b: Vector3) => a.clone().add(b).multiplyScalar(0.5);
  // Anatomical fissure-plane normals (unit-ish), pointing toward the upper/superior side:
  //  - oblique fissure is steep, running high-posterior → low-anterior, so its face looks
  //    antero-superiorly;  - horizontal fissure is near-transverse (upper vs middle lobe).
  const OBLIQUE_NORMAL = new Vector3(0, 0.64, 0.77);
  const HORIZONTAL_NORMAL = new Vector3(0, 0.94, 0.34);
  // A thin fissure slab dropped into the gap between two lobes: it sits at `position` with its
  // (thin) Y axis along `normal`, and spans `lateral` left↔right and `slope` along the fissure tilt.
  const fissurePlane = (id: string, position: Vector3, normal: Vector3, lateral: number, slope: number) => {
    const n = normal.clone().normalize();
    const xAxis = new Vector3(1, 0, 0).addScaledVector(n, -n.x); // world-X made ⟂ to the normal
    if (xAxis.lengthSq() < 1e-4) xAxis.set(0, 0, 1).addScaledVector(n, -n.z);
    xAxis.normalize();
    const zAxis = new Vector3().crossVectors(xAxis, n).normalize(); // right-handed (X × Y = Z)
    const mesh = new Mesh(new BoxGeometry(lateral, 0.024, slope));
    mesh.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(xAxis, n, zAxis));
    mesh.position.copy(position);
    addProcedural(id, mesh);
    // A fissure is a potential space, not an opaque plate. Keep enough surface for picking while
    // allowing the scan-derived lobes and vessels to remain visible through it.
    const material = mesh.material as Material & {
      transparent: boolean;
      opacity: number;
      depthWrite: boolean;
    };
    material.transparent = true;
    material.opacity = 0.24;
    material.depthWrite = false;
  };

  if (!tracheaBox.isEmpty()) {
    const c = tracheaBox.getCenter(new Vector3());
    const s = tracheaBox.getSize(new Vector3());
    const r = Math.max(s.x, s.z) * 0.55;

    // Tracheal C-rings: stacked partial tori, gap opening posteriorly (−Z).
    const ringCount = 8;
    const yTop = c.y + s.y * 0.44;
    const yBot = c.y - s.y * 0.30;
    for (let i = 0; i < ringCount; i++) {
      const t = i / (ringCount - 1);
      const geometry = new TorusGeometry(r, r * 0.16, 6, 26, Math.PI * 1.5);
      geometry.rotateX(Math.PI / 2);
      geometry.rotateY(Math.PI / 4);
      const ring = new Mesh(geometry);
      ring.position.set(c.x, yTop - t * (yTop - yBot), c.z);
      addProcedural("tracheal-rings", ring);
    }
    // Trachealis: posterior smooth-muscle strip closing the rings' gap.
    const trachealis = new Mesh(
      new CylinderGeometry(r * 1.04, r * 1.08, s.y * 0.72, 14, 1, true, (Math.PI * 3) / 4, Math.PI / 2),
    );
    trachealis.position.set(c.x, c.y + s.y * 0.06, c.z);
    addProcedural("trachealis-muscle", trachealis);
    // Carina: keel at the bifurcation (inferior end of the trachea).
    const carina = new Mesh(new ConeGeometry(r * 0.9, s.y * 0.24, 4, 1));
    carina.position.set(c.x, tracheaBox.min.y - s.y * 0.02, c.z);
    carina.scale.set(0.5, 1, 1.5);
    addProcedural("carina", carina);
  }

  if (!rightLungBox.isEmpty()) {
    const c = rightLungBox.getCenter(new Vector3());
    const s = rightLungBox.getSize(new Vector3());
    const cRUL = lobeCenter("right-upper-lobe");
    const cRML = lobeCenter("right-middle-lobe");
    const cRLL = lobeCenter("right-lower-lobe");
    // Horizontal fissure: separates the upper lobe from the middle lobe (right lung only).
    fissurePlane("horizontal-fissure", mid2(cRUL, cRML), HORIZONTAL_NORMAL, s.x * 0.68, s.z * 0.52);
    // Oblique fissure (right): separates the lower lobe from the upper+middle mass.
    fissurePlane("oblique-fissure", mid2(mid2(cRUL, cRML), cRLL), OBLIQUE_NORMAL, s.x * 0.66, Math.hypot(s.y, s.z) * 0.48);
    // Hilum / root (right): medial surface (toward the midline, +X side of the right lung).
    const hr = new Mesh(new SphereGeometry(Math.min(s.x, s.z) * 0.22, 16, 12));
    hr.position.set(c.x + s.x * 0.36, c.y + s.y * 0.05, c.z - s.z * 0.12);
    hr.scale.set(0.8, 1.1, 0.8);
    addProcedural("hilum-root", hr);
  }

  if (!leftLungBox.isEmpty()) {
    const c = leftLungBox.getCenter(new Vector3());
    const s = leftLungBox.getSize(new Vector3());
    // Oblique fissure (left): separates the upper lobe from the lower lobe.
    fissurePlane("oblique-fissure", mid2(lobeCenter("left-upper-lobe"), lobeCenter("left-lower-lobe")), OBLIQUE_NORMAL, s.x * 0.66, Math.hypot(s.y, s.z) * 0.46);
    // Cardiac notch: concave scoop on the anteroinferior margin of the left lung.
    const notch = new Mesh(
      new CylinderGeometry(Math.min(s.x, s.z) * 0.5, Math.min(s.x, s.z) * 0.5, s.y * 0.4, 16, 1, true, -Math.PI / 4, Math.PI / 2),
    );
    notch.position.set(c.x - s.x * 0.18, c.y - s.y * 0.16, c.z + s.z * 0.34);
    addProcedural("cardiac-notch", notch);
    // Lingula: tongue-like projection below the cardiac notch.
    const lingula = new Mesh(new SphereGeometry(1, 18, 12));
    lingula.position.set(c.x - s.x * 0.1, c.y - s.y * 0.34, c.z + s.z * 0.28);
    lingula.scale.set(s.x * 0.16, s.y * 0.12, s.z * 0.2);
    addProcedural("lingula", lingula);
    // Hilum / root (left): medial surface (−X side of the left lung).
    const hl = new Mesh(new SphereGeometry(Math.min(s.x, s.z) * 0.22, 16, 12));
    hl.position.set(c.x - s.x * 0.36, c.y + s.y * 0.05, c.z - s.z * 0.12);
    hl.scale.set(0.8, 1.1, 0.8);
    addProcedural("hilum-root", hl);
  }

  // --- Procedural NERVE / VESSEL / FAT layers (no BodyParts3D mesh) -------------
  // Routed relative to the real trachea and main bronchi. (+Z = anterior, −Z = posterior.)
  const rBronch = boxOf(["right-main-bronchus"]).getCenter(new Vector3());
  const lBronch = boxOf(["left-main-bronchus"]).getCenter(new Vector3());
  const nerveR = Math.min(thoraxSize.x, thoraxSize.z) * 0.009;
  const plexusR = nerveR * 0.62;
  const topY = tracheaBox.max.y - thoraxSize.y * 0.025;
  const bottomY = Math.min(rightLungBox.min.y, leftLungBox.min.y) + thoraxSize.y * 0.08;
  for (const side of [1, -1]) {
    const bronch = side > 0 ? lBronch : rBronch;
    // Vagus nerve — descends beside the trachea, then posteriorly toward the hilum & oesophagus.
    tube("vagus-nerve", [
      vec(thoraxCenter.x + side * thoraxSize.x * 0.17, topY, thoraxCenter.z - thoraxSize.z * 0.06),
      at(side * 0.18, 0.26, -0.11),
      vec(bronch.x * 0.72, bronch.y + thoraxSize.y * 0.09, bronch.z - thoraxSize.z * 0.12),
      vec(bronch.x * 0.70, bronch.y - thoraxSize.y * 0.08, bronch.z - thoraxSize.z * 0.14),
    ], nerveR);
  }
  // Recurrent laryngeal nerve — the classic asymmetric loops, then ascent in the T-O groove.
  // LEFT recurs low, under the arch of the aorta.
  tube("recurrent-laryngeal-nerve", [
    at(0.18, 0.27, -0.08), at(0.12, 0.02, 0.05), at(0.055, -0.05, 0.10),
    at(0.035, 0.01, -0.035), at(0.03, 0.25, -0.10),
    vec(tracheaBox.getCenter(new Vector3()).x + thoraxSize.x * 0.02, topY, tracheaBox.getCenter(new Vector3()).z - thoraxSize.z * 0.06),
  ], nerveR * 0.88);
  // RIGHT recurs higher, under the right subclavian artery.
  tube("recurrent-laryngeal-nerve", [
    at(-0.18, 0.30, -0.07), at(-0.15, 0.22, 0.06), at(-0.08, 0.19, 0.09),
    at(-0.06, 0.24, -0.04), at(-0.03, 0.36, -0.08),
    vec(tracheaBox.getCenter(new Vector3()).x - thoraxSize.x * 0.01, topY, tracheaBox.getCenter(new Vector3()).z - thoraxSize.z * 0.06),
  ], nerveR * 0.88);
  // Pulmonary plexus — autonomic network around each hilum / main bronchus.
  for (const b of [rBronch, lBronch]) {
    for (const [ox, oy, oz] of [[0.04, 0.025, 0.04], [-0.04, 0.025, -0.04], [0.035, -0.025, 0.05], [-0.035, -0.025, -0.05]] as const) {
      tube("pulmonary-plexus", [
        vec(b.x - thoraxSize.x * ox, b.y - thoraxSize.y * oy, b.z - thoraxSize.z * oz),
        b.clone(),
        vec(b.x + thoraxSize.x * ox, b.y + thoraxSize.y * oy, b.z + thoraxSize.z * oz),
      ], plexusR);
    }
  }
  // Side-specific vagus nerves: both descend posterior to their lung root. These duplicate the
  // gross vagus context above as individually selectable right/left exam targets.
  tube("right-vagus-nerve-lung", [
    vec(thoraxCenter.x - thoraxSize.x * 0.17, topY, thoraxCenter.z - thoraxSize.z * 0.06),
    at(-0.18, 0.27, -0.11),
    vec(rBronch.x * 0.72, rBronch.y + thoraxSize.y * 0.07, rBronch.z - thoraxSize.z * 0.12),
    vec(rBronch.x * 0.70, rBronch.y - thoraxSize.y * 0.06, rBronch.z - thoraxSize.z * 0.14),
  ], nerveR * 0.88);
  tube("left-vagus-nerve-lung", [
    vec(thoraxCenter.x + thoraxSize.x * 0.17, topY, thoraxCenter.z - thoraxSize.z * 0.06),
    at(0.18, 0.27, -0.11),
    vec(lBronch.x * 0.72, lBronch.y + thoraxSize.y * 0.07, lBronch.z - thoraxSize.z * 0.12),
    vec(lBronch.x * 0.70, lBronch.y - thoraxSize.y * 0.06, lBronch.z - thoraxSize.z * 0.14),
  ], nerveR * 0.88);

  // Side-specific recurrent laryngeal nerves retain the asymmetric loops: left under the aortic
  // arch in the mediastinum; right under the subclavian at the root of the neck.
  tube("left-recurrent-laryngeal-nerve-lung", [
    at(0.18, 0.27, -0.08), at(0.12, 0.02, 0.05), at(0.055, -0.05, 0.10),
    at(0.035, 0.01, -0.035), at(0.03, 0.25, -0.10),
    vec(tracheaBox.getCenter(new Vector3()).x + thoraxSize.x * 0.02, topY, tracheaBox.getCenter(new Vector3()).z - thoraxSize.z * 0.06),
  ], nerveR * 0.78);
  tube("right-recurrent-laryngeal-nerve-lung", [
    at(-0.18, 0.30, -0.07), at(-0.15, 0.22, 0.06), at(-0.08, 0.19, 0.09),
    at(-0.06, 0.24, -0.04), at(-0.03, 0.36, -0.08),
    vec(tracheaBox.getCenter(new Vector3()).x - thoraxSize.x * 0.01, topY, tracheaBox.getCenter(new Vector3()).z - thoraxSize.z * 0.06),
  ], nerveR * 0.78);

  // Phrenic nerves cross ANTERIOR to the roots (vagus is posterior), then descend over fibrous
  // pericardium toward each hemidiaphragm.
  tube("right-phrenic-nerve-lung", [
    vec(thoraxCenter.x - thoraxSize.x * 0.29, topY, thoraxCenter.z + thoraxSize.z * 0.12),
    at(-0.28, 0.26, 0.15),
    vec(rBronch.x * 0.82, rBronch.y + thoraxSize.y * 0.05, rBronch.z + thoraxSize.z * 0.18),
    vec(thoraxCenter.x - thoraxSize.x * 0.23, bottomY, thoraxCenter.z + thoraxSize.z * 0.15),
  ], nerveR * 0.88);
  tube("left-phrenic-nerve-lung", [
    vec(thoraxCenter.x + thoraxSize.x * 0.29, topY, thoraxCenter.z + thoraxSize.z * 0.12),
    at(0.28, 0.26, 0.15),
    vec(lBronch.x * 0.82, lBronch.y + thoraxSize.y * 0.05, lBronch.z + thoraxSize.z * 0.18),
    vec(thoraxCenter.x + thoraxSize.x * 0.23, bottomY, thoraxCenter.z + thoraxSize.z * 0.15),
  ], nerveR * 0.88);

  // Paravertebral sympathetic chains and their postganglionic cardiopulmonary splanchnic branches.
  for (const side of [1, -1]) {
    tube("thoracic-sympathetic-trunks-lung", [
      at(side * 0.28, 0.45, -0.42), at(side * 0.29, 0.23, -0.43),
      at(side * 0.30, -0.08, -0.43), at(side * 0.31, -0.43, -0.40),
    ], nerveR * 0.9);
    const b = side > 0 ? lBronch : rBronch;
    tube("cardiopulmonary-splanchnic-nerves", [
      at(side * 0.29, 0.25, -0.43), at(side * 0.24, 0.15, -0.34),
      vec(b.x * 0.72, b.y + thoraxSize.y * 0.04, b.z - thoraxSize.z * 0.12),
      vec(b.x, b.y, b.z - thoraxSize.z * 0.07),
    ], plexusR);
    tube("cardiopulmonary-splanchnic-nerves", [
      at(side * 0.30, 0.05, -0.43), at(side * 0.25, 0, -0.32),
      vec(b.x * 0.8, b.y - thoraxSize.y * 0.02, b.z - thoraxSize.z * 0.10),
    ], plexusR * 0.9);
  }

  // Anterior and posterior pulmonary plexuses form crossing networks around both hilar bronchi.
  for (const b of [rBronch, lBronch]) {
    const lateralSign = b.x >= 0 ? 1 : -1;
    for (const offset of [-0.028, 0, 0.028]) {
      tube("anterior-pulmonary-plexus", [
        vec(b.x - lateralSign * thoraxSize.x * 0.055, b.y + thoraxSize.y * offset, b.z + thoraxSize.z * 0.08),
        vec(b.x, b.y - thoraxSize.y * offset * 0.4, b.z + thoraxSize.z * 0.11),
        vec(b.x + lateralSign * thoraxSize.x * 0.055, b.y - thoraxSize.y * offset, b.z + thoraxSize.z * 0.08),
      ], plexusR * 0.82);
      tube("posterior-pulmonary-plexus", [
        vec(b.x - lateralSign * thoraxSize.x * 0.06, b.y + thoraxSize.y * offset, b.z - thoraxSize.z * 0.09),
        vec(b.x, b.y - thoraxSize.y * offset * 0.4, b.z - thoraxSize.z * 0.12),
        vec(b.x + lateralSign * thoraxSize.x * 0.06, b.y - thoraxSize.y * offset, b.z - thoraxSize.z * 0.09),
      ], plexusR * 0.86);
    }
  }

  // Mixed plexus fibres follow the main bronchi: parasympathetic fibres approach from posterior
  // vagus, while sympathetic fibres approach from the paravertebral chain.
  for (const b of [rBronch, lBronch]) {
    const side = b.x >= 0 ? 1 : -1;
    tube("vagal-bronchial-branches", [
      vec(thoraxCenter.x + side * thoraxSize.x * 0.17, b.y + thoraxSize.y * 0.09, b.z - thoraxSize.z * 0.12),
      vec(b.x * 0.7, b.y + thoraxSize.y * 0.03, b.z - thoraxSize.z * 0.07),
      b.clone(),
      vec(b.x + side * thoraxSize.x * 0.07, b.y - thoraxSize.y * 0.04, b.z + thoraxSize.z * 0.01),
    ], plexusR * 0.9);
    tube("sympathetic-bronchial-branches", [
      vec(thoraxCenter.x + side * thoraxSize.x * 0.29, b.y + thoraxSize.y * 0.09, thoraxCenter.z - thoraxSize.z * 0.43),
      vec(b.x * 0.75, b.y + thoraxSize.y * 0.025, b.z - thoraxSize.z * 0.10),
      vec(b.x, b.y - thoraxSize.y * 0.01, b.z - thoraxSize.z * 0.03),
      vec(b.x + side * thoraxSize.x * 0.06, b.y - thoraxSize.y * 0.05, b.z - thoraxSize.z * 0.02),
    ], plexusR * 0.9);
  }

  // Visceral afferents converge from intrapulmonary receptor fields on the hilar plexuses, then
  // travel mainly with vagus for reflexes and with sympathetics for nociception.
  const visceralSources: Array<[Vector3, Vector3]> = [
    [lobeCenter("right-upper-lobe"), rBronch], [lobeCenter("right-lower-lobe"), rBronch],
    [lobeCenter("left-upper-lobe"), lBronch], [lobeCenter("left-lower-lobe"), lBronch],
  ];
  for (const [source, hilum] of visceralSources) {
    const start = source.clone().lerp(hilum, 0.42);
    tube("pulmonary-visceral-afferents", [
      start, start.clone().lerp(hilum, 0.55).add(vec(0, 0.035, -0.03)),
      hilum.clone().add(vec(0, 0, -thoraxSize.z * 0.07)),
    ], plexusR * 0.82);
  }
  // Bronchial arteries — run along the posterior wall of the bronchi (1 right, 2 left, typically).
  tube("bronchial-arteries", [
    vec(thoraxCenter.x, rBronch.y + thoraxSize.y * 0.03, rBronch.z - thoraxSize.z * 0.14),
    vec(rBronch.x * 0.6, rBronch.y, rBronch.z - thoraxSize.z * 0.04),
    vec(rBronch.x, rBronch.y - thoraxSize.y * 0.03, rBronch.z - thoraxSize.z * 0.02),
  ], nerveR * 1.05);
  tube("bronchial-arteries", [
    vec(thoraxCenter.x + thoraxSize.x * 0.018, lBronch.y + thoraxSize.y * 0.03, lBronch.z - thoraxSize.z * 0.14),
    vec(lBronch.x * 0.6, lBronch.y, lBronch.z - thoraxSize.z * 0.04),
    vec(lBronch.x, lBronch.y - thoraxSize.y * 0.02, lBronch.z - thoraxSize.z * 0.02),
  ], nerveR * 1.05);
  tube("bronchial-arteries", [
    vec(thoraxCenter.x + thoraxSize.x * 0.012, lBronch.y - thoraxSize.y * 0.04, lBronch.z - thoraxSize.z * 0.14),
    vec(lBronch.x * 0.55, lBronch.y - thoraxSize.y * 0.05, lBronch.z - thoraxSize.z * 0.05),
    vec(lBronch.x * 0.95, lBronch.y - thoraxSize.y * 0.06, lBronch.z - thoraxSize.z * 0.03),
  ], nerveR);
  // Mediastinal fat — soft pads in the central mediastinum between the lungs.
  for (const [position, sx, sy, sz] of [
    [at(0, 0.09, 0.04), thoraxSize.x * 0.08, thoraxSize.y * 0.09, thoraxSize.z * 0.10],
    [at(0, -0.04, -0.03), thoraxSize.x * 0.075, thoraxSize.y * 0.08, thoraxSize.z * 0.10],
  ] as const) {
    const fat = new Mesh(new SphereGeometry(1, 12, 9));
    fat.position.copy(position); fat.scale.set(sx, sy, sz);
    addProcedural("mediastinal-fat", fat);
  }

  // Defensive normalization to the contract (~2-unit bbox at origin). The GLB is baked
  // normalized; this stays ~no-op but also folds in the procedural fills.
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
          for (const material of list) materials.add(material);
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
