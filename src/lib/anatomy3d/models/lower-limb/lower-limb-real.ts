import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  Group,
  Material,
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
import { lowerLimbManifest } from "../../manifests/lower-limb/lower-limb-real.manifest.mjs";

// Where the GLB is served from (same-origin, no cross-origin network).
const MODEL_URL = "/anatomy3d/lower-limb/lower-limb.glb";
// Draco decoder is hosted alongside the assets (same-origin) so nothing is fetched from a CDN.
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
// ~2-unit target bounding box per the engine contract.
const TARGET_SPAN = 1.9;

function structureTissue(id: string): Tissue {
  const structure = lowerLimbManifest.structures.find((candidate) => candidate.id === id);
  return (structure?.tissue ?? "bone") as Tissue;
}

// glTF `extras` land on Object3D.userData via GLTFLoader. The GLB is authored with the
// structureId on each part node; fall back to the node name (which we set == structureId).
const KNOWN_IDS = new Set(lowerLimbManifest.structures.map((s) => s.id));
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

export async function createLowerLimbModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);

  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();

  const root = new Group();
  root.name = "lower-limb-real";
  root.add(gltf.scene);

  const structures = new Map<string, Object3D[]>();

  // Visit every mesh exactly once. Resolve its structureId from itself or an ancestor node, then swap
  // in tissueMaterial so highlight/dim behave exactly like the stylised models.
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

  // --- Procedural (schematic) LAYERS: joints / ligaments / menisci / nerves / small vessel --------
  // BodyParts3D has no dedicated meshes for the knee/hip/ankle joint capsules, the cruciate /
  // collateral / iliofemoral / deltoid ligaments, the menisci, the lumbosacral-plexus nerves or the
  // small fibular artery at this scope, so these are authored here (userData.schematic = true) and
  // routed relative to the real, scan-derived bones and muscles. Coordinates are in the GLB's baked
  // normalised frame: +Y superior, +Z anterior, +X subject-left (this is a LEFT limb, so +X is
  // lateral and −X is medial).
  gltf.scene.updateMatrixWorld(true);
  const pushMesh = (id: string, mesh: Object3D) => structures.set(id, [...(structures.get(id) ?? []), mesh]);
  const addProcedural = (id: string, mesh: Mesh) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    mesh.material = tissueMaterial(structureTissue(id));
    gltf.scene.add(mesh);
    pushMesh(id, mesh);
  };
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

  // Solid, smoothly-curving cord: densify the coarse control polyline into arc-length-even points so
  // the path is graceful, give the tube a rounded cross-section and a finely-tessellated length.
  const tube = (id: string, pts: Vector3[], radius: number) => {
    const path = new CatmullRomCurve3(pts, false, "centripetal", 0.5);
    const divisions = Math.max(24, (pts.length - 1) * 16);
    const smooth = new CatmullRomCurve3(path.getSpacedPoints(divisions), false, "centripetal", 0.5);
    addProcedural(id, new Mesh(new TubeGeometry(smooth, divisions, radius, 9, false)));
  };
  // Translucent joint-cavity blob (cavity tissue is semi-transparent in the palette).
  const blob = (id: string, at: Vector3, sx: number, sy: number, sz: number) => {
    const m = new Mesh(new SphereGeometry(1, 16, 12));
    m.position.copy(at);
    m.scale.set(sx, sy, sz);
    addProcedural(id, m);
  };
  // Flattened ligamentous band (a thin slab spanning two bones).
  const band = (id: string, at: Vector3, sx: number, sy: number, sz: number, rot?: Vector3) => {
    const m = new Mesh(new BoxGeometry(1, 1, 1));
    m.position.copy(at);
    m.scale.set(sx, sy, sz);
    if (rot) m.rotation.set(rot.x, rot.y, rot.z);
    addProcedural(id, m);
  };
  // Semilunar meniscal ring lying flat on the tibial plateau (torus rotated into the XZ plane).
  const ring = (id: string, at: Vector3, major: number, minor: number, arc: number, tiltZ: number) => {
    const m = new Mesh(new TorusGeometry(major, minor, 8, 28, arc));
    m.position.copy(at);
    m.rotation.x = Math.PI / 2;
    m.rotation.z = tiltZ;
    addProcedural(id, m);
  };

  // ---- Joint cavities (translucent) ----
  blob("hip-joint", v(-0.02, 0.49, -0.03), 0.09, 0.09, 0.09);
  blob("knee-joint", v(0.0, -0.235, -0.03), 0.09, 0.05, 0.08);
  blob("ankle-joint", v(-0.02, -0.84, -0.03), 0.07, 0.05, 0.08);

  // ---- Ligaments ----
  // Iliofemoral ligament — inverted-Y anterior to the hip, AIIS/acetabular rim → intertrochanteric line.
  tube("iliofemoral-ligament", [v(-0.03, 0.47, 0.04), v(-0.01, 0.43, 0.02), v(0.02, 0.39, 0.0)], 0.014);
  tube("iliofemoral-ligament", [v(-0.03, 0.47, 0.04), v(-0.03, 0.42, 0.02), v(-0.04, 0.39, 0.0)], 0.012);
  // Anterior cruciate ligament — anterior intercondylar tibia → up/back/lateral to lateral femoral condyle.
  tube("anterior-cruciate-ligament", [v(-0.005, -0.26, -0.01), v(0.005, -0.235, -0.03), v(0.02, -0.205, -0.05)], 0.012);
  // Posterior cruciate ligament — posterior intercondylar tibia → up/forward/medial to medial femoral condyle.
  tube("posterior-cruciate-ligament", [v(0.005, -0.26, -0.06), v(-0.005, -0.235, -0.04), v(-0.02, -0.205, -0.02)], 0.012);
  // Tibial (medial) collateral ligament — broad flat band, medial femoral epicondyle → medial tibia.
  band("tibial-collateral-ligament", v(-0.068, -0.26, -0.03), 0.012, 0.15, 0.05);
  // Fibular (lateral) collateral ligament — cord, lateral femoral epicondyle → head of fibula.
  tube("fibular-collateral-ligament", [v(0.05, -0.20, -0.04), v(0.052, -0.235, -0.045), v(0.05, -0.27, -0.05)], 0.010);
  // Deltoid ligament — triangular medial fan, medial malleolus → talus / calcaneus / navicular.
  for (const tz of [0.06, -0.02, -0.08]) {
    tube("deltoid-ligament", [v(-0.06, -0.82, -0.01), v(-0.055, -0.87, -0.01 + tz), v(-0.05, -0.90, -0.01 + tz)], 0.009);
  }

  // ---- Menisci (diagrammatic C / O rings on the tibial plateau) ----
  ring("medial-meniscus", v(-0.03, -0.232, -0.03), 0.036, 0.012, Math.PI * 1.55, 0.35);
  ring("lateral-meniscus", v(0.032, -0.232, -0.03), 0.032, 0.012, Math.PI * 1.9, -1.9);

  // ---- Nerves ----
  // Lumbosacral plexus — a web of roots over the posterior ilium converging toward the limb nerves.
  tube("lumbosacral-plexus", [v(-0.09, 0.72, -0.02), v(-0.06, 0.62, -0.03), v(-0.04, 0.55, -0.04)], 0.012);
  tube("lumbosacral-plexus", [v(-0.02, 0.72, -0.05), v(-0.03, 0.62, -0.06), v(-0.03, 0.55, -0.07)], 0.012);
  tube("lumbosacral-plexus", [v(0.03, 0.70, -0.03), v(0.0, 0.62, -0.05), v(-0.02, 0.55, -0.08)], 0.012);
  // Femoral nerve — anterior thigh, lateral to the femoral vessels.
  tube("femoral-nerve", [v(-0.03, 0.60, 0.02), v(-0.02, 0.40, 0.02), v(-0.01, 0.12, 0.01)], 0.012);
  // Obturator nerve — through the obturator canal into the medial (adductor) compartment.
  tube("obturator-nerve", [v(-0.06, 0.55, -0.02), v(-0.08, 0.35, -0.03), v(-0.07, 0.12, -0.04)], 0.011);
  // Sciatic nerve — greater sciatic foramen → posterior thigh midline → divides at the popliteal fossa.
  tube("sciatic-nerve", [v(-0.02, 0.52, -0.13), v(-0.02, 0.30, -0.11), v(-0.01, 0.0, -0.10), v(-0.01, -0.15, -0.09)], 0.016);
  // Tibial nerve — popliteal fossa → posterior leg → behind the medial malleolus.
  tube("tibial-nerve", [v(-0.01, -0.16, -0.09), v(-0.02, -0.40, -0.10), v(-0.04, -0.70, -0.06), v(-0.05, -0.83, -0.02)], 0.013);
  // Common fibular nerve — follows biceps femoris, winds around the fibular neck.
  tube("common-fibular-nerve", [v(-0.01, -0.16, -0.09), v(0.03, -0.22, -0.09), v(0.05, -0.27, -0.06), v(0.05, -0.30, -0.04)], 0.012);
  // Superficial fibular nerve — descends the lateral compartment, cutaneous in the distal leg.
  tube("superficial-fibular-nerve", [v(0.05, -0.31, -0.04), v(0.06, -0.50, -0.02), v(0.05, -0.72, 0.0), v(0.04, -0.82, 0.03)], 0.010);
  // Deep fibular nerve — with the anterior tibial artery in the anterior compartment onto the dorsum.
  tube("deep-fibular-nerve", [v(0.05, -0.30, -0.04), v(0.02, -0.42, 0.0), v(0.0, -0.60, 0.01), v(-0.01, -0.82, 0.03)], 0.010);

  // ---- Small vessel ----
  // Fibular (peroneal) artery — branch of the posterior tibial, descends beside the fibula.
  tube("fibular-artery", [v(-0.02, -0.36, -0.07), v(0.01, -0.45, -0.07), v(0.03, -0.62, -0.07), v(0.04, -0.80, -0.06)], 0.012);

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
