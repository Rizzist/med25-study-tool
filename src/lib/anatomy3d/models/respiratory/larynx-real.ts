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
  await attachImageMeshSupplement(gltf.scene, "larynx-real");

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
  const boxOf = (ids: string[]): Box3 => {
    const box = new Box3();
    for (const id of ids) for (const obj of structures.get(id) ?? []) box.expandByObject(obj);
    return box;
  };
  const centre = (id: string): Vector3 => boxOf([id]).getCenter(new Vector3());
  const addProcedural = (id: string, mesh: Mesh) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    mesh.material = tissueMaterial(structureTissue(id));
    gltf.scene.add(mesh);
    pushMesh(id, mesh);
  };
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  // Solid, smoothly-curving cord: densify the coarse control polyline into arc-length-even points
  // (so the path is graceful with no kinks), give the tube a rounded cross-section (radialSegments
  // 10) and a finely-tessellated length (tubularSegments), then radius sets the visible thickness.
  const tube = (id: string, pts: Vector3[], radius: number) => {
    const path = new CatmullRomCurve3(pts, false, "centripetal", 0.5);
    const divisions = Math.max(28, (pts.length - 1) * 16);
    const smooth = new CatmullRomCurve3(path.getSpacedPoints(divisions), false, "centripetal", 0.5);
    addProcedural(id, new Mesh(new TubeGeometry(smooth, divisions, radius, 10, false)));
  };
  const blob = (id: string, at: Vector3, sx: number, sy: number, sz: number) => {
    const m = new Mesh(new SphereGeometry(1, 14, 10));
    m.position.copy(at); m.scale.set(sx, sy, sz);
    addProcedural(id, m);
  };

  const larynxBox = boxOf([
    "thyroid-cartilage", "thyrohyoid-membrane", "cricoid-cartilage", "epiglottis",
  ]);
  if (!larynxBox.isEmpty()) {
    const lc = larynxBox.getCenter(new Vector3());
    const ls = larynxBox.getSize(new Vector3());
    const at = (fx: number, fy: number, fz: number) => v(
      lc.x + ls.x * fx,
      lc.y + ls.y * fy,
      lc.z + ls.z * fz,
    );
    const thyroid = centre("thyroid-cartilage");
    const memb = centre("thyrohyoid-membrane");
    const crico = centre("cricoid-cartilage");
    const nerveR = Math.min(ls.x, ls.z) * 0.0105;
    const arteryR = Math.min(ls.x, ls.z) * 0.014;
    for (const side of [1, -1]) {
    // Vagus nerve (CN X) — descends in the carotid sheath, lateral & slightly posterior.
    tube("vagus-nerve", [
      at(side * 0.37, 0.46, -0.08), at(side * 0.36, 0.22, -0.10),
      at(side * 0.35, -0.05, -0.11), at(side * 0.36, -0.46, -0.10),
    ], nerveR);
    // Superior laryngeal nerve — internal branch pierces the thyrohyoid membrane; external branch
    // runs down to the cricothyroid muscle.
    tube("superior-laryngeal-nerve", [
      at(side * 0.35, 0.30, -0.09), at(side * 0.24, 0.29, -0.02),
      v(lc.x + side * ls.x * 0.09, memb.y, memb.z + ls.z * 0.07),
    ], nerveR);
    tube("superior-laryngeal-nerve", [
      at(side * 0.35, 0.27, -0.09), at(side * 0.27, 0.04, -0.06),
      v(lc.x + side * ls.x * 0.16, crico.y + ls.y * 0.12, crico.z + ls.z * 0.18),
    ], nerveR * 0.92);
    // Recurrent laryngeal nerve — ascends in the tracheo-oesophageal groove, entering behind the cricoid.
    tube("recurrent-laryngeal-nerve", [
      at(side * 0.12, -0.46, -0.17),
      v(lc.x + side * ls.x * 0.12, crico.y - ls.y * 0.06, crico.z - ls.z * 0.04),
      v(lc.x + side * ls.x * 0.09, crico.y + ls.y * 0.07, crico.z - ls.z * 0.03),
    ], nerveR);
    // The named terminal branches are separate quiz targets rather than a single generic cord.
    // Internal SLN runs horizontally through the thyrohyoid membrane to supraglottic mucosa.
    tube("internal-laryngeal-nerve", [
      at(side * 0.34, 0.30, -0.09), at(side * 0.24, 0.29, -0.03),
      v(lc.x + side * ls.x * 0.15, memb.y + ls.y * 0.01, memb.z + ls.z * 0.05),
      v(lc.x + side * ls.x * 0.06, memb.y - ls.y * 0.01, memb.z + ls.z * 0.07),
    ], nerveR * 0.88);
    // External SLN descends on the outer surface of the inferior constrictor to cricothyroid.
    tube("external-laryngeal-nerve", [
      at(side * 0.34, 0.27, -0.09), at(side * 0.29, 0.11, -0.07),
      v(lc.x + side * ls.x * 0.22, crico.y + ls.y * 0.14, crico.z + ls.z * 0.16),
      v(lc.x + side * ls.x * 0.15, crico.y + ls.y * 0.10, crico.z + ls.z * 0.19),
    ], nerveR * 0.88);
    // Inferior laryngeal nerve is the short intralaryngeal continuation after the RLN enters
    // immediately posterior to the cricothyroid joint.
    tube("inferior-laryngeal-nerve", [
      v(lc.x + side * ls.x * 0.10, crico.y - ls.y * 0.02, crico.z - ls.z * 0.04),
      v(lc.x + side * ls.x * 0.095, crico.y + ls.y * 0.05, crico.z + ls.z * 0.02),
      v(lc.x + side * ls.x * 0.085, crico.y + ls.y * 0.10, crico.z + ls.z * 0.12),
      v(lc.x + side * ls.x * 0.06, crico.y + ls.y * 0.13, crico.z + ls.z * 0.19),
    ], nerveR * 0.88);
    // Side-specific recurrent nerves make the different looping courses and clinical relations
    // independently selectable even though the neck segment converges on the same T-O groove.
    const recurrentId = side > 0
      ? "left-recurrent-laryngeal-nerve-larynx"
      : "right-recurrent-laryngeal-nerve-larynx";
    tube(recurrentId, [
      at(side * 0.14, -0.46, -0.16), at(side * 0.13, -0.36, -0.18),
      v(lc.x + side * ls.x * 0.11, crico.y - ls.y * 0.03, crico.z - ls.z * 0.04),
      v(lc.x + side * ls.x * 0.09, crico.y + ls.y * 0.07, crico.z - ls.z * 0.03),
    ], nerveR * 0.88);
    // Galen's anastomosis arcs behind the larynx from the internal SLN territory to the
    // recurrent/inferior laryngeal pathway.
    tube("galen-anastomosis", [
      v(lc.x + side * ls.x * 0.07, memb.y - ls.y * 0.02, memb.z - ls.z * 0.04),
      v(lc.x + side * ls.x * 0.10, thyroid.y, thyroid.z - ls.z * 0.15),
      v(lc.x + side * ls.x * 0.10, crico.y + ls.y * 0.13, crico.z - ls.z * 0.05),
      v(lc.x + side * ls.x * 0.09, crico.y + ls.y * 0.07, crico.z - ls.z * 0.03),
    ], nerveR * 0.72);
    // Superior thyroid artery — first branch of the external carotid, descending anteriorly.
    tube("superior-thyroid-artery", [
      at(side * 0.37, 0.31, 0.03), at(side * 0.31, 0.13, 0.10),
      at(side * 0.24, -0.16, 0.13), at(side * 0.20, -0.29, 0.12),
    ], arteryR);
    // Superior laryngeal artery — its branch that pierces the thyrohyoid membrane with the nerve.
    tube("superior-laryngeal-artery", [
      at(side * 0.34, 0.29, 0.05),
      v(lc.x + side * ls.x * 0.20, memb.y + ls.y * 0.01, memb.z + ls.z * 0.10),
      v(lc.x + side * ls.x * 0.09, memb.y, memb.z + ls.z * 0.09),
    ], arteryR * 0.82);
    // Inferior thyroid artery — from the thyrocervical trunk, ascending to the lower larynx.
    tube("inferior-thyroid-artery", [
      at(side * 0.37, -0.44, 0.04), at(side * 0.31, -0.34, 0.09),
      v(lc.x + side * ls.x * 0.23, crico.y + ls.y * 0.02, crico.z + ls.z * 0.18),
    ], arteryR * 0.94);
    // Paraglottic fat — paired fat spaces lateral to the ventricle, deep to the thyroid lamina.
      blob(
        "paraglottic-fat",
        v(lc.x + side * ls.x * 0.16, thyroid.y + ls.y * 0.04, thyroid.z + ls.z * 0.10),
        ls.x * 0.07,
        ls.y * 0.085,
        ls.z * 0.09,
      );
    }
    // Pre-epiglottic fat — anterior to the epiglottis, beneath the thyrohyoid membrane.
    blob(
      "pre-epiglottic-fat",
      v(lc.x, memb.y - ls.y * 0.04, memb.z + ls.z * 0.22),
      ls.x * 0.11,
      ls.y * 0.10,
      ls.z * 0.075,
    );
  }

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
import { attachImageMeshSupplement } from "../image-mesh-supplement.ts";
