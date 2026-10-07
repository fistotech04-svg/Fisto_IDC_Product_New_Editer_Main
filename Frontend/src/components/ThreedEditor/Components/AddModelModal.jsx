import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { View, OrbitControls, Environment, PerspectiveCamera, Html } from "@react-three/drei";
import axios from "axios";
import RenderModel from "./ModelLoaders";
import AlertModal from "../../AlertModal";
import { useToast } from "../../../components/CustomToast";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";
import { process3DDropEvent } from "../utils/modelDropHandler";

class ThumbnailErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(err) {
        console.warn("[GalleryThumbnail] Model preview error:", err?.message || err);
    }
    render() {
        if (this.state.hasError) {
            return (
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#888888" roughness={0.5} />
                </mesh>
            );
        }
        return this.props.children;
    }
}

// Auto-fit wrapper: dynamically calculates bounding box, centers at (0, 0, 0), and normalizes scale
const AutoFitModel = ({ children, targetSize = 1.9 }) => {
  const groupRef = useRef();
  const [isFitted, setIsFitted] = useState(false);
  const fittedRef = useRef(false);

  const computeFit = useCallback(() => {
    const group = groupRef.current;
    if (!group) return false;

    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);
    group.rotation.set(0, 0, 0);
    group.updateMatrixWorld(true);

    const box = new THREE.Box3();
    let hasMesh = false;

    group.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        if (child.geometry) {
          if (!child.geometry.boundingBox) {
            child.geometry.computeBoundingBox();
          }
          if (child.geometry.boundingBox) {
            const geomBox = child.geometry.boundingBox.clone();
            geomBox.applyMatrix4(child.matrixWorld);
            box.union(geomBox);
            hasMesh = true;
          }
        }
      }
    });

    if (!hasMesh || box.isEmpty()) {
      return false;
    }

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0.0001 && isFinite(maxDim)) {
      const scaleFactor = targetSize / maxDim;
      group.scale.setScalar(scaleFactor);

      const center = new THREE.Vector3();
      box.getCenter(center);
      group.position.set(
        -center.x * scaleFactor,
        -center.y * scaleFactor,
        -center.z * scaleFactor
      );
      group.updateMatrixWorld(true);
      return true;
    }
    return false;
  }, [targetSize]);

  useFrame(() => {
    if (!fittedRef.current) {
      if (computeFit()) {
        fittedRef.current = true;
        setIsFitted(true);
      }
    }
  });

  return (
    <group ref={groupRef} style={{ display: isFitted ? 'block' : 'none' }}>
      {children}
    </group>
  );
};

// Lazy 3D Model Thumbnail Loader with auto-fit and centering
const GalleryThumbnail = React.memo(({ model, fullUrl }) => {
    const [isInView, setIsInView] = useState(false);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);
    const viewRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, { rootMargin: '150px' });

        if (viewRef.current) {
            observer.observe(viewRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    
    // Check if thumbnail exists
    const rawThumbnailUrl = model.thumbnail || model.thumbnailUrl || model.preview || model.previewUrl;
    const fullThumbnailUrl = rawThumbnailUrl ? (
        rawThumbnailUrl.startsWith('http') 
            ? resolveUploadsPath(rawThumbnailUrl)
            : resolveUploadsPath(`${backendUrl.replace(/\/+$/, '')}${rawThumbnailUrl.startsWith('/') ? '' : '/'}${rawThumbnailUrl}`)
    ) : null;

    if (fullThumbnailUrl) {
        return (
            <div className="w-full h-full relative group">
                <img 
                    src={fullThumbnailUrl} 
                    alt={model.name}
                    className="w-full h-full object-contain p-[1vw] transition-transform duration-500 group-hover:scale-110"
                    onLoad={() => setIsFullyLoaded(true)}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        setIsInView(true);
                    }}
                />
                {!isFullyLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-500/10">
                        <div className="w-[1vw] h-[1vw] border-[0.15vw] border-gray-200 border-t-[#ea543a] rounded-full animate-spin" />
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div ref={viewRef} className="w-full h-full relative group bg-gray-500">
            {isInView ? (
                <Canvas style={{ width: '100%', height: '100%', background: 'transparent' }} camera={{ fov: 32, position: [2.8, 2.0, 3.2] }}>
                    <Suspense fallback={
                        <Html center className="pointer-events-none">
                            <div className="flex flex-col items-center justify-center gap-[0.5vw]">
                                <div className="w-[1.4vw] h-[1.4vw] border-[0.2vw] border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="text-[0.6vw] font-medium text-white/80">Loading...</span>
                            </div>
                        </Html>
                    }>
                        <ambientLight intensity={1.6} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} />
                        <directionalLight position={[-5, 5, 5]} intensity={1} />
                        
                        <AutoFitModel targetSize={1.9}>
                            <ThumbnailErrorBoundary>
                                <RenderModel
                                    type={model.type}
                                    url={fullUrl}
                                    isSelectionDisabled={true}
                                    shouldClone={true}
                                />
                            </ThumbnailErrorBoundary>
                        </AutoFitModel>
                        
                        <Environment preset="studio" />
                        
                        <OrbitControls 
                            enableZoom={false} 
                            enablePan={false} 
                            enableRotate={false}
                            target={[0, 0, 0]}
                            autoRotate={false}
                        />
                    </Suspense>
                </Canvas>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                     <Icon icon="ph:sketch-logo-thin" className="w-[2vw] h-[2vw] text-gray-400 opacity-30" />
                </div>
            )}
        </div>
    );
});

export default function AddModelModal({
    isOpen,
    onClose,
    onAdd,
    onSelectModel,
    loadedModels = [],
    hideDelete = false
}) {
    const [modalTab, setModalTab] = useState("gallery"); // 'gallery' | 'upload'
    const [models, setModels] = useState([]);
    const [defaultModels, setDefaultModels] = useState([]);
    const [activeTab, setActiveTab] = useState("all"); // 'all' | 'my' | 'default'
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedForDeletion, setSelectedForDeletion] = useState([]);
    const toast = useToast();
    const containerRef = useRef();

    // Upload state
    const [isDragging, setIsDragging] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [isPackaging, setIsPackaging] = useState(false);

    const validExtensions = ['glb', 'gltf', 'obj', 'fbx', 'stl', 'step', 'stp', '3ds', 'lwo', 'low', 'iges', 'igs', 'zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2'];

    // Guard alerts for currently-in-use model
    const [inUseReplaceAlert, setInUseReplaceAlert] = useState(null);
    const [inUseDeleteAlert, setInUseDeleteAlert] = useState(null);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, data: null });

    // Derive a Set of name keys that are currently loaded in the editor
    const loadedModelNames = useMemo(() =>
        new Set((loadedModels || []).map(m => (m.name || '').replace(/\.[^/.]+$/, '').toLowerCase())),
        [loadedModels]
    );

    const isModelInUse = useCallback((model) => {
        if (!model) return false;
        const galleryName = (model.name || '').replace(/\.[^/.]+$/, '').toLowerCase();
        const galleryId = model.modelId ? String(model.modelId) : (model.id ? String(model.id) : null);

        if (loadedModels && loadedModels.length > 0) {
            return loadedModels.some(m => {
                const mName = (m.name || '').replace(/\.[^/.]+$/, '').toLowerCase();
                const mId = m.modelId ? String(m.modelId) : (m.id ? String(m.id) : null);
                if (galleryId && mId && galleryId === mId) return true;
                if (galleryName && mName && galleryName === mName) return true;
                return false;
            });
        }

        return loadedModelNames.has(galleryName);
    }, [loadedModels, loadedModelNames]);

    useEffect(() => {
        if (isOpen) {
            fetchModels();
        }
    }, [isOpen]);

    const fetchModels = async () => {
        try {
            setLoading(true);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const storedUser = localStorage.getItem('user');
            
            const promises = [
                axios.get(`${backendUrl}/api/presets/models`).catch(() => ({ data: { models: [] } }))
            ];
            
            if (storedUser) {
                const user = JSON.parse(storedUser);
                promises.push(
                    axios.get(`${backendUrl}/api/3d-models/get-models`, {
                        params: { emailId: user.emailId }
                    }).catch(() => ({ data: { models: [] } }))
                );
            }

            const [presetRes, userRes] = await Promise.all(promises);

            const fetchedDefaults = (presetRes.data?.models || []).map(m => ({
                ...m,
                isDefault: true,
                modelId: m.id || m.modelId
            }));
            setDefaultModels(fetchedDefaults);

            const userModels = (userRes?.data?.models || []).map(m => ({
                ...m,
                isDefault: false
            }));
            setModels(userModels);
        } catch (error) {
            console.error("Failed to fetch models:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFile = async (source) => {
        if (!source) return;
        let fileToProcess = source;

        if (source instanceof FileList) {
            if (source.length === 0) return;
            if (source.length > 1) {
                try {
                    setIsPackaging(true);
                    const dropResult = await process3DDropEvent(source);
                    setIsPackaging(false);
                    if (dropResult?.file) {
                        onAdd && onAdd(dropResult.file);
                        onClose();
                        return;
                    }
                } catch (err) {
                    setIsPackaging(false);
                    console.error("Multi-file package notice:", err);
                }
            }
            fileToProcess = source[0];
        }

        const ext = fileToProcess.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(ext)) {
            setErrorModal({
                isOpen: true,
                message: `The file format ".${ext}" is not supported. Please upload one of the following: ${validExtensions.join(', ').toUpperCase()}`
            });
            return;
        }

        onAdd && onAdd(fileToProcess);
        onClose();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        try {
            setIsPackaging(true);
            const dropResult = await process3DDropEvent(e.dataTransfer);
            setIsPackaging(false);
            if (dropResult && dropResult.file) {
                onAdd && onAdd(dropResult.file);
                onClose();
            }
        } catch (err) {
            setIsPackaging(false);
            console.error("Add model drop error:", err);
            const file = e.dataTransfer.files?.[0];
            if (file) {
                handleFile(file);
            } else {
                setErrorModal({
                    isOpen: true,
                    message: err.message || "Failed to process dropped folder or file."
                });
            }
        }
    };

    const allCombinedModels = useMemo(() => {
        if (activeTab === "default") return defaultModels;
        if (activeTab === "my") return models;
        return [...defaultModels, ...models];
    }, [activeTab, defaultModels, models]);

    const filteredModels = useMemo(() => {
        return allCombinedModels.filter(m => 
            (m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             m.category?.toLowerCase().includes(searchQuery.toLowerCase())) && 
            (m.type?.toLowerCase() === 'glb' || m.url?.toLowerCase().endsWith('.glb'))
        );
    }, [allCombinedModels, searchQuery]);

    const handleAddModelClick = () => {
        if (!selectedModel) return;
        if (typeof onSelectModel === 'function') {
            onSelectModel(selectedModel);
            onClose();
        }
    };

    const handleDeleteModel = async (model) => {
        const userStr = localStorage.getItem('user');
        if (!userStr || !model) {
            console.warn("Cannot delete: User session or model data missing");
            return;
        }
        const user = JSON.parse(userStr);
        
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            await axios.delete(`${backendUrl}/api/3d-models/delete-model/${model.modelId}`, {
                data: { emailId: user.emailId }
            });
            
            setModels(prev => prev.filter(m => m.modelId !== model.modelId));
            if (selectedModel?.modelId === model.modelId) {
                setSelectedModel(null);
            }
            setSelectedForDeletion(prev => prev.filter(m => m.modelId !== model.modelId));
            toast.success("Model deleted successfully");
        } catch (error) {
            console.error("Failed to delete model:", error);
            toast.error("Failed to delete model");
        }
    };

    const handleDeleteMultiple = async () => {
        const userStr = localStorage.getItem('user');
        if (!userStr || selectedForDeletion.length === 0) return;
        const user = JSON.parse(userStr);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const idsToDelete = selectedForDeletion.map(m => m.modelId);
            
            await axios.post(`${backendUrl}/api/3d-models/delete-multiple-models`, {
                modelIds: idsToDelete,
                emailId: user.emailId
            });

            setModels(prev => prev.filter(m => !idsToDelete.includes(m.modelId)));
            if (selectedModel && idsToDelete.includes(selectedModel.modelId)) {
                setSelectedModel(null);
            }
            setSelectedForDeletion([]);
            setAlertConfig({ isOpen: false, data: null });
            toast.success(`${idsToDelete.length} models deleted successfully`);
        } catch (error) {
            console.error("Failed to delete models:", error);
            toast.error("Failed to delete models");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-[2vw]">
            <div 
                ref={containerRef}
                className="bg-white rounded-[1.25vw] w-[72vw] max-w-[1200px] h-[85vh] max-h-[820px] shadow-2xl relative border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Top Main Navigation Bar */}
                <div className="px-[1.8vw] pt-[1.4vw] pb-[0.9vw] border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                    <div className="flex items-center gap-[1.5vw]">
                        <div>
                            <h2 className="text-[1.3vw] font-bold text-gray-900 tracking-tight flex items-center gap-[0.5vw]">
                                <span>Add 3D Model</span>
                            </h2>
                            <p className="text-[0.72vw] text-gray-400 font-medium mt-[0.1vw]">
                                Choose from existing library presets or upload custom 3D files to your scene
                            </p>
                        </div>

                        {/* Top Mode Segmented Switcher */}
                        <div className="flex items-center bg-gray-100/90 p-[0.25vw] rounded-[0.6vw] border border-gray-200/70">
                            <button
                                type="button"
                                onClick={() => setModalTab("gallery")}
                                className={`flex items-center gap-[0.45vw] px-[1vw] py-[0.4vw] rounded-[0.45vw] text-[0.78vw] font-bold transition-all cursor-pointer ${
                                    modalTab === "gallery"
                                        ? "bg-white text-[#ea543a] shadow-xs"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Icon icon="solar:gallery-wide-bold" className="w-[1vw] h-[1vw]" />
                                <span>Predefined & Gallery ({defaultModels.length + models.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setModalTab("upload")}
                                className={`flex items-center gap-[0.45vw] px-[1vw] py-[0.4vw] rounded-[0.45vw] text-[0.78vw] font-bold transition-all cursor-pointer ${
                                    modalTab === "upload"
                                        ? "bg-white text-[#ea543a] shadow-xs"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Icon icon="solar:upload-track-2-bold" className="w-[1vw] h-[1vw]" />
                                <span>Upload File / Folder</span>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-[2.2vw] h-[2.2vw] rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Close"
                    >
                        <Icon icon="ic:round-close" width="1.4vw" height="1.4vw" />
                    </button>
                </div>

                {/* Main Content Body */}
                {modalTab === "gallery" ? (
                    <div className="flex flex-col flex-1 overflow-hidden min-h-0 bg-[#fafafa]">
                        {/* Subheader: Category filters, Search, Bulk Actions */}
                        <div className="px-[1.8vw] py-[0.9vw] bg-white border-b border-gray-100 flex items-center justify-between gap-[1vw] shrink-0">
                            {/* Filter Tabs */}
                            <div className="flex items-center bg-gray-100 p-[0.2vw] rounded-full text-[0.75vw] font-semibold">
                                <button
                                    onClick={() => setActiveTab("all")}
                                    className={`px-[0.85vw] py-[0.3vw] rounded-full transition-all cursor-pointer ${
                                        activeTab === "all" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
                                    }`}
                                >
                                    All ({defaultModels.length + models.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("default")}
                                    className={`px-[0.85vw] py-[0.3vw] rounded-full transition-all cursor-pointer ${
                                        activeTab === "default" ? "bg-white text-[#ea543a] shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
                                    }`}
                                >
                                    Default Presets ({defaultModels.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("my")}
                                    className={`px-[0.85vw] py-[0.3vw] rounded-full transition-all cursor-pointer ${
                                        activeTab === "my" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
                                    }`}
                                >
                                    My Models ({models.length})
                                </button>
                            </div>

                            {/* Search and Action Buttons */}
                            <div className="flex items-center gap-[0.75vw]">
                                <div className="relative">
                                    <Icon icon="solar:magnifer-linear" className="absolute left-[0.75vw] top-1/2 -translate-y-1/2 w-[0.9vw] h-[0.9vw] text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Search models..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-[2.2vw] pr-[1vw] py-[0.35vw] bg-gray-50 border border-gray-200 rounded-full text-[0.78vw] focus:outline-none focus:border-[#ea543a] focus:bg-white w-[14vw] transition-all"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <Icon icon="ic:round-close" className="w-[0.8vw] h-[0.8vw]" />
                                        </button>
                                    )}
                                </div>

                                {selectedForDeletion.length > 0 && !hideDelete && (
                                    <button 
                                        onClick={() => {
                                            const inUseAny = selectedForDeletion.some(m => isModelInUse(m));
                                            if (inUseAny) {
                                                const firstInUse = selectedForDeletion.find(m => isModelInUse(m));
                                                setInUseDeleteAlert({ model: firstInUse });
                                            } else {
                                                setAlertConfig({ isOpen: true, isMultiple: true });
                                            }
                                        }}
                                        className="flex items-center gap-[0.4vw] px-[0.9vw] py-[0.4vw] bg-red-500 text-white rounded-full text-[0.75vw] font-bold hover:bg-red-600 transition-all cursor-pointer shadow-sm"
                                    >
                                        <Icon icon="solar:trash-bin-trash-bold" className="w-[0.9vw] h-[0.9vw]" />
                                        Delete Selected ({selectedForDeletion.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Grid container */}
                        <div className="flex-1 overflow-y-auto p-[1.5vw] custom-scrollbar">
                            {loading ? (
                                <div className="grid grid-cols-4 gap-[1.2vw]">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="aspect-square bg-gray-200/70 rounded-[0.8vw] animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredModels.length > 0 ? (
                                <div className="grid grid-cols-4 gap-[1.2vw]">
                                    {filteredModels.map((model) => {
                                        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                                        const rawUrl = (model.url && (model.url.startsWith('http://') || model.url.startsWith('https://'))) 
                                            ? model.url 
                                            : `${backendUrl}${model.url?.startsWith('/') ? '' : '/'}${model.url}`;
                                        const fullUrl = resolveUploadsPath(rawUrl);
                                        const isSelected = (selectedModel?.modelId && selectedModel.modelId === model.modelId) || (selectedModel?.id && selectedModel.id === model.id);
                                        const inUse = isModelInUse(model);

                                        return (
                                            <div 
                                                key={model.modelId || model.id || model.name}
                                                onClick={() => setSelectedModel(model)}
                                                onDoubleClick={() => {
                                                    setSelectedModel(model);
                                                    if (typeof onSelectModel === 'function') {
                                                        onSelectModel(model);
                                                        onClose();
                                                    }
                                                }}
                                                className={`group relative bg-white rounded-[0.9vw] p-[0.7vw] border-2 transition-all cursor-pointer flex flex-col gap-[0.5vw] hover:shadow-md ${
                                                    isSelected 
                                                        ? 'border-[#ea543a] ring-2 ring-[#ea543a]/20 shadow-md' 
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                {/* 3D Preview Frame */}
                                                <div className="w-full aspect-[4/3] rounded-[0.6vw] overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200/70 relative">
                                                    <GalleryThumbnail model={model} fullUrl={fullUrl} />

                                                    {/* Top Badges */}
                                                    <div className="absolute top-[0.4vw] left-[0.4vw] flex items-center gap-[0.3vw] z-10">
                                                        <span className="px-[0.4vw] py-[0.15vw] bg-white/95 backdrop-blur-md rounded-[0.3vw] text-[0.6vw] font-bold text-gray-700 uppercase shadow-xs">
                                                            {model.type?.replace('.', '') || 'GLB'}
                                                        </span>
                                                        {model.isDefault && (
                                                            <span className="px-[0.4vw] py-[0.15vw] bg-[#ea543a] text-white rounded-[0.3vw] text-[0.55vw] font-bold uppercase shadow-xs">
                                                                Preset
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Delete Icon for user-uploaded models */}
                                                    {!hideDelete && !model.isDefault && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (inUse) {
                                                                    setInUseDeleteAlert({ model });
                                                                } else {
                                                                    setAlertConfig({ isOpen: true, data: model, isMultiple: false });
                                                                }
                                                            }}
                                                            className="absolute top-[0.4vw] right-[0.4vw] w-[1.6vw] h-[1.6vw] cursor-pointer bg-white/95 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-all z-10 shadow-sm opacity-0 group-hover:opacity-100"
                                                            title="Delete Model"
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-bold" width="0.85vw" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Card Meta */}
                                                <div className="px-[0.2vw] flex items-center justify-between gap-[0.5vw]">
                                                    <p 
                                                        className="text-[0.78vw] font-bold text-gray-800 truncate flex-1 min-w-0"
                                                        title={model.name?.replace(/\.[^/.]+$/, "")}
                                                    >
                                                        {model.name?.replace(/\.[^/.]+$/, "")}
                                                    </p>
                                                    <div className="flex items-center gap-[0.3vw] shrink-0">
                                                        {inUse && (
                                                            <span className="text-[0.55vw] font-bold uppercase px-[0.4vw] py-[0.1vw] bg-green-100 text-green-700 rounded-full border border-green-200">
                                                                In Scene
                                                            </span>
                                                        )}
                                                        {model.size && (
                                                            <span className="text-[0.65vw] text-gray-400 font-medium">
                                                                {model.size}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-[6vw] bg-white rounded-[1vw] border border-dashed border-gray-200 text-center">
                                    <div className="p-[1.2vw] bg-gray-100 rounded-full mb-[0.8vw] text-gray-400">
                                        <Icon icon="solar:box-minimalistic-linear" width="2.5vw" height="2.5vw" />
                                    </div>
                                    <p className="text-[1.1vw] font-bold text-gray-800">No 3D Models Found</p>
                                    <p className="text-[0.75vw] text-gray-400 mt-[0.2vw] max-w-sm">
                                        {searchQuery ? "Try refining your search filter." : "Switch to the Upload tab to add new 3D models."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Gallery Bottom Footer */}
                        <div className="px-[1.8vw] py-[0.9vw] bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
                            <div className="text-[0.75vw] text-gray-500 font-medium">
                                {selectedModel ? (
                                    <span>Selected: <strong className="text-gray-900 font-bold">{selectedModel.name?.replace(/\.[^/.]+$/, "")}</strong></span>
                                ) : (
                                    <span>Select any predefined model or custom model to add into the scene</span>
                                )}
                            </div>

                            <div className="flex items-center gap-[0.75vw]">
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="px-[1.2vw] py-[0.5vw] border border-gray-300 rounded-[0.45vw] text-[0.8vw] font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button"
                                    disabled={!selectedModel}
                                    onClick={handleAddModelClick}
                                    className={`flex items-center gap-[0.45vw] px-[1.6vw] py-[0.5vw] rounded-[0.45vw] text-[0.8vw] font-bold shadow-sm transition-all cursor-pointer ${
                                        selectedModel 
                                            ? 'bg-[#ea543a] text-white hover:bg-[#d9442a] shadow-xs active:scale-95' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <Icon icon="solar:add-circle-bold" className="w-[0.95vw] h-[0.95vw]" />
                                    <span>Add Model to Scene</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Direct Upload Mode */
                    <div className="flex flex-col flex-1 p-[2vw] overflow-y-auto bg-gray-50/50 justify-center items-center">
                        <div className="w-full max-w-[650px] flex flex-col">
                            {/* Upload Area */}
                            <div 
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-[1.2vw] p-[3vw] flex flex-col items-center justify-center transition-all cursor-pointer select-none bg-white shadow-xs ${
                                    isDragging ? 'border-[#ea543a] bg-[#ea543a]/5 scale-[1.01]' : 'border-gray-300 hover:border-[#ea543a] hover:bg-white'
                                }`}
                                onClick={() => document.getElementById('add-model-input-unified').click()}
                            >
                                <input 
                                    type="file" 
                                    id="add-model-input-unified" 
                                    className="hidden" 
                                    multiple
                                    onChange={(e) => handleFile(e.target.files)}
                                    accept=".glb,.gltf,.obj,.fbx,.stl,.step,.stp,.3ds,.lwo,.low,.iges,.igs,.zip,.rar,.7z,.tar,.gz,.tgz,.bz2"
                                />
                                
                                <div className="w-[4vw] h-[4vw] rounded-full bg-orange-50 flex items-center justify-center mb-[1.2vw] text-[#ea543a]">
                                    <Icon icon="solar:upload-linear" width="2.2vw" height="2.2vw" />
                                </div>

                                <div className="text-[1.05vw] font-bold text-gray-800 tracking-tight transition-colors mb-[0.4vw]">
                                    {isDragging ? (
                                        <span className="text-[#ea543a] font-bold">Drop File or Folder to Upload</span>
                                    ) : isPackaging ? (
                                        <span className="text-[#ea543a] font-bold animate-pulse">Packaging Folder with Textures...</span>
                                    ) : (
                                        <>Drag & Drop File / Folder or <span className="text-[#ea543a] underline underline-offset-4">Browse</span></>
                                    )}
                                </div>

                                <p className="text-[0.78vw] text-gray-500 font-medium mb-[1.5vw] text-center max-w-sm">
                                    Upload standard 3D file formats, folders with textures, or CAD geometry to add to your current scene.
                                </p>

                                <div className="text-[0.65vw] text-gray-400 font-semibold tracking-wide text-center bg-gray-50 px-[1vw] py-[0.4vw] rounded-full border border-gray-200/80">
                                    Supported Formats: <span className="uppercase text-gray-600 font-bold">{validExtensions.join(', ')}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-[1.5vw]">
                                <button 
                                    type="button"
                                    onClick={() => setModalTab("gallery")}
                                    className="flex items-center gap-[0.4vw] text-[0.8vw] font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                                >
                                    <Icon icon="heroicons:arrow-left-20-solid" className="w-[0.9vw] h-[0.9vw]" />
                                    <span>Back to Predefined Gallery</span>
                                </button>

                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="px-[1.2vw] py-[0.5vw] border border-gray-300 rounded-[0.45vw] text-[0.8vw] font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alerts */}
                <AlertModal
                    isOpen={errorModal.isOpen}
                    onClose={() => setErrorModal({ isOpen: false, message: '' })}
                    type="error"
                    title="Invalid File Format"
                    message={errorModal.message}
                    confirmText="Got it"
                />

                <AlertModal
                    isOpen={alertConfig.isOpen}
                    onClose={() => setAlertConfig({ isOpen: false, data: null })}
                    onConfirm={alertConfig.isMultiple ? handleDeleteMultiple : () => {
                        if (alertConfig.data) handleDeleteModel(alertConfig.data);
                        setAlertConfig({ isOpen: false, data: null });
                    }}
                    type="warning"
                    title="Delete 3D Model"
                    message={alertConfig.isMultiple
                        ? `Are you sure you want to permanently delete these ${selectedForDeletion.length} models?`
                        : `Are you sure you want to delete "${alertConfig.data?.name?.replace(/\.[^/.]+$/, "")}"? This cannot be undone.`
                    }
                    confirmText="Delete"
                    cancelText="Cancel"
                />

                <AlertModal
                    isOpen={!!inUseDeleteAlert}
                    onClose={() => setInUseDeleteAlert(null)}
                    type="warning"
                    title="Model In Use"
                    message={`"${inUseDeleteAlert?.model?.name?.replace(/\.[^/.]+$/, '')}" is currently loaded in your active 3D scene.`}
                    confirmText="Understood"
                />
            </div>
        </div>
    );
}
