import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { textureData } from "../../data/textureData";

export default function TextureGalleryBar({ isOpen, setIsOpen, onSelectTexture, selectedTextureId }) {
    const scrollRef = React.useRef(null);
    const [localSelected, setLocalSelected] = useState(null);
    const [activeTab, setActiveTab] = useState("predefined"); // "predefined" | "uploaded"
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Use data from centralized file
    const textures = textureData;

    const categories = useMemo(() => {
        const counts = {};
        textures.forEach(t => {
            const cat = t.category || "General";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return { All: textures.length, ...counts };
    }, [textures]);

    const filteredTextures = useMemo(() => {
        if (selectedCategory === "All") return textures;
        return textures.filter(t => (t.category || "General") === selectedCategory);
    }, [textures, selectedCategory]);

    const selectedTextureName = useMemo(() => {
        const found = textures.find(t => t.id === selectedTextureId || (!selectedTextureId && localSelected === (t.id || t.name)));
        return found ? found.name : "None";
    }, [selectedTextureId, localSelected, textures]);

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
                <div className="flex-1 relative flex items-center px-[0.83vw]">
                    {/* Left Nav */}
                    <button 
                        onClick={scrollLeft}
                        className="z-10 w-[1.67vw] h-[1.67vw] flex flex-shrink-0 items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-600 transition-all -mr-[0.42vw] -translate-y-[0.62vw]"
                    >
                        <Icon icon="heroicons:chevron-left-20-solid" width="1.04vw" height="1.04vw" />
                    </button>

                    {/* Scrollable List */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-x-auto custom-scrollbar px-[0.83vw] h-full flex items-center"
                    >
                        <div className="flex items-center gap-[1.2vw] min-w-max mx-auto px-[1.5vw] py-[1.2vw]">
                            {filteredTextures.map((tex, idx) => {
                                const isActive = selectedTextureId === tex.id || (!selectedTextureId && localSelected === (tex.id || tex.name));
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
                                                src={tex.preview} 
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
                        className="z-10 w-[1.67vw] h-[1.67vw] flex flex-shrink-0 items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-600 transition-all -ml-[0.42vw] -translate-y-[0.62vw]"
                    >
                        <Icon icon="heroicons:chevron-right-20-solid" width="1.04vw" height="1.04vw" />
                    </button>
                </div>
            </div>
        </div>
    );
}
