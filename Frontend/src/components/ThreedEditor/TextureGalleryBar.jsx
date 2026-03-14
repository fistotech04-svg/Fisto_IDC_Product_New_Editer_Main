import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { textureData } from "../../data/textureData";

export default function TextureGalleryBar({ isOpen, setIsOpen, onSelectTexture, selectedTextureId }) {
    const scrollRef = React.useRef(null);
    const [localSelected, setLocalSelected] = useState(null);

    // Use data from centralized file
    const textures = textureData;

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
            className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden
            ${isOpen ? "bottom-0 w-[97%] h-[10.42vw] rounded-t-[0.83vw]" : "bottom-0 w-[97%] h-[3.13vw] rounded-t-[0.83vw] cursor-pointer hover:bg-gray-50"}
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
                {/* Header */}
                <div className="flex items-center justify-between px-[1.25vw] pt-[1.04vw] pb-[0.42vw]">
                    <div className="flex items-center gap-[0.62vw]">
                        <span className="text-[0.73vw] font-semibold text-gray-900">Texture Gallery :</span>
                        
                        {/* Count Badge */}
                        <div className="flex items-center gap-[0.42vw] px-[0.62vw] py-[0.31vw] bg-gray-100 rounded-[0.31vw]">
                            <span className="text-[0.68vw] font-medium text-gray-700">All ({textures.length})</span>
                        </div>
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
                        className="flex-1 overflow-x-auto custom-scrollbar px-[0.83vw] h-full flex items-center pb-[0.42vw]"
                    >
                        <div className="flex items-center gap-[0.83vw] min-w-max mx-auto">
                            {textures.map((tex, idx) => {
                                const isActive = selectedTextureId === tex.id || (!selectedTextureId && localSelected === (tex.id || tex.name));
                                return (
                                    <div 
                                        key={idx} 
                                        className="flex flex-col items-center gap-[0.42vw] group cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(tex);
                                        }}
                                    >
                                        <div
                                            className={`relative rounded-full transition-all duration-300 group-hover:scale-105 shadow-sm overflow-hidden bg-gray-100 ${
                                                isActive
                                                ? "w-[4.17vw] h-[4.17vw] ring-[0.1vw] ring-offset-[0.1vw] ring-[#5d5efc]"
                                                : "w-[4.17vw] h-[4.17vw] hover:shadow-md border border-gray-200"
                                            }`}
                                        >
                                            <img 
                                                src={tex.preview} 
                                                alt={tex.name} 
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            {/* Specular Shine Overlay */}
                                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 opacity-50 pointer-events-none"></div>
                                        </div>
                                        
                                        <span
                                            className={`text-[0.57vw] text-center max-w-[4.17vw] truncate ${
                                                isActive ? "font-bold text-[#5d5efc]" : "font-medium text-gray-500"
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
