import {
  Color,
  Material,
  MeshStandardMaterial,
  Object3D,
} from "three";
import type { Tissue } from "./types.ts";

export const HIGHLIGHT_COLOR = "#d8ff62";
export const HIGHLIGHT_INTENSITY = 0.72;
export const DIM_OPACITY = 0.18;

const tissuePalette: Record<Tissue, { color: string; transparent?: boolean; opacity?: number }> = {
  cartilage: { color: "#c8d4e0" },
  bone: { color: "#efe6d2" },
  mucosa: { color: "#d98a8a" },
  muscle: { color: "#b5544d" },
  ligament: { color: "#d9c9a3" },
  membrane: { color: "#d9c9a3" },
  airway: { color: "#cdb9a0" },
  lung: { color: "#e0a3a0" },
  nerve: { color: "#e8d24a" },
  artery: { color: "#c0392b" },
  vein: { color: "#2b5fa0" },
  gland: { color: "#c98f6b" },
  cavity: { color: "#8fb0c8", transparent: true, opacity: 0.48 },
};

type MaterialState = {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
};

const dimStates = new WeakMap<Material, MaterialState>();

export function tissueMaterial(tissue: Tissue): MeshStandardMaterial {
  const palette = tissuePalette[tissue];
  return new MeshStandardMaterial({
    color: palette.color,
    emissive: new Color(0x000000),
    emissiveIntensity: 0,
    metalness: 0.03,
    roughness: tissue === "bone" || tissue === "cartilage" ? 0.72 : 0.86,
    transparent: palette.transparent ?? false,
    opacity: palette.opacity ?? 1,
    depthWrite: tissue !== "cavity",
  });
}

function materialsFor(object: Object3D): MeshStandardMaterial[] {
  const candidate = object as Object3D & {
    material?: Material | Material[];
  };
  const materials = candidate.material
    ? Array.isArray(candidate.material) ? candidate.material : [candidate.material]
    : [];
  return materials.filter((material): material is MeshStandardMaterial => material instanceof MeshStandardMaterial);
}

function visitMaterials(objects: Iterable<Object3D>, visit: (material: MeshStandardMaterial) => void) {
  for (const object of objects) object.traverse((child) => {
    for (const material of materialsFor(child)) visit(material);
  });
}

export function applyHighlight(objects: Iterable<Object3D>) {
  visitMaterials(objects, (material) => {
    material.emissive.set(HIGHLIGHT_COLOR);
    material.emissiveIntensity = HIGHLIGHT_INTENSITY;
  });
}

export function clearHighlight(objects: Iterable<Object3D>) {
  visitMaterials(objects, (material) => {
    material.emissive.set(0x000000);
    material.emissiveIntensity = 0;
  });
}

export function applyDim(all: Map<string, Object3D[]>, exceptIds: Iterable<string>) {
  const exceptions = new Set(exceptIds);
  for (const [id, objects] of all) {
    if (exceptions.has(id)) continue;
    visitMaterials(objects, (material) => {
      if (!dimStates.has(material)) {
        dimStates.set(material, {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite,
        });
      }
      material.transparent = true;
      material.opacity = DIM_OPACITY;
      material.depthWrite = false;
    });
  }
}

export function clearDim(all: Map<string, Object3D[]>) {
  for (const objects of all.values()) visitMaterials(objects, (material) => {
    const state = dimStates.get(material);
    if (!state) return;
    material.opacity = state.opacity;
    material.transparent = state.transparent;
    material.depthWrite = state.depthWrite;
    dimStates.delete(material);
  });
}
