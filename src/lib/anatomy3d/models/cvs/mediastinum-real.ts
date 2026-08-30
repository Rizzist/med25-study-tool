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
import { mediastinumManifest } from "../../manifests/cvs/mediastinum-real.manifest.mjs";

// Same-origin assets — no cross-origin network.
const MODEL_URL = "/anatomy3d/cvs/mediastinum.glb";
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
const TARGET_SPAN = 1.9;

const KNOWN_IDS = new Set(mediastinumManifest.structures.map((s) => s.id));
function structureTissue(id: string): Tissue {
  return (mediastinumManifest.structures.find((s) => s.id === id)?.tissue ?? "muscle") as Tissue;
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

export async function createMediastinumModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();

  const root = new Group();
  root.name = "cvs-mediastinum-real";
  root.add(gltf.scene);
  const structures = new Map<string, Object3D[]>();
  const pushMesh = (id: string, mesh: Object3D) => structures.set(id, [...(structures.get(id) ?? []), mesh]);

  // --- Real meshes from the GLB (arterial + venous great vessels, trachea/bronchi, oesophagus, thymus) ---
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

  // --- Procedural (schematic) structures with no separable BodyParts3D mesh -------------
  // Placed from the real meshes' bounding boxes so they self-align to the loaded anatomy:
  // the mediastinal divisions, the ligamentum arteriosum & aortopulmonary window, the whole
  // azygos venous system, the carina, the oesophageal constrictions and the thoracic duct.
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

  const addProcedural = (id: string, mesh: Mesh, translucent = false, opacity = 0.2) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    const mat = tissueMaterial(structureTissue(id));
    if (translucent) {
      mat.transparent = true;
      mat.opacity = opacity;
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
    const divisions = Math.max(28, (pts.length - 1) * 16);
    const smooth = new CatmullRomCurve3(path.getSpacedPoints(divisions), false, "centripetal", 0.5);
    addProcedural(id, new Mesh(new TubeGeometry(smooth, divisions, radius, 10, false)));
  };
  const blob = (id: string, at: Vector3, sx: number, sy: number, sz: number) => {
    const m = new Mesh(new SphereGeometry(1, 16, 12));
    m.position.copy(at); m.scale.set(sx, sy, sz);
    addProcedural(id, m);
  };
  // Faint translucent volume marking a mediastinal compartment (region box).
  const region = (id: string, at: Vector3, sx: number, sy: number, sz: number, opacity = 0.1) => {
    const m = new Mesh(new BoxGeometry(sx, sy, sz));
    m.position.copy(at);
    addProcedural(id, m, true, opacity);
  };

  // Overall + key real-mesh anchors (in the normalized frame: +Y superior, +Z anterior, +X subject-left).
  const overall = boxOf(mediastinumManifest.structures.filter((s) => !s.schematic).map((s) => s.id));
  const oc = overall.isEmpty() ? new Vector3() : overall.getCenter(new Vector3());
  const cArch = centre("arch-of-aorta");
  const cPulm = centre("pulmonary-trunk");
  const cLPA = centre("left-pulmonary-artery");
  const cSVC = centre("superior-vena-cava");
  const cLBCV = centre("left-brachiocephalic-vein");
  const cRMB = centre("right-main-bronchus");
  const cLMB = centre("left-main-bronchus");
  const cOeso = centre("oesophagus");
  const oesoBox = boxOf(["oesophagus"]);

  // 1-4. Mediastinal divisions — faint translucent compartment volumes. The sternal-angle plane
  //      (T4/T5) at ~y = cArch.y - 0.06 splits the superior mediastinum from the inferior three.
  const planeY = cArch.y - 0.06;
  region("superior-mediastinum", v(oc.x, planeY + 0.24, 0.0), 0.5, 0.46, 0.42, 0.09);
  region("anterior-mediastinum", v(oc.x, planeY - 0.28, 0.20), 0.42, 0.54, 0.14, 0.1);
  region("middle-mediastinum",   v(oc.x, planeY - 0.30, 0.02), 0.44, 0.58, 0.22, 0.09);
  region("posterior-mediastinum",v(oc.x, planeY - 0.40, -0.16), 0.42, 0.70, 0.16, 0.1);

  // 5. Carina — keel-shaped cartilage ridge at the tracheal bifurcation, between the bronchi.
  const carinaAt = v((cRMB.x + cLMB.x) / 2, Math.max(cRMB.y, cLMB.y) + 0.13, (cRMB.z + cLMB.z) / 2 + 0.02);
  blob("carina", carinaAt, 0.013, 0.05, 0.032);

  // 6. Ligamentum arteriosum — fibrous cord from the inferior arch/isthmus to the pulmonary
  //    bifurcation / left pulmonary-artery origin.
  tube("ligamentum-arteriosum", [
    v(cArch.x + 0.02, cArch.y - 0.05, cArch.z + 0.02),
    v((cArch.x + cLPA.x) / 2 + 0.02, (cArch.y + cPulm.y) / 2 - 0.02, (cArch.z + cLPA.z) / 2 + 0.02),
    v(cLPA.x - 0.05, cPulm.y - 0.02, cLPA.z + 0.03),
  ], 0.011);

  // 7. Aortopulmonary window — faint space between the inferior arch and the pulmonary bifurcation.
  blob("aortopulmonary-window", v(cArch.x + 0.03, cArch.y - 0.07, cArch.z + 0.04), 0.075, 0.05, 0.075);
  // (blob is opaque by default; make this one translucent)
  for (const obj of structures.get("aortopulmonary-window") ?? []) {
    const mat = (obj as Mesh).material as MeshStandardMaterial;
    mat.transparent = true; mat.opacity = 0.22; mat.depthWrite = false; mat.side = DoubleSide;
  }

  // 8. Azygos vein — ascends on the right of the vertebral bodies (posterior), arching over the
  //    right lung root at ~T4 into the SVC.
  tube("azygos-vein", [
    v(-0.18, oc.y - 0.42, -0.16),
    v(-0.20, oc.y - 0.12, -0.18),
    v(-0.22, cArch.y - 0.14, -0.16),
    v(-0.20, cSVC.y - 0.02, -0.02),
    v(cSVC.x - 0.01, cSVC.y, cSVC.z - 0.04),
  ], 0.013);

  // 9. Hemiazygos vein — left-sided, ascends to ~T9 then crosses the midline (behind the aorta)
  //    to join the azygos.
  tube("hemiazygos-vein", [
    v(0.16, oc.y - 0.42, -0.17),
    v(0.15, oc.y - 0.17, -0.18),
    v(0.02, cArch.y - 0.42, -0.19),
    v(-0.16, cArch.y - 0.39, -0.17),
  ], 0.011);

  // 10. Accessory hemiazygos vein — mid-left, descends and crosses at ~T7-T8 to the azygos.
  tube("accessory-hemiazygos-vein", [
    v(0.15, cArch.y - 0.13, -0.17),
    v(0.15, cArch.y - 0.27, -0.18),
    v(0.0, cArch.y - 0.32, -0.19),
    v(-0.16, cArch.y - 0.34, -0.17),
  ], 0.010);

  // 11. Left superior intercostal vein — crosses the aortic arch to the left brachiocephalic vein.
  tube("left-superior-intercostal-vein", [
    v(0.15, cArch.y - 0.03, -0.13),
    v(0.06, cArch.y + 0.02, -0.03),
    v(cLBCV.x + 0.03, cLBCV.y - 0.02, cLBCV.z - 0.03),
    v(cLBCV.x + 0.03, cLBCV.y + 0.01, cLBCV.z - 0.02),
  ], 0.009);

  // 12. Thoracic duct — ascends from the aortic hiatus (posterior, between azygos & aorta), crossing
  //     to the left at ~T4/T5 to drain into the left venous angle (near the left brachiocephalic vein).
  tube("thoracic-duct", [
    v(-0.06, oc.y - 0.44, -0.15),
    v(-0.07, oc.y - 0.12, -0.16),
    v(-0.06, cArch.y - 0.10, -0.14),
    v(-0.02, cArch.y + 0.0, -0.08),
    v(cLBCV.x + 0.06, cLBCV.y - 0.04, cLBCV.z - 0.04),
    v(cLBCV.x + 0.05, cLBCV.y + 0.02, cLBCV.z - 0.01),
  ], 0.007);

  // 13. Oesophageal constrictions — four narrowing bands along the oesophagus (cervical, aortic-arch,
  //     left-main-bronchus, diaphragmatic hiatus).
  const oesoTop = oesoBox.isEmpty() ? cOeso.y + 0.5 : oesoBox.max.y;
  const oesoBot = oesoBox.isEmpty() ? cOeso.y - 0.5 : oesoBox.min.y;
  const bandYs = [oesoTop - 0.04, cArch.y, cLMB.y + 0.02, oesoBot + 0.05];
  for (const by of bandYs) {
    const band = new Mesh(new SphereGeometry(1, 14, 10));
    band.position.set(cOeso.x, by, cOeso.z);
    band.scale.set(0.04, 0.017, 0.04);
    addProcedural("oesophageal-constrictions", band);
  }

  // Defensive normalization to the contract (~1.9-unit bbox centred at origin). The GLB is baked
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
