import React, { useCallback, useRef, useEffect } from "react";
import axios from "axios";
import { checkFbxLegacyVersion, convertModelFileIfNeeded } from "../utils/modelConversionUtils";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";
import { process3DDropEvent } from "../utils/modelDropHandler";

export function useThreedModelLoader({
  models,
  setModels,
  setModelUrl,
  setModelFile,
  setModelType,
  modelName,
  setModelName,
  setModelMaterialLists,
  setModelStatsMap,
  setModelStats,
  setSelectedMaterial,
  setHiddenMaterials,
  setDeletedMaterials,
  setMaterialSettings,
  setHotspots,
  setActiveHotspotId,
  setEditingHotspot,
  setShowHotspotModal,
  setIsPlacingHotspot,
  isPlacingHotspotRef,
  setRightPanelMode,
  setThreedState,
  setIsSidebarCollapsed,
  setHasUnsavedChanges,
  setTransformValues,
  setMaterialList,
  setModelHasAnimationsMap,
  setIsAnimationPlaying,
  setSelectedTexture,
  setFormatErrorModal,
  resetHistory,
  lastSavedRef,
  modelRefs,
  modelRef,
  navigate,
  commitHistoryNow,
  buildSnapshot,
  startMountingBridgeTicker,
  clearAllLoadingTimers,
  loadingProgressRef,
  setLoadingProgress,
  setLoadingText,
  setLoadingModelInfo,
  pendingModelIdRef,
  isCompletingRef,
  setManualLoading,
  startModelLoading,
  defaultTransform,
  backendUrl,
  toast
}) {

  const processFile = useCallback(async (file) => {
    if (!file) return;

    const name = file.name.toLowerCase();
    const validExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.stl', '.step', '.stp', '.3ds', '.lwo', '.low', '.iges', '.igs', '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2'];

    if (!validExtensions.some(ext => name.endsWith(ext))) {
      setFormatErrorModal({
        isOpen: true,
        title: "Unsupported File Format",
        message: `The file format ".${name.split('.').pop()}" is not supported. Please upload one of the following: ${validExtensions.map(e => e.toUpperCase().replace('.', '')).join(', ')}`
      });
      return;
    }

    const legacyFbxVer = await checkFbxLegacyVersion(file);
    if (legacyFbxVer) {
      setFormatErrorModal({
        isOpen: true,
        title: `Legacy FBX Format (${legacyFbxVer === 6100 ? "FBX 6.1" : `v${legacyFbxVer}`})`,
        message: `This FBX model was exported using legacy Autodesk FBX ${legacyFbxVer === 6100 ? '6.1 (FileVersion: 6100)' : `v${legacyFbxVer}`} (pre-2011 binary format).\n\nModern 3D web engines (Three.js / WebGL) and Assimp require modern binary FBX 7.1+ (2013-2020) or .GLB / glTF.\n\nHow to fix:\n1. Open your model in Blender, Maya, 3ds Max, or Cinema 4D.\n2. Go to File > Export > FBX.\n3. In export settings, select modern FBX (2014-2020 binary) or export directly as .GLB / glTF.\n4. Upload the newly exported file.`
      });
      return;
    }

    const modelId = Date.now().toString();
    const ext = name.split('.').pop();
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    startModelLoading({
      id: modelId,
      name: file.name,
      size: `${sizeInMB} MB`,
      type: ext
    });

    try {
      const converted = await convertModelFileIfNeeded(file);

      setModelStats({ fileSize: `${converted.sizeInMB} MB` });

      const offsetIndex = models.length;
      const initialTransform = offsetIndex === 0
        ? defaultTransform
        : {
            position: { x: (offsetIndex % 2 === 1 ? 1 : -1) * Math.ceil(offsetIndex / 2) * 3.5, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          };

      const newModel = {
        id: modelId,
        url: converted.url,
        file: converted.file,
        type: converted.type || 'glb',
        name: converted.name,
        transform: initialTransform
      };

      const nextModels = [...models, newModel];
      setModels(nextModels);

      setModelUrl(converted.url);
      setModelFile(converted.file);
      setModelType(converted.type || 'glb');
      const nextModelName = models.length === 0 ? newModel.name : modelName;
      if (models.length === 0) {
        setModelName(nextModelName);
      }

      setSelectedMaterial({ name: newModel.name, parentGroup: newModel.name });

      setThreedState(prev => ({
        ...prev,
        models: nextModels,
        modelUrl: models.length === 0 ? converted.url : prev.modelUrl,
        modelName: nextModelName
      }));

      commitHistoryNow(buildSnapshot({
        models: nextModels,
        modelName: nextModelName,
        selectedMaterial: { name: newModel.name, parentGroup: newModel.name }
      }));

      setIsSidebarCollapsed(false);
      startMountingBridgeTicker(loadingProgressRef.current);
    } catch (err) {
      console.error("Error processing/converting 3D model:", err);
      clearAllLoadingTimers();
      setManualLoading(false);
      loadingProgressRef.current = 0;
      setLoadingProgress(0);
      setLoadingText("");
      setLoadingModelInfo(null);
      pendingModelIdRef.current = null;
      isCompletingRef.current = false;

      const errMsg = err.response?.data?.message || err.message || "Failed to process 3D model";
      if (errMsg.includes("6100") || errMsg.includes("legacy FBX") || errMsg.includes("FileVersion")) {
        setFormatErrorModal({
          isOpen: true,
          title: "Legacy FBX Format (FileVersion: 6100)",
          message: errMsg
        });
      } else {
        toast.error(errMsg);
      }
    }
  }, [models, modelName, setFormatErrorModal, startModelLoading, setModelStats, setModels, setModelUrl, setModelFile, setModelType, setModelName, setSelectedMaterial, setThreedState, commitHistoryNow, buildSnapshot, setIsSidebarCollapsed, startMountingBridgeTicker, loadingProgressRef, clearAllLoadingTimers, setManualLoading, setLoadingProgress, setLoadingText, setLoadingModelInfo, pendingModelIdRef, isCompletingRef, toast]);

  const handleSelectGalleryModel = useCallback(async (model) => {
    if (!model) return;

    const modelId = model.modelId || Date.now().toString();
    startModelLoading({
      id: modelId,
      name: model.name,
      size: model.size || "Unknown",
      type: model.type || 'glb'
    });

    const activeBackendUrl = backendUrl || (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
    const rawUrl = (model.url && (model.url.startsWith('http://') || model.url.startsWith('https://')))
      ? model.url
      : `${activeBackendUrl}${model.url.startsWith('/') ? '' : '/'}${model.url}`;
    const fullUrl = resolveUploadsPath(rawUrl);

    let modelHotspots = Array.isArray(model.hotspots) ? model.hotspots : [];
    if (model.modelId) {
      try {
        const detailRes = await axios.get(`${activeBackendUrl}/api/3d-models/get-model/${model.modelId}`);
        if (detailRes.data && Array.isArray(detailRes.data.hotspots)) {
          modelHotspots = detailRes.data.hotspots;
        }
      } catch (detailErr) {
        console.warn("Could not fetch detailed model metadata:", detailErr);
      }
    }

    const offsetIndex = models.length;
    const initialTransform = offsetIndex === 0
      ? defaultTransform
      : {
          position: { x: (offsetIndex % 2 === 1 ? 1 : -1) * Math.ceil(offsetIndex / 2) * 3.5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        };

    const newModel = {
      id: modelId,
      modelId: model.modelId || modelId,
      url: fullUrl,
      file: null,
      type: model.type,
      name: model.name.replace(/\.[^/.]+$/, ""),
      hotspots: modelHotspots,
      transform: initialTransform
    };

    const nextModels = [...models, newModel];
    setModels(nextModels);

    setModelUrl(fullUrl);
    setModelFile(null);
    setModelType(newModel.type);
    const nextModelName = models.length === 0 ? newModel.name : modelName;
    if (models.length === 0) {
      setModelName(nextModelName);
    }

    setSelectedMaterial({ name: newModel.name, parentGroup: newModel.name });
    setModelStats({ fileSize: model.size || "0 MB" });

    if (modelHotspots && modelHotspots.length > 0) {
      setHotspots(prev => [...prev, ...modelHotspots]);
    }

    setThreedState(prev => ({
      ...prev,
      models: nextModels,
      modelUrl: models.length === 0 ? fullUrl : prev.modelUrl,
      modelName: nextModelName
    }));

    commitHistoryNow(buildSnapshot({
      models: nextModels,
      modelName: nextModelName,
      selectedMaterial: { name: newModel.name, parentGroup: newModel.name }
    }));

    setIsSidebarCollapsed(false);
    startMountingBridgeTicker(loadingProgressRef.current);

    if (model.modelId && navigate) {
      navigate(`/editor/threed_editor/${model.modelId}`);
    }
  }, [backendUrl, models, modelName, startModelLoading, setModels, setModelUrl, setModelFile, setModelType, setModelName, setSelectedMaterial, setModelStats, setHotspots, setThreedState, commitHistoryNow, buildSnapshot, setIsSidebarCollapsed, startMountingBridgeTicker, loadingProgressRef, navigate]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const dropResult = await process3DDropEvent(e.dataTransfer, {
        onProgressText: (txt) => {
          setLoadingText(txt);
          setManualLoading(true);
        }
      });
      if (dropResult?.file) {
        processFile(dropResult.file);
      }
    } catch (err) {
      console.warn("Drop processing fallback:", err.message);
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    }
  }, [processFile, setLoadingText, setManualLoading]);

  const handleClearModel = useCallback(async () => {
    models.forEach(m => {
      if (m.url) URL.revokeObjectURL(m.url);
    });

    clearAllLoadingTimers();
    setManualLoading(false);
    loadingProgressRef.current = 0;
    setLoadingProgress(0);
    setLoadingText("");
    setLoadingModelInfo(null);
    pendingModelIdRef.current = null;
    isCompletingRef.current = false;

    setModels([]);
    setModelUrl(null);
    setModelFile(null);
    setModelType('glb');
    setMaterialList([]);
    setModelMaterialLists({});
    setModelStatsMap({});
    setModelHasAnimationsMap({});
    setIsAnimationPlaying(true);
    setSelectedMaterial(null);
    setModelName("");
    setSelectedTexture(null);
    setIsSidebarCollapsed(true);

    if (modelRefs.current) modelRefs.current.clear();
    if (modelRef.current) modelRef.current = null;
    if (navigate) navigate("/editor/threed_editor", { replace: true });

    setModelStats({
      vertexCount: "0",
      polygonCount: "0",
      materialCount: "0",
      fileSize: "0 MB",
      dimensions: "0 X 0 X 0 unit"
    });
    setTransformValues(defaultTransform);
    setHiddenMaterials(new Set());
    setDeletedMaterials(new Set());

    setHotspots([]);
    setActiveHotspotId(null);
    setEditingHotspot(null);
    setShowHotspotModal(false);
    setIsPlacingHotspot(false);
    if (isPlacingHotspotRef) isPlacingHotspotRef.current = false;
    setRightPanelMode('edit');
    localStorage.removeItem('tempThreedEditModel');

    setThreedState(prev => ({
      ...prev,
      models: [],
      modelUrl: null,
      modelName: "",
      hotspots: [],
      materialSettings: {
        alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
        specular: 50, reflection: 10, shadow: 50, softness: 50, ao: 100, environment: 'studio',
        worldOpacity: 0, worldBlur: 0,
        color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
        lightPosition: { x: 10, y: 10, z: 10 }
      }
    }));

    resetHistory({
      models: [],
      modelName: "",
      transformValues: defaultTransform,
      materialSettings: {
        alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
        specular: 50, reflection: 10, shadow: 50, softness: 50, ao: 100, environment: 'studio',
        worldOpacity: 0, worldBlur: 0,
        color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
        lightPosition: { x: 10, y: 10, z: 10 }
      },
      hiddenMaterials: [],
      deletedMaterials: [],
      selectedMaterial: null,
      selectedTexture: null,
      modelMaterialLists: {},
      hotspots: []
    });

    if (lastSavedRef) {
      lastSavedRef.current = {
        historyIndex: 0,
        hasLocalFiles: false
      };
    }
    if (typeof setHasUnsavedChanges === "function") {
      setHasUnsavedChanges(false);
    }

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const activeBackend = backendUrl || (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
        await axios.post(`${activeBackend}/api/3d-models/save-session`, {
          emailId: user.emailId,
          state: {
            models: [],
            materialSettings: {},
            transformValues: defaultTransform,
            modelName: "",
            hotspots: [],
            lastSaved: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      console.error("Error clearing server session:", err);
    }
  }, [models, clearAllLoadingTimers, setManualLoading, loadingProgressRef, setLoadingProgress, setLoadingText, setLoadingModelInfo, pendingModelIdRef, isCompletingRef, setModels, setModelUrl, setModelFile, setModelType, setMaterialList, setModelMaterialLists, setModelStatsMap, setModelHasAnimationsMap, setIsAnimationPlaying, setSelectedMaterial, setModelName, setSelectedTexture, setIsSidebarCollapsed, modelRefs, modelRef, navigate, setModelStats, setTransformValues, defaultTransform, setHiddenMaterials, setDeletedMaterials, setHotspots, setActiveHotspotId, setEditingHotspot, setShowHotspotModal, setIsPlacingHotspot, isPlacingHotspotRef, setRightPanelMode, setThreedState, resetHistory, lastSavedRef, setHasUnsavedChanges, backendUrl]);

  return {
    processFile,
    handleSelectGalleryModel,
    handleDragOver,
    handleDrop,
    handleClearModel
  };
}
