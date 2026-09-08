import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Raycaster,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { thoracicWallManifest } from "../../manifests/cvs/thoracic-wall-real.manifest.mjs";
import sternocostalAnchors from "./sternocostal-anchors.json" with { type: "json" };

// Same-origin assets — no cross-origin network.
const MODEL_URL = "/anatomy3d/cvs/thoracic-wall.glb";
const DRACO_DECODER_PATH = "/anatomy3d/draco/";
const TARGET_SPAN = 1.9;

const KNOWN_IDS = new Set(thoracicWallManifest.structures.map((s) => s.id));
function structureTissue(id: string): Tissue {
  return (thoracicWallManifest.structures.find((s) => s.id === id)?.tissue ?? "bone") as Tissue;
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

export async function createThoracicWallModel(): Promise<AnatomyModelHandle> {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();
  await attachImageMeshSupplement(gltf.scene, "thoracic-wall");

  const root = new Group();
  root.name = "thoracic-wall-real";
  root.add(gltf.scene);
  const structures = new Map<string, Object3D[]>();
  const pushMesh = (id: string, mesh: Object3D) => structures.set(id, [...(structures.get(id) ?? []), mesh]);

  // --- Real meshes from the GLB (vertebrae, ribs, sternum, wall muscles, diaphragm, ITA) --------
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

  // Original BodyParts3D cartilages 1–10, calibrated as one assembly to this
  // sternum/rib source frame. Never normalize individual cartilage objects.
  const cartilage = await new OBJLoader().loadAsync('/anatomy3d/cvs/costal-cartilages.obj');
  const margin: Object3D[] = [];
  cartilage.traverse(object => {
    if (!(object as Mesh).isMesh) return;
    const mesh = object as Mesh;
    const level = Number(mesh.name.match(/-(\d+)-FJ/)?.[1]);
    const previous = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    previous.forEach(material=>material.dispose());
    mesh.material = tissueMaterial('cartilage');
    mesh.userData.structureId = 'costal-cartilages';
    mesh.userData.sourceCartilageLevel = level;
    mesh.userData.schematic = false;
    pushMesh('costal-cartilages',mesh);
    if (level >= 7 && level <= 10) margin.push(mesh);
  });
  structures.set('costal-margin',margin);
  gltf.scene.add(cartilage);

  // --- Procedural (schematic) layers -----------------------------------------------------------
  // Everything below is placed from the REAL meshes' bounding boxes so the overlays self-align to
  // the scan anatomy regardless of the exact baked coordinates: the costal cartilages/margin, the
  // sternal-angle & jugular notch, the thoracic apertures & membranes, the costovertebral/
  // costotransverse/sternocostal/sternoclavicular joints, discs & radiate ligament, the subcostal &
  // levatores muscles, and the intercostal / internal-thoracic neurovascular vessels.
  gltf.scene.updateMatrixWorld(true);
  const boxOf = (ids: string[]): Box3 => {
    const box = new Box3();
    for (const id of ids) for (const obj of structures.get(id) ?? []) box.expandByObject(obj);
    return box;
  };
  const c = (b: Box3): Vector3 => (b.isEmpty() ? new Vector3() : b.getCenter(new Vector3()));

  const addProcedural = (id: string, mesh: Mesh, translucent = false) => {
    mesh.name = id;
    mesh.userData.structureId = id;
    mesh.userData.schematic = true;
    const mat = tissueMaterial(structureTissue(id));
    if (translucent) {
      mat.transparent = true;
      mat.opacity = 0.22;
      mat.depthWrite = false;
      mat.side = DoubleSide;
    }
    mesh.material = mat;
    gltf.scene.add(mesh);
    pushMesh(id, mesh);
  };
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const lerp = (a: Vector3, b: Vector3, t: number) => a.clone().lerp(b, t);
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
  // Thin oriented slab (a schematic disc / band). `normal` is the through-plane (thin) direction.
  const slab = (id: string, at: Vector3, normal: Vector3, w: number, h: number, t: number) => {
    const m = new Mesh(new BoxGeometry(w, h, t));
    m.position.copy(at);
    m.lookAt(at.clone().add(normal));
    addProcedural(id, m);
  };
  // A ring encircling `at`, its axis aligned to `axis` (an aperture rim).
  const ring = (id: string, at: Vector3, rx: number, ry: number, tubeR: number, axis: Vector3, translucent = false) => {
    const m = new Mesh(new TorusGeometry(1, tubeR, 8, 40));
    m.scale.set(rx, ry, 1);
    m.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), axis.clone().normalize());
    m.position.copy(at);
    addProcedural(id, m, translucent);
  };
  // Translucent dome / shell.
  const shell = (id: string, at: Vector3, rx: number, ry: number, rz: number) => {
    const m = new Mesh(new SphereGeometry(1, 24, 16));
    m.position.copy(at); m.scale.set(rx, ry, rz);
    addProcedural(id, m, true);
  };
  const disc = (id: string, at: Vector3, r: number, thick: number) => {
    const m = new Mesh(new CylinderGeometry(r, r, thick, 20));
    m.position.copy(at);
    addProcedural(id, m);
  };

  // ---- Landmarks from the real skeleton -------------------------------------------------------
  const manuB = boxOf(["manubrium"]);
  const bodyB = boxOf(["sternal-body"]);
  const xiphB = boxOf(["xiphoid-process"]);
  const t1B = boxOf(["first-thoracic-vertebra"]);
  const midVertB = boxOf(["typical-thoracic-vertebra"]);
  const lowVertB = boxOf(["atypical-thoracic-vertebrae"]);
  const cageB = boxOf(["typical-rib", "first-rib", "second-rib", "floating-ribs", "manubrium", "sternal-body", "xiphoid-process", "first-thoracic-vertebra", "typical-thoracic-vertebra", "atypical-thoracic-vertebrae"]);
  const itaB = boxOf(["internal-thoracic-artery"]);

  const manuC = c(manuB), bodyC = c(bodyB), xiphC = c(xiphB);
  const midVertC = c(midVertB), lowVertC = c(lowVertB);
  const halfW = cageB.isEmpty() ? 0.5 : (cageB.max.x - cageB.min.x) / 2;
  const sternX = manuB.isEmpty() ? 0 : (manuB.min.x + manuB.max.x) / 2;
  const sternEdge = bodyB.isEmpty() ? 0.08 : (bodyB.max.x - bodyB.min.x) / 2; // half sternum width
  const anteriorZ = bodyB.isEmpty() ? cageB.max.z : bodyB.max.z; // sternum front
  const postZ = cageB.isEmpty() ? 0 : cageB.min.z;               // vertebral bodies (back)

  // Sternal features follow their LOCAL source surface, not bodyB.max.z. The
  // old common anterior plane left the upper markers floating in front of bone.
  const surfaceRay = new Raycaster();
  const surfaceAt = (x: number, y: number, ids: string[]) => {
    surfaceRay.set(v(x,y,cageB.max.z+1),v(0,0,-1));
    return surfaceRay.intersectObjects(ids.flatMap(id=>structures.get(id)??[]),true)[0]?.point;
  };
  const angleY = manuB.isEmpty() || bodyB.isEmpty() ? bodyC.y : (manuB.min.y + bodyB.max.y) / 2;
  const anglePoints = [-1,-.5,0,.5,1].map(t=>surfaceAt(sternX+t*Math.min(sternEdge*.5,.05),angleY,['manubrium','sternal-body'])).filter((point):point is Vector3=>Boolean(point));
  if (anglePoints.length >= 2) tube('sternal-angle',anglePoints.map(point=>point.clone().add(v(0,0,.001))),.004);
  const notchPoints: Vector3[] = [];
  for (const dx of [-.02,-.01,0,.01,.02]) for (let inset=0;inset<.08;inset+=.0005) {
    const hit=surfaceAt(sternX+dx,manuB.max.y-inset,['manubrium']);
    if (hit) { const anchor=surfaceAt(sternX+dx,hit.y-.003,['manubrium'])??hit; notchPoints.push(anchor.clone().add(v(0,0,.001))); break; }
  }
  if (notchPoints.length >= 2) tube('jugular-notch',notchPoints,.004);

  // ---- Apertures & membranes ------------------------------------------------------------------
  // Superior thoracic aperture (inlet): kidney-shaped rim at the T1 / first-rib / manubrium level,
  // sloping down-and-forward (its axis tilts anterosuperiorly).
  const inletY = t1B.isEmpty() ? cageB.max.y : t1B.max.y - 0.03;
  ring("superior-thoracic-aperture", v(sternX, inletY, (postZ + anteriorZ) / 2 + 0.04), halfW * 0.52, halfW * 0.34, 0.014, v(0, 1, 0.55), true);
  // Inferior thoracic aperture (outlet): larger rim at the T12 / rib-12 / costal-margin / xiphoid
  // level, its posterior margin below the anterior.
  const outletY = lowVertB.isEmpty() ? cageB.min.y + 0.05 : (lowVertB.min.y + xiphB.min.y) / 2;
  ring("inferior-thoracic-aperture", v(sternX, outletY, (postZ + anteriorZ) / 2), halfW * 0.9, halfW * 0.62, 0.016, v(0, 1, -0.5), true);
  // Suprapleural membrane: paired fibrous domes roofing the lung apices over the inlet.
  for (const side of [1, -1]) shell("suprapleural-membrane", v(sternX + side * halfW * 0.32, inletY + 0.02, (postZ + anteriorZ) / 2 + 0.02), 0.14, 0.09, 0.13);
  // Endothoracic fascia: a thin translucent shell lining the inner surface of the cage.
  const cageC = c(cageB);
  const cageHalf = cageB.isEmpty() ? v(0.6, 0.9, 0.4) : cageB.getSize(new Vector3()).multiplyScalar(0.5);
  shell("endothoracic-fascia", cageC, cageHalf.x * 0.82, cageHalf.y * 0.9, cageHalf.z * 0.82);

  // ---- Joints & ligaments ---------------------------------------------------------------------
  // Intervertebral discs: thin discs between the thoracic vertebral bodies (down the posterior midline).
  const discTop = t1B.isEmpty() ? midVertB.max.y : t1B.min.y;
  const discBot = lowVertB.isEmpty() ? cageB.min.y + 0.1 : lowVertB.min.y + 0.05;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const yy = discTop - t * (discTop - discBot);
    disc("intervertebral-disc", v(sternX, yy, postZ + 0.04), 0.045, 0.016);
  }
  // Costovertebral joints (of the head): small blobs where rib heads meet the vertebral bodies.
  for (const side of [1, -1]) for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const yy = (t1B.isEmpty() ? midVertB.max.y : t1B.min.y) - t * ((t1B.isEmpty() ? midVertB.max.y : t1B.min.y) - (lowVertB.isEmpty() ? cageB.min.y + 0.15 : lowVertB.min.y + 0.1));
    blob("costovertebral-joint", v(sternX + side * 0.06, yy, postZ + 0.05), 0.028, 0.028, 0.028);
  }
  // Costotransverse joints: blobs a little more lateral & posterior (tubercle to transverse process).
  for (const side of [1, -1]) for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const yy = (t1B.isEmpty() ? midVertB.max.y : t1B.max.y - 0.05) - t * 0.6 * ((midVertB.isEmpty() ? 0.6 : midVertB.max.y - midVertB.min.y) + 0.2);
    blob("costotransverse-joint", v(sternX + side * 0.14, yy, postZ + 0.02), 0.026, 0.026, 0.026);
  }
  // Surface markers at all fourteen original cartilage 1–7 attachment interfaces.
  for (const anchor of sternocostalAnchors.anchors) blob('sternocostal-joints',v(anchor.point[0],anchor.point[1],anchor.point[2]),.009,.009,.009);
  // Sternoclavicular joints: paired saddle joints at the superolateral manubrium.
  for (const side of [1, -1]) {
    const x = sternX + side * (manuB.max.x - manuB.min.x) * .35;
    for (let inset = .005; inset < .15; inset += .001) {
      const anchor = surfaceAt(x,manuB.max.y-inset,['manubrium']);
      if (anchor) {blob('sternoclavicular-joint',anchor,.015,.015,.015);break;}
    }
  }
  // Radiate ligament of the head of the rib: small fans over the costovertebral joints.
  for (const side of [1, -1]) for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const yy = (t1B.isEmpty() ? midVertB.max.y : t1B.min.y) - t * 0.5 * ((midVertB.isEmpty() ? 0.6 : midVertB.max.y - midVertB.min.y) + 0.2);
    slab("radiate-ligament", v(sternX + side * 0.09, yy, postZ + 0.09), v(side * 0.3, 0, 1), 0.06, 0.05, 0.012);
  }

  // ---- Muscles (schematic): subcostal & levatores costarum ------------------------------------
  // Subcostal muscles: slips in the lower posterior wall, crossing 1-2 spaces (like internal
  // intercostals). Drawn on the deep posterolateral wall.
  for (const side of [1, -1]) for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const yy = midVertC.y - 0.1 - t * 0.35;
    const a = v(sternX + side * 0.10, yy + 0.06, postZ + 0.06);
    const b = v(sternX + side * (halfW * 0.55), yy - 0.06, postZ + 0.02 + halfW * 0.35);
    tube("subcostal-muscles", [a, lerp(a, b, 0.5), b], 0.016);
  }
  // Levatores costarum: small fans from the transverse processes to the rib below.
  for (const side of [1, -1]) for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const yy = (t1B.isEmpty() ? midVertB.max.y : t1B.min.y) - t * ((t1B.isEmpty() ? midVertB.max.y : t1B.min.y) - lowVertC.y);
    const a = v(sternX + side * 0.13, yy + 0.03, postZ + 0.03);
    const b = v(sternX + side * 0.22, yy - 0.06, postZ + 0.08);
    tube("levatores-costarum", [a, b], 0.013);
  }

  // ---- Wall vasculature (schematic) -----------------------------------------------------------
  // Internal thoracic vein: venae comitantes just medial to the real internal thoracic artery.
  const itaC = c(itaB);
  const itaTopY = itaB.isEmpty() ? manuC.y : itaB.max.y;
  const itaBotY = itaB.isEmpty() ? xiphC.y : itaB.min.y;
  const itaZ = itaB.isEmpty() ? anteriorZ - 0.05 : itaC.z;
  for (const side of [1, -1]) {
    tube("internal-thoracic-vein", [
      v(sternX + side * (sternEdge + 0.015), itaTopY, itaZ + 0.01),
      v(sternX + side * (sternEdge + 0.02), (itaTopY + itaBotY) / 2, itaZ),
      v(sternX + side * (sternEdge + 0.015), itaBotY + 0.05, itaZ - 0.01),
    ], 0.009);
    // Musculophrenic artery: terminal ITA branch running down-and-lateral along the costal margin.
    tube("musculophrenic-artery", [
      v(sternX + side * (sternEdge + 0.03), itaBotY + 0.08, itaZ),
      v(sternX + side * (halfW * 0.5), xiphC.y - 0.03, anteriorZ - 0.14),
      v(sternX + side * (halfW * 0.82), (lowVertC.y + xiphC.y) / 2, anteriorZ - 0.28),
    ], 0.010);
    // Superior epigastric artery: the other ITA terminal branch, continuing inferiorly behind the
    // rectus sheath toward the abdominal wall.
    tube("superior-epigastric-artery", [
      v(sternX + side * (sternEdge + 0.02), itaBotY + 0.06, itaZ),
      v(sternX + side * (sternEdge + 0.03), xiphC.y - 0.02, anteriorZ - 0.03),
      v(sternX + side * (sternEdge + 0.04), cageB.min.y + 0.02, anteriorZ - 0.02),
    ], 0.010);
  }
  // Anterior intercostal arteries: paired small vessels running laterally in the upper spaces.
  for (const side of [1, -1]) for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const yy = (bodyB.isEmpty() ? manuC.y : bodyB.max.y) - t * ((bodyB.isEmpty() ? 0.4 : bodyB.max.y - bodyB.min.y) + 0.05);
    const a = v(sternX + side * (sternEdge + 0.01), yy, anteriorZ - 0.03);
    const b = v(sternX + side * (halfW * 0.6), yy - 0.01, anteriorZ - 0.16);
    tube("anterior-intercostal-arteries", [a, lerp(a, b, 0.5).add(v(0, 0.005, 0)), b], 0.007);
  }
  // Posterior intercostal arteries: one per space in the costal groove, running postero-anteriorly.
  for (const side of [1, -1]) for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const yy = (t1B.isEmpty() ? midVertB.max.y : t1B.min.y) - 0.05 - t * ((t1B.isEmpty() ? 0.8 : t1B.min.y - lowVertC.y));
    const a = v(sternX + side * 0.08, yy, postZ + 0.04);
    const b = v(sternX + side * (halfW * 0.7), yy - 0.02, postZ + halfW * 0.55);
    tube("posterior-intercostal-arteries", [a, lerp(a, b, 0.5).add(v(0, -0.005, 0.02)), b], 0.008);
    // Intercostal veins: run just superior to the arteries (the V of VAN, highest in the groove).
    const av = v(sternX + side * 0.08, yy + 0.03, postZ + 0.045);
    const bv = v(sternX + side * (halfW * 0.7), yy + 0.01, postZ + halfW * 0.55);
    tube("intercostal-veins", [av, lerp(av, bv, 0.5).add(v(0, 0.005, 0.02)), bv], 0.008);
  }

  // ---- Thoracic-wall nerves ---------------------------------------------------------------
  // These follow the same rib-cage anchors as the vessels above.  They deliberately end at the
  // chest wall rather than projecting beyond the real ribs (the detached "yellow comb" failure
  // that the former standalone nerve scene produced when independently normalised).
  const nerveTopY = t1B.isEmpty() ? cageB.max.y - 0.18 : t1B.min.y - 0.03;
  const nerveBottomY = lowVertB.isEmpty() ? cageB.min.y + 0.18 : lowVertB.min.y + 0.10;
  const nerveLevels = Array.from({ length: 6 }, (_, index) =>
    nerveTopY - (index / 5) * (nerveTopY - nerveBottomY));
  const rootX = Math.max(0.055, halfW * 0.09);
  const axillaryX = halfW * 0.74;
  const lateralZ = postZ + (anteriorZ - postZ) * 0.55;
  const parasternalX = sternEdge + 0.025;

  for (const side of [1, -1]) for (const yy of nerveLevels) {
    const spinalRoot = v(sternX + side * rootX, yy, postZ + 0.045);
    const lateral = v(sternX + side * axillaryX, yy - 0.025, lateralZ);
    const parasternal = v(sternX + side * parasternalX, yy - 0.045, anteriorZ - 0.035);
    tube("intercostal-nerve", [spinalRoot, v(sternX + side * halfW * 0.38, yy - 0.01, postZ + (anteriorZ - postZ) * 0.28), lateral, parasternal], 0.007);
  }
  // T12 anterior ramus: a paired cord below the lowest rib, kept on the inner abdominal-wall edge.
  for (const side of [1, -1]) {
    tube("subcostal-nerve", [
      v(sternX + side * rootX, nerveBottomY - 0.08, postZ + 0.05),
      v(sternX + side * halfW * 0.42, nerveBottomY - 0.10, postZ + (anteriorZ - postZ) * 0.30),
      v(sternX + side * halfW * 0.72, nerveBottomY - 0.12, lateralZ),
    ], 0.007);
  }
  // Posterior rami turn directly backward from the spinal root to the intrinsic back region.
  for (const side of [1, -1]) for (const yy of [nerveLevels[1], nerveLevels[3]]) {
    tube("posterior-ramus", [
      v(sternX + side * rootX, yy, postZ + 0.04),
      v(sternX + side * rootX * 1.5, yy - 0.01, postZ - 0.035),
      v(sternX + side * rootX * 2.1, yy - 0.02, postZ - 0.07),
    ], 0.006);
  }
  // Collateral branches parallel the parent nerves just inferior to them.
  for (const side of [1, -1]) for (const yy of [nerveLevels[2], nerveLevels[4]]) {
    tube("collateral-branch", [
      v(sternX + side * halfW * 0.34, yy - 0.04, postZ + (anteriorZ - postZ) * 0.27),
      v(sternX + side * axillaryX, yy - 0.065, lateralZ),
      v(sternX + side * halfW * 0.38, yy - 0.08, anteriorZ - 0.10),
    ], 0.0055);
  }
  // Cutaneous branches pierce locally at the mid-axillary and parasternal lines.
  for (const side of [1, -1]) for (const yy of [nerveLevels[1], nerveLevels[3], nerveLevels[5]]) {
    tube("lateral-cutaneous-branch", [
      v(sternX + side * axillaryX, yy - 0.025, lateralZ),
      v(sternX + side * halfW * 0.82, yy - 0.03, lateralZ + 0.045),
      v(sternX + side * halfW * 0.86, yy - 0.055, lateralZ + 0.08),
    ], 0.0055);
    tube("anterior-cutaneous-branch", [
      v(sternX + side * parasternalX, yy - 0.045, anteriorZ - 0.035),
      v(sternX + side * (parasternalX + 0.045), yy - 0.055, anteriorZ + 0.025),
    ], 0.0055);
  }
  // The T2 lateral cutaneous branch crosses only as far as the axillary edge in this thorax model.
  for (const side of [1, -1]) tube("intercostobrachial-nerve", [
    v(sternX + side * axillaryX, nerveLevels[0] - 0.02, lateralZ),
    v(sternX + side * halfW * 0.86, nerveLevels[0] + 0.015, lateralZ + 0.03),
    v(sternX + side * halfW * 0.93, nerveLevels[0] + 0.05, lateralZ + 0.02),
  ], 0.006);
  // Four landmark dermatome arcs hug the anterior thoracic contour rather than floating in front.
  for (const yy of [nerveLevels[0], nerveLevels[2], nerveLevels[3], nerveLevels[5]]) {
    tube("dermatomes", [
      v(sternX - halfW * 0.58, yy, anteriorZ - 0.13),
      v(sternX - halfW * 0.28, yy, anteriorZ - 0.045),
      v(sternX, yy, anteriorZ - 0.018),
      v(sternX + halfW * 0.28, yy, anteriorZ - 0.045),
      v(sternX + halfW * 0.58, yy, anteriorZ - 0.13),
    ], 0.0045);
  }
  // Rami communicantes bridge each spinal nerve root to the paravertebral sympathetic line.
  for (const side of [1, -1]) for (const yy of [nerveLevels[1], nerveLevels[3], nerveLevels[5]]) {
    const spinal = v(sternX + side * rootX, yy, postZ + 0.045);
    const chain = v(sternX + side * rootX * 1.65, yy, postZ + 0.065);
    tube("white-ramus-communicans", [spinal, v((spinal.x + chain.x) / 2, yy - 0.008, postZ + 0.075), chain], 0.0045);
    tube("gray-ramus-communicans", [chain.clone().add(v(0, 0.018, 0)), v((spinal.x + chain.x) / 2, yy + 0.018, postZ + 0.085), spinal.clone().add(v(0, 0.018, 0))], 0.0045);
  }

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
    aliases: new Map([['costal-margin',['costal-cartilages']]]),
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
import { attachImageMeshSupplement } from "../image-mesh-supplement.ts";
