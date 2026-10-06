import React, { useState, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { GizmoHelper, useGizmoContext } from "@react-three/drei";

// --- Ultra-Sharp 512x512 Candy Gloss Texture Generator ---
function makeCandySphereTexture(theme, letter = "") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // 1. Base Circular Clip
  ctx.beginPath();
  ctx.arc(256, 256, 236, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // 2. 3D Spherical Radial Gradient (Light from Top-Right)
  const grad = ctx.createRadialGradient(168, 144, 20, 256, 256, 240);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.16, theme.highlight);
  grad.addColorStop(0.62, theme.base);
  grad.addColorStop(1, theme.dark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // 3. Primary Curved Glass Specular Highlight (Top-Right)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(228, 136, 112, 52, -Math.PI / 4.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.fill();
  ctx.restore();

  // 4. Secondary Specular Dot
  ctx.beginPath();
  ctx.arc(150, 190, 16, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.fill();

  // 5. Soft Bottom-Left Bounce Reflection
  const bounceGrad = ctx.createRadialGradient(256, 430, 20, 256, 430, 120);
  bounceGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
  bounceGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bounceGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 236, 0, Math.PI * 2);
  ctx.fill();

  // 6. Bold Embossed 3D White Letter
  if (letter) {
    ctx.font = "900 270px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Ambient drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillText(letter, 256, 282);

    // Crisp white face
    ctx.fillStyle = "#ffffff";
    ctx.fillText(letter, 256, 274);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --- Interactive Axis Head / Bubble Component ---
function CandyAxisHead({
  position,
  texture,
  onClick,
  size = 0.54,
  isNegative = false,
}) {
  const [hovered, setHovered] = useState(false);
  const gl = useThree((state) => state.gl);

  const finalScale = isNegative
    ? (hovered ? 0.36 : 0.3)
    : (hovered ? size * 1.15 : size);

  return (
    <sprite
      position={position}
      scale={finalScale}
      renderOrder={10}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
    >
      <spriteMaterial
        map={texture}
        map-anisotropy={gl?.capabilities?.getMaxAnisotropy?.() || 1}
        transparent
        alphaTest={0.05}
        toneMapped={false}
        depthWrite={false}
      />
    </sprite>
  );
}

// --- Custom 6-Axis 3D Viewport Navigation Gizmo ---
function CustomGizmoView() {
  const { tweenCamera } = useGizmoContext();
  const [centerHovered, setCenterHovered] = useState(false);

  // High-Resolution Themes for All 6 Axes
  const textures = useMemo(() => ({
    // Positive Axes (with Embossed Letters)
    xPos: makeCandySphereTexture({ highlight: "#ff6b7d", base: "#ff1e38", dark: "#9b0c20" }, "X"),
    yPos: makeCandySphereTexture({ highlight: "#4ade80", base: "#00c81e", dark: "#065f1e" }, "Y"),
    zPos: makeCandySphereTexture({ highlight: "#38bdf8", base: "#0084ff", dark: "#075985" }, "Z"),
    // Negative Axes (Secondary Spheres)
    xNeg: makeCandySphereTexture({ highlight: "#ff8594", base: "#ef233c", dark: "#7f0917" }, ""),
    yNeg: makeCandySphereTexture({ highlight: "#6ee7b7", base: "#10b981", dark: "#064e3b" }, ""),
    zNeg: makeCandySphereTexture({ highlight: "#7dd3fc", base: "#0284c7", dark: "#0c4a6e" }, ""),
  }), []);

  const snapTo = (directionVector) => {
    if (tweenCamera) {
      tweenCamera(directionVector);
    }
  };

  return (
    <group scale={52.7}>
      {/* â”€â”€ 1. Metallic Center Pivot Cube (Click to Reset to Isometric View) â”€â”€ */}
      <mesh
        scale={centerHovered ? [0.36, 0.36, 0.36] : [0.3, 0.3, 0.3]}
        renderOrder={5}
        onPointerOver={(e) => {
          e.stopPropagation();
          setCenterHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setCenterHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          snapTo(new THREE.Vector3(1, 1, 1).normalize());
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={centerHovered ? "#ffffff" : "#cbd5e1"}
          toneMapped={false}
        />
      </mesh>

      {/* â”€â”€ 2. Outer Thin Metallic Ring (Rendered Behind Spheres) â”€â”€ */}
      <mesh rotation={[0, 0, 0]} renderOrder={-1}>
        <torusGeometry args={[0.72, 0.012, 16, 64]} />
        <meshBasicMaterial
          color="#94a3b8"
          transparent
          opacity={0.55}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* â”€â”€ 3. X-Axis (Red: Right +X & Left -X) â”€â”€ */}
      {/* +X Stem */}
      <mesh position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 2]} renderOrder={1}>
        <cylinderGeometry args={[0.03, 0.03, 0.52, 16]} />
        <meshBasicMaterial color="#ff1e38" toneMapped={false} />
      </mesh>
      {/* +X Head (Right) */}
      <CandyAxisHead
        position={[0.86, 0, 0]}
        texture={textures.xPos}
        onClick={() => snapTo(new THREE.Vector3(1, 0, 0))}
      />
      {/* -X Stem */}
      <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={1}>
        <cylinderGeometry args={[0.022, 0.022, 0.52, 16]} />
        <meshBasicMaterial color="#ef233c" toneMapped={false} />
      </mesh>
      {/* -X Negative Dot (Left) */}
      <CandyAxisHead
        position={[-0.86, 0, 0]}
        texture={textures.xNeg}
        isNegative
        onClick={() => snapTo(new THREE.Vector3(-1, 0, 0))}
      />

      {/* â”€â”€ 4. Y-Axis (Green: Forward +Y & Back -Y) â”€â”€ */}
      {/* +Y Stem */}
      <mesh position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
        <cylinderGeometry args={[0.03, 0.03, 0.52, 16]} />
        <meshBasicMaterial color="#00c81e" toneMapped={false} />
      </mesh>
      {/* +Y Head (Forward) */}
      <CandyAxisHead
        position={[0, 0, 0.86]}
        texture={textures.yPos}
        onClick={() => snapTo(new THREE.Vector3(0, 0, 1))}
      />
      {/* -Y Stem */}
      <mesh position={[0, 0, -0.42]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <cylinderGeometry args={[0.022, 0.022, 0.52, 16]} />
        <meshBasicMaterial color="#10b981" toneMapped={false} />
      </mesh>
      {/* -Y Negative Dot (Back) */}
      <CandyAxisHead
        position={[0, 0, -0.86]}
        texture={textures.yNeg}
        isNegative
        onClick={() => snapTo(new THREE.Vector3(0, 0, -1))}
      />

      {/* â”€â”€ 5. Z-Axis (Blue: Up +Z & Down -Z) â”€â”€ */}
      {/* +Z Stem */}
      <mesh position={[0, 0.36, 0]} renderOrder={1}>
        <cylinderGeometry args={[0.03, 0.03, 0.42, 16]} />
        <meshBasicMaterial color="#0084ff" toneMapped={false} />
      </mesh>
      {/* +Z Blue Cone Collar under Sphere */}
      <mesh position={[0, 0.6, 0]} renderOrder={2}>
        <coneGeometry args={[0.13, 0.14, 24]} />
        <meshBasicMaterial color="#0084ff" toneMapped={false} />
      </mesh>
      {/* +Z Head (Top) */}
      <CandyAxisHead
        position={[0, 0.86, 0]}
        texture={textures.zPos}
        onClick={() => snapTo(new THREE.Vector3(0, 1, 0))}
      />
      {/* -Z Stem */}
      <mesh position={[0, -0.42, 0]} renderOrder={1}>
        <cylinderGeometry args={[0.022, 0.022, 0.52, 16]} />
        <meshBasicMaterial color="#0284c7" toneMapped={false} />
      </mesh>
      {/* -Z Negative Dot (Bottom) */}
      <CandyAxisHead
        position={[0, -0.86, 0]}
        texture={textures.zNeg}
        isNegative
        onClick={() => snapTo(new THREE.Vector3(0, -1, 0))}
      />
    </group>
  );
}

// --- Animated Top-Level Container ---
export default function AnimatedGizmo({ isTextureOpen, activeTab }) {
  const getTarget = () => {
    if (activeTab === "camera") return [80, 160];
    if (activeTab === "custom") return [90, 90];
    return isTextureOpen ? [130, 265] : [85, 105];
  };

  const [margin, setMargin] = useState(getTarget());

  useFrame((state, delta) => {
    const target = getTarget();
    const dist = Math.sqrt(
      Math.pow(target[0] - margin[0], 2) + Math.pow(target[1] - margin[1], 2)
    );

    if (dist < 1) {
      if (margin[0] !== target[0] || margin[1] !== target[1]) {
        setMargin(target);
      }
      return;
    }

    const speed = 9;
    setMargin([
      margin[0] + (target[0] - margin[0]) * speed * delta,
      margin[1] + (target[1] - margin[1]) * speed * delta,
    ]);
  });

  return (
    <GizmoHelper alignment="bottom-right" margin={margin}>
      <CustomGizmoView />
    </GizmoHelper>
  );
}
