"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type {
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
} from "three";
import type {
  AnatomyModelHandle,
  AnatomyModuleManifest,
} from "../../lib/anatomy3d/types";

export type AnatomyViewerHandle = {
  focusStructure(id: string): void;
  setModule(modelKey: string): void;
  setPickEnabled(enabled: boolean): void;
  setShowLabels(enabled: boolean): void;
};

type AnatomyViewerProps = {
  modelKey: string;
  focusStructureId?: string | null;
  pickEnabled?: boolean;
  showLabels?: boolean;
  onPick?: (structureId: string) => void;
  onReady?: () => void;
  className?: string;
};

type RuntimeApi = AnatomyViewerHandle;

type CameraFlight = {
  startedAt: number;
  fromPosition: Vector3;
  fromTarget: Vector3;
  toPosition: Vector3;
  toTarget: Vector3;
};

export const AnatomyViewer = forwardRef<AnatomyViewerHandle, AnatomyViewerProps>(function AnatomyViewer({
  modelKey,
  focusStructureId = null,
  pickEnabled = false,
  showLabels = false,
  onPick,
  onReady,
  className = "",
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsLayerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const runtimeRef = useRef<RuntimeApi | null>(null);
  const queuedModelRef = useRef(modelKey);
  const queuedFocusRef = useRef<string | null>(focusStructureId);
  const pickEnabledRef = useRef(pickEnabled);
  const showLabelsRef = useRef(showLabels);
  const onPickRef = useRef(onPick);
  const onReadyRef = useRef(onReady);

  useImperativeHandle(ref, () => ({
    focusStructure(id) {
      queuedFocusRef.current = id;
      runtimeRef.current?.focusStructure(id);
    },
    setModule(nextModelKey) {
      queuedModelRef.current = nextModelKey;
      queuedFocusRef.current = null;
      runtimeRef.current?.setModule(nextModelKey);
    },
    setPickEnabled(enabled) {
      pickEnabledRef.current = enabled;
      runtimeRef.current?.setPickEnabled(enabled);
    },
    setShowLabels(enabled) {
      showLabelsRef.current = enabled;
      runtimeRef.current?.setShowLabels(enabled);
    },
  }), []);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    queuedModelRef.current = modelKey;
    runtimeRef.current?.setModule(modelKey);
  }, [modelKey]);

  useEffect(() => {
    queuedFocusRef.current = focusStructureId;
    if (focusStructureId) runtimeRef.current?.focusStructure(focusStructureId);
  }, [focusStructureId]);

  useEffect(() => {
    pickEnabledRef.current = pickEnabled;
    runtimeRef.current?.setPickEnabled(pickEnabled);
  }, [pickEnabled]);

  useEffect(() => {
    showLabelsRef.current = showLabels;
    runtimeRef.current?.setShowLabels(showLabels);
  }, [showLabels]);

  useEffect(() => {
    const labelsLayerElement = labelsLayerRef.current;
    let cancelled = false;
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: WebGLRenderer | null = null;
    let currentHandle: AnatomyModelHandle | null = null;
    let removeEvents = () => {};
    let loadToken = 0;

    async function initialize() {
      const THREE = await import("three");
      const [registry, cameraHelpers, materialHelpers] = await Promise.all([
        import("../../lib/anatomy3d/registry.ts"),
        import("../../lib/anatomy3d/camera.ts"),
        import("../../lib/anatomy3d/materials.ts"),
      ]);
      if (cancelled) return;

      const canvas = canvasRef.current;
      const labelsLayer = labelsLayerRef.current;
      const status = statusRef.current;
      if (!canvas || !labelsLayer || !status) return;
      const stableCanvas = canvas;
      const stableLabelsLayer = labelsLayer;

      const setStatus = (message: string) => {
        status.textContent = message;
        status.hidden = message.length === 0;
      };

      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        });
      } catch {
        setStatus("This browser could not start the 3D viewer.");
        return;
      }

      renderer.setClearColor(0x102820, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xe9fff2, 0x17382d, 2.2));
      scene.add(new THREE.AmbientLight(0xffffff, 0.72));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
      keyLight.position.set(3, 4, 5);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x9ec6ff, 1.8);
      rimLight.position.set(-4, 1.5, -3);
      scene.add(rimLight);

      const camera: PerspectiveCamera = new THREE.PerspectiveCamera(44, 1, 0.01, 100);
      camera.position.set(2.4, 1.45, 3.15);
      const orbitTarget = new THREE.Vector3();
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const box = new THREE.Box3();
      const projected = new THREE.Vector3();
      const labelElements = new Map<string, HTMLElement>();
      let activeManifest: AnatomyModuleManifest | null = null;
      let flight: CameraFlight | null = null;
      let focusedId: string | null = null;
      let lastFrame = performance.now();
      let lastActivity = lastFrame;
      let drag: {
        pointerId: number;
        startX: number;
        startY: number;
        lastX: number;
        lastY: number;
        moved: boolean;
      } | null = null;

      function clearLabels() {
        labelElements.clear();
        stableLabelsLayer.replaceChildren();
      }

      function createLabels(manifest: AnatomyModuleManifest) {
        clearLabels();
        for (const structure of manifest.structures) {
          const label = document.createElement("span");
          label.className = "anatomy3d-label";
          label.textContent = structure.shortLabel ?? structure.label;
          label.dataset.structureId = structure.id;
          label.setAttribute("aria-hidden", "true");
          stableLabelsLayer.append(label);
          labelElements.set(structure.id, label);
        }
      }

      function clearVisualState() {
        if (!currentHandle) return;
        for (const objects of currentHandle.structures.values()) materialHelpers.clearHighlight(objects);
        materialHelpers.clearDim(currentHandle.structures);
      }

      function focusStructure(id: string) {
        const objects = currentHandle?.structures.get(id);
        const structure = activeManifest?.structures.find((candidate) => candidate.id === id);
        if (!currentHandle || !objects?.length || !structure) {
          queuedFocusRef.current = id;
          return;
        }
        scene.updateMatrixWorld(true);
        clearVisualState();
        materialHelpers.applyHighlight(objects);
        materialHelpers.applyDim(currentHandle.structures, [id]);
        const pose = cameraHelpers.frameStructure(objects, camera, undefined, structure.view);
        const now = performance.now();
        flight = {
          startedAt: now,
          fromPosition: camera.position.clone(),
          fromTarget: orbitTarget.clone(),
          toPosition: pose.position,
          toTarget: pose.target,
        };
        focusedId = id;
        lastActivity = now;
        queuedFocusRef.current = null;
      }

      async function setModule(nextModelKey: string) {
        const token = ++loadToken;
        setStatus("Loading anatomy model…");
        const registration = registry.getAnatomyModule(nextModelKey);
        if (!registration) {
          setStatus(`Unknown anatomy model: ${nextModelKey}`);
          return;
        }
        const nextHandle = await registration.createModel();
        if (cancelled || token !== loadToken) {
          nextHandle.dispose();
          return;
        }

        if (currentHandle) {
          clearVisualState();
          scene.remove(currentHandle.root);
          currentHandle.dispose();
        }
        currentHandle = nextHandle;
        activeManifest = registration.manifest;
        focusedId = null;
        flight = null;
        scene.add(currentHandle.root);
        createLabels(activeManifest);
        scene.updateMatrixWorld(true);
        const pose = cameraHelpers.frameStructure([currentHandle.root], camera);
        camera.position.copy(pose.position);
        orbitTarget.copy(pose.target);
        camera.lookAt(orbitTarget);
        setStatus("");
        onReadyRef.current?.();
        const pendingFocus = queuedFocusRef.current;
        if (pendingFocus) focusStructure(pendingFocus);
      }

      function setPickEnabled(enabled: boolean) {
        pickEnabledRef.current = enabled;
        stableCanvas.classList.toggle("is-pick-enabled", enabled);
      }

      function setShowLabels(enabled: boolean) {
        showLabelsRef.current = enabled;
        stableLabelsLayer.hidden = !enabled;
      }

      function resize() {
        if (!renderer) return;
        const width = Math.max(1, stableCanvas.clientWidth);
        const height = Math.max(1, stableCanvas.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      function updateLabels() {
        if (!currentHandle || !showLabelsRef.current) return;
        for (const [id, label] of labelElements) {
          const objects = currentHandle.structures.get(id) ?? [];
          box.makeEmpty();
          for (const object of objects) box.expandByObject(object, true);
          if (box.isEmpty()) {
            label.hidden = true;
            continue;
          }
          box.getCenter(projected).project(camera);
          const visible = projected.z >= -1 && projected.z <= 1
            && projected.x >= -1.1 && projected.x <= 1.1
            && projected.y >= -1.1 && projected.y <= 1.1;
          label.hidden = !visible;
          if (!visible) continue;
          const x = (projected.x * 0.5 + 0.5) * stableCanvas.clientWidth;
          const y = (-projected.y * 0.5 + 0.5) * stableCanvas.clientHeight;
          label.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        }
      }

      function pickAt(clientX: number, clientY: number) {
        if (!currentHandle || !pickEnabledRef.current) return;
        const bounds = stableCanvas.getBoundingClientRect();
        pointer.set(
          ((clientX - bounds.left) / bounds.width) * 2 - 1,
          -((clientY - bounds.top) / bounds.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(currentHandle.root, true).find((intersection) => (
          typeof intersection.object.userData.structureId === "string"
        ));
        const structureId = hit?.object.userData.structureId;
        if (typeof structureId !== "string") return;
        focusStructure(structureId);
        onPickRef.current?.(structureId);
      }

      function onPointerDown(event: PointerEvent) {
        if (event.button !== 0) return;
        lastActivity = performance.now();
        drag = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          lastX: event.clientX,
          lastY: event.clientY,
          moved: false,
        };
        stableCanvas.setPointerCapture(event.pointerId);
        stableCanvas.classList.add("is-dragging");
      }

      function onPointerMove(event: PointerEvent) {
        if (!drag || drag.pointerId !== event.pointerId || !currentHandle) return;
        const deltaX = event.clientX - drag.lastX;
        const deltaY = event.clientY - drag.lastY;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true;
        currentHandle.root.rotation.y += deltaX * 0.008;
        currentHandle.root.rotation.x = THREE.MathUtils.clamp(
          currentHandle.root.rotation.x + deltaY * 0.004,
          -0.42,
          0.42,
        );
        lastActivity = performance.now();
      }

      function onPointerUp(event: PointerEvent) {
        if (!drag || drag.pointerId !== event.pointerId) return;
        const shouldPick = !drag.moved;
        drag = null;
        stableCanvas.classList.remove("is-dragging");
        if (stableCanvas.hasPointerCapture(event.pointerId)) stableCanvas.releasePointerCapture(event.pointerId);
        if (shouldPick) pickAt(event.clientX, event.clientY);
      }

      function onWheel(event: WheelEvent) {
        event.preventDefault();
        flight = null;
        const offset = camera.position.clone().sub(orbitTarget);
        const distance = THREE.MathUtils.clamp(offset.length() * Math.exp(event.deltaY * 0.001), 0.42, 8);
        camera.position.copy(orbitTarget).add(offset.setLength(distance));
        lastActivity = performance.now();
      }

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      removeEvents = () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("wheel", onWheel);
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      resize();

      function animate(now: number) {
        if (cancelled || !renderer) return;
        const elapsed = Math.min(50, now - lastFrame);
        lastFrame = now;
        if (flight) {
          const progress = THREE.MathUtils.clamp((now - flight.startedAt) / 850, 0, 1);
          const eased = 1 - (1 - progress) ** 3;
          camera.position.lerpVectors(flight.fromPosition, flight.toPosition, eased);
          orbitTarget.lerpVectors(flight.fromTarget, flight.toTarget, eased);
          if (progress === 1) flight = null;
        } else if (currentHandle && !focusedId && !drag && now - lastActivity > 700) {
          currentHandle.root.rotation.y += elapsed * 0.00009;
        }
        camera.lookAt(orbitTarget);
        scene.updateMatrixWorld(true);
        updateLabels();
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      }

      runtimeRef.current = {
        focusStructure,
        setModule(nextModelKey) {
          queuedModelRef.current = nextModelKey;
          queuedFocusRef.current = null;
          void setModule(nextModelKey);
        },
        setPickEnabled,
        setShowLabels,
      };
      setPickEnabled(pickEnabledRef.current);
      setShowLabels(showLabelsRef.current);
      animationFrame = requestAnimationFrame(animate);
      await setModule(queuedModelRef.current);
    }

    void initialize();
    return () => {
      cancelled = true;
      loadToken += 1;
      runtimeRef.current = null;
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      removeEvents();
      currentHandle?.dispose();
      labelsLayerElement?.replaceChildren();
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
  }, []);

  return (
    <div className={`anatomy3d-stage ${className}`.trim()}>
      <canvas ref={canvasRef} className="anatomy3d-canvas" aria-label="Interactive 3D anatomy model" />
      <div ref={labelsLayerRef} className="anatomy3d-labels" aria-hidden="true" />
      <p ref={statusRef} className="anatomy3d-status" role="status">Loading anatomy model…</p>
      <p className="anatomy3d-viewer-hint">Drag to rotate · Scroll to zoom{pickEnabled ? " · Click a structure" : ""}</p>
    </div>
  );
});

AnatomyViewer.displayName = "AnatomyViewer";

export default AnatomyViewer;
