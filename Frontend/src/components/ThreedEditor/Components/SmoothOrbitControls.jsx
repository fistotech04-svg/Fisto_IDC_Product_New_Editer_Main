import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/**
 * SmoothOrbitControls
 * Provides ultra-smooth 60-120fps camera rotation with natural inertial coasting / momentum,
 * custom Auto-Rotate supporting specific Axis (X, Y, Z) and Angle Range limits,
 * and intelligent boundary protection to prevent zooming inside the 3D model.
 */
const SmoothOrbitControls = React.forwardRef(({
  autoRotate = false,
  autoRotateSpeed = 2.0,
  autoRotateAxis = "X",
  autoRotateRange = 360,
  dampingFactor = 0.08,
  momentumFriction = 0.95,
  rotateSpeed = 1.0,
  minDistance = 1.4,
  maxDistance = 25,
  sceneWrapperRef,
  navMode = "orbit",
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

  // Auto-rotate oscillation / tracking refs
  const autoRotateDirRef = useRef(1);
  const baseThetaRef = useRef(null);
  const basePhiRef = useRef(null);
  const accumAngleRef = useRef(0);

  // Reset base angles whenever autoRotate is toggled or axis/range changes
  useEffect(() => {
    baseThetaRef.current = null;
    basePhiRef.current = null;
    accumAngleRef.current = 0;
  }, [autoRotate, autoRotateAxis, autoRotateRange]);

  // 1. Pointer Event Handlers for Velocity Tracking
  useEffect(() => {
    if (!domElement) return;

    const handlePointerDown = (e) => {
      // Zero out any existing coasting when user touches down
      isCoastingRef.current = false;
      velocityRef.current = { x: 0, y: 0 };
      recentDeltasRef.current = [];

      // Reset auto-rotate base reference so it resumes smoothly from where user leaves it
      baseThetaRef.current = null;
      basePhiRef.current = null;

      // If pan mode is active, do not track rotational momentum
      if (navMode === "pan") return;

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

      recentDeltasRef.current.push({ dx, dy, dt, time: now });
      // Keep only recent events (last 100ms)
      while (recentDeltasRef.current.length > 0 && now - recentDeltasRef.current[0].time > 100) {
        recentDeltasRef.current.shift();
      }

      lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    };

    const handlePointerUp = () => {
      if (!isInteractingRef.current) return;
      isInteractingRef.current = false;

      // Calculate release velocity
      if (recentDeltasRef.current.length > 1) {
        let totalDx = 0;
        let totalDy = 0;
        let totalDt = 0;
        for (const item of recentDeltasRef.current) {
          totalDx += item.dx;
          totalDy += item.dy;
          totalDt += item.dt;
        }

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
  }, [domElement, rotateSpeed, navMode]);

  // Momentum Coasting & Custom Multi-Axis / Limited-Range AutoRotate in useFrame
  useFrame((state, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl || typeof ctrl.getAzimuthalAngle !== "function") return;

    // A. Custom Auto-Rotate with Axis Selection & Range Constraints
    if (autoRotate && !isInteractingRef.current) {
      isCoastingRef.current = false;
      const speedFactor = (autoRotateSpeed || 2.0) * 0.5;
      const radPerSec = speedFactor * (Math.PI / 180) * 30;
      const step = radPerSec * delta * autoRotateDirRef.current;

      const rangeDeg = Number(autoRotateRange) || 360;
      const maxHalfRad = ((Math.min(360, Math.max(15, rangeDeg))) * (Math.PI / 180)) / 2;
      const isFull360 = rangeDeg >= 360;

      const curTheta = ctrl.getAzimuthalAngle();
      const curPhi = ctrl.getPolarAngle();

      if (baseThetaRef.current === null) baseThetaRef.current = curTheta;
      if (basePhiRef.current === null) basePhiRef.current = curPhi;

      const target = ctrl.target || new THREE.Vector3(0, 0, 0);
      const camera = state.camera;
      const axis = (autoRotateAxis || "Y").toUpperCase();

      if (axis === "Y") {
        // Standard Horizontal Azimuthal Orbit around Y-axis
        if (isFull360) {
          ctrl.setAzimuthalAngle(curTheta - Math.abs(radPerSec * delta));
        } else {
          let nextTheta = curTheta - step;
          const diff = nextTheta - baseThetaRef.current;
          if (Math.abs(diff) >= maxHalfRad) {
            autoRotateDirRef.current *= -1;
            nextTheta = baseThetaRef.current + Math.sign(diff) * maxHalfRad;
          }
          ctrl.setAzimuthalAngle(nextTheta);
        }
      } else {
        // Precise 3D Orbital rotation around X or Z Cartesian World Axes
        const rotAxis = axis === "X" 
          ? new THREE.Vector3(1, 0, 0) 
          : new THREE.Vector3(0, 0, 1);

        // Check range limits if < 360
        if (!isFull360) {
          accumAngleRef.current += step;
          if (Math.abs(accumAngleRef.current) >= maxHalfRad) {
            autoRotateDirRef.current *= -1;
            accumAngleRef.current = Math.sign(accumAngleRef.current) * maxHalfRad;
          }
        }

        const angleDelta = isFull360 ? Math.abs(radPerSec * delta) : step;
        
        // Rotate camera position around target along chosen axis
        const offset = camera.position.clone().sub(target);
        offset.applyAxisAngle(rotAxis, angleDelta);
        camera.position.copy(target).add(offset);
        
        // Maintain camera up vector stability
        if (axis === "X" || axis === "Z") {
          camera.up.applyAxisAngle(rotAxis, angleDelta);
        }
        camera.lookAt(target);
      }

      ctrl.update();
      return;
    }

    // B. Momentum Coasting
    if (!isCoastingRef.current || isInteractingRef.current) return;

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

    ctrl.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={false}
      enableDamping={true}
      dampingFactor={dampingFactor}
      rotateSpeed={rotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      mouseButtons={{
        LEFT: navMode === "pan" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: navMode === "pan" ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN
      }}
      onChange={onChange}
      onStart={onStart}
      onEnd={onEnd}
      {...props}
    />
  );
});

export default SmoothOrbitControls;
