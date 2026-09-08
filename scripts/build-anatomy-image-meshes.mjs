// Asset generation only; normal app builds use the checked-in GLBs and manifest data.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const root = path.resolve(import.meta.dirname, "..");
const staging = process.argv[2];
if (!staging) throw new Error("Supply the inspected source-asset staging directory");
const catalogPath = path.join(root, "data/term2/anatomy-visual-images.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const configs = {};
const read = (relative) => JSON.parse(fs.readFileSync(path.join(staging, relative), "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sourceLicense = { title: "BodyParts3D 4.3", author: "Database Center for Life Science (DBCLS)", license: "CC-BY-SA 2.1 Japan", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.1/jp/", repository: "https://github.com/olivercase/body_parts_3d_api", revision: "4fd65571dd078ddcb2ceba9f9e3b02cffcb5774b", changes: "Selected original mesh components, axis permutation (X,Z,-Y), uniform scaling and translation into the existing atlas; no invented surface geometry." };

// Always rebuild pair metadata from the inspected baseline, not from a previous generated pass.
for (const lane of ["cvs", "respiratory", "limbs"]) {
  const source = read(`${lane}/catalog.json`);
  for (const original of Array.isArray(source) ? source : source.images) {
    const image = catalog.images.find((image) => image.id === original.id);
    if (!image) continue;
    for (const region of image.regions) {
      const baseline = original.regions.find((item) => item.id === region.id);
      if (!baseline) continue;
      delete region.structureId; delete region.modelKey; delete region.contextStructureIds;
      if (baseline.structureId) region.structureId = baseline.structureId;
      if (baseline.modelKey) region.modelKey = baseline.modelKey;
    }
  }
}

function add({ id, modelKey, label, tissue, description, files, transform, references = [], quizable = true }) {
  if (!configs[modelKey]) configs[modelKey] = { asset: `/anatomy3d/image-detail/${modelKey}.glb`, structures: [], source: sourceLicense, meshes: [] };
  if (configs[modelKey].structures.some((s) => s.id === id)) return;
  const matches = catalog.images.flatMap((image) => image.regions.filter((region) => references.some((ref) => ref.imageId === image.id && ref.regionId === region.id)).map((region) => ({ image, region })));
  const actualLabel = /cvs-(right|left)-ventricular-(anterior|posterior)-papillary-muscle/.test(id)
    ? id.replace(/^cvs-/, "").replaceAll("-", " ").replace(/^./, (s) => s.toUpperCase())
    : label ?? matches[0]?.region.label;
  const actualDescription = description ?? matches[0]?.region.description;
  if (!actualLabel || !actualDescription) throw new Error(`Missing source description ${id}`);
  configs[modelKey].structures.push({ id, label: actualLabel, tissue, description: actualDescription, keyPoints: [actualDescription], difficulty: 2, quizable });
  configs[modelKey].meshes.push({ id, files, transform });
  for (const { region } of matches) {
    if (quizable) { region.structureId = id; region.modelKey = modelKey; }
    else {
      // A downstream bronchial tree is useful context, not the labeled proximal bronchus.
      if (region.structureId === id) delete region.structureId;
      region.contextStructureIds = [...new Set([...(region.contextStructureIds ?? []), id])];
    }
  }
}

const cvs = read("cvs/missing-source-meshes.json");
const calibrations = Object.fromEntries(["heart", "mediastinum"].map((modelKey) => {
  const referenceId = modelKey === "heart" ? "papillary-muscles" : "ascending-aorta";
  const fit = cvs.calibrationPairs.find((pair) => pair.structureId === referenceId).boundsFitDiagnostic;
  if (fit.maxBoundsResidual > 0.00001) throw new Error(`Unreliable calibration ${modelKey}`);
  return [modelKey, { scale: fit.medianScale, translate: fit.translation }];
}));
for (const entry of cvs.meshDescriptors.filter((entry) => entry.mappingStatus.startsWith("exact"))) {
  add({ id: entry.structureId, modelKey: entry.modelKey, tissue: /vein/.test(entry.structureId) ? "vein" : /artery/.test(entry.structureId) ? "artery" : /cusp/.test(entry.structureId) ? "membrane" : "muscle", references: entry.targetReferences, files: entry.components, transform: calibrations[entry.modelKey] });
}

// The limb lane supplies a laterality-checked allowlist; rejected/partial candidates never enter.
const limbPath = path.join(staging, "limbs/vetted-mesh-sources.json");
if (fs.existsSync(limbPath)) {
  const vetted = JSON.parse(fs.readFileSync(limbPath, "utf8"));
  for (const entry of vetted.included ?? vetted) {
    const references = catalog.images.filter((image) => image.moduleKey === entry.modelKey).flatMap((image) => image.regions.filter((region) => norm(region.label) === norm(entry.label)).map((region) => ({ imageId: image.id, regionId: region.id })));
    add({ id: `visual-${entry.suggestedStructureId}`, modelKey: entry.modelKey, label: entry.label, description: entry.anatomicalPlacement, tissue: entry.tissue, references, files: entry.files, transform: entry.transform });
  }
}

// Respiratory exact surface targets and explicitly described contextual segment/tree anatomy.
const respiratoryPath = path.join(staging, "respiratory/bodyparts3d/integration-descriptors.json");
if (fs.existsSync(respiratoryPath)) {
  const respiratory = JSON.parse(fs.readFileSync(respiratoryPath, "utf8"));
  for (const entry of respiratory.groups) add(entry);
}

function writeGlb(config, destination) {
  const binary = [], accessors = [], bufferViews = [], meshes = [], nodes = [];
  let bytes = 0;
  const accessor = (values, type, componentType, bounds) => {
    const buffer = Buffer.from(values.buffer, values.byteOffset, values.byteLength);
    const view = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: bytes, byteLength: buffer.length });
    binary.push(buffer); bytes += buffer.length;
    if (bytes % 4) { const padding = Buffer.alloc(4 - bytes % 4); binary.push(padding); bytes += padding.length; }
    accessors.push({ bufferView: view, componentType, count: values.length / (type === "VEC3" ? 3 : 1), type, ...bounds });
    return accessors.length - 1;
  };
  const provenance = [];
  for (const entry of config.meshes) for (const file of entry.files) {
    const raw = fs.readFileSync(file.localPath);
    const sha256 = createHash("sha256").update(raw).digest("hex");
    if (file.sha256 && sha256 !== file.sha256) throw new Error(`Source changed: ${file.localPath}`);
    provenance.push({ structureId: entry.id, sourceUrl: file.sourceUrl, sourcePath: file.sourcePath, sha256, transform: entry.transform });
    const scene = new OBJLoader().parse(raw.toString("utf8"));
    scene.traverse((object) => {
      if (!object.isMesh) return;
      const geometry = mergeVertices(object.geometry, 1e-8);
      const positions = geometry.getAttribute("position"), normals = geometry.getAttribute("normal");
      const { scale, translate: [tx, ty, tz] } = entry.transform;
      for (let i = 0; i < positions.count; i++) {
        const [x, y, z] = [positions.getX(i), positions.getY(i), positions.getZ(i)];
        positions.setXYZ(i, x * scale + tx, z * scale + ty, -y * scale + tz);
        if (normals) { const [nx, ny, nz] = [normals.getX(i), normals.getY(i), normals.getZ(i)]; normals.setXYZ(i, nx, nz, -ny); }
      }
      if (!normals) geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      const attributes = {
        POSITION: accessor(positions.array, "VEC3", 5126, { min: geometry.boundingBox.min.toArray(), max: geometry.boundingBox.max.toArray() }),
        NORMAL: accessor(geometry.getAttribute("normal").array, "VEC3", 5126),
      };
      const indices = geometry.index;
      const primitive = { attributes, ...(indices ? { indices: accessor(indices.array, "SCALAR", indices.array instanceof Uint16Array ? 5123 : 5125) } : {}) };
      const meshIndex = meshes.length;
      meshes.push({ name: entry.id, primitives: [primitive] });
      nodes.push({ name: entry.id, mesh: meshIndex, extras: { structureId: entry.id, sourceFidelity: "source-derived" } });
    });
  }
  const json = { asset: { version: "2.0", generator: "MED25 source-preserving anatomy mesh packer", copyright: `${sourceLicense.author}; ${sourceLicense.license}` }, scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, accessors, bufferViews, buffers: [{ byteLength: bytes }] };
  let jsonBuffer = Buffer.from(JSON.stringify(json));
  if (jsonBuffer.length % 4) jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(4 - jsonBuffer.length % 4, 32)]);
  const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + jsonBuffer.length + bytes, 8); header.writeUInt32LE(jsonBuffer.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bytes); binHeader.writeUInt32LE(0x004e4942, 4);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.concat([header, jsonBuffer, binHeader, ...binary]));
  return provenance;
}

const provenance = {};
for (const [modelKey, config] of Object.entries(configs)) {
  provenance[modelKey] = writeGlb(config, path.join(root, "public", config.asset));
  delete config.meshes;
}
fs.writeFileSync(path.join(root, "src/lib/anatomy3d/manifests/image-mesh-structures.mjs"), `// Generated by scripts/build-anatomy-image-meshes.mjs from reviewed source descriptors.\nexport const imageMeshModules = ${JSON.stringify(configs, null, 2)};\nexport const imageMeshStructures = (modelKey) => imageMeshModules[modelKey]?.structures ?? [];\n`);
fs.writeFileSync(path.join(root, "public/anatomy3d/image-detail/source-attribution.json"), JSON.stringify({ source: sourceLicense, modules: provenance }, null, 2) + "\n");
for (const image of catalog.images) {
  image.anatomy3d = {
    ...image.anatomy3d, modelKey: image.moduleKey,
    structureIds: [...new Set(image.regions.filter((region) => (region.modelKey ?? image.moduleKey) === image.moduleKey).flatMap((region) => region.structureId ? [region.structureId] : []))],
    missingRegionIds: image.regions.filter((region) => !region.structureId).map((region) => region.id),
  };
}
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(`Packed ${Object.values(configs).reduce((n, config) => n + config.structures.length, 0)} additional anatomical structures across ${Object.keys(configs).length} models.`);
