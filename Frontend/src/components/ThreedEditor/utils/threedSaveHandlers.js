import * as THREE from "three";
import { GLTFExporter } from "three-stdlib";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import axios from "axios";
import { resolveUploadsPath } from "../../../utils/supabaseUtils.js";

/**
 * Cleanly exports a single Three.js Object3D / Scene into a binary GLB buffer,
 * preserving material settings, cloned textures, animations, and stripping gizmos.
 */
async function exportSingleModelGlb(liveScene, transformValues, deletedMaterials, extraAnimations = []) {
  if (!liveScene) return null;

  const exportScene = SkeletonUtils.clone(liveScene);

  const hasUserTransform =
    transformValues &&
    ((transformValues.position && (Math.abs(transformValues.position.x) > 1e-4 || Math.abs(transformValues.position.y) > 1e-4 || Math.abs(transformValues.position.z) > 1e-4)) ||
      (transformValues.rotation && (Math.abs(transformValues.rotation.x) > 1e-4 || Math.abs(transformValues.rotation.y) > 1e-4 || Math.abs(transformValues.rotation.z) > 1e-4)) ||
      (transformValues.scale && (Math.abs(transformValues.scale.x - 1) > 1e-4 || Math.abs(transformValues.scale.y - 1) > 1e-4 || Math.abs(transformValues.scale.z - 1) > 1e-4)));

  if (hasUserTransform) {
    exportScene.position.x += transformValues.position?.x || 0;
    exportScene.position.y += transformValues.position?.y || 0;
    exportScene.position.z += transformValues.position?.z || 0;
    exportScene.rotation.x += transformValues.rotation?.x || 0;
    exportScene.rotation.y += transformValues.rotation?.y || 0;
    exportScene.rotation.z += transformValues.rotation?.z || 0;
    if (transformValues.scale) {
      exportScene.scale.x *= transformValues.scale.x || 1;
      exportScene.scale.y *= transformValues.scale.y || 1;
      exportScene.scale.z *= transformValues.scale.z || 1;
    }
  }

  // Deep clone materials so export mutations never affect active editor canvas
  exportScene.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map((m) => (m && typeof m.clone === "function" ? m.clone() : m));
      } else if (typeof obj.material.clone === "function") {
        obj.material = obj.material.clone();
      }
    }
  });

  const toRemove = [];
  exportScene.traverse((obj) => {
    if (
      obj.isTransformControls ||
      obj.isTransformControlsGizmo ||
      obj.isTransformControlsPlane ||
      obj.isCamera ||
      obj.isLight ||
      (obj.type && obj.type.toLowerCase().startsWith("transformcontrols")) ||
      (obj.name && obj.name.toLowerCase().includes("transformcontrols")) ||
      (obj.name && obj.name.toLowerCase().includes("gizmo"))
    ) {
      toRemove.push(obj);
      return;
    }

    if (obj.isMesh || obj.isLine || obj.isPoints) {
      if (!obj.geometry || !obj.geometry.attributes || !obj.geometry.attributes.position || !obj.geometry.attributes.position.array || obj.geometry.attributes.position.count === 0) {
        toRemove.push(obj);
        return;
      }
    }

    if (deletedMaterials && deletedMaterials.size > 0 && (obj.isMesh || obj.isLine || obj.isPoints)) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const isDeleted = deletedMaterials.has(obj.uuid) || mats.some((m) => m?.name && deletedMaterials.has(m.name));
      if (isDeleted) {
        toRemove.push(obj);
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

    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        if (!mat) return;
        const isXrayMat = Boolean(mat.userData?.__xrayBackup || mat.userData?.appliedTexture?.isXray);
        if (isXrayMat) {
          mat.color = new THREE.Color('#5ec4e0');
          mat.emissive = new THREE.Color('#3a8fb0');
          mat.emissiveIntensity = 0.5;
          mat.roughness = 0.42;
          mat.metalness = 0;
          mat.opacity = 0.42;
          mat.transparent = true;
          mat.depthWrite = true;
          mat.map = null;
          mat.roughnessMap = null;
          mat.metalnessMap = null;
          mat.alphaMap = null;
          mat.aoMap = null;
        } else {
          const isCutoutName = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha|logo|sticker|label|decal/i.test((obj.name || '') + '_' + (mat.name || ''));
          const isTrans = Boolean(mat.transparent || (mat.opacity !== undefined && mat.opacity < 0.999) || mat.alphaMap || isCutoutName);
          mat.transparent = isTrans;
          mat.depthWrite = !isTrans;
          if (mat.alphaTest > 0) {
            // keep existing alphaTest
          } else if (isTrans && isCutoutName) {
            mat.alphaTest = 0.05;
          } else {
            mat.alphaTest = 0;
          }
        }
        if (mat.envMap) mat.envMap = null;
        delete mat.customProgramCacheKey;
        delete mat.onBeforeCompile;
        if (mat.userData) {
          delete mat.userData.__xrayBackup;
          delete mat.userData.originalTexTransforms;
          delete mat.userData.originalColor;
          delete mat.userData.originalMap;
        }
      });
    }
  });

  toRemove.forEach((obj) => {
    if (obj.parent) obj.parent.remove(obj);
  });

  exportScene.traverse((child) => {
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
      child.updateMatrix();
    }
  });

  exportScene.traverse((obj) => {
    if (obj.userData) {
      delete obj.userData.normalization;
      delete obj.userData.originalTransform;
    }
  });

  try {
    exportScene.updateMatrixWorld(true);
  } catch (_) {}

  const exportAnimations = [];
  const seenNames = new Set();
  const collectClip = (c) => {
    if (!c || !Array.isArray(c.tracks) || c.tracks.length === 0) return;
    const key = c.name || c.uuid;
    if (seenNames.has(key)) return;

    const validTracks = c.tracks.filter((t) => t && t.name && t.times && t.values && t.times.length > 0 && t.values.length > 0);
    if (validTracks.length === 0) return;

    seenNames.add(key);
    const cleanClip = c.clone();
    const resolvableTracks = [];

    for (const track of validTracks) {
      const clonedTrack = track.clone();
      const parts = clonedTrack.name.split(".");
      const propertyName = parts.pop();
      const targetPath = parts.join(".");

      let targetNode = THREE.PropertyBinding.findNode(exportScene, targetPath);
      if (!targetNode && targetPath.includes("/")) {
        const baseNodeName = targetPath.split("/").pop();
        const found = exportScene.getObjectByName(baseNodeName);
        if (found) {
          clonedTrack.name = `${baseNodeName}.${propertyName}`;
          targetNode = found;
        }
      } else if (!targetNode) {
        const found = exportScene.getObjectByName(targetPath);
        if (found) {
          targetNode = found;
        }
      }

      if (targetNode) {
        resolvableTracks.push(clonedTrack);
      }
    }

    if (resolvableTracks.length > 0) {
      cleanClip.tracks = resolvableTracks;
      exportAnimations.push(cleanClip);
    }
  };

  if (exportScene.animations) exportScene.animations.forEach(collectClip);
  exportScene.traverse((n) => {
    if (n.animations) n.animations.forEach(collectClip);
  });
  if (extraAnimations && Array.isArray(extraAnimations)) {
    extraAnimations.forEach(collectClip);
  }

  const exporter = new GLTFExporter();
  const exportOptions = {
    binary: true,
    forceIndices: true,
    trs: true,
    onlyVisible: false,
    maxTextureSize: 2048,
    embedImages: true,
    animations: exportAnimations && exportAnimations.length > 0 ? exportAnimations : []
  };

  return await new Promise((resolve, reject) => {
    exporter.parse(
      exportScene,
      (result) => resolve(result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result)).buffer),
      (err) => reject(err),
      exportOptions
    );
  });
}

/**
 * Executes a full 3D model save or "Save As" operation.
 * Exports each model individually without merging distinct models together.
 */
export async function executeSave3D({
  options = {},
  models,
  modelName,
  modelRefs,
  modelRef,
  sceneWrapperRef,
  transformValues,
  deletedMaterials,
  hotspots,
  materialSettings,
  past,
  urlModelId,
  modelMaterialLists,
  modelMaterialDataMap,
  modelStatsMap,
  setModels,
  setModelName,
  setModelUrl,
  setModelMaterialLists,
  modelMaterialListsRef,
  setModelMaterialDataMap,
  setModelStatsMap,
  setThreedState,
  lastSavedRef,
  setHasUnsavedChanges,
  setIsSaving,
  setManualLoading,
  setLoadingText,
  setLoadingProgress,
  setSafeProgress,
  triggerSaveSuccess,
  toast,
  navigate
}) {
  const isSaveAs = Boolean(options?.isSaveAs);
  const customName = options?.newName?.trim();
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

  const updateProgress = (pct, msg) => {
    if (typeof setSafeProgress === "function") {
      setSafeProgress(pct, msg);
    } else {
      if (typeof setLoadingProgress === "function") setLoadingProgress(pct);
      if (typeof setLoadingText === "function") setLoadingText(msg);
    }
  };

  try {
    if (!models || models.length === 0) return;

    setIsSaving(true);
    if (typeof setManualLoading === "function") setManualLoading(true);
    updateProgress(10, isSaveAs ? "Initializing new 3D model clone..." : "Preparing 3D scene changes...");
    await new Promise((r) => setTimeout(r, 120));

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.error("User not found in localStorage");
      return;
    }

    const user = JSON.parse(storedUser);
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").trim().replace(/\/+$/, "");
    const nextModels = [...models];

    updateProgress(20, isSaveAs ? "Duplicating 3D model hierarchy & nodes..." : "Processing scene hierarchy & transformations...");
    await new Promise((r) => setTimeout(r, 100));

    const resolveLiveScene = (modelId, index) => {
      const raw = (modelRefs?.current && modelRefs.current.get(modelId)) || (index === 0 ? modelRef?.current : null);
      if (raw && typeof raw.clone === "function" && raw.isObject3D) return raw;
      if (raw?.scene && typeof raw.scene.clone === "function" && raw.scene.isObject3D) return raw.scene;
      if (sceneWrapperRef?.current && sceneWrapperRef.current.children.length > index) {
        const child = sceneWrapperRef.current.children[index];
        if (child) {
          if (child.children && child.children.length > 0) {
            const inner = child.children[0];
            if (inner && typeof inner.clone === "function" && inner.isObject3D) return inner;
          }
          if (typeof child.clone === "function" && child.isObject3D) return child;
        }
      }
      return null;
    };

    const updatedModels = [];
    let primarySavedModelId = null;
    const defaultBaseName = customName || (modelName || nextModels[0]?.displayName || nextModels[0]?.name || "Scene").replace(/\.[^/.]+$/, "");

    for (let i = 0; i < nextModels.length; i++) {
      const currentModel = nextModels[i];
      const isPrimary = i === 0;
      const modelProgressBase = 25 + Math.round((i / nextModels.length) * 60);

      // If it's a secondary imported model that already has a permanent remote URL (not a transient local blob),
      // keep its asset reference intact in the scene without re-uploading and without touching the master dashboard model!
      const isExistingRemoteUrl = typeof currentModel.url === 'string' &&
        !currentModel.url.startsWith('blob:') &&
        !currentModel.url.startsWith('data:') &&
        !currentModel.file;

      if (!isPrimary && isExistingRemoteUrl) {
        updatedModels.push({
          ...currentModel,
          transform: currentModel.transform || { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        });
        continue;
      }

      const liveScene = resolveLiveScene(currentModel.id, i);
      if (!liveScene) {
        updatedModels.push(currentModel);
        continue;
      }

      updateProgress(
        modelProgressBase,
        isSaveAs
          ? (nextModels.length > 1
              ? `Baking materials for "${currentModel.displayName || currentModel.name}" (${i + 1}/${nextModels.length})...`
              : "Baking customized materials & textures...")
          : (nextModels.length > 1
              ? `Exporting materials for "${currentModel.displayName || currentModel.name}" (${i + 1}/${nextModels.length})...`
              : "Exporting updated materials & textures...")
      );
      await new Promise((r) => setTimeout(r, 80));

      const glbBuffer = await exportSingleModelGlb(
        liveScene,
        isPrimary ? transformValues : (currentModel.transform || null),
        deletedMaterials,
        currentModel.animations || liveScene.animations || []
      );

      const originalFileName = isSaveAs || !isPrimary ? null : currentModel.fileName;
      const currentBaseName = isPrimary
        ? (customName || defaultBaseName)
        : (currentModel.displayName || currentModel.name || `Model_${i + 1}`);

      const sanitizedBaseName = currentBaseName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");

      const exportFileName = isSaveAs || !isPrimary
        ? `${sanitizedBaseName}_${Date.now().toString().slice(-4)}.glb`
        : originalFileName || `${sanitizedBaseName}.glb`;

      const glbBlob = new Blob([glbBuffer]);
      const glbSize = glbBlob.size;
      const totalGlbChunks = Math.ceil(glbSize / CHUNK_SIZE);
      const glbUploadId = Date.now().toString() + Math.random().toString(36).substring(7);
      let glbRes = null;

      for (let chunkIndex = 0; chunkIndex < totalGlbChunks; chunkIndex++) {
        const uploadPct = modelProgressBase + Math.round(((chunkIndex + 1) / totalGlbChunks) * 15);
        const stageText = isSaveAs
          ? (totalGlbChunks > 1
              ? `Uploading ${currentBaseName} (Part ${chunkIndex + 1} of ${totalGlbChunks})...`
              : `Uploading ${currentBaseName}...`)
          : (totalGlbChunks > 1
              ? `Uploading ${currentBaseName} updates (Part ${chunkIndex + 1} of ${totalGlbChunks})...`
              : `Uploading ${currentBaseName} updates...`);

        updateProgress(uploadPct, stageText);

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, glbSize);
        const chunk = glbBlob.slice(start, end);

        const formData = new FormData();
        formData.append("uploadId", glbUploadId);
        formData.append("chunkIndex", chunkIndex);
        formData.append("totalChunks", totalGlbChunks);
        formData.append("fileName", exportFileName);
        formData.append("displayName", isPrimary ? (customName || defaultBaseName) : currentBaseName);
        formData.append("emailId", user.emailId);
        // CRITICAL: Only pass modelId for the primary active model if not Save As — NEVER overwrite secondary dashboard models!
        if (isPrimary && !isSaveAs && currentModel.modelId) {
          formData.append("modelId", currentModel.modelId);
        }
        formData.append("chunk", chunk);
        formData.append("hotspots", JSON.stringify(hotspots || []));
        formData.append("materialSettings", JSON.stringify(materialSettings || {}));
        formData.append("transformValues", JSON.stringify(isPrimary ? (transformValues || {}) : (currentModel.transform || {})));

        const res = await axios.post(`${backendUrl}/api/3d-models/upload-chunk`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        glbRes = res;
      }

      if (glbRes && glbRes.data && glbRes.data.url) {
        const rawUrl = glbRes.data.url;
        const baseUrl = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `${backendUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
        const resolvedBaseUrl = resolveUploadsPath(baseUrl);

        const timestamp = Date.now();
        const targetGlbUrl = resolvedBaseUrl.includes("?") ? `${resolvedBaseUrl}&t=${timestamp}` : `${resolvedBaseUrl}?t=${timestamp}`;

        const modelIdToUse = isPrimary && !isSaveAs && currentModel.id ? currentModel.id : `model_${timestamp}_${i}`;
        const savedModelId = glbRes.data.modelId || (isPrimary && !isSaveAs ? currentModel.modelId : null) || modelIdToUse;
        const finalDisplayName = isPrimary ? (customName || glbRes.data.displayName || defaultBaseName) : (currentModel.displayName || glbRes.data.displayName || currentBaseName);

        const activeModelUrl = targetGlbUrl;
        const activeModelId = savedModelId || modelIdToUse;

        if (isPrimary) {
          primarySavedModelId = savedModelId;
          setModelName(finalDisplayName);
          setModelUrl(activeModelUrl);
        }

        const updatedModel = {
          ...currentModel,
          id: activeModelId,
          url: activeModelUrl,
          name: exportFileName,
          displayName: finalDisplayName,
          fileName: exportFileName,
          type: "glb",
          file: null,
          modelId: savedModelId,
          hotspots: hotspots || []
        };

        updatedModels.push(updatedModel);
      } else {
        updatedModels.push(currentModel);
      }
    }

    updateProgress(92, isSaveAs ? "Registering new 3D model in database..." : "Finalizing scene configuration & state...");

    if (primarySavedModelId) {
      try {
        await axios.post(`${backendUrl}/api/3d-models/save-settings`, {
          modelId: primarySavedModelId,
          materialSettings,
          transformValues: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          hotspots: hotspots || [],
          sceneModels: updatedModels
        });
      } catch (setErr) {
        console.warn("Direct save-settings notice:", setErr);
      }
    }

    try {
      await axios.post(`${backendUrl}/api/3d-models/save-session`, {
        emailId: user.emailId,
        state: {
          models: updatedModels,
          hotspots: hotspots || [],
          transformValues: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          materialSettings,
          modelName: isSaveAs ? (customName || defaultBaseName) : (modelName || defaultBaseName),
          lastSaved: new Date().toISOString()
        }
      });
    } catch (sessErr) {
      console.warn("Session save notice:", sessErr);
    }

    try {
      const bc = new BroadcastChannel("threed_model_updates");
      bc.postMessage({
        type: "model-saved",
        modelId: primarySavedModelId,
        timestamp: Date.now()
      });
      bc.close();
    } catch (bcErr) {
      console.warn("BroadcastChannel not supported:", bcErr);
    }

    setModels(updatedModels);
    if (typeof setThreedState === "function") {
      setThreedState((prev) => ({
        ...prev,
        models: updatedModels,
        modelUrl: updatedModels[0]?.url,
        modelName: updatedModels[0]?.displayName || updatedModels[0]?.name,
        hotspots: hotspots || []
      }));
    }

    lastSavedRef.current = {
      historyIndex: past.length,
      hasLocalFiles: false
    };
    if (typeof setHasUnsavedChanges === "function") {
      setHasUnsavedChanges(false);
    }

    updateProgress(100, isSaveAs ? "New 3D model created successfully!" : "Changes saved successfully!");
    await new Promise((r) => setTimeout(r, 200));

    if (triggerSaveSuccess) {
      triggerSaveSuccess({
        isManual: true,
        name: customName || modelName || "3D Model",
        folder: "3D_Modals"
      });
    }

    const finalModelId = updatedModels[0]?.modelId;
    if (isSaveAs && finalModelId) {
      toast.success(`Saved copy as "${customName || defaultBaseName}" successfully!`);
      navigate(`/editor/threed_editor/${finalModelId}`, { replace: true });
    } else if (finalModelId && (!urlModelId || urlModelId === "")) {
      navigate(`/editor/threed_editor/${finalModelId}`, { replace: true });
    }
  } catch (error) {
    console.error("Error saving 3D models:", error);
    const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred while saving your model.";
    toast.error(errorMessage);
  } finally {
    setIsSaving(false);
    if (typeof setManualLoading === "function") setManualLoading(false);
    if (typeof setLoadingText === "function") setLoadingText("");
  }
}
