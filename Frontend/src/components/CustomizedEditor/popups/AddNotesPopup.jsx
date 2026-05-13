import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X, Pipette, Pencil } from 'lucide-react';
import ColorPallet from '../ColorPallet';
import { rgbToHex, hexToRgb, rgbToHsv, hsvToRgb } from '../AppearanceShared';

// Helper functions for color conversion
const hexToHsv = (hex) => {
    let color = hex.substring(1);
    if (color.length === 3)
        color = color.split("").map((c) => c + c).join("");
    const r = parseInt(color.substring(0, 2), 16) / 255;
    const g = parseInt(color.substring(2, 4), 16) / 255;
    const b = parseInt(color.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    let h = 0;

    if (max !== min) {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = ({ h, s, v }) => {
    s /= 100;
    v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    const toHex = (n) =>
        Math.round((n + m) * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const ColorPicker = ({ color, onChange, opacity, onOpacityChange, onClose, position, customWidth, customHeight }) => {
    const [hsv, setHsv] = useState(() => hexToHsv(color));

    useEffect(() => {
        setHsv(hexToHsv(color));
    }, [color]);

    const handleSaturationChange = useCallback((e, container) => {
        const { width, height, left, top } = container.getBoundingClientRect();
        const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
        const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);

        const newHsv = { ...hsv, s: x * 100, v: (1 - y) * 100 };
        setHsv(newHsv);
        onChange(hsvToHex(newHsv));
    }, [hsv, onChange]);

    const handleHueChange = useCallback((e, container) => {
        const { height, top } = container.getBoundingClientRect();
        const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);

        const newHsv = { ...hsv, h: y * 360 };
        setHsv(newHsv);
        onChange(hsvToHex(newHsv));
    }, [hsv, onChange]);

    const useDrag = (handler) => {
        const isDragging = useRef(false);
        const containerRef = useRef(null);

        const onMouseDown = (e) => {
            isDragging.current = true;
            handler(e, containerRef.current);
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        };

        const onMouseMove = (e) => {
            if (isDragging.current) {
                e.preventDefault();
                handler(e, containerRef.current);
            }
        };

        const onMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        return { onMouseDown, ref: containerRef };
    };

    const satDrag = useDrag(handleSaturationChange);
    const hueDrag = useDrag(handleHueChange);

    const hueColor = hsvToHex({ h: hsv.h, s: 100, v: 100 });

    const handleEyeDropper = async () => {
        if (!window.EyeDropper) return;
        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            onChange(result.sRGBHex.toUpperCase());
        } catch (e) { }
    };

    return (
        <div
            className={`fixed z-[1000] ${customWidth ? customWidth : 'w-[250px]'} bg-white rounded-[15px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200 select-none font-sans pointer-events-auto`}
            style={position ? { top: position.y, left: position.x } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-grow">
                    <span className="text-[12px] font-bold text-gray-900 whitespace-nowrap">Colors Pallet</span>
                    <div className="h-px w-full bg-gray-100"></div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="ml-1.5 w-6 h-6 rounded-md border-[1.5px] border-[#ff4d4d] flex items-center justify-center text-[#ff4d4d] hover:bg-[#ff4d4d] hover:text-white transition-all shadow-sm active:scale-90"
                >
                    <Icon icon="heroicons:x-mark" width={14} className="stroke-[2.5]" />
                </button>
            </div>

            {/* Main Area */}
            <div className={`flex gap-2 ${customHeight ? customHeight : 'h-[85px]'} mb-2`}>
                {/* Saturation/Value Box */}
                <div
                    ref={satDrag.ref}
                    onMouseDown={satDrag.onMouseDown}
                    className="flex-1 rounded-lg relative cursor-crosshair overflow-hidden"
                    style={{ backgroundColor: hueColor }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

                    {/* Circular Thumb */}
                    <div
                        className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md -ml-1.5 -mt-1.5 pointer-events-none"
                        style={{
                            left: `${hsv.s}%`,
                            top: `${100 - hsv.v}%`,
                        }}
                    />
                </div>

                {/* Vertical Hue Slider */}
                <div
                    ref={hueDrag.ref}
                    onMouseDown={hueDrag.onMouseDown}
                    className="w-4 rounded-full relative cursor-pointer"
                    style={{
                        background: "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
                    }}
                >
                    {/* Thumb with lines */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 w-6 h-6 pointer-events-none"
                        style={{ top: `${(hsv.h / 360) * 100}%`, marginTop: '-12px' }}
                    >
                        <div className="absolute top-1/2 left-0 w-full h-px bg-white"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-white rounded-full shadow-sm">
                            <div
                                className="w-full h-full rounded-full border border-gray-100"
                                style={{ backgroundColor: hsvToHex(hsv) }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleEyeDropper}
                        className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all border border-gray-100"
                    >
                        <Pipette size={14} />
                    </button>
                    <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                    />
                </div>

                {/* Hex Input */}
                <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-gray-700">Color Code :</span>
                    <div className="flex items-center gap-1.5 border-[1.5px] border-gray-200 rounded-lg px-1.5 py-1 w-[120px] focus-within:border-[#5d5efc] transition-all bg-white">
                        <span className="text-gray-400 text-[10px] font-bold">#</span>
                        <input
                            type="text"
                            value={color.replace("#", "").toLowerCase()}
                            onChange={(e) => onChange(`#${e.target.value}`)}
                            className="w-full text-[12px] font-bold text-gray-600 outline-none lowercase font-mono bg-transparent"
                            maxLength={6}
                        />
                        <Icon icon="heroicons:pencil" width={14} className="text-gray-400" />
                    </div>
                </div>

                {/* Opacity Slider */}
                <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-gray-700">Opacity :</span>
                    <div className="flex items-center gap-2 w-[120px]">
                        <div className="relative flex-1 h-1 bg-gray-100 rounded-full">
                            <div
                                className="absolute top-0 left-0 h-full bg-[#7c5dff] rounded-full"
                                style={{ width: `${opacity}%` }}
                            ></div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={opacity}
                                onChange={(e) => onOpacityChange && onOpacityChange(parseInt(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#7c5dff] border-2 border-white rounded-full shadow-sm pointer-events-none"
                                style={{ left: `${opacity}%`, marginLeft: "-7px" }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const DesktopLayout2 = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
    setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, totalPages, isSpread, ColorPallet, Icon,
    getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha,
    isEditingPage, setIsEditingPage, targetPageIndex, setTargetPageIndex,
    activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen
}) => {
    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
            onClick={onClose}
        >
            <div
                className="w-[35vw] rounded-[1.2vw] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 p-[0.5vw] relative backdrop-blur-md border border-white/30"
                style={{
                    transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)',
                    transformOrigin: 'center center',
                    backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2)
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="w-full h-full rounded-[0.8vw] shadow-inner flex flex-col relative border border-white/20 p-[1.2vw] overflow-hidden"
                    style={{ backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.2 + var(--dropdown-bg-opacity, 1) * 0.8))" }}
                >
                    <div className="absolute inset-0 bg-white -z-[1]" />
                    {/* Header */}
                    <div className="flex items-center justify-between mb-[0.4vw]">
                        <span className="text-[1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Notes</span>
                        <button
                            onClick={onClose}
                            className="transition-colors"
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }}
                        >
                            <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                        </button>
                    </div>
                    <div className="w-full h-[1px] mb-[0.8vw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }} />

                    <div className="flex gap-[1vw]">
                        {/* Left - Colors */}
                        <div className="flex flex-col gap-[0.4vw]">
                            {['#34B1AA', '#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54', '#23D295'].map((color, i) => (
                                <div
                                    key={i}
                                    onClick={() => setNoteBackground(color)}
                                    className={`w-[1.6vw] h-[1.6vw] rounded-full cursor-pointer hover:scale-110 transition-transform border-[0.1vw] ${noteBackground === color ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-[1.6vw] h-[1.6vw] rounded-full cursor-pointer hover:scale-110 transition-transform flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] color-picker-trigger"
                            >
                                <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-white/50" />
                            </div>
                        </div>

                        {/* Middle - Sticky Note */}
                        <div
                            className="relative w-[21.5vw] h-[15.5vw] rounded-[0.6vw] p-[0.7vw] shadow-lg flex flex-col transition-colors duration-300"
                            style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                        >
                            <div className="absolute top-[0.5vw] right-[0.8vw] z-20 flex items-center gap-[0.3vw] hover:bg-white/10 rounded px-[0.3vw] py-[0.1vw] transition-colors cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                            >
                                <span className="text-[0.65vw] font-bold text-white opacity-90">{pageDisplay}</span>
                                <Icon icon="lucide:pencil" className="w-[0.9vw] h-[0.9vw] text-white opacity-80" />

                                {isPageDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-[0.2vw] w-[6vw] max-h-[10vw] bg-white rounded-[0.4vw] shadow-2xl overflow-y-auto custom-scrollbar z-[100] border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                        {Array.from({ length: totalPages || 1 }, (_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setTargetPageIndex(i);
                                                    setIsPageDropdownOpen(false);
                                                }}
                                                className={`px-[0.8vw] py-[0.4vw] text-[0.75vw] cursor-pointer transition-colors ${targetPageIndex === i ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter Your Notes"
                                style={{
                                    textAlign: noteAlignment,
                                    fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                    fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                    textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                    textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                    fontFamily: noteFontFamily,
                                    fontSize: `${noteFontSize}px`,
                                    color: noteTextColor,
                                    opacity: noteTextOpacity / 100,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    width: '100%',
                                    height: '100%'
                                }}
                                className="flex-1 pt-[1.8vw] placeholder:text-white/40 font-medium overflow-y-auto custom-scrollbar"
                            />
                        </div>

                        {/* Right - Controls */}
                        <div className="flex-1 flex flex-col gap-[0.4vw]" onClick={() => setActiveFormattingTab(null)}>
                            {/* Properties Title */}
                            <div className="flex items-center gap-[0.3vw]">
                                <span className="text-[0.85vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Text Property</span>
                                <div className="flex-1 h-[1px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }} />
                            </div>

                            {/* Font Family Selection */}
                            <div className="relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between border-[1px] rounded-[0.4rem] px-[0.6vw] py-[0.3vh] cursor-pointer transition-all`}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: isFontMenuOpen ? getLayoutColor('dropdown-text', '#FFFFFF') : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                    }}
                                >
                                    <span className="text-[0.7vw] font-bold truncate" style={{ fontFamily: noteFontFamily, color: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                        {noteFontFamily}
                                    </span>
                                    <Icon icon="lucide:chevron-down" className={`w-[0.9vw] h-[0.9vw] transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                                </div>

                                {isFontMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-[0.2vw] bg-white border border-gray-200 rounded-[0.4rem] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-[8vw] overflow-y-auto custom-scrollbar py-[0.2vw]">
                                            {fonts.map((font) => (
                                                <div
                                                    key={font}
                                                    onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }}
                                                    className={`px-[0.6vw] py-[0.4vw] text-[0.65vw] cursor-pointer transition-colors`}
                                                    style={{
                                                        fontFamily: font,
                                                        backgroundColor: noteFontFamily === font ? getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05) : 'transparent',
                                                        color: noteFontFamily === font ? getLayoutColor('dropdown-text', '#3E4491') : getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.8)
                                                    }}
                                                    onMouseOver={(e) => { if (noteFontFamily !== font) e.currentTarget.style.backgroundColor = getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.02); }}
                                                    onMouseOut={(e) => { if (noteFontFamily !== font) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                >
                                                    {font}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Weight and Size Row */}
                            <div className="flex gap-[0.4vw]">
                                <div className="flex-1 relative">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between border-[1px] rounded-[0.4rem] px-[0.6vw] py-[0.3vh] cursor-pointer transition-all`}
                                        style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            borderColor: isWeightMenuOpen ? getLayoutColor('dropdown-text', '#FFFFFF') : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                        }}
                                    >
                                        <span className="text-[0.7vw] font-bold truncate" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{noteWeight}</span>
                                        <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] transition-transform" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                                    </div>
                                    {isWeightMenuOpen && (
                                        <div className="absolute top-full left-0 w-full mt-[0.2vw] bg-white border border-gray-200 rounded-[0.4rem] shadow-xl z-50 py-[0.2vw]">
                                            {weights.map((w) => (
                                                <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className={`px-[0.6vw] py-[0.3vw] text-[0.65vw] cursor-pointer`}
                                                    style={{
                                                        backgroundColor: noteWeight === w ? getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05) : 'transparent',
                                                        color: noteWeight === w ? getLayoutColor('dropdown-text', '#3E4491') : getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.8),
                                                        fontWeight: noteWeight === w ? 'bold' : 'normal'
                                                    }}
                                                    onMouseOver={(e) => { if (noteWeight !== w) e.currentTarget.style.backgroundColor = getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.02); }}
                                                    onMouseOut={(e) => { if (noteWeight !== w) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                >{w}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="w-[4vw] relative">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between border-[1px] rounded-[0.4rem] px-[0.6vw] py-[0.3vh] cursor-pointer transition-all`}
                                        style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            borderColor: isSizeMenuOpen ? getLayoutColor('dropdown-text', '#FFFFFF') : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                        }}
                                    >
                                        <span className="text-[0.7vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{noteFontSize}</span>
                                        <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw]" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                                    </div>
                                    {isSizeMenuOpen && (
                                        <div className="absolute top-full right-0 w-full mt-[0.2vw] bg-white border border-gray-200 rounded-[0.4rem] shadow-xl z-50 py-[0.2vw] text-center">
                                            <div className="max-h-[6vw] overflow-y-auto custom-scrollbar">
                                                {sizes.map((s) => (
                                                    <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className={`px-[0.6vw] py-[0.3vw] text-[0.65vw] cursor-pointer`}
                                                        style={{
                                                            backgroundColor: noteFontSize === s ? getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05) : 'transparent',
                                                            color: noteFontSize === s ? getLayoutColor('dropdown-text', '#3E4491') : getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.8),
                                                            fontWeight: noteFontSize === s ? 'bold' : 'normal'
                                                        }}
                                                        onMouseOver={(e) => { if (noteFontSize !== s) e.currentTarget.style.backgroundColor = getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.02); }}
                                                        onMouseOut={(e) => { if (noteFontSize !== s) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >{s}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Formatting Buttons Row (4 icons as per screenshot) */}
                            <div className="flex gap-[0.4vw] justify-center relative">
                                <AnimatePresence mode="wait">
                                    {activeFormattingTab && (
                                        <motion.div
                                            key={activeFormattingTab}
                                            initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute bottom-full right-0 mb-[0.6vw] z-[60]"
                                        >
                                            <div className="flex items-center gap-[0.2vw] bg-[#1A1A1A] p-[0.3vw] rounded-full shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                                                {activeFormattingTab === 'align' && (
                                                    <>
                                                        {['left', 'center', 'right', 'justify'].map((id) => (
                                                            <button
                                                                key={id}
                                                                onClick={() => setNoteAlignment(id)}
                                                                className={`w-[2.4vw] h-[2vw] rounded-full flex items-center justify-center transition-all ${noteAlignment === id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <Icon icon={`lucide:align-${id}`} className="w-[1.1vw] h-[1.1vw]" />
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {activeFormattingTab === 'style' && (
                                                    <>
                                                        {['bold', 'italic', 'underline', 'strike'].map((id) => (
                                                            <button
                                                                key={id}
                                                                onClick={() => toggleNoteStyle(id)}
                                                                className={`w-[2.4vw] h-[2vw] rounded-full flex items-center justify-center transition-all ${noteStyles.includes(id) ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <span className={`text-[1vw] font-bold ${id === 'italic' ? 'italic' : id === 'underline' ? 'underline' : id === 'strike' ? 'line-through' : ''}`}>{id === 'bold' ? 'B' : id === 'italic' ? 'I' : id === 'underline' ? 'U' : 'S'}</span>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {activeFormattingTab === 'case' && (
                                                    <>
                                                        {['none', 'sentence', 'upper', 'lower'].map((id) => (
                                                            <button
                                                                key={id}
                                                                onClick={() => setNoteCase(id)}
                                                                className={`w-[2.4vw] h-[2vw] rounded-full flex items-center justify-center transition-all ${noteCase === id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <span className="text-[0.9vw] font-bold">{id === 'none' ? '—' : id === 'sentence' ? 'Aa' : id === 'upper' ? 'AB' : 'ab'}</span>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {activeFormattingTab === 'list' && (
                                                    <>
                                                        {['bullet', 'ordered'].map((id) => (
                                                            <button
                                                                key={id}
                                                                onClick={() => handleListClick(id)}
                                                                className={`w-[2.4vw] h-[2vw] rounded-full flex items-center justify-center transition-all ${noteList === id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <Icon icon={id === 'ordered' ? 'lucide:list-ordered' : 'lucide:list'} className="w-[1.1vw] h-[1.1vw]" />
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {[
                                    { id: 'align', icon: 'lucide:align-left', action: () => setActiveFormattingTab(prev => prev === 'align' ? null : 'align') },
                                    { id: 'style', label: 'B', action: () => setActiveFormattingTab(prev => prev === 'style' ? null : 'style') },
                                    { id: 'case', label: 'Aa', action: () => setActiveFormattingTab(prev => prev === 'case' ? null : 'case') },
                                    { id: 'list', icon: 'lucide:list', action: () => setActiveFormattingTab(prev => prev === 'list' ? null : 'list') }
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                        className={`w-[2.5vw] h-[2.2vw] rounded-[0.4rem] border-[1px] flex items-center justify-center transition-all shadow-sm`}
                                        style={{
                                            backgroundColor: activeFormattingTab === btn.id ? getLayoutColor('dropdown-text', '#FFFFFF') : 'rgba(255, 255, 255, 0.1)',
                                            borderColor: activeFormattingTab === btn.id ? 'transparent' : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                            color: activeFormattingTab === btn.id ? getLayoutColor('dropdown-bg', '#575C9C') : getLayoutColor('dropdown-text', '#FFFFFF')
                                        }}
                                    >
                                        {btn.icon ? <Icon icon={btn.icon} className="w-[1vw] h-[1vw]" /> : <span className="text-[1vw] font-bold">{btn.label}</span>}
                                    </button>
                                ))}
                            </div>

                            {/* Color Selection Wrapper (Compact row as per screenshot) */}
                            <div className="flex items-center gap-[0.4vw]">
                                <div
                                    className="w-[1.8vw] h-[1.8vw] rounded-[0.4rem] border-[1px] shadow-sm cursor-pointer flex-shrink-0"
                                    style={{
                                        backgroundColor: noteTextColor,
                                        borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2)
                                    }}
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.left - 180, y: rect.top - 50 });
                                        setPickerTarget('text');
                                        setShowColorPicker(true);
                                    }}
                                />
                                <div className="flex-1 h-[2vw] flex items-center justify-between border-[1px] rounded-[0.4rem] px-[0.6vw]"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2)
                                    }}
                                >
                                    <span className="text-[0.65vw] font-bold uppercase tracking-tight" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{noteTextColor}</span>
                                    <div className="flex items-center" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.7 }}>
                                        <input
                                            type="text"
                                            value={noteTextOpacity}
                                            onChange={(e) => setNoteTextOpacity(e.target.value)}
                                            className="w-[1.4vw] text-right bg-transparent outline-none text-[0.65vw] font-bold"
                                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                        />
                                        <span className="text-[0.65vw] font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons Row (Clear and Add To Notes) */}
                            <div className="flex items-center gap-[0.5vw] mt-[0.5vw]">
                                <button
                                    onClick={resetNote}
                                    className="flex-1 h-[2.2vw] border-[1px] rounded-[0.5rem] flex items-center justify-center gap-[0.3vw] transition-all font-bold text-[0.7vw] hover:bg-white/10"
                                    style={{
                                        borderColor: getLayoutColor('dropdown-text', '#FFFFFF'),
                                        color: getLayoutColor('dropdown-text', '#FFFFFF')
                                    }}
                                >
                                    <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: `Page ${(targetPageIndex + 1).toString().padStart(2, '0')}`,
                                            pageIndex: targetPageIndex
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.8] h-[2.2vw] rounded-[0.5rem] text-[0.8vw] font-bold transition-all shadow-md"
                                    style={{
                                        backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'),
                                        color: getLayoutColor('dropdown-bg', '#575C9C')
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    Add To Notes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Floating Color Picker to match exact place in screenshot */}
                    {showColorPicker && (
                        <div className="absolute z-[1000] right-[0.5vw] top-[3.2vw] w-[12vw] animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                            <ColorPallet
                                inline={true}
                                smallMode={true}
                                color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                                opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                                onOpacityChange={(val) => {
                                    if (pickerTarget === 'text') setNoteTextOpacity(val);
                                    else setNoteBgOpacity(val);
                                }}
                                onChange={(color) => {
                                    if (pickerTarget === 'text') setNoteTextColor(color);
                                    else setNoteBackground(color);
                                }}
                                onClose={() => setShowColorPicker(false)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const MobileLayout = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker,
    setPickerTarget, setPickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, showColorPicker, pickerTarget,
    currentPageIndex, activeLayout, isLandscape, pickerPos,
    getLayoutColorAlpha, isPageDropdownOpen, setIsPageDropdownOpen, ColorPallet,
    activeFormattingTab, setActiveFormattingTab, isMobile, Icon, getLayoutColor,
    getLayoutColorRgba, targetPageIndex, isMobileLandscape, totalPages, setTargetPageIndex
}) => {
    const isLayout2 = Number(activeLayout) === 2;
    const isNewDesignLayout = ((Number(activeLayout) === 4 && !isMobileLandscape) || Number(activeLayout) === 9 || isMobile) && !isLandscape && !isMobileLandscape;
    const isOldSpecificLayout = ([5, 6].includes(Number(activeLayout)) || (Number(activeLayout) === 4 && isLandscape && !isMobileLandscape)) && !isNewDesignLayout && !isMobile;

    if (isMobile && isLandscape && ![1, 5].includes(Number(activeLayout))) {
        return (
            <div
                className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-auto bg-transparent p-2 overflow-hidden"
                onClick={onClose}
            >
                <div className="scale-[0.75] origin-center flex items-center justify-center pointer-events-none w-full h-full">
                    <div
                        className="w-[95%] max-w-[650px] h-[95%] max-h-[85%] bg-white rounded-[20px] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header: Title + Action Circles */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-[14px] font-bold text-gray-900">Add Notes</span>
                                <div className="h-[1px] flex-1 bg-gray-100 max-w-[280px]"></div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={onClose}
                                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all bg-white text-[#EB5757] hover:bg-red-50 border-[2px] border-[#EB5757] shadow-sm active:scale-90"
                                >
                                    <Icon icon="lucide:x" className="w-[14px] h-[14px] stroke-[3]" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: `Page ${(targetPageIndex ?? currentPageIndex) + 1}`,
                                            pageIndex: targetPageIndex ?? currentPageIndex
                                        });
                                        onClose();
                                    }}
                                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all bg-white text-[#27AE60] hover:bg-green-50 border-[2px] border-[#27AE60] shadow-sm active:scale-90"
                                >
                                    <Icon icon="lucide:check" className="w-[14px] h-[14px] stroke-[3]" />
                                </button>
                            </div>
                        </div>

                        {/* Main Content Body */}
                        <div className="flex-1 flex p-4 gap-5 overflow-y-auto no-scrollbar">
                            {/* Left Column: Color Palette */}
                            <div className="flex flex-col gap-2 pt-1">
                                {['#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54'].map((color, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setNoteBackground(color)}
                                        className={`w-[28px] h-[28px] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm border-[1px] ${noteBackground === color ? 'border-gray-800' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <div
                                    onClick={() => { setPickerTarget('background'); setShowColorPicker(true); }}
                                    className="w-[28px] h-[28px] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
                                />
                            </div>

                            {/* Middle Column: Note Preview */}
                            <div className="flex-[1.2] relative min-h-[160px]">
                                <div
                                    className="relative w-full h-full rounded-[15px] p-4 shadow-xl flex flex-col transition-all duration-300"
                                    style={{ backgroundColor: noteBackground || '#D9DC54', opacity: noteBgOpacity / 100 }}
                                >
                                    <textarea
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Enter your Notes"
                                        style={{
                                            textAlign: noteAlignment,
                                            fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                            fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                            textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                            textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                            fontFamily: noteFontFamily,
                                            fontSize: `${Math.max(13, Number(noteFontSize) - 2)}px`,
                                            color: noteTextColor,
                                            opacity: noteTextOpacity / 100,
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            resize: 'none',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                        className="flex-1 placeholder:text-black/30 font-bold overflow-y-auto no-scrollbar"
                                    />
                                    <div className="flex justify-end mt-1 items-center pointer-events-none">
                                        <span className="text-[10px] font-extrabold text-[#333] opacity-60">Page {((targetPageIndex ?? currentPageIndex) + 1).toString().padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Properties Panel */}
                            <div className="flex-1 flex flex-col gap-3 min-w-[210px]" onClick={() => setActiveFormattingTab(null)}>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[12px] font-bold text-gray-900 whitespace-nowrap tracking-tight">Text Properties</span>
                                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {/* Font Family Dropdown */}
                                        <div className="relative">
                                            <div
                                                onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                                className="h-[34px] w-full flex items-center justify-between border-[1px] border-gray-300 rounded-[10px] px-3 bg-white cursor-pointer shadow-sm"
                                            >
                                                <span className="text-[12px] font-medium text-gray-700 truncate" style={{ fontFamily: noteFontFamily }}>{noteFontFamily}</span>
                                                <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400" />
                                            </div>
                                            {isFontMenuOpen && (
                                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1 max-h-[100px] overflow-y-auto">
                                                    {fonts.map(font => (
                                                        <div key={font} onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }} className="px-3 py-1.5 text-[11px] hover:bg-gray-50 text-gray-700" style={{ fontFamily: font }}>{font}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Weight & Size Row */}
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); }}
                                                    className="h-[34px] flex items-center justify-between border-[1px] border-gray-300 rounded-[10px] px-3 bg-white cursor-pointer shadow-sm"
                                                >
                                                    <span className="text-[12px] font-medium text-gray-700 truncate">{noteWeight}</span>
                                                    <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400" />
                                                </div>
                                                {isWeightMenuOpen && (
                                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1">
                                                        {weights.map(w => (
                                                            <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className="px-3 py-1.5 text-[11px] hover:bg-gray-50 text-gray-700">{w}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-[75px] relative">
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                                    className="h-[34px] flex items-center justify-between border-[1px] border-gray-300 rounded-[10px] px-3 bg-white cursor-pointer shadow-sm"
                                                >
                                                    <span className="text-[12px] font-medium text-gray-700">{noteFontSize}</span>
                                                    <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400" />
                                                </div>
                                                {isSizeMenuOpen && (
                                                    <div className="absolute top-full right-0 w-[60px] mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1 max-h-[80px] overflow-y-auto">
                                                        {sizes.map(s => (
                                                            <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className="px-3 py-1.5 text-[11px] hover:bg-gray-50 text-center text-gray-700">{s}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Formatting Tools */}
                                        <div className="flex gap-1.5 mt-1">
                                            {[
                                                { id: 'bold', label: 'B', active: noteStyles.includes('bold'), onClick: () => toggleNoteStyle('bold') },
                                                { id: 'italic', label: 'I', active: noteStyles.includes('italic'), onClick: () => toggleNoteStyle('italic') },
                                                { id: 'underline', label: 'U', active: noteStyles.includes('underline'), onClick: () => toggleNoteStyle('underline') },
                                                { id: 'list', icon: 'lucide:list', active: noteList !== 'none', onClick: () => handleListClick('bullet') }
                                            ].map((btn) => (
                                                <button
                                                    key={btn.id}
                                                    onClick={btn.onClick}
                                                    className={`h-[34px] flex-1 rounded-[10px] border-[1px] flex items-center justify-center transition-all shadow-sm ${btn.active ? 'bg-gray-100 border-gray-400 text-black' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    {btn.icon ? <Icon icon={btn.icon} className="w-4 h-4" /> : <span className="text-[13px] font-bold">{btn.label}</span>}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Color & Transparency Row */}
                                        <div className="flex gap-2 items-center mt-1">
                                            <div
                                                className="w-[34px] h-[34px] rounded-[10px] border border-gray-300 shadow-sm cursor-pointer"
                                                style={{ backgroundColor: noteTextColor }}
                                                onClick={() => { setPickerTarget('text'); setShowColorPicker(true); }}
                                            />
                                            <div className="flex-1 h-[34px] flex items-center justify-between border border-gray-300 rounded-[10px] px-3 bg-white shadow-sm">
                                                <span className="text-[12px] font-bold text-gray-400 uppercase">{noteTextColor}</span>
                                                <span className="text-[12px] font-bold text-gray-400">{noteTextOpacity}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrated Color Picker */}
                {showColorPicker && (
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/10" onClick={() => setShowColorPicker(false)} />
                        <div className="relative" onClick={e => e.stopPropagation()}>
                            <ColorPallet
                                color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                                inline={false}
                                opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                                onOpacityChange={(val) => {
                                    if (pickerTarget === 'text') setNoteTextOpacity(val);
                                    else setNoteBgOpacity(val);
                                }}
                                onChange={(color) => {
                                    if (pickerTarget === 'text') setNoteTextColor(color);
                                    else setNoteBackground(color);
                                }}
                                onClose={() => setShowColorPicker(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isNewDesignLayout) {
        const isLayout9Portrait = isMobile && !isLandscape && Number(activeLayout) === 9;
        const isLayout2Portrait = isMobile && !isLandscape && Number(activeLayout) === 2;
        const isLayout3Portrait = isMobile && !isLandscape && Number(activeLayout) === 3;
        const isLayout4Portrait = isMobile && !isLandscape && Number(activeLayout) === 4;
        const isLayout1Portrait = isMobile && !isLandscape && Number(activeLayout) === 1;

        return (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4 bg-black/5 pointer-events-auto" onClick={onClose}>
                <div
                    className={`w-full max-w-[280px] max-h-[85%] overflow-y-auto ${isLayout4Portrait ? 'rounded-none bg-white' : 'rounded-[24px]'} shadow-2xl animate-in zoom-in-95 duration-200 ${isLayout9Portrait ? 'p-[6px] border border-white/20' : isLayout2Portrait || isLayout1Portrait ? 'backdrop-blur-xl p-[6px] border' : 'bg-transparent p-0'} custom-scrollbar-hidden scale-[0.95] origin-center pointer-events-auto`}
                    style={isLayout9Portrait || isLayout1Portrait ? { backgroundColor: getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.6), backdropFilter: 'blur(8px)', borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) } : {}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`w-full h-full flex flex-col gap-2 p-3 ${isLayout4Portrait ? 'rounded-none' : 'rounded-[18px]'} shadow-inner ${isLayout2Portrait || isLayout1Portrait ? '' : 'bg-white border border-gray-100'}`}
                        style={isLayout1Portrait ? { backgroundColor: getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.9) } : (isLayout2Portrait ? { backgroundColor: '#575C9C' } : {})}
                    >
                        {/* Header: Title + Line + Action Buttons */}
                        <div className={`flex items-center justify-between ${isMobile && !isLandscape && Number(activeLayout) === 8 ? 'bg-[#575C9C] -mx-3 -mt-3 px-3 py-2.5 rounded-t-[18px] mb-1' : ''}`}>
                            <div className="flex items-center gap-1.5 flex-grow mr-1.5">
                                <span className={`text-[13px] font-bold whitespace-nowrap ${isMobile && !isLandscape && (Number(activeLayout) === 2 || Number(activeLayout) === 1) ? 'text-white' : isMobile && !isLandscape && Number(activeLayout) === 8 ? 'text-white' : isMobile && !isLandscape && Number(activeLayout) === 3 || isLayout4Portrait ? 'text-[#575C9C]' : 'text-[#111]'}`}
                                    style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}
                                >Add Notes</span>
                                <div className={`h-[0.5px] flex-1 ${isMobile && !isLandscape && (Number(activeLayout) === 2 || Number(activeLayout) === 8 || Number(activeLayout) === 1) ? 'bg-white/20' : 'bg-gray-100'}`}
                                    style={isLayout1Portrait ? { backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 } : {}}
                                ></div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={onClose}
                                    className={`w-6 h-6 ${isLayout4Portrait ? 'rounded-none text-[#575C9C] hover:bg-gray-100' : 'rounded-md bg-white text-[#EB5757] hover:bg-red-50 border-[1px] border-[#EB5757]/30'} flex items-center justify-center transition-all active:scale-90`}
                                >
                                    <Icon icon="lucide:x" className="w-3 h-3 stroke-[2.5]" />
                                </button>
                                {!isLayout4Portrait && (
                                    <button
                                        onClick={() => {
                                            if (!noteContent.trim()) return;
                                            onAddNote({
                                                content: noteContent,
                                                background: noteBackground,
                                                color: noteTextColor,
                                                fontFamily: noteFontFamily,
                                                fontSize: noteFontSize,
                                                styles: noteStyles,
                                                alignment: noteAlignment,
                                                case: noteCase,
                                                list: noteList,
                                                bgOpacity: noteBgOpacity,
                                                textOpacity: noteTextOpacity,
                                                pageLabel: `Page ${p1.toString().padStart(2, '0')}`,
                                                pageIndex: targetPageIndex
                                            });
                                            onClose();
                                        }}
                                        className="w-6 h-6 rounded-md flex items-center justify-center transition-all bg-white text-[#27AE60] hover:bg-green-50 active:scale-90 border-[1px] border-[#27AE60]/30"
                                    >
                                        <Icon icon="lucide:check" className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Note Preview Area with Badge */}
                        <div
                            className={`relative w-full aspect-[16/11] ${isLayout4Portrait ? 'rounded-none' : 'rounded-[12px]'} p-3 shadow-inner flex flex-col transition-all duration-300`}
                            style={{ backgroundColor: noteBackground || '#D9DC54', opacity: noteBgOpacity / 100 }}
                        >
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter Your Notes"
                                style={{
                                    textAlign: noteAlignment,
                                    fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                    fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                    textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                    textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                    fontFamily: noteFontFamily,
                                    fontSize: `${Math.max(11, Number(noteFontSize) - 4)}px`,
                                    color: noteTextColor,
                                    opacity: noteTextOpacity / 100,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    width: '100%',
                                    height: '100%'
                                }}
                                className="flex-1 placeholder:text-black/30 font-bold text-[12px] overflow-y-auto custom-scrollbar"
                            />
                            <div
                                className="flex justify-end mt-1 items-center cursor-pointer hover:opacity-80 transition-opacity relative"
                                onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                            >
                                <span className="text-[9px] font-extrabold text-[#333] opacity-60 mr-1">{pageDisplay}</span>
                                <Icon icon="lucide:pencil" className="w-2.5 h-2.5 text-[#333] opacity-60" />

                                {isPageDropdownOpen && (
                                    <div className="absolute bottom-full right-0 mb-1 w-[80px] max-h-[120px] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-y-auto custom-scrollbar z-[100] border py-1" 
                                        style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) }}
                                        onClick={(e) => e.stopPropagation()}>
                                        {Array.from({ length: totalPages || 1 }, (_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setTargetPageIndex(i);
                                                    setIsPageDropdownOpen(false);
                                                }}
                                                className={`px-3 py-1.5 text-[10px] cursor-pointer transition-colors`}
                                                style={{ 
                                                    backgroundColor: targetPageIndex === i ? getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) : 'transparent',
                                                    color: getLayoutColor('dropdown-text', '#333'),
                                                    fontWeight: targetPageIndex === i ? 'bold' : 'normal'
                                                }}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Color Quick Selection Palette */}
                        <div className="flex items-center justify-between px-0.5">
                            {['#E2E2D0', '#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54', '#23D295'].map((color, i) => (
                                <div
                                    key={i}
                                    onClick={() => setNoteBackground(color)}
                                    className={`w-5 h-5 ${isLayout4Portrait ? 'rounded-none' : 'rounded-full'} cursor-pointer hover:scale-110 transition-transform shadow-sm border-[2px] ${noteBackground === color ? 'border-white ring-1 ring-gray-300' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <div
                                onClick={() => { setPickerTarget('background'); setShowColorPicker(true); }}
                                className={`w-5 h-5 ${isLayout4Portrait ? 'rounded-none' : 'rounded-full'} cursor-pointer hover:scale-110 transition-transform shadow-sm border-[1px] border-transparent bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]`}
                            />
                        </div>

                        {/* Properties Section Label */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-bold whitespace-nowrap`}
                                    style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}
                                >Text Property :</span>
                                <div className={`h-[0.5px] flex-1 ${isMobile && !isLandscape && (Number(activeLayout) === 2 || Number(activeLayout) === 8) ? 'bg-white/20' : 'bg-gray-100'}`}
                                    style={isLayout1Portrait ? { backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 } : {}}
                                ></div>
                            </div>

                            {/* Font Family Dropdown */}
                            <div className="relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between border border-gray-300 ${isLayout4Portrait ? 'rounded-none' : 'rounded-md'} px-2.5 py-1.5 cursor-pointer text-gray-800 transition-all hover:border-gray-400`}
                                    style={isLayout1Portrait ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.3) } : { backgroundColor: 'white' }}
                                >
                                    <span className="text-[11px] font-semibold truncate" style={{ fontFamily: noteFontFamily, color: isLayout1Portrait ? getLayoutColor('dropdown-text', '#FFFFFF') : '' }}>{noteFontFamily}</span>
                                    <Icon icon="lucide:chevron-down" className={`w-3.5 h-3.5 ${isLayout1Portrait ? '' : 'text-gray-400'} transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 } : {}} />
                                </div>
                                <AnimatePresence>
                                    {isFontMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 w-full mt-1 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-1 border"
                                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) }}
                                        >
                                            <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
                                                {fonts.map(font => (
                                                    <div
                                                        key={font}
                                                        onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }}
                                                        className={`px-2.5 py-1.5 text-[11px] cursor-pointer transition-colors`}
                                                        style={{ 
                                                            fontFamily: font,
                                                            backgroundColor: noteFontFamily === font ? getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) : 'transparent',
                                                            color: getLayoutColor('dropdown-text', '#333'),
                                                            fontWeight: noteFontFamily === font ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {font}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Weight and Size Selectors */}
                            <div className="flex gap-1.5">
                                <div className="flex-1 relative">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); }}
                                        className={`w-full h-8 flex items-center justify-between border border-gray-300 ${isLayout4Portrait ? 'rounded-none' : 'rounded-md'} px-2.5 cursor-pointer text-gray-800 transition-all hover:border-gray-400`}
                                        style={isLayout1Portrait ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.3) } : { backgroundColor: 'white' }}
                                    >
                                        <span className="text-[11px] font-semibold" style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}>{noteWeight}</span>
                                        <Icon icon="lucide:chevron-down" className={`w-3.5 h-3.5 ${isLayout1Portrait ? '' : 'text-gray-400'} transition-transform ${isWeightMenuOpen ? 'rotate-180' : ''}`} style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 } : {}} />
                                    </div>
                                    <AnimatePresence>
                                        {isWeightMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="absolute bottom-full left-0 w-full mb-1 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-1 border"
                                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) }}
                                            >
                                                {weights.map(w => (
                                                    <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} 
                                                        className={`px-2.5 py-1.5 text-[11px] cursor-pointer transition-colors`}
                                                        style={{ 
                                                            backgroundColor: noteWeight === w ? getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) : 'transparent',
                                                            color: getLayoutColor('dropdown-text', '#333'),
                                                            fontWeight: noteWeight === w ? 'bold' : 'normal'
                                                        }}
                                                    >{w}</div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="w-[65px] relative">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                        className={`w-full h-8 flex items-center justify-between border border-gray-300 ${isLayout4Portrait ? 'rounded-none' : 'rounded-md'} px-2.5 cursor-pointer text-gray-800 transition-all hover:border-gray-400`}
                                        style={isLayout1Portrait ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.3) } : { backgroundColor: 'white' }}
                                    >
                                        <span className="text-[11px] font-semibold" style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}>{noteFontSize}</span>
                                        <Icon icon="lucide:chevron-down" className={`w-3.5 h-3.5 ${isLayout1Portrait ? '' : 'text-gray-400'} transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 } : {}} />
                                    </div>
                                    <AnimatePresence>
                                        {isSizeMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute bottom-full right-0 w-full mb-1 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-1 text-center border"
                                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) }}
                                            >
                                                <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
                                                    {sizes.map(s => (
                                                        <div
                                                            key={s}
                                                            onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }}
                                                            className={`px-2.5 py-1.5 text-[11px] cursor-pointer transition-colors`}
                                                            style={{ 
                                                                backgroundColor: noteFontSize === s ? getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) : 'transparent',
                                                                color: getLayoutColor('dropdown-text', '#333'),
                                                                fontWeight: noteFontSize === s ? 'bold' : 'normal'
                                                            }}
                                                        >
                                                            {s}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Formatting Tool Icons */}
                            <div className="flex flex-col gap-1.5">
                                <AnimatePresence mode="wait">
                                    {activeFormattingTab && (
                                        <motion.div
                                            key={activeFormattingTab}
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            className="flex justify-center"
                                        >
                                            <div className={`rounded-[10px] p-1 flex gap-1 shadow-xl border ${isLayout1Portrait ? 'bg-black/20 border-white/10' : 'bg-[#1A1A1A] border-white/10'}`} onClick={(e) => e.stopPropagation()}>
                                                {activeFormattingTab === 'align' && (
                                                    <>
                                                        {[
                                                            { id: 'left', icon: 'lucide:align-left' },
                                                            { id: 'center', icon: 'lucide:align-center' },
                                                            { id: 'right', icon: 'lucide:align-right' },
                                                            { id: 'justify', icon: 'lucide:align-justify' }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setNoteAlignment(opt.id)}
                                                                className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-all ${noteAlignment === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <Icon icon={opt.icon} className="w-4 h-4" />
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {activeFormattingTab === 'style' && (
                                                    <>
                                                        {[
                                                            { id: 'bold', label: 'B', className: 'font-bold' },
                                                            { id: 'italic', label: 'I', className: 'italic' },
                                                            { id: 'underline', label: 'U', className: 'underline' },
                                                            { id: 'strike', label: 'S', className: 'line-through' }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => toggleNoteStyle(opt.id)}
                                                                className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-all ${noteStyles.includes(opt.id) ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <span className={`text-[12px] ${opt.className}`}>{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {activeFormattingTab === 'case' && (
                                                    <>
                                                        {[
                                                            { id: 'none', label: '—' },
                                                            { id: 'sentence', label: 'Aa' },
                                                            { id: 'upper', label: 'AB' },
                                                            { id: 'lower', label: 'ab' }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setNoteCase(opt.id)}
                                                                className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-all ${noteCase === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <span className="text-[11px] font-bold">{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {activeFormattingTab === 'list' && (
                                                    <>
                                                        {[
                                                            { id: 'bullet', icon: 'lucide:list' },
                                                            { id: 'bullet2', icon: 'material-symbols:list' },
                                                            { id: 'ordered', icon: 'lucide:list-ordered' }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => handleListClick(opt.id)}
                                                                className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-all ${noteList === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                            >
                                                                <Icon icon={opt.icon} className="w-4 h-4" />
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex gap-1.5 items-center" onClick={(e) => e.stopPropagation()}>
                                     {[
                                         { id: 'align', icon: 'lucide:align-left', action: () => setActiveFormattingTab(prev => prev === 'align' ? null : 'align') },
                                         { id: 'style', label: 'B', action: () => setActiveFormattingTab(prev => prev === 'style' ? null : 'style') },
                                         { id: 'case', label: 'Aa', action: () => setActiveFormattingTab(prev => prev === 'case' ? null : 'case') },
                                         { id: 'list', icon: 'lucide:list', action: () => setActiveFormattingTab(prev => prev === 'list' ? null : 'list') }
                                     ].map((btn) => (
                                         <button
                                             key={btn.id}
                                             onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                             className={`h-8 flex-1 rounded-md border flex items-center justify-center transition-all shadow-sm`}
                                             style={{
                                                 backgroundColor: activeFormattingTab === btn.id ? (isLayout1Portrait ? getLayoutColor('dropdown-text', '#FFFFFF') : '#eee') : (isLayout1Portrait ? getLayoutColorAlpha('dropdown-text', '255,255,255', 0.1) : 'white'),
                                                 borderColor: isLayout1Portrait ? getLayoutColorAlpha('dropdown-text', '255,255,255', 0.2) : '#ddd',
                                                 color: activeFormattingTab === btn.id ? (isLayout1Portrait ? getLayoutColor('dropdown-bg', '#3E4491') : '#000') : (isLayout1Portrait ? getLayoutColor('dropdown-text', '#FFFFFF') : '#555')
                                             }}
                                         >
                                             {btn.icon ? <Icon icon={btn.icon} className="w-4 h-4" /> : <span className="text-[12px] font-bold">{btn.label}</span>}
                                         </button>
                                     ))}
                                 </div>
                            </div>

                            {/* Text Color HEX + Opacity row */}
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`w-8 h-8 ${isLayout4Portrait ? 'rounded-none' : 'rounded-md'} border border-gray-300 cursor-pointer shadow-sm flex-shrink-0`}
                                    style={{ backgroundColor: noteTextColor }}
                                    onClick={() => { setPickerTarget('text'); setShowColorPicker(true); }}
                                />
                                <div className={`flex-1 h-8 flex items-center justify-between border border-gray-300 ${isLayout4Portrait ? 'rounded-none' : 'rounded-md'} px-2.5 text-gray-700`}
                                     style={isLayout1Portrait ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.3) } : { backgroundColor: 'white' }}
                                >
                                    <span className="text-[10px] font-bold tracking-wider uppercase" style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}>{noteTextColor}</span>
                                    <span className="text-[10px] font-bold opacity-40" style={isLayout1Portrait ? { color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}>{noteTextOpacity}%</span>
                                </div>
                            </div>

                            {/* Bottom Sticky Action Buttons */}
                            <div className="flex gap-2.5 mt-0.5">
                                <button
                                    onClick={resetNote}
                                    className={`flex-1 h-8 ${isLayout4Portrait ? 'rounded-none' : 'rounded-md'} border flex items-center justify-center gap-1 font-bold active:scale-95 transition-all text-[11px] ${isMobile && !isLandscape && Number(activeLayout) === 2 ? 'border-white/40 text-white' : isLayout4Portrait ? 'border-gray-300 text-black hover:bg-gray-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                    style={isLayout1Portrait ? { borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.3), color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}
                                >
                                    <Icon icon="lucide:x" className="w-3 h-3" />
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: `Page ${p1.toString().padStart(2, '0')}`,
                                            pageIndex: targetPageIndex
                                        });
                                        onClose();
                                    }}
                                    className={`flex-[1.5] h-8 text-white ${isLayout4Portrait ? 'rounded-none' : 'rounded-md'} flex items-center justify-center font-bold active:scale-95 transition-all shadow-lg text-[11px] ${isMobile && !isLandscape && Number(activeLayout) === 8 ? 'bg-[#575C9C] hover:bg-[#4a5089]' : 'bg-black hover:bg-gray-900'}`}
                                    style={isLayout1Portrait ? { backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), color: getLayoutColor('dropdown-bg', '#3E4491') } : {}}
                                >
                                    Add To Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlaid Color Picker Drawer */}
                <AnimatePresence>
                    {showColorPicker && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent px-4"
                            onClick={(e) => { e.stopPropagation(); setShowColorPicker(false); }}
                        >
                            <div onClick={e => e.stopPropagation()} className="scale-[0.85] origin-center">
                                <ColorPallet
                                    color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                                    inline={false}
                                    opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                                    onOpacityChange={(val) => {
                                        if (pickerTarget === 'text') setNoteTextOpacity(val);
                                        else setNoteBgOpacity(val);
                                    }}
                                    onChange={(color) => {
                                        if (pickerTarget === 'text') setNoteTextColor(color);
                                        else setNoteBackground(color);
                                    }}
                                    onClose={() => setShowColorPicker(false)}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (isOldSpecificLayout) {
        return (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent px-6"
                onClick={onClose}
            >
                <div
                    className={`bg-white rounded-[16px] shadow-2xl p-2.5 ${isMobile && isLandscape ? 'w-[280px] scale-[0.9]' : 'w-[175px]'} relative animate-in zoom-in-95 duration-200`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-2">
                        <h2 className="text-[11px] font-bold text-gray-900 whitespace-nowrap">Add Notes</h2>
                        <div className="flex-1 h-[0.5px] bg-gray-200"></div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onClose}
                                className="w-[16px] h-[16px] rounded-[4px] border-[0.8px] border-[#EB5757] flex items-center justify-center text-[#EB5757] hover:bg-red-50 transition-colors"
                            >
                                <Icon icon="lucide:x" className="w-[9px] h-[9px] stroke-[2]" />
                            </button>
                            <button
                                onClick={() => {
                                    if (!noteContent.trim()) return;
                                    onAddNote({
                                        content: noteContent,
                                        background: noteBackground,
                                        color: noteTextColor,
                                        fontFamily: noteFontFamily,
                                        fontSize: noteFontSize,
                                        styles: noteStyles,
                                        alignment: noteAlignment,
                                        case: noteCase,
                                        list: noteList,
                                        bgOpacity: noteBgOpacity,
                                        textOpacity: noteTextOpacity,
                                        pageLabel: `Page ${p1 ? p1.toString().padStart(2, '0') : '01'}`,
                                        pageIndex: currentPageIndex
                                    });
                                    onClose();
                                }}
                                className="w-[16px] h-[16px] rounded-[4px] border-[0.8px] border-[#27AE60] flex items-center justify-center text-[#27AE60] hover:bg-green-50 transition-colors"
                            >
                                <Icon icon="lucide:check" className="w-[9px] h-[9px] stroke-[2]" />
                            </button>
                        </div>
                    </div>

                    {/* Note Preview */}
                    <div className="w-full flex items-center justify-center mb-2">
                        <div
                            className="relative w-full h-[65px] rounded-[7px] p-1.5 shadow-xs flex flex-col transition-colors duration-300"
                            style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                        >
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter your Notes"
                                style={{
                                    textAlign: noteAlignment,
                                    fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                    fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                    textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                    textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                    fontFamily: noteFontFamily,
                                    fontSize: `${Math.min(parseInt(noteFontSize), 18)}px`,
                                    color: noteTextColor,
                                    opacity: noteTextOpacity / 100,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    width: '100%',
                                    height: '100%'
                                }}
                                className="flex-1 placeholder:text-white/60 font-medium overflow-y-auto custom-scrollbar text-[10px] text-white"
                            />
                            <div className="flex justify-end items-center pointer-events-none">
                                <span className="text-[8px] font-bold text-white/90">{pageDisplay}</span>
                            </div>
                        </div>
                    </div>

                    {/* Color Palette */}
                    <div className="flex items-center justify-between mb-2 px-0.5">
                        {['#34B1AA', '#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54'].map((color, i) => (
                            <div
                                key={i}
                                onClick={() => setNoteBackground(color)}
                                className={`w-[11px] h-[11px] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xs border-[1px] ${noteBackground === color ? 'border-gray-800' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div
                            onClick={(e) => {
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className="w-[11px] h-[11px] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xs bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] border-[1px] border-transparent"
                        />
                    </div>

                    {/* Text Properties Divider */}
                    <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-bold text-black whitespace-nowrap">Properties</span>
                        <div className="flex-1 h-[0.5px] bg-gray-200"></div>
                    </div>

                    {/* Dropdowns Column */}
                    <div className="flex flex-col gap-1 mb-2" onClick={() => setActiveFormattingTab(null)}>
                        {/* Font Family */}
                        <div className="relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                className={`w-full h-[24px] flex items-center justify-between border-[1px] border-gray-400 rounded-[6px] px-2 cursor-pointer bg-white transition-colors hover:border-black ${isFontMenuOpen ? 'border-black shadow-sm' : ''}`}
                            >
                                <span className="text-[9px] font-medium text-gray-700 truncate" style={{ fontFamily: noteFontFamily }}>{noteFontFamily}</span>
                                <Icon icon="lucide:chevron-down" className={`w-2.5 h-2.5 text-gray-400 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                            <AnimatePresence>
                                {isFontMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1 overflow-hidden"
                                    >
                                        <div className="max-h-[80px] overflow-y-auto custom-scrollbar">
                                            {fonts.map((font) => (
                                                <div
                                                    key={font}
                                                    onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }}
                                                    className={`px-3 py-1 text-[9px] hover:bg-gray-50 text-gray-700 ${noteFontFamily === font ? 'bg-gray-50 font-bold' : ''}`}
                                                    style={{ fontFamily: font }}
                                                >
                                                    {font}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Weight and Size Row */}
                        <div className="flex gap-1">
                            <div className="flex-1 relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); }}
                                    className={`w-full h-[24px] flex items-center justify-between border-[1px] border-gray-400 rounded-[6px] px-2 cursor-pointer bg-white transition-colors hover:border-black ${isWeightMenuOpen ? 'border-black shadow-sm' : ''}`}
                                >
                                    <span className="text-[9px] font-medium text-gray-700 truncate">{noteWeight}</span>
                                    <Icon icon="lucide:chevron-down" className={`w-2.5 h-2.5 text-gray-400 transition-transform ${isWeightMenuOpen ? 'rotate-180' : ''}`} />
                                </div>
                                <AnimatePresence>
                                    {isWeightMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1"
                                        >
                                            {weights.map((w) => (
                                                <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className={`px-3 py-1 text-[9px] hover:bg-gray-50 text-gray-700 ${noteWeight === w ? 'bg-gray-50 font-bold' : ''}`}>{w}</div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="w-[50px] relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                    className={`w-full h-[24px] flex items-center justify-between border-[1px] border-gray-400 rounded-[6px] px-2 cursor-pointer bg-white transition-colors hover:border-black ${isSizeMenuOpen ? 'border-black shadow-sm' : ''}`}
                                >
                                    <span className="text-[9px] font-medium text-gray-700">{noteFontSize}</span>
                                    <Icon icon="lucide:chevron-down" className={`w-2.5 h-2.5 text-gray-400 transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} />
                                </div>
                                <AnimatePresence>
                                    {isSizeMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute bottom-full right-0 w-full mb-1 bg-white border border-gray-100 rounded-lg shadow-xl z-[100] py-1 text-center"
                                        >
                                            <div className="max-h-[80px] overflow-y-auto custom-scrollbar">
                                                {sizes.map((s) => (
                                                    <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className={`px-2 py-1 text-[9px] hover:bg-gray-50 text-center text-gray-700 ${noteFontSize === s ? 'bg-gray-50 font-bold' : ''}`}>{s}</div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeFormattingTab && (
                            <motion.div
                                key={activeFormattingTab}
                                initial={{ opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 3 }}
                                className="mb-1.5 flex justify-start"
                            >
                                <div className="bg-[#1a1a1a] rounded-[6px] p-0.5 flex gap-0.5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                    {activeFormattingTab === 'align' && (
                                        <>
                                            {[
                                                { id: 'left', icon: 'lucide:align-left' },
                                                { id: 'center', icon: 'lucide:align-center' },
                                                { id: 'right', icon: 'lucide:align-right' },
                                                { id: 'justify', icon: 'lucide:align-justify' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setNoteAlignment(opt.id)}
                                                    className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-all ${noteAlignment === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                >
                                                    <Icon icon={opt.icon} className="w-3 h-3" />
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {activeFormattingTab === 'style' && (
                                        <>
                                            {[
                                                { id: 'bold', label: 'B' },
                                                { id: 'italic', label: 'I' },
                                                { id: 'underline', label: 'U' },
                                                { id: 'strike', label: 'S' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => toggleNoteStyle(opt.id)}
                                                    className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-all ${noteStyles.includes(opt.id) ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                >
                                                    <span className={`text-[9px] font-bold ${opt.id === 'italic' ? 'italic' : opt.id === 'underline' ? 'underline' : opt.id === 'strike' ? 'line-through' : ''}`}>{opt.label}</span>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {activeFormattingTab === 'case' && (
                                        <>
                                            {[
                                                { id: 'none', label: '—' },
                                                { id: 'sentence', label: 'Aa' },
                                                { id: 'upper', label: 'AB' },
                                                { id: 'lower', label: 'ab' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setNoteCase(opt.id)}
                                                    className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-all ${noteCase === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                >
                                                    <span className="text-[9px] font-bold">{opt.label}</span>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {activeFormattingTab === 'list' && (
                                        <>
                                            {[
                                                { id: 'bullet', icon: 'lucide:list' },
                                                { id: 'bullet2', icon: 'material-symbols:list' },
                                                { id: 'ordered', icon: 'lucide:list-ordered' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleListClick(opt.id)}
                                                    className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-all ${noteList === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                >
                                                    <Icon icon={opt.icon} className="w-3 h-3" />
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Formatting Buttons Category */}
                    <div className="flex gap-1 mb-2">
                        {[
                            { id: 'align', icon: `lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment}`, action: () => setActiveFormattingTab(prev => prev === 'align' ? null : 'align') },
                            { id: 'style', label: 'B', action: () => setActiveFormattingTab(prev => prev === 'style' ? null : 'style') },
                            { id: 'case', label: noteCase === 'none' ? '—' : noteCase === 'sentence' ? 'Aa' : noteCase === 'upper' ? 'AB' : 'ab', action: () => setActiveFormattingTab(prev => prev === 'case' ? null : 'case') },
                            { id: 'list', icon: noteList === 'ordered' ? 'lucide:list-ordered' : 'lucide:list', action: () => setActiveFormattingTab(prev => prev === 'list' ? null : 'list') }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                className={`w-[26px] h-[22px] rounded-[6px] border-[1px] flex items-center justify-center transition-all ${activeFormattingTab === btn.id ? 'bg-black text-white border-black' : 'bg-white border-gray-400 text-gray-600'}`}
                            >
                                {btn.icon ? <Icon icon={btn.icon} className="w-3 h-3" /> : <span className="text-[9px] font-bold">{btn.label}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Text Color Selection */}
                    <div className="flex items-center gap-1 px-0.5">
                        <div
                            className="w-[24px] h-[24px] rounded-[5px] border-[1px] border-gray-400 shadow-xs cursor-pointer flex-shrink-0"
                            style={{ backgroundColor: noteTextColor }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerPos({ x: rect.left - 200, y: rect.top - 100 });
                                setPickerTarget('text');
                                setShowColorPicker(true);
                            }}
                        />
                        <div className="flex-1 h-[24px] flex items-center justify-between border-[1px] border-gray-400 rounded-[5px] px-2 bg-white">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{noteTextColor}</span>
                            <span className="text-[9px] text-gray-500 font-bold">{noteTextOpacity}%</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-2 flex gap-1.5">
                        <button
                            onClick={resetNote}
                            className="flex-1 h-[26px] border border-gray-300 rounded-[7px] flex items-center justify-center gap-1 text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            <Icon icon="lucide:x" className="w-3 h-3" />
                            <span className="text-[9px] font-bold">Clear</span>
                        </button>
                        <button
                            onClick={() => {
                                if (!noteContent.trim()) return;
                                onAddNote({
                                    content: noteContent,
                                    background: noteBackground,
                                    color: noteTextColor,
                                    fontFamily: noteFontFamily,
                                    fontSize: noteFontSize,
                                    styles: noteStyles,
                                    alignment: noteAlignment,
                                    case: noteCase,
                                    list: noteList,
                                    bgOpacity: noteBgOpacity,
                                    textOpacity: noteTextOpacity,
                                    pageLabel: `Page ${p1.toString().padStart(2, '0')}`,
                                    pageIndex: currentPageIndex
                                });
                                onClose();
                            }}
                            className="flex-[1.8] h-[26px] bg-black text-white rounded-[7px] flex items-center justify-center gap-1 hover:bg-black/90 active:scale-95 transition-all shadow-md"
                        >
                            <span className="text-[10px] font-bold">Add To Notes</span>
                        </button>
                    </div>
                </div>
                {showColorPicker && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-transparent" onClick={() => setShowColorPicker(false)}>
                        <div onClick={e => e.stopPropagation()}>
                            <ColorPallet
                                color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                                inline={false}
                                opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                                onOpacityChange={(val) => {
                                    if (pickerTarget === 'text') setNoteTextOpacity(val);
                                    else setNoteBgOpacity(val);
                                }}
                                onChange={(color) => {
                                    if (pickerTarget === 'text') setNoteTextColor(color);
                                    else setNoteBackground(color);
                                }}
                                onClose={() => setShowColorPicker(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="absolute inset-0 z-[100] flex flex-col justify-center items-center pointer-events-auto bg-transparent"
            onClick={onClose}
        >
            <div
                className={`w-[calc(100%-32px)] shadow-2xl flex ${isLandscape ? 'flex-row max-w-[520px] max-h-[95vh]' : 'flex-col max-w-[290px]'} pointer-events-auto animate-in zoom-in-95 duration-200 outline-none ${isLayout2 ? 'p-1 rounded-[1.2rem] backdrop-blur-md' : 'p-3 gap-2 rounded-[1.2rem] border border-white/10'}`}
                style={!isLayout2 ? { backgroundColor: 'rgba(87, 92, 156, 0.8)', backdropFilter: 'blur(12px)' } : { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.6) }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`${isLayout2 ? `bg-[#575C9C] rounded-[1rem] ${isLandscape ? 'p-2.5 gap-2 flex-1' : 'p-3 gap-2.5'} flex flex-col` : "flex flex-col gap-2.5 flex-1"} h-full`} style={isLayout2 ? { backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))" } : {}}>
                    {/* Header Row */}
                    <div className="flex items-center gap-2">
                        <span className={`${isLayout2 && !isLandscape ? 'text-[13px]' : 'text-[15px]'} font-bold text-white flex-shrink-0`}>Add Notes</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                        {!isLandscape && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 bg-transparent border border-white/20 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 focus:outline-none"
                                >
                                    <Icon icon="lucide:x" className="w-[18px] h-[18px] stroke-[2.5]" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: `Page ${p1.toString().padStart(2, '0')}`,
                                            pageIndex: currentPageIndex
                                        });
                                        onClose();
                                    }}
                                    className="w-8 h-8 bg-white border border-white/20 rounded-lg flex items-center justify-center text-[#575C9C] hover:bg-gray-100 focus:outline-none shadow-sm"
                                >
                                    <Icon icon="lucide:check" className="w-[18px] h-[18px] stroke-[2.5]" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Note Editor Area */}
                    <div
                        className={`relative w-full ${isLandscape ? 'flex-1 min-h-[100px]' : (isLayout2 ? 'h-[130px]' : 'h-[135px]')} rounded-[14px] p-3 flex flex-col transition-colors duration-300`}
                        style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                    >
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your Notes"
                            style={{
                                textAlign: noteAlignment,
                                fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                fontFamily: noteFontFamily,
                                fontSize: `${isLandscape ? Math.min(parseInt(noteFontSize), 24) : noteFontSize}px`,
                                color: noteTextColor,
                                opacity: noteTextOpacity / 100,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                width: '100%',
                                height: '100%'
                            }}
                            className="flex-1 placeholder:text-white/80 font-medium overflow-y-auto custom-scrollbar"
                        />
                        <div className="flex justify-end mt-1 items-center pointer-events-none absolute bottom-2 right-3">
                            <span className={`${isLandscape ? 'text-[10px]' : 'text-[11px]'} font-bold text-white shadow-sm`} style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.2)' }}>{pageDisplay}</span>
                        </div>
                    </div>

                    {/* Colors palette */}
                    <div className="flex items-center justify-between gap-1">
                        {['#31B0B0', '#C68798', '#D6566E', '#6B7DBB', '#67AC78', '#D8DC53', '#23D295'].map((color, i) => (
                            <div
                                key={i}
                                onClick={() => setNoteBackground(color)}
                                className={`${isLandscape ? 'w-4 h-4' : (isLayout2 ? 'w-4.5 h-4.5' : 'w-5 h-5')} rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm border-[2px] ${noteBackground === color ? 'border-gray-800' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div
                            onClick={(e) => {
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className={`${isLandscape ? 'w-4 h-4' : (isLayout2 ? 'w-4.5 h-4.5' : 'w-5 h-5')} rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm flex items-center justify-center bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]`}
                        />
                    </div>
                </div>

                {/* Properties Column (Right side in Landscape, Bottom in Portrait) */}
                <div className={`flex flex-col ${isLandscape ? 'w-[200px] gap-2' : 'gap-[10px]'}`}>
                    {/* Text Properties Divider */}
                    <div className={`flex items-center gap-2 ${isLandscape ? 'mt-0' : (isLayout2 && !isLandscape ? 'mt-0.5' : 'mt-1')}`}>
                        <span className={`${isLayout2 && !isLandscape ? 'text-[12px]' : 'text-[14px]'} font-bold text-white flex-shrink-0`}>Text Properties</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                        {isLandscape && (
                            <button
                                onClick={onClose}
                                className="w-6 h-6 border border-white/20 rounded flex items-center justify-center text-white/80"
                            >
                                <Icon icon="lucide:x" className="w-[14px] h-[14px]" />
                            </button>
                        )}
                    </div>

                    {/* Font Family */}
                    <div className="relative">
                        <div
                            onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                            className={`w-full flex items-center justify-between border-[1.5px] rounded-[10px] px-3 ${isLandscape ? 'py-1' : (isLayout2 ? 'h-[28px]' : 'py-2')} cursor-pointer transition-all bg-black/20 ${isFontMenuOpen ? 'border-white/40 ring-1 ring-white/10' : 'border-white/10'}`}
                        >
                            <span className={`${isLayout2 && !isLandscape ? 'text-[11px]' : 'text-[13px]'} font-medium text-white/90 truncate mr-2`} style={{ fontFamily: noteFontFamily }}>
                                {noteFontFamily}
                            </span>
                            <Icon icon="lucide:chevron-down" className={`${isLayout2 && !isLandscape ? 'w-3 h-3' : 'w-4 h-4'} text-white/50 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isFontMenuOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="max-h-[120px] overflow-y-auto custom-scrollbar py-2">
                                    {fonts.map((font) => (
                                        <div
                                            key={font}
                                            onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }}
                                            className={`px-3 py-2 text-[12px] cursor-pointer transition-colors ${noteFontFamily === font ? 'bg-[#EEF2FF] text-[#6366F1]' : 'text-gray-700 hover:bg-[#F3F4F6]'}`}
                                            style={{ fontFamily: font }}
                                        >
                                            {font}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Weight and Size Row */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); }}
                                className={`w-full flex items-center justify-between border-[1.5px] rounded-[10px] px-3 ${isLandscape ? 'py-1' : (isLayout2 ? 'h-[28px]' : 'py-2')} cursor-pointer transition-all bg-black/20 ${isWeightMenuOpen ? 'border-white/40 ring-1 ring-white/10' : 'border-white/10'}`}
                            >
                                <span className={`${isLayout2 && !isLandscape ? 'text-[11px]' : 'text-[13px]'} font-medium text-white/90 truncate mr-1`}>{noteWeight}</span>
                                <Icon icon="lucide:chevron-down" className={`${isLayout2 && !isLandscape ? 'w-3 h-3' : 'w-4 h-4'} text-white/50 transition-transform ${isWeightMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isWeightMenuOpen && (
                                <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="max-h-[100px] overflow-y-auto custom-scrollbar py-1">
                                        {weights.map((w) => (
                                            <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className={`px-3 py-2 text-[12px] hover:bg-gray-50 text-gray-700 ${noteWeight === w ? 'bg-gray-50 font-bold' : ''}`}>{w}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-[70px] relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                className={`w-full flex items-center justify-between border-[1.5px] rounded-[10px] px-3 ${isLandscape ? 'py-1' : (isLayout2 ? 'h-[28px]' : 'py-2')} cursor-pointer transition-all bg-black/20 ${isSizeMenuOpen ? 'border-white/40 ring-1 ring-white/10' : 'border-white/10'}`}
                            >
                                <span className={`${isLayout2 && !isLandscape ? 'text-[11px]' : 'text-[13px]'} font-medium text-white/90`}>{noteFontSize}</span>
                                <Icon icon="lucide:chevron-down" className={`${isLayout2 && !isLandscape ? 'w-3 h-3' : 'w-4 h-4'} text-white/50 transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isSizeMenuOpen && (
                                <div className="absolute bottom-full right-0 w-full mb-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="max-h-[100px] overflow-y-auto custom-scrollbar py-1 text-center">
                                        {sizes.map((s) => (
                                            <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className={`px-3 py-2 text-[12px] hover:bg-gray-50 text-gray-700 ${noteFontSize === s ? 'bg-gray-50 font-bold' : ''}`}>{s}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Formatting Buttons */}
                    <div className="flex gap-2">
                        {[
                            { id: 'align', icon: 'lucide:align-center', action: () => setNoteAlignment(prev => prev === 'center' ? 'left' : 'center') },
                            { id: 'bold', label: 'B', action: () => toggleNoteStyle('bold') },
                            { id: 'underline', label: '—', action: () => toggleNoteStyle('underline') },
                            { id: 'list', icon: 'lucide:list', action: () => handleListClick('bullet') }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={btn.action}
                                className={`flex-1 ${isLandscape ? 'h-7' : 'h-8'} rounded-lg border-[1.5px] flex items-center justify-center transition-all ${noteStyles.includes(btn.id) || (btn.id === 'bold' && noteWeight === 'Bold') || (btn.id === 'list' && noteList !== 'none') ? 'bg-white border-white text-[#575C9C]' : 'bg-transparent border-white/20 text-white/80 hover:bg-white/10'}`}
                            >
                                {btn.icon ? <Icon icon={btn.icon} className="w-[18px] h-[18px]" /> : <span className="text-[14px] font-bold">{btn.label}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Text Color Selection Wrapper */}
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-8 ${isLandscape ? 'h-7' : 'h-8'} rounded-lg border-[1.5px] border-white/20 shadow-sm cursor-pointer flex-shrink-0`}
                            style={{ backgroundColor: noteTextColor }}
                            onClick={() => { setPickerTarget('text'); setShowColorPicker(true); }}
                        />
                        <div className={`flex-1 ${isLandscape ? 'h-7' : 'h-8'} flex items-center justify-between border-[1.5px] border-white/20 rounded-lg px-3 bg-black/20`}>
                            <span className="text-[11px] font-bold text-white/90 uppercase truncate mr-2">{noteTextColor}</span>
                            <span className="text-[11px] text-white/50 font-bold">{noteTextOpacity}%</span>
                        </div>
                    </div>

                    {/* Action Buttons (Landscape only) */}
                    {isLandscape && (
                        <div className="mt-auto flex items-center gap-2 pt-1">
                            <button
                                onClick={resetNote}
                                className="flex-1 h-7 border border-white/20 rounded-lg flex items-center justify-center gap-1 text-white/80 hover:bg-white/10 transition-colors text-[10px] font-bold"
                            >
                                <Icon icon="lucide:x" className="w-3 h-3" />
                                Clear
                            </button>
                            <button
                                onClick={() => {
                                    if (!noteContent.trim()) return;
                                    onAddNote({
                                        content: noteContent,
                                        background: noteBackground,
                                        color: noteTextColor,
                                        fontFamily: noteFontFamily,
                                        fontSize: noteFontSize,
                                        styles: noteStyles,
                                        alignment: noteAlignment,
                                        case: noteCase,
                                        list: noteList,
                                        bgOpacity: noteBgOpacity,
                                        textOpacity: noteTextOpacity,
                                        pageLabel: `Page ${p1.toString().padStart(2, '0')}`,
                                        pageIndex: currentPageIndex
                                    });
                                    onClose();
                                }}
                                className="flex-[1.5] h-7 bg-white text-[#575C9C] rounded-lg flex items-center justify-center font-bold hover:bg-gray-100 active:scale-95 transition-all shadow-lg text-[10px]"
                            >
                                Add To Notes
                            </button>
                        </div>
                    )}
                </div>

                {showColorPicker && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-transparent" onClick={() => setShowColorPicker(false)}>
                        <div onClick={e => e.stopPropagation()}>
                            <ColorPicker
                                color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                                position={{ x: window.innerWidth / 2 - 125, y: window.innerHeight / 2 - 150 }}
                                opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                                onOpacityChange={(val) => {
                                    if (pickerTarget === 'text') setNoteTextOpacity(val);
                                    else setNoteBgOpacity(val);
                                }}
                                onChange={(color) => {
                                    if (pickerTarget === 'text') setNoteTextColor(color);
                                    else setNoteBackground(color);
                                }}
                                onClose={() => setShowColorPicker(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const DesktopLayout7 = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
    setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, totalPages, isSpread, ColorPallet, Icon,
    getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha,
    isEditingPage, setIsEditingPage, targetPageIndex, setTargetPageIndex,
    activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen
}) => {
    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
            onClick={onClose}
        >
            <div
                className="w-[36vw] rounded-[1.2vw] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 p-[1vw] relative border-2 border-white backdrop-blur-xl"
                style={{
                    backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'),
                    transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)',
                    transformOrigin: 'center center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-[0.6vw]">
                    <span className="text-[1.1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Notes</span>
                    <button
                        onClick={onClose}
                        className="transition-colors hover:scale-110 active:scale-95"
                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.8 }}
                    >
                        <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
                    </button>
                </div>
                <div className="w-full h-[1px] mb-[0.8vw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }} />

                <div className="flex gap-[1vw]">
                    {/* Left - Colors */}
                    <div className="flex flex-col gap-[0.5vw]">
                        {['#34B1AA', '#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54'].map((color, i) => (
                            <div
                                key={i}
                                onClick={() => setNoteBackground(color)}
                                className={`w-[1.8vw] h-[1.8vw] rounded-full cursor-pointer hover:scale-110 transition-transform border-[1.5px] ${noteBackground === color ? 'border-white' : 'border-transparent'} shadow-md`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className="w-[1.8vw] h-[1.8vw] rounded-full cursor-pointer hover:scale-110 transition-transform flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] shadow-md color-picker-trigger"
                        >
                            <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-white/70" />
                        </div>
                    </div>

                    {/* Middle - Sticky Note */}
                    <div
                        className="relative w-[15vw] h-[15vw] rounded-[0.8vw] p-[0.8vw] shadow-xl flex flex-col transition-all duration-300"
                        style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                    >
                        <div className="absolute top-[0.6vw] right-[0.8vw] z-20 flex items-center gap-[0.4vw] hover:bg-white/10 rounded px-[0.4vw] py-[0.2vw] transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                        >
                            <span className="text-[0.7vw] font-bold text-white opacity-90">{pageDisplay}</span>
                            <Icon icon="lucide:pencil" className="w-[0.9vw] h-[0.9vw] text-white opacity-90" />

                            {isPageDropdownOpen && (
                                <div className="absolute top-full right-0 mt-[0.3vw] w-[7vw] max-h-[12vw] bg-white rounded-[0.5vw] shadow-2xl overflow-y-auto custom-scrollbar z-[100] border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                                    {Array.from({ length: totalPages || 1 }, (_, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setTargetPageIndex(i);
                                                setIsPageDropdownOpen(false);
                                            }}
                                            className={`px-[0.8vw] py-[0.5vw] text-[0.8vw] cursor-pointer transition-colors ${targetPageIndex === i ? 'bg-[#575C9C] text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            Page {i + 1}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your Notes"
                            style={{
                                textAlign: noteAlignment,
                                fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                fontFamily: noteFontFamily,
                                fontSize: `${noteFontSize}px`,
                                color: noteTextColor,
                                opacity: noteTextOpacity / 100,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                width: '100%',
                                height: '100%'
                            }}
                            className="flex-1 pt-[2vw] placeholder:text-white/50 font-medium overflow-y-auto custom-scrollbar"
                        />
                    </div>

                    {/* Right - Controls */}
                    <div className="flex-1 flex flex-col gap-[0.8vw] relative" onClick={() => setActiveFormattingTab(null)}>
                        {/* Properties Title */}
                        <div className="flex items-center gap-[0.5vw] mb-[0.2vw]">
                            <span className="text-[0.9vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Text Property :</span>
                            <div className="h-[1px] flex-1" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }}></div>
                        </div>

                        {/* Font Family Selection */}
                        <div className="relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                className={`w-full flex items-center justify-between border-[1.5px] rounded-[0.6vw] px-[0.8vw] py-[0.4vw] cursor-pointer transition-all bg-white`}
                                style={{ borderColor: '#555555' }}
                            >
                                <span className="text-[0.85vw] font-medium text-gray-700 truncate" style={{ fontFamily: noteFontFamily }}>
                                    {noteFontFamily}
                                </span>
                                <Icon icon="lucide:chevron-down" className={`w-[0.9vw] h-[0.9vw] text-gray-400 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isFontMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-[14vw] overflow-y-auto custom-scrollbar py-[0.5vw]">
                                        {fonts.map((font) => (
                                            <div
                                                key={font}
                                                onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }}
                                                className={`px-[1vw] py-[0.6vw] text-[0.85vw] cursor-pointer transition-colors ${noteFontFamily === font ? 'bg-indigo-50 text-[#575C9C] font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                style={{ fontFamily: font }}
                                            >
                                                {font}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-[0.8vw]">
                            <div className="flex-1 relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsWeightMenuOpen(!isWeightMenuOpen); setIsSizeMenuOpen(false); setIsFontMenuOpen(false); }}
                                    className={`w-full h-[2.2vw] flex items-center justify-between border-[1.5px] rounded-[0.6vw] px-[0.8vw] py-[0.4vw] cursor-pointer transition-all bg-white`}
                                    style={{ borderColor: '#555555' }}
                                >
                                    <span className="text-[0.8vw] font-medium text-gray-700 truncate">{noteWeight}</span>
                                    <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] text-gray-400" />
                                </div>
                                {isWeightMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {weights.map((w) => (
                                            <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className="px-[1vw] py-[0.6vw] text-[0.85vw] cursor-pointer hover:bg-gray-100 text-gray-700">{w}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="w-[5vw] relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsSizeMenuOpen(!isSizeMenuOpen); setIsWeightMenuOpen(false); setIsFontMenuOpen(false); }}
                                    className={`w-full h-[2.2vw] flex items-center justify-between border-[1.5px] rounded-[0.6vw] px-[0.8vw] py-[0.4vw] cursor-pointer transition-all bg-white`}
                                    style={{ borderColor: '#555555' }}
                                >
                                    <span className="text-[0.8vw] font-medium text-gray-700">{noteFontSize}</span>
                                    <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] text-gray-400" />
                                </div>
                                {isSizeMenuOpen && (
                                    <div className="absolute top-full right-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-[14vw] overflow-y-auto py-[0.5vw]">
                                            {sizes.map((s) => (
                                                <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className="px-[1vw] py-[0.5vw] text-[0.85vw] text-center cursor-pointer hover:bg-gray-100 text-gray-700">{s}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Formatting Tool Buttons row */}
                        <AnimatePresence mode="wait">
                            {activeFormattingTab && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="mb-[0.2vw] flex justify-end"
                                >
                                    <div className="bg-[#1E1E1E] rounded-[0.8vw] p-[0.3vw] flex gap-[0.3vw] shadow-xl" onClick={(e) => e.stopPropagation()}>
                                        {activeFormattingTab === 'align' && (
                                            <>
                                                {[
                                                    { id: 'left', icon: 'lucide:align-left' },
                                                    { id: 'center', icon: 'lucide:align-center' },
                                                    { id: 'right', icon: 'lucide:align-right' },
                                                    { id: 'justify', icon: 'lucide:align-justify' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setNoteAlignment(opt.id)}
                                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.5vw] flex items-center justify-center transition-all ${noteAlignment === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                    >
                                                        <Icon icon={opt.icon} className="w-[1vw] h-[1vw]" />
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {activeFormattingTab === 'style' && (
                                            <>
                                                {[
                                                    { id: 'bold', label: 'B' },
                                                    { id: 'italic', label: 'I' },
                                                    { id: 'underline', label: 'U' },
                                                    { id: 'strike', label: 'S' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => toggleNoteStyle(opt.id)}
                                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.5vw] flex items-center justify-center transition-all ${noteStyles.includes(opt.id) ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                    >
                                                        <span className={`text-[0.9vw] font-bold ${opt.id === 'italic' ? 'italic' : opt.id === 'underline' ? 'underline' : opt.id === 'strike' ? 'line-through' : ''}`}>{opt.label}</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {activeFormattingTab === 'case' && (
                                            <>
                                                {[
                                                    { id: 'none', label: '—' },
                                                    { id: 'sentence', label: 'Aa' },
                                                    { id: 'upper', label: 'AB' },
                                                    { id: 'lower', label: 'ab' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setNoteCase(opt.id)}
                                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.5vw] flex items-center justify-center transition-all ${noteCase === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                    >
                                                        <span className="text-[0.85vw] font-bold">{opt.label}</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {activeFormattingTab === 'list' && (
                                            <>
                                                {[
                                                    { id: 'bullet', icon: 'lucide:list' },
                                                    { id: 'ordered', icon: 'lucide:list-ordered' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleListClick(opt.id)}
                                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.5vw] flex items-center justify-center transition-all ${noteList === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                    >
                                                        <Icon icon={opt.icon} className="w-[1vw] h-[1vw]" />
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-end gap-[0.5vw]">
                            {[
                                { id: 'align', icon: `lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment}`, action: () => setActiveFormattingTab(prev => prev === 'align' ? null : 'align') },
                                { id: 'style', label: 'B', action: () => setActiveFormattingTab(prev => prev === 'style' ? null : 'style') },
                                { id: 'case', label: noteCase === 'none' ? '—' : noteCase === 'sentence' ? 'Aa' : noteCase === 'upper' ? 'AB' : 'ab', action: () => setActiveFormattingTab(prev => prev === 'case' ? null : 'case') },
                                { id: 'list', icon: noteList === 'ordered' ? 'lucide:list-ordered' : 'lucide:list', action: () => setActiveFormattingTab(prev => prev === 'list' ? null : 'list') }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                    className={`w-[2.2vw] h-[2.2vw] rounded-[0.6vw] border-[1.5px] transition-all flex items-center justify-center ${activeFormattingTab === btn.id ? 'bg-white border-white text-[#575C9C] shadow-sm' : 'bg-white text-gray-500 hover:text-gray-700'}`}
                                    style={{ borderColor: activeFormattingTab === btn.id ? 'white' : '#555555' }}
                                >
                                    {btn.icon ? <Icon icon={btn.icon} className="w-[1.2vw] h-[1.2vw]" /> : <span className="text-[1.1vw] font-bold">{btn.label}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Color Picker & Hex row */}
                        <div className="flex items-center gap-[0.5vw]">
                            <div
                                className="w-[2.2vw] h-[2.2vw] rounded-[0.6vw] border cursor-pointer shadow-sm flex-shrink-0"
                                style={{ backgroundColor: noteTextColor, borderColor: '#555555' }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.left - 200, y: rect.top - 50 });
                                    setPickerTarget('text');
                                    setShowColorPicker(true);
                                }}
                            />
                            <div className="flex-1 h-[2.2vw] flex items-center border rounded-[0.6vw] px-[0.8vw] bg-white shadow-sm overflow-hidden" style={{ borderColor: '#555555' }}>
                                <span className="text-[0.85vw] font-bold text-gray-400 uppercase flex-1">{noteTextColor}</span>
                                <div className="flex items-center gap-[0.2vw] text-[0.85vw] font-bold text-gray-400">
                                    <input
                                        type="text"
                                        value={noteTextOpacity}
                                        onChange={(e) => setNoteTextOpacity(e.target.value)}
                                        className="w-[1.8vw] text-right bg-transparent outline-none"
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto flex items-center gap-[0.8vw]">
                            <button
                                onClick={resetNote}
                                className="flex-1 h-[2.4vw] border-[1.5px] rounded-[0.6vw] flex items-center justify-center gap-[0.5vw] transition-all hover:opacity-90 active:scale-95 shadow-lg"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: '#575C9C',
                                    color: '#575C9C'
                                }}
                            >
                                <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
                                <span className="text-[0.9vw] font-bold">Clear</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (!noteContent.trim()) return;
                                    onAddNote({
                                        content: noteContent,
                                        background: noteBackground,
                                        color: noteTextColor,
                                        fontFamily: noteFontFamily,
                                        fontSize: noteFontSize,
                                        styles: noteStyles,
                                        alignment: noteAlignment,
                                        case: noteCase,
                                        list: noteList,
                                        bgOpacity: noteBgOpacity,
                                        textOpacity: noteTextOpacity,
                                        pageLabel: `Page ${(targetPageIndex + 1).toString().padStart(2, '0')}`,
                                        pageIndex: targetPageIndex
                                    });
                                    onClose();
                                }}
                                className="flex-[1.5] h-[2.4vw] rounded-[0.6vw] text-[0.9vw] font-bold transition-all shadow-xl active:scale-95 hover:opacity-90"
                                style={{
                                    backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'),
                                    color: getLayoutColor('dropdown-bg', '#575C9C')
                                }}
                            >
                                Add To Notes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Color Picker */}
                {showColorPicker && (
                    <div className="absolute z-[1000] right-[0.5vw] top-[3.5vw] w-[14vw] animate-in fade-in zoom-in-95 duration-200">
                        <ColorPallet
                            inline={true}
                            smallMode={true}
                            color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                            opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                            onOpacityChange={(val) => {
                                if (pickerTarget === 'text') setNoteTextOpacity(val);
                                else setNoteBgOpacity(val);
                            }}
                            onChange={(color) => {
                                if (pickerTarget === 'text') setNoteTextColor(color);
                                else setNoteBackground(color);
                            }}
                            onClose={() => setShowColorPicker(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const DesktopLayout1 = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
    setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, totalPages, isSpread, ColorPallet, Icon,
    getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha,
    isEditingPage, setIsEditingPage, targetPageIndex, setTargetPageIndex,
    activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen
}) => {
    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
            onClick={onClose}
        >
            <div
                className="w-[500px] min-h-[310px] rounded-[1.2vw] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 p-[1vw] relative border border-white/20 backdrop-blur-xl"
                style={{
                    backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.95'),
                    transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)',
                    transformOrigin: 'center center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-[0.4vw]">
                    <span className="text-[1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Notes</span>
                    <button
                        onClick={onClose}
                        className="transition-colors"
                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }}
                    >
                        <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                    </button>
                </div>
                <div className="w-full h-[1px] mb-[0.8vw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }} />

                <div className="flex gap-[1vw]">
                    {/* Left - Colors */}
                    <div className="flex flex-col gap-[0.4vw]">
                        {['#34B1AA', '#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54'].map((color, i) => (
                            <div
                                key={i}
                                onClick={() => setNoteBackground(color)}
                                className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] cursor-pointer hover:scale-110 transition-transform border-[0.1vw] ${noteBackground === color ? 'border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className="w-[1.6vw] h-[1.6vw] rounded-[0.4vw] cursor-pointer hover:scale-110 transition-transform flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] color-picker-trigger"
                        >
                            <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-white/50" />
                        </div>
                    </div>

                    {/* Middle - Sticky Note */}
                    <div
                        className="relative w-[230px] h-[240px] rounded-[0.6vw] p-[0.7vw] shadow-lg flex flex-col transition-colors duration-300"
                        style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                    >
                        <div className="absolute top-[0.5vw] right-[0.8vw] z-20 flex items-center gap-[0.3vw] hover:bg-white/10 rounded px-[0.3vw] py-[0.1vw] transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                        >
                            <span className="text-[0.65vw] font-bold text-white opacity-90">{pageDisplay}</span>
                            <Icon icon="lucide:pencil" className="w-[0.9vw] h-[0.9vw] text-white opacity-80" />

                            {isPageDropdownOpen && (
                                <div className="absolute top-full right-0 mt-[0.2vw] w-[6vw] max-h-[10vw] bg-white rounded-[0.4vw] shadow-2xl overflow-y-auto custom-scrollbar z-[100] border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                    {Array.from({ length: totalPages || 1 }, (_, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setTargetPageIndex(i);
                                                setIsPageDropdownOpen(false);
                                            }}
                                            className={`px-[0.8vw] py-[0.4vw] text-[0.75vw] cursor-pointer transition-colors ${targetPageIndex === i ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            Page {i + 1}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your Notes"
                            style={{
                                textAlign: noteAlignment,
                                fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                fontFamily: noteFontFamily,
                                fontSize: `${noteFontSize}px`,
                                color: noteTextColor,
                                opacity: noteTextOpacity / 100,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                width: '100%',
                                height: '100%'
                            }}
                            className="flex-1 pt-[1.8vw] placeholder:text-white/40 font-medium overflow-y-auto custom-scrollbar"
                        />
                    </div>

                    {/* Right - Controls */}
                    <div className="flex-1 flex flex-col gap-[0.6vw] relative" onClick={() => setActiveFormattingTab(null)}>
                        {/* Color Picker will be rendered as a floating popup */}
                        {/* Properties Title */}
                        <div className="flex items-center gap-[0.4vw] mb-[0.1vw]">
                            <span className="text-[0.85vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Text Property</span>
                            <div className="h-[1px] flex-1" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }}></div>
                        </div>

                        {/* Font Family Selection */}
                        <div className="relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                className={`w-full flex items-center justify-between border-[1px] rounded-[0.4vw] px-[0.5vw] py-[0.3vw] cursor-pointer transition-all ${isFontMenuOpen ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.2)]' : ''}`}
                                style={{
                                    backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1),
                                    borderColor: isFontMenuOpen ? getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.4) : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                    color: getLayoutColor('dropdown-text', '#FFFFFF')
                                }}
                            >
                                <span className="text-[0.8vw] font-medium" style={{ fontFamily: noteFontFamily, color: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                    {noteFontFamily}
                                </span>
                                <Icon icon="lucide:chevron-down" className={`w-[0.8vw] h-[0.8vw] transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                            </div>

                            {isFontMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-2xl z-50 overflow-hidden">
                                    <div className="max-h-[12vw] overflow-y-auto custom-scrollbar py-[0.4vw]">
                                        {fonts.map((font) => (
                                            <div
                                                key={font}
                                                onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }}
                                                className={`px-[1vw] py-[0.6vw] text-[0.85vw] cursor-pointer transition-colors ${noteFontFamily === font ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
                                                style={{ fontFamily: font }}
                                            >
                                                {font}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-[0.7vw]">
                            <div className="flex-1 relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsWeightMenuOpen(!isWeightMenuOpen); setIsSizeMenuOpen(false); setIsFontMenuOpen(false); }}
                                    className={`w-full h-[2.2vw] flex items-center justify-between border-[1px] rounded-[0.4vw] px-[0.6vw] py-[0.3vw] cursor-pointer transition-all`}
                                    style={{
                                        backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1),
                                        borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                        color: getLayoutColor('dropdown-text', '#FFFFFF')
                                    }}
                                >
                                    <span className="text-[0.75vw] font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{noteWeight}</span>
                                    <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] transition-transform" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                                </div>
                                {isWeightMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-2xl z-50">
                                        {weights.map((w) => (
                                            <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className="px-[1vw] py-[0.6vw] text-[0.85vw] cursor-pointer hover:bg-gray-100 text-gray-700">{w}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="w-[4.5vw] relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsSizeMenuOpen(!isSizeMenuOpen); setIsWeightMenuOpen(false); setIsFontMenuOpen(false); }}
                                    className={`w-full h-[2.2vw] flex items-center justify-between border-[1px] rounded-[0.4vw] px-[0.5vw] py-[0.3vw] cursor-pointer transition-all`}
                                    style={{
                                        backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1),
                                        borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                        color: getLayoutColor('dropdown-text', '#FFFFFF')
                                    }}
                                >
                                    <span className="text-[0.75vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{noteFontSize}</span>
                                    <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw]" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                                </div>
                                {isSizeMenuOpen && (
                                    <div className="absolute top-full right-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-2xl z-50">
                                        <div className="max-h-[10vw] overflow-y-auto py-[0.4vw]">
                                            {sizes.map((s) => (
                                                <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className="px-[1vw] py-[0.5vw] text-[0.85vw] text-center cursor-pointer hover:bg-gray-100 text-gray-700">{s}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Formatting Tool Options Bars */}
                        <AnimatePresence mode="wait">
                            {activeFormattingTab && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="mb-[0.4vw] flex justify-end"
                                >
                                    <div className="bg-[#1E1E1E] rounded-[0.8vw] p-[0.3vw] flex gap-[0.3vw] shadow-xl" onClick={(e) => e.stopPropagation()}>
                                        {activeFormattingTab === 'align' && (
                                            <>
                                                {[
                                                    { id: 'left', icon: 'lucide:align-left' },
                                                    { id: 'center', icon: 'lucide:align-center' },
                                                    { id: 'right', icon: 'lucide:align-right' },
                                                    { id: 'justify', icon: 'lucide:align-justify' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setNoteAlignment(opt.id)}
                                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.5vw] flex items-center justify-center transition-all ${noteAlignment === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                    >
                                                        <Icon icon={opt.icon} className="w-[1vw] h-[1vw]" />
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {activeFormattingTab === 'style' && (
                                            <>
                                                {[
                                                    { id: 'bold', label: 'B' },
                                                    { id: 'italic', label: 'I' },
                                                    { id: 'underline', label: 'U' },
                                                    { id: 'strike', label: 'S' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => toggleNoteStyle(opt.id)}
                                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.5vw] flex items-center justify-center transition-all ${noteStyles.includes(opt.id) ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                    >
                                                        <span className={`text-[0.9vw] font-bold ${opt.id === 'italic' ? 'italic' : opt.id === 'underline' ? 'underline' : opt.id === 'strike' ? 'line-through' : ''}`}>{opt.label}</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {activeFormattingTab === 'case' && (
                                            <>
                                                {[
                                                    { id: 'none', label: '—' },
                                                    { id: 'sentence', label: 'Aa' },
                                                    { id: 'upper', label: 'AB' },
                                                    { id: 'lower', label: 'ab' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setNoteCase(opt.id)}
                                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.5vw] flex items-center justify-center transition-all ${noteCase === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                    >
                                                        <span className="text-[0.85vw] font-bold">{opt.label}</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {activeFormattingTab === 'list' && (
                                            <>
                                                {[
                                                    { id: 'bullet', icon: 'lucide:list' },
                                                    { id: 'bullet2', icon: 'material-symbols:list' },
                                                    { id: 'ordered', icon: 'lucide:list-ordered' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleListClick(opt.id)}
                                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.5vw] flex items-center justify-center transition-all ${noteList === opt.id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                                                    >
                                                        <Icon icon={opt.icon} className="w-[1vw] h-[1vw]" />
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tool Buttons Categories */}
                        <div className="flex items-center justify-end gap-[0.4vw]">
                            {[
                                { id: 'align', icon: `lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment}`, action: () => setActiveFormattingTab(prev => prev === 'align' ? null : 'align') },
                                { id: 'style', label: 'B', action: () => setActiveFormattingTab(prev => prev === 'style' ? null : 'style') },
                                { id: 'case', label: noteCase === 'none' ? '—' : noteCase === 'sentence' ? 'Aa' : noteCase === 'upper' ? 'AB' : 'ab', action: () => setActiveFormattingTab(prev => prev === 'case' ? null : 'case') },
                                { id: 'list', icon: noteList === 'ordered' ? 'lucide:list-ordered' : 'lucide:list', action: () => setActiveFormattingTab(prev => prev === 'list' ? null : 'list') }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                    className={`w-[2vw] h-[2vw] rounded-[0.4vw] border-[1px] transition-all flex items-center justify-center ${activeFormattingTab === btn.id ? 'border-transparent' : 'hover:opacity-80'}`}
                                    style={{
                                        backgroundColor: activeFormattingTab === btn.id ? getLayoutColor('dropdown-text', '#FFFFFF') : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1),
                                        borderColor: activeFormattingTab === btn.id ? 'transparent' : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                        color: activeFormattingTab === btn.id ? getLayoutColor('dropdown-bg', '#575C9C') : getLayoutColor('dropdown-text', '#FFFFFF')
                                    }}
                                >
                                    {btn.icon ? <Icon icon={btn.icon} className="w-[1vw] h-[1vw]" /> : <span className="text-[0.9vw] font-bold">{btn.label}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Color Picker & Hex */}
                        <div className="flex items-center gap-[0.5vw]">
                            <div
                                className="w-[1.4vw] h-[1.4vw] rounded-[0.3vw] border border-white/20 cursor-pointer shadow-sm flex-shrink-0 color-picker-trigger"
                                style={{ backgroundColor: noteTextColor }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.left - 180, y: rect.top - 50 });
                                    setPickerTarget('text');
                                    setShowColorPicker(true);
                                }}
                            />
                            <div className="flex-1 flex items-center border rounded-[0.4vw] px-[0.5vw] py-[0.3vw]" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }}>
                                <span className="text-[0.7vw] font-medium flex-1" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{noteTextColor.toUpperCase()}</span>
                                <div className="flex items-center gap-[0.1vw] text-[0.7vw]" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.7 }}>
                                    <input
                                        type="text"
                                        value={noteTextOpacity}
                                        onChange={(e) => setNoteTextOpacity(e.target.value)}
                                        className="w-[1.4vw] text-right bg-transparent outline-none"
                                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto flex items-center gap-[0.6vw]">
                            <button
                                onClick={resetNote}
                                className="flex-1 h-[1.8vw] border rounded-[0.4vw] flex items-center justify-center gap-[0.3vw] hover:bg-white/10 transition-colors"
                                style={{
                                    borderColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', '0.3'),
                                    color: getLayoutColor('dropdown-text', '#FFFFFF')
                                }}
                            >
                                <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                <span className="text-[0.8vw] font-medium">Clear</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (!noteContent.trim()) return;
                                    onAddNote({
                                        content: noteContent,
                                        background: noteBackground,
                                        color: noteTextColor,
                                        fontFamily: noteFontFamily,
                                        fontSize: noteFontSize,
                                        styles: noteStyles,
                                        alignment: noteAlignment,
                                        case: noteCase,
                                        list: noteList,
                                        bgOpacity: noteBgOpacity,
                                        textOpacity: noteTextOpacity,
                                        pageLabel: `Page ${(targetPageIndex + 1).toString().padStart(2, '0')}`,
                                        pageIndex: targetPageIndex
                                    });
                                    onClose();
                                }}
                                className="flex-[1.5] h-[1.8vw] rounded-[0.4vw] text-[0.8vw] font-bold hover:opacity-90 transition-all shadow-lg"
                                style={{
                                    backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'),
                                    color: getLayoutColor('dropdown-bg', '#575C9C')
                                }}
                            >
                                Add To Notes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Color Picker to match exact place in screenshot */}
                {showColorPicker && (
                    <div className="absolute z-[1000] right-[0.5vw] top-[3.2vw] w-[12vw] animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                        <ColorPallet
                            inline={true}
                            smallMode={true}
                            color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                            opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                            onOpacityChange={(val) => {
                                if (pickerTarget === 'text') setNoteTextOpacity(val);
                                else setNoteBgOpacity(val);
                            }}
                            onChange={(color) => {
                                if (pickerTarget === 'text') setNoteTextColor(color);
                                else setNoteBackground(color);
                            }}
                            onClose={() => setShowColorPicker(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const DesktopLayout8 = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
    setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, totalPages, isSpread, ColorPallet, Icon,
    getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha,
    isLightColor, targetPageIndex, setTargetPageIndex,
    activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen, bodyTextColor
}) => {
    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
            onClick={onClose}
        >
            <div
                className="w-[32vw] min-w-[520px] bg-white rounded-[0.6vw] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden border-2 border-white"
                style={{
                    transform: isSidebarOpen ? 'translate(8vw, 0) scale(0.9)' : 'scale(1)',
                    transformOrigin: 'center center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Fixed Blue */}
                <div
                    className="flex items-center justify-between px-[1.2vw] py-[0.6vw]"
                    style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                >
                    <span className="text-[1.1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Notes</span>
                    <button
                        onClick={onClose}
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                    >
                        <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
                    </button>
                </div>

                <div className="flex p-[1vw] gap-[1vw]">
                    {/* Left Column - Colors */}
                    <div className="flex flex-col gap-[0.5vw]">
                        {[
                            '#34B1AA', // Teal
                            '#C68899', // Dusty Rose
                            '#D6566E', // Pink
                            '#6A7DBB', // Blue
                            '#68AC77', // Green
                            '#D9DC54', // Yellow
                            '#23D295'  // Mint
                        ].map((color, i) => (
                            <div
                                key={i}
                                onClick={() => setNoteBackground(color)}
                                className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] cursor-pointer hover:scale-110 transition-transform ${noteBackground === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className="w-[1.6vw] h-[1.6vw] rounded-[0.4vw] cursor-pointer hover:scale-110 transition-transform flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
                        >
                            <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-white/50" />
                        </div>
                    </div>

                    {/* Middle Column - Large Sticky Note */}
                    <div className="flex-[1.2] flex flex-col justify-center">
                        <div
                            className="relative w-full aspect-[1.1/1] rounded-[0.8vw] p-[1vw] shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col transition-colors duration-300"
                            style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                        >
                            <div
                                className="absolute top-[0.6vw] right-[0.8vw] z-20 flex items-center gap-[0.3vw] cursor-pointer hover:opacity-80"
                                onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                            >
                                <span className={`text-[0.7vw] font-bold ${isLightColor(noteBackground) ? 'text-black/50' : 'text-white/80'}`}>
                                    Page {(targetPageIndex + 1).toString().padStart(2, '0')}
                                </span>
                                <Icon icon="lucide:pencil" className={`w-[0.9vw] h-[0.9vw] ${isLightColor(noteBackground) ? 'text-black/50' : 'text-white/80'}`} />

                                {isPageDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-[0.2vw] w-[7vw] max-h-[10vw] bg-white rounded-[0.5vw] shadow-2xl overflow-y-auto custom-scrollbar z-[100] border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                        {Array.from({ length: totalPages || 1 }, (_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setTargetPageIndex(i);
                                                    setIsPageDropdownOpen(false);
                                                }}
                                                className={`px-[0.8vw] py-[0.5vw] text-[0.75vw] cursor-pointer transition-colors ${targetPageIndex === i ? 'font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                style={targetPageIndex === i ? { backgroundColor: getLayoutColor('dropdown-bg', '#575C9C'), color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter your Notes"
                                style={{
                                    textAlign: noteAlignment,
                                    fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                    fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                    textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                    textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                    fontFamily: noteFontFamily,
                                    fontSize: `${noteFontSize}px`,
                                    color: noteTextColor,
                                    opacity: noteTextOpacity / 100,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    width: '100%',
                                    height: '100%'
                                }}
                                className={`flex-1 pt-[1.6vw] font-medium custom-scrollbar placeholder:${isLightColor(noteBackground) ? 'text-black/30' : 'text-white/40'}`}
                            />
                        </div>
                    </div>

                    {/* Right Column - Controls */}
                    <div className="w-[12vw] flex flex-col gap-[0.5vw]">
                        <h2 className="text-[0.9vw] font-bold" style={{ color: bodyTextColor || getLayoutColor('dropdown-text', '#575C9C') }}>Text Property :</h2>

                        {/* Font Family Selection */}
                        <div className="relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); setActiveFormattingTab(null); }}
                                className="w-full h-[2.1vw] flex items-center justify-between border-[1.5px] rounded-[0.4vw] px-[0.6vw] cursor-pointer bg-white transition-all"
                                style={{ borderColor: '#555555' }}
                            >
                                <span className="text-[0.75vw] font-medium text-gray-700 truncate" style={{ fontFamily: noteFontFamily }}>{noteFontFamily}</span>
                                <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] text-gray-500" />
                            </div>

                            {isFontMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-2xl z-50 overflow-hidden">
                                    <div className="max-h-[10vw] overflow-y-auto custom-scrollbar py-[0.4vw]">
                                        {fonts.map((f) => (
                                            <div
                                                key={f}
                                                onClick={() => { setNoteFontFamily(f); setIsFontMenuOpen(false); }}
                                                className={`px-[0.8vw] py-[0.4vw] text-[0.75vw] cursor-pointer hover:bg-gray-100 ${noteFontFamily === f ? 'bg-gray-50 font-bold' : 'text-gray-700'}`}
                                                style={{ fontFamily: f, ...(noteFontFamily === f ? { color: bodyTextColor || getLayoutColor('dropdown-text', '#575C9C') } : {}) }}
                                            >
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Weight and Size Row */}
                        <div className="flex gap-[0.4vw]">
                            <div className="flex-1 relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); setActiveFormattingTab(null); }}
                                    className="w-full h-[2.1vw] flex items-center justify-between border-[1.5px] rounded-[0.4vw] px-[0.6vw] cursor-pointer bg-white"
                                    style={{ borderColor: '#555555' }}
                                >
                                    <span className="text-[0.7vw] font-bold text-gray-700 truncate">{noteWeight}</span>
                                    <Icon icon="lucide:chevron-down" className="w-[0.8vw] h-[0.8vw] text-gray-500" />
                                </div>
                                {isWeightMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-2xl z-50">
                                        {weights.map((w) => (
                                            <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className="px-[0.6vw] py-[0.4vw] text-[0.7vw] cursor-pointer hover:bg-gray-100 text-gray-700">{w}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="w-[4vw] relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); setActiveFormattingTab(null); }}
                                    className="w-full h-[2.1vw] flex items-center justify-between border-[1.5px] rounded-[0.4vw] px-[0.6vw] cursor-pointer bg-white"
                                    style={{ borderColor: '#555555' }}
                                >
                                    <span className="text-[0.7vw] font-bold text-gray-700">{noteFontSize}</span>
                                    <Icon icon="lucide:chevron-down" className="w-[0.8vw] h-[0.8vw] text-gray-500" />
                                </div>
                                {isSizeMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-[0.3vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-2xl z-50 max-h-[10vw] overflow-y-auto">
                                        {sizes.map((s) => (
                                            <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className="px-[0.8vw] py-[0.4vw] text-[0.7vw] text-center cursor-pointer hover:bg-gray-100 text-gray-700">{s}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Formatting Row - 4 Buttons */}
                        <div className="flex gap-[0.4vw] h-[2.1vw]">
                            {[
                                { id: 'align', icon: `lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment === 'left' ? 'left' : noteAlignment === 'right' ? 'right' : 'center'}`, action: () => setActiveFormattingTab(prev => prev === 'align' ? null : 'align') },
                                { id: 'bold', label: 'B', active: noteStyles.includes('bold') || noteWeight === 'Bold', action: () => toggleNoteStyle('bold') },
                                { id: 'dash', label: '—', action: () => { } }, // Visual Placeholder
                                { id: 'list', icon: 'lucide:list', active: noteList !== 'none', action: () => setActiveFormattingTab(prev => prev === 'list' ? null : 'list') }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                    className={`flex-1 h-full border-[1.5px] rounded-[0.4vw] flex items-center justify-center transition-all ${btn.active ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                                    style={{ borderColor: '#555555' }}
                                >
                                    {btn.icon ? <Icon icon={btn.icon} className="w-[1vw] h-[1vw] text-gray-700" /> : <span className="text-[0.9vw] font-bold text-gray-700">{btn.label}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Floating Bars for Align/List if active (keeping Layout 1 behavior) */}
                        <AnimatePresence>
                            {activeFormattingTab && (
                                <div className="relative h-0" onClick={(e) => e.stopPropagation()}>
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute bottom-[2.2vw] right-0 bg-[#333333] rounded-[0.4vw] p-[0.2vw] flex gap-[0.1vw] z-[60] shadow-xl"
                                    >
                                        {activeFormattingTab === 'align' && ['left', 'center', 'right', 'justify'].map(align => (
                                            <button key={align} onClick={() => setNoteAlignment(align)} className={`w-[1.4vw] h-[1.4vw] rounded-[0.2vw] flex items-center justify-center ${noteAlignment === align ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                                                <Icon icon={`lucide:align-${align}`} className="w-[0.7vw] h-[0.7vw]" />
                                            </button>
                                        ))}
                                        {activeFormattingTab === 'list' && ['bullet', 'ordered'].map(list => (
                                            <button key={list} onClick={() => handleListClick(list)} className={`w-[1.4vw] h-[1.4vw] rounded-[0.2vw] flex items-center justify-center ${noteList === list ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                                                <Icon icon={list === 'bullet' ? 'lucide:list' : 'lucide:list-ordered'} className="w-[0.7vw] h-[0.7vw]" />
                                            </button>
                                        ))}
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Text Color Selection Row */}
                        <div className="flex items-center gap-[0.5vw]">
                            <div
                                className="w-[2.1vw] h-[2.1vw] rounded-[0.4vw] border-[1.5px] cursor-pointer shadow-sm flex-shrink-0"
                                style={{ backgroundColor: noteTextColor, borderColor: '#555555' }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.left - 200, y: rect.top - 100 });
                                    setPickerTarget('text');
                                    setShowColorPicker(true);
                                }}
                            />
                            <div className="flex-1 h-[2.1vw] flex items-center border-[1.5px] rounded-[0.4vw] px-[0.6vw]" style={{ borderColor: '#555555' }}>
                                <span className="text-[0.7vw] font-bold text-gray-500 uppercase flex-1">{noteTextColor}</span>
                                <div className="flex items-center gap-[0.1vw] text-[0.7vw] font-bold text-gray-500">
                                    <input
                                        type="text"
                                        value={noteTextOpacity}
                                        onChange={(e) => setNoteTextOpacity(e.target.value)}
                                        className="w-[1.2vw] text-right bg-transparent outline-none"
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="mt-auto flex gap-[0.5vw]">
                            <button
                                onClick={resetNote}
                                className="flex-1 h-[2.1vw] border-[1.5px] rounded-[0.5vw] flex items-center justify-center gap-[0.3vw] transition-all hover:bg-gray-50"
                                style={{ borderColor: '#555555', color: bodyTextColor || getLayoutColor('dropdown-text', '#575C9C') }}
                            >
                                <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                <span className="text-[0.8vw] font-bold">Clear</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (!noteContent.trim()) return;
                                    onAddNote({
                                        content: noteContent, background: noteBackground, color: noteTextColor,
                                        fontFamily: noteFontFamily, fontSize: noteFontSize, styles: noteStyles,
                                        alignment: noteAlignment, case: noteCase, list: noteList,
                                        bgOpacity: noteBgOpacity, textOpacity: noteTextOpacity,
                                        pageLabel: `Page ${(targetPageIndex + 1).toString().padStart(2, '0')}`,
                                        pageIndex: targetPageIndex
                                    });
                                    onClose();
                                }}
                                className="flex-[1.4] h-[2.1vw] rounded-[0.5vw] font-bold text-[0.8vw] shadow-lg transition-all hover:brightness-110 active:scale-95"
                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C'), color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                            >
                                Add To Notes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Color Picker */}
                {showColorPicker && (
                    <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-[200] animate-in fade-in zoom-in-95 duration-200">
                        <ColorPallet
                            inline={true}
                            smallMode={true}
                            color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                            opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                            onOpacityChange={val => pickerTarget === 'text' ? setNoteTextOpacity(val) : setNoteBgOpacity(val)}
                            onChange={color => pickerTarget === 'text' ? setNoteTextColor(color) : setNoteBackground(color)}
                            onClose={() => setShowColorPicker(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};


const DesktopLayout9 = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
    setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, totalPages, isSpread, ColorPallet, Icon,
    isLandscape, activeLayout,
    isEditingPage, setIsEditingPage, targetPageIndex, setTargetPageIndex,
    getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha,
    activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen, isLightColor
}) => {
    return (
        <div
            className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-auto bg-black/10"
            onClick={onClose}
        >
            <div
                className="p-[0.8vw] rounded-[1.2vw] shadow-[0_0.8vw_2.5vw_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300"
                style={{
                    backgroundColor: 'rgba(74, 91, 156, 0.7)', // The "Border" blue background
                    backdropFilter: 'blur(8px)',
                    transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)',
                    transformOrigin: 'center center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="bg-white rounded-[0.8vw] w-[28vw] flex flex-col relative overflow-hidden"
                >
                    {/* Header Section */}
                    <div className="flex items-center justify-between px-[1vw] pt-[1vw] pb-[0.4vw]">
                        <div className="flex items-center flex-1">
                            <span className="text-[0.8vw] font-bold text-[#1a1a1a] mr-[0.6vw] whitespace-nowrap">Add Notes</span>
                            <div className="h-[1px] flex-1 bg-gray-200"></div>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-[0.8vw] w-[1.2vw] h-[1.2vw] flex items-center justify-center text-[#ff3b3b] hover:bg-red-50 rounded-full transition-all"
                        >
                            <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw] stroke-[3]" />
                        </button>
                    </div>

                    {/* Main Content Body */}
                    <div className="flex gap-[0.8vw] px-[1vw] pb-[1.2vw] items-start">

                        {/* Left - Color Circles */}
                        <div className="flex flex-col gap-[0.4vw] pt-[0.2vw]">
                            {['#31B0B0', '#C68798', '#D6566E', '#6B7DBB', '#67AC78', '#D8DC53', '#23D295'].map((color, i) => (
                                <button
                                    key={i}
                                    onClick={() => setNoteBackground(color)}
                                    className={`w-[1.2vw] h-[1.2vw] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm border-[0.08vw] ${noteBackground === color ? 'border-gray-800 ring-2 ring-white ring-offset-0' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 20, y: rect.top });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-[1.2vw] h-[1.2vw] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
                            />
                        </div>

                        {/* Middle - Sticky Note Area */}
                        <div
                            className="relative flex-[1.2] h-[11.5vw] rounded-[0.7vw] p-[0.7vw] flex flex-col transition-colors duration-300 shadow-[0_0.4vw_1.2vw_rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                        >
                            <div
                                className="absolute top-[0.5vw] right-[0.5vw] flex items-center gap-[0.2vw] z-20 hover:bg-black/10 rounded px-[0.3vw] py-[0.1vw] transition-colors cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                            >
                                <span className={`text-[0.55vw] font-bold ${isLightColor(noteBackground) ? 'text-black/60' : 'text-white/90'}`}>{pageDisplay}</span>
                                <Icon icon="lucide:pencil" className={`w-[0.6vw] h-[0.6vw] ${isLightColor(noteBackground) ? 'text-black/60' : 'text-white/90'}`} />

                                {isPageDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-[0.2vw] w-[6vw] max-h-[10vw] bg-white rounded-[0.4vw] shadow-2xl overflow-y-auto custom-scrollbar z-[100] border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                        {Array.from({ length: totalPages || 1 }, (_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setTargetPageIndex(i);
                                                    setIsPageDropdownOpen(false);
                                                }}
                                                className={`px-[0.8vw] py-[0.4vw] text-[0.65vw] cursor-pointer transition-colors ${targetPageIndex === i ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter your Notes"
                                style={{
                                    textAlign: noteAlignment,
                                    fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                    fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                    textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                    textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                    fontFamily: noteFontFamily,
                                    fontSize: `${noteFontSize}px`,
                                    color: noteTextColor,
                                    opacity: noteTextOpacity / 100,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    width: '100%',
                                    height: '100%'
                                }}
                                className={`flex-1 pt-[0.8vw] font-medium overflow-y-auto custom-scrollbar text-[0.7vw] ${isLightColor(noteBackground) ? 'placeholder:text-black/30' : 'placeholder:text-white/40'}`}
                            />
                        </div>

                        {/* Right - Properties & Actions */}
                        <div className="flex-1 flex flex-col h-[14vw]">
                            <div className="flex flex-col gap-[0.5vw]" onClick={() => setActiveFormattingTab(null)}>
                                <div className="flex items-center gap-[0.3vw]">
                                    <span className="text-[0.75vw] font-bold text-[#1a1a1a] whitespace-nowrap">Text Property</span>
                                    <div className="h-[1px] flex-1 bg-gray-200"></div>
                                </div>

                                <div className="flex flex-col gap-[0.4vw]">
                                    {/* Font Dropdown */}
                                    <div className="relative">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                            className={`w-full flex items-center justify-between border-[0.05vw] rounded-[0.6vw] px-[0.5vw] py-[0.3vw] cursor-pointer transition-all bg-white border-gray-400 hover:border-black`}
                                        >
                                            <span className="text-[0.6vw] font-medium text-gray-700 truncate">{noteFontFamily}</span>
                                            <Icon icon="lucide:chevron-down" className={`w-[0.5vw] h-[0.5vw] text-gray-500 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                        {isFontMenuOpen && (
                                            <div className="absolute top-full left-0 w-full mt-[0.1vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-2xl z-50 overflow-hidden py-[0.1vw]">
                                                <div className="max-h-[5vw] overflow-y-auto custom-scrollbar py-[0.1vw]">
                                                    {fonts.map(f => (
                                                        <div key={f} onClick={() => { setNoteFontFamily(f); setIsFontMenuOpen(false); }} className="px-[0.5vw] py-[0.2vw] text-[0.55vw] hover:bg-gray-50 cursor-pointer">{f}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Weight & Size Row */}
                                    <div className="flex gap-[0.4vw]">
                                        <div className="flex-[1.8] relative min-w-0">
                                            <div
                                                onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); }}
                                                className="w-full flex items-center justify-between border-[0.05vw] rounded-[0.6vw] px-[0.5vw] py-[0.3vw] cursor-pointer bg-white border-gray-400"
                                            >
                                                <span className="text-[0.6vw] font-medium text-gray-700 truncate">{noteWeight}</span>
                                                <Icon icon="lucide:chevron-down" className="w-[0.5vw] h-[0.5vw] text-gray-500" />
                                            </div>
                                            {isWeightMenuOpen && (
                                                <div className="absolute top-full left-0 w-full mt-[0.1vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-2xl z-50 py-[0.1vw]">
                                                    {weights.map(w => (
                                                        <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className="px-[0.5vw] py-[0.2vw] text-[0.55vw] hover:bg-gray-50 cursor-pointer">{w}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 relative min-w-0">
                                            <div
                                                onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                                className="w-full flex items-center justify-between border-[0.05vw] rounded-[0.6vw] px-[0.5vw] py-[0.3vw] cursor-pointer bg-white border-gray-400"
                                            >
                                                <span className="text-[0.6vw] font-medium text-gray-700">{noteFontSize}</span>
                                                <Icon icon="lucide:chevron-down" className="w-[0.5vw] h-[0.5vw] text-gray-500" />
                                            </div>
                                            {isSizeMenuOpen && (
                                                <div className="absolute top-full left-0 w-full mt-[0.1vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-2xl z-50 py-[0.1vw] text-center">
                                                    <div className="max-h-[4vw] overflow-y-auto custom-scrollbar py-[0.1vw]">
                                                        {sizes.map(s => (
                                                            <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className="px-[0.5vw] py-[0.1vw] text-[0.55vw] hover:bg-gray-50 cursor-pointer">{s}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Format Controls Row */}
                                <div className="flex items-center gap-[0.3vw]">
                                    {[
                                        { id: 'align', icon: `lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment}` },
                                        { id: 'bold', label: 'B', action: () => toggleNoteStyle('bold'), active: noteStyles.includes('bold') || noteWeight === 'Bold' },
                                        { id: 'minus', icon: 'lucide:minus' },
                                        { id: 'list', icon: 'lucide:list', action: () => handleListClick('bullet'), active: noteList !== 'none' }
                                    ].map((btn, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); btn.action ? btn.action() : setActiveFormattingTab(prev => prev === btn.id ? null : btn.id); }}
                                            className={`w-[1.6vw] h-[1.6vw] rounded-full border-[0.05vw] flex items-center justify-center transition-all ${btn.active || activeFormattingTab === btn.id ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-400 text-gray-700 hover:border-black'}`}
                                        >
                                            {btn.icon ? <Icon icon={btn.icon} className="w-[0.8vw] h-[0.8vw]" /> : <span className="text-[0.7vw] font-bold">{btn.label}</span>}
                                        </button>
                                    ))}
                                </div>

                                {/* Color Selector & Hex Row */}
                                <div className="flex items-center gap-[0.3vw]">
                                    <div
                                        className="w-[1.5vw] h-[1.5vw] rounded-full border-[0.05vw] border-gray-300 shadow-sm cursor-pointer shrink-0"
                                        style={{ backgroundColor: noteTextColor }}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.left - 200, y: rect.top - 100 });
                                            setPickerTarget('text');
                                            setShowColorPicker(true);
                                        }}
                                    />
                                    <div className="flex-1 flex items-center border-[0.05vw] border-gray-400 rounded-[0.6vw] pl-[0.5vw] pr-[0.3vw] py-[0.25vw] bg-white group focus-within:border-black min-w-0">
                                        <span className="text-[0.6vw] font-medium text-gray-500 mr-[0.2vw]">#</span>
                                        <input
                                            type="text"
                                            value={noteTextColor.replace('#', '')}
                                            onChange={(e) => setNoteTextColor('#' + e.target.value)}
                                            className="flex-1 bg-transparent outline-none text-[0.55vw] font-medium text-gray-700 uppercase min-w-0"
                                        />
                                        <div className="flex items-center border-l pl-[0.2vw] ml-[0.2vw] border-gray-200">
                                            <input
                                                type="text"
                                                value={noteTextOpacity}
                                                onChange={(e) => setNoteTextOpacity(e.target.value)}
                                                className="w-[1.2vw] text-right bg-transparent outline-none text-[0.55vw] font-medium text-gray-600"
                                            />
                                            <span className="text-[0.5vw] text-gray-600">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Action Buttons */}
                            <div className="mt-auto flex items-center gap-[0.5vw]">
                                <button
                                    onClick={resetNote}
                                    className="flex-1 h-[1.8vw] border-[0.05vw] border-black rounded-[1vw] flex items-center justify-center gap-[0.3vw] hover:bg-gray-50 transition-all font-bold text-black text-[0.65vw]"
                                >
                                    <Icon icon="lucide:x" className="w-[0.7vw] h-[0.7vw]" />
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: pageDisplay,
                                            pageIndex: targetPageIndex
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.3] h-[1.8vw] bg-black text-white rounded-[1vw] text-[0.65vw] font-bold hover:bg-zinc-800 transition-all"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Color Picker Modal */}
                    {showColorPicker && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto bg-black/10" onClick={() => setShowColorPicker(false)}>
                            <div onClick={e => e.stopPropagation()}>
                                <ColorPallet
                                    color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                                    opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                                    onOpacityChange={(val) => {
                                        if (pickerTarget === 'text') setNoteTextOpacity(val);
                                        else setNoteBgOpacity(val);
                                    }}
                                    onChange={(color) => {
                                        if (pickerTarget === 'text') setNoteTextColor(color);
                                        else setNoteBackground(color);
                                    }}
                                    onClose={() => setShowColorPicker(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DesktopDefaultLayout = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
    setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, totalPages, isSpread, ColorPallet, currentPageIndex, Icon,
    targetPageIndex, activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen
}) => {
    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
            onClick={onClose}
        >
            <div
                className="w-[34vw] bg-white rounded-[1vw] border-[0.1vw] border-[#22C55E]/60 shadow-[0_1.5vw_4vw_rgba(0,0,0,0.12)] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 p-[1vw] gap-[0.8vw] transition-transform duration-500 ease-in-out"
                style={{
                    transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)',
                    transformOrigin: 'center center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex flex-col mb-[0.2vw]">
                    {/* First Line: Icon alone */}
                    <div className="flex justify-center w-full py-[0.2vw]">
                        <Icon icon="material-symbols:drag-indicator" className="w-[1.4vw] h-[1.4vw] text-gray-400 rotate-90" />
                    </div>

                    {/* Second Line: Add Notes and Line (with Close button) */}
                    <div className="flex items-center px-[0.5vw] h-[2vw]">
                        <span className="text-[1.1vw] font-bold text-[#1E293B] mr-[1vw]">Add Notes</span>
                        <div className="flex-1 h-[1px] bg-gray-200"></div>
                        <div className="ml-[1.2vw]">
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="w-[1.8vw] h-[1.8vw] bg-white border border-[#F87171] rounded-[0.5vw] flex items-center justify-center text-[#EF4444] hover:bg-red-50 transition-all focus:outline-none"
                            >
                                <Icon icon="lucide:x" className="w-[1vw] h-[1vw] stroke-[2.5]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex gap-[0.8vw] items-start">
                    {/* Left Column - Colors */}
                    <div className="flex flex-col gap-[0.6vw]">
                        {['#31B0B0', '#C68798', '#D6566E', '#6B7DBB', '#67AC78', '#D8DC53', '#23D295'].map((color, i) => (
                            <div
                                key={i}
                                onClick={() => setNoteBackground(color)}
                                className={`w-[1.8vw] h-[1.8vw] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm border-[0.15vw] ${noteBackground === color ? 'border-black' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className="w-[1.8vw] h-[1.8vw] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
                        />
                    </div>

                    {/* Middle Column - Note Area (Editable Textarea) */}
                    <div
                        className="relative w-[13vw] h-[13vw] rounded-[0.8vw] p-[0.7vw] shadow-inner flex flex-col transition-colors duration-300"
                        style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                    >
                        <div className="flex justify-end gap-[0.4vw] mb-[0.2vw] items-center pointer-events-none">
                            <span className="text-[0.65vw] font-medium text-white/90">{pageDisplay}</span>
                            <Icon icon="lucide:pencil" className="w-[0.8vw] h-[0.8vw] text-white/90" />
                        </div>
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your Notes"
                            style={{
                                textAlign: noteAlignment,
                                fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                fontFamily: noteFontFamily,
                                fontSize: `${noteFontSize}px`,
                                color: noteTextColor,
                                opacity: noteTextOpacity / 100,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                width: '100%',
                                height: '100%'
                            }}
                            className="flex-1 placeholder:text-white/40 font-medium overflow-y-auto custom-scrollbar"
                        />
                    </div>

                    {/* Right Column - Properties */}
                    <div className="flex-1 flex flex-col gap-[0.8vw]" onClick={() => setActiveFormattingTab(null)}>
                        <div className="flex items-center gap-[0.5vw]">
                            <span className="text-[0.9vw] font-bold text-gray-900 whitespace-nowrap">Text Property</span>
                            <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
                        </div>

                        {/* Font Family Selection */}
                        <div className="relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsFontMenuOpen(!isFontMenuOpen); }}
                                className={`w-full flex items-center justify-between border-[0.1vw] rounded-[0.6vw] px-[0.8vw] py-[0.4vw] cursor-pointer transition-all bg-white ${isFontMenuOpen ? 'border-[#6366F1] ring-1 ring-[#6366F1]' : 'border-gray-400 hover:border-black'}`}
                            >
                                <span className="text-[0.8vw] font-semibold text-gray-700" style={{ fontFamily: noteFontFamily }}>
                                    {noteFontFamily}
                                </span>
                                <Icon icon="lucide:chevron-down" className={`w-[1vw] h-[1vw] text-gray-500 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isFontMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-[0.5vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-[15vw] overflow-y-auto custom-scrollbar py-[0.5vw]">
                                        {fonts.map((font) => (
                                            <div
                                                key={font}
                                                onClick={() => {
                                                    setNoteFontFamily(font);
                                                    setIsFontMenuOpen(false);
                                                }}
                                                className={`px-[1vw] py-[0.75vw] text-[0.9vw] cursor-pointer transition-colors ${noteFontFamily === font ? 'bg-[#EEF2FF] text-[#6366F1]' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-[#6366F1]'}`}
                                                style={{ fontFamily: font }}
                                            >
                                                {font}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Weight and Size Selection */}
                        <div className="flex gap-[0.7vw]">
                            {/* Weight Dropdown */}
                            <div className="flex-1 relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsWeightMenuOpen(!isWeightMenuOpen); setIsSizeMenuOpen(false); setIsFontMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between border-[0.1vw] rounded-[0.6vw] px-[0.8vw] py-[0.4vw] cursor-pointer transition-all bg-white ${isWeightMenuOpen ? 'border-[#6366F1] ring-1 ring-[#6366F1]' : 'border-gray-400 hover:border-black'}`}
                                >
                                    <span className="text-[0.8vw] font-semibold text-gray-700">
                                        {noteWeight}
                                    </span>
                                    <Icon icon="lucide:chevron-down" className={`w-[1vw] h-[1vw] text-gray-500 transition-transform ${isWeightMenuOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {isWeightMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-[0.5vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="py-[0.5vw]">
                                            {weights.map((w) => (
                                                <div
                                                    key={w}
                                                    onClick={() => {
                                                        setNoteWeight(prev => prev === w ? 'Regular' : w);
                                                        setIsWeightMenuOpen(false);
                                                    }}
                                                    className={`px-[1vw] py-[0.7vw] text-[0.9vw] cursor-pointer transition-colors ${noteWeight === w ? 'bg-[#EEF2FF] text-[#6366F1]' : 'text-gray-700 hover:bg-[#F3F4F6]'}`}
                                                    style={{ fontWeight: getFontWeight(w) }}
                                                >
                                                    {w}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Size Dropdown */}
                            <div className="w-[8vw] relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsSizeMenuOpen(!isSizeMenuOpen); setIsWeightMenuOpen(false); setIsFontMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between border-[0.1vw] rounded-[0.6vw] px-[0.8vw] py-[0.4vw] cursor-pointer transition-all bg-white ${isSizeMenuOpen ? 'border-[#6366F1] ring-1 ring-[#6366F1]' : 'border-gray-400 hover:border-black'}`}
                                >
                                    <span className="text-[0.8vw] font-semibold text-gray-700">
                                        {noteFontSize}
                                    </span>
                                    <Icon icon="lucide:chevron-down" className={`w-[1vw] h-[1vw] text-gray-500 transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {isSizeMenuOpen && (
                                    <div className="absolute top-full right-0 w-full mt-[0.5vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-[15vw] overflow-y-auto custom-scrollbar py-[0.5vw]">
                                            {sizes.map((s) => (
                                                <div
                                                    key={s}
                                                    onClick={() => {
                                                        setNoteFontSize(s);
                                                        setIsSizeMenuOpen(false);
                                                    }}
                                                    className={`px-[1vw] py-[0.6vw] text-[0.9vw] text-center cursor-pointer transition-colors ${noteFontSize === s ? 'bg-[#808080] text-white' : 'text-gray-700 hover:bg-[#F3F4F6]'}`}
                                                >
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Formatting Toolbar - Main Row */}
                        <div className="flex items-center justify-end gap-[0.75vw]">
                            {[
                                { id: 'align', icon: 'lucide:align-center' },
                                { id: 'style', label: 'B' },
                                { id: 'case', label: '—' },
                                { id: 'list', icon: 'lucide:list' }
                            ].map((tab) => (
                                <div key={tab.id} className="relative flex justify-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(prev => prev === tab.id ? null : tab.id); }}
                                        className={`w-[2vw] h-[2vw] border border-gray-400 rounded-[0.6vw] flex items-center justify-center transition-all ${activeFormattingTab === tab.id ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1]' : 'bg-white text-[#4A4A4A] hover:border-black'}`}
                                    >
                                        {tab.icon ? <Icon icon={tab.icon} className="w-[1vw] h-[1vw]" /> : <span className="text-[1vw] font-bold">{tab.label}</span>}
                                    </button>

                                    {activeFormattingTab === tab.id && (
                                        <div className="absolute top-[3.2vw] left-1/2 -translate-x-1/2 w-fit bg-[#1A1A1A] p-[0.35vw] rounded-[0.8vw] flex gap-[0.35vw] animate-in fade-in slide-in-from-top-1 duration-200 z-[60]" onClick={(e) => e.stopPropagation()}>
                                            {tab.id === 'align' && [
                                                { id: 'left', icon: 'lucide:align-left' },
                                                { id: 'center', icon: 'lucide:align-center' },
                                                { id: 'right', icon: 'lucide:align-right' },
                                                { id: 'justify', icon: 'lucide:align-justify' }
                                            ].map((btn) => (
                                                <button
                                                    key={btn.id}
                                                    onClick={() => setNoteAlignment(prev => prev === btn.id ? 'left' : btn.id)}
                                                    className={`w-[2.5vw] h-[2.2vw] rounded-[0.6vw] flex items-center justify-center transition-all ${noteAlignment === btn.id ? 'bg-[#D1D5DB]' : 'bg-white'}`}
                                                >
                                                    <Icon icon={btn.icon} className="w-[1.2vw] h-[1.2vw] text-[#1A1A1A]" />
                                                </button>
                                            ))}
                                            {tab.id === 'style' && [
                                                { id: 'bold', label: 'B', className: 'font-bold' },
                                                { id: 'italic', label: 'I', className: 'italic' },
                                                { id: 'underline', label: 'U', className: 'underline' },
                                                { id: 'strike', label: 'S', className: 'line-through' }
                                            ].map((btn) => (
                                                <button
                                                    key={btn.id}
                                                    onClick={() => toggleNoteStyle(btn.id)}
                                                    className={`w-[2.5vw] h-[2.2vw] rounded-[0.6vw] flex items-center justify-center transition-all ${noteStyles.includes(btn.id) ? 'bg-[#D1D5DB]' : 'bg-white'}`}
                                                >
                                                    <span className={`text-[1vw] text-[#1A1A1A] ${btn.className}`}>{btn.label}</span>
                                                </button>
                                            ))}
                                            {tab.id === 'case' && [
                                                { id: 'none', label: '—' },
                                                { id: 'sentence', label: 'Aa' },
                                                { id: 'upper', label: 'AB' },
                                                { id: 'lower', label: 'ab' }
                                            ].map((btn) => (
                                                <button
                                                    key={btn.id}
                                                    onClick={() => setNoteCase(prev => prev === btn.id ? 'none' : btn.id)}
                                                    className={`w-[2.5vw] h-[2.2vw] rounded-[0.6vw] flex items-center justify-center transition-all ${noteCase === btn.id ? 'bg-[#D1D5DB]' : 'bg-white'}`}
                                                >
                                                    <span className="text-[0.9vw] font-bold text-[#1A1A1A]">{btn.label}</span>
                                                </button>
                                            ))}
                                            {tab.id === 'list' && [
                                                { id: 'bullet', icon: 'lucide:list' },
                                                { id: 'bullet2', icon: 'lucide:list-todo' },
                                                { id: 'ordered', icon: 'lucide:list-ordered' }
                                            ].map((btn) => (
                                                <button
                                                    key={btn.id}
                                                    onClick={() => handleListClick(btn.id)}
                                                    className={`w-[2.5vw] h-[2.2vw] rounded-[0.6vw] flex items-center justify-center transition-all ${noteList === btn.id ? 'bg-[#D1D5DB]' : 'bg-white'}`}
                                                >
                                                    <Icon icon={btn.icon} className="w-[1.2vw] h-[1.2vw] text-[#1A1A1A]" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Background & Opacity Selection */}
                        <div className="flex items-center gap-[0.75vw]">
                            <div
                                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-400 shadow-sm cursor-pointer color-picker-trigger"
                                style={{ backgroundColor: noteTextColor }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.left - 180, y: rect.top - 50 });
                                    setPickerTarget('text');
                                    setShowColorPicker(true);
                                }}
                            />
                            <div className="flex-1 flex items-center border border-gray-400 rounded-[0.4vw] pl-[0.8vw] pr-[0.4vw] py-[0.3vw] bg-white">
                                <span className="text-[0.8vw] font-medium text-gray-700 uppercase flex-1">{noteTextColor}</span>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        value={noteTextOpacity}
                                        onChange={(e) => setNoteTextOpacity(e.target.value)}
                                        className="w-[2vw] text-right text-[0.8vw] font-medium text-gray-700 outline-none bg-transparent"
                                    />
                                    <span className="text-[0.8vw] text-gray-700 font-medium">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-[0.5vw] mt-auto w-full">
                            <button
                                onClick={resetNote}
                                className="flex-1 flex items-center justify-center gap-[0.4vw] py-[0.5vw] border border-gray-300 rounded-[0.5vw] hover:bg-gray-50 transition-all min-w-[5vw]"
                            >
                                <Icon icon="lucide:x" className="w-[1vw] h-[1vw] text-black" />
                                <span className="text-[0.8vw] font-medium text-black">Clear</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (!noteContent.trim()) return;
                                    onAddNote({
                                        content: noteContent,
                                        background: noteBackground,
                                        color: noteTextColor,
                                        fontFamily: noteFontFamily,
                                        fontSize: noteFontSize,
                                        styles: noteStyles,
                                        alignment: noteAlignment,
                                        case: noteCase,
                                        list: noteList,
                                        bgOpacity: noteBgOpacity,
                                        textOpacity: noteTextOpacity,
                                        pageLabel: `Page ${p1.toString().padStart(2, '0')}`,
                                        pageIndex: currentPageIndex
                                    });
                                    onClose();
                                }}
                                className="flex-[1.5] py-[0.5vw] bg-black text-white rounded-[0.5vw] text-[0.8vw] font-normal hover:bg-zinc-800 transition-all shadow-sm px-[0.8vw] whitespace-nowrap"
                            >
                                Add To Page - {p1}
                            </button>

                            {p2 && (
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: `Page ${p2.toString().padStart(2, '0')}`,
                                            pageIndex: currentPageIndex + 1
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.5] py-[0.5vw] bg-black text-white rounded-[0.5vw] text-[0.8vw] font-normal hover:bg-zinc-800 transition-all shadow-sm px-[0.8vw] whitespace-nowrap"
                                >
                                    Add To Page - {p2}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showColorPicker && (
                <ColorPallet
                    color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                    style={{ top: pickerPos.y, left: pickerPos.x }}
                    opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                    onOpacityChange={(val) => {
                        if (pickerTarget === 'text') setNoteTextOpacity(val);
                        else setNoteBgOpacity(val);
                    }}
                    onChange={(color) => {
                        if (pickerTarget === 'text') setNoteTextColor(color);
                        else setNoteBackground(color);
                    }}
                    onClose={() => setShowColorPicker(false)}
                />
            )}
        </div>
        );
};



const DesktopLayout3 = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
    setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, totalPages, isSpread, ColorPallet, Icon,
    getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha,
    isLightColor, targetPageIndex, setTargetPageIndex,
    activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen
}) => {
    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
            onClick={onClose}
        >
            <div
                className="w-[28vw] min-w-[460px] rounded-[0.8vw] shadow-[0_0.6vw_2.5vw_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100 p-[1vw] relative"
                style={{
                    backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
                    transform: isSidebarOpen ? 'translate(8vw, 0) scale(0.9)' : 'scale(1)',
                    transformOrigin: 'center center',
                    fontFamily: "'Poppins', sans-serif"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-[0.6vw] px-[0.2vw]">
                    <span className="text-[1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Add Notes</span>
                    <button onClick={onClose} className="hover:opacity-70 transition-opacity p-[0.2vw]">
                        <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }} />
                    </button>
                </div>

                <div className="flex gap-[0.8vw]">
                    {/* Left Column - Colors */}
                    <div className="flex flex-col gap-[0.4vw]">
                        {[
                            '#34B1AA', // Teal
                            '#C68899', // Dusty Rose
                            '#D6566E', // Pink
                            '#6A7DBB', // Blue
                            '#68AC77', // Green
                            '#D9DC54', // Yellow
                            '#23D295'  // Mint
                        ].map((color, i) => (
                            <div
                                key={i}
                                onClick={() => setNoteBackground(color)}
                                className={`w-[1.5vw] h-[1.5vw] rounded-[0.3vw] cursor-pointer hover:scale-110 transition-transform ${noteBackground === color ? 'ring-2 ring-offset-1 ring-gray-300' : 'shadow-sm'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className="w-[1.5vw] h-[1.5vw] rounded-full cursor-pointer hover:scale-110 transition-transform flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] shadow-sm"
                        >
                            <Icon icon="lucide:pipette" className="w-[0.8vw] h-[0.8vw] text-white/60" />
                        </div>
                    </div>

                    {/* Middle Column - Sticky Note */}
                    <div
                        className="flex-1 aspect-square rounded-[0.6vw] p-[1vw] shadow-[0_4px_10px_rgba(0,0,0,0.05)] flex flex-col transition-colors duration-300 relative border border-black/5"
                        style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100 }}
                    >
                         <div
                            className="absolute top-[0.6vw] right-[0.6vw] z-20 flex items-center gap-[0.3vw] cursor-pointer hover:bg-black/5 rounded-[0.3vw] px-[0.3vw] py-[0.1vw] transition-colors"
                            onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                        >
                            <span className={`text-[0.65vw] font-medium ${isLightColor(noteBackground) ? 'text-black/40' : 'text-white/80'}`}>
                                {pageDisplay}
                            </span>
                            <Icon icon="lucide:pencil" className={`w-[0.8vw] h-[0.8vw] ${isLightColor(noteBackground) ? 'text-black/40' : 'text-white/80'}`} />

                            {isPageDropdownOpen && (
                                <div className="absolute top-full right-0 mt-[0.2vw] w-[8vw] max-h-[10vw] bg-white rounded-[0.5vw] shadow-2xl overflow-y-auto custom-scrollbar z-[100] border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                    {Array.from({ length: totalPages || 1 }, (_, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setTargetPageIndex(i);
                                                setIsPageDropdownOpen(false);
                                            }}
                                            className={`px-[0.7vw] py-[0.4vw] text-[0.7vw] cursor-pointer transition-colors ${targetPageIndex === i ? 'font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                            style={targetPageIndex === i ? { backgroundColor: getLayoutColor('dropdown-bg', '#3E4491'), color: '#FFFFFF' } : {}}
                                        >
                                            Page {i + 1}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your Notes"
                            style={{
                                textAlign: noteAlignment,
                                fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                textDecoration: `${noteStyles.includes('underline') ? 'underline' : ''} ${noteStyles.includes('strike') ? 'line-through' : ''}`,
                                textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                fontFamily: noteFontFamily,
                                fontSize: `${noteFontSize}px`,
                                color: noteTextColor,
                                opacity: noteTextOpacity / 100,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                width: '100%',
                                height: '100%'
                            }}
                            className={`flex-1 pt-[1.2vw] font-medium custom-scrollbar placeholder:${isLightColor(noteBackground) ? 'text-black/20' : 'text-white/30'}`}
                        />
                    </div>

                    {/* Right Column - Controls */}
                    <div className="w-[11vw] flex flex-col gap-[0.6vw]">
                        <h2 className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Text Property :</h2>

                        {/* Font Selection */}
                        <div className="relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); setActiveFormattingTab(null); }}
                                className="w-full h-[2.1vw] flex items-center justify-between border-[1px] rounded-[0.5vw] px-[0.6vw] cursor-pointer bg-white transition-all"
                                style={{ 
                                    borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2),
                                    backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') 
                                }}
                            >
                                <span className="text-[0.75vw] font-medium truncate" style={{ fontFamily: noteFontFamily, color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.8) }}>{noteFontFamily}</span>
                                <Icon icon="lucide:chevron-down" className={`w-[1vw] h-[1vw] transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.5) }} />
                            </div>
                            {isFontMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-[0.2vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-[10vw] overflow-y-auto custom-scrollbar py-[0.3vw]">
                                        {fonts.map((f) => (
                                            <div key={f} onClick={() => { setNoteFontFamily(f); setIsFontMenuOpen(false); }} className={`px-[0.8vw] py-[0.5vw] text-[0.75vw] cursor-pointer transition-colors ${noteFontFamily === f ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>{f}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Weight and Size Row */}
                        <div className="flex gap-[0.4vw]">
                            <div className="flex-[1.5] relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsFontMenuOpen(false); setIsSizeMenuOpen(false); setActiveFormattingTab(null); }}
                                    className="w-full h-[2.1vw] flex items-center justify-between border-[1px] rounded-[0.5vw] px-[0.6vw] cursor-pointer bg-white transition-all"
                                    style={{ 
                                        borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2),
                                        backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') 
                                    }}
                                >
                                    <span className="text-[0.75vw] font-medium truncate" style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.8) }}>{noteWeight}</span>
                                    <Icon icon="lucide:chevron-down" className={`w-[0.9vw] h-[0.9vw] transition-transform ${isWeightMenuOpen ? 'rotate-180' : ''}`} style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.5) }} />
                                </div>
                                {isWeightMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-[0.2vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="py-[0.3vw]">
                                            {weights.map((w) => (
                                                <div key={w} onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }} className={`px-[0.8vw] py-[0.5vw] text-[0.75vw] cursor-pointer transition-colors ${noteWeight === w ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>{w}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="w-[4.2vw] relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); setActiveFormattingTab(null); }}
                                    className="w-full h-[2.1vw] flex items-center justify-between border-[1px] rounded-[0.5vw] px-[0.5vw] cursor-pointer bg-white transition-all"
                                    style={{ 
                                        borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2),
                                        backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') 
                                    }}
                                >
                                    <span className="text-[0.75vw] font-medium" style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.8) }}>{noteFontSize}</span>
                                    <Icon icon="lucide:chevron-down" className={`w-[0.9vw] h-[0.9vw] transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.5) }} />
                                </div>
                                {isSizeMenuOpen && (
                                    <div className="absolute top-full right-0 w-full mt-[0.2vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-[10vw] overflow-y-auto custom-scrollbar py-[0.3vw]">
                                            {sizes.map((s) => (
                                                <div key={s} onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }} className={`px-[0.8vw] py-[0.5vw] text-[0.75vw] text-center cursor-pointer transition-colors ${noteFontSize === s ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>{s}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Formatting Buttons Row */}
                        <div className="flex gap-[0.4vw] h-[2.1vw] justify-end">
                            {[
                                { id: 'align', icon: `lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment}`, action: () => setActiveFormattingTab(prev => prev === 'align' ? null : 'align') },
                                { id: 'bold', label: 'B', active: noteStyles.includes('bold') || noteWeight === 'Bold', action: () => toggleNoteStyle('bold') },
                                { id: 'case', label: noteCase === 'none' ? '—' : noteCase === 'sentence' ? 'Aa' : noteCase === 'upper' ? 'AB' : 'ab', action: () => setActiveFormattingTab(prev => prev === 'case' ? null : 'case') },
                                { id: 'list', icon: 'lucide:list', active: noteList !== 'none', action: () => setActiveFormattingTab(prev => prev === 'list' ? null : 'list') }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                    className={`w-[2.2vw] h-full border-[1px] rounded-[0.5vw] flex items-center justify-center transition-all ${btn.active || activeFormattingTab === btn.id ? 'opacity-100 shadow-inner' : 'opacity-70 hover:opacity-100'}`}
                                    style={{ 
                                        borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2),
                                        backgroundColor: btn.active || activeFormattingTab === btn.id ? getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.1) : 'transparent'
                                    }}
                                >
                                    {btn.icon ? <Icon icon={btn.icon} className="w-[1vw] h-[1vw]" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }} /> : <span className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>{btn.label}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Floating Submenus for Align/Case/List */}
                        <AnimatePresence>
                            {activeFormattingTab && (activeFormattingTab === 'align' || activeFormattingTab === 'case' || activeFormattingTab === 'list') && (
                                <div className="relative h-0" onClick={(e) => e.stopPropagation()}>
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute bottom-[0.4vw] right-0 rounded-[0.4vw] p-[0.3vw] flex gap-[0.2vw] z-[60] shadow-2xl"
                                        style={{ backgroundColor: getLayoutColor('dropdown-text', '#333333') }}
                                    >
                                        {activeFormattingTab === 'align' && ['left', 'center', 'right', 'justify'].map(align => (
                                            <button key={align} onClick={() => setNoteAlignment(align)} className={`w-[1.8vw] h-[1.8vw] rounded-[0.3vw] flex items-center justify-center transition-all ${noteAlignment === align ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                                                <Icon icon={`lucide:align-${align}`} className="w-[1vw] h-[1vw]" />
                                            </button>
                                        ))}
                                        {activeFormattingTab === 'case' && ['none', 'sentence', 'upper', 'lower'].map(c => (
                                            <button key={c} onClick={() => setNoteCase(c)} className={`w-[1.8vw] h-[1.8vw] rounded-[0.3vw] flex items-center justify-center transition-all ${noteCase === c ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                                                <span className="text-[0.75vw] font-bold">{c === 'none' ? '—' : c === 'sentence' ? 'Aa' : c === 'upper' ? 'AB' : 'ab'}</span>
                                            </button>
                                        ))}
                                        {activeFormattingTab === 'list' && ['bullet', 'ordered'].map(list => (
                                            <button key={list} onClick={() => handleListClick(list)} className={`w-[1.8vw] h-[1.8vw] rounded-[0.3vw] flex items-center justify-center transition-all ${noteList === list ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                                                <Icon icon={list === 'bullet' ? 'lucide:list' : 'lucide:list-ordered'} className="w-[1vw] h-[1vw]" />
                                            </button>
                                        ))}
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Color Selection Row */}
                        <div className="flex items-center gap-[0.4vw] mt-[0.1vw]">
                            <div
                                className="w-[2.2vw] h-[2.2vw] rounded-[0.5vw] border-[1px] cursor-pointer shadow-sm flex-shrink-0 transition-transform active:scale-95"
                                style={{ backgroundColor: noteTextColor, borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2) }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.left - 200, y: rect.top - 100 });
                                    setPickerTarget('text');
                                    setShowColorPicker(true);
                                }}
                            />
                            <div className="flex-1 h-[2.2vw] flex items-center border-[1px] rounded-[0.5vw] px-[0.6vw]" style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'), borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2) }}>
                                <span className="text-[0.75vw] font-medium flex-1" style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.6) }}>{noteTextColor.toUpperCase()}</span>
                                <div className="flex items-center gap-[0.1vw] text-[0.75vw] font-medium" style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.6) }}>
                                    <input
                                        type="text"
                                        value={noteTextOpacity}
                                        onChange={(e) => setNoteTextOpacity(e.target.value)}
                                        className="w-[1.8vw] text-right bg-transparent outline-none"
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="mt-auto pt-[0.6vw] flex gap-[0.5vw]">
                            <button
                                onClick={resetNote}
                                className="flex-1 h-[2.3vw] border-[1.5px] rounded-[0.6vw] flex items-center justify-center gap-[0.3vw] transition-all hover:bg-gray-50 active:scale-95"
                                style={{ 
                                    borderColor: getLayoutColor('dropdown-text', '#3E4491'),
                                    color: getLayoutColor('dropdown-text', '#3E4491')
                                }}
                            >
                                <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                                <span className="text-[0.8vw] font-bold">Clear</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (!noteContent.trim()) return;
                                    onAddNote({
                                        content: noteContent, background: noteBackground, color: noteTextColor,
                                        fontFamily: noteFontFamily, fontSize: noteFontSize, styles: noteStyles,
                                        alignment: noteAlignment, case: noteCase, list: noteList,
                                        bgOpacity: noteBgOpacity, textOpacity: noteTextOpacity,
                                        pageLabel: pageDisplay,
                                        pageIndex: targetPageIndex
                                    });
                                    onClose();
                                }}
                                className="flex-[1.6] h-[2.3vw] rounded-[0.6vw] font-bold text-[0.8vw] shadow-xl transition-all hover:opacity-90 active:scale-95"
                                style={{ 
                                    backgroundColor: getLayoutColor('dropdown-text', '#3E4491'),
                                    color: getLayoutColor('dropdown-bg', '#FFFFFF')
                                }}
                            >
                                Add To Notes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Color Picker Overlay */}
                {showColorPicker && (
                    <div 
                        className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto bg-black/10"
                        onClick={() => setShowColorPicker(false)}
                    >
                        <div onClick={e => e.stopPropagation()} className="animate-in zoom-in-95 duration-200 scale-[0.8] origin-center">
                            <div className="w-[14vw]">
                                <ColorPallet
                                    inline={true}
                                    smallMode={true}
                                    color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                                    opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                                    onOpacityChange={val => pickerTarget === 'text' ? setNoteTextOpacity(val) : setNoteBgOpacity(val)}
                                    onChange={color => pickerTarget === 'text' ? setNoteTextColor(color) : setNoteBackground(color)}
                                    onClose={() => setShowColorPicker(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
const DesktopLayout4 = DesktopDefaultLayout;

const DesktopLayout6 = ({
    onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
    noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
    noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
    noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
    noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
    pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
    weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
    setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
    setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
    setIsSizeMenuOpen, isSizeMenuOpen, totalPages, isSpread, ColorPallet, currentPageIndex, Icon,
    targetPageIndex, setTargetPageIndex, activeFormattingTab, setActiveFormattingTab,
    isPageDropdownOpen, setIsPageDropdownOpen,
    getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha, isLightColor, activeLayout
}) => {
    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent px-[2vw]"
            onClick={onClose}
        >
            <div
                className="w-[520px] rounded-none shadow-[0px_4px_25px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-200 select-none overflow-hidden"
                style={{
                    transform: isSidebarOpen ? 'translate(8vw, 0) scale(0.9)' : 'scale(1)',
                    transformOrigin: 'center center',
                    border: '1px solid #EBEBEB',
                    backgroundColor: '#FFFFFF'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-full p-0" style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-1">
                        <h1 className="text-[18px] font-bold m-0" style={{ color: getLayoutColor('dropdown-text', '#3A3F74') }}>Add Notes</h1>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center hover:opacity-50 transition-all active:scale-95"
                        >
                            <Icon icon="lucide:x" className="w-[18px] h-[18px]" style={{ color: getLayoutColor('dropdown-text', '#3A3F74') }} />
                        </button>
                    </div>

                    {/* Divider Line under Add Notes as matching screenshot */}
                    <div className="w-full h-[1.5px]" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '58, 63, 116', 0.15) }} />

                    {/* Content Body */}
                    <div className="flex gap-5 px-5 pt-3 pb-3 items-start">
                        {/* Left Column - Colors */}
                        <div className="flex flex-col gap-[8px]">
                            {['#31B0B0', '#C68798', '#D6566E', '#6B7DBB', '#67AC78', '#D8DC53', '#23D295'].map((color, i) => (
                                <button
                                    key={i}
                                    onClick={() => setNoteBackground(color)}
                                    className={`w-[28px] h-[28px] rounded-none block transition-all hover:scale-110 border-2 border-white shadow-sm`}
                                    style={{
                                        backgroundColor: color,
                                        boxShadow: noteBackground === color ? `0 0 0 2px white, 0 0 0 4px ${getLayoutColorAlpha('dropdown-text', '58, 63, 116', 0.3)}` : 'none'
                                    }}
                                />
                            ))}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 12, y: rect.top - 80 });
                                    setPickerTarget('background');
                                    setShowColorPicker(prev => pickerTarget === 'background' ? !prev : true);
                                }}
                                className="w-[28px] h-[28px] rounded-none block shadow-sm transition-all hover:scale-110 flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] border-2 border-white"
                            >
                                <Icon icon="lucide:pipette" className="w-[14px] h-[14px] text-white/80" />
                            </button>
                        </div>

                        {/* Middle Column - Note Area */}
                        <div
                            className="relative w-[230px] h-[226px] rounded-none p-4 flex flex-col transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border"
                            style={{ backgroundColor: noteBackground, opacity: noteBgOpacity / 100, borderColor: getLayoutColorAlpha('dropdown-text', '58, 63, 116', 0.1) }}
                        >
                            <div className="flex justify-end items-center mb-3">
                                <div
                                    className="relative flex items-center gap-1.5 cursor-pointer hover:bg-black/5 rounded-none px-2 py-1 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setIsPageDropdownOpen(!isPageDropdownOpen); }}
                                >
                                    <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: isLightColor(noteBackground) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' }}>{pageDisplay}</span>
                                    <Pencil className="w-[11px] h-[11px]" style={{ color: isLightColor(noteBackground) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' }} />

                                    {isPageDropdownOpen && (
                                        <div
                                            className="absolute top-full right-0 mt-2 w-[100px] max-h-[160px] bg-white rounded-none shadow-xl overflow-y-auto custom-scrollbar z-[100] border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {Array.from({ length: totalPages || 1 }, (_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setTargetPageIndex(i);
                                                        setIsPageDropdownOpen(false);
                                                    }}
                                                    className={`px-4 py-2 text-[11px] cursor-pointer transition-colors ${targetPageIndex === i ? 'font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                    style={targetPageIndex === i ? { backgroundColor: getLayoutColor('dropdown-text', '#3A3F74'), color: getLayoutColor('dropdown-bg', '#FFFFFF') } : {}}
                                                >
                                                    Page {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter your Notes"
                                style={{
                                    textAlign: noteAlignment,
                                    fontWeight: noteStyles.includes('bold') ? 'bold' : getFontWeight(noteWeight),
                                    fontStyle: noteStyles.includes('italic') ? 'italic' : 'normal',
                                    textDecoration: [
                                        noteStyles.includes('underline') ? 'underline' : '',
                                        noteStyles.includes('strike') ? 'line-through' : ''
                                    ].filter(Boolean).join(' ') || 'none',
                                    textTransform: noteCase === 'upper' ? 'uppercase' : noteCase === 'lower' ? 'lowercase' : noteCase === 'sentence' ? 'capitalize' : 'none',
                                    fontFamily: noteFontFamily,
                                    fontSize: `${noteFontSize}px`,
                                    color: noteTextColor,
                                    opacity: noteTextOpacity / 100,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    width: '100%',
                                    height: '100%'
                                }}
                                className="flex-1 placeholder:opacity-40 font-semibold overflow-y-auto custom-scrollbar text-[16px]"
                            />
                        </div>

                        {/* Right Column - Properties */}
                        <div className="flex-1 flex flex-col gap-[8px] min-w-[170px]" onClick={() => setActiveFormattingTab(null)}>
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#3A3F74') }}>Text Property :</span>
                            </div>

                            {/* Font Family Selection */}
                            <div className="relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsFontMenuOpen(!isFontMenuOpen); setIsWeightMenuOpen(false); setIsSizeMenuOpen(false); }}
                                    className="w-full h-[34px] rounded-none px-3 flex items-center justify-between border cursor-pointer transition-all"
                                    style={{
                                        borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                        backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1)
                                    }}
                                >
                                    <span className="text-[12px] font-medium truncate" style={{ fontFamily: noteFontFamily, color: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                        {noteFontFamily}
                                    </span>
                                    <Icon icon="lucide:chevron-down" className={`w-4 h-4 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                                </div>

                                {isFontMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 border border-gray-200 rounded-none shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                        <div className="max-h-[160px] overflow-y-auto custom-scrollbar py-2">
                                            {fonts.map((font) => (
                                                <div
                                                    key={font}
                                                    onClick={() => { setNoteFontFamily(font); setIsFontMenuOpen(false); }}
                                                    className={`px-4 py-2 text-[12px] cursor-pointer transition-colors ${noteFontFamily === font ? 'font-semibold' : 'hover:bg-gray-50'}`}
                                                    style={{ ... (noteFontFamily === font ? { backgroundColor: '#f4f5f8', color: getLayoutColor('dropdown-bg', '#3A3F74') } : { color: '#374151' }), fontFamily: font }}
                                                >
                                                    {font}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Weight and Size Selection */}
                            <div className="flex gap-2">
                                <div className="flex-[1.5] relative">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsWeightMenuOpen(!isWeightMenuOpen); setIsSizeMenuOpen(false); setIsFontMenuOpen(false); }}
                                        className="w-full h-[34px] rounded-none px-3 flex items-center justify-between border cursor-pointer transition-all"
                                        style={{
                                            borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                            backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1)
                                        }}
                                    >
                                        <span className="text-[12px] font-medium truncate" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{noteWeight}</span>
                                        <Icon icon="lucide:chevron-down" className={`w-4 h-4 transition-transform ${isWeightMenuOpen ? 'rotate-180' : ''}`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                                    </div>
                                    {isWeightMenuOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 border border-gray-200 rounded-none shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                            <div className="py-2">
                                                {weights.map((w) => (
                                                    <div
                                                        key={w}
                                                        onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }}
                                                        className={`px-4 py-2 text-[12px] cursor-pointer transition-colors ${noteWeight === w ? 'font-semibold' : 'hover:bg-gray-50'}`}
                                                        style={noteWeight === w ? { backgroundColor: '#f4f5f8', color: getLayoutColor('dropdown-bg', '#3A3F74') } : { color: '#374151' }}
                                                    >
                                                        {w}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setActiveFormattingTab(null); setIsSizeMenuOpen(!isSizeMenuOpen); setIsWeightMenuOpen(false); setIsFontMenuOpen(false); }}
                                        className="w-full h-[34px] rounded-none flex items-center justify-between border px-2 cursor-pointer transition-all"
                                        style={{
                                            borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                            backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1)
                                        }}
                                    >
                                        <span className="text-[12px] font-medium" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{noteFontSize}</span>
                                        <Icon icon="lucide:chevron-down" className="w-4 h-4" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.6 }} />
                                    </div>
                                    {isSizeMenuOpen && (
                                        <div className="absolute top-full right-0 w-full mt-1 border border-gray-200 rounded-none shadow-xl z-50 overflow-hidden text-center animate-in fade-in slide-in-from-top-2 duration-200" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                            <div className="max-h-[160px] overflow-y-auto custom-scrollbar py-2">
                                                {sizes.map((s) => (
                                                    <div
                                                        key={s}
                                                        onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }}
                                                        className={`px-3 py-1.5 text-[12px] cursor-pointer transition-colors ${noteFontSize === s ? 'font-semibold' : 'hover:bg-gray-50'}`}
                                                        style={noteFontSize === s ? { backgroundColor: '#f4f5f8', color: getLayoutColor('dropdown-bg', '#3A3F74') } : { color: '#374151' }}
                                                    >
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Formatting Options Panel */}
                            <AnimatePresence mode="wait">
                                {activeFormattingTab && (
                                    <motion.div
                                        key={activeFormattingTab}
                                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                        className="flex justify-end mb-1"
                                    >
                                        <div className="rounded-none border p-1 flex gap-1 shadow-xl" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.3) }} onClick={(e) => e.stopPropagation()}>
                                            {activeFormattingTab === 'align' && (
                                                <>
                                                    {[
                                                        { id: 'left', icon: 'lucide:align-left' },
                                                        { id: 'center', icon: 'lucide:align-center' },
                                                        { id: 'right', icon: 'lucide:align-right' },
                                                        { id: 'justify', icon: 'lucide:align-justify' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setNoteAlignment(opt.id)}
                                                            className={`w-[30px] h-[30px] rounded-none flex items-center justify-center transition-all`}
                                                            style={noteAlignment === opt.id ? {
                                                                backgroundColor: getLayoutColorAlpha('dropdown-bg', '58, 63, 116', 0.1),
                                                                color: getLayoutColor('dropdown-bg', '#3A3F74'),
                                                                border: `1px solid ${getLayoutColorAlpha('dropdown-bg', '58, 63, 116', 0.5)}`
                                                            } : { color: getLayoutColorAlpha('dropdown-bg', '0, 0, 0', 0.5) }}
                                                        >
                                                            <Icon icon={opt.icon} className="w-[15px] h-[15px]" />
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {activeFormattingTab === 'style' && (
                                                <>
                                                    {[
                                                        { id: 'bold', label: 'B' },
                                                        { id: 'italic', label: 'I' },
                                                        { id: 'underline', label: 'U' },
                                                        { id: 'strike', label: 'S' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => toggleNoteStyle(opt.id)}
                                                            className={`w-[30px] h-[30px] rounded-none flex items-center justify-center transition-all`}
                                                            style={noteStyles.includes(opt.id) ? {
                                                                backgroundColor: getLayoutColorAlpha('dropdown-bg', '58, 63, 116', 0.1),
                                                                color: getLayoutColor('dropdown-bg', '#3A3F74'),
                                                                border: `1px solid ${getLayoutColorAlpha('dropdown-bg', '58, 63, 116', 0.5)}`
                                                            } : { color: getLayoutColorAlpha('dropdown-bg', '0, 0, 0', 0.5) }}
                                                        >
                                                            <span className={`text-[13px] font-bold ${opt.id === 'italic' ? 'italic' : opt.id === 'underline' ? 'underline' : opt.id === 'strike' ? 'line-through' : ''}`}>{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {activeFormattingTab === 'case' && (
                                                <>
                                                    {[
                                                        { id: 'none', label: '—' },
                                                        { id: 'sentence', label: 'Aa' },
                                                        { id: 'upper', label: 'AB' },
                                                        { id: 'lower', label: 'ab' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setNoteCase(opt.id)}
                                                            className={`w-[30px] h-[30px] rounded-none flex items-center justify-center transition-all`}
                                                            style={noteCase === opt.id ? {
                                                                backgroundColor: getLayoutColorAlpha('dropdown-bg', '58, 63, 116', 0.1),
                                                                color: getLayoutColor('dropdown-bg', '#3A3F74'),
                                                                border: `1px solid ${getLayoutColorAlpha('dropdown-bg', '58, 63, 116', 0.5)}`
                                                            } : { color: getLayoutColorAlpha('dropdown-bg', '0, 0, 0', 0.5) }}
                                                        >
                                                            <span className="text-[12px] font-bold">{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {activeFormattingTab === 'list' && (
                                                <>
                                                    {[
                                                        { id: 'bullet', icon: 'lucide:list' },
                                                        { id: 'bullet2', icon: 'material-symbols:list' },
                                                        { id: 'ordered', icon: 'lucide:list-ordered' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleListClick(opt.id)}
                                                            className={`w-[30px] h-[30px] rounded-none flex items-center justify-center transition-all`}
                                                            style={noteList === opt.id ? {
                                                                backgroundColor: getLayoutColorAlpha('dropdown-bg', '58, 63, 116', 0.1),
                                                                color: getLayoutColor('dropdown-bg', '#3A3F74'),
                                                                border: `1px solid ${getLayoutColorAlpha('dropdown-bg', '58, 63, 116', 0.5)}`
                                                            } : { color: getLayoutColorAlpha('dropdown-bg', '0, 0, 0', 0.5) }}
                                                        >
                                                            <Icon icon={opt.icon} className="w-[15px] h-[15px]" />
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Formatting Tab Buttons */}
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                {[
                                    { id: 'align', icon: `lucide:align-${noteAlignment === 'justify' ? 'justify' : noteAlignment}`, action: () => setActiveFormattingTab(prev => prev === 'align' ? null : 'align') },
                                    { id: 'style', label: 'B', action: () => setActiveFormattingTab(prev => prev === 'style' ? null : 'style') },
                                    { id: 'case', label: noteCase === 'none' ? '—' : noteCase === 'sentence' ? 'Aa' : noteCase === 'upper' ? 'AB' : 'ab', action: () => setActiveFormattingTab(prev => prev === 'case' ? null : 'case') },
                                    { id: 'list', icon: noteList === 'ordered' ? 'lucide:list-ordered' : 'lucide:list', action: () => setActiveFormattingTab(prev => prev === 'list' ? null : 'list') }
                                ].map((btn) => {
                                    const isActive = activeFormattingTab === btn.id;
                                    return (
                                        <button
                                            key={btn.id}
                                            onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                            className={`w-[34px] h-[34px] rounded-none border flex items-center justify-center transition-all bg-white hover:bg-gray-50 active:scale-95`}
                                            style={{
                                                borderColor: isActive ? 'transparent' : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                                backgroundColor: isActive ? getLayoutColor('dropdown-text', '#FFFFFF') : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1)
                                            }}
                                        >
                                            {btn.icon
                                                ? <Icon icon={btn.icon} className="w-[16px] h-[16px]" style={{ color: isActive ? getLayoutColor('dropdown-bg', '#3A3F74') : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.6) }} />
                                                : <span className="text-[14px] font-bold" style={{ color: isActive ? getLayoutColor('dropdown-bg', '#3A3F74') : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.6) }}>{btn.label}</span>
                                            }
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Color Selection row */}
                            <div className="flex items-center gap-2 mt-2">
                                <div
                                    className="w-[32px] h-[32px] rounded-none border flex items-center justify-center cursor-pointer p-[1px] shadow-sm"
                                    style={{
                                        borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                        backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1)
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.left - 200, y: rect.top - 50 });
                                        setPickerTarget('text');
                                        setShowColorPicker(prev => pickerTarget === 'text' ? !prev : true);
                                    }}
                                >
                                    <div className="w-full h-full rounded-none" style={{ backgroundColor: noteTextColor }}></div>
                                </div>
                                <div className="flex-1 flex items-center justify-between h-[32px] rounded-none border px-3 transition-all" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1), borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.3) }}>
                                    <span className="text-[11px] font-bold uppercase" style={{ color: getLayoutColor('dropdown-text', '#3A3F74') }}>{noteTextColor}</span>
                                    <div className="flex items-center gap-1" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.7 }}>
                                        <input
                                            type="text"
                                            value={noteTextOpacity}
                                            onChange={(e) => setNoteTextOpacity(e.target.value)}
                                            className="w-[28px] text-[11px] text-right font-bold bg-transparent outline-none"
                                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                        />
                                        <span className="text-[10px] font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-auto pt-1 flex items-center gap-3">
                                <button
                                    onClick={resetNote}
                                    className="flex-1 flex items-center justify-center gap-1.5 h-[34px] rounded-none text-[12px] border transition-all font-bold hover:bg-white/10"
                                    style={{
                                        borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.3),
                                        color: getLayoutColor('dropdown-text', '#FFFFFF')
                                    }}
                                >
                                    <Icon icon="lucide:x" className="w-[14px] h-[14px]" />
                                    Clear
                                </button>

                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        onAddNote({
                                            content: noteContent,
                                            background: noteBackground,
                                            color: noteTextColor,
                                            fontFamily: noteFontFamily,
                                            fontSize: noteFontSize,
                                            styles: noteStyles,
                                            alignment: noteAlignment,
                                            case: noteCase,
                                            list: noteList,
                                            bgOpacity: noteBgOpacity,
                                            textOpacity: noteTextOpacity,
                                            pageLabel: `Page ${p1.toString().padStart(2, '0')}`,
                                            pageIndex: currentPageIndex
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.4] h-[34px] rounded-none text-[12px] font-bold transition-all shadow-md hover:opacity-90"
                                    style={{
                                        backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'),
                                        color: getLayoutColor('dropdown-bg', '#3A3F74')
                                    }}
                                >
                                    Add To Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Color Picker */}
                {showColorPicker && (
                    <div
                        className="absolute top-[80px] right-[25px] z-[999] animate-in fade-in zoom-in-95 duration-200 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ColorPallet
                            inline={true}
                            smallMode={true}
                            color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                            opacity={pickerTarget === 'text' ? noteTextOpacity : noteBgOpacity}
                            onOpacityChange={(val) => {
                                if (pickerTarget === 'text') setNoteTextOpacity(val);
                                else setNoteBgOpacity(val);
                            }}
                            onChange={(color) => {
                                if (pickerTarget === 'text') setNoteTextColor(color);
                                else setNoteBackground(color);
                            }}
                            onClose={() => setShowColorPicker(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};


const AddNotesPopup = ({ onClose, currentPageIndex, totalPages, onAddNote, isSidebarOpen, isSpread, isMobile, activeLayout, isLandscape, layoutColors, isMobileLandscape }) => {

    const hexToRgba = (hex, opacity = 100) => {
        if (!hex || !hex.startsWith('#')) return hex;
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = Math.max(0, Math.min(1, opacity / 100));
        return a >= 1 ? hex : `rgba(${r},${g},${b},${a})`;
    };

    const getLayoutColor = (id, defaultColor) => {
        if (layoutColors && Array.isArray(layoutColors)) {
            const c = layoutColors.find(x => x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity ?? 100);
        }
        return `var(--${id}, ${defaultColor})`;
    };

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

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
        return luminance > 0.5;
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

    // Notes Formatting States
    const [noteContent, setNoteContent] = useState('');
    const [noteAlignment, setNoteAlignment] = useState('left');
    const [noteStyles, setNoteStyles] = useState([]);
    const [noteCase, setNoteCase] = useState('sentence');
    const [noteList, setNoteList] = useState('none');
    const [activeFormattingTab, setActiveFormattingTab] = useState(null);
    const [noteBackground, setNoteBackground] = useState('#D9DC54');
    const [noteTextColor, setNoteTextColor] = useState('#ffffff');
    const [noteFontFamily, setNoteFontFamily] = useState('Poppins');
    const [noteFontSize, setNoteFontSize] = useState('18');
    const [noteTextOpacity, setNoteTextOpacity] = useState(100);
    const [noteBgOpacity, setNoteBgOpacity] = useState(100);

    const [targetPageIndex, setTargetPageIndex] = useState(currentPageIndex || 0);
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);

    // Keep it synced if the page changes while popup is unexpectedly open
    useEffect(() => {
        setTargetPageIndex(currentPageIndex || 0);
    }, [currentPageIndex]);

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState('text'); // 'text' or 'background'
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

    const [noteWeight, setNoteWeight] = useState('Regular');
    const [isWeightMenuOpen, setIsWeightMenuOpen] = useState(false);
    const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false);
    const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);

    const weights = ["Thin", "Light", "Regular", "Semi Bold", "Bold"];
    const sizes = ["12", "14", "16", "18", "20", "24", "32", "48", "64", "72", "96"];
    const fonts = [
        "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana",
        "Helvetica", "Poppins", "Roboto", "Open Sans", "Lato",
        "Montserrat", "Inter", "Playfair Display", "Oswald", "Merriweather"
    ];

    const toggleNoteStyle = (style) => {
        setNoteStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]);
    };

    const applyListFormat = (type, currentContent) => {
        if (type === 'none') return currentContent;
        const lines = currentContent.split('\n');
        return lines.map((line, index) => {
            const cleanLine = line.replace(/^[•○\d+.]\s*|^\[\s*\]\s*/, '');
            if (type === 'bullet') return `• ${cleanLine}`;
            if (type === 'bullet2') return `○ ${cleanLine}`;
            if (type === 'ordered') return `${index + 1}. ${cleanLine}`;
            return cleanLine;
        }).join('\n');
    };

    const handleListClick = (type) => {
        const newListType = noteList === type ? 'none' : type;
        setNoteList(newListType);
        if (newListType !== 'none') {
            setNoteContent(prev => applyListFormat(newListType, prev));
        } else {
            setNoteContent(prev => prev.split('\n').map(l => l.replace(/^[•○\d+.]\s*|^\[\s*\]\s*/, '')).join('\n'));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && noteList !== 'none') {
            e.preventDefault();
            const { selectionStart, selectionEnd, value } = e.target;
            const lines = value.substr(0, selectionStart).split('\n');
            const currentLineIndex = lines.length - 1;
            let nextPrefix = '';

            if (noteList === 'bullet') nextPrefix = '\n• ';
            else if (noteList === 'bullet2') nextPrefix = '\n○ ';
            else if (noteList === 'ordered') nextPrefix = `\n${currentLineIndex + 2}. `;

            const newValue = value.substring(0, selectionStart) + nextPrefix + value.substring(selectionEnd);
            setNoteContent(newValue);

            // Set cursor position after the prefix
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = selectionStart + nextPrefix.length;
            }, 0);
        }
    };

    const resetNote = () => {
        setNoteContent('');
        setNoteAlignment('left');
        setNoteStyles([]);
        setNoteWeight('Regular');
        setNoteCase('sentence');
        setNoteList('none');
        setNoteBackground('#D9DC54');
        setNoteTextColor('#ffffff');
        setNoteFontFamily('Poppins');
        setNoteFontSize('18');
        setNoteBgOpacity(100);
        setNoteTextOpacity(100);
        setActiveFormattingTab(null);
    };

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            setIsFontMenuOpen(false);
            setIsWeightMenuOpen(false);
            setIsSizeMenuOpen(false);
            setIsPageDropdownOpen(false);
        };
        if (isFontMenuOpen || isWeightMenuOpen || isSizeMenuOpen || isPageDropdownOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isFontMenuOpen, isWeightMenuOpen, isSizeMenuOpen]);

    const getFontWeight = (weight) => {
        switch (weight) {
            case 'Thin': return 100;
            case 'Light': return 300;
            case 'Regular': return 400;
            case 'Semi Bold': return 600;
            case 'Bold': return 700;
            default: return 400;
        }
    };

    const p1 = (targetPageIndex !== undefined ? targetPageIndex : (currentPageIndex || 0)) + 1;
    const p2 = (isSpread && p1 + 1 <= (totalPages || 0)) ? p1 + 1 : null;
    const pageDisplay = p2 ? `Page ${p1.toString().padStart(2, '0')} - ${p2.toString().padStart(2, '0')}` : `Page ${p1.toString().padStart(2, '0')}`;


    const commonProps = {
        onClose, noteContent, setNoteContent, noteAlignment, setNoteAlignment,
        noteStyles, toggleNoteStyle, noteCase, setNoteCase, noteList, handleListClick,
        noteBackground, setNoteBackground, noteTextColor, setNoteTextColor,
        noteFontFamily, setNoteFontFamily, noteFontSize, setNoteFontSize,
        noteTextOpacity, setNoteTextOpacity, noteBgOpacity, setNoteBgOpacity,
        pageDisplay, handleKeyDown, resetNote, onAddNote, getFontWeight,
        weights, sizes, fonts, p1, p2, isSidebarOpen, setShowColorPicker, showColorPicker,
        setPickerTarget, pickerTarget, setPickerPos, pickerPos, noteWeight, setNoteWeight,
        setIsFontMenuOpen, isFontMenuOpen, setIsWeightMenuOpen, isWeightMenuOpen,
        setIsSizeMenuOpen, isSizeMenuOpen, currentPageIndex, ColorPallet, Icon,
        isLandscape, activeLayout, totalPages, isSpread,
        isEditingPage, setIsEditingPage, targetPageIndex, setTargetPageIndex,
        getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha,
        activeFormattingTab, setActiveFormattingTab,
        isPageDropdownOpen, setIsPageDropdownOpen, isLightColor, isMobile, isMobileLandscape,
        bodyTextColor: (() => {
            const dropBgHex = layoutColors?.find(c => c.id === 'dropdown-bg')?.hex || '#575C9C';
            const dropTextHex = layoutColors?.find(c => c.id === 'dropdown-text')?.hex || '#FFFFFF';
            return isLightColor(dropBgHex) ? dropTextHex : dropBgHex;
        })()
    };

    const layoutId = typeof activeLayout === 'object' ? activeLayout?.id : activeLayout;

    if (isMobile && isLandscape && Number(layoutId) === 3) {
        return (
            <div
                className="absolute inset-0 z-[99999] pointer-events-auto flex items-center justify-center bg-transparent"
                onClick={onClose}
            >
                <div
                    className="w-[100vw] h-[100vh] pointer-events-none relative flex items-center justify-center"
                    style={{ transform: 'scale(0.52)', transformOrigin: 'center center', WebkitTapHighlightColor: 'transparent' }}
                >
                    <div className="w-full h-full absolute inset-0 pointer-events-auto">
                        <DesktopLayout3
                            {...commonProps}
                            isSidebarOpen={false}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (isMobile) {
        return <MobileLayout {...commonProps} />;
    }


    if (Number(layoutId) === 1) {
        return <DesktopLayout1 {...commonProps} />;
    }

    if (Number(layoutId) === 2) {
        return <DesktopLayout2 {...commonProps} />;
    }

    if (Number(layoutId) === 3) {
        return <DesktopLayout3 {...commonProps} />;
    }

    if (Number(layoutId) === 6 || Number(layoutId) === 4) {
        return <DesktopLayout6 {...commonProps} activeLayout={activeLayout} />;
    }

    if (Number(layoutId) === 5) {
        return <DesktopLayout4 {...commonProps} />;
    }

    if (Number(layoutId) === 7) {
        return <DesktopLayout7 {...commonProps} />;
    }

    if (Number(layoutId) === 8) {
        return <DesktopLayout8 {...commonProps} />;
    }

    if (Number(layoutId) === 9) {

        return <DesktopLayout9 {...commonProps} />;
    }

    return <DesktopDefaultLayout {...commonProps} />;

};

export default AddNotesPopup;
