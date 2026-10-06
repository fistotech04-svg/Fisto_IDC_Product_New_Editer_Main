import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { useProgress } from "@react-three/drei";
import axios from "axios";

// ============================================================================
// 1. UI & MODAL COMPONENTS
// ============================================================================
import RightPanel from "./ThreedRightpanel";
import LeftSidebar from "./LeftSidebar";
import MaterialSelectorDrawer from "./Components/MaterialSelectorDrawer";
import CanvasFloatingToolbar from "./CanvasFloatingToolbar";
import BottomGalleryTray from "./BottomGalleryTray";
import CameraBottomTray from "./Components/CameraBottomTray";
import { GlobalLoader } from "./Components/GlobalLoader";
import Export3DModal from "./Components/Export3DModal";
import AddModelModal from "./Components/AddModelModal";
import ModelGalleryModal from "./Components/ModelGalleryModal";
import CameraModal from "./Components/CameraModal";
import AddMaterial from "./Components/AddMaterial";
import HotspotModal from "./Components/HotspotModal";
import SaveAsModal from "./Components/SaveAsModal";
import ThreedCanvasViewport from "./Components/ThreedCanvasViewport";
import AlertModal from "../AlertModal";

// ============================================================================
// 2. HOOKS & UTILITIES
// ============================================================================
import useModalHistory from "./hooks/useModalHistory";
import { resolveUploadsPath } from "../../utils/supabaseUtils";
import { getFromDB } from "../../utils/dbUtils";
import { useToast } from "../../components/CustomToast";
import { executeExport3D, captureCameraSnapshot } from "./utils/threedExportHandlers";
import { executeSave3D } from "./utils/threedSaveHandlers";
import { checkFbxLegacyVersion, convertModelFileIfNeeded } from "./utils/modelConversionUtils";
import { useThreedCameraControls } from "./hooks/useThreedCameraControls";
import { useThreedHotspots } from "./hooks/useThreedHotspots";
import { useThreedMaterialTree } from "./hooks/useThreedMaterialTree";
import { useThreedMaterialSettings } from "./hooks/useThreedMaterialSettings";
import { useThreedModelLoader } from "./hooks/useThreedModelLoader";
import { CAMERA_FRAME_OPTIONS } from "./panels/CameraTab/CameraPanel";

/**
 * ThreedEditor Component
 * Main container orchestration for 3D model editing, material customization,
 * camera views, 3D hotspots, transformations, and export/save pipelines.
 */
export default function ThreedEditor() {
  // ==========================================================================
  // SECTION 1: ROUTER & GLOBAL CONTEXT BINDINGS
  // ==========================================================================
  const { modelId: urlModelId } = useParams();
  const navigate = useNavigate();

  const {
    threedState,
    setThreedState,
    setExportHandler,
    setSaveHandler,
    setSaveAsHandler,
    setCanSave,
    setHasUnsavedChanges,
    setIsSaving,
    triggerSaveSuccess
  } = useOutletContext() || {};

  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsNameInput, setSaveAsNameInput] = useState("");

  const toast = useToast();
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');

  // ==========================================================================
  // SECTION 2: CORE EDITOR & MODEL STATE
  // ==========================================================================
  const [models, setModels] = useState(threedState.models || (threedState.modelUrl ? [{
    id: "default",
    url: threedState.modelUrl,
    file: threedState.modelFile,
    type: threedState.modelType,
    name: threedState.modelName || "Model"
  }] : []));

  const [modelUrl, setModelUrl] = useState(models.length > 0 ? models[0].url : null);
  const [modelFile, setModelFile] = useState(models.length > 0 ? models[0].file : null);
  const [modelType, setModelType] = useState(models.length > 0 ? models[0].type : "glb");
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.0);
  const [autoRotateAxis, setAutoRotateAxis] = useState("Y");
  const [autoRotateRange, setAutoRotateRange] = useState(360);
  const [showGridLines, setShowGridLines] = useState(true);
  const [showAxis, setShowAxis] = useState(true);
  const [xrayMode, setXrayMode] = useState(false);
  const [xrayMaterials, setXrayMaterials] = useState(() => new Set());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(models.length === 0);
  const [isTextureOpen, setIsTextureOpen] = useState(false);
  const [isMaterialDrawerOpen, setIsMaterialDrawerOpen] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState("model");
  const [cameraViewMode, setCameraViewMode] = useState("Perspective");
  const [isShades, setIsShades] = useState(true);
  const [navMode, setNavMode] = useState("orbit");
  const [manualLoading, setManualLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingModelInfo, setLoadingModelInfo] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true);
  const [modelHasAnimationsMap, setModelHasAnimationsMap] = useState({});

  const hasAnimations = useMemo(() => {
    return Object.values(modelHasAnimationsMap).some(Boolean);
  }, [modelHasAnimationsMap]);

  const handleHasAnimationsChange = useCallback((modelId, hasAnim) => {
    const boolVal = Boolean(hasAnim);
    setModelHasAnimationsMap(prev => {
      if (Boolean(prev[modelId]) === boolVal) return prev;
      return { ...prev, [modelId]: boolVal };
    });
  }, []);

  // ==========================================================================
  // SECTION 3: LOADING TIMERS & BRIDGE TICKERS
  // ==========================================================================
  const loadingProgressRef = useRef(0);
  const loadingTimerRef = useRef(null);
  const conversionTickerRef = useRef(null);
  const mountingSafetyTimerRef = useRef(null);
  const isCompletingRef = useRef(false);
  const pendingModelIdRef = useRef(null);
  const modelsRef = useRef(models);

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const { active, progress } = useProgress();

  const setSafeProgress = useCallback((val) => {
    if (isCompletingRef.current) return;
    const num = typeof val === 'function' ? val(loadingProgressRef.current) : Number(val);
    if (isNaN(num)) return;
    const clamped = Math.max(loadingProgressRef.current, Math.min(100, Math.round(num)));
    loadingProgressRef.current = clamped;
    setLoadingProgress(clamped);
  }, []);

  const clearAllLoadingTimers = useCallback(() => {
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    if (conversionTickerRef.current) {
      clearInterval(conversionTickerRef.current);
      conversionTickerRef.current = null;
    }
    if (mountingSafetyTimerRef.current) {
      clearTimeout(mountingSafetyTimerRef.current);
      mountingSafetyTimerRef.current = null;
    }
  }, []);

  const handleModelReady = useCallback((modelId, bounds) => {
    if (bounds) {
      latestModelBoundsRef.current = bounds;
    }
    if (typeof frameModelFullViewRef.current === 'function') {
      frameModelFullViewRef.current(bounds, false);
    }

    if (isCompletingRef.current) return;
    if (pendingModelIdRef.current && modelId && String(pendingModelIdRef.current) !== String(modelId) && (modelsRef.current?.length > 1)) {
      return;
    }

    isCompletingRef.current = true;
    clearAllLoadingTimers();

    loadingProgressRef.current = 100;
    setLoadingProgress(100);
    setLoadingText("Model ready on base!");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        commitHistoryNow(buildSnapshot());
      });
    });

    setTimeout(() => {
      setManualLoading(false);
      loadingProgressRef.current = 0;
      setLoadingProgress(0);
      setLoadingText("");
      setLoadingModelInfo(null);
      pendingModelIdRef.current = null;
      isCompletingRef.current = false;
    }, 380);
  }, [clearAllLoadingTimers]);

  const startConversionTicker = useCallback((ext, engineName = "OpenCASCADE") => {
    if (conversionTickerRef.current) clearInterval(conversionTickerRef.current);
    if (isCompletingRef.current) return;

    const upperExt = (ext || '3D').toUpperCase();
    let convCurrent = Math.max(45, loadingProgressRef.current);
    setSafeProgress(convCurrent);

    conversionTickerRef.current = setInterval(() => {
      if (isCompletingRef.current) return;
      const targetMax = 76;
      const remaining = targetMax - convCurrent;
      if (remaining > 0.4) {
        const step = Math.max(0.12, remaining * 0.04);
        convCurrent = Math.min(targetMax, convCurrent + step);
        setSafeProgress(Math.round(convCurrent));

        if (convCurrent < 54) {
          setLoadingText(`Converting ${upperExt} model with ${engineName}...`);
        } else if (convCurrent < 66) {
          setLoadingText("Tessellating 3D geometry & mesh surfaces...");
        } else {
          setLoadingText("Optimizing materials & compiling GLTF binary...");
        }
      }
    }, 220);
  }, [setSafeProgress]);

  const stopConversionTicker = useCallback(() => {
    if (conversionTickerRef.current) {
      clearInterval(conversionTickerRef.current);
      conversionTickerRef.current = null;
    }
  }, []);

  const startMountingBridgeTicker = useCallback((initialPct) => {
    if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    if (isCompletingRef.current) return;

    let cur = Math.max(loadingProgressRef.current, initialPct || 78);
    setSafeProgress(cur);

    loadingTimerRef.current = setInterval(() => {
      if (isCompletingRef.current) return;
      const targetMax = 95;
      const remaining = targetMax - cur;
      if (remaining > 0.3) {
        const step = Math.max(0.1, remaining * 0.06);
        cur = Math.min(targetMax, cur + step);
        setSafeProgress(Math.round(cur));

        if (cur < 88) {
          setLoadingText("Calculating bounds & normalizing scale...");
        } else {
          setLoadingText("Positioning model on base grid...");
        }
      }
    }, 180);

    if (mountingSafetyTimerRef.current) clearTimeout(mountingSafetyTimerRef.current);
    mountingSafetyTimerRef.current = setTimeout(() => {
      if (manualLoading && !isCompletingRef.current) {
        handleModelReady(pendingModelIdRef.current);
      }
    }, 7000);
  }, [handleModelReady, manualLoading, setSafeProgress]);

  const startModelLoading = useCallback((modelInfo) => {
    clearAllLoadingTimers();
    isCompletingRef.current = false;
    pendingModelIdRef.current = modelInfo?.id ? String(modelInfo.id) : null;

    setLoadingModelInfo(modelInfo || null);
    const ext = (modelInfo?.type || modelInfo?.name?.split('.').pop() || '').toLowerCase();
    const isCad = ['step', 'stp', 'iges', 'igs'].includes(ext);
    const isArchive = ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2'].some(e => (modelInfo?.name || '').toLowerCase().endsWith(e));
    const isDirectGlb = ext === 'glb' || ext === 'gltf';

    loadingProgressRef.current = 10;
    setLoadingProgress(10);
    setManualLoading(true);

    if (isArchive) {
      setLoadingText("Unpacking 3D model archive & textures...");
    } else if (isCad) {
      setLoadingText("Preparing CAD model & OpenCASCADE engine...");
    } else if (isDirectGlb) {
      setLoadingText("Reading 3D GLB model...");
      let cur = 10;
      loadingTimerRef.current = setInterval(() => {
        if (isCompletingRef.current) return;
        if (cur < 85) {
          cur += (85 - cur) * 0.12;
          setSafeProgress(Math.round(cur));
          if (cur < 45) setLoadingText("Reading 3D scene geometry...");
          else if (cur < 70) setLoadingText("Processing textures & materials...");
          else setLoadingText("Calculating bounds & normalizing scale...");
        }
      }, 160);
    } else {
      setLoadingText(`Reading ${ext.toUpperCase() || '3D'} model file...`);
    }
  }, [clearAllLoadingTimers, setSafeProgress]);

  const handleModelProgress = useCallback((modelId, progressPct, stageText) => {
    if (pendingModelIdRef.current && modelId && String(pendingModelIdRef.current) !== String(modelId) && (modelsRef.current?.length > 1)) return;
    if (isCompletingRef.current) return;

    if (stageText) setLoadingText(stageText);
    if (typeof progressPct === 'number' && !isNaN(progressPct)) {
      setSafeProgress(progressPct);
    }
  }, [setSafeProgress]);

  useEffect(() => {
    if (active && manualLoading && !isCompletingRef.current) {
      if (typeof progress === 'number' && progress > 0) {
        const mapped = Math.round(75 + (progress * 0.19));
        setSafeProgress(mapped);
      }
    }
  }, [active, progress, manualLoading, setSafeProgress]);

  useEffect(() => {
    if (!manualLoading) return;
    const t = setTimeout(() => {
      clearAllLoadingTimers();
      setManualLoading(false);
      loadingProgressRef.current = 0;
      setLoadingProgress(0);
      setLoadingText("");
      setLoadingModelInfo(null);
      pendingModelIdRef.current = null;
      isCompletingRef.current = false;
    }, 15 * 60 * 1000);
    return () => clearTimeout(t);
  }, [manualLoading, clearAllLoadingTimers]);

  // ==========================================================================
  // SECTION 4: STATS, REFS & SELECTION STATE
  // ==========================================================================
  const [modelStatsMap, setModelStatsMap] = useState({});
  const [modelStats, setModelStats] = useState(threedState.modelStats || { fileSize: "0 MB" });

  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const modelRefs = useRef(new Map());
  const glInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const sceneInstanceRef = useRef(null);
  const originalTransformRef = useRef(null);
  const meshTransformsRef = useRef({});
  const handleSelectMaterialRef = useRef(null);
  const [meshTransformsState, setMeshTransformsState] = useState({});
  const lastUpdateRef = useRef(0);

  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, z: 0 });
  const [cameraCoordinates, setCameraCoordinates] = useState({ x: 0, y: 0, z: 0 });
  const [cameraBgType, setCameraBgType] = useState("solid");
  const [cameraBgColor, setCameraBgColor] = useState("#FFFFFF");
  const [cameraBgOpacity, setCameraBgOpacity] = useState(100);
  const [selectedFrameId, setSelectedFrameId] = useState("frame_2_1_a");
  const [savedCameraAngles, setSavedCameraAngles] = useState([]);

  const handleChangeCameraPosition = useCallback((axis, val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setCameraCoordinates((prev) => ({ ...prev, [axis]: num }));
    if (cameraInstanceRef.current) {
      cameraInstanceRef.current.position[axis] = num;
      cameraInstanceRef.current.updateProjectionMatrix?.();
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    }
  }, []);

  useEffect(() => {
    if (activeLeftTab === "camera" && cameraInstanceRef.current) {
      const cam = cameraInstanceRef.current;
      setCameraCoordinates({
        x: parseFloat(cam.position.x.toFixed(2)),
        y: parseFloat(cam.position.y.toFixed(2)),
        z: parseFloat(cam.position.z.toFixed(2)),
      });
    }
  }, [activeLeftTab]);

  const getCameraBgStyle = useCallback(() => {
    if (activeLeftTab !== "camera") {
      return { backgroundColor: "#1e2025" };
    }
    if (cameraBgType === "transparent") {
      return {
        backgroundColor: "#ffffff",
        backgroundImage: "linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)",
        backgroundPosition: "0 0, 10px 10px",
        backgroundSize: "20px 20px"
      };
    }
    const hex = cameraBgColor || "#FFFFFF";
    const alpha = Math.max(0, Math.min(1, (cameraBgOpacity ?? 100) / 100));
    try {
      const c = new THREE.Color(hex);
      const r = Math.round(c.r * 255);
      const g = Math.round(c.g * 255);
      const b = Math.round(c.b * 255);

      if (alpha < 1) {
        return {
          backgroundColor: "#ffffff",
          backgroundImage: `linear-gradient(rgba(${r},${g},${b},${alpha}), rgba(${r},${g},${b},${alpha})), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)`,
          backgroundPosition: "0 0, 0 0, 10px 10px",
          backgroundSize: "auto, 20px 20px, 20px 20px"
        };
      }
    } catch {
      // fallback
    }

    return {
      backgroundColor: hex,
    };
  }, [activeLeftTab, cameraBgType, cameraBgColor, cameraBgOpacity]);

  const handleControlsChange = useCallback((e) => {
    const target = e?.target?.target;
    const cam = e?.target?.object || cameraInstanceRef.current;
    if (cam) {
      setCameraCoordinates({
        x: parseFloat(cam.position.x.toFixed(2)),
        y: parseFloat(cam.position.y.toFixed(2)),
        z: parseFloat(cam.position.z.toFixed(2))
      });
    }
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
  const modelMaterialListsRef = useRef({});
  const [modelMaterialDataMap, setModelMaterialDataMap] = useState({});
  const sceneWrapperRef = useRef(null);

  const [materialList, setMaterialList] = useState(threedState.materialList || []);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [showModelGalleryModal, setShowModelGalleryModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [materialRefreshKey, setMaterialRefreshKey] = useState(0);

  const [hotspots, setHotspots] = useState(threedState.hotspots || []);
  const [activeHotspotId, setActiveHotspotId] = useState(null);
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState(null);
  const [isPlacingHotspot, setIsPlacingHotspot] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState('edit');

  const [activeAccordion, setActiveAccordion] = useState("factor");

  // ==========================================================================
  // SECTION 5: TRANSFORM SANITIZATION & DEFAULTS
  // ==========================================================================
  const defaultTransform = useMemo(() => ({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }), []);

  const defaultMaterialSettings = useMemo(() => ({
    alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100,
    scale: 100, scaleY: 100, rotation: 0, specular: 50, reflection: 10,
    shadow: 50, softness: 50, ao: 100, environment: 'studio',
    worldOpacity: 0, worldBlur: 0, color: '#ffffff',
    useFactorColor: false, autoUnwrap: false, envRotation: 0,
    emissiveIntensity: 0, emissiveColor: '#ffffff',
    lightPosition: { x: 10, y: 10, z: 10 }
  }), []);

  const sanitizeTransformValues = useCallback((t) => {
    if (!t) return defaultTransform;
    const pos = t.position || { x: 0, y: 0, z: 0 };
    const rot = t.rotation || { x: 0, y: 0, z: 0 };
    let sc = t.scale || { x: 1, y: 1, z: 1 };

    let sx = typeof sc.x === 'number' ? sc.x : 1;
    let sy = typeof sc.y === 'number' ? sc.y : 1;
    let sz = typeof sc.z === 'number' ? sc.z : 1;

    if (Math.abs(sx) >= 50) sx = 1;
    if (Math.abs(sy) >= 50) sy = 1;
    if (Math.abs(sz) >= 50) sz = 1;

    return {
      position: { x: pos.x ?? 0, y: pos.y ?? 0, z: pos.z ?? 0 },
      rotation: { x: rot.x ?? 0, y: rot.y ?? 0, z: rot.z ?? 0 },
      scale: { x: sx, y: sy, z: sz }
    };
  }, [defaultTransform]);

  const [transformMode, setTransformMode] = useState('translate');
  const transformModeRef = useRef(transformMode);
  transformModeRef.current = transformMode;
  const [rootTransform, setRootTransform] = useState(() => sanitizeTransformValues(threedState.rootTransform || threedState.transformValues));
  const rootTransformRef = useRef(rootTransform);
  useEffect(() => {
    rootTransformRef.current = rootTransform;
  }, [rootTransform]);
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
      return { ...next };
    });
  }, [sanitizeTransformValues]);

  // ==========================================================================
  // SECTION 6: MATERIAL SETTINGS & HDR PREVIEWS
  // ==========================================================================
  const [modelName, setModelName] = useState(threedState.modelName);
  const [selectedTextureId, setSelectedTextureId] = useState(null);

  const [materialSettings, setMaterialSettings] = useState(threedState.materialSettings);
  const [customizedMaterials, setCustomizedMaterials] = useState(() => threedState.customizedMaterials || {});
  const customizedMaterialsRef = useRef(customizedMaterials);
  const [savedHdrs, setSavedHdrs] = useState([]);

  const getMaterialTargetKeys = useCallback((selMat) => {
    if (!selMat || selMat.isAll || selMat.name === 'All Meshes') {
      return ['__ALL__'];
    }
    const keys = [];
    if (selMat.isGroup || selMat.isMultiSelect) {
      if (Array.isArray(selMat.uuids)) keys.push(...selMat.uuids);
      if (Array.isArray(selMat.meshNames)) keys.push(...selMat.meshNames);
      if (Array.isArray(selMat.materials)) keys.push(...selMat.materials);
    } else {
      if (selMat.uuid) keys.push(selMat.uuid);
      if (selMat.meshUuid && selMat.meshUuid !== selMat.uuid) keys.push(selMat.meshUuid);
      if (selMat.meshName) keys.push(selMat.meshName);
      if (selMat.name) keys.push(selMat.name);
      if (!selMat.isMesh && selMat.material) keys.push(typeof selMat.material === 'string' ? selMat.material : selMat.material?.name);
    }
    return Array.from(new Set(keys.filter(Boolean)));
  }, []);

  useEffect(() => {
    const loadSavedHdrs = async () => {
      try {
        const list = await getFromDB('saved_hdrs');
        if (Array.isArray(list) && list.length > 0) {
          const restored = list.map(item => {
            if (item.file instanceof Blob) {
              const ext = (item.name || '').split('.').pop().toLowerCase();
              const isHDREXR = ext === 'hdr' || ext === 'exr';
              const url = URL.createObjectURL(item.file) + (isHDREXR ? `#.${ext}` : '');
              return { ...item, url };
            }
            return item;
          });
          setSavedHdrs(restored);

          const activeId = await getFromDB('active_hdr_id');
          if (activeId) {
            const matched = restored.find(h => h.id === activeId || h.id === `custom_${activeId}` || `custom_${h.id}` === activeId);
            if (matched && matched.url) {
              setMaterialSettings(prev => ({
                ...prev,
                environment: matched.id.startsWith('custom_') ? matched.id : `custom_${matched.id}`,
                customEnvMap: matched.url,
                maps: { ...(prev.maps || {}), envMap: matched.url }
              }));
            }
          }
        }
      } catch (e) {
        console.warn("[ThreedEditor] Error loading saved HDRs:", e);
      }
    };
    loadSavedHdrs();
  }, []);

  const [resetKey, setResetKey] = useState(0);

  const getInitialSet = (val) => {
    if (!val) return new Set();
    try {
      if (val instanceof Set) return new Set(val);
      if (Array.isArray(val)) return new Set(val);
      if (val && typeof val[Symbol.iterator] === 'function') return new Set(val);
    } catch (e) { }
    return new Set();
  };

  const [hiddenMaterials, setHiddenMaterials] = useState(getInitialSet(threedState.hiddenMaterials));
  const [deletedMaterials, setDeletedMaterials] = useState(getInitialSet(threedState.deletedMaterials));

  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [formatErrorModal, setFormatErrorModal] = useState({ isOpen: false, title: 'Invalid Model Format', message: '' });

  // ==========================================================================
  // SECTION 7: UNDO / REDO HISTORY MANAGEMENT
  // ==========================================================================
  const {
    state: historyState,
    past,
    set: pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    update: updateHistory,
    historyRef,
    indexRef
  } = useModalHistory({
    models: models,
    transformValues: transformValues,
    materialSettings: materialSettings,
    customizedMaterials: customizedMaterials,
    modelName: modelName,
    hiddenMaterials: Array.from(hiddenMaterials),
    deletedMaterials: Array.from(deletedMaterials),
    modelMaterialLists: modelMaterialLists,
    selectedMaterial: selectedMaterial,
    selectedTexture: selectedTexture,
    selectedTextureId: selectedTextureId,
    meshTransforms: meshTransformsRef.current || {},
    hotspots: hotspots
  });

  const stateRef = useRef({
    models,
    transformValues,
    materialSettings,
    customizedMaterials,
    modelName,
    hiddenMaterials,
    deletedMaterials,
    modelMaterialLists,
    selectedMaterial,
    selectedTexture,
    selectedTextureId,
    meshTransforms: meshTransformsRef.current,
    hotspots: hotspots
  });

  useEffect(() => {
    if (isRestoringHistoryRef.current) return;
    stateRef.current = {
      models,
      modelName,
      rootTransform,
      transformValues,
      materialSettings,
      customizedMaterials: customizedMaterialsRef.current,
      hiddenMaterials,
      xrayMaterials,
      deletedMaterials,
      modelMaterialLists: (modelMaterialLists && Object.keys(modelMaterialLists).length > 0)
        ? modelMaterialLists
        : modelMaterialListsRef.current,
      selectedMaterial,
      selectedTexture,
      selectedTextureId,
      meshTransforms: meshTransformsRef.current,
      hotspots,
    };
  }, [models, modelName, rootTransform, transformValues, materialSettings,
    hiddenMaterials, xrayMaterials, deletedMaterials, modelMaterialLists,
    selectedMaterial, selectedTexture, selectedTextureId, hotspots]);

  const buildSnapshot = useCallback((override = {}) => {
    const cur = stateRef.current || {};
    const curMS = override.materialSettings || cur.materialSettings || {};
    const curCM = override.customizedMaterials !== undefined ? override.customizedMaterials : (cur.customizedMaterials || customizedMaterialsRef.current || {});
    const curTV = override.transformValues || cur.transformValues || {};
    const curHM = override.hiddenMaterials !== undefined ? override.hiddenMaterials : (cur.hiddenMaterials || []);
    const curXM = override.xrayMaterials !== undefined ? override.xrayMaterials : (cur.xrayMaterials || []);
    const curDM = override.deletedMaterials !== undefined ? override.deletedMaterials : (cur.deletedMaterials || []);
    const curModels = override.models || cur.models || [];
    const curModelName = override.modelName !== undefined ? override.modelName : (cur.modelName ?? "");
    const curSelMat = override.selectedMaterial !== undefined ? override.selectedMaterial : cur.selectedMaterial;
    const curSelTex = override.selectedTexture !== undefined ? override.selectedTexture : cur.selectedTexture;
    const curSelTexId = override.selectedTextureId !== undefined ? override.selectedTextureId : (curSelTex?.id || cur.selectedTextureId || null);
    const curMatLists = (override.modelMaterialLists && Object.keys(override.modelMaterialLists).length > 0)
      ? override.modelMaterialLists
      : (cur.modelMaterialLists && Object.keys(cur.modelMaterialLists).length > 0
        ? cur.modelMaterialLists
        : (modelMaterialListsRef.current && Object.keys(modelMaterialListsRef.current).length > 0 ? modelMaterialListsRef.current : {}));
    const curMeshTransforms = override.meshTransforms !== undefined ? override.meshTransforms : (cur.meshTransforms || meshTransformsRef.current || {});
    const curHotspots = override.hotspots !== undefined ? override.hotspots : (cur.hotspots || hotspots || []);
    const curRootTransform = override.rootTransform || cur.rootTransform || rootTransformRef.current || defaultTransform;

    return {
      models: Array.isArray(curModels) ? curModels.map(m => ({ ...m })) : [],
      modelName: curModelName,
      rootTransform: {
        position: { ...(curRootTransform?.position || { x: 0, y: 0, z: 0 }) },
        rotation: { ...(curRootTransform?.rotation || { x: 0, y: 0, z: 0 }) },
        scale: { ...(curRootTransform?.scale || { x: 1, y: 1, z: 1 }) }
      },
      transformValues: {
        position: { ...(curTV?.position || { x: 0, y: 0, z: 0 }) },
        rotation: { ...(curTV?.rotation || { x: 0, y: 0, z: 0 }) },
        scale: { ...(curTV?.scale || { x: 1, y: 1, z: 1 }) }
      },
      materialSettings: {
        ...curMS,
        useFactorColor: false,
        lastChangedProp: null,
        lightPosition: { ...(curMS?.lightPosition || { x: 10, y: 10, z: 10 }) },
        offset: { ...(curMS?.offset || { x: 0, y: 0 }) },
        maps: { ...(curMS?.maps || {}) }
      },
      customizedMaterials: JSON.parse(JSON.stringify(curCM || {})),
      hiddenMaterials: Array.from(curHM instanceof Set ? curHM : (curHM || [])),
      xrayMaterials: Array.from(curXM instanceof Set ? curXM : (curXM || [])),
      deletedMaterials: Array.from(curDM instanceof Set ? curDM : (curDM || [])),
      modelMaterialLists: { ...curMatLists },
      selectedMaterial: curSelMat ? { ...curSelMat } : null,
      selectedTexture: curSelTex ? { ...curSelTex } : null,
      selectedTextureId: curSelTexId,
      meshTransforms: JSON.parse(JSON.stringify(curMeshTransforms || {})),
      hotspots: Array.isArray(curHotspots) ? curHotspots.map(h => ({ ...h })) : []
    };
  }, [defaultTransform, hotspots]);

  const historyDebounceTimerRef = useRef(null);
  const isRestoringHistoryRef = useRef(false);

  const commitHistoryNow = useCallback((snapshot) => {
    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = null;
    }
    const finalState = snapshot || buildSnapshot();
    pushHistory(finalState);
  }, [pushHistory, buildSnapshot]);

  const commitHistoryDebounced = useCallback((snapshot, delay = 400) => {
    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
    }
    historyDebounceTimerRef.current = setTimeout(() => {
      const finalState = snapshot || buildSnapshot();
      pushHistory(finalState);
      historyDebounceTimerRef.current = null;
    }, delay);
  }, [pushHistory, buildSnapshot]);

  useEffect(() => {
    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false;
    }
  }, [resetKey]);

  const applyHistoryState = useCallback((targetState) => {
    if (!targetState) return;

    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = null;
    }

    if (targetState.models !== undefined) {
      const isTargetEmpty = targetState.models.length === 0;

      if (isTargetEmpty) {
        setModels([]);
        setModelUrl(null);
        setModelFile(null);
        setModelName("");
        setSelectedMaterial(null);
        setSelectedTexture(null);
        setSelectedTextureId(null);
        setHiddenMaterials(new Set());
        setDeletedMaterials(new Set());
        setXrayMaterials(new Set());
        setHotspots([]);
        setActiveHotspotId(null);
        setModelMaterialLists({});
        setModelStatsMap({});
        setModelStats({ fileSize: "0 MB" });

        if (modelRefs.current) modelRefs.current.clear();
        if (modelRef.current) modelRef.current = null;

        if (urlModelId) {
          navigate("/editor/threed_editor", { replace: true });
        }
      } else {
        setModels(targetState.models);
      }
    }

    if (targetState.modelMaterialLists !== undefined && Object.keys(targetState.modelMaterialLists).length > 0) {
      setModelMaterialLists(targetState.modelMaterialLists);
      modelMaterialListsRef.current = targetState.modelMaterialLists;
    }
    if (targetState.modelName !== undefined) {
      setModelName(targetState.modelName);
    }
    if (targetState.rootTransform !== undefined) {
      const nextRoot = sanitizeTransformValues(targetState.rootTransform);
      rootTransformRef.current = nextRoot;
      setRootTransform(nextRoot);
    }
    if (targetState.transformValues !== undefined) {
      setTransformValues({
        position: { ...(targetState.transformValues.position || { x: 0, y: 0, z: 0 }) },
        rotation: { ...(targetState.transformValues.rotation || { x: 0, y: 0, z: 0 }) },
        scale: { ...(targetState.transformValues.scale || { x: 1, y: 1, z: 1 }) }
      });
    }
    if (targetState.materialSettings !== undefined) {
      setMaterialSettings({
        ...targetState.materialSettings,
        useFactorColor: false,
        lastChangedProp: null
      });
    }
    if (targetState.customizedMaterials !== undefined) {
      const nextCustom = targetState.customizedMaterials ? { ...targetState.customizedMaterials } : {};
      customizedMaterialsRef.current = nextCustom;
      setCustomizedMaterials(nextCustom);
    }
    if (targetState.hiddenMaterials !== undefined) {
      setHiddenMaterials(new Set(targetState.hiddenMaterials));
    }
    if (targetState.xrayMaterials !== undefined) {
      setXrayMaterials(new Set(targetState.xrayMaterials));
    }
    if (targetState.deletedMaterials !== undefined) {
      setDeletedMaterials(new Set(targetState.deletedMaterials));
    }
    if (targetState.selectedMaterial !== undefined) {
      setSelectedMaterial(targetState.selectedMaterial);
    }
    if (targetState.selectedTexture !== undefined) {
      setSelectedTexture(targetState.selectedTexture);
    }
    if (targetState.meshTransforms !== undefined) {
      const nextTransforms = targetState.meshTransforms ? { ...targetState.meshTransforms } : {};
      meshTransformsRef.current = nextTransforms;
      setMeshTransformsState(nextTransforms);
    }

    if (targetState.hotspots !== undefined) {
      setHotspots(Array.isArray(targetState.hotspots) ? targetState.hotspots : []);
    }

    const tex = targetState.materialSettings?.appliedTexture || targetState.selectedTexture;
    const texId = targetState.selectedTextureId !== undefined ? targetState.selectedTextureId : (tex?.id || null);
    setSelectedTextureId(texId);

    stateRef.current = {
      models: targetState.models !== undefined ? targetState.models : stateRef.current.models,
      modelName: targetState.modelName !== undefined ? targetState.modelName : stateRef.current.modelName,
      rootTransform: targetState.rootTransform !== undefined ? targetState.rootTransform : stateRef.current.rootTransform,
      transformValues: targetState.transformValues !== undefined ? targetState.transformValues : stateRef.current.transformValues,
      materialSettings: targetState.materialSettings !== undefined
        ? { ...targetState.materialSettings, useFactorColor: false, lastChangedProp: null }
        : stateRef.current.materialSettings,
      customizedMaterials: targetState.customizedMaterials !== undefined ? targetState.customizedMaterials : stateRef.current.customizedMaterials,
      hiddenMaterials: targetState.hiddenMaterials !== undefined ? targetState.hiddenMaterials : stateRef.current.hiddenMaterials,
      xrayMaterials: targetState.xrayMaterials !== undefined ? targetState.xrayMaterials : stateRef.current.xrayMaterials,
      deletedMaterials: targetState.deletedMaterials !== undefined ? targetState.deletedMaterials : stateRef.current.deletedMaterials,
      modelMaterialLists: targetState.modelMaterialLists !== undefined ? targetState.modelMaterialLists : stateRef.current.modelMaterialLists,
      selectedMaterial: targetState.selectedMaterial !== undefined ? targetState.selectedMaterial : stateRef.current.selectedMaterial,
      selectedTexture: targetState.selectedTexture !== undefined ? targetState.selectedTexture : stateRef.current.selectedTexture,
      selectedTextureId: targetState.selectedTextureId !== undefined ? targetState.selectedTextureId : stateRef.current.selectedTextureId,
      meshTransforms: targetState.meshTransforms !== undefined ? targetState.meshTransforms : stateRef.current.meshTransforms,
      hotspots: targetState.hotspots !== undefined ? targetState.hotspots : stateRef.current.hotspots,
    };

    setResetKey(prev => prev + 1);
  }, [models.length, setTransformValues, sanitizeTransformValues, urlModelId, navigate]);

  const handleUndo = useCallback(() => {
    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = null;
      const pendingState = buildSnapshot();
      pushHistory(pendingState);
    }
    const prevState = undo();
    if (prevState) {
      applyHistoryState(prevState);
    }
  }, [undo, applyHistoryState, buildSnapshot, pushHistory]);

  const handleRedo = useCallback(() => {
    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = null;
      const pendingState = buildSnapshot();
      pushHistory(pendingState);
    }
    const nextState = redo();
    if (nextState) {
      applyHistoryState(nextState);
    }
  }, [redo, applyHistoryState, buildSnapshot, pushHistory]);

  const [sceneResetTrigger, setSceneResetTrigger] = useState(0);
  const [uvUnwrapTrigger, setUvUnwrapTrigger] = useState(0);

  // ==========================================================================
  // SECTION 8: SPECIALIZED CUSTOM HOOKS
  // ==========================================================================
  // Hook A: Viewport Camera Framing & Perspectives
  const {
    frameModelFullView,
    frameModelFullViewRef,
    latestModelBoundsRef,
    handleResetView,
    handleCameraViewChange,
    handleZoomIn,
    handleZoomOut
  } = useThreedCameraControls({
    cameraInstanceRef,
    controlsRef,
    glInstanceRef,
    sceneWrapperRef,
    setCameraViewMode,
    setTargetPosition,
    onResetSceneTransforms: () => {
      setTransformValues({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      });
      setMeshTransformsState({});
      meshTransformsRef.current = {};
      setSceneResetTrigger?.(prev => prev + 1);
      commitHistoryNow(buildSnapshot({
        meshTransforms: {},
        transformValues: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        }
      }));
    }
  });

  // Hook B: 3D Pins & Hotspots Management
  const {
    isPlacingHotspotRef,
    isHotspotFocusingRef,
    lastHotspotClickTimeRef,
    getMeshSurfacePosition,
    focusHotspot,
    handleHotspotClick,
    handleOpenAddHotspot,
    handleSaveHotspot,
    handleDeleteHotspot
  } = useThreedHotspots({
    hotspots,
    setHotspots,
    activeHotspotId,
    setActiveHotspotId,
    selectedMaterial,
    setSelectedMaterial,
    editingHotspot,
    setEditingHotspot,
    showHotspotModal,
    setShowHotspotModal,
    isPlacingHotspot,
    setIsPlacingHotspot,
    setRightPanelMode,
    sceneWrapperRef,
    cameraInstanceRef,
    controlsRef,
    glInstanceRef,
    setTargetPosition,
    commitHistoryNow,
    buildSnapshot,
    toast
  });

  // Hook C: Model Hierarchy & Material Tree Structure
  const {
    activeMaterialList,
    handleToggleVisibility,
    handleToggleXray,
    handleDeleteModel,
    handleDeleteMaterial,
    handleRename,
    handleRenameMaterial,
    handleSelectAllMeshes,
    handleDeleteCurrentSelection
  } = useThreedMaterialTree({
    models,
    setModels,
    modelName,
    setModelName,
    setModelUrl,
    urlModelId,
    modelMaterialLists,
    setModelMaterialLists,
    modelStatsMap,
    setModelStatsMap,
    setModelHasAnimationsMap,
    hiddenMaterials,
    setHiddenMaterials,
    xrayMaterials,
    setXrayMaterials,
    xrayMode,
    setXrayMode,
    deletedMaterials,
    setDeletedMaterials,
    selectedMaterial,
    setSelectedMaterial,
    materialSettings,
    setMaterialSettings,
    hotspots,
    setHotspots,
    activeHotspotId,
    setActiveHotspotId,
    setEditingHotspot,
    setShowHotspotModal,
    setIsPlacingHotspot,
    isPlacingHotspotRef,
    setRightPanelMode,
    setIsSidebarCollapsed,
    sceneWrapperRef,
    modelRef,
    modelRefs,
    commitHistoryNow,
    handleUndo,
    handleRedo,
    buildSnapshot,
    setThreedState
  });

  // Hook D: PBR Materials & Factor Customization
  const {
    updateMaterialSetting,
    handleMaterialSync,
    handleMaterialUIUpdate,
    handleDeleteHdr,
    handleMapUpload
  } = useThreedMaterialSettings({
    materialSettings,
    setMaterialSettings,
    savedHdrs,
    setSavedHdrs,
    stateRef,
    customizedMaterialsRef,
    setCustomizedMaterials,
    sceneWrapperRef,
    getMaterialTargetKeys,
    commitHistoryNow,
    commitHistoryDebounced,
    buildSnapshot
  });

  const lastSavedRef = useRef({
    historyIndex: 0,
    hasLocalFiles: false
  });

  // Hook E: File Loading, CAD Conversion & Drag-and-Drop
  const {
    processFile,
    handleSelectGalleryModel,
    handleDragOver,
    handleDrop,
    handleClearModel
  } = useThreedModelLoader({
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
  });

  // ==========================================================================
  // SECTION 9: SERVER SYNC & INITIALIZATION
  // ==========================================================================
  useEffect(() => {
    const initializeEditor = async () => {
      setIsSyncing(true);
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const backendUrl = rawBackendUrl.trim().replace(/\/+$/, '');

        // Path A: Load model from URL parameter
        if (urlModelId) {
          startModelLoading({
            id: urlModelId,
            name: "Loading 3D Model...",
            type: "glb"
          });
          try {
            const res = await axios.get(`${backendUrl}/api/3d-models/get-model/${urlModelId}`);
            if (res.data) {
              const modelData = res.data.model || res.data;
              const rawUrl = resolveUploadsPath(modelData.url);
              const updatedAtTime = modelData.updatedAt ? new Date(modelData.updatedAt).getTime() : Date.now();
              const fullUrl = rawUrl.includes('?')
                ? `${rawUrl}&v=${updatedAtTime}`
                : `${rawUrl}?v=${updatedAtTime}`;
              const loadedHotspots = Array.isArray(modelData.hotspots) ? modelData.hotspots : [];
              const loadedMaterialSettings = modelData.materialSettings || null;
              const loadedTransformValues = modelData.transformValues || null;

              const newModel = {
                id: urlModelId,
                modelId: modelData.modelId || urlModelId,
                url: fullUrl,
                file: null,
                type: modelData.type || (['step', 'stp', 'iges', 'igs', 'obj', 'fbx', 'stl', 'low', 'lwo', '3ds'].includes((fullUrl || '').split('?')[0].split('.').pop().toLowerCase()) ? (fullUrl || '').split('?')[0].split('.').pop().toLowerCase() : 'glb'),
                name: (modelData.name || "Model").replace(/\.[^/.]+$/, ""),
                fileName: modelData.fileName,
                displayName: modelData.displayName,
                hotspots: loadedHotspots
              };
              setModels([newModel]);
              setModelUrl(fullUrl);
              setModelType(newModel.type);
              setModelName(newModel.name);
              setSelectedMaterial({ name: newModel.name, parentGroup: newModel.name });
              setIsSidebarCollapsed(false);
              setModelStats({ fileSize: modelData.size || "0 MB" });
              setHotspots(loadedHotspots);
              if (loadedMaterialSettings) {
                setMaterialSettings(loadedMaterialSettings);
              }
              if (loadedTransformValues) {
                setTransformValues(loadedTransformValues);
              }

              setThreedState(prev => ({
                ...prev,
                models: [newModel],
                modelUrl: fullUrl,
                modelName: newModel.name,
                hotspots: loadedHotspots,
                ...(loadedMaterialSettings ? { materialSettings: loadedMaterialSettings } : {}),
                ...(loadedTransformValues ? { transformValues: loadedTransformValues } : {})
              }));

              resetHistory({
                models: [newModel],
                modelName: newModel.name,
                selectedMaterial: { name: newModel.name, parentGroup: newModel.name },
                selectedTexture: null,
                selectedTextureId: null,
                hiddenMaterials: [],
                xrayMaterials: [],
                deletedMaterials: [],
                customizedMaterials: {},
                modelMaterialLists: {},
                meshTransforms: {},
                hotspots: loadedHotspots,
                rootTransform: defaultTransform,
                transformValues: loadedTransformValues || defaultTransform,
                materialSettings: loadedMaterialSettings || defaultMaterialSettings
              });
              startMountingBridgeTicker(loadingProgressRef.current);
              return;
            }
          } catch (err) {
            console.error("Specified model not found, redirecting to 404...", err);
            clearAllLoadingTimers();
            setManualLoading(false);
            loadingProgressRef.current = 0;
            setLoadingProgress(0);
            setLoadingText("");
            navigate('/not-found', { replace: true });
          }
        }

        // Path B: Temporary model transferred from InteractionPanel
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
            const loadedHotspots = Array.isArray(parsed.hotspots) ? parsed.hotspots : [];
            const loadedTransformValues = parsed.transformValues || null;
            const loadedMaterialSettings = parsed.materialSettings || null;

            setHotspots(loadedHotspots);
            setThreedState(prev => ({
              ...prev,
              models: [newModel],
              modelUrl: fullUrl,
              modelName: newModel.name,
              hotspots: loadedHotspots
            }));
            resetHistory({
              models: [newModel],
              modelName: newModel.name,
              selectedMaterial: { name: newModel.name, parentGroup: newModel.name },
              selectedTexture: null,
              selectedTextureId: null,
              hiddenMaterials: [],
              xrayMaterials: [],
              deletedMaterials: [],
              customizedMaterials: {},
              modelMaterialLists: {},
              meshTransforms: {},
              hotspots: loadedHotspots,
              rootTransform: defaultTransform,
              transformValues: loadedTransformValues || defaultTransform,
              materialSettings: loadedMaterialSettings || defaultMaterialSettings
            });
            localStorage.removeItem('tempThreedEditModel');
            startMountingBridgeTicker(loadingProgressRef.current);
            return;
          } catch (e) {
            console.error("Failed to parse tempThreedEditModel", e);
            clearAllLoadingTimers();
            setManualLoading(false);
            loadingProgressRef.current = 0;
            setLoadingProgress(0);
            setLoadingText("");
            localStorage.removeItem('tempThreedEditModel');
          }
        }

        // Path C: Default empty canvas workspace
        setModels([]);
        setModelUrl(null);
        setModelName("");
        setIsSidebarCollapsed(true);
        setSelectedMaterial(null);
        setHiddenMaterials(new Set());
        setDeletedMaterials(new Set());
        setHotspots([]);
        setActiveHotspotId(null);
        setEditingHotspot(null);
        setShowHotspotModal(false);
        setIsPlacingHotspot(false);
        isPlacingHotspotRef.current = false;
        setRightPanelMode('edit');

        setThreedState(prev => ({
          ...prev,
          models: [],
          modelUrl: null,
          modelName: "",
          hotspots: [],
          materialSettings: {
            alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 50, rotation: 0,
            specular: 50, reflection: 10, shadow: 50, softness: 50, ao: 100, environment: 'studio',
            worldOpacity: 0, worldBlur: 0,
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

  // ==========================================================================
  // SECTION 10: SAVE, EXPORT & SNAPSHOT DISPATCHERS
  // ==========================================================================
  useEffect(() => {
    if (!setCanSave) return undefined;
    setCanSave(models.length > 0);
    return () => {
      setCanSave(true);
    };
  }, [models.length, setCanSave]);

  const handleSave = useCallback(async (options = {}) => {
    return await executeSave3D({
      options,
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
    });
  }, [models, modelName, setModelName, setIsSaving, setHasUnsavedChanges, triggerSaveSuccess, toast, materialSettings, transformValues, past, urlModelId, navigate, hotspots, modelMaterialLists, modelMaterialDataMap, modelStatsMap, setThreedState, setSafeProgress, setLoadingProgress]);

  const handleOpenSaveAs = useCallback(() => {
    const currentName = modelName || models[0]?.displayName || models[0]?.name?.replace(/\.[^/.]+$/, "") || "3D_Model";
    setSaveAsNameInput(`${currentName} Copy`);
    setShowSaveAsModal(true);
  }, [modelName, models]);

  const handleConfirmSaveAs = async (e) => {
    if (e) e.preventDefault();
    const trimmed = saveAsNameInput.trim();
    if (!trimmed) {
      toast.error("Please enter a name for the model copy");
      return;
    }
    setShowSaveAsModal(false);
    await handleSave({ isSaveAs: true, newName: trimmed });
  };

  const handleCaptureSnapshot = useCallback(async (opts) => {
    return await captureCameraSnapshot({
      gl: glInstanceRef.current,
      camera: cameraInstanceRef.current,
      scene: sceneInstanceRef.current || (glInstanceRef.current?.domElement ? null : null),
      ...opts,
      setIsCapturing
    });
  }, []);

  useEffect(() => {
    if (setSaveHandler) {
      setSaveHandler(() => handleSave);
    }
    const onManualSave = () => handleSave();
    window.addEventListener('trigger-manual-save', onManualSave);
    return () => {
      if (setSaveHandler) setSaveHandler(null);
      window.removeEventListener('trigger-manual-save', onManualSave);
    };
  }, [handleSave, setSaveHandler]);

  useEffect(() => {
    if (setExportHandler) {
      setExportHandler(() => () => setShowExportModal(true));
    }
    const onCustomExport = () => setShowExportModal(true);
    window.addEventListener('editor-export-3d', onCustomExport);
    return () => {
      if (setExportHandler) setExportHandler(null);
      window.removeEventListener('editor-export-3d', onCustomExport);
    };
  }, [setExportHandler]);

  useEffect(() => {
    if (setSaveAsHandler) {
      setSaveAsHandler(() => handleOpenSaveAs);
    }
    const onCustomSaveAs = () => handleOpenSaveAs();
    window.addEventListener('editor-save-as', onCustomSaveAs);
    return () => {
      if (setSaveAsHandler) setSaveAsHandler(null);
      window.removeEventListener('editor-save-as', onCustomSaveAs);
    };
  }, [handleOpenSaveAs, setSaveAsHandler]);

  useEffect(() => {
    const hasLocalModels = models.some(m => m.file);
    const historyChanged = past.length !== lastSavedRef.current.historyIndex;
    setHasUnsavedChanges(hasLocalModels || historyChanged);
  }, [models, past.length, setHasUnsavedChanges]);

  // ==========================================================================
  // SECTION 11: MODEL ADDITION & STATS CALCULATIONS
  // ==========================================================================
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
      const converted = await convertModelFileIfNeeded(file, { setLoadingText, setSafeProgress, setManualLoading, startConversionTicker, stopConversionTicker });

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
      if (models.length === 0) {
        nextModelName = newModel.name;
        setModelName(nextModelName);
        resetHistory(buildSnapshot({
          models: nextModels,
          modelName: nextModelName,
          selectedMaterial: null
        }));
      } else {
        commitHistoryNow(buildSnapshot({
          models: nextModels,
          modelName: nextModelName,
          selectedMaterial: null
        }));
      }

      setIsSidebarCollapsed(false);
      startMountingBridgeTicker(loadingProgressRef.current);
    } catch (err) {
      console.error("Error adding/converting model:", err);
      clearAllLoadingTimers();
      setManualLoading(false);
      loadingProgressRef.current = 0;
      setLoadingProgress(0);
      setLoadingText("");
      setLoadingModelInfo(null);
      pendingModelIdRef.current = null;
      isCompletingRef.current = false;

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
      if (prev[modelId] === stats) return prev;
      try {
        if (JSON.stringify(prev[modelId]) === JSON.stringify(stats)) return prev;
      } catch (_) { }
      return { ...prev, [modelId]: stats };
    });
  }, []);

  const handleSetMaterialList = useCallback((modelId, list, dataMap) => {
    setModelMaterialLists(prev => {
      if (prev[modelId] === list) return prev;
      try {
        if (JSON.stringify(prev[modelId]) === JSON.stringify(list)) return prev;
      } catch (_) { }
      const next = { ...prev, [modelId]: list };
      modelMaterialListsRef.current = next;
      return next;
    });

    if (dataMap) {
      setModelMaterialDataMap(prev => {
        if (prev[modelId] === dataMap) return prev;
        return { ...prev, [modelId]: dataMap };
      });
    }
  }, []);

  const handleExport = async (exportSettings) => {
    return await executeExport3D({
      exportSettings,
      sceneWrapperRef,
      models,
      modelName,
      setManualLoading,
      setLoadingText,
      toast
    });
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

  const handleToggleWireframe = useCallback(() => {
    setSettings(prev => ({ ...prev, wireframe: !prev?.wireframe }));
  }, []);

  const handleToggleShades = useCallback(() => {
    setIsShades(prev => !prev);
  }, []);

  // ==========================================================================
  // SECTION 12: MANUAL TRANSFORM TOOLS & OBJECT MANIPULATION
  // ==========================================================================
  const handleManualTransformChange = (type, axis, value, isDragging = false) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    if (type === 'rotation') {
      numVal = numVal * (Math.PI / 180);
    }

    const isChildSelection = selectedMaterial && selectedMaterial.name !== modelName && selectedMaterial.name !== 'Scene' && !selectedMaterial.isAll;

    if (isChildSelection) {
      let nextMeshTransforms = meshTransformsRef.current ? { ...meshTransformsRef.current } : {};
      const targetUuid = selectedMaterial.uuid || selectedMaterial.meshUuid || selectedMaterial.name;

      const prevMTransform = nextMeshTransforms[targetUuid] ||
        (selectedMaterial.name ? nextMeshTransforms[selectedMaterial.name] : null) ||
        (selectedMaterial.meshName ? nextMeshTransforms[selectedMaterial.meshName] : null) ||
      {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };

      const updatedAxisValues = axis === 'all'
        ? { x: numVal, y: numVal, z: numVal }
        : { [axis]: numVal };

      const updatedMTransform = {
        ...prevMTransform,
        [type]: {
          ...(prevMTransform[type] || {}),
          ...updatedAxisValues
        }
      };

      const keysToSet = new Set([
        targetUuid,
        selectedMaterial.uuid,
        selectedMaterial.meshUuid,
        selectedMaterial.name,
        selectedMaterial.meshName,
        selectedMaterial.material
      ].filter(Boolean));

      if (Array.isArray(selectedMaterial.uuids)) {
        selectedMaterial.uuids.forEach(u => keysToSet.add(u));
      }
      if (Array.isArray(selectedMaterial.items)) {
        selectedMaterial.items.forEach(it => {
          if (it.uuid) keysToSet.add(it.uuid);
          if (it.meshUuid) keysToSet.add(it.meshUuid);
          if (it.name) keysToSet.add(it.name);
        });
      }
      if (Array.isArray(selectedMaterial.materials)) {
        selectedMaterial.materials.forEach(m => keysToSet.add(typeof m === 'string' ? m : m?.name));
      }

      keysToSet.forEach(k => {
        if (k) nextMeshTransforms[k] = updatedMTransform;
      });

      meshTransformsRef.current = nextMeshTransforms;
      setMeshTransformsState(nextMeshTransforms);
      setTransformValues(updatedMTransform);

      const snapshot = buildSnapshot({
        transformValues: updatedMTransform,
        meshTransforms: nextMeshTransforms,
        rootTransform: rootTransformRef.current
      });
      if (isDragging) {
        commitHistoryDebounced(snapshot, 300);
      } else {
        commitHistoryNow(snapshot);
      }
    } else {
      const activeModel = models.find(m =>
        (selectedMaterial?.id && m.id === selectedMaterial.id) ||
        (selectedMaterial?.modelId && m.id === selectedMaterial.modelId) ||
        (selectedMaterial?.parentGroup && m.name === selectedMaterial.parentGroup) ||
        (selectedMaterial?.name && m.name === selectedMaterial.name)
      ) || models[0];

      const prev = (activeModel && activeModel.transform) || rootTransformRef.current || defaultTransform;
      const next = {
        position: { ...(prev.position || { x: 0, y: 0, z: 0 }) },
        rotation: { ...(prev.rotation || { x: 0, y: 0, z: 0 }) },
        scale: { ...(prev.scale || { x: 1, y: 1, z: 1 }) }
      };

      if (axis === 'all') {
        next[type] = { x: numVal, y: numVal, z: numVal };
      } else {
        next[type] = {
          ...(next[type] || {}),
          [axis]: numVal
        };
      }

      const nextModels = models.map(m => {
        if (activeModel && m.id === activeModel.id) {
          return { ...m, transform: next };
        }
        return m;
      });

      setModels(nextModels);
      rootTransformRef.current = next;
      setRootTransform(next);
      setTransformValues(next);

      const snapshot = buildSnapshot({
        models: nextModels,
        transformValues: next,
        rootTransform: next,
        meshTransforms: meshTransformsRef.current
      });
      if (isDragging) {
        commitHistoryDebounced(snapshot, 300);
      } else {
        commitHistoryNow(snapshot);
      }
    }
  };

  const handleResetTransform = (type) => {
    if (type === 'all') {
      setSceneResetTrigger(prev => prev + 1);
    }

    const isChildSelection = selectedMaterial && selectedMaterial.name !== modelName && selectedMaterial.name !== 'Scene' && !selectedMaterial.isAll;

    if (isChildSelection) {
      const targetUuid = selectedMaterial.uuid || selectedMaterial.meshUuid || selectedMaterial.name;
      let nextMeshTransforms = meshTransformsRef.current ? { ...meshTransformsRef.current } : {};
      const defaultChild = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };
      const prevM = nextMeshTransforms[targetUuid] || defaultChild;
      const next = {
        position: { ...prevM.position },
        rotation: { ...prevM.rotation },
        scale: { ...prevM.scale }
      };

      if (!type || type === 'all') {
        next.position = { x: 0, y: 0, z: 0 };
        next.rotation = { x: 0, y: 0, z: 0 };
        next.scale = { x: 1, y: 1, z: 1 };
      } else if (type === 'position') {
        next.position = { x: 0, y: 0, z: 0 };
      } else if (type === 'rotation') {
        next.rotation = { x: 0, y: 0, z: 0 };
      } else if (type === 'scale') {
        next.scale = { x: 1, y: 1, z: 1 };
      }

      const keysToSet = new Set([
        targetUuid,
        selectedMaterial.uuid,
        selectedMaterial.meshUuid,
        selectedMaterial.name,
        selectedMaterial.meshName,
        selectedMaterial.material
      ].filter(Boolean));

      if (Array.isArray(selectedMaterial.uuids)) {
        selectedMaterial.uuids.forEach(u => keysToSet.add(u));
      }
      if (Array.isArray(selectedMaterial.items)) {
        selectedMaterial.items.forEach(it => {
          if (it.uuid) keysToSet.add(it.uuid);
          if (it.meshUuid) keysToSet.add(it.meshUuid);
          if (it.name) keysToSet.add(it.name);
        });
      }
      if (Array.isArray(selectedMaterial.materials)) {
        selectedMaterial.materials.forEach(m => keysToSet.add(typeof m === 'string' ? m : m?.name));
      }

      keysToSet.forEach(k => {
        if (k) nextMeshTransforms[k] = next;
      });

      meshTransformsRef.current = nextMeshTransforms;
      setMeshTransformsState(nextMeshTransforms);
      setTransformValues(next);
      commitHistoryNow(buildSnapshot({ transformValues: next, meshTransforms: nextMeshTransforms, rootTransform: rootTransformRef.current }));
    } else {
      const activeModel = models.find(m =>
        (selectedMaterial?.id && m.id === selectedMaterial.id) ||
        (selectedMaterial?.modelId && m.id === selectedMaterial.modelId) ||
        (selectedMaterial?.parentGroup && m.name === selectedMaterial.parentGroup) ||
        (selectedMaterial?.name && m.name === selectedMaterial.name)
      ) || models[0];

      const defaults = originalTransformRef.current || defaultTransform;
      const getXYZ = (obj) => ({ x: obj.x, y: obj.y, z: obj.z });
      const curRoot = (activeModel && activeModel.transform) || rootTransformRef.current || defaultTransform;
      const next = {
        position: { ...curRoot.position },
        rotation: { ...curRoot.rotation },
        scale: { ...curRoot.scale }
      };

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

      const nextModels = models.map(m => {
        if (activeModel && m.id === activeModel.id) {
          return { ...m, transform: next };
        }
        return m;
      });

      setModels(nextModels);
      rootTransformRef.current = next;
      setRootTransform(next);
      setTransformValues(next);
      commitHistoryNow(buildSnapshot({
        models: nextModels,
        transformValues: next,
        rootTransform: next,
        meshTransforms: meshTransformsRef.current
      }));
    }
  };

  const handleTransformStart = useCallback(() => {
    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = null;
      commitHistoryNow();
    }
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [commitHistoryNow]);

  const handleTransformEnd = useCallback((finalMeshTransforms) => {
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
    try {
      let nextTransforms = { ...meshTransformsRef.current };
      if (finalMeshTransforms && typeof finalMeshTransforms === 'object' && Object.keys(finalMeshTransforms).length > 0) {
        nextTransforms = {
          ...nextTransforms,
          ...finalMeshTransforms
        };
        meshTransformsRef.current = nextTransforms;
        setMeshTransformsState(nextTransforms);
      }
      commitHistoryNow(buildSnapshot({
        models: modelsRef.current,
        meshTransforms: nextTransforms,
        rootTransform: rootTransformRef.current,
        transformValues: stateRef.current.transformValues
      }));
    } catch (err) {
      console.warn("[ThreedEditor] Error during transform end history snapshot:", err);
    }
  }, [commitHistoryNow, buildSnapshot]);

  const [settings, setSettings] = useState({
    backgroundColor: "#393939",
    baseColor: "#2c2c2c",
    base: false,
    grid: true,
    wireframe: false,
  });

  const handleTextureIdentified = useCallback((id) => {
    setSelectedTextureId(prev => prev === id ? prev : id);
  }, []);

  const handleTextureApplied = useCallback(() => {
    setSelectedTexture(null);
  }, []);

  // ==========================================================================
  // SECTION 13: TEXTURE APPLICATION & INTERACTIVE SELECTION
  // ==========================================================================
  const handleSelectTexture = useCallback((textureData) => {
    const isReset = !textureData || !textureData.id;
    const isNone = textureData?.id === 'none';
    const newTexture = isReset ? null : { ...textureData, ts: Date.now() };
    const newTextureId = isReset ? null : textureData.id;

    setSelectedTextureId(newTextureId);
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
          alphaMap: null,
          ...(prev.customEnvMap || prev.maps?.envMap ? { envMap: prev.customEnvMap || prev.maps?.envMap } : {})
        };
        next.lastChangedProp = 'maps';
      } else {
        let finalMaps = { ...(textureData.maps || {}) };

        if (textureData.isUploaded) {
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

        next.maps = {
          map: finalMaps.map || null,
          normalMap: finalMaps.normalMap || null,
          roughnessMap: finalMaps.roughnessMap || null,
          metalnessMap: finalMaps.metalnessMap || null,
          displacementMap: null,
          aoMap: finalMaps.aoMap || null,
          emissiveMap: finalMaps.emissiveMap || null,
          alphaMap: finalMaps.alphaMap || null,
          bumpMap: finalMaps.bumpMap || null,
          ...(prev.customEnvMap || prev.maps?.envMap ? { envMap: prev.customEnvMap || prev.maps?.envMap } : {})
        };
        if (textureData.isXray) {
          next.color = textureData.color || '#5ec4e0';
          next.emissiveColor = textureData.emissiveColor || '#3a8fb0';
          next.emissiveIntensity = textureData.emissiveIntensity !== undefined ? textureData.emissiveIntensity : 100;
          next.roughness = textureData.roughness !== undefined ? textureData.roughness : 42;
          next.metallic = textureData.metallic !== undefined ? textureData.metallic : 0;
          next.alpha = textureData.alpha !== undefined ? textureData.alpha : 42;
          next.scale = 50;
          next.useFactorColor = true;
          next.lastChangedProp = 'appliedTexture';
        } else {
          next.metallic = textureData.metallic !== undefined ? textureData.metallic : 100;
          next.roughness = textureData.roughness !== undefined ? textureData.roughness : 100;
          next.normal = textureData.normal !== undefined ? textureData.normal : 100;
          next.bump = textureData.bump !== undefined ? textureData.bump : 0;
          next.ao = textureData.ao !== undefined ? textureData.ao : 100;
          next.color = textureData.color || '#ffffff';
          next.scale = 50;
          next.useFactorColor = true;
          next.lastChangedProp = 'appliedTexture';
        }
      }

      const curSel = stateRef.current.selectedMaterial;
      const targetKeys = getMaterialTargetKeys(curSel);
      if (targetKeys.length > 0) {
        const nextCustomMap = { ...(customizedMaterialsRef.current || {}) };
        targetKeys.forEach(tKey => {
          const prevEntry = nextCustomMap[tKey] || {};
          if (isReset || isNone) {
            nextCustomMap[tKey] = {
              ...prevEntry,
              maps: next.maps,
              useFactorColor: true
            };
          } else {
            nextCustomMap[tKey] = {
              ...prevEntry,
              appliedTexture: newTexture,
              maps: next.maps,
              metallic: next.metallic,
              roughness: next.roughness,
              normal: next.normal,
              bump: next.bump,
              ao: next.ao,
              color: next.color,
              alpha: next.alpha !== undefined ? next.alpha : prevEntry.alpha,
              emissiveColor: next.emissiveColor || prevEntry.emissiveColor,
              emissiveIntensity: next.emissiveIntensity !== undefined ? next.emissiveIntensity : prevEntry.emissiveIntensity,
              scale: next.scale,
              useFactorColor: true
            };
          }
          if (tKey === '__ALL__') {
            try {
              const liveMeshes = [];
              if (sceneWrapperRef.current) {
                sceneWrapperRef.current.traverse((obj) => {
                  if ((obj.isMesh || obj.isSkinnedMesh) && obj.uuid) {
                    liveMeshes.push(obj.uuid);
                    if (obj.name) liveMeshes.push(obj.name);
                  }
                });
              }
              nextCustomMap[tKey].__meshes__ = Array.from(new Set(liveMeshes));
            } catch (_) { }
          }
        });

        customizedMaterialsRef.current = nextCustomMap;
        setCustomizedMaterials(nextCustomMap);
      }

      commitHistoryNow(buildSnapshot({
        materialSettings: next,
        customizedMaterials: customizedMaterialsRef.current,
        selectedTexture: newTexture,
        selectedTextureId: newTextureId
      }));

      if (isReset || isNone) {
        setResetKey(prev => prev + 1);
      }

      return { ...next };
    });
  }, [commitHistoryNow, buildSnapshot, getMaterialTargetKeys]);

  const handleSelectMaterial = useCallback((val) => {
    setSelectedTexture(null);

    const target = typeof val === 'object' ? { ...val } : { name: val };
    if (target.name && typeof target.name !== 'string') {
      target.name = target.name.name || target.name.material || String(target.name);
    }
    const isShift = !!target.isShift;

    // Direct placement interception when hotspot creation mode is active
    if (isPlacingHotspotRef.current) {
      setIsPlacingHotspot(false);
      isPlacingHotspotRef.current = false;
      setEditingHotspot(null);
      setSelectedMaterial({
        ...target,
        uuid: target.uuid || target.meshUuid || null,
        meshUuid: target.meshUuid || target.uuid || null,
        clickPoint: target.clickPoint || null,
        clickNormal: target.clickNormal || null
      });
      setShowHotspotModal(true);
      return;
    }

    if (!isShift && selectedMaterial && !selectedMaterial.isGroup && selectedMaterial.name === target.name && (!target.uuid || selectedMaterial.uuid === target.uuid)) {
      return;
    }

    setSelectedMaterial(prev => {
      if (isShift && prev) {
        let prevItems = [];
        if (Array.isArray(prev.items) && prev.items.length > 0) {
          prevItems = [...prev.items];
        } else if (prev.uuid || prev.meshUuid) {
          prevItems = [{
            uuid: prev.uuid || prev.meshUuid,
            meshUuid: prev.meshUuid || prev.uuid,
            name: prev.name,
            meshName: prev.meshName || prev.name,
            material: prev.material,
            isMesh: true
          }];
        } else if (Array.isArray(prev.materials)) {
          prevItems = prev.materials.map(m => ({
            name: typeof m === 'string' ? m : (m?.name || ''),
            material: typeof m === 'string' ? m : (m?.material || m?.name || ''),
            isMesh: false
          }));
        } else if (prev.name) {
          prevItems = [{ name: prev.name, isMesh: false }];
        }

        const targetUuid = target.uuid || target.meshUuid || null;
        const targetName = target.meshName || target.name || null;

        const existingIdx = prevItems.findIndex(it => {
          const itUuid = it.uuid || it.meshUuid;
          if (targetUuid && itUuid) return itUuid === targetUuid;
          const itName = it.meshName || it.name;
          if (targetName && itName) return itName === targetName;
          return false;
        });

        let nextItems = [];
        if (existingIdx >= 0) {
          nextItems = prevItems.filter((_, idx) => idx !== existingIdx);
        } else {
          nextItems = [
            ...prevItems,
            {
              uuid: targetUuid,
              meshUuid: targetUuid,
              name: target.name,
              meshName: target.meshName || target.name,
              material: target.material,
              isMesh: true
            }
          ];
        }

        if (nextItems.length === 0) return null;
        if (nextItems.length === 1) {
          return {
            ...nextItems[0],
            ts: Date.now()
          };
        }

        const allUuids = Array.from(new Set(nextItems.map(it => it.uuid || it.meshUuid).filter(Boolean)));
        const allMeshNames = Array.from(new Set(nextItems.map(it => it.meshName || it.name).filter(Boolean)));
        const allMaterials = Array.from(new Set(nextItems.map(it => typeof it.material === 'string' ? it.material : it.material?.name).filter(Boolean)));

        return {
          name: "Multiple Selection",
          isGroup: true,
          isMultiSelect: true,
          items: nextItems,
          uuids: allUuids,
          meshNames: allMeshNames,
          materials: allMaterials,
          ts: Date.now()
        };
      }

      return { ...target, uuid: target.uuid || target.meshUuid || null, meshUuid: target.meshUuid || target.uuid || null, ts: Date.now() };
    });

    if (transformModeRef.current || target.isTransformSelect) {
      return;
    }

    setMaterialSettings(prev => {
      const preservedEnvMap = prev.customEnvMap || prev.maps?.envMap || null;
      const next = {
        ...prev,
        maps: preservedEnvMap ? { envMap: preservedEnvMap } : {},
        customEnvMap: preservedEnvMap,
        useFactorColor: false,
        lastChangedProp: null
      };

      const isModelLevelSelection = models.some(m => m.name === target.name);
      if (!isShift && target.name && !isModelLevelSelection && target.name !== "Scene") {
        const lookupKeys = [
          target.uuid,
          target.meshUuid,
          target.name,
          target.meshName,
          typeof target.material === 'string' ? target.material : target.material?.name
        ].filter(Boolean);

        let customData = null;
        for (const key of lookupKeys) {
          if (customizedMaterialsRef.current && customizedMaterialsRef.current[key]) {
            customData = customizedMaterialsRef.current[key];
            break;
          }
        }

        if (customData) {
          const cleanMaps = {};
          if (customData.maps && typeof customData.maps === 'object') {
            for (const [k, v] of Object.entries(customData.maps)) {
              if (v) cleanMaps[k] = v;
            }
          }
          if (target.freshMaps && typeof target.freshMaps === 'object') {
            for (const [k, v] of Object.entries(target.freshMaps)) {
              if (v && v !== 'existing') cleanMaps[k] = v;
            }
          }
          return {
            ...next,
            color: customData.color || next.color,
            colorIntensity: customData.colorIntensity !== undefined ? customData.colorIntensity : next.colorIntensity,
            metallic: customData.metallic !== undefined ? customData.metallic : next.metallic,
            roughness: customData.roughness !== undefined ? customData.roughness : next.roughness,
            alpha: customData.alpha !== undefined ? customData.alpha : next.alpha,
            scale: customData.scale !== undefined ? customData.scale : next.scale,
            rotation: customData.rotation !== undefined ? customData.rotation : next.rotation,
            offset: customData.offset || next.offset,
            emissiveColor: customData.emissiveColor || next.emissiveColor,
            emissiveIntensity: customData.emissiveIntensity !== undefined ? customData.emissiveIntensity : next.emissiveIntensity,
            normal: customData.normal !== undefined ? customData.normal : next.normal,
            bump: customData.bump !== undefined ? customData.bump : next.bump,
            ao: customData.ao !== undefined ? customData.ao : next.ao,
            appliedTexture: customData.appliedTexture || null,
            maps: { ...cleanMaps, ...(preservedEnvMap ? { envMap: preservedEnvMap } : {}) },
            customEnvMap: preservedEnvMap,
            useFactorColor: false,
            lastChangedProp: null
          };
        }

        let defaultData = null;
        for (const modelId in modelMaterialDataMap) {
          const mData = modelMaterialDataMap[modelId];
          if (!mData) continue;
          for (const key of lookupKeys) {
            if (mData[key]) {
              defaultData = mData[key];
              break;
            }
          }
          if (defaultData) break;
        }

        if (defaultData) {
          const cleanMaps = {};
          if (defaultData.maps && typeof defaultData.maps === 'object') {
            for (const [k, v] of Object.entries(defaultData.maps)) {
              if (v) cleanMaps[k] = v;
            }
          }
          if (target.freshMaps && typeof target.freshMaps === 'object') {
            for (const [k, v] of Object.entries(target.freshMaps)) {
              if (v && v !== 'existing') cleanMaps[k] = v;
            }
          }
          return {
            ...next,
            color: defaultData.color || next.color,
            metallic: defaultData.metallic !== undefined ? defaultData.metallic : next.metallic,
            roughness: defaultData.roughness !== undefined ? defaultData.roughness : next.roughness,
            alpha: defaultData.opacity !== undefined ? defaultData.opacity : next.alpha,
            scale: prev.scale !== undefined ? prev.scale : (defaultData.scale !== undefined ? defaultData.scale : next.scale),
            maps: { ...cleanMaps, ...(preservedEnvMap ? { envMap: preservedEnvMap } : {}) },
            customEnvMap: preservedEnvMap,
            useFactorColor: false,
            lastChangedProp: null
          };
        }

        if (target.freshMaps && typeof target.freshMaps === 'object') {
          const freshClean = {};
          for (const [k, v] of Object.entries(target.freshMaps)) {
            if (v && v !== 'existing') freshClean[k] = v;
          }
          if (Object.keys(freshClean).length > 0) {
            return {
              ...next,
              maps: { ...freshClean, ...(preservedEnvMap ? { envMap: preservedEnvMap } : {}) },
              customEnvMap: preservedEnvMap,
              useFactorColor: false,
              lastChangedProp: null
            };
          }
        }
      }

      return {
        ...next,
        materialName: target.name || "Solid Material",
        appliedTexture: null
      };
    });
  }, [modelName, models, modelMaterialDataMap, selectedMaterial]);
  handleSelectMaterialRef.current = handleSelectMaterial;

  useEffect(() => {
    if (isRestoringHistoryRef.current) return;
    setMaterialSettings(prev => {
      // When unselecting material (clicking on empty canvas), clear any active material preview/appliedTexture
      if (!selectedMaterial) {
        return {
          ...prev,
          appliedTexture: null,
          useFactorColor: false,
          lastChangedProp: null
        };
      }
      return {
        ...prev,
        useFactorColor: false,
        lastChangedProp: null
      };
    });
  }, [selectedMaterial]);

  useEffect(() => {
    if (isRestoringHistoryRef.current) return;
    const isModelLevel = !selectedMaterial || !selectedMaterial.name || selectedMaterial.isModel || selectedMaterial.name === modelName || selectedMaterial.name === 'Scene' || selectedMaterial.isAll;
    if (isModelLevel) {
      const activeModel = models.find(m =>
        (selectedMaterial?.id && m.id === selectedMaterial.id) ||
        (selectedMaterial?.modelId && m.id === selectedMaterial.modelId) ||
        (selectedMaterial?.parentGroup && m.name === selectedMaterial.parentGroup) ||
        (selectedMaterial?.name && m.name === selectedMaterial.name)
      );
      const activeTransform = activeModel?.transform || rootTransformRef.current || defaultTransform;
      setTransformValues(activeTransform);
    } else {
      const lookupKeys = [
        selectedMaterial.uuid,
        selectedMaterial.meshUuid,
        selectedMaterial.name,
        selectedMaterial.meshName,
        selectedMaterial.material
      ].filter(Boolean);
      let found = null;
      for (const k of lookupKeys) {
        if (meshTransformsRef.current && meshTransformsRef.current[k]) {
          found = meshTransformsRef.current[k];
          break;
        }
      }
      if (found) {
        setTransformValues(found);
      } else {
        setTransformValues({
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        });
      }
    }
  }, [selectedMaterial, modelName, models, defaultTransform, setTransformValues]);

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

    if (t.isModelLevel) {
      const targetModelId = t.modelId || selectedMaterial?.id || selectedMaterial?.modelId;
      const targetModelName = t.modelName || selectedMaterial?.parentGroup || selectedMaterial?.name;

      let found = false;
      const updatedModels = (modelsRef.current || models).map(m => {
        if ((targetModelId && m.id === targetModelId) || (targetModelName && m.name === targetModelName)) {
          found = true;
          return { ...m, transform: nextTransform };
        }
        return m;
      });

      const finalModels = found ? updatedModels : (modelsRef.current || models).map((m, idx) => {
        if (idx === 0) return { ...m, transform: nextTransform };
        return m;
      });

      modelsRef.current = finalModels;
      setModels(finalModels);
      rootTransformRef.current = nextTransform;
      setRootTransform(nextTransform);
    }

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
  }, [setTransformValues, selectedMaterial]);

  const canvasPointerDownPosRef = useRef(null);

  const handleCanvasPointerDown = useCallback((e) => {
    canvasPointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMissed = useCallback((e) => {
    if (canvasPointerDownPosRef.current) {
      const dx = Math.abs(e.clientX - canvasPointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - canvasPointerDownPosRef.current.y);
      if (dx > 5 || dy > 5) return;
    }

    if (e.target && e.target.closest && e.target.closest('.pointer-events-auto')) {
      return;
    }

    if (Date.now() - lastHotspotClickTimeRef.current < 200) return;
    if (isHotspotFocusingRef.current) return;

    if (selectedMaterial) {
      setSelectedMaterial(null);
    }
  }, [selectedMaterial, lastHotspotClickTimeRef, isHotspotFocusingRef]);

  // ==========================================================================
  // SECTION 14: JSX VIEWPORT & COMPONENT LAYOUT RENDERING
  // ==========================================================================
  return (
    <div
      className="flex h-[92vh] w-full bg-white overflow-hidden relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Global Progress Loader */}
      {!showModelGalleryModal && (
        <GlobalLoader
          manualLoading={manualLoading || isSyncing}
          progress={loadingProgress}
          stage={loadingText}
          modelInfo={loadingModelInfo}
        />
      )}

      {/* Export Options Modal Dialog */}
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

      {/* Main Canvas & Editor Viewport */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full bg-[#1e2025]">
        <LeftSidebar
          activeTab={activeLeftTab}
          onSelectTab={setActiveLeftTab}
          modelName={modelName}
          onRenameModel={handleRename}
          fileSize={combinedStats?.fileSize || modelStats?.fileSize || "18MB"}
          models={models}
          activeModelId={selectedMaterial?.id || selectedMaterial?.parentGroup || (typeof selectedMaterial === "string" ? selectedMaterial : null)}
          onSelectModel={(id, modelItem) => {
            setActiveLeftTab("model");
            if (modelItem) {
              handleSelectMaterial({
                id: modelItem.id,
                name: modelItem.name,
                parentGroup: modelItem.name,
                isModel: true,
                isGroup: true
              });
            }
          }}
          onAddModel={() => {
            setShowAddModelModal(true);
          }}
          meshCount={activeMaterialList.length}
          pageCount={10}
          onExport={() => setShowExportModal(true)}
          hasModel={models.length > 0}
          materialList={activeMaterialList}
          modelMaterialLists={modelMaterialLists}
          selectedMaterial={selectedMaterial}
          onSelectMaterial={handleSelectMaterial}
          hiddenMaterials={hiddenMaterials}
          xrayMaterials={xrayMaterials}
          onToggleVisibility={handleToggleVisibility}
          onToggleXray={handleToggleXray}
          onDeleteMaterial={handleDeleteMaterial}
          onDeleteModel={handleDeleteModel}
          onRenameMaterial={handleRenameMaterial}
        />

        {/* Material & Color Preset Drawer */}
        <MaterialSelectorDrawer
          isOpen={isMaterialDrawerOpen || (activeLeftTab === "materials" && isMaterialDrawerOpen)}
          onClose={() => setIsMaterialDrawerOpen(false)}
          selectedTextureId={selectedTextureId}
          onSelectTexture={(texture) => {
            handleSelectTexture(texture);
            if (texture?.name) {
              setMaterialSettings(prev => ({ ...prev, materialName: texture.name }));
            }
          }}
          selectedColor={materialSettings?.color}
          onSelectColor={(colorData) => {
            if (typeof colorData === 'object') {
              setMaterialSettings(prev => {
                const next = {
                  ...prev,
                  materialName: colorData.name || prev.materialName || 'Custom Color',
                  color: colorData.color || colorData.hex || prev.color,
                  metallic: colorData.metallic !== undefined ? colorData.metallic : prev.metallic,
                  roughness: colorData.roughness !== undefined ? colorData.roughness : prev.roughness,
                  normal: colorData.normal !== undefined ? colorData.normal : prev.normal,
                  ao: colorData.ao !== undefined ? colorData.ao : prev.ao,
                  bump: colorData.bump !== undefined ? colorData.bump : prev.bump,
                  alpha: colorData.alpha !== undefined ? colorData.alpha : prev.alpha,
                  useFactorColor: true,
                  lastChangedProp: 'color'
                };
                const curSel = stateRef.current.selectedMaterial;
                const targetKeys = getMaterialTargetKeys(curSel);
                let nextCustomMap = customizedMaterialsRef.current || {};
                if (targetKeys.length > 0) {
                  nextCustomMap = { ...nextCustomMap };
                  targetKeys.forEach(tKey => {
                    const prevCustom = nextCustomMap[tKey] || {};
                    nextCustomMap[tKey] = {
                      ...prevCustom,
                      materialName: next.materialName,
                      color: next.color,
                      metallic: next.metallic,
                      roughness: next.roughness,
                      normal: next.normal,
                      ao: next.ao,
                      bump: next.bump,
                      alpha: next.alpha,
                      useFactorColor: true,
                    };
                  });
                  customizedMaterialsRef.current = nextCustomMap;
                  setCustomizedMaterials(nextCustomMap);
                }
                return { ...next };
              });
            } else {
              handleMaterialUIUpdate('color', colorData);
            }
          }}
          refreshTrigger={materialRefreshKey}
        />

        {/* Center Workspace (Canvas + Floating Tools + Bottom Swatch Tray) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative">
          <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full" style={getCameraBgStyle()}>
            {/* Top Viewport Floating Controls */}
            {activeLeftTab !== "camera" && (
            <CanvasFloatingToolbar
              cameraMode={cameraViewMode}
              onSelectCameraView={handleCameraViewChange}
              isWireframe={Boolean(settings?.wireframe)}
              onToggleWireframe={handleToggleWireframe}
              isShades={isShades}
              onToggleShades={handleToggleShades}
              navMode={navMode}
              onSelectNavMode={setNavMode}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetView={handleResetView}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              transformMode={transformMode || "select"}
              onSelectTransformMode={(mode) => {
                setTransformMode(mode === "select" ? null : mode);
                if (mode && mode !== "select") {
                  setActiveAccordion("position");
                }
              }}
              canTransform={models.length > 0}
            />
            )}

            {/* Snapshot / Screenshot Modal */}
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

            {/* Empty Canvas Placeholder */}
            {models.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none select-none">
                <div className="flex flex-col items-center gap-[0.75vw] opacity-50">
                  <Icon icon="ph:cube-focus-thin" width="4.16vw" className="text-gray-50" />
                  <span className="text-[0.72vw] font-medium text-gray-50">Uploaded 3D Model will be shown here</span>
                </div>
              </div>
            )}

            {/* 3D Scene Viewport */}
                        {/* Camera Viewfinder Overlay */}
            {activeLeftTab === "camera" && (() => {
              const activeFrame = CAMERA_FRAME_OPTIONS.find((f) => f.id === selectedFrameId || f.id === selectedFrameId?.replace(/_[a-c]$/, ''));
              if (!activeFrame || !activeFrame.aspect) return null;
              const isWide = activeFrame.aspect >= 1;
              return (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
                  <div
                    className="relative border-2 border-dashed border-[#EC5137]/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)] transition-all duration-300 rounded-[0.35vw]"
                    style={{
                      width: isWide ? "min(84%, 84vh)" : `calc(min(76vh, 76%) * ${activeFrame.aspect})`,
                      height: isWide ? `calc(min(84%, 84vh) / ${activeFrame.aspect})` : "min(76vh, 76%)",
                      maxHeight: "82%",
                      maxWidth: "88%",
                    }}
                  >
                    {/* Viewfinder corner brackets */}
                    <div className="absolute -top-[2px] -left-[2px] w-[0.8vw] h-[0.8vw] border-t-2 border-l-2 border-[#EC5137]" />
                    <div className="absolute -top-[2px] -right-[2px] w-[0.8vw] h-[0.8vw] border-t-2 border-r-2 border-[#EC5137]" />
                    <div className="absolute -bottom-[2px] -left-[2px] w-[0.8vw] h-[0.8vw] border-b-2 border-l-2 border-[#EC5137]" />
                    <div className="absolute -bottom-[2px] -right-[2px] w-[0.8vw] h-[0.8vw] border-b-2 border-r-2 border-[#EC5137]" />

                    {/* Viewfinder ratio tag */}
                    <div className="absolute top-[0.45vw] left-[0.55vw] bg-black/60 text-white text-[0.68vw] font-mono font-medium px-[0.45vw] py-[0.18vw] rounded backdrop-blur-xs select-none">
                      {activeFrame.ratio} {activeFrame.label ? `• ${activeFrame.label}` : ""}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Save Current Angle Floating Button */}
            {activeLeftTab === "camera" && (
              <div className="absolute bottom-[1.2vw] right-[1.2vw] z-30 pointer-events-auto">
                <button
                  type="button"
                  onClick={async () => {
                    const activeFrame = CAMERA_FRAME_OPTIONS.find((f) => f.id === selectedFrameId || f.id === selectedFrameId?.replace(/_[a-c]$/, ''));
                    const snapUrl = await handleCaptureSnapshot({
                      bgType: cameraBgType,
                      solidColor: cameraBgColor,
                      bgOpacity: cameraBgOpacity,
                      aspectRatio: activeFrame?.aspect || null
                    });
                    if (snapUrl) {
                      setSavedCameraAngles((prev) => [
                        ...prev,
                        {
                          id: 'snap_' + Date.now(),
                          title: activeFrame?.ratio ? `${activeFrame.ratio} Angle` : `Angle ${prev.length + 1}`,
                          dataUrl: snapUrl,
                        },
                      ]);
                    }
                  }}
                  className="flex items-center gap-[0.55vw] px-[1.1vw] py-[0.58vw] bg-[#17202C] hover:bg-[#253243] text-white rounded-[0.5vw] shadow-lg border border-[#17202C] text-[0.8vw] font-semibold transition-all cursor-pointer active:scale-95 group"
                >
                  <Icon icon="hugeicons:tick-02" className="w-[1.15vw] h-[1.15vw] text-white group-hover:scale-110 transition-transform" />
                  <span>Save Current Angle</span>
                </button>
              </div>
            )}

            <ThreedCanvasViewport
              models={models}
              isPlacingHotspot={isPlacingHotspot}
              navMode={navMode}
              isSyncing={isSyncing}
              handleCanvasPointerDown={handleCanvasPointerDown}
              handlePointerMissed={handlePointerMissed}
              glInstanceRef={glInstanceRef}
              cameraInstanceRef={cameraInstanceRef}
              sceneInstanceRef={sceneInstanceRef}
              isCapturing={isCapturing}
              materialSettings={materialSettings}
              sceneWrapperRef={sceneWrapperRef}
              modelRef={modelRef}
              modelRefs={modelRefs}
              settings={settings}
              xrayMode={xrayMode}
              xrayMaterials={xrayMaterials}
              handleSetModelStats={handleSetModelStats}
              handleSetMaterialList={handleSetMaterialList}
              selectedMaterial={selectedMaterial}
              handleSelectMaterial={handleSelectMaterial}
              hotspots={hotspots}
              activeHotspotId={activeHotspotId}
              transformMode={activeLeftTab === "camera" ? null : transformMode}
              rootTransform={rootTransform}
              transformValues={transformValues}
              meshTransformsState={meshTransformsState}
              customizedMaterials={customizedMaterials}
              hiddenMaterials={hiddenMaterials}
              deletedMaterials={deletedMaterials}
              handleMaterialSync={handleMaterialSync}
              selectedTexture={selectedTexture}
              resetKey={resetKey}
              sceneResetTrigger={sceneResetTrigger}
              uvUnwrapTrigger={uvUnwrapTrigger}
              handleTextureApplied={handleTextureApplied}
              handleTextureIdentified={handleTextureIdentified}
              handleTransformStart={handleTransformStart}
              handleTransformEnd={handleTransformEnd}
              handleTransformChange={handleTransformChange}
              handleModelReady={handleModelReady}
              handleModelProgress={handleModelProgress}
              isAnimationPlaying={isAnimationPlaying}
              handleHasAnimationsChange={handleHasAnimationsChange}
              showGridLines={showGridLines}
              showAxis={showAxis}
              lastHotspotClickTimeRef={lastHotspotClickTimeRef}
              isHotspotFocusingRef={isHotspotFocusingRef}
              canvasPointerDownPosRef={canvasPointerDownPosRef}
              setSelectedMaterial={setSelectedMaterial}
              controlsRef={controlsRef}
              autoRotate={autoRotate}
              autoRotateSpeed={autoRotateSpeed}
              autoRotateAxis={autoRotateAxis}
              autoRotateRange={autoRotateRange}
              handleControlsChange={handleControlsChange}
              isTextureOpen={isTextureOpen}
              showHotspotModal={showHotspotModal}
              handleHotspotClick={handleHotspotClick}
              handleDeleteHotspot={handleDeleteHotspot}
              setEditingHotspot={setEditingHotspot}
              setShowHotspotModal={setShowHotspotModal}
              setIsPlacingHotspot={setIsPlacingHotspot}
              isPlacingHotspotRef={isPlacingHotspotRef}
              activeLeftTab={activeLeftTab}
              cameraBgType={cameraBgType}
              cameraBgColor={cameraBgColor}
            />
          </div>

          {/* Camera Saved Angles Bottom Tray */}
          {activeLeftTab === "camera" && (
            <CameraBottomTray
              snapshots={savedCameraAngles}
              onDeleteSnapshot={(id) => {
                setSavedCameraAngles((prev) => prev.filter((s) => s.id !== id));
              }}
              onRenameSnapshot={(id, newTitle) => {
                setSavedCameraAngles((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
                );
              }}
              modelName={modelName}
            />
          )}

          {/* Bottom Material / Texture Gallery Swatches */}
          <BottomGalleryTray
            isVisible={activeLeftTab === "textures"}
            onSelectTexture={handleSelectTexture}
            selectedTextureId={selectedTextureId}
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
                    useFactorColor: true,
                    lastChangedProp: 'color'
                  };
                  const curSel = stateRef.current.selectedMaterial;
                  const targetKeys = getMaterialTargetKeys(curSel);
                  let nextCustomMap = customizedMaterialsRef.current || {};
                  if (targetKeys.length > 0) {
                    nextCustomMap = { ...nextCustomMap };
                    targetKeys.forEach(tKey => {
                      const prevCustom = nextCustomMap[tKey] || {};
                      nextCustomMap[tKey] = {
                        ...prevCustom,
                        color: next.color,
                        metallic: next.metallic,
                        roughness: next.roughness,
                        normal: next.normal,
                        ao: next.ao,
                        bump: next.bump,
                        emissiveColor: next.emissiveColor,
                        emissiveIntensity: next.emissiveIntensity,
                        useFactorColor: true,
                        ...(prevCustom.maps !== undefined ? { maps: prevCustom.maps } : {}),
                        ...(prevCustom.appliedTexture !== undefined ? { appliedTexture: prevCustom.appliedTexture } : {}),
                      };
                    });

                    customizedMaterialsRef.current = nextCustomMap;
                    setCustomizedMaterials(nextCustomMap);
                  }
                  const snapshot = buildSnapshot({
                    materialSettings: next,
                    customizedMaterials: nextCustomMap
                  });
                  commitHistoryDebounced(snapshot, 500);
                  return { ...next };
                });
              } else {
                handleMaterialUIUpdate('color', colorData);
              }
            }}
            selectedColor={materialSettings?.color}
            onAddMaterialClick={() => setShowAddMaterialModal(true)}
            refreshTrigger={materialRefreshKey}
          />
        </div>

        {/* Right Settings Panel (Model / Materials / Environment / Hotspots) */}
        <div className="w-[23vw] min-w-[305px] max-w-[360px] h-full border-l border-gray-200 bg-white z-40 relative flex flex-col shrink-0">
          <RightPanel
            activeLeftTab={activeLeftTab}
            onOpenMaterialDrawer={() => setIsMaterialDrawerOpen(true)}
            onFileProcess={processFile}
            hasModel={models.length > 0}
            onExport={() => setShowExportModal(true)}
            onCaptureSnapshot={handleCaptureSnapshot}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            autoRotateSpeed={autoRotateSpeed}
            setAutoRotateSpeed={setAutoRotateSpeed}
            autoRotateAxis={autoRotateAxis}
            setAutoRotateAxis={setAutoRotateAxis}
            autoRotateRange={autoRotateRange}
            setAutoRotateRange={setAutoRotateRange}
            showGridLines={showGridLines}
            setShowGridLines={setShowGridLines}
            showAxis={showAxis}
            setShowAxis={setShowAxis}
            xrayMode={xrayMode}
            setXrayMode={setXrayMode}
            xrayMaterials={xrayMaterials}
            onToggleXray={handleToggleXray}
            isLoading={manualLoading}
            materialSettings={materialSettings}
            onUpdateMaterialSetting={handleMaterialUIUpdate}
            activeAccordion={activeAccordion}
            setActiveAccordion={setActiveAccordion}
            transformValues={transformValues}
            onManualTransformChange={handleManualTransformChange}
            onResetTransform={handleResetTransform}
            hotspots={hotspots}
            activeHotspotId={activeHotspotId}
            onHotspotClick={handleHotspotClick}
            onAddHotspot={() => handleOpenAddHotspot()}
            onEditHotspot={(hs) => {
              setEditingHotspot(hs);
              setShowHotspotModal(true);
            }}
            onDeleteHotspot={handleDeleteHotspot}
            selectedMaterial={selectedMaterial}
            onSelectMaterial={handleSelectMaterial}
            materialList={activeMaterialList}
            hiddenMaterials={hiddenMaterials}
            onToggleVisibility={handleToggleVisibility}
            onDeleteMaterial={handleDeleteMaterial}
            onDeleteModel={handleDeleteModel}
            onRenameMaterial={handleRenameMaterial}
            modelName={modelName}
            onResetFactorSettings={() => {
              setMaterialSettings(prev => {
                const preservedEnvMap = prev.customEnvMap || prev.maps?.envMap || null;
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
                  maps: { map: null, normalMap: null, roughnessMap: null, metalnessMap: null, bumpMap: null, aoMap: null, alphaMap: null, ...(preservedEnvMap ? { envMap: preservedEnvMap } : {}) },
                  customEnvMap: preservedEnvMap,
                  useFactorColor: false,
                  lastChangedProp: null
                };

                const curSel = stateRef.current.selectedMaterial;
                const targetKeys = getMaterialTargetKeys(curSel);
                const nextCustomMap = { ...(customizedMaterialsRef.current || {}) };
                targetKeys.forEach(tKey => {
                  delete nextCustomMap[tKey];
                });
                customizedMaterialsRef.current = nextCustomMap;
                setCustomizedMaterials(nextCustomMap);

                commitHistoryNow(buildSnapshot({
                  materialSettings: next,
                  customizedMaterials: nextCustomMap,
                  selectedTexture: null,
                  selectedTextureId: null
                }));
                return { ...next };
              });
              setResetKey(prev => prev + 1);
            }}
            onUvUnwrap={() => setUvUnwrapTrigger(prev => prev + 1)}
            onMapUpload={handleMapUpload}
            selectedTextureId={selectedTextureId}
            onSelectTexture={handleSelectTexture}
            savedHdrs={savedHdrs}
            onDeleteHdr={handleDeleteHdr}
            hasAnimations={hasAnimations}
            isAnimationPlaying={isAnimationPlaying}
            onToggleAnimation={setIsAnimationPlaying}
            onAddClick={() => setShowAddModelModal(true)}
            onGalleryClick={() => setShowModelGalleryModal(true)}
            onClearModel={handleClearModel}
            modelStats={combinedStats}
            cameraPosition={cameraCoordinates}
            onChangeCameraPosition={handleChangeCameraPosition}
            cameraBgType={cameraBgType}
            onChangeCameraBgType={setCameraBgType}
            cameraBgColor={cameraBgColor}
            onChangeCameraBgColor={setCameraBgColor}
            cameraBgOpacity={cameraBgOpacity}
            onChangeCameraBgOpacity={setCameraBgOpacity}
            selectedFrameId={selectedFrameId}
            onSelectFrameId={setSelectedFrameId}
          />
        </div>
      </div>

      {/* Auxiliary Modals */}
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
          loadedModels={models}
          onClearModel={handleClearModel}
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

      {showHotspotModal && (
        <HotspotModal
          isOpen={showHotspotModal}
          onClose={() => {
            setShowHotspotModal(false);
            setEditingHotspot(null);
          }}
          onSave={handleSaveHotspot}
          initialData={editingHotspot}
          selectedMesh={selectedMaterial}
          nextNumber={hotspots.length + 1}
        />
      )}

      <SaveAsModal
        isOpen={showSaveAsModal}
        onClose={() => setShowSaveAsModal(false)}
        saveAsNameInput={saveAsNameInput}
        setSaveAsNameInput={setSaveAsNameInput}
        onConfirmSaveAs={handleConfirmSaveAs}
      />
    </div>
  );
}