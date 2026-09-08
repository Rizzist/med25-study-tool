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
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { lowerLimbManifest } from "../../manifests/lower-limb/lower-limb-real.manifest.mjs";

// Where the GLB is served from (same-origin, no cross-origin network).
const MODEL_URL = "/anatomy3d/lower-limb/lower-limb.glb";
const DETAIL_MODEL_URL = "/anatomy3d/lower-limb/lower-limb-detail.obj";
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

  const [gltf, detailModel] = await Promise.all([
    loader.loadAsync(MODEL_URL),
    new OBJLoader().loadAsync(DETAIL_MODEL_URL),
  ]);
  dracoLoader.dispose();
  await attachImageMeshSupplement(gltf.scene, "lower-limb");

  detailModel.name = "lower-limb-detail";
  gltf.scene.add(detailModel);

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
    mesh.userData.sourceFidelity = "scan-derived";
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

  // ---- Atlas-derived landmarks ---------------------------------------------------------------
  // All procedural anatomy is driven by the loaded BodyParts3D bounds. This is deliberately more
  // verbose than a set of baked coordinates: it prevents a supplement re-export, decimation pass,
  // or different limb scale from detaching nerves and ligaments from the real skeleton.
  const boxOf = (ids: string[]): Box3 => {
    const box = new Box3();
    for (const id of ids) for (const object of structures.get(id) ?? []) box.expandByObject(object);
    return box;
  };
  const center = (box: Box3) => box.getCenter(new Vector3());
  const size = (box: Box3) => box.getSize(new Vector3());
  const alongY = (box: Box3, fraction: number) => box.min.y + size(box).y * fraction;
  const alongZ = (box: Box3, fraction: number) => box.min.z + size(box).z * fraction;

  const hipBox = boxOf(["hip-bone"]);
  const femurBox = boxOf(["femur"]);
  const tibiaBox = boxOf(["tibia"]);
  const fibulaBox = boxOf(["fibula"]);
  const tarsalBox = boxOf(["tarsal-bones"]);
  const metatarsalBox = boxOf(["metatarsal-bones"]);
  const toeBox = boxOf(["toe-phalanges"]);
  const femoralVesselBox = boxOf(["femoral-artery", "femoral-vein"]);
  const poplitealVesselBox = boxOf(["popliteal-artery", "popliteal-vein"]);
  const posteriorTibialBox = boxOf(["posterior-tibial-artery"]);

  const hipC = center(hipBox);
  const femurC = center(femurBox);
  const tibiaC = center(tibiaBox);
  const fibulaC = center(fibulaBox);
  const tarsalC = center(tarsalBox);
  const metatarsalC = center(metatarsalBox);
  const medial = -1; // left lower limb: −X points toward the median plane
  const lateral = 1;
  const hipJoint = v(femurC.x + medial * size(femurBox).x * 0.18, femurBox.max.y - 0.035, femurC.z + 0.01);
  const knee = v(
    (femurC.x + tibiaC.x) / 2,
    (femurBox.min.y + tibiaBox.max.y) / 2,
    (femurC.z + tibiaC.z) / 2,
  );
  const ankle = v(
    (tibiaC.x + tarsalC.x) / 2,
    (tibiaBox.min.y + tarsalBox.max.y) / 2,
    (tibiaC.z + tarsalC.z) / 2,
  );
  const posteriorThighZ = Math.min(femurBox.min.z, poplitealVesselBox.min.z) - 0.014;
  const posteriorLegZ = Math.min(tibiaBox.min.z, posteriorTibialBox.min.z) - 0.012;
  const anteriorThighZ = femurBox.max.z + 0.025;
  const anteriorLegZ = tibiaBox.max.z + 0.022;
  const medialAnkleX = Math.min(tibiaBox.min.x, tarsalBox.min.x) - 0.008;
  const lateralAnkleX = Math.max(fibulaBox.max.x, tarsalBox.max.x) + 0.006;
  const heelZ = tarsalBox.min.z + size(tarsalBox).z * 0.18;
  const midfootZ = metatarsalBox.min.z + size(metatarsalBox).z * 0.42;
  const forefootZ = metatarsalBox.min.z + size(metatarsalBox).z * 0.82;
  const toeTipZ = toeBox.max.z - 0.006;
  const dorsalAnkleY = tarsalBox.max.y + 0.008;
  const dorsalForefootY = metatarsalBox.max.y + 0.008;
  const dorsalToeY = toeBox.max.y + 0.006;
  const plantarHindfootY = tarsalBox.min.y - 0.004;
  const plantarForefootY = metatarsalBox.min.y - 0.004;
  const plantarToeY = toeBox.min.y - 0.003;

  // ---- Joint cavities (translucent) -----------------------------------------------------------
  blob("hip-joint", hipJoint, 0.075, 0.07, 0.07);
  blob("knee-joint", knee, 0.075, 0.042, 0.065);
  blob("ankle-joint", ankle, 0.055, 0.035, 0.06);

  // ---- Ligaments and menisci -----------------------------------------------------------------
  const hipAnterior = hipJoint.clone().add(v(0, 0, 0.065));
  tube("iliofemoral-ligament", [hipAnterior, hipAnterior.clone().add(v(lateral * 0.025, -0.045, -0.012)), hipAnterior.clone().add(v(lateral * 0.055, -0.09, -0.025))], 0.011);
  tube("iliofemoral-ligament", [hipAnterior, hipAnterior.clone().add(v(medial * 0.015, -0.045, -0.012)), hipAnterior.clone().add(v(medial * 0.035, -0.09, -0.025))], 0.010);
  tube("anterior-cruciate-ligament", [knee.clone().add(v(medial * 0.012, -0.028, 0.028)), knee.clone(), knee.clone().add(v(lateral * 0.024, 0.035, -0.02))], 0.009);
  tube("posterior-cruciate-ligament", [knee.clone().add(v(lateral * 0.012, -0.028, -0.026)), knee.clone().add(v(0, 0, -0.01)), knee.clone().add(v(medial * 0.024, 0.035, 0.018))], 0.009);
  band("tibial-collateral-ligament", knee.clone().add(v(medial * 0.064, -0.015, 0)), 0.01, 0.115, 0.04);
  tube("fibular-collateral-ligament", [knee.clone().add(v(lateral * 0.055, 0.035, -0.01)), knee.clone().add(v(lateral * 0.066, -0.005, -0.012)), v(fibulaC.x, fibulaBox.max.y - 0.025, fibulaC.z)], 0.008);
  const medialMalleolus = v(medialAnkleX, ankle.y + 0.018, ankle.z);
  for (const target of [
    v(tarsalC.x + medial * 0.025, tarsalC.y, tarsalBox.max.z - 0.03),
    v(tarsalC.x + medial * 0.035, plantarHindfootY + 0.02, tarsalC.z),
    v(tarsalC.x + medial * 0.02, tarsalC.y, heelZ),
  ]) tube("deltoid-ligament", [medialMalleolus, medialMalleolus.clone().lerp(target, 0.55), target], 0.007);
  ring("medial-meniscus", knee.clone().add(v(medial * 0.032, -0.006, 0)), 0.031, 0.009, Math.PI * 1.55, 0.35);
  ring("lateral-meniscus", knee.clone().add(v(lateral * 0.032, -0.006, 0)), 0.029, 0.009, Math.PI * 1.9, -1.9);

  // ---- Lumbosacral plexus and major terminal nerves -----------------------------------------
  const plexusMedialX = hipBox.min.x + size(hipBox).x * 0.26;
  const plexusPosteriorZ = hipBox.min.z - 0.012;
  const plexusExit = v(hipJoint.x, hipJoint.y + 0.035, plexusPosteriorZ);
  for (const offset of [-0.06, 0, 0.06]) {
    tube("lumbosacral-plexus", [
      v(plexusMedialX + offset, hipBox.max.y - 0.02 - Math.abs(offset) * 0.35, hipC.z - 0.015),
      v(plexusMedialX + offset * 0.45, hipJoint.y + 0.1, plexusPosteriorZ + 0.01),
      plexusExit,
    ], 0.009);
  }
  const femoralTop = femoralVesselBox.isEmpty() ? hipJoint : center(femoralVesselBox);
  tube("femoral-nerve", [v(femoralTop.x + lateral * 0.035, hipJoint.y + 0.09, anteriorThighZ), v(femoralTop.x + lateral * 0.04, alongY(femurBox, 0.74), anteriorThighZ), v(femurC.x + lateral * 0.035, alongY(femurBox, 0.42), anteriorThighZ)], 0.010);
  tube("obturator-nerve", [v(hipJoint.x + medial * 0.035, hipJoint.y + 0.075, hipJoint.z), v(femurC.x + medial * 0.075, alongY(femurBox, 0.72), femurC.z), v(femurC.x + medial * 0.08, alongY(femurBox, 0.42), femurC.z - 0.005)], 0.009);
  const sciaticSplit = v(poplitealVesselBox.isEmpty() ? knee.x : center(poplitealVesselBox).x, alongY(femurBox, 0.12), posteriorThighZ);
  tube("sciatic-nerve", [plexusExit.clone().add(v(lateral * 0.015, -0.035, -0.02)), v(femurC.x, alongY(femurBox, 0.72), posteriorThighZ), v(femurC.x, alongY(femurBox, 0.38), posteriorThighZ), sciaticSplit], 0.013);
  const tibialBehindMalleolus = v(medialAnkleX, ankle.y - 0.005, tarsalC.z - 0.025);
  tube("tibial-nerve", [sciaticSplit, v(tibiaC.x, alongY(tibiaBox, 0.76), posteriorLegZ), v(tibiaC.x + medial * 0.02, alongY(tibiaBox, 0.32), posteriorLegZ), tibialBehindMalleolus], 0.010);
  const fibularNeck = v(fibulaC.x + lateral * 0.018, fibulaBox.max.y - size(fibulaBox).y * 0.09, fibulaC.z - 0.005);
  tube("common-fibular-nerve", [sciaticSplit, knee.clone().add(v(lateral * 0.045, 0.015, -0.035)), fibularNeck], 0.010);
  tube("superficial-fibular-nerve", [fibularNeck, v(fibulaC.x + lateral * 0.02, alongY(fibulaBox, 0.66), fibulaC.z + 0.025), v(fibulaC.x + lateral * 0.015, alongY(fibulaBox, 0.26), anteriorLegZ), v(lateralAnkleX - 0.012, dorsalAnkleY, tarsalC.z)], 0.008);
  tube("deep-fibular-nerve", [fibularNeck, v(tibiaC.x + lateral * 0.025, alongY(tibiaBox, 0.76), anteriorLegZ), v(tibiaC.x, alongY(tibiaBox, 0.38), anteriorLegZ), v(tarsalC.x, dorsalAnkleY, tarsalC.z + 0.02)], 0.008);

  // ---- Proximal collateral and cutaneous branches -------------------------------------------
  tube("ilioinguinal-nerve", [v(hipBox.min.x + size(hipBox).x * 0.18, alongY(hipBox, 0.78), hipBox.max.z + 0.012), v(hipJoint.x + medial * 0.045, hipJoint.y + 0.08, hipBox.max.z + 0.035), v(hipJoint.x + medial * 0.04, hipJoint.y + 0.025, hipBox.max.z + 0.055)], 0.005);
  tube("femoral-branch-genitofemoral", [v(femoralTop.x, alongY(hipBox, 0.78), hipBox.max.z + 0.012), v(femoralTop.x, hipJoint.y + 0.08, hipBox.max.z + 0.04), v(femoralTop.x, hipJoint.y + 0.015, hipBox.max.z + 0.06)], 0.0048);
  tube("lateral-femoral-cutaneous-nerve", [v(hipJoint.x, hipJoint.y + 0.14, anteriorThighZ), v(hipJoint.x + lateral * 0.075, hipJoint.y + 0.055, anteriorThighZ + 0.025), v(femurBox.max.x + 0.012, alongY(femurBox, 0.68), anteriorThighZ + 0.035), v(femurBox.max.x + 0.014, alongY(femurBox, 0.38), anteriorThighZ + 0.035)], 0.006);
  for (const xOffset of [lateral * 0.035, medial * 0.035]) tube("anterior-cutaneous-branches-femoral", [v(femoralTop.x + xOffset, alongY(femurBox, 0.74), anteriorThighZ), v(femurC.x + xOffset * 1.3, alongY(femurBox, 0.5), anteriorThighZ + 0.035), v(femurC.x + xOffset * 1.45, alongY(femurBox, 0.24), anteriorThighZ + 0.04)], 0.005);
  const saphenousKnee = knee.clone().add(v(medial * 0.065, 0.055, 0.045));
  tube("saphenous-nerve", [v(femoralTop.x + medial * 0.025, alongY(femurBox, 0.7), anteriorThighZ), v(femurC.x + medial * 0.055, alongY(femurBox, 0.43), anteriorThighZ), saphenousKnee, v(tibiaBox.min.x - 0.012, alongY(tibiaBox, 0.46), anteriorLegZ), medialMalleolus.clone().add(v(0, -0.01, 0.025)), v(tarsalBox.min.x - 0.004, dorsalAnkleY - 0.008, midfootZ)], 0.006);
  tube("infrapatellar-branch-saphenous", [saphenousKnee.clone().add(v(0, 0.045, 0)), knee.clone().add(v(medial * 0.055, 0.01, 0.08)), knee.clone().add(v(lateral * 0.035, 0, 0.09))], 0.0048);
  tube("anterior-division-obturator-nerve", [v(hipJoint.x + medial * 0.04, hipJoint.y + 0.055, hipJoint.z + 0.025), v(femurC.x + medial * 0.07, alongY(femurBox, 0.72), femurC.z + 0.035), v(femurC.x + medial * 0.075, alongY(femurBox, 0.42), femurC.z + 0.035)], 0.006);
  tube("posterior-division-obturator-nerve", [v(hipJoint.x + medial * 0.04, hipJoint.y + 0.055, hipJoint.z - 0.015), v(femurC.x + medial * 0.06, alongY(femurBox, 0.7), posteriorThighZ + 0.025), v(femurC.x + medial * 0.055, alongY(femurBox, 0.38), posteriorThighZ + 0.025)], 0.006);

  // Gluteal branches remain directly against the posterior scan-derived gluteal/pelvic envelope.
  tube("superior-gluteal-nerve", [plexusExit.clone().add(v(0, 0.04, 0)), v(hipJoint.x + lateral * 0.04, hipJoint.y + 0.07, hipBox.min.z - 0.025), v(hipBox.max.x - 0.01, hipJoint.y + 0.04, hipBox.min.z - 0.02)], 0.006);
  tube("inferior-gluteal-nerve", [plexusExit, v(hipJoint.x + lateral * 0.04, hipJoint.y - 0.015, hipBox.min.z - 0.035), v(hipBox.max.x - 0.02, hipJoint.y - 0.08, hipBox.min.z - 0.025)], 0.006);
  tube("posterior-femoral-cutaneous-nerve", [plexusExit.clone().add(v(medial * 0.015, -0.02, -0.01)), v(femurC.x + medial * 0.03, alongY(femurBox, 0.72), posteriorThighZ - 0.015), v(femurC.x + medial * 0.025, alongY(femurBox, 0.42), posteriorThighZ - 0.015), v(femurC.x + medial * 0.02, alongY(femurBox, 0.14), posteriorThighZ - 0.01)], 0.006);
  tube("nerve-to-piriformis", [plexusExit.clone().add(v(medial * 0.02, 0.06, 0.025)), v(hipJoint.x + lateral * 0.02, hipJoint.y + 0.075, hipBox.min.z - 0.02), v(hipJoint.x + lateral * 0.07, hipJoint.y + 0.06, hipBox.min.z - 0.015)], 0.0045);
  tube("nerve-to-obturator-internus", [plexusExit, v(hipJoint.x + medial * 0.045, hipJoint.y - 0.005, hipBox.min.z - 0.035), v(hipJoint.x + medial * 0.075, hipJoint.y - 0.065, hipBox.min.z - 0.02), v(hipJoint.x + medial * 0.055, hipJoint.y - 0.045, hipJoint.z - 0.015)], 0.0048);
  tube("nerve-to-quadratus-femoris", [plexusExit.clone().add(v(lateral * 0.01, -0.02, -0.015)), v(hipJoint.x + lateral * 0.025, hipJoint.y - 0.08, hipBox.min.z - 0.035), v(hipJoint.x + lateral * 0.04, hipJoint.y - 0.15, hipBox.min.z - 0.02)], 0.0048);

  // ---- Cutaneous leg and foot branches -------------------------------------------------------
  const medialSuralEnd = v(tibiaC.x, alongY(tibiaBox, 0.45), posteriorLegZ - 0.02);
  const lateralSuralEnd = v(fibulaC.x + lateral * 0.025, alongY(fibulaBox, 0.56), posteriorLegZ - 0.015);
  tube("medial-sural-cutaneous-nerve", [sciaticSplit.clone().add(v(medial * 0.005, -0.025, 0)), v(tibiaC.x, alongY(tibiaBox, 0.72), posteriorLegZ - 0.018), medialSuralEnd], 0.005);
  tube("lateral-sural-cutaneous-nerve", [fibularNeck.clone().add(v(0, 0.035, -0.015)), v(fibulaC.x + lateral * 0.025, alongY(fibulaBox, 0.75), posteriorLegZ - 0.018), lateralSuralEnd], 0.005);
  tube("sural-nerve", [medialSuralEnd, medialSuralEnd.clone().lerp(lateralSuralEnd, 0.5), v(fibulaC.x + lateral * 0.025, alongY(fibulaBox, 0.25), posteriorLegZ - 0.012), v(lateralAnkleX, ankle.y - 0.006, heelZ), v(tarsalBox.max.x + 0.003, tarsalC.y, midfootZ)], 0.006);
  for (const offset of [-0.018, 0.018]) tube("medial-calcaneal-branches", [tibialBehindMalleolus, v(medialAnkleX - 0.012, tarsalC.y + offset, heelZ), v(tarsalC.x + medial * 0.035, plantarHindfootY, tarsalBox.min.z + 0.015 + offset)], 0.0042);

  const medialPlantarEnd = v(metatarsalBox.min.x + size(metatarsalBox).x * 0.24, plantarForefootY, forefootZ);
  const lateralPlantarEnd = v(metatarsalBox.min.x + size(metatarsalBox).x * 0.76, plantarForefootY, forefootZ);
  tube("medial-plantar-nerve", [tibialBehindMalleolus, v(tarsalC.x + medial * 0.025, plantarHindfootY, alongZ(tarsalBox, 0.55)), v(metatarsalC.x + medial * 0.035, plantarForefootY, midfootZ), medialPlantarEnd], 0.006);
  tube("lateral-plantar-nerve", [tibialBehindMalleolus, v(tarsalC.x + lateral * 0.025, plantarHindfootY, alongZ(tarsalBox, 0.5)), v(metatarsalC.x + lateral * 0.04, plantarForefootY, midfootZ), lateralPlantarEnd], 0.006);

  const superficialFibularFoot = v(lateralAnkleX - 0.012, dorsalAnkleY, tarsalC.z);
  tube("medial-dorsal-cutaneous-nerve", [superficialFibularFoot, v(metatarsalC.x + medial * 0.035, dorsalForefootY, midfootZ), v(toeBox.min.x + size(toeBox).x * 0.25, dorsalToeY, toeTipZ - 0.025)], 0.0048);
  tube("intermediate-dorsal-cutaneous-nerve", [superficialFibularFoot, v(metatarsalC.x + lateral * 0.045, dorsalForefootY, midfootZ), v(toeBox.min.x + size(toeBox).x * 0.72, dorsalToeY, toeTipZ - 0.025)], 0.0048);
  tube("recurrent-articular-branch-common-fibular", [fibularNeck, knee.clone().add(v(lateral * 0.065, 0, 0.03)), knee.clone().add(v(lateral * 0.035, 0.045, 0.055))], 0.0043);
  const deepFibularFoot = v(tarsalC.x, dorsalAnkleY, tarsalC.z + 0.02);
  tube("terminal-branches-deep-fibular-nerve", [deepFibularFoot, v(metatarsalC.x + medial * 0.02, dorsalForefootY, midfootZ), v(toeBox.min.x + size(toeBox).x * 0.18, dorsalToeY, toeTipZ - 0.01)], 0.0046);
  tube("terminal-branches-deep-fibular-nerve", [deepFibularFoot, v(metatarsalC.x + lateral * 0.025, dorsalForefootY, midfootZ), v(metatarsalC.x + lateral * 0.04, dorsalForefootY, forefootZ)], 0.0043);

  for (let index = 0; index < 5; index += 1) {
    const toeX = toeBox.min.x + size(toeBox).x * ((index + 0.5) / 5);
    const source = index < 3 ? medialPlantarEnd : lateralPlantarEnd;
    tube("plantar-digital-nerves", [
      source,
      v(toeX, plantarForefootY, forefootZ + (toeTipZ - forefootZ) * 0.46),
      v(toeX, plantarToeY, toeTipZ),
    ], 0.0038);
  }

  // ---- Small vessel --------------------------------------------------------------------------
  // Fibular (peroneal) artery stays between the posterior tibial trunk and fibular shaft.
  const posteriorTibialC = posteriorTibialBox.isEmpty() ? tibiaC : center(posteriorTibialBox);
  tube("fibular-artery", [
    v(posteriorTibialC.x, alongY(tibiaBox, 0.74), posteriorTibialC.z),
    v((posteriorTibialC.x + fibulaC.x) / 2, alongY(fibulaBox, 0.62), fibulaC.z),
    v(fibulaC.x, alongY(fibulaBox, 0.36), fibulaC.z),
    v(fibulaC.x, alongY(fibulaBox, 0.12), fibulaC.z + 0.005),
  ], 0.008);

  // Defensive normalization to the contract: centre at origin and scale to a ~2-unit bbox.
  // (The GLB is baked normalized; this makes the loader idempotent and robust to re-exports.)
  const aliases = reconcileImageMeshGroups(structures, "lower-limb");
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
    aliases,
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
import { reconcileImageMeshGroups } from "../image-mesh-groups.ts";
