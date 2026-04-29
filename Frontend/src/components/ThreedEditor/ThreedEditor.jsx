import React, { useState, Suspense, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import Export3DModal from "./Components/Export3DModal";
import AddModelModal from "./Components/AddModelModal";
import ModelGalleryModal from "./Components/ModelGalleryModal";
import AlertModal from "../AlertModal";
import { GLTFExporter } from "three-stdlib";
// import { OBJExporter } from "three-stdlib";
import { STLExporter } from "three-stdlib";
import { MeshoptEncoder } from "meshoptimizer";
import CameraModal from "./Components/CameraModal";
import AddMaterial from "./Components/AddMaterial";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../components/CustomToast";
import JSZip from "jszip";


export default function ThreedEditor() {
  const { modelId: urlModelId } = useParams();
  const navigate = useNavigate();

  const { 
    threedState, 
    setThreedState, 
    setSaveHandler, 
    setCanSave,
    setHasUnsavedChanges, 
    setIsSaving, 
    triggerSaveSuccess 
  } = useOutletContext();

  const toast = useToast();

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
  const [loadingText, setLoadingText] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync manual loading with useProgress active state
  const { active } = useProgress();
  
  // Clear manual loading if it hangs
  useEffect(() => {
    if (manualLoading && !active && !loadingText) {
      const t = setTimeout(() => setManualLoading(false), 3000);
      return () => clearTimeout(t);
    }
  }, [active, manualLoading, loadingText]);
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
  const glInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const originalTransformRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Target Position State
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, z: 0 });
  const [modelMaterialLists, setModelMaterialLists] = useState({});
  const [modelMaterialDataMap, setModelMaterialDataMap] = useState({});
  const sceneWrapperRef = useRef(null);
  const [materialList, setMaterialList] = useState(threedState.materialList || []);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  
  useEffect(() => {
      // Debug log to confirm texture selection
      if (selectedTexture) console.log("Texture Selected:", selectedTexture.name);
  }, [selectedTexture]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [showModelGalleryModal, setShowModelGalleryModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [materialRefreshKey, setMaterialRefreshKey] = useState(0);

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
  
  const getInitialSet = (val) => {
    if (!val) return new Set();
    try {
        if (val instanceof Set) return new Set(val);
        if (Array.isArray(val)) return new Set(val);
        if (val && typeof val[Symbol.iterator] === 'function') return new Set(val);
    } catch(e) {}
    return new Set();
  };

  const [hiddenMaterials, setHiddenMaterials] = useState(getInitialSet(threedState.hiddenMaterials));
  const [deletedMaterials, setDeletedMaterials] = useState(getInitialSet(threedState.deletedMaterials));

  // Screenshot State
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [formatErrorModal, setFormatErrorModal] = useState({ isOpen: false, message: '' });

  const { 
    state: historyState, 
    past,
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

  // --- History Management ---
  // --- Initialization & Server Sync ---
  useEffect(() => {
    const initializeEditor = async () => {
      setIsSyncing(true);
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

        // 1. If we have a specific ID in the URL, load THAT model
        if (urlModelId) {
          console.log("Loading specific model from URL ID:", urlModelId);
          try {
            const res = await axios.get(`${backendUrl}/api/3d-models/get-model/${urlModelId}`);
            if (res.data) {
              const modelData = res.data;
              const fullUrl = `${backendUrl}${modelData.url}`;
              const newModel = {
                id: Date.now().toString(),
                modelId: modelData.modelId,
                url: fullUrl,
                file: null,
                type: modelData.type,
                name: modelData.name.replace(/\.[^/.]+$/, "")
              };
              setModels([newModel]);
              setModelUrl(fullUrl);
              setModelType(newModel.type);
              setModelName(newModel.name);
              setSelectedMaterial({ name: newModel.name, parentGroup: newModel.name });
              setIsSidebarCollapsed(false);
              setModelStats({ fileSize: modelData.size || "0 MB" });
              return; // End here for ID-based load
            }
          } catch (err) {
            console.error("Specified model not found, redirecting...", err);
            navigate("/editor/threed_editor");
          }
        }

        // 2. If NO ID in URL, we ALWAYS ensure an empty base as requested by the user.
        // This overrides any previous session state in this session.
        setModels([]);
        setModelUrl(null);
        setModelName("");
        setIsSidebarCollapsed(true);
        setSelectedMaterial(null);
        setHiddenMaterials(new Set());
        setDeletedMaterials(new Set());
        
        // Also update the global context state to ensure it doesn't "re-appear"
        setThreedState(prev => ({
            ...prev,
            models: [],
            modelUrl: null,
            modelName: "",
            materialSettings: {
                alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
                specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'city',
                color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
                lightPosition: { x: 10, y: 10, z: 10 }
            }
        }));

      } catch (globalError) {
        console.error("Global initialize error:", globalError);
      } finally {
        setIsSyncing(false);
      }
    };

    initializeEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastSavedRef = useRef({
    historyIndex: 0,
    hasLocalFiles: false
  });

  useEffect(() => {
    if (!setCanSave) return undefined;

    setCanSave(models.length > 0);

    return () => {
      setCanSave(true);
    };
  }, [models.length, setCanSave]);

  const handleSave = useCallback(async () => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

    try {
      if (models.length === 0) {
        return;
      }

      setIsSaving(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.error("User not found in localStorage");
        return;
      }
      
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const nextModels = [...models];
      let hasUploaded = false;

      // 0. Upload Manual Texture Maps if they are Blobs
      const nextMaterialSettings = { ...(materialSettings || {}) };
      if (nextMaterialSettings && nextMaterialSettings.maps) {
          const nextMaps = { ...nextMaterialSettings.maps };
          let mapsChanged = false;

          for (const [mapType, url] of Object.entries(nextMaps)) {
              if (url && typeof url === 'string' && url.startsWith('blob:')) {
                  try {
                      // Extract true blob URL (remove fragments)
                      const blobUrl = url.split('#')[0];
                      const blobResponse = await fetch(blobUrl);
                      const blob = await blobResponse.blob();
                      
                      const formData = new FormData();
                      formData.append('emailId', user.emailId);
                      formData.append('model', blob, `texture_${mapType}_${Date.now()}.png`); // Reusing upload-model endpoint
                      
                      const uploadRes = await axios.post(`${backendUrl}/api/3d-models/upload-model`, formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      
                      if (uploadRes.data && uploadRes.data.url) {
                          nextMaps[mapType] = `${backendUrl}${uploadRes.data.url}`;
                          mapsChanged = true;
                      }
                  } catch (e) {
                      console.error(`Failed to upload texture map ${mapType}:`, e);
                  }
              }
          }
          if (mapsChanged) {
              nextMaterialSettings.maps = nextMaps;
              setMaterialSettings(nextMaterialSettings);
          }
      }

      for (let i = 0; i < nextModels.length; i++) {
        const m = nextModels[i];
        if (m.file) {
          const file = m.file;
          const ext = file.name.split('.').pop().toLowerCase();
          // Use current name from state (which might have been renamed) instead of original file name
          const finalFileName = m.name.toLowerCase().endsWith(`.${ext}`) ? m.name : `${m.name}.${ext}`;
          
          const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
          const uploadId = Date.now().toString() + Math.random().toString(36).substring(7);
          
          let lastResponse = null;

          // Upload chunks sequentially to avoid overwhelming the connection
          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
              const start = chunkIndex * CHUNK_SIZE;
              const end = Math.min(start + CHUNK_SIZE, file.size);
              const chunk = file.slice(start, end);
              
              const formData = new FormData();
              // Append metadata BEFORE the file chunk to ensure multer sees them in req.body
              formData.append('uploadId', uploadId);
              formData.append('chunkIndex', chunkIndex);
              formData.append('totalChunks', totalChunks);
              formData.append('fileName', finalFileName);
              formData.append('emailId', user.emailId);
              formData.append('chunk', chunk);

              // We use a separate endpoint for chunks
              const res = await axios.post(`${backendUrl}/api/3d-models/upload-chunk`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
              });
              lastResponse = res;
          }

          if (lastResponse && lastResponse.data && lastResponse.data.url) {
            nextModels[i] = {
              ...m,
              url: `${backendUrl}${lastResponse.data.url}`,
              file: null, // Clear file object after successful upload
              modelId: lastResponse.data.modelId || m.modelId
            };
            hasUploaded = true;
          }
        }
      }

      // 1. Export Textured GLB and PNG for Gallery Thumbnail
      let hasExported = false;
      const gl = glInstanceRef.current;
      const camera = cameraInstanceRef.current;
      const modelGroup = sceneWrapperRef.current;
      
      if (gl && camera && modelGroup && nextModels.length > 0) {
          try {
              // A. Export GLB
              const exporter = new GLTFExporter();
              const glbBuffer = await new Promise((resolve, reject) => {
                  exporter.parse(modelGroup, (result) => resolve(result), (err) => reject(err), { binary: true });
              });
              
              // B. Capture Snapshot (PNG)
              const screenshotUrl = gl.domElement.toDataURL('image/png');
              const screenshotRes = await fetch(screenshotUrl);
              const screenshotBlob = await screenshotRes.blob();
              
              const baseName = (modelName || nextModels[0].name || "Scene").replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');
              
              // C. Upload GLB (The textured model)
              const glbFormData = new FormData();
              glbFormData.append('emailId', user.emailId);
              glbFormData.append('model', new Blob([glbBuffer]), `${baseName}.glb`);
              const glbRes = await axios.post(`${backendUrl}/api/3d-models/upload-model`, glbFormData);
              
              // D. Upload PNG (The Gallery Thumbnail)
              const pngFormData = new FormData();
              pngFormData.append('emailId', user.emailId);
              pngFormData.append('model', screenshotBlob, `${baseName}.png`);
              await axios.post(`${backendUrl}/api/3d-models/upload-model`, pngFormData);
              
              if (glbRes.data && glbRes.data.url) {
                  // Keep UI name clean, but update underlying record info
                  nextModels[0] = {
                      ...nextModels[0],
                      url: `${backendUrl}${glbRes.data.url}`,
                      name: `${baseName}.glb`,
                      type: 'glb',
                      file: null,
                      modelId: glbRes.data.modelId // Update with newly returned ID
                  };
                  hasExported = true;
                  setModelName(baseName); // Keep extension-less for toolbar
                  setModelUrl(`${backendUrl}${glbRes.data.url}`);
              }
          } catch (e) {
              console.error("Gallery sync failed:", e);
          }
      }

      // Save Full State (Session) to Backend
      const stateToSave = {
          models: nextModels,
          materialSettings: nextMaterialSettings, // Use potentially updated settings with server URLs
          transformValues,
          modelName,
          lastSaved: new Date().toISOString()
      };
      
      await axios.post(`${backendUrl}/api/3d-models/save-session`, {
          emailId: user.emailId,
          state: stateToSave
      });

      if (hasUploaded || hasExported) {
        setModels(nextModels);
      }
      
      // Update last saved reference to current state
      lastSavedRef.current = {
        historyIndex: past.length,
        hasLocalFiles: false
      };
      setHasUnsavedChanges(false);
      
      if (triggerSaveSuccess) {
        triggerSaveSuccess({
          isManual: true,
          name: modelName || "3D Model",
          folder: "3D_Modals"
        });
      }

      // If we just got a modelId from the first save, update URL
      const finalModelId = nextModels[0]?.modelId;
      console.log("HandleSave Navigation Check:", { finalModelId, urlModelId });
      
      if (finalModelId && (!urlModelId || urlModelId === "")) {
          console.log("Navigating to new model URL:", finalModelId);
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
  }, [models, modelName, setModelName, setIsSaving, setHasUnsavedChanges, triggerSaveSuccess, toast, materialSettings, transformValues, past, urlModelId, navigate]);

  useEffect(() => {
    if (setSaveHandler) {
      setSaveHandler(() => handleSave);
    }
    return () => {
      if (setSaveHandler) setSaveHandler(null);
    };
  }, [handleSave, setSaveHandler]);

  // Track Unsaved Changes
  useEffect(() => {
      const hasLocalModels = models.some(m => m.file);
      const historyChanged = past.length !== lastSavedRef.current.historyIndex;
      
      setHasUnsavedChanges(hasLocalModels || historyChanged);
  }, [models, past.length, setHasUnsavedChanges]);

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

  const handleSetMaterialList = useCallback((modelId, list, dataMap) => {
      setModelMaterialLists(prev => {
          const next = { ...prev, [modelId]: list };
          updateHistory({
              ...stateRef.current,
              modelMaterialLists: next
          });
          return next;
      });

      if (dataMap) {
          setModelMaterialDataMap(prev => ({ ...prev, [modelId]: dataMap }));
      }
  }, [updateHistory]);

  // Two-Step Compression Export
  // Step 1: Three.js GLTFExporter -> raw GLB ArrayBuffer (captures all editor material changes)
  // Step 2: gltf-transform (dedup+prune+reorder/Meshopt) post-process -> real geometry compression
  // Quality: Low=512px | Medium=1024px | High=2048px | Original=4096px (canvas downscale)
  // Compression slider > 0 + GLB format -> Step 2 Meshopt applied

  const handleExport = async (exportSettings) => {
    const {
        exportScope,
        selectedMaterial,
        exportFormat,
        fileName,
        customMaterialNames,
        compression     = 0,
        includeTextures = true,
        embedTextures   = true,
        quality         = 'Medium',
        orientation     = 'Y axis up',
        exportSeparate  = false,
    } = typeof exportSettings === 'object' ? exportSettings : { exportFormat: exportSettings };

    const format = exportFormat?.toLowerCase() || 'glb';
    if (!sceneWrapperRef.current || models.length === 0) return;
    setManualLoading(true);

    setLoadingText("Preparing export...");
    const name       = fileName || modelName || (models.length > 0 ? models[0].name : "Scene");
    const isGLB      = format === 'glb' || format === 'gltf';
    const useMeshopt = isGLB && compression > 0;
    const qualityTextureSize = { Low: 512, Medium: 1024, High: 2048, Original: 4096 }[quality] ?? 1024;

    const TEX_KEYS         = ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap','bumpMap','displacementMap'];
    const originalTextures = new Map();
    const visibilityMap    = new Map();

    // 1. Prepare scene clone for processing to avoid touching live scene
    const scene = sceneWrapperRef.current.clone(true);
    
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
                // If opacity is very high, force OPAQUE mode to prevent sorting artifacts in external viewers
                if ((mat.opacity >= 0.99) && !mat.alphaMap) {
                    mat.transparent = false;
                }
                
                // Ensure depth writing and alpha testing are enabled to prevent see-through glitches
                mat.depthWrite = true;
                mat.alphaTest = 0.1;

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

    const downscaleTexture = (tex, maxPx) => {
        if (!tex || !tex.image) return tex;
        const img = tex.image;
        const srcW = img.naturalWidth || img.width || maxPx;
        const srcH = img.naturalHeight || img.height || maxPx;
        if (srcW <= maxPx && srcH <= maxPx) return tex;
        const ratio = Math.min(maxPx / srcW, maxPx / srcH);
        const cv = document.createElement('canvas');
        cv.width  = Math.max(1, Math.floor(srcW * ratio));
        cv.height = Math.max(1, Math.floor(srcH * ratio));
        const ctx = cv.getContext('2d', { alpha: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        
        const t = new THREE.Texture(cv);
        t.colorSpace = tex.colorSpace;
        t.wrapS = tex.wrapS;
        t.wrapT = tex.wrapT;
        t.repeat.copy(tex.repeat);
        t.offset.copy(tex.offset);
        t.rotation = tex.rotation;
        t.center.copy(tex.center);
        t.anisotropy = tex.anisotropy;
        t.flipY = tex.flipY;
        t.needsUpdate = true;
        return t;
    };

    const applyTexturePolicy = () => {
        originalTextures.forEach((_snap, mat) => {
            TEX_KEYS.forEach(k => {
                if (!includeTextures)                        mat[k] = null;
                else if (quality !== 'Original' && mat[k])  mat[k] = downscaleTexture(mat[k], qualityTextureSize);
            });
            mat.needsUpdate = true;
        });
    };

    // STEP 1: Three.js scene -> raw GLB ArrayBuffer
    const exportSceneToGLBBuffer = (targetScene) => new Promise((resolve, reject) => {
        new GLTFExporter().parse(
            targetScene,
            (result) => resolve(result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result)).buffer),
            reject,
            { binary: true, forceIndices: true, maxTextureSize: qualityTextureSize, embedImages: embedTextures, includeCustomExtensions: false }
        );
    });

    // STEP 2: gltf-transform Meshopt post-process
    const applyMeshoptToBuffer = async (glbBuffer) => {
        setLoadingText("Applying Meshopt compression...");
        try {
            const { WebIO }                 = await import('@gltf-transform/core');
            const { EXTMeshoptCompression } = await import('@gltf-transform/extensions');
            const { dedup, prune, reorder } = await import('@gltf-transform/functions');
            await MeshoptEncoder.ready;
            const io  = new WebIO().registerExtensions([EXTMeshoptCompression]);
            const doc = await io.readBinary(new Uint8Array(glbBuffer));
            await doc.transform(dedup(), prune(), reorder({ encoder: MeshoptEncoder }));
            return (await io.writeBinary(doc)).buffer;
        } catch (err) {
            console.error("Meshopt compression failed - using uncompressed GLB:", err);
            return glbBuffer;
        }
    };

    const exportNonGLBBlob = (targetScene) => {
        // if (format === 'obj') return new Blob([new OBJExporter().parse(targetScene)], { type: 'text/plain' });
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
            const zip   = new JSZip();
            const names = selectedMaterial.isGroup ? selectedMaterial.materials : [selectedMaterial.name];

            for (const matName of names) {
                const displayName = (customMaterialNames && customMaterialNames[matName] ? customMaterialNames[matName] : matName).replace(/\s+/g, '_');
                setLoadingText("Exporting " + displayName + "...");
                scene.traverse((obj) => {
                    if (obj.isMesh && obj.material) {
                        const hit = obj.name === matName || (Array.isArray(obj.material) ? obj.material.some(m => m.name === matName) : obj.material.name === matName);
                        obj.visible = hit;
                    } else if (obj.isLight || obj.isHelper) obj.visible = false;
                });
                if (isGLB) {
                    let buf = await exportSceneToGLBBuffer(scene);
                    if (useMeshopt) buf = await applyMeshoptToBuffer(buf);
                    zip.file(displayName + "." + format, new Uint8Array(buf));
                } else {
                    zip.file(displayName + "." + format, exportNonGLBBlob(scene));
                }
            }

            setLoadingText("Generating ZIP...");
            const level = Math.min(9, Math.max(1, Math.ceil(compression / 11)));
            const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: level } });
            triggerDownload(zipBlob, name.replace(/\s+/g, '_') + ".zip");

        } else {
            if (isGLB) {
                setLoadingText("Exporting scene...");
                let buf = await exportSceneToGLBBuffer(scene);
                if (useMeshopt) buf = await applyMeshoptToBuffer(buf);
                triggerDownload(buf, name.replace(/\s+/g, '_') + "." + format);
            } else {
                setLoadingText("Exporting model...");
                triggerDownload(exportNonGLBBlob(scene), name.replace(/\s+/g, '_') + "." + format);
            }
        }
    } catch (error) {
        console.error("Export error:", error);
        toast.error("Export failed. Please try again.");
    } finally {
        restoreAll();
        
        // Memory Cleanup: Dispose of the cloned scene resources to prevent browser crashes (STATUS_ACCESS_VIOLATION)
        scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach(m => {
                    // Dispose textures (including those created during downscaling)
                    TEX_KEYS.forEach(k => { 
                        if (m[k] && m[k].isTexture && m[k].image instanceof HTMLCanvasElement) {
                            m[k].dispose(); 
                        }
                    });
                    m.dispose();
                });
            }
        });

        setManualLoading(false);
        setLoadingText("");
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

      // Automatically select full model after deletion without blink
      if (modelName) {
          setSelectedMaterial({ name: modelName, parentGroup: modelName, noBlink: true });
      }

      pushHistory({
          ...stateRef.current,
          deletedMaterials: Array.from(next),
          materialSettings: materialSettings,
          selectedMaterial: modelName ? { name: modelName, parentGroup: modelName, noBlink: true } : null
      });
  }, [deletedMaterials, materialSettings, pushHistory, modelName]);

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
        if (selectedMaterial && selectedMaterial.name) {
          if (selectedMaterial.isGroup) {
              // Delete multiple materials
              e.preventDefault();
              if (selectedMaterial.materials) {
                  selectedMaterial.materials.forEach(m => handleDeleteMaterial(m));
              }
              // Selection is handled by the last handleDeleteMaterial call or we can do it explicitly here
              if (modelName) setSelectedMaterial({ name: modelName, parentGroup: modelName });
          } else {
              const matName = selectedMaterial.name;
              if (matName === modelName) {
                  // Delete entire model
                  e.preventDefault();
                  handleDeleteModel(matName);
                  setSelectedMaterial(null);
              } else if (matName !== "Scene") {
                  // Delete single material
                  e.preventDefault();
                  handleDeleteMaterial(matName);
                  // Selection update is handled inside handleDeleteMaterial
              }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedMaterial, hiddenMaterials, handleToggleVisibility, handleDeleteMaterial, modelName]);

  const handleRename = useCallback(async (newName) => {
    if (!newName || !newName.trim()) return;

    const oldModelName = modelName;
    setModelName(newName);

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      // 1. Identify which model to rename on the server
      const nextModels = models.map(m => {
        if (m.name === oldModelName || models.length === 1) {
          return { ...m, name: newName };
        }
        return m;
      });
      setModels(nextModels);

      const nextState = {
        ...stateRef.current,
        modelName: newName,
        models: nextModels
      };

      pushHistory(nextState);

      // 2. Try to rename the actual file on server for real file sync
      const renameIndex = nextModels.findIndex(m => m.name === newName);
      if (renameIndex !== -1) {
        const target = nextModels[renameIndex];
        if (target.url && !target.url.startsWith('blob:')) {
          const oldFileName = target.url.split('/').pop();
          try {
            const renameRes = await axios.post(`${backendUrl}/api/3d-models/rename-model`, {
              emailId: user.emailId,
              oldName: oldFileName,
              newName: newName
            });
            if (renameRes.data && renameRes.data.url) {
              const updatedUrl = `${backendUrl}${renameRes.data.url}`;
              nextModels[renameIndex].url = updatedUrl;
              
              // Update state correctly
              setModels([...nextModels]);
              if (renameIndex === 0) setModelUrl(updatedUrl);
              
              // IMPORTANT: Update nextState before using it below
              nextState.models = [...nextModels];
            }
          } catch (e) {
            console.error("Server-side file rename failed:", e);
          }
        }
      }

      // 3. Persist updated session state
      await axios.post(`${backendUrl}/api/3d-models/save-session`, {
        emailId: user.emailId,
        state: nextState
      });

      // Update history with the final resolved state
      pushHistory(nextState);

    } catch (error) {
      console.error("Failed to update backend rename:", error);
    }
  }, [models, modelName, pushHistory, setModelUrl]);


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
          // If a material-specific property is changed, enable the override flag
          // so that the changes apply in "Full Model" mode.
          const materialKeys = [
              'color', 'metallic', 'roughness', 'alpha', 'emissiveIntensity', 
              'emissiveColor', 'normal', 'bump', 'scale', 'rotation', 'offset', 
              'colorIntensity', 'reflection', 'ao', 'specular', 'softness'
          ];
          if (materialKeys.includes(key)) {
              next.useFactorColor = true;
          }

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
        setFormatErrorModal({
            isOpen: true,
            message: `The file format ".${name.split('.').pop()}" is not supported. Please upload one of the following: .GLB, .GLTF, .OBJ, .FBX, .STL, .STEP`
        });
        return;
    } 
    
    setManualLoading(true);
    // Safety fallback to dismiss loader if useProgress fails to trigger
    setTimeout(() => {
        setManualLoading(false);
    }, 10000);

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
    setSelectedMaterial({ name: nextModelName, parentGroup: nextModelName });
    setHiddenMaterials(new Set());
    setDeletedMaterials(new Set());
    
    const nextMaterialSettings = {
        alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
        specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'city',
        color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
        appliedTexture: null,
        maps: {},
        emissiveIntensity: 0,
        emissiveColor: '#ffffff',
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
        selectedMaterial: { name: nextModelName, parentGroup: nextModelName },
        modelMaterialLists: {}
    });

    setIsSidebarCollapsed(false); 
  };

  const handleSelectGalleryModel = async (model) => {
    if (!model) return;

    setManualLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const modelUrlPath = model.url.startsWith('/') ? model.url : `/${model.url}`;
    const fullUrl = `${backendUrl}${modelUrlPath}`;

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
    setSelectedMaterial({ name: nextModelName, parentGroup: nextModelName });
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
        selectedMaterial: { name: nextModelName, parentGroup: nextModelName },
        modelMaterialLists: {}
    });

    setIsSidebarCollapsed(false);
    
    // Update URL to the new model ID
    if (model.modelId) {
        navigate(`/editor/threed_editor/${model.modelId}`);
    }
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

  const handleClearModel = async () => {
    // Revoke URLs
    models.forEach(m => {
         if (m.url) URL.revokeObjectURL(m.url);
    });

    const defaultTransform = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    };

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
    
    // Clear URL ID
    navigate("/editor/threed_editor");

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
    
    // Reset Context State
    setThreedState(prev => ({
        ...prev,
        models: [],
        modelUrl: null,
        modelName: "",
        materialSettings: {
            alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
            specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'city',
            color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
            lightPosition: { x: 10, y: 10, z: 10 }
        }
    }));

    // Reset History
    resetHistory({
        transformValues: defaultTransform,
        materialSettings: {},
        modelName: ""
    });

    // Also clear from server session to make it persistent across refreshes
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${backendUrl}/api/3d-models/save-session`, {
                emailId: user.emailId,
                state: {
                    models: [],
                    materialSettings: {},
                    transformValues: defaultTransform,
                    modelName: "",
                    lastSaved: new Date().toISOString()
                }
            });
        }
    } catch (err) {
        console.error("Error clearing server session:", err);
    }
  };

  const handleResetView = () => {
    if (controlsRef.current) {
        controlsRef.current.reset();
        setTargetPosition({ x: 0, y: 0, z: 0 });
    }
    // Trigger scene-wide reset for model parts
    setSceneResetTrigger(prev => prev + 1);
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

  const [settings, setSettings] = useState({
    backgroundColor: "#393939", // Blender default dark grey
    baseColor: "#2c2c2c",
    base: true, // Blender doesn't have a solid floor plane by default
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
       const isNone = textureData?.id === 'none';
       const newTexture = isReset ? null : { ...textureData, ts: Date.now() };
       
       setSelectedTextureId(isReset ? null : textureData.id);
       setSelectedTexture(newTexture);

       setMaterialSettings(prev => {
           const next = {
               ...prev,
               appliedTexture: newTexture
           };

           if (isReset || isNone) {
               next.maps = { 
                   map: null, 
                   normalMap: null, 
                   roughnessMap: null, 
                   metalnessMap: null, 
                   displacementMap: null, 
                   aoMap: null,
                   emissiveMap: null,
                   alphaMap: null
               };
           } else {
               // Resolve URLs and Map Keys for Uploaded Textures
               let finalMaps = { ...(textureData.maps || {}) };
               
               if (textureData.isUploaded) {
                   const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                   const keyMapping = {
                       base: 'map',
                       metallic: 'metalnessMap',
                       roughness: 'roughnessMap',
                       normal: 'normalMap',
                       ao: 'aoMap',
                       displacement: 'displacementMap',
                       opacity: 'alphaMap',
                       emissive: 'emissiveMap'
                   };

                   const mapped = {};
                   Object.entries(finalMaps).forEach(([key, url]) => {
                       if (!url) return;
                       const targetKey = keyMapping[key] || key;
                       const fullUrl = (typeof url === 'string' && url.startsWith('/uploads')) ? `${backendUrl}${url}` : url;
                       mapped[targetKey] = fullUrl;
                   });
                   finalMaps = mapped;
               }

               next.maps = { ...(prev.maps || {}), ...finalMaps };
               // Set factors to 100% when applying a full texture set
               next.metallic = 100;
               next.roughness = 100;
               next.normal = 100;
               next.bump = textureData.isUploaded ? 0 : 0; // Standardize bump for uploads
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
      
      const getNames = (s) => {
          if (!s) return [];
          if (typeof s === 'string') return [s];
          if (Array.isArray(s.materials)) return s.materials;
          if (s.name) return [s.name];
          return [];
      };

      // Ensure we have an object for the new selection
      const target = typeof val === 'object' ? { ...val } : { name: val };
      const isShift = !!target.isShift;

      // Single select
      setSelectedMaterial(prev => {
          if (isShift && prev) {
              const prevNames = getNames(prev);
              const nextNames = getNames(target);
              const combined = Array.from(new Set([...prevNames, ...nextNames]));
              
              return {
                  name: "Multiple Selection",
                  isGroup: true,
                  materials: combined,
                  ts: Date.now()
              };
          }
          
          return { ...target, uuid: target.uuid || null, ts: Date.now() };
      });

      // Clear property specific maps first to prevent bleeding, then check for defaults
      setMaterialSettings(prev => {
          const next = { ...prev, maps: {} };
          
          // If it's a single material selection, try to fetch default textures/properties from the model
          if (!isShift && target.name && target.name !== modelName && target.name !== "Scene") {
              // Find which model this material belongs to
              let defaultData = null;
              for (const modelId in modelMaterialDataMap) {
                  if (modelMaterialDataMap[modelId][target.name]) {
                      defaultData = modelMaterialDataMap[modelId][target.name];
                      break;
                  }
              }

              if (defaultData) {
                  return {
                      ...next,
                      color: defaultData.color || next.color,
                      metallic: defaultData.metallic !== undefined ? defaultData.metallic : next.metallic,
                      roughness: defaultData.roughness !== undefined ? defaultData.roughness : next.roughness,
                      alpha: defaultData.opacity !== undefined ? defaultData.opacity : next.alpha,
                      maps: defaultData.maps || {}
                  };
              }
          }
          
          return next;
      });
  }, [modelName, modelMaterialDataMap]);

  // Reset the override flag when selection changes.
  // This prevents the settings from one material (or a freshly synced baseline)
  // from being pushed back to the model before the user has actually touched a slider.
  useEffect(() => {
    setMaterialSettings(prev => ({
        ...prev,
        useFactorColor: false
    }));
  }, [selectedMaterial]);

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
      {!showModelGalleryModal && <GlobalLoader manualLoading={manualLoading || isSyncing} text={loadingText} />}
      


      {/* --- EXPORT MODAL --- */}
      {showExportModal && (
          <Export3DModal 
              onClose={() => setShowExportModal(false)}
              onExport={handleExport}
              models={models}
              materialSettings={materialSettings}
              transformValues={transformValues}
              hiddenMaterials={hiddenMaterials}
              deletedMaterials={deletedMaterials}
              selectedTexture={selectedTexture}
              selectedMaterial={selectedMaterial}
              materialList={activeMaterialList}
              modelName={modelName}
              modelSize={modelStats.fileSize || "Unknown"}
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
              selectedTextureId={selectedTextureId}
              onAddMaterialClick={() => setShowAddMaterialModal(true)}
              refreshTrigger={materialRefreshKey}
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
              
              dpr={[1, 2]}
              gl={{
                preserveDrawingBuffer: true,
                antialias: true,
                alpha: true,
                logarithmicDepthBuffer: true
              }}
              shadows={{ type: THREE.PCFSoftShadowMap }}
              onCreated={({ gl, camera }) => {
                glInstanceRef.current = gl;
                cameraInstanceRef.current = camera;
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.outputColorSpace = THREE.SRGBColorSpace;
              }}
            >
              {/* Only show background color if NOT capturing for a clean model-only shot */}
              {!isCapturing && <color attach="background" args={[settings.backgroundColor]} />}

              <ambientLight intensity={(materialSettings.shadow ?? 50) / 40} />
              <spotLight
                position={[
                    materialSettings.lightPosition?.x ?? 5, 
                    materialSettings.lightPosition?.y ?? 10, 
                    materialSettings.lightPosition?.z ?? 5
                ]}
                angle={0.25}
                penumbra={1}
                intensity={(materialSettings.reflection ?? 50) / 20} 
                castShadow
                shadow-bias={-0.00005}
                shadow-normalBias={0.04}
                shadow-radius={(materialSettings.softness ?? 50) / 8} 
                shadow-mapSize={[4096, 4096]}
                shadow-camera-near={0.1}
                shadow-camera-far={40}
              />
              <directionalLight
                position={[
                    -(materialSettings.lightPosition?.x ?? 5), 
                    materialSettings.lightPosition?.y ?? 8, 
                    -(materialSettings.lightPosition?.z ?? 5)
                ]}
                intensity={(materialSettings.reflection ?? 50) / 40}
                castShadow
                shadow-bias={-0.00005}
                shadow-normalBias={0.04}
                shadow-radius={(materialSettings.softness ?? 50) / 8}
                shadow-mapSize={[4096, 4096]}
                shadow-camera-left={-7}
                shadow-camera-right={7}
                shadow-camera-top={7}
                shadow-camera-bottom={-7}
                shadow-camera-near={0.1}
                shadow-camera-far={40}
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

              {/* Blender-style Grid: Hide center black lines by matching background */}
              {settings.grid && !isCapturing && <gridHelper args={[30, 30, 0x393939, 0x222222]} position={[0, 0, 0]} />}

              {settings.grid && !isCapturing && (
                <group position={[0, 0, 0]}>
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

                    {/* Z Axis - Green */}
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
                 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
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
                      position={[0, -0.005, 0]}
                      opacity={(materialSettings.shadow ?? 50) / 100}
                      scale={50}
                      blur={2.5}
                      far={5}
                      resolution={1024}
                      color="#000000"
                  />
              )}

               <Environment
                   files={materialSettings?.maps?.envMap || null}
                   preset={materialSettings?.maps?.envMap ? null : (materialSettings?.environment || 'city')}
                   background={false}
                   blur={0.5}
                   environmentIntensity={(materialSettings?.reflection ?? 50) / 50}
                   rotation={[0, (materialSettings?.envRotation || 0) * (Math.PI / 180), 0]}
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

          {showAddMaterialModal && (
              <AddMaterial 
                  isOpen={showAddMaterialModal} 
                  onClose={() => setShowAddMaterialModal(false)}
                  onUpdateSuccess={() => setMaterialRefreshKey(prev => prev + 1)}
              />
          )}

          <AlertModal
              isOpen={formatErrorModal.isOpen}
              onClose={() => setFormatErrorModal({ isOpen: false, message: '' })}
              type="error"
              title="Invalid Model Format"
              message={formatErrorModal.message}
              confirmText="Got it"
          />
    </div>
  );
}



