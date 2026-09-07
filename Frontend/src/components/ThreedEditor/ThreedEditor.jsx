import React, { useState, Suspense, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useProgress, ContactShadows, TransformControls, useGLTF } from "@react-three/drei";
import RightPanel from "./ThreedRightpanel";
import EditorInfoBox from "./EditorInfoBox";
import EditorToolbar from "./EditorToolbar";
import TextureGalleryBar from "./TextureGalleryBar";
import TopToolbar from "./TopToolbar";
import AnimatedGizmo from "./Components/AnimatedGizmo";
import { GlobalLoader } from "./Components/GlobalLoader";
import RenderModel from "./Components/ModelLoaders";
import SmoothOrbitControls from "./Components/SmoothOrbitControls";
import useModalHistory from "./hooks/useModalHistory";
import Export3DModal from "./Components/Export3DModal";
import AddModelModal from "./Components/AddModelModal";
import ModelGalleryModal from "./Components/ModelGalleryModal";
import AlertModal from "../AlertModal";
import { GLTFExporter, STLExporter, OBJLoader, FBXLoader, STLLoader } from "three-stdlib";
import { LWOLoader } from "three/examples/jsm/loaders/LWOLoader.js";
import { TDSLoader } from "three/examples/jsm/loaders/TDSLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { MeshoptEncoder } from "meshoptimizer";
import initOCCT from "occt-import-js";
import CameraModal from "./Components/CameraModal";
import AddMaterial from "./Components/AddMaterial";
import { resolveUploadsPath } from "../../utils/supabaseUtils";
import { process3DDropEvent } from "./utils/modelDropHandler";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../components/CustomToast";

// Safe GLTFExporter patch to guarantee options.animations is always a valid Array and never undefined
if (GLTFExporter && GLTFExporter.prototype && !GLTFExporter.prototype._isSafeExporterPatched) {
  GLTFExporter.prototype._isSafeExporterPatched = true;
  const originalParse = GLTFExporter.prototype.parse;
  GLTFExporter.prototype.parse = function (input, onDone, onError, options = {}) {
    const safeOptions = { ...(options || {}) };
    if (!Array.isArray(safeOptions.animations)) {
      safeOptions.animations = [];
    }
    return originalParse.call(this, input, onDone, onError, safeOptions);
  };
}


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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingModelInfo, setLoadingModelInfo] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const loadingTimerRef = useRef(null);
  const isCompletingRef = useRef(false);
  const pendingModelIdRef = useRef(null);
  const modelsRef = useRef(models);

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const { active, progress } = useProgress();

  // Unified startModelLoading coordinator
  const startModelLoading = useCallback((modelInfo) => {
    if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    isCompletingRef.current = false;
    pendingModelIdRef.current = modelInfo?.id ? String(modelInfo.id) : null;

    setLoadingModelInfo(modelInfo || null);
    const ext = (modelInfo?.type || modelInfo?.name?.split('.').pop() || '').toLowerCase();
    const isCad = ['step', 'stp', 'iges', 'igs'].includes(ext);
    const isArchive = ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2'].some(e => (modelInfo?.name || '').toLowerCase().endsWith(e));

    setLoadingText(
      isArchive
        ? "Unpacking 3D model archive & textures..."
        : (isCad
            ? "Preparing CAD model & tessellation engine..."
            : "Reading 3D model file...")
    );
    setLoadingProgress(8);
    setManualLoading(true);

    // Smooth progressive ticker: smoothly glides from 8% up to 93% while Three.js loads & positions the model
    let current = 8;
    loadingTimerRef.current = setInterval(() => {
      if (isCompletingRef.current) return;

      if (current < 30) {
        current += Math.random() * 5 + 3;
        setLoadingText(prev => isCad ? "Initializing CAD OpenCASCADE engine..." : "Parsing 3D geometry...");
      } else if (current < 60) {
        current += Math.random() * 3 + 2;
        setLoadingText(prev => isCad ? "Tessellating CAD surfaces & facets..." : "Processing materials & meshes...");
      } else if (current < 85) {
        current += Math.random() * 2 + 1;
        setLoadingText("Calculating bounds & normalizing scale...");
      } else if (current < 94) {
        current += 0.35;
        setLoadingText("Positioning model on base grid...");
      }

      current = Math.min(94, current);
      setLoadingProgress(Math.round(current));
    }, 110);
  }, []);

  // Update progress from sub-loaders (e.g. CadModel)
  const handleModelProgress = useCallback((modelId, progressPct, stageText) => {
    if (pendingModelIdRef.current && modelId && String(pendingModelIdRef.current) !== String(modelId) && (modelsRef.current?.length > 1)) return;
    if (isCompletingRef.current) return;

    if (stageText) setLoadingText(stageText);
    if (typeof progressPct === 'number' && !isNaN(progressPct)) {
      setLoadingProgress(prev => Math.max(prev, Math.min(95, Math.round(progressPct))));
    }
  }, []);

  // Completion hook: triggered by GenericModel after double-RAF base positioning
  const handleModelReady = useCallback((modelId) => {
    if (isCompletingRef.current) return;
    // Guard against non-pending model ONLY if there are multiple models loaded and IDs explicitly conflict
    if (pendingModelIdRef.current && modelId && String(pendingModelIdRef.current) !== String(modelId) && (modelsRef.current?.length > 1)) {
      console.warn(`[ThreedEditor] Skipping onModelReady for non-pending model: ${modelId} (pending: ${pendingModelIdRef.current})`);
      return;
    }

    isCompletingRef.current = true;
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    // Set 100% and notify user the model is on base
    setLoadingProgress(100);
    setLoadingText("Model ready on base!");

    // Hold at 100% for 380ms for visual satisfaction, then cleanly dismiss
    setTimeout(() => {
      setManualLoading(false);
      setLoadingProgress(0);
      setLoadingText("");
      setLoadingModelInfo(null);
      pendingModelIdRef.current = null;
      isCompletingRef.current = false;
    }, 380);
  }, []);

  // Sync with Drei useProgress if active (for external textures and secondary downloads)
  useEffect(() => {
    if (active && manualLoading && !isCompletingRef.current) {
      const mapped = Math.round(25 + (progress * 0.67));
      setLoadingProgress(prev => Math.max(prev, Math.min(93, mapped)));
    }
  }, [active, progress, manualLoading]);

  // Safety stuck timer: only auto-dismiss if loading has stalled for 15 minutes (aligned with converter timeout & GlobalLoader)
  useEffect(() => {
    if (!manualLoading) return;
    const t = setTimeout(() => {
      console.warn("[ThreedEditor] Loading safety limit reached (15m) — clearing loader.");
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setManualLoading(false);
      setLoadingProgress(0);
      setLoadingText("");
      setLoadingModelInfo(null);
      pendingModelIdRef.current = null;
      isCompletingRef.current = false;
    }, 15 * 60 * 1000);
    return () => clearTimeout(t);
  }, [manualLoading]);

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

  const handleControlsChange = useCallback((e) => {
    const target = e?.target?.target;
    if (!target) return;
    const now = Date.now();
    if (now - lastUpdateRef.current > 50) {
      const nx = parseFloat(target.x.toFixed(2));
      const ny = parseFloat(target.y.toFixed(2));
      const nz = parseFloat(target.z.toFixed(2));
      setTargetPosition((prev) => {
        if (prev && prev.x === nx && prev.y === ny && prev.z === nz) {
          return prev;
        }
        return { x: nx, y: ny, z: nz };
      });
      lastUpdateRef.current = now;
    }
  }, []);

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

  const defaultTransform = useMemo(() => ({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
  }), []);

  const sanitizeTransformValues = useCallback((t) => {
      if (!t) return defaultTransform;
      const pos = t.position || { x: 0, y: 0, z: 0 };
      const rot = t.rotation || { x: 0, y: 0, z: 0 };
      let sc = t.scale || { x: 1, y: 1, z: 1 };

      let sx = typeof sc.x === 'number' ? sc.x : 1;
      let sy = typeof sc.y === 'number' ? sc.y : 1;
      let sz = typeof sc.z === 'number' ? sc.z : 1;

      // If scale was corrupted/saved as percentage (>= 50), sanitize back to 1.0 multiplier
      if (Math.abs(sx) >= 50) sx = 1;
      if (Math.abs(sy) >= 50) sy = 1;
      if (Math.abs(sz) >= 50) sz = 1;

      return {
          position: { x: pos.x ?? 0, y: pos.y ?? 0, z: pos.z ?? 0 },
          rotation: { x: rot.x ?? 0, y: rot.y ?? 0, z: rot.z ?? 0 },
          scale: { x: sx, y: sy, z: sz }
      };
  }, [defaultTransform]);

  // Transform Tools State
  const [transformMode, setTransformMode] = useState(null); // 'translate', 'rotate', 'scale', null
  const [transformValues, setRawTransformValues] = useState(() => sanitizeTransformValues(threedState.transformValues));

  const setTransformValues = useCallback((valOrFn) => {
      setRawTransformValues(prev => {
          const raw = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
          const next = sanitizeTransformValues(raw);
          if (prev &&
              prev.position?.x === next.position.x &&
              prev.position?.y === next.position.y &&
              prev.position?.z === next.position.z &&
              prev.rotation?.x === next.rotation.x &&
              prev.rotation?.y === next.rotation.y &&
              prev.rotation?.z === next.rotation.z &&
              prev.scale?.x === next.scale.x &&
              prev.scale?.y === next.scale.y &&
              prev.scale?.z === next.scale.z) {
              return prev;
          }
          return next;
      });
  }, [sanitizeTransformValues]);

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
  const [formatErrorModal, setFormatErrorModal] = useState({ isOpen: false, title: 'Invalid Model Format', message: '' });

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
      models: models,
      transformValues: transformValues,
      materialSettings: materialSettings,
      modelName: modelName,
      hiddenMaterials: Array.from(hiddenMaterials),
      deletedMaterials: Array.from(deletedMaterials),
      modelMaterialLists: modelMaterialLists,
      selectedMaterial: selectedMaterial,
      selectedTexture: selectedTexture
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
        const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const backendUrl = rawBackendUrl.trim().replace(/\/+$/, '');

        // 1. If we have a specific ID in the URL, load THAT model
        if (urlModelId) {
          console.log("Loading specific model from URL ID:", urlModelId);
          startModelLoading({
            id: urlModelId,
            name: "Loading 3D Model...",
            type: "glb"
          });
          try {
            const res = await axios.get(`${backendUrl}/api/3d-models/get-model/${urlModelId}`);
            if (res.data) {
              const modelData = res.data.model || res.data;
              const fullUrl = resolveUploadsPath(modelData.url);

              const newModel = {
                id: urlModelId,
                modelId: modelData.modelId || urlModelId,
                url: fullUrl,
                file: null,
                type: modelData.type || (['step', 'stp', 'iges', 'igs', 'obj', 'fbx', 'stl', 'low', 'lwo', '3ds'].includes((fullUrl || '').split('?')[0].split('.').pop().toLowerCase()) ? (fullUrl || '').split('?')[0].split('.').pop().toLowerCase() : 'glb'),
                name: (modelData.name || "Model").replace(/\.[^/.]+$/, ""),
                fileName: modelData.fileName,
                displayName: modelData.displayName
              };
              setModels([newModel]);
              setModelUrl(fullUrl);
              setModelType(newModel.type);
              setModelName(newModel.name);
              setSelectedMaterial({ name: newModel.name, parentGroup: newModel.name });
              setIsSidebarCollapsed(false);
              setModelStats({ fileSize: modelData.size || "0 MB" });
              resetHistory({
                ...stateRef.current,
                models: [newModel],
                modelName: newModel.name,
                selectedMaterial: { name: newModel.name, parentGroup: newModel.name }
              });
              return; // End here for ID-based load
            }
          } catch (err) {
            console.error("Specified model not found, redirecting to 404...", err);
            setManualLoading(false);
            setLoadingProgress(0);
            setLoadingText("");
            navigate('/not-found', { replace: true });
          }
        }

        // 2. Check for temp model passed from InteractionPanel
        const tempThreedEditModelStr = localStorage.getItem('tempThreedEditModel');
        if (tempThreedEditModelStr) {
          try {
            const parsed = JSON.parse(tempThreedEditModelStr);
            const tempId = parsed.id ? String(parsed.id) : Date.now().toString();
            startModelLoading({
              id: tempId,
              name: parsed.name || "Loading 3D Model...",
              type: parsed.type || "glb"
            });
            const fullUrl = parsed.url.startsWith('http') || parsed.url.startsWith('blob:') || parsed.url.startsWith('data:') 
              ? parsed.url 
              : `${backendUrl}${parsed.url}`;
            const newModel = {
              id: tempId,
              modelId: parsed.modelId || null,
              url: fullUrl,
              file: null,
              type: parsed.type || (['step', 'stp', 'iges', 'igs', 'obj', 'fbx', 'stl', 'low', 'lwo', '3ds'].includes((fullUrl || '').split('?')[0].split('.').pop().toLowerCase()) ? (fullUrl || '').split('?')[0].split('.').pop().toLowerCase() : 'glb'),
              name: parsed.name.replace(/\.[^/.]+$/, "")
            };
            setModels([newModel]);
            setModelUrl(fullUrl);
            setModelType(newModel.type);
            setModelName(newModel.name);
            setSelectedMaterial({ name: newModel.name, parentGroup: newModel.name });
            setIsSidebarCollapsed(false);
            setModelStats({ fileSize: "0 MB" });
            resetHistory({
              ...stateRef.current,
              models: [newModel],
              modelName: newModel.name,
              selectedMaterial: { name: newModel.name, parentGroup: newModel.name }
            });
            localStorage.removeItem('tempThreedEditModel');
            return; // End here for temp model load
          } catch(e) {
            console.error("Failed to parse tempThreedEditModel", e);
            setManualLoading(false);
            setLoadingProgress(0);
            setLoadingText("");
            localStorage.removeItem('tempThreedEditModel');
          }
        }

        // 3. If NO ID in URL, we ALWAYS ensure an empty base as requested by the user.
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
                alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 4, rotation: 0,
                specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
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
              if (nextMaterialSettings.appliedTexture) {
                  nextMaterialSettings.appliedTexture = {
                      ...nextMaterialSettings.appliedTexture,
                      maps: { ...(nextMaterialSettings.appliedTexture.maps || {}), ...nextMaps }
                  };
              }
              setMaterialSettings(nextMaterialSettings);
          }
      }



      // 1. Export Textured GLB and PNG for Gallery Thumbnail
      let hasExported = false;
      const gl = glInstanceRef.current;
      const camera = cameraInstanceRef.current;
      const modelGroup = sceneWrapperRef.current;
      
      if (gl && camera && modelGroup && nextModels.length > 0) {
          try {
              // ─── CLEAN & SAFE GLB EXPORT ──────────────────────────────────
              const exportScene = SkeletonUtils.clone(modelGroup);

              // 1. Strip helper tools, gizmos, cameras, lights, and corrupted meshes
              const toRemove = [];
              exportScene.traverse((obj) => {
                  if (
                      obj.isTransformControls ||
                      obj.isTransformControlsGizmo ||
                      obj.isTransformControlsPlane ||
                      obj.isCamera ||
                      obj.isLight ||
                      (obj.type && obj.type.toLowerCase().startsWith('transformcontrols')) ||
                      (obj.name && obj.name.toLowerCase().includes('transformcontrols')) ||
                      (obj.name && obj.name.toLowerCase().includes('gizmo'))
                  ) {
                      toRemove.push(obj);
                      return;
                  }

                  // Strip empty/corrupt meshes with no position attribute
                  if (obj.isMesh || obj.isLine || obj.isPoints) {
                      if (!obj.geometry || !obj.geometry.attributes || !obj.geometry.attributes.position || !obj.geometry.attributes.position.array || obj.geometry.attributes.position.count === 0) {
                          toRemove.push(obj);
                          return;
                      }
                  }

                  // Sanitize SkinnedMeshes to prevent skeleton.bones undefined crash
                  if (obj.isSkinnedMesh) {
                      if (!obj.skeleton || !Array.isArray(obj.skeleton.bones) || obj.skeleton.bones.length === 0) {
                          obj.isSkinnedMesh = false;
                          delete obj.skeleton;
                          delete obj.bindMatrix;
                          delete obj.bindMatrixInverse;
                      } else {
                          obj.skeleton.bones = obj.skeleton.bones.filter(Boolean);
                          try { obj.skeleton.calculateInverses?.(); } catch (_) {}
                      }
                  }

                  // Sanitize materials for export
                  if (obj.isMesh && obj.material) {
                      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                      mats.forEach((mat) => {
                          if (!mat) return;
                          const isTrans = (mat.opacity < 0.99) || !!mat.alphaMap;
                          mat.transparent = isTrans;
                          mat.depthWrite = !isTrans;
                          mat.alphaTest = 0;
                      });
                  }
              });

              toRemove.forEach((obj) => { if (obj.parent) obj.parent.remove(obj); });

              try { exportScene.updateMatrixWorld(true); } catch (_) {}

              // 2. Collect and validate AnimationClips
              const exportAnimations = [];
              const seenNames = new Set();
              const collectClip = (c) => {
                  if (!c || !Array.isArray(c.tracks) || c.tracks.length === 0) return;
                  const key = c.name || c.uuid;
                  if (seenNames.has(key)) return;
                  
                  // Validate tracks have valid times and values
                  const validTracks = c.tracks.filter(t => t && t.name && t.times && t.values && t.times.length > 0 && t.values.length > 0);
                  if (validTracks.length === 0) return;

                  seenNames.add(key);
                  const cleanClip = c.clone();
                  cleanClip.tracks = validTracks;
                  exportAnimations.push(cleanClip);
              };

              if (exportScene.animations) exportScene.animations.forEach(collectClip);
              exportScene.traverse(n => { if (n.animations) n.animations.forEach(collectClip); });

              modelRefs.current.forEach((liveScene) => {
                  if (!liveScene) return;
                  if (liveScene.animations) liveScene.animations.forEach(collectClip);
                  if (typeof liveScene.traverse === 'function') {
                      liveScene.traverse(n => { if (n.animations) n.animations.forEach(collectClip); });
                  }
              });

              // 3. Export combined GLB containing all models
              const exporter = new GLTFExporter();
              const exportOptions = {
                binary: true, 
                forceIndices: true, 
                embedImages: true,
                animations: (exportAnimations && exportAnimations.length > 0) ? exportAnimations : []
              };

              const glbBuffer = await new Promise((resolve, reject) => {
                  exporter.parse(
                      exportScene, 
                      (result) => resolve(result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result)).buffer), 
                      (err) => reject(err), 
                      exportOptions
                  );
              });
              
              // If a physical fileName exists (e.g. Interaction Mode), preserve it exactly.
              const originalFileName = nextModels[0]?.fileName;
              const defaultBaseName = (modelName || nextModels[0]?.name || "Scene").replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');
              
              const exportFileName = originalFileName || `${defaultBaseName}.glb`;
              
              // C. Upload GLB using chunked upload to prevent 413 Content Too Large errors over proxies
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
                  formData.append('uploadId', glbUploadId);
                  formData.append('chunkIndex', chunkIndex);
                  formData.append('totalChunks', totalGlbChunks);
                  formData.append('fileName', exportFileName);
                  formData.append('emailId', user.emailId);
                  if (nextModels[0]?.modelId) {
                      formData.append('modelId', nextModels[0].modelId);
                  }
                  formData.append('chunk', chunk);

                  const res = await axios.post(`${backendUrl}/api/3d-models/upload-chunk`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  glbRes = res;
              }
              
              if (glbRes && glbRes.data && glbRes.data.url) {
                  const rawUrl = glbRes.data.url;
                  const baseUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
                      ? rawUrl
                      : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

                  const timestamp = Date.now();
                  const targetGlbUrl = baseUrl.includes('?') 
                      ? `${baseUrl}&t=${timestamp}` 
                      : `${baseUrl}?t=${timestamp}`;

                  // Clear loader cache so the fresh merged model is loaded
                  try {
                      useGLTF.clear(baseUrl);
                      useGLTF.clear(targetGlbUrl);
                  } catch (e) {}

                  // Keep UI name clean, but update underlying record info
                  const mergedModelId = `model_${timestamp}`;
                  const mergedModel = {
                      ...nextModels[0],
                      id: mergedModelId,
                      url: targetGlbUrl,
                      name: nextModels[0]?.displayName || (originalFileName ? originalFileName : `${defaultBaseName}.glb`),
                      displayName: nextModels[0]?.displayName || (originalFileName ? originalFileName : defaultBaseName),
                      fileName: originalFileName,
                      type: 'glb',
                      file: null,
                      modelId: glbRes.data.modelId // Update with newly returned ID
                  };
                  hasExported = true;
                  if (!originalFileName) {
                      setModelName(defaultBaseName); // Keep extension-less for toolbar if it's a new standalone model
                  }
                  setModelUrl(targetGlbUrl);

                  // Merge all models into the single unified model
                  nextModels.splice(0, nextModels.length, mergedModel);

                  // Clear multi-model lists so the unified model takes over
                  setModelMaterialLists({});
                  setModelMaterialDataMap({});
                  setModelStatsMap({});
                  setSelectedMaterial({ name: defaultBaseName, parentGroup: defaultBaseName });

                  // Broadcast save to InteractionPanel to bust browser cache
                  try {
                    const bc = new BroadcastChannel('threed_model_updates');
                    bc.postMessage({
                      type: 'model-saved',
                      modelId: glbRes.data.modelId,
                      timestamp: Date.now()
                    });
                    bc.close();
                  } catch (bcErr) {
                    console.warn('BroadcastChannel not supported:', bcErr);
                  }
              }
          } catch (e) {
              console.error("Gallery sync failed:", e);
          }
      }

      if (hasExported) {
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

  const convertCadToGlbBlob = async (file, ext = 'step') => {
    const isIges = ext === 'iges' || ext === 'igs' || file.name.toLowerCase().endsWith('.iges') || file.name.toLowerCase().endsWith('.igs');
    const fileSizeMB = file.size ? (file.size / (1024 * 1024)) : 0;
    
    setLoadingText(`Reading ${isIges ? 'IGES' : 'STEP'} CAD file (${fileSizeMB > 0 ? fileSizeMB.toFixed(1) + ' MB' : ''})...`);
    await new Promise(r => setTimeout(r, 60));

    const buffer = await file.arrayBuffer();
    
    setLoadingText("Initializing OpenCASCADE WASM...");
    await new Promise(r => setTimeout(r, 60));

    const occt = await initOCCT({
      locateFile: () => '/occt-import-js.wasm'
    });

    // Adaptive deflection for fast tessellation without freezing:
    // 0.001 (the default) causes hundreds of thousands of micro-facets on large CAD models, taking minutes.
    // 0.02 - 0.025 gives crisp surface quality and triangulates in just a few seconds!
    const deflection = fileSizeMB > 10 ? 0.025 : (fileSizeMB > 3 ? 0.018 : 0.01);
    const params = {
      linearUnit: 'millimeter',
      linearDeflectionType: 'bounding_box_ratio',
      linearDeflection: deflection,
      angularDeflection: 0.65
    };

    setLoadingText(`Tessellating ${isIges ? 'IGES' : 'STEP'} geometry with OpenCASCADE...`);
    await new Promise(r => setTimeout(r, 60));

    const fileData = new Uint8Array(buffer);
    let result = null;
    try {
      result = isIges
        ? occt.ReadIgesFile(fileData, params)
        : occt.ReadStepFile(fileData, params);
    } catch (readErr) {
      console.warn("Fast CAD conversion failed:", readErr);
    }

    if (!result || !result.meshes || result.meshes.length === 0) {
      console.warn("Retrying CAD read with default parameters...");
      try {
        result = isIges
          ? occt.ReadIgesFile(fileData, null)
          : occt.ReadStepFile(fileData, null);
      } catch (fallbackErr) {
        console.error("CAD fallback read failed:", fallbackErr);
      }
    }

    if (!result || !result.meshes || result.meshes.length === 0) {
      throw new Error(`No meshes found in ${isIges ? 'IGES' : 'STEP'} file.`);
    }

    setLoadingText(`Processing ${result.meshes.length} geometry components...`);
    await new Promise(r => setTimeout(r, 60));

    const group = new THREE.Group();
    let matIndex = 1;
    // Shared material cache by color to prevent creating thousands of redundant materials
    const materialCache = new Map();

    for (const meshData of result.meshes) {
      const geometry = new THREE.BufferGeometry();
      if (meshData.attributes.position) {
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
      }
      if (meshData.attributes.normal) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
      }
      if (meshData.attributes.uv) {
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(meshData.attributes.uv.array, 2));
      }
      if (meshData.index) {
        const is32Bit = meshData.attributes.position && (meshData.attributes.position.array.length / 3) > 65535;
        geometry.setIndex(is32Bit 
          ? new THREE.Uint32BufferAttribute(meshData.index.array, 1)
          : new THREE.Uint16BufferAttribute(meshData.index.array, 1));
      }
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      if (!meshData.attributes.normal) {
        geometry.computeVertexNormals();
      }

      let colorKey = 'default';
      if (meshData.color) {
        const c = meshData.color;
        colorKey = `${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)}`;
      }

      let material = materialCache.get(colorKey);
      if (!material) {
        let color = '#a0a0a0';
        if (meshData.color) {
          const c = meshData.color;
          color = new THREE.Color(c[0], c[1], c[2]);
        }
        material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5,
          metalness: 0.1,
          side: THREE.DoubleSide,
          name: meshData.name ? `${meshData.name}_Mat` : `Material_${String(matIndex++).padStart(2, '0')}`
        });
        materialCache.set(colorKey, material);
      }

      const mesh = new THREE.Mesh(geometry, material);
      if (meshData.name) mesh.name = meshData.name;
      group.add(mesh);
    }
    group.updateMatrixWorld(true);

    setLoadingText("Compiling 3D model...");
    await new Promise(r => setTimeout(r, 60));

    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        group,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, forceIndices: true, embedImages: false, animations: [] }
      );
    });

    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convertStepToGlbBlob = (file) => convertCadToGlbBlob(file, 'step');

  const convertObjToGlbBlob = async (file) => {
    setLoadingText("Parsing OBJ model in browser...");
    const text = await file.text();
    const loader = new OBJLoader();
    const obj = loader.parse(text);
    
    setLoadingText("Generating GLB from OBJ model...");
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        obj,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, embedImages: true, animations: [] }
      );
    });
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const checkFbxLegacyVersion = async (file) => {
    if (!file || !file.name || !file.name.toLowerCase().endsWith('.fbx')) return null;
    try {
      const slice = file.slice(0, 64);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const text = new TextDecoder().decode(bytes.subarray(0, 18));
      if (text.startsWith('Kaydara FBX Binary')) {
        const view = new DataView(buffer);
        const version = view.getUint32(23, true); // little-endian
        if (version < 7100) {
          return version;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const convertFbxToGlbBlob = async (file) => {
    setLoadingText("Parsing FBX model in browser...");
    setLoadingProgress(30);
    const buffer = await file.arrayBuffer();

    // Isolated loading manager so texture fetches do not pollute Drei useProgress
    const isolatedManager = new THREE.LoadingManager();
    isolatedManager.onError = (url) => {
      console.warn("[FBX in-browser converter] Sub-resource notice:", url);
    };

    const loader = new FBXLoader(isolatedManager);
    let fbx;
    try {
      fbx = loader.parse(buffer, '');
    } catch (parseErr) {
      console.error("[FBXLoader] Browser parse error:", parseErr);
      throw new Error(`Browser FBX parsing failed: ${parseErr.message}. If this FBX was saved in an older format (FBX 6.x or ASCII), please export as modern binary FBX (2014-2020) or GLB.`);
    }

    setLoadingText("Optimizing FBX geometry and materials...");
    setLoadingProgress(60);

    // Helper to safely validate texture images before GLTFExporter processes them
    const isValidTexture = (tex) => {
      if (!tex) return false;
      const img = tex.image;
      if (!img) return false;
      if (img instanceof HTMLImageElement) {
        return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
      }
      if ((img.width && img.width > 0) || (img.videoWidth && img.videoWidth > 0)) {
        return true;
      }
      if (img.data && img.data.length > 0 && img.width > 0) {
        return true;
      }
      return false;
    };

    const textureMapKeys = [
      'map', 'normalMap', 'roughnessMap', 'metalnessMap',
      'bumpMap', 'aoMap', 'emissiveMap', 'specularMap',
      'alphaMap', 'displacementMap', 'lightMap', 'envMap'
    ];

    // Sanitize materials, textures, and normals so GLTFExporter doesn't crash on invalid images or missing attributes
    fbx.traverse((child) => {
      if (child.isMesh) {
        // Ensure vertex normals exist
        if (child.geometry && !child.geometry.attributes.normal) {
          try { child.geometry.computeVertexNormals(); } catch (e) {}
        }

        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          const sanitizedMats = mats.map((m) => {
            if (!m) return new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.1 });

            // Remove any textures that failed to load or have zero dimensions (prevents canvas drawImage crashes)
            textureMapKeys.forEach((key) => {
              if (m[key] && !isValidTexture(m[key])) {
                m[key] = null;
              }
            });

            // If material is legacy Phong or Lambert, convert to MeshStandardMaterial with DoubleSide
            if (!m.isMeshStandardMaterial && !m.isMeshPhysicalMaterial) {
              return new THREE.MeshStandardMaterial({
                name: m.name || 'FBX_Material',
                color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
                map: isValidTexture(m.map) ? m.map : null,
                normalMap: isValidTexture(m.normalMap) ? m.normalMap : null,
                roughness: m.shininess ? Math.max(0.1, Math.min(1.0, 1.0 - (m.shininess / 100))) : 0.6,
                metalness: 0.1,
                transparent: m.transparent || (m.opacity < 1),
                opacity: typeof m.opacity === 'number' ? m.opacity : 1,
                side: THREE.DoubleSide
              });
            } else {
              m.side = THREE.DoubleSide;
              return m;
            }
          });

          child.material = Array.isArray(child.material) ? sanitizedMats : sanitizedMats[0];
        }
      }
    });

    setLoadingText("Generating GLB from FBX model...");
    setLoadingProgress(75);

    const fbxAnimations = (fbx.animations || []).filter(a => a && Array.isArray(a.tracks) && a.tracks.length > 0);
    const exporter = new GLTFExporter();

    const runGltfExport = (options) => {
      return new Promise((resolve, reject) => {
        exporter.parse(
          fbx,
          (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
          reject,
          { animations: [], ...(options || {}) }
        );
      });
    };

    let glbBuffer;
    try {
      // Tier 1: Export with animations & textures
      glbBuffer = await runGltfExport({
        binary: true,
        embedImages: true,
        animations: fbxAnimations.length > 0 ? fbxAnimations : []
      });
    } catch (animErr) {
      console.warn("[FBX Exporter] Tier 1 export notice, trying without animations:", animErr.message);
      try {
        // Tier 2: Retry without animations in case animation tracks had invalid bone references
        glbBuffer = await runGltfExport({
          binary: true,
          embedImages: true,
          animations: []
        });
      } catch (texErr) {
        console.warn("[FBX Exporter] Tier 2 export notice, trying without external texture embedding:", texErr.message);
        // Tier 3: Retry without embedding images in case texture formats were incompatible
        glbBuffer = await runGltfExport({
          binary: true,
          embedImages: false,
          animations: []
        });
      }
    }

    setLoadingText("FBX converted to GLB successfully!");
    setLoadingProgress(90);
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convertStlToGlbBlob = async (file) => {
    setLoadingText("Parsing STL model in browser...");
    const buffer = await file.arrayBuffer();
    const loader = new STLLoader();
    const geom = loader.parse(buffer);
    const mat = new THREE.MeshStandardMaterial({ color: '#a0a0a0', roughness: 0.5, metalness: 0.1, name: 'STL_Material' });
    const mesh = new THREE.Mesh(geom, mat);
    
    setLoadingText("Generating GLB from STL model...");
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        mesh,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, animations: [] }
      );
    });
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convertLwoToGlbBlob = async (file) => {
    setLoadingText("Parsing LWO model in browser...");
    const buffer = await file.arrayBuffer();
    const loader = new LWOLoader();
    const lwoData = loader.parse(buffer, '', file.name.split('.')[0]);
    const group = new THREE.Group();
    if (lwoData?.meshes && Array.isArray(lwoData.meshes)) {
      lwoData.meshes.forEach(m => group.add(m));
    }
    group.updateMatrixWorld(true);

    setLoadingText("Generating GLB from LWO model...");
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        group,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, animations: [] }
      );
    });
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convert3dsToGlbBlob = async (file) => {
    setLoadingText("Parsing 3DS model in browser...");
    const buffer = await file.arrayBuffer();
    const loader = new TDSLoader();
    const group = loader.parse(buffer, '');
    group.updateMatrixWorld(true);

    setLoadingText("Generating GLB from 3DS model...");
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        group,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, animations: [] }
      );
    });
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convertModelViaBackend = async (file, ext, baseName) => {
    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const backendUrl = rawBackendUrl.trim().replace(/\/+$/, '');
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : { emailId: 'guest_user' };
    const emailId = user.emailId || 'guest_user';

    const isCad = ['step', 'stp', 'iges', 'igs', 'stl'].includes(ext);
    const engineName = isCad ? "OpenCASCADE" : "Assimp";

    // Heavy files (> 15MB): Use chunked upload to prevent socket timeouts & proxy drops
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    if (file.size > 15 * 1024 * 1024) {
      const fileSize = file.size;
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
      const uploadId = Date.now().toString() + Math.random().toString(36).substring(7);
      let lastRes = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = file.slice(start, end);

        const percent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setLoadingText(`Uploading heavy ${ext.toUpperCase()} (${percent}% - chunk ${chunkIndex + 1}/${totalChunks})...`);
        setLoadingProgress(Math.min(75, Math.round(percent * 0.7)));

        const chunkFormData = new FormData();
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('chunkIndex', chunkIndex);
        chunkFormData.append('totalChunks', totalChunks);
        chunkFormData.append('fileName', file.name);
        chunkFormData.append('emailId', emailId);
        chunkFormData.append('isConverter', 'true');
        chunkFormData.append('chunk', chunk);

        try {
          lastRes = await axios.post(`${backendUrl}/api/3d-models/upload-chunk`, chunkFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 1200000, // 20 minutes extended timeout for heavy 3D conversions
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
        } catch (chunkErr) {
          const errMsg = chunkErr.response?.data?.message || chunkErr.message;
          const customErr = new Error(errMsg);
          customErr.response = chunkErr.response;
          throw customErr;
        }
      }

      setLoadingText(`Converting heavy ${ext.toUpperCase()} to GLB with ${engineName}...`);
      setLoadingProgress(80);

      if (lastRes && lastRes.data && lastRes.data.url) {
        const rawUrl = lastRes.data.url;
        const finalUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
          ? rawUrl
          : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

        return {
          file: null,
          url: finalUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
        };
      }
    }

    // Standard files (<= 15MB): Single upload with fast direct URL response
    setLoadingText(`Converting ${ext.toUpperCase()} model to GLB with ${engineName}...`);
    setLoadingProgress(25);
    const formData = new FormData();
    formData.append('model', file);
    formData.append('emailId', emailId);

    try {
      const response = await axios.post(`${backendUrl}/api/3d-models/convert-model`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 1200000, // 20 minutes extended timeout for heavy conversions
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setLoadingText(`Uploading ${ext.toUpperCase()} (${percent}%)...`);
            setLoadingProgress(Math.min(75, Math.max(15, Math.round(percent * 0.7))));
          }
        }
      });

      setLoadingText(`Loading converted ${ext.toUpperCase()} model into editor...`);
      setLoadingProgress(90);

      if (response.data && response.data.url) {
        const rawUrl = response.data.url;
        const finalUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
          ? rawUrl
          : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

        return {
          file: null,
          url: finalUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: response.data.sizeInMB || (file.size / (1024 * 1024)).toFixed(2)
        };
      }

      throw new Error("Conversion succeeded but no model URL was returned.");
    } catch (err) {
      let message = err.message;
      if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      throw new Error(message);
    }
  };

  const convertModelFileIfNeeded = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    // Direct browser rendering formats: only valid standalone glTF 2.0 binaries / jsons
    const directFormats = {
      'glb': 'glb',
      'gltf': 'glb'
    };

    if (directFormats[ext]) {
      return {
        file,
        url: URL.createObjectURL(file),
        type: directFormats[ext],
        name: baseName,
        sizeInMB
      };
    }

    setManualLoading(true);

    // 1. In-browser instant conversion using Three.js & OpenCASCADE WASM (STEP, STP, IGES, IGS)
    if (ext === 'step' || ext === 'stp' || ext === 'iges' || ext === 'igs') {
      try {
        const glbBlob = await convertCadToGlbBlob(file, ext);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        const glbUrl = URL.createObjectURL(glbBlob);
        return {
          file: glbFile,
          url: glbUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
        };
      } catch (err) {
        console.warn(`In-browser ${ext.toUpperCase()} conversion notice, using backend OpenCASCADE:`, err.message);
        return await convertModelViaBackend(file, ext, baseName);
      }
    }

    // 2. STL format (use OpenCASCADE / STLLoader)
    if (ext === 'stl') {
      try {
        const glbBlob = await convertStlToGlbBlob(file);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        const glbUrl = URL.createObjectURL(glbBlob);
        return {
          file: glbFile,
          url: glbUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
        };
      } catch (err) {
        console.warn("In-browser STL conversion notice, using backend OpenCASCADE:", err.message);
        return await convertModelViaBackend(file, ext, baseName);
      }
    }

    // 3. FBX format (Assimp converter with in-browser fallback)
    if (ext === 'fbx') {
      try {
        setLoadingText("Converting FBX model to GLB with Assimp...");
        setLoadingProgress(20);
        return await convertModelViaBackend(file, ext, baseName);
      } catch (backendErr) {
        console.warn("Backend Assimp FBX conversion notice, inspecting fallback:", backendErr.message);

        // If it is a known legacy FBX version (6100 / < 7100), browser FBXLoader will also fail
        if (backendErr.message.includes("6100") || backendErr.message.includes("legacy FBX") || backendErr.message.includes("FileVersion")) {
          throw backendErr;
        }

        try {
          const glbBlob = await convertFbxToGlbBlob(file);
          const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
          const glbUrl = URL.createObjectURL(glbBlob);
          return {
            file: glbFile,
            url: glbUrl,
            type: 'glb',
            name: baseName,
            sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
          };
        } catch (clientErr) {
          console.error("All FBX conversion attempts failed:", clientErr);
          const finalMsg = (backendErr.message && !backendErr.message.includes("status code"))
            ? backendErr.message
            : clientErr.message;
          throw new Error(finalMsg);
        }
      }
    }

    // 4. Other models (OBJ, 3DS, LWO, LOW): use Assimp backend with client fallbacks
    try {
      return await convertModelViaBackend(file, ext, baseName);
    } catch (backendErr) {
      if (ext === 'obj') {
        const glbBlob = await convertObjToGlbBlob(file);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
      }
      if (ext === '3ds') {
        const glbBlob = await convert3dsToGlbBlob(file);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
      }
      if (ext === 'lwo' || ext === 'low') {
        const glbBlob = await convertLwoToGlbBlob(file);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
      }
      throw backendErr;
    }
  };

  const handleAddModel = async (file) => {
      if (!file) return;

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
      const ext = file.name.split('.').pop().toLowerCase();
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      startModelLoading({
          id: modelId,
          name: file.name,
          size: `${sizeInMB} MB`,
          type: ext
      });

      try {
          const converted = await convertModelFileIfNeeded(file);

          const newModel = {
              id: modelId,
              url: converted.url,
              file: converted.file,
              type: converted.type || 'glb',
              name: converted.name
          };

          const nextModels = [...models, newModel];
          setModels(nextModels);

          let nextModelName = modelName;
          // If this is the first model, set global name
          if (models.length === 0) {
              nextModelName = newModel.name;
              setModelName(nextModelName);
              resetHistory({
                  ...stateRef.current,
                  models: nextModels,
                  modelName: nextModelName,
                  selectedMaterial: null
              });
          } else {
              pushHistory({
                  ...stateRef.current,
                  models: nextModels,
                  modelName: nextModelName,
                  selectedMaterial: null // Reset selection on new model to be safe
              });
          }

          setIsSidebarCollapsed(false);
          // Loader remains active while Three.js loads, calculates bounding box, and positions the model on base.
          // handleModelReady() is called once the model has physically rendered on the base!
      } catch (err) {
          console.error("Error adding/converting model:", err);
          if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
          setManualLoading(false);
          setLoadingProgress(0);
          setLoadingText("");
          setLoadingModelInfo(null);
          pendingModelIdRef.current = null;
          
          const errMsg = err.response?.data?.message || err.message || "Failed to add 3D model";
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
  };

  const handleSetModelStats = useCallback((modelId, stats) => {
      setModelStatsMap(prev => {
          if (JSON.stringify(prev[modelId]) === JSON.stringify(stats)) return prev;
          return { ...prev, [modelId]: stats };
      });
  }, []);

  const handleSetMaterialList = useCallback((modelId, list, dataMap) => {
      setModelMaterialLists(prev => {
          if (JSON.stringify(prev[modelId]) === JSON.stringify(list)) return prev;
          const next = { ...prev, [modelId]: list };
          updateHistory({
              ...stateRef.current,
              modelMaterialLists: next
          });
          return next;
      });

      if (dataMap) {
          setModelMaterialDataMap(prev => {
              if (JSON.stringify(prev[modelId]) === JSON.stringify(dataMap)) return prev;
              return { ...prev, [modelId]: dataMap };
          });
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
        const sanitizedExportAnimations = exportAnimations.map(clip => {
            const clonedClip = clip.clone();
            clonedClip.tracks = clonedClip.tracks.map(track => {
                const clonedTrack = track.clone();
                const parts = clonedTrack.name.split('.');
                const propertyName = parts.pop();
                const targetPath = parts.join('.');
                
                const targetNode = THREE.PropertyBinding.findNode(exportRoot, targetPath);
                if (!targetNode && targetPath.includes('/')) {
                    const baseNodeName = targetPath.split('/').pop();
                    const found = exportRoot.getObjectByName(baseNodeName);
                    if (found) {
                        clonedTrack.name = `${baseNodeName}.${propertyName}`;
                    }
                }
                return clonedTrack;
            });
            return clonedClip;
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
                } else {
                    obj.skeleton.bones = obj.skeleton.bones.filter(Boolean);
                    try { obj.skeleton.calculateInverses?.(); } catch (_) {}
                }
            }
        });
        controlsToRemove.forEach((obj) => {
            if (obj.parent) obj.parent.remove(obj);
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

        // Direct single GLB export - no ZIP wrapper
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
        toast.error("Export failed. Please try again.");
    } finally {
        restoreAll();
        
        // Memory Cleanup: Dispose of cloned materials and temporary downscaled canvas textures ONLY
        // CRITICAL: NEVER call obj.geometry.dispose() here because SkeletonUtils.clone shares
        // geometries with the live scene by reference. Disposing geometries crashes the WebGL renderer
        // with "THREE.WebGLRenderer: Context Lost"!
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
        } catch (_) {}

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
          if (Array.isArray(rawList) && rawList.length > 0) {
              result.push({
                  id: model.id,
                  group: model.name,
                  tree: rawList,
                  materials: rawList
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
          const isCurrentModelPresent = models.length > 0;
          const isPrevStateEmptyModels = prevState.models !== undefined && prevState.models.length === 0;

          if (isPrevStateEmptyModels && isCurrentModelPresent) {
              // Guard against wiping out active models and materials when undoing back to pre-upload initial state
          } else {
              if (prevState.models !== undefined) setModels(prevState.models);
              if (prevState.modelMaterialLists !== undefined) setModelMaterialLists(prevState.modelMaterialLists);
              if (prevState.modelName !== undefined && prevState.modelName !== "") setModelName(prevState.modelName);
          }

          if (prevState.transformValues !== undefined) setTransformValues(prevState.transformValues);
          if (prevState.materialSettings !== undefined) setMaterialSettings(prevState.materialSettings);
          if (prevState.hiddenMaterials !== undefined) setHiddenMaterials(new Set(prevState.hiddenMaterials));
          if (prevState.deletedMaterials !== undefined) setDeletedMaterials(new Set(prevState.deletedMaterials));
          if (prevState.selectedMaterial !== undefined) setSelectedMaterial(prevState.selectedMaterial);
          if (prevState.selectedTexture !== undefined) setSelectedTexture(prevState.selectedTexture);
          
          const tex = prevState.materialSettings?.appliedTexture || prevState.selectedTexture;
          setSelectedTextureId(tex?.id || null);

          setResetKey(prev => prev + 1);
      }
  }, [undo, models.length]);

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

          const tex = nextState.materialSettings?.appliedTexture || nextState.selectedTexture;
          setSelectedTextureId(tex?.id || null);

          setResetKey(prev => prev + 1);
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

      // Update local model list name immediately (for UI consistency)
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

      // ── INTERACTION MODE (opened from 3D Edit in InteractionPanel) ──
      // Only update the display label in DB. Physical file and URL are untouched.
      if (urlModelId) {
        try {
          await axios.post(`${backendUrl}/api/3d-models/rename-label`, {
            emailId: user.emailId,
            modelId: urlModelId,
            newName: newName.trim()
          });
        } catch (e) {
          console.error("DB label rename failed:", e);
        }

        // Persist updated session state (name only)
        await axios.post(`${backendUrl}/api/3d-models/save-session`, {
          emailId: user.emailId,
          state: nextState
        });
        pushHistory(nextState);
        return;
      }

      // ── STANDALONE GALLERY MODE ──
      // Rename the actual file on server and update DB with new path.
      const renameIndex = nextModels.findIndex(m => m.name === newName);
      if (renameIndex !== -1) {
        const target = nextModels[renameIndex];
        if (target.url && !target.url.startsWith('blob:')) {
          const oldFileName = target.url.split('/').pop();
          try {
            const renameRes = await axios.post(`${backendUrl}/api/3d-models/rename-model`, {
              emailId: user.emailId,
              oldName: oldFileName,
              newName: newName,
              modelId: target.modelId
            });
            if (renameRes.data && renameRes.data.url) {
              const updatedUrl = `${backendUrl}${renameRes.data.url}`;
              nextModels[renameIndex].url = updatedUrl;
              
              setModels([...nextModels]);
              if (renameIndex === 0) setModelUrl(updatedUrl);
              
              nextState.models = [...nextModels];

              // Broadcast rename to parent tab (InteractionPanel) via BroadcastChannel
              try {
                const bc = new BroadcastChannel('threed_model_updates');
                bc.postMessage({
                  type: 'model-renamed',
                  modelId: target.modelId,
                  oldName: oldFileName,
                  newName: renameRes.data.newName || newName,
                  newUrl: updatedUrl,
                  newRelativeUrl: renameRes.data.url
                });
                bc.close();
              } catch (bcErr) {
                console.warn('BroadcastChannel not supported:', bcErr);
              }
            }
          } catch (e) {
            console.error("Server-side file rename failed:", e);
          }
        }
      }

      // Persist updated session state
      await axios.post(`${backendUrl}/api/3d-models/save-session`, {
        emailId: user.emailId,
        state: nextState
      });
      pushHistory(nextState);

    } catch (error) {
      console.error("Failed to update backend rename:", error);
    }
  }, [models, modelName, pushHistory, setModelUrl, urlModelId]);


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
      if (val !== null && typeof val === 'object') {
          if (JSON.stringify(prev[key]) === JSON.stringify(val)) return prev;
      } else if (prev[key] === val) {
          return prev;
      }
      
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
        const next = { ...prev, maps: nextMaps, useFactorColor: true };
        
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

  const processFile = async (file) => {
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

        if (models.length > 0) {
            models.forEach(m => {
                if (m.url && m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
            });
        }

        const newModel = {
            id: modelId,
            url: converted.url,
            file: converted.file,
            type: converted.type || 'glb',
            name: converted.name
        };

        const nextModels = [newModel];
        setModels(nextModels);
        
        // Kept for backward compat
        setModelUrl(converted.url);
        setModelFile(converted.file);
        setModelType(converted.type || 'glb');
        const nextModelName = newModel.name;
        setModelName(nextModelName);
        
        setModelMaterialLists({});
        setModelStatsMap({});
        setSelectedMaterial({ name: nextModelName, parentGroup: nextModelName });
        setHiddenMaterials(new Set());
        setDeletedMaterials(new Set());
        
        const nextMaterialSettings = {
            alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
            specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
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
        // NOTE: Loader remains active while Three.js mounts and GenericModel base positioning calls handleModelReady!
    } catch (err) {
        console.error("Error processing/converting 3D model:", err);
        if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
        setManualLoading(false);
        setLoadingProgress(0);
        setLoadingText("");
        setLoadingModelInfo(null);
        pendingModelIdRef.current = null;
        
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
  };

  const handleSelectGalleryModel = async (model) => {
    if (!model) return;

    const modelId = Date.now().toString();
    startModelLoading({
        id: modelId,
        name: model.name,
        size: model.size || "Unknown",
        type: model.type || 'glb'
    });

    const fullUrl = (model.url && (model.url.startsWith('http://') || model.url.startsWith('https://')))
      ? model.url
      : `${backendUrl}${model.url.startsWith('/') ? '' : '/'}${model.url}`;

    // Clear existing models if we are 'replacing'
    if (models.length > 0) {
        models.forEach(m => {
            if (m.url && m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
        });
    }

    const newModel = {
        id: modelId,
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
        specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
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

  const handleDrop = async (e) => {
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
  };

  const handleClearModel = async () => {
    // Revoke URLs
    models.forEach(m => {
         if (m.url) URL.revokeObjectURL(m.url);
    });

    if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
    }
    setManualLoading(false);
    setLoadingProgress(0);
    setLoadingText("");
    setLoadingModelInfo(null);
    pendingModelIdRef.current = null;
    isCompletingRef.current = false;

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
            specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
            color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
            lightPosition: { x: 10, y: 10, z: 10 }
        }
    }));

    // Reset undo/redo history completely
    resetHistory({
        models: [],
        modelName: "",
        transformValues: defaultTransform,
        materialSettings: {
            alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
            specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
            color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
            lightPosition: { x: 10, y: 10, z: 10 }
        },
        hiddenMaterials: [],
        deletedMaterials: [],
        selectedMaterial: null,
        selectedTexture: null,
        modelMaterialLists: {}
    });

    lastSavedRef.current = {
      historyIndex: 0,
      hasLocalFiles: false
    };
    setHasUnsavedChanges(false);

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
    const defaultTransform = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    };
    setTransformValues(defaultTransform);

    // Trigger scene-wide reset for model parts
    setSceneResetTrigger(prev => prev + 1);

    pushHistory({
        ...stateRef.current,
        targetPosition: { x: 0, y: 0, z: 0 },
        transformValues: defaultTransform
    });
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
  
  const transformStartSnapshotRef = useRef(null);

  const handleTransformStart = useCallback(() => {
     // Snapshot the exact state before transform drag starts
     transformStartSnapshotRef.current = {
         ...stateRef.current,
         transformValues: {
             position: { ...(stateRef.current.transformValues?.position || { x: 0, y: 0, z: 0 }) },
             rotation: { ...(stateRef.current.transformValues?.rotation || { x: 0, y: 0, z: 0 }) },
             scale: { ...(stateRef.current.transformValues?.scale || { x: 1, y: 1, z: 1 }) }
         }
     };
  }, []);

  const handleTransformEnd = useCallback(() => {
     // If we have a start snapshot, push that first if it's the beginning of a drag
     if (transformStartSnapshotRef.current) {
         pushHistory(transformStartSnapshotRef.current);
         transformStartSnapshotRef.current = null;
     }
     
     // Push the finished transform state
     pushHistory({
         ...stateRef.current,
         transformValues: {
             position: { ...(stateRef.current.transformValues?.position || { x: 0, y: 0, z: 0 }) },
             rotation: { ...(stateRef.current.transformValues?.rotation || { x: 0, y: 0, z: 0 }) },
             scale: { ...(stateRef.current.transformValues?.scale || { x: 1, y: 1, z: 1 }) }
         }
     });
  }, [pushHistory]);

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
                       const fullUrl = resolveUploadsPath(url);
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
               next.scale = 4;
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

      // Optimization: If clicking the same material and not holding shift, ignore to prevent re-renders/stutter
      if (!isShift && selectedMaterial && !selectedMaterial.isGroup && selectedMaterial.name === target.name) {
          return;
      }

      // Multi-selection with toggle behavior
      setSelectedMaterial(prev => {
          const prevNames = getNames(prev);
          const nextNames = getNames(target);
          
          if (isShift && prev) {
              // If shift is held, toggle the clicked material in/out of the selection
              const allPresent = nextNames.every(name => prevNames.includes(name));
              
              let combined;
              if (allPresent) {
                  // REMOVE: If clicking a material that is already part of the selection, remove it
                  combined = prevNames.filter(name => !nextNames.includes(name));
              } else {
                  // ADD: Otherwise add it
                  combined = Array.from(new Set([...prevNames, ...nextNames]));
              }

              if (combined.length === 0) return null;
              if (combined.length === 1) {
                  return { name: combined[0], ts: Date.now() };
              }
              
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
          
          // If it's a single material selection, try to fetch default textures/properties from the model.
          // Skip lookup when target is a model-level selection (model name clicked in the list).
          const isModelLevelSelection = models.some(m => m.name === target.name);
          if (!isShift && target.name && !isModelLevelSelection && target.name !== "Scene") {
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
                      scale: defaultData.scale !== undefined ? defaultData.scale : next.scale,
                      maps: defaultData.maps || {}
                  };
              }
          }
          
          return next;
      });

   }, [modelName, models, modelMaterialDataMap, selectedMaterial]);

  // Reset the override flag when selection changes.
  // This prevents the settings from one material (or a freshly synced baseline)
  // from being pushed back to the model before the user has actually touched a slider.
  useEffect(() => {
    setMaterialSettings(prev => ({
        ...prev,
        useFactorColor: false
    }));
    if (!selectedMaterial) {
        setTransformMode(null);
    }
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

      setTransformValues(prev => {
          if (prev &&
              prev.position?.x === nextTransform.position.x &&
              prev.position?.y === nextTransform.position.y &&
              prev.position?.z === nextTransform.position.z &&
              prev.rotation?.x === nextTransform.rotation.x &&
              prev.rotation?.y === nextTransform.rotation.y &&
              prev.rotation?.z === nextTransform.rotation.z &&
              prev.scale?.x === nextTransform.scale.x &&
              prev.scale?.y === nextTransform.scale.y &&
              prev.scale?.z === nextTransform.scale.z) {
              return prev;
          }
          return nextTransform;
      });
  }, []);



  return (
    <div 
        className="flex h-[92vh] w-full bg-white overflow-hidden relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      {!showModelGalleryModal && (
        <GlobalLoader
          manualLoading={manualLoading || isSyncing}
          progress={loadingProgress}
          stage={loadingText}
          modelInfo={loadingModelInfo}
        />
      )}
      


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
            selectedMaterial={selectedMaterial}
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
              onSelectColor={(colorData) => {
                  if (typeof colorData === 'object') {
                      setMaterialSettings(prev => {
                          const next = {
                              ...prev,
                              color: colorData.color || colorData.hex || prev.color,
                              metallic: colorData.metallic !== undefined ? colorData.metallic : prev.metallic,
                              roughness: colorData.roughness !== undefined ? colorData.roughness : prev.roughness,
                              normal: colorData.normal !== undefined ? colorData.normal : prev.normal,
                              ao: colorData.ao !== undefined ? colorData.ao : prev.ao,
                              bump: colorData.bump !== undefined ? colorData.bump : prev.bump,
                              emissiveColor: colorData.emissiveColor || '#000000',
                              emissiveIntensity: colorData.emissiveIntensity !== undefined ? colorData.emissiveIntensity : 0,
                              useFactorColor: true
                          };
                          pushHistory({
                              ...stateRef.current,
                              materialSettings: next
                          });
                          return next;
                      });
                  } else {
                      handleMaterialUIUpdate('color', colorData);
                  }
              }}
              selectedColor={materialSettings?.color}
            />
          )}

          {models.length > 0 && (
            <div
              className={`absolute left-[1vw] z-20 p-[0.25vw] transition-all duration-500 ease-in-out overflow-hidden w-[17vw] pointer-events-none select-none
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
                        onTransformStart={handleTransformStart}
                        onTransformEnd={handleTransformEnd}
                        onTransformChange={handleTransformChange}
                        onModelReady={() => handleModelReady(model.id)}
                        onProgress={(pct, stage) => handleModelProgress(model.id, pct, stage)}
                    />
                  ))}
                </group>

                {transformMode && (selectedMaterial?.name === "Scene") && (
                    <TransformControls
                        object={sceneWrapperRef.current}
                        mode={transformMode}
                        size={0.8}
                        onMouseDown={handleTransformStart}
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

              <SmoothOrbitControls
                ref={controlsRef}
                autoRotate={autoRotate}
                dampingFactor={0.08}
                momentumFriction={0.95}
                rotateSpeed={1.0}
                onChange={handleControlsChange}
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
                   preset={materialSettings?.maps?.envMap ? null : (materialSettings?.environment || 'studio')}
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
              isLoading={manualLoading}
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
                           roughness: 0.5,
                           normal: 100,
                           bump: 50,
                           ao: 100,
                           scale: 100,
                           rotation: 0,
                           offset: { x: 0, y: 0 },
                           color: '#ffffff',
                           colorIntensity: 100,
                           emissiveColor: '#000000',
                           emissiveIntensity: 0,
                           maps: { map: null, normalMap: null, roughnessMap: null, metalnessMap: null, bumpMap: null, aoMap: null, alphaMap: null },
                           appliedTexture: null
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
              onClose={() => setFormatErrorModal({ isOpen: false, title: 'Invalid Model Format', message: '' })}
              type="error"
              title={formatErrorModal.title || "Invalid Model Format"}
              message={formatErrorModal.message}
              confirmText="Got it"
          />
    </div>
  );
}




