import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { RotateCcw, X, Pipette } from 'lucide-react';
import { rgbToHex, hexToRgb, rgbToHsv, hsvToRgb } from './AppearanceShared';

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

const ColorPicker = ({ color, onChange, opacity, onOpacityChange, onClose, position }) => {
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
            className="fixed z-[1000] w-[250px] bg-white rounded-[15px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200 select-none font-sans pointer-events-auto"
            style={{ top: position.y, left: position.x }}
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
            <div className="flex gap-2 h-[85px] mb-2">
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

const AddNotesPopup = ({ onClose, currentPageIndex, totalPages, onAddNote, isSidebarOpen, isSpread, isMobile, activeLayout, isLandscape }) => {
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

    const isLayout2 = Number(activeLayout) === 2 || activeLayout === 'Layout2';
    const isLayout3 = Number(activeLayout) === 3 || activeLayout === 'Layout3';
    const isLayout8 = Number(activeLayout) === 8 || activeLayout === 'Layout8';
    const isLayout9 = Number(activeLayout) === 9 || activeLayout === 'Layout9';

    // Notes Formatting States
    const [noteContent, setNoteContent] = useState('');
    const [noteAlignment, setNoteAlignment] = useState('left');
    const [noteStyles, setNoteStyles] = useState(['bold']);
    const [noteCase, setNoteCase] = useState('sentence');
    const [noteList, setNoteList] = useState('none');
    const [activeFormattingTab, setActiveFormattingTab] = useState(null);
    const [noteBackground, setNoteBackground] = useState('#D4E221');
    const [noteTextColor, setNoteTextColor] = useState('#ffffff');
    const [noteFontFamily, setNoteFontFamily] = useState('Poppins');
    const [noteFontSize, setNoteFontSize] = useState('16');
    const [noteTextOpacity, setNoteTextOpacity] = useState(100);
    const [noteBgOpacity, setNoteBgOpacity] = useState(100);

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState('text'); // 'text' or 'background'
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

    const [noteWeight, setNoteWeight] = useState('Semi Bold');
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
        setNoteStyles(['bold']);
        setNoteWeight('Semi Bold');
        setNoteCase('sentence');
        setNoteList('none');
        setNoteBackground('#D4E221');
        setNoteTextColor('#ffffff');
        setNoteFontFamily('Poppins');
        setNoteFontSize('16');
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
        };
        if (isFontMenuOpen || isWeightMenuOpen || isSizeMenuOpen) {
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

    const p1 = (currentPageIndex || 0) + 1;
    const p2 = (isSpread && p1 + 1 <= (totalPages || 0)) ? p1 + 1 : null;
    const pageDisplay = p2 ? `Page ${p1.toString().padStart(2, '0')} - ${p2.toString().padStart(2, '0')}` : `Page ${p1.toString().padStart(2, '0')}`;

    if (isMobile) {
        const isLayout2 = activeLayout == 2;
        return (
            <div
                className="absolute inset-0 z-[100] flex flex-col justify-center items-center pointer-events-auto bg-transparent"
                onClick={onClose}
            >
                <div
                    className={`w-[calc(100%-32px)] shadow-2xl flex ${isLandscape ? 'flex-row max-w-[520px] max-h-[95vh]' : 'flex-col max-w-[290px]'} pointer-events-auto animate-in zoom-in-95 duration-200 outline-none ${isLayout2 ? 'p-1 rounded-[1.2rem] bg-white' : 'p-3 gap-2 rounded-[1.2rem] border border-white/10'}`}
                    style={!isLayout2 ? { backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'), backdropFilter: 'blur(12px)' } : {}}
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
                                    fontWeight: getFontWeight(noteWeight),
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
                                                className={`px-3 py-1.5 text-[12px] cursor-pointer transition-colors ${noteFontFamily === font ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}
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
                                    className={`w-full flex items-center justify-between border-[1.5px] rounded-[10px] px-2 ${isLandscape ? 'py-1' : (isLayout2 ? 'h-[28px]' : 'py-2')} cursor-pointer transition-all bg-black/20 ${isWeightMenuOpen ? 'border-white/40 ring-1 ring-white/10' : 'border-white/10'}`}
                                >
                                    <span className="text-[11px] font-medium text-white/90 truncate">{noteWeight}</span>
                                    <Icon icon="lucide:chevron-down" className="w-3 h-3 text-white/50" />
                                </div>
                                {isWeightMenuOpen && (
                                    <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                        <div className="max-h-[120px] overflow-y-auto py-1">
                                            {weights.map((w) => (
                                                <div
                                                    key={w}
                                                    onClick={() => { setNoteWeight(w); setIsWeightMenuOpen(false); }}
                                                    className="px-3 py-1.5 text-[12px] cursor-pointer hover:bg-gray-50 text-gray-700"
                                                >
                                                    {w}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="w-[60px] relative">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsFontMenuOpen(false); setIsWeightMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between border-[1.5px] rounded-[10px] px-2 ${isLandscape ? 'py-1' : (isLayout2 ? 'h-[28px]' : 'py-2')} cursor-pointer transition-all bg-black/20 ${isSizeMenuOpen ? 'border-white/40 ring-1 ring-white/10' : 'border-white/10'}`}
                                >
                                    <span className="text-[11px] font-medium text-white/90">{noteFontSize}</span>
                                    <Icon icon="lucide:chevron-down" className="w-3 h-3 text-white/50" />
                                </div>
                                {isSizeMenuOpen && (
                                    <div className="absolute bottom-full right-0 w-full mb-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                        <div className="max-h-[120px] overflow-y-auto py-1">
                                            {sizes.map((s) => (
                                                <div
                                                    key={s}
                                                    onClick={() => { setNoteFontSize(s); setIsSizeMenuOpen(false); }}
                                                    className="px-3 py-1.5 text-[12px] cursor-pointer hover:bg-gray-50 text-gray-700 text-center"
                                                >
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Formatting toolbar */}
                        <div className="flex items-center gap-1.5">
                            {[
                                { id: 'align', icon: 'lucide:align-center' },
                                { id: 'style', label: 'B' },
                                { id: 'case', label: '—' },
                                { id: 'list', icon: 'lucide:list' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveFormattingTab(prev => prev === tab.id ? null : tab.id)}
                                    className={`flex-1 ${isLandscape ? 'h-[28px]' : (isLayout2 ? 'h-[28px]' : 'h-[34px]')} border-[1.5px] rounded-[10px] flex items-center justify-center transition-all ${activeFormattingTab === tab.id ? 'bg-white/20 border-white/40 text-white' : 'bg-black/20 text-white/50 border-white/10'}`}
                                >
                                    {tab.icon ? <Icon icon={tab.icon} className="w-4 h-4 text-white/70" /> : <span className="text-[12px] font-bold text-white/70">{tab.label}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Color Selection Wrapper */}
                        <div className="flex items-center gap-2">
                            <div
                                className="w-8 h-8 rounded-lg border-[1.5px] border-white/20 cursor-pointer shadow-sm flex-shrink-0"
                                style={{ backgroundColor: noteTextColor }}
                                onClick={() => { setPickerTarget('text'); setShowColorPicker(true); }}
                            />
                            <div className="flex-1 flex items-center justify-between border-[1.5px] border-white/20 rounded-[10px] px-2 py-1 bg-black/20">
                                <span className="text-[11px] font-medium text-white/90 uppercase">{noteTextColor}</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        value={noteTextOpacity}
                                        onChange={(e) => setNoteTextOpacity(e.target.value)}
                                        className="w-[25px] text-right text-[11px] font-medium text-white/90 outline-none bg-transparent"
                                    />
                                    <span className="text-[11px] text-white/60 font-medium">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons for Landscape */}
                        {isLandscape && (
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
                                className="w-full mt-auto py-2 bg-white text-[#575C9C] rounded-lg text-[13px] font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Icon icon="lucide:check" className="w-4 h-4" />
                                Save Note
                            </button>
                        )}
                    </div>
                </div>

                {/* Color Picker for Mobile */}
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
        );
    }

    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5"
            onClick={onClose}
        >
            <div
                className={`w-[34vw] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 transition-transform duration-500 ease-in-out
                    ${isLayout8
                        ? 'bg-white rounded-[0.4vw] border border-gray-100 shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] overflow-hidden p-[1vw]'
                        : isLayout2
                        ? 'backdrop-blur-xl border-2 border-white/60 p-[5px] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
                        : isLayout3
                        ? 'bg-white rounded-2xl shadow-2xl p-1 border border-gray-200'
                        : 'rounded-[1vw] border border-white/10 shadow-[0_1.5vw_4vw_rgba(0,0,0,0.25)] p-[1vw]'
                    }`}
                style={isLayout8
                    ? { transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)', transformOrigin: 'center center' }
                    : (isLayout2 || isLayout3)
                    ? { transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)', transformOrigin: 'center center', backgroundColor: isLayout2 ? 'rgba(255, 255, 255, 0.4)' : 'white' }
                    : isLayout9
                    ? { backgroundColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.6'), backdropFilter: 'blur(16px)', transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)', transformOrigin: 'center center' }
                    : { backgroundColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8'), backdropFilter: 'blur(12px)', transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)', transformOrigin: 'center center' }
                }
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`${(isLayout2 || isLayout3) ? 'rounded-xl bg-white overflow-hidden flex flex-col flex-1' : 'flex flex-col flex-1'}`}>
                    <div 
                        className={`${(isLayout2 || isLayout3) ? 'rounded-xl p-3 gap-[0.8vw] flex flex-col flex-1' : 'flex flex-col flex-1 gap-[0.8vw]'}`}
                        style={(isLayout2 || isLayout3) ? { backgroundColor: "rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.4 + var(--toc-bg-opacity, 1) * 0.6))" } : {}}
                    >
                {/* Header */}
                        {isLayout8 ? (
                            <div className="w-full px-[1vw] py-[0.6vw] flex items-center justify-between flex-shrink-0 -mx-[1vw] -mt-[1vw] mb-[0.2vw]" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), width: 'calc(100% + 2vw)' }}>
                                <h2 className="text-white text-[0.85vw] font-bold tracking-wide">Add Notes</h2>
                                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="flex items-center justify-center text-white/80 hover:text-white"><Icon icon="lucide:x" className="w-[1vw] h-[1vw]" /></button>
                            </div>
                        ) : (
                        <div className="flex items-center gap-[0.8vw] mb-[1.2vw] w-full">
                            <span className="text-[0.75vw] font-bold text-white/90 whitespace-nowrap">Add Notes</span>
                            <div className="flex-1 h-[1px] bg-white/20"></div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="w-[1.8vw] h-[1.8vw] bg-white/10 border border-white/30 rounded-[0.5vw] flex items-center justify-center text-white/80 hover:bg-white/20 transition-all focus:outline-none"
                            >
                                <Icon icon="lucide:x" className="w-[1vw] h-[1vw] stroke-[2.5]" />
                            </button>
                        </div>
                        )}

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
                                fontWeight: getFontWeight(noteWeight),
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
                    <div className="flex-1 flex flex-col gap-[0.8vw]">
                        <div className="flex items-center gap-[0.5vw]">
                            <span className={`text-[0.9vw] font-bold whitespace-nowrap ${isLayout8 ? 'text-gray-900' : 'text-white'}`}>Text Property</span>
                            <div className={`h-[0.1vw] flex-1 ${isLayout8 ? 'bg-gray-200' : 'bg-white/20'}`}></div>
                        </div>

                        {/* Font Family Selection */}
                        <div className="relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setIsFontMenuOpen(!isFontMenuOpen); }}
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
                                    onClick={(e) => { e.stopPropagation(); setIsWeightMenuOpen(!isWeightMenuOpen); setIsSizeMenuOpen(false); setIsFontMenuOpen(false); }}
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
                                    onClick={(e) => { e.stopPropagation(); setIsSizeMenuOpen(!isSizeMenuOpen); setIsWeightMenuOpen(false); setIsFontMenuOpen(false); }}
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
                                        onClick={() => setActiveFormattingTab(prev => prev === tab.id ? null : tab.id)}
                                        className={`w-[2vw] h-[2vw] border border-gray-400 rounded-[0.6vw] flex items-center justify-center transition-all ${activeFormattingTab === tab.id ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1]' : 'bg-white text-[#4A4A4A] hover:border-black'}`}
                                    >
                                        {tab.icon ? <Icon icon={tab.icon} className="w-[1vw] h-[1vw]" /> : <span className="text-[1vw] font-bold">{tab.label}</span>}
                                    </button>

                                    {activeFormattingTab === tab.id && (
                                        <div className="absolute top-[3.2vw] left-1/2 -translate-x-1/2 w-fit bg-[#1A1A1A] p-[0.35vw] rounded-[0.8vw] flex gap-[0.35vw] animate-in fade-in slide-in-from-top-1 duration-200 z-[60]">
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
                                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-400 shadow-sm cursor-pointer"
                                style={{ backgroundColor: noteTextColor }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
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
        </div>
    </div>
            {showColorPicker && (
                <ColorPicker
                    color={pickerTarget === 'text' ? noteTextColor : noteBackground}
                    position={pickerPos}
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

export default AddNotesPopup;
