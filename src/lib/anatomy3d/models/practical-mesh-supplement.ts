import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group, Mesh, Object3D } from 'three';
import { practicalMeshModules } from '../manifests/practical-mesh-structures.mjs';

export async function attachPracticalMeshSupplement(scene: Group, modelKey: string) {
  const config = practicalMeshModules[modelKey];
  if (!config) return;
  const loaded = await new GLTFLoader().loadAsync(config.asset);
  loaded.scene.name = `${modelKey}-practical-detail`;
  // Do not independently centre or scale: every source shares the core skeleton's frame.
  scene.add(loaded.scene);
}

export function reconcilePracticalGroups(structures: Map<string,Object3D[]>, aliases: Map<string,string[]>, modelKey: string) {
  for (const {id,members} of practicalMeshModules[modelKey]?.groups ?? []) {
    if (!structures.has(id) || members.some(member => !structures.get(member)?.length)) continue;
    const replacement = members.flatMap(member => structures.get(member)!);
    const old = structures.get(id)!;
    for (const object of old) if (!replacement.includes(object)) {
      object.removeFromParent();
      const mesh = object as Mesh;
      mesh.geometry?.dispose();
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material?.dispose();
    }
    structures.set(id,replacement);aliases.set(id,members);
  }
}
