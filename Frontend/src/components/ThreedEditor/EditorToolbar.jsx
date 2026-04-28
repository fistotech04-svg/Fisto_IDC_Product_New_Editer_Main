import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import ColorPicker from "./ColorPicker";

export default function EditorToolbar({ 
    hasModel, 
    settings, 
    setSettings, 
    onClear, 
    transformMode, 
    setTransformMode, 
    onAddClick,
    onGalleryClick,
    onScreenshotClick,
    isScreenshotOpen
}) {
    const [showSettings, setShowSettings] = useState(false);

    const handleModeToggle = (mode) => {
        if (transformMode === mode) {
            setTransformMode(null); // Toggle off
        } else {
            setTransformMode(mode);
        }
    };
    const [activeColorPicker, setActiveColorPicker] = useState(null); // 'bg' | 'base' | null
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
    const settingsRef = useRef(null);

    // Close settings when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            // If clicking inside the color picker, don't close
            if (activeColorPicker && event.target.closest(".color-picker-popover")) return;

            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                // Only close if we are not interacting with the active color picker
                setShowSettings(false);
                setActiveColorPicker(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeColorPicker]);

    const updateSetting = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleBasePickerToggle = (e) => {
        e.stopPropagation();
        if (activeColorPicker === 'base') {
            setActiveColorPicker(null);
        } else {
            if (settingsRef.current) {
                const rect = settingsRef.current.getBoundingClientRect();
                setPickerPos({
                    top: rect.top,
                    left: rect.right + 12
                });
            }
            setActiveColorPicker('base');
        }
    };

    return (
        <div className={`absolute right-[1vw] z-49 flex flex-col items-center gap-[0.75vw] transition-all duration-500 ease-in-out ${hasModel ? "top-[5vw]" : "top-[2.5vw]"}`}>
            
            {/* SETTINGS POPOVER */}
            {showSettings && (
                <div 
                    ref={settingsRef}
                    className="absolute right-[3.5vw] top-[5vw] w-[16vw] bg-white rounded-[0.75vw] shadow-xl border border-gray-100 p-[1vw] animate-in fade-in slide-in-from-right-4 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-[1.25vw]">
                        <div className="flex items-center gap-[0.5vw]">
                             <Icon icon="heroicons:cog-6-tooth" width="1vw" height="1vw" className="text-gray-800" />
                             <span className="font-semibold text-gray-800 text-[0.85vw]">Settings</span>
                        </div>
                        <button 
                            onClick={() => { setShowSettings(false); setActiveColorPicker(null); }}
                           className="p-[0.35vw] rounded-[0.4vw] cursor-pointer text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                        >
                             <Icon icon="heroicons:x-mark" width="1vw" />   
                        </button>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-[1vw] pt-[0.5vw]">
                        <div>
                            <ToggleRow 
                                label="Base" 
                                isActive={settings?.base} 
                                onToggle={() => updateSetting("base", !settings?.base)} 
                            />
                            {settings?.base && (
                                <div className="mt-[0.75vw] flex items-center gap-[0.5vw] pl-[0.125vw] relative">
                                    <div 
                                        className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
                                        style={{ backgroundColor: settings.baseColor || '#000000' }}
                                        onClick={handleBasePickerToggle}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    ></div>
                                    
                                    <div 
                                        className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] bg-white hover:border-gray-300 transition-colors shadow-sm cursor-pointer"
                                        onClick={handleBasePickerToggle}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <span className="text-[0.6vw] text-gray-600 font-medium tracking-wide font-mono uppercase">{settings.baseColor || '#000000'}</span>
                                        <span className="text-[0.6vw] text-gray-400 font-medium">100%</span>
                                    </div>

                                </div>
                            )}
                        </div>
                        
                        <ToggleRow 
                            label="Grid lines" 
                            isActive={settings?.grid} 
                            onToggle={() => updateSetting("grid", !settings?.grid)} 
                        />
                        <ToggleRow 
                            label="Wireframe" 
                            isActive={settings?.wireframe} 
                            onToggle={() => updateSetting("wireframe", !settings?.wireframe)} 
                        />
                    </div>

                    {/* Clear Model Action */}
                    <div className="pt-[1vw] mt-[1vw] border-t border-gray-100">
                        <button
                            onClick={() => {
                                onClear();
                                setShowSettings(false);
                            }} 
                            className="w-full py-[0.6vw] px-[1vw] bg-red-50 text-red-600 text-[0.75vw] font-semibold rounded-[0.75vw] flex items-center justify-center gap-[0.5vw] hover:bg-red-100 transition-colors active:scale-95"
                        >
                            <Icon icon="heroicons:trash" width="0.95vw" height="0.95vw" />
                            Clear 3D Model
                        </button>
                    </div>

                    {/* Color Picker Sidebar */}
                    {activeColorPicker === 'base' && createPortal(
                        <div 
                            className="fixed z-[9999] color-picker-popover"
                            style={{ top: pickerPos.top, left: pickerPos.left }}
                        >
                            <ColorPicker 
                                color={settings.baseColor || '#2c2c2c'}
                                onChange={(c) => updateSetting('baseColor', c)}
                                onClose={() => setActiveColorPicker(null)}
                                className="block"
                            />
                        </div>,
                        document.body
                    )}
                </div>
            )}

            {/* MAIN TOOLBAR */}
            <div className="w-[3vw] bg-white rounded-[0.75vw] border-2 border-gray-300 py-[0.25vw] flex flex-col items-center gap-[0.5vw] shadow-sm">
                <ToolbarButton icon="material-symbols:add-rounded" enabled onClick={onAddClick} />
                <ToolbarButton icon="solar:gallery-wide-outline" enabled onClick={onGalleryClick} />
                <ToolbarButton 
                    icon="solar:camera-outline" 
                    enabled={hasModel} 
                    active={isScreenshotOpen}
                    onClick={onScreenshotClick}
                />
                <ToolbarButton 
                    icon="heroicons:cog-6-tooth" 
                    enabled
                    active={showSettings}
                    onClick={() => setShowSettings(!showSettings)}
                />
            </div>

            {/* SECONDARY TOOLBAR (TRANSFORM TOOLS) */}
            {hasModel && (
                <div className="w-[3vw] bg-white rounded-[0.75vw] border-2 border-gray-300 py-[0.25vw] flex flex-col items-center gap-[0.5vw] animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                    <ToolbarButton 
                        icon="si:move-line" 
                        active={transformMode === 'translate'}
                        onClick={() => handleModeToggle('translate')}
                        enabled 
                    />
                    <ToolbarButton 
                        icon="mdi:rotate-orbit" 
                        active={transformMode === 'rotate'}
                        onClick={() => handleModeToggle('rotate')}
                        enabled 
                    />
                    <ToolbarButton 
                        icon="solar:scale-outline" 
                        active={transformMode === 'scale'}
                        onClick={() => handleModeToggle('scale')}
                        enabled 
                    />
                </div>
            )}
        </div>
    );
}

function ToggleRow({ label, isActive, onToggle }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[0.75vw] text-gray-600 font-medium">{label}</span>
            <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw] relative top-[0.25vw] opacity-50"></div>
            <button 
                onClick={onToggle}
                className={`w-[2.25vw] h-[1.25vw] rounded-full relative transition-colors duration-200 ease-in-out ${
                    isActive ? "bg-[#5d5efc]" : "bg-gray-200"
                }`}
            >
                <div 
                    className={`absolute top-[0.125vw] w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                        isActive ? "left-[1.125vw]" : "left-[0.125vw]"
                    }`}
                />
            </button>
        </div>
    );
}

function ToolbarButton({ icon, active, enabled = true, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={!enabled}
            className={`w-[2.25vw] h-[2.25vw] flex items-center justify-center rounded-[0.4vw] transition-all border ${
                !enabled 
                    ? "text-gray-300 cursor-not-allowed opacity-50 border-transparent" 
                    : active 
                        ? "bg-[#5d5efc] text-white shadow-md shadow-indigo-200 border-transparent" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200 cursor-pointer border-transparent"
            }`}
        >
            <Icon icon={icon} width="1.04vw" height="1.04vw" />
        </button>
    );
}
