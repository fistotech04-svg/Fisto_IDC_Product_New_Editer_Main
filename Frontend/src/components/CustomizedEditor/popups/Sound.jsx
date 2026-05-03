import React, { useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

// --- Shared Helper for RGBA Colors ---
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
};

const isLightColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7;
};

const getShade = (hex, weight = 0.6) => {
    if (!hex || hex === 'transparent' || !hex.startsWith('#')) return hex;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return hex;
    let r = parseInt(c.slice(0, 2), 16);
    let g = parseInt(c.slice(2, 4), 16);
    let b = parseInt(c.slice(4, 6), 16);
    r = Math.round(r * (1 - weight));
    g = Math.round(g * (1 - weight));
    b = Math.round(b * (1 - weight));
    const toHex = x => x.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

// --- Layout Components ---

const MobileLayout = ({
    activeLayout, isLandscape, flipSoundMasterEnabled, isFlipActive,
    handleFlipClick, flipWidth, bgSoundMasterEnabled, isBgActive,
    handleBgClick, bgWidth
}) => {
    const isLayout2 = activeLayout == 2;
    const isLayout3 = activeLayout == 3;

    if (isLayout3) {
        return (
            <div
                className="animate-in fade-in zoom-in-95 duration-200 pointer-events-auto outline-none"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#FFFFFF',
                    width: '135px',
                    borderRadius: '10px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    border: 'none',
                    overflow: 'hidden',
                    backdropFilter: 'blur(12px)',
                    padding: '0',
                }}
            >
                <div
                    className="w-full h-full rounded-[inherit] overflow-hidden flex flex-col gap-2 p-2.5"
                    style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '1') }}
                >
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <h2 className="text-[12px] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#000000'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Sound</h2>
                        <div className="h-[1px] flex-1 mt-[2px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#000000'), opacity: 'calc(var(--dropdown-text-opacity, 1) * 0.15)' }} />
                    </div>
                    {/* Flip */}
                    <div className="flex items-center gap-2.5">
                        <button
                            className={`flex-shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-300 rounded-full bg-transparent ${flipSoundMasterEnabled ? 'cursor-pointer hover:bg-black/5 active:scale-95' : 'cursor-not-allowed opacity-40'}`}
                            onClick={handleFlipClick}
                            disabled={!flipSoundMasterEnabled}
                        >
                            <Icon
                                icon="mingcute:volume-line"
                                className="w-3.5 h-3.5"
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: isFlipActive ? 1 : 0.4 }}
                            />
                        </button>
                        <div className="flex-1 h-[1.5px] rounded-full relative overflow-hidden" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                            <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                        </div>
                    </div>
                    {/* BG */}
                    <div className="flex items-center gap-2.5">
                        <button
                            className={`flex-shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-300 rounded-full bg-transparent ${bgSoundMasterEnabled ? 'cursor-pointer hover:bg-black/5 active:scale-95' : 'cursor-not-allowed opacity-40'}`}
                            onClick={handleBgClick}
                            disabled={!bgSoundMasterEnabled}
                        >
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 21 23"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3 h-3"
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: isBgActive ? 1 : 0.4 }}
                            >
                                <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                            </svg>
                        </button>
                        <div className="flex-1 h-[1.5px] rounded-full relative overflow-hidden" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                            <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 outline-none ${isLayout2
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
                    <h2 className="text-[13px] font-bold tracking-wide" style={{ color: isLayout3 ? '#3E4491' : getLayoutColor('dropdown-text', '#FFFFFF') }}>Sound</h2>
                    <div className={`h-[1px] w-full mt-1.5 ${isLayout3 ? 'bg-[#3E4491]/10' : ''}`} style={!isLayout3 ? { backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.1 } : {}} />
                </div>

                {/* Flip Sound Control */}
                <div className="flex items-center gap-3">
                    <button
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled
                            ? (isFlipActive
                                ? (isLayout3 ? 'bg-[#3E4491]' : 'shadow-inner')
                                : (isLayout3 ? 'bg-[#3E4491]/10 border border-[#3E4491]/20' : 'bg-transparent cursor-pointer hover:bg-black/5'))
                            : (isLayout3 ? 'bg-gray-50 opacity-40' : 'bg-transparent cursor-not-allowed opacity-40')
                            }`}
                        style={(!isLayout3 && isFlipActive) ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon
                            icon={activeLayout == 2 ? "mingcute:volume-line" : "iconoir:sound-low-solid"}
                            className="w-3.5 h-3.5"
                            style={{ color: isLayout3 && !isFlipActive ? '#3E4491' : getLayoutColor('dropdown-text', '#FFFFFF') }}
                        />
                    </button>
                    <div className={`flex-1 h-1 rounded-full relative overflow-hidden ${isLayout3 ? 'bg-gray-100' : ''}`} style={!isLayout3 ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) } : {}}>
                        <div
                            className={`absolute inset-0 transition-all duration-500 rounded-full ${isLayout3 ? 'bg-[#3E4491]' : ''}`}
                            style={{ width: flipWidth, backgroundColor: !isLayout3 ? getLayoutColor('dropdown-text', '#FFFFFF') : undefined }}
                        />
                    </div>
                </div>

                {/* Background Sound Control */}
                <div className="flex items-center gap-3">
                    <button
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled
                            ? (isBgActive
                                ? (isLayout3 ? 'bg-[#3E4491]' : 'shadow-inner')
                                : (isLayout3 ? 'bg-[#3E4491]/10 border border-[#3E4491]/20' : 'bg-transparent cursor-pointer hover:bg-black/5'))
                            : (isLayout3 ? 'bg-gray-50 opacity-40' : 'bg-transparent cursor-not-allowed opacity-40')
                            }`}
                        style={(!isLayout3 && isBgActive) ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        {activeLayout == 2 ? (
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 21 23"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                            >
                                <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                            </svg>
                        ) : (
                            <Icon
                                icon="solar:music-notes-bold"
                                className="w-3.5 h-3.5"
                                style={{ color: isLayout3 && !isBgActive ? '#3E4491' : getLayoutColor('dropdown-text', '#FFFFFF') }}
                            />
                        )}
                    </button>
                    <div className={`flex-1 h-1 rounded-full relative overflow-hidden ${isLayout3 ? 'bg-gray-100' : ''}`} style={!isLayout3 ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) } : {}}>
                        <div
                            className={`absolute inset-0 transition-all duration-500 rounded-full ${isLayout3 ? 'bg-[#3E4491]' : ''}`}
                            style={{ width: bgWidth, backgroundColor: !isLayout3 ? getLayoutColor('dropdown-text', '#FFFFFF') : undefined }}
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
            <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.4vw]"}>
                <h2 className={isTablet ? "text-[0.5vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.3 }} />
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent cursor-pointer hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                    style={isFlipActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="mingcute:volume-line" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </div>
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent cursor-pointer hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                    style={isBgActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"}
                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
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
        className="animate-in fade-in slide-in-from-bottom-1 top-[4vw] duration-300 bg-white/60 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
            width: isTablet ? '7vw' : '11vw',
            borderRadius: '0.5vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.5)',
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
                        className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent cursor-pointer hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                        style={isFlipActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon icon="mingcute:volume-line" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                    </button>
                    <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                        <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                    </div>
                </div>
                {/* BG */}
                <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent cursor-pointer hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                        style={isBgActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"}
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                        <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
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
            backgroundColor: '#FFFFFF',
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '0.5vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: 'none',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: '0',
        }}
    >
        <div
            className="w-full h-full rounded-[inherit] overflow-hidden"
            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '1') }}
        >
            <div className={isTablet ? "flex flex-col gap-[0.3vw] p-[0.3vw]" : "flex flex-col gap-[0.5vw] p-[0.5vw]"}>
                <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                    <h2 className={isTablet ? "text-[0.6vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-text', '#000000'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Sound</h2>
                    <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#000000'), opacity: 'calc(var(--dropdown-text-opacity, 1) * 0.15)' }} />
                </div>
                {/* Flip */}
                <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent ${flipSoundMasterEnabled ? 'cursor-pointer hover:bg-white/10' : 'cursor-not-allowed opacity-40'}`}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon
                            icon="mingcute:volume-line"
                            className={isTablet ? "w-[1.2vw] h-[1.2vw]" : "w-[1.8vw] h-[1.8vw]"}
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: isFlipActive ? 1 : 0.4 }}
                        />
                    </button>
                    <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                        <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                    </div>
                </div>
                {/* BG */}
                <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent ${bgSoundMasterEnabled ? 'cursor-pointer hover:bg-white/10' : 'cursor-not-allowed opacity-40'}`}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={isTablet ? "w-[1.2vw] h-[1.2vw]" : "w-[1.8vw] h-[1.8vw]"}
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: isBgActive ? 1 : 0.4 }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                        <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                    </div>
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
            width: isTablet ? '8vw' : '10vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
        }}
    >
        <div
            className={isTablet ? "flex flex-col gap-[0.4vw]" : "flex flex-col gap-[0.6vw]"}
            style={{
                backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '0.8'),
                backdropFilter: 'blur(10px)',
                padding: isTablet ? '0.5vw 0.7vw' : '0.7vw 1vw',
            }}
        >
            <div className={isTablet ? "flex items-center gap-[0.3vw]" : "flex items-center gap-[0.5vw]"}>
                <h2 className={isTablet ? "text-[0.5vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.3 }} />
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent cursor-pointer hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                    style={isFlipActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </div>
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent cursor-pointer hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                    style={isBgActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
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
        className="animate-in fade-in slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: '#FFFFFF',
            width: isTablet ? '8.5vw' : '10.5vw',
            borderRadius: isTablet ? '0.8vw' : '1vw',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            border: 'none'
        }}
    >
        <div
            className="flex flex-col gap-[0.5vw]"
            style={{
                backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1'),
                padding: isTablet ? '1vw' : '1.2vw',
            }}
        >
            {/* Volume / Flip Sound */}
            <div className="flex items-center gap-[1.2vw]">
                <button
                    className={`flex-shrink-0 transition-all duration-300 ${!flipSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon
                        icon="mingcute:volume-line"
                        className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'}`}
                        style={{ color: getLayoutColor('toc-text', '#000000'), opacity: isFlipActive ? 1 : 0.4 }}
                    />
                </button>
                <div className="flex-1 h-[2px] rounded-full relative" style={{ backgroundColor: getLayoutColorRgba('toc-text', '0, 0, 0', '0.1') }}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
                        style={{ width: flipWidth, backgroundColor: getLayoutColor('toc-text', '#000000') }}
                    />
                </div>
            </div>

            {/* Music / BG Sound */}
            <div className="flex items-center gap-[1.2vw]">
                <button
                    className={`flex-shrink-0 transition-all duration-300 ${!bgSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'}`}
                        style={{ color: getLayoutColor('toc-text', '#000000'), opacity: isBgActive ? 1 : 0.4 }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className="flex-1 h-[2px] rounded-full relative" style={{ backgroundColor: getLayoutColorRgba('toc-text', '0, 0, 0', '0.1') }}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
                        style={{ width: bgWidth, backgroundColor: getLayoutColor('toc-text', '#000000') }}
                    />
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
            backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '0.8'),
            backdropFilter: 'blur(12px)',
            width: isTablet ? '8vw' : '11vw',
            borderRadius: '0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: 'none',
            overflow: 'hidden',
            padding: isTablet ? '1vw' : '1.5vw',
        }}
    >
        <div className="flex flex-col gap-[2vh]">
            {/* Flip Sound Control */}
            <div className="flex items-center gap-[0.8vw]">
                <button
                    className={`flex-shrink-0 transition-all duration-300 ${!flipSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon
                        icon="mingcute:volume-line"
                        className={isTablet ? "w-[1vw] h-[1vw]" : "w-[1.5vw] h-[1.5vw]"}
                        style={{ color: getLayoutColor('dropdown-text', '#000000'), opacity: isFlipActive ? 1 : 0.4 }}
                    />
                </button>
                <div className="flex-1 h-[2px] rounded-none relative overflow-hidden" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '0, 0, 0', 0.1) }}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-none"
                        style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#000000') }}
                    />
                </div>
            </div>

            {/* Background Sound Control */}
            <div className="flex items-center gap-[0.8vw]">
                <button
                    className={`flex-shrink-0 transition-all duration-300 ${!bgSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isTablet ? "w-[1vw] h-[1vw]" : "w-[1.5vw] h-[1.5vw]"}
                        style={{ color: getLayoutColor('dropdown-text', '#000000'), opacity: isBgActive ? 1 : 0.4 }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.2016 13.614 9.57022 13.4208C8.93883 13.2275 8.38466 12.8426 7.986 12.3201C7.58735 11.7976 7.36398 11.164 7.34731 10.5087C7.33063 9.85337 7.52187 9.20936 7.89389 8.66753C8.2659 8.1257 8.80007 7.71339 9.42145 7.48875C10.0428 7.2641 10.7196 7.23847 11.3558 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className="flex-1 h-[2px] rounded-none relative overflow-hidden" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '0, 0, 0', 0.1) }}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-none"
                        style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#000000') }}
                    />
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
        className="animate-in fade-in slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
            backdropFilter: 'blur(12px)',
            width: isTablet ? '8.5vw' : '10.5vw',
            borderRadius: isTablet ? '0.8vw' : '1vw',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
        }}
    >
        <div
            className="flex flex-col gap-[0.5vw]"
            style={{
                backgroundColor: 'transparent',
                padding: isTablet ? '1vw' : '1.2vw',
            }}
        >
            {/* Volume / Flip Sound */}
            <div className="flex items-center gap-[1.2vw]">
                <button
                    className={`flex-shrink-0 transition-all duration-300 ${!flipSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon
                        icon="mingcute:volume-line"
                        className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'}`}
                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 1 }}
                    />
                </button>
                <div className="flex-1 h-[2px] rounded-full relative" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', '0.1') }}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
                        style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}
                    />
                </div>
            </div>

            {/* Music / BG Sound */}
            <div className="flex items-center gap-[1.2vw]">
                <button
                    className={`flex-shrink-0 transition-all duration-300 ${!bgSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'}`}
                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 1 }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className="flex-1 h-[2px] rounded-full relative" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', '0.1') }}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
                        style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}
                    />
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
            width: isTablet ? '7vw' : '11vw',
            borderRadius: '0.8vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            padding: '0',
        }}
    >
        <div className={isTablet ? "w-full px-[0.5vw] py-[0.3vw] mb-[0.6vw]" : "w-full px-[0.8vw] py-[0.4vw] mb-[0.8vw]"} style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}>
            <h2 className={isTablet ? "text-[0.5vw] font-bold tracking-wide" : "text-[0.75vw] font-bold tracking-wide"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Sound</h2>
        </div>
        <div className={isTablet ? "flex flex-col gap-[0.6vw] px-[0.6vw] pb-[0.8vw]" : "flex flex-col gap-[0.8vw] px-[0.8vw] pb-[1vw]"}>
            {/* Flip */}
            <div className={isTablet ? "flex items-center gap-[0.5vw]" : "flex items-center gap-[0.8vw]"}>
                <button
                    className={isTablet ? "flex-shrink-0 w-[1vw] h-[1vw] flex items-center justify-center transition-all duration-300 rounded-full" : "flex-shrink-0 w-[1.5vw] h-[1.5vw] flex items-center justify-center transition-all duration-300 rounded-full"}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                    style={isFlipActive ? { backgroundColor: getLayoutColor('dropdown-icon', '#575C9C') } : {}}
                >
                    <Icon icon="mingcute:volume-line" className={isTablet ? "w-[0.7vw] h-[0.7vw]" : "w-[1vw] h-[1vw]"} style={{ color: isFlipActive ? getLayoutColor('dropdown-bg', '#FFFFFF') : getLayoutColor('dropdown-icon', '#575C9C'), opacity: !isFlipActive ? 0.4 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.12vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '87,92,156', '0.15') }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-icon', '#575C9C') }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[0.5vw]" : "flex items-center gap-[0.8vw]"}>
                <button
                    className={isTablet ? "flex-shrink-0 w-[1vw] h-[1vw] flex items-center justify-center transition-all duration-300 rounded-full" : "flex-shrink-0 w-[1.5vw] h-[1.5vw] flex items-center justify-center transition-all duration-300 rounded-full"}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                    style={isBgActive ? { backgroundColor: getLayoutColor('dropdown-icon', '#575C9C'), borderColor: getLayoutColor('dropdown-icon', '#575C9C') } : { borderColor: `${getLayoutColor('dropdown-icon', '#575C9C')}40` }}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isTablet ? "w-[0.5vw] h-[0.5vw]" : "w-[0.8vw] h-[0.8vw]"}
                        style={{ color: isBgActive ? getLayoutColor('dropdown-bg', '#FFFFFF') : getLayoutColor('dropdown-icon', '#575C9C'), opacity: !isBgActive ? 0.4 : 1 }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.12vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorRgba('dropdown-icon', '87,92,156', '0.15') }}>
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
        className="animate-in fade-in slide-in-from-bottom-4 duration-300 relative group"
        onClick={(e) => e.stopPropagation()}
        style={{
            width: isTablet ? '9vw' : '10vw',
            aspectRatio: '250/270',
            filter: 'drop-shadow(0 1vw 3vw rgba(0,0,0,0.3))'
        }}
    >
        {/* Unified SVG Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 250 270" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <defs>
                    <clipPath id="sound-shape-clip" clipPathUnits="objectBoundingBox">
                        <path
                            transform="scale(0.004, 0.0037037)"
                            d="M0 115 C0 90.16 20.16 70 45 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V225 C250 249.84 229.84 270 205 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                        />
                    </clipPath>
                </defs>
                <path
                    d="M0 115 C0 90.16 20.16 70 45 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V225 C250 249.84 229.84 270 205 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                    fill={getLayoutColor('dropdown-bg', '#575C9C')}
                    fillOpacity="0.6"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1.5"
                />
            </svg>
        </div>

        <div
            className="w-full h-full relative z-10 backdrop-blur-md flex flex-col justify-center gap-[0.5vw] pt-[3.6vw] px-[0.8vw]"
            style={{ clipPath: 'url(#sound-shape-clip)', WebkitClipPath: 'url(#sound-shape-clip)' }}
        >
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
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: !isFlipActive ? 0.5 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: !isBgActive ? 0.5 : 1 }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
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
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </div>
            </div>
            <div className={isTablet ? "flex items-center gap-[0.6vw]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                </button>
                <div className={isTablet ? "flex-1 h-[0.1vw] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                    <div className="absolute inset-0 transition-all duration-500 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }} />
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
            'Soft Paper Flip': '/sounds/soft-flip.ogg',
            'Hard Cover Flip': '/sounds/hard-flip.mp3'
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
        if (layout === 2) return 'top-[8.5vh] left-[calc(50%_-_3vw)] -translate-x-1/2';
        if (layout === 4) return isTablet ? 'top-[40vh] left-[3vw]' : 'top-[40vh] left-[4.2vw]';
        if (layout === 5) return `bottom-[4.2vw] left-[calc(50%_+_13.3vw)] -translate-x-1/2`;
        if (layout === 6) return isTablet ? 'top-[40vh] right-[5vw] -translate-y-1/2' : 'top-[44vh] right-[5.5vw] -translate-y-1/2';
        if (layout === 7) return 'top-[40vh] right-[3.7vw] -translate-y-1/2';
        if (layout === 8) return isTablet ? 'bottom-[10.5vh] left-[calc(50%_+_6vw)] -translate-x-1/2' : 'bottom-[10.5vh] left-[calc(50%_+_6.5vw)] -translate-x-1/2';
        if (layout === 9) return 'top-[2vh] left-[calc(50%_-_7.5vw)] -translate-x-1/2';
        return layout === 3 ? 'top-[8.5vh] left-[calc(50%_+_0.2vw)] -translate-x-1/2' : (isTablet ? 'bottom-[3.8vw] right-[19.2vw]' : 'bottom-[4.5vw] right-[19.2vw]');
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
        if (isLandscape && activeLayout == 1) {
            return (
                <div className="absolute inset-0 z-[160] flex items-end justify-end pointer-events-auto" style={{ paddingBottom: '45px', paddingRight: '22%' }} onClick={onClose}>
                    <div className="scale-[0.8] origin-bottom-right shadow-4xl shadow-black/30 bg-transparent" onClick={(e) => e.stopPropagation()}>
                        <Layout1 {...commonProps} />
                    </div>
                    <audio ref={bgAudioRef} />
                    <audio ref={flipAudioRef} />
                </div>
            );
        }
        if (!isLandscape && Number(activeLayout) === 1) {
            return (
                <div className="absolute inset-0 z-[3000] flex justify-end items-start pt-[150px] pr-[16px] pointer-events-auto" onClick={onClose}>
                    <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: '140px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', backdropFilter: 'blur(12px)', backgroundColor: 'rgba(87, 92, 156, 0.85)', padding: '12px' }}>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-[13px] font-bold text-white whitespace-nowrap">Sound</h2>
                                    <div className="h-[1px] flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                </div>
                                {/* Flip Sound */}
                                <div className="flex items-center gap-3">
                                    <button
                                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent cursor-pointer hover:bg-white/10') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                                        style={isFlipActive ? { backgroundColor: 'rgba(255,255,255,0.15)' } : {}}
                                        onClick={handleFlipClick}
                                        disabled={!flipSoundMasterEnabled}
                                    >
                                        <Icon icon="mingcute:volume-line" className="w-3.5 h-3.5 text-white" />
                                    </button>
                                    <div className="flex-1 h-[2px] rounded-full relative overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                        <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: flipWidth }} />
                                    </div>
                                </div>
                                {/* BG Sound */}
                                <div className="flex items-center gap-3">
                                    <button
                                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent cursor-pointer hover:bg-white/10') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                                        style={isBgActive ? { backgroundColor: 'rgba(255,255,255,0.15)' } : {}}
                                        onClick={handleBgClick}
                                        disabled={!bgSoundMasterEnabled}
                                    >
                                        <Icon icon="solar:music-notes-bold" className="w-3.5 h-3.5 text-white" />
                                    </button>
                                    <div className="flex-1 h-[2px] rounded-full relative overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                        <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: bgWidth }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <audio ref={bgAudioRef} />
                    <audio ref={flipAudioRef} />
                </div>
            );
        }
        const isLayout2 = activeLayout == 2;
        const isLayout3 = activeLayout == 3;

        if (isLandscape && isLayout3) {
            return (
                <div
                    className="absolute inset-0 z-[3000] flex items-start justify-end pt-[7vh] pr-[8vw] pointer-events-auto"
                    onClick={onClose}
                >
                    <div
                        className="pointer-events-auto animate-in zoom-in-95 duration-200"
                        style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Layout3 {...commonProps} />
                    </div>
                    <audio ref={bgAudioRef} />
                    <audio ref={flipAudioRef} />
                </div>
            );
        }

        return (
            <div
                className={`absolute inset-0 z-[3000] flex ${isLayout2 ? `justify-start items-end pb-[7.5rem] ${isLandscape ? 'pl-[42%]' : 'pl-4'}` : (isLayout3 ? `justify-start items-start ${isLandscape ? 'pt-[60px] left-[64%]' : 'pt-[135px] left-[55%]'} -translate-x-1/2` : 'justify-end items-start pt-[150px] pr-[16px]')} pointer-events-auto`}
                onClick={onClose}
            >
                <div
                    style={isLayout2 && isLandscape ? { transform: 'scale(0.75)', transformOrigin: 'bottom left' } : {}}
                    className="pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MobileLayout {...commonProps} isLandscape={isLandscape} />
                </div>
                <audio ref={bgAudioRef} />
                <audio ref={flipAudioRef} />
            </div>
        );
    }

    if (layout === 5) {
        return (
            <>
                <audio ref={bgAudioRef} />
                <audio ref={flipAudioRef} />
            </>
        );
    }

    return (
        <div className={`absolute inset-0 z-[100] overflow-hidden flex items-center justify-center pointer-events-none ${activeLayout === 9 ? 'opacity-0 scale-0' : ''}`}>
            <div className="absolute inset-0 z-[110] pointer-events-auto cursor-default" onClick={onClose} />
            <div className={`absolute ${getPosition()} z-[120] pointer-events-auto`}>
                {(() => {
                    switch (layout) {
                        case 1: return <Layout1 {...commonProps} />;
                        case 2: return <Layout2 {...commonProps} />;
                        case 3: return <Layout3 {...commonProps} />;
                        case 4: return <Layout4 {...commonProps} />;
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
