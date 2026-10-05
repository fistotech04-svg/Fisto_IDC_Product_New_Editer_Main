import * as THREE from "three";
import { GLTFExporter, STLExporter } from "three-stdlib";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { MeshoptEncoder } from "meshoptimizer";

/**
 * Handle Export 3D Model: supports GLB, GLTF, STL, Meshopt compression,
 * material texture embedding, downscaling, orientation and scope.
 */
export async function executeExport3D({
  exportSettings,
  sceneWrapperRef,
  models,
  modelName,
  setManualLoading,
  setLoadingText,
  toast
}) {
  const {
    exportScope,
    selectedMaterial,
    exportFormat,
    fileName,
    customMaterialNames,
    compression = 0,
    includeTextures = true,
    embedTextures = true,
    quality = 'Medium',
    orientation = 'Y axis up',
    exportSeparate = false,
  } = typeof exportSettings === 'object' ? exportSettings : { exportFormat: exportSettings };

  const format = exportFormat?.toLowerCase() || 'glb';
  if (!sceneWrapperRef.current || models.length === 0) return;
  setManualLoading(true);

  setLoadingText("Preparing export...");
  const name = fileName || modelName || (models.length > 0 ? models[0].name : "Scene");
  const isGLB = format === 'glb' || format === 'gltf';
  const useMeshopt = isGLB && compression > 0;
  const qualityTextureSize = { Low: 512, Medium: 1024, High: 2048, Original: 4096 }[quality] ?? 1024;

  const TEX_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'displacementMap'];
  const originalTextures = new Map();
  const visibilityMap = new Map();

  // 1. Prepare scene clone for processing to avoid touching live scene
  const scene = SkeletonUtils.clone(sceneWrapperRef.current);

  // Ensure materials are only cloned once (shared materials stay shared)
  const clonedMaterials = new Map();
  scene.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map(m => {
          if (!clonedMaterials.has(m)) clonedMaterials.set(m, m.clone());
          return clonedMaterials.get(m);
        });
      } else {
        const m = obj.material;
        if (!clonedMaterials.has(m)) clonedMaterials.set(m, m.clone());
        obj.material = clonedMaterials.get(m);
      }
    }
  });

  const isZUp = orientation === 'Z axis up';

  // Apply Orientation transformation to clone
  if (isZUp) {
    scene.rotation.x = -Math.PI / 2;
    scene.updateMatrixWorld(true);
  }

  scene.traverse((obj) => {
    if (obj.isMesh || obj.isLight || obj.isHelper) visibilityMap.set(obj, obj.visible);
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        // Sanitization for Export: Fix depth sorting and transparency glitches
        const isTrans = (mat.opacity < 0.99) || !!mat.alphaMap;
        mat.transparent = isTrans;
        mat.depthWrite = !isTrans;
        mat.alphaTest = 0;

        if (!originalTextures.has(mat)) {
          const snap = {};
          TEX_KEYS.forEach(k => { snap[k] = mat[k]; });
          originalTextures.set(mat, snap);
        }
      });
    }
  });

  const restoreAll = () => {
    if (isZUp) {
      scene.rotation.x = 0;
      scene.updateMatrixWorld(true);
    }
    visibilityMap.forEach((v, obj) => { if (obj) obj.visible = v; });
    originalTextures.forEach((snap, mat) => {
      TEX_KEYS.forEach(k => { mat[k] = snap[k]; });
      mat.needsUpdate = true;
    });
  };

  const applyTexturePolicy = () => {
    if (!includeTextures) {
      originalTextures.forEach((_snap, mat) => {
        TEX_KEYS.forEach(k => { mat[k] = null; });
        mat.needsUpdate = true;
      });
    }
  };

  // STEP 1: Three.js scene -> raw GLB ArrayBuffer
  const exportSceneToGLBBuffer = (targetScene) => new Promise((resolve, reject) => {
    let exportRoot = targetScene;

    const exportAnimations = [];
    const seenClipIds = new Set();
    const addClip = (anim) => {
      if (anim && Array.isArray(anim.tracks) && anim.tracks.length > 0) {
        const id = anim.name || anim.uuid;
        if (!seenClipIds.has(id)) {
          seenClipIds.add(id);
          exportAnimations.push(anim.clone());
        }
      }
    };

    if (exportRoot.animations && Array.isArray(exportRoot.animations)) {
      exportRoot.animations.forEach(addClip);
    }
    exportRoot.traverse((child) => {
      if (child.animations && Array.isArray(child.animations)) {
        child.animations.forEach(addClip);
      }
    });
    targetScene.traverse((child) => {
      if (child.animations && Array.isArray(child.animations)) {
        child.animations.forEach(addClip);
      }
    });
    models.forEach((m) => {
      if (m.animations && Array.isArray(m.animations)) {
        m.animations.forEach(addClip);
      }
      if (m.scene?.animations && Array.isArray(m.scene.animations)) {
        m.scene.animations.forEach(addClip);
      }
    });

    // Sanitize animation track names to match nodes in exportRoot
    const sanitizedExportAnimations = [];
    exportAnimations.forEach(clip => {
      const clonedClip = clip.clone();
      const resolvableTracks = [];
      clonedClip.tracks.forEach(track => {
        const clonedTrack = track.clone();
        const parts = clonedTrack.name.split('.');
        const propertyName = parts.pop();
        const targetPath = parts.join('.');

        let targetNode = THREE.PropertyBinding.findNode(exportRoot, targetPath);
        if (!targetNode && targetPath.includes('/')) {
          const baseNodeName = targetPath.split('/').pop();
          const found = exportRoot.getObjectByName(baseNodeName);
          if (found) {
            clonedTrack.name = `${baseNodeName}.${propertyName}`;
            targetNode = found;
          }
        } else if (!targetNode) {
          const found = exportRoot.getObjectByName(targetPath);
          if (found) {
            targetNode = found;
          }
        }
        if (targetNode) {
          resolvableTracks.push(clonedTrack);
        }
      });
      if (resolvableTracks.length > 0) {
        clonedClip.tracks = resolvableTracks;
        sanitizedExportAnimations.push(clonedClip);
      }
    });

    // Strip any cloned helper tools, cameras, lights, or corrupt meshes
    const controlsToRemove = [];
    exportRoot.traverse((obj) => {
      if (
        obj.isTransformControls ||
        obj.isTransformControlsGizmo ||
        obj.isTransformControlsPlane ||
        obj.isCamera ||
        obj.isLight ||
        obj.type === 'TransformControls' ||
        obj.type === 'TransformControlsGizmo' ||
        obj.type === 'TransformControlsPlane' ||
        obj.name?.toLowerCase().includes('transformcontrols') ||
        obj.name?.toLowerCase().includes('gizmo')
      ) {
        controlsToRemove.push(obj);
        return;
      }

      if (obj.isMesh || obj.isLine || obj.isPoints) {
        if (!obj.geometry || !obj.geometry.attributes || !obj.geometry.attributes.position || !obj.geometry.attributes.position.array || obj.geometry.attributes.position.count === 0) {
          controlsToRemove.push(obj);
          return;
        }
      }

      if (obj.isSkinnedMesh) {
        if (!obj.skeleton || !Array.isArray(obj.skeleton.bones) || obj.skeleton.bones.length === 0) {
          obj.isSkinnedMesh = false;
          delete obj.skeleton;
          delete obj.bindMatrix;
          delete obj.bindMatrixInverse;
        }
      }
    });
    controlsToRemove.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);
    });

    // Restore all hierarchy nodes to bind pose before export
    exportRoot.traverse((child) => {
      if (child.userData?.__bindPos && child.userData?.__bindQuat && child.userData?.__bindScale) {
        const p = child.userData.__bindPos;
        const q = child.userData.__bindQuat;
        const s = child.userData.__bindScale;
        child.position.set(p[0], p[1], p[2]);
        if (Math.hypot(q[0], q[1], q[2], q[3]) > 0.0001) {
          child.quaternion.set(q[0], q[1], q[2], q[3]).normalize();
        } else {
          child.quaternion.identity();
        }
        child.scale.set(s[0], s[1], s[2]);
        child.updateMatrix();
      } else if (child.isBone) {
        if (child.userData?.__bindPos) {
          const p = child.userData.__bindPos;
          child.position.set(p[0], p[1], p[2]);
        }
        if (child.userData?.__bindQuat) {
          const q = child.userData.__bindQuat;
          if (Math.hypot(q[0], q[1], q[2], q[3]) > 0.0001) {
            child.quaternion.set(q[0], q[1], q[2], q[3]).normalize();
          }
        }
        if (child.userData?.__bindScale) {
          const s = child.userData.__bindScale;
          child.scale.set(s[0], s[1], s[2]);
        }
        if (!child.userData?.__bindQuat && child.userData?.__bindTransform?.quaternion) {
          const q = child.userData.__bindTransform.quaternion;
          const qx = q.x !== undefined ? q.x : q._x;
          const qy = q.y !== undefined ? q.y : q._y;
          const qz = q.z !== undefined ? q.z : q._z;
          const qw = q.w !== undefined ? q.w : (q._w !== undefined ? q._w : 1);
          if (qx !== undefined && !isNaN(qx) && Math.hypot(qx, qy, qz, qw) > 0.0001) {
            child.quaternion.set(qx, qy, qz, qw).normalize();
          }
        }
        child.updateMatrix();
      }
    });

    try {
      exportRoot.updateMatrixWorld(true);
    } catch (e) {
      console.warn("Matrix update warning during GLB export:", e);
    }

    new GLTFExporter().parse(
      exportRoot,
      (result) => resolve(result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result)).buffer),
      reject,
      {
        binary: true,
        forceIndices: true,
        trs: true,
        onlyVisible: false,
        maxTextureSize: qualityTextureSize,
        embedImages: embedTextures,
        includeCustomExtensions: false,
        animations: (sanitizedExportAnimations && sanitizedExportAnimations.length > 0) ? sanitizedExportAnimations : []
      }
    );
  });

  // STEP 2: gltf-transform Meshopt post-process
  const applyMeshoptToBuffer = async (glbBuffer) => {
    setLoadingText("Applying Meshopt compression...");
    try {
      const { WebIO } = await import('@gltf-transform/core');
      const { EXTMeshoptCompression } = await import('@gltf-transform/extensions');
      const { dedup, prune, reorder } = await import('@gltf-transform/functions');
      await MeshoptEncoder.ready;
      const io = new WebIO().registerExtensions([EXTMeshoptCompression]);
      const doc = await io.readBinary(new Uint8Array(glbBuffer));
      await doc.transform(dedup(), prune(), reorder({ encoder: MeshoptEncoder }));
      return (await io.writeBinary(doc)).buffer;
    } catch (err) {
      console.error("Meshopt compression failed - using uncompressed GLB:", err);
      return glbBuffer;
    }
  };

  const exportNonGLBBlob = (targetScene) => {
    if (format === 'stl') return new Blob([new STLExporter().parse(targetScene)], { type: 'application/octet-stream' });
    throw new Error("Unsupported format: " + format);
  };

  const triggerDownload = (data, dlName) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = dlName; a.click();
  };

  try {
    applyTexturePolicy();

    if (exportScope === 'selection' && selectedMaterial) {
      const names = selectedMaterial.isGroup ? selectedMaterial.materials : [selectedMaterial.name];
      const nameSet = new Set(names);
      scene.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          const hit = (obj.name && nameSet.has(obj.name)) || mats.some(m => nameSet.has(m.name));
          obj.visible = hit;
        } else if (obj.isLight || obj.isHelper) {
          obj.visible = false;
        }
      });
    }

    if (isGLB) {
      setLoadingText("Exporting model as GLB...");
      let buf = await exportSceneToGLBBuffer(scene);
      if (useMeshopt) buf = await applyMeshoptToBuffer(buf);
      triggerDownload(buf, name.replace(/\s+/g, '_') + "." + format);
    } else {
      setLoadingText("Exporting model...");
      triggerDownload(exportNonGLBBlob(scene), name.replace(/\s+/g, '_') + "." + format);
    }
  } catch (error) {
    console.error("Export error:", error);
    toast?.error?.("Export failed. Please try again.");
  } finally {
    restoreAll();

    clonedMaterials.forEach((m) => {
      if (m) {
        TEX_KEYS.forEach(k => {
          if (m[k] && m[k].isTexture && m[k].image instanceof HTMLCanvasElement) {
            m[k].dispose();
          }
        });
        m.dispose();
      }
    });
    clonedMaterials.clear();
    originalTextures.clear();
    visibilityMap.clear();

    try {
      scene.clear();
    } catch (_) { }

    setManualLoading(false);
    setLoadingText("");
  }
}

/**
 * Capture high-resolution camera snapshot with customizable background and opacity.
 */
export async function captureCameraSnapshot({
  gl,
  camera,
  scene,
  bgType = "transparent",
  solidColor = "#FFFFFF",
  bgOpacity = 100,
  customImage = null,
  setIsCapturing
}) {
  if (!gl || !camera) {
    console.warn("WebGL renderer or camera not ready for snapshot capture");
    return null;
  }

  try {
    setIsCapturing?.(true);
    await new Promise(r => setTimeout(r, 60));

    const domCanvas = gl.domElement;
    const dpr = gl.getPixelRatio();
    const origW = domCanvas.width / dpr;
    const origH = domCanvas.height / dpr;
    const ratio = origW / origH;

    const CAPTURE_PX = 2048;
    const capW = ratio >= 1 ? CAPTURE_PX : Math.round(CAPTURE_PX * ratio);
    const capH = ratio >= 1 ? Math.round(CAPTURE_PX / ratio) : CAPTURE_PX;

    const prevClearAlpha = gl.getClearAlpha ? gl.getClearAlpha() : 1;
    const prevClearColor = new THREE.Color();
    if (gl.getClearColor) gl.getClearColor(prevClearColor);

    gl.setClearAlpha(0);
    gl.setPixelRatio(1);
    gl.setSize(capW, capH, false);

    const targetScene = scene || gl.scene;
    if (targetScene) {
      gl.render(targetScene, camera);
    }

    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = capW;
    compositeCanvas.height = capH;
    const ctx = compositeCanvas.getContext("2d");

    const alphaVal = typeof bgOpacity === "number" ? Math.max(0, Math.min(1, bgOpacity / 100)) : 1.0;

    if (bgType === "solid") {
      ctx.globalAlpha = alphaVal;
      ctx.fillStyle = solidColor || "#FFFFFF";
      ctx.fillRect(0, 0, capW, capH);
      ctx.globalAlpha = 1.0;
    } else if (bgType === "customImage" && customImage) {
      await new Promise((resolve) => {
        const bgImg = new Image();
        bgImg.onload = () => {
          const imgRatio = bgImg.width / bgImg.height;
          let drawW = capW;
          let drawH = capH;
          let offX = 0;
          let offY = 0;

          if (imgRatio > ratio) {
            drawW = capH * imgRatio;
            offX = (capW - drawW) / 2;
          } else {
            drawH = capW / imgRatio;
            offY = (capH - drawH) / 2;
          }

          ctx.globalAlpha = alphaVal;
          ctx.drawImage(bgImg, offX, offY, drawW, drawH);
          ctx.globalAlpha = 1.0;
          resolve();
        };
        bgImg.onerror = () => {
          ctx.globalAlpha = alphaVal;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, capW, capH);
          ctx.globalAlpha = 1.0;
          resolve();
        };
        bgImg.src = customImage;
      });
    }

    ctx.drawImage(domCanvas, 0, 0);
    const dataUrl = compositeCanvas.toDataURL("image/png");

    gl.setPixelRatio(dpr);
    gl.setSize(origW, origH, false);
    if (gl.setClearColor) gl.setClearColor(prevClearColor, prevClearAlpha);
    if (targetScene) gl.render(targetScene, camera);

    return dataUrl;
  } catch (err) {
    console.error("Camera snapshot capture error:", err);
    return null;
  } finally {
    setIsCapturing?.(false);
  }
}
