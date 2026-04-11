import React, { useState, Suspense, useEffect, useCallback, useRef, useMemo } from "react";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useProgress, ContactShadows, TransformControls } from "@react-three/drei";
import RightPanel from "./ThreedRightpanel";
import EditorInfoBox from "./EditorInfoBox";
import EditorToolbar from "./EditorToolbar";
import TextureGalleryBar from "./TextureGalleryBar";
import TopToolbar from "./TopToolbar";
import AnimatedGizmo from "./Components/AnimatedGizmo";
import { GlobalLoader } from "./Components/GlobalLoader";
import RenderModel from "./Components/ModelLoaders";
import useModalHistory from "./hooks/useModalHistory";
import ExportModal from "./Components/ExportModal";
import AddModelModal from "./Components/AddModelModal";
import ModelGalleryModal from "./Components/ModelGalleryModal";
import { GLTFExporter } from "three-stdlib";
import { OBJExporter } from "three-stdlib";
import { STLExporter } from "three-stdlib";
import CameraModal from "./Components/CameraModal";
import { useOutletContext } from "react-router-dom";
import axios from "axios";


export default function ThreedEditor() {
  const { threedState, setThreedState } = useOutletContext();

  const [models, setModels] = useState(threedState.models || (threedState.modelUrl ? [{
      id: "default",
      url: threedState.modelUrl,
      file: threedState.modelFile,
      type: threedState.modelType,
      name: threedState.modelName || "Model"
  }] : []));

  // Keeping original state vars for overall project info (like total filesize) or backward compatibility
  const [modelUrl, setModelUrl] = useState(models.length > 0 ? models[0].url : null);
  const [modelFile, setModelFile] = useState(models.length > 0 ? models[0].file : null); 
  const [modelType, setModelType] = useState(models.length > 0 ? models[0].type : "glb");
  const [autoRotate, setAutoRotate] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(models.length === 0); // If model exists, don't collapse
  const [isTextureOpen, setIsTextureOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Sync manual loading with useProgress active state
  const { active } = useProgress();
  React.useEffect(() => {
    if (active && manualLoading) {
        setManualLoading(false);
    }
  }, [active, manualLoading]);

  const isGlobalLoading = manualLoading || active;
  
  // Model Statistics State
  const [modelStatsMap, setModelStatsMap] = useState({});
  const [modelStats, setModelStats] = useState(threedState.modelStats || { fileSize: "0 MB" });
  
  const controlsRef = React.useRef(null);
  const modelRef = React.useRef(null);
  const modelRefs = useRef(new Map());
  const lastUpdateRef = React.useRef(0);

  // Target Position State
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, z: 0 });
  const [modelMaterialLists, setModelMaterialLists] = useState({});
  const sceneWrapperRef = useRef(null);
  const [materialList, setMaterialList] = useState(threedState.materialList || []);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  
  useEffect(() => {
      // Debug log to confirm texture selection
      if (selectedTexture) console.log("Texture Selected:", selectedTexture.name);
  }, [selectedTexture]);

  const [showWarning, setShowWarning] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [showModelGalleryModal, setShowModelGalleryModal] = useState(false);

  // Right Panel & Sidebar State
  const [activeAccordion, setActiveAccordion] = useState("factor"); // "factor" | "position" | "lighting"

  // Transform Tools State
  const [transformMode, setTransformMode] = useState(null); // 'translate', 'rotate', 'scale', null
  const [transformValues, setTransformValues] = useState(threedState.transformValues);

  // --- History Management ---
  const [modelName, setModelName] = useState(threedState.modelName);
  const [selectedTextureId, setSelectedTextureId] = useState(null);

  const [materialSettings, setMaterialSettings] = useState(threedState.materialSettings);

  const [resetKey, setResetKey] = useState(0);
  
  const [hiddenMaterials, setHiddenMaterials] = useState(new Set(threedState.hiddenMaterials || []));
  const [deletedMaterials, setDeletedMaterials] = useState(new Set(threedState.deletedMaterials || []));

  // Screenshot State
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const { 
    state: historyState, 
    set: pushHistory, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    resetHistory,
    update: updateHistory
  } = useModalHistory({
      hiddenMaterials: Array.from(hiddenMaterials),
      deletedMaterials: Array.from(deletedMaterials),
      modelMaterialLists,
      selectedMaterial,
      selectedTexture
  });

  const stateRef = useRef({ 
      models, 
      transformValues, 
      materialSettings, 
      modelName, 
      hiddenMaterials, 
      deletedMaterials, 
      modelMaterialLists,
      selectedMaterial,
      selectedTexture
  });

  useEffect(() => {
      stateRef.current = { 
          models, 
          transformValues, 
          materialSettings, 
          modelName, 
          hiddenMaterials, 
          deletedMaterials, 
          modelMaterialLists,
          selectedMaterial,
          selectedTexture
      };
  }, [models, transformValues, materialSettings, modelName, hiddenMaterials, deletedMaterials, modelMaterialLists, selectedMaterial, selectedTexture]);

  // Sync State changes to Context (Debounced or on change)
  useEffect(() => {
      setThreedState(prev => ({
          ...prev,
          models, // Save models array
          modelUrl, // Keep for backward compat
          modelFile, 
          modelType,
          modelStats,
          transformValues,
          materialSettings,
          materialList,
          hiddenMaterials,
          deletedMaterials
      }));
  }, [models, modelUrl, modelFile, modelType, modelStats, transformValues, materialSettings, modelName, materialList, hiddenMaterials, deletedMaterials, setThreedState]);

  // --- Dynamic Model Loading & Validation ---
  useEffect(() => {
    const syncWithServerModels = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        
        const response = await axios.get(`${backendUrl}/api/3d-models/get-models`, {
          params: { emailId: user.emailId }
        });
        const serverModels = response.data.models || [];
        
        // 1. Identify valid remote URLs
        const validRemoteUrls = new Set(serverModels.map(m => m.url));

        // 2. Filter out stale remote models, but keep local blobs
        const filteredNextModels = models.filter(m => {
          if (!m.url) return false;
          // Keep if it's a local blob
          if (m.url.startsWith('blob:')) return true;
          // Keep if it's a relative path starting with /uploads and exists on server
          const relativeUrl = m.url.replace(backendUrl, '');
          return validRemoteUrls.has(relativeUrl);
        });

        // 3. If everything was stale/empty, and we have server models, pick the first one
        if (filteredNextModels.length === 0 && serverModels.length > 0) {
          const firstModel = serverModels[0];
          const fullUrl = `${backendUrl}${firstModel.url}`;
          
          const newModel = {
            id: Date.now().toString(),
            url: fullUrl,
            file: null,
            type: firstModel.type,
            name: firstModel.name.replace(/\.[^/.]+$/, "")
          };
          
          setModels([newModel]);
          setModelUrl(fullUrl);
          setModelType(newModel.type);
          setModelName(newModel.name);
          setIsSidebarCollapsed(false);
        } else if (filteredNextModels.length !== models.length) {
          // If we filtered out some stale models, update state
          setModels(filteredNextModels);
        }
      } catch (error) {
        console.error("Error syncing with server models:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncWithServerModels();
    // Only run on mount to validate initial state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddModel = (file) => {
      if (!file) return;
      
      const url = URL.createObjectURL(file);
      const ext = file.name.split('.').pop().toLowerCase();
      
      const newModel = {
          id: Date.now().toString(),
          url: url,
          file: file,
          type: ext === 'step' || ext === 'stp' ? 'step' : ext,
          name: file.name.replace(/\.[^/.]+$/, "")
      };
      
      const nextModels = [...models, newModel];
      setModels(nextModels);
      setManualLoading(true);
      
      let nextModelName = modelName;
      // If this is the first model, set global name
      if (models.length === 0) {
          nextModelName = newModel.name;
          setModelName(nextModelName);
      }
      
      pushHistory({
          ...stateRef.current,
          models: nextModels,
          modelName: nextModelName,
          selectedMaterial: null // Reset selection on new model to be safe
      });
      
      setIsSidebarCollapsed(false);
  };

  const handleSetModelStats = useCallback((modelId, stats) => {
      setModelStatsMap(prev => ({ ...prev, [modelId]: stats }));
  }, []);

  const handleSetMaterialList = useCallback((modelId, list) => {
      setModelMaterialLists(prev => {
          const next = { ...prev, [modelId]: list };
          // Update the current history entry so that UNDOing back to this point has the materials
          updateHistory({
              ...stateRef.current,
              modelMaterialLists: next
          });
          return next;
      });
  }, [updateHistory]);

  const handleExport = (format) => {
    const scene = sceneWrapperRef.current;
    if (!scene || models.length === 0) return;

    // Use current modelName state for export, fallback to model array or generic
    const name = modelName || (models.length > 0 ? models[0].name : "Scene");

    const download = (blob, filename) => {
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveString = (text, filename) => {
        const blob = new Blob([text], { type: 'text/plain' });
        download(blob, filename);
    };

    const saveArrayBuffer = (buffer, filename) => {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        download(blob, filename);
    };

    if (format === 'glb') {
        const exporter = new GLTFExporter();
        exporter.parse(scene, (result) => {
            if (result instanceof ArrayBuffer) {
                saveArrayBuffer(result, `${name}.glb`);
            } else {
                const output = JSON.stringify(result, null, 2);
                saveString(output, `${name}.gltf`);
            }
        }, (err) => console.error(err), { binary: true });
    } else if (format === 'obj') {
        const exporter = new OBJExporter();
        const result = exporter.parse(scene);
        saveString(result, `${name}.obj`);
    } else if (format === 'stl') {
        const exporter = new STLExporter();
        const result = exporter.parse(scene);
        saveString(result, `${name}.stl`);
    }
  };

  const combinedStats = useMemo(() => {
      let vCount = 0; let pCount = 0; let mCount = 0;
      Object.keys(modelStatsMap).forEach(key => {
          const s = modelStatsMap[key];
          if (s.vertexCount) vCount += parseInt(s.vertexCount.toString().replace(/,/g, '')) || 0;
          if (s.polygonCount) pCount += parseInt(s.polygonCount.toString().replace(/,/g, '')) || 0;
          if (s.materialCount) mCount += parseInt(s.materialCount) || 0;
      });
      return {
          vertexCount: vCount.toLocaleString(),
          polygonCount: pCount.toLocaleString(),
          materialCount: mCount.toString(),
          fileSize: modelStats?.fileSize || "0 MB",
          dimensions: models.length > 1 ? "Multiple Models" : (modelStatsMap[models[0]?.id]?.dimensions || "0 X 0 X 0 unit")
      };
  }, [modelStatsMap, modelStats?.fileSize, models]);

  const activeMaterialList = useMemo(() => {
      const result = [];
      models.forEach(model => {
          const rawList = modelMaterialLists[model.id] || [];
          let flatMats = [];
          rawList.forEach(item => {
              if (item.group) flatMats.push(...item.materials);
              else flatMats.push(item);
          });
          flatMats = flatMats.filter(m => !deletedMaterials.has(m));
          
          if (flatMats.length > 0) {
              result.push({
                  id: model.id,
                  group: model.name,
                  materials: flatMats
              });
          }
      });
      return result;
  }, [models, modelMaterialLists, deletedMaterials]);

  const handleToggleVisibility = useCallback((matName, isVisible) => {
      const next = new Set(hiddenMaterials);
      if (isVisible) next.delete(matName);
      else next.add(matName);
      setHiddenMaterials(next);

      pushHistory({
          ...stateRef.current,
          hiddenMaterials: Array.from(next),
          // Ensure we capture the absolute latest settings for this snapshot
          materialSettings: materialSettings 
      });
  }, [hiddenMaterials, materialSettings, pushHistory]);

  // Auto-expand sidebar when a specific material is selected
  useEffect(() => {
    if (selectedMaterial && selectedMaterial.name !== (modelName || "Model")) {
        setIsSidebarCollapsed(false);
    }
  }, [selectedMaterial, modelName, setIsSidebarCollapsed]);

  const handleDeleteMaterial = useCallback((matName) => {
      // Soft-delete by adding to state only. This allows undo/redo to work reliably
      // without physically removing objects from the 3D scene graph.
      const next = new Set(deletedMaterials);
      next.add(matName);
      setDeletedMaterials(next);

      pushHistory({
          ...stateRef.current,
          deletedMaterials: Array.from(next),
          materialSettings: materialSettings
      });
  }, [deletedMaterials, materialSettings, pushHistory]);

  const handleUndo = useCallback(() => {
      const prevState = undo();
      if (prevState) {
          if (prevState.models !== undefined) setModels(prevState.models);
          if (prevState.transformValues !== undefined) setTransformValues(prevState.transformValues);
          if (prevState.materialSettings !== undefined) setMaterialSettings(prevState.materialSettings);
          if (prevState.modelName !== undefined) setModelName(prevState.modelName);
          if (prevState.hiddenMaterials !== undefined) setHiddenMaterials(new Set(prevState.hiddenMaterials));
          if (prevState.deletedMaterials !== undefined) setDeletedMaterials(new Set(prevState.deletedMaterials));
          if (prevState.modelMaterialLists !== undefined) setModelMaterialLists(prevState.modelMaterialLists);
          if (prevState.selectedMaterial !== undefined) setSelectedMaterial(prevState.selectedMaterial);
          if (prevState.selectedTexture !== undefined) setSelectedTexture(prevState.selectedTexture);
      }
  }, [undo]);

  const handleRedo = useCallback(() => {
      const nextState = redo();
      if (nextState) {
          if (nextState.models !== undefined) setModels(nextState.models);
          if (nextState.transformValues !== undefined) setTransformValues(nextState.transformValues);
          if (nextState.materialSettings !== undefined) setMaterialSettings(nextState.materialSettings);
          if (nextState.modelName !== undefined) setModelName(nextState.modelName);
          if (nextState.hiddenMaterials !== undefined) setHiddenMaterials(new Set(nextState.hiddenMaterials));
          if (nextState.deletedMaterials !== undefined) setDeletedMaterials(new Set(nextState.deletedMaterials));
          if (nextState.modelMaterialLists !== undefined) setModelMaterialLists(nextState.modelMaterialLists);
          if (nextState.selectedMaterial !== undefined) setSelectedMaterial(nextState.selectedMaterial);
          if (nextState.selectedTexture !== undefined) setSelectedTexture(nextState.selectedTexture);
      }
  }, [redo]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'h') {
        if (selectedMaterial && selectedMaterial.name) {
          e.preventDefault();
          const matName = selectedMaterial.name;
          const isCurrentlyHidden = hiddenMaterials.has(matName);
          handleToggleVisibility(matName, isCurrentlyHidden);
        }
      } else if (e.key.toLowerCase() === 'd') {
        if (selectedMaterial && selectedMaterial.name && !selectedMaterial.isGroup) {
          // Identify if it's a full model or just a material. 
          // If it's a material, delete it.
          const matName = selectedMaterial.name;
          if (matName !== modelName && matName !== "Scene") {
              e.preventDefault();
              handleDeleteMaterial(matName);
              setSelectedMaterial(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedMaterial, hiddenMaterials, handleToggleVisibility, handleDeleteMaterial, modelName]);

  const handleRename = (newName) => {
      setModelName(newName);
      // We do NOT update the models array here anymore. 
      // This keeps the "Folder Name" in the Material List as the original name
      // while allowing the Top Bar and Export to use the new "modelName".
      
      pushHistory({
          ...stateRef.current,
          modelName: newName
      });
  };

  const handleRenameMaterial = useCallback((oldName, newName, mName) => {
      // Find the model with this name
      const model = models.find(m => m.name === mName || m.originalName === mName);
      if (model && modelRefs.current.get(model.id)) {
          modelRefs.current.get(model.id).renameMaterial(oldName, newName);
      } else if (modelRef.current) {
          modelRef.current.renameMaterial(oldName, newName);
      }

      let nextMaterialLists = modelMaterialLists;
      if (model) {
          const prevList = modelMaterialLists[model.id] || [];
          const nextList = prevList.map(item => {
              if (typeof item === 'string') {
                  return item === oldName ? newName : item;
              } else if (item.materials) {
                   return {
                       ...item,
                       materials: item.materials.map(m => m === oldName ? newName : m)
                   };
              }
              return item;
          });
          nextMaterialLists = { ...modelMaterialLists, [model.id]: nextList };
          setModelMaterialLists(nextMaterialLists);
          
          pushHistory({
              ...stateRef.current,
              modelMaterialLists: nextMaterialLists
          });
      }

      if (selectedMaterial && (selectedMaterial.name === oldName)) {
           setSelectedMaterial(prev => {
               if (!prev) return prev;
               return { ...prev, name: newName };
           });
      }
  }, [models, selectedMaterial, modelMaterialLists, pushHistory]);

  const handleDeleteModel = useCallback((modelId) => {
      const modelToDelete = models.find(m => m.id === modelId);
      // We don't revoke URL immediately here to allow UNDOing the deletion
      // if (modelToDelete && modelToDelete.url) URL.revokeObjectURL(modelToDelete.url);
      
      const nextModels = models.filter(m => m.id !== modelId);
      setModels(nextModels);
      
      const nextMaterialLists = { ...modelMaterialLists };
      delete nextMaterialLists[modelId];
      setModelMaterialLists(nextMaterialLists);

      const nextStatsMap = { ...modelStatsMap };
      delete nextStatsMap[modelId];
      setModelStatsMap(nextStatsMap);

      if (selectedMaterial && modelToDelete && selectedMaterial.parentGroup === modelToDelete.name) {
          setSelectedMaterial(null);
      }

      pushHistory({
          ...stateRef.current,
          models: nextModels,
          modelMaterialLists: nextMaterialLists
      });
  }, [models, selectedMaterial, modelMaterialLists, modelStatsMap, pushHistory]);

  const lastPushTimeRef = useRef(0);
  const pushHistoryThrottled = useCallback((nextState) => {
      const now = Date.now();
      // Throttle rapid updates (like sliders) to 800ms between history entries
      if (now - lastPushTimeRef.current > 800) {
          pushHistory(nextState);
          lastPushTimeRef.current = now;
      } else {
          // If we are within the throttle window, we just update the 'current' entry 
          // via a new 'update' function in useModalHistory (similar to how we handle model loading)
          updateHistory(nextState);
      }
  }, [pushHistory, updateHistory]);

  const updateMaterialSetting = useCallback((key, val, fromSync = false) => {
    setMaterialSettings((prev) => {
      if (prev[key] === val) return prev;
      
      const next = { ...prev, [key]: val };
      
      if (!fromSync) {
          pushHistoryThrottled({
              ...stateRef.current,
              materialSettings: next
          });
      }
      
      return next;
    });
  }, [pushHistoryThrottled]);

  // Memoized handler for syncing from model (GenericModel) to avoid loop
  const handleMaterialSync = useCallback((key, val) => {
      updateMaterialSetting(key, val, true);
  }, [updateMaterialSetting]);

  const handleMaterialUIUpdate = useCallback((key, val) => {
      updateMaterialSetting(key, val, false);
  }, [updateMaterialSetting]);

  const handleMapUpload = useCallback((mapType, file) => {
    if (file === null) {
      setMaterialSettings(prev => {
        const nextMaps = { ...(prev.maps || {}), [mapType]: null };
        const next = { ...prev, maps: nextMaps };
        
        pushHistory({
            ...stateRef.current,
            materialSettings: next
        });
        
        return next;
      });
      return;
    }

    // For HDR/EXR environment files, we append the extension as a fragment (#.hdr or #.exr)
    // This allows the Environment component to correctly identify the required loader.
    const ext = file.name.split('.').pop().toLowerCase();
    const isHDREXR = ext === 'hdr' || ext === 'exr';
    const url = URL.createObjectURL(file) + (isHDREXR ? `#.${ext}` : '');
    
    setMaterialSettings(prev => {
        const nextMaps = { ...(prev.maps || {}), [mapType]: url };
        let next = { ...prev, maps: nextMaps };
        
        // Auto-set factors to 100% for maps that are multipliers (Standard Material behavior)
        if (mapType === 'map') next.color = '#ffffff';
        if (mapType === 'metalnessMap') next.metallic = 100;
        if (mapType === 'roughnessMap') next.roughness = 100;
        if (mapType === 'normalMap') next.normal = 100;
        if (mapType === 'bumpMap') next.bump = 100;
        if (mapType === 'aoMap') next.ao = 100;

        pushHistory({
            ...stateRef.current,
            materialSettings: next
        });
        
        return next;
    });
  }, [pushHistory]);

  const handleScreenshotClick = useCallback(() => {
    setIsScreenshotOpen(true);
  }, []);


  const handleDownloadScreenshot = () => {
    if (screenshotPreview) {
        const link = document.createElement('a');
        link.href = screenshotPreview;
        link.download = `3d-model-snapshot-${Date.now()}.png`;
        link.click();
        setIsScreenshotOpen(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    const name = file.name.toLowerCase();
    const validExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.stl', '.step', '.stp'];
    
    if (!validExtensions.some(ext => name.endsWith(ext))) {
        setShowWarning(true);
        return;
    }
    
    setManualLoading(true);

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setModelStats({ fileSize: `${sizeInMB} MB` });

    if (models.length > 0) {
        models.forEach(m => URL.revokeObjectURL(m.url));
    }

    const url = URL.createObjectURL(file);
    const ext = name.split('.').pop().toLowerCase();
    
    const newModel = {
        id: Date.now().toString(),
        url,
        file,
        type: ext === 'step' || ext === 'stp' ? 'step' : ext,
        name: file.name.replace(/\.[^/.]+$/, "")
    };

    const nextModels = [newModel];
    setModels(nextModels);
    
    // Kept for backward compat
    setModelUrl(url);
    setModelFile(file);
    setModelType(newModel.type);
    const nextModelName = newModel.name;
    setModelName(nextModelName);
    
    setModelMaterialLists({});
    setModelStatsMap({});
    setSelectedMaterial(null);
    setHiddenMaterials(new Set());
    setDeletedMaterials(new Set());
    
    const nextMaterialSettings = {
        alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
        specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'city',
        color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
        appliedTexture: null,
        maps: {},
        lightPosition: { x: 10, y: 10, z: 10 }
    };
    // Reset material settings for the new model
    setMaterialSettings(nextMaterialSettings);
    
    pushHistory({
        ...stateRef.current,
        models: nextModels,
        modelName: nextModelName,
        materialSettings: nextMaterialSettings,
        hiddenMaterials: [],
        deletedMaterials: [],
        modelMaterialLists: {}
    });

    setIsSidebarCollapsed(false); 
  };

  const handleSelectGalleryModel = async (model) => {
    if (!model) return;

    setManualLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const fullUrl = `${backendUrl}${model.url}`;

    // Clear existing models if we are 'replacing'
    if (models.length > 0) {
        models.forEach(m => {
            if (m.url && m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
        });
    }

    const newModel = {
        id: Date.now().toString(),
        url: fullUrl,
        file: null, // No local file object
        type: model.type,
        name: model.name.replace(/\.[^/.]+$/, "")
    };

    const nextModels = [newModel];
    setModels(nextModels);
    
    setModelUrl(fullUrl);
    setModelFile(null);
    setModelType(newModel.type);
    const nextModelName = newModel.name;
    setModelName(nextModelName);
    
    setModelMaterialLists({});
    setModelStatsMap({});
    setSelectedMaterial(null);
    setHiddenMaterials(new Set());
    setDeletedMaterials(new Set());
    setModelStats({ fileSize: model.size || "0 MB" });

    const nextMaterialSettings = {
        alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
        specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'city',
        color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
        appliedTexture: null,
        lightPosition: { x: 10, y: 10, z: 10 }
    };
    setMaterialSettings(nextMaterialSettings);
    
    pushHistory({
        ...stateRef.current,
        models: nextModels,
        modelName: nextModelName,
        materialSettings: nextMaterialSettings,
        hiddenMaterials: [],
        deletedMaterials: [],
        modelMaterialLists: {}
    });

    setIsSidebarCollapsed(false);
  };


  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleClearModel = () => {
    // Revoke URLs
    models.forEach(m => {
         if (m.url) URL.revokeObjectURL(m.url);
    });

    setModels([]);
    setModelUrl(null);
    setModelFile(null); 
    setModelType('glb');
    setMaterialList([]);
    setModelMaterialLists({});
    setModelStatsMap({});
    setSelectedMaterial(null);
    setModelName("");
    setSelectedTexture(null);
    setIsSidebarCollapsed(true);
    setModelStats({
        vertexCount: "0",
        polygonCount: "0",
        materialCount: "0",
        fileSize: "0 MB",
        dimensions: "0 X 0 X 0 unit"
    });
    // Reset transform
    const defaultTransform = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    };
    setTransformValues(defaultTransform);
    setHiddenMaterials(new Set());
    setDeletedMaterials(new Set());
    
    // Reset History
    resetHistory({
        transformValues: defaultTransform,
        materialSettings: materialSettings, 
        modelName: ""
    });
  };

  const handleResetView = () => {
    if (controlsRef.current) {
        controlsRef.current.reset();
        // Reset state manually as well to be sure, though controls reset handles target
        setTargetPosition({ x: 0, y: 0, z: 0 });
    }
  };

  const handleManualTransformChange = (type, axis, value) => {
    setTransformValues(prev => {
        const next = { ...prev };
        
        let numVal = parseFloat(value);
        if (isNaN(numVal)) return prev; 

        // Rotation: Input is Degrees, Store as Radians
        if (type === 'rotation') {
            numVal = numVal * (Math.PI / 180);
        }

        next[type] = {
            ...prev[type],
            [axis]: numVal
        };
        
        pushHistory({
            ...stateRef.current,
            transformValues: next
        });
        
        return next;
    });
  };

  const originalTransformRef = useRef(null);

  const [sceneResetTrigger, setSceneResetTrigger] = useState(0);
  const [uvUnwrapTrigger, setUvUnwrapTrigger] = useState(0);

  const handleResetTransform = (type) => {
    if (type === 'all') {
        setSceneResetTrigger(prev => prev + 1);
    }

    setTransformValues(prev => {
        const next = { ...prev };
        
        // Use stored original values if available, otherwise default to 0/0/0
        const defaults = originalTransformRef.current || {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        };

        const getXYZ = (obj) => ({ x: obj.x, y: obj.y, z: obj.z });

        if (!type || type === 'all') {
             next.position = getXYZ(defaults.position);
             next.rotation = getXYZ(defaults.rotation);
             next.scale = getXYZ(defaults.scale);
        } else if (type === 'position') {
             next.position = getXYZ(defaults.position);
        } else if (type === 'rotation') {
             next.rotation = getXYZ(defaults.rotation);
        } else if (type === 'scale') {
             next.scale = getXYZ(defaults.scale);
        }
        
        pushHistory({
            ...stateRef.current,
            transformValues: next
        });

        return next;
    });
  };
  
  const handleTransformEnd = () => {
     // Called when drag ends. We push the current validated state to history.
     pushHistory({
         ...stateRef.current,
         transformValues: stateRef.current.transformValues // ensure we capture latest
     });
  };

  // Visual Settings State
  const [settings, setSettings] = useState({
    backgroundColor: "#393939", // Blender default dark grey
    baseColor: "#2c2c2c",
    base: false, // Blender doesn't have a solid floor plane by default
    grid: true,
    wireframe: false,
  });

  // Memoized Handlers to prevent infinite loops in child Effects
  const handleTextureIdentified = useCallback((id) => {
      setSelectedTextureId(id);
  }, []);

   const handleTextureApplied = useCallback(() => {
       // Clear selectedTexture after it's applied so it doesn't bleed to other materials
       setSelectedTexture(null);
   }, []);

   const handleSelectTexture = useCallback((textureData) => {
       const isReset = !textureData || !textureData.id;
       const newTexture = isReset ? null : { ...textureData, ts: Date.now() };
       
       setSelectedTextureId(isReset ? null : textureData.id);
       setSelectedTexture(newTexture);

       setMaterialSettings(prev => {
           const next = {
               ...prev,
               appliedTexture: newTexture
           };

           if (isReset) {
               next.maps = { map: null, normalMap: null, roughnessMap: null, metalnessMap: null, bumpMap: null, aoMap: null };
           } else {
               next.maps = { ...(prev.maps || {}), ...textureData.maps };
               // Set factors to 100% when applying a full texture set
               next.metallic = 100;
               next.roughness = 100;
               next.normal = 100;
               next.bump = 10;
               next.ao = 100;
               next.color = '#ffffff';
               next.useFactorColor = true;
           }

           pushHistory({
               ...stateRef.current,
               selectedTexture: newTexture,
               materialSettings: next
           });

           return next;
       });
   }, [pushHistory]);

  const handleSelectMaterial = useCallback((val) => {
      setSelectedTexture(null);
      setMaterialSettings(prev => ({
          ...prev,
          maps: {} // Clear command maps so they don't bleed to the new material
      }));
      if (typeof val === 'object') {
          // Preserve full object (including isGroup, materials)
          setSelectedMaterial({ ...val, uuid: val.uuid || null, ts: Date.now() });
      } else {
          setSelectedMaterial({ name: val, uuid: null, ts: Date.now() });
      }
  }, []);

  const handleTransformChange = useCallback((t) => {
      if (t.original) {
          originalTransformRef.current = t.original;
      } else {
          originalTransformRef.current = null;
      }
      
      const nextTransform = {
          position: { x: t.position.x, y: t.position.y, z: t.position.z },
          rotation: { x: t.rotation.x, y: t.rotation.y, z: t.rotation.z },
          scale: { x: t.scale.x, y: t.scale.y, z: t.scale.z }
      };

      setTransformValues(nextTransform);
  }, []);

  const onTransformEnd = useCallback(() => {
     // Push to history only when user releases the gizmo handle
     pushHistory({
         ...stateRef.current,
         transformValues: transformValues
     });
  }, [transformValues, pushHistory]);

  return (
    <div 
        className="flex h-[92vh] w-full bg-white overflow-hidden relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      <GlobalLoader manualLoading={manualLoading || isSyncing} />
      
      {/* --- WARNING MODAL --- */}
      {showWarning && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-white p-[1.5vw] rounded-[1vw] shadow-xl max-w-[20vw] w-full text-center">
                   <div className="w-[3vw] h-[3vw] bg-red-100 rounded-full flex items-center justify-center mx-auto mb-[1vw]">
                       <Icon icon="ph:warning-circle-bold" className="text-red-600 text-[1.5vw]" />
                   </div>
                   <h3 className="text-[1vw] font-bold text-gray-900 mb-[0.5vw]">Unsupported File Type</h3>
                   <p className="text-[0.75vw] text-gray-600 mb-[1.5vw]">
                       Please upload a 3D model in one of the following formats: <br/>
                       <span className="font-mono text-[0.65vw] bg-gray-100 px-[0.25vw] py-[0.15vw] rounded">.glb, .gltf, .obj, .fbx, .stl, .step</span>
                   </p>
                   <button 
                       onClick={() => setShowWarning(false)}
                       className="w-full py-[0.65vw] bg-gray-900 text-white rounded-[0.75vw] font-medium hover:bg-gray-800 transition-colors text-[0.85vw]"
                   >
                       Got it
                   </button>
               </div>
           </div>
      )}

      {/* --- EXPORT MODAL --- */}
      {showExportModal && (
          <ExportModal 
              onClose={() => setShowExportModal(false)}
              onExport={handleExport}
          />
      )}

      <div className="flex flex-1 overflow-hidden relative">

        {/* CENTER EDITOR AREA */}
        <div className="flex-1 relative flex flex-col h-full overflow-hidden">

          {/* SIDEBARS & FLOATING PANELS */}
          {models.length > 0 && (
            <TopToolbar 
              isSidebarCollapsed={isSidebarCollapsed} 
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              isTextureOpen={isTextureOpen}
              onReset={handleResetView}
              targetPosition={targetPosition}
              materialList={activeMaterialList}
              selectedMaterial={selectedMaterial}
              hiddenMaterials={hiddenMaterials}
              onSelectMaterial={(name) => handleSelectMaterial(name)}
              modelName={modelName || "Scene"} 
              onToggleVisibility={handleToggleVisibility}
              onDeleteMaterial={handleDeleteMaterial}
              onDeleteModel={handleDeleteModel}
              onRename={handleRename}
              onRenameMaterial={handleRenameMaterial}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          )}


          <EditorToolbar
            hasModel={models.length > 0}
            settings={settings}
            setSettings={setSettings}
            onClear={handleClearModel}
            onAddClick={() => setShowAddModelModal(true)}
            onGalleryClick={() => setShowModelGalleryModal(true)}
            onScreenshotClick={handleScreenshotClick}
            isScreenshotOpen={isScreenshotOpen}
            transformMode={transformMode}
            setTransformMode={(mode) => {
                setTransformMode(mode);
                if (mode) {
                    setActiveAccordion("position");
                }
            }}
          />

          {isScreenshotOpen && (
              <CameraModal
                  isOpen={isScreenshotOpen}
                  onClose={() => setIsScreenshotOpen(false)}
                  models={models}
                  settings={settings}
                  materialSettings={materialSettings}
                  transformValues={transformValues}
                  hiddenMaterials={hiddenMaterials}
                  deletedMaterials={deletedMaterials}
                  selectedMaterial={selectedMaterial}
                  selectedTexture={selectedTexture}
              />
          )}


          {models.length > 0 && (
            <TextureGalleryBar
              isOpen={isTextureOpen}
              setIsOpen={setIsTextureOpen}
              onSelectTexture={handleSelectTexture}
            />
          )}

          {models.length > 0 && (
            <div
              className={`absolute left-[1vw] z-20 p-[0.25vw] transition-all duration-500 ease-in-out overflow-hidden w-[13.5vw] pointer-events-none select-none
                ${isTextureOpen ? "bottom-[13vw]" : "bottom-[3.7vw]"}
              `}
            >
                <EditorInfoBox stats={combinedStats} />
            </div>
          )}


          {models.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none select-none">
              <div className="flex flex-col items-center gap-[0.75vw] opacity-50">
                <Icon icon="ph:cube-focus-thin" width="4.16vw" className="text-gray-50" />
                <span className="text-[0.72vw] font-medium text-gray-50">Uploaded 3D Model will be shown here</span>
              </div>
            </div>
          )}

          {/* 3D CANVAS */}
          <div className="flex-1 h-full w-full">
            {!isSyncing && (
            <Canvas
              camera={{ position: [0, 1, 5], fov: 45 }}
              shadows
              dpr={[1, 2]}
              gl={{
                preserveDrawingBuffer: true,
                antialias: true,
                alpha: true,
                logarithmicDepthBuffer: true
              }}
              onCreated={({ gl }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.outputColorSpace = THREE.SRGBColorSpace;
              }}
            >
              {/* Only show background color if NOT capturing for a clean model-only shot */}
              {!isCapturing && <color attach="background" args={[settings.backgroundColor]} />}

              <ambientLight intensity={1.2} />
              <spotLight
                position={[5, 10, 5]}
                angle={0.15}
                penumbra={1}
                intensity={2}
                castShadow
                shadow-bias={-0.005} // Increased bias to prevent triangle acne/banding
                shadow-mapSize={[2048, 2048]}
              />
              <directionalLight
                position={[-5, 5, -5]}
                intensity={1}
                castShadow
                shadow-bias={-0.005}
              />

              <Suspense fallback={null}>
                <group ref={sceneWrapperRef}>
                  {models.map((model, index) => (
                    <RenderModel
                        key={model.id}
                        ref={(r) => {
                            if (index === 0) modelRef.current = r;
                            if (r) modelRefs.current.set(model.id, r);
                            else modelRefs.current.delete(model.id);
                        }}
                        type={model.type}
                        url={model.url}
                        wireframe={settings.wireframe}
                        setModelStats={(stats) => handleSetModelStats(model.id, stats)}
                        setMaterialList={(list) => handleSetMaterialList(model.id, list)}
                        selectedMaterial={selectedMaterial}
                        onSelectMaterial={handleSelectMaterial}
                        modelName={model.name}
                        transformMode={transformMode}
                        transformValues={transformValues}
                        materialSettings={materialSettings}
                        hiddenMaterials={new Set([...hiddenMaterials, ...deletedMaterials])}
                        onUpdateMaterialSetting={handleMaterialSync}
                        selectedTexture={selectedTexture}
                        resetKey={resetKey}
                        sceneResetTrigger={sceneResetTrigger}
                        uvUnwrapTrigger={uvUnwrapTrigger}
                        onTextureApplied={handleTextureApplied}
                        onTextureIdentified={handleTextureIdentified}
                        onTransformEnd={handleTransformEnd}
                        onTransformChange={handleTransformChange}
                    />
                  ))}
                </group>

                {transformMode && (selectedMaterial?.name === "Scene") && (
                    <TransformControls
                        object={sceneWrapperRef.current}
                        mode={transformMode}
                        size={0.8}
                        onChange={() => {
                            if (handleTransformChange && sceneWrapperRef.current) {
                                handleTransformChange({
                                    position: sceneWrapperRef.current.position,
                                    rotation: sceneWrapperRef.current.rotation,
                                    scale: sceneWrapperRef.current.scale
                                });
                            }
                        }}
                        onMouseUp={handleTransformEnd}
                    />
                )}

              </Suspense>

              {/* Blender-style Grid: Darker lines on dark background.
                  Color 1 (Center): Transparent/Same as grid since we draw custom axes.
                  Color 2 (Grid): #222222 or similar dark grey.
              */}
              {settings.grid && !isCapturing && <gridHelper args={[30, 30, 0x222222, 0x222222]} position={[0, -0.01, 0]} />}

              {/* Custom Center Lines: Red for X-axis, Green for Z-axis (User requested Red & Green) */}
              {settings.grid && !isCapturing && (
                <group position={[0, 0.01, 0]}>
                    {/* X Axis - Red */}
                    <line>
                        <bufferGeometry attach="geometry">
                            <bufferAttribute
                                attach="attributes-position"
                                count={2}
                                array={new Float32Array([-15, 0, 0, 15, 0, 0])}
                                itemSize={3}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial attach="material" color="red" linewidth={2} />
                    </line>

                    {/* Z Axis - Green (User asked for green center line) */}
                    <line>
                        <bufferGeometry attach="geometry">
                             <bufferAttribute
                                attach="attributes-position"
                                count={2}
                                array={new Float32Array([0, 0, -15, 0, 0, 15])}
                                itemSize={3}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial attach="material" color="green" linewidth={2} />
                    </line>
                </group>
              )}

              {settings.base && !isCapturing && (
                 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
                    <planeGeometry args={[30, 30]} />
                    <meshStandardMaterial color={settings.baseColor} />
                 </mesh>
              )}

              <OrbitControls
                ref={controlsRef}
                autoRotate={autoRotate}
                makeDefault
                enableDamping={true}
                dampingFactor={0.05}
                onChange={(e) => {
                  // Throttle UI updates to prevent "hanging" (lag) caused by excessive re-renders
                  const now = Date.now();
                  if (now - lastUpdateRef.current > 60) {
                     if (e?.target?.target) {
                        const { x, y, z } = e.target.target;
                        setTargetPosition({
                          x: parseFloat(x.toFixed(2)),
                          y: parseFloat(y.toFixed(2)),
                          z: parseFloat(z.toFixed(2))
                        });
                     }
                     lastUpdateRef.current = now;
                  }
                }}
              />

              {/* GIZMO HELPER - Also hide during capture */}
              {models.length > 0 && !isCapturing && (
                  <AnimatedGizmo 
                      isTextureOpen={isTextureOpen} 
                      activeTab="properties" 
                  />
              )}

              {models.length > 0 && (
                  <ContactShadows
                      position={[0, -0.01, 0]}
                      opacity={(materialSettings.shadow ?? 50) / 100}
                      scale={50}
                      blur={2}
                      far={5}
                      resolution={512}
                      color="#000000"
                  />
              )}

               <Environment
                   files={materialSettings.maps?.envMap || null}
                   preset={materialSettings.maps?.envMap ? null : (materialSettings.environment || 'city')}
                   background={false}
                   blur={0.5}
                   environmentIntensity={(materialSettings.reflection ?? 50) / 50}
                   rotation={[0, (materialSettings.envRotation || 0) * (Math.PI / 180), 0]}
               />
            </Canvas>
            )}
          </div>
        </div>

        {/* RIGHT SETTINGS PANEL */}
        <div className="w-[22vw] h-full border-l border-gray-100 bg-white z-40 relative flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
            <RightPanel
              onFileProcess={processFile}
              hasModel={models.length > 0}
              onExport={() => setShowExportModal(true)}
              autoRotate={autoRotate}
              setAutoRotate={setAutoRotate}
              isLoading={isGlobalLoading}
              materialSettings={materialSettings}
              onUpdateMaterialSetting={handleMaterialUIUpdate}
              activeAccordion={activeAccordion}
              setActiveAccordion={setActiveAccordion}
              transformValues={transformValues}
              onManualTransformChange={handleManualTransformChange}
              onResetTransform={handleResetTransform}
              onResetFactorSettings={() => {
                  setMaterialSettings(prev => {
                      const next = {
                          ...prev,
                          alpha: 100,
                          metallic: 0,
                          roughness: 50,
                          normal: 100,
                          bump: 100,
                          scale: 100,
                          scaleY: 100,
                          rotation: 0,
                          offset: { x: 0, y: 0 },
                          color: '#ffffff',
                          useFactorColor: false,
                          maps: { map: null, normalMap: null, roughnessMap: null, metalnessMap: null, bumpMap: null, aoMap: null }
                      };
                      pushHistory({ ...stateRef.current, materialSettings: next });
                      return next;
                  });
                  setResetKey(prev => prev + 1);
              }}
              onUvUnwrap={() => setUvUnwrapTrigger(prev => prev + 1)}
              onMapUpload={handleMapUpload}
              selectedTextureId={selectedTextureId}
              onSelectTexture={handleSelectTexture}
            />
        </div>
      </div>

          {showAddModelModal && (
              <AddModelModal
                  isOpen={showAddModelModal}
                  onClose={() => setShowAddModelModal(false)}
                  onAdd={handleAddModel}
              />
          )}

          {showModelGalleryModal && (
              <ModelGalleryModal
                  isOpen={showModelGalleryModal}
                  onClose={() => setShowModelGalleryModal(false)}
                  onSelectModel={handleSelectGalleryModel}
              />
          )}
    </div>
  );
}



