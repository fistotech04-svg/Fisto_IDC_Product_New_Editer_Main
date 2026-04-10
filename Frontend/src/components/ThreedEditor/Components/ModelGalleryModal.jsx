import React, { useState, useEffect, useRef, Suspense } from "react";
import { Icon } from "@iconify/react";
import { Canvas } from "@react-three/fiber";
import { View, OrbitControls, Environment, PerspectiveCamera, Center, ContactShadows } from "@react-three/drei";
import axios from "axios";
import RenderModel from "./ModelLoaders";

export default function ModelGalleryModal({ isOpen, onClose, onSelectModel }) {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModel, setSelectedModel] = useState(null);

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

    const containerRef = useRef();

    // Internal component for 3D thumbnail
    const ModelThumbnail = ({ model, isSelected }) => {
        const viewRef = useRef();
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        
        return (
            <div ref={viewRef} className="w-full h-full relative">
                {/* 3D View Content */}
                <View track={viewRef} className="w-full h-full">
                    <PerspectiveCamera makeDefault position={[0, 1.2, 5]} fov={30} />
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} />
                    
                    <Suspense fallback={null}>
                        <Center bottom position={[0, 0, -1.5]}>
                            <RenderModel
                                type={model.type}
                                url={`${backendUrl}${model.url}`}
                                isSelectionDisabled={true}
                                shouldClone={true}
                            />
                        </Center>
                    </Suspense>
                    
                    <Environment preset="city" />
                    <ContactShadows position={[0, -1.8, 0]} opacity={0.4} scale={10} blur={2} far={1} />
                    
                    <OrbitControls 
                        enableZoom={false} 
                        enablePan={false}
                        target={[0, 0, 0]}
                        autoRotate={isSelected}
                        autoRotateSpeed={4}
                    />
                </View>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white w-[70vw] h-[40vw] rounded-[0.75vw] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header Section */}
                <div className="p-[1.5vw] pb-[1vw] flex items-start justify-between">
                    <div>
                        <h2 className="text-[1.5vw] font-bold text-gray-800 tracking-tight">3D Model Gallery</h2>
                        <p className="text-[0.85vw] text-gray-500 mt-[0.2vw] font-medium">Select a professional popup design to get start</p>
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
                        <div className="flex flex-col items-center justify-center py-[10vw] gap-[1vw]">
                            <div className="w-[3vw] h-[3vw] border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-[1vw] text-gray-500 font-medium">Fetching Models...</p>
                        </div>
                    ) : filteredModels.length > 0 ? (
                        <div className="grid grid-cols-5 gap-[1.2vw] pb-[2vw]">
                            {filteredModels.map((model, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedModel(model)}
                                    className={`group cursor-pointer flex flex-col gap-[0.5vw] transition-all`}
                                >
                                    <div className={`relative w-full aspect-square rounded-[0.7vw] bg-[#F9FAFB] flex items-center justify-center border-2 transition-all overflow-hidden ${
                                        selectedModel?.name === model?.name
                                            ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' 
                                            : 'border-transparent hover:border-gray-200'
                                    }`}>
                                        {/* Live 3D View as Thumbnail */}
                                        <div className="w-full h-full">
                                            <ModelThumbnail 
                                                model={model} 
                                                isSelected={selectedModel?.name === model?.name} 
                                            />
                                        </div>

                                        {/* Status / Type Badge */}
                                        <div className="absolute top-[0.4vw] right-[0.4vw] px-[0.4vw] py-[0.1vw] bg-white/80 backdrop-blur-sm rounded-[0.3vw] shadow-xs border border-gray-100">
                                            <span className="text-[0.55vw] font-black text-gray-600 uppercase tracking-tighter">{model.type}</span>
                                        </div>
                                    </div>
                                    <div className="px-[0.2vw]">
                                        <p className="text-[0.8vw] font-bold text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
                                            {model.name.replace(/\.[^/.]+$/, "")}
                                        </p>
                                        <div className="flex items-center justify-between mt-[0.1vw]">
                                            <span className="text-[0.65vw] text-gray-400 font-medium">{model.size}</span>
                                            <Icon icon="solar:check-circle-bold" className={`w-[0.9vw] h-[0.9vw] transition-all ${
                                                selectedModel?.name === model?.name ? 'text-indigo-500 scale-100' : 'text-gray-100 scale-0'
                                            }`} />
                                        </div>
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
                    className="pointer-events-none fixed inset-0 z-[110]"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}
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
        </div>
    );
}
