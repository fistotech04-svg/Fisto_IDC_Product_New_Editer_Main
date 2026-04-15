import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { textureData } from "../../data/textureData";

export default function TextureGalleryBar({ isOpen, setIsOpen, onSelectTexture, selectedTextureId, onAddMaterialClick }) {
    const scrollRef = React.useRef(null);
    const [localSelected, setLocalSelected] = useState(null);
    const [uploadedTextures, setUploadedTextures] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("predefined"); // "predefined" | "uploaded"
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Use data from centralized file
    const predefinedTextures = textureData;

    const fetchUploadedTextures = useCallback(async () => {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user?.emailId) return;

        setIsLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/textures/get?email=${user.emailId}`);
            if (response.data.textures) {
                // Map backend format to UI format
                const mapped = response.data.textures.map(t => ({
                    id: t._id,
                    name: t.materialName,
                    category: t.materialCategory || "Custom",
                    // Use preview if available, otherwise base map
                    thumb: t.maps.preview || t.maps.base,
                    // Store all maps for selection
                    maps: t.maps,
                    isUploaded: true
                }));
                setUploadedTextures(mapped);
            }
        } catch (error) {
            console.error("Error fetching uploaded textures:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "uploaded") {
            fetchUploadedTextures();
        }
    }, [activeTab, fetchUploadedTextures]);

    // Re-fetch when AddMaterial modal closes (if we had a way to trigger it, but for now we poll or manual refresh)
    // Actually, we can just fetch whenever activeTab becomes uploaded.

    const currentTextures = activeTab === "predefined" ? predefinedTextures : uploadedTextures;

    const categories = useMemo(() => {
        const counts = {};
        currentTextures.forEach(t => {
            const cat = t.category || "General";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return { All: currentTextures.length, ...counts };
    }, [currentTextures]);

    const filteredTextures = useMemo(() => {
        if (selectedCategory === "All") return currentTextures;
        return currentTextures.filter(t => (t.category || "General") === selectedCategory);
    }, [currentTextures, selectedCategory]);

    const selectedTextureName = useMemo(() => {
        const allTextures = [...predefinedTextures, ...uploadedTextures];
        const found = allTextures.find(t => t.id === selectedTextureId || (!selectedTextureId && localSelected === (t.id || t.name)));
        return found ? found.name : "None";
    }, [selectedTextureId, localSelected, predefinedTextures, uploadedTextures]);

    const handleSelect = (tex) => {
        setLocalSelected(tex.id || tex.name);
        if (onSelectTexture) {
            onSelectTexture(tex);
        }
    };

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -(window.innerWidth * 0.1042), behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: (window.innerWidth * 0.1042), behavior: "smooth" });
        }
    };

    return (
        <div 
            className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden
            ${isOpen ? "bottom-0 w-[97%] h-[12.5vw] rounded-t-[1vw]" : "bottom-0 w-[97%] h-[3.13vw] rounded-t-[0.83vw] cursor-pointer hover:bg-gray-50"}
            `}
            onClick={(e) => !isOpen && setIsOpen(true)}
        >
            {/* COLLAPSED STATE CONTENT */}
            <div 
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
                <span className="text-[0.8vw] font-semibold text-gray-700">Click to View Texture Gallery</span>
                <button 
                    className="absolute right-[0.62vw] top-1/2 -translate-y-1/2 w-[1.88vw] h-[1.88vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.42vw] shadow-sm text-gray-600 hover:text-gray-900"
                >
                    <Icon icon="heroicons:chevron-up-20-solid" width="1.04vw" height="1.04vw" />
                </button>
            </div>

            {/* EXPANDED STATE CONTENT */}
            <div 
                className={`w-full h-full flex flex-col transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
                {/* Header / Toolbar */}
                <div className="flex items-center justify-between px-[1.25vw] pt-[1vw] pb-[0.5vw]">
                    <div className="flex items-center gap-[1.5vw]">
                        {/* Segmented Tab Toggle */}
                        <div className="flex bg-[#f3f4f6] p-[0.3vw] rounded-[0.5vw] border border-gray-100 gap-[0.3vw]">
                            <button 
                                onClick={() => setActiveTab("predefined")}
                                className={`px-[0.8vw] py-[0.3vw] text-[0.65vw] font-semibold  rounded-[0.4vw] transition-all duration-200 ${activeTab === "predefined" ? "bg-black text-white shadow-sm" : "bg-white cursor-pointer text-[#9ca3af] hover:text-gray-600 shadow-sm"}`}
                            >
                                Predefined
                            </button>
                            <button 
                                onClick={() => setActiveTab("uploaded")}
                                className={`px-[0.8vw] py-[0.3vw] text-[0.65vw] font-semibold rounded-[0.4vw] transition-all duration-200 ${activeTab === "uploaded" ? "bg-black text-white shadow-sm" : "bg-white cursor-pointer text-[#9ca3af] hover:text-gray-600 shadow-sm"}`}
                            >
                                Uploaded
                            </button>
                        </div>

                        {/* Material Category Selector */}
                        <div className="flex items-center gap-[0.7vw]">
                            <span className="text-[0.7vw] font-semibold text-gray-800">Material Category :</span>
                            <div 
                                onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                                className="relative px-[0.8vw] py-[0.4vw] bg-[#f3f4f6] rounded-[0.5vw] border border-gray-100 flex items-center justify-between min-w-[8vw] cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-[0.7vw] font-semibold text-gray-800 capitalize">{selectedCategory} ({categories[selectedCategory]})</span>
                                <Icon icon="heroicons:chevron-down-20-solid" width="0.8vw" className={`text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180 text-black" : ""}`} />
                                
                                {/* Dropdown Menu */}
                                <div className={`absolute top-full left-0 mt-[0.3vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-xl transition-all z-40 min-w-full overflow-hidden ${isDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}>
                                    {Object.entries(categories).map(([cat, count]) => (
                                        <div 
                                            key={cat}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCategory(cat);
                                                setIsDropdownOpen(false);
                                            }}                                            
                                            className="px-[0.8vw] py-[0.5vw] text-[0.65vw] font-semibold text-gray-600 hover:bg-[#5d5efc] hover:text-white transition-colors cursor-pointer"
                                        >
                                            {cat} ({count})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selected Info & Close */}
                    <div className="flex items-center gap-[1vw]">
                        <div className="flex items-center gap-[0.7vw] bg-[#f3f4f6] rounded-[0.5vw] px-[0.8vw] py-[0.4vw] border border-gray-100">
                            <span className="text-[0.7vw] font-semibold text-gray-800">Selected Texture :</span>
                            <span className="text-[0.7vw] font-semibold text-black">{selectedTextureName}</span>
                        </div>
                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="w-[1.67vw] h-[1.67vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.42vw] hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
                        >
                            <Icon icon="heroicons:chevron-down-20-solid" width="0.94vw" height="0.94vw" />
                        </button>
                    </div>
                </div>

                {/* Gallery Scroll Area */}
                <div className="flex-1 relative flex items-center px-[1.2vw] gap-[1.5vw]">
                    {/* NEW: Upload Box (Only for Uploaded Tab) - Placed outside scroll to sit on the left */}
                    {activeTab === "uploaded" && (
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onAddMaterialClick) onAddMaterialClick();
                            }}
                            className="flex flex-col items-center gap-[0.4vw] cursor-pointer group transition-all duration-300 ml-[0.2vw] shrink-0"
                        >
                            <div className="w-[7.5vw] h-[6vw] rounded-[0.8vw] border-[0.12vw] border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[#5d5efc] transition-all shadow-sm">
                                <div className="flex flex-col items-center gap-[0.4vw] z-10">
                                    <Icon 
                                        icon="heroicons:plus-20-solid" 
                                        width="1.8vw" 
                                        height="1.8vw" 
                                        className="text-gray-400 group-hover:text-[#5d5efc] transition-all" 
                                    />
                                    <span className="text-[0.6vw] font-semibold text-gray-500 group-hover:text-gray-700">Click to Add Material</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Nav */}
                    <button 
                        onClick={scrollLeft}
                        className="z-10 w-[1.67vw] h-[1.67vw] flex flex-shrink-0 items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-600 transition-all -translate-y-[0.62vw] mr-[0.5vw]"
                    >
                        <Icon icon="heroicons:chevron-left-20-solid" width="1.04vw" height="1.04vw" />
                    </button>

                    {/* Scrollable List */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-x-auto custom-scrollbar px-[0.83vw] h-full flex items-center"
                    >
                        <div className="flex items-center gap-[1.2vw] min-w-max mx-auto px-[1vw] py-[1.2vw]">
                            {filteredTextures.length === 0 && (
                                <div className="flex items-center justify-center py-[2vw]">
                                    <span className="text-[0.75vw] text-gray-400/80 font-semibold tracking-wide flex items-center gap-[0.5vw]">
                                        <Icon icon="heroicons:information-circle-20-solid" width="1vw" />
                                        No Materials Found
                                    </span>
                                </div>
                            )}

                            {filteredTextures.map((tex, idx) => {
                                const isActive = selectedTextureId === tex.id || (!selectedTextureId && localSelected === (tex.id || tex.name));
                                
                                // Resolve the image source
                                let imageSrc = tex.thumb || tex.preview;
                                if (imageSrc?.startsWith('/uploads')) {
                                    imageSrc = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${imageSrc}`;
                                } else if (imageSrc?.startsWith('Texture/')) {
                                    // Handle predefined paths if they start with Texture/ but aren't URLs
                                }

                                return (
                                    <div 
                                        key={idx} 
                                        className="flex flex-col items-center gap-[0.4vw] cursor-pointer group transition-all duration-300"
                                        style={{ width: "4.5vw" }} // Fixed container width to prevent layout shift
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(tex);
                                        }}
                                    >
                                        <div
                                            className={`relative transition-all duration-500 ease-out shadow-lg overflow-hidden bg-[#1a1a1a] ${
                                                isActive
                                                ? "w-[4.17vw] h-[4.17vw] rounded-[0.8vw] z-20 scale-[1.35] shadow-[0_0_20px_rgba(0,0,0,0.3)] border-none"
                                                : "w-[4.17vw] h-[4.17vw] rounded-[0.8vw] border-none group-hover:scale-110 z-0"
                                            }`}
                                        >
                                            <img 
                                                src={imageSrc} 
                                                alt={tex.name} 
                                                className={`w-full h-full object-cover p-[0.1vw] transition-transform duration-500 ${!isActive ? "group-hover:scale-95" : ""}`}
                                                loading="lazy"
                                            />
                                            {/* Subtle Inner Glow */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                                        </div>
                                        
                                        <span
                                            className={`text-[0.6vw] font-bold text-center w-full truncate transition-all duration-500 ease-out mt-[0.5vw] ${
                                                isActive ? "text-[#5d5efc] translate-y-[0.8vw]" : "text-gray-500 translate-y-0"
                                            }`}
                                            title={tex.name}
                                        >
                                            {tex.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Nav */}
                    <button 
                        onClick={scrollRight}
                        className="z-10 w-[1.67vw] h-[1.67vw] flex flex-shrink-0 items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-600 transition-all ml-[0.5vw] -translate-y-[0.62vw]"
                    >
                        <Icon icon="heroicons:chevron-right-20-solid" width="1.04vw" height="1.04vw" />
                    </button>
                </div>
            </div>
        </div>
    );
}
