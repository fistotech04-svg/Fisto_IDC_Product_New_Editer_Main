import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const NoteCard = ({ note, onUpdate, isLayout2, isLayout3, isTablet, isMobile, activeLayout, isMobileLandscape, isPortrait }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(note.pageLabel);

    const handleSave = () => {
        if (onUpdate && note.id) {
            onUpdate(note.id, { pageLabel: editValue });
        }
        setIsEditing(false);
    };

    const isL3 = isLayout3 || Number(activeLayout) === 3 || activeLayout === '3';
    const isL4 = Number(activeLayout) === 4 || Number(activeLayout) === 5 || Number(activeLayout) === 6;
    const fontSize = isPortrait ? '12px' : isMobile ? '10px' : isTablet ? '1.4vw' : isMobileLandscape ? '13px' : '0.85vw';
    const textColor = (isLayout2) ? '#ffffff' : (isL3) ? '#000000' : note.color;
    const textOpacity = (isLayout2 || isL3) ? 1 : (note.textOpacity / 100);
    const bgOpacity = (isLayout2 || isL3) ? 1 : (note.bgOpacity / 100);

    return (
        <div
            className={`relative shadow-sm flex flex-col transition-all hover:scale-[1.02] hover:shadow-xl
                ${isMobile
                    ? (isPortrait ? 'aspect-square rounded-[12px] p-3' : 'h-[140px] rounded-xl p-3')
                    : isTablet
                        ? 'h-[25vw] rounded-[1.5vw] p-[2vw]'
                        : isMobileLandscape
                            ? 'h-[140px] rounded-[14px] p-[12px]'
                            : 'h-[11vw] rounded-[0.5vw] p-[1.2vw]'}`}
            style={{
                backgroundColor: note.background,
                opacity: bgOpacity
            }}
        >
            {!isPortrait && (
                <div className={`flex justify-end ${isMobile ? 'gap-2 mb-1' : isTablet ? 'gap-[0.8vw] mb-[1.2vw]' : isMobileLandscape ? 'gap-2 mb-2' : 'gap-[0.4vw] mb-[0.4vw]'} items-center`}>
                    {isEditing ? (
                        <input
                            autoFocus
                            className={`bg-transparent border-b outline-none font-bold ${isMobile ? 'text-[9px]' : isTablet ? 'text-[1.4vw]' : isMobileLandscape ? 'text-[13px]' : 'text-[0.85vw]'}`}
                            style={{ color: textColor, borderColor: textColor }}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <>
                            <span
                                className={`font-bold ${isMobile ? 'text-[9px]' : isTablet ? 'text-[1.4vw]' : isMobileLandscape ? 'text-[13px]' : 'text-[0.85vw]'}`}
                                style={{ color: textColor, opacity: textOpacity }}
                            >
                                {note.pageLabel}
                            </span>
                            {!isL3 && !isL4 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                    className="hover:scale-110 transition-transform"
                                >
                                    <Icon
                                        icon="mdi:rename"
                                        className={`${isMobile ? 'w-[12px] h-[12px]' : isTablet ? 'w-[1.6vw] h-[1.6vw]' : isMobileLandscape ? 'w-[16px] h-[16px]' : 'w-[1vw] h-[1vw]'} opacity-60`}
                                        style={{ color: textColor }}
                                    />
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            <div
                className="flex-1 overflow-y-auto whitespace-pre-wrap break-words custom-scrollbar-mini"
                style={{
                    textAlign: note.alignment,
                    fontWeight: note.weight === 'Bold' ? 700 : note.weight === 'Semi Bold' ? 600 : 400,
                    fontStyle: note.styles?.includes('italic') ? 'italic' : 'normal',
                    textDecoration: `${note.styles?.includes('underline') ? 'underline' : ''} ${note.styles?.includes('strike') ? 'line-through' : ''}`,
                    textTransform: note.case === 'upper' ? 'uppercase' : note.case === 'lower' ? 'lowercase' : note.case === 'sentence' ? 'capitalize' : 'none',
                    fontFamily: note.fontFamily,
                    fontSize: fontSize,
                    color: textColor,
                    opacity: textOpacity,
                    lineHeight: isMobile || isMobileLandscape ? 1.3 : 1.4
                }}
            >
                {note.content}
            </div>

            {isPortrait && (
                <div className="flex justify-end items-center pointer-events-none mt-auto">
                    <span className={`text-[9px] font-extrabold ${isL3 ? 'text-black/60' : 'text-white/60'}`}>{note.pageLabel}</span>
                </div>
            )}
        </div>
    );
};

const MobileLayout = ({ notes, onClose, onUpdate, isLandscape, activeLayout, layoutColors }) => {
    const layoutId = typeof activeLayout === 'object' ? activeLayout?.id : activeLayout;
    const isL2 = Number(layoutId) === 2 || layoutId === '2';
    const isL3 = Number(layoutId) === 3 || layoutId === '3' || !layoutId;
    const isL9 = Number(layoutId) === 9 || layoutId === '9';

    const hexToRgba = (hex, opacity = 100) => {
        if (!hex || !hex.startsWith('#')) return hex;
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = Math.max(0, Math.min(1, opacity / 100));
        return a >= 1 ? hex : `rgba(${r},${g},${b},${a})`;
    };

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
        if (layoutColors && Array.isArray(layoutColors)) {
            const c = layoutColors.find(x => x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity ?? (defaultOpacity * 100));
        }
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    if (!isLandscape) {
        return (
            <div className="absolute inset-0 z-[3000] flex items-center justify-center pointer-events-auto bg-black/5 px-4" onClick={onClose}>
                <div
                    className={`w-[90%] aspect-square shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden 
                        ${isL2 ? 'bg-white/60 backdrop-blur-xl p-[6px] border border-white/20 rounded-[24px]' :
                            isL3 ? 'bg-white rounded-[24px] border border-gray-200 p-5' :
                                isL9 ? 'backdrop-blur-lg border border-white/20 rounded-[16px] p-5' :
                                    Number(layoutId) === 8 ? 'bg-white border border-gray-100 rounded-[18px] p-5 shadow-xl' :
                                        'bg-[#575C9C]/80 backdrop-blur-lg border border-white/20 rounded-[16px] p-5'}`}
                    style={isL9 ? { backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.6') } : {}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`w-full h-full flex flex-col gap-2 rounded-[18px] ${isL2 ? 'bg-[#575C9C] p-5 shadow-inner' : 'bg-transparent'}`}>
                        {/* Header: Title and Close Button */}
                        {(Number(layoutId) === 8) ? (
                            <div className="flex items-center justify-between bg-[#575C9C] -mx-5 -mt-5 px-4 py-3 mb-3 rounded-t-[18px]">
                                <h2 className="text-white text-[15px] font-bold">Notes Viewer</h2>
                                <button
                                    onClick={onClose}
                                    className="text-white hover:opacity-80 transition-opacity active:scale-90"
                                >
                                    <Icon icon="lucide:x" className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center relative mb-4 pt-1">
                                <h2 className={`font-bold ${isL3 ? 'text-black text-[15px]' : 'text-white text-[18px]'} ${isL2 ? 'text-[14px]' : ''}`}>Notes Viewer</h2>
                                <button
                                    onClick={onClose}
                                    className={`absolute right-0 hover:opacity-80 transition-opacity active:scale-90 ${isL3 ? 'text-black' : 'text-white'}`}
                                >
                                    <Icon icon="lucide:x" className={(isL2 || isL3) ? 'w-[18px] h-[18px]' : 'w-6 h-6'} />
                                </button>
                            </div>
                        )}

                        {/* Grid of Notes */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar-portrait px-1">
                            <style>{`
                            .custom-scrollbar-portrait::-webkit-scrollbar { width: 4px; }
                            .custom-scrollbar-portrait::-webkit-scrollbar-track { background: transparent; }
                            .custom-scrollbar-portrait::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
                            .custom-scrollbar-portrait::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
                        `}</style>
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                {notes.map((note, idx) => (
                                    <NoteCard key={note.id || idx} note={note} onUpdate={onUpdate} isMobile={true} isPortrait={true} activeLayout={activeLayout} />
                                ))}
                            </div>
                            {notes.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-white/40 gap-3">
                                    <Icon icon="solar:notes-bold" className="w-10 h-10 opacity-20" />
                                    <p className="text-[14px] font-medium">No Notes Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="absolute inset-0 z-[3000] flex items-center justify-center pointer-events-auto bg-black/10 px-4"
            onClick={onClose}
        >
            <div
                className={`w-full ${isLandscape ? 'max-w-[450px] max-h-[80%]' : 'max-w-[280px] max-h-[80vh]'} rounded-2xl shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden outline-none border border-white/20`}
                style={{ backgroundColor: 'rgba(74, 79, 142, 0.98)', backdropFilter: 'blur(20px)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex-1"></div>
                    <h2 className="text-[16px] font-bold text-white">Notes Viewer</h2>
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors"
                        >
                            <Icon icon="lucide:x" className="w-[18px] h-[18px]" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-3 auto-rows-max">
                        {notes.map((note, idx) => (
                            <NoteCard key={note.id || idx} note={note} onUpdate={onUpdate} isMobile={true} />
                        ))}
                        {notes.length === 0 && (
                            <div className="col-span-2 flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
                                <Icon icon="solar:notes-bold" className="w-12 h-12 opacity-20" />
                                <p className="text-[14px] font-medium">No Notes Found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MobileLandscapeNoteCard = ({ note }) => {
    return (
        <div
            className="relative shadow-sm flex flex-col transition-all hover:scale-[1.02] hover:shadow-xl h-[110px] rounded-lg p-2 overflow-hidden"
            style={{
                backgroundColor: note.background,
                opacity: note.bgOpacity / 100 || 1
            }}
        >
            <div
                className="flex-1 overflow-y-auto whitespace-pre-wrap break-words custom-scrollbar-mini pb-4"
                style={{
                    textAlign: note.alignment,
                    fontWeight: note.weight === 'Bold' ? 700 : note.weight === 'Semi Bold' ? 600 : 400,
                    fontStyle: note.styles?.includes('italic') ? 'italic' : 'normal',
                    textDecoration: `${note.styles?.includes('underline') ? 'underline' : ''} ${note.styles?.includes('strike') ? 'line-through' : ''}`,
                    textTransform: note.case === 'upper' ? 'uppercase' : note.case === 'lower' ? 'lowercase' : note.case === 'sentence' ? 'capitalize' : 'none',
                    fontFamily: note.fontFamily,
                    fontSize: '10px',
                    color: '#ffffff',
                    opacity: note.textOpacity / 100 || 1,
                    lineHeight: 1.3
                }}
            >
                {note.content}
            </div>
            <div className="absolute bottom-1.5 right-1.5 flex justify-end items-center pointer-events-none">
                <span className="font-bold text-[8px] text-white">
                    {note.pageLabel}
                </span>
            </div>
        </div>
    );
};

const MobileLandscapeLayout1 = ({ notes, onClose, layoutColors }) => {
    const hexToRgba = (hex, opacity = 100) => {
        if (!hex || !hex.startsWith('#')) return hex;
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = Math.max(0, Math.min(1, opacity / 100));
        return a >= 1 ? hex : `rgba(${r},${g},${b},${a})`;
    };

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
        if (layoutColors && Array.isArray(layoutColors)) {
            const c = layoutColors.find(x => x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity ?? (defaultOpacity * 100));
        }
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    return (
        <div className="absolute inset-0 z-[3000] flex items-center justify-center pointer-events-auto bg-black/20" onClick={onClose}>
            <div
                className="flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden box-border backdrop-blur-xl shadow-2xl rounded-[16px] w-[75%] max-w-[480px] h-[80%] border border-white/10"
                style={{
                    backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.85'),
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-center relative w-full pt-3 pb-2 px-3">
                    <h2 className="text-[16px] font-bold tracking-wide" style={{ color: getLayoutColorRgba('dropdown-text', '26, 26, 46', '1') }}>Notes Viewer</h2>
                    <button
                        onClick={onClose}
                        className="absolute right-4 text-[#EB5757] hover:opacity-80 transition-opacity"
                    >
                        <Icon icon="lucide:x-circle" className="w-[16px] h-[16px]" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="w-[92%] mx-auto h-[1px] rounded-full mb-2.5" style={{ backgroundColor: getLayoutColorRgba('dropdown-text', '26, 26, 46', '0.1') }}></div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-0">
                    <div className="grid grid-cols-3 gap-2.5 auto-rows-max">
                        {notes.map((note, idx) => (
                            <MobileLandscapeNoteCard key={idx} note={note} />
                        ))}
                        {notes.length === 0 && (
                            <div className="col-span-3 flex flex-col items-center justify-center py-10 gap-2 opacity-50 text-white">
                                <Icon icon="solar:notes-bold" className="w-8 h-8" />
                                <p className="text-[12px] font-medium">No Notes Found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DesktopLayout1 = ({ notes, onClose, onUpdate, isTablet, isSidebarOpen, activeLayout, layoutColors }) => {
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
        if (layoutColors && Array.isArray(layoutColors)) {
            const c = layoutColors.find(x => x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity ?? (defaultOpacity * 100));
        }
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    const textColor = getLayoutColor('dropdown-text', '#FFFFFF');

    return (
        <div
            className={`flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden box-border backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] border
                ${isTablet ? 'h-[52vh] w-[35vw] rounded-[1vw]' : `${isSidebarOpen ? 'h-[68vh] w-[52vw]' : 'h-[75vh] w-[58vw]'} rounded-[0.8vw]`}`}
            style={{
                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.6'),
                borderColor: `color-mix(in srgb, ${textColor} 20%, transparent)`
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`flex items-center justify-between w-full ${isTablet ? 'px-[2vw] pt-[2vw] pb-[1vw]' : 'px-[1.5vw] pt-[1vw] pb-[0.6vw]'}`}>
                <h2 className={`${isTablet ? 'text-[1.5vw]' : 'text-[1.1vw]'} font-bold tracking-wide`} style={{ color: textColor }}>Notes Viewer</h2>
                <button
                    onClick={onClose}
                    className="transition-opacity opacity-70 hover:opacity-100 flex items-center justify-center p-[0.3vw]"
                    style={{ color: textColor }}
                >
                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />
                </button>
            </div>

            <div className={`${Number(activeLayout) === 1 ? 'h-[2px]' : 'h-[1px]'} mx-auto`} style={{ backgroundColor: `color-mix(in srgb, ${textColor} 20%, transparent)`, width: isTablet ? "calc(100% - 4vw)" : "calc(100% - 3vw)", borderRadius: "100px" }}></div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar ${isTablet ? 'p-[2vw]' : 'p-[1.5vw]'}`}>
                <div className={`grid ${isTablet ? 'grid-cols-2 gap-[3vw]' : 'grid-cols-4 gap-[1.5vw]'} auto-rows-max`}>
                    {notes.map((note, idx) => (
                        <NoteCard key={idx} note={note} isTablet={isTablet} activeLayout={activeLayout} />
                    ))}
                    {notes.length === 0 && (
                        <div className={`flex flex-col items-center justify-center ${isTablet ? 'col-span-2 py-[10vh]' : 'col-span-4 py-[15vh]'} gap-[1vw]`} style={{ color: `color-mix(in srgb, ${textColor} 40%, transparent)` }}>
                            <Icon icon="solar:notes-bold" className={isTablet ? 'w-[5vw] h-[5vw] opacity-20' : 'w-[4vw] h-[4vw] opacity-20'} />
                            <p className={isTablet ? 'text-[1.5vw] font-medium' : 'text-[1.2vw] font-medium'}>No Notes Found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DesktopLayout3 = ({ notes, onClose, onUpdate, isTablet, isSidebarOpen, isMobileLandscape, layoutColors }) => {
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
        if (layoutColors && Array.isArray(layoutColors)) {
            const c = layoutColors.find(x => x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity ?? (defaultOpacity * 100));
        }
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
        if (layoutColors && Array.isArray(layoutColors)) {
            const c = layoutColors.find(x => x.id === id);
            if (c) return hexToRgba(c.hex, alpha * 100);
        }
        return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
    };

    const textColor = getLayoutColor('dropdown-text', '#3E4491');
    const bgColor = getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1');

    return (
        <div
            className={`flex flex-col pointer-events-auto animate-in zoom-in-95 duration-300 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)]
            ${isTablet ? 'h-[55vh] w-[40vw] rounded-[1vw]' : isMobileLandscape ? 'h-[58vh] w-[52vw] rounded-[1vw]' : `${isSidebarOpen ? 'h-[70vh] w-[58vw]' : 'h-[75vh] w-[65vw]'} rounded-[0.8vw]`}`}
            style={{ backgroundColor: bgColor }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className={`flex items-center justify-between ${isTablet ? 'px-[3vw] py-[2vw]' : 'px-[2.5vw] py-[1.8vw]'}`}>
                <h2 className={`${isTablet ? 'text-[1.8vw]' : 'text-[1.6vw]'} font-bold`} style={{ color: textColor }}>Notes Viewer</h2>
                <button
                    onClick={onClose}
                    className="flex items-center justify-center transition-all w-[2.2vw] h-[2.2vw] border-[1.5px] rounded-[0.6vw] hover:scale-105 active:scale-95 shadow-sm"
                    style={{ borderColor: textColor, color: textColor }}
                >
                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[1.2vw] h-[1.2vw] stroke-[2.5]'}`} />
                </button>
            </div>

            {/* Scrollable Grid Area */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar-layout3 ${isTablet ? 'px-[3vw] pb-[3vw]' : 'px-[2.5vw] pb-[2.5vw]'}`}>
                <style>{`
                .custom-scrollbar-layout3::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar-layout3::-webkit-scrollbar-track { background: ${getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05)}; border-radius: 10px; }
                .custom-scrollbar-layout3::-webkit-scrollbar-thumb { background: ${getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.2)}; border-radius: 10px; }
                .custom-scrollbar-layout3::-webkit-scrollbar-thumb:hover { background: ${getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.4)}; }
            `}</style>
                <div className={`grid ${isTablet ? 'grid-cols-2 gap-[3vw]' : 'grid-cols-4 gap-[2vw]'} auto-rows-max`}>
                    {notes.map((note, idx) => (
                        <NoteCard key={note.id || idx} note={note} onUpdate={onUpdate} isLayout3={true} activeLayout={3} isTablet={isTablet} />
                    ))}
                </div>
                {notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-[15vh] gap-[1.5vw]">
                        <div className="w-[6vw] h-[6vw] rounded-full flex items-center justify-center" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '62, 68, 145', 0.05) }}>
                            <Icon icon="solar:notes-bold" className="w-[3vw] h-[3vw]" style={{ color: textColor, opacity: 0.2 }} />
                        </div>
                        <p className="text-[1.2vw] font-bold" style={{ color: textColor, opacity: 0.3 }}>No Notes Found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const DesktopLayout2 = ({ notes, onClose, onUpdate, isTablet, isSidebarOpen, isMobileLandscape }) => (
    <div
        className={`flex flex-col pointer-events-auto animate-in zoom-in-95 duration-300 overflow-hidden backdrop-blur-md border shadow-[0_4vw_10vw_rgba(0,0,0,0.15)]
            ${isTablet ? 'h-[55vh] w-[40vw] rounded-[1vw] p-[0.4vw]' : isMobileLandscape ? 'h-[58vh] w-[52vw] rounded-[1vw] p-[0.5vw]' : `${isSidebarOpen ? 'h-[70vh] w-[58vw]' : 'h-[75vh] w-[65vw]'} rounded-[0.8vw] p-[0.6vw]`}`}
        style={{
            backgroundColor: "color-mix(in srgb, var(--dropdown-text, #FFFFFF) 60%, transparent)",
            borderColor: "color-mix(in srgb, var(--dropdown-text, #FFFFFF) 30%, transparent)"
        }}
        onClick={(e) => e.stopPropagation()}
    >
        <div
            className={`w-full h-full flex flex-col relative overflow-hidden border
                ${isTablet ? 'rounded-[0.8vw]' : 'rounded-[1.4vw]'}`}
            style={{
                backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))",
                borderColor: "color-mix(in srgb, var(--dropdown-text, #FFFFFF) 20%, transparent)"
            }}
        >
            <div className={`flex items-center justify-between ${isTablet ? 'px-[1.5vw] py-[1.2vw]' : 'px-[2vw] py-[1.5vw]'}`}>
                <div className="flex-1"></div>
                <div className="flex-1 flex justify-center">
                    <h2 className={`${isTablet ? 'text-[1.2vw]' : 'text-[1.8vw]'} font-bold`} style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }}>Notes Viewer</h2>
                </div>
                <div className="flex-1 flex justify-end">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center transition-colors w-[2.2vw] h-[2.2vw] rounded-[0.5vw] hover:opacity-100"
                        style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 0.7)" }}
                    >
                        <Icon icon="lucide:x" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar-layout2 ${isTablet ? 'p-[2vw]' : 'px-[3vw] pb-[3vw] pt-[1vw]'}`}>
                <style>{`
                    .custom-scrollbar-layout2::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar-layout2::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                    .custom-scrollbar-layout2::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
                    .custom-scrollbar-layout2::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
                `}</style>
                <div className={`grid ${isTablet ? 'grid-cols-2 gap-[3vw]' : 'grid-cols-4 gap-[2vw]'} auto-rows-max`}>
                    {notes.map((note, idx) => (
                        <NoteCard key={note.id || idx} note={note} onUpdate={onUpdate} isLayout2={true} isTablet={isTablet} />
                    ))}
                    {notes.length === 0 && (
                        <div className={`flex flex-col items-center justify-center ${isTablet ? 'col-span-2 py-[10vh]' : 'col-span-4 py-[15vh]'} gap-[1vw]`} style={{ color: "color-mix(in srgb, var(--dropdown-text, #FFFFFF) 40%, transparent)" }}>
                            <Icon icon="solar:notes-bold" className={isTablet ? 'w-[5vw] h-[5vw] opacity-20' : 'w-[4vw] h-[4vw] opacity-20'} />
                            <p className={isTablet ? 'text-[1.5vw] font-medium' : 'text-[1.2vw] font-medium'}>No Notes Found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const DesktopLayout4 = ({ notes, onClose, onUpdate, isTablet, isSidebarOpen, isMobileLandscape }) => (
    <div
        className={`flex flex-col pointer-events-auto animate-in zoom-in-95 duration-300 overflow-hidden bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100
            ${isTablet ? 'h-[55vh] w-[40vw] rounded-[1vw]' : isMobileLandscape ? 'h-[350px] w-[640px] rounded-[16px]' : `${isSidebarOpen ? 'h-[70vh] w-[58vw]' : 'h-[75vh] w-[65vw]'} rounded-[0.8vw]`}`}
        onClick={(e) => e.stopPropagation()}
    >
        {/* Header */}
        <div className={`flex items-center justify-between ${isTablet ? 'px-6 py-4' : 'px-8 py-5'}`}>
            <h2 className={`${isTablet ? 'text-[1.4vw]' : isMobileLandscape ? 'text-[24px]' : 'text-[20px]'} font-bold text-gray-900`}>Notes Viewer</h2>
            <button
                onClick={onClose}
                className="transition-opacity opacity-50 hover:opacity-100 flex items-center justify-center p-1"
            >
                <Icon icon="lucide:x" className="w-[18px] h-[18px] text-gray-900" />
            </button>
        </div>

        {/* Scrollable Grid Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar-layout4 ${isTablet ? 'px-6 pb-6' : 'px-8 pb-8'}`}>
            <style>{`
                .custom-scrollbar-layout4::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar-layout4::-webkit-scrollbar-track { background: #f8f9fa; border-radius: 10px; }
                .custom-scrollbar-layout4::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 10px; }
                .custom-scrollbar-layout4::-webkit-scrollbar-thumb:hover { background: #333; }
            `}</style>
            <div className={`grid ${isTablet ? 'grid-cols-2 gap-6' : 'grid-cols-4 gap-6'} auto-rows-max`}>
                {notes.map((note, idx) => (
                    <NoteCard key={note.id || idx} note={note} onUpdate={onUpdate} activeLayout={4} isTablet={isTablet} isMobileLandscape={isMobileLandscape} />
                ))}
                {notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-[15vh] gap-4 opacity-30">
                        <Icon icon="solar:notes-bold" className="w-[4vw] h-[4vw]" />
                        <p className="text-[1.2vw] font-bold">No Notes Found</p>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const DesktopLayout8 = ({ notes, onClose, onUpdate, isTablet, isSidebarOpen, activeLayout, layoutColors }) => {
    const primaryBlue = '#575C9C';
    const textColor = '#FFFFFF';

    return (
        <div
            className={`flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden box-border shadow-2xl bg-white
                ${isTablet ? 'h-[55vh] w-[35vw] rounded-[1vw]' : `${isSidebarOpen ? 'h-[70vh] w-[52vw]' : 'h-[75vh] w-[58vw]'} rounded-[1vw]`}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className={`flex items-center justify-between w-full ${isTablet ? 'px-[2vw] py-[1.2vw]' : 'px-[1.5vw] py-[1vw]'}`}
                style={{ backgroundColor: primaryBlue }}
            >
                <h2 className={`${isTablet ? 'text-[1.5vw]' : 'text-[1.1vw]'} font-bold tracking-wide`} style={{ color: textColor }}>Notes Viewer</h2>
                <button
                    onClick={onClose}
                    className="transition-opacity opacity-80 hover:opacity-100 flex items-center justify-center p-[0.3vw]"
                    style={{ color: textColor }}
                >
                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                </button>
            </div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar-layout8 ${isTablet ? 'p-[2vw]' : 'p-[1.5vw]'}`}>
                <style>{`
                    .custom-scrollbar-layout8::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar-layout8::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar-layout8::-webkit-scrollbar-thumb { background: #575C9C33; border-radius: 10px; }
                    .custom-scrollbar-layout8::-webkit-scrollbar-thumb:hover { background: #575C9C55; }
                `}</style>
                <div className={`grid ${isTablet ? 'grid-cols-2 gap-[3vw]' : 'grid-cols-4 gap-[1.5vw]'} auto-rows-max`}>
                    {notes.map((note, idx) => (
                        <NoteCard key={idx} note={note} isTablet={isTablet} activeLayout={activeLayout} />
                    ))}
                    {notes.length === 0 && (
                        <div className={`flex flex-col items-center justify-center ${isTablet ? 'col-span-2 py-[10vh]' : 'col-span-4 py-[15vh]'} gap-[1vw] text-gray-300`}>
                            <Icon icon="solar:notes-bold" className={isTablet ? 'w-[5vw] h-[5vw] opacity-20' : 'w-[4vw] h-[4vw] opacity-20'} />
                            <p className={isTablet ? 'text-[1.5vw] font-medium' : 'text-[1.2vw] font-medium'}>No Notes Found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const NotesViewerPopup = ({ notes, onClose, onDelete, onUpdate, isSidebarOpen, isTablet, isMobile, activeLayout, isLandscape, layoutColors, isMobileLandscape }) => {
    const layoutId = typeof activeLayout === 'object' ? activeLayout?.id : activeLayout;
    const isLayout1 = Number(layoutId) === 1;
    const isLayout2 = Number(layoutId) === 2;
    const isLayout3 = Number(layoutId || 3) === 3;
    const isLayout4 = Number(layoutId) === 4 || Number(layoutId) === 5 || Number(layoutId) === 6;
    const isLayout8 = Number(layoutId) === 8;

    return (
        <>
            {isLayout1 && (
                <style>{`
                    .custom-scrollbar {
                        scrollbar-width: thin !important;
                        scrollbar-color: #444444 rgba(217, 217, 217, 0.6) !important;
                    }
                    .custom-scrollbar::-webkit-scrollbar { 
                        width: 8px !important; 
                        height: 8px !important; 
                    }
                    .custom-scrollbar::-webkit-scrollbar-track { 
                        background: rgba(217, 217, 217, 0.6) !important; 
                        border-radius: 100px !important; 
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb { 
                        background: #444444 !important; 
                        border-radius: 100px !important; 
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
                        background: #333333 !important; 
                    }
                    .custom-scrollbar::-webkit-scrollbar-button { 
                        display: none !important; 
                    }

                    /* Mini scrollbar for individual note content */
                    .custom-scrollbar-mini::-webkit-scrollbar { 
                        width: 4px !important; 
                    }
                    .custom-scrollbar-mini::-webkit-scrollbar-track { 
                        background: transparent !important; 
                    }
                    .custom-scrollbar-mini::-webkit-scrollbar-thumb { 
                        background: rgba(0, 0, 0, 0.15) !important; 
                        border-radius: 10px !important; 
                    }
                    .custom-scrollbar-mini::-webkit-scrollbar-thumb:hover { 
                        background: rgba(0, 0, 0, 0.25) !important; 
                    }
                `}</style>
            )}

            {(isMobile && isLandscape && isLayout1) ? (
                <MobileLandscapeLayout1 notes={notes} onClose={onClose} layoutColors={layoutColors} />
            ) : (isMobile && isLandscape && (isLayout2 || isLayout3)) ? (
                <div
                    className="absolute inset-0 z-[3000] flex items-center justify-center pointer-events-auto bg-transparent"
                    onClick={onClose}
                >
                    <div
                        className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                        style={{ transform: 'scale(0.48)', transformOrigin: 'center center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isLayout3 ? (
                            <DesktopLayout3 notes={notes} onClose={onClose} onUpdate={onUpdate} isTablet={false} isSidebarOpen={false} isMobileLandscape={true} layoutColors={layoutColors} />
                        ) : (
                            <DesktopLayout2 notes={notes} onClose={onClose} onUpdate={onUpdate} isTablet={false} isSidebarOpen={false} isMobileLandscape={true} />
                        )}
                    </div>
                </div>
            ) : isMobile ? (
                <MobileLayout notes={notes} onClose={onClose} onUpdate={onUpdate} isLandscape={isLandscape} activeLayout={activeLayout} layoutColors={layoutColors} />
            ) : (
                // Desktop Perspective
                <div
                    className={`absolute inset-0 z-[110] flex items-center justify-center pointer-events-auto bg-transparent`}
                    onClick={onClose}
                >
                    {isLayout3 ? (
                        <DesktopLayout3 notes={notes} onClose={onClose} onUpdate={onUpdate} isTablet={isTablet} isSidebarOpen={isSidebarOpen} layoutColors={layoutColors} />
                    ) : isLayout2 ? (
                        <DesktopLayout2 notes={notes} onClose={onClose} onUpdate={onUpdate} isTablet={isTablet} isSidebarOpen={isSidebarOpen} />
                    ) : isLayout4 ? (
                        <div
                            className={isMobileLandscape ? "animate-in zoom-in-95 duration-200 pointer-events-auto" : ""}
                            style={isMobileLandscape ? { transform: 'scale(0.65)', transformOrigin: 'center center' } : {}}
                        >
                            <DesktopLayout4 notes={notes} onClose={onClose} onUpdate={onUpdate} isTablet={isTablet} isSidebarOpen={isSidebarOpen} isMobileLandscape={isMobileLandscape} />
                        </div>
                    ) : isLayout8 ? (
                        <DesktopLayout8 notes={notes} onClose={onClose} onUpdate={onUpdate} isTablet={isTablet} isSidebarOpen={isSidebarOpen} activeLayout={activeLayout} layoutColors={layoutColors} />
                    ) : (
                        <DesktopLayout1 notes={notes} onClose={onClose} onUpdate={onUpdate} isTablet={isTablet} isSidebarOpen={isSidebarOpen} activeLayout={activeLayout} layoutColors={layoutColors} />
                    )}
                </div>
            )}
        </>
    );
};

export default NotesViewerPopup;
