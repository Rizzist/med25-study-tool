import {
  Box3,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  Sphere,
  Spherical,
  Vector3,
} from "three";
import type { CameraView } from "./types.ts";

export type CameraPose = {
  position: Vector3;
  target: Vector3;
};

type OrbitTarget = { target: Vector3 };

const DEFAULT_VIEW: CameraView = {
  azimuth: Math.PI / 5,
  elevation: Math.PI / 10,
  zoom: 1.05,
};

// An authored `view.zoom` is a padding multiplier: distance = (tangent-sphere distance) * zoom,
// so zoom = 1 exactly circumscribes the target's bounding sphere and any excess is empty margin.
// Compress that excess margin uniformly (PADDING_SCALE) so a focused structure fills more of the
// viewport, and keep a small floor (MIN_ZOOM) so it always stays fully in frame.
const PADDING_SCALE = 0.66;
const MIN_ZOOM = 1.04;

function poseForBox(box: Box3, view: CameraView, verticalFov: number): CameraPose {
  const target = box.isEmpty() ? new Vector3() : box.getCenter(new Vector3());
  const sphere = box.getBoundingSphere(new Sphere());
  const radius = Math.max(sphere.radius, 0.08);
  const fov = MathUtils.degToRad(verticalFov);
  const zoom = Math.max(MIN_ZOOM, 1 + ((view.zoom ?? 1) - 1) * PADDING_SCALE);
  const distance = (radius / Math.sin(fov / 2)) * zoom;
  const horizontal = Math.cos(view.elevation);
  const direction = new Vector3(
    Math.sin(view.azimuth) * horizontal,
    Math.sin(view.elevation),
    Math.cos(view.azimuth) * horizontal,
  ).normalize();
  return {
    position: target.clone().addScaledVector(direction, distance),
    target,
  };
}

export function applyView(view: CameraView | undefined, bbox: Box3, verticalFov = 45): CameraPose {
  return poseForBox(bbox, view ?? DEFAULT_VIEW, verticalFov);
}

export function frameStructure(
  objects: Iterable<Object3D>,
  camera: PerspectiveCamera,
  controls?: OrbitTarget,
  view?: CameraView,
): CameraPose {
  const box = new Box3();
  for (const object of objects) box.expandByObject(object, true);
  const horizontalFov = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(camera.fov) / 2) * camera.aspect));
  const pose = applyView(view, box, Math.min(camera.fov, horizontalFov));
  if (controls) controls.target.copy(pose.target);
  return pose;
}

// Orbit the camera, never the anatomy. The selected world-space target remains
// the pivot and the shared anatomical axes stay stable for slice planes.
export function orbitCamera(camera: PerspectiveCamera, target: Vector3, deltaX: number, deltaY: number) {
  const spherical = new Spherical().setFromVector3(camera.position.clone().sub(target));
  spherical.theta -= deltaX * 0.008;
  spherical.phi = MathUtils.clamp(spherical.phi + deltaY * 0.006, 0.04, Math.PI - 0.04);
  camera.position.copy(target).add(new Vector3().setFromSpherical(spherical));
  camera.lookAt(target);
}
