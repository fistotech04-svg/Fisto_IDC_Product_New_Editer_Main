import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

const isLightColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
    return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) > 0.5;
};

const DesktopLayout2 = ({
    displayBookmarks, editingId, editValue, setEditValue, handleEditStart, handleEditSave, handleDelete, handleNavigate,
    getLayoutColor, getLayoutColorRgba, onClose, isTablet, Icon
}) => {
    return (
        <div
            className="rounded-[1.2vw] shadow-2xl p-[0.4vw] relative animate-in zoom-in-95 duration-200"
            style={{
                backgroundColor: "color-mix(in srgb, var(--dropdown-text, #FFFFFF) 60%, transparent)",
                borderColor: "color-mix(in srgb, var(--dropdown-text, #FFFFFF) 30%, transparent)",
                borderWidth: '1px'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="rounded-[1vw] overflow-hidden">
                <div
                    className={`rounded-[0.8vw] ${isTablet ? 'p-[0.8vw] w-[8vw]' : 'p-[1vw] w-[11vw]'} relative flex flex-col`}
                    style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '1') }}
                >
                    <div className="flex items-center gap-[0.5vw] mb-[0.8vw]">
                        <h2 className="text-[0.8vw] font-bold whitespace-nowrap" style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }}>
                            Bookmark
                        </h2>
                        <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: "var(--dropdown-text, rgba(255,255,255,0.3))", opacity: "var(--dropdown-text-opacity, 1)" }} />
                    </div>

                    <div className="flex flex-col gap-[0.3vw] max-h-[30vh] overflow-y-auto no-scrollbar">
                        {displayBookmarks.map((bookmark) => (
                            <div
                                key={bookmark.id}
                                className="flex items-center justify-between px-[0.6vw] py-[0.45vw] rounded-[0.3vw] transition-colors group cursor-pointer hover:bg-white/5"
                                onClick={() => handleNavigate(bookmark.pageIndex)}
                            >
                                {editingId === bookmark.id ? (
                                    <input
                                        autoFocus
                                        className="border-none outline-none text-[0.75vw] rounded px-[0.2vw] w-full mr-[0.4vw]"
                                        style={{ backgroundColor: "color-mix(in srgb, var(--dropdown-text, #FFFFFF) 20%, transparent)", color: "var(--dropdown-text, #FFFFFF)" }}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => handleEditSave(bookmark.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(bookmark.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span
                                        className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.82vw]'} font-medium truncate flex-1`}
                                        style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }}
                                    >
                                        {bookmark.label}
                                    </span>
                                )}

                                <div className="flex items-center gap-[0.8vw] flex-shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditStart(bookmark); }}
                                        className="hover:scale-110 transition-transform"
                                    >
                                        <Icon
                                            icon="fluent:edit-24-filled"
                                            className="w-[1.1vw] h-[1.1vw]"
                                            style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }}
                                        />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(bookmark.id); }}
                                        className="hover:scale-110 transition-transform"
                                    >
                                        <Icon
                                            icon="ph:trash"
                                            className="w-[1.2vw] h-[1.2vw]"
                                            style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: 0.9 }}
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {displayBookmarks.length === 0 && (
                            <div className="text-[0.8vw] text-center py-[1.2vw] opacity-60 font-medium italic" style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 0.6)" }}>
                                no bookmark added
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DesktopLayout3 = ({
    displayBookmarks, editingId, editValue, setEditValue, handleEditStart, handleEditSave, handleDelete, handleNavigate,
    getLayoutColor, getLayoutColorRgba, onClose, isTablet, Icon
}) => {
    return (
        <div
            className={`rounded-[0.5vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] ${isTablet ? 'w-[11vw]' : 'w-[14vw]'} border border-gray-100 overflow-hidden`}
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-[0.8vw]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}>
                <div className="mb-[0.8vw] px-[0.2vw]">
                    <h2 className="text-[0.85vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Bookmark</h2>
                </div>
                <div className="flex flex-col gap-[0.3vw] max-h-[30vh] overflow-y-auto no-scrollbar">
                    {displayBookmarks.map((bookmark) => (
                        <div
                            key={bookmark.id}
                            className="flex items-center justify-between px-[0.6vw] py-[0.45vw] rounded-[0.3vw] transition-colors cursor-pointer hover:bg-black/5"
                            onClick={() => handleNavigate(bookmark.pageIndex)}
                        >
                            {editingId === bookmark.id ? (
                                <input
                                    autoFocus
                                    className="bg-black/5 border-none outline-none text-[0.75vw] rounded px-[0.2vw] w-full mr-[0.4vw]"
                                    style={{ color: 'var(--dropdown-text, #3E4491)' }}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleEditSave(bookmark.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(bookmark.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-medium truncate flex-1`}
                                    style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }}
                                >
                                    {bookmark.label}
                                </span>
                            )}
                            <div className="flex items-center gap-[0.8vw] flex-shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); handleEditStart(bookmark); }} className="hover:scale-110 transition-transform">
                                    <Icon icon="mdi:rename" className="w-[0.9vw] h-[0.9vw]" style={{ color: 'var(--dropdown-text, #3E4491)', opacity: 'var(--dropdown-text-opacity, 1)' }} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(bookmark.id); }} className="hover:scale-110 transition-transform">
                                    <Icon icon="material-symbols-light:delete-outline-rounded" className="w-[1.1vw] h-[1.1vw]" style={{ color: '#FF4D4D' }} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {displayBookmarks.length === 0 && (
                        <div className="text-[0.8vw] text-center py-[1.2vw] font-medium italic" style={{ color: 'var(--dropdown-text, #3E4491)', opacity: 0.5 }}>
                            no bookmark added
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ViewBookmarkPopup = ({ onClose, bookmarks = [], onDelete, onUpdate, onNavigate, activeLayout, isTablet, isMobile, isLandscape, layoutColors, isMobileLandscape, isSidebarOpen }) => {
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const layout = Number(activeLayout) || 1;
    const isLayout1 = layout === 1;
    const isLayout2 = layout === 2;
    const isLayout3 = layout === 3;
    const isLayout4 = layout === 4;
    const isLayout5 = layout === 5;
    const isLayout6 = layout === 6;
    const isLayout7 = layout === 7;
    const isLayout8 = layout === 8;
    const isLayout9 = layout === 9;

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
    const getLayoutOpacity = (id, defaultOpacity) => `var(--${id}-opacity, ${defaultOpacity})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    const getLayoutColorAlpha = (id, defaultRgb, alpha) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;

    const dropdownBgHex = layoutColors?.find(c => c.id === 'dropdown-bg')?.hex || '#575C9C';
    const dropdownTextHex = layoutColors?.find(c => c.id === 'dropdown-text')?.hex || '#FFFFFF';
    const bodyTextColor = isLightColor(dropdownBgHex) ? (dropdownTextHex === '#FFFFFF' || isLightColor(dropdownTextHex) ? '#2D2D2D' : dropdownTextHex) : dropdownBgHex;

    // Only show user-added bookmarks
    const displayBookmarks = bookmarks || [];

    const handleEditStart = (bookmark) => {
        setEditingId(bookmark.id);
        setEditValue(bookmark.label);
    };

    const handleEditSave = (id) => {
        if (onUpdate && editValue.trim()) {
            onUpdate(id, editValue);
        }
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (onDelete) {
            onDelete(id);
        }
    };

    const handleNavigate = (pageIndex) => {
        if (onNavigate && editingId === null) {
            onNavigate(pageIndex);
        }
    };

    if (isMobile) {
        if (isLandscape && isLayout2) {
            return (
                <div
                    className="absolute inset-0 z-[5000] flex items-start justify-center pt-[2.5vh] pointer-events-auto"
                    onClick={onClose}
                >
                    <div
                        className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                        style={{ transform: 'scale(0.72)', transformOrigin: 'center center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DesktopLayout2
                            displayBookmarks={displayBookmarks}
                            editingId={editingId}
                            editValue={editValue}
                            setEditValue={setEditValue}
                            handleEditStart={handleEditStart}
                            handleEditSave={handleEditSave}
                            handleDelete={handleDelete}
                            handleNavigate={handleNavigate}
                            getLayoutColor={getLayoutColor}
                            getLayoutColorRgba={getLayoutColorRgba}
                            onClose={onClose}
                            isTablet={isTablet}
                            Icon={Icon}
                        />
                    </div>
                </div>
            );
        }

        if (isLandscape && isLayout3) {
            return (
                <div
                    className="absolute inset-0 z-[5000] flex items-start justify-center pt-[0.5vh] pointer-events-auto"
                    onClick={onClose}
                >
                    <div
                        className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                        style={{ transform: 'scale(0.55)', transformOrigin: 'center center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DesktopLayout3
                            displayBookmarks={displayBookmarks}
                            editingId={editingId}
                            editValue={editValue}
                            setEditValue={setEditValue}
                            handleEditStart={handleEditStart}
                            handleEditSave={handleEditSave}
                            handleDelete={handleDelete}
                            handleNavigate={handleNavigate}
                            getLayoutColor={getLayoutColor}
                            getLayoutColorRgba={getLayoutColorRgba}
                            onClose={onClose}
                            isTablet={isTablet}
                            Icon={Icon}
                        />
                    </div>
                </div>
            );
        }

        if (isLandscape && isLayout1) {
            return (
                <div className="absolute inset-0 z-[5000] flex items-end justify-center pointer-events-none pb-[50px] pl-[15vw]" onClick={onClose}>
                    <div className="scale-[0.85] origin-bottom shadow-4xl shadow-black/30 bg-transparent pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Main Desktop Container (Simplified for scale) */}
                        <div className="rounded-[1vw] shadow-2xl p-[0.8vw] w-[12vw] backdrop-blur-md"
                            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8') }}>
                            <div className="text-center mb-[0.8vw]">
                                <h2 className="text-[1vw] font-bold tracking-wide" style={{ color: "var(--dropdown-text, #3E4491)", opacity: "var(--dropdown-text-opacity, 1)" }}>Book Mark</h2>
                                <div className="h-[1.5px] w-full mt-[0.5vw]" style={{ backgroundColor: "var(--dropdown-text, #3E4491)", opacity: "var(--dropdown-text-opacity, 1)" }}></div>
                            </div>
                            <div className="flex flex-col gap-[0.3vw] max-h-[25vh] overflow-y-auto no-scrollbar">
                                {displayBookmarks.map((bookmark) => (
                                    <div
                                        key={bookmark.id}
                                        className="flex items-center justify-between px-[0.6vw] py-[0.45vw] rounded-[0.3vw] transition-colors group cursor-pointer"
                                        style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}
                                        onClick={() => handleNavigate(bookmark.pageIndex)}
                                    >
                                        <span className="text-[0.9vw] font-medium truncate flex-1" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}>
                                            {bookmark.label}
                                        </span>
                                        <div className="flex items-center gap-[0.8vw] flex-shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); handleEditStart(bookmark); }}>
                                                <Icon icon="mdi:rename" className="w-[1vw] h-[1vw]" style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(bookmark.id); }}>
                                                <Icon icon="material-symbols-light:delete-outline-rounded" className="w-[1.4vw] h-[1.4vw]" style={{ color: '#FF5252' }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {displayBookmarks.length === 0 && (
                                    <div className="text-[0.8vw] text-center py-[1.2vw] opacity-60 font-medium italic" style={{ color: "var(--dropdown-text, #FFFFFF)" }}>
                                        no bookmark added
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (!isLandscape && isLayout3) {
            return (
                <div
                    className="fixed inset-0 z-[3000] pointer-events-auto"
                    onClick={onClose}
                >
                    <div
                        className="absolute pointer-events-auto animate-in zoom-in-95 duration-200 outline-none rounded-[10px] shadow-2xl border border-gray-100 overflow-hidden"
                        style={{
                            bottom: '80px',
                            left: '16px',
                            width: '160px',
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-2" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}>
                            <div className="mb-1.5 px-1">
                                <h2 className="text-[12px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Bookmark</h2>
                            </div>
                            <div className="flex flex-col gap-0.5 max-h-[30vh] overflow-y-auto custom-scrollbar">
                                {displayBookmarks.map((bookmark) => (
                                    <div
                                        key={bookmark.id}
                                        className="flex items-center justify-between px-1.5 py-1 rounded-md transition-colors cursor-pointer hover:bg-black/5"
                                        onClick={() => { handleNavigate(bookmark.pageIndex); onClose(); }}
                                    >
                                        {editingId === bookmark.id ? (
                                            <input
                                                autoFocus
                                                className="bg-black/5 border-none outline-none text-[10px] rounded px-1 w-full mr-1.5"
                                                style={{ color: 'var(--dropdown-text, #3E4491)' }}
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => handleEditSave(bookmark.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleEditSave(bookmark.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span
                                                className="text-[10px] font-medium truncate flex-1"
                                                style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: 'var(--dropdown-text-opacity, 1)' }}
                                            >
                                                {bookmark.label}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); handleEditStart(bookmark); }} className="hover:scale-110 transition-transform">
                                                <Icon icon="mdi:rename" className="w-[11px] h-[11px]" style={{ color: 'var(--dropdown-text, #3E4491)', opacity: 'var(--dropdown-text-opacity, 1)' }} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(bookmark.id); }} className="hover:scale-110 transition-transform">
                                                <Icon icon="material-symbols-light:delete-outline-rounded" className="w-[12px] h-[12px]" style={{ color: '#FF4D4D' }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {displayBookmarks.length === 0 && (
                                    <div className="text-[10px] text-center py-3 font-medium italic" style={{ color: 'var(--dropdown-text, #3E4491)', opacity: 0.5 }}>
                                        no bookmark added
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
                className="fixed inset-0 z-[3000] pointer-events-auto"
                onClick={onClose}
            >
                <div
                    className="absolute pointer-events-auto animate-in zoom-in-95 duration-200 outline-none rounded-xl border border-white/20 shadow-2xl"
                    style={{
                        top: '135px',
                        right: '16px',
                        width: '160px',
                        backgroundColor: 'rgba(87, 92, 156, 0.95)',
                        backdropFilter: 'blur(10px)',
                        maxHeight: '50vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex flex-col items-center px-3 pt-2 pb-1">
                        <h2 className="text-[13px] font-bold text-white tracking-wide">Book Mark</h2>
                        <div className="h-[1px] w-full bg-white/10 mt-1" />
                    </div>

                    {/* List Content */}
                    <div className="overflow-y-auto px-2 py-1 custom-scrollbar" style={{ maxHeight: '40vh' }}>
                        <div className="flex flex-col gap-0.5">
                            {displayBookmarks.map((bm) => (
                                <div
                                    key={bm.id}
                                    className="flex items-center justify-between py-1.5 px-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                    onClick={() => { handleNavigate(bm.pageIndex); onClose(); }}
                                >
                                    {editingId === bm.id ? (
                                        <input
                                            autoFocus
                                            className="text-[11px] font-medium text-white border-b border-white/40 outline-none focus:border-white bg-transparent"
                                            style={{ width: '80px', minWidth: '60px', maxWidth: '90px' }}
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleEditSave(bm.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            onBlur={() => handleEditSave(bm.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="text-[11px] font-medium text-white/95 truncate flex-1 mr-1.5">
                                            {bm.label}
                                        </span>
                                    )}

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            className="text-white/60 hover:text-white transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                        >
                                            <Icon icon="lucide:pencil" className="w-[11px] h-[11px]" />
                                        </button>
                                        <button
                                            className="text-red-400/80 hover:text-red-400 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                                        >
                                            <Icon icon="lucide:trash-2" className="w-[11px] h-[11px]" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {displayBookmarks.length === 0 && (
                                <div className="text-center py-4 text-white/40 text-[11px] font-medium italic">
                                    No bookmarks found
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-1.5" />
                </div>
            </div>
        );
    }

    const getPosition = () => {
        const layout = Number(activeLayout);
        if (layout === 2) return 'top-[8.5vh] left-[calc(50%_-_8.7vw)] -translate-x-1/2';
        if (layout === 3) return 'top-[8.5vh] left-[calc(50%_-_3.5vw)] -translate-x-1/2';
        if (layout === 5) return 'bottom-[9vh] left-[calc(50%_+_4.8vw)] -translate-x-1/2';
        if (layout === 4) return 'top-[22vh] left-[4.5vw]';
        if (layout === 6 || layout === 7 || layout === 8) return 'top-[26vh] right-[4.2vw]';
        if (layout === 1) return isTablet ? 'bottom-[4vw] right-[20.8vw]' : 'bottom-[calc(4.5vw_+_2.5vh)] right-[20.8vw]';
        return 'bottom-[calc(4.5vw_+_2.5vh)] right-[27.3vw]';
    };

    if (isLayout9) {
        return (
            <>
                {/* Global click-to-close overlay */}
                <div className="fixed inset-0 z-[40] cursor-default" onClick={onClose} />
                <div
                    className={`absolute top-[8vh] ${isSidebarOpen ? 'left-[calc(50%_-_9vw)]' : 'left-[calc(50%_-_11.8vw)]'} -translate-x-[100%] z-[45] animate-in fade-in slide-in-from-top-2 duration-200`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative flex flex-col">
                        {/* Connector Tab for Bookmark Icon */}
                        <div className="absolute top-[-3.3vw] right-[-0.35vw] w-[5.5vw] h-[3.5vw] z-0">
                            <svg width="100%" height="100%" viewBox="0 0 91 67" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M24.8182 33.0909C24.8182 14.8153 39.6335 0 57.9091 0C76.1847 0 91 14.8153 91 33.0909V67H0C18.7515 67 24.8182 52.7213 24.8182 41.7377V33.0909Z"
                                    fill={getLayoutColor('toc-bg', '#575C9C')}
                                    fillOpacity={getLayoutOpacity('toc-bg', '0.6')}
                                />
                            </svg>
                        </div>

                        {/* Popup Container */}
                        <div
                            className={`backdrop-blur-md ${isSidebarOpen ? 'rounded-[0.6vw] p-[0.4vw] w-[12vw]' : 'rounded-[1vw] p-[0.6vw] w-[14.5vw]'} shadow-lg border border-white/10 min-h-[5vw] relative z-10 flex flex-col justify-center transition-all duration-300`}
                            style={{ backgroundColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.6') }}
                        >
                            <div className={`${isSidebarOpen ? 'rounded-[0.4vw] p-[0.2vw]' : 'rounded-[0.6vw] p-[0.3vw]'} bg-white flex flex-col w-full`}>
                                <div className="flex flex-col max-h-[35vh] overflow-y-auto no-scrollbar py-[0.2vw]">
                                    {displayBookmarks.length > 0 ? (
                                        displayBookmarks.map((bm) => (
                                            <div
                                                key={bm.id}
                                                className="flex flex-row justify-between items-center py-[0.6vh] px-[0.8vw] hover:bg-gray-50 transition-colors cursor-pointer rounded-[0.3vw] group"
                                                onClick={() => handleNavigate(bm.pageIndex)}
                                            >
                                                {editingId === bm.id ? (
                                                    <input
                                                        autoFocus
                                                        className="flex-1 text-[0.85vw] font-medium border-b border-opacity-30 outline-none focus:border-opacity-100 mr-[0.5vw] bg-transparent"
                                                        style={{ color: getLayoutColor('toc-text', '#575C9C'), borderColor: getLayoutColor('toc-text', '#575C9C') }}
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleEditSave(bm.id);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        onBlur={() => handleEditSave(bm.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <span className={`${isSidebarOpen ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-medium truncate flex-1 mr-[0.5vw]`} style={{ color: bodyTextColor }}>
                                                        {bm.label}
                                                    </span>
                                                )}

                                                <div className="flex items-center gap-[0.7vw] flex-shrink-0">
                                                    {editingId === bm.id ? (
                                                        <button
                                                            className="hover:scale-110 transition-transform"
                                                            style={{ color: bodyTextColor }}
                                                            onClick={(e) => { e.stopPropagation(); handleEditSave(bm.id); }}
                                                        >
                                                            <Icon icon="lucide:check" className={`${isSidebarOpen ? 'w-[0.85vw] h-[0.85vw]' : 'w-[1vw] h-[1vw]'}`} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="hover:scale-110 transition-transform opacity-80 hover:opacity-100"
                                                            style={{ color: bodyTextColor }}
                                                            onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                                        >
                                                            <Icon icon="mdi:pencil" className={`${isSidebarOpen ? 'w-[0.85vw] h-[0.85vw]' : 'w-[1vw] h-[1vw]'}`} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="text-[#EF4444] hover:scale-110 transition-transform opacity-90 hover:opacity-100"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                                                    >
                                                        <Icon icon="lucide:trash-2" className={`${isSidebarOpen ? 'w-[0.85vw] h-[0.85vw]' : 'w-[1vw] h-[1vw]'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={`text-center py-[1.2vw] ${isSidebarOpen ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-medium italic opacity-70`} style={{ color: bodyTextColor }}>
                                            No Bookmarks found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Layout 6 Sidebar
    if (isLayout6) {
        return (
            <>
                <div className="absolute inset-0 z-[110] bg-black/5" onClick={onClose} />
                <div
                    className={`absolute ${isTablet ? 'top-[6vh] bottom-[5vh] right-[4.5vw] w-[11vw]' : 'top-[7vh] bottom-[7.5vh] right-[5vw] w-[17.5vw]'} z-[120] shadow-[-1vw_0_3vw_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300 border-l border-[#575C9C]/10`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full" style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}>
                        {/* Header Section */}
                        <div className="h-[7vh] flex items-center justify-between px-[1.5vw] border-b-[2px] shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <h2 className="text-[1.1vw] font-bold text-white">Bookmarks</h2>
                            <button
                                onClick={onClose}
                                className="transition-all p-[0.4vw]"
                                style={{ color: '#FFFFFF', opacity: 0.8 }}
                            >
                                <Icon icon="lucide:x" className="w-[1.4vw] h-[1.4vw]" />
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-[0.8vw] flex flex-col pt-[1vh]">
                            {displayBookmarks.length > 0 ? (
                                displayBookmarks.map((bm) => (
                                    <div
                                        key={bm.id}
                                        className="flex items-center justify-between py-[1.2vh] px-[1vw] rounded-[0.5vw] cursor-pointer group transition-all"
                                        onClick={() => handleNavigate(bm.pageIndex)}
                                    >
                                        {editingId === bm.id ? (
                                            <input
                                                autoFocus
                                                className="flex-1 text-[0.85vw] font-medium border-b outline-none mr-[0.5vw] bg-transparent"
                                                style={{ color: getLayoutColor('dropdown-text', '#575C9C'), borderColor: getLayoutColor('dropdown-text', '#575C9C') }}
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleEditSave(bm.id);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                onBlur={() => handleEditSave(bm.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="text-[0.85vw] font-medium truncate flex-1 mr-[1vw]" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>{bm.label}</span>
                                        )}
                                        <div className="flex items-center gap-[0.8vw] flex-shrink-0">
                                            {editingId === bm.id ? (
                                                <button
                                                    className="text-[#4A3AFF] hover:scale-110 transition-transform"
                                                    onClick={(e) => { e.stopPropagation(); handleEditSave(bm.id); }}
                                                >
                                                    <Icon icon="lucide:check" className="w-[1.25vw] h-[1.2vw]" />
                                                </button>
                                            ) : (
                                                <button
                                                    className="hover:scale-110 transition-transform"
                                                    style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                                    onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                                >
                                                    <Icon icon="mdi:pencil" className="w-[1.25vw] h-[1.25vw]" />
                                                </button>
                                            )}
                                            <button
                                                className="text-[#EF4444] hover:scale-110 transition-transform"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                                            >
                                                <Icon icon="lucide:trash-2" className="w-[1.4vw] h-[1.4vw]" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-[0.85vw] text-center py-[5vh] font-medium italic opacity-40" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>
                                    No Bookmarks found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Sidebar layout (4) remains a sidebar as per user preference, but inside this component
    if (isLayout4) {
        return (
            <>
                <div className="absolute inset-0 z-[99] pointer-events-auto" onClick={onClose} />
                <div
                    className="absolute top-[7.5vh] left-[4.2vw] bottom-[7.5vh] w-[16vw] bg-white border-r border-gray-200/30 flex flex-col z-[100] animate-in slide-in-from-left duration-300 pointer-events-auto shadow-2xl"
                    style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-[1vw] py-[1.5vh] border-b border-b-[0.15vw]" style={{ borderColor: getLayoutColor('toc-text', '#3E4491') }}>
                        <span className="text-[1.1vw] font-bold" style={{ color: getLayoutColor('toc-text', '#3E4491') }}>Bookmarks</span>
                        <button
                            onClick={onClose}
                            className="transition-colors opacity-70 hover:opacity-100"
                            style={{ color: getLayoutColor('toc-text', '#3E4491') }}
                        >
                            <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
                        </button>
                    </div>

                    {/* List Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-[1vw] flex flex-col gap-[0.5vh]">
                        {displayBookmarks.length > 0 ? (
                            displayBookmarks.map((bm) => (
                                <div
                                    key={bm.id}
                                    className="flex items-center justify-between py-[1vh] px-[0.5vw] rounded-[0.3vw] cursor-pointer group transition-colors"
                                    style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                    onClick={() => handleNavigate(bm.pageIndex)}
                                >
                                    {editingId === bm.id ? (
                                        <input
                                            autoFocus
                                            className="flex-1 text-[0.85vw] font-medium rounded-[0.25vw] px-[0.4vw] py-[0.2vw] outline-none mr-[0.5vw] bg-transparent border-b"
                                            style={{ color: getLayoutColor('toc-text', '#575C9C'), borderColor: getLayoutColor('toc-text', '#575C9C') }}
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleEditSave(bm.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            onBlur={() => handleEditSave(bm.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="text-[0.85vw] font-medium truncate flex-1 mr-[0.5vw]" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>{bm.label}</span>
                                    )}
                                    <div className="flex items-center gap-[0.5vw]">
                                        <button
                                            className="hover:scale-110 transition-transform opacity-70 hover:opacity-100"
                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                            onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                        >
                                            <Icon icon="mdi:pencil" className="w-[0.9vw] h-[0.9vw]" />
                                        </button>
                                        <button
                                            className="text-red-500 hover:scale-110 transition-transform"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                                        >
                                            <Icon icon="material-symbols-light:delete-outline-rounded" className="w-[1.2vw] h-[1.2vw]" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-[0.8vw] text-center pt-[10vw] opacity-60 font-medium font-sans" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                No Bookmarks found
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }

    // Layout 5 Needle Popup
    if (isLayout5) {
        return (
            <>
                <div className="fixed inset-0 z-[150]" onClick={onClose} />
                <div
                    className="fixed bottom-[10.5vh] left-[70.6%] -translate-x-[15%] z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative">
                        {/* Needle Pointer */}
                        <div
                            className="absolute -bottom-[1.3vw] left-[20%] -translate-x-1/2 z-10 pointer-events-none"
                            style={{ width: '0.9vw', height: '1.4vw' }}
                        >
                            <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 0L5 20L10 0" fill="white" />
                                <path d="M0 0L5 20L10 0" stroke="#575C9C" strokeOpacity="0.3" strokeWidth="1" />
                            </svg>
                        </div>

                        {/* Popup Content */}
                        <div
                            className="bg-white rounded-[1.2vw] shadow-[0_1.2vw_3.5vw_rgba(0,0,0,0.08)] w-[14vw] flex flex-col relative z-20 overflow-hidden border border-[#575C9C]/30"
                            style={{ backgroundColor: '#FFFFFF' }}
                        >
                            <div
                                className="flex flex-col p-[1.2vw] w-full"
                                style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
                            >
                                <h2 className="text-[0.95vw] font-bold text-black mb-[1.2vw] tracking-tight" style={{ color: getLayoutColor('toc-text', '#000000') }}>Bookmark</h2>

                                <div className="flex flex-col gap-[1vw] max-h-[35vh] overflow-y-auto pr-[0.4vw] no-scrollbar">
                                    {displayBookmarks.length > 0 ? (
                                        displayBookmarks.map((bm) => (
                                            <div
                                                key={bm.id}
                                                className="flex items-center justify-between group/bm"
                                            >
                                                <span
                                                    className="text-[0.85vw] font-medium hover:text-black cursor-pointer truncate flex-1 pr-[0.8vw] transition-colors"
                                                    style={{ color: getLayoutColor('toc-text', '#4B5563') }}
                                                    onClick={() => { handleNavigate(bm.pageIndex); onClose(); }}
                                                >
                                                    {bm.label}
                                                </span>
                                                <div className="flex items-center gap-[0.8vw] shrink-0">
                                                    <button
                                                        onClick={() => handleEditStart(bm)}
                                                        className="transition-colors"
                                                        style={{ color: getLayoutColor('toc-text', '#4B5563') }}
                                                    >
                                                        <Icon icon="mdi:pencil" className="w-[0.9vw] h-[0.9vw]" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(bm.id)}
                                                        className="text-red-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Icon icon="material-symbols-light:delete-outline-rounded" className="w-[1.2vw] h-[1.2vw]" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-[1.5vw] text-gray-400 text-[0.8vw] font-medium">No bookmark found</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Inline Edit Input (if editing) */}
                        {editingId && (
                            <div className="absolute inset-0 z-30 bg-white/95 flex flex-col items-center justify-center p-[1vw] animate-in fade-in duration-200">
                                <input
                                    autoFocus
                                    className="w-full text-[#575C9C] text-[0.85vw] font-medium border-b-2 border-[#575C9C] outline-none text-center bg-transparent py-[0.5vw]"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEditSave(editingId);
                                        if (e.key === 'Escape') setEditingId(null);
                                    }}
                                />
                                <div className="flex gap-[1vw] mt-[1vw]">
                                    <button onClick={() => handleEditSave(editingId)} className="text-[0.75vw] text-[#575C9C] font-bold hover:underline">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-[0.75vw] text-gray-400 font-bold hover:underline">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }

    if (isLayout8) {
        return (
            <>
                <div className="absolute inset-0 z-[159] bg-transparent pointer-events-auto" onClick={onClose} />
                <div className={`absolute bottom-[13vh] left-[calc(50%_-_10.5vw)] -translate-x-1/2 z-[160] pointer-events-auto`}>
                    <div
                        className="bg-white rounded-[0.4vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] w-[16vw] overflow-hidden border border-gray-100 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="w-full px-[1vw] py-[0.6vw]"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                        >
                            <h2 className="text-[0.85vw] font-bold tracking-wide" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Bookmarks</h2>
                        </div>

                        {/* Body */}
                        <div className="p-[1vw] w-full max-h-[30vh] overflow-y-auto custom-scrollbar">
                            {displayBookmarks.length > 0 ? (
                                <div className="flex flex-col gap-[0.3vw]">
                                    {displayBookmarks.map((bm) => (
                                        <div
                                            key={bm.id}
                                            className="flex items-center justify-between px-[0.6vw] py-[0.45vw] rounded-[0.3vw] transition-colors group cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleNavigate(bm.pageIndex)}
                                        >
                                            {editingId === bm.id ? (
                                                <input
                                                    autoFocus
                                                    className="flex-1 text-[0.75vw] font-medium border-b border-[#575C9C]/30 outline-none focus:border-[#575C9C] mr-[0.5vw] bg-transparent"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleEditSave(bm.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    onBlur={() => handleEditSave(bm.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ color: bodyTextColor }}
                                                />
                                            ) : (
                                                <span
                                                    className="text-[0.75vw] font-medium truncate flex-1 mr-[1vw]"
                                                    style={{ color: bodyTextColor }}
                                                >
                                                    {bm.label}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-[0.8vw] flex-shrink-0">
                                                {editingId === bm.id ? (
                                                    <button
                                                        className="hover:scale-110 transition-transform"
                                                        onClick={(e) => { e.stopPropagation(); handleEditSave(bm.id); }}
                                                        style={{ color: bodyTextColor }}
                                                    >
                                                        <Icon icon="lucide:check" className="w-[1.1vw] h-[1vw]" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="hover:scale-110 transition-transform opacity-70 hover:opacity-100"
                                                        onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                                        style={{ color: bodyTextColor }}
                                                    >
                                                        <Icon icon="mdi:pencil" className="w-[1vw] h-[1vw]" />
                                                    </button>
                                                )}
                                                <button
                                                    className="text-[#EF4444] hover:scale-110 transition-transform opacity-70 hover:opacity-100"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                                                >
                                                    <Icon icon="lucide:trash-2" className="w-[1.2vw] h-[1.2vw]" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    className="text-[0.85vw] text-center py-[2vw] font-medium italic opacity-40 capitalize"
                                    style={{ color: bodyTextColor }}
                                >
                                    No Bookmarks found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }
    if (isLayout7) {
        return (
            <>
                <div className="fixed inset-0 z-[30] pointer-events-auto" onClick={onClose} />
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`absolute ${isTablet ? 'right-[3.2vw] w-[16vw]' : 'right-[3.8vw] w-[18.2vw]'} top-[10vh] bottom-0 rounded-t-[1.5vw] z-[35] flex flex-col shadow-2xl overflow-hidden border`}
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderColor: getLayoutColorAlpha('dropdown-text', '0, 0, 0', 0.1),
                        boxShadow: '-10px 0px 40px rgba(0,0,0,0.15)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-full" style={{
                        backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '0.6'),
                        backdropFilter: 'blur(16px)'
                    }}>
                        {/* Header Section */}
                        <div className="h-[8vh] flex items-center justify-between px-[1.5vw] border-b shrink-0" style={{ borderColor: getLayoutColorAlpha('dropdown-text', '0,0,0', 0.05) }}>
                            <span className={`${isTablet ? 'text-[1.1vw]' : 'text-[1.3vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}>Bookmark</span>
                            <button onClick={onClose} className="transition-colors opacity-60 hover:opacity-100" style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}>
                                <Icon icon="lucide:x" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'} stroke-[2.5]`} />
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-[1vw] flex flex-col gap-[0.5vh]">
                            {displayBookmarks.length > 0 ? (
                                displayBookmarks.map((bm, idx) => (
                                    <div
                                        key={bm.id || idx}
                                        className="flex flex-col"
                                    >
                                        <div
                                            className="flex items-center justify-between py-[1.2vh] px-[0.5vw] rounded-[0.5vw] cursor-pointer group transition-all hover:bg-black/5"
                                            onClick={() => handleNavigate(bm.pageIndex)}
                                        >
                                            <div className="flex-1 min-w-0 mr-[1vw]">
                                                {editingId === bm.id ? (
                                                    <input
                                                        autoFocus
                                                        className="w-full text-[0.9vw] font-medium border-b outline-none bg-transparent"
                                                        style={{ color: getLayoutColor('dropdown-text', '#373D8A'), borderColor: getLayoutColorAlpha('dropdown-text', '55,61,138', 0.3) }}
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleEditSave(bm.id);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        onBlur={() => handleEditSave(bm.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <span className="text-[0.9vw] font-medium truncate block" style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}>
                                                        {bm.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-[0.8vw] flex-shrink-0">
                                                <button
                                                    className="transition-all opacity-60 hover:opacity-100"
                                                    style={{ color: getLayoutColor('dropdown-text', '#373D8A') }}
                                                    onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                                >
                                                    <Icon icon="mdi:pencil" className="w-[1.1vw] h-[1.1vw]" />
                                                </button>
                                                <button
                                                    className="text-[#EF4444]/60 hover:text-[#EF4444] transition-all"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                                                >
                                                    <Icon icon="lucide:trash-2" className="w-[1.1vw] h-[1.1vw]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-[0.9vw] text-center py-[10vh] font-medium italic" style={{ color: getLayoutColorAlpha('dropdown-text', '55,61,138', 0.4) }}>
                                    No bookmarks found
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </>
        );
    }

    return (
        <>
            <div className="absolute inset-0 z-[99] pointer-events-auto" onClick={onClose} />
            <div className={`absolute ${getPosition()} z-[100] pointer-events-auto`}>
                {isLayout2 ? (
                    <DesktopLayout2
                        displayBookmarks={displayBookmarks}
                        editingId={editingId}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        handleEditStart={handleEditStart}
                        handleEditSave={handleEditSave}
                        handleDelete={handleDelete}
                        handleNavigate={handleNavigate}
                        getLayoutColor={getLayoutColor}
                        getLayoutColorRgba={getLayoutColorRgba}
                        onClose={onClose}
                        isTablet={isTablet}
                        Icon={Icon}
                    />
                ) : (
                    <div
                        className={`
                        ${isLayout3
                                ? `rounded-[0.5vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] ${isTablet ? 'w-[11vw]' : 'w-[14vw]'} border border-gray-100`
                                : isLayout1
                                    ? `${isTablet ? 'rounded-[0.8vw] w-[10vw] p-[0.6vw]' : 'rounded-[1vw] shadow-2xl p-[0.8vw] w-[12vw]'} backdrop-blur-md`
                                    : isLayout4
                                        ? `rounded-[1vw] shadow-2xl p-[0.8vw] w-[13vw] border border-white/10 backdrop-blur-md`
                                        : isLayout7 || isLayout8
                                            ? `rounded-[1vw] shadow-2xl p-[0.8vw] w-[13vw] border border-white/10 backdrop-blur-md`
                                            : `rounded-[1vw] shadow-2xl p-[0.8vw] w-[13vw] backdrop-blur-md`
                            } 
                    `} style={{
                            backgroundColor: isLayout1 ? getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8') : (isLayout3) ? '#FFFFFF' : getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8')
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={isLayout3 ? 'relative rounded-[inherit] relative z-10 p-[0.8vw]' : ''}
                            style={isLayout3 ? { backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') } : isLayout1 ? { backgroundColor: 'transparent' } : { backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                        >
                            {/* Header Section */}
                            {isLayout3 ? (
                                <div className="mb-[0.8vw] px-[0.2vw]">
                                    <h2 className="text-[0.85vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}>Bookmark</h2>
                                </div>
                            ) : isLayout1 ? (
                                <div className="text-center mb-[0.8vw]">
                                    <h2 className="text-[1vw] font-bold tracking-wide" style={{ color: "var(--dropdown-text, #3E4491)", opacity: "var(--dropdown-text-opacity, 1)" }}>Book Mark</h2>
                                    <div className="h-[1.5px] w-full mt-[0.5vw]" style={{ backgroundColor: "var(--dropdown-text, #3E4491)", opacity: "var(--dropdown-text-opacity, 1)" }}></div>
                                </div>
                            ) : (
                                <div className="text-center mb-[0.6vw]">
                                    <h2 className="text-[0.95vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                    >Bookmark</h2>
                                    <div className="h-[1.5px] w-full mt-[0.4vw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#3E4491') }}
                                    ></div>
                                </div>
                            )}

                            <div className="flex flex-col gap-[0.3vw]">
                                {displayBookmarks.map((bookmark) => (
                                    <div
                                        key={bookmark.id}
                                        className="flex items-center justify-between px-[0.6vw] py-[0.45vw] rounded-[0.3vw] transition-colors group cursor-pointer"
                                        style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}
                                        onClick={() => handleNavigate(bookmark.pageIndex)}
                                    >
                                        {editingId === bookmark.id ? (
                                            <input
                                                autoFocus
                                                className={`${isLayout3 ? 'bg-black/5' : ''} border-none outline-none text-[0.75vw] rounded px-[0.2vw] w-full mr-[0.4vw]`}
                                                style={!isLayout3 ? { backgroundColor: "color-mix(in srgb, var(--dropdown-text, #FFFFFF) 20%, transparent)", color: "var(--dropdown-text, #FFFFFF)" } : { color: "var(--dropdown-text, #3E4491)" }}
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => handleEditSave(bookmark.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleEditSave(bookmark.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span
                                                className={`${isLayout1 ? (isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]') : (isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]')} font-medium truncate flex-1`}
                                                style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}
                                            >
                                                {bookmark.label}
                                            </span>
                                        )}

                                        <div className="flex items-center gap-[0.8vw] flex-shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditStart(bookmark); }}
                                                className="hover:scale-110 transition-transform"
                                            >
                                                <Icon
                                                    icon={"mdi:rename"}
                                                    className={isLayout3 ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1vw] h-[1vw]'}
                                                    style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }}
                                                />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(bookmark.id); }}
                                                className="hover:scale-110 transition-transform"
                                            >
                                                <Icon
                                                    icon={"material-symbols-light:delete-outline-rounded"}
                                                    className={isLayout3 ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}
                                                    style={isLayout3 ? { color: '#FF4D4D' } : isLayout1 ? { color: '#FF5252' } : { color: "var(--dropdown-text, #FFFFFF)", opacity: 0.9 }}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {displayBookmarks.length === 0 && (
                                    <div className="text-[0.8vw] text-center py-[1.2vw] opacity-60 font-medium italic" style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 0.6)" }}>
                                        no bookmark added
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ViewBookmarkPopup;
