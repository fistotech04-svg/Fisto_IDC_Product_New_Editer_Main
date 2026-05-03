import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ColorPallet from '../ColorPallet';

const AddBookmarkPopupLandscape = ({ 
    onClose, 
    currentPageIndex, 
    totalPages, 
    onAddBookmark, 
    isSidebarOpen, 
    isSpread, 
    bookmarkSettings, 
    activeLayout,
    layoutColors,
    onNavigate
}) => {
    const [selectedColor, setSelectedColor] = useState(bookmarkSettings?.color || '#34B1AA');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [opacity, setOpacity] = useState(100);
    const [textOpacity, setTextOpacity] = useState(100);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState('background');
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
    const [bookmarkText, setBookmarkText] = useState('');
    const [targetPageIndex, setTargetPageIndex] = useState(currentPageIndex);
    const [showPageDropdown, setShowPageDropdown] = useState(false);
    const [bookmarkStyle, setBookmarkStyle] = useState(bookmarkSettings?.style || 'classic');
    const [bookmarkFont, setBookmarkFont] = useState(bookmarkSettings?.font || 'serif');

    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
    const getLayoutColorAlpha = (id, defaultRgb, alpha) => `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;

    const hexToRgba = (hex, alpha = 100) => {
        if (!hex || typeof hex !== 'string') return `rgba(255, 255, 255, ${alpha / 100})`;
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
    };

    const getBookmarkClipPath = (style) => {
        switch (style) {
            case 'classic': return 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)';
            case 'modern': return 'none';
            case 'ribbon': return 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)';
            default: return 'none';
        }
    };

    return (
        <div
            className="absolute inset-0 z-[3000] flex items-center justify-center pointer-events-auto bg-transparent p-2"
            onClick={onClose}
        >
            <div
                className="rounded-[20px] shadow-2xl p-[5px] w-full max-w-[420px] relative animate-in zoom-in-95 duration-200 select-none overflow-visible border-[3px] border-white/90"
                style={{
                    backgroundColor: 'rgba(87, 92, 156, 0.95)',
                    boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-full p-3">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-base font-bold whitespace-nowrap text-white">Add Bookmark</h2>
                        <div className="flex-1 h-[1px] bg-white/20 mt-0.5"></div>
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <Icon icon="lucide:x" className="w-4 h-4 stroke-[2.5]" />
                        </button>
                    </div>

                    <div className="flex gap-4 items-start">
                        {/* Left: Color Palette (Vertical) */}
                        <div className="flex flex-col gap-1.5 pt-0.5">
                            {['#D65D6D', '#6B7DBB', '#67AC78', '#D8DC53', '#2EB0B1'].map((color, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-6 h-6 rounded-[6px] transition-all border-[1.5px] ${selectedColor === color ? 'scale-110 shadow-sm border-white' : 'border-transparent hover:border-white/20'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPickerPos({ x: rect.right + 10, y: rect.top - 50 });
                                    setPickerTarget('background');
                                    setShowColorPicker(true);
                                }}
                                className="w-6 h-6 rounded-[6px] border-[1.5px] border-transparent hover:border-white/20 transition-transform bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
                            />
                        </div>

                        {/* Middle: Preview */}
                        <div className="flex-1 flex items-center justify-center pt-0.5">
                            <div
                                className="relative w-full h-[100px] flex items-center justify-center shadow-lg"
                                style={{
                                    backgroundColor: hexToRgba(selectedColor, opacity),
                                    clipPath: getBookmarkClipPath('classic'),
                                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
                                }}
                            >
                                <div
                                    className="text-xl font-bold text-center text-white"
                                    style={{ 
                                        color: hexToRgba(textColor, textOpacity), 
                                        fontFamily: 'serif',
                                        letterSpacing: '0.4px'
                                    }}
                                >
                                    {`Page ${targetPageIndex + 1}`}
                                </div>
                            </div>
                        </div>

                        {/* Right: Controls */}
                        <div className="w-[145px] flex flex-col gap-3">
                            {/* Text Color Section */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-white/60 whitespace-nowrap uppercase">Text Color</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPickerPos({ x: rect.left - 150, y: rect.top - 100 });
                                            setPickerTarget('text');
                                            setShowColorPicker(true);
                                        }}
                                        className="w-7 h-7 rounded-[6px] border-2 border-white/10 shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                        style={{ backgroundColor: textColor }}
                                    />
                                    <div className="flex-1 h-7 rounded-[8px] bg-[#FFFFFF1F] border border-white/5 flex items-center px-2 justify-between">
                                        <span className="text-[10px] font-bold text-white uppercase">{textColor}</span>
                                        <span className="text-[10px] font-bold text-white/30">100%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Select Page Section */}
                            <div className="flex flex-col gap-1.5 relative">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-white/60 whitespace-nowrap uppercase">Select Page</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>
                                <div
                                    className="h-7 rounded-[8px] bg-[#FFFFFF1F] border border-white/5 flex items-center px-2 justify-between cursor-pointer"
                                    onClick={() => setShowPageDropdown(!showPageDropdown)}
                                >
                                    <span className="text-[11px] font-bold text-white">Page {targetPageIndex + 1}</span>
                                    <Icon icon="lucide:chevron-down" className="text-white/50 w-3.5 h-3.5" />
                                </div>
                                {showPageDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 max-h-24 overflow-y-auto bg-[#575C9C] border border-white/20 rounded-lg shadow-2xl z-[100] custom-scrollbar animate-in fade-in slide-in-from-top-1">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setTargetPageIndex(i);
                                                    setShowPageDropdown(false);
                                                }}
                                                className={`px-3 py-1.5 cursor-pointer text-[10px] font-bold transition-colors ${targetPageIndex === i ? 'bg-white text-[#575C9C]' : 'text-white hover:bg-white/10'}`}
                                            >
                                                Page {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-1.5 mt-1">
                                <button
                                    onClick={() => {
                                        setTargetPageIndex(currentPageIndex);
                                        setSelectedColor('#34B1AA');
                                        setTextColor('#FFFFFF');
                                    }}
                                    className="flex-1 h-[30px] rounded-[8px] border border-white flex items-center justify-center gap-1 text-white font-bold text-[10px] hover:bg-white/10 transition-all active:scale-95"
                                >
                                    <Icon icon="lucide:x" className="w-3 h-3 stroke-[3]" />
                                    <span>Clear</span>
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
                                    className="flex-[1.4] h-[30px] rounded-[8px] bg-white text-[#575C9C] font-extrabold text-[10px] shadow-sm hover:bg-white/90 active:scale-95 transition-all"
                                >
                                    Add Bookmark
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {showColorPicker && (
                    <div className="absolute z-[4000] animate-in fade-in zoom-in-95 duration-200" style={{ top: pickerPos.y, left: pickerPos.x }}>
                        <ColorPallet
                            smallMode={true}
                            color={pickerTarget === 'background' ? selectedColor : textColor}
                            opacity={pickerTarget === 'background' ? opacity : textOpacity}
                            onChange={(color) => {
                                if (pickerTarget === 'background') setSelectedColor(color);
                                else setTextColor(color);
                            }}
                            onOpacityChange={(val) => {
                                if (pickerTarget === 'background') setOpacity(val);
                                else setTextOpacity(val);
                            }}
                            onClose={() => setShowColorPicker(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddBookmarkPopupLandscape;
