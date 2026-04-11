import React from 'react';
import { Icon } from '@iconify/react';

const NotesViewerPopup = ({ notes, onClose, isSidebarOpen, isTablet, isMobile, activeLayout }) => {
    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

    const isLayout2 = Number(activeLayout) === 2 || activeLayout === 'Layout2';
    const isLayout3 = Number(activeLayout) === 3 || activeLayout === 'Layout3';
    const isLayout8 = Number(activeLayout) === 8 || activeLayout === 'Layout8';
    const isLayout9 = Number(activeLayout) === 9 || activeLayout === 'Layout9';

    const sizeClass = isTablet
        ? 'h-[55vh] w-[40vw]'
        : `h-[60vh] ${isSidebarOpen ? 'w-[80%]' : 'w-[60vw]'}`;

    const defaultRounding = isTablet ? 'rounded-[1vw]' : 'rounded-[1.2vw]';

    const gridClass = `grid ${isTablet ? 'grid-cols-2 gap-[3vw]' : 'grid-cols-3 gap-[2vw]'} auto-rows-max`;
    const bodyPadding = isTablet ? 'p-[3vw]' : 'p-[2.5vw]';

    const noteCard = (note, idx) => (
        <div
            key={idx}
            className={`relative ${isTablet ? 'h-[25vw] rounded-[1.5vw] p-[2vw]' : 'h-[13vw] rounded-[0.8vw] p-[1.2vw]'} shadow-sm flex flex-col transition-all hover:scale-[1.02] hover:shadow-lg`}
            style={{ backgroundColor: note.background, opacity: note.bgOpacity / 100 }}
        >
            <div className={`flex justify-end ${isTablet ? 'gap-[0.8vw] mb-[1.2vw]' : 'gap-[0.4vw] mb-[0.6vw]'} items-center`}>
                <span className={`${isTablet ? 'text-[1.4vw]' : 'text-[0.65vw]'} font-bold`} style={{ color: note.color, opacity: note.textOpacity / 100 }}>
                    {note.pageLabel}
                </span>
            </div>
            <div
                className="flex-1 overflow-y-auto whitespace-pre-wrap break-words custom-scrollbar-mini"
                style={{
                    textAlign: note.alignment,
                    fontWeight: note.weight === 'Bold' ? 700 : note.weight === 'Semi Bold' ? 600 : note.weight === 'Regular' ? 400 : 100,
                    fontStyle: note.styles?.includes('italic') ? 'italic' : 'normal',
                    textDecoration: `${note.styles?.includes('underline') ? 'underline' : ''} ${note.styles?.includes('strike') ? 'line-through' : ''}`,
                    textTransform: note.case === 'upper' ? 'uppercase' : note.case === 'lower' ? 'lowercase' : note.case === 'sentence' ? 'capitalize' : 'none',
                    fontFamily: note.fontFamily,
                    fontSize: isTablet ? `clamp(1.2vw, ${note.fontSize / 1.2}px, 2vw)` : `clamp(0.6vw, ${note.fontSize / 1.8}px, 0.9vw)`,
                    color: note.color,
                    opacity: note.textOpacity / 100,
                    lineHeight: 1.4
                }}
            >
                {note.content}
            </div>
        </div>
    );

    const emptyState = (textColor = 'text-white/40') => (
        <div className={`col-span-full flex flex-col items-center justify-center ${isTablet ? 'py-[8vw] gap-[0.5vw]' : 'py-[10vw] gap-[1vw]'} ${textColor}`}>
            <Icon icon="solar:notes-bold" className={`${isTablet ? 'w-[4vw] h-[4vw]' : 'w-[5vw] h-[5vw]'} opacity-20`} />
            <p className={`${isTablet ? 'text-[1vw]' : 'text-[1.2vw]'} font-medium`}>No Notes Found</p>
        </div>
    );

    if (isMobile) {
        return (
            <div
                className="absolute inset-0 z-[3000] flex items-center justify-center"
                onClick={onClose}
            >
                <div
                    className="w-[90%] max-h-[85%] rounded-2xl shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden outline-none border border-white/10"
                    style={{ backgroundColor: 'rgba(var(--dropdown-bg-rgb, 87, 92, 156), var(--dropdown-bg-opacity, 0.8))', backdropFilter: 'blur(12px)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <div className="flex-1"></div>
                        <h2 className="text-[16px] font-bold text-white">Notes Viewer</h2>
                        <div className="flex-1 flex justify-end">
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors">
                                <Icon icon="lucide:x" className="w-[18px] h-[18px]" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-3 auto-rows-max">
                            {notes.map((note, idx) => (
                                <div key={idx} className="relative h-[140px] rounded-xl p-3 shadow-sm flex flex-col transition-all active:scale-[0.98]"
                                    style={{ backgroundColor: note.background, opacity: note.bgOpacity / 100 }}>
                                    <div className="flex justify-end mb-1 items-center">
                                        <span className="text-[9px] font-bold" style={{ color: note.color, opacity: note.textOpacity / 100 }}>{note.pageLabel}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto whitespace-pre-wrap break-words custom-scrollbar-mini"
                                        style={{ textAlign: note.alignment, fontWeight: note.weight === 'Bold' ? 700 : note.weight === 'Semi Bold' ? 600 : note.weight === 'Regular' ? 400 : 100, fontStyle: note.styles?.includes('italic') ? 'italic' : 'normal', textDecoration: `${note.styles?.includes('underline') ? 'underline' : ''} ${note.styles?.includes('strike') ? 'line-through' : ''}`, textTransform: note.case === 'upper' ? 'uppercase' : note.case === 'lower' ? 'lowercase' : note.case === 'sentence' ? 'capitalize' : 'none', fontFamily: note.fontFamily, fontSize: '11px', color: note.color, opacity: note.textOpacity / 100, lineHeight: 1.3 }}>
                                        {note.content}
                                    </div>
                                </div>
                            ))}
                            {notes.length === 0 && (
                                <div className="col-span-2 flex flex-col items-center justify-center py-10 text-white/40 gap-3">
                                    <Icon icon="solar:notes-bold" className="w-12 h-12 opacity-20" />
                                    <p className="text-[14px] font-medium">No Notes Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const overlay = (children) => (
        <div className="absolute inset-0 z-[110] flex items-center justify-center " onClick={onClose}>
            {children}
        </div>
    );

    const closeBtn = (dark = false) => (
        <button
            onClick={onClose}
            className={`${isTablet ? 'w-[1.5vw] h-[1.5vw] rounded-[0.2vw]' : 'w-[2.2vw] h-[2.2vw] rounded-[0.5vw]'} flex items-center justify-center border ${dark ? 'border-[#EF4444] text-[#EF4444] hover:bg-red-50' : 'border-white/30 text-white/80 hover:bg-white/10'} transition-colors`}
        >
            <Icon icon="lucide:x" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
        </button>
    );

    const gridContent = (emptyTextColor = 'text-white/40') => (
        <div className={`flex-1 overflow-y-auto ${bodyPadding} custom-scrollbar`}>
            <div className={gridClass}>
                {notes.map((note, idx) => noteCard(note, idx))}
                {notes.length === 0 && emptyState(emptyTextColor)}
            </div>
        </div>
    );

    // Layout 8: White card + toolbar-bg colored header bar
    if (isLayout8) {
        return overlay(
            <div className={`bg-white border border-gray-100 shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 transition-all ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
                <div className={`w-full flex items-center justify-between flex-shrink-0 ${isTablet ? 'px-[0.8vw] py-[0.5vw]' : 'px-[1vw] py-[0.6vw]'}`} style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                    <h2 className={`text-white ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-bold tracking-wide`}>Notes Viewer</h2>
                    {closeBtn(false)}
                </div>
                <div className={`flex-1 overflow-y-auto ${bodyPadding} custom-scrollbar bg-white`}>
                    <div className={gridClass}>
                        {notes.map((note, idx) => noteCard(note, idx))}
                        {notes.length === 0 && emptyState('text-gray-400')}
                    </div>
                </div>
            </div>
        );
    }

    // Layout 2: Frosted-glass outer + white middle + colored inner overlay
    if (isLayout2) {
        return overlay(
            <div 
                className={`backdrop-blur-xl border-2 border-white/60 p-[5px] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 transition-all ${sizeClass}`} 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rounded-xl bg-white overflow-hidden flex flex-col flex-1">
                    <div 
                        className="rounded-xl flex flex-col flex-1 p-3"
                        style={{ backgroundColor: "rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.4 + var(--toc-bg-opacity, 1) * 0.6))" }}
                    >
                        <div className="flex items-center gap-[0.8vw] mb-[0.6vw] w-full px-[0.5vw] py-[0.5vw]">
                            <span className="text-[0.75vw] font-bold text-white/90 whitespace-nowrap">Notes Viewer</span>
                            <div className="flex-1 h-[1px] bg-white/20"></div>
                            <div className="flex justify-end">{closeBtn()}</div>
                        </div>
                        {gridContent()}
                    </div>
                </div>
            </div>
        );
    }

    // Layout 3: White outer + middle white + colored inner overlay
    if (isLayout3) {
        return overlay(
            <div className={`bg-white shadow-2xl p-1 border border-gray-200 rounded-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 transition-all ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
                <div className="rounded-xl bg-white overflow-hidden flex flex-col flex-1">
                    <div 
                        className="rounded-xl flex flex-col flex-1 p-3"
                        style={{ backgroundColor: "rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.4 + var(--toc-bg-opacity, 1) * 0.6))" }}
                    >
                        <div className="flex items-center gap-[0.8vw] mb-[0.6vw] w-full px-[0.5vw] py-[0.5vw]">
                            <span className="text-[0.75vw] font-bold text-white/90 whitespace-nowrap">Notes Viewer</span>
                            <div className="flex-1 h-[1px] bg-white/20"></div>
                            <div className="flex justify-end">{closeBtn()}</div>
                        </div>
                        {gridContent()}
                    </div>
                </div>
            </div>
        );
    }

    // Layout 9: More translucent (0.6) + stronger backdrop-blur
    // Default (Layout 1, 4, 5, 6, 7): dropdown-bg 0.8 opacity
    const bgStyle = isLayout9
        ? { backgroundColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.6'), backdropFilter: 'blur(16px)' }
        : { backgroundColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8'), backdropFilter: 'blur(12px)' };

    return overlay(
        <div
            className={`border-[0.1vw] border-white/10 shadow-[0_2vw_5vw_rgba(0,0,0,0.2)] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden transition-all ${isLayout9 ? 'backdrop-blur-md' : ''} ${sizeClass} ${defaultRounding} ${isTablet ? 'px-[3vw]' : 'px-[2vw]'}`}
            style={bgStyle}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-[0.8vw] mb-[0.6vw] w-full py-[0.8vw]">
                <span className="text-[0.75vw] font-bold text-white/90 whitespace-nowrap">Notes Viewer</span>
                <div className="flex-1 h-[1px] bg-white/20"></div>
                <div className="flex justify-end">{closeBtn()}</div>
            </div>
            {gridContent()}
        </div>
    );
};

export default NotesViewerPopup;
