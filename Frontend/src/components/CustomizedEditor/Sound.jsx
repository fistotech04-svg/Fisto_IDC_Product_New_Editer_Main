import React, { useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

// --- Shared Helper for RGBA Colors ---
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

// --- Layout Components ---

const MobileLayout = ({ 
    activeLayout, isLandscape, flipSoundMasterEnabled, isFlipActive, 
    handleFlipClick, flipWidth, bgSoundMasterEnabled, isBgActive, 
    handleBgClick, bgWidth 
}) => {
    const isLayout2 = activeLayout == 2;
    const isLayout3 = activeLayout == 3;

    return (
        <div
            className={`shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 outline-none ${
                isLayout2 
                    ? 'p-1 rounded-[1.2rem] bg-white w-[180px]' 
                    : (isLayout3 
                        ? 'w-[140px] rounded-[1rem] bg-white border border-gray-100 p-3 shadow-2xl relative'
                        : 'w-[180px] rounded-xl border border-white/10 flex flex-col gap-4 p-4'
                      )
            }`}
            onClick={(e) => e.stopPropagation()}
            style={(!isLayout2 && !isLayout3) ? {
                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                backdropFilter: 'blur(12px)'
            } : {}}
        >
            <div className={isLayout2 ? "bg-[#575C9C] rounded-[1rem] p-4 flex flex-col gap-4" : (isLayout3 ? "flex flex-col gap-3" : "flex flex-col gap-4")} style={isLayout2 ? { backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))" } : {}}>
                {/* Title Header */}
                <div className="flex flex-col items-center mb-0.5">
                    <h2 className={`text-[13px] font-bold tracking-wide ${isLayout3 ? 'text-[#3E4491]' : 'text-white'}`}>Sound</h2>
                    <div className={`h-[1px] w-full mt-1.5 ${isLayout3 ? 'bg-[#3E4491]/10' : 'bg-white/10'}`} />
                </div>

                {/* Flip Sound Control */}
                <div className="flex items-center gap-3">
                    <button
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled
                            ? (isFlipActive 
                                ? (isLayout3 ? 'bg-[#3E4491]' : 'bg-[#4A3AFF]') 
                                : (isLayout3 ? 'bg-[#3E4491]/10 border border-[#3E4491]/20' : 'bg-white/20 cursor-pointer border border-white/20'))
                            : (isLayout3 ? 'bg-gray-50 opacity-40' : 'bg-white/15 cursor-not-allowed opacity-75')
                            }`}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon
                            icon="iconoir:sound-low-solid"
                            className={`w-3.5 h-3.5 ${isLayout3 && !isFlipActive ? 'text-[#3E4491]' : 'text-white'}`}
                        />
                    </button>
                    <div className={`flex-1 h-1 rounded-full relative overflow-hidden ${isLayout3 ? 'bg-gray-100' : 'bg-white/30'}`}>
                        <div
                            className={`absolute inset-0 transition-all duration-500 rounded-full ${isLayout3 ? 'bg-[#3E4491]' : 'bg-white'}`}
                            style={{ width: flipWidth }}
                        />
                    </div>
                </div>

                {/* Background Sound Control */}
                <div className="flex items-center gap-3">
                    <button
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled
                            ? (isBgActive 
                                ? (isLayout3 ? 'bg-[#3E4491]' : 'bg-[#4A3AFF]') 
                                : (isLayout3 ? 'bg-[#3E4491]/10 border border-[#3E4491]/20' : 'bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20'))
                            : (isLayout3 ? 'bg-gray-50 opacity-40' : 'bg-white/15 border border-white/10 cursor-not-allowed opacity-75')
                            }`}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <Icon
                            icon="solar:music-notes-bold"
                            className={`w-3.5 h-3.5 ${isLayout3 && !isBgActive ? 'text-[#3E4491]' : 'text-white'}`}
                        />
                    </button>
                    <div className={`flex-1 h-1 rounded-full relative overflow-hidden ${isLayout3 ? 'bg-gray-100' : 'bg-white/30'}`}>
                        <div
                            className={`absolute inset-0 transition-all duration-500 rounded-full ${isLayout3 ? 'bg-[#3E4491]' : 'bg-white'}`}
                            style={{ width: bgWidth }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Layout1 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet, activeLayout 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: isTablet ? '0.8vw' : '1vw',
        }}
    >
        <div className={isTablet ? "flex flex-col gap-[0.8vw]" : "flex flex-col gap-[1.2vw]"}>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'bg-[#4A3AFF]' : 'bg-white/20 cursor-pointer border border-white/20') : 'bg-white/15 cursor-not-allowed opacity-75'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw] text-white" : "w-[1.2vw] h-[1.2vw] text-white"} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: flipWidth }} />
                </div>
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw] text-white" : "w-[0.9vw] h-[0.9vw] text-white"} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: bgWidth }} />
                </div>
            </div>
        </div>
    </div>
);



const Layout2 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-1 top-[4vw] duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            width: isTablet ? '7vw' : '11vw',
            borderRadius: '0.5vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            padding: isTablet ? '0.1vw' : '0.2vw',
        }}
    >
        <div className="rounded-[0.5vw] bg-white overflow-hidden">
            <div className={`rounded-[0.5vw] ${isTablet ? 'p-[0.6vw] gap-[0.6vw]' : 'p-[1vw] gap-[1vw]'} relative flex flex-col`} style={{ backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))", width: isTablet ? '7vw' : '11vw' }}>
                <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.4vw]"}>
                    <h2 className={isTablet ? "text-[0.5vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }}>Sound</h2>
                    <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 0.3)" }} />
                </div>
                {/* Flip */}
                <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'bg-[#4A3AFF]' : 'bg-white/20 cursor-pointer border border-white/20') : 'bg-white/15 cursor-not-allowed opacity-75'}`}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw] text-white" : "w-[1.2vw] h-[1.2vw] text-white"} />
                    </button>
                    <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                        <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: flipWidth }} />
                    </div>
                </div>
                {/* BG */}
                <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw] text-white" : "w-[0.9vw] h-[0.9vw] text-white"} />
                    </button>
                    <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                        <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: bgWidth }} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Layout3 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '0.5vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: isTablet ? '0.2vw' : '0.3vw',
        }}
    >
        <div className={isTablet ? "flex flex-col gap-[0.3vw] p-[0.3vw]" : "flex flex-col gap-[0.5vw] p-[0.5vw]"}>
            <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                <h2 className={isTablet ? "text-[0.6vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-icon', '#000000'), opacity: 0.15 }} />
            </div>
            {/* Flip */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'bg-[#4A3AFF]' : 'bg-white/20 cursor-pointer border border-white/20') : 'bg-white/15 cursor-not-allowed opacity-75'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: flipSoundMasterEnabled ? (isFlipActive ? 'white' : "var(--dropdown-icon, rgba(255,255,255,0.6))") : "var(--dropdown-icon, rgba(255,255,255,0.75))", opacity: !isFlipActive ? 0.5 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: "var(--dropdown-icon, #FFFFFF)" }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"} style={{ color: bgSoundMasterEnabled ? (isBgActive ? 'white' : "var(--dropdown-icon, rgba(255,255,255,0.5))") : "var(--dropdown-icon, rgba(255,255,255,0.7))", opacity: !isBgActive ? 0.5 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: "var(--dropdown-icon, #FFFFFF)" }} />
                </div>
            </div>
        </div>
    </div>
);

const Layout4 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            padding: isTablet ? '0.3vw' : '0.5vw',
        }}
    >
        <div className={isTablet ? 'flex flex-col gap-[0.9vw] py-[0.9vw] px-[0.7vw]' : 'flex flex-col gap-[1.5vw] py-[1.5vw] px-[1.2vw]'}>
            <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                <h2 className={isTablet ? "text-[0.6vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-icon', '#000000'), opacity: 0.15 }} />
            </div>
            {/* Flip */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="mingcute:volume-line" className={isTablet ? "w-[1.1vw] h-[1.1vw]" : "w-[1.6vw] h-[1.6vw]"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '0,0,0', '0.1') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-icon', '#111827') }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.1vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="mingcute:music-2-line" className={isTablet ? "w-[1.1vw] h-[1.1vw]" : "w-[1.6vw] h-[1.6vw]"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '0,0,0', '0.1') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-icon', '#111827') }} />
                </div>
            </div>
        </div>
    </div>
);

const Layout5 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            padding: isTablet ? '0.3vw' : '0.5vw',
        }}
    >
        <div className={isTablet ? 'flex flex-col gap-[1.1vw] p-[1.1vw]' : 'flex flex-col gap-[1.8vw] p-[1.8vw]'}>
            <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                <h2 className={isTablet ? "text-[0.6vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-icon', '#000000'), opacity: 0.15 }} />
            </div>
            {/* Flip */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="mingcute:volume-line" className={isTablet ? "w-[1.1vw] h-[1.1vw]" : "w-[1.6vw] h-[1.6vw]"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '0,0,0', '0.1') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-icon', '#111827') }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.1vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="mingcute:music-2-line" className={isTablet ? "w-[1.1vw] h-[1.1vw]" : "w-[1.6vw] h-[1.6vw]"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '0,0,0', '0.1') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-icon', '#111827') }} />
                </div>
            </div>
        </div>
    </div>
);

const Layout6 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            padding: isTablet ? '0.3vw' : '0.5vw',
        }}
    >
        <div className={isTablet ? 'flex flex-col gap-[1.1vw] p-[1.1vw]' : 'flex flex-col gap-[1.8vw] p-[1.8vw]'}>
            <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                <h2 className={isTablet ? "text-[0.6vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-icon', '#000000'), opacity: 0.15 }} />
            </div>
            {/* Flip */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="mingcute:volume-line" className={isTablet ? "w-[1.1vw] h-[1.1vw]" : "w-[1.6vw] h-[1.6vw]"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '0,0,0', '0.1') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-icon', '#111827') }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.1vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="mingcute:music-2-line" className={isTablet ? "w-[1.1vw] h-[1.1vw]" : "w-[1.6vw] h-[1.6vw]"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '0,0,0', '0.1') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-icon', '#111827') }} />
                </div>
            </div>
        </div>
    </div>
);

const Layout7 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet, activeLayout 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: isTablet ? '0.8vw' : '1vw',
        }}
    >
        <div className={isTablet ? "flex flex-col gap-[0.8vw]" : "flex flex-col gap-[1.2vw]"}>
            <div className={isTablet ? "flex items-center gap-[0.4vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                <h2 className={isTablet ? "text-[0.6vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: 'white' }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: 'white', opacity: 0.15 }} />
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'bg-[#4A3AFF]' : 'bg-white/20 cursor-pointer border border-white/20') : 'bg-white/15 cursor-not-allowed opacity-75'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw] text-white" : "w-[1.2vw] h-[1.2vw] text-white"} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: flipWidth }} />
                </div>
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw] text-white" : "w-[0.9vw] h-[0.9vw] text-white"} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: bgWidth }} />
                </div>
            </div>
        </div>
    </div>
);

const Layout8 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
            width: isTablet ? '9vw' : '15vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            padding: '0',
        }}
    >
        <div className={isTablet ? "w-full px-[0.6vw] py-[0.4vw] mb-[0.8vw]" : "w-full px-[1vw] py-[0.6vw] mb-[1.2vw]"} style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}>
            <h2 className={isTablet ? "text-[0.6vw] font-bold tracking-wide" : "text-[0.85vw] font-bold tracking-wide"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Sound</h2>
        </div>
        <div className={isTablet ? "flex flex-col gap-[0.8vw] px-[0.8vw] pb-[1vw]" : "flex flex-col gap-[1.2vw] px-[1.2vw] pb-[1.5vw]"}>
            {/* Flip */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={isTablet ? "flex-shrink-0 w-[1.2vw] h-[1.2vw] flex items-center justify-center transition-all duration-300 rounded-full" : "flex-shrink-0 w-[1.8vw] h-[1.8vw] flex items-center justify-center transition-all duration-300 rounded-full"}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                    style={isFlipActive ? { backgroundColor: getLayoutColor('dropdown-icon', '#575C9C') } : {}}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: isFlipActive ? '#FFFFFF' : getLayoutColor('dropdown-icon', '#575C9C'), opacity: !isFlipActive ? 0.4 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '87,92,156', '0.15') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-icon', '#575C9C') }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={isTablet ? "flex-shrink-0 w-[1.2vw] h-[1.2vw] flex items-center justify-center transition-all duration-300 rounded-full" : "flex-shrink-0 w-[1.8vw] h-[1.8vw] flex items-center justify-center transition-all duration-300 rounded-full"}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                    style={isBgActive ? { backgroundColor: getLayoutColor('dropdown-icon', '#575C9C'), borderColor: getLayoutColor('dropdown-icon', '#575C9C') } : { borderColor: `${getLayoutColor('dropdown-icon', '#575C9C')}40` }}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"} style={{ color: isBgActive ? '#FFFFFF' : getLayoutColor('dropdown-icon', '#575C9C'), opacity: !isBgActive ? 0.4 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '87,92,156', '0.15') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-icon', '#575C9C') }} />
                </div>
            </div>
        </div>
    </div>
);

const Layout9 = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '0.5vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: isTablet ? '0.2vw' : '0.3vw',
        }}
    >
        <div className={isTablet ? "flex flex-col gap-[0.3vw] p-[0.3vw]" : "flex flex-col gap-[0.5vw] p-[0.5vw]"}>
            <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                <h2 className={isTablet ? "text-[0.6vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-icon', '#000000'), opacity: 0.15 }} />
            </div>
            {/* Flip */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'bg-[#4A3AFF]' : 'bg-white/20 cursor-pointer border border-white/20') : 'bg-white/15 cursor-not-allowed opacity-75'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: flipSoundMasterEnabled ? (isFlipActive ? 'white' : "var(--dropdown-icon, rgba(255,255,255,0.6))") : "var(--dropdown-icon, rgba(255,255,255,0.75))", opacity: !isFlipActive ? 0.5 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: "var(--dropdown-icon, #FFFFFF)" }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"} style={{ color: bgSoundMasterEnabled ? (isBgActive ? 'white' : "var(--dropdown-icon, rgba(255,255,255,0.5))") : "var(--dropdown-icon, rgba(255,255,255,0.7))", opacity: !isBgActive ? 0.5 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: "var(--dropdown-icon, #FFFFFF)" }} />
                </div>
            </div>
        </div>
    </div>
);

const LayoutDefault = ({ 
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth, 
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, isTablet 
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
            width: isTablet ? '7vw' : '18vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: isTablet ? '0.8vw' : '1.2vw',
        }}
    >
        <div className={isTablet ? "flex flex-col gap-[0.8vw]" : "flex flex-col gap-[1.2vw]"}>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'bg-[#4A3AFF]' : 'bg-white/20 cursor-pointer border border-white/20') : 'bg-white/15 cursor-not-allowed opacity-75'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw] text-white" : "w-[1.2vw] h-[1.2vw] text-white"} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: flipWidth }} />
                </div>
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw] text-white" : "w-[0.9vw] h-[0.9vw] text-white"} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden bg-white/30" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/30"}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: bgWidth }} />
                </div>
            </div>
        </div>
    </div>
);



// --- Main Sound Component ---

const Sound = ({
    isOpen,
    onClose,
    activeLayout,
    otherSetupSettings,
    onUpdateOtherSetup,
    isMuted,
    setIsMuted,
    isFlipMuted,
    setIsFlipMuted,
    flipTrigger,
    settings,
    isTablet,
    isMobile,
    isLandscape
}) => {
    const bgAudioRef = useRef(null);
    const flipAudioRef = useRef(null);

    // Handle Background Sound Logic
    useEffect(() => {
        if (!bgAudioRef.current || !otherSetupSettings?.sound) return;

        const { bgSound, customBgSounds, bgSoundEnabled } = otherSetupSettings.sound;
        const isEnabled = settings?.media?.backgroundAudio && !isMuted && bgSoundEnabled !== false;

        let soundUrl = '';
        if (bgSound === 'BG Sound 1') {
            soundUrl = '/sounds/bg-1.mp3';
        } else if (bgSound === 'BG Sound 2') {
            soundUrl = '/sounds/bg-2.mp3';
        } else if (bgSound === 'BG Sound 3') {
            soundUrl = '/sounds/bg-3.mp3';
        } else {
            const custom = customBgSounds?.find(s => s.id === bgSound || s.label === bgSound);
            if (custom) {
                soundUrl = custom.url;
            }
        }

        if (soundUrl) {
            const absoluteUrl = soundUrl.startsWith('http') ? soundUrl : window.location.origin + soundUrl;
            if (bgAudioRef.current.src !== absoluteUrl) {
                bgAudioRef.current.src = absoluteUrl;
                bgAudioRef.current.loop = true;
            }
        }

        if (isEnabled && soundUrl) {
            bgAudioRef.current.play().catch(e => console.log("BG Audio play blocked", e));
        } else {
            bgAudioRef.current.pause();
        }
    }, [otherSetupSettings?.sound, settings?.media?.backgroundAudio, isMuted]);

    // Handle Flip Sound Source management
    useEffect(() => {
        if (!flipAudioRef.current || !otherSetupSettings?.sound) return;
        const { flipSound } = otherSetupSettings.sound;
        const flipSoundMap = {
            'Classic Book Flip': '/sounds/page-flip.mp3',
            'Soft Paper Flip': '/sounds/page-flip.mp3', // Fallback to existing asset
            'Hard Cover Flip': '/sounds/page-flip.mp3'  // Fallback to existing asset
        };
        const url = flipSoundMap[flipSound] || '/sounds/page-flip.mp3';
        if (flipAudioRef.current.src !== window.location.origin + url && !flipAudioRef.current.src.endsWith(url)) {
            flipAudioRef.current.src = url;
        }
    }, [otherSetupSettings?.sound?.flipSound]);

    // Handle Playback Flip trigger
    const playFlipSound = useCallback(() => {
        const flipEnabled = otherSetupSettings?.sound?.flipSoundEnabled !== false;
        if (flipAudioRef.current && !isMuted && !isFlipMuted && flipEnabled) {
            flipAudioRef.current.currentTime = 0;
            flipAudioRef.current.play().catch(e => console.log("Flip sound play blocked", e));
        }
    }, [isMuted, isFlipMuted, otherSetupSettings?.sound?.flipSoundEnabled]);

    useEffect(() => {
        if (flipTrigger > 0) {
            playFlipSound();
        }
    }, [flipTrigger, playFlipSound]);

    const flipSoundMasterEnabled = otherSetupSettings?.sound?.flipSoundEnabled !== false;
    const bgSoundMasterEnabled = otherSetupSettings?.sound?.bgSoundEnabled !== false;
    const isFlipActive = flipSoundMasterEnabled && !isFlipMuted;
    const isBgActive = bgSoundMasterEnabled && !isMuted;

    const handleFlipClick = (e) => {
        e.stopPropagation();
        if (flipSoundMasterEnabled && setIsFlipMuted) {
            const nextMuteState = !isFlipMuted;
            setIsFlipMuted(nextMuteState);
            if (!nextMuteState && playFlipSound) {
                playFlipSound();
            }
        }
    };

    const handleBgClick = (e) => {
        e.stopPropagation();
        if (bgSoundMasterEnabled && setIsMuted) {
            setIsMuted(!isMuted);
        }
    };

    const flipWidth = flipSoundMasterEnabled ? (isFlipActive ? '60%' : '15%') : '0%';
    const bgWidth = bgSoundMasterEnabled ? (isBgActive ? '80%' : '15%') : '0%';

    const layout = Number(activeLayout);

    const getPosition = () => {
        if (isMobile) return 'top-[150px] right-[16px]';
        if (layout === 2) return 'top-[8.5vh] left-[calc(50%-3vw)] -translate-x-1/2';
        if (layout === 4) return isTablet ? 'top-[31vh] left-[3vw]' : 'top-[31vh] left-[4.2vw]';
        if (layout === 5) return 'bottom-[9vh] left-[calc(50%+6.5vw)] -translate-x-1/2';
        if (layout === 6) return isTablet ? 'top-[40vh] right-[3vw] -translate-y-1/2' : 'top-[50vh] right-[3.5vw] -translate-y-1/2';
        if (layout === 7) return 'top-[30vh] right-[3vw] -translate-y-1/2';
        if (layout === 8) return isTablet ? 'bottom-[10.5vh] left-[calc(50%+6vw)] -translate-x-1/2' : 'bottom-[10.5vh] left-[calc(50%+6.5vw)] -translate-x-1/2';
        if (layout === 9) return 'top-[8.5vh] left-[calc(50%+0.8vw)] -translate-x-1/2';
        return layout === 3 ? 'top-[8.5vh] left-[calc(50%+0.2vw)] -translate-x-1/2' : (isTablet ? 'bottom-[4vw] right-[15.4vw]' : 'bottom-[4.5vw] right-[15.4vw]');
    };

    if (!isOpen) {
        return (
            <>
                <audio ref={bgAudioRef} />
                <audio ref={flipAudioRef} />
            </>
        );
    }

    const commonProps = {
        flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
        bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth,
        isTablet, activeLayout
    };

    if (isMobile) {
        const isLayout2 = activeLayout == 2;
        const isLayout3 = activeLayout == 3;
        return (
            <div
                className={`absolute inset-0 z-[3000] flex ${isLayout2 ? 'justify-start items-end pb-[7.5rem] pl-4' : (isLayout3 ? `justify-start items-start ${isLandscape ? 'pt-[60px] left-[64%]' : 'pt-[155px] left-[55%]'} -translate-x-1/2` : 'justify-end items-start pt-[150px] pr-[16px]')} pointer-events-auto`}
                onClick={onClose}
            >
                <MobileLayout {...commonProps} isLandscape={isLandscape} />
                <audio ref={bgAudioRef} />
                <audio ref={flipAudioRef} />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-[160] overflow-hidden flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 z-[110] pointer-events-auto cursor-default" onClick={onClose} />
            <div className={`absolute ${getPosition()} z-[120] pointer-events-auto`}>
                {(() => {
                    switch (layout) {
                        case 1: return <Layout1 {...commonProps} />;
                        case 2: return <Layout2 {...commonProps} />;
                        case 3: return <Layout3 {...commonProps} />;
                        case 4: return <Layout4 {...commonProps} />;
                        case 5: return <Layout5 {...commonProps} />;
                        case 6: return <Layout6 {...commonProps} />;
                        case 7: return <Layout7 {...commonProps} />;
                        case 8: return <Layout8 {...commonProps} />;
                        case 9: return <Layout9 {...commonProps} />;
                        default: return <LayoutDefault {...commonProps} />;
                    }
                })()}
            </div>
            <audio ref={bgAudioRef} />
            <audio ref={flipAudioRef} />
        </div>
    );
};

export default Sound;
