import { Box3, MathUtils, Object3D, PerspectiveCamera, Sphere, Vector3 } from "three";

export type RefitPose = { position: Vector3; target: Vector3 };
export type RefitFlight = {
  startedAt: number;
  durationMs?: number;
  fromPosition: Vector3;
  fromTarget: Vector3;
  toPosition: Vector3;
  toTarget: Vector3;
};

/** Fit the supplied anatomy without changing the chosen pivot or viewing direction. */
export function refitCameraPose(
  objects: Iterable<Object3D>,
  camera: PerspectiveCamera,
  position: Vector3,
  target: Vector3,
): RefitPose {
  const bounds = new Box3();
  for (const object of objects) bounds.expandByObject(object, true);
  if (bounds.isEmpty()) return { position: position.clone(), target: target.clone() };
  const sphere = bounds.getBoundingSphere(new Sphere());
  // A sphere centered on the existing pivot also contains off-center figure context.
  const radius = Math.max(sphere.radius, 0.08) + sphere.center.distanceTo(target);
  const verticalHalfFov = MathUtils.degToRad(camera.getEffectiveFOV()) / 2;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * Math.max(camera.aspect, 0.01));
  const distance = Math.max(
    radius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov)) * 1.04,
    radius + camera.near + 0.001,
  );
  const direction = position.clone().sub(target);
  if (direction.lengthSq() < 1e-12) direction.set(0, 0, 1);
  return { position: target.clone().add(direction.setLength(distance)), target: target.clone() };
}

/** Rebase a resize-interrupted flight continuously, preserving its destination and remaining time. */
export function refitCameraFlight(
  objects: Iterable<Object3D>,
  camera: PerspectiveCamera,
  currentTarget: Vector3,
  flight: RefitFlight,
  now: number,
): RefitFlight {
  const pose = refitCameraPose(objects, camera, flight.toPosition, flight.toTarget);
  return {
    startedAt: now,
    durationMs: Math.max(1, (flight.durationMs ?? 850) - Math.max(0, now - flight.startedAt)),
    fromPosition: camera.position.clone(),
    fromTarget: currentTarget.clone(),
    toPosition: pose.position,
    toTarget: pose.target,
  };
}
