import {
  Box3,
  CatmullRomCurve3,
  Group,
  Material,
  Mesh,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { larynxRealManifest } from "../../manifests/respiratory/larynx-real.manifest.mjs";

// Where the GLB is served from (same-origin, no cross-origin network).
const MODEL_URL = "/anatomy3d/respiratory/larynx-real.glb";
// Draco decoder is hosted alongside the assets (same-origin) so nothing is fetched from a CDN.
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
// ~2-unit target bounding box per the engine contract.
const TARGET_SPAN = 1.9;

function structureTissue(id: string): Tissue {
  const structure = larynxRealManifest.structures.find((candidate) => candidate.id === id);
  return (structure?.tissue ?? "cartilage") as Tissue;
}

// glTF `extras` land on Object3D.userData via GLTFLoader. The GLB is authored with the
// structureId on each part node; fall back to the node name (which we set == structureId).
const KNOWN_IDS = new Set(larynxRealManifest.structures.map((s) => s.id));
function localStructureId(object: Object3D): string | undefined {
  const fromExtras = object.userData?.structureId;
  if (typeof fromExtras === "string" && KNOWN_IDS.has(fromExtras)) return fromExtras;
  if (object.name && KNOWN_IDS.has(object.name)) return object.name;
  return undefined;
}

// Resolve a mesh's structureId by walking up to the nearest ancestor (or itself) that carries one.
function resolveStructureId(mesh: Object3D): { id: string; owner: Object3D } | undefined {
  let node: Object3D | null = mesh;
  while (node) {
    const id = localStructureId(node);
    if (id) return { id, owner: node };
    node = node.parent;
  }
  return undefined;
}

export async function createRealLarynxModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);

  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();

  const root = new Group();
  root.name = "respiratory-larynx-real";
  root.add(gltf.scene);

  const structures = new Map<string, Object3D[]>();

  // Visit every mesh exactly once. Resolve its structureId from itself or an ancestor node
  // (the raycaster reads mesh.userData.structureId), then swap in tissueMaterial so highlight/dim
  // behave exactly like the stylised models. Iterating meshes (not nodes) avoids double-counting.
  const meshes: Mesh[] = [];
  gltf.scene.traverse((object) => {
    if ((object as { isMesh?: boolean }).isMesh) meshes.push(object as Mesh);
  });
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
    structures.set(id, [...(structures.get(id) ?? []), mesh]);
  }

  // --- Procedural (schematic) LAYERS: nerves / vessels / fat --------------------
  // BodyParts3D has no laryngeal nerves or (superior) laryngeal vessels or peri-laryngeal fat, so
  // these are authored here (userData.schematic = true) and routed relative to the real cartilages.
  gltf.scene.updateMatrixWorld(true);
  const pushMesh = (id: string, mesh: Object3D) => structures.set(id, [...(structures.get(id) ?? []), mesh]);
  const centre = (id: string): Vector3 => {
    const box = new Box3();
    for (const obj of structures.get(id) ?? []) box.expandByObject(obj);
    return box.isEmpty() ? new Vector3() : box.getCenter(new Vector3());
  };
  const addProcedural = (id: string, mesh: Mesh) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    mesh.material = tissueMaterial(structureTissue(id));
    gltf.scene.add(mesh);
    pushMesh(id, mesh);
  };
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const tube = (id: string, pts: Vector3[], radius: number) =>
    addProcedural(id, new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), Math.max(12, pts.length * 8), radius, 7, false)));
  const blob = (id: string, at: Vector3, sx: number, sy: number, sz: number) => {
    const m = new Mesh(new SphereGeometry(1, 14, 10));
    m.position.copy(at); m.scale.set(sx, sy, sz);
    addProcedural(id, m);
  };

  const thyroidY = centre("thyroid-cartilage").y;
  const memb = centre("thyrohyoid-membrane");
  const cricoY = centre("cricoid-cartilage").y;
  for (const side of [1, -1]) {
    // Vagus nerve (CN X) — descends in the carotid sheath, lateral & slightly posterior.
    tube("vagus-nerve", [
      v(side * 0.5, 0.95, -0.14), v(side * 0.48, 0.4, -0.18),
      v(side * 0.47, -0.1, -0.2), v(side * 0.49, -0.95, -0.2),
    ], 0.02);
    // Superior laryngeal nerve — internal branch pierces the thyrohyoid membrane; external branch
    // runs down to the cricothyroid muscle.
    tube("superior-laryngeal-nerve", [
      v(side * 0.46, 0.52, -0.15), v(side * 0.3, 0.49, -0.02), v(side * 0.12, memb.y, 0.0),
    ], 0.012);
    tube("superior-laryngeal-nerve", [
      v(side * 0.46, 0.46, -0.15), v(side * 0.35, 0.0, -0.12), v(side * 0.2, cricoY + 0.12, -0.08),
    ], 0.01);
    // Recurrent laryngeal nerve — ascends in the tracheo-oesophageal groove, entering behind the cricoid.
    tube("recurrent-laryngeal-nerve", [
      v(side * 0.15, -0.95, -0.24), v(side * 0.16, -0.72, -0.3), v(side * 0.13, cricoY + 0.05, -0.34),
    ], 0.013);
    // Superior thyroid artery — first branch of the external carotid, descending anteriorly.
    tube("superior-thyroid-artery", [
      v(side * 0.5, 0.55, -0.04), v(side * 0.42, 0.2, 0.02), v(side * 0.32, -0.35, 0.06), v(side * 0.28, -0.6, 0.05),
    ], 0.014);
    // Superior laryngeal artery — its branch that pierces the thyrohyoid membrane with the nerve.
    tube("superior-laryngeal-artery", [
      v(side * 0.46, 0.5, -0.02), v(side * 0.28, memb.y + 0.02, 0.03), v(side * 0.12, memb.y, 0.02),
    ], 0.01);
    // Inferior thyroid artery — from the thyrocervical trunk, ascending to the lower larynx.
    tube("inferior-thyroid-artery", [
      v(side * 0.5, -0.92, -0.04), v(side * 0.42, -0.72, 0.01), v(side * 0.32, cricoY + 0.02, 0.05),
    ], 0.013);
    // Paraglottic fat — paired fat spaces lateral to the ventricle, deep to the thyroid lamina.
    blob("paraglottic-fat", v(side * 0.22, thyroidY + 0.06, -0.02), 0.1, 0.16, 0.12);
  }
  // Pre-epiglottic fat — the fat body anterior to the epiglottis, under the hyoid & thyrohyoid membrane.
  blob("pre-epiglottic-fat", v(0, memb.y - 0.06, 0.16), 0.16, 0.18, 0.1);

  // Defensive normalization to the contract: centre at origin and scale to a ~2-unit bbox.
  // (The GLB is baked normalized; this makes the loader idempotent and robust to re-exports.)
  const bbox = new Box3().setFromObject(root);
  if (!bbox.isEmpty()) {
    const size = bbox.getSize(new Vector3());
    const center = bbox.getCenter(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_SPAN / maxDim;
    gltf.scene.position.sub(center);
    root.scale.setScalar(scale);
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
