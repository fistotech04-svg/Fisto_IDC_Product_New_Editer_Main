import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import BlenderInfiniteGrid from "./BlenderInfiniteGrid";

/**
 * Procedural texture generators for instant, high-quality, offline floor textures.
 */
function createProceduralTexture(type, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (type === "checkerboard") {
    const size = 64;
    for (let x = 0; x < 512; x += size) {
      for (let y = 0; y < 512; y += size) {
        const isEven = ((x / size) + (y / size)) % 2 === 0;
        ctx.fillStyle = isEven ? "#16161b" : "#24242e";
        ctx.fillRect(x, y, size, size);

        // Subtle grout / tile edge
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, size, size);
      }
    }
  } else if (type === "marble_dark") {
    ctx.fillStyle = "#121215";
    ctx.fillRect(0, 0, 512, 512);

    // Procedural marble veins
    ctx.strokeStyle = "rgba(220, 230, 245, 0.18)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      let sx = Math.random() * 512;
      let sy = Math.random() * 512;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 8; j++) {
        sx += (Math.random() - 0.45) * 120;
        sy += (Math.random() - 0.45) * 120;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  } else if (type === "marble_white") {
    ctx.fillStyle = "#ebeef2";
    ctx.fillRect(0, 0, 512, 512);

    // Subtle soft grey marble veins
    ctx.strokeStyle = "rgba(80, 90, 105, 0.22)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      let sx = Math.random() * 512;
      let sy = Math.random() * 512;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 7; j++) {
        sx += (Math.random() - 0.45) * 110;
        sy += (Math.random() - 0.45) * 110;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  } else if (type === "wood_parquet") {
    ctx.fillStyle = "#3a2517";
    ctx.fillRect(0, 0, 512, 512);

    // Wood planks
    const plankH = 42;
    for (let y = 0; y < 512; y += plankH) {
      const shift = (Math.floor(y / plankH) % 2) * 128;
      for (let x = -128; x < 512 + 128; x += 256) {
        ctx.fillStyle = (x + y) % 3 === 0 ? "#432b1b" : "#382315";
        ctx.fillRect(x + shift, y, 250, plankH - 2);

        // Plank grain stripes
        ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
        for (let g = 0; g < 4; g++) {
          ctx.fillRect(x + shift, y + g * 10, 250, 1.5);
        }
      }
    }
  } else if (type === "carbon_fiber") {
    ctx.fillStyle = "#111113";
    ctx.fillRect(0, 0, 512, 512);

    const s = 16;
    for (let x = 0; x < 512; x += s) {
      for (let y = 0; y < 512; y += s) {
        const diag = ((x / s) + (y / s)) % 2 === 0;
        ctx.fillStyle = diag ? "#1b1b20" : "#0d0d0f";
        ctx.fillRect(x, y, s, s);

        ctx.strokeStyle = diag ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, s, s);
      }
    }
  } else if (type === "cyber_neon") {
    ctx.fillStyle = "#07090f";
    ctx.fillRect(0, 0, 512, 512);

    // Concentric glowing rings
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 10;
    for (let r = 40; r < 250; r += 45) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cross-axis lines
    ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (type === "checkerboard" || type === "carbon_fiber") {
    texture.repeat.set(12, 12);
  } else if (type === "marble_dark" || type === "marble_white" || type === "wood_parquet") {
    texture.repeat.set(6, 6);
  } else {
    texture.repeat.set(1, 1);
  }
  return texture;
}

/**
 * RadialStudioShader for spotlight pedestal
 */
const RadialStudioShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uCenterColor;
    uniform float uRadius;
    uniform float uFalloff;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      float dist = length(vWorldPosition.xz);
      float alpha = 1.0 - smoothstep(uRadius * (1.0 - uFalloff), uRadius, dist);
      float centerGlow = 1.0 - smoothstep(0.0, uRadius * 0.7, dist);
      vec3 finalColor = mix(uColor, uCenterColor, centerGlow * 0.45);
      gl_FragColor = vec4(finalColor, alpha * 0.95);
    }
  `
};

/**
 * LightboxShader for illuminated under-lit glass platform
 */
const LightboxShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    varying vec2 vUv;

    void main() {
      vec2 d = abs(vUv - 0.5) * 2.0;
      float edgeDist = max(d.x, d.y);
      float border = smoothstep(0.94, 0.98, edgeDist);
      float centerGlow = 1.0 - length(vUv - 0.5) * 1.2;
      centerGlow = clamp(centerGlow, 0.0, 1.0);
      vec3 col = mix(uColor, uGlowColor, centerGlow * 0.4);
      col = mix(col, vec3(1.0), border * 0.7);
      gl_FragColor = vec4(col, 0.95);
    }
  `
};

/**
 * Cyclorama Geometry builder for seamless photo studio cove wall
 */
function createCycGeometry(width = 80, depth = 50, height = 30, curveRadius = 10, segments = 32) {
  const curve = new THREE.CurvePath();
  const shape = new THREE.Shape();
  // We can build a simple curved cyc plane with plane geometry vertex displacement
  const geo = new THREE.PlaneGeometry(width, depth + height, 40, 40);
  const pos = geo.attributes.position;
  const halfD = depth / 2;

  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i);
    if (y > 0) {
      // Curve upwards into backdrop wall
      const t = y / (height);
      const angle = (Math.PI / 2) * Math.min(1, t);
      pos.setY(i, Math.sin(angle) * height);
      pos.setZ(i, -Math.cos(angle) * curveRadius + curveRadius);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * FloorRenderer: Complete 15-Preset Dynamic Floor System
 */
export default function FloorRenderer({
  floorType = "grid",
  floorColor = "#1a1a20",
  floorRoughness = 20,
  floorReflectivity = 65,
  floorBlur = 50,
  showGridLines = true,
  showAxis = true,
  shadowDensity = 50,
  isCapturing = false,
  activeLeftTab = "model",
  onFloorClick
}) {
  const currentFloorType = floorType || "grid";

  const shadowOpacity = Math.min(
    1,
    Math.max(0, ((shadowDensity ?? 50) / 100) * 0.7)
  );

  // Procedural texture caching
  const proceduralMap = useMemo(() => {
    if (["checkerboard", "marble_dark", "marble_white", "wood_parquet", "carbon_fiber", "cyber_neon"].includes(currentFloorType)) {
      return createProceduralTexture(currentFloorType);
    }
    return null;
  }, [currentFloorType]);

  const studioUniforms = useMemo(() => {
    const baseCol = new THREE.Color(floorColor || "#18181f");
    const centerCol = baseCol.clone().offsetHSL(0, 0, 0.18);
    return {
      uColor: { value: baseCol },
      uCenterColor: { value: centerCol },
      uRadius: { value: 26.0 },
      uFalloff: { value: 0.65 }
    };
  }, [floorColor]);

  const lightboxUniforms = useMemo(() => {
    return {
      uColor: { value: new THREE.Color(floorColor || "#f0f4f8") },
      uGlowColor: { value: new THREE.Color("#ffffff") }
    };
  }, [floorColor]);

  const cycGeometry = useMemo(() => {
    return createCycGeometry(90, 60, 35, 12, 40);
  }, []);

  const handleClick = (e) => {
    if (onFloorClick) {
      onFloorClick(e);
    }
  };

  const isGlassLike = [
    "glass",
    "glass_dark",
    "glass_clear",
    "frosted_glass",
    "checkerboard",
    "marble_dark",
    "marble_white",
    "wood_parquet",
    "carbon_fiber",
    "cyber_neon"
  ].includes(currentFloorType);

  return (
    <group name="FloorSystem">
      {/* ─── 1. INFINITE GRID (Active in 'grid' mode, or as toggle overlay) ─── */}
      {currentFloorType === "grid" && !isCapturing && activeLeftTab !== "camera" && (
        <BlenderInfiniteGrid
          showGridLines={showGridLines}
          showAxis={showAxis}
          y={0.0005}
        />
      )}

      {/* ─── 2. REFLECTIVE MESH FLOORS (Glass, Crystals, Marble, Checkerboard, Wood, Carbon, Cyber) ─── */}
      {isGlassLike && activeLeftTab !== "camera" && (
        <>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.002, 0]}
            receiveShadow
            onClick={handleClick}
          >
            <planeGeometry args={[120, 120]} />
            <MeshReflectorMaterial
              map={proceduralMap || null}
              blur={[
                Math.round(100 + ((floorBlur ?? 50) / 100) * 400),
                Math.round(30 + ((floorBlur ?? 50) / 100) * 140)
              ]}
              resolution={1024}
              mirror={Math.max(0.05, Math.min(0.98, ((floorReflectivity ?? 65) / 100)))}
              mixBlur={1}
              mixStrength={1.2 + ((floorReflectivity ?? 65) / 100) * 0.8}
              roughness={Math.max(0.02, Math.min(0.95, ((floorRoughness ?? 20) / 100) * 0.6))}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color={
                currentFloorType === "marble_white"
                  ? "#f3f4f6"
                  : currentFloorType === "wood_parquet"
                  ? "#523722"
                  : (floorColor || "#141418")
              }
              metalness={currentFloorType === "cyber_neon" ? 0.6 : 0.3}
            />
          </mesh>

          {/* Grid overlay toggle */}
          {showGridLines && currentFloorType !== "grid" && !isCapturing && activeLeftTab !== "camera" && (
            <BlenderInfiniteGrid
              showGridLines={showGridLines}
              showAxis={showAxis}
              y={0.001}
            />
          )}
        </>
      )}

      {/* ─── 3. BACKLIT LIGHTBOX PLATFORM ─── */}
      {currentFloorType === "lightbox" && activeLeftTab !== "camera" && (
        <>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.003, 0]}
            receiveShadow
            onClick={handleClick}
          >
            <planeGeometry args={[26, 26]} />
            <shaderMaterial
              vertexShader={LightboxShader.vertexShader}
              fragmentShader={LightboxShader.fragmentShader}
              uniforms={lightboxUniforms}
            />
          </mesh>

          {/* Soft surrounding ground plane */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.005, 0]}
            receiveShadow
          >
            <planeGeometry args={[120, 120]} />
            <meshStandardMaterial color="#0c0d12" roughness={0.9} />
          </mesh>
        </>
      )}

      {/* ─── 4. STUDIO SPOTLIGHT PEDESTAL ─── */}
      {(currentFloorType === "studio" || currentFloorType === "studio_pedestal") && activeLeftTab !== "camera" && (
        <>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.003, 0]}
            receiveShadow
            onClick={handleClick}
          >
            <planeGeometry args={[65, 65]} />
            <shaderMaterial
              vertexShader={RadialStudioShader.vertexShader}
              fragmentShader={RadialStudioShader.fragmentShader}
              uniforms={studioUniforms}
              transparent
              depthWrite={false}
            />
          </mesh>

          {showGridLines && !isCapturing && activeLeftTab !== "camera" && (
            <BlenderInfiniteGrid
              showGridLines={showGridLines}
              showAxis={showAxis}
              y={0.001}
            />
          )}
        </>
      )}

      {/* ─── 5. INFINITE CYCLORAMA COVE (Studio Cyc Wall) ─── */}
      {currentFloorType === "cyclorama" && activeLeftTab !== "camera" && (
        <>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.004, -5]}
            receiveShadow
            geometry={cycGeometry}
            onClick={handleClick}
          >
            <meshStandardMaterial
              color={floorColor || "#232329"}
              roughness={Math.max(0.2, (floorRoughness ?? 60) / 100)}
              metalness={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* ─── 6. SOLID MATTE STUDIO FLOOR / BRUSHED STEEL ─── */}
      {(currentFloorType === "solid" || currentFloorType === "brushed_metal") && activeLeftTab !== "camera" && (
        <>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.003, 0]}
            receiveShadow
            onClick={handleClick}
          >
            <planeGeometry args={[120, 120]} />
            <meshStandardMaterial
              color={floorColor || "#242428"}
              roughness={Math.max(0.1, Math.min(1, ((floorRoughness ?? 80) / 100)))}
              metalness={currentFloorType === "brushed_metal" ? 0.6 : 0.08}
              side={THREE.DoubleSide}
            />
          </mesh>

          {showGridLines && !isCapturing && activeLeftTab !== "camera" && (
            <BlenderInfiniteGrid
              showGridLines={showGridLines}
              showAxis={showAxis}
              y={0.001}
            />
          )}
        </>
      )}

      {/* ─── 7. SHADOW RECEIVER (Active for all modes to ground objects) ─── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.0015, 0]}
        receiveShadow
        onClick={handleClick}
      >
        <planeGeometry args={[500, 500]} />
        <shadowMaterial
          transparent
          opacity={isGlassLike && activeLeftTab !== "camera" ? shadowOpacity * 0.45 : shadowOpacity}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
    </group>
  );
}
