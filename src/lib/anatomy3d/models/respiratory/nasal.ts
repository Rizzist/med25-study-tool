import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  Object3D,
  SphereGeometry,
  TorusGeometry,
} from "three";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { nasalManifest } from "../../manifests/respiratory/nasal.manifest.mjs";

function structureTissue(id: string): Tissue {
  const structure = nasalManifest.structures.find((candidate) => candidate.id === id);
  if (!structure) throw new Error(`Unknown nasal structure: ${id}`);
  return structure.tissue;
}

// A scroll-like concha shelf: a partial, open half-cylinder whose axis runs
// anteroposteriorly (+Z), so a coronal (front) view shows the classic curled
// cross-section. It projects medially from the lateral wall (subject's left, +X).
function concha(id: string, radius: number, lengthZ: number): Mesh {
  const mesh = new Mesh(
    new CylinderGeometry(
      radius,
      radius,
      lengthZ,
      24,
      1,
      true,
      Math.PI * 0.18,
      Math.PI * 1.28,
    ),
    tissueMaterial(structureTissue(id)),
  );
  mesh.rotation.x = Math.PI / 2; // lay the axis along Z (anteroposterior)
  mesh.rotation.z = -0.32; // tip the scroll so it curls down and medially
  mesh.scale.set(1, 0.82, 1); // flatten into a shelf
  return mesh;
}

export function createNasalModel(): AnatomyModelHandle {
  const root = new Group();
  root.name = "respiratory-nasal";
  root.rotation.y = -0.05;
  const structures = new Map<string, Object3D[]>();

  function add(id: string, mesh: Mesh) {
    mesh.name = id;
    mesh.userData.structureId = id;
    root.add(mesh);
    structures.set(id, [...(structures.get(id) ?? []), mesh]);
  }

  // --- Midline partition ------------------------------------------------
  // Nasal septum: a thin cartilage/bone plate in the midsagittal plane (X = 0).
  const septum = new Mesh(
    new BoxGeometry(0.045, 1.05, 0.9),
    tissueMaterial(structureTissue("nasal-septum")),
  );
  septum.position.set(0, 0.05, -0.02);
  add("nasal-septum", septum);

  // --- Lateral-wall conchae (stacked superior -> inferior) --------------
  const superiorConcha = concha("superior-concha", 0.09, 0.34);
  superiorConcha.position.set(0.32, 0.33, 0.04);
  add("superior-concha", superiorConcha);

  const middleConcha = concha("middle-concha", 0.125, 0.46);
  middleConcha.position.set(0.31, 0.12, 0.03);
  add("middle-concha", middleConcha);

  const inferiorConcha = concha("inferior-concha", 0.15, 0.52);
  inferiorConcha.position.set(0.3, -0.12, 0.02);
  add("inferior-concha", inferiorConcha);

  // --- Meatuses: thin translucent air slabs just beneath each concha ----
  const superiorMeatus = new Mesh(
    new BoxGeometry(0.11, 0.05, 0.3),
    tissueMaterial(structureTissue("superior-meatus")),
  );
  superiorMeatus.position.set(0.25, 0.2, 0.04);
  add("superior-meatus", superiorMeatus);

  const middleMeatus = new Mesh(
    new BoxGeometry(0.14, 0.055, 0.38),
    tissueMaterial(structureTissue("middle-meatus")),
  );
  middleMeatus.position.set(0.23, -0.02, 0.03);
  add("middle-meatus", middleMeatus);

  const inferiorMeatus = new Mesh(
    new BoxGeometry(0.16, 0.06, 0.42),
    tissueMaterial(structureTissue("inferior-meatus")),
  );
  inferiorMeatus.position.set(0.22, -0.27, 0.02);
  add("inferior-meatus", inferiorMeatus);

  // --- Floor ------------------------------------------------------------
  // Hard palate: horizontal bony plate under the cavity / roof of the mouth.
  const hardPalate = new Mesh(
    new BoxGeometry(1.0, 0.06, 0.7),
    tissueMaterial(structureTissue("hard-palate")),
  );
  hardPalate.position.set(0, -0.52, 0.0);
  add("hard-palate", hardPalate);

  // --- Nasal bones (paired) forming the bridge, superior & anterior -----
  const nasalBoneOffsets = [0.09, -0.09];
  for (const x of nasalBoneOffsets) {
    const bone = new Mesh(
      new BoxGeometry(0.1, 0.2, 0.1),
      tissueMaterial(structureTissue("nasal-bone")),
    );
    bone.position.set(x, 0.6, 0.5);
    bone.rotation.x = 0.35;
    bone.rotation.z = x > 0 ? 0.12 : -0.12;
    add("nasal-bone", bone);
  }

  // --- Paranasal sinuses (translucent air cavities) ---------------------
  // Frontal sinus: broad air cavity in the frontal bone, above the orbits.
  const frontalSinus = new Mesh(
    new SphereGeometry(0.18, 22, 16),
    tissueMaterial(structureTissue("frontal-sinus")),
  );
  frontalSinus.position.set(0, 0.7, 0.3);
  frontalSinus.scale.set(1.5, 0.7, 0.7);
  add("frontal-sinus", frontalSinus);

  // Maxillary sinus (paired): large pyramidal cavity lateral to the cavity.
  const maxillaryOffsets = [0.62, -0.62];
  for (const x of maxillaryOffsets) {
    const sinus = new Mesh(
      new SphereGeometry(0.2, 22, 16),
      tissueMaterial(structureTissue("maxillary-sinus")),
    );
    sinus.position.set(x, -0.2, 0.06);
    sinus.scale.set(1.0, 1.15, 1.1);
    add("maxillary-sinus", sinus);
  }

  // Ethmoidal air cells: cluster of small cells between orbits, medial/upper.
  const ethmoidCells: Array<[number, number, number, number]> = [
    [0.13, 0.42, 0.12, 0.06],
    [0.24, 0.46, 0.1, 0.065],
    [0.33, 0.4, 0.14, 0.055],
    [0.19, 0.33, 0.07, 0.06],
    [0.3, 0.3, 0.1, 0.05],
    [0.21, 0.5, 0.16, 0.05],
    [-0.1, 0.44, 0.11, 0.05],
  ];
  for (const [x, y, z, r] of ethmoidCells) {
    const cell = new Mesh(
      new SphereGeometry(r, 16, 12),
      tissueMaterial(structureTissue("ethmoidal-air-cells")),
    );
    cell.position.set(x, y, z);
    add("ethmoidal-air-cells", cell);
  }

  // Sphenoid sinus: deep, posterior cavity in the sphenoid body.
  const sphenoidSinus = new Mesh(
    new SphereGeometry(0.17, 22, 16),
    tissueMaterial(structureTissue("sphenoid-sinus")),
  );
  sphenoidSinus.position.set(0, 0.18, -0.46);
  sphenoidSinus.scale.set(1.2, 0.9, 0.9);
  add("sphenoid-sinus", sphenoidSinus);

  // Choanae (paired): posterior nasal apertures opening into the nasopharynx.
  const choanaOffsets = [0.17, -0.17];
  for (const x of choanaOffsets) {
    const aperture = new Mesh(
      new TorusGeometry(0.1, 0.03, 14, 28),
      tissueMaterial(structureTissue("choanae")),
    );
    aperture.position.set(x, -0.12, -0.42);
    add("choanae", aperture);
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
          const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of meshMaterials) materials.add(material);
        }
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      root.clear();
      structures.clear();
    },
  };
}
