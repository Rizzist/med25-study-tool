import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  ExtrudeGeometry,
  Group,
  Material,
  Mesh,
  Object3D,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { tissueMaterial } from "../../materials.ts";
import type { AnatomyModelHandle, Tissue } from "../../types.ts";
import { larynxManifest } from "../../manifests/respiratory/larynx.manifest.mjs";

function structureTissue(id: string): Tissue {
  const structure = larynxManifest.structures.find((candidate) => candidate.id === id);
  if (!structure) throw new Error(`Unknown larynx structure: ${id}`);
  return structure.tissue;
}

// Build one quadrilateral thyroid lamina in the local XY plane (x = anterior->posterior
// depth, y = vertical), extruded to a thin plate. The anterior edge sits at x = 0 so the
// two mirrored laminae share it as the fused anterior border.
function laminaGeometry(): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(0, 0); // anterior-inferior
  shape.lineTo(0, 0.42); // anterior-superior (below the notch)
  shape.lineTo(0.5, 0.52); // posterior-superior
  shape.lineTo(0.5, 0.14); // posterior-inferior
  shape.lineTo(0, 0); // close
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.translate(0, 0, -0.015); // centre the plate thickness
  return geometry;
}

// Leaf-shaped epiglottis: narrow petiole at the bottom widening to a rounded top,
// broad transversely (x) and thin front-to-back (z).
function epiglottisGeometry(): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.035, 0.05, 0.045, 0.14);
  shape.quadraticCurveTo(0.17, 0.3, 0.12, 0.5);
  shape.quadraticCurveTo(0.0, 0.58, -0.12, 0.5);
  shape.quadraticCurveTo(-0.17, 0.3, -0.045, 0.14);
  shape.quadraticCurveTo(-0.035, 0.05, 0.0, 0.0);
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.translate(0, 0, -0.015);
  return geometry;
}

export function createLarynxModel(): AnatomyModelHandle {
  const root = new Group();
  root.name = "respiratory-larynx";
  const structures = new Map<string, Object3D[]>();

  function add(id: string, mesh: Mesh) {
    mesh.name = id;
    mesh.userData.structureId = id;
    root.add(mesh);
    structures.set(id, [...(structures.get(id) ?? []), mesh]);
  }

  const thyroidBaseY = 0.12; // anterior-inferior corner of the thyroid laminae

  // --- Thyroid cartilage: two quadrilateral laminae meeting anteriorly ---
  const leftLamina = new Mesh(laminaGeometry(), tissueMaterial(structureTissue("thyroid-cartilage")));
  leftLamina.position.set(0, thyroidBaseY, 0.3);
  leftLamina.rotation.y = Math.PI / 4; // splay postero-laterally to the subject's left
  add("thyroid-cartilage", leftLamina);

  const rightLamina = new Mesh(laminaGeometry(), tissueMaterial(structureTissue("thyroid-cartilage")));
  rightLamina.position.set(0, thyroidBaseY, 0.3);
  rightLamina.rotation.y = (3 * Math.PI) / 4; // mirror to the subject's right
  add("thyroid-cartilage", rightLamina);

  // --- Laryngeal prominence: anterior midline ridge with the superior thyroid notch ---
  const prominence = new Mesh(
    new BoxGeometry(0.05, 0.34, 0.06),
    tissueMaterial(structureTissue("laryngeal-prominence")),
  );
  prominence.position.set(0, thyroidBaseY + 0.21, 0.315);
  prominence.rotation.y = Math.PI / 4; // diamond cross-section, keel points forward
  add("laryngeal-prominence", prominence);

  // --- Thyroid horns: paired superior + inferior cornua from the posterior borders ---
  const hornSides = [0.34, -0.34];
  for (const x of hornSides) {
    const superiorHorn = new Mesh(
      new CapsuleGeometry(0.02, 0.14, 6, 12),
      tissueMaterial(structureTissue("thyroid-superior-horn")),
    );
    superiorHorn.position.set(x, 0.72, -0.07);
    superiorHorn.rotation.x = -0.35; // lean the tip slightly posteriorly
    add("thyroid-superior-horn", superiorHorn);

    const inferiorHorn = new Mesh(
      new CapsuleGeometry(0.022, 0.1, 6, 12),
      tissueMaterial(structureTissue("thyroid-inferior-horn")),
    );
    inferiorHorn.position.set(x, 0.17, -0.05);
    inferiorHorn.rotation.x = 0.15;
    add("thyroid-inferior-horn", inferiorHorn);
  }

  // --- Cricoid cartilage: signet-ring (anterior arch + tall posterior lamina) ---
  const cricoidRing = new Mesh(
    new TorusGeometry(0.22, 0.045, 16, 40),
    tissueMaterial(structureTissue("cricoid-cartilage")),
  );
  cricoidRing.position.set(0, -0.02, 0);
  cricoidRing.rotation.x = Math.PI / 2; // lay the ring flat (horizontal)
  add("cricoid-cartilage", cricoidRing);

  const cricoidLamina = new Mesh(
    new BoxGeometry(0.34, 0.28, 0.055),
    tissueMaterial(structureTissue("cricoid-cartilage")),
  );
  cricoidLamina.position.set(0, 0.1, -0.2);
  cricoidLamina.rotation.x = 0.12; // tall signet face leaning slightly back
  add("cricoid-cartilage", cricoidLamina);

  // --- Arytenoid cartilages: paired pyramids on the cricoid lamina, w/ vocal process ---
  const arySides = [0.09, -0.09];
  for (const x of arySides) {
    const arytenoid = new Mesh(
      new ConeGeometry(0.062, 0.14, 4),
      tissueMaterial(structureTissue("arytenoid-cartilage")),
    );
    arytenoid.position.set(x, 0.3, -0.17);
    arytenoid.rotation.y = Math.PI / 4; // square base faces the axes
    add("arytenoid-cartilage", arytenoid);

    const vocalProcess = new Mesh(
      new ConeGeometry(0.02, 0.08, 8),
      tissueMaterial(structureTissue("arytenoid-cartilage")),
    );
    vocalProcess.position.set(x * 0.75, 0.26, -0.11);
    vocalProcess.rotation.x = Math.PI / 2; // spur points anteriorly (+Z)
    add("arytenoid-cartilage", vocalProcess);

    // --- Corniculate cartilages: tiny nodules at the arytenoid apices ---
    const corniculate = new Mesh(
      new SphereGeometry(0.024, 14, 12),
      tissueMaterial(structureTissue("corniculate-cartilage")),
    );
    corniculate.position.set(x, 0.38, -0.17);
    add("corniculate-cartilage", corniculate);

    // --- Cuneiform cartilages: rods in the aryepiglottic folds, anterolateral ---
    const cuneiform = new Mesh(
      new CapsuleGeometry(0.017, 0.07, 5, 10),
      tissueMaterial(structureTissue("cuneiform-cartilage")),
    );
    cuneiform.position.set(x * 1.6, 0.37, -0.09);
    cuneiform.rotation.set(-0.5, 0, x > 0 ? -0.35 : 0.35); // lie along the fold
    add("cuneiform-cartilage", cuneiform);
  }

  // --- Epiglottis: leaf behind the hyoid, stalk attached to the thyroid ---
  const epiglottis = new Mesh(
    epiglottisGeometry(),
    tissueMaterial(structureTissue("epiglottis")),
  );
  epiglottis.position.set(0, 0.3, 0.14);
  epiglottis.rotation.x = -0.25; // tip leans back over the inlet
  add("epiglottis", epiglottis);

  // --- Hyoid bone: U-shaped body + greater horns, with lesser-horn nubs ---
  const hyoidCurve = new CatmullRomCurve3([
    new Vector3(0.32, 0.8, -0.1), // left greater horn tip
    new Vector3(0.14, 0.8, 0.14), // left body-horn junction
    new Vector3(0.0, 0.8, 0.2), // body (anterior midline)
    new Vector3(-0.14, 0.8, 0.14), // right body-horn junction
    new Vector3(-0.32, 0.8, -0.1), // right greater horn tip
  ]);
  const hyoidBody = new Mesh(
    new TubeGeometry(hyoidCurve, 48, 0.028, 12, false),
    tissueMaterial(structureTissue("hyoid-bone")),
  );
  add("hyoid-bone", hyoidBody);
  for (const x of [0.13, -0.13]) {
    const lesserHorn = new Mesh(
      new ConeGeometry(0.018, 0.06, 10),
      tissueMaterial(structureTissue("hyoid-bone")),
    );
    lesserHorn.position.set(x, 0.85, 0.13); // small nub projecting upward
    add("hyoid-bone", lesserHorn);
  }

  // --- Thyrohyoid membrane: sheet between hyoid and thyroid superior border ---
  const thyrohyoidMembrane = new Mesh(
    new BoxGeometry(0.42, 0.28, 0.02),
    tissueMaterial(structureTissue("thyrohyoid-membrane")),
  );
  thyrohyoidMembrane.position.set(0, 0.67, 0.27);
  thyrohyoidMembrane.rotation.x = -0.15;
  add("thyrohyoid-membrane", thyrohyoidMembrane);

  // --- Median cricothyroid ligament: anterior band across the cricothyroid space ---
  const cricothyroidLigament = new Mesh(
    new BoxGeometry(0.14, 0.12, 0.03),
    tissueMaterial(structureTissue("median-cricothyroid-ligament")),
  );
  cricothyroidLigament.position.set(0, 0.06, 0.255);
  add("median-cricothyroid-ligament", cricothyroidLigament);

  // --- Cricothyroid muscle: paired bellies flanking the ligament ---
  for (const x of [0.15, -0.15]) {
    const cricothyroid = new Mesh(
      new BoxGeometry(0.11, 0.16, 0.06),
      tissueMaterial(structureTissue("cricothyroid-muscle")),
    );
    cricothyroid.position.set(x, 0.08, 0.19);
    cricothyroid.rotation.set(0.2, 0, x > 0 ? -0.45 : 0.45); // fan up-and-out
    add("cricothyroid-muscle", cricothyroid);
  }

  // --- Vocal folds (true): thyroid angle -> arytenoid vocal process, deep in airway ---
  const vocalFoldRot = [1.345, 1.797]; // left, right yaw so folds run antero-posteriorly
  const vocalFoldX = [0.03, -0.03];
  for (let i = 0; i < 2; i += 1) {
    const vocalFold = new Mesh(
      new BoxGeometry(0.28, 0.03, 0.045),
      tissueMaterial(structureTissue("vocal-fold")),
    );
    vocalFold.position.set(vocalFoldX[i], 0.14, 0.03);
    vocalFold.rotation.y = vocalFoldRot[i];
    add("vocal-fold", vocalFold);
  }

  // --- Vestibular folds (false): just superior (and lateral) to the true folds ---
  const vestFoldRot = [1.19, 1.95];
  const vestFoldX = [0.04, -0.04];
  for (let i = 0; i < 2; i += 1) {
    const vestibularFold = new Mesh(
      new BoxGeometry(0.24, 0.032, 0.05),
      tissueMaterial(structureTissue("vestibular-fold")),
    );
    vestibularFold.position.set(vestFoldX[i], 0.22, 0.04);
    vestibularFold.rotation.y = vestFoldRot[i];
    add("vestibular-fold", vestibularFold);
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
