import {
  Box3,
  Group,
  Material,
  Mesh,
  Object3D,
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
