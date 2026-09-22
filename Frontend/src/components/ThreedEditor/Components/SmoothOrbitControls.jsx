import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/**
 * SmoothOrbitControls
 * Provides ultra-smooth 60-120fps camera rotation with natural inertial coasting / momentum,
 * and intelligent boundary protection to prevent zooming inside the 3D model.
 */
const SmoothOrbitControls = React.forwardRef(({
  autoRotate = false,
  dampingFactor = 0.08,
  momentumFriction = 0.95,
  rotateSpeed = 1.0,
  minDistance = 1.4,
  maxDistance = 25,
  sceneWrapperRef,
  onChange,
  onStart,
  onEnd,
  ...props
}, forwardedRef) => {
  const innerRef = useRef(null);
  const controlsRef = forwardedRef || innerRef;

  const gl = useThree((state) => state.gl);
  const domElement = gl?.domElement;

  // Velocity tracking & momentum coasting refs
  const isInteractingRef = useRef(false);
  const isCoastingRef = useRef(false);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const recentDeltasRef = useRef([]);

  // Bounding box tracking for model penetration protection
  const cachedBoxRef = useRef(new THREE.Box3());
  const lastBoxCheckRef = useRef(0);

  // 1. Pointer Event Handlers for Velocity Tracking
  useEffect(() => {
    if (!domElement) return;

    const handlePointerDown = (e) => {
      // Zero out any existing coasting when user touches down
      isCoastingRef.current = false;
      velocityRef.current = { x: 0, y: 0 };
      recentDeltasRef.current = [];

      // Only track left-click (rotate) or single touch
      if (e.pointerType === "mouse" && e.button !== 0) return;

      isInteractingRef.current = true;
      lastPointerRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now()
      };
    };

    const handlePointerMove = (e) => {
      if (!isInteractingRef.current) return;

      const now = performance.now();
      const dt = now - lastPointerRef.current.time;
      if (dt <= 0) return;

      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;

      lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };

      // Keep recent samples within last 65ms for responsive release velocity
      const sample = { dx, dy, dt, time: now };
      recentDeltasRef.current.push(sample);
      const cutoff = now - 65;
      recentDeltasRef.current = recentDeltasRef.current.filter((s) => s.time >= cutoff);
    };

    const handlePointerUp = () => {
      if (!isInteractingRef.current) return;
      isInteractingRef.current = false;

      const now = performance.now();
      // Only recent movements within 65ms count as a flick/swipe
      const validSamples = recentDeltasRef.current.filter((s) => now - s.time < 65);

      if (validSamples.length >= 2) {
        let totalDx = 0;
        let totalDy = 0;
        let totalDt = 0;

        validSamples.forEach((s) => {
          totalDx += s.dx;
          totalDy += s.dy;
          totalDt += s.dt;
        });

        if (totalDt > 5) {
          const clientHeight = domElement.clientHeight || window.innerHeight || 800;
          // Radians per millisecond
          const radFactor = ((2 * Math.PI) / clientHeight) * rotateSpeed;
          const vx = (totalDx / totalDt) * radFactor;
          const vy = (totalDy / totalDt) * radFactor;

          const speed = Math.hypot(vx, vy);
          // Minimum speed threshold to trigger coasting
          if (speed > 0.00015) {
            velocityRef.current = {
              x: Math.max(-0.02, Math.min(0.02, vx)),
              y: Math.max(-0.02, Math.min(0.02, vy))
            };
            isCoastingRef.current = true;
          }
        }
      }

      recentDeltasRef.current = [];
    };

    domElement.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [domElement, rotateSpeed]);

  // 2. Dynamic Boundary Protection & Momentum Coasting Animation in useFrame
  useFrame((state, delta) => {
    const ctrl = controlsRef.current;

    // 1. Dynamic Boundary Protection to prevent camera from zooming inside the model
    if (ctrl && ctrl.target) {
      const now = performance.now();
      if (now - lastBoxCheckRef.current > 120) {
        lastBoxCheckRef.current = now;
        if (sceneWrapperRef?.current && sceneWrapperRef.current.children.length > 0) {
          cachedBoxRef.current.setFromObject(sceneWrapperRef.current);
        }
      }

      const box = cachedBoxRef.current;
      if (box && !box.isEmpty()) {
        const camera = state.camera;
        const target = ctrl.target;

        const dx = camera.position.x - target.x;
        const dy = camera.position.y - target.y;
        const dz = camera.position.z - target.z;
        const curDist = Math.hypot(dx, dy, dz);

        if (curDist > 0.0001) {
          const dirX = dx / curDist;
          const dirY = dy / curDist;
          const dirZ = dz / curDist;

          // Check if target is inside or near the model box
          const distToBox = box.distanceToPoint(target);
          if (distToBox < 0.8) {
            // Target is focused on or near the model
            const clampedX = Math.max(box.min.x, Math.min(box.max.x, target.x));
            const clampedY = Math.max(box.min.y, Math.min(box.max.y, target.y));
            const clampedZ = Math.max(box.min.z, Math.min(box.max.z, target.z));

            let tx = Infinity;
            let ty = Infinity;
            let tz = Infinity;

            if (dirX > 0.00001) tx = (box.max.x - clampedX) / dirX;
            else if (dirX < -0.00001) tx = (box.min.x - clampedX) / dirX;

            if (dirY > 0.00001) ty = (box.max.y - clampedY) / dirY;
            else if (dirY < -0.00001) ty = (box.min.y - clampedY) / dirY;

            if (dirZ > 0.00001) tz = (box.max.z - clampedZ) / dirZ;
            else if (dirZ < -0.00001) tz = (box.min.z - clampedZ) / dirZ;

            const tExit = Math.min(tx, ty, tz);
            const margin = 0.35;
            const dynamicMin = (Number.isFinite(tExit) && tExit > 0)
              ? (tExit + margin)
              : Math.max(minDistance, 1.2);

            ctrl.minDistance = Math.max(minDistance, dynamicMin);

            // Hard barrier: prevent camera from ever being closer than safe minDistance
            if (curDist < ctrl.minDistance) {
              const pushFactor = ctrl.minDistance / curDist;
              camera.position.x = target.x + dx * pushFactor;
              camera.position.y = target.y + dy * pushFactor;
              camera.position.z = target.z + dz * pushFactor;
            }
          } else {
            // User panned far away from the model
            ctrl.minDistance = minDistance;
          }
        }
      } else {
        ctrl.minDistance = minDistance;
      }
    }

    // 2. Momentum Coasting
    // If autoRotate is on or user is currently dragging, don't coast
    if (autoRotate || isInteractingRef.current) {
      isCoastingRef.current = false;
      return;
    }

    if (!isCoastingRef.current) return;
    if (!ctrl || typeof ctrl.getAzimuthalAngle !== "function") return;

    // Frame step in milliseconds (clamped to prevent jumps on tab focus)
    const dtMs = Math.min(32, delta * 1000);
    const stepTheta = velocityRef.current.x * dtMs;
    const stepPhi = velocityRef.current.y * dtMs;

    const curTheta = ctrl.getAzimuthalAngle();
    const curPhi = ctrl.getPolarAngle();

    // Apply rotation
    ctrl.setAzimuthalAngle(curTheta - stepTheta);

    const minPolar = ctrl.minPolarAngle ?? 0.001;
    const maxPolar = ctrl.maxPolarAngle ?? (Math.PI - 0.001);
    const targetPhi = Math.max(minPolar, Math.min(maxPolar, curPhi - stepPhi));
    ctrl.setPolarAngle(targetPhi);

    // Apply smooth exponential friction decay (0.95 per 60hz frame)
    const friction = Math.pow(momentumFriction, delta * 60);
    velocityRef.current.x *= friction;
    velocityRef.current.y *= friction;

    // Graceful stop threshold
    if (Math.hypot(velocityRef.current.x, velocityRef.current.y) < 0.00002) {
      isCoastingRef.current = false;
      velocityRef.current = { x: 0, y: 0 };
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      enableDamping={true}
      dampingFactor={dampingFactor}
      rotateSpeed={rotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      onChange={onChange}
      onStart={onStart}
      onEnd={onEnd}
      {...props}
    />
  );
});

export default SmoothOrbitControls;
