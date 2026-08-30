import {
  Box3,
  CatmullRomCurve3,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { thoracicInnervationManifest } from "../../manifests/cvs/thoracic-innervation-real.manifest.mjs";

// Same-origin assets — no cross-origin network.
const MODEL_URL = "/anatomy3d/cvs/thoracic-innervation.glb";
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
const TARGET_SPAN = 1.9;

const KNOWN_IDS = new Set(thoracicInnervationManifest.structures.map((s) => s.id));
function structureTissue(id: string): Tissue {
  return (thoracicInnervationManifest.structures.find((s) => s.id === id)?.tissue ?? "nerve") as Tissue;
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

export async function createThoracicInnervationModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();

  const root = new Group();
  root.name = "thoracic-innervation-real";
  root.add(gltf.scene);
  const structures = new Map<string, Object3D[]>();
  const pushMesh = (id: string, mesh: Object3D) => structures.set(id, [...(structures.get(id) ?? []), mesh]);

  // --- Real CONTEXT meshes from the GLB (vertebral column, sternum, trachea, aorta, SVC, IVC,
  // heart silhouette). Rendered FAINT (translucent, low prominence) so the procedural nerves
  // routed relative to them read clearly on top. These are quizable:false scene references. -----
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
    const mat = tissueMaterial(tissue);
    mat.transparent = true;
    mat.opacity = tissue === "bone" ? 0.32 : 0.24;
    mat.depthWrite = false;
    mat.side = DoubleSide;
    mesh.material = mat;
    if (old) for (const m of Array.isArray(old) ? old : [old]) (m as Material).dispose?.();
    pushMesh(id, mesh);
  }

  // --- Procedural (schematic) NERVES — routed relative to the real context bounding boxes -------
  gltf.scene.updateMatrixWorld(true);
  const boxOf = (ids: string[]): Box3 => {
    const box = new Box3();
    for (const id of ids) for (const obj of structures.get(id) ?? []) box.expandByObject(obj);
    return box;
  };
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

  const addProcedural = (id: string, mesh: Mesh) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    mesh.material = tissueMaterial(structureTissue(id));
    gltf.scene.add(mesh);
    pushMesh(id, mesh);
  };
  // Solid, smoothly-curving cord (arc-length-even control points, rounded cross-section).
  const tube = (id: string, pts: Vector3[], radius: number) => {
    const path = new CatmullRomCurve3(pts, false, "centripetal", 0.5);
    const divisions = Math.max(24, (pts.length - 1) * 16);
    const smooth = new CatmullRomCurve3(path.getSpacedPoints(divisions), false, "centripetal", 0.5);
    addProcedural(id, new Mesh(new TubeGeometry(smooth, divisions, radius, 8, false)));
  };
  const blob = (id: string, at: Vector3, sx: number, sy: number, sz: number) => {
    const m = new Mesh(new SphereGeometry(1, 12, 9));
    m.position.copy(at); m.scale.set(sx, sy, sz);
    addProcedural(id, m);
  };
  // A small ganglionic/plexus tangle: a flattened central node + a few short criss-cross cords.
  const plexus = (id: string, c: Vector3, rx: number, ry: number, rz: number) => {
    blob(id, c, rx, ry, rz);
    const o = Math.max(rx, ry, rz);
    tube(id, [v(c.x - o, c.y + o * 0.6, c.z), v(c.x, c.y, c.z + o * 0.4), v(c.x + o, c.y - o * 0.6, c.z)], o * 0.16);
    tube(id, [v(c.x + o, c.y + o * 0.6, c.z - o * 0.3), v(c.x, c.y, c.z), v(c.x - o, c.y - o * 0.6, c.z + o * 0.3)], o * 0.16);
  };

  // --- context reference frame (normalized units) -------------------------------------------
  const col = boxOf(["context-vertebral-column"]);
  const stern = boxOf(["context-sternum"]);
  const hrt = boxOf(["context-heart"]);
  const aor = boxOf(["context-aorta"]);
  const svc = boxOf(["context-svc"]);
  const ivc = boxOf(["context-ivc"]);
  const trc = boxOf(["context-trachea"]);
  const cen = (b: Box3) => (b.isEmpty() ? new Vector3() : b.getCenter(new Vector3()));

  const mx0 = cen(col).x;                 // midline (subject-left = +X, subject-right = −X)
  const colTopY = col.max.y, colBotY = col.min.y;
  const colBodyZ = col.max.z;             // anterior face of the vertebral bodies / rib heads
  const colBackZ = col.min.z;             // spinous processes (posterior)
  const sternFrontZ = stern.max.z;        // most-anterior chest wall
  const hrtC = cen(hrt), hrtApexX = hrt.max.x, hrtBotY = hrt.min.y, hrtFrontZ = hrt.max.z, hrtBackZ = hrt.min.z;
  const aorC = cen(aor), aorTopY = aor.max.y, aorLeftX = aor.max.x;
  const svcC = cen(svc);
  const ivcC = cen(ivc), ivcTopY = ivc.max.y;
  const trcMidX = cen(trc).x, trcTopY = trc.max.y, trcBotY = trc.min.y, trcBackZ = trc.min.z;
  const sides = [1, -1]; // +1 = subject-left, −1 = subject-right

  // 1. Intercostal nerves (T1–T11) — anterior rami arcing from the vertebral bodies, around the
  //    wall (posterior → mid-axillary → parasternal), sloping slightly inferior toward the front.
  const icLevels = [0.55, 0.34, 0.13, -0.06, -0.24];
  for (const yL of icLevels) for (const side of sides) {
    tube("intercostal-nerve", [
      v(mx0 + side * 0.05, yL, colBodyZ - 0.02),
      v(mx0 + side * 0.16, yL - 0.01, colBodyZ + 0.10),
      v(mx0 + side * 0.28, yL - 0.03, 0.02),
      v(mx0 + side * 0.18, yL - 0.05, sternFrontZ - 0.12),
      v(mx0 + side * 0.06, yL - 0.06, sternFrontZ - 0.02),
    ], 0.009);
  }

  // 2. Subcostal nerve (T12) — below rib 12, running on into the abdominal wall (lower, forward).
  for (const side of sides) {
    tube("subcostal-nerve", [
      v(mx0 + side * 0.05, -0.44, colBodyZ),
      v(mx0 + side * 0.18, -0.48, 0.0),
      v(mx0 + side * 0.28, -0.55, 0.16),
    ], 0.009);
  }

  // 3. Posterior (dorsal) ramus — turns backward to the deep back muscles behind the spine.
  for (const yL of [0.30, -0.10]) for (const side of sides) {
    tube("posterior-ramus", [
      v(mx0 + side * 0.05, yL, colBodyZ - 0.03),
      v(mx0 + side * 0.09, yL - 0.01, colBackZ + 0.05),
      v(mx0 + side * 0.12, yL - 0.02, colBackZ - 0.06),
    ], 0.008);
  }

  // 4. Collateral branch — parallels the main nerve just inferiorly, on the upper border of the rib below.
  for (const yL of [0.34, -0.06]) for (const side of sides) {
    tube("collateral-branch", [
      v(mx0 + side * 0.17, yL - 0.06, colBodyZ + 0.08),
      v(mx0 + side * 0.27, yL - 0.08, 0.02),
      v(mx0 + side * 0.17, yL - 0.10, sternFrontZ - 0.14),
    ], 0.006);
  }

  // 5. Lateral cutaneous branch — pierces the wall in the mid-axillary line and forks ant/post.
  for (const yL of [0.45, 0.13, -0.15]) for (const side of sides) {
    tube("lateral-cutaneous-branch", [
      v(mx0 + side * 0.28, yL - 0.03, 0.02),
      v(mx0 + side * 0.40, yL - 0.04, 0.04),
      v(mx0 + side * 0.43, yL - 0.05, 0.14),
    ], 0.006);
    tube("lateral-cutaneous-branch", [
      v(mx0 + side * 0.40, yL - 0.04, 0.04),
      v(mx0 + side * 0.43, yL - 0.03, -0.08),
    ], 0.006);
  }

  // 6. Anterior cutaneous branch — terminal parasternal twig onto the anterior chest surface.
  for (const yL of [0.40, 0.10, -0.20]) for (const side of sides) {
    tube("anterior-cutaneous-branch", [
      v(mx0 + side * 0.06, yL - 0.06, sternFrontZ - 0.02),
      v(mx0 + side * 0.11, yL - 0.07, sternFrontZ + 0.06),
    ], 0.006);
  }

  // 7. Intercostobrachial nerve — lateral cutaneous branch of T2 heading up-and-out into the axilla.
  for (const side of sides) {
    tube("intercostobrachial-nerve", [
      v(mx0 + side * 0.34, 0.50, 0.03),
      v(mx0 + side * 0.46, 0.60, 0.05),
      v(mx0 + side * 0.52, 0.66, 0.02),
    ], 0.007);
  }

  // 8. Thoracic dermatomes — schematic landmark level-bands on the anterior wall
  //    (T2 sternal angle, T4 nipple, T6 xiphoid, T10 umbilicus).
  for (const yL of [0.55, 0.30, 0.05, -0.40]) {
    tube("dermatomes", [
      v(mx0 - 0.30, yL, 0.10),
      v(mx0 - 0.12, yL, 0.30),
      v(mx0, yL, 0.34),
      v(mx0 + 0.12, yL, 0.30),
      v(mx0 + 0.30, yL, 0.10),
    ], 0.006);
  }

  // Sympathetic trunk & ganglia (built first so rami/splanchnics can hang off its position).
  const trunkX = (side: number) => mx0 + side * 0.10;
  const trunkZ = colBodyZ + 0.03;

  // 15. Thoracic sympathetic trunk — paravertebral ganglionated chain on the rib heads / bodies.
  for (const side of sides) {
    tube("sympathetic-trunk", [
      v(trunkX(side), colTopY - 0.02, trunkZ),
      v(trunkX(side) - side * 0.005, (colTopY + colBotY) / 2, trunkZ + 0.01),
      v(trunkX(side) - side * 0.02, colBotY + 0.02, trunkZ + 0.02),
    ], 0.009);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const y = colTopY - 0.03 - t * (colTopY - colBotY - 0.05);
      blob("sympathetic-trunk", v(trunkX(side) - side * (0.005 + t * 0.02), y, trunkZ + t * 0.02), 0.018, 0.026, 0.018);
    }
  }

  // 9. White ramus communicans (T1–L2, preganglionic) — anterior ramus → sympathetic trunk.
  for (const yL of [0.45, 0.20, -0.05]) for (const side of sides) {
    tube("white-ramus-communicans", [
      v(mx0 + side * 0.05, yL, colBodyZ - 0.01),
      v(trunkX(side), yL - 0.01, trunkZ),
    ], 0.006);
  }

  // 10. Gray ramus communicans (all levels, postganglionic) — sympathetic trunk → spinal nerve.
  for (const yL of [0.55, 0.30, 0.05, -0.30]) for (const side of sides) {
    tube("gray-ramus-communicans", [
      v(trunkX(side), yL + 0.03, trunkZ),
      v(mx0 + side * 0.05, yL + 0.04, colBodyZ - 0.01),
    ], 0.006);
  }

  // 16. Cervicothoracic (stellate) ganglion — fused inferior-cervical + T1 ganglion at the rib-1 neck.
  for (const side of sides) {
    blob("cervicothoracic-ganglion", v(mx0 + side * 0.11, colTopY - 0.01, trunkZ), 0.028, 0.038, 0.028);
  }

  // 17. Greater splanchnic nerve (T5–T9) — gathers off the mid trunk and descends medially to pierce the crus.
  for (const side of sides) {
    tube("greater-splanchnic-nerve", [
      v(trunkX(side), 0.16, trunkZ),
      v(trunkX(side) - side * 0.01, -0.06, trunkZ + 0.02),
      v(mx0 + side * 0.06, -0.30, colBodyZ + 0.06),
      v(mx0 + side * 0.03, -0.50, -0.04),
    ], 0.008);
  }
  // 18. Lesser splanchnic nerve (T9–T11) — lateral to the greater, to the aorticorenal ganglion.
  for (const side of sides) {
    tube("lesser-splanchnic-nerve", [
      v(mx0 + side * 0.12, -0.10, trunkZ),
      v(mx0 + side * 0.09, -0.32, colBodyZ + 0.05),
      v(mx0 + side * 0.06, -0.52, 0.0),
    ], 0.007);
  }
  // 19. Least splanchnic nerve (T12) — short, lowest, piercing the crus to the renal plexus.
  for (const side of sides) {
    tube("least-splanchnic-nerve", [
      v(mx0 + side * 0.10, -0.42, trunkZ),
      v(mx0 + side * 0.07, -0.55, 0.02),
    ], 0.006);
  }

  // 11. Right phrenic nerve — lateral to the right brachiocephalic/SVC & right atrium, to the caval opening (T8).
  tube("right-phrenic-nerve", [
    v(svcC.x - 0.02, colTopY - 0.10, svcC.z),
    v(svcC.x - 0.02, svcC.y, svcC.z + 0.02),
    v(hrtC.x - 0.20, hrtC.y + 0.05, hrtFrontZ - 0.06),
    v(ivcC.x - 0.02, ivcTopY + 0.02, ivcC.z),
  ], 0.010);

  // 12. Left phrenic nerve — over the aortic arch, on the pericardium lateral to the LV, to the diaphragm near the apex.
  tube("left-phrenic-nerve", [
    v(mx0 + 0.10, colTopY - 0.10, 0.0),
    v(aorLeftX + 0.03, aorTopY + 0.02, aorC.z + 0.06),
    v(hrtC.x + 0.16, hrtC.y, hrtFrontZ - 0.02),
    v(hrtApexX - 0.01, hrtBotY + 0.03, hrtC.z + 0.06),
  ], 0.010);

  // 13. Right vagus nerve — right of the trachea behind the SVC, then behind the heart onto the posterior oesophagus.
  tube("right-vagus-nerve", [
    v(mx0 - 0.10, colTopY - 0.02, -0.02),
    v(trcMidX - 0.07, trcTopY - 0.08, trcBackZ + 0.02),
    v(trcMidX - 0.05, trcBotY + 0.02, trcBackZ),
    v(hrtC.x - 0.02, hrtC.y - 0.02, hrtBackZ - 0.03),
    v(mx0, -0.30, -0.10),
    v(mx0, -0.50, -0.02),
  ], 0.011);

  // 14. Left vagus nerve — crosses the aortic arch, passes behind the lung root onto the anterior oesophagus.
  tube("left-vagus-nerve", [
    v(mx0 + 0.10, colTopY - 0.02, -0.02),
    v(aorLeftX + 0.02, aorTopY, aorC.z + 0.02),
    v(mx0 + 0.04, hrtC.y + 0.05, hrtBackZ - 0.02),
    v(mx0 + 0.02, -0.20, -0.08),
    v(mx0, -0.50, -0.02),
  ], 0.011);

  // 20. Left recurrent laryngeal nerve — hooks UNDER the aortic arch, ascends the tracheo-oesophageal groove.
  tube("left-recurrent-laryngeal-nerve", [
    v(aorLeftX + 0.01, aorTopY - 0.02, aorC.z + 0.02),
    v(mx0 + 0.06, aorTopY - 0.10, aorC.z - 0.02),
    v(mx0, aorTopY - 0.12, aorC.z - 0.06),
    v(trcMidX + 0.03, aorTopY - 0.02, trcBackZ + 0.02),
    v(trcMidX + 0.03, trcTopY - 0.02, trcBackZ + 0.02),
  ], 0.008);

  // 21. Right recurrent laryngeal nerve — hooks under the right subclavian at the neck root, ascends; barely thoracic.
  tube("right-recurrent-laryngeal-nerve", [
    v(mx0 - 0.10, colTopY - 0.04, -0.02),
    v(mx0 - 0.06, colTopY - 0.10, -0.06),
    v(trcMidX - 0.03, colTopY - 0.06, trcBackZ + 0.02),
    v(trcMidX - 0.03, trcTopY - 0.02, trcBackZ + 0.02),
  ], 0.008);

  // 22. Superficial cardiac plexus — small plexus below the arch, right of the ligamentum arteriosum.
  plexus("superficial-cardiac-plexus", v(mx0 + 0.02, aorTopY - 0.16, aorC.z - 0.02), 0.03, 0.028, 0.03);

  // 23. Deep cardiac plexus — larger, anterior to the tracheal bifurcation, behind the arch.
  plexus("deep-cardiac-plexus", v(mx0, trcBotY + 0.02, trcBackZ + 0.04), 0.045, 0.04, 0.04);

  // 24. Pulmonary plexus — anterior & (larger) posterior plexuses at each lung root (hilum).
  for (const side of sides) {
    plexus("pulmonary-plexus", v(mx0 + side * 0.15, trcBotY - 0.02, trcBackZ - 0.02), 0.035, 0.045, 0.035);
  }

  // 25. Oesophageal plexus — network on the lower oesophagus behind the heart, reforming as the vagal trunks.
  plexus("oesophageal-plexus", v(mx0, -0.02, hrtBackZ - 0.05), 0.035, 0.05, 0.035);
  tube("oesophageal-plexus", [
    v(mx0 - 0.03, 0.10, hrtBackZ - 0.02),
    v(mx0 + 0.02, -0.05, hrtBackZ - 0.05),
    v(mx0 - 0.02, -0.22, -0.08),
    v(mx0, -0.42, -0.03),
  ], 0.007);

  // Defensive normalization to the contract (~2-unit bbox centred at origin); the GLB is baked
  // normalized, so this stays ~no-op but also folds in the procedural nerve additions.
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
