import React, { useState, useEffect, useRef, Suspense } from "react";
import { Icon } from "@iconify/react";
import { Canvas } from "@react-three/fiber";
import { View, OrbitControls, Environment, PerspectiveCamera, Html } from "@react-three/drei";
import axios from "axios";
import RenderModel from "./ModelLoaders";
import AlertModal from "../../AlertModal";
import { useToast } from "../../../components/CustomToast";

// Internal component for 3D thumbnail with support for static images
const ModelThumbnail = React.memo(({ model }) => {
    const viewRef = useRef();
    const [isInView, setIsInView] = useState(false);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    
    // Support for static thumbnails if backend provides them
    const thumbnailPath = model.thumbnail || model.image || model.preview;
    const fullThumbnailUrl = thumbnailPath 
        ? (thumbnailPath.startsWith('http') ? thumbnailPath : `${backendUrl}${thumbnailPath.startsWith('/') ? '' : '/'}${thumbnailPath}`)
        : null;

    const modelUrlPath = model.url?.startsWith('/') ? model.url : `/${model.url || ''}`;
    const fullUrl = `${backendUrl}${modelUrlPath}`;

    useEffect(() => {
        if (!viewRef.current || fullThumbnailUrl) return;
        
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );
        
        observer.observe(viewRef.current);
        return () => observer.disconnect();
    }, [fullThumbnailUrl, fullUrl]);

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
                        <div className="w-[1vw] h-[1vw] border-[0.15vw] border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div ref={viewRef} className="w-full h-full relative group bg-gray-500">
            {isInView ? (
                <View track={viewRef} className="w-full h-full">
                    <Suspense fallback={
                        <Html center className="pointer-events-none">
                            <div className="flex flex-col items-center justify-center gap-[0.5vw]">
                                <div className="w-[1.4vw] h-[1.4vw] border-[0.2vw] border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="text-[0.6vw] font-medium text-white/80">Loading...</span>
                            </div>
                        </Html>
                    }>
                        <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={35} />
                        <ambientLight intensity={1.5} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} />
                        <directionalLight position={[-5, 5, 5]} intensity={1} />
                        
                        <group position={[0, -0.6, 0]}>
                            <RenderModel
                                type={model.type}
                                url={fullUrl}
                                isSelectionDisabled={true}
                                shouldClone={true}
                            />
                        </group>
                        
                        <Environment preset="city" />
                        
                        <OrbitControls 
                            enableZoom={false} 
                            enablePan={false}
                            enableRotate={false}
                            target={[0, 0, 0]}
                            autoRotate={false}
                        />
                    </Suspense>
                </View>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                     <Icon icon="ph:sketch-logo-thin" className="w-[2vw] h-[2vw] text-gray-400 opacity-30" />
                </div>
            )}
        </div>
    );
});

export default function ModelGalleryModal({ isOpen, onClose, onSelectModel }) {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModel, setSelectedModel] = useState(null);
    const toast = useToast();
    
    // Context menu states
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    // Alert states
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, data: null });

    useEffect(() => {
        if (isOpen) {
            fetchModels();
        }
    }, [isOpen]);

    const fetchModels = async () => {
        try {
            setLoading(true);
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const response = await axios.get(`${backendUrl}/api/3d-models/get-models`, {
                    params: { emailId: user.emailId }
                });
                setModels(response.data.models || []);
            }
        } catch (error) {
            console.error("Failed to fetch models:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredModels = models.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleReplaceClick = () => {
        if (selectedModel) {
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
            const email = encodeURIComponent(user.emailId);
            const deleteUrl = `${backendUrl}/api/3d-models/delete-model/${email}/${model.modelId}`;
            
            console.log("Attempting to delete model:", model.name);
            console.log(`Target User: ${user.emailId}, ID: ${model.modelId}`);
            console.log(`Action URL: ${deleteUrl}`);

            const response = await axios.delete(deleteUrl);
            
            console.log("Delete response:", response.data);
            toast.success("Model deleted from gallery and database");
            
            // Refresh local list
            fetchModels();
            if (selectedModel?.name === model.name) setSelectedModel(null);
            
        } catch (error) {
            console.error("Delete operation failed!");
            console.error("Context:", { 
                email: user.emailId,
                modelId: model.modelId,
                status: error.response?.status,
                data: error.response?.data 
            });
            toast.error("Failed to delete model from database");
        } finally {
            setAlertConfig({ isOpen: false, data: null });
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuOpenId && !e.target.closest('.context-menu-body')) {
                setMenuOpenId(null);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpenId]);

    const containerRef = useRef();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white w-[70vw] h-[40vw] rounded-[0.75vw] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header Section */}
                <div className="p-[1.5vw] pb-[1vw] flex items-start justify-between">
                    <div>
                        <h2 className="text-[1.35vw] font-bold text-gray-800 tracking-tight">3D Model Gallery</h2>
                        <p className="text-[0.75vw] text-gray-500 mt-[0.2vw] font-medium">Select a professional popup design to get start</p>
                    </div>
                    <div className="flex items-center gap-[0.75vw] pt-[0.25vw]">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Icon 
                                icon="bitcoin-icons:search-outline" 
                                className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 w-[1.1vw] h-[1.1vw]" 
                            />
                            <input 
                                type="text" 
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-[2.2vw] pr-[1vw] py-[0.5vw] w-[20vw] bg-white border border-gray-300 rounded-full text-[0.8vw] focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        {/* Filter Button */}
                        <button className="flex items-center gap-[0.4vw] px-[1vw] py-[0.5vw] border border-gray-300 rounded-full text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-all">
                            <Icon icon="mi:filter" className="w-[1vw] h-[1vw]" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 mx-[1.5vw]"></div>

                {/* Main Content Area */}
                <div ref={containerRef} className="flex-1 overflow-y-auto px-[1.5vw] py-[1.2vw] custom-scrollbar relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-[10vw]">
                            <div className="w-[2.1vw] h-[2.1vw] border-[0.3vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-[1vw] text-gray-500 font-medium">Fetching Models...</p>
                        </div>
                    ) : filteredModels.length > 0 ? (
                        <div className="grid grid-cols-5 gap-[1.2vw] pb-[2vw]">
                            {filteredModels.map((model, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedModel(model)}
                                    className={`group cursor-pointer flex flex-col gap-[0.5vw] transition-all`}
                                >
                                    <div className={`relative w-full aspect-square rounded-[0.7vw] bg-gray-500 flex items-center justify-center border-2 transition-all overflow-hidden ${
                                        selectedModel?.name === model?.name
                                            ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' 
                                            : 'border-transparent hover:border-gray-200'
                                    }`}>
                                        {/* Live 3D View as Thumbnail */}
                                        <div className="w-full h-full">
                                            <ModelThumbnail 
                                                model={model} 
                                            />
                                        </div>

                                        {/* Status / Type Badge */}
                                        <div 
                                            className="absolute top-[0.4vw] left-[0.4vw] px-[0.5vw] py-[0.2vw] bg-white/95 backdrop-blur-md rounded-[0.3vw] shadow-sm border border-gray-200 flex items-center justify-center"
                                            style={{ zIndex: 130 }}
                                        >
                                            <span className="text-[0.6vw] font-bold text-gray-700 uppercase tracking-wide leading-none">{model.type?.replace('.', '') || '3D'}</span>
                                        </div>

                                        {/* Three Dots Button - Only on Hover */}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setMenuPosition({ x: rect.left, y: rect.top });
                                                setMenuOpenId(model.name);
                                            }}
                                            className={`absolute top-[0.4vw] right-[0.4vw] w-[1.5vw] h-[1.5vw] cursor-pointer bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all z-[140] shadow-md opacity-0 group-hover:opacity-100 ${menuOpenId === model.name ? 'opacity-100' : ''}`}
                                        >
                                            <Icon icon="heroicons:ellipsis-vertical-20-solid" width="1vw" />
                                        </button>
                                    </div>
                                    <div className="px-[0.2vw] flex items-center justify-between gap-[0.5vw] mb-[0.2vw]">
                                        <p 
                                            className="text-[0.8vw] font-semibold text-gray-700 truncate group-hover:text-indigo-600 transition-colors flex-1 min-w-0"
                                            title={model.name.replace(/\.[^/.]+$/, "")}
                                        >
                                            {model.name.replace(/\.[^/.]+$/, "")}
                                        </p>
                                        <span className="text-[0.65vw] text-gray-400 font-medium whitespace-nowrap shrink-0">{model.size}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-[8vw] bg-gray-50/50 rounded-[1vw] border border-dashed border-gray-200 mx-auto">
                             <div className="p-[1.5vw] bg-gray-100 rounded-full mb-[1vw] text-gray-400">
                                 <Icon icon="solar:box-minimalistic-linear" width="3vw" height="3vw" />
                             </div>
                             <p className="text-[1.2vw] font-bold text-gray-800">3D Model not available in your gallery</p>
                             <p className="text-[0.85vw] text-gray-500 mt-[0.2vw]">Please upload a professional 3D model first to see it here</p>
                        </div>
                    )}
                </div>

                {/* Shared Canvas for View.Port */}
                <Canvas 
                    eventSource={containerRef}
                    className="pointer-events-none"
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        width: '100vw', 
                        height: '100vh', 
                        pointerEvents: 'none',
                        zIndex: 120 // Higher than modal 
                    }}
                >
                    <View.Port />
                </Canvas>

                {/* Footer Section */}
                <div className="p-[1.5vw] pt-0 flex items-center justify-end gap-[0.75vw] mt-auto">
                    <button 
                        onClick={onClose}
                        className="flex items-center cursor-pointer gap-[0.5vw] px-[1.5vw] py-[0.6vw] border border-gray-300 rounded-[0.4vw] text-[0.85vw] font-semibold text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        Close
                    </button>
                    <button 
                        disabled={!selectedModel}
                        onClick={handleReplaceClick}
                        className={`flex items-center cursor-pointer gap-[0.5vw] px-[2vw] py-[0.6vw] rounded-[0.4vw] text-[0.85vw] font-semibold shadow-sm transition-all active:scale-95 ${
                            selectedModel 
                                ? 'bg-black text-white hover:bg-zinc-800' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Replace Model
                    </button>
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 0.4vw;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #d1d1d1;
                        border-radius: 1vw;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #a1a1a1;
                    }
                `}</style>
            </div>

            {/* CONTEXT MENU - Absolute within the fixed overlay */}
            {menuOpenId && (
                <div 
                    className="fixed z-[99999] bg-white rounded-[0.85vw] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-[0.11vw] border-gray-400 py-[0.3vw] px-[0.3vw] min-w-[8vw] animate-in fade-in zoom-in duration-200 context-menu-body"
                    style={{ 
                        top: (menuPosition.y - 0) + 'px', 
                        left: (menuPosition.x + 30) + 'px' 
                    }}
                >
                    <button 
                        onClick={() => {
                            const modelToDelete = models.find(m => m.name === menuOpenId);
                            if (modelToDelete) {
                                setAlertConfig({ isOpen: true, data: modelToDelete });
                            }
                            setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] hover:bg-red-50 cursor-pointer rounded-[0.6vw] text-red-500 transition-colors group/item"
                    >
                        <Icon icon="solar:trash-bin-trash-linear" className="w-[1.1vw] h-[1.1vw]" />
                        <span className="text-[0.7vw] font-medium">Delete</span>
                    </button>
                </div>
            )}

            {/* ALERT MODAL */}
            <AlertModal 
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ isOpen: false, data: null })}
                onConfirm={() => handleDeleteModel(alertConfig.data)}
                type="error"
                title="Delete Model"
                message={`Are you sure you want to delete "${alertConfig.data?.name?.replace(/\.[^/.]+$/, "")}" from your gallery? This action cannot be undone.`}
                showCancel={true}
                confirmText="Delete"
            />
        </div>
    );
}
