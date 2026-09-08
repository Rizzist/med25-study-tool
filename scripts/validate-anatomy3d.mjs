// Validates the registered 3D anatomy modules — including the GLB-backed (BodyParts3D) models —
// fully headless in Node, with no browser, no bundler and no `npm install`.
//
// The registered factories build their geometry with three's GLTFLoader + DRACOLoader, loading a
// Draco-compressed `.glb` from a same-origin `/anatomy3d/...` URL. Two things stop that from working
// under bare Node, and this file shims both using ONLY what already ships in the repo:
//
//   1. Fetch of the asset URLs. three's FileLoader calls `fetch(new Request(url))` and reports
//      progress via `ProgressEvent`. We install a `fetch` shim that resolves `/anatomy3d/...` to the
//      bytes on disk under `public/`, and a `ProgressEvent` shim when the runtime lacks one.
//   2. Draco decoding. three's DRACOLoader normally decodes inside a Web Worker built from a
//      `Blob` + `URL.createObjectURL` — neither exists in Node, and `preload()` would throw. Instead
//      of a worker we monkey-patch `DRACOLoader.prototype` to decode on the main thread, driving the
//      exact emscripten decoder that already sits in `public/anatomy3d/draco/` (draco_wasm_wrapper.js
//      + draco_decoder.wasm). The decode helpers below are the DRACOLoader worker body, run inline.
//
// The patch is installed on the shared `DRACOLoader` class before any factory runs, so every
// registered (GLB-backed) model instantiates through this same headless loader path and is really
// coverage-checked — nothing is skipped.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Box3, Vector3 } from "three";

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const DRACO_DIR = path.join(PUBLIC_DIR, "anatomy3d", "draco");

// --- 1. fetch / ProgressEvent / self shims for three's FileLoader --------------------------------

if (typeof globalThis.ProgressEvent === "undefined") {
  globalThis.ProgressEvent = class ProgressEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.lengthComputable = init.lengthComputable ?? false;
      this.loaded = init.loaded ?? 0;
      this.total = init.total ?? 0;
    }
  };
}
// A couple of three code paths probe `self`; make it an alias of the global.
if (typeof globalThis.self === "undefined") globalThis.self = globalThis;

// three's FileLoader does `new Request(url)` with a same-origin RELATIVE url. Node's native
// Request (undici) rejects relative URLs (no document base). Replace it with a permissive holder
// that just carries `.url` through to our fetch shim (matching the realism agent's polyfill).
globalThis.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === "string" ? input : input?.url;
    this.headers = init.headers;
    this.signal = init.signal;
    Object.assign(this, init);
  }
};

const realFetch = globalThis.fetch?.bind(globalThis);
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input?.url;
  if (typeof url === "string" && url.startsWith("/anatomy3d/")) {
    const filePath = path.join(PUBLIC_DIR, url.split("?")[0]);
    const bytes = await fs.promises.readFile(filePath);
    return new Response(bytes, {
      status: 200,
      headers: { "Content-Type": "application/octet-stream", "Content-Length": String(bytes.byteLength) },
    });
  }
  if (!realFetch) throw new Error(`No fetch available for ${url}`);
  return realFetch(input, init);
};

// --- 2. Headless Draco decode (main thread) ------------------------------------------------------

// Load the emscripten Draco decoder that ships in public/anatomy3d/draco/, once. We wrap the
// UMD wrapper so it exports through `module.exports`, run it in this realm (so it sees Node's
// WebAssembly / Buffer / require) and hand it the .wasm bytes directly, so it never fetches.
let dracoModulePromise = null;
function loadDracoModule() {
  if (dracoModulePromise) return dracoModulePromise;
  const wrapperSrc = fs.readFileSync(path.join(DRACO_DIR, "draco_wasm_wrapper.js"), "utf8");
  const wasmBuffer = fs.readFileSync(path.join(DRACO_DIR, "draco_decoder.wasm"));
  const wasmBinary = wasmBuffer.buffer.slice(
    wasmBuffer.byteOffset,
    wasmBuffer.byteOffset + wasmBuffer.byteLength,
  );
  const moduleShim = { exports: {} };
  const wrapperPath = path.join(DRACO_DIR, "draco_wasm_wrapper.js");
  const factory = vm.runInThisContext(
    "(function (module, exports, require, __dirname, __filename) {\n" +
      wrapperSrc +
      "\n;return module.exports;\n})",
    { filename: wrapperPath },
  )(moduleShim, moduleShim.exports, require, DRACO_DIR, wrapperPath);

  dracoModulePromise = new Promise((resolve, reject) => {
    try {
      factory({ wasmBinary, onModuleLoaded: (draco) => resolve(draco) });
    } catch (error) {
      reject(error);
    }
  });
  return dracoModulePromise;
}

const TYPED_ARRAYS = {
  Int8Array, Int16Array, Int32Array,
  Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray,
  Float32Array, Float64Array,
};

function getDracoDataType(draco, attributeType) {
  switch (attributeType) {
    case Float32Array: return draco.DT_FLOAT32;
    case Int8Array: return draco.DT_INT8;
    case Int16Array: return draco.DT_INT16;
    case Int32Array: return draco.DT_INT32;
    case Uint8Array: return draco.DT_UINT8;
    case Uint16Array: return draco.DT_UINT16;
    case Uint32Array: return draco.DT_UINT32;
    default: return draco.DT_FLOAT32;
  }
}

function decodeIndex(draco, decoder, dracoGeometry) {
  const numIndices = dracoGeometry.num_faces() * 3;
  const byteLength = numIndices * 4;
  const ptr = draco._malloc(byteLength);
  decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
  const index = new Uint32Array(draco.HEAPF32.buffer, ptr, numIndices).slice();
  draco._free(ptr);
  return { array: index, itemSize: 1 };
}

function decodeAttribute(draco, decoder, dracoGeometry, attributeName, attributeType, attribute) {
  const numComponents = attribute.num_components();
  const numValues = dracoGeometry.num_points() * numComponents;
  const byteLength = numValues * attributeType.BYTES_PER_ELEMENT;
  const dataType = getDracoDataType(draco, attributeType);
  const ptr = draco._malloc(byteLength);
  decoder.GetAttributeDataArrayForAllPoints(dracoGeometry, attribute, dataType, byteLength, ptr);
  const array = new attributeType(draco.HEAPF32.buffer, ptr, numValues).slice();
  draco._free(ptr);
  return { name: attributeName, array, itemSize: numComponents };
}

// Direct port of DRACOLoader's worker `decodeGeometry`, minus the worker plumbing.
function decodeGeometry(draco, decoder, array, taskConfig) {
  const { attributeIDs, attributeTypes } = taskConfig;

  let dracoGeometry;
  let decodingStatus;
  const geometryType = decoder.GetEncodedGeometryType(array);
  if (geometryType === draco.TRIANGULAR_MESH) {
    dracoGeometry = new draco.Mesh();
    decodingStatus = decoder.DecodeArrayToMesh(array, array.byteLength, dracoGeometry);
  } else if (geometryType === draco.POINT_CLOUD) {
    dracoGeometry = new draco.PointCloud();
    decodingStatus = decoder.DecodeArrayToPointCloud(array, array.byteLength, dracoGeometry);
  } else {
    throw new Error("DRACOLoader(headless): unexpected geometry type.");
  }
  if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
    throw new Error("DRACOLoader(headless): decoding failed: " + decodingStatus.error_msg());
  }

  const geometry = { index: null, attributes: [] };
  for (const attributeName in attributeIDs) {
    const attributeType = TYPED_ARRAYS[attributeTypes[attributeName]];
    let attribute;
    if (taskConfig.useUniqueIDs) {
      attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeIDs[attributeName]);
    } else {
      const attributeID = decoder.GetAttributeId(dracoGeometry, draco[attributeIDs[attributeName]]);
      if (attributeID === -1) continue;
      attribute = decoder.GetAttribute(dracoGeometry, attributeID);
    }
    const attributeResult = decodeAttribute(draco, decoder, dracoGeometry, attributeName, attributeType, attribute);
    if (attributeName === "color") attributeResult.vertexColorSpace = taskConfig.vertexColorSpace;
    geometry.attributes.push(attributeResult);
  }
  if (geometryType === draco.TRIANGULAR_MESH) geometry.index = decodeIndex(draco, decoder, dracoGeometry);

  draco.destroy(dracoGeometry);
  return geometry;
}

// Patch the shared DRACOLoader class so every instance the factories create decodes headlessly.
// We keep the loader's own `_createGeometry` (it builds the three BufferGeometry from the decoded
// arrays) and only replace the worker-bound decode step.
DRACOLoader.prototype.preload = function preload() {
  return this;
};
DRACOLoader.prototype._initDecoder = function _initDecoder() {
  this.decoderPending = Promise.resolve();
  return this.decoderPending;
};
DRACOLoader.prototype.decodeGeometry = function decodeGeometryHeadless(buffer, taskConfig) {
  return loadDracoModule().then((draco) => {
    const decoder = new draco.Decoder();
    try {
      const geometryData = decodeGeometry(draco, decoder, new Int8Array(buffer), taskConfig);
      return this._createGeometry(geometryData);
    } finally {
      draco.destroy(decoder);
    }
  });
};

// --- 3. Validation (registry + per-model mesh coverage) ------------------------------------------

const { listAnatomyModules, getAnatomyModule } = await import(
  pathToFileURL(path.join(REPO_ROOT, "src/lib/anatomy3d/registry.ts")).href
);
const { validateManifest } = await import(
  pathToFileURL(path.join(REPO_ROOT, "src/lib/anatomy3d/validate.mjs")).href
);

function requestedModel(argv) {
  const index = argv.indexOf("--model");
  if (index === -1) return null;
  const modelKey = argv[index + 1];
  if (!modelKey || modelKey.startsWith("--")) throw new Error("--model requires a registry model key");
  return modelKey;
}

function requestedStructureBounds(argv) {
  const index = argv.indexOf("--bounds");
  if (index === -1) return null;
  const structureId = argv[index + 1];
  if (!structureId || structureId.startsWith("--")) throw new Error("--bounds requires a structure id");
  return structureId;
}

const modelKey = requestedModel(process.argv.slice(2));
const boundsStructureId = requestedStructureBounds(process.argv.slice(2));
const registrations = listAnatomyModules().filter((registration) => (
  modelKey === null || registration.manifest.modelKey === modelKey || registration.manifest.id === modelKey
));
if (modelKey && registrations.length === 0 && getAnatomyModule(modelKey)) registrations.push(getAnatomyModule(modelKey));

if (modelKey !== null && registrations.length === 0) {
  throw new Error(`Unknown anatomy model: ${modelKey}`);
}

const failures = [];
for (const registration of registrations) {
  const { manifest } = registration;
  const manifestErrors = validateManifest(manifest);
  for (const error of manifestErrors) failures.push(`${manifest.modelKey}: ${error}`);

  const labelKeys = manifest.structures.map((structure) => structure.label.trim().toLocaleLowerCase());
  if (new Set(labelKeys).size !== labelKeys.length) failures.push(`${manifest.modelKey}: duplicate labels`);
  const manifestIds = new Set(manifest.structures.map((structure) => structure.id));
  const handle = await registration.createModel();
  let meshCount = 0;

  try {
    if (boundsStructureId) {
      const objects = handle.structures.get(boundsStructureId) ?? [];
      const bounds = new Box3();
      for (const object of objects) bounds.expandByObject(object, true);
      if (!bounds.isEmpty()) {
        console.log(`${manifest.modelKey}/${boundsStructureId} bounds`, {
          min: bounds.min.toArray(),
          max: bounds.max.toArray(),
          center: bounds.getCenter(new Vector3()).toArray(),
        });
      }
    }
    for (const structure of manifest.structures.filter((candidate) => candidate.quizable !== false)) {
      const objects = handle.structures.get(structure.id) ?? [];
      if (objects.length === 0) failures.push(`${manifest.modelKey}: ${structure.id} has no model objects`);
      for (const object of objects) {
        if (object.userData.structureId !== structure.id && !handle.aliases?.get(structure.id)?.includes(object.userData.structureId)) {
          failures.push(`${manifest.modelKey}: structure map mismatch for ${structure.id}`);
        }
      }
    }

    handle.root.traverse((object) => {
      if (!("isMesh" in object) || object.isMesh !== true) return;
      meshCount += 1;
      const structureId = object.userData.structureId;
      if (typeof structureId !== "string" || !manifestIds.has(structureId)) {
        failures.push(`${manifest.modelKey}: mesh ${object.name || "<unnamed>"} has an unknown structureId`);
      }
      if (typeof structureId === "string" && !(handle.structures.get(structureId) ?? []).includes(object)) {
        failures.push(`${manifest.modelKey}: mesh ${object.name || "<unnamed>"} is missing from the structures map`);
      }
    });

    console.log(`✓ ${manifest.modelKey}: ${manifest.structures.length} structures, ${meshCount} meshes`);
  } finally {
    handle.dispose();
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${registrations.length} anatomy model${registrations.length === 1 ? "" : "s"}.`);
}
