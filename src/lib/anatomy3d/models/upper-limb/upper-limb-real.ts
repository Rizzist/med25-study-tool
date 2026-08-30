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
import { upperLimbManifest } from "../../manifests/upper-limb/upper-limb-real.manifest.mjs";

// Same-origin assets — no cross-origin network.
const MODEL_URL = "/anatomy3d/upper-limb/upper-limb.glb";
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
const TARGET_SPAN = 1.9;

const KNOWN_IDS = new Set(upperLimbManifest.structures.map((s) => s.id));
function structureTissue(id: string): Tissue {
  return (upperLimbManifest.structures.find((s) => s.id === id)?.tissue ?? "bone") as Tissue;
}

// glTF node.extras -> Object3D.userData via GLTFLoader; the GLB is authored with the structureId on
// each part node, and the node name is set == structureId as a fallback.
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

export async function createUpperLimbModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();

  const root = new Group();
  root.name = "upper-limb-real";
  root.add(gltf.scene);
  const structures = new Map<string, Object3D[]>();
  const pushMesh = (id: string, mesh: Object3D) => structures.set(id, [...(structures.get(id) ?? []), mesh]);

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

  // --- Procedural (schematic) layers: joints / ligaments / nerves / palmar arches / cubital vein --
  // Everything below is placed from the REAL meshes' bounding boxes so the overlays self-align to
  // the scan anatomy regardless of the exact baked coordinates.
  gltf.scene.updateMatrixWorld(true);
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
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const lerp = (a: Vector3, b: Vector3, t: number) => a.clone().lerp(b, t);
  // Solid, smoothly-curving cord (same recipe as the respiratory nerves/vessels).
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
  // A ring encircling `at`, its axis aligned to `axis` (for a labrum / annular ligament).
  const ring = (id: string, at: Vector3, r: number, tubeR: number, axis: Vector3) => {
    const g = new TorusGeometry(r, tubeR, 8, 26);
    const m = new Mesh(g);
    m.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), axis.clone().normalize());
    m.position.copy(at);
    addProcedural(id, m);
  };

  // ---- Landmarks from the real skeleton -------------------------------------------------------
  const humBox = boxOf(["humerus"]);
  const radBox = boxOf(["radius"]);
  const ulnBox = boxOf(["ulna"]);
  const scapBox = boxOf(["scapula"]);
  const clavBox = boxOf(["clavicle"]);
  const carpBox = boxOf(["carpal-bones"]);
  const metaBox = boxOf(["metacarpals"]);
  const c = (b: Box3) => (b.isEmpty() ? new Vector3() : b.getCenter(new Vector3()));

  const humC = c(humBox);
  const scapC = c(scapBox);
  const clavC = c(clavBox);
  const radC = c(radBox);
  const ulnC = c(ulnBox);
  const carpC = c(carpBox);
  const metaC = c(metaBox);

  // Orientation signs derived at runtime so the overlays follow whichever limb the GLB carries.
  // Medial = toward the trunk (the side the ulna sits on); anterior = +Z (palm faces anterior).
  const medial = Math.sign((ulnC.x - radC.x) || 1) || 1;   // +1 or -1 along X toward medial
  const lateral = -medial;
  const superiorY = humBox.isEmpty() ? 0.9 : humBox.max.y;   // shoulder/glenoid level
  const humHead = v(humC.x, superiorY - 0.02, humC.z);
  const humDistal = v(humC.x, humBox.isEmpty() ? -0.2 : humBox.min.y, humC.z);
  const foreTop = v((radC.x + ulnC.x) / 2, Math.max(radBox.max.y, ulnBox.max.y), (radC.z + ulnC.z) / 2);
  const elbow = lerp(humDistal, foreTop, 0.5);
  const wrist = v(carpC.x, carpBox.isEmpty() ? -0.85 : carpBox.max.y, carpC.z);
  const palm = metaBox.isEmpty() ? v(carpC.x, carpC.y - 0.1, carpC.z + 0.03) : metaC.clone();
  const axilla = v(humC.x + medial * 0.06, superiorY - 0.04, humC.z - 0.02);
  const glenoid = lerp(humHead, scapC, 0.35);

  // ---- Joints (cartilage) ---------------------------------------------------------------------
  blob("glenohumeral-joint", glenoid, 0.055, 0.06, 0.055);
  ring("glenoid-labrum", glenoid, 0.062, 0.012, humHead.clone().sub(scapC));
  blob("elbow-joint", elbow, 0.06, 0.05, 0.06);
  // Proximal + distal radioulnar joints (two markers under one id).
  blob("radioulnar-joints", v((radBox.max.x + ulnBox.min.x) / 2 || elbow.x, foreTop.y - 0.03, foreTop.z), 0.03, 0.035, 0.03);
  blob("radioulnar-joints", v((radC.x + ulnC.x) / 2, wrist.y + 0.05, (radC.z + ulnC.z) / 2), 0.03, 0.035, 0.03);
  // Radiocarpal (wrist) joint: a thin disc between distal radius and the proximal carpal row.
  const wristDisc = new Mesh(new CylinderGeometry(0.07, 0.07, 0.02, 20));
  wristDisc.position.copy(wrist);
  addProcedural("radiocarpal-joint", wristDisc);

  // ---- Ligaments ------------------------------------------------------------------------------
  // Coracoacromial ligament: a short band roofing the glenohumeral region (coracoid -> acromion).
  tube("coracoacromial-ligament", [
    v(glenoid.x + medial * 0.02, glenoid.y + 0.09, glenoid.z + 0.08),
    v(glenoid.x, glenoid.y + 0.12, glenoid.z + 0.02),
    v(glenoid.x + lateral * 0.05, glenoid.y + 0.1, glenoid.z - 0.05),
  ], 0.012);
  // Ulnar (medial) collateral ligament of the elbow: a triangular medial band.
  const ucl = new Mesh(new BoxGeometry(0.02, 0.12, 0.07));
  ucl.position.set(elbow.x + medial * 0.06, elbow.y, elbow.z);
  addProcedural("ulnar-collateral-ligament-elbow", ucl);
  // Annular ligament: a ring encircling the radial head, axis along the forearm (Y).
  ring("annular-ligament-radius", v(radC.x, foreTop.y - 0.04, radC.z), 0.045, 0.012, v(0, 1, 0));

  // ---- Brachial plexus: trunks then cords -----------------------------------------------------
  // Trunks (upper/middle/lower) stacked supero-medial to the clavicle, sloping infero-laterally.
  const neck = v(clavC.x + medial * 0.05, (clavBox.isEmpty() ? superiorY : clavBox.max.y) + 0.14, clavC.z - 0.04);
  const trunkEnds: Array<[string, number]> = [
    ["upper-trunk-brachial-plexus", 0.05],
    ["middle-trunk-brachial-plexus", 0.0],
    ["lower-trunk-brachial-plexus", -0.05],
  ];
  for (const [id, dy] of trunkEnds) {
    tube(id, [
      v(neck.x, neck.y + dy + 0.03, neck.z),
      v(neck.x + lateral * 0.04, neck.y + dy - 0.03, neck.z + 0.01),
      v(axilla.x + lateral * 0.02, axilla.y + dy + 0.05, axilla.z - 0.01),
    ], 0.011);
  }
  // Cords (lateral/posterior/medial) named around the 2nd part of the axillary artery.
  const axArt = boxOf(["axillary-artery"]);
  const axC = axArt.isEmpty() ? axilla.clone() : axArt.getCenter(new Vector3());
  const cordDefs: Array<[string, Vector3]> = [
    ["lateral-cord-brachial-plexus", v(lateral * 0.05, 0.02, 0.02)],
    ["posterior-cord-brachial-plexus", v(0, 0.0, -0.05)],
    ["medial-cord-brachial-plexus", v(medial * 0.05, -0.02, 0.02)],
  ];
  for (const [id, off] of cordDefs) {
    tube(id, [
      v(axC.x + off.x, axC.y + 0.07 + off.y, axC.z + off.z),
      v(axC.x + off.x, axC.y + off.y, axC.z + off.z),
      v(axC.x + off.x * 1.1, axC.y - 0.07 + off.y, axC.z + off.z),
    ], 0.01);
  }

  // ---- Peripheral nerves ----------------------------------------------------------------------
  // Axillary nerve: wraps posteriorly around the surgical neck of the humerus.
  tube("axillary-nerve", [
    v(axC.x, axC.y - 0.04, axC.z - 0.02),
    v(humHead.x + medial * 0.02, humHead.y - 0.06, humHead.z - 0.06),
    v(humHead.x + lateral * 0.06, humHead.y - 0.09, humHead.z - 0.04),
  ], 0.011);
  // Musculocutaneous nerve: from the lateral cord, obliquely down the anterior arm to the lateral forearm.
  tube("musculocutaneous-nerve", [
    v(axC.x + lateral * 0.04, axC.y - 0.02, axC.z + 0.03),
    lerp(axilla, elbow, 0.45).add(v(lateral * 0.05, 0, 0.05)),
    v(elbow.x + lateral * 0.06, elbow.y + 0.02, elbow.z + 0.06),
    v(radC.x + lateral * 0.04, radC.y + 0.1, radC.z + 0.05),
  ], 0.011);
  // Median nerve: with the brachial artery down the medial arm, through the cubital fossa and the
  // carpal tunnel to the hand.
  const brachArt = boxOf(["brachial-artery"]);
  const brachTop = brachArt.isEmpty() ? axilla.clone() : v(brachArt.getCenter(new Vector3()).x, brachArt.max.y, brachArt.getCenter(new Vector3()).z);
  tube("median-nerve", [
    v(axC.x + medial * 0.03, axC.y - 0.03, axC.z + 0.02),
    v(brachTop.x + medial * 0.02, lerp(axilla, elbow, 0.5).y, brachTop.z + 0.02),
    v(elbow.x + medial * 0.01, elbow.y + 0.02, elbow.z + 0.05),
    v((radC.x + ulnC.x) / 2, lerp(elbow, wrist, 0.5).y, ((radC.z + ulnC.z) / 2) + 0.05),
    v(carpC.x, wrist.y + 0.01, carpC.z + 0.05),
    v(palm.x, palm.y, palm.z + 0.05),
  ], 0.012);
  // Ulnar nerve: down the medial arm, behind the medial epicondyle, along the ulnar forearm to Guyon's canal.
  tube("ulnar-nerve", [
    v(axC.x + medial * 0.04, axC.y - 0.03, axC.z + 0.01),
    lerp(axilla, elbow, 0.55).add(v(medial * 0.05, 0, -0.01)),
    v(elbow.x + medial * 0.07, elbow.y, elbow.z - 0.05),
    v(ulnC.x + medial * 0.03, lerp(elbow, wrist, 0.55).y, ulnC.z + 0.03),
    v(ulnBox.isEmpty() ? carpC.x : ulnBox.max.x, wrist.y + 0.02, carpC.z + 0.04),
    v(palm.x + medial * 0.05, palm.y, palm.z + 0.03),
  ], 0.012);
  // Radial nerve: through the triangular interval, spiralling posteriorly in the radial groove, to
  // the lateral elbow and posterolateral forearm.
  tube("radial-nerve", [
    v(axC.x + medial * 0.02, axC.y - 0.05, axC.z - 0.04),
    v(humC.x + medial * 0.03, lerp(axilla, elbow, 0.4).y, humC.z - 0.08),
    v(humC.x + lateral * 0.05, lerp(axilla, elbow, 0.7).y, humC.z - 0.05),
    v(elbow.x + lateral * 0.06, elbow.y + 0.01, elbow.z + 0.01),
    v(radC.x + lateral * 0.03, radC.y + 0.12, radC.z - 0.06),
  ], 0.012);

  // ---- Palmar arterial arches -----------------------------------------------------------------
  // Superficial arch: convex distally, just deep to the palmar aponeurosis (slightly distal + anterior).
  const palmBaseY = metaBox.isEmpty() ? wrist.y - 0.12 : metaBox.min.y + (metaBox.max.y - metaBox.min.y) * 0.35;
  const palmHalf = metaBox.isEmpty() ? 0.14 : (metaBox.max.x - metaBox.min.x) * 0.5;
  const palmZ = metaBox.isEmpty() ? carpC.z + 0.05 : metaBox.getCenter(new Vector3()).z + 0.05;
  tube("superficial-palmar-arch", [
    v(metaC.x + medial * palmHalf, palmBaseY - 0.02, palmZ),
    v(metaC.x, palmBaseY - 0.05, palmZ + 0.01),
    v(metaC.x + lateral * palmHalf, palmBaseY - 0.01, palmZ),
  ], 0.01);
  // Deep arch: across the metacarpal bases, more proximal and deeper (more posterior).
  tube("deep-palmar-arch", [
    v(metaC.x + lateral * palmHalf * 0.9, palmBaseY + 0.03, palmZ - 0.05),
    v(metaC.x, palmBaseY + 0.02, palmZ - 0.06),
    v(metaC.x + medial * palmHalf * 0.9, palmBaseY + 0.03, palmZ - 0.05),
  ], 0.009);

  // ---- Median cubital vein --------------------------------------------------------------------
  // Oblique superficial channel across the cubital fossa, linking cephalic (lateral) and basilic (medial).
  const cephB = boxOf(["cephalic-vein"]);
  const basB = boxOf(["basilic-vein"]);
  const cephElbow = cephB.isEmpty() ? v(elbow.x + lateral * 0.1, elbow.y + 0.03, elbow.z + 0.07) : v(cephB.getCenter(new Vector3()).x, elbow.y + 0.03, cephB.getCenter(new Vector3()).z + 0.05);
  const basElbow = basB.isEmpty() ? v(elbow.x + medial * 0.1, elbow.y + 0.06, elbow.z + 0.07) : v(basB.getCenter(new Vector3()).x, elbow.y + 0.06, basB.getCenter(new Vector3()).z + 0.05);
  tube("median-cubital-vein", [cephElbow, lerp(cephElbow, basElbow, 0.5).add(v(0, 0.01, 0.02)), basElbow], 0.011);

  // Defensive normalization to the contract (~2-unit bbox at origin). The GLB is baked normalized;
  // this stays ~no-op but also folds in the procedural overlays.
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
