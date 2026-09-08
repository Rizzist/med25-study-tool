import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
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
import { nasalRealManifest } from "../../manifests/respiratory/nasal-real.manifest.mjs";

const MODEL_URL = "/anatomy3d/respiratory/nasal-real.glb";
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
const TARGET_SPAN = 1.9;

const KNOWN_IDS = new Set(nasalRealManifest.structures.map((s) => s.id));
function structureTissue(id: string): Tissue {
  return (nasalRealManifest.structures.find((s) => s.id === id)?.tissue ?? "bone") as Tissue;
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

// A scroll-like concha shelf (from the stylised model): a partial open half-cylinder whose axis
// runs anteroposteriorly (Z), curling medially. `side` is +1 for subject-left (+X), −1 for right.
function conchaMesh(radius: number, lengthZ: number, side: number): Mesh {
  const mesh = new Mesh(
    new CylinderGeometry(radius, radius, lengthZ, 20, 1, true, Math.PI * 0.18, Math.PI * 1.28),
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.rotation.z = side > 0 ? -0.32 : 0.32;
  mesh.scale.set(side, 0.82, 1);
  return mesh;
}

export async function createRealNasalModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();
  await attachImageMeshSupplement(gltf.scene, "nasal-real");

  const root = new Group();
  root.name = "respiratory-nasal-real";
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

  // --- Procedural (schematic) fills: air cavities / conchae / meatuses / palate --
  // BodyParts3D models solids only, so the paranasal air spaces and the superior/middle conchae
  // have no mesh. They are added here (schematic) and placed from the real nasal bounding box.
  gltf.scene.updateMatrixWorld(true); // ensure world matrices are current before bbox math
  const boxOf = (ids: string[]): Box3 => {
    const box = new Box3();
    for (const id of ids) for (const obj of structures.get(id) ?? []) box.expandByObject(obj);
    return box;
  };
  // `opacity` (optional) overrides the tissue default per mesh so overlapping translucent air
  // cavities read as distinct volumes instead of one muddy blob (only meaningful for transparent
  // tissues such as `cavity`; the mesh is already `transparent` from the palette).
  const addProcedural = (id: string, mesh: Mesh, opacity?: number) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    const material = tissueMaterial(structureTissue(id));
    if (opacity !== undefined) material.opacity = opacity;
    mesh.material = material;
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
  const blob = (id: string, at: Vector3, sx: number, sy: number, sz: number) => {
    const mesh = new Mesh(new SphereGeometry(1, 16, 12));
    mesh.position.copy(at);
    mesh.scale.set(sx, sy, sz);
    addProcedural(id, mesh);
  };

  const nasalBox = boxOf(["nasal-bone", "nasal-septum", "lateral-nasal-cartilage", "vomer", "inferior-concha", "ethmoid-bone"]);
  const infConchaBox = boxOf(["inferior-concha"]);
  if (!nasalBox.isEmpty()) {
    const c = nasalBox.getCenter(new Vector3());
    const s = nasalBox.getSize(new Vector3());
    // Fractional coordinates are always resolved inside the REAL osteocartilaginous envelope.
    // Keeping every overlay tied to this box prevents one long schematic route from shrinking the
    // scan-derived nose to a tiny cluster when the viewer frames the completed model.
    const at = (fx: number, fy: number, fz: number) => vec(
      c.x + s.x * fx,
      c.y + s.y * fy,
      c.z + s.z * fz,
    );
    const infY = infConchaBox.isEmpty() ? c.y - s.y * 0.18 : infConchaBox.getCenter(new Vector3()).y;
    const zMid = c.z - s.z * 0.02;         // conchae/meatuses sit just behind the anterior cartilages
    // Stack the conchae with clear vertical air-gaps so each shelf + its meatus reads separately
    // (the real inferior concha is a tall solid mesh, so lift the middle/superior well above it).
    const midConchaY = infY + s.y * 0.32;  // middle concha, clear of the inferior concha above
    const supConchaY = infY + s.y * 0.52;  // superior concha, clear of the middle concha above
    const zSup = zMid - s.z * 0.10;        // the superior concha/meatus lie postero-superiorly

    for (const side of [1, -1]) {
      // Conchae — clean scroll shelves hugging the lateral wall, stacked above the real inferior
      // concha (middle above it, superior above that and set back), spaced so none overlap.
      const mid = conchaMesh(s.x * 0.11, s.z * 0.36, side);
      mid.position.set(side * s.x * 0.26, midConchaY, zMid);
      addProcedural("middle-concha", mid);
      const sup = conchaMesh(s.x * 0.085, s.z * 0.26, side);
      sup.position.set(side * s.x * 0.24, supConchaY, zSup);
      addProcedural("superior-concha", sup);

      // Meatuses — thin translucent air slabs nested in the gap immediately beneath each concha,
      // slightly more opaque than the big sinuses so the three read as distinct lateral-wall slots.
      const supM = new Mesh(new BoxGeometry(s.x * 0.12, s.y * 0.05, s.z * 0.26));
      supM.position.set(side * s.x * 0.20, supConchaY - s.y * 0.085, zSup);
      addProcedural("superior-meatus", supM, 0.52);
      const midM = new Mesh(new BoxGeometry(s.x * 0.14, s.y * 0.055, s.z * 0.34));
      midM.position.set(side * s.x * 0.22, midConchaY - s.y * 0.11, zMid);
      addProcedural("middle-meatus", midM, 0.52);
      const infM = new Mesh(new BoxGeometry(s.x * 0.16, s.y * 0.06, s.z * 0.40));
      infM.position.set(side * s.x * 0.28, infY - s.y * 0.12, zMid + s.z * 0.02);
      addProcedural("inferior-meatus", infM, 0.52);

      // Maxillary sinus (paired) — the largest sinus: pushed lateral & inferior into the maxillary
      // body so its medial edge stays off the conchae/central cavity; kept faintest so bone reads.
      const maxS = new Mesh(new SphereGeometry(1, 20, 14));
      maxS.position.copy(at(side * 0.39, -0.16, 0.01));
      maxS.scale.set(s.x * 0.12, s.y * 0.18, s.z * 0.13);
      addProcedural("maxillary-sinus", maxS, 0.3);

      // Choanae (paired posterior nasal apertures) — rings at the back of each cavity.
      const cho = new Mesh(new TorusGeometry(Math.min(s.x, s.y) * 0.16, Math.min(s.x, s.y) * 0.045, 12, 24));
      cho.position.set(side * s.x * 0.15, c.y - s.y * 0.13, nasalBox.min.z + s.z * 0.07);
      addProcedural("choanae", cho, 0.6);

      // Frontal sinus (paired) — superior & anterior, sitting just above the nasal bones.
      const frontal = new Mesh(new SphereGeometry(1, 20, 14));
      frontal.position.copy(at(side * 0.12, 0.40, 0.13));
      frontal.scale.set(s.x * 0.09, s.y * 0.075, s.z * 0.07);
      addProcedural("frontal-sinus", frontal, 0.5);

      // Ethmoidal air cells — a tidy, small medial cluster between the orbits (2 per side),
      // slightly opaque so the little beads stay distinct from the surrounding cavities.
      for (const [zCoef, yCoef] of [[0.04, 0.18], [-0.06, 0.18]] as const) {
        const cell = new Mesh(new SphereGeometry(s.x * 0.06, 12, 10));
        cell.position.set(side * s.x * 0.14, c.y + s.y * yCoef, c.z + s.z * zCoef);
        addProcedural("ethmoidal-air-cells", cell, 0.6);
      }
    }

    // Sphenoid sinus — a single deep cavity, posterior & superior in the midline.
    const sphenoid = new Mesh(new SphereGeometry(1, 22, 16));
    sphenoid.position.copy(at(0, 0.14, -0.37));
    sphenoid.scale.set(s.x * 0.16, s.y * 0.12, s.z * 0.085);
    addProcedural("sphenoid-sinus", sphenoid, 0.44);

    // Hard palate — horizontal bony plate at the floor of the cavity / roof of the mouth.
    const palate = new Mesh(new BoxGeometry(s.x * 0.85, s.y * 0.06, s.z * 0.60));
    palate.position.set(0, nasalBox.min.y + s.y * 0.05, c.z + s.z * 0.06);
    addProcedural("hard-palate", palate);

    // --- Procedural NERVE & VESSEL layers (no BodyParts3D mesh) ----------------
    // (+Z = anterior/front of nose, −Z = posterior toward the nasopharynx.)
    for (const side of [1, -1]) {
      // Nasopalatine nerve: from the sphenopalatine foramen forward & down along the septum.
      tube("nasopalatine-nerve", [
        at(side * 0.06, 0.12, -0.32),
        at(side * 0.05, -0.05, -0.02),
        at(side * 0.04, -0.28, 0.32),
      ], 0.012);
      // Anterior ethmoidal nerve: enters the roof anteriorly, runs down the internal nose.
      tube("anterior-ethmoidal-nerve", [
        at(side * 0.18, 0.34, -0.04),
        at(side * 0.15, 0.12, 0.18),
        at(side * 0.12, -0.05, 0.40),
      ], 0.011);
      // Sphenopalatine artery: from the sphenopalatine foramen, fanning antero-medially.
      tube("sphenopalatine-artery", [
        at(side * 0.30, 0.04, -0.32),
        at(side * 0.22, -0.05, -0.04),
        at(side * 0.14, -0.16, 0.20),
      ], 0.016);
      // Anterior ethmoidal artery: accompanies its nerve along the roof.
      tube("anterior-ethmoidal-artery", [
        at(side * 0.21, 0.36, -0.07),
        at(side * 0.15, 0.14, 0.16),
        at(side * 0.10, 0, 0.38),
      ], 0.014);
    }
    // Olfactory nerve (CN I): fine fila piercing the cribriform plate of the ethmoid (the roof).
    for (let i = 0; i < 10; i++) {
      const fx = (-0.16 + (i % 5) * 0.08) * s.x;
      const fz = (i < 5 ? -0.06 : 0.06) * s.z;
      tube("olfactory-nerve", [
        vec(c.x + fx, c.y + s.y * 0.46, c.z + fz),
        vec(c.x + fx, c.y + s.y * 0.33, c.z + fz),
      ], 0.008);
    }

    // Detailed trigeminal + autonomic routes. These are paired where the anatomical structure is
    // paired, but remain one exam target per named pathway so laterality never changes the answer.
    for (const side of [1, -1]) {
      const ganglion = at(side * 0.34, 0.08, -0.34);
      blob("pterygopalatine-ganglion", ganglion, s.x * 0.035, s.y * 0.045, s.z * 0.035);
      tube("maxillary-nerve-v2", [
        at(side * 0.47, 0.23, -0.42),
        at(side * 0.42, 0.16, -0.38),
        ganglion,
      ], 0.009);
      tube("nasociliary-nerve", [
        at(side * 0.44, 0.39, -0.08),
        at(side * 0.30, 0.38, -0.02),
        at(side * 0.18, 0.34, -0.04),
      ], 0.008);
      tube("nerve-of-pterygoid-canal", [
        at(side * 0.42, 0.08, -0.47),
        at(side * 0.39, 0.08, -0.41),
        ganglion,
      ], 0.008);
      tube("greater-petrosal-nerve", [
        at(side * 0.22, 0.47, -0.44),
        at(side * 0.31, 0.32, -0.45),
        at(side * 0.42, 0.08, -0.47),
      ], 0.007);
      tube("deep-petrosal-nerve", [
        at(side * 0.47, 0.30, -0.45),
        at(side * 0.45, 0.18, -0.46),
        at(side * 0.42, 0.08, -0.47),
      ], 0.007);
      tube("posterior-superior-lateral-nasal-nerves", [
        ganglion,
        at(side * 0.30, 0.12, -0.28),
        at(side * 0.28, 0.30, -0.05),
        at(side * 0.27, 0.17, 0.18),
      ], 0.007);
      tube("posterior-superior-medial-nasal-nerves", [
        ganglion,
        at(side * 0.18, 0.18, -0.25),
        at(side * 0.07, 0.20, -0.08),
      ], 0.0065);
      tube("posterior-inferior-lateral-nasal-nerves", [
        ganglion,
        at(side * 0.36, -0.08, -0.20),
        at(side * 0.31, -0.20, 0.02),
        at(side * 0.29, -0.23, 0.25),
      ], 0.0065);
      tube("greater-palatine-nerve", [
        ganglion,
        at(side * 0.38, -0.15, -0.20),
        vec(c.x + side * s.x * 0.32, nasalBox.min.y + s.y * 0.07, c.z + s.z * 0.02),
        vec(c.x + side * s.x * 0.20, nasalBox.min.y + s.y * 0.04, c.z + s.z * 0.34),
      ], 0.007);
      tube("external-nasal-nerve", [
        at(side * 0.12, -0.05, 0.38),
        at(side * 0.18, -0.10, 0.43),
        at(side * 0.20, -0.18, 0.47),
      ], 0.0065);
    }
    // Bulbs lie immediately above the cribriform plate and the paired tracts continue posteriorly.
    for (const side of [1, -1]) {
      blob("olfactory-bulb-and-tract", at(side * 0.09, 0.47, 0), s.x * 0.05, s.y * 0.025, s.z * 0.06);
      tube("olfactory-bulb-and-tract", [
        at(side * 0.09, 0.47, 0),
        at(side * 0.08, 0.47, -0.22),
        at(side * 0.07, 0.46, -0.43),
      ], 0.009);
    }
    // Kiesselbach plexus (Little's area): anastomotic vascular patch on the anteroinferior septum.
    const kx = c.z + s.z * 0.42, ky = c.y - s.y * 0.15;
    for (const [dx, dz] of [[0.05, 0.06], [-0.05, 0.06], [0.05, -0.05], [-0.05, -0.05]] as const) {
      tube("kiesselbach-plexus", [
        vec(-dx, ky - dz, kx - 0.02), vec(0, ky, kx), vec(dx, ky + dz, kx - 0.02),
      ], 0.010);
    }
  }

  // Defensive normalization to the contract (~2-unit bbox at origin; ~no-op for the baked GLB).
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
