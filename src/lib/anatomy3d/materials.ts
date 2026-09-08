import {
  Color,
  Material,
  MeshStandardMaterial,
  Object3D,
} from "three";
import type { Tissue } from "./types.ts";

export const HIGHLIGHT_INTENSITY = 0.72;
export const DIM_OPACITY = 0.4;
export type SurfaceMode = "solid" | "xray";

const tissuePalette: Record<Tissue, { color: string; transparent?: boolean; opacity?: number }> = {
  cartilage: { color: "#c8d4e0" },
  bone: { color: "#efe6d2" },
  mucosa: { color: "#d98a8a" },
  muscle: { color: "#b5544d" },
  ligament: { color: "#d9c9a3" },
  tendon: { color: "#ddd6bc" },
  fascia: { color: "#ddd2be" },
  membrane: { color: "#d9c9a3" },
  airway: { color: "#cdb9a0" },
  lung: { color: "#e0a3a0" },
  nerve: { color: "#e8d24a" },
  artery: { color: "#c0392b" },
  vein: { color: "#2b5fa0" },
  gland: { color: "#c98f6b" },
  cavity: { color: "#8fb0c8", transparent: true, opacity: 0.48 },
  fat: { color: "#f2e2a8" },
};

type MaterialState = {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
};

const dimStates = new WeakMap<Material, MaterialState>();
const surfaceStates = new WeakMap<Material, MaterialState>();
const rimUniforms = new WeakMap<Material, { value: number }>();

export function setSurfaceMode(all: Map<string, Object3D[]>, mode: SurfaceMode, focusedId?: string | null) {
  const focused = new Set(focusedId ? all.get(focusedId) ?? [] : []);
  for (const objects of all.values()) for (const object of objects) visitMaterials([object], material => {
    if (!surfaceStates.has(material)) surfaceStates.set(material, { opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
    const xray = mode === "xray" && !focused.has(object);
    material.opacity = xray ? Math.min(surfaceStates.get(material)!.opacity, 0.18) : 1;
    material.transparent = xray;
    material.depthWrite = !xray;
    material.needsUpdate = true;
  });
  // Aggregate aliases can share objects with component IDs; the focus wins.
  visitMaterials(focused, material => { material.opacity = 1; material.transparent = false; material.depthWrite = true; });
}

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
    // Illuminate with the material's own anatomical colour instead of washing every selected
    // structure in the same lime. Arteries stay red, veins blue and nerves yellow while selected.
    material.emissive.copy(material.color);
    material.emissiveIntensity = HIGHLIGHT_INTENSITY;
    if (!rimUniforms.has(material)) {
      const uniform = { value: 1 };
      rimUniforms.set(material, uniform);
      const previous = material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => {
        previous.call(material, shader, renderer);
        shader.uniforms.anatomyFocus = uniform;
        shader.fragmentShader = 'uniform float anatomyFocus;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', 'float anatomyRim = pow(clamp(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.5);\noutgoingLight += anatomyFocus * anatomyRim * vec3(0.1, 0.8, 1.0) * 1.6;\n#include <opaque_fragment>');
      };
      material.customProgramCacheKey = () => 'med25-anatomy-rim-v1';
      material.needsUpdate = true;
    }
    rimUniforms.get(material)!.value = 1;
  });
}

export function clearHighlight(objects: Iterable<Object3D>) {
  visitMaterials(objects, (material) => {
    material.emissive.set(0x000000);
    material.emissiveIntensity = 0;
    const uniform = rimUniforms.get(material);
    if (uniform) uniform.value = 0;
  });
}

export function applyDim(all: Map<string, Object3D[]>, exceptIds: Iterable<string>) {
  const exceptions = new Set(exceptIds);
  const exemptObjects = new Set([...exceptions].flatMap((id) => all.get(id) ?? []));
  for (const [id, objects] of all) {
    if (exceptions.has(id)) continue;
    visitMaterials(objects.filter((object) => !exemptObjects.has(object)), (material) => {
      if (!dimStates.has(material)) {
        dimStates.set(material, {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite,
        });
      }
      material.transparent = true;
      // Preserve authored translucency: dimming a 5%-opaque pericardial shell must never
      // turn it into a 40%-opaque wall that obscures the heart. Read the original state
      // so overlapping selection aliases do not compound the fade.
      material.opacity = dimStates.get(material)!.opacity * DIM_OPACITY;
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
