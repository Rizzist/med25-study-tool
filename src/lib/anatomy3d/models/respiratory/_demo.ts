import {
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  Object3D,
  SphereGeometry,
} from "three";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { demoManifest } from "../../manifests/respiratory/_demo.manifest.mjs";

function structureTissue(id: string): Tissue {
  const structure = demoManifest.structures.find((candidate) => candidate.id === id);
  if (!structure) throw new Error(`Unknown demo structure: ${id}`);
  return structure.tissue;
}

export function createDemoModel(): AnatomyModelHandle {
  const root = new Group();
  root.name = "respiratory-demo";
  root.rotation.y = -0.08;
  const structures = new Map<string, Object3D[]>();

  function add(id: string, mesh: Mesh) {
    mesh.name = id;
    mesh.userData.structureId = id;
    root.add(mesh);
    structures.set(id, [...(structures.get(id) ?? []), mesh]);
  }

  const larynx = new Mesh(
    new SphereGeometry(0.2, 28, 18),
    tissueMaterial(structureTissue("demo-larynx")),
  );
  larynx.position.set(0, 0.77, 0.02);
  larynx.scale.set(1.1, 0.78, 0.84);
  add("demo-larynx", larynx);

  const trachea = new Mesh(
    new CylinderGeometry(0.105, 0.12, 0.68, 24, 4, true),
    tissueMaterial(structureTissue("demo-trachea")),
  );
  trachea.position.set(0, 0.35, 0);
  add("demo-trachea", trachea);

  const rightLung = new Mesh(
    new CapsuleGeometry(0.25, 0.54, 8, 20),
    tissueMaterial(structureTissue("demo-right-lung")),
  );
  rightLung.position.set(-0.39, -0.27, 0);
  rightLung.rotation.z = -0.1;
  rightLung.scale.set(0.82, 1.05, 0.62);
  add("demo-right-lung", rightLung);

  const leftLung = new Mesh(
    new CapsuleGeometry(0.24, 0.5, 8, 20),
    tissueMaterial(structureTissue("demo-left-lung")),
  );
  leftLung.position.set(0.39, -0.25, 0);
  leftLung.rotation.z = 0.1;
  leftLung.scale.set(0.78, 1, 0.6);
  add("demo-left-lung", leftLung);

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
