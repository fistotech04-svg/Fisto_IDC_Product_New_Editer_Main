import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

// Patch Three.js background shaders from ShaderChunk to smoothly mingle the HDRI with the studio gray background color (#393939)
// and apply the user's Reflection slider to the HDRI in real-time.
const bgPatchGlsl = /* glsl */`
  // backgroundIntensity encodes opacity (integer: 0..100) and reflection (fractional: 0.0..0.3 -> 0.0..3.0)
  float bgOpacity = clamp( floor( backgroundIntensity ) / 100.0, 0.0, 1.0 );
  float bgReflection = max( 0.0, fract( backgroundIntensity ) * 10.0 );

  // Apply Reflection slider to HDRI radiance in the world
  texColor.rgb *= bgReflection;

  // #393939 in linear sRGB space
  vec3 studioGray = vec3( 0.053828, 0.053828, 0.053828 );
  texColor.rgb = mix( studioGray, texColor.rgb, bgOpacity );
`;

if (THREE.ShaderLib.backgroundCube && THREE.ShaderChunk.backgroundCube_frag) {
  THREE.ShaderLib.backgroundCube.fragmentShader = THREE.ShaderChunk.backgroundCube_frag.replace(
    'texColor.rgb *= backgroundIntensity;',
    bgPatchGlsl
  );
}

if (THREE.ShaderLib.background && THREE.ShaderChunk.background_frag) {
  THREE.ShaderLib.background.fragmentShader = THREE.ShaderChunk.background_frag.replace(
    'texColor.rgb *= backgroundIntensity;',
    bgPatchGlsl
  );
}

// Safely restores skeleton bones to bind pose without the Three.js Skeleton.pose() root bone multiplication bug
export function safelyRestoreSkeletonBindPose(skeleton) {
  if (!skeleton || !Array.isArray(skeleton.bones) || !skeleton.boneInverses) return;
  for (let i = 0; i < skeleton.bones.length; i++) {
    const bone = skeleton.bones[i];
    const inv = skeleton.boneInverses[i];
    if (bone && inv) {
      bone.matrixWorld.copy(inv).invert();
    }
  }
  for (let i = 0; i < skeleton.bones.length; i++) {
    const bone = skeleton.bones[i];
    if (!bone) continue;
    if (bone.parent) {
      bone.matrix.copy(bone.parent.matrixWorld).invert().multiply(bone.matrixWorld);
    } else {
      bone.matrix.copy(bone.matrixWorld);
    }
    bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
  }
}

// Controller to ensure environment lighting, background opacity (mingled with gray color), blur, and rotation
// update in real-time across every frame so drei re-renders cannot override user settings.
export function SceneEnvironmentController({ envRotation = 0, worldOpacity = 0, worldBlur = 0, reflection = 50, isCapturing = false, isCameraTab = false, customBgColor = null }) {
  const { scene } = useThree();
  const rotRef = useRef(0);

  // Keep the ref current every render so useFrame always reads the latest value
  rotRef.current = (envRotation || 0) * (Math.PI / 180);

  // Apply immediately on mount and whenever properties change
  useEffect(() => {
    if (!scene) return;
    const rad = rotRef.current;
    if (scene.environmentRotation) {
      scene.environmentRotation.set(0, rad, 0);
    } else {
      scene.environmentRotation = new THREE.Euler(0, rad, 0);
    }
    if (scene.backgroundRotation) {
      scene.backgroundRotation.set(0, rad, 0);
    } else {
      scene.backgroundRotation = new THREE.Euler(0, rad, 0);
    }
    // Force background mesh material recompile if background texture was already assigned
    if (scene.background && scene.background.isTexture) {
      scene.background.version++;
    }
  }, [scene, envRotation]);

  // Enforce rotation, reflection, blur, and opacity every frame so drei re-renders cannot override it
  useFrame(() => {
    if (!scene) return;

    if (isCapturing || isCameraTab) {
      if (scene.background) scene.background = null;
      return;
    }

    if (customBgColor) {
      if (!scene.background || !scene.background.isColor || scene.background.getHexString() !== new THREE.Color(customBgColor).getHexString()) {
        scene.background = new THREE.Color(customBgColor);
      }
      return;
    }

    const rad = rotRef.current;
    if (scene.environmentRotation) {
      if (scene.environmentRotation.y !== rad) {
        scene.environmentRotation.set(0, rad, 0);
      }
    } else {
      scene.environmentRotation = new THREE.Euler(0, rad, 0);
    }
    if (scene.backgroundRotation && scene.backgroundRotation.y !== rad) {
      scene.backgroundRotation.set(0, rad, 0);
    }

    // Dynamic environment reflection intensity from Reflection slider
    const reflVal = reflection !== undefined ? reflection : 50;
    const targetEnvIntensity = reflVal <= 50 ? (reflVal / 50) : 1.0 + ((reflVal - 50) / 50) * 2.0;
    if (scene.environmentIntensity !== undefined && scene.environmentIntensity !== targetEnvIntensity) {
      scene.environmentIntensity = targetEnvIntensity;
    }

    // Dynamic background opacity & reflection (mingles smoothly with #393939 gray color and scales HDRI reflection)
    const targetOpacity = Math.max(0, Math.min(100, Math.round(worldOpacity ?? 0)));
    // Encode: integer part is opacity (0..100), fractional part is reflection / 10.0 (0.0..0.3)
    const encodedBgIntensity = targetOpacity + (targetEnvIntensity / 10.0);
    if (scene.backgroundIntensity !== encodedBgIntensity) {
      scene.backgroundIntensity = encodedBgIntensity;
    }

    // Dynamic background blur
    const targetBlur = Math.max(0, Math.min(1, (worldBlur ?? 0) / 100));
    if (scene.backgroundBlurriness !== targetBlur) {
      scene.backgroundBlurriness = targetBlur;
    }
  });

  return null;
}

// DirectionalSunLight ensures shadow updates dynamically with smooth, responsive softness and color/intensity
export function DirectionalSunLight({
  position,
  specular = 50,
  softness = 50,
  color = "#ffffff",
  intensity = 100,
  shadowDensity = 100
}) {
  const lightRef = useRef();
  const targetRef = useRef();

  // Dynamic shadow radius: scales from 1 (sharp, clean edge) to 28 (wide, soft blur)
  const shadowSoftRadius = 1 + ((softness ?? 50) / 100) * 27;

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  useFrame(() => {
    if (lightRef.current) {
      if (targetRef.current && lightRef.current.target !== targetRef.current) {
        lightRef.current.target = targetRef.current;
      }
      if (lightRef.current.shadow) {
        if (lightRef.current.shadow.radius !== shadowSoftRadius) {
          lightRef.current.shadow.radius = shadowSoftRadius;
          lightRef.current.shadow.needsUpdate = true;
        }
      }
    }
  });

  const baseMultiplier = (intensity ?? 100) / 100;
  const specFactor = 1.8 + ((specular ?? 50) / 100) * 0.8;
  const computedIntensity = specFactor * baseMultiplier;

  return (
    <>
      <object3D ref={targetRef} position={[0, 0, 0]} />
      <directionalLight
        ref={lightRef}
        position={position}
        color={color || "#ffffff"}
        intensity={computedIntensity}
        castShadow={(shadowDensity ?? 100) > 0}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
        shadow-radius={shadowSoftRadius}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.1}
        shadow-camera-far={80}
      />
    </>
  );
}
