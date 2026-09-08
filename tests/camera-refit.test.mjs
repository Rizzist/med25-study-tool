import assert from "node:assert/strict";
import test from "node:test";
import { Box3, BoxGeometry, Group, Mesh, PerspectiveCamera, Vector3 } from "three";
import { refitCameraPose, refitCameraFlight } from "../src/lib/anatomy3d/camera-refit.ts";

function fixture() {
  const root = new Group();
  const mesh = new Mesh(new BoxGeometry(1, 2, 0.5));
  mesh.position.set(2, 0.4, -0.3);
  root.add(mesh);
  root.updateMatrixWorld(true);
  return { root, mesh, camera: new PerspectiveCamera(44, 2, 0.01, 100) };
}
function close(actual, expected, message) {
  assert.ok(actual.distanceTo(expected) < 1e-9, message);
}
function assertFits(mesh, camera) {
  camera.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(mesh);
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const p = new Vector3(x, y, z).project(camera);
    assert.ok(Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && Math.abs(p.z) <= 1, `Corner outside viewport: ${p.toArray()}`);
  }
}

test("resize fits portrait context while preserving an off-center pivot and posterior view", () => {
  const { root, mesh, camera } = fixture();
  const target = new Vector3(1.6, 0.1, -0.4);
  const direction = new Vector3(0.3, 0.2, -1).normalize();
  const initialPosition = target.clone().addScaledVector(direction, 3);
  const rootMatrix = root.matrixWorld.clone();
  for (const aspect of [2, 0.45, 1, 2]) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const pose = refitCameraPose([mesh], camera, initialPosition, target);
    close(pose.target, target, "The selected pivot moved");
    close(pose.position.clone().sub(pose.target).normalize(), direction, "The chosen posterior angle changed");
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    assertFits(mesh, camera);
  }
  assert.deepEqual(root.matrixWorld.elements, rootMatrix.elements);
  close(initialPosition, target.clone().addScaledVector(direction, 3), "The input pose was mutated");
  mesh.geometry.dispose();
  mesh.material.dispose();
});

test("resize rebases an active flight without losing its pivot, direction, or deadline", () => {
  const { mesh, camera } = fixture();
  const currentTarget = new Vector3(0.4, 0.08, -0.06);
  camera.position.set(1, 0.5, 3);
  camera.aspect = 0.45;
  camera.updateProjectionMatrix();
  const flight = {
    startedAt: 1000,
    fromPosition: new Vector3(0, 0, 4),
    fromTarget: new Vector3(),
    toPosition: new Vector3(2.8, 1.2, -3.3),
    toTarget: new Vector3(2, 0.4, -0.3),
  };
  const next = refitCameraFlight([mesh], camera, currentTarget, flight, 1250);
  assert.equal(next.startedAt, 1250);
  assert.equal(next.durationMs, 600);
  close(next.fromPosition, camera.position, "Resize introduced a camera-position discontinuity");
  close(next.fromTarget, currentTarget, "Resize introduced a pivot discontinuity");
  close(next.toTarget, flight.toTarget, "Destination pivot changed");
  close(next.toPosition.clone().sub(next.toTarget).normalize(), flight.toPosition.clone().sub(flight.toTarget).normalize(), "Destination angle changed");
  const second = refitCameraFlight([mesh], camera, currentTarget, next, 1300);
  assert.equal(second.durationMs, 550, "Repeated resize restarted the animation deadline");
  camera.position.copy(next.toPosition);
  camera.lookAt(next.toTarget);
  assertFits(mesh, camera);
  mesh.geometry.dispose();
  mesh.material.dispose();
});

test("empty geometry leaves pose intact and a degenerate direction produces a finite fit", () => {
  const { mesh, camera } = fixture();
  const target = new Vector3(2, 0.4, -0.3);
  const position = new Vector3(3, 2, 1);
  const empty = refitCameraPose([], camera, position, target);
  close(empty.position, position);
  close(empty.target, target);
  const degenerate = refitCameraPose([mesh], camera, target, target);
  assert.ok(degenerate.position.toArray().every(Number.isFinite));
  assert.ok(degenerate.position.distanceTo(target) > 0);
  mesh.geometry.dispose();
  mesh.material.dispose();
});
