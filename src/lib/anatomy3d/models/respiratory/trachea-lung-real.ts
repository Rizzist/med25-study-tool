import {
  Box3,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  Object3D,
  SphereGeometry,
  TorusGeometry,
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

  const tracheaBox = boxOf(["trachea"]);
  const rightLungBox = boxOf(["right-upper-lobe", "right-middle-lobe", "right-lower-lobe"]);
  const leftLungBox = boxOf(["left-upper-lobe", "left-lower-lobe"]);

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
    // Horizontal fissure: right lung only, upper third, roughly transverse.
    const hf = new Mesh(new BoxGeometry(s.x * 0.92, s.y * 0.02, s.z * 0.86));
    hf.position.set(c.x, c.y + s.y * 0.16, c.z + s.z * 0.06);
    addProcedural("horizontal-fissure", hf);
    // Oblique fissure (right): tilted plane, lower-anterior to higher-posterior.
    const ofr = new Mesh(new BoxGeometry(s.x * 0.9, s.y * 0.02, s.z * 1.05));
    ofr.position.set(c.x, c.y, c.z);
    ofr.rotation.x = -0.9;
    addProcedural("oblique-fissure", ofr);
    // Hilum / root (right): medial surface (toward the midline, +X side of the right lung).
    const hr = new Mesh(new SphereGeometry(Math.min(s.x, s.z) * 0.22, 16, 12));
    hr.position.set(c.x + s.x * 0.36, c.y + s.y * 0.05, c.z - s.z * 0.12);
    hr.scale.set(0.8, 1.1, 0.8);
    addProcedural("hilum-root", hr);
  }

  if (!leftLungBox.isEmpty()) {
    const c = leftLungBox.getCenter(new Vector3());
    const s = leftLungBox.getSize(new Vector3());
    // Oblique fissure (left).
    const ofl = new Mesh(new BoxGeometry(s.x * 0.9, s.y * 0.02, s.z * 1.05));
    ofl.position.set(c.x, c.y, c.z);
    ofl.rotation.x = -0.9;
    addProcedural("oblique-fissure", ofl);
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
