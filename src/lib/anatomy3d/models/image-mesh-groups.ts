import { Box3, Mesh, MeshStandardMaterial, Object3D } from "three";

// Complete source groups can be selection aliases over the exact same component objects.
// Partial groups retain their residual anatomy; they must never simply disappear.
const groups: Record<string, Record<string, string[]>> = {
  "upper-limb": {
    "thenar-muscle-group": ["visual-abductor-pollicis-brevis", "visual-flexor-pollicis-brevis-superficial-head", "visual-opponens-pollicis"],
    "hypothenar-muscle-group": ["visual-abductor-digiti-minimi", "visual-flexor-digiti-minimi-brevis", "visual-opponens-digiti-minimi"],
  },
  "lower-limb": {
    "tarsal-bones": ["visual-talus", "visual-calcaneus", "visual-navicular", "visual-cuboid", "visual-medial-cuneiform", "visual-intermediate-cuneiform", "visual-lateral-cuneiform"],
    "iliopsoas": ["visual-psoas-major", "visual-iliacus"],
    "fibularis-longus-and-brevis": ["visual-fibularis-longus", "visual-fibularis-brevis"],
  },
  mediastinum: { "cvs-left-pulmonary-veins": ["cvs-left-superior-pulmonary-vein", "cvs-left-inferior-pulmonary-vein"] },
};

function remove(objects: Object3D[]) {
  for (const object of objects) {
    object.removeFromParent();
    const mesh = object as Mesh;
    mesh.geometry?.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material?.dispose();
  }
}

export function reconcileImageMeshGroups(structures: Map<string,Object3D[]>, modelKey: string) {
  const aliases = new Map<string,string[]>();
  for (const [group, members] of Object.entries(groups[modelKey] ?? {})) {
    if (!structures.has(group) || members.some((id) => !structures.get(id)?.length)) continue;
    remove(structures.get(group)!);
    structures.set(group, members.flatMap((id) => structures.get(id)!));
    aliases.set(group, members);
  }
  if (modelKey === "upper-limb") {
    const group = "adductor-pollicis-muscle", part = "visual-adductor-pollicis-transverse-head";
    const originals = structures.get(group) ?? [], replacement = structures.get(part) ?? [];
    const boxes = replacement.map((object) => new Box3().setFromObject(object));
    const duplicate = originals.filter((object) => {
      const box = new Box3().setFromObject(object);
      return boxes.some((other) => box.min.distanceTo(other.min) < 0.00001 && box.max.distanceTo(other.max) < 0.00001);
    });
    if (duplicate.length) {
      remove(duplicate);
      structures.set(group, [...originals.filter((object) => !duplicate.includes(object)), ...replacement]);
      aliases.set(group, [group, part]);
    }
  }
  // Original grouped low-resolution surfaces may include a partial detail whose full complement
  // is unavailable. Keep that residual anatomy and give the source detail deterministic depth
  // priority instead of deleting the surrounding bone or muscle group.
  for (const [id, objects] of structures) if (id.startsWith("visual-") || id.startsWith("cvs-")) for (const object of objects) {
    const mesh = object as Mesh;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (material instanceof MeshStandardMaterial) {
      material.polygonOffset = true; material.polygonOffsetFactor = -1; material.polygonOffsetUnits = -1;
    }
  }
  return aliases;
}
