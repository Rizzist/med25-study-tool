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
  const addProcedural = (id: string, mesh: Mesh) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    mesh.material = tissueMaterial(structureTissue(id));
    gltf.scene.add(mesh);
    pushMesh(id, mesh);
  };
  const vec = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const tube = (id: string, pts: Vector3[], radius: number) =>
    addProcedural(id, new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), Math.max(12, pts.length * 8), radius, 6, false)));

  const nasalBox = boxOf(["nasal-bone", "nasal-septum", "lateral-nasal-cartilage", "vomer", "inferior-concha", "ethmoid-bone"]);
  const infConchaBox = boxOf(["inferior-concha"]);
  if (!nasalBox.isEmpty()) {
    const c = nasalBox.getCenter(new Vector3());
    const s = nasalBox.getSize(new Vector3());
    const infY = infConchaBox.isEmpty() ? c.y - s.y * 0.18 : infConchaBox.getCenter(new Vector3()).y;
    const wallX = s.x * 0.28;      // lateral wall offset from midline
    const zMid = c.z - s.z * 0.02; // conchae sit slightly behind the anterior cartilages

    const midConchaY = infY + s.y * 0.20;
    const supConchaY = infY + s.y * 0.38;

    for (const side of [1, -1]) {
      // Superior + middle conchae (scrolls on each lateral wall, above the real inferior concha).
      const sup = conchaMesh(s.x * 0.10, s.z * 0.34, side);
      sup.position.set(side * wallX * 0.9, supConchaY, zMid + s.z * 0.05);
      addProcedural("superior-concha", sup);
      const mid = conchaMesh(s.x * 0.14, s.z * 0.44, side);
      mid.position.set(side * wallX, midConchaY, zMid);
      addProcedural("middle-concha", mid);

      // Meatuses: thin air slabs just beneath each concha (superior/middle/inferior).
      const supM = new Mesh(new BoxGeometry(s.x * 0.13, s.y * 0.06, s.z * 0.30));
      supM.position.set(side * wallX * 0.75, supConchaY - s.y * 0.10, zMid + s.z * 0.04);
      addProcedural("superior-meatus", supM);
      const midM = new Mesh(new BoxGeometry(s.x * 0.16, s.y * 0.07, s.z * 0.38));
      midM.position.set(side * wallX * 0.72, midConchaY - s.y * 0.11, zMid);
      addProcedural("middle-meatus", midM);
      const infM = new Mesh(new BoxGeometry(s.x * 0.18, s.y * 0.08, s.z * 0.42));
      infM.position.set(side * wallX * 0.7, infY - s.y * 0.13, zMid + s.z * 0.02);
      addProcedural("inferior-meatus", infM);

      // Maxillary sinus (paired), lateral & inferior to the cavity.
      const maxS = new Mesh(new SphereGeometry(1, 20, 14));
      maxS.position.set(side * s.x * 0.42, c.y - s.y * 0.18, c.z + s.z * 0.04);
      maxS.scale.set(s.x * 0.2, s.y * 0.26, s.z * 0.24);
      addProcedural("maxillary-sinus", maxS);

      // Choanae (paired posterior nasal apertures).
      const cho = new Mesh(new TorusGeometry(Math.min(s.x, s.y) * 0.18, Math.min(s.x, s.y) * 0.05, 12, 24));
      cho.position.set(side * s.x * 0.14, c.y - s.y * 0.14, nasalBox.min.z + s.z * 0.06);
      addProcedural("choanae", cho);
    }

    // Frontal sinus: broad air cavity, superior & anterior in the midline.
    const frontal = new Mesh(new SphereGeometry(1, 22, 16));
    frontal.position.set(0, c.y + s.y * 0.42, c.z + s.z * 0.28);
    frontal.scale.set(s.x * 0.34, s.y * 0.16, s.z * 0.14);
    addProcedural("frontal-sinus", frontal);

    // Sphenoid sinus: deep posterior cavity in the midline.
    const sphenoid = new Mesh(new SphereGeometry(1, 22, 16));
    sphenoid.position.set(0, c.y + s.y * 0.06, c.z - s.z * 0.42);
    sphenoid.scale.set(s.x * 0.22, s.y * 0.18, s.z * 0.16);
    addProcedural("sphenoid-sinus", sphenoid);

    // Ethmoidal air cells: cluster of small cells between the orbits, central-superior.
    const cells: Array<[number, number, number, number]> = [
      [0.12, 0.24, -0.02, 0.09], [-0.12, 0.24, -0.02, 0.09],
      [0.20, 0.20, -0.08, 0.08], [-0.20, 0.20, -0.08, 0.08],
      [0.10, 0.30, -0.10, 0.07], [-0.10, 0.30, -0.10, 0.07],
    ];
    for (const [fx, fy, fz, fr] of cells) {
      const cell = new Mesh(new SphereGeometry(fr * Math.min(s.x, s.y, s.z) * 1.2, 14, 10));
      cell.position.set(fx * s.x, c.y + fy * s.y, c.z + fz * s.z);
      addProcedural("ethmoidal-air-cells", cell);
    }

    // Hard palate: horizontal bony plate at the floor of the cavity / roof of the mouth.
    const palate = new Mesh(new BoxGeometry(s.x * 0.9, s.y * 0.06, s.z * 0.68));
    palate.position.set(0, nasalBox.min.y + s.y * 0.06, c.z + s.z * 0.04);
    addProcedural("hard-palate", palate);

    // --- Procedural NERVE & VESSEL layers (no BodyParts3D mesh) ----------------
    // (+Z = anterior/front of nose, −Z = posterior toward the nasopharynx.)
    for (const side of [1, -1]) {
      // Nasopalatine nerve: from the sphenopalatine foramen forward & down along the septum.
      tube("nasopalatine-nerve", [
        vec(side * 0.05, c.y + s.y * 0.12, c.z - s.z * 0.32),
        vec(side * 0.04, c.y - s.y * 0.05, c.z - s.z * 0.02),
        vec(side * 0.03, c.y - s.y * 0.28, c.z + s.z * 0.32),
      ], 0.012);
      // Anterior ethmoidal nerve: enters the roof anteriorly, runs down the internal nose.
      tube("anterior-ethmoidal-nerve", [
        vec(side * s.x * 0.18, c.y + s.y * 0.34, c.z - s.z * 0.04),
        vec(side * s.x * 0.15, c.y + s.y * 0.12, c.z + s.z * 0.18),
        vec(side * s.x * 0.12, c.y - s.y * 0.05, c.z + s.z * 0.40),
      ], 0.011);
      // Sphenopalatine artery: from the sphenopalatine foramen, fanning antero-medially.
      tube("sphenopalatine-artery", [
        vec(side * s.x * 0.30, c.y + s.y * 0.04, c.z - s.z * 0.32),
        vec(side * s.x * 0.22, c.y - s.y * 0.05, c.z - s.z * 0.04),
        vec(side * s.x * 0.14, c.y - s.y * 0.16, c.z + s.z * 0.20),
      ], 0.013);
      // Anterior ethmoidal artery: accompanies its nerve along the roof.
      tube("anterior-ethmoidal-artery", [
        vec(side * s.x * 0.21, c.y + s.y * 0.36, c.z - s.z * 0.07),
        vec(side * s.x * 0.15, c.y + s.y * 0.14, c.z + s.z * 0.16),
        vec(side * s.x * 0.10, c.y, c.z + s.z * 0.38),
      ], 0.011);
    }
    // Olfactory nerve (CN I): fine fila piercing the cribriform plate of the ethmoid (the roof).
    for (let i = 0; i < 10; i++) {
      const fx = (-0.16 + (i % 5) * 0.08) * s.x;
      const fz = (i < 5 ? -0.06 : 0.06) * s.z;
      tube("olfactory-nerve", [
        vec(fx, c.y + s.y * 0.46, c.z + fz),
        vec(fx, c.y + s.y * 0.33, c.z + fz),
      ], 0.006);
    }
    // Kiesselbach plexus (Little's area): anastomotic vascular patch on the anteroinferior septum.
    const kx = c.z + s.z * 0.42, ky = c.y - s.y * 0.15;
    for (const [dx, dz] of [[0.05, 0.06], [-0.05, 0.06], [0.05, -0.05], [-0.05, -0.05]] as const) {
      tube("kiesselbach-plexus", [
        vec(-dx, ky - dz, kx - 0.02), vec(0, ky, kx), vec(dx, ky + dz, kx - 0.02),
      ], 0.008);
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
