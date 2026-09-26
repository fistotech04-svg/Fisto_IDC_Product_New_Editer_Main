import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { GLTFExporter } from "three-stdlib";
import { OBJExporter } from "three-stdlib";
import { STLExporter } from "three-stdlib";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

// Global cache and shared loader to prevent redundant network requests and decoding
// We use a private LoadingManager to avoid triggering the global useProgress spinner
const globalTextureCache = new Map();
const privateTextureManager = new THREE.LoadingManager();
const sharedTextureLoader = new THREE.TextureLoader(privateTextureManager);
sharedTextureLoader.setCrossOrigin('anonymous');

// Helper to extract a usable image URL/DataURL from a Three.js texture
const getTextureSource = (tex) => {
    if (!tex) return null;
    if (tex.userData?.url) return tex.userData.url;
    if (tex.userData?.__thumbnailUrl) return tex.userData.__thumbnailUrl;
    if (!tex.image) return null;
    const img = tex.image;
    
    // 1. If it's a standard Image/HTMLImageElement with a valid URL or compact data URI
    if (img.src && typeof img.src === 'string') {
        if (img.src.startsWith('http') || img.src.startsWith('blob:')) {
            return img.src;
        }
        if (img.src.startsWith('data:') && img.src.length < 80000) {
            return img.src;
        }
    }

    // 2. Generate a lightweight thumbnail (max 128x128, JPEG) to prevent memory exhaustion and string length overflow
    try {
        const origW = img.width || img.naturalWidth || img.videoWidth || 0;
        const origH = img.height || img.naturalHeight || img.videoHeight || 0;
        if (!origW || !origH) return "existing";

        const maxDim = 128;
        const scale = Math.min(1, maxDim / Math.max(origW, origH));
        const tw = Math.max(1, Math.round(origW * scale));
        const th = Math.max(1, Math.round(origH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) return "existing";

        if (img.data && (img.data instanceof Uint8Array || img.data instanceof Uint8ClampedArray)) {
            // DataTexture / raw pixels: write to offscreen buffer first then scale down
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = origW;
            tempCanvas.height = origH;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                const imgData = tempCtx.createImageData(origW, origH);
                imgData.data.set(img.data);
                tempCtx.putImageData(imgData, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, tw, th);
            }
        } else {
            // ImageBitmap, HTMLCanvasElement, HTMLImageElement
            ctx.drawImage(img, 0, 0, tw, th);
        }

        const thumb = canvas.toDataURL('image/jpeg', 0.7);
        tex.userData = tex.userData || {};
        tex.userData.__thumbnailUrl = thumb;
        return thumb;
    } catch (e) {
        return "existing";
    }
};

// Safe helper to compute tangents without throwing or logging errors on non-indexed or attribute-deficient geometries
const safeComputeTangents = (geometry) => {
  if (!geometry || !geometry.isBufferGeometry || !geometry.attributes) return;
  if (geometry.attributes.tangent) return;

  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  if (!pos || !uv || pos.count === 0 || uv.count === 0) return;

  if (!geometry.attributes.normal) {
    try { geometry.computeVertexNormals(); } catch (_) { return; }
  }
  if (!geometry.attributes.normal) return;

  // Synthesize sequential indices for non-indexed triangle meshes so computeTangents can calculate per-triangle tangents
  if (!geometry.index) {
    const count = pos.count;
    if (count && count >= 3 && count % 3 === 0) {
      try {
        const indices = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
        for (let i = 0; i < count; i++) indices[i] = i;
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      } catch (_) {
        return;
      }
    } else {
      return;
    }
  }

  if (geometry.index && geometry.attributes.position && geometry.attributes.normal && geometry.attributes.uv) {
    try {
      geometry.computeTangents();
    } catch (_) {}
  }
};

// Upgrades MeshStandardMaterial to MeshPhysicalMaterial so specularIntensity and dynamic specular highlights work
const ensurePhysicalMaterial = (mat) => {
  if (!mat) return mat;
  if (mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) {
    const phys = new THREE.MeshPhysicalMaterial();
    
    // Use MeshStandardMaterial.prototype.copy to safely copy standard properties
    // without triggering Three.js MeshPhysicalMaterial bug where it tries to copy undefined clearcoatNormalScale
    THREE.MeshStandardMaterial.prototype.copy.call(phys, mat);

    // Safely copy physical properties only if they exist on the source
    if (mat.clearcoat !== undefined) phys.clearcoat = mat.clearcoat;
    if (mat.clearcoatRoughness !== undefined) phys.clearcoatRoughness = mat.clearcoatRoughness;
    if (mat.clearcoatNormalMap) phys.clearcoatNormalMap = mat.clearcoatNormalMap;
    if (mat.clearcoatNormalScale && mat.clearcoatNormalScale.isVector2 && phys.clearcoatNormalScale) {
      phys.clearcoatNormalScale.copy(mat.clearcoatNormalScale);
    }
    if (mat.ior !== undefined) phys.ior = mat.ior;
    if (mat.reflectivity !== undefined) phys.reflectivity = mat.reflectivity;
    if (mat.transmission !== undefined) phys.transmission = mat.transmission;

    phys.uuid = mat.uuid; // Preserve UUID for selection and indexing
    phys.name = mat.name;
    phys.userData = { ...mat.userData };
    phys.specularIntensity = (mat.userData?.originalSpecularIntensity !== undefined) ? mat.userData.originalSpecularIntensity : 1.0;
    if (phys.specularColor) phys.specularColor.setRGB(1, 1, 1);
    phys.ior = 1.5;
    phys.needsUpdate = true;
    return phys;
  }
  return mat;
};

// --- Blender-style Selection Highlight using OutlinePass with Dedicated Lightweight Proxy Scene ---
// Renders an authentic post-process silhouette outline matching Blender's selection highlight.
// Uses a dedicated proxy scene containing ONLY the selected mesh(es) to completely eliminate
// full-scene hierarchy traversals and depth draw calls, ensuring silky smooth 60 FPS on any model.
function MeshSelectionHighlight({ target }) {
  const { gl, scene, camera, size } = useThree();

  // Collect all unique meshes belonging to the target
  const meshes = useMemo(() => {
    if (!target) return [];
    const rawList = Array.isArray(target) ? target : [target];
    const result = [];
    const seen = new Set();

    rawList.forEach((item) => {
      if (!item) return;
      if ((item.isMesh || item.isSkinnedMesh) && item.visible !== false) {
        if (!seen.has(item.uuid)) {
          seen.add(item.uuid);
          result.push(item);
        }
      } else if (item.traverse) {
        item.traverse((child) => {
          if ((child.isMesh || child.isSkinnedMesh) && child.geometry && child.visible !== false) {
            if (!seen.has(child.uuid)) {
              seen.add(child.uuid);
              result.push(child);
            }
          }
        });
      }
    });
    return result;
  }, [target]);

  // Create dedicated proxy scene containing ONLY the selected mesh(es).
  // This isolates OutlinePass from the rest of the 3D model, dropping CPU time
  // from ~30ms to <0.05ms per frame on complex models.
  const selectionData = useMemo(() => {
    if (meshes.length === 0) return null;
    const selScene = new THREE.Scene();
    const proxies = [];

    meshes.forEach((mesh) => {
      if (!mesh || !mesh.geometry) return;
      let proxy;
      if (mesh.isSkinnedMesh && mesh.skeleton) {
        proxy = new THREE.SkinnedMesh(mesh.geometry);
        proxy.skeleton = mesh.skeleton;
        proxy.bindMatrix = mesh.bindMatrix;
        proxy.bindMatrixInverse = mesh.bindMatrixInverse;
      } else {
        proxy = new THREE.Mesh(mesh.geometry);
      }
      proxy.matrixAutoUpdate = false;
      proxy.matrixWorldAutoUpdate = false;
      proxy.matrixWorld.copy(mesh.matrixWorld);
      proxy.frustumCulled = false;
      proxy.visible = true;

      selScene.add(proxy);
      proxies.push({ proxy, source: mesh });
    });

    return {
      selScene,
      proxies,
      proxyObjects: proxies.map((p) => p.proxy),
    };
  }, [meshes]);

  const composerRef = useRef(null);
  const outlinePassRef = useRef(null);
  const fxaaPassRef = useRef(null);

  useEffect(() => {
    if (!gl || !scene || !camera || !selectionData) return;

    // Smooth DPR clamped to 1.5 to maintain retina sharpness with 44% less GPU overhead
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.floor(size.width * dpr);
    const height = Math.floor(size.height * dpr);

    // High-performance render target
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
    });

    const composer = new EffectComposer(gl, renderTarget);
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);

    // 1. Beauty pass renders the full scene
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 2. OutlinePass operates on the isolated lightweight selectionScene
    const outlinePass = new OutlinePass(
      new THREE.Vector2(width, height),
      selectionData.selScene,
      camera
    );

    outlinePass.downSampleRatio = 1;
    const outlineColor = new THREE.Color("#ec5137");
    outlinePass.visibleEdgeColor.copy(outlineColor);
    outlinePass.hiddenEdgeColor.copy(outlineColor);
    outlinePass.edgeThickness = 1.8; // Smooth 1.8px thickness
    outlinePass.edgeStrength = 4.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.selectedObjects = selectionData.proxyObjects;
    composer.addPass(outlinePass);

    // 3. Output pass for color management
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 4. FXAA pass for anti-aliasing
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
    composer.addPass(fxaaPass);

    composerRef.current = composer;
    outlinePassRef.current = outlinePass;
    fxaaPassRef.current = fxaaPass;

    return () => {
      try {
        composer.dispose();
      } catch (_) {}
      composerRef.current = null;
      outlinePassRef.current = null;
      fxaaPassRef.current = null;
    };
  }, [gl, scene, camera, selectionData]);

  // Keep composer and passes in sync with canvas resize and DPI
  useEffect(() => {
    if (composerRef.current && outlinePassRef.current) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor(size.width * dpr);
      const height = Math.floor(size.height * dpr);

      composerRef.current.setPixelRatio(dpr);
      composerRef.current.setSize(size.width, size.height);
      outlinePassRef.current.setSize(width, height);
      outlinePassRef.current.resolution.set(width, height);
      outlinePassRef.current.downSampleRatio = 1;

      if (fxaaPassRef.current) {
        fxaaPassRef.current.uniforms['resolution'].value.set(1 / width, 1 / height);
      }
    }
  }, [size.width, size.height, gl]);

  // Delegate render loop to post-processing composer while object is selected
  useFrame((_, delta) => {
    if (composerRef.current && selectionData && selectionData.proxies.length > 0) {
      // Sync proxy transforms to source meshes in real time (follows gizmos & animations)
      const proxies = selectionData.proxies;
      for (let i = 0; i < proxies.length; i++) {
        const { proxy, source } = proxies[i];
        if (source && proxy) {
          proxy.matrixWorld.copy(source.matrixWorld);
          proxy.visible = source.visible !== false;
        }
      }
      composerRef.current.render(delta);
    }
  }, 1);

  return null;
}

const SelectionBoundingBox = MeshSelectionHighlight;

const GenericModel = React.memo(React.forwardRef(({ scene, animations, wireframe, xrayMode, setModelStats, setMaterialList, selectedMaterial, onSelectMaterial, modelName, transformMode, materialSettings, hiddenMaterials, onTransformChange, onTransformStart, onTransformEnd, transformValues, selectedTexture, onTextureApplied, onTextureIdentified, onUpdateMaterialSetting, resetKey, sceneResetTrigger, uvUnwrapTrigger, isSelectionDisabled, includeTextures, onModelReady, isAnimationPlaying = true, onHasAnimationsChange }, ref) => {
  const [position, setPosition] = useState(() => [0, 0, 0]);
  const [scale, setScale] = useState(() => 1);
  const groupRef = React.useRef(null);
  const meshPointerDownPosRef = useRef({ x: 0, y: 0 });
  const [modelGroup, setModelGroup] = useState(null);

  const [syncedSelectionSignature, setSyncedSelectionSignature] = useState(null);
  const activeTextureRef = React.useRef(selectedTexture);
  activeTextureRef.current = selectedTexture;

  const onUpdateMaterialSettingRef = React.useRef(onUpdateMaterialSetting);
  onUpdateMaterialSettingRef.current = onUpdateMaterialSetting;

  const onTextureIdentifiedRef = React.useRef(onTextureIdentified);
  onTextureIdentifiedRef.current = onTextureIdentified;

  // Animation Playback Support for GLB / FBX models
  const mixerRef = useRef(null);
  const onHasAnimationsChangeRef = useRef(onHasAnimationsChange);
  useEffect(() => {
    onHasAnimationsChangeRef.current = onHasAnimationsChange;
  });

  const lastHasAnimRef = useRef(null);
  const notifyHasAnimations = useCallback((val) => {
    const boolVal = Boolean(val);
    if (lastHasAnimRef.current !== boolVal) {
      lastHasAnimRef.current = boolVal;
      onHasAnimationsChangeRef.current?.(boolVal);
    }
  }, []);

  // Reset animations state on unmount
  useEffect(() => {
    return () => {
      if (lastHasAnimRef.current) {
        lastHasAnimRef.current = false;
        onHasAnimationsChangeRef.current?.(false);
      }
    };
  }, []);

  useEffect(() => {
      if (!scene) {
          notifyHasAnimations(false);
          return;
      }

      // Stop any existing mixer
      if (mixerRef.current) {
          try {
              mixerRef.current.stopAllAction();
              mixerRef.current.uncacheRoot(scene);
          } catch(_) {}
          mixerRef.current = null;
      }

      // Collect all AnimationClips from every possible source
      const allClips = [];
      const seen = new Set();
      const add = (c) => {
          if (!c || !Array.isArray(c.tracks) || c.tracks.length === 0) return;
          const id = c.uuid || c.name || Math.random().toString();
          if (seen.has(id)) return;
          seen.add(id);
          allClips.push(c);
      };

      // 1. Directly passed animations prop
      if (Array.isArray(animations)) animations.forEach(add);
      // 2. Animations stored on the scene root (set by GLBModel / FBXModel)
      if (Array.isArray(scene.animations)) scene.animations.forEach(add);
      // 3. Animations stored on any child node
      scene.traverse(child => {
          if (Array.isArray(child.animations)) child.animations.forEach(add);
      });

      const hasClips = allClips.length > 0;
      notifyHasAnimations(hasClips);

      if (!hasClips) return;

      // Capture untouched local bind transforms for all hierarchy nodes before animations begin modifying them
      scene.traverse((child) => {
          if (!child.userData.__bindPos) {
              child.userData.__bindPos = [child.position.x, child.position.y, child.position.z];
              child.userData.__bindQuat = [child.quaternion.x, child.quaternion.y, child.quaternion.z, child.quaternion.w];
              child.userData.__bindScale = [child.scale.x, child.scale.y, child.scale.z];
          }
      });

      // Ensure all animated and skinned meshes never get culled when moving
      scene.traverse((child) => {
          if (child.isMesh || child.isSkinnedMesh) {
              child.frustumCulled = false;
          }
      });

      console.log(`[GenericModel] Playing ${allClips.length} animation clip(s) on scene:`, allClips.map(c => c.name));

      const mixer = new THREE.AnimationMixer(scene);
      mixer.timeScale = isAnimationPlaying ? 1 : 0;

      // Smart clip conflict filter:
      // If clips target overlapping bone/property tracks (e.g. Idle vs Walk vs Run),
      // playing them all at once distorts the model. We play the primary action (first clip)
      // or all non-conflicting clips (e.g., separate parts of a multi-component model).
      const targetedProperties = new Set();
      const clipsToPlay = [];

      for (const clip of allClips) {
          let hasConflict = false;
          const currentClipProps = new Set();
          for (const track of clip.tracks) {
              const propKey = track.name;
              if (targetedProperties.has(propKey)) {
                  hasConflict = true;
                  break;
              }
              currentClipProps.add(propKey);
          }

          if (clipsToPlay.length === 0 || !hasConflict) {
              clipsToPlay.push(clip);
              currentClipProps.forEach(p => targetedProperties.add(p));
          }
      }

      clipsToPlay.forEach(clip => {
          try {
              const action = mixer.clipAction(clip);
              action.reset();
              action.setLoop(THREE.LoopRepeat, Infinity);
              action.clampWhenFinished = false;
              action.enabled = true;
              action.setEffectiveTimeScale(1);
              action.setEffectiveWeight(1);
              action.play();
          } catch(e) {
              console.warn("[GenericModel] Could not play animation clip:", clip.name, e);
          }
      });

      mixerRef.current = mixer;

      return () => {
          try {
              mixer.stopAllAction();
              mixer.uncacheRoot(scene);
          } catch(_) {}
          mixerRef.current = null;
      };
  }, [scene, animations, notifyHasAnimations]);

  // Sync mixer playback state dynamically when toggle changes
  useEffect(() => {
      if (mixerRef.current) {
          mixerRef.current.timeScale = isAnimationPlaying ? 1 : 0;
      }
  }, [isAnimationPlaying]);

  useFrame((state, delta) => {
      if (mixerRef.current && isAnimationPlaying !== false) {
          // Cap delta to prevent large frame jumps on lag / tab blur
          const safeDelta = Math.min(delta, 0.1);
          mixerRef.current.update(safeDelta);
      }
  });

  // Snapshot and preserve all original default textures and material properties on load
  useEffect(() => {
      if (!scene) return;
      const TEX_KEYS = ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap','bumpMap','displacementMap'];
      scene.traverse((child) => {
          if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                  child.material = child.material.map(ensurePhysicalMaterial);
              } else {
                  child.material = ensurePhysicalMaterial(child.material);
              }
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((mat) => {
                  if (!mat.userData.origTexturesSnap) {
                      const snap = {};
                      TEX_KEYS.forEach(k => { if (mat[k]) snap[k] = mat[k]; });
                      mat.userData.origTexturesSnap = snap;
                      mat.userData.originalMap = mat.map;
                      mat.userData.originalNormalMap = mat.normalMap;
                      mat.userData.originalRoughnessMap = mat.roughnessMap;
                      mat.userData.originalMetalnessMap = mat.metalnessMap;
                      mat.userData.originalAoMap = mat.aoMap;
                      mat.userData.originalEmissiveMap = mat.emissiveMap;
                      mat.userData.originalAlphaMap = mat.alphaMap;
                      mat.userData.originalBumpMap = mat.bumpMap;
                      mat.userData.originalDisplacementMap = mat.displacementMap;
                      if (mat.color) mat.userData.originalColor = mat.color.clone();
                      mat.userData.originalRoughness = mat.roughness;
                      mat.userData.originalMetalness = mat.metalness;
                      mat.userData.originalOpacity = mat.opacity;
                      mat.userData.originalClearcoat = mat.clearcoat !== undefined ? mat.clearcoat : 0;
                      mat.userData.originalSpecularIntensity = mat.specularIntensity !== undefined ? mat.specularIntensity : 1.0;
                      mat.userData.originalEnvMapIntensity = mat.envMapIntensity !== undefined ? mat.envMapIntensity : 1.0;
                  }

                  if (includeTextures === false) {
                      TEX_KEYS.forEach(k => { mat[k] = null; });
                  } else if (includeTextures === true && mat.userData.origTexturesSnap) {
                      TEX_KEYS.forEach(k => { mat[k] = mat.userData.origTexturesSnap[k]; });
                  }
                  mat.needsUpdate = true;
              });
          }
      });
  }, [scene, includeTextures]);

  // Multi-mesh transform support for shared materials
  const relatedMeshesRef = React.useRef([]);
  const followerOffsetsRef = React.useRef(new Map()); // Map<UUID, Matrix4 (relative to leader)>
  const isSyncingRef = React.useRef(false);

  // Mesh Index for fast material lookups - avoids expensive scene.traverse calls
  const meshIndexRef = React.useRef(new Map()); // Map<MaterialName, Mesh[]>

  // Helper to resolve all 3D meshes targeted by the current selection
  const resolveTargetMeshes = useCallback((selMat) => {
      if (!selMat || !scene) return [];

      const isFullModel = !selMat || (modelName && (selMat.name === modelName || selMat === modelName)) || selMat.name === "Scene" || selMat === "Scene";
      if (isFullModel) {
          const all = [];
          scene.traverse(child => {
              if (child.isMesh && child.material) all.push(child);
          });
          return all;
      }

      if (selMat.isGroup && Array.isArray(selMat.materials)) {
          const result = new Set();
          selMat.materials.forEach(mName => {
              if (meshIndexRef.current.has(mName)) {
                  meshIndexRef.current.get(mName).forEach(c => result.add(c));
              }
          });
          return Array.from(result);
      }

      const targetUuid = selMat.uuid || selMat.meshUuid;
      const targetMat = selMat.material;
      const targetName = selMat.meshName || selMat.name;

      if (targetUuid && meshIndexRef.current.has(targetUuid)) {
          return meshIndexRef.current.get(targetUuid);
      }
      if (targetName && meshIndexRef.current.has(targetName)) {
          return meshIndexRef.current.get(targetName);
      }
      if (targetMat && meshIndexRef.current.has(targetMat)) {
          return meshIndexRef.current.get(targetMat);
      }

      const matches = [];
      scene.traverse(child => {
          if (child.isMesh && (child.material || child.userData?.__preXrayMaterial)) {
              const activeMat = child.userData?.__preXrayMaterial || child.material;
              if (targetUuid && child.uuid === targetUuid) {
                  matches.push(child);
              } else if (targetName && child.name === targetName) {
                  matches.push(child);
              } else if (targetMat) {
                  const mats = Array.isArray(activeMat) ? activeMat : [activeMat];
                  if (mats.some(m => m && m.name === targetMat)) {
                      matches.push(child);
                  }
              }
          }
      });
      return matches;
  }, [scene, modelName]);

  // Helper to resolve the primary THREE.Material targeted by the current selection
  const resolveTargetMaterial = useCallback((selMat) => {
      if (!selMat || !scene) return null;

      const isFullModel = !selMat || (modelName && (selMat.name === modelName || selMat === modelName)) || selMat.name === "Scene" || selMat === "Scene";
      if (isFullModel) {
          return null;
      }

      const targetUuid = selMat.uuid || selMat.meshUuid;
      const targetMat = selMat.material;
      const targetName = selMat.meshName || selMat.name;

      if (targetUuid) {
          let found = null;
          scene.traverse(child => {
              if (found) return;
              if (child.isMesh && child.uuid === targetUuid && (child.material || child.userData?.__preXrayMaterial)) {
                  const activeMat = child.userData?.__preXrayMaterial || child.material;
                  if (Array.isArray(activeMat)) {
                      found = targetMat ? (activeMat.find(m => m.name === targetMat) || activeMat[0]) : activeMat[0];
                  } else {
                      found = activeMat;
                  }
              }
          });
          if (found) return found;
      }

      if (targetMat && meshIndexRef.current.has(targetMat)) {
          const meshes = meshIndexRef.current.get(targetMat);
          if (meshes.length > 0 && (meshes[0].material || meshes[0].userData?.__preXrayMaterial)) {
              const m = meshes[0].userData?.__preXrayMaterial || meshes[0].material;
              return Array.isArray(m) ? (m.find(mat => mat.name === targetMat) || m[0]) : m;
          }
      }

      if (targetName && meshIndexRef.current.has(targetName)) {
          const meshes = meshIndexRef.current.get(targetName);
          if (meshes.length > 0 && (meshes[0].material || meshes[0].userData?.__preXrayMaterial)) {
              const m = meshes[0].userData?.__preXrayMaterial || meshes[0].material;
              return Array.isArray(m) ? m[0] : m;
          }
      }

      let found = null;
      scene.traverse(child => {
          if (found) return;
          if (child.isMesh && (child.material || child.userData?.__preXrayMaterial)) {
              const activeMat = child.userData?.__preXrayMaterial || child.material;
              const mats = Array.isArray(activeMat) ? activeMat : [activeMat];
              for (const m of mats) {
                  if (m && ((targetMat && m.name === targetMat) || (targetName && m.name === targetName))) {
                      found = m;
                      break;
                  }
              }
          }
      });
      return found;
  }, [scene, modelName]);

  // Memoized user-specified X-Ray Material (Optimized for instant 60 FPS performance)
  const xrayMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x00aaff,       // X-ray color
    transparent: true,
    opacity: 0.25,
    roughness: 0.1,
    metalness: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide
  }), []);

  // X-Ray View: efficiently sets xrayMaterial on targeted meshes without redundant recompilations or scene churn
  useEffect(() => {
    if (!scene) return;

    if (xrayMode) {
      // Determine if a specific mesh or group is selected
      const isFullModel = !selectedMaterial || 
                          (modelName && (selectedMaterial.name === modelName || selectedMaterial === modelName)) || 
                          selectedMaterial.name === "Scene" || 
                          selectedMaterial === "Scene";
      
      const targetMeshes = isFullModel ? null : resolveTargetMeshes(selectedMaterial);
      const targetSet = (targetMeshes && targetMeshes.length > 0) ? new Set(targetMeshes) : null;

      scene.traverse((child) => {
        if ((child.isMesh || child.isSkinnedMesh) && (child.material || child.userData?.__preXrayMaterial)) {
          const shouldBeXray = !targetSet || targetSet.has(child);

          if (shouldBeXray) {
            if (child.material !== xrayMaterial) {
              if (!child.userData.__preXrayMaterial) {
                child.userData.__preXrayMaterial = child.material;
              }
              child.material = xrayMaterial;
            }
          } else {
            // Restore original material if it was previously in X-Ray
            if (child.userData?.__preXrayMaterial) {
              child.material = child.userData.__preXrayMaterial;
              delete child.userData.__preXrayMaterial;
            }
          }
        }
      });
    } else {
      // X-Ray turned off: restore ALL meshes that have saved pre-xray material
      scene.traverse((child) => {
        if ((child.isMesh || child.isSkinnedMesh) && child.userData?.__preXrayMaterial) {
          child.material = child.userData.__preXrayMaterial;
          delete child.userData.__preXrayMaterial;
        }
      });
    }
  }, [scene, xrayMode, xrayMaterial, selectedMaterial, modelName, resolveTargetMeshes]);

  // Clean restoration on unmount
  useEffect(() => {
    return () => {
      if (scene) {
        scene.traverse((child) => {
          if ((child.isMesh || child.isSkinnedMesh) && child.userData?.__preXrayMaterial) {
            child.material = child.userData.__preXrayMaterial;
            delete child.userData.__preXrayMaterial;
          }
        });
      }
    };
  }, [scene]);


  // Expose Three.js Scene Root augmented with helper methods
  React.useImperativeHandle(ref, () => {
      if (!scene) return null;
      scene.deleteMaterial = (matName) => {
          const meshesToRemove = [];
          scene.traverse((child) => {
              if (child.isMesh && child.material) {
                  let shouldDelete = false;
                  if (Array.isArray(child.material)) {
                      shouldDelete = child.material.some(m => m.name === matName);
                  } else {
                      shouldDelete = child.material.name === matName;
                  }
                  if (shouldDelete) meshesToRemove.push(child);
              }
          });
          meshesToRemove.forEach(mesh => {
              if (mesh.parent) {
                  mesh.parent.remove(mesh);
                  if (mesh.geometry) mesh.geometry.dispose();
              }
          });
      };
      scene.renameMaterial = (oldName, newName) => {
          if (!oldName || !newName) return;
          scene.traverse((child) => {
              if (child.name === oldName) {
                  child.name = newName;
              }
              if (child.isMesh && child.material) {
                  const mats = Array.isArray(child.material) ? child.material : [child.material];
                  mats.forEach(m => {
                      if (m.name === oldName) {
                          m.name = newName;
                      }
                  });
              }
          });
      };
      scene.scene = scene;
      return scene;
  }, [scene]);
    
  // 0. Apply Texture to Selected Material
  useEffect(() => {
     if (!selectedTexture || !scene || xrayMode) return;
     
     // Use a separate LoadingManager to avoid triggering the global useProgress spinner
     const textureManager = new THREE.LoadingManager();
     const loader = new THREE.TextureLoader(textureManager);
     
     const resolveUrl = (url) => {
        if (!url) return null;
        if (typeof url !== 'string') return url;
        return resolveUploadsPath(url);
     };

     const loadMap = (url, isColor = false) => {
          const resolved = resolveUrl(url);
          if (!resolved || resolved === "existing") return null;

          const cacheKey = `${resolved}_${isColor}`;
          if (globalTextureCache.has(cacheKey)) {
              return globalTextureCache.get(cacheKey);
          }

          const tex = sharedTextureLoader.load(resolved, (t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              t.flipY = false; 
              t.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
              t.anisotropy = 8; // Performance optimization: 8 is usually plenty and faster than 16
              t.userData = { url: resolved };
              t.needsUpdate = true;
          });
          tex.userData = { url: resolved };

          globalTextureCache.set(cacheKey, tex);
          return tex;
     }

     const newMaps = {};
     const m = selectedTexture?.maps || {};
     // Support both old keys (map, normalMap) and new keys (base, normal)
     const baseImg = m.map || m.base;
     const normalImg = m.normalMap || m.normal;
     const roughnessImg = m.roughnessMap || m.roughness;
     const metallicImg = m.metalnessMap || m.metallic || m.metalness;
     const aoImg = m.aoMap || m.ao;
     const displacementImg = m.displacementMap || m.displacement;
     const alphaImg = m.alphaMap || m.opacity;

     if (baseImg) newMaps.map = loadMap(baseImg, true);
     if (normalImg) newMaps.normalMap = loadMap(normalImg, false);
     if (roughnessImg) newMaps.roughnessMap = loadMap(roughnessImg, false);
     if (metallicImg) newMaps.metalnessMap = loadMap(metallicImg, false);
     if (aoImg) newMaps.aoMap = loadMap(aoImg, false);
     if (displacementImg) newMaps.displacementMap = loadMap(displacementImg, false);
     if (alphaImg) newMaps.alphaMap = loadMap(alphaImg, false);

     const selMat = selectedMaterial; 
     const targetMatName = selMat ? selMat.name : null;

     const isFullModelSelect = !targetMatName || (modelName && targetMatName === modelName) || targetMatName === "Scene";

     // Optimized application using mesh index
     const processedMaterials = new Set();
     const ensureMeshUniqueMaterial = (mesh) => {
          if (!mesh || !mesh.material || isFullModelSelect || (selMat && selMat.isGroup)) return;
          const currentMat = mesh.material;
          const mats = Array.isArray(currentMat) ? currentMat : [currentMat];
          let didClone = false;
          const newMats = mats.map(m => {
              if (!m) return m;
              let isShared = false;
              scene.traverse(c => {
                  if (isShared) return;
                  if (c.isMesh && c !== mesh && c.material) {
                      const cm = Array.isArray(c.material) ? c.material : [c.material];
                      if (cm.some(mat => mat === m || mat.uuid === m.uuid)) {
                          isShared = true;
                      }
                  }
              });
              if (isShared) {
                  const cloned = m.clone();
                  cloned.name = `${m.name}_${mesh.name || mesh.uuid.slice(0, 4)}`;
                  cloned.userData = { ...m.userData };
                  didClone = true;
                  if (meshIndexRef.current) {
                      meshIndexRef.current.set(cloned.name, [mesh]);
                  }
                  return cloned;
              }
              return m;
          });
          if (didClone) {
              mesh.material = Array.isArray(currentMat) ? newMats : newMats[0];
          }
     };

     const applyToMesh = (child) => {
          if (child.isMesh && child.material) {
              ensureMeshUniqueMaterial(child);
              const apply = (mat) => {
                   if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial && !mat.isMeshPhongMaterial) return;
                   if (processedMaterials.has(mat.uuid)) return;
                   processedMaterials.add(mat.uuid);
                   
                    // Surgical replacement: Only replace maps that are provided by the new texture.
                    // This prevents clobbering existing maps (like an original diffuse map) when applying a partial gallery texture.
                    if (newMaps.map) {
                        mat.map = newMaps.map;
                        mat.userData.appliedMap = newMaps.map;
                    }
                    if (newMaps.normalMap) {
                        mat.normalMap = newMaps.normalMap;
                        mat.bumpMap = newMaps.normalMap; // Use normal map as bump fallback
                        if (!mat.bumpScale) mat.bumpScale = 1;
                    }
                    if (newMaps.aoMap) mat.aoMap = newMaps.aoMap;
                    if (newMaps.displacementMap) {
                        mat.displacementMap = newMaps.displacementMap;
                        if (mat.displacementScale === undefined) mat.displacementScale = 0.01;
                    }
                    if (newMaps.alphaMap) {
                        mat.alphaMap = newMaps.alphaMap;
                        mat.transparent = true;
                    }
                    
                    // Clear any ongoing flash and reset emissive
                    mat.userData.isFlashing = false;
                    if (mat.emissive && typeof mat.emissive.set === 'function') {
                        mat.emissive.set(0, 0, 0);
                        mat.emissiveIntensity = 0;
                    }

                    if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial || mat.isMeshPhongMaterial) {
                        if (newMaps.roughnessMap) {
                            mat.roughnessMap = newMaps.roughnessMap;
                            mat.roughness = 1.0; // Reset factor for full map influence
                        }
                        if (newMaps.metalnessMap) {
                            mat.metalnessMap = newMaps.metalnessMap;
                            if (mat.metalness !== undefined) mat.metalness = 1.0;
                        }
                        
                        // Reset color to white if a base map is being applied so it's not tinted
                        if (newMaps.map && mat.color && typeof mat.color.set === 'function') {
                            mat.color.set(0xffffff);
                        }
                    }
                    
                    // Save the full texture object for later identification
                    if (selectedTexture.id) {
                        mat.userData.appliedTexture = selectedTexture;
                        mat.userData.appliedTextureId = selectedTexture.id;
                    } else {
                        delete mat.userData.appliedTexture;
                        delete mat.userData.appliedTextureId;
                    }
                    
                    mat.needsUpdate = true;
              };

              if (Array.isArray(child.material)) {
                  child.material.forEach(apply);
              } else {
                  apply(child.material);
              }
          }
     };

     if (isFullModelSelect) {
         meshIndexRef.current.forEach(meshes => {
             meshes.forEach(applyToMesh);
         });
     } else {
         const targetMeshes = resolveTargetMeshes(selMat);
         targetMeshes.forEach(applyToMesh);
     }
     
     // Update the UI immediately to reflect the new texture as "Active" for this material
     onTextureIdentifiedRef.current?.(selectedTexture.id || null);

     // Notify parent that texture has been processed so we can reset state
     if (typeof onTextureApplied === 'function') {
         onTextureApplied();
     }
  }, [selectedTexture, scene, selectedMaterial, modelName, onTextureApplied]);

  // 0.2. Apply Manual Map Uploads
  useEffect(() => {
    if (!materialSettings?.maps || !scene || xrayMode) return;
    
    // CRITICAL: Manual map uploads must ONLY run when maps or appliedTexture were explicitly changed or on reset/undo!
    // Slider adjustments (scale, rotation, offset, color, roughness, etc.) must NEVER trigger map reloads!
    const isResetOrUndo = resetKey !== lastApplyResetKeyRef.current;
    const changedProp = materialSettings.lastChangedProp;
    if (!isResetOrUndo && changedProp !== 'maps' && changedProp !== 'appliedTexture') return;
    
    // We only apply to the selected material (scoping is handled by the component that updates maps)
    const selMat = selectedMaterial;
    const targetMatName = selMat ? selMat.name : null;
    
    // If "Scene" or model group is selected, we could potentially apply to all, 
    // but typically manual map uploads are for specific materials.
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";
    if (!targetMatName && !isFullModel) return;

    const textureManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(textureManager);
    
    const resolveUrlLocal = (url) => {
        if (!url) return null;
        if (typeof url !== 'string') return url;
        return resolveUploadsPath(url);
    };

    const loadMapManual = (url, isColor = false) => {
          const resolved = resolveUrlLocal(url);
          if (!resolved || resolved === "existing") return null;
          
          const cacheKey = `${resolved}_${isColor}`;
          if (globalTextureCache.has(cacheKey)) {
              return globalTextureCache.get(cacheKey);
          }

          const tex = sharedTextureLoader.load(resolved, (t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              t.flipY = false; 
              t.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
              t.anisotropy = 8;
              t.userData = { url: resolved };
              t.needsUpdate = true;
          });
          tex.userData = { url: resolved };
          
          globalTextureCache.set(cacheKey, tex);
          return tex;
    }

    const newMapsList = materialSettings.maps;
    const loadedMaps = {};
    
    // Support both old keys and new keys
    const baseImg = newMapsList.map || newMapsList.base;
    const normalImg = newMapsList.normalMap || newMapsList.normal;
    const roughnessImg = newMapsList.roughnessMap || newMapsList.roughness;
    const metalnessImg = newMapsList.metalnessMap || newMapsList.metallic || newMapsList.metalness;
    const displacementImg = newMapsList.displacementMap || newMapsList.displacement;
    const bumpImg = newMapsList.bumpMap || newMapsList.bump;
    const aoImg = newMapsList.aoMap || newMapsList.ao;
    const alphaImg = newMapsList.alphaMap || newMapsList.opacity;
    const emissiveImg = newMapsList.emissiveMap || newMapsList.emissive;

    const texScaleX = 100 / (materialSettings.scale || 100);
    const texScaleY = 100 / (materialSettings.scale || 100);

    const applyScaleToTex = (tex) => {
        if (tex && tex.repeat && typeof tex.repeat.set === 'function') {
            tex.repeat.set(texScaleX, texScaleY);
        }
    };

    if (baseImg) { loadedMaps.map = loadMapManual(baseImg, true); applyScaleToTex(loadedMaps.map); }
    if (normalImg) { loadedMaps.normalMap = loadMapManual(normalImg, false); applyScaleToTex(loadedMaps.normalMap); }
    if (roughnessImg) { loadedMaps.roughnessMap = loadMapManual(roughnessImg, false); applyScaleToTex(loadedMaps.roughnessMap); }
    if (metalnessImg) { loadedMaps.metalnessMap = loadMapManual(metalnessImg, false); applyScaleToTex(loadedMaps.metalnessMap); }
    if (displacementImg) { loadedMaps.displacementMap = loadMapManual(displacementImg, false); applyScaleToTex(loadedMaps.displacementMap); }
    if (bumpImg) { loadedMaps.bumpMap = loadMapManual(bumpImg, false); applyScaleToTex(loadedMaps.bumpMap); }
    if (aoImg) { loadedMaps.aoMap = loadMapManual(aoImg, false); applyScaleToTex(loadedMaps.aoMap); }
    if (alphaImg) { loadedMaps.alphaMap = loadMapManual(alphaImg, false); applyScaleToTex(loadedMaps.alphaMap); }
    if (emissiveImg) { loadedMaps.emissiveMap = loadMapManual(emissiveImg, true); applyScaleToTex(loadedMaps.emissiveMap); }

    const applyToMeshLocal = (child) => {
         if (child.isMesh && child.material) {
             if (!isFullModel && !(selMat && selMat.isGroup)) {
                 const currentMat = child.material;
                 const mats = Array.isArray(currentMat) ? currentMat : [currentMat];
                 let didClone = false;
                 const newMats = mats.map(m => {
                     if (!m) return m;
                     let isShared = false;
                     scene.traverse(c => {
                         if (isShared) return;
                         if (c.isMesh && c !== child && c.material) {
                             const cm = Array.isArray(c.material) ? c.material : [c.material];
                             if (cm.some(mat => mat === m || mat.uuid === m.uuid)) {
                                 isShared = true;
                             }
                         }
                     });
                     if (isShared) {
                         const cloned = m.clone();
                         cloned.name = `${m.name}_${child.name || child.uuid.slice(0, 4)}`;
                         cloned.userData = { ...m.userData };
                         didClone = true;
                         if (meshIndexRef.current) {
                             meshIndexRef.current.set(cloned.name, [child]);
                         }
                         return cloned;
                     }
                     return m;
                 });
                 if (didClone) {
                     child.material = Array.isArray(currentMat) ? newMats : newMats[0];
                 }
             }
             const apply = (mat) => {
                  const hasMapUpdate = newMapsList.hasOwnProperty('map') && newMapsList.map !== "existing";
                  const hasNormalUpdate = newMapsList.hasOwnProperty('normalMap') && newMapsList.normalMap !== "existing";
                  const hasRoughnessUpdate = newMapsList.hasOwnProperty('roughnessMap') && newMapsList.roughnessMap !== "existing";
                  const hasMetalnessUpdate = newMapsList.hasOwnProperty('metalnessMap') && newMapsList.metalnessMap !== "existing";
                  const hasBumpUpdate = (newMapsList.hasOwnProperty('bumpMap') && newMapsList.bumpMap !== "existing") || (newMapsList.hasOwnProperty('bump') && newMapsList.bump !== "existing");
                  const hasAoUpdate = newMapsList.hasOwnProperty('aoMap') && newMapsList.aoMap !== "existing";
                  const hasDispUpdate = (newMapsList.hasOwnProperty('displacementMap') && newMapsList.displacementMap !== "existing") || (newMapsList.hasOwnProperty('displacement') && newMapsList.displacement !== "existing");

                  if (hasMapUpdate) {
                      if (loadedMaps.map) {
                          if (mat.map !== loadedMaps.map) mat.map = loadedMaps.map;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.map = newMapsList.map;
                      } else if (newMapsList.map === null) {
                          mat.map = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.map = null;
                      }
                  }
                  
                  if (hasNormalUpdate) {
                      if (loadedMaps.normalMap) {
                          if (mat.normalMap !== loadedMaps.normalMap) mat.normalMap = loadedMaps.normalMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.normalMap = newMapsList.normalMap;
                          if (mat.normalMap && !mat.normalScale) mat.normalScale = new THREE.Vector2(1, 1);
                      } else if (newMapsList.normalMap === null) {
                          mat.normalMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.normalMap = null;
                      }
                  }
                  
                  if (hasRoughnessUpdate) {
                      if (loadedMaps.roughnessMap) {
                          if (mat.roughnessMap !== loadedMaps.roughnessMap) mat.roughnessMap = loadedMaps.roughnessMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.roughnessMap = newMapsList.roughnessMap;
                          if (mat.roughnessMap) mat.roughness = 1.0;
                      } else if (newMapsList.roughnessMap === null) {
                          mat.roughnessMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.roughnessMap = null;
                      }
                  }
                  
                  if (hasMetalnessUpdate) {
                      if (loadedMaps.metalnessMap) {
                          if (mat.metalnessMap !== loadedMaps.metalnessMap) mat.metalnessMap = loadedMaps.metalnessMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.metalnessMap = newMapsList.metalnessMap;
                          if (mat.metalnessMap) mat.metalness = 1.0;
                      } else if (newMapsList.metalnessMap === null) {
                          mat.metalnessMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.metalnessMap = null;
                      }
                  }
                  
                  if (hasDispUpdate) {
                      const dispVal = newMapsList.displacementMap || newMapsList.displacement;
                      if (loadedMaps.displacementMap) {
                          if (mat.displacementMap !== loadedMaps.displacementMap) mat.displacementMap = loadedMaps.displacementMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.displacementMap = dispVal;
                          if (mat.displacementMap && mat.displacementScale === undefined) mat.displacementScale = 0.01;
                      } else if (dispVal === null) {
                          mat.displacementMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.displacementMap = null;
                      }
                  }

                  if (hasBumpUpdate) {
                      const bumpVal = newMapsList.bumpMap || newMapsList.bump;
                      if (loadedMaps.bumpMap) {
                          if (mat.bumpMap !== loadedMaps.bumpMap) mat.bumpMap = loadedMaps.bumpMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.bumpMap = bumpVal;
                          if (mat.bumpMap && mat.bumpScale === undefined) mat.bumpScale = 0.05;
                      } else if (bumpVal === null) {
                          mat.bumpMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.bumpMap = null;
                      }
                  }
                  
                  if (hasAoUpdate) {
                      if (loadedMaps.aoMap) {
                          if (mat.aoMap !== loadedMaps.aoMap) mat.aoMap = loadedMaps.aoMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.aoMap = newMapsList.aoMap;
                          if (mat.aoMap && mat.aoMapIntensity === undefined) mat.aoMapIntensity = 1;
                      } else if (newMapsList.aoMap === null) {
                          mat.aoMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.aoMap = null;
                      }
                  }

                  if (newMapsList.hasOwnProperty('alphaMap') && newMapsList.alphaMap !== "existing") {
                      if (loadedMaps.alphaMap) {
                          if (mat.alphaMap !== loadedMaps.alphaMap) mat.alphaMap = loadedMaps.alphaMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.alphaMap = newMapsList.alphaMap;
                      } else if (newMapsList.alphaMap === null) {
                          mat.alphaMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.alphaMap = null;
                      }
                  }

                  if (newMapsList.hasOwnProperty('emissiveMap') && newMapsList.emissiveMap !== "existing") {
                      if (loadedMaps.emissiveMap) {
                          if (mat.emissiveMap !== loadedMaps.emissiveMap) mat.emissiveMap = loadedMaps.emissiveMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.emissiveMap = newMapsList.emissiveMap;
                      } else if (newMapsList.emissiveMap === null) {
                          mat.emissiveMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.emissiveMap = null;
                      }
                  }
                  
                  mat.needsUpdate = true;
             };

             if (Array.isArray(child.material)) {
                 child.material.forEach(apply);
             } else {
                 apply(child.material);
             }
         }
    };

    const applyToTarget = (meshes) => {
        meshes.forEach(applyToMeshLocal);
    };

    if (isFullModel) {
        meshIndexRef.current.forEach(applyToTarget);
    } else {
        const targetMeshes = resolveTargetMeshes(selMat);
        applyToTarget(targetMeshes);
    }

  }, [materialSettings?.maps, materialSettings?.useFactorColor, scene, selectedMaterial, modelName, resolveTargetMeshes]);

  // 0.6. Sync UI with Selected Material (Fetch existing values)


  // 0.5 Detect Current Texture on Selection Change
  useEffect(() => {
      if (!scene) return;

      const isFullModel = !selectedMaterial || (modelName && selectedMaterial.name === modelName) || selectedMaterial.name === "Scene";
      
      let foundMat = null;

      if (!isFullModel) {
          const targetParentGroup = selectedMaterial.parentGroup;
          if (targetParentGroup && targetParentGroup !== modelName && targetParentGroup !== "Scene") {
              onTextureIdentifiedRef.current?.(null);
              return;
          }
          if (selectedMaterial.isGroup && selectedMaterial.name !== modelName && selectedMaterial.name !== "Scene") {
              onTextureIdentifiedRef.current?.(null);
              return;
          }
      }
      
      foundMat = resolveTargetMaterial(selectedMaterial);

      // Helper to extract URL from a Three.js Texture
      const getTexUrl = (tex) => {
          return getTextureSource(tex) || "existing";
      };

      if (foundMat && foundMat.userData && foundMat.userData.appliedTextureId) {
          onTextureIdentifiedRef.current?.(foundMat.userData.appliedTextureId);
      } else {
          onTextureIdentifiedRef.current?.(null);
      }

      // Sync Manual Maps or Original Model Maps back to UI (Detected but not re-applied)
      if (foundMat) {
          if (foundMat.userData && foundMat.userData.manualMaps) {
              onUpdateMaterialSettingRef.current?.('maps', foundMat.userData.manualMaps);
          } else {
              // Extract current visual state for the UI checkmarks
              const nativeMaps = {};

              if (foundMat.map) nativeMaps.map = getTexUrl(foundMat.map);
              if (foundMat.normalMap) nativeMaps.normalMap = getTexUrl(foundMat.normalMap);
              if (foundMat.roughnessMap) nativeMaps.roughnessMap = getTexUrl(foundMat.roughnessMap);
              if (foundMat.metalnessMap) nativeMaps.metalnessMap = getTexUrl(foundMat.metalnessMap);
              if (foundMat.displacementMap) nativeMaps.displacementMap = getTexUrl(foundMat.displacementMap);
              if (foundMat.bumpMap) nativeMaps.bumpMap = getTexUrl(foundMat.bumpMap);
              if (foundMat.aoMap) nativeMaps.aoMap = getTexUrl(foundMat.aoMap);
              if (foundMat.alphaMap) nativeMaps.alphaMap = getTexUrl(foundMat.alphaMap);
              if (foundMat.emissiveMap) nativeMaps.emissiveMap = getTexUrl(foundMat.emissiveMap);

              onUpdateMaterialSettingRef.current?.('maps', nativeMaps);
              
              // Sync existing scale back to UI
              if (foundMat.map && foundMat.map.repeat) {
                  const detectedScale = Math.round(100 / (foundMat.map.repeat.x || 1));
                  onUpdateMaterialSettingRef.current?.('scale', detectedScale);
              }
          }
      } else {
          onUpdateMaterialSettingRef.current?.('maps', {});
      }

  }, [selectedMaterial, scene, modelName, resolveTargetMaterial]);
  
  // 1. Initial Setup: Centering, Scaling, Stats, Material Naming
  useLayoutEffect(() => {
    if (!scene) return;

    // Reset position and scale to calculate true bounding box
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    let box = new THREE.Box3();
    
    // Compute accurate bounding box from all renderable geometry
    scene.traverse((child) => {
      if (child.isSkinnedMesh) {
        try {
          child.computeBoundingBox();
          if (child.boundingBox) {
            const skinnedBox = child.boundingBox.clone().applyMatrix4(child.matrixWorld);
            if (!skinnedBox.isEmpty() && isFinite(skinnedBox.min.x)) {
              box.union(skinnedBox);
              return;
            }
          }
        } catch (_) {}
      }
      if (child.isMesh && child.geometry) {
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        if (child.geometry.boundingBox) {
          const geomBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
          if (!geomBox.isEmpty() && isFinite(geomBox.min.x)) {
            box.union(geomBox);
          }
        }
      }
    });

    if (box.isEmpty()) {
      try {
        box.setFromObject(scene);
      } catch (e) {
        console.warn("[GenericModel] Bounding box computation notice:", e);
      }
    }

    if (box.isEmpty() || !isFinite(box.min.x)) {
      box.min.set(-1, -1, -1);
      box.max.set(1, 1, 1);
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Target size 3.5 units for clear, large, prominent framing in the viewport
    const TARGET_SIZE = 3.5;
    let targetScale = maxDim > 0 ? (TARGET_SIZE / maxDim) : 1;

    // Center on X and Z, and place the bottom at exactly Y = 0 on the base grid (no floating)
    const centeredX = -center.x * targetScale;
    const centeredZ = -center.z * targetScale;
    const bottomY = -box.min.y * targetScale; 

    // DO NOT scale or move the child scene directly to prevent double-scaling!
    // The parent <group> handles scale and position cleanly.
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    setScale(targetScale);
    setPosition([centeredX, bottomY, centeredZ]);
    
    // Persistent storage of normalization baseline on the scene object itself
    scene.userData.normalization = {
        position: [centeredX, bottomY, centeredZ],
        scale: targetScale
    };
    if (modelGroup) {
        modelGroup.userData.originalTransform = {
            position: new THREE.Vector3(centeredX, bottomY, centeredZ),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(targetScale, targetScale, targetScale)
        };
    }

    // Stats & Material Naming
    let vertCount = 0;
    let polyCount = 0;
    const processedMaterials = new Map();
    const usedNames = new Set();
    let unnamedCount = 1;

    const groupMap = new Map(); // GroupName -> Set<MaterialName>
    const ungroupedMats = new Set();
    const meshIndex = new Map();

    scene.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        if (child.geometry) {
          if (!child.geometry.boundingSphere) {
            child.geometry.computeBoundingSphere();
          }
          child.frustumCulled = !child.isSkinnedMesh;
        }
        // Build Mesh Index for fast lookups later
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material = child.material.map(ensurePhysicalMaterial);
            } else {
                child.material = ensurePhysicalMaterial(child.material);
            }
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
                const name = m.name || m.uuid; // Use name if set, otherwise uuid as fallback
                if (!meshIndex.has(name)) meshIndex.set(name, []);
                meshIndex.get(name).push(child);
            });
        }
        // Also register mesh uuid and mesh name in meshIndex for instant direct lookups
        if (child.uuid) {
            if (!meshIndex.has(child.uuid)) meshIndex.set(child.uuid, []);
            meshIndex.get(child.uuid).push(child);
        }
        if (child.name) {
            if (!meshIndex.has(child.name)) meshIndex.set(child.name, []);
            meshIndex.get(child.name).push(child);
        }

        child.castShadow = true;
        child.receiveShadow = true;

        // Geometry Stats
        const geom = child.geometry;
        if (geom) {
          const newGeom = child.geometry;
          // Recalculate normals ONLY if they are missing
          if (!newGeom.attributes.normal) {
              newGeom.computeVertexNormals();
          }

          // AUTO-UNWRAP: If model has no UVs, apply default Box Mapping immediately
          if (!newGeom.attributes.uv) {
              applyBoxUV(child);
          }

          // Compute tangents safely for smooth normal mapping if UVs exist and they don't already exist
          safeComputeTangents(newGeom);

          if (newGeom.attributes.normal) newGeom.attributes.normal.needsUpdate = true;

          vertCount += newGeom.attributes.position.count;
          if (newGeom.index) {
            polyCount += newGeom.index.count / 3;
          } else {
            polyCount += newGeom.attributes.position.count / 3;
          }
        }
        
        // Material Naming & Grouping logic
        if (child.material) {
            
            // Determine Group Name
            let groupName = null;
            if (child.parent && child.parent.isGroup && child.parent.name && child.parent.name !== 'Scene') {
                 groupName = child.parent.name;
            }

            const processMat = (m) => {
                let uniqueName = processedMaterials.get(m.uuid);

                if (!uniqueName) {
                    let name = m.name; 
                    if (!name || name.trim() === '') {
                        const suffix = String(unnamedCount++).padStart(2, '0');
                        name = `Material_${suffix}`;
                    }
                    
                    name = name.replace(/[:|]/g, " ").trim();
                    
                    uniqueName = name;
                    let conflictCount = 1;
                    while (usedNames.has(uniqueName)) {
                        uniqueName = `${name}_${String(conflictCount++).padStart(2, '0')}`;
                    }
                    
                    m.name = uniqueName;
                    processedMaterials.set(m.uuid, uniqueName);
                    usedNames.add(uniqueName);

                    // Ensure both sides are visible and depth is handled correctly
                    m.side = THREE.DoubleSide;
                    m.depthWrite = true;

                    // Ensure original data is stored for visibility/UI logic
                    if (!m.userData.originalColor) m.userData.originalColor = m.color?.clone();
                    if (m.userData.originalOpacity === undefined) m.userData.originalOpacity = m.opacity;
                    if (m.userData.originalRoughness === undefined) m.userData.originalRoughness = m.roughness;
                    if (m.userData.originalMetalness === undefined) m.userData.originalMetalness = m.metalness;
                    if (m.userData.originalClearcoat === undefined) m.userData.originalClearcoat = m.clearcoat !== undefined ? m.clearcoat : 0;
                    if (m.userData.originalSpecularIntensity === undefined) m.userData.originalSpecularIntensity = m.specularIntensity !== undefined ? m.specularIntensity : 1.0;
                    if (m.userData.originalEnvMapIntensity === undefined) m.userData.originalEnvMapIntensity = m.envMapIntensity !== undefined ? m.envMapIntensity : 1.0;
                    if (m.map) m.userData.originalMap = m.map;
                    if (m.normalMap) m.userData.originalNormalMap = m.normalMap;
                    if (m.alphaMap) m.userData.originalAlphaMap = m.alphaMap;
                }

                // Add to Group or Ungrouped
                if (groupName) {
                    if (!groupMap.has(groupName)) groupMap.set(groupName, new Set());
                    groupMap.get(groupName).add(uniqueName);
                } else {
                    ungroupedMats.add(uniqueName);
                }
            };

            if (Array.isArray(child.material)) {
                child.material.forEach(processMat);
            } else {
                processMat(child.material);
            }
        }
      }
    });

    meshIndexRef.current = meshIndex;

    // Filter Ungrouped Materials
    const allGroupedMaterialNames = new Set();
    groupMap.forEach((matSet) => {
        matSet.forEach(name => allGroupedMaterialNames.add(name));
    });

    for (const name of ungroupedMats) {
        if (allGroupedMaterialNames.has(name)) {
            ungroupedMats.delete(name);
        }
    }

    // Build recursive scene hierarchy tree (Folder & Mesh tree)
    const buildHierarchyNode = (obj) => {
      if (!obj) return null;
      if (
        obj.isLight ||
        obj.isCamera ||
        obj.isHelper ||
        obj.name?.toLowerCase().includes("transformcontrols") ||
        obj.name?.toLowerCase().includes("gizmo")
      ) {
        return null;
      }

      const isMesh = obj.isMesh || obj.isSkinnedMesh || obj.isLine || obj.isPoints;
      const childNodes = [];

      if (obj.children && obj.children.length > 0) {
        for (const child of obj.children) {
          const childTree = buildHierarchyNode(child);
          if (childTree) {
            if (Array.isArray(childTree)) childNodes.push(...childTree);
            else childNodes.push(childTree);
          }
        }
      }

      if (isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        const matNames = mats.map((m, idx) => {
          if (!m) return null;
          if (!m.name) m.name = `Material_${idx + 1}`;
          return m.name;
        }).filter(Boolean);
        const primaryMat = matNames[0] || "Default";
        const meshName = (obj.name && obj.name !== "Scene") ? obj.name : primaryMat;

        return {
          id: obj.uuid,
          name: meshName,
          isMesh: true,
          isGroup: false,
          material: primaryMat,
          materials: matNames,
          meshUuid: obj.uuid,
          children: childNodes
        };
      }

      if (childNodes.length > 0) {
        const allDescendantMaterials = new Set();
        const collectDescendantMats = (nodeItem) => {
          if (nodeItem.materials) nodeItem.materials.forEach((m) => allDescendantMaterials.add(m));
          if (nodeItem.children) nodeItem.children.forEach(collectDescendantMats);
        };
        childNodes.forEach(collectDescendantMats);

        const groupName = (obj.name && obj.name !== "Scene") ? obj.name : "Group";

        return {
          id: obj.uuid,
          name: groupName,
          isMesh: false,
          isGroup: true,
          materials: Array.from(allDescendantMaterials),
          children: childNodes
        };
      }

      return null;
    };

    // Simplify single-child redundant dummy wrapper nodes (e.g. RootNode -> FBX_Root)
    const simplifyHierarchy = (nodes) => {
      if (!Array.isArray(nodes)) return [];

      const isGenericWrapper = (name) => /^(rootnode|root|scene|object3d|sketchfab_model|model|group_\d+|null)$/i.test((name || "").trim());

      const cleanNode = (n) => {
        if (!n) return null;
        if (n.isMesh) return n;

        let cleanChildren = [];
        if (n.children && n.children.length > 0) {
          n.children.forEach((c) => {
            const cleaned = cleanNode(c);
            if (cleaned) {
              if (Array.isArray(cleaned)) cleanChildren.push(...cleaned);
              else cleanChildren.push(cleaned);
            }
          });
        }

        if (cleanChildren.length === 0) return null;

        // Unwrap repeated single-child group chains: e.g. A -> B -> C -> D -> Mesh
        let currentNodeName = n.name;
        while (cleanChildren.length === 1 && cleanChildren[0].isGroup) {
          const onlyChild = cleanChildren[0];
          if (!isGenericWrapper(currentNodeName) && isGenericWrapper(onlyChild.name)) {
            onlyChild.name = currentNodeName;
          }
          cleanChildren = onlyChild.children || [];
        }

        if (isGenericWrapper(currentNodeName) && cleanChildren.length === 1) {
          return cleanChildren[0];
        }

        return {
          ...n,
          name: currentNodeName,
          children: cleanChildren
        };
      };

      const result = [];
      nodes.forEach((n) => {
        const cleaned = cleanNode(n);
        if (cleaned) {
          if (Array.isArray(cleaned)) result.push(...cleaned);
          else result.push(cleaned);
        }
      });
      return result;
    };

    // Extract root hierarchy nodes
    const rawHierarchy = [];
    if (scene.children && scene.children.length > 0) {
      for (const rootChild of scene.children) {
        const node = buildHierarchyNode(rootChild);
        if (node) {
          if (Array.isArray(node)) rawHierarchy.push(...node);
          else rawHierarchy.push(node);
        }
      }
    }

    const fullHierarchy = simplifyHierarchy(rawHierarchy);

    // Extract deep material data for property panel initialization
    const materialDataMap = {};
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m, mIdx) => {
          if (!m) return;
          if (!m.name) m.name = `Material_${mIdx + 1}`;

          // Ensure all surface textures on the material have RepeatWrapping enabled
          // so texture transforms (offset, scale, rotation) tile smoothly and never clamp to black edges
          [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.bumpMap, m.displacementMap, m.alphaMap, m.emissiveMap].forEach(t => {
            if (t && t !== m.aoMap && t !== m.lightMap) {
              t.wrapS = THREE.RepeatWrapping;
              t.wrapT = THREE.RepeatWrapping;
            }
          });

          if (!m.userData.originalMap && m.map) m.userData.originalMap = m.map;
          if (!m.userData.originalNormalMap && m.normalMap) m.userData.originalNormalMap = m.normalMap;
          if (!m.userData.originalAlphaMap && m.alphaMap) m.userData.originalAlphaMap = m.alphaMap;

          if (!materialDataMap[m.name]) {
            const extractTexture = (tex) => getTextureSource(tex);
            const nativeMaps = {};
            const baseSrc = extractTexture(m.map);
            if (baseSrc) nativeMaps.map = baseSrc;
            const normSrc = extractTexture(m.normalMap);
            if (normSrc) nativeMaps.normalMap = normSrc;
            const roughSrc = extractTexture(m.roughnessMap);
            if (roughSrc) nativeMaps.roughnessMap = roughSrc;
            const metalSrc = extractTexture(m.metalnessMap);
            if (metalSrc) nativeMaps.metalnessMap = metalSrc;
            const emissiveSrc = extractTexture(m.emissiveMap);
            if (emissiveSrc) nativeMaps.emissiveMap = emissiveSrc;
            const aoSrc = extractTexture(m.aoMap);
            if (aoSrc) nativeMaps.aoMap = aoSrc;
            const bumpSrc = extractTexture(m.bumpMap);
            if (bumpSrc) nativeMaps.bumpMap = bumpSrc;
            const dispSrc = extractTexture(m.displacementMap);
            if (dispSrc) nativeMaps.displacementMap = dispSrc;
            const alphaSrc = extractTexture(m.alphaMap);
            if (alphaSrc) nativeMaps.alphaMap = alphaSrc;

            const data = {
              color: '#' + (m.color ? m.color.getHexString() : 'ffffff'),
              metallic: m.metalness !== undefined ? m.metalness * 100 : 0,
              roughness: m.roughness !== undefined ? m.roughness * 100 : 50,
              opacity: m.opacity !== undefined ? m.opacity * 100 : 100,
              scale: m.map && m.map.repeat ? Math.round(100 / (m.map.repeat.x || 1)) : 100,
              maps: nativeMaps
            };
            materialDataMap[m.name] = data;
            if (child.name && !materialDataMap[child.name]) {
              materialDataMap[child.name] = data;
            }
            if (child.uuid && !materialDataMap[child.uuid]) {
              materialDataMap[child.uuid] = data;
            }
          }
        });
      }
    });

    if (fullHierarchy.length > 0) {
      if (typeof setMaterialList === 'function') setMaterialList(fullHierarchy, materialDataMap);
    } else {
      if (typeof setMaterialList === 'function') setMaterialList(Array.from(ungroupedMats).sort(), materialDataMap);
    }

    if (typeof setModelStats === 'function') {
        setModelStats({
            vertexCount: vertCount.toLocaleString(),
            polygonCount: Math.round(polyCount).toLocaleString(),
            materialCount: processedMaterials.size,
            dimensions: `${Math.round(size.x * 100) / 100} X ${Math.round(size.y * 100) / 100} X ${Math.round(size.z * 100) / 100} unit`
        });
    }

    if (typeof onModelReady === 'function') {
        // Double RAF ensures Three.js has committed geometry transforms and rendered the frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                onModelReady();
            });
        });
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // 2. Wireframe Update Effect
  useLayoutEffect(() => {
      if (!scene) return;
      meshIndexRef.current.forEach(meshes => {
          meshes.forEach(child => {
              if (child.isMesh && child.material) {
                  if (Array.isArray(child.material)) {
                      child.material.forEach(m => m.wireframe = wireframe);
                  } else {
                      child.material.wireframe = wireframe;
                  }
              }
          });
      });
  }, [scene, wireframe]);

  // 3. Material Highlight Effect (Emissive flashing disabled in favor of clean silhouette outline)
  useEffect(() => {
    // Disabled whole-mesh emissive flashing so selected mesh retains its original material and is highlighted by silhouette outline only
  }, [scene, selectedMaterial, modelName]);

  // 3.5. Apply Material Settings (Factor Adjustment)
  // 4. Determine Transform Target
  const [transformTarget, setTransformTarget] = useState(null);
  
  // Use Ref to access latest selection inside effects without triggering them
  const selectedMaterialRef = React.useRef(selectedMaterial);
  selectedMaterialRef.current = selectedMaterial;

  // 3.5. Apply Material Settings (Factor Adjustment - Scope Aware)
  // 3.5. New Approach: Split Load (Selection -> UI) and Apply (UI -> Material)



  const lastMaterialResetKeyRef = React.useRef(resetKey);
  const lastApplyResetKeyRef = React.useRef(resetKey);
  const lastMapResetKeyRef = React.useRef(resetKey);

  // A. Load Settings when Selection Changes
  useEffect(() => {
    if (!scene || xrayMode) return;
    
    // When resetKey changes (Undo, Redo, or Reset), skip loading from mesh 
    // so we don't overwrite the restored materialSettings!
    if (resetKey !== lastMaterialResetKeyRef.current) {
        lastMaterialResetKeyRef.current = resetKey;
        const sig = `${modelName || ''}_${selectedMaterial ? (selectedMaterial.uuid || selectedMaterial.name) : 'FULL'}`;
        setSyncedSelectionSignature(sig);
        return;
    }
    
    const selMat = selectedMaterial;
    const targetMatName = selMat ? selMat.name : (modelName || "Scene");
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";

    let foundMat = resolveTargetMaterial(selMat);

    if (foundMat) {
        const m = foundMat;

        const safeUpdate = (key, val) => {
            // Do not sync emissive properties to UI while the material is flashing red/white
            // to avoid overwriting user settings with temporary highlight colors.
            if (m.userData.isFlashing && (key === 'emissiveColor' || key === 'emissiveIntensity')) return;
            
            if (onUpdateMaterialSettingRef.current) {
                onUpdateMaterialSettingRef.current(key, val, true); // true = sync from model
            }
        };

        // Sync basic properties
        if (m.color && typeof m.color.getHexString === 'function') {
            safeUpdate('color', '#' + m.color.getHexString());
        }
        
        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            safeUpdate('metallic', Math.round((m.metalness || 0) * 100));
            safeUpdate('roughness', Math.round((m.roughness || 0) * 100));
        } else if (m.isMeshPhongMaterial) {
            safeUpdate('metallic', Math.round((m.shininess || 0) / 100 * 100));
            safeUpdate('roughness', 0);
        }

        if (m.opacity !== undefined) {
            safeUpdate('alpha', Math.round(m.opacity * 100));
        }

        // Sync intensity and emissive
        safeUpdate('colorIntensity', 100); 
        if (m.emissiveIntensity !== undefined) {
            safeUpdate('emissiveIntensity', Math.round(m.emissiveIntensity * 100));
        }
        if (m.emissive && typeof m.emissive.getHexString === 'function') {
            safeUpdate('emissiveColor', '#' + m.emissive.getHexString());
        }

        // Sync scales - ensure symmetry with Apply effect
        if (m.normalMap && m.normalScale) {
            safeUpdate('normal', Math.round(m.normalScale.x * 100));
        }
        
        // Bump/Disp scale sync
        if (m.displacementMap && m.displacementScale !== undefined) {
            safeUpdate('bump', Math.round(m.displacementScale * 100));
        } else if (m.bumpMap && m.bumpScale !== undefined) {
            safeUpdate('bump', Math.round(m.bumpScale / 10 * 100));
        }

        // Texture transformations
        const tex = m.map || m.normalMap || m.roughnessMap;
        if (tex) {
            safeUpdate('scale', Math.round(100 / (tex.repeat.x || 1)));
            safeUpdate('rotation', Math.round(tex.rotation * (180 / Math.PI)));
            safeUpdate('offset', { x: tex.offset.x * 100, y: tex.offset.y * 100 });
        } else {
            // Reset to defaults in UI if no texture is present on the selected material
            safeUpdate('scale', 100);
            safeUpdate('rotation', 0);
            safeUpdate('offset', { x: 0, y: 0 });
        }

        // Sync applied texture info if available
        if (m.userData.appliedTexture) {
            safeUpdate('appliedTexture', m.userData.appliedTexture);
        } else {
            safeUpdate('appliedTexture', null);
        }
    }

    // Capture signature to allow B effect to run safely
    const sig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
    setSyncedSelectionSignature(sig);

  }, [selectedMaterial, scene, modelName, resetKey, resolveTargetMaterial]); 

  // B. Apply Settings when UI changes
  useEffect(() => {
    if (!scene || !materialSettings || xrayMode) return;

    const selMat = selectedMaterial; 
    const targetMatName = selMat ? selMat.name : (modelName || "Scene");
    
    const isResetOrUndo = resetKey !== lastApplyResetKeyRef.current;
    lastApplyResetKeyRef.current = resetKey;

    // Guard: Prevent applying stale material settings if the selection has changed 
    // but the UI hasn't synced with the model's current state yet.
    const currentSig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
    if (!isResetOrUndo && syncedSelectionSignature && syncedSelectionSignature !== currentSig) {
        return;
    }

    // CRITICAL: Prevent overwriting 3D materials on passive selection change!
    // Material factors are only pushed to the 3D model if the user moved a slider/color (useFactorColor === true)
    // or triggered an Undo/Redo/Reset (isResetOrUndo === true).
    if (!isResetOrUndo && !materialSettings.useFactorColor) {
        return;
    }

    const changedProp = materialSettings.lastChangedProp;
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";
    
    const alpha = (materialSettings.alpha ?? 100) / 100;
    const metallic = (materialSettings.metallic ?? 0) / 100;
    const roughness = (materialSettings.roughness ?? 50) / 100;
    const normalScaleVal = (materialSettings.normal ?? 100) / 100;
    const bumpScaleVal = (materialSettings.bump ?? 100) / 100;
    const color = materialSettings.color;
    const emissiveColor = materialSettings.emissiveColor || '#000000';
    const emissiveIntensity = (materialSettings.emissiveIntensity ?? 0) / 100;
    
    const rawScale = materialSettings.scale !== undefined ? Number(materialSettings.scale) : 100;
    const safeScale = Math.max(1, Math.min(1000, isNaN(rawScale) ? 100 : rawScale));
    const texScaleX = 100 / safeScale;
    const texScaleY = 100 / safeScale;
    const texRotation = (materialSettings.rotation ?? 0) * (Math.PI / 180);
    const texOffsetX = (materialSettings.offset?.x ?? 0) / 100;
    const texOffsetY = (materialSettings.offset?.y ?? 0) / 100;

    const galleryTexture = materialSettings.appliedTexture;
    const isGalleryTexture = !!galleryTexture;

    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material = child.material.map(ensurePhysicalMaterial);
            } else {
                child.material = ensurePhysicalMaterial(child.material);
            }
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(m => {
                const isLightingProp = changedProp === 'specular' || changedProp === 'reflection';
                let isMatch = false;
                if (isLightingProp) {
                     // Specular and Reflection in "Lighting Controls" are scene/model-wide lighting controls
                     isMatch = true;
                } else if (selMat && !isFullModel) {
                     if (selMat.isGroup && Array.isArray(selMat.materials)) {
                          isMatch = selMat.materials.includes(m.name);
                     } else {
                          const targetUuid = selMat.uuid || selMat.meshUuid;
                          if (targetUuid) {
                              isMatch = child.uuid === targetUuid;
                          } else {
                              isMatch = m.name === targetMatName || child.name === targetMatName || (selMat.material && selMat.material === m.name);
                          }
                     }
                } else if (isFullModel) {
                     // In Full Model mode, apply overrides only if user moved a slider or on reset/undo
                     isMatch = materialSettings.useFactorColor || isResetOrUndo;
                }

                if (isMatch) {
                    // Apply ONLY the specific property that the user changed, or all on preset/reset/undo
                    const applyAll = isResetOrUndo || !changedProp;
                    
                    // 1. Color / Color Intensity
                    const applyColor = applyAll || changedProp === 'color' || changedProp === 'colorIntensity';
                    if (applyColor && color && m.color && typeof m.color.set === 'function') {
                        const intensity = (materialSettings.colorIntensity ?? 100) / 100;
                        const finalColor = new THREE.Color(color);
                        finalColor.multiplyScalar(intensity);
                        m.color.copy(finalColor);
                    }

                    // 2. Metallic, Roughness, Reflection, AO, Specular
                    if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                        if (applyAll || changedProp === 'metallic') {
                            m.metalness = metallic;
                        }
                        if (applyAll || changedProp === 'roughness') {
                            m.roughness = roughness;
                        }
                        
                        // Reflection, Specular & AO
                        if (applyAll || isLightingProp || changedProp === 'reflection' || changedProp === 'specular') {
                            const reflVal = materialSettings.reflection !== undefined ? materialSettings.reflection : 50;
                            const specVal = materialSettings.specular !== undefined ? materialSettings.specular : 50;

                            // Reflection: maps 0-100% to envMapIntensity
                            // 0% -> 0.0 (completely disabled HDRI reflection)
                            // 50% -> 1.0 (standard physical reflection)
                            // 100% -> 3.5 (rich, vivid HDRI reflection)
                            const envMapIntensity = reflVal <= 50 
                                ? (reflVal / 50) 
                                : 1.0 + ((reflVal - 50) / 50) * 2.5;
                            m.envMapIntensity = envMapIntensity;

                            // Also adjust clearcoat and reflectivity dynamically with Reflection slider
                            // so that HDRI reflection is clearly and beautifully visible on any material surface
                            if (reflVal > 50) {
                                const boost = (reflVal - 50) / 50; // 0 to 1.0
                                m.clearcoat = Math.max(m.userData?.originalClearcoat || 0, boost * 0.9);
                                m.clearcoatRoughness = 0.05 + (1.0 - boost) * 0.15;
                                m.reflectivity = 0.5 + boost * 0.5;
                            } else {
                                m.clearcoat = ((m.userData?.originalClearcoat || 0) * (reflVal / 50));
                                m.reflectivity = (reflVal / 50) * 0.5;
                            }

                            // Specular slider controls direct specular shine (glare from sun/lights).
                            // In Three.js MeshPhysicalMaterial, specularIntensity also scales indirect specular (IBL reflection).
                            // If specularIntensity is 0, Three.js zeroes out HDRI reflection.
                            // To ensure reflection works even when specular is 0, we maintain an indirect reflection floor:
                            const baseSpec = (m.userData?.originalSpecularIntensity !== undefined) ? m.userData.originalSpecularIntensity : 1.0;
                            const specMultiplier = specVal <= 50 
                                ? (specVal / 50) 
                                : 1.0 + ((specVal - 50) / 50) * 2.0;

                            // Ensure specularIntensity allows HDRI reflection to show based on reflection slider
                            const reflectionFloor = reflVal > 0 ? Math.max(0.6, (reflVal / 50)) : 0;
                            m.specularIntensity = Math.max(reflectionFloor, specMultiplier) * baseSpec;

                            if (!m.specularColor) {
                                m.specularColor = new THREE.Color(1, 1, 1);
                            } else {
                                m.specularColor.setRGB(1, 1, 1);
                            }
                            m.ior = 1.5;
                            m.needsUpdate = true;
                        }
                        if ((applyAll || changedProp === 'ao') && m.aoMap) {
                            const aoIntensity = (materialSettings.ao ?? 100) / 100;
                            m.aoMapIntensity = aoIntensity;
                        }

                        if (applyAll) {
                            if (m.userData.originalClearcoat !== undefined) {
                                m.clearcoat = m.userData.originalClearcoat;
                            }
                        }
                    }

                    // 3. Opacity & Transparency
                    if (applyAll || changedProp === 'alpha') {
                        const isTransparent = alpha < 0.999 || !!m.alphaMap;
                        m.transparent = isTransparent;
                        m.opacity = alpha;
                        m.depthWrite = !isTransparent;
                        m.alphaTest = 0; 
                    }

                    // 4. Emissive
                    if (applyAll || changedProp === 'emissiveColor' || changedProp === 'emissiveIntensity') {
                        if (m.emissive && typeof m.emissive.set === 'function') {
                            m.emissive.set(emissiveColor);
                            m.emissiveIntensity = emissiveIntensity;
                        }
                    }

                    // 5. Normal Scale
                    if ((applyAll || changedProp === 'normal') && m.normalMap && m.normalScale) {
                        m.normalScale.set(normalScaleVal, normalScaleVal);
                    }

                    // 6. Displacement & Bump Scale
                    if (applyAll || changedProp === 'bump') {
                        if (m.displacementMap) {
                            m.displacementScale = bumpScaleVal;
                        }
                        if (m.bumpMap) {
                            m.bumpScale = bumpScaleVal * 10;
                        }
                    }

                    // 7. Texture Removal Check
                    const configTextureId = materialSettings.appliedTexture?.id || materialSettings.appliedTexture?._id || null;
                    const matTextureId = m.userData.appliedTextureId || null;
                    const isNone = configTextureId === 'none';

                    if (matTextureId && (isNone || (isResetOrUndo && !configTextureId && materialSettings.useFactorColor))) {
                         // Texture was stripped from state (e.g. Undo) or 'None' selected, so strip from material
                         m.map = null;
                         m.normalMap = null;
                         m.roughnessMap = null;
                         m.metalnessMap = null;
                         m.aoMap = null;
                         m.displacementMap = null;
                         m.bumpMap = null;
                         m.alphaMap = null;
                         
                         // Restore original maps if they existed
                         if (m.userData.originalMap) m.map = m.userData.originalMap;
                         if (m.userData.originalNormalMap) m.normalMap = m.userData.originalNormalMap;
                         if (m.userData.originalAlphaMap) m.alphaMap = m.userData.originalAlphaMap;
                         
                         m.userData.appliedTexture = null;
                         m.userData.appliedTextureId = null;
                         m.needsUpdate = true;
                    }

                    // 8. Texture Transformations
                    if (applyAll || changedProp === 'scale' || changedProp === 'rotation' || changedProp === 'offset') {
                        // Transform only surface patterns, NEVER aoMap or lightMap (baked geometry ambient occlusion)
                        const surfaceTextures = [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.displacementMap, m.bumpMap, m.alphaMap, m.emissiveMap];
                        surfaceTextures.forEach(tex => {
                            if (tex) {
                                // IMPORTANT: Do not transform textures that are shared with baked aoMap or lightMap
                                if (tex === m.aoMap || tex === m.lightMap) return;

                                // GLTF textures default to ClampToEdgeWrapping which samples black borders when offset/rotated/scaled.
                                // RepeatWrapping allows texture patterns to repeat and slide seamlessly without turning black.
                                if (tex.wrapS !== THREE.RepeatWrapping || tex.wrapT !== THREE.RepeatWrapping) {
                                    tex.wrapS = THREE.RepeatWrapping;
                                    tex.wrapT = THREE.RepeatWrapping;
                                    if (tex.image) {
                                        tex.needsUpdate = true;
                                    }
                                }
                                // Safety: if texture was marked for update but has no image, clear it to prevent Three.js warning loop
                                if (!tex.image && tex.needsUpdate) {
                                    tex.needsUpdate = false;
                                }

                                if (tex.repeat && typeof tex.repeat.set === 'function') tex.repeat.set(texScaleX, texScaleY);
                                if (tex.offset && typeof tex.offset.set === 'function') tex.offset.set(texOffsetX, texOffsetY);
                                if (tex.rotation !== undefined) tex.rotation = texRotation;
                                if (tex.center && typeof tex.center.set === 'function') {
                                    if (texRotation !== 0) {
                                        tex.center.set(0.5, 0.5);
                                    } else {
                                        tex.center.set(0, 0);
                                    }
                                }
                                tex.matrixAutoUpdate = true;
                                if (typeof tex.updateMatrix === 'function') tex.updateMatrix();
                            }
                        });
                    }

                    // Restore original or applied map if it exists, and user hasn't explicitly deleted it
                    const currentMaps = materialSettings?.maps || {};
                    if (m.userData.appliedMap && !m.map && !m.userData.is_map_removed && currentMaps.map !== null) {
                        m.map = m.userData.appliedMap;
                        m.needsUpdate = true;
                    } else if (!m.userData.appliedTextureId && !m.map && m.userData.originalMap && !m.userData.is_map_removed && currentMaps.map !== null) {
                        m.map = m.userData.originalMap;
                        m.needsUpdate = true;
                    }
                    if (!m.userData.appliedTextureId && !m.alphaMap && m.userData.originalAlphaMap && !m.userData.is_alphaMap_removed && currentMaps.alphaMap !== null) {
                        m.alphaMap = m.userData.originalAlphaMap;
                        m.needsUpdate = true;
                    }
                    
                    if (!m.userData.originalColor) {
                        m.userData.originalColor = m.color.clone();
                    }

                    // Only trigger material recompile if structural properties changed (not high-frequency texture placement)
                    if (applyAll || changedProp === 'color' || changedProp === 'alpha' || changedProp === 'normal' || changedProp === 'bump') {
                        m.needsUpdate = true;
                    }
                }
            });
        }
    });
  }, [scene, materialSettings, modelName, selectedMaterial, resetKey, syncedSelectionSignature]);

  // C. Sync Map URLs from State (Independent from high-frequency slider interaction)
  useEffect(() => {
    if (!scene || !materialSettings?.maps || xrayMode) return;

    const isResetOrUndo = resetKey !== lastMapResetKeyRef.current;
    lastMapResetKeyRef.current = resetKey;
    
    // CRITICAL: Passive selection changes or slider adjustments (scale, rotation, offset, color, roughness, etc.)
    // must NEVER run this effect! Only run when maps/textures are explicitly uploaded or changed or on reset/undo.
    const changedProp = materialSettings.lastChangedProp;
    if (!isResetOrUndo && changedProp !== 'maps' && changedProp !== 'appliedTexture') {
        return;
    }

    const selMat = selectedMaterial;
    const targetMatName = selMat ? selMat.name : (modelName || "Scene");
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";

    const currentSig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
    if (!isResetOrUndo && syncedSelectionSignature && syncedSelectionSignature !== currentSig) {
        return;
    }

    const stateMaps = materialSettings.maps;
    const isNone = materialSettings.appliedTexture?.id === 'none';

    if (isNone) return;

    const rawScaleC = materialSettings.scale !== undefined ? Number(materialSettings.scale) : 100;
    const safeScaleC = Math.max(1, Math.min(1000, isNaN(rawScaleC) ? 100 : rawScaleC));
    const texScaleX = 100 / safeScaleC;
    const texScaleY = 100 / safeScaleC;

    const applyToMeshes = (meshes) => {
        meshes.forEach(child => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(m => {
                    let isMatch = false;
                    if (selectedMaterial && !isFullModel) {
                         if (selectedMaterial.isGroup && Array.isArray(selectedMaterial.materials)) {
                             isMatch = selectedMaterial.materials.includes(m.name);
                         } else {
                             const targetUuid = selectedMaterial.uuid || selectedMaterial.meshUuid;
                             if (targetUuid) {
                                 isMatch = child.uuid === targetUuid;
                             } else {
                                 isMatch = m.name === targetMatName || child.name === targetMatName || (selectedMaterial.material && selectedMaterial.material === m.name);
                             }
                         }
                    } else if (isFullModel) {
                         isMatch = materialSettings.useFactorColor || isResetOrUndo;
                    }

                    if (isMatch) {
                        const syncMap = (mapProp, stateUrl, isColor = false) => {
                            if (stateUrl && (!m[mapProp] || m[mapProp].userData?.url !== stateUrl)) {
                                // Performance: Use global cache for instant texture application
                                const cacheKey = `${stateUrl}_${isColor}`;
                                if (globalTextureCache.has(cacheKey)) {
                                    const cachedTex = globalTextureCache.get(cacheKey);
                                    m[mapProp] = cachedTex;
                                    if (m[mapProp]?.repeat && typeof m[mapProp].repeat.set === 'function') m[mapProp].repeat.set(texScaleX, texScaleY);
                                    m.userData[`is_${mapProp}_removed`] = false;
                                    m.needsUpdate = true;
                                    return;
                                }

                                sharedTextureLoader.load(stateUrl, (tex) => {
                                    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                                    tex.flipY = false;
                                    tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
                                    tex.userData.url = stateUrl;
                                    if (tex?.repeat && typeof tex.repeat.set === 'function') tex.repeat.set(texScaleX, texScaleY);
                                    globalTextureCache.set(cacheKey, tex);
                                    m[mapProp] = tex;
                                    m.userData[`is_${mapProp}_removed`] = false;
                                    m.needsUpdate = true;
                                });
                            } else if (stateUrl === null || stateUrl === 'none' || (isResetOrUndo && !stateUrl)) {
                                if (m[mapProp]) {
                                    m[mapProp] = null;
                                    // Restore original native maps if this mesh had them
                                    if (mapProp === 'map' && m.userData.originalMap) m.map = m.userData.originalMap;
                                    if (mapProp === 'normalMap' && m.userData.originalNormalMap) m.normalMap = m.userData.originalNormalMap;
                                    if (mapProp === 'roughnessMap' && m.userData.originalRoughnessMap) m.roughnessMap = m.userData.originalRoughnessMap;
                                    if (mapProp === 'metalnessMap' && m.userData.originalMetalnessMap) m.metalnessMap = m.userData.originalMetalnessMap;
                                    if (mapProp === 'aoMap' && m.userData.originalAoMap) m.aoMap = m.userData.originalAoMap;
                                    m.userData[`is_${mapProp}_removed`] = true;
                                    m.needsUpdate = true;
                                }
                            }
                        };

                        syncMap('map', stateMaps.map, true);
                        syncMap('normalMap', stateMaps.normalMap);
                        syncMap('roughnessMap', stateMaps.roughnessMap);
                        syncMap('metalnessMap', stateMaps.metalnessMap);
                        syncMap('aoMap', stateMaps.aoMap);
                        syncMap('displacementMap', stateMaps.displacementMap);
                        syncMap('bumpMap', stateMaps.bumpMap);
                        syncMap('alphaMap', stateMaps.alphaMap);
                        syncMap('emissiveMap', stateMaps.emissiveMap, true);
                    }
                });
            }
        });
    };

    if (isFullModel) {
        if (!materialSettings.useFactorColor && !isResetOrUndo) return;
        meshIndexRef.current.forEach(applyToMeshes);
    } else {
        const targetMeshes = resolveTargetMeshes(selectedMaterial);
        applyToMeshes(targetMeshes);
    }
  }, [scene, materialSettings?.maps, materialSettings?.appliedTexture, selectedMaterial, modelName, resetKey, resolveTargetMeshes]);

  // C. Handle overall visibility
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            let isHidden = false;
            if (hiddenMaterials) {
                const childMatNames = Array.isArray(child.material) 
                    ? child.material.map(m => m?.name).filter(Boolean)
                    : [child.material?.name].filter(Boolean);

                isHidden = (child.uuid && hiddenMaterials.has(child.uuid)) || 
                           (child.name && hiddenMaterials.has(child.name)) || 
                           (!child.name && childMatNames.some(mName => hiddenMaterials.has(mName)));
            }
            child.visible = !isHidden;
        }
    });
  }, [scene, hiddenMaterials]);

  const prevTransformTargetRef = React.useRef(null);
  const lastTransformResetKeyRef = React.useRef(resetKey);

  // 3.5 Capture Initial Transforms (runs once per scene load)
  useEffect(() => {
    if (!scene) return;
    
    const capture = (obj) => {
        if (!obj.userData.originalTransform) {
            obj.userData.originalTransform = {
                position: obj.position.clone(),
                rotation: obj.rotation.clone(),
                scale: obj.scale.clone()
            };
        }
    };

    capture(scene);
    scene.traverse(capture);
  }, [scene]);

  // 4. Determine Transform Target (Runs BEFORE transform sync)
  useEffect(() => {
    if (!scene) return;

    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const targetUuid = selectedMaterial ? selectedMaterial.uuid : null;
    const isGroup = selectedMaterial ? selectedMaterial.isGroup : false;
    
    if (!targetName || targetName === "Scene") {
        setTransformTarget(null);
        relatedMeshesRef.current = [];
        followerOffsetsRef.current.clear();
        return;
    }

    // Default to Full Model (modelGroup) if Model Name selected
    if (targetName === modelName) {
        relatedMeshesRef.current = [];
        followerOffsetsRef.current.clear();

        if (modelGroup) {
            setTransformTarget(modelGroup);
            if (typeof onTransformChange === 'function') {
                const norm = scene.userData?.normalization;
                const bx = norm?.position?.[0] ?? 0;
                const by = norm?.position?.[1] ?? 0;
                const bz = norm?.position?.[2] ?? 0;
                const bScale = norm?.scale ?? 1;
                onTransformChange({
                    position: {
                        x: modelGroup.position.x - bx,
                        y: modelGroup.position.y - by,
                        z: modelGroup.position.z - bz
                    },
                    rotation: {
                        x: modelGroup.rotation.x,
                        y: modelGroup.rotation.y,
                        z: modelGroup.rotation.z
                    },
                    scale: {
                        x: bScale ? modelGroup.scale.x / bScale : 1,
                        y: bScale ? modelGroup.scale.y / bScale : 1,
                        z: bScale ? modelGroup.scale.z / bScale : 1
                    }
                });
            }
        }
        return;
    }

    // Priority 0: Group Selection (Handle both physical Scene groups and UI-only Material groups)
    if (isGroup) {
        let physicalGroup = null;
        scene.traverse((child) => {
            if (physicalGroup) return;
            if (child.isGroup && child.name === targetName) {
                physicalGroup = child;
            }
        });
        
        if (physicalGroup) {
            setTransformTarget(physicalGroup);
            return; 
        }

        const groupMats = selectedMaterial.materials || [];
        if (groupMats.length > 0) {
            const allMatches = [];
            scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    const m = child.material;
                    const mats = Array.isArray(m) ? m : [m];
                    if (mats.some(mat => groupMats.includes(mat.name))) {
                        allMatches.push(child);
                    }
                }
            });

            if (allMatches.length > 0) {
                const leader = allMatches[0];
                setTransformTarget(leader);
                relatedMeshesRef.current = allMatches;

                if (allMatches.length > 1) {
                    leader.updateMatrixWorld(true);
                    const leaderWorldInverse = new THREE.Matrix4().copy(leader.matrixWorld).invert();
                    
                    const offsets = new Map();
                    allMatches.forEach(mesh => {
                        if (mesh === leader) return;
                        mesh.updateMatrixWorld(true);
                        const relativeMatrix = new THREE.Matrix4().multiplyMatrices(leaderWorldInverse, mesh.matrixWorld);
                        offsets.set(mesh.uuid, relativeMatrix);
                    });
                    followerOffsetsRef.current = offsets;
                } else {
                    followerOffsetsRef.current = new Map();
                }

                return;
            }
        }
    }

    // Otherwise, try to find the mesh with the selected material
    let foundMesh = null;

    // Priority 1: UUID Match
    if (targetUuid) {
        scene.traverse((child) => {
            if (foundMesh) return;
            if (child.uuid === targetUuid) {
                foundMesh = child;
            }
        });
    }

    // Priority 2: Name Match
    if (!foundMesh) {
        scene.traverse((child) => {
            if (foundMesh) return;
            if (child.isMesh && child.material) {
                 const m = child.material;
                 if (Array.isArray(m)) {
                     if (m.some(mat => mat.name === targetName)) foundMesh = child;
                 } else {
                     if (m.name === targetName) foundMesh = child;
                 }
            }
        });
    }

    // Multi-Mesh Identification
    const allMatches = [];
    if (foundMesh && !isGroup && targetName !== modelName) {
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                const m = child.material;
                let hasMatch = false;
                if (Array.isArray(m)) {
                    hasMatch = m.some(mat => mat.name === targetName);
                } else {
                    hasMatch = m.name === targetName;
                }
                if (hasMatch) allMatches.push(child);
            }
        });
    }
    relatedMeshesRef.current = allMatches;

    if (allMatches.length > 1) {
        const leader = foundMesh;
        leader.updateMatrixWorld(true);
        const leaderWorldInverse = new THREE.Matrix4().copy(leader.matrixWorld).invert();
        
        const offsets = new Map();
        allMatches.forEach(mesh => {
            if (mesh === leader) return;
            mesh.updateMatrixWorld(true);
            const relative = new THREE.Matrix4().multiplyMatrices(leaderWorldInverse, mesh.matrixWorld);
            offsets.set(mesh.uuid, relative);
        });
        followerOffsetsRef.current = offsets;
    } else {
        followerOffsetsRef.current.clear();
    }

    setTransformTarget(foundMesh);
    if (foundMesh && typeof onTransformChange === 'function') {
        onTransformChange({
            position: foundMesh.position,
            rotation: foundMesh.rotation,
            scale: foundMesh.scale
        });
    }
  }, [scene, selectedMaterial, modelName, onTransformChange, modelGroup]);

  // 4.5. Sync transformValues (from UI / Undo) → the currently ACTIVE transform target only.
  useEffect(() => {
      const isResetOrUndo = resetKey !== lastTransformResetKeyRef.current;
      lastTransformResetKeyRef.current = resetKey;

      if (!transformTarget) {
          prevTransformTargetRef.current = null;
          return;
      }

      if (!transformValues || !transformValues.position || !transformValues.rotation || !transformValues.scale) return;

      // Strict target validation: Ensure transformTarget matches selectedMaterial
      const targetName = selectedMaterial ? selectedMaterial.name : (modelName || "Scene");
      const isTargetValid = (() => {
          if (!selectedMaterial || targetName === modelName || targetName === "Scene") {
              return transformTarget === modelGroup || transformTarget === scene;
          }
          if (selectedMaterial.uuid && transformTarget.uuid === selectedMaterial.uuid) {
              return true;
          }
          if (selectedMaterial.isGroup && Array.isArray(selectedMaterial.materials)) {
              const m = transformTarget.material;
              const mats = Array.isArray(m) ? m : [m];
              return mats.some(mat => selectedMaterial.materials.includes(mat?.name));
          }
          const m = transformTarget.material;
          const mats = Array.isArray(m) ? m : [m];
          return mats.some(mat => mat?.name === targetName);
      })();

      if (!isTargetValid) {
          // Guard: If transformTarget has not yet updated to match selectedMaterial, skip applying to avoid corrupting wrong mesh
          return;
      }

      if (!isResetOrUndo && prevTransformTargetRef.current !== transformTarget) {
          prevTransformTargetRef.current = transformTarget;
          return;
      }
      prevTransformTargetRef.current = transformTarget;

      if (transformTarget === modelGroup) {
          const norm = scene.userData?.normalization;
          if (norm) {
              const [bx, by, bz] = norm.position || [0, 0, 0];
              const bScale = norm.scale || 1;
              transformTarget.position.set(
                  bx + (transformValues.position.x || 0),
                  by + (transformValues.position.y || 0),
                  bz + (transformValues.position.z || 0)
              );
              transformTarget.rotation.set(
                  transformValues.rotation.x || 0,
                  transformValues.rotation.y || 0,
                  transformValues.rotation.z || 0
              );
              transformTarget.scale.set(
                  bScale * (transformValues.scale.x || 1),
                  bScale * (transformValues.scale.y || 1),
                  bScale * (transformValues.scale.z || 1)
              );
              transformTarget.updateMatrixWorld?.(true);
              return;
          }
      }

      transformTarget.position.set(
          transformValues.position.x,
          transformValues.position.y,
          transformValues.position.z
      );
      transformTarget.rotation.set(
          transformValues.rotation.x,
          transformValues.rotation.y,
          transformValues.rotation.z
      );
      transformTarget.scale.set(
          transformValues.scale.x,
          transformValues.scale.y,
          transformValues.scale.z
      );
      transformTarget.updateMatrixWorld?.(true);

  }, [transformTarget,
      transformValues?.position?.x, transformValues?.position?.y, transformValues?.position?.z,
      transformValues?.rotation?.x, transformValues?.rotation?.y, transformValues?.rotation?.z,
      transformValues?.scale?.x, transformValues?.scale?.y, transformValues?.scale?.z,
      selectedMaterial, modelName, resetKey, modelGroup, scene]);

  // 5. Scene-Wide Reset Effect
  useEffect(() => {
    if (sceneResetTrigger > 0 && scene) {
        // Reset the root scene object
        if (scene.userData.normalization) {
            const norm = scene.userData.normalization;
            scene.position.set(0, 0, 0);
            scene.rotation.set(0, 0, 0);
            scene.scale.set(1, 1, 1);
            scene.updateMatrixWorld(true);
            setPosition(norm.position);
            setScale(norm.scale);
        } else if (scene.userData.originalTransform) {
            const orig = scene.userData.originalTransform;
            scene.position.copy(orig.position);
            scene.rotation.copy(orig.rotation);
            scene.scale.copy(orig.scale);
            scene.updateMatrix();
        }

        // Reset all individual objects that have been moved
        meshIndexRef.current.forEach(meshes => {
            meshes.forEach(child => {
                 if (child.userData && child.userData.originalTransform) {
                     const original = child.userData.originalTransform;
                     child.position.copy(original.position);
                     child.rotation.copy(original.rotation);
                     child.scale.copy(original.scale);
                     child.updateMatrix();
                     child.updateMatrixWorld(true);
                 }
            });
        });

        // Reset the main model group wrapper if it was moved
        if (modelGroup) {
             const norm = scene.userData?.normalization;
             if (norm) {
                 const [bx, by, bz] = norm.position || [0, 0, 0];
                 const bScale = norm.scale || 1;
                 modelGroup.position.set(bx, by, bz);
                 modelGroup.rotation.set(0, 0, 0);
                 modelGroup.scale.set(bScale, bScale, bScale);
             } else if (modelGroup.userData.originalTransform) {
                 const original = modelGroup.userData.originalTransform;
                 modelGroup.position.copy(original.position);
                 modelGroup.rotation.copy(original.rotation);
                 modelGroup.scale.copy(original.scale);
             } else {
                 modelGroup.position.set(0,0,0);
                 modelGroup.rotation.set(0,0,0);
                 modelGroup.scale.set(1,1,1);
             }
             modelGroup.updateMatrix();
             modelGroup.updateMatrixWorld(true);
        }
    }
  }, [sceneResetTrigger, scene, modelGroup]);

  // 6. UV Unwrap Logic (Auto Default)
  const applyBoxUV = (mesh) => {
      if (!mesh.geometry) return;
      
      const geometry = mesh.geometry;
      geometry.computeBoundingBox();
      
      const { min, max } = geometry.boundingBox;
      const range = new THREE.Vector3().subVectors(max, min);
      if(range.x === 0) range.x = 1;
      if(range.y === 0) range.y = 1;
      if(range.z === 0) range.z = 1;

      const posAttribute = geometry.attributes.position;
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      const normalAttribute = geometry.attributes.normal;

      const uvAttribute = geometry.attributes.uv || new THREE.BufferAttribute(new Float32Array(posAttribute.count * 2), 2);
      
      for (let i = 0; i < posAttribute.count; i++) {
          const x = posAttribute.getX(i);
          const y = posAttribute.getY(i);
          const z = posAttribute.getZ(i);
          
          const nx = Math.abs(normalAttribute.getX(i));
          const ny = Math.abs(normalAttribute.getY(i));
          const nz = Math.abs(normalAttribute.getZ(i));
          
          let u = 0, v = 0;

          if (nx >= ny && nx >= nz) {
              u = (z - min.z) / range.z;
              v = (y - min.y) / range.y;
          } else if (ny >= nx && ny >= nz) {
              u = (x - min.x) / range.x;
              v = (z - min.z) / range.z;
          } else {
              u = (x - min.x) / range.x;
              v = (y - min.y) / range.y;
          }
          
          uvAttribute.setXY(i, u, v);
      }
      
      geometry.setAttribute('uv', uvAttribute);
      geometry.attributes.uv.needsUpdate = true;
      
      // Re-compute tangents safely if normal mapping is expected
      safeComputeTangents(geometry);
  };

  useEffect(() => {
    if (scene && uvUnwrapTrigger > 0) {
        const targetMatName = selectedMaterial ? selectedMaterial.name : null;
        const isFullModel = !targetMatName || (modelName && targetMatName === modelName);
        const isGroup = selectedMaterial?.isGroup;
        const groupMats = selectedMaterial?.materials || [];


        let modifiedAny = false;
        
        const applyToSelection = (meshes) => {
            meshes.forEach(child => {
                if (child.isMesh && child.material) {
                    applyBoxUV(child);
                    modifiedAny = true;
                }
            });
        };

        if (isFullModel) {
            meshIndexRef.current.forEach(applyToSelection);
        } else {
            const targetMeshes = resolveTargetMeshes(selectedMaterial);
            applyToSelection(targetMeshes);
        }

        if (modifiedAny) {
            // Since UV unwrapping changes geometry attributes (permanent till reload), 
            // we treat it as a state change for the history.
            // We'll push a snapshot of current settings.
            if (onUpdateMaterialSettingRef.current) {
                // Trigger a dummy update to force a history push if needed, 
                // but since this is geometry, we just want a checkpoint.
                onUpdateMaterialSettingRef.current('uvUnwrap', Date.now(), false);
            }
        }
    }
  }, [uvUnwrapTrigger, scene, selectedMaterial, modelName, resolveTargetMeshes]);


  return (
    <>
         {transformMode && transformTarget && (
              <TransformControls 
                 key={transformTarget.uuid}
                 object={transformTarget} 
                 mode={transformMode} 
                 size={0.8} 
                  space="local" 
                  onPointerDown={(e) => {
                      e.stopPropagation();
                  }}
                  onChange={() => {
                     if (typeof onTransformChange === 'function' && transformTarget) {
                         // Multi-mesh sync during active transform
                         if (relatedMeshesRef.current.length > 1 && !isSyncingRef.current) {
                             isSyncingRef.current = true;
                             try {
                                 transformTarget.updateMatrixWorld(true);
                                 const leaderWorldMatrix = transformTarget.matrixWorld;

                                 relatedMeshesRef.current.forEach(follower => {
                                     if (follower === transformTarget) return;
                                     
                                     const relativeMatrix = followerOffsetsRef.current.get(follower.uuid);
                                     if (relativeMatrix) {
                                         // follower.matrixWorld = leader.matrixWorld * relativeMatrix
                                         const newWorldMatrix = new THREE.Matrix4().multiplyMatrices(leaderWorldMatrix, relativeMatrix);
                                         
                                         // Apply to follower (maintaining its own parentage)
                                         // We need to invert the follower's parent's world matrix to get the local matrix
                                         const parentInverse = new THREE.Matrix4().copy(follower.parent.matrixWorld).invert();
                                         const newLocalMatrix = new THREE.Matrix4().multiplyMatrices(parentInverse, newWorldMatrix);
                                         
                                         newLocalMatrix.decompose(follower.position, follower.quaternion, follower.scale);
                                         follower.updateMatrix();
                                     }
                                 });
                             } finally {
                                 isSyncingRef.current = false;
                             }
                         }

                         // Always report the current target's live values back to the panel
                         // so the display stays in sync while the user drags the gizmo.
                         if (transformTarget === modelGroup) {
                             const norm = scene.userData?.normalization;
                             const bx = norm?.position?.[0] ?? 0;
                             const by = norm?.position?.[1] ?? 0;
                             const bz = norm?.position?.[2] ?? 0;
                             const bScale = norm?.scale ?? 1;
                             onTransformChange({
                                 position: {
                                     x: transformTarget.position.x - bx,
                                     y: transformTarget.position.y - by,
                                     z: transformTarget.position.z - bz
                                 },
                                 rotation: {
                                     x: transformTarget.rotation.x,
                                     y: transformTarget.rotation.y,
                                     z: transformTarget.rotation.z
                                 },
                                 scale: {
                                     x: bScale ? transformTarget.scale.x / bScale : 1,
                                     y: bScale ? transformTarget.scale.y / bScale : 1,
                                     z: bScale ? transformTarget.scale.z / bScale : 1
                                 }
                             });
                         } else {
                             onTransformChange({
                                 position: transformTarget.position,
                                 rotation: transformTarget.rotation,
                                 scale: transformTarget.scale
                             });
                         }
                     }
                 }}
                  onMouseDown={typeof onTransformStart === 'function' ? onTransformStart : undefined}
                  onMouseUp={typeof onTransformEnd === 'function' ? onTransformEnd : undefined}
              />
         )}
        <group 
            ref={setModelGroup}
            scale={scale}
            position={position}
            onPointerDown={(e) => {
                e.stopPropagation();
                meshPointerDownPosRef.current = { x: e.clientX, y: e.clientY };
            }}
            onClick={(e) => {
                e.stopPropagation();

                // Movement check: if user dragged to rotate the camera, ignore selection
                if (meshPointerDownPosRef.current) {
                    const dx = Math.abs(e.clientX - meshPointerDownPosRef.current.x);
                    const dy = Math.abs(e.clientY - meshPointerDownPosRef.current.y);
                    if (dx > 6 || dy > 6) return;
                }

                const intersections = e.intersections;
                if (intersections && intersections.length > 0) {
                    // Selection Guard: Ignore selection if the user is clicking on active transformation handles
                    const closest = intersections[0].object;
                    let isGizmo = false;
                    let p = closest;
                    while (p) {
                        if (p.isTransformControls || p.name?.includes('Transform') || p.name?.includes('Gizmo')) {
                            isGizmo = true;
                            break;
                        }
                        p = p.parent;
                    }
                    if (isGizmo) return;
                }

                // Identify the specific mesh hit: find the first intersection that is a mesh inside this scene
                let mesh = e.object;
                if (intersections && intersections.length > 0) {
                    for (const hit of intersections) {
                        let curr = hit.object;
                        let isPartOfScene = false;
                        while (curr) {
                            if (curr === scene) {
                                isPartOfScene = true;
                                break;
                            }
                            curr = curr.parent;
                        }
                        if (isPartOfScene && (hit.object.isMesh || hit.object.isSkinnedMesh)) {
                            mesh = hit.object;
                            break;
                        }
                    }
                }

                if (mesh && (mesh.isMesh || mesh.isSkinnedMesh)) {
                    let mat = mesh.userData?.__preXrayMaterial || mesh.material;
                    if (Array.isArray(mat)) {
                        if (e.face && e.face.materialIndex !== undefined) {
                            mat = mat[e.face.materialIndex];
                        } else {
                            mat = mat[0];
                        }
                    }
                    const matName = (mat && mat.name) ? mat.name : (mesh.name || "Material");
                    const meshName = mesh.name || matName;
                    if (typeof onSelectMaterial === 'function') {
                        onSelectMaterial({ 
                            name: meshName, 
                            material: matName,
                            uuid: mesh.uuid, 
                            meshUuid: mesh.uuid,
                            meshName: mesh.name || meshName,
                            parentGroup: modelName,
                            isMesh: true,
                            isShift: e.shiftKey 
                        });
                    }
                }
            }}
        >
            <primitive 
                object={scene} 
            />
        </group>

        {/* Clean silhouette outline for selected mesh */}
        {(() => {
          if (!selectedMaterial || selectedMaterial.name === modelName || selectedMaterial.name === 'Scene') return null;
          const target = transformTarget || resolveTargetMeshes(selectedMaterial);
          if (!target || (Array.isArray(target) && target.length === 0)) return null;
          return <MeshSelectionHighlight target={target} />;
        })()}
    </>
  );
}));

export default GenericModel;
