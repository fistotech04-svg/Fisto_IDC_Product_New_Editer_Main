import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getBookmarkClipPath, getBookmarkBorderRadius } from '../BookmarkStylesPopup';
import ColorPallet from '../ColorPallet';
import AddBookmarkPopupLandscape from './AddBookmarkPopupLandscape';

const DesktopLayout2 = ({
    onClose, selectedColor, setSelectedColor, textColor, setTextColor,
    opacity, setOpacity, textOpacity, setTextOpacity, bookmarkText, setBookmarkText,
    targetPageIndex, setTargetPageIndex, totalPages, isSidebarOpen,
    showColorPicker, setShowColorPicker, pickerTarget, setPickerTarget,
    setPickerPos, pickerPos, bookmarkStyle, bookmarkFont, onAddBookmark,
    getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha, hexToRgba,
    getBookmarkClipPath, getBookmarkBorderRadius, Icon
}) => {
    const [isPageDropdownOpen, setIsPageDropdownOpen] = React.useState(false);

    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
            onClick={onClose}
        >
            <div
                className="w-[35vw] rounded-[1.2vw] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 p-[0.35vw] relative backdrop-blur-md border border-white/30"
                style={{
                    transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)',
                    transformOrigin: 'center center',
                    backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2)
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="w-full h-full rounded-[1vw] shadow-inner flex flex-col relative border border-white/20 p-[1.2vw]"
                    style={{ backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.2 + var(--dropdown-bg-opacity, 1) * 0.8))" }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-[0.8vw] mb-[1vw]">
                        <span className="text-[1vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Bookmark</span>
                        <div className="flex-1 h-[1px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.3 }} />
                        <button
                            onClick={onClose}
                            className="transition-colors opacity-60 hover:opacity-100"
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
                        </button>
                    </div>

                    <div className="flex gap-[1.2vw] items-start">
                        {/* Left - Color Swatches */}
                        <div className="flex flex-col gap-[0.4vw]">
                            {['#D15D6D', '#6B7CBF', '#6FAF7C', '#D8DC53', '#34B1AA'].map((color, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] cursor-pointer hover:scale-110 transition-all border-[0.12vw] shadow-sm ${selectedColor === color ? 'border-white shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 15, y: rect.top - 80 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] cursor-pointer hover:scale-110 transition-transform flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] color-picker-trigger"
                            >
                                <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-white/70" />
                            </div>
                        </div>

                        {/* Middle - Bookmark Preview (Rectangular) */}
                        <div
                            className="relative w-[17vw] h-[11vw] rounded-[0.35vw] shadow-2xl flex items-center justify-center transition-all duration-300"
                            style={{
                                backgroundColor: hexToRgba(selectedColor, opacity),
                                clipPath: getBookmarkClipPath(bookmarkStyle),
                                borderRadius: getBookmarkBorderRadius(bookmarkStyle)
                            }}
                        >
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                className="text-[2vw] font-bold outline-none text-center px-[0.8vw] cursor-text w-full break-words leading-tight"
                                style={{ color: hexToRgba(textColor, textOpacity), fontFamily: 'serif' }}
                                dangerouslySetInnerHTML={{ __html: bookmarkText || `Page ${targetPageIndex + 1}` }}
                            />
                        </div>

                        {/* Right - Controls */}
                        <div className="flex-1 flex flex-col gap-[0.8vw]">
                            {/* Text Color Selection */}
                            <div className="flex flex-col gap-[0.4vw]">
                                <div className="flex items-center gap-[0.4vw]">
                                    <span className="text-[0.75vw] font-bold whitespace-nowrap text-white/90">Text Color</span>
                                    <div className="flex-1 h-[1px] bg-white/20" />
                                </div>
                                <div className="flex items-center gap-[0.5vw]">
                                    <div
                                        className="w-[1.6vw] h-[1.6vw] rounded-[0.35vw] bg-white cursor-pointer shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: textColor }}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.left - 150, y: rect.top - 40 });
                                            setPickerTarget('text');
                                            setShowColorPicker(true);
                                        }}
                                    />
                                    <div className="flex-1 h-[1.6vw] flex items-center border rounded-[0.5vw] px-[0.6vw] bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                                        <span className="text-[0.75vw] font-bold flex-1 text-white/90">{textColor.toUpperCase()}</span>
                                        <span className="text-[0.75vw] font-bold text-white/40">{textOpacity}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Page Selection */}
                            <div className="flex flex-col gap-[0.4vw] relative">
                                <div className="flex items-center gap-[0.4vw]">
                                    <span className="text-[0.75vw] font-bold whitespace-nowrap text-white/90">Select Page</span>
                                    <div className="flex-1 h-[1px] bg-white/20" />
                                </div>
                                <div
                                    onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                                    className="flex items-center justify-between border rounded-[0.5vw] px-[0.6vw] h-[1.8vw] cursor-pointer bg-white/10"
                                    style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                                >
                                    <span className="text-[0.75vw] font-bold text-white/90">Page {targetPageIndex + 1}</span>
                                    <Icon icon="lucide:chevron-down" className="w-[0.85vw] h-[0.85vw] text-white/40" />
                                </div>
                                {isPageDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-[0.25vw] max-h-[8vw] bg-white rounded-[0.5vw] shadow-2xl overflow-y-auto custom-scrollbar z-[100] border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                        {Array.from({ length: totalPages || 1 }, (_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setTargetPageIndex(i);
                                                    setIsPageDropdownOpen(false);
                                                }}
                                                className={`px-[0.8vw] py-[0.4vw] text-[0.75vw] font-bold cursor-pointer transition-colors ${targetPageIndex === i ? 'bg-[#575C9C] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-[0.5vw] mt-[0.4vw]">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-[2.2vw] rounded-[0.7vw] border-[0.12vw] border-white/80 text-white font-bold text-[0.75vw] flex items-center justify-center gap-[0.3vw] hover:bg-white/10 transition-all active:scale-95"
                                >
                                    <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        onAddBookmark({
                                            id: Date.now(),
                                            label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                            pageIndex: targetPageIndex,
                                            color: selectedColor,
                                            style: bookmarkStyle,
                                            font: bookmarkFont
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.4] h-[2.2vw] rounded-[0.7vw] bg-white text-[#575C9C] font-bold text-[0.75vw] hover:bg-opacity-90 transition-all active:scale-95 shadow-lg"
                                >
                                    Add Bookmark
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Color Picker */}
                    {showColorPicker && (
                        <div
                            className="absolute z-[200] right-[1vw] top-[4vw] w-[15vw] animate-in fade-in zoom-in-95 duration-200 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ColorPallet
                                smallMode={true}
                                color={pickerTarget === 'background' ? selectedColor : textColor}
                                onChange={(newColor) => {
                                    if (pickerTarget === 'background') setSelectedColor(newColor);
                                    else setTextColor(newColor);
                                }}
                                opacity={pickerTarget === 'background' ? opacity : textOpacity}
                                onOpacityChange={(newOpacity) => {
                                    if (pickerTarget === 'background') setOpacity(newOpacity);
                                    else setTextOpacity(newOpacity);
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

const AddBookmarkPopup = ({ onClose, currentPageIndex, totalPages, onAddBookmark, isSidebarOpen, isSpread, bookmarkSettings, isMobile, activeLayout, isLandscape, isMobileLandscape, layoutColors }) => {
    const [selectedColor, setSelectedColor] = useState(bookmarkSettings?.color || (activeLayout == 2 ? '#34B1AA' : '#D15D6D'));
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [opacity, setOpacity] = useState(100);
    const [textOpacity, setTextOpacity] = useState(100);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState('background'); // 'background' or 'text'
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
    const [bookmarkText, setBookmarkText] = useState('');
    const [targetPageIndex, setTargetPageIndex] = useState(currentPageIndex);
    const [showPageDropdown, setShowPageDropdown] = useState(false);

    const getLayoutColor = (id, defaultColor) => {
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
        return luminance > 0.7;
    };

    const bodyTextColor = (() => {
        const dropBgHex = layoutColors?.find(c => c.id === 'dropdown-bg')?.hex || '#575C9C';
        const dropTextHex = layoutColors?.find(c => c.id === 'dropdown-text')?.hex || '#FFFFFF';
        return isLightColor(dropBgHex) ? dropTextHex : dropBgHex;
    })();

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
    useEffect(() => {
        setBookmarkText(`Page ${targetPageIndex + 1}`);
    }, [targetPageIndex]);

    // Apply font from settings if available
    const bookmarkStyle = bookmarkSettings?.style || 1;
    const bookmarkFont = bookmarkSettings?.font || 'Arial';

    const DesktopLayout3 = ({
        onClose, selectedColor, setSelectedColor, textColor, setTextColor,
        opacity, setOpacity, textOpacity, setTextOpacity, bookmarkText, setBookmarkText,
        targetPageIndex, setTargetPageIndex, totalPages, isSidebarOpen,
        showColorPicker, setShowColorPicker, pickerTarget, setPickerTarget,
        setPickerPos, pickerPos, bookmarkStyle, bookmarkFont, onAddBookmark,
        getLayoutColor, getLayoutColorRgba, getLayoutColorAlpha, hexToRgba,
        getBookmarkClipPath, getBookmarkBorderRadius, Icon, isMobileLandscape
    }) => {
        const [showPageDropdown, setShowPageDropdown] = React.useState(false);

        return (
            <>
                <div
                    className="rounded-[1.2vw] shadow-2xl p-[1vw] w-[35vw] relative animate-in zoom-in-95 duration-200 border border-gray-100 bg-white select-none overflow-visible pointer-events-auto"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (showPageDropdown) setShowPageDropdown(false);
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-[1vw] relative z-10">
                        <h2 className={`${isMobileLandscape ? 'text-[1.5vw]' : 'text-[1.1vw]'} font-extrabold text-[#575C9C]`}>
                            Add Bookmark
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-[1.6vw] h-[1.6vw] flex items-center justify-center rounded-[0.4vw] transition-colors text-[#575C9C]/60 hover:text-[#575C9C]"
                        >
                            <Icon icon="lucide:x" className="w-[1.1vw] h-[1.1vw] stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Content Grid */}
                    <div className="flex gap-[1vw] items-start">
                        {/* Left Column: Color Selection */}
                        <div className="flex flex-col gap-[0.5vw] pt-[0.2vw]">
                            {['#D15D6D', '#6B7CBF', '#6FAF7C', '#D8DC53', '#34B1AA'].map((color, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] transition-all border-[1.5px] shadow-sm ${selectedColor === color ? 'border-[#575C9C] scale-110 shadow-lg' : 'border-transparent hover:border-gray-200'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-[1.6vw] h-[1.6vw] rounded-[0.4vw] border-[1.5px] border-transparent shadow-sm hover:scale-110 transition-transform"
                                style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                            >
                                <Icon icon="lucide:pipette" className="w-[0.8vw] h-[0.8vw] text-white/80 mx-auto" />
                            </button>
                        </div>

                        {/* Middle Column: Bookmark Preview */}
                        <div className="flex-1 min-w-0 flex items-center justify-center pt-[0.2vw]">
                            <div
                                className="relative w-full h-[10vw] flex items-center justify-center shadow-xl transition-all duration-300"
                                style={{
                                    backgroundColor: hexToRgba(selectedColor, opacity),
                                    clipPath: getBookmarkClipPath(bookmarkStyle),
                                    borderRadius: getBookmarkBorderRadius(bookmarkStyle)
                                }}
                            >
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    className={`${isMobileLandscape ? 'text-[3vw]' : 'text-[2.2vw]'} font-bold outline-none text-center px-4 cursor-text w-full text-white drop-shadow-md`}
                                    style={{ color: hexToRgba(textColor, textOpacity), fontFamily: 'serif' }}
                                    dangerouslySetInnerHTML={{ __html: bookmarkText || `Page ${targetPageIndex + 1}` }}
                                />
                            </div>
                        </div>

                        {/* Right Column: Controls */}
                        <div className="w-[12vw] flex flex-col gap-[1vw]">
                            {/* Text Color Section */}
                            <div className="space-y-[0.5vw]">
                                <span className={`${isMobileLandscape ? 'text-[1.2vw]' : 'text-[0.9vw]'} font-extrabold text-[#575C9C]`}>Text Color :</span>
                                <div className="flex items-center gap-[0.4vw]">
                                    <button
                                        className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 bg-white p-[0.15vw] shadow-sm flex-shrink-0"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                            setPickerTarget('text');
                                            setShowColorPicker(true);
                                        }}
                                    >
                                        <div className="w-full h-full rounded-[0.2vw]" style={{ backgroundColor: textColor }} />
                                    </button>

                                    <div className="flex-1 h-[2vw] rounded-[0.4vw] flex items-center px-[0.6vw] justify-between shadow-inner border border-[#575C9C]/10 bg-[#F5F6FA]">
                                        <span className={`${isMobileLandscape ? 'text-[1.1vw]' : 'text-[0.8vw]'} uppercase font-bold text-[#575C9C]/80`}>{textColor}</span>
                                        <div className="flex items-center gap-0.5">
                                            <span className="text-[0.8vw] font-bold text-[#575C9C]/60">{textOpacity}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Page Selection */}
                            <div className="space-y-[0.5vw] relative">
                                <span className={`${isMobileLandscape ? 'text-[1.2vw]' : 'text-[0.9vw]'} font-extrabold text-[#575C9C]`}>Add Bookmark on :</span>
                                 <div
                                    onClick={() => setShowPageDropdown(!showPageDropdown)}
                                    className="h-[1.6vw] rounded-[0.4vw] flex items-center px-[0.5vw] justify-between shadow-inner border border-[#575C9C]/10 bg-[#F5F6FA] cursor-pointer hover:border-[#575C9C]/30 transition-colors"
                                >
                                    <span className={`${isMobileLandscape ? 'text-[1vw]' : 'text-[0.7vw]'} font-bold text-[#575C9C]/80`}>Page {targetPageIndex + 1}</span>
                                    <Icon icon="fluent:chevron-down-24-filled" className={`w-[0.7vw] h-[0.7vw] transition-transform duration-200 ${showPageDropdown ? 'rotate-180' : ''} text-[#575C9C]/60`} />
                                </div>

                                {showPageDropdown && (
                                    <div
                                        className="absolute top-[0vw] left-[100%] ml-[2.5vw] w-[6.5vw] max-h-[11vw] overflow-y-auto border-2 border-gray-100 rounded-[0.6vw] shadow-[0_15px_50px_rgba(0,0,0,0.2)] z-[150] bg-white custom-scrollbar flex flex-col overflow-x-hidden"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setTargetPageIndex(i);
                                                    setShowPageDropdown(false);
                                                }}
                                                className={`flex items-center justify-center py-[0.4vw] cursor-pointer text-[0.75vw] font-bold transition-all border-b last:border-b-0 border-[#575C9C]/10 ${targetPageIndex === i
                                                        ? 'bg-[#575C9C] text-white shadow-md'
                                                        : 'hover:bg-[#575C9C]/10 text-[#575C9C]'
                                                    }`}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-[0.5vw] mt-[0.5vw]">
                                <button
                                    onClick={onClose}
                                    className={`flex-1 h-[2.2vw] rounded-[0.5vw] border border-[#575C9C] font-bold ${isMobileLandscape ? 'text-[1.1vw]' : 'text-[0.8vw]'} text-[#575C9C] flex items-center justify-center gap-[0.3vw] transition-all hover:bg-[#575C9C]/5`}
                                >
                                    <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        onAddBookmark({
                                            id: Date.now(),
                                            label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                            pageIndex: targetPageIndex,
                                            color: selectedColor,
                                            style: bookmarkStyle,
                                            font: bookmarkFont
                                        });
                                        onClose();
                                    }}
                                    className={`flex-[1.4] h-[2.2vw] px-[0.6vw] rounded-[0.5vw] font-bold ${isMobileLandscape ? 'text-[1.1vw]' : 'text-[0.8vw]'} transition-all bg-[#575C9C] text-white hover:bg-[#4B528C] shadow-lg active:scale-[0.98]`}
                                >
                                    Add Bookmark
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {showColorPicker && (
                    <ColorPallet
                        smallMode={true}
                        color={pickerTarget === 'background' ? selectedColor : textColor}
                        onChange={(newColor) => {
                            if (pickerTarget === 'background') setSelectedColor(newColor);
                            else setTextColor(newColor);
                        }}
                        opacity={pickerTarget === 'background' ? opacity : textOpacity}
                        onOpacityChange={(newOpacity) => {
                            if (pickerTarget === 'background') setOpacity(newOpacity);
                            else setTextOpacity(newOpacity);
                        }}
                        onClose={() => setShowColorPicker(false)}
                        style={{
                            position: 'fixed',
                            top: pickerPos.y,
                            left: pickerPos.x,
                            zIndex: 999999,
                            transform: 'none'
                        }}
                    />
                )}
            </>
        );
    };

    const renderDesktopLayout = () => {
        const layoutId = typeof activeLayout === 'object' ? activeLayout?.id : activeLayout;
        const isLayout4 = Number(layoutId) === 4 || Number(layoutId) === 5 || Number(layoutId) === 6;
        return (
            <div
                className={isMobileLandscape ? "animate-in zoom-in-95 duration-200 pointer-events-auto" : ""}
                style={isMobileLandscape ? { transform: 'scale(1.1) translateZ(0)', transformOrigin: 'center center' } : {}}
            >
                <div
                    className={`rounded-[20px] shadow-2xl p-6 ${isMobileLandscape ? 'w-[420px]' : 'w-[35vw]'} relative animate-in zoom-in-95 duration-200 border select-none overflow-visible transition-transform duration-300 pointer-events-auto`}
                    style={{
                        backgroundColor: (Number(layoutId) === 5 || Number(layoutId) === 6) ? '#FFFFFF' : (isLayout4 ? '#FFFFFF' : getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.95')),
                        borderColor: isLayout4 ? '#e5e7eb' : 'rgba(255,255,255,0.2)',
                        backdropFilter: isLayout4 ? 'none' : 'blur(12px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        transform: (!isMobileLandscape && isSidebarOpen && !isMobile) ? 'translate(8vw, 0)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-full" style={{ backgroundColor: isLayout4 ? ((Number(layoutId) === 5 || Number(layoutId) === 6) ? getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.95') : '#FFFFFF') : getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.95') }}>
                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex flex-col mb-[0.8vw]">
                                {isLayout4 && (
                                    <div className="flex justify-center w-full py-[0.1vw]">
                                        <Icon icon="material-symbols:drag-indicator" className="w-[1vw] h-[1vw] text-gray-400 rotate-90" />
                                    </div>
                                )}
                                <div className="flex items-center justify-between relative z-10">
                                    <h2 className={`text-[0.9vw] font-bold ${isLayout4 ? 'text-gray-900' : ''}`} style={!isLayout4 ? { color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}>
                                        Add Bookmark
                                    </h2>
                                    <button
                                        onClick={onClose}
                                        className={`w-[1.6vw] h-[1.6vw] flex items-center justify-center rounded-[0.4vw] border transition-colors ${isLayout4 ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-transparent text-white opacity-60 hover:opacity-100'}`}
                                    >
                                        <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw] stroke-[2.5]" />
                                    </button>
                                </div>
                            </div>
                            <div className={`h-[1px] w-full mb-[1vw] ${isLayout4 ? 'bg-gray-200' : ''}`} style={!isLayout4 ? { backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.3 } : {}} />

                            {/* Content Grid */}
                            <div className="flex gap-[1vw] items-start">
                                {/* Left Column: Color Selection */}
                                <div className="flex flex-col gap-[0.4vw] pt-[0.2vw]">
                                    {['#D15D6D', '#6B7CBF', '#6FAF7C', '#D8DC53', '#4A9E9E'].map((color, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] transition-all border-[1.5px] shadow-sm ${selectedColor === color ? (isLayout4 ? 'border-gray-400 scale-110' : 'border-white scale-110 shadow-lg') : (isLayout4 ? 'border-transparent hover:border-gray-300' : 'border-white/20 hover:border-white/50')}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <button
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                            setPickerTarget('background');
                                            setShowColorPicker(true);
                                        }}
                                        className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] border-[1.5px] shadow-sm hover:scale-110 transition-transform ${isLayout4 ? 'border-transparent' : 'border-white/20'}`}
                                        style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                                    />
                                </div>

                                {/* Middle Column: Bookmark Preview */}
                                <div className="flex-1 min-w-0 flex items-center justify-center pt-[0.2vw]">
                                    <div
                                        className="relative w-full h-[9vw] flex items-center justify-center shadow-md transition-all duration-300"
                                        style={{
                                            backgroundColor: hexToRgba(selectedColor, opacity),
                                            clipPath: getBookmarkClipPath(isLayout4 ? 3 : bookmarkStyle),
                                            borderRadius: getBookmarkBorderRadius(isLayout4 ? 3 : bookmarkStyle),
                                            filter: isLayout4 ? 'none' : 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))'
                                        }}
                                    >
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                            className={`text-[1.8vw] font-bold outline-none text-center px-4 cursor-text w-full ${isLayout4 ? 'font-medium' : ''}`}
                                            style={{ color: hexToRgba(textColor, textOpacity), fontFamily: 'serif' }}
                                            dangerouslySetInnerHTML={{ __html: bookmarkText }}
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Controls */}
                                <div className="w-[11.5vw] flex flex-col gap-[0.8vw]">
                                    {/* Text Color Section */}
                                    <div className="space-y-[0.4vw]">
                                        <div className="flex items-center gap-[0.3vw]">
                                            <span className={`text-[0.65vw] font-bold whitespace-nowrap ${isLayout4 ? 'text-gray-900' : 'text-white'}`} >Text Color</span>
                                            <div className={`flex-1 h-[1px] ${isLayout4 ? 'bg-gray-200' : 'bg-white/40'}`} />
                                        </div>

                                        <div className="flex items-center gap-[0.3vw]">
                                            <button
                                                className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border shadow-sm flex-shrink-0 ${isLayout4 ? 'border-gray-300 bg-white' : 'border-white/40 bg-white/20'} p-[0.15vw]`}
                                                onClick={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                                    setPickerTarget('text');
                                                    setShowColorPicker(true);
                                                }}
                                            >
                                                <div className="w-full h-full rounded-[0.2vw]" style={{ backgroundColor: textColor }} />
                                            </button>

                                            <div className={`flex-1 h-[1.8vw] rounded-[0.4vw] flex items-center px-[0.5vw] justify-between shadow-inner border transition-all ${isLayout4 ? 'bg-gray-50 border-gray-300' : 'bg-white/10 border-white/20'}`}>
                                                <span className={`text-[0.65vw] uppercase flex-1 font-bold ${isLayout4 ? 'text-gray-700' : 'text-white'}`}>{textColor}</span>
                                                <div className="flex items-center gap-0.5">
                                                    <input
                                                        type="text"
                                                        value={textOpacity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) setTextOpacity(Math.min(100, Math.max(0, val)));
                                                        }}
                                                        className={`w-[1.5vw] text-right text-[0.65vw] font-bold bg-transparent outline-none ${isLayout4 ? 'text-gray-700' : 'text-white'}`}
                                                    />
                                                    <span className={`text-[0.65vw] font-bold ${isLayout4 ? 'text-gray-400' : 'text-white/60'}`}>%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page Selection */}
                                    <div className="space-y-[0.4vw] relative">
                                        <div className="flex items-center gap-[0.3vw]">
                                            <span className={`text-[0.65vw] font-bold whitespace-nowrap ${isLayout4 ? 'text-gray-900' : 'text-white'}`}>Select Page</span>
                                            <div className={`flex-1 h-[1px] ${isLayout4 ? 'bg-gray-200' : 'bg-white/40'}`} />
                                        </div>
                                        <div
                                            onClick={() => setShowPageDropdown(!showPageDropdown)}
                                            className={`h-[1.8vw] rounded-[0.4vw] flex items-center px-[0.5vw] justify-between shadow-inner group cursor-pointer transition-colors border ${isLayout4 ? 'bg-gray-50 border-gray-300 hover:border-black' : 'bg-white/10 border-white/20 hover:border-white/50'}`}
                                        >
                                            <span className={`text-[0.65vw] font-bold ${isLayout4 ? 'text-gray-700' : 'text-white'}`}>Page {targetPageIndex + 1}</span>
                                            <Icon icon="fluent:chevron-down-24-filled" className={`w-[0.8vw] h-[0.8vw] transition-transform duration-200 ${showPageDropdown ? 'rotate-180' : ''} ${isLayout4 ? 'text-gray-400' : 'text-white/60'}`} />
                                        </div>

                                        {showPageDropdown && (
                                            <div className={`absolute top-[3.2vw] left-0 right-0 max-h-[10vw] overflow-y-auto border rounded-[0.4vw] shadow-2xl z-[150] custom-scrollbar ${isLayout4 ? 'bg-white border-gray-200' : 'bg-gray-800/90 backdrop-filter backdrop-blur-xl border-white/20'}`}>
                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => {
                                                            setTargetPageIndex(i);
                                                            setShowPageDropdown(false);
                                                        }}
                                                        className={`flex items-center px-[0.6vw] py-[0.4vw] cursor-pointer text-[0.65vw] font-bold transition-colors ${targetPageIndex === i ? (isLayout4 ? 'bg-blue-600 text-white' : 'bg-white text-gray-800') : (isLayout4 ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white')}`}
                                                    >
                                                        Page {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-[0.4vw] mt-[0.3vw]">
                                        <button
                                            onClick={onClose}
                                            className={`flex-1 h-[2vw] rounded-[0.4vw] border font-bold text-[0.65vw] flex items-center justify-center gap-[0.2vw] transition-all shadow-sm ${isLayout4 ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-white text-white hover:bg-white/10'}`}
                                        >
                                            <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => {
                                                onAddBookmark({
                                                    id: Date.now(),
                                                    label: bookmarkText,
                                                    pageIndex: targetPageIndex,
                                                    color: selectedColor,
                                                    style: bookmarkStyle,
                                                    font: bookmarkFont
                                                });
                                                onClose();
                                            }}
                                            className={`flex-1 h-[2vw] rounded-[0.4vw] font-bold text-[0.65vw] transition-all shadow-lg active:scale-[0.98] ${isLayout4 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-[#575C9C] hover:opacity-90'}`}
                                        >
                                            Add Bookmark
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const layoutIdForCheck = typeof activeLayout === 'object' ? activeLayout?.id : activeLayout;
    if (isMobile && Number(layoutIdForCheck) !== 5) {
        if (isLandscape) {
            const layoutId = typeof activeLayout === 'object' ? activeLayout?.id : activeLayout;
            if (Number(layoutId) === 2) {
                return (
                    <AddBookmarkPopupLandscape
                        onClose={onClose}
                        currentPageIndex={currentPageIndex}
                        totalPages={totalPages}
                        onAddBookmark={onAddBookmark}
                        isSidebarOpen={isSidebarOpen}
                        isSpread={isSpread}
                        bookmarkSettings={bookmarkSettings}
                        activeLayout={activeLayout}
                        layoutColors={layoutColors}
                    />
                );
            }
            if (Number(layoutId) === 4 || Number(layoutId) === 6) {
                return (
                    <div
                        className="absolute inset-0 z-[99999] pointer-events-auto flex items-center justify-center bg-transparent"
                        onClick={onClose}
                    >
                        <div
                            className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                            style={{
                                transform: (Number(layoutId) === 4 || Number(layoutId) === 6) ? 'scale(1.1) translateZ(0)' : 'scale(1.1) translateZ(0)',
                                transformOrigin: 'center center'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {renderDesktopLayout()}
                        </div>
                    </div>
                );
            }
            if (Number(layoutId || 3) === 3) {
                return (
                    <>
                        <div
                            className="absolute inset-0 z-[99999] pointer-events-auto flex items-center justify-center bg-transparent"
                            onClick={onClose}
                        >
                            <div
                                className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                                style={{ transform: 'scale(0.62)', transformOrigin: 'center center' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DesktopLayout3
                                    onClose={onClose} selectedColor={selectedColor} setSelectedColor={setSelectedColor}
                                    textColor={textColor} setTextColor={setTextColor} opacity={opacity} setOpacity={setOpacity}
                                    textOpacity={textOpacity} setTextOpacity={setTextOpacity} bookmarkText={bookmarkText}
                                    setBookmarkText={setBookmarkText} targetPageIndex={targetPageIndex} setTargetPageIndex={setTargetPageIndex}
                                    totalPages={totalPages} isSidebarOpen={isSidebarOpen} showColorPicker={showColorPicker}
                                    setShowColorPicker={setShowColorPicker} pickerTarget={pickerTarget} setPickerTarget={setPickerTarget}
                                    setPickerPos={setPickerPos} pickerPos={pickerPos} bookmarkStyle={bookmarkStyle}
                                    bookmarkFont={bookmarkFont} onAddBookmark={onAddBookmark} getLayoutColor={getLayoutColor}
                                    getLayoutColorRgba={getLayoutColorRgba} getLayoutColorAlpha={getLayoutColorAlpha} hexToRgba={hexToRgba}
                                    getBookmarkClipPath={getBookmarkClipPath} getBookmarkBorderRadius={getBookmarkBorderRadius}
                                    Icon={Icon} isMobileLandscape={true}
                                />
                            </div>
                        </div>
                        {showColorPicker && (
                            <ColorPallet
                                smallMode={true}
                                color={pickerTarget === 'background' ? selectedColor : textColor}
                                onChange={(newColor) => {
                                    if (pickerTarget === 'background') setSelectedColor(newColor);
                                    else setTextColor(newColor);
                                }}
                                opacity={pickerTarget === 'background' ? opacity : textOpacity}
                                onOpacityChange={(newOpacity) => {
                                    if (pickerTarget === 'background') setOpacity(newOpacity);
                                    else setTextOpacity(newOpacity);
                                }}
                                onClose={() => setShowColorPicker(false)}
                                style={{
                                    position: 'fixed',
                                    top: pickerPos.y,
                                    left: pickerPos.x,
                                    zIndex: 999999,
                                    transform: 'none'
                                }}
                            />
                        )}
                    </>
                );
            }
            return (
                <div
                    className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-auto"
                    onClick={onClose}
                >
                    <div
                        className="pointer-events-auto rounded-[1.5vw] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 flex flex-col"
                        style={{
                            width: '30vw',
                            maxHeight: '75vh',
                            backgroundColor: 'rgba(87, 92, 156, 0.92)',
                            backdropFilter: 'blur(12px)',
                            padding: '0.6vw 0.8vw',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-[0.4vw]">
                            <span className="text-[0.9vw] font-bold text-white">Add Bookmark</span>
                            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                                <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                            </button>
                        </div>
                        <div className="h-[1px] bg-white/20 mb-[0.6vw]" />

                        <div className="flex gap-[0.6vw] items-start">
                            {/* Left Column: Color swatches + Bookmark Preview */}
                            <div className="flex gap-[0.5vw] items-start flex-shrink-0">
                                {/* Color swatches */}
                                <div className="flex flex-col gap-[0.4vw] pt-[0.1vw]">
                                    {['#D15D6D', '#6B7CBF', '#6FAF7C', '#D8DC53'].map((color, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedColor(color)}
                                            className={`rounded-full border-[1.5px] transition-all ${selectedColor === color ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'}`}
                                            style={{ backgroundColor: color, width: '1.4vw', height: '1.4vw' }}
                                        />
                                    ))}
                                    <button
                                        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPickerPos({ x: r.right + 6, y: r.top - 80 }); setPickerTarget('background'); setShowColorPicker(true); }}
                                        className="rounded-full border-[1.5px] border-white/30 hover:scale-110 transition-transform"
                                        style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', width: '1.4vw', height: '1.4vw' }}
                                    />
                                </div>

                                {/* Bookmark Preview */}
                                <div
                                    className="flex items-center justify-center"
                                    style={{
                                        width: '12vw',
                                        height: '9vw',
                                        backgroundColor: hexToRgba(selectedColor, opacity),
                                        clipPath: getBookmarkClipPath(bookmarkStyle),
                                        borderRadius: getBookmarkBorderRadius(bookmarkStyle),
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        className="font-bold outline-none text-center w-full px-[0.5vw] text-white cursor-text"
                                        style={{ fontSize: '0.75vw' }}
                                        dangerouslySetInnerHTML={{ __html: bookmarkText }}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Text Color + Add on + Buttons */}
                            <div className="flex-1 flex flex-col gap-[0.5vw]">
                                {/* Text Color row */}
                                <div className="flex items-center gap-[0.4vw]">
                                    <span className="font-bold text-white whitespace-nowrap" style={{ fontSize: '0.7vw' }}>Text Color</span>
                                    <div className="flex-1 h-[1px] bg-white/20" />
                                </div>
                                <div className="flex items-center gap-[0.4vw]">
                                    <button
                                        className="rounded-[0.3vw] border border-white/40 flex-shrink-0"
                                        style={{ backgroundColor: textColor, width: '1.6vw', height: '1.6vw' }}
                                        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPickerPos({ x: r.right + 6, y: r.top - 80 }); setPickerTarget('text'); setShowColorPicker(true); }}
                                    />
                                    <div className="flex-1 bg-white/10 border border-white/20 rounded-[0.3vw] flex items-center px-[0.4vw] justify-between" style={{ height: '1.6vw' }}>
                                        <span className="font-bold text-white uppercase" style={{ fontSize: '0.65vw' }}>{textColor}</span>
                                        <span className="text-white/50" style={{ fontSize: '0.65vw' }}>{textOpacity}%</span>
                                    </div>
                                </div>

                                {/* Page selector */}
                                <div className="flex items-center gap-[0.4vw]">
                                    <span className="font-bold text-white whitespace-nowrap" style={{ fontSize: '0.7vw' }}>Add on</span>
                                    <div className="flex-1 h-[1px] bg-white/20" />
                                </div>
                                <div className="relative">
                                    <div
                                        className="bg-white/10 border border-white/20 rounded-[0.3vw] flex items-center px-[0.4vw] justify-between cursor-pointer hover:bg-white/20 transition-colors"
                                        style={{ height: '1.8vw' }}
                                        onClick={() => setShowPageDropdown(!showPageDropdown)}
                                    >
                                        <span className="font-bold text-white" style={{ fontSize: '0.7vw' }}>Page {targetPageIndex + 1}</span>
                                        <Icon icon="fluent:chevron-down-24-filled" className={`text-white/50 transition-transform ${showPageDropdown ? 'rotate-180' : ''}`} style={{ width: '0.7vw', height: '0.7vw' }} />
                                    </div>
                                    {showPageDropdown && (
                                        <div className="absolute bottom-[1.8vw] left-0 right-0 max-h-[8vw] overflow-y-auto rounded-[0.3vw] border border-white/20 shadow-2xl z-[150]"
                                            style={{ backgroundColor: 'rgba(60, 65, 120, 0.95)', backdropFilter: 'blur(10px)' }}>
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <div key={i} onClick={() => { setTargetPageIndex(i); setShowPageDropdown(false); }}
                                                    className={`px-[0.4vw] py-[0.2vw] font-bold cursor-pointer transition-colors ${targetPageIndex === i ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'}`}
                                                    style={{ fontSize: '0.65vw' }}>
                                                    Page {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-[0.4vw]">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 rounded-[0.3vw] border border-white/30 text-white font-bold hover:bg-white/10 transition-colors"
                                        style={{ height: '1.6vw', fontSize: '0.7vw' }}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAddBookmark({ id: Date.now(), label: bookmarkText, pageIndex: targetPageIndex, color: selectedColor, style: bookmarkStyle, font: bookmarkFont });
                                            onClose();
                                        }}
                                        className="flex-1 rounded-[0.3vw] bg-white text-gray-800 font-bold hover:opacity-90 transition-opacity"
                                        style={{ height: '1.6vw', fontSize: '0.7vw' }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {showColorPicker && (
                            <div className="absolute inset-0 z-[200] flex items-center justify-center" onClick={() => setShowColorPicker(false)}>
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ transform: 'scale(0.80)', transformOrigin: 'center center' }}
                                >
                                    <ColorPallet smallMode={true} color={pickerTarget === 'text' ? textColor : selectedColor}
                                        position={{ x: 10, y: -100 }} opacity={opacity}
                                        onOpacityChange={(val) => setOpacity(val)}
                                        onChange={(color) => { if (pickerTarget === 'text') setTextColor(color); else setSelectedColor(color); }}
                                        onClose={() => setShowColorPicker(false)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (activeLayout == 2) {
            return (
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center pointer-events-auto bg-black/5 px-4"
                    onClick={onClose}
                >
                    <div
                        className="w-[85%] max-w-[310px] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden bg-white/60 backdrop-blur-xl p-[5px] border border-white/20 rounded-[22px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full h-full bg-[#575C9C] rounded-[17px] p-3.5 flex flex-col gap-2.5 shadow-inner">
                            {/* Header */}
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-[16px] font-bold text-white whitespace-nowrap">Add Bookmark</h2>
                                <div className="flex-1 h-[1px] bg-white/20"></div>
                                <button
                                    onClick={onClose}
                                    className="w-7 h-7 rounded-lg border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-sm"
                                >
                                    <Icon icon="lucide:x" className="w-4 h-4 stroke-[2.5]" />
                                </button>
                            </div>

                            {/* Bookmark Preview */}
                            <div className="w-full flex items-center justify-center py-1">
                                <div
                                    className="relative h-[85px] w-full flex shadow-xl transition-all duration-300"
                                    style={{
                                        backgroundColor: hexToRgba(selectedColor, opacity),
                                        clipPath: getBookmarkClipPath(bookmarkStyle),
                                        borderRadius: getBookmarkBorderRadius(bookmarkStyle)
                                    }}
                                >
                                    <div className="h-full flex-1 flex items-center justify-center p-2">
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                            className="text-[20px] font-bold outline-none text-center w-full cursor-text text-white drop-shadow-md"
                                            style={{ fontFamily: 'serif' }}
                                            dangerouslySetInnerHTML={{ __html: bookmarkText || `Page ${targetPageIndex + 1}` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div className="flex items-center justify-between px-0.5">
                                {['#31B0B0', '#C68798', '#D6566E', '#6B7DBB', '#67AC78', '#D8DC53', '#23D295'].map((color, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-5 h-5 rounded-full transition-all shadow-sm border-2 ${selectedColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <button
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.right, y: rect.top - 200 });
                                        setPickerTarget('background');
                                        setShowColorPicker(true);
                                    }}
                                    className="w-5 h-5 rounded-full shadow-sm bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] border border-white/20"
                                />
                            </div>

                            {/* Text Color Selection */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold text-white whitespace-nowrap">Text Color</span>
                                    <div className="flex-1 h-[1px] bg-white/10"></div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <button
                                        className="w-8 h-8 rounded-lg border border-white/20 shadow-sm flex-shrink-0 bg-white p-[1.5px] transition-transform active:scale-95"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.left, y: rect.top - 200 });
                                            setPickerTarget('text');
                                            setShowColorPicker(true);
                                        }}
                                    >
                                        <div className="w-full h-full rounded-[6px] shadow-inner" style={{ backgroundColor: textColor }} />
                                    </button>
                                    <div className="flex-1 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center px-3 justify-between backdrop-blur-sm">
                                        <span className="text-[12px] font-bold text-white uppercase">{textColor}</span>
                                        <span className="text-[12px] font-bold text-white/40">{textOpacity}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Page Selection */}
                            <div className="flex flex-col gap-1.5 relative">
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold text-white whitespace-nowrap">Add on Page</span>
                                    <div className="flex-1 h-[1px] bg-white/10"></div>
                                </div>
                                <div
                                    onClick={() => setShowPageDropdown(!showPageDropdown)}
                                    className="h-8 bg-white/10 border border-white/20 rounded-lg flex items-center px-3 justify-between cursor-pointer hover:bg-white/20 transition-all backdrop-blur-sm"
                                >
                                    <span className="text-[12px] font-bold text-white">Page {targetPageIndex + 1}</span>
                                    <Icon icon="fluent:chevron-down-24-filled" className={`w-4 h-4 text-white/40 transition-transform duration-300 ${showPageDropdown ? 'rotate-180' : ''}`} />
                                </div>
                                {showPageDropdown && (
                                    <div className="absolute bottom-full left-0 right-0 mb-2 max-h-[140px] overflow-y-auto rounded-xl border border-white/20 shadow-2xl z-[150] bg-[#464A85]/95 backdrop-blur-xl custom-scrollbar animate-in slide-in-from-bottom-2 duration-200">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <div key={i} onClick={() => { setTargetPageIndex(i); setShowPageDropdown(false); }}
                                                className={`px-4 py-2.5 text-[12px] font-bold cursor-pointer transition-colors border-b border-white/5 last:border-b-0 ${targetPageIndex === i ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Button */}
                            <button
                                className="w-full bg-white text-[#575C9C] rounded-[16px] py-2.5 flex flex-col items-center justify-center shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all mt-0.5"
                                onClick={() => {
                                    onAddBookmark({
                                        id: Date.now(),
                                        label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                        pageIndex: targetPageIndex,
                                        color: selectedColor,
                                        style: bookmarkStyle,
                                        font: bookmarkFont
                                    });
                                    onClose();
                                }}
                            >
                                <span className="text-[14px] font-bold">Add Bookmark</span>
                                <span className="text-[10px] font-medium opacity-60">Page - {targetPageIndex + 1}</span>
                            </button>
                        </div>

                        {/* Color Picker Overlay */}
                        {showColorPicker && (
                            <div className="fixed inset-0 z-[1000] flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowColorPicker(false)}>
                                <div onClick={e => e.stopPropagation()} className="relative">
                                    <ColorPallet
                                        smallMode={true}
                                        color={pickerTarget === 'text' ? textColor : selectedColor}
                                        opacity={pickerTarget === 'text' ? textOpacity : opacity}
                                        onOpacityChange={(val) => { if (pickerTarget === 'text') setTextOpacity(val); else setOpacity(val); }}
                                        onChange={(color) => { if (pickerTarget === 'text') setTextColor(color); else setSelectedColor(color); }}
                                        onClose={() => setShowColorPicker(false)}
                                        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 999999 }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (activeLayout == 4) {
            return (
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center pointer-events-auto bg-black/20 px-6"
                    onClick={onClose}
                >
                    <div
                        className={`bg-white rounded-[14px] shadow-2xl p-3 ${isMobileLandscape ? 'w-[280px]' : 'w-[210px]'} relative animate-in zoom-in-95 duration-200`}
                        style={{
                            transform: isMobileLandscape ? 'scale(1.1) translateZ(0)' : 'none',
                            transformOrigin: 'center center',
                            backfaceVisibility: 'hidden',
                            WebkitFontSmoothing: 'antialiased',
                            textRendering: 'optimizeLegibility'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-1.5 mb-3">
                            <h2 className={`${isMobileLandscape ? 'text-[16px]' : 'text-[12px]'} font-bold text-gray-900 whitespace-nowrap`}>Add Bookmark</h2>
                            <div className="flex-1 h-[0.8px] bg-gray-100"></div>
                            <button
                                onClick={onClose}
                                className="w-[20px] h-[20px] rounded-full border-[1.2px] border-[#373D8A] flex items-center justify-center text-[#373D8A] hover:bg-blue-50 transition-colors shadow-sm"
                            >
                                <Icon icon="lucide:x" className="w-[12px] h-[12px] stroke-[3]" />
                            </button>
                        </div>

                        {/* Bookmark Preview */}
                        <div className="w-full flex items-center justify-center mb-3">
                            <div
                                className={`relative w-full ${isMobileLandscape ? 'h-[100px]' : 'h-[70px]'} flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.06)] transition-all duration-300`}
                                style={{
                                    backgroundColor: hexToRgba(selectedColor, opacity),
                                    clipPath: getBookmarkClipPath(bookmarkStyle),
                                    borderRadius: '2px 0 0 2px'
                                }}
                            >
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    className={`${isMobileLandscape ? 'text-[18px]' : 'text-[13px]'} font-bold outline-none text-center w-full px-4 cursor-text`}
                                    style={{ color: textColor, fontFamily: bookmarkFont }}
                                    dangerouslySetInnerHTML={{ __html: bookmarkText }}
                                />
                            </div>
                        </div>

                        {/* Color Palette */}
                        <div className="flex items-center justify-between mb-3">
                            {['#34B1AA', '#C68899', '#D6566E', '#6A7DBB', '#68AC77', '#D9DC54'].map((color, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-[15px] h-[15px] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xs border-[1px] ${selectedColor === color ? 'border-gray-800' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.left - 100, y: rect.top - 280 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-[15px] h-[15px] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xs bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] border-[1px] border-transparent"
                            />
                        </div>

                        {/* Text Color Selection */}
                        <div className="flex flex-col gap-0.5 mb-4">
                            <div className="flex items-center gap-1.5">
                                <span className={`${isMobileLandscape ? 'text-[13px]' : 'text-[10px]'} font-bold text-gray-900 whitespace-nowrap`}>Text Color</span>
                                <div className="flex-1 h-[0.8px] bg-gray-100"></div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="w-[26px] h-[26px] rounded-[4px] border-[0.8px] border-gray-200 shadow-sm cursor-pointer flex-shrink-0"
                                    style={{ backgroundColor: textColor }}
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.left, y: rect.top - 280 });
                                        setPickerTarget('text');
                                        setShowColorPicker(true);
                                    }}
                                />
                                <div className="flex-1 h-[26px] flex items-center justify-between border-[0.8px] border-gray-200 rounded-[4px] px-2 bg-white">
                                    <span className={`${isMobileLandscape ? 'text-[12px]' : 'text-[9px]'} font-medium text-gray-500 uppercase`}>{textColor}</span>
                                    <span className={`${isMobileLandscape ? 'text-[12px]' : 'text-[9px]'} text-gray-400 font-medium`}>{opacity}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Final Add Button */}
                        <button
                            className="w-full bg-black text-white rounded-[6px] py-1.5 flex flex-col items-center justify-center shadow-[0_3px_10px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all"
                            onClick={() => {
                                onAddBookmark({
                                    id: Date.now(),
                                    label: bookmarkText,
                                    pageIndex: currentPageIndex,
                                    color: selectedColor,
                                    style: bookmarkStyle,
                                    font: bookmarkFont
                                });
                                onClose();
                            }}
                        >
                            <span className={`${isMobileLandscape ? 'text-[14px]' : 'text-[10px]'} font-bold`}>Add Bookmark</span>
                            <span className={`${isMobileLandscape ? 'text-[12px]' : 'text-[8px]'} font-medium opacity-80 mt-0.5`}>Page - {currentPage}</span>
                        </button>
                    </div>

                    {/* Mobile Color Picker Overlay */}
                    {showColorPicker && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent" onClick={() => setShowColorPicker(false)}>
                            <div onClick={e => e.stopPropagation()}>
                                <ColorPallet
                                    smallMode={true}
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
            );
        }

        const isLayout2 = activeLayout == 2;
        const isLayout1Or3 = !activeLayout || activeLayout == 1 || activeLayout == 3;
        
        return (
            <div
                className="fixed inset-0 z-[999999] flex items-center justify-center pointer-events-auto bg-black/20"
                onClick={onClose}
            >
                <div
                    className={`w-[calc(100%-32px)] shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 outline-none ${isLayout2 ? 'max-w-[340px] p-1 rounded-[1.2rem]' : (isLayout1Or3 ? 'max-w-[280px] p-3.5 gap-2.5 rounded-[1.2rem] border border-white/20 bg-[#575C9C]/80 backdrop-blur-md' : 'max-w-[280px] p-3.5 gap-2.5 rounded-[1.2rem] border border-gray-100 bg-white')}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={isLayout2 ? "bg-white rounded-[1rem] p-4 flex flex-col gap-3" : "flex flex-col gap-2.5 h-full"}>
                        {/* Header */}
                        <div className="flex items-center gap-2">
                            <span className={`text-[16px] font-bold flex-shrink-0 ${isLayout1Or3 && !isLayout2 ? 'text-white' : 'text-gray-900'}`}>Add Bookmark</span>
                            <div className={`flex-1 h-px ${isLayout1Or3 && !isLayout2 ? 'bg-white/20' : 'bg-gray-100'}`} />
                            <button
                                onClick={onClose}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors focus:outline-none ${isLayout1Or3 && !isLayout2 ? 'bg-white/10 border border-white/30 text-white hover:bg-white/20' : 'bg-white border border-[#373D8A]/30 text-[#373D8A] hover:bg-gray-50'}`}
                            >
                                <Icon icon="lucide:x" className="w-[16px] h-[16px]" />
                            </button>
                        </div>

                        {/* Bookmark Preview */}
                        <div className="w-full flex items-center justify-center">
                            <div
                                className={`relative w-full ${isLayout2 ? 'h-[160px]' : 'h-[120px]'} flex items-center justify-center shadow-sm transition-all duration-300 ${isLayout1Or3 && !isLayout2 ? '' : 'border border-gray-100'}`}
                                style={{
                                    backgroundColor: hexToRgba(selectedColor, opacity),
                                    clipPath: getBookmarkClipPath(bookmarkStyle),
                                    borderRadius: getBookmarkBorderRadius(bookmarkStyle)
                                }}
                            >
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    className="text-[18px] font-bold outline-none text-center w-full px-4 cursor-text"
                                    style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
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
                            <span className={`text-[14px] font-bold ${isLayout1Or3 && !isLayout2 ? 'text-white' : 'text-gray-900'}`}>Text Color</span>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-[36px] h-[36px] rounded-[10px] border shadow-sm cursor-pointer flex-shrink-0 ${isLayout1Or3 && !isLayout2 ? 'border-white/40 bg-white/20' : 'border-gray-200'}`}
                                    style={{ backgroundColor: textColor }}
                                    onClick={() => {
                                        setPickerTarget('text');
                                        setShowColorPicker(true);
                                    }}
                                />
                                <div className={`flex-1 flex items-center justify-between border rounded-[10px] px-3 py-2 ${isLayout1Or3 && !isLayout2 ? 'border-white/20 bg-white/10' : 'border-gray-200 bg-gray-50'}`}>
                                    <span className={`text-[13px] font-bold uppercase ${isLayout1Or3 && !isLayout2 ? 'text-white' : 'text-gray-700'}`}>{textColor}</span>
                                    <span className={`text-[13px] font-bold ${isLayout1Or3 && !isLayout2 ? 'text-white/60' : 'text-gray-400'}`}>{opacity}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Page Select Dropdown - Layout 1 portrait only */}
                        {isLayout1Or3 && !isLayout2 && (
                            <div className="flex flex-col gap-1.5 relative">
                                <span className="text-[14px] font-bold text-white">Add on Page</span>
                                <div
                                    className="flex items-center justify-between border border-white/20 rounded-[10px] px-3 py-2 bg-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                                    onClick={() => setShowPageDropdown(prev => !prev)}
                                >
                                    <span className="text-[13px] font-bold text-white">Page {targetPageIndex + 1}</span>
                                    <Icon
                                        icon="fluent:chevron-down-24-filled"
                                        className={`w-4 h-4 text-white/60 transition-transform duration-200 ${showPageDropdown ? 'rotate-180' : ''}`}
                                    />
                                </div>
                                {showPageDropdown && (
                                    <div className="absolute top-[3.8rem] left-0 right-0 max-h-[140px] overflow-y-auto rounded-[10px] border border-white/20 shadow-2xl z-[220] custom-scrollbar"
                                        style={{ backgroundColor: 'rgba(87, 92, 156, 0.95)', backdropFilter: 'blur(12px)' }}
                                    >
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => { setTargetPageIndex(i); setShowPageDropdown(false); }}
                                                className={`px-3 py-2 text-[13px] font-bold cursor-pointer transition-colors ${targetPageIndex === i ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add Bookmark Button */}
                        <button
                            className={`w-full bg-white text-[#575C9C] rounded-xl ${isLayout2 ? 'py-3' : 'py-2'} flex flex-col items-center justify-center shadow-lg hover:bg-white/90 transition-colors`}
                            onClick={() => {
                                onAddBookmark({
                                    id: Date.now(),
                                    label: bookmarkText,
                                    pageIndex: isLayout1Or3 && !isLayout2 ? targetPageIndex : currentPageIndex,
                                    color: selectedColor,
                                    style: bookmarkStyle,
                                    font: bookmarkFont
                                });
                                onClose();
                            }}
                        >
                            <span className="text-[14px] font-bold">Add Bookmark</span>
                            <span className="text-[11px] font-medium opacity-60">Page - {isLayout1Or3 && !isLayout2 ? targetPageIndex + 1 : currentPage}</span>
                        </button>
                    </div>

                    {showColorPicker && (
                        <div className="absolute inset-0 z-[200] flex items-center justify-center" onClick={() => setShowColorPicker(false)}>
                            <div onClick={e => e.stopPropagation()}>
                                <ColorPallet
                                    smallMode={true}
                                    color={pickerTarget === 'text' ? textColor : selectedColor}
                                    onChange={(color) => {
                                        if (pickerTarget === 'text') setTextColor(color);
                                        else setSelectedColor(color);
                                    }}
                                    opacity={pickerTarget === 'text' ? textOpacity : opacity}
                                    onOpacityChange={(val) => {
                                        if (pickerTarget === 'text') setTextOpacity(val);
                                        else setOpacity(val);
                                    }}
                                    onClose={() => setShowColorPicker(false)}
                                    style={{
                                        position: 'fixed',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    inline={false}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (activeLayout == 1 && !isMobile) {
        const isLayout4 = activeLayout == 4;
        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5 px-[2vw]"
                onClick={onClose}
            >
                <div
                    className="rounded-[1.2vw] shadow-2xl p-[1vw] w-[35vw] relative animate-in zoom-in-95 duration-200 border select-none overflow-visible transition-transform duration-300"
                    style={{
                        backgroundColor: isLayout4 ? '#FFFFFF' : getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                        borderColor: isLayout4 ? '#e5e7eb' : 'rgba(255,255,255,0.2)',
                        backdropFilter: isLayout4 ? 'none' : 'blur(12px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        transform: isSidebarOpen ? 'translate(8vw, 0)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex flex-col mb-[0.8vw]">
                        {isLayout4 && (
                            <div className="flex justify-center w-full py-[0.1vw]">
                                <Icon icon="material-symbols:drag-indicator" className="w-[1vw] h-[1vw] text-gray-400 rotate-90" />
                            </div>
                        )}
                        <div className="flex items-center justify-between relative z-10">
                            <h2 className={`text-[0.9vw] font-bold ${isLayout4 ? 'text-gray-900' : ''}`} style={!isLayout4 ? { color: getLayoutColor('dropdown-text', '#FFFFFF') } : {}}>
                                Add Bookmark
                            </h2>
                            <button
                                onClick={onClose}
                                className={`w-[1.6vw] h-[1.6vw] flex items-center justify-center rounded-[0.4vw] border transition-colors ${isLayout4 ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-transparent text-white opacity-60 hover:opacity-100'}`}
                            >
                                <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw] stroke-[2.5]" />
                            </button>
                        </div>
                    </div>
                    <div className={`h-[1px] w-full mb-[1vw] ${isLayout4 ? 'bg-gray-200' : ''}`} style={!isLayout4 ? { backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.3 } : {}} />

                    {/* Content Grid */}
                    <div className="flex gap-[1vw] items-start">
                        {/* Left Column: Color Selection */}
                        <div className="flex flex-col gap-[0.4vw] pt-[0.2vw]">
                            {['#D15D6D', '#6B7CBF', '#6FAF7C', '#D8DC53'].map((color, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-[1.6vw] h-[1.6vw] rounded-full transition-all border-[1.5px] shadow-sm ${selectedColor === color ? (isLayout4 ? 'border-gray-400 scale-110' : 'border-white scale-110 shadow-lg') : (isLayout4 ? 'border-transparent hover:border-gray-300' : 'border-white/20 hover:border-white/50')}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className={`w-[1.6vw] h-[1.6vw] rounded-full border-[1.5px] shadow-sm hover:scale-110 transition-transform ${isLayout4 ? 'border-transparent' : 'border-white/20'}`}
                                style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                            />
                        </div>

                        {/* Middle Column: Bookmark Preview */}
                        <div className="flex-1 min-w-0 flex items-center justify-center pt-[0.2vw]">
                            <div
                                className="relative w-full h-[9vw] flex items-center justify-center shadow-md transition-all duration-300"
                                style={{
                                    backgroundColor: hexToRgba(selectedColor, opacity),
                                    clipPath: getBookmarkClipPath(isLayout4 ? 3 : bookmarkStyle),
                                    borderRadius: getBookmarkBorderRadius(isLayout4 ? 3 : bookmarkStyle),
                                    filter: isLayout4 ? 'none' : 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))'
                                }}
                            >
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    className={`text-[1.3vw] font-bold outline-none text-center px-4 cursor-text w-full ${isLayout4 ? 'font-medium' : ''}`}
                                    style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                    dangerouslySetInnerHTML={{ __html: bookmarkText }}
                                />
                            </div>
                        </div>

                        {/* Right Column: Controls */}
                        <div className="w-[11.5vw] flex flex-col gap-[0.8vw]">
                            {/* Text Color Section */}
                            <div className="space-y-[0.4vw]">
                                <div className="flex items-center gap-[0.3vw]">
                                    <span className={`text-[0.65vw] font-bold whitespace-nowrap ${isLayout4 ? 'text-gray-900' : 'text-white'}`} >Text Color</span>
                                    <div className={`flex-1 h-[1px] ${isLayout4 ? 'bg-gray-200' : 'bg-white/40'}`} />
                                </div>

                                <div className="flex items-center gap-[0.3vw]">
                                    <button
                                        className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border shadow-sm flex-shrink-0 ${isLayout4 ? 'border-gray-300 bg-white' : 'border-white/40 bg-white/20'} p-[0.15vw]`}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                            setPickerTarget('text');
                                            setShowColorPicker(true);
                                        }}
                                    >
                                        <div className="w-full h-full rounded-[0.2vw]" style={{ backgroundColor: textColor }} />
                                    </button>

                                    <div className={`flex-1 h-[1.8vw] rounded-[0.4vw] flex items-center px-[0.5vw] justify-between shadow-inner border transition-all ${isLayout4 ? 'bg-gray-50 border-gray-300' : 'bg-white/10 border-white/20'}`}>
                                        <input
                                            type="text"
                                            value={textColor}
                                            onChange={(e) => setTextColor(e.target.value)}
                                            className={`text-[0.65vw] font-bold bg-transparent border-none outline-none w-[4vw] ${isLayout4 ? 'text-gray-700' : 'text-white'}`}
                                        />
                                        <span className={`text-[0.6vw] font-bold ${isLayout4 ? 'text-gray-400' : 'text-white/60'}`} >{textOpacity}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Page Selection Section */}
                            <div className="space-y-[0.4vw] relative">
                                <div className="flex items-center gap-[0.3vw]">
                                    <span className={`text-[0.65vw] font-bold whitespace-nowrap ${isLayout4 ? 'text-gray-900' : 'text-white'}`} >Add Bookmark on</span>
                                    <div className={`flex-1 h-[1px] ${isLayout4 ? 'bg-gray-200' : 'bg-white/40'}`} />
                                </div>
                                <div
                                    onClick={() => setShowPageDropdown(!showPageDropdown)}
                                    className={`h-[1.8vw] rounded-[0.4vw] flex items-center px-[0.5vw] justify-between shadow-inner group cursor-pointer transition-colors border ${isLayout4 ? 'bg-white border-gray-300' : 'bg-white/10 border-white/20'}`}
                                >
                                    <span className={`text-[0.65vw] font-bold ${isLayout4 ? 'text-gray-700' : 'text-white'}`}>Page {targetPageIndex + 1}</span>
                                    <Icon icon="fluent:chevron-down-24-filled" className={`w-[0.8vw] h-[0.8vw] transition-transform duration-200 ${showPageDropdown ? 'rotate-180' : ''} ${isLayout4 ? 'text-gray-400' : 'text-white/60'}`} />
                                </div>

                                {showPageDropdown && (
                                    <div className={`absolute top-[3.2vw] left-0 right-0 max-h-[10vw] overflow-y-auto border rounded-[0.4vw] shadow-2xl z-[150] custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200 ${isLayout4 ? 'bg-white border-gray-200' : 'bg-white/10 border-white/20 backdrop-filter backdrop-blur-xl'}`}
                                        style={!isLayout4 ? { backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8') } : {}}>
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setTargetPageIndex(i);
                                                    setShowPageDropdown(false);
                                                }}
                                                className={`flex items-center px-[0.6vw] py-[0.4vw] cursor-pointer text-[0.65vw] font-bold transition-colors ${targetPageIndex === i ? (isLayout4 ? 'bg-black text-white' : 'bg-white text-[#575C9C]') : 'hover:bg-white/10 text-current'}`}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-[0.4vw] mt-[0.3vw]">
                                <button
                                    onClick={() => {
                                        setSelectedColor('#D15D6D');
                                        setTextColor('#FFFFFF');
                                        setBookmarkText(`Page ${currentPageIndex + 1}`);
                                        setTargetPageIndex(currentPageIndex);
                                    }}
                                    className={`flex-1 h-[2vw] rounded-[0.4vw] border font-bold text-[0.65vw] flex items-center justify-center gap-[0.2vw] transition-all shadow-sm ${isLayout4 ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-white/40 text-white hover:bg-white/10'}`}
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        onAddBookmark({
                                            id: Date.now(),
                                            label: bookmarkText,
                                            pageIndex: targetPageIndex,
                                            color: selectedColor,
                                            style: isLayout4 ? 3 : bookmarkStyle,
                                            font: bookmarkFont
                                        });
                                        onClose();
                                    }}
                                    className={`flex-1 h-[2vw] rounded-[0.4vw] font-bold text-[0.65vw] transition-all shadow-lg active:scale-[0.98] ${isLayout4 ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-[#575C9C] hover:opacity-90'}`}
                                >
                                    Add Bookmark
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {showColorPicker && (
                    <ColorPallet
                        smallMode={true}
                        color={pickerTarget === 'background' ? selectedColor : textColor}
                        onChange={(newColor) => {
                            if (pickerTarget === 'background') setSelectedColor(newColor);
                            else setTextColor(newColor);
                        }}
                        opacity={pickerTarget === 'background' ? opacity : textOpacity}
                        onOpacityChange={(newOpacity) => {
                            if (pickerTarget === 'background') setOpacity(newOpacity);
                            else setTextOpacity(newOpacity);
                        }}
                        onClose={() => setShowColorPicker(false)}
                        style={{
                            position: 'fixed',
                            top: pickerPos.y,
                            left: pickerPos.x,
                            transform: 'none'
                        }}
                    />
                )}
            </div>
        );
    }

    if (Number(layoutIdForCheck) === 5 && (!isMobile || isMobileLandscape)) {
        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5 px-[2vw]"
                onClick={onClose}
            >
                <div
                    className={`rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.08)] w-[520px] relative animate-in zoom-in-95 duration-200 select-none border ${isMobileLandscape ? 'max-h-[95vh] overflow-y-auto no-scrollbar' : 'overflow-visible'}`}
                    style={{
                        transform: isMobileLandscape ? 'scale(1.05) translateZ(0)' : (isSidebarOpen ? 'translate(8vw, 0)' : 'none'),
                        transformOrigin: 'center center',
                        backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '0.98'),
                        color: getLayoutColor('dropdown-text', '#000000'),
                        borderColor: getLayoutColor('dropdown-text', '#000000'),
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'antialiased',
                        textRendering: 'optimizeLegibility'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-3 pb-1">
                        <h2 className="text-[17px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#000000') }}>Add Bookmark</h2>
                        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                            <Icon icon="lucide:x" className="w-5 h-5" style={{ color: getLayoutColor('dropdown-text', '#000000') }} />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="flex gap-4 px-6 pt-1 pb-4">
                        {/* Left: Color Column */}
                        <div className="flex flex-col gap-[8px]">
                            {['#D15D6D', '#6B7DBB', '#6FAF75', '#E0DA57', '#34B0AE'].map((color, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-[26px] h-[26px] rounded-[6px] block transition-all border shadow-sm ${selectedColor === color ? 'border-gray-800 scale-105 shadow-md' : 'border-transparent hover:border-gray-300'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-[26px] h-[26px] rounded-[6px] shadow-sm transition-transform hover:scale-105 border border-transparent"
                                style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                            />
                        </div>

                        {/* Middle: Ribbon Preview */}
                        <div className="flex-1 min-w-[200px] flex items-stretch">
                            <div
                                className="relative w-full shadow-lg transition-all duration-300 flex items-center justify-center py-3 px-4 pr-10"
                                style={{
                                    backgroundColor: hexToRgba(selectedColor, opacity),
                                    clipPath: getBookmarkClipPath(bookmarkStyle),
                                    borderRadius: getBookmarkBorderRadius(bookmarkStyle)
                                }}
                            >
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    className="text-[20px] font-medium outline-none text-center w-full bg-transparent cursor-text"
                                    style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                    dangerouslySetInnerHTML={{ __html: bookmarkText || `Page ${targetPageIndex + 1}` }}
                                />
                            </div>
                        </div>

                        {/* Right: Controls */}
                        <div className="w-[200px] flex flex-col justify-between pt-0">
                            <div>
                                {/* Text Color Section */}
                                <div className="space-y-1.5 mb-4">
                                    <span className="text-[13px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#000000') }}>Text Color</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="w-[32px] h-[32px] rounded-[8px] border border-gray-300 p-[3px] bg-white flex-shrink-0"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                                setPickerTarget('text');
                                                setShowColorPicker(true);
                                            }}
                                        >
                                            <div className="w-full h-full rounded-[4px]" style={{ backgroundColor: textColor }} />
                                        </button>
                                        <div className="flex-1 h-[32px] flex items-center justify-between border border-gray-300 rounded-[8px] px-3 bg-white shadow-sm">
                                            <input
                                                type="text"
                                                value={textColor}
                                                onChange={(e) => setTextColor(e.target.value)}
                                                className="text-[12px] text-gray-700 bg-transparent border-none outline-none w-[60px] uppercase font-bold"
                                            />
                                            <span className="text-[12px] opacity-60 font-bold" style={{ color: getLayoutColor('dropdown-text', '#000000') }}>{textOpacity}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Bookmark on Section */}
                                <div className="space-y-1.5 relative">
                                    <span className="text-[13px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#000000') }}>Add Bookmark on</span>
                                    <div
                                        onClick={() => setShowPageDropdown(!showPageDropdown)}
                                        className="h-[32px] flex items-center px-3 justify-between border border-gray-300 rounded-[8px] cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                                        style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) }}
                                    >
                                        <span className="text-[12px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#000000') }}>Page {targetPageIndex + 1}</span>
                                        <Icon icon="fluent:chevron-down-24-filled" className={`w-4 h-4 transition-transform ${showPageDropdown ? 'rotate-180' : ''}`} style={{ color: getLayoutColor('dropdown-text', '#000000'), opacity: 0.6 }} />
                                    </div>
                                    {showPageDropdown && (
                                        <div className="absolute top-[68px] left-0 right-0 max-h-[160px] overflow-y-auto border border-gray-100 rounded-[8px] shadow-xl z-[150] custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200"
                                            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '0.98') }}>
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setTargetPageIndex(i);
                                                        setShowPageDropdown(false);
                                                    }}
                                                    className={`px-3 py-2 cursor-pointer text-[12px] font-bold transition-colors ${targetPageIndex === i ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                                    style={{ color: getLayoutColor('dropdown-text', '#000000') }}
                                                >
                                                    Page {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={() => {
                                        setSelectedColor('#D15D6D');
                                        setTextColor('#FFFFFF');
                                        setBookmarkText(`Page ${currentPageIndex + 1}`);
                                        setTargetPageIndex(currentPageIndex);
                                    }}
                                    className="flex-1 h-[32px] rounded-[10px] border border-gray-300 text-[12px] font-bold flex items-center justify-center gap-2 transition-all hover:bg-gray-50"
                                    style={{ color: getLayoutColor('dropdown-text', '#000000') }}
                                >
                                    <Icon icon="lucide:x" className="w-[14px] h-[14px] stroke-[3]" /> Clear
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddBookmark({
                                            id: Date.now(),
                                            label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                            pageIndex: targetPageIndex,
                                            color: selectedColor,
                                            style: bookmarkStyle,
                                            font: bookmarkFont
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.4] h-[32px] rounded-[10px] text-[12px] font-bold flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all"
                                    style={{
                                        backgroundColor: getLayoutColor('dropdown-text', '#000000'),
                                        color: getLayoutColor('dropdown-bg', '#FFFFFF')
                                    }}
                                >
                                    Add Bookmark
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {showColorPicker && (
                    <ColorPallet
                        smallMode={true}
                        color={pickerTarget === 'background' ? selectedColor : textColor}
                        onChange={(newColor) => {
                            if (pickerTarget === 'background') setSelectedColor(newColor);
                            else setTextColor(newColor);
                        }}
                        opacity={pickerTarget === 'background' ? opacity : textOpacity}
                        onOpacityChange={(newOpacity) => {
                            if (pickerTarget === 'background') setOpacity(newOpacity);
                            else setTextOpacity(newOpacity);
                        }}
                        onClose={() => setShowColorPicker(false)}
                        style={{
                            position: 'fixed',
                            top: pickerPos.y,
                            left: pickerPos.x,
                            transform: 'none',
                            zIndex: 200
                        }}
                    />
                )}
            </div>
        );
    }

    if (activeLayout == 8 && !isMobile) {
        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5 px-[2vw]"
                onClick={onClose}
            >
                <div
                    className="rounded-[1vw] shadow-2xl w-[36vw] relative animate-in zoom-in-95 duration-200 select-none overflow-visible transition-transform duration-300 bg-white"
                    style={{
                        transform: isSidebarOpen ? 'translate(8vw, 0)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-[1vw] py-[0.6vw] rounded-t-[1vw]" style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}>
                        <h2 className="text-[0.9vw] font-bold text-white tracking-wide">
                            Add Bookmark
                        </h2>

                        <button
                            onClick={onClose}
                            className="text-white opacity-80 hover:opacity-100 transition-opacity"
                        >
                            <Icon icon="lucide:x" className="w-[1.2vw] h-[1.2vw] stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Content Grid */}
                    <div className="flex gap-[1.5vw] items-stretch p-[1.2vw]">
                        {/* Left Section: Color Circles + Ribbon Preview */}
                        <div className="flex gap-[1.2vw] items-start flex-1 min-w-0">
                            {/* Color Column */}
                            <div className="flex flex-col gap-[0.5vw] py-[0.1vw]">
                                {['#D15D6D', '#6B7CBF', '#6FAF7C', '#D8DC53', '#34B0AE'].map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-[1.5vw] h-[1.5vw] rounded-[0.3vw] transition-all shadow-sm ${selectedColor === color ? 'ring-2 ring-offset-1 scale-105 shadow-md' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: color, ringColor: selectedColor === color ? getLayoutColor('dropdown-bg', '#575C9C') : 'transparent' }}
                                    />
                                ))}
                                <button
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                        setPickerTarget('background');
                                        setShowColorPicker(true);
                                    }}
                                    className="w-[1.5vw] h-[1.5vw] rounded-[0.3vw] shadow-sm hover:scale-105 transition-transform"
                                    style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                                />
                            </div>

                            {/* Ribbon Preview */}
                            <div className="flex-1 flex items-center justify-center h-full">
                                <div
                                    className="relative w-full h-[9vw] flex items-center justify-center transition-all duration-300 shadow-xl"
                                    style={{
                                        backgroundColor: hexToRgba(selectedColor, opacity),
                                        clipPath: getBookmarkClipPath(bookmarkStyle),
                                        borderRadius: getBookmarkBorderRadius(bookmarkStyle)
                                    }}
                                >
                                    <div
                                        className="text-[1.8vw] font-bold outline-none text-center px-[1.2vw] cursor-text w-full opacity-60"
                                        style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                    >
                                        Page {targetPageIndex + 1}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Section: Controls */}
                        <div className="w-[13vw] flex flex-col justify-between">
                            <div className="flex flex-col gap-[1vw]">
                                {/* Text Color Section */}
                                <div className="space-y-[0.5vw]">
                                    <span className="text-[0.8vw] font-bold" style={{ color: bodyTextColor }}>Text Color :</span>
                                    <div className="flex items-center gap-[0.5vw]">
                                        <button
                                            className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border shadow-sm flex-shrink-0 bg-white p-[0.2vw] border-gray-400"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                                setPickerTarget('text');
                                                setShowColorPicker(true);
                                            }}
                                        >
                                            <div className="w-full h-full rounded-[0.2vw]" style={{ backgroundColor: textColor }} />
                                        </button>

                                        <div className="flex-1 h-[1.8vw] rounded-[0.4vw] flex items-center px-[0.6vw] justify-between shadow-sm border bg-white" style={{ borderColor: '#555555' }}>
                                            <input
                                                type="text"
                                                value={textColor.toLowerCase()}
                                                onChange={(e) => setTextColor(e.target.value)}
                                                className="text-[0.7vw] font-semibold bg-transparent border-none outline-none w-[4vw]"
                                                style={{ color: bodyTextColor }}
                                            />
                                            <span className="text-[0.7vw] font-semibold" style={{ color: bodyTextColor, opacity: 0.6 }}>{textOpacity}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bookmark Page selection Dropdown */}
                                <div className="space-y-[0.5vw] relative">
                                    <span className="text-[0.8vw] font-bold" style={{ color: bodyTextColor }}>Add Bookmark on :</span>
                                    <div
                                        onClick={() => setShowPageDropdown(!showPageDropdown)}
                                        className="h-[2vw] rounded-[0.4vw] flex items-center px-[0.6vw] justify-between shadow-sm group cursor-pointer transition-colors border bg-white"
                                        style={{ borderColor: '#555555' }}
                                    >
                                        <span className="text-[0.8vw] font-semibold" style={{ color: bodyTextColor }}>Page {targetPageIndex + 1}</span>
                                        <Icon icon="fluent:chevron-down-24-filled" className={`w-[1vw] h-[1vw] transition-transform duration-200 ${showPageDropdown ? 'rotate-180' : ''}`} style={{ color: bodyTextColor, opacity: 0.8 }} />
                                    </div>

                                    {showPageDropdown && (
                                        <div className="absolute top-[3.2vw] left-0 right-0 max-h-[8vw] overflow-y-auto border border-gray-200 rounded-[0.4vw] shadow-2xl z-[150] custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200 bg-white">
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setTargetPageIndex(i);
                                                        setShowPageDropdown(false);
                                                    }}
                                                    className={`flex items-center px-[0.6vw] py-[0.5vw] cursor-pointer text-[0.75vw] font-semibold transition-colors ${targetPageIndex === i ? 'text-white' : 'hover:bg-gray-100 text-[#4B5563]'}`}
                                                    style={targetPageIndex === i ? { backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') } : {}}
                                                >
                                                    Page {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-[0.6vw] mt-[1.2vw]">
                                <button
                                    onClick={() => {
                                        setSelectedColor('#D15D6D');
                                        setTextColor('#FFFFFF');
                                        setBookmarkText(`Page ${currentPageIndex + 1}`);
                                        setTargetPageIndex(currentPageIndex);
                                    }}
                                    className="flex-1 h-[1.8vw] rounded-[0.4vw] border-[1.5px] font-bold text-[0.7vw] flex items-center justify-center gap-[0.3vw] transition-all bg-transparent hover:bg-black/5 shadow-sm"
                                    style={{ borderColor: '#555555', color: bodyTextColor }}
                                >
                                    <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw] stroke-[3]" />
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        onAddBookmark({
                                            id: Date.now(),
                                            label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                            pageIndex: targetPageIndex,
                                            color: selectedColor,
                                            style: bookmarkStyle,
                                            font: bookmarkFont
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.4] h-[1.8vw] px-[0.8vw] rounded-[0.4vw] font-bold text-[0.7vw] transition-all shadow-lg active:scale-[0.98] hover:opacity-90"
                                    style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C'), color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                >
                                    Add Bookmark
                                </button>
                            </div>
                        </div>
                    </div>
                </div>



                {showColorPicker && (
                    <ColorPallet
                        smallMode={true}
                        color={pickerTarget === 'background' ? selectedColor : textColor}
                        onChange={(newColor) => {
                            if (pickerTarget === 'background') setSelectedColor(newColor);
                            else setTextColor(newColor);
                        }}
                        opacity={pickerTarget === 'background' ? opacity : textOpacity}
                        onOpacityChange={(newOpacity) => {
                            if (pickerTarget === 'background') setOpacity(newOpacity);
                            else setTextOpacity(newOpacity);
                        }}
                        onClose={() => setShowColorPicker(false)}
                        style={{
                            position: 'fixed',
                            top: pickerPos.y,
                            left: pickerPos.x,
                            transform: 'none',
                            zIndex: 200
                        }}
                    />
                )}
            </div>
        );
    }


    if (activeLayout == 7 && !isMobile) {
        return (

            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5 px-[2vw]"
                onClick={onClose}
            >
                <div
                    className="rounded-[1.2vw] shadow-2xl p-[1.2vw] w-[34vw] relative animate-in zoom-in-95 duration-200 select-none overflow-visible transition-transform duration-300"
                    style={{
                        backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '0.95'),
                        border: `1.5px solid ${getLayoutColorAlpha('dropdown-text', '255,255,255', 0.2)}`,
                        backdropFilter: 'blur(16px)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        transform: isSidebarOpen ? 'translate(8vw, 0)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex flex-col mb-[1vw]">
                        <div className="flex items-center justify-between relative z-10 px-[0.2vw]">
                            <h2 className="text-[1.1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}>
                                Add Bookmark
                            </h2>
                            <button
                                onClick={onClose}
                                className="w-[1.6vw] h-[1.6vw] flex items-center justify-center transition-colors opacity-70 hover:opacity-100"
                                style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}
                            >
                                <Icon icon="lucide:x" className="w-[1.2vw] h-[1.2vw] stroke-[2.5]" />
                            </button>
                        </div>
                    </div>
                    <div className="absolute left-[1.2vw] right-[1.2vw] top-[3.2vw] h-[1.5px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#373D8A'), opacity: 0.8 }} />

                    {/* Content Grid */}
                    <div className="flex gap-[1vw] items-stretch mt-[0.8vw]">
                        {/* Left Column: Color Selection */}
                        <div className="flex flex-col gap-[0.5vw] py-[0.2vw]">
                            {['#D15D6D', '#6B7CBF', '#6FAF7C', '#D8DC53', '#34B0AE'].map((color, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-[1.8vw] h-[1.8vw] rounded-full transition-all border-[2px] border-white shadow-md ${selectedColor === color ? 'scale-110 shadow-lg' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-[1.8vw] h-[1.8vw] rounded-full border-[2px] border-white shadow-md hover:scale-105 transition-transform"
                                style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                            />
                        </div>

                        {/* Middle Column: Bookmark Preview */}
                        <div className="flex-1 min-w-0 flex items-center justify-center">
                            <div
                                className="relative w-full h-[100%] min-h-[14vw] flex items-center justify-center shadow-lg transition-all duration-300"
                                style={{
                                    backgroundColor: hexToRgba(selectedColor, opacity),
                                    clipPath: getBookmarkClipPath(bookmarkStyle),
                                    borderRadius: getBookmarkBorderRadius(bookmarkStyle)
                                }}
                            >
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    className="text-[1.4vw] font-bold outline-none text-center px-[0.5vw] cursor-text w-full"
                                    style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                    dangerouslySetInnerHTML={{ __html: bookmarkText || `Page ${targetPageIndex + 1}` }}
                                />
                            </div>
                        </div>

                        {/* Right Column: Controls */}
                        <div className="w-[14vw] flex flex-col justify-between">
                            <div className="flex flex-col gap-[1vw]">
                                {/* Text Color Section */}
                                <div className="space-y-[0.5vw]">
                                    <div className="flex items-center">
                                        <span className="text-[0.8vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}>Text Color :</span>
                                    </div>

                                    <div className="flex items-center gap-[0.4vw]">
                                        <button
                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] border shadow-sm flex-shrink-0 bg-transparent p-[0.2vw]"
                                            style={{ borderColor: getLayoutColor('dropdown-text', '#373D8A') }}
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setPickerPos({ x: rect.right + 10, y: rect.top - 110 });
                                                setPickerTarget('text');
                                                setShowColorPicker(true);
                                            }}
                                        >
                                            <div className="w-full h-full rounded-[0.2vw]" style={{ backgroundColor: textColor }} />
                                        </button>

                                        <div className="flex-1 h-[2vw] rounded-[0.4vw] flex items-center px-[0.6vw] justify-between shadow-sm border transition-all bg-transparent" style={{ borderColor: getLayoutColor('dropdown-text', '#373D8A') }}>
                                            <input
                                                type="text"
                                                value={textColor.toLowerCase()}
                                                onChange={(e) => setTextColor(e.target.value)}
                                                className="text-[0.75vw] font-semibold bg-transparent border-none outline-none w-[4vw]"
                                                style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}
                                            />
                                            <span className="text-[0.7vw] font-semibold" style={{ color: getLayoutColor('dropdown-text', '#373D8A'), opacity: 0.8 }}>{textOpacity}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Page Selection Section */}
                                <div className="space-y-[0.5vw] relative">
                                    <div className="flex items-center">
                                        <span className="text-[0.8vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}>Add Bookmark on :</span>
                                    </div>
                                    <div
                                        onClick={() => setShowPageDropdown(!showPageDropdown)}
                                        className="h-[2vw] rounded-[0.4vw] flex items-center px-[0.6vw] justify-between shadow-sm group cursor-pointer transition-colors border bg-transparent"
                                        style={{ borderColor: getLayoutColor('dropdown-text', '#373D8A') }}
                                    >
                                        <span className="text-[0.75vw] font-semibold" style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}>Page {targetPageIndex + 1}</span>
                                        <Icon icon="fluent:chevron-down-24-filled" className={`w-[1vw] h-[1vw] transition-transform duration-200 ${showPageDropdown ? 'rotate-180' : ''}`} style={{ color: getLayoutColor('dropdown-text', '#373D8A') }} />
                                    </div>

                                    {showPageDropdown && (
                                        <div
                                            className="absolute top-[3.5vw] left-0 right-0 max-h-[10vw] overflow-y-auto border rounded-[0.4vw] shadow-2xl z-[150] custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200"
                                            style={{
                                                borderColor: getLayoutColor('dropdown-text', '#373D8A'),
                                                backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '0.9'),
                                                backdropFilter: 'blur(16px)'
                                            }}
                                        >
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setTargetPageIndex(i);
                                                        setShowPageDropdown(false);
                                                    }}
                                                    className={`flex items-center px-[0.8vw] py-[0.5vw] cursor-pointer text-[0.75vw] font-semibold transition-colors`}
                                                    style={targetPageIndex === i ?
                                                        { backgroundColor: getLayoutColor('dropdown-text', '#373D8A'), color: getLayoutColor('dropdown-bg', '#FFFFFF') } :
                                                        { color: getLayoutColor('dropdown-text', '#373D8A') }
                                                    }
                                                >
                                                    Page {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-[0.5vw]">
                                <button
                                    onClick={() => {
                                        setSelectedColor('#D15D6D');
                                        setTextColor('#FFFFFF');
                                        setBookmarkText(`Page ${currentPageIndex + 1}`);
                                        setTargetPageIndex(currentPageIndex);
                                    }}
                                    className="flex-1 h-[2.5vw] rounded-[0.4vw] border font-bold text-[0.75vw] flex items-center justify-center gap-[0.3vw] transition-all bg-transparent hover:bg-black/5"
                                    style={{ borderColor: getLayoutColor('dropdown-text', '#373D8A'), color: getLayoutColor('dropdown-text', '#373D8A') }}
                                >
                                    <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        onAddBookmark({
                                            id: Date.now(),
                                            label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                            pageIndex: targetPageIndex,
                                            color: selectedColor,
                                            style: bookmarkStyle,
                                            font: bookmarkFont
                                        });
                                        onClose();
                                    }}
                                    className="flex-[1.4] h-[2.5vw] px-[0.8vw] rounded-[0.4vw] font-bold text-[0.75vw] transition-all shadow-md active:scale-[0.98] hover:opacity-90 text-white"
                                    style={{ backgroundColor: getLayoutColor('dropdown-text', '#373D8A'), color: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                                >
                                    Add Bookmark
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {showColorPicker && (
                    <ColorPallet
                        smallMode={true}
                        color={pickerTarget === 'background' ? selectedColor : textColor}
                        onChange={(newColor) => {
                            if (pickerTarget === 'background') setSelectedColor(newColor);
                            else setTextColor(newColor);
                        }}
                        opacity={pickerTarget === 'background' ? opacity : textOpacity}
                        onOpacityChange={(newOpacity) => {
                            if (pickerTarget === 'background') setOpacity(newOpacity);
                            else setTextOpacity(newOpacity);
                        }}
                        onClose={() => setShowColorPicker(false)}
                        style={{
                            position: 'fixed',
                            top: pickerPos.y,
                            left: pickerPos.x,
                            transform: 'none',
                            zIndex: 200
                        }}
                    />
                )}
            </div>
        );
    }

    if ((activeLayout == 4 || activeLayout == 6) && !isMobile) {
        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5 px-[2vw]"
                onClick={onClose}
            >
                <div
                    className="rounded-none border shadow-2xl w-[480px] relative animate-in zoom-in-95 duration-200 select-none overflow-visible"
                    style={{
                        transform: isSidebarOpen ? 'translate(8vw, 0) scale(0.9)' : 'scale(1)',
                        transformOrigin: 'center center',
                        backgroundColor: '#FFFFFF',
                        borderColor: getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.5)
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-full" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: activeLayout == 6 ? '#373d8b' : getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.2) }}>
                            <h2 className="text-[16px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#373d8b') }}>Add Bookmark</h2>
                            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                                <Icon icon="lucide:x" className="w-[16px] h-[16px]" style={{ color: getLayoutColor('dropdown-text', '#373d8b') }} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex gap-4 px-4 py-5 items-start">
                            {/* Left Column - Colors */}
                            <div className="flex flex-col gap-[5px]">
                                {['#D6566E', '#6B7DBB', '#67AC78', '#E1DB53', '#32B1AD'].map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-[22px] h-[22px] rounded-none block transition-all border`}
                                        style={{
                                            backgroundColor: color,
                                            borderColor: getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.3)
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                        setPickerTarget('background');
                                        setShowColorPicker(true);
                                    }}
                                    className="w-[22px] h-[22px] rounded-none block shadow-sm transition-all flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] border"
                                    style={{ borderColor: getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.3) }}
                                />
                            </div>

                            {/* Middle Column - Preview Area */}
                            <div className={`flex-1 flex items-center justify-center ${activeLayout == 6 ? 'min-h-[180px]' : 'min-h-[130px]'}`}>
                                <div
                                    className={`relative w-full ${activeLayout == 6 ? 'h-[140px]' : 'h-[90px]'} flex items-center justify-center shadow-md transition-all duration-300`}
                                    style={{
                                        backgroundColor: hexToRgba(selectedColor, opacity),
                                        clipPath: getBookmarkClipPath(bookmarkStyle),
                                        borderRadius: getBookmarkBorderRadius(bookmarkStyle)
                                    }}
                                >
                                    <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        className="text-[16px] font-bold outline-none text-center w-full px-5 cursor-text"
                                        style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                        dangerouslySetInnerHTML={{ __html: bookmarkText || `Page ${targetPageIndex + 1}` }}
                                    />
                                </div>
                            </div>

                            {/* Right Column - Properties */}
                            <div className="w-[170px] flex flex-col gap-3">
                                {/* Text Color Box */}
                                <div className="space-y-1 align-start">
                                    <span className="text-[13px] font-bold block" style={{ color: getLayoutColor('dropdown-text', '#373d8b') }}>Text Color :</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="w-[30px] h-[30px] rounded-none border flex items-center justify-center cursor-pointer p-1"
                                            style={{
                                                borderColor: getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.2),
                                                backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1')
                                            }}
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setPickerPos({ x: rect.left - 180, y: rect.top - 50 });
                                                setPickerTarget('text');
                                                setShowColorPicker(true);
                                            }}
                                        >
                                            <div className="w-full h-full rounded-none" style={{ backgroundColor: textColor }}></div>
                                        </button>
                                        <div className="flex-1 h-[30px] flex items-center border rounded-none px-2" style={{ borderColor: getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.2), backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}>
                                            <span className="text-[10px] uppercase flex-1 font-bold" style={{ color: getLayoutColorAlpha('dropdown-text', '75, 85, 99', 0.8) }}>{textColor}</span>
                                            <span className="text-[10px] font-bold" style={{ color: getLayoutColorAlpha('dropdown-text', '107, 114, 128', 0.6) }}>{textOpacity}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Bookmark on */}
                                <div className="space-y-1 relative">
                                    <span className="text-[13px] font-bold block" style={{ color: getLayoutColor('dropdown-text', '#373d8b') }}>Add Bookmark on :</span>
                                    <div
                                        onClick={() => setShowPageDropdown(!showPageDropdown)}
                                        className="h-[30px] flex items-center px-3 justify-between border rounded-none cursor-pointer"
                                        style={{ borderColor: getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.2), backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}
                                    >
                                        <span className="text-[11px] font-bold" style={{ color: getLayoutColorAlpha('dropdown-text', '55, 65, 81', 0.9) }}>Page {targetPageIndex + 1}</span>
                                        <Icon icon="fluent:chevron-down-24-filled" className="w-3 h-3 text-gray-400" />
                                    </div>
                                    {showPageDropdown && (
                                        <div className="absolute top-full left-0 right-0 max-h-[140px] overflow-y-auto border rounded-none shadow-xl z-[150] custom-scrollbar" style={{ borderColor: getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.2), backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}>
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setTargetPageIndex(i);
                                                        setShowPageDropdown(false);
                                                    }}
                                                    className={`px-3 py-1.5 cursor-pointer text-[11px] font-bold transition-colors`}
                                                    style={{
                                                        backgroundColor: targetPageIndex === i ? getLayoutColor('dropdown-text', '#000000') : 'transparent',
                                                        color: targetPageIndex === i ? getLayoutColor('dropdown-bg', '#FFFFFF') : getLayoutColorAlpha('dropdown-text', '55, 65, 81', 0.9)
                                                    }}
                                                >
                                                    Page {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 mt-1">
                                    <button
                                        onClick={() => {
                                            setSelectedColor('#D15D6D');
                                            setTextColor('#FFFFFF');
                                            setBookmarkText(`Page ${currentPageIndex + 1}`);
                                            setTargetPageIndex(currentPageIndex);
                                        }}
                                        className="flex-1 h-[32px] rounded-none border font-bold text-[11px] flex items-center justify-center gap-1 hover:bg-gray-50 transition-all"
                                        style={{ borderColor: getLayoutColorAlpha('dropdown-text', '85, 85, 85', 0.3), backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1'), color: getLayoutColor('dropdown-text', '#000000') }}
                                    >
                                        <Icon icon="lucide:x" className="w-[11px] h-[11px]" />
                                        Clear
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddBookmark({
                                                id: Date.now(),
                                                label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                                pageIndex: targetPageIndex,
                                                color: selectedColor,
                                                style: bookmarkStyle,
                                                font: bookmarkFont
                                            });
                                            onClose();
                                        }}
                                        className="flex-[1.5] h-[32px] rounded-none text-[11px] font-bold transition-all hover:bg-zinc-800"
                                        style={{ backgroundColor: getLayoutColor('dropdown-text', '#000000'), color: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                                    >
                                        Add Bookmark
                                    </button>
                                </div>
                            </div>
                        </div>

                        {showColorPicker && (
                            <ColorPallet
                                smallMode={true}
                                color={pickerTarget === 'background' ? selectedColor : textColor}
                                onChange={(newColor) => {
                                    if (pickerTarget === 'background') setSelectedColor(newColor);
                                    else setTextColor(newColor);
                                }}
                                opacity={pickerTarget === 'background' ? opacity : textOpacity}
                                onOpacityChange={(newOpacity) => {
                                    if (pickerTarget === 'background') setOpacity(newOpacity);
                                    else setTextOpacity(newOpacity);
                                }}
                                onClose={() => setShowColorPicker(false)}
                                style={{
                                    position: 'fixed',
                                    top: pickerPos.y,
                                    left: pickerPos.x,
                                    transform: 'none',
                                    zIndex: 200
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }


    if (activeLayout == 2 && !isMobile) {
        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent px-[2vw]"
                onClick={onClose}
            >
                <div
                    className="rounded-[1.2vw] shadow-2xl p-[0.4vw] w-[30vw] relative animate-in zoom-in-95 duration-200 select-none overflow-visible transition-transform duration-300"
                    style={{
                        backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.6),
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        transform: isSidebarOpen ? 'translate(8vw, 0)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="w-full h-full rounded-[1vw] p-[1vw]"
                        style={{ backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))" }}
                    >
                        {/* Layout 2 Header */}
                        <div className="flex items-center gap-[1vw] mb-[1.5vw]">
                            <h2 className="text-[1.1vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Bookmark</h2>
                            <div className="flex-1 h-[1.5px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.4 }}></div>
                            <button
                                onClick={onClose}
                                className="opacity-80 hover:opacity-100 transition-opacity"
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                            >
                                <Icon icon="lucide:x" className="w-[1.1vw] h-[1.1vw] stroke-[2.5]" />
                            </button>
                        </div>

                        <div className="flex gap-[1vw] items-stretch">
                            {/* Left: Color Palette */}
                            <div className="flex flex-col gap-[0.5vw] justify-center">
                                {['#D65D6D', '#6B7DBB', '#67AC78', '#D8DC53', '#2EB0B1'].map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-[1.4vw] h-[1.4vw] rounded-[0.4vw] transition-all border-[1px] ${selectedColor === color ? 'scale-110 shadow-lg' : 'hover:border-white/50'}`}
                                        style={{
                                            backgroundColor: color,
                                            borderColor: selectedColor === color ? getLayoutColor('dropdown-text', '#FFFFFF') : 'rgba(255, 255, 255, 0.2)'
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={(e) => {
                                        const section = document.getElementById('text-color-section-layout2');
                                        const rect = section ? section.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.left - 20, y: rect.top - 50 });
                                        setPickerTarget('background');
                                        setShowColorPicker(true);
                                    }}
                                    className="w-[1.4vw] h-[1.4vw] rounded-[0.4vw] border-[1px] border-white/20 shadow-sm hover:scale-110 transition-transform"
                                    style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                                />
                            </div>

                            {/* Middle: Preview */}
                            <div className="flex-1 flex items-center justify-center">
                                <div
                                    className="relative w-full h-[9vw] flex items-center justify-center shadow-2xl"
                                    style={{
                                        backgroundColor: hexToRgba(selectedColor, opacity),
                                        clipPath: getBookmarkClipPath(bookmarkStyle),
                                        borderRadius: getBookmarkBorderRadius(bookmarkStyle),
                                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                                    }}
                                >
                                    <div
                                        className="text-[1.3vw] font-bold text-center outline-none"
                                        style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                    >
                                        {`Page ${targetPageIndex + 1}`}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Controls */}
                            <div className="w-[11vw] flex flex-col gap-[0.8vw]">
                                {/* Text Color Input Section */}
                                <div id="text-color-section-layout2" className="flex flex-col gap-[0.5vw]">
                                    <div className="flex items-center gap-[0.4vw]">
                                        <span className="text-[0.75vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Text Color</span>
                                        <div className="flex-1 h-[1px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }}></div>
                                    </div>
                                    <div className="flex items-center gap-[0.5vw]">
                                        <div
                                            className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border"
                                            style={{
                                                backgroundColor: textColor,
                                                borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2)
                                            }}
                                            onClick={(e) => {
                                                const section = document.getElementById('text-color-section-layout2');
                                                const rect = section ? section.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                                                setPickerPos({ x: rect.left - 20, y: rect.top - 50 });
                                                setPickerTarget('text');
                                                setShowColorPicker(true);
                                            }}
                                        />
                                        <div
                                            className="flex-1 h-[1.8vw] rounded-[0.3vw] flex items-center px-[0.5vw] justify-between border"
                                            style={{
                                                backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.8),
                                                borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1)
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={textColor}
                                                onChange={(e) => setTextColor(e.target.value)}
                                                className="text-[0.7vw] font-bold uppercase bg-transparent border-none outline-none w-[5vw]"
                                                style={{ color: getLayoutColor('dropdown-bg', '#575C9C') }}
                                            />
                                            <span className="text-[0.7vw] opacity-60 font-bold" style={{ color: getLayoutColor('dropdown-bg', '#575C9C') }}>100%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Page Selection Dropdown Section */}
                                <div className="flex flex-col gap-[0.5vw] relative">
                                    <div className="flex items-center gap-[0.4vw]">
                                        <span className="text-[0.75vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Select Page</span>
                                        <div className="flex-1 h-[1px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }}></div>
                                    </div>
                                    <div
                                        className="h-[1.8vw] rounded-[0.3vw] flex items-center px-[0.5vw] justify-between border cursor-pointer"
                                        style={{
                                            backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.8),
                                            borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1)
                                        }}
                                        onClick={() => setShowPageDropdown(!showPageDropdown)}
                                    >
                                        <span className="text-[0.7vw] font-bold" style={{ color: getLayoutColor('dropdown-bg', '#575C9C') }}>Page {targetPageIndex + 1}</span>
                                        <Icon icon="lucide:chevron-down" className="opacity-60 w-[0.8vw] h-[0.8vw]" style={{ color: getLayoutColor('dropdown-bg', '#575C9C') }} />
                                    </div>
                                    {showPageDropdown && (
                                        <div className="absolute top-[3.4vw] left-0 right-0 max-h-[8vw] overflow-y-auto border rounded-[0.3vw] shadow-2xl z-[100] custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200"
                                            style={{
                                                backgroundColor: getLayoutColor('dropdown-bg', '#575C9C'),
                                                borderColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                                            }}>
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setTargetPageIndex(i);
                                                        setShowPageDropdown(false);
                                                    }}
                                                    className={`flex items-center px-[0.5vw] py-[0.3vw] cursor-pointer text-[0.7vw] font-bold transition-colors ${targetPageIndex === i ? 'shadow-sm' : 'hover:bg-white/10'}`}
                                                    style={targetPageIndex === i ? {
                                                        backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.8),
                                                        color: getLayoutColor('dropdown-bg', '#575C9C')
                                                    } : {
                                                        color: getLayoutColor('dropdown-text', '#FFFFFF')
                                                    }}
                                                >
                                                    Page {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons Section */}
                                <div className="flex gap-[0.4vw] mt-auto">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 h-[2.2vw] rounded-[0.5vw] border font-bold text-[0.75vw] flex items-center justify-center gap-[0.3vw] hover:bg-white/10 transition-all"
                                        style={{
                                            borderColor: getLayoutColor('dropdown-text', '#FFFFFF'),
                                            color: getLayoutColor('dropdown-text', '#FFFFFF')
                                        }}
                                    >
                                        <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" /> Clear
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAddBookmark({
                                                id: Date.now(),
                                                label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                                pageIndex: targetPageIndex,
                                                color: selectedColor,
                                                style: bookmarkStyle,
                                                font: bookmarkFont
                                            });
                                            onClose();
                                        }}
                                        className="flex-[1.5] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] font-bold text-[0.75vw] whitespace-nowrap hover:bg-opacity-90 transition-all shadow-lg shadow-black/20 px-[1vw]"
                                        style={{
                                            backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'),
                                            color: getLayoutColor('dropdown-bg', '#575C9C')
                                        }}
                                    >
                                        Add Bookmark
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {showColorPicker && (
                    <ColorPallet
                        smallMode={true}
                        color={pickerTarget === 'background' ? selectedColor : textColor}
                        onChange={(newColor) => {
                            if (pickerTarget === 'background') setSelectedColor(newColor);
                            else setTextColor(newColor);
                        }}
                        opacity={pickerTarget === 'background' ? opacity : textOpacity}
                        onOpacityChange={(newOpacity) => {
                            if (pickerTarget === 'background') setOpacity(newOpacity);
                            else setTextOpacity(newOpacity);
                        }}
                        onClose={() => setShowColorPicker(false)}
                        style={{
                            position: 'fixed',
                            top: pickerPos.y,
                            left: pickerPos.x,
                            transform: 'none'
                        }}
                    />
                )}
            </div>
        );
    }

    if (activeLayout == 3 && !isMobile) {
        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent"
                onClick={() => {
                    if (showPageDropdown || showColorPicker) {
                        setShowPageDropdown(false);
                        setShowColorPicker(false);
                    } else {
                        onClose();
                    }
                }}
            >
                <div
                    className="rounded-[1.2rem] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 w-[32vw] relative z-[110] transition-transform bg-white"
                    style={{
                        transformOrigin: 'center center'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* White layer behind (bg-white on parent) and theme layer on top */}
                    <div
                        className="absolute inset-0 z-0 rounded-[1.2rem]"
                        style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}
                    />


                    <div className="relative z-10 p-[1.5vw] flex flex-col w-full h-full">
                        <div className="flex items-center justify-between mb-[0.8vw]">

                            <h2 className="text-[1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Add Bookmark</h2>
                            <button
                                onClick={onClose}
                                className="p-[0.3vw] rounded-full transition-colors group"
                                style={{ backgroundColor: 'transparent' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.1)}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Icon icon="lucide:x" className="w-[1vw] h-[1vw] group-hover:scale-110 transition-transform" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }} />
                            </button>
                        </div>

                        <div className="flex gap-[1.5vw]">
                            {/* Left: Color Palette */}
                            <div className="flex flex-col gap-[0.4vw]">
                                {['#CF5E71', '#6A7DBB', '#6AAF75', '#E1DB53', '#32B1AD'].map((color, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-[2vw] h-[2vw] rounded-[0.4vw] transition-all shadow-sm ${selectedColor === color ? 'border-[0.1vw] scale-105' : 'border border-transparent'}`}
                                        style={{
                                            backgroundColor: color,
                                            borderColor: selectedColor === color ? getLayoutColor('dropdown-text', '#3E4491') : 'transparent',
                                            opacity: 'var(--dropdown-text-opacity, 1)'
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                        setPickerTarget('background');
                                        setShowColorPicker(true);
                                    }}
                                    className={`w-[2vw] h-[2vw] rounded-[0.4vw] transition-all hover:scale-105 shadow-sm border`}
                                    style={{
                                        background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                                        borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2)
                                    }}
                                />
                            </div>

                            {/* Middle: Preview Area */}
                            <div className="flex justify-center items-start">
                                <div
                                    className="relative w-[13vw] h-[10vw] flex transition-all duration-300"
                                    style={{
                                        backgroundColor: hexToRgba(selectedColor, opacity),
                                        clipPath: getBookmarkClipPath(bookmarkStyle),
                                        borderRadius: getBookmarkBorderRadius(bookmarkStyle),
                                        filter: 'drop-shadow(0 0.5vw 1vw rgba(0,0,0,0.15))'
                                    }}
                                >
                                    <div className="h-full flex-1 flex items-center justify-center p-[1vw] pr-[3vw]">
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                            className="text-[1.2vw] font-medium outline-none text-center w-full cursor-text"
                                            style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                            dangerouslySetInnerHTML={{ __html: bookmarkText || `Page ${targetPageIndex + 1}` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right: Controls Section */}
                            <div className="flex-1 flex flex-col pt-[0.2vw]">
                                {/* Text Color Input */}
                                <div className="flex flex-col gap-[0.4vw] mb-[1.2vw]">
                                    <span className="text-[0.8vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Text Color :</span>
                                    <div className="flex items-center gap-[0.5vw]">
                                        <div
                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] border-[1.5px] cursor-pointer shadow-sm flex-shrink-0"
                                            style={{
                                                backgroundColor: textColor,
                                                borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2)
                                            }}
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                                setPickerTarget('text');
                                                setShowColorPicker(true);
                                            }}
                                        />
                                        <div className="flex-1 h-[2vw] border-[1.5px] rounded-[0.4vw] flex items-center px-[0.6vw] justify-between"
                                            style={{
                                                backgroundColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05),
                                                borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2)
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={textColor}
                                                onChange={(e) => setTextColor(e.target.value)}
                                                className="text-[0.75vw] font-bold uppercase bg-transparent border-none outline-none w-[3.5vw]"
                                                style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.6) }}
                                            />
                                            <span className="text-[0.6vw] font-bold" style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.5) }}>{textOpacity}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Select Page Dropdown Section */}
                                <div className="flex flex-col gap-[0.4vw] relative mb-[1.5vw]">
                                    <span className="text-[0.8vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Add Bookmark on :</span>
                                    <div
                                        className="w-full h-[1.8vw] border-[1.5px] rounded-[0.4vw] flex items-center px-[0.6vw] justify-between cursor-pointer transition-all"
                                        style={{
                                            backgroundColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05),
                                            borderColor: showPageDropdown ? getLayoutColor('dropdown-text', '#3E4491') : getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2)
                                        }}
                                        onClick={() => setShowPageDropdown(!showPageDropdown)}
                                    >
                                        <span className="text-[0.7vw] font-bold" style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.8) }}>Page {targetPageIndex + 1}</span>
                                        <Icon icon="lucide:chevron-down" className="w-[0.7vw] h-[0.7vw]" style={{ color: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.4) }} />
                                    </div>
                                    {showPageDropdown && (
                                        <div className="absolute top-[0vw] left-[100%] ml-[2.5vw] w-[7vw] max-h-[12vw] overflow-y-auto rounded-[0.8vw] shadow-[0_10px_35px_rgba(0,0,0,0.2)] z-[120] custom-scrollbar flex flex-col border overflow-x-hidden"
                                            style={{
                                                backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1'),
                                                borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.1),
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: `${getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.3)} transparent`
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {Array.from({ length: totalPages }).map((_, i) => {
                                                const isSelected = targetPageIndex === i;
                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => {
                                                            setTargetPageIndex(i);
                                                            setBookmarkText(`Page ${i + 1}`);
                                                            setShowPageDropdown(false);
                                                        }}
                                                        className={`py-[0.5vw] w-full cursor-pointer text-center text-[0.75vw] font-bold transition-colors border-b last:border-b-0`}
                                                        style={{
                                                            backgroundColor: isSelected ? getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05) : 'transparent',
                                                            color: isSelected ? getLayoutColor('dropdown-text', '#3E4491') : getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.8),
                                                            borderColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05)
                                                        }}
                                                        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.02); }}
                                                        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                        Page {i + 1}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}


                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-[0.8vw] mt-auto">
                                    <button
                                        onClick={onClose}
                                        className="h-[2.5vw] flex-1 px-[0.4vw] border-[1.5px] rounded-[0.4vw] flex items-center justify-center gap-[0.3vw] transition-all font-bold text-[0.85vw]"
                                        style={{
                                            borderColor: getLayoutColor('dropdown-text', '#3E4491'),
                                            color: getLayoutColor('dropdown-text', '#3E4491'),
                                            opacity: 'var(--dropdown-text-opacity, 1)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05)}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <Icon icon="lucide:x" className="w-[0.7vw] h-[0.7vw]" /> Clear
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAddBookmark({
                                                id: Date.now(),
                                                label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                                pageIndex: targetPageIndex,
                                                color: selectedColor,
                                                style: bookmarkStyle,
                                                font: bookmarkFont
                                            });
                                            onClose();
                                        }}
                                        className="h-[2.5vw] flex-[1.2] px-[0.6vw] rounded-[0.4vw] text-[0.8vw] font-bold transition-all shadow-md whitespace-nowrap flex items-center justify-center"
                                        style={{
                                            backgroundColor: getLayoutColor('dropdown-text', '#3E4491'),
                                            color: getLayoutColor('dropdown-bg', '#ffffff')
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        Add Bookmark
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showPageDropdown && (
                    <div className="fixed inset-0 z-[105] bg-transparent" onClick={(e) => { e.stopPropagation(); setShowPageDropdown(false); }} />
                )}

                {/* Color Picker Render */}
                {showColorPicker && (
                    <>
                        <div className="fixed inset-0 z-[110] bg-transparent" onClick={(e) => { e.stopPropagation(); setShowColorPicker(false); }} />
                        <ColorPallet
                            smallMode={true}
                            color={pickerTarget === 'background' ? selectedColor : textColor}
                            onChange={(newColor) => {
                                if (pickerTarget === 'background') setSelectedColor(newColor);
                                else setTextColor(newColor);
                            }}
                            opacity={pickerTarget === 'background' ? opacity : textOpacity}
                            onOpacityChange={(newOpacity) => {
                                if (pickerTarget === 'background') setOpacity(newOpacity);
                                else setTextOpacity(newOpacity);
                            }}
                            onClose={() => setShowColorPicker(false)}
                            style={{
                                position: 'fixed',
                                top: pickerPos.y,
                                left: pickerPos.x,
                                transform: 'none',
                                zIndex: 120
                            }}
                        />
                    </>
                )}
            </div>
        );
    }

    if (activeLayout == 9 && !isMobile) {
        return (
            <div
                className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-auto bg-black/10"
                onClick={onClose}
            >
                <div
                    className="p-[0.8vw] rounded-[1.2vw] shadow-[0_0.8vw_2.5vw_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300"
                    style={{
                        backgroundColor: 'rgba(74, 91, 156, 0.6)',
                        backdropFilter: 'blur(16px)',
                        transform: isSidebarOpen ? 'scale(0.85)' : 'scale(1)',
                        transformOrigin: 'center center'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="bg-white rounded-[0.8vw] w-[32vw] flex flex-col relative overflow-visible"
                    >
                        {/* Header Section */}
                        <div className="flex items-center justify-between px-[1vw] pt-[1.2vw] pb-[0.4vw]">
                            <div className="flex items-center flex-1">
                                <span className="text-[1vw] font-bold text-[#1a1a1a] mr-[0.6vw] whitespace-nowrap">Add Bookmark</span>
                                <div className="h-[1px] flex-1 bg-gray-200"></div>
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-[0.8vw] w-[1.4vw] h-[1.4vw] flex items-center justify-center text-[#ff3b3b] hover:bg-red-50 rounded-full transition-all"
                            >
                                <Icon icon="lucide:x" className="w-[1vw] h-[1vw] stroke-[3]" />
                            </button>
                        </div>

                        {/* Main Content Body */}
                        <div className="flex gap-[1vw] px-[1vw] pb-[1.2vw] items-start">

                            {/* Left - Color Circles */}
                            <div className="flex flex-col gap-[0.5vw] pt-[0.2vw]">
                                {['#D15D6D', '#6B7CBF', '#6FAF7C', '#E0D95A', '#32B1AD', '#C68798', '#23D295'].map((color, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-[1.4vw] h-[1.4vw] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm border-[0.08vw] ${selectedColor === color ? 'border-gray-800 ring-2 ring-white ring-offset-0' : 'border-transparent'}`}
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
                                    className="w-[1.4vw] h-[1.4vw] rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
                                />
                            </div>

                            {/* Middle - Bookmark Ribbon Area */}
                            <div className="relative flex-[1.4] h-[12vw] flex flex-col items-center justify-center transition-colors duration-300">
                                <div
                                    className="relative w-[10vw] h-[10vw] flex transition-all duration-300"
                                    style={{
                                        backgroundColor: hexToRgba(selectedColor, opacity),
                                        clipPath: getBookmarkClipPath(bookmarkStyle),
                                        borderRadius: getBookmarkBorderRadius(bookmarkStyle),
                                        filter: 'drop-shadow(0 0.5vw 1vw rgba(0,0,0,0.15))'
                                    }}
                                >
                                    <div className="h-full flex-1 flex items-center justify-center p-[0.8vw]">
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                            className="text-[1.2vw] font-bold outline-none text-center w-full cursor-text break-words"
                                            style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                            dangerouslySetInnerHTML={{ __html: bookmarkText || `Page ${targetPageIndex + 1}` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right - Inputs & Actions */}
                            <div className="flex-[1.5] flex flex-col gap-[1vw] pt-[0.2vw]">
                                {/* Text Color Section */}
                                <div className="space-y-[0.6vw]">
                                    <div className="flex items-center gap-[0.6vw]">
                                        <span className="text-[0.9vw] font-bold text-[#1a1a1a] whitespace-nowrap">Text Color</span>
                                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                                    </div>
                                    <div className="flex items-center gap-[0.6vw]">
                                        <button
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setPickerPos({ x: rect.right + 20, y: rect.top - 100 });
                                                setPickerTarget('text');
                                                setShowColorPicker(true);
                                            }}
                                            className="w-[2vw] h-[2vw] rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-110 active:scale-95"
                                            style={{ backgroundColor: textColor }}
                                        />
                                        <div className="flex-1 h-[2.2vw] border border-gray-400 rounded-full flex items-center px-[0.8vw] justify-between bg-white overflow-hidden shadow-inner">
                                            <input
                                                type="text"
                                                value={textColor}
                                                onChange={(e) => setTextColor(e.target.value)}
                                                className="text-[0.8vw] font-medium text-gray-700 bg-transparent border-none outline-none w-[4vw]"
                                            />
                                            <span className="text-[0.8vw] font-bold text-gray-400">{textOpacity}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Select Page Section */}
                                <div className="space-y-[0.6vw] relative">
                                    <div className="flex items-center gap-[0.6vw]">
                                        <span className="text-[0.9vw] font-bold text-[#1a1a1a] whitespace-nowrap">Select Page</span>
                                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                                    </div>
                                    <div
                                        onClick={() => setShowPageDropdown(!showPageDropdown)}
                                        className="w-full h-[2.2vw] border border-gray-400 rounded-full flex items-center px-[1vw] justify-between cursor-pointer hover:bg-gray-50 transition-colors bg-white shadow-inner"
                                    >
                                        <span className="text-[0.8vw] font-medium text-gray-700">Page {targetPageIndex + 1}</span>
                                        <Icon icon="lucide:chevron-down" className={`w-[1vw] h-[1vw] transition-transform duration-200 ${showPageDropdown ? 'rotate-180' : ''} text-gray-500`} />
                                    </div>

                                    {showPageDropdown && (
                                        <div
                                            className="absolute top-[3.6vw] left-0 right-0 max-h-[8vw] overflow-y-auto overflow-x-hidden border border-gray-200 rounded-[0.8vw] shadow-2xl z-[150] bg-white pointer-events-auto overscroll-contain touch-pan-y"
                                            onClick={(e) => e.stopPropagation()}
                                            onWheel={(e) => e.stopPropagation()}
                                        >
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setTargetPageIndex(i);
                                                        setShowPageDropdown(false);
                                                    }}
                                                    className={`flex items-center px-[1vw] py-[0.5vw] cursor-pointer text-[0.8vw] font-bold transition-colors ${targetPageIndex === i ? 'bg-gray-100 text-[#1a1a1a]' : 'hover:bg-gray-50 text-gray-600'}`}
                                                >
                                                    Page {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-[0.6vw] mt-[0.5vw]">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 h-[2.2vw] rounded-full border-2 border-[#1a1a1a] font-bold text-[0.8vw] text-[#1a1a1a] transition-all hover:bg-gray-100 flex items-center justify-center gap-[0.4vw]"
                                    >
                                        <Icon icon="lucide:x" className="w-[1vw] h-[1vw] stroke-[3]" /> Clear
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAddBookmark({
                                                id: Date.now(),
                                                label: bookmarkText || `Page ${targetPageIndex + 1}`,
                                                pageIndex: targetPageIndex,
                                                color: selectedColor,
                                                style: bookmarkStyle,
                                                font: bookmarkFont
                                            });
                                            onClose();
                                        }}
                                        className="flex-1 h-[2.2vw] bg-[#1a1a1a] text-white rounded-full font-bold text-[0.8vw] transition-all hover:bg-black/80 shadow-lg active:scale-95"
                                    >
                                        Add Bookmark
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showPageDropdown && (
                    <div className="fixed inset-0 z-[105] bg-transparent" onClick={(e) => { e.stopPropagation(); setShowPageDropdown(false); }} />
                )}
            </div>
        );
    }

    const finalLayoutId = typeof activeLayout === 'object' ? activeLayout?.id : activeLayout;

    if (Number(finalLayoutId || 3) === 3) {
        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5"
                onClick={onClose}
            >
                <div
                    className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                    style={{
                        transform: isMobileLandscape ? 'scale(1.1) translateZ(0)' : (isSidebarOpen ? 'translate(8vw, 0)' : 'none'),
                        transformOrigin: 'center center'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <DesktopLayout3
                        onClose={onClose} selectedColor={selectedColor} setSelectedColor={setSelectedColor}
                        textColor={textColor} setTextColor={setTextColor} opacity={opacity} setOpacity={setOpacity}
                        textOpacity={textOpacity} setTextOpacity={setTextOpacity} bookmarkText={bookmarkText}
                        setBookmarkText={setBookmarkText} targetPageIndex={targetPageIndex} setTargetPageIndex={setTargetPageIndex}
                        totalPages={totalPages} isSidebarOpen={isSidebarOpen} showColorPicker={showColorPicker}
                        setShowColorPicker={setShowColorPicker} pickerTarget={pickerTarget} setPickerTarget={setPickerTarget}
                        setPickerPos={setPickerPos} pickerPos={pickerPos} bookmarkStyle={bookmarkStyle}
                        bookmarkFont={bookmarkFont} onAddBookmark={onAddBookmark} getLayoutColor={getLayoutColor}
                        getLayoutColorRgba={getLayoutColorRgba} getLayoutColorAlpha={getLayoutColorAlpha} hexToRgba={hexToRgba}
                        getBookmarkClipPath={getBookmarkClipPath} getBookmarkBorderRadius={getBookmarkBorderRadius}
                        Icon={Icon} isMobileLandscape={false}
                    />
                </div>
            </div>
        );
    }

    if (Number(finalLayoutId) === 4 || Number(finalLayoutId) === 5 || Number(finalLayoutId) === 6) {
        return (
            <div
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5 px-[2vw]"
                onClick={onClose}
            >
                {renderDesktopLayout()}
            </div>
        );
    }

    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/5 px-[2vw]"
            onClick={onClose}
        >
            <div
                className="rounded-[1.2vw] shadow-2xl p-[1vw] w-[35vw] relative animate-in zoom-in-95 duration-200 border select-none overflow-visible transition-transform duration-300"
                style={{
                    backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    transform: isMobileLandscape ? 'scale(1.1) translateZ(0)' : (isSidebarOpen ? 'translate(8vw, 0)' : 'none'),
                    transformOrigin: 'center center',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    textRendering: 'optimizeLegibility'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex flex-col mb-[0.8vw]">
                    <div className="flex items-center justify-between relative z-10">
                        <h2 className={`${isMobileLandscape ? 'text-[1.2vw]' : 'text-[0.9vw]'} font-bold tracking-tight text-white`}>Add Bookmark</h2>
                        <button
                            onClick={onClose}
                            className="w-[1.6vw] h-[1.6vw] flex items-center justify-center text-white opacity-60 hover:opacity-100 transition-colors"
                        >
                            <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw] stroke-[2.5]" />
                        </button>
                    </div>
                </div>
                <div className="h-[1px] w-full mb-[1vw] bg-white/20" />

                {/* Content Grid */}
                <div className="flex gap-[1vw] items-start">
                    {/* Left Column: Color Selection */}
                    <div className="flex flex-col gap-[0.4vw] pt-[0.2vw]">
                        {['#D15D6D', '#6B7CBF', '#6FAF7C', '#D8DC53'].map((color, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedColor(color)}
                                className={`w-[1.6vw] h-[1.6vw] rounded-full transition-all border-[1.5px] shadow-sm ${selectedColor === color ? 'border-white scale-110 shadow-lg' : 'border-white/20 hover:border-white/50'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    {/* Middle Column: Preview Area */}
                    <div className="flex-1 min-w-0 flex items-center justify-center pt-[0.2vw]">
                        <div
                            className="relative w-full h-[9vw] flex items-center justify-center shadow-md transition-all duration-300"
                            style={{
                                backgroundColor: hexToRgba(selectedColor, opacity),
                                clipPath: getBookmarkClipPath(bookmarkStyle),
                                borderRadius: getBookmarkBorderRadius(bookmarkStyle),
                                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))'
                            }}
                        >
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setBookmarkText(e.currentTarget.textContent)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                className={`${isMobileLandscape ? 'text-[1.8vw]' : 'text-[1.3vw]'} font-bold outline-none text-center px-4 cursor-text w-full text-white`}
                                style={{ color: hexToRgba(textColor, textOpacity), fontFamily: bookmarkFont }}
                                dangerouslySetInnerHTML={{ __html: bookmarkText }}
                            />
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div className="w-[11.5vw] flex flex-col gap-[0.8vw]">
                        {/* Page Selection */}
                        <div className="space-y-[0.4vw] relative">
                            <div className="flex items-center gap-[0.3vw]">
                                <span className={`${isMobileLandscape ? 'text-[1vw]' : 'text-[0.65vw]'} font-bold whitespace-nowrap text-white`}>Add on</span>
                                <div className="flex-1 h-[1px] bg-white/40" />
                            </div>
                            <div
                                onClick={() => setShowPageDropdown(!showPageDropdown)}
                                className="h-[1.8vw] rounded-[0.4vw] flex items-center px-[0.5vw] justify-between shadow-inner group cursor-pointer transition-colors border bg-white/10 border-white/20"
                            >
                                <span className={`${isMobileLandscape ? 'text-[1vw]' : 'text-[0.65vw]'} font-bold text-white`}>Page {targetPageIndex + 1}</span>
                                <Icon icon="fluent:chevron-down-24-filled" className={`w-[0.8vw] h-[0.8vw] transition-transform duration-200 ${showPageDropdown ? 'rotate-180' : ''} text-white/60`} />
                            </div>

                            {showPageDropdown && (
                                <div className="absolute top-[3.2vw] left-0 right-0 max-h-[10vw] overflow-y-auto border border-white/20 rounded-[0.4vw] shadow-2xl z-[150] custom-scrollbar bg-gray-800/90 backdrop-filter backdrop-blur-xl">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setTargetPageIndex(i);
                                                setShowPageDropdown(false);
                                            }}
                                            className={`flex items-center px-[0.6vw] py-[0.4vw] cursor-pointer ${isMobileLandscape ? 'text-[0.9vw]' : 'text-[0.65vw]'} font-bold transition-colors ${targetPageIndex === i ? 'bg-white text-gray-800' : 'hover:bg-white/10 text-white'}`}
                                        >
                                            Page {i + 1}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-[0.4vw] mt-[0.3vw]">
                            <button
                                onClick={onClose}
                                className={`flex-1 h-[2vw] rounded-[0.4vw] border border-white/40 font-bold ${isMobileLandscape ? 'text-[1.1vw]' : 'text-[0.65vw]'} flex items-center justify-center gap-[0.2vw] hover:bg-white/10 transition-all shadow-sm text-white`}
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => {
                                    onAddBookmark({
                                        id: Date.now(),
                                        label: bookmarkText,
                                        pageIndex: targetPageIndex,
                                        color: selectedColor,
                                        style: bookmarkStyle,
                                        font: bookmarkFont
                                    });
                                    onClose();
                                }}
                                className={`flex-1 h-[2vw] rounded-[0.4vw] font-bold ${isMobileLandscape ? 'text-[1.1vw]' : 'text-[0.65vw]'} bg-white text-gray-800 hover:opacity-90 transition-all shadow-lg active:scale-[0.98]`}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showColorPicker && (
                <ColorPallet
                    smallMode={true}
                    color={pickerTarget === 'background' ? selectedColor : textColor}
                    onChange={(newColor) => {
                        if (pickerTarget === 'background') setSelectedColor(newColor);
                        else setTextColor(newColor);
                    }}
                    opacity={pickerTarget === 'background' ? opacity : textOpacity}
                    onOpacityChange={(newOpacity) => {
                        if (pickerTarget === 'background') setOpacity(newOpacity);
                        else setTextOpacity(newOpacity);
                    }}
                    onClose={() => setShowColorPicker(false)}
                    style={{
                        position: 'fixed',
                        top: pickerPos.y,
                        left: pickerPos.x,
                        transform: 'none'
                    }}
                />
            )}
        </div>
    );
};

export default AddBookmarkPopup;
