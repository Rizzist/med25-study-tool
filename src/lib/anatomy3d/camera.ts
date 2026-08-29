import {
  Box3,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  Sphere,
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
  zoom: 1.18,
};

function poseForBox(box: Box3, view: CameraView, verticalFov: number): CameraPose {
  const target = box.isEmpty() ? new Vector3() : box.getCenter(new Vector3());
  const sphere = box.getBoundingSphere(new Sphere());
  const radius = Math.max(sphere.radius, 0.08);
  const fov = MathUtils.degToRad(verticalFov);
  const distance = (radius / Math.sin(fov / 2)) * (view.zoom ?? 1);
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
  const pose = applyView(view, box, camera.fov);
  if (controls) controls.target.copy(pose.target);
  return pose;
}
