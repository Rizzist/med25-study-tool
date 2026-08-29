import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { tracheaLungManifest } from "../../manifests/respiratory/trachea-lung.manifest.mjs";

function structureTissue(id: string): Tissue {
  const structure = tracheaLungManifest.structures.find((candidate) => candidate.id === id);
  if (!structure) throw new Error(`Unknown trachea-lung structure: ${id}`);
  return structure.tissue;
}

export function createTracheaLungModel(): AnatomyModelHandle {
  const root = new Group();
  root.name = "respiratory-trachea-lung";
  // Slight three-quarter default so the right (subject's) lung and the airway both read.
  root.rotation.y = -0.06;
  const structures = new Map<string, Object3D[]>();

  function add(id: string, mesh: Mesh) {
    mesh.name = id;
    mesh.userData.structureId = id;
    root.add(mesh);
    structures.set(id, [...(structures.get(id) ?? []), mesh]);
  }

  // Ellipsoid lobe/blob from a unit sphere scaled to (sx, sy, sz).
  function blob(
    id: string,
    cx: number, cy: number, cz: number,
    sx: number, sy: number, sz: number,
  ) {
    const mesh = new Mesh(new SphereGeometry(1, 24, 16), tissueMaterial(structureTissue(id)));
    mesh.position.set(cx, cy, cz);
    mesh.scale.set(sx, sy, sz);
    add(id, mesh);
    return mesh;
  }

  // Tapered cylinder oriented from bottom point b -> top point a (used for the bronchi).
  function tube(
    id: string,
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    rTop: number, rBot: number,
  ) {
    const dir = new Vector3(ax - bx, ay - by, az - bz);
    const len = dir.length();
    const mesh = new Mesh(
      new CylinderGeometry(rTop, rBot, len, 22, 1, false),
      tissueMaterial(structureTissue(id)),
    );
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    mesh.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    add(id, mesh);
    return mesh;
  }

  // Thin planar slab (fissure / notch-marker), tilted about X.
  function slab(
    id: string,
    w: number, h: number, d: number,
    px: number, py: number, pz: number,
    rx: number,
  ) {
    const mesh = new Mesh(new BoxGeometry(w, h, d), tissueMaterial(structureTissue(id)));
    mesh.position.set(px, py, pz);
    mesh.rotation.x = rx;
    add(id, mesh);
    return mesh;
  }

  // ---- Airway column ---------------------------------------------------------
  // Trachea: vertical tube from cricoid (~+0.88) down to the carina (~+0.22).
  const trachea = new Mesh(
    new CylinderGeometry(0.085, 0.092, 0.66, 24, 1, false),
    tissueMaterial(structureTissue("trachea")),
  );
  trachea.position.set(0, 0.55, 0);
  add("trachea", trachea);

  // Tracheal C-rings: stacked partial tori, gap opening posteriorly (toward -Z).
  const ringCount = 10;
  const ringTop = 0.80;
  const ringBottom = 0.28;
  for (let i = 0; i < ringCount; i++) {
    const t = i / (ringCount - 1);
    const y = ringTop - t * (ringTop - ringBottom);
    const major = 0.093 + t * 0.006; // faint downward flare toward the carina
    const geometry = new TorusGeometry(major, 0.015, 6, 30, Math.PI * 1.5);
    geometry.rotateX(Math.PI / 2); // lay the ring flat in the horizontal plane
    geometry.rotateY(Math.PI / 4); // rotate its 90-degree gap to face posteriorly (-Z)
    const ring = new Mesh(geometry, tissueMaterial(structureTissue("tracheal-rings")));
    ring.position.set(0, y, 0);
    add("tracheal-rings", ring);
  }

  // Trachealis: smooth-muscle strip closing the posterior gap of the rings.
  const trachealis = new Mesh(
    new CylinderGeometry(0.094, 0.098, 0.56, 14, 1, true, (Math.PI * 3) / 4, Math.PI / 2),
    tissueMaterial(structureTissue("trachealis-muscle")),
  );
  trachealis.position.set(0, 0.54, 0);
  add("trachealis-muscle", trachealis);

  // Carina: keel-like ridge at the bifurcation, pointing up between the bronchi.
  const carina = new Mesh(
    new ConeGeometry(0.055, 0.11, 4, 1),
    tissueMaterial(structureTissue("carina")),
  );
  carina.position.set(0, 0.19, 0);
  carina.scale.set(0.5, 1, 1.55); // thin side-to-side, elongated front-to-back (a keel)
  add("carina", carina);

  // Main bronchi: right shorter/wider/more vertical; left longer/narrower/more horizontal.
  tube("right-main-bronchus", -0.02, 0.19, 0.0, -0.24, -0.06, 0.0, 0.072, 0.062);
  tube("left-main-bronchus", 0.02, 0.19, 0.0, 0.34, 0.02, 0.0, 0.056, 0.05);

  // ---- Right lung (subject's right, -X): three lobes ------------------------
  blob("right-upper-lobe", -0.44, 0.36, 0.04, 0.26, 0.30, 0.26);
  blob("right-middle-lobe", -0.40, -0.06, 0.18, 0.20, 0.16, 0.18);
  blob("right-lower-lobe", -0.47, -0.34, -0.06, 0.29, 0.40, 0.29);

  // ---- Left lung (subject's left, +X): two lobes ----------------------------
  blob("left-upper-lobe", 0.45, 0.30, 0.06, 0.26, 0.34, 0.26);
  blob("left-lower-lobe", 0.47, -0.34, -0.06, 0.28, 0.40, 0.29);

  // Cardiac notch: concave scoop on the anteroinferior margin of the left upper lobe.
  const notch = new Mesh(
    new CylinderGeometry(0.14, 0.14, 0.22, 16, 1, true, -Math.PI / 4, Math.PI / 2),
    tissueMaterial(structureTissue("cardiac-notch")),
  );
  notch.position.set(0.30, -0.02, 0.12); // axis inside the lobe so the concave face opens anteriorly
  add("cardiac-notch", notch);

  // Lingula: tongue-like projection of the left upper lobe below the cardiac notch.
  blob("lingula", 0.40, -0.16, 0.16, 0.15, 0.11, 0.20);

  // ---- Fissures (thin highlightable slabs) ----------------------------------
  // Horizontal fissure: right lung only, between upper and middle lobes (anterior).
  slab("horizontal-fissure", 0.30, 0.014, 0.28, -0.40, 0.12, 0.12, 0.0);
  // Oblique fissure: present in BOTH lungs; tilted plane, lower-anterior / higher-posterior.
  slab("oblique-fissure", 0.30, 0.014, 0.44, -0.45, 0.02, 0.0, -0.9);
  slab("oblique-fissure", 0.30, 0.014, 0.44, 0.46, 0.02, 0.0, -0.9);

  // ---- Hilum / root of each lung (medial surface) ---------------------------
  blob("hilum-root", -0.24, 0.0, -0.02, 0.10, 0.14, 0.09);
  blob("hilum-root", 0.26, 0.02, -0.02, 0.10, 0.14, 0.09);

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
