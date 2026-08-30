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
  TubeGeometry,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { cvsManifest } from "../../manifests/cvs/cvs-real.manifest.mjs";

// Same-origin assets — no cross-origin network.
const MODEL_URL = "/anatomy3d/cvs/cvs.glb";
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
const TARGET_SPAN = 1.9;

const KNOWN_IDS = new Set(cvsManifest.structures.map((s) => s.id));
function structureTissue(id: string): Tissue {
  return (cvsManifest.structures.find((s) => s.id === id)?.tissue ?? "muscle") as Tissue;
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

export async function createCvsModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();

  const root = new Group();
  root.name = "cvs-real";
  root.add(gltf.scene);
  const structures = new Map<string, Object3D[]>();
  const pushMesh = (id: string, mesh: Object3D) => structures.set(id, [...(structures.get(id) ?? []), mesh]);

  // --- Real meshes from the GLB (chambers, papillary muscles, valves, coronary + great vessels) --
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

  // --- Procedural (schematic) structures with no BodyParts3D mesh -----------------------
  // Placed from the real meshes' bounding boxes so they self-align to the loaded anatomy:
  // the septa, the pectinate/moderator/chordae apparatus, the conduction system and the pericardium.
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

  const addProcedural = (id: string, mesh: Mesh, translucent = false) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    const mat = tissueMaterial(structureTissue(id));
    if (translucent) {
      mat.transparent = true;
      mat.opacity = 0.2;
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
  const blob = (id: string, at: Vector3, sx: number, sy: number, sz: number) => {
    const m = new Mesh(new SphereGeometry(1, 14, 10));
    m.position.copy(at); m.scale.set(sx, sy, sz);
    addProcedural(id, m);
  };
  // Thin oriented slab (a schematic septum). `normal` is the through-plane (thin) direction.
  const slab = (id: string, at: Vector3, normal: Vector3, w: number, h: number, t: number) => {
    const m = new Mesh(new BoxGeometry(w, h, t));
    m.position.copy(at);
    m.lookAt(at.clone().add(normal)); // orient local +Z along the plane normal (t is the thin axis)
    addProcedural(id, m);
  };
  // Concentric translucent ellipsoid shell around a centre (a pericardial layer).
  const shell = (id: string, at: Vector3, rx: number, ry: number, rz: number) => {
    const m = new Mesh(new SphereGeometry(1, 28, 20));
    m.position.copy(at); m.scale.set(rx, ry, rz);
    addProcedural(id, m, true);
  };

  const heartBox = boxOf(["right-atrium", "left-atrium", "right-ventricle", "left-ventricle"]);
  const heartC = heartBox.isEmpty() ? new Vector3() : heartBox.getCenter(new Vector3());
  const heartS = heartBox.isEmpty() ? new Vector3(1, 1, 1) : heartBox.getSize(new Vector3());
  const cRA = centre("right-atrium");
  const cLA = centre("left-atrium");
  const cRV = centre("right-ventricle");
  const cLV = centre("left-ventricle");
  const cPap = centre("papillary-muscles");
  const cTri = centre("tricuspid-valve");
  const cMit = centre("mitral-valve");
  const cCS = centre("coronary-sinus");
  const cSVC = centre("superior-vena-cava");

  // 1. Interatrial septum — thin slab between the atria (its plane faces antero-rightward).
  slab("interatrial-septum", mid(cRA, cLA), v(0.6, 0, 0.8),
    Math.max(0.12, heartS.z * 0.7), Math.max(0.12, heartS.y * 0.4), 0.02);
  // 2. Interventricular septum — oblique slab between the ventricles (bulging toward the RV).
  slab("interventricular-septum", mid(cRV, cLV), v(0.7, 0, 0.7),
    Math.max(0.12, heartS.z * 0.7), Math.max(0.16, heartS.y * 0.55), 0.03);

  // 3. Right atrial pectinate muscles — a fan of small ridges on the anterior RA / auricle wall.
  for (let i = 0; i < 5; i++) {
    const t = (i - 2) / 2;
    const ridge = new Mesh(new BoxGeometry(0.012, 0.09, 0.012));
    ridge.position.set(cRA.x + 0.02 + t * 0.03, cRA.y + 0.03, cRA.z + heartS.z * 0.22 + t * 0.01);
    ridge.rotation.z = t * 0.4;
    addProcedural("right-atrial-pectinate-muscles", ridge);
  }

  // 4. Septomarginal trabecula (moderator band) — RV septum to anterior papillary muscle base.
  tube("septomarginal-trabecula", [
    v(cRV.x + 0.02, cRV.y - 0.06, cRV.z - 0.02),
    v(cRV.x - 0.04, cRV.y - 0.08, cRV.z + 0.04),
    v(cPap.x - 0.02, cPap.y + 0.02, cPap.z + 0.05),
  ], 0.014);

  // 5. Chordae tendineae — fine cords from papillary-muscle heads to the AV valves.
  for (const target of [cTri, cMit]) {
    for (const [ox, oz] of [[-0.03, -0.02], [0.0, 0.02], [0.03, -0.01]] as const) {
      tube("chordae-tendineae", [
        v(cPap.x + ox, cPap.y + 0.02, cPap.z + oz),
        v((cPap.x + target.x) / 2 + ox * 0.5, (cPap.y + target.y) / 2, (cPap.z + target.z) / 2 + oz * 0.5),
        v(target.x + ox * 0.6, target.y - 0.02, target.z + oz * 0.6),
      ], 0.005);
    }
  }

  // 6-10. Conduction system — SA node, AV node, His bundle, right & left bundle branches.
  const saAt = v(cSVC.x + 0.02, cRA.y + heartS.y * 0.28, cRA.z + 0.02);
  blob("sinoatrial-node", saAt, 0.03, 0.045, 0.03);
  const avAt = v(mid(cRA, cLA).x + 0.02, cCS.y + 0.04, cCS.z + 0.05);
  blob("atrioventricular-node", avAt, 0.028, 0.028, 0.028);
  const hisTop = v(avAt.x, avAt.y - 0.02, avAt.z);
  const hisBottom = v(mid(cRV, cLV).x + 0.02, mid(cRV, cLV).y + 0.04, mid(cRV, cLV).z);
  tube("atrioventricular-bundle", [avAt, hisTop, hisBottom], 0.012);
  // Right bundle branch — down the right side of the septum toward the moderator band.
  tube("right-bundle-branch", [
    hisBottom, v(cRV.x, mid(cRV, cLV).y - 0.05, cRV.z - 0.02), v(cPap.x, cPap.y + 0.03, cPap.z + 0.02),
  ], 0.008);
  // Left bundle branch — broader, down the left side of the septum.
  tube("left-bundle-branch", [
    hisBottom, v(cLV.x - 0.02, mid(cRV, cLV).y - 0.05, cLV.z), v(cLV.x - 0.03, cLV.y - 0.08, cLV.z),
  ], 0.009);

  // 11-14. Pericardium — nested translucent shells around the heart + great-vessel roots.
  const half = heartS.clone().multiplyScalar(0.5);
  shell("fibrous-pericardium", heartC, half.x + 0.16, half.y + 0.18, half.z + 0.16);
  shell("parietal-serous-pericardium", heartC, half.x + 0.10, half.y + 0.12, half.z + 0.10);
  shell("pericardial-cavity", heartC, half.x + 0.07, half.y + 0.09, half.z + 0.07);
  shell("visceral-serous-pericardium", heartC, half.x + 0.04, half.y + 0.05, half.z + 0.04);
  // 15. Transverse pericardial sinus — passage behind the aorta/pulmonary trunk, above the atria.
  tube("transverse-pericardial-sinus", [
    v(cRA.x - 0.02, cRA.y + 0.10, cRA.z + 0.04),
    v(mid(cRA, cLA).x, cLA.y + 0.12, mid(cRA, cLA).z - 0.02),
    v(cLV.x + 0.06, cLA.y + 0.12, cLA.z + 0.06),
  ], 0.02);
  // 16. Oblique pericardial sinus — blind cul-de-sac behind the left atrium.
  blob("oblique-pericardial-sinus", v(cLA.x, cLA.y - 0.02, cLA.z - heartS.z * 0.24), 0.11, 0.1, 0.05);

  // Defensive normalization to the contract (~2-unit bbox centred at origin). The GLB is baked
  // normalized; this stays ~no-op but also folds in the procedural additions.
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
