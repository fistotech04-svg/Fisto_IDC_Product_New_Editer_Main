import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Pipette } from 'lucide-react';
import { getBookmarkClipPath, getBookmarkBorderRadius } from './BookmarkStylesPopup';

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
    const [hsv, setHsv] = React.useState(() => hexToHsv(color));

    React.useEffect(() => {
        setHsv(hexToHsv(color));
    }, [color]);

    const handleSaturationChange = React.useCallback((e, container) => {
        const { width, height, left, top } = container.getBoundingClientRect();
        const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
        const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);

        const newHsv = { ...hsv, s: x * 100, v: (1 - y) * 100 };
        setHsv(newHsv);
        onChange(hsvToHex(newHsv));
    }, [hsv, onChange]);

    const handleHueChange = React.useCallback((e, container) => {
        const { height, top } = container.getBoundingClientRect();
        const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);

        const newHsv = { ...hsv, h: y * 360 };
        setHsv(newHsv);
        onChange(hsvToHex(newHsv));
    }, [hsv, onChange]);

    const useDrag = (handler) => {
        const isDragging = React.useRef(false);
        const containerRef = React.useRef(null);

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

const AddBookmarkPopup = ({ onClose, currentPageIndex, totalPages, onAddBookmark, isSidebarOpen, isSpread, bookmarkSettings, isMobile, activeLayout, isLandscape }) => {
    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

    const isLayout2 = Number(activeLayout) === 2 || activeLayout === 'Layout2';
    const isLayout3 = Number(activeLayout) === 3 || activeLayout === 'Layout3';
    const isLayout8 = Number(activeLayout) === 8 || activeLayout === 'Layout8';
    const isLayout9 = Number(activeLayout) === 9 || activeLayout === 'Layout9';

    const [selectedColor, setSelectedColor] = useState(bookmarkSettings?.color || '#D15D6D');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [opacity, setOpacity] = useState(100);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState('background'); // 'background' or 'text'
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
    const [bookmarkText, setBookmarkText] = useState('');

    const colors = [
        '#D15D6D', // Pinkish/Red
        '#6B7CBF', // Blue
        '#6FAF7C', // Green
        '#E0D95A', // Yellow
        'multi-color' // Rainbow
    ];

    const currentPage = currentPageIndex + 1;
    const nextPage = (isSpread && currentPage + 1 <= totalPages) ? currentPage + 1 : null;

    // Helper function to convert hex to rgba with opacity
    const hexToRgba = (hex, opacity) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    };

    // Update bookmark text when page changes
    React.useEffect(() => {
        setBookmarkText(`Page ${currentPage}`);
    }, [currentPage]);

    // Apply font from settings if available
    const bookmarkFont = bookmarkSettings?.font || 'Arial';

    if (isMobile) {
        const isLayout2 = activeLayout == 2;
        if (isLandscape) {
            return (
                <div
                    className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/20"
                    onClick={onClose}
                >
                    <div
                        className="rounded-[1.2rem] shadow-2xl p-4 w-[90%] max-w-[550px] relative animate-in zoom-in-95 duration-200 border border-white/10"
                    style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'), backdropFilter: 'blur(12px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center mb-3">
                            <h2 className="text-[16px] font-bold text-white pr-3 whitespace-nowrap">Add Bookmark</h2>
                            <div className="flex-1 h-[1px] bg-white/20"></div>
                            <button
                                onClick={onClose}
                                className="ml-3 w-8 h-8 rounded-lg border-[1.5px] border-[#FF4D4D] flex items-center justify-center text-[#FF4D4D] hover:bg-red-50 transition-colors shadow-sm"
                            >
                                <Icon icon="lucide:x" className="w-5 h-5 stroke-[2.5]" />
                            </button>
                        </div>

                        <div className="flex items-start gap-5">
                            {/* Left Column: Color Selection */}
                            <div className="flex flex-col gap-2 pt-1">
                                {['#D15D6D', '#6B7CBF', '#6FAF7C', '#E0D95A'].map((color, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-7 h-7 rounded-full transition-all shadow-md border-[1.5px] ${selectedColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <button
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                        setPickerTarget('background');
                                        setShowColorPicker(true);
                                    }}
                                    className="w-7 h-7 rounded-full shadow-md hover:scale-105 transition-transform"
                                    style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                                />
                            </div>

                            {/* Middle Column: Preview Area */}
                            <div className="flex-1 flex items-center justify-center">
                                <div
                                    className="relative h-[115px] w-full flex shadow-[0_10px_25px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden"
                                    style={{
                                        backgroundColor: hexToRgba(selectedColor, opacity),
                                        clipPath: getBookmarkClipPath(bookmarkSettings?.style || 1),
                                        borderRadius: getBookmarkBorderRadius(bookmarkSettings?.style || 1)
                                    }}
                                >
                                    <div className="h-full flex-1 flex items-center justify-center p-3">
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                            className="text-[20px] font-bold outline-none text-center w-full cursor-text"
                                            style={{ color: textColor, fontFamily: bookmarkFont }}
                                            dangerouslySetInnerHTML={{ __html: bookmarkText }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Style Controls */}
                            <div className="w-[170px] flex flex-col pt-0">
                                <div className="flex items-center mb-2">
                                    <span className="text-[12px] font-bold text-white pr-2 whitespace-nowrap">Text Color</span>
                                    <div className="flex-1 h-[1.5px] bg-white/20"></div>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-4">
                                    <button
                                        className="w-9 h-9 rounded-lg border-[1.5px] border-white/20 shadow-sm flex-shrink-0 bg-white/10 p-1 hover:border-white/40 transition-colors"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                            setPickerTarget('text');
                                            setShowColorPicker(true);
                                        }}
                                    >
                                        <div className="w-full h-full rounded shadow-inner" style={{ backgroundColor: textColor }} />
                                    </button>
                                    
                                    <div className="flex-1 h-9 border-[1.5px] border-white/20 rounded-lg flex items-center px-2.5 justify-between bg-black/20">
                                        <span className="text-[11px] font-bold text-white/90">{textColor}</span>
                                        <span className="text-[11px] font-bold text-white/50">{opacity}%</span>
                                    </div>
                                </div>

                                <button
                                    className="w-full bg-black text-white rounded-lg py-2.5 flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-gray-800 active:scale-[0.98] transition-all"
                                    onClick={() => {
                                        onAddBookmark({
                                            id: Date.now(),
                                            label: bookmarkText,
                                            pageIndex: currentPageIndex,
                                            color: selectedColor,
                                            style: bookmarkSettings?.style || 1,
                                            font: bookmarkFont
                                        });
                                        onClose();
                                    }}
                                >
                                    <span className="text-[12px] font-bold leading-tight">Add Bookmark</span>
                                    <span className="text-[10px] opacity-60 leading-tight mt-0.5">Page - {currentPage}</span>
                                </button>
                            </div>
                        </div>

                        {/* Landscape Color Picker */}
                        {showColorPicker && (
                            <div className="absolute inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowColorPicker(false)}>
                                <div onClick={e => e.stopPropagation()} className="relative">
                                    <ColorPicker
                                        color={pickerTarget === 'text' ? textColor : selectedColor}
                                        position={{ x: 20, y: -120 }}
                                        opacity={opacity}
                                        onOpacityChange={(val) => setOpacity(val)}
                                        onChange={(color) => {
                                            if (pickerTarget === 'text') setTextColor(color);
                                            else setSelectedColor(color);
                                        }}
                                        onClose={() => setShowColorPicker(false)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
                onClick={onClose}
            >
                <div
                    className={`w-[calc(100%-32px)] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 outline-none ${isLayout2 ? 'max-w-[340px] p-1 rounded-[1.2rem] bg-white/60 backdrop-blur-md' : 'max-w-[280px] p-3.5 gap-2.5 rounded-[1.2rem] border border-white/10'}`}
                    style={!isLayout2 ? { backgroundColor: `rgba(var(--dropdown-bg-rgb, 87, 92, 156), var(--dropdown-bg-opacity, 0.8))`, backdropFilter: 'blur(12px)' } : {}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={isLayout2 ? `rounded-[1rem] p-4 flex flex-col gap-3` : "flex flex-col gap-2.5 h-full"}
                        style={isLayout2 ? { backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '1') } : {}}
                    >
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold text-white flex-shrink-0">Add Bookmark</span>
                        <div className="flex-1 h-px bg-white/10" />
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-transparent border border-white/20 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 focus:outline-none"
                        >
                            <Icon icon="lucide:x" className="w-[18px] h-[18px]" />
                        </button>
                    </div>

                    {/* Bookmark Preview */}
                    <div className="w-full flex items-center justify-center">
                        <div
                            className={`relative w-full ${isLayout2 ? 'h-[160px]' : 'h-[120px]'} flex items-center justify-center shadow-md transition-all duration-300`}
                            style={{
                                backgroundColor: hexToRgba(selectedColor, opacity),
                                clipPath: getBookmarkClipPath(bookmarkSettings?.style || 1),
                                borderRadius: getBookmarkBorderRadius(bookmarkSettings?.style || 1)
                            }}
                        >
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                className="text-[18px] font-medium outline-none text-center w-full px-4 cursor-text"
                                style={{ color: textColor, fontFamily: bookmarkFont }}
                                dangerouslySetInnerHTML={{ __html: bookmarkText }}
                            />
                        </div>
                    </div>

                    {/* Color Palette */}
                    <div className="flex items-center justify-between">
                        {['#31B0B0', '#C68798', '#D6566E', '#6B7DBB', '#67AC78', '#D8DC53', '#23D295'].map((color, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedColor(color)}
                                className={`${isLayout2 ? 'w-6 h-6' : 'w-5 h-5'} rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm border-[2px] ${selectedColor === color ? 'border-gray-800' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div
                            onClick={() => {
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className={`${isLayout2 ? 'w-6 h-6' : 'w-5 h-5'} rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]`}
                        />
                    </div>

                    {/* Text Color */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[14px] font-bold text-white">Text Color</span>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-[38px] h-[38px] rounded-[10px] border-[1.5px] border-white/20 shadow-sm cursor-pointer flex-shrink-0"
                                style={{ backgroundColor: textColor }}
                                onClick={() => {
                                    setPickerTarget('text');
                                    setShowColorPicker(true);
                                }}
                            />
                            <div className="flex-1 flex items-center justify-between border-[1.5px] border-white/20 rounded-[10px] px-3 py-2 bg-black/20">
                                <span className="text-[13px] font-medium text-white uppercase">{textColor}</span>
                                <span className="text-[13px] text-white/60 font-medium">{opacity}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Add Bookmark Button */}
                    <button
                        className={`w-full rounded-xl ${isLayout2 ? 'py-3' : 'py-2'} flex flex-col items-center justify-center shadow-lg hover:bg-gray-100 transition-colors bg-white`}
                        style={{ color: getLayoutColor('dropdown-bg', '#575C9C') }}
                        onClick={() => {
                            onAddBookmark({
                                id: Date.now(),
                                label: bookmarkText,
                                pageIndex: currentPageIndex,
                                color: selectedColor,
                                style: bookmarkSettings?.style || 1,
                                font: bookmarkFont
                            });
                            onClose();
                        }}
                    >
                        <span className="text-[14px] font-bold">Add Bookmark</span>
                        <span className="text-[12px] font-medium opacity-80">Page - {currentPage}</span>
                    </button>
                </div>

                {/* Mobile Color Picker */}
                {showColorPicker && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center" onClick={() => setShowColorPicker(false)}>
                        <div onClick={e => e.stopPropagation()}>
                            <ColorPicker
                                color={pickerTarget === 'text' ? textColor : selectedColor}
                                position={{ x: window.innerWidth / 2 - 125, y: window.innerHeight / 2 - 150 }}
                                opacity={opacity}
                                onOpacityChange={(val) => setOpacity(val)}
                                onChange={(color) => {
                                    if (pickerTarget === 'text') setTextColor(color);
                                    else setSelectedColor(color);
                                }}
                                onClose={() => setShowColorPicker(false)}
                            />
                        </div>
                    </div>
                )}
                </div>
            </div>
        );
    }

    return (

        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5"
            onClick={onClose}
        >
            <div
                className={`w-[38vw] relative animate-in zoom-in-95 duration-200 transition-transform duration-500 ease-in-out
                    ${isLayout8
                        ? 'bg-white rounded-[0.4vw] border border-gray-100 shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] overflow-hidden p-[1.2vw]'
                        : isLayout2
                        ? 'backdrop-blur-xl border-2 border-white/60 p-[5px] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
                        : isLayout3
                        ? 'bg-white rounded-2xl shadow-2xl p-1 border border-gray-200'
                        : 'rounded-[1.2vw] border border-white/10 shadow-[0_1.5vw_4vw_rgba(0,0,0,0.25)] p-[1.2vw]'
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
                        className={`${(isLayout2 || isLayout3) ? 'rounded-xl p-3 flex flex-col flex-1' : 'flex flex-col flex-1'}`}
                        style={(isLayout2 || isLayout3) ? { backgroundColor: "rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.4 + var(--toc-bg-opacity, 1) * 0.6))" } : {}}
                    >
                {/* Header */}
                {isLayout8 ? (
                    <div className="w-full px-[1.2vw] py-[0.6vw] flex items-center justify-between flex-shrink-0 -mx-[1.2vw] -mt-[1.2vw] mb-[1.2vw]" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), width: 'calc(100% + 2.4vw)' }}>
                        <h2 className="text-white text-[0.85vw] font-bold tracking-wide">Add Bookmark</h2>
                        <button onClick={onClose} className="flex items-center justify-center text-white/80 hover:text-white"><Icon icon="lucide:x" className="w-[1vw] h-[1vw]" /></button>
                    </div>
                ) : (
                <div className="flex items-center gap-[0.8vw] mb-[1.2vw] w-full">
                    <span className="text-[0.75vw] font-bold text-white/90 whitespace-nowrap">Add Bookmark</span>
                    <div className="flex-1 h-[1px] bg-white/20"></div>
                    <button
                        onClick={onClose}
                        className="w-[1.8vw] h-[1.8vw] bg-white/10 border border-white/30 rounded-[0.5vw] flex items-center justify-center text-white/80 hover:bg-white/20 transition-all focus:outline-none"
                    >
                        <Icon icon="lucide:x" className="w-[1vw] h-[1vw] stroke-[2.5]" />
                    </button>
                </div>
                )}

                {/* Main Content Grid */}
                <div className="flex gap-[1.6vw]">
                    {/* Left Column: Color Picker */}
                    <div className="flex flex-col gap-[0.6vw] pt-[0.4vw]">
                        {['#D15D6D', '#6B7CBF', '#6FAF7C', '#E0D95A', '#31B0B0'].map((color, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedColor(color)}
                                className={`w-[2vw] h-[2vw] rounded-full transition-all hover:scale-110 shadow-sm border-[0.12vw] ${selectedColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        {/* Rainbow Wheel */}
                        <button
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                setPickerTarget('background');
                                setShowColorPicker(true);
                            }}
                            className={`w-[2vw] h-[2vw] rounded-full transition-all hover:scale-110 shadow-sm border-[0.12vw] border-transparent`}
                            style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                        />
                    </div>

                    {/* Middle Column: Bookmark Preview */}
                    <div className="flex-1 flex items-start justify-start overflow-hidden">
                        <div
                            className="relative h-[10vw] w-full flex shadow-md filter drop-shadow-md transition-all duration-300"
                            style={{
                                backgroundColor: hexToRgba(selectedColor, opacity),
                                clipPath: getBookmarkClipPath(bookmarkSettings?.style || 1),
                                borderRadius: getBookmarkBorderRadius(bookmarkSettings?.style || 1)
                            }}
                        >
                            <div
                                className="h-full flex-1 flex items-center justify-center p-[0.5vw]"
                            >
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="text-[1.5vw] font-medium outline-none text-center w-full cursor-text"
                                    style={{ color: textColor, fontFamily: bookmarkFont }}
                                    dangerouslySetInnerHTML={{ __html: bookmarkText }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div className="w-[12vw] flex flex-col pt-[0.4vw]">
                        {/* Text Color Label + Line */}
                        <div className="flex items-center mb-[0.6vw]">
                            <span className={`text-[0.8vw] font-bold pr-[0.4vw] z-10 ${isLayout8 ? 'text-gray-900' : 'text-white'}`}>Text Color</span>
                            <div className={`flex-1 h-[1px] ${isLayout8 ? 'bg-gray-200' : 'bg-white/20'}`}></div>
                        </div>

                        {/* Text Color Input */}
                        <div className="flex items-center gap-[0.6vw] mb-[2.5vw]">
                            {/* Color Square Box */}
                            <div
                                className={`w-[2vw] h-[2vw] rounded-[0.3vw] cursor-pointer hover:shadow-md transition-shadow ${isLayout8 ? 'border border-gray-400' : 'border border-white/30'}`}
                                style={{ backgroundColor: textColor }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                    setPickerTarget('text');
                                    setShowColorPicker(true);
                                }}
                            ></div>

                            {/* Input Box */}
                            <div className={`flex-1 h-[2vw] rounded-[0.3vw] flex items-center px-[0.4vw] justify-between ${isLayout8 ? 'border border-gray-300 bg-gray-50' : 'border border-white/20 bg-black/20'}`}>
                                <span className={`text-[0.75vw] ${isLayout8 ? 'text-gray-700' : 'text-white/80'}`}>{textColor}</span>
                                <span className={`text-[0.75vw] ${isLayout8 ? 'text-gray-400' : 'text-white/50'}`}>{opacity}%</span>
                            </div>
                        </div>

                        {/* Buttons Row with Add Functionality */}
                        <div className="flex gap-[0.6vw]">
                            <button
                                className="flex-1 bg-black text-white rounded-[0.5vw] py-[0.6vw] flex flex-col items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
                                onClick={() => {
                                    onAddBookmark({
                                        id: Date.now(),
                                        label: bookmarkText,
                                        pageIndex: currentPageIndex,
                                        color: selectedColor,
                                        style: bookmarkSettings?.style || 1,
                                        font: bookmarkFont
                                    });
                                    onClose();
                                }}
                            >
                                <span className="text-[0.6vw] font-bold">Add Bookmark</span>
                                <span className="text-[0.6vw] font-bold">Page - {currentPage}</span>
                            </button>

                            {nextPage && (
                                <button
                                    className="flex-1 bg-black text-white rounded-[0.5vw] py-[0.6vw] flex flex-col items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
                                    onClick={() => {
                                        onAddBookmark({
                                            id: Date.now(),
                                            label: `Page ${nextPage}`,
                                            pageIndex: currentPageIndex + 1,
                                            color: selectedColor,
                                            style: bookmarkSettings?.style || 1,
                                            font: bookmarkFont
                                        });
                                        onClose();
                                    }}
                                >
                                    <span className="text-[0.6vw] font-bold">Add Bookmark</span>
                                    <span className="text-[0.6vw] font-bold">Page - {nextPage}</span>
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
                    color={pickerTarget === 'text' ? textColor : selectedColor}
                    position={pickerPos}
                    opacity={opacity} // Note: This opacity state might need to be split if we want separate opacities for text and background, but following current usage.
                    onOpacityChange={(val) => setOpacity(val)}
                    onChange={(color) => {
                        if (pickerTarget === 'text') setTextColor(color);
                        else setSelectedColor(color);
                    }}
                    onClose={() => setShowColorPicker(false)}
                />
            )}
        </div>
    );
};

export default AddBookmarkPopup;
