import * as THREE from "three";
import { GLTFExporter } from "three-stdlib";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import axios from "axios";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

/**
 * Executes a full 3D model save or "Save As" operation.
 * Exports a clean GLB with all material customizations, animation tracks, and uploads via chunks.
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
  triggerSaveSuccess,
  toast,
  navigate
}) {
  const isSaveAs = Boolean(options?.isSaveAs);
  const customName = options?.newName?.trim();
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

  try {
    if (!models || models.length === 0) return;

    setIsSaving(true);
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.error("User not found in localStorage");
      return;
    }

    const user = JSON.parse(storedUser);
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").trim().replace(/\/+$/, "");
    const nextModels = [...models];

    const resolveLiveScene = (modelId) => {
      const raw = modelRefs.current.get(modelId) || (modelId === nextModels[0]?.id ? modelRef.current : null);
      if (raw && typeof raw.clone === "function" && raw.isObject3D) return raw;
      if (raw?.scene && typeof raw.scene.clone === "function" && raw.scene.isObject3D) return raw.scene;
      if (sceneWrapperRef.current && sceneWrapperRef.current.children.length > 0) {
        for (const child of sceneWrapperRef.current.children) {
          if (child.children && child.children.length > 0) {
            const inner = child.children[0];
            if (inner && typeof inner.clone === "function" && inner.isObject3D) return inner;
          }
          if (child && typeof child.clone === "function" && child.isObject3D) return child;
        }
      }
      return sceneWrapperRef.current;
    };

    let exportScene;
    const liveScene = resolveLiveScene(nextModels[0]?.id);

    const hasUserTransform =
      transformValues &&
      ((transformValues.position && (Math.abs(transformValues.position.x) > 1e-4 || Math.abs(transformValues.position.y) > 1e-4 || Math.abs(transformValues.position.z) > 1e-4)) ||
        (transformValues.rotation && (Math.abs(transformValues.rotation.x) > 1e-4 || Math.abs(transformValues.rotation.y) > 1e-4 || Math.abs(transformValues.rotation.z) > 1e-4)) ||
        (transformValues.scale && (Math.abs(transformValues.scale.x - 1) > 1e-4 || Math.abs(transformValues.scale.y - 1) > 1e-4 || Math.abs(transformValues.scale.z - 1) > 1e-4)));

    if (nextModels.length === 1 && liveScene) {
      exportScene = SkeletonUtils.clone(liveScene);
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
    } else {
      exportScene = new THREE.Scene();
      nextModels.forEach((m) => {
        const s = resolveLiveScene(m.id);
        if (s) {
          exportScene.add(SkeletonUtils.clone(s));
        }
      });
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

    modelRefs.current.forEach((liveScene) => {
      if (!liveScene) return;
      if (liveScene.animations) liveScene.animations.forEach(collectClip);
      if (typeof liveScene.traverse === "function") {
        liveScene.traverse((n) => {
          if (n.animations) n.animations.forEach(collectClip);
        });
      }
    });

    nextModels.forEach((m) => {
      if (m?.animations) m.animations.forEach(collectClip);
      if (m?.scene?.animations) m.scene.animations.forEach(collectClip);
    });

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

    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        exportScene,
        (result) => resolve(result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result)).buffer),
        (err) => reject(err),
        exportOptions
      );
    });

    const originalFileName = isSaveAs ? null : nextModels[0]?.fileName;
    const defaultBaseName = customName || (modelName || nextModels[0]?.displayName || nextModels[0]?.name || "Scene").replace(/\.[^/.]+$/, "");
    const sanitizedBaseName = defaultBaseName.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");

    const exportFileName = isSaveAs
      ? `${sanitizedBaseName}_${Date.now().toString().slice(-4)}.glb`
      : originalFileName || `${sanitizedBaseName}.glb`;

    const glbBlob = new Blob([glbBuffer]);
    const glbSize = glbBlob.size;
    const totalGlbChunks = Math.ceil(glbSize / CHUNK_SIZE);
    const glbUploadId = Date.now().toString() + Math.random().toString(36).substring(7);
    let glbRes = null;

    for (let chunkIndex = 0; chunkIndex < totalGlbChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, glbSize);
      const chunk = glbBlob.slice(start, end);

      const formData = new FormData();
      formData.append("uploadId", glbUploadId);
      formData.append("chunkIndex", chunkIndex);
      formData.append("totalChunks", totalGlbChunks);
      formData.append("fileName", exportFileName);
      formData.append("displayName", customName || defaultBaseName);
      formData.append("emailId", user.emailId);
      if (!isSaveAs && nextModels[0]?.modelId) {
        formData.append("modelId", nextModels[0].modelId);
      }
      formData.append("chunk", chunk);
      formData.append("hotspots", JSON.stringify(hotspots || []));
      formData.append("materialSettings", JSON.stringify(materialSettings || {}));
      formData.append("transformValues", JSON.stringify(transformValues || {}));

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

      const modelIdToUse = !isSaveAs && nextModels[0]?.id ? nextModels[0].id : `model_${timestamp}`;
      const savedModelId = glbRes.data.modelId || (!isSaveAs ? nextModels[0]?.modelId : null) || modelIdToUse;
      const finalDisplayName = customName || glbRes.data.displayName || defaultBaseName;

      const activeModelUrl = !isSaveAs && nextModels[0]?.url ? nextModels[0].url : targetGlbUrl;
      const activeModelId = !isSaveAs && nextModels[0]?.id ? nextModels[0].id : modelIdToUse;

      const mergedModel = {
        ...nextModels[0],
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

      setModelName(finalDisplayName);
      setModelUrl(activeModelUrl);

      nextModels.splice(0, nextModels.length, mergedModel);

      if (activeModelId) {
        const currentMatList = modelMaterialLists[nextModels[0]?.id] || modelMaterialLists[activeModelId] || Object.values(modelMaterialLists)[0];
        const currentDataMap = modelMaterialDataMap[nextModels[0]?.id] || modelMaterialDataMap[activeModelId] || Object.values(modelMaterialDataMap)[0];
        const currentStats = modelStatsMap[nextModels[0]?.id] || modelStatsMap[activeModelId] || Object.values(modelStatsMap)[0];

        if (currentMatList) {
          setModelMaterialLists({ [activeModelId]: currentMatList });
          modelMaterialListsRef.current = { [activeModelId]: currentMatList };
        }
        if (currentDataMap) {
          setModelMaterialDataMap({ [activeModelId]: currentDataMap });
        }
        if (currentStats) {
          setModelStatsMap({ [activeModelId]: currentStats });
        }
      }

      try {
        await axios.post(`${backendUrl}/api/3d-models/save-settings`, {
          modelId: savedModelId,
          materialSettings,
          transformValues: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          hotspots: hotspots || []
        });
      } catch (setErr) {
        console.warn("Direct save-settings notice:", setErr);
      }

      try {
        await axios.post(`${backendUrl}/api/3d-models/save-session`, {
          emailId: user.emailId,
          state: {
            models: nextModels,
            hotspots: hotspots || [],
            transformValues: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            materialSettings,
            modelName: defaultBaseName,
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
          modelId: savedModelId,
          timestamp: Date.now()
        });
        bc.close();
      } catch (bcErr) {
        console.warn("BroadcastChannel not supported:", bcErr);
      }

      setModels(nextModels);
      if (typeof setThreedState === "function") {
        setThreedState((prev) => ({
          ...prev,
          models: nextModels,
          modelUrl: nextModels[0]?.url,
          modelName: nextModels[0]?.displayName || nextModels[0]?.name,
          hotspots: hotspots || []
        }));
      }
    }

    lastSavedRef.current = {
      historyIndex: past.length,
      hasLocalFiles: false
    };
    if (typeof setHasUnsavedChanges === "function") {
      setHasUnsavedChanges(false);
    }

    if (triggerSaveSuccess) {
      triggerSaveSuccess({
        isManual: true,
        name: customName || modelName || "3D Model",
        folder: "3D_Modals"
      });
    }

    const finalModelId = nextModels[0]?.modelId;
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
    setManualLoading(false);
    setLoadingText("");
  }
}
