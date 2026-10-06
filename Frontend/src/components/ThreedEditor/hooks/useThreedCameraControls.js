import { useCallback, useRef } from "react";
import * as THREE from "three";

/**
 * Custom hook for camera framing, view angle transitions, and zoom operations.
 */
export function useThreedCameraControls({
  cameraInstanceRef,
  controlsRef,
  glInstanceRef,
  sceneWrapperRef,
  setCameraViewMode,
  setTargetPosition,
  onResetSceneTransforms
}) {
  const cameraAnimFrameRef = useRef(null);
  const latestModelBoundsRef = useRef(null);
  const frameModelFullViewRef = useRef(null);
  const onResetSceneTransformsRef = useRef(onResetSceneTransforms);
  onResetSceneTransformsRef.current = onResetSceneTransforms;

  const frameModelFullView = useCallback((bounds, animate = false) => {
    if (bounds) {
      latestModelBoundsRef.current = bounds;
    }

    const tryFrame = (attemptsLeft = 6) => {
      const camera = cameraInstanceRef.current;
      const controls = controlsRef.current;
      const gl = glInstanceRef.current;

      if (!camera || !controls) {
        if (attemptsLeft > 0) {
          requestAnimationFrame(() => tryFrame(attemptsLeft - 1));
        }
        return;
      }

      // 1. Calculate model center and bounding radius
      let target = new THREE.Vector3(0, 1.0, 0);
      let radius = 2.5;

      let box = new THREE.Box3();
      if (sceneWrapperRef.current) {
        try { sceneWrapperRef.current.updateMatrixWorld(true); } catch (err) { void err; }
        sceneWrapperRef.current.traverse((child) => {
          if ((child.isMesh || child.isSkinnedMesh) && child.geometry) {
            if (!child.geometry.boundingBox) {
              try { child.geometry.computeBoundingBox(); } catch (err) { void err; }
            }
            if (child.geometry.boundingBox) {
              try {
                const geomBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
                if (!geomBox.isEmpty() && isFinite(geomBox.min.x)) {
                  box.union(geomBox);
                }
              } catch (err) { void err; }
            }
          }
        });
      }

            if (!box.isEmpty() && isFinite(box.min.x)) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        target.copy(center);

        // ✅ Tight framing: use half of the largest extent, not the AABB diagonal.
        const maxExtent = Math.max(size.x, size.y, size.z);
        radius = Math.max(0.8, maxExtent / 2);
      } else if (bounds) {
        const h = bounds.height || (bounds.size?.y ? bounds.size.y * (bounds.targetScale || 1) : 2.0);
        const w = bounds.width  || (bounds.size?.x ? bounds.size.x * (bounds.targetScale || 1) : 2.0);
        const d = bounds.depth  || (bounds.size?.z ? bounds.size.z * (bounds.targetScale || 1) : 2.0);
        target.set(0, Math.max(0.2, h / 2), 0);

        // ✅ Same fix here for consistency.
        const maxExtent = Math.max(w, h, d);
        radius = Math.max(0.8, maxExtent / 2);
      }

      // 2. Compute optimal camera framing distance
      const fov = camera.fov || 45;
      const canvasEl = gl?.domElement;
      const aspect = (canvasEl && canvasEl.clientHeight > 0)
        ? (canvasEl.clientWidth / canvasEl.clientHeight)
        : (camera.aspect || 1.6);

      const vFOVRad = THREE.MathUtils.degToRad(fov) / 2;
      const hFOVRad = Math.atan(Math.tan(vFOVRad) * aspect);

      // Frame model tighter and nearer to comfortably occupy the viewport
      const distV = radius / Math.tan(vFOVRad);
      const distH = radius / Math.tan(hFOVRad);
      const fitDistance = Math.max(distV, distH);

      const PADDING = 0.5;
      const distance = Math.max(1.8, Math.min(fitDistance * PADDING, 25));

      // 3. 3/4 elevated perspective
      const phi = THREE.MathUtils.degToRad(66);
      const theta = THREE.MathUtils.degToRad(38);

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const camX = target.x + distance * sinPhi * sinTheta;
      const camY = target.y + distance * cosPhi;
      const camZ = target.z + distance * sinPhi * cosTheta;

      camera.near = Math.min(0.05, distance / 50);
      camera.far = Math.max(1000, distance * 25);
      camera.updateProjectionMatrix();

      if (cameraAnimFrameRef.current) {
        cancelAnimationFrame(cameraAnimFrameRef.current);
        cameraAnimFrameRef.current = null;
      }

      if (!animate) {
        camera.up.set(0, 1, 0);
        controls.target.copy(target);
        camera.position.set(camX, camY, camZ);
        camera.lookAt(target);
        controls.update();
        if (typeof controls.saveState === 'function') {
          controls.saveState();
        }
        setTargetPosition?.({
          x: parseFloat(target.x.toFixed(2)),
          y: parseFloat(target.y.toFixed(2)),
          z: parseFloat(target.z.toFixed(2))
        });
      } else {
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const startUp = camera.up.clone();
        const endUp = new THREE.Vector3(0, 1, 0);
        const endPos = new THREE.Vector3(camX, camY, camZ);
        const endTarget = target.clone();
        const startTime = performance.now();
        const duration = 380; // ms

        const animateStep = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const ease = 1 - Math.pow(1 - progress, 3);

          camera.up.lerpVectors(startUp, endUp, ease).normalize();
          camera.position.lerpVectors(startPos, endPos, ease);
          controls.target.lerpVectors(startTarget, endTarget, ease);
          camera.lookAt(controls.target);
          controls.update();

          if (progress < 1) {
            cameraAnimFrameRef.current = requestAnimationFrame(animateStep);
          } else {
            cameraAnimFrameRef.current = null;
            if (typeof controls.saveState === 'function') {
              controls.saveState();
            }
            setTargetPosition?.({
              x: parseFloat(endTarget.x.toFixed(2)),
              y: parseFloat(endTarget.y.toFixed(2)),
              z: parseFloat(endTarget.z.toFixed(2))
            });
          }
        };
        cameraAnimFrameRef.current = requestAnimationFrame(animateStep);
      }
    };

    tryFrame();
  }, [cameraInstanceRef, controlsRef, glInstanceRef, sceneWrapperRef, setTargetPosition]);

  frameModelFullViewRef.current = frameModelFullView;

  const handleResetView = useCallback(() => {
    if (typeof frameModelFullViewRef.current === 'function') {
      frameModelFullViewRef.current(latestModelBoundsRef.current, true);
    } else if (controlsRef.current) {
      controlsRef.current.reset();
      setTargetPosition?.({ x: 0, y: 0, z: 0 });
    }
    if (typeof onResetSceneTransformsRef.current === 'function') {
      onResetSceneTransformsRef.current();
    }
  }, [controlsRef, setTargetPosition]);

  const handleCameraViewChange = useCallback((mode) => {
    setCameraViewMode?.(
      mode === "perspective" ? "Perspective" :
        mode === "orthographic" ? "Orthographic" :
          mode === "front" ? "Front View" :
            mode === "top" ? "Top View" :
              mode === "right" ? "Right Side View" :
                "Perspective"
    );
    if (mode === "reset") {
      handleResetView();
      return;
    }
    if (controlsRef.current && controlsRef.current.object) {
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.up.set(0, 1, 0);
      }
      const dist = 5.5;
      if (mode === "front") {
        controlsRef.current.object.position.set(0, 0, dist);
      } else if (mode === "top") {
        controlsRef.current.object.position.set(0, dist, 0.001);
      } else if (mode === "right") {
        controlsRef.current.object.position.set(dist, 0, 0);
      } else if (mode === "perspective") {
        controlsRef.current.object.position.set(3.5, 3.2, 5.0);
      }
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [handleResetView, setCameraViewMode, controlsRef, cameraInstanceRef]);

  const handleZoomIn = useCallback(() => {
    if (controlsRef.current && cameraInstanceRef.current) {
      const camera = cameraInstanceRef.current;
      const target = controlsRef.current.target || new THREE.Vector3(0, 0, 0);
      const offset = new THREE.Vector3().subVectors(camera.position, target);
      if (offset.length() > 0.6) {
        camera.position.copy(target).addScaledVector(offset, 0.82);
        controlsRef.current.update();
      }
    }
  }, [controlsRef, cameraInstanceRef]);

  const handleZoomOut = useCallback(() => {
    if (controlsRef.current && cameraInstanceRef.current) {
      const camera = cameraInstanceRef.current;
      const target = controlsRef.current.target || new THREE.Vector3(0, 0, 0);
      const offset = new THREE.Vector3().subVectors(camera.position, target);
      if (offset.length() < 120) {
        camera.position.copy(target).addScaledVector(offset, 1.22);
        controlsRef.current.update();
      }
    }
  }, [controlsRef, cameraInstanceRef]);

  return {
    frameModelFullView,
    frameModelFullViewRef,
    latestModelBoundsRef,
    handleResetView,
    handleCameraViewChange,
    handleZoomIn,
    handleZoomOut
  };
}
