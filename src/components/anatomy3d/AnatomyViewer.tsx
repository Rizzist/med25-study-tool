"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
} from "three";
import type {
  AnatomyModelHandle,
  AnatomyModuleManifest,
  CameraView,
} from "../../lib/anatomy3d/types";

export type AnatomyViewerHandle = {
  focusStructure(id: string): void;
  clearFocus(): void;
  setModule(modelKey: string): void;
  setPickEnabled(enabled: boolean): void;
  setShowLabels(enabled: boolean): void;
  setHiddenStructures(ids: ReadonlySet<string>): void;
  setSlice(axis: SliceAxis, position?: number, flipped?: boolean): void;
  pickAtPoint(clientX: number, clientY: number): string | null;
};

export type SliceAxis = "off" | "sagittal" | "coronal" | "transverse";

type SliceState = {
  axis: SliceAxis;
  position: number;
  flipped: boolean;
};

type AnatomyViewerProps = {
  modelKey: string;
  focusStructureId?: string | null;
  pickEnabled?: boolean;
  showLabels?: boolean;
  hiddenStructureIds?: ReadonlySet<string>;
  onPick?: (structureId: string) => void;
  onReady?: () => void;
  className?: string;
  controlsVisible?: boolean;
  preferredView?: CameraView;
  framingStructureIds?: readonly string[];
  labelMode?: "all" | "active";
  focusOnPick?: boolean;
  pickCandidateIds?: readonly string[];
};

const EMPTY_HIDDEN: ReadonlySet<string> = new Set<string>();

type RuntimeApi = AnatomyViewerHandle;

type CameraFlight = {
  startedAt: number;
  durationMs?: number;
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
  hiddenStructureIds,
  onPick,
  onReady,
  className = "",
  controlsVisible = true,
  preferredView,
  framingStructureIds,
  labelMode = "all",
  focusOnPick = true,
  pickCandidateIds,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsLayerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const runtimeRef = useRef<RuntimeApi | null>(null);
  const queuedModelRef = useRef(modelKey);
  const queuedFocusRef = useRef<string | null>(focusStructureId);
  const pickEnabledRef = useRef(pickEnabled);
  const showLabelsRef = useRef(showLabels);
  const hiddenStructuresRef = useRef<ReadonlySet<string>>(hiddenStructureIds ?? EMPTY_HIDDEN);
  const sliceStateRef = useRef<SliceState>({ axis: "off", position: 0, flipped: false });
  const onPickRef = useRef(onPick);
  const onReadyRef = useRef(onReady);
  const preferredViewRef = useRef(preferredView);
  const framingStructureIdsRef = useRef(framingStructureIds);
  const labelModeRef = useRef(labelMode);
  const focusOnPickRef = useRef(focusOnPick);
  const candidateIdsRef = useRef(pickCandidateIds);
  const [surfaceMode, setSurfaceMode] = useState<"solid" | "xray">("solid");
  const surfaceModeRef = useRef<"solid" | "xray">("solid");
  const [isolated, setIsolated] = useState(false);
  const isolatedRef = useRef(false);
  const [autoOrbit, setAutoOrbit] = useState(false);
  const autoOrbitRef = useRef(false);
  const [showCovers, setShowCovers] = useState(false);
  const showCoversRef = useRef(false);
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("off");
  const [slicePosition, setSlicePosition] = useState(0);
  const [sliceFlipped, setSliceFlipped] = useState(false);

  useImperativeHandle(ref, () => ({
    pickAtPoint(x, y) { return runtimeRef.current?.pickAtPoint(x, y) ?? null; },
    focusStructure(id) {
      queuedFocusRef.current = id;
      runtimeRef.current?.focusStructure(id);
    },
    clearFocus() {
      queuedFocusRef.current = null;
      runtimeRef.current?.clearFocus();
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
    setHiddenStructures(ids) {
      hiddenStructuresRef.current = ids;
      runtimeRef.current?.setHiddenStructures(ids);
    },
    setSlice(axis, position = 0, flipped = false) {
      const next = { axis, position, flipped };
      sliceStateRef.current = next;
      setSliceAxis(axis);
      setSlicePosition(position);
      setSliceFlipped(flipped);
      runtimeRef.current?.setSlice(axis, position, flipped);
    },
  }), []);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => { preferredViewRef.current = preferredView; framingStructureIdsRef.current = framingStructureIds; labelModeRef.current = labelMode; }, [preferredView, framingStructureIds, labelMode]);
  useEffect(() => { focusOnPickRef.current = focusOnPick; candidateIdsRef.current = pickCandidateIds; }, [focusOnPick, pickCandidateIds]);
  useEffect(() => {
    surfaceModeRef.current = surfaceMode; isolatedRef.current = isolated; autoOrbitRef.current = autoOrbit; showCoversRef.current = showCovers;
    runtimeRef.current?.setHiddenStructures(hiddenStructuresRef.current);
  }, [surfaceMode, isolated, autoOrbit, showCovers]);

  useEffect(() => {
    queuedModelRef.current = modelKey;
    runtimeRef.current?.setModule(modelKey);
  }, [modelKey]);

  useEffect(() => {
    queuedFocusRef.current = focusStructureId ?? null;
    if (focusStructureId) runtimeRef.current?.focusStructure(focusStructureId);
    else runtimeRef.current?.clearFocus();
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
    const ids = hiddenStructureIds ?? EMPTY_HIDDEN;
    hiddenStructuresRef.current = ids;
    runtimeRef.current?.setHiddenStructures(ids);
  }, [hiddenStructureIds]);

  useEffect(() => {
    const next = { axis: sliceAxis, position: slicePosition, flipped: sliceFlipped };
    sliceStateRef.current = next;
    runtimeRef.current?.setSlice(next.axis, next.position, next.flipped);
  }, [sliceAxis, slicePosition, sliceFlipped]);

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
      const [registry, cameraHelpers, materialHelpers, refitHelpers] = await Promise.all([
        import("../../lib/anatomy3d/registry.ts"),
        import("../../lib/anatomy3d/camera.ts"),
        import("../../lib/anatomy3d/materials.ts"),
        import("../../lib/anatomy3d/camera-refit.ts"),
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
      renderer.localClippingEnabled = true;

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
      const slicePoint = new THREE.Vector3();
      const sliceNormal = new THREE.Vector3();
      const rootQuaternion = new THREE.Quaternion();
      const clipPlane = new THREE.Plane();
      const modelBounds = new THREE.Box3();
      const labelElements = new Map<string, HTMLElement>();
      const focusOutlines: { source: import("three").Mesh; overlay: import("three").Mesh }[] = [];
      let activeManifest: AnatomyModuleManifest | null = null;
      let flight: CameraFlight | null = null;
      let focusedId: string | null = null;
      let hoveredId: string | null = null;
      let hiddenIds: ReadonlySet<string> = hiddenStructuresRef.current ?? EMPTY_HIDDEN;
      let sliceState: SliceState = sliceStateRef.current;
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
        for (const { overlay } of focusOutlines) { scene.remove(overlay); (overlay.material as import("three").Material).dispose(); }
        focusOutlines.length = 0;
        if (!currentHandle) return;
        for (const objects of currentHandle.structures.values()) materialHelpers.clearHighlight(objects);
        materialHelpers.clearDim(currentHandle.structures);
      }

      // Toggle mesh visibility for the current hidden set (a system the user peeled away). Hidden
      // meshes are excluded from rendering here; pick/focus/label exclusion is enforced separately
      // because three's raycaster ignores `.visible`.
      function applyHiddenVisibility() {
        if (!currentHandle) return;
        const visibleObjects = new Set([...currentHandle.structures].filter(([id]) => !hiddenIds.has(id) && (!isolatedRef.current || !focusedId || id === focusedId)).flatMap(([, objects]) => objects));
        for (const objects of currentHandle.structures.values()) {
          for (const object of objects) object.visible = visibleObjects.has(object) && (!object.userData.studyGuideEnvelope || showCoversRef.current || surfaceModeRef.current === "xray" || Boolean(currentHandle.structures.get(focusedId ?? "")?.includes(object)));
        }
      }

      function setHiddenStructures(ids: ReadonlySet<string>) {
        hiddenIds = ids;
        if (currentHandle) materialHelpers.setSurfaceMode(currentHandle.structures, surfaceModeRef.current, focusedId);
        applyHiddenVisibility();
        // Never keep a hidden structure highlighted / framed.
        if (focusedId && hiddenIds.has(focusedId)) clearFocus();
      }

      function setSlice(axis: SliceAxis, position = 0, flipped = false) {
        sliceState = {
          axis,
          position: THREE.MathUtils.clamp(position, -100, 100),
          flipped,
        };
        if (renderer) renderer.clippingPlanes = axis === "off" ? [] : [clipPlane];
        lastActivity = performance.now();
      }

      // Models use the shared anatomical frame: +X subject-left, +Y superior and +Z anterior.
      // Build the clipping plane in that local frame, then rotate it with the model so a sagittal,
      // coronal or transverse section remains anatomically correct after the user drags the model.
      function updateSlicePlane() {
        if (!currentHandle || sliceState.axis === "off" || modelBounds.isEmpty()) return;
        const { min, max } = modelBounds;
        const t = (sliceState.position + 100) / 200;
        slicePoint.copy(modelBounds.getCenter(new THREE.Vector3()));
        if (sliceState.axis === "sagittal") {
          sliceNormal.set(1, 0, 0);
          slicePoint.x = THREE.MathUtils.lerp(min.x, max.x, t);
        } else if (sliceState.axis === "coronal") {
          sliceNormal.set(0, 0, 1);
          slicePoint.z = THREE.MathUtils.lerp(min.z, max.z, t);
        } else {
          sliceNormal.set(0, 1, 0);
          slicePoint.y = THREE.MathUtils.lerp(min.y, max.y, t);
        }
        currentHandle.root.localToWorld(slicePoint);
        currentHandle.root.getWorldQuaternion(rootQuaternion);
        sliceNormal.applyQuaternion(rootQuaternion).normalize();
        if (sliceState.flipped) sliceNormal.negate();
        clipPlane.setFromNormalAndCoplanarPoint(sliceNormal, slicePoint);
      }

      function boxSurvivesSlice(candidate: import("three").Box3) {
        if (sliceState.axis === "off") return true;
        const { min, max } = candidate;
        for (const x of [min.x, max.x]) {
          for (const y of [min.y, max.y]) {
            for (const z of [min.z, max.z]) {
              if (clipPlane.distanceToPoint(projected.set(x, y, z)) >= -0.0001) return true;
            }
          }
        }
        return false;
      }

      function focusStructure(id: string) {
        if (hiddenIds.has(id)) return; // never fly-to or highlight a hidden structure
        const objects = currentHandle?.structures.get(id);
        const structure = activeManifest?.structures.find((candidate) => candidate.id === id);
        if (!currentHandle || !objects?.length || !structure) {
          queuedFocusRef.current = id;
          return;
        }
        scene.updateMatrixWorld(true);
        clearVisualState();
        materialHelpers.applyHighlight(objects);
        const meshes = new Set<import("three").Mesh>();
        for (const object of objects) object.traverse(child => { if ((child as import("three").Mesh).isMesh) meshes.add(child as import("three").Mesh); });
        // A cyan contour remains visible through occluding context. It is an
        // explicitly highlighted target overlay, not transparent surrounding anatomy.
        for (const source of meshes) {
          const material = new THREE.ShaderMaterial({
            transparent: true, depthTest: false, depthWrite: false, clipping: true,
            vertexShader: '#include <clipping_planes_pars_vertex>\nvarying vec3 focusNormal; varying vec3 focusView; void main(){ vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); focusNormal = normalize(normalMatrix * normal); focusView = -mvPosition.xyz; gl_Position = projectionMatrix * mvPosition;\n#include <clipping_planes_vertex>\n}',
            fragmentShader: '#include <clipping_planes_pars_fragment>\nvarying vec3 focusNormal; varying vec3 focusView; void main(){\n#include <clipping_planes_fragment>\nfloat rim = pow(clamp(1.0 - abs(dot(normalize(focusNormal), normalize(focusView))), 0.0, 1.0), 3.0); gl_FragColor = vec4(0.15, 0.85, 1.0, rim * 0.75); }',
          });
          const overlay = new THREE.Mesh(source.geometry, material);
          overlay.matrixAutoUpdate = false; overlay.renderOrder = 20;
          scene.add(overlay); focusOutlines.push({ source, overlay });
        }
        materialHelpers.setSurfaceMode(currentHandle.structures, surfaceModeRef.current, id);
        const pose = cameraHelpers.frameStructure(objects, camera, undefined, preferredViewRef.current ?? structure.view);
        // The authored `view` is model-relative, but the pose direction is built in world
        // space. Rotate the target→camera offset by the model root's current world orientation
        // so the authored anatomical face stays framed after any drag or idle rotation.
        const worldQuaternion = currentHandle.root.getWorldQuaternion(new THREE.Quaternion());
        pose.position.sub(pose.target).applyQuaternion(worldQuaternion).add(pose.target);
        const now = performance.now();
        flight = {
          startedAt: now,
          fromPosition: camera.position.clone(),
          fromTarget: orbitTarget.clone(),
          toPosition: pose.position,
          toTarget: pose.target,
        };
        focusedId = id;
        applyHiddenVisibility();
        lastActivity = now;
        queuedFocusRef.current = null;
      }

      function clearFocus() {
        clearVisualState();
        if (!currentHandle) {
          focusedId = null;
          queuedFocusRef.current = null;
          return;
        }
        scene.updateMatrixWorld(true);
        focusedId = null;
        applyHiddenVisibility();
        materialHelpers.setSurfaceMode(currentHandle.structures, surfaceModeRef.current);
        const contextObjects = framingStructureIdsRef.current?.flatMap(id => currentHandle?.structures.get(id) ?? []);
        const pose = cameraHelpers.frameStructure(contextObjects?.length ? contextObjects : [currentHandle.root], camera, undefined, preferredViewRef.current);
        const now = performance.now();
        flight = {
          startedAt: now,
          fromPosition: camera.position.clone(),
          fromTarget: orbitTarget.clone(),
          toPosition: pose.position,
          toTarget: pose.target,
        };
        focusedId = null;
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
        // Re-apply the latest hidden set to the freshly built meshes.
        hiddenIds = hiddenStructuresRef.current ?? EMPTY_HIDDEN;
        for (const [id, objects] of currentHandle.structures) {
          const tissue = activeManifest.structures.find(item=>item.id===id)?.tissue;
          if (tissue && ["cavity","membrane","fascia"].includes(tissue)) for (const object of objects) {
            const material = (object as import("three").Mesh).material;
            object.userData.studyGuideEnvelope = (Array.isArray(material)?material:[material]).some(m=>m && m.opacity<0.25);
          }
        }
        materialHelpers.setSurfaceMode(currentHandle.structures, surfaceModeRef.current);
        applyHiddenVisibility();
        scene.updateMatrixWorld(true);
        modelBounds.setFromObject(currentHandle.root);
        // The factories deliver a normalized, identity-oriented root. Store its bounds in that
        // anatomical local frame before interaction rotates it.
        currentHandle.root.worldToLocal(modelBounds.min);
        currentHandle.root.worldToLocal(modelBounds.max);
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

      let lastWidth = 0, lastHeight = 0;
      function resize() {
        if (!renderer) return;
        const width = Math.max(1, stableCanvas.clientWidth);
        const height = Math.max(1, stableCanvas.clientHeight);
        if (width === lastWidth && height === lastHeight) return;
        lastWidth = width; lastHeight = height;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (currentHandle) {
          scene.updateMatrixWorld(true);
          const focusedObjects = focusedId ? currentHandle.structures.get(focusedId) : undefined;
          const contextObjects = framingStructureIdsRef.current?.flatMap(id => currentHandle?.structures.get(id) ?? []);
          const objects = focusedObjects?.length ? focusedObjects : contextObjects?.length ? contextObjects : [currentHandle.root];
          if (flight) flight = refitHelpers.refitCameraFlight(objects, camera, orbitTarget, flight, performance.now());
          else {
            const pose = refitHelpers.refitCameraPose(objects, camera, camera.position, orbitTarget);
            camera.position.copy(pose.position);
            camera.lookAt(orbitTarget);
          }
        }
      }

      function updateLabels() {
        if (!currentHandle || !showLabelsRef.current) return;
        for (const [id, label] of labelElements) {
          if (hiddenIds.has(id) || (labelModeRef.current === "active" && id !== focusedId && id !== hoveredId)) {
            label.hidden = true;
            continue;
          }
          const objects = currentHandle.structures.get(id) ?? [];
          if (!objects.some(object=>object.visible)) { label.hidden = true; continue; }
          box.makeEmpty();
          for (const object of objects) box.expandByObject(object, true);
          if (box.isEmpty()) {
            label.hidden = true;
            continue;
          }
          if (!boxSurvivesSlice(box)) {
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

      function structureAt(clientX: number, clientY: number): string | null {
        if (!currentHandle || !pickEnabledRef.current) return null;
        const bounds = stableCanvas.getBoundingClientRect();
        if (clientX < bounds.left || clientX > bounds.right || clientY < bounds.top || clientY > bounds.bottom || !bounds.width || !bounds.height) return null;
        pointer.set(
          ((clientX - bounds.left) / bounds.width) * 2 - 1,
          -((clientY - bounds.top) / bounds.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        // Skip hidden structures: three's raycaster ignores `.visible`, so a peeled-away mesh in
        // front must not steal the click — fall through to the first VISIBLE structure behind it.
        const hit = raycaster.intersectObject(currentHandle.root, true).find((intersection) => {
          const candidateId = intersection.object.userData.structureId;
          let visible = true;
          for (let node: import("three").Object3D | null = intersection.object; node; node=node.parent) if (!node.visible) { visible=false;break; }
          return typeof candidateId === "string"
            && visible
            && (sliceState.axis === "off" || clipPlane.distanceToPoint(intersection.point) >= -0.0001);
        });
        const structureId = hit?.object.userData.structureId;
        if (typeof structureId !== "string") return null;
        const candidates = candidateIdsRef.current;
        if ((!candidates?.length || candidates.includes(structureId)) && !hiddenIds.has(structureId)) return structureId;
        // Resolve aggregate target aliases from the exact clicked geometry, not its name.
        const matches = (candidates ?? [...currentHandle.structures.keys()]).filter(id => !hiddenIds.has(id) && (currentHandle?.structures.get(id) ?? []).some(object => object === hit?.object));
        return matches.length === 1 ? matches[0] : hiddenIds.has(structureId) ? null : structureId;
      }

      function pickAt(clientX: number, clientY: number) {
        const structureId = structureAt(clientX, clientY);
        if (!structureId) return;
        if (focusOnPickRef.current) focusStructure(structureId);
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
        if (!drag) { hoveredId = structureAt(event.clientX, event.clientY); return; }
        if (!drag || drag.pointerId !== event.pointerId || !currentHandle) return;
        if (flight) {
          camera.position.copy(flight.toPosition);
          orbitTarget.copy(flight.toTarget);
          flight = null;
        }
        const deltaX = event.clientX - drag.lastX;
        const deltaY = event.clientY - drag.lastY;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true;
        cameraHelpers.orbitCamera(camera, orbitTarget, deltaX, deltaY);
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

      function onPointerLeave() { hoveredId = null; }
      function onPointerCancel(event: PointerEvent) {
        if (drag?.pointerId !== event.pointerId) return;
        drag = null; stableCanvas.classList.remove("is-dragging");
        if (stableCanvas.hasPointerCapture(event.pointerId)) stableCanvas.releasePointerCapture(event.pointerId);
      }
      function onKeyDown(event: KeyboardEvent) {
        const directions: Record<string, [number,number]> = {ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]};
        const delta = directions[event.key];
        if (!delta) return;
        event.preventDefault();
        if(flight){camera.position.copy(flight.toPosition);orbitTarget.copy(flight.toTarget);flight=null;}
        cameraHelpers.orbitCamera(camera,orbitTarget,...delta); lastActivity=performance.now();
      }

      function onWheel(event: WheelEvent) {
        event.preventDefault();
        if (flight) {
          camera.position.copy(flight.toPosition);
          orbitTarget.copy(flight.toTarget);
          flight = null;
        }
        const offset = camera.position.clone().sub(orbitTarget);
        const distance = THREE.MathUtils.clamp(offset.length() * Math.exp(event.deltaY * 0.001), 0.025, 20);
        camera.position.copy(orbitTarget).add(offset.setLength(distance));
        lastActivity = performance.now();
      }

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerCancel);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      canvas.addEventListener("pointerleave", onPointerLeave);
      canvas.addEventListener("keydown", onKeyDown);
      removeEvents = () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerCancel);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("keydown", onKeyDown);
        for (const { overlay } of focusOutlines) (overlay.material as import("three").Material).dispose();
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      resize();

      function animate(now: number) {
        if (cancelled || !renderer) return;
        const elapsed = Math.min(50, now - lastFrame);
        lastFrame = now;
        if (flight) {
          const progress = THREE.MathUtils.clamp((now - flight.startedAt) / (flight.durationMs ?? 850), 0, 1);
          const eased = 1 - (1 - progress) ** 3;
          camera.position.lerpVectors(flight.fromPosition, flight.toPosition, eased);
          orbitTarget.lerpVectors(flight.fromTarget, flight.toTarget, eased);
          if (progress === 1) flight = null;
        } else if (currentHandle && autoOrbitRef.current && !drag && now - lastActivity > 700 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          cameraHelpers.orbitCamera(camera, orbitTarget, elapsed * 0.006, 0);
        }
        camera.lookAt(orbitTarget);
        scene.updateMatrixWorld(true);
        for (const { source, overlay } of focusOutlines) { overlay.matrix.copy(source.matrixWorld); overlay.visible = source.visible; }
        updateSlicePlane();
        updateLabels();
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      }

      runtimeRef.current = {
        pickAtPoint: structureAt,
        focusStructure,
        clearFocus,
        setModule(nextModelKey) {
          queuedModelRef.current = nextModelKey;
          queuedFocusRef.current = null;
          void setModule(nextModelKey).catch(() => setStatus("Model unavailable. Use the 2D source figure or choose another region."));
        },
        setPickEnabled,
        setShowLabels,
        setHiddenStructures,
        setSlice,
      };
      setPickEnabled(pickEnabledRef.current);
      setShowLabels(showLabelsRef.current);
      setSlice(sliceStateRef.current.axis, sliceStateRef.current.position, sliceStateRef.current.flipped);
      animationFrame = requestAnimationFrame(animate);
      await setModule(queuedModelRef.current);
    }

    void initialize().catch(() => {
      if (!cancelled && statusRef.current) statusRef.current.textContent = "Model unavailable. Use the 2D source figure or choose another region.";
    });
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

  const changeSliceAxis = (axis: SliceAxis) => {
    setSliceAxis(axis);
    if (axis === "off") {
      setSlicePosition(0);
      setSliceFlipped(false);
    }
  };

  const resetSlice = () => {
    setSliceAxis("off");
    setSlicePosition(0);
    setSliceFlipped(false);
  };

  return (
    <div className={`anatomy3d-stage ${className}`.trim()}>
      <canvas ref={canvasRef} className="anatomy3d-canvas" tabIndex={0} aria-label="Interactive 3D anatomy model. Drag or use arrow keys to orbit; scroll to zoom." />
      <div ref={labelsLayerRef} className="anatomy3d-labels" aria-hidden="true" />
      <p ref={statusRef} className="anatomy3d-status" role="status">Loading anatomy model…</p>
      <div className="anatomy3d-clarity" aria-label="Model clarity">
        <button type="button" aria-pressed={surfaceMode === "xray"} onClick={() => setSurfaceMode(mode => mode === "solid" ? "xray" : "solid")}>{surfaceMode === "solid" ? "Solid · X-ray off" : "X-ray on"}</button>
        {focusStructureId && <><button type="button" aria-pressed={isolated} onClick={() => setIsolated(value => !value)}>{isolated ? "Show context" : "Isolate target"}</button><button type="button" onClick={() => runtimeRef.current?.focusStructure(focusStructureId)}>Center target</button></>}
        <button type="button" aria-pressed={autoOrbit} onClick={() => setAutoOrbit(value => !value)}>{autoOrbit ? "Pause orbit" : "Auto orbit"}</button>
        <button type="button" aria-pressed={showCovers} onClick={()=>setShowCovers(value=>!value)}>{showCovers ? "Hide coverings" : "Show coverings"}</button>
      </div>
      <div className="anatomy3d-slice-controls" aria-label="Anatomical section controls" hidden={!controlsVisible}>
        <div className="anatomy3d-slice-axis" role="group" aria-label="Section plane">
          <span>Section</span>
          {(["off", "sagittal", "coronal", "transverse"] as const).map((axis) => (
            <button
              type="button"
              key={axis}
              className={sliceAxis === axis ? "active" : ""}
              aria-pressed={sliceAxis === axis}
              onClick={() => changeSliceAxis(axis)}
            >
              {axis === "off" ? "Off" : axis.slice(0, 3)}
            </button>
          ))}
        </div>
        {sliceAxis !== "off" && (
          <div className="anatomy3d-slice-depth">
            <label htmlFor={`anatomy-slice-${modelKey}`}>
              <span>{sliceAxis} depth</span>
              <input
                id={`anatomy-slice-${modelKey}`}
                type="range"
                min="-100"
                max="100"
                value={slicePosition}
                onChange={(event) => setSlicePosition(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              className={sliceFlipped ? "active" : ""}
              aria-pressed={sliceFlipped}
              onClick={() => setSliceFlipped((current) => !current)}
            >
              Flip side
            </button>
            <button type="button" onClick={resetSlice}>Reset</button>
          </div>
        )}
      </div>
      {controlsVisible && <p className="anatomy3d-viewer-hint">Drag to rotate · Scroll to zoom · Slice in anatomical planes{pickEnabled ? " · Click a structure" : ""}</p>}
      {modelKey.includes("thoracic-wall") && <p className="anatomy3d-asset-credit">Cartilage: BodyParts3D / DBCLS · <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/" target="_blank" rel="noreferrer">CC BY-SA 2.1 JP</a> · <a href="/anatomy3d/cvs/costal-cartilages.provenance.json" target="_blank" rel="noreferrer">Aligned source meshes</a></p>}
    </div>
  );
});

AnatomyViewer.displayName = "AnatomyViewer";

export default AnatomyViewer;
