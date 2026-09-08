import type { AnatomyModelHandle, AnatomyModuleManifest } from "./types.ts";
type Registration = { manifest: AnatomyModuleManifest; createModel: () => AnatomyModelHandle | Promise<AnatomyModelHandle> };

// Uniform source-frame fits from the original BodyParts3D OBJ anchors. Heart/coronary and
// mediastinal/aortic residuals are <1e-7; the simplified wall/sternum fit is within 0.06%.
const frames: Record<string, { scale: number; translate: [number, number, number] }> = {
  heart: { scale: 0.016726191426671082, translate: [-0.3779140725, -20.5066451992, -2.0485695555] },
  mediastinum: { scale: 0.003970733457500377, translate: [-0.10148261585, -4.7094070068, -0.3876303046] },
};
export const compositeStructureId = (modelKey: string, structureId: string) => `${modelKey}-joined-${structureId}`;

export function getThoraxComposite(registrations: Registration[]): Registration {
  // Heart and great vessels share a reliable source frame. The wall can stay a separate view
  // until its simplified source fit has been independently visually reconciled.
  const parts = registrations.filter(({ manifest }) => manifest.modelKey in frames);
  return {
    manifest: {
      id: "thorax-image-composite", modelKey: "thorax-image-composite", region: "cvs", subject: "anatomy",
      title: "Heart and mediastinum", blurb: "Source-aligned heart and mediastinal anatomy in a shared frame; authored schematic layers remain marked.",
      structures: parts.flatMap(({ manifest }) => manifest.structures.map((structure) => ({
        ...structure, id: compositeStructureId(manifest.modelKey, structure.id),
        label: `${manifest.title} · ${structure.label}`, shortLabel: structure.label,
        distractorIds: structure.distractorIds?.map((id) => compositeStructureId(manifest.modelKey, id)),
      }))),
    },
    async createModel() {
      const { Group, Box3, Vector3 } = await import("three");
      const handles = await Promise.all(parts.map((part) => part.createModel()));
      const root = new Group();
      const structures = new Map<string, import("three").Object3D[]>();
      const aliases = new Map<string,string[]>();
      const reference = frames.mediastinum;
      for (const [index, handle] of handles.entries()) {
        const key = parts[index].manifest.modelKey;
        const frame = frames[key];
        const ratio = reference.scale / frame.scale;
        // Factories normalize by translating their scene and scaling their root. Undo only that
        // known normalization, then transform both native and schematic geometry uniformly.
        for (const child of handle.root.children) child.position.set(0, 0, 0);
        handle.root.scale.setScalar(ratio);
        handle.root.position.set(...reference.translate.map((value, axis) => value - frame.translate[axis] * ratio) as [number,number,number]);
        root.add(handle.root);
        const renamed = new Set<import("three").Object3D>();
        for (const [id, objects] of handle.structures) {
          const joinedId = compositeStructureId(key, id);
          for (const object of objects) if (!renamed.has(object)) { object.userData.structureId = compositeStructureId(key, object.userData.structureId); renamed.add(object); }
          structures.set(joinedId, objects);
        }
        for (const [id, members] of handle.aliases ?? []) aliases.set(compositeStructureId(key, id), members.map((member) => compositeStructureId(key, member)));
      }
      const box = new Box3().setFromObject(root);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());
      for (const child of root.children) child.position.sub(center);
      root.scale.setScalar(1.9 / Math.max(size.x, size.y, size.z));
      return { root, structures, aliases, dispose() { for (const handle of handles) handle.dispose(); root.clear(); structures.clear(); } };
    },
  };
}
