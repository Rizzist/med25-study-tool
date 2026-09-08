import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Group } from "three";
import { imageMeshModules } from "../manifests/image-mesh-structures.mjs";

/** All supplements share the core model's baked coordinates, before runtime normalization. */
export async function attachImageMeshSupplement(scene: Group, modelKey: string) {
  const config = (imageMeshModules as Record<string, { asset: string }>)[modelKey];
  if (!config) return;
  const loaded = await new GLTFLoader().loadAsync(config.asset);
  loaded.scene.name = modelKey + "-source-image-detail";
  scene.add(loaded.scene);
}
