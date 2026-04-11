import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const ViewBookmarkPopup = ({ onClose, bookmarks = [], onDelete, onUpdate, onNavigate, activeLayout, isTablet, isMobile, isLandscape }) => {
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const layout = Number(activeLayout);
    const isLayout1 = layout === 1;
    const isLayout2 = layout === 2;
    const isLayout3 = layout === 3;
    const isLayout4 = layout === 4;
    const isLayout5 = layout === 5;
    const isLayout6 = layout === 6;
    const isLayout7 = layout === 7;
    const isLayout8 = layout === 8;
    const isLayout9 = layout === 9;

    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

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
        const isLayout2 = activeLayout == 2;
        return (
            <div
                className={`absolute inset-0 z-[3000] flex ${isLayout2 ? 'justify-center items-center' : (isLandscape ? 'justify-end items-end pb-[45px] pr-[16px]' : 'justify-end items-start pt-[150px] pr-[16px]')} pointer-events-auto`}
                onClick={onClose}
            >
                <div
                    className={`shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 outline-none ${isLayout2 ? 'p-1 rounded-[1.2rem] bg-white/60 backdrop-blur-md w-[70%] max-w-[200px]' : (isLandscape ? 'p-0 w-[60%] max-w-[180px] rounded-xl border border-white/10' : 'p-0 w-[70%] max-w-[240px] rounded-xl border border-white/10')}`}
                    style={!isLayout2 ? { backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'), backdropFilter: 'blur(12px)' } : {}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={isLayout2 ? `rounded-[1rem] py-1 flex flex-col w-full` : "flex flex-col w-full"}
                        style={isLayout2 ? { backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') } : {}}
                    >
                    {/* Header */}
                    <div className={`flex flex-col items-center px-4 ${isLandscape ? 'pt-2 pb-1' : 'pt-2.5 pb-1.5'}`}>
                        <h2 className={`${isLayout2 ? 'text-[14px]' : (isLandscape ? 'text-[13px]' : 'text-[16px]')} font-bold text-white tracking-wide`}>Book Mark</h2>
                        <div className="h-[1px] w-full bg-white/10 mt-1" />
                    </div>

                    {/* List Content */}
                    <div className={`flex-1 overflow-y-auto ${isLandscape ? 'max-h-[30vh]' : 'max-h-[50vh]'} px-3 py-1 custom-scrollbar`}>
                        <div className="flex flex-col gap-0.5">
                            {displayBookmarks.map((bm) => (
                                <div
                                    key={bm.id}
                                    className={`flex items-center justify-between ${isLandscape ? 'py-1 px-2' : 'py-2 px-2.5'} rounded-lg hover:bg-white/10 transition-colors group cursor-pointer`}
                                    onClick={() => { handleNavigate(bm.pageIndex); onClose(); }}
                                >
                                    {editingId === bm.id ? (
                                        <input
                                            autoFocus
                                            className={`flex-1 ${isLayout2 ? 'text-[12px]' : (isLandscape ? 'text-[11px]' : 'text-[13px]')} font-medium text-white border-b border-white/40 outline-none focus:border-white mr-2 bg-transparent`}
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
                                        <span className={`${isLayout2 ? 'text-[12px]' : (isLandscape ? 'text-[11px]' : 'text-[13px]')} font-medium text-white/95 truncate flex-1 mr-2`}>
                                            {bm.label}
                                        </span>
                                    )}

                                    <div className="flex items-center gap-2.5 flex-shrink-0">
                                        <button
                                            className="text-white/60 hover:text-white transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                        >
                                            <Icon icon="lucide:pencil" className={`${isLandscape ? 'w-[12px] h-[12px]' : 'w-[14px] h-[14px]'}`} />
                                        </button>
                                        <button
                                            className="text-red-400/80 hover:text-red-400 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                                        >
                                            <Icon icon="lucide:trash-2" className={`${isLandscape ? 'w-[12px] h-[12px]' : 'w-[14px] h-[14px]'}`} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {displayBookmarks.length === 0 && (
                                <div className="text-center py-8 text-white/40 text-[12px] font-medium italic">
                                    No bookmarks found
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Bottom Padding */}
                    <div className="h-2" />
                    </div>
                </div>
            </div>
        );
    }

    const getPosition = () => {
        const layout = Number(activeLayout);
        if (layout === 2) return 'top-[8.5vh] left-[calc(50%-8.7vw)] -translate-x-1/2';
        if (layout === 3) return 'top-[8.5vh] left-[calc(50%-3.5vw)] -translate-x-1/2';
        if (layout === 5) return 'bottom-[9vh] left-[calc(50%+4.8vw)] -translate-x-1/2';
        if (layout === 4) return 'top-[22vh] left-[4.5vw]';
        if (layout === 6 || layout === 7 || layout === 8) return 'top-[26vh] right-[4.2vw]';
        if (layout === 1) return isTablet ? 'bottom-[4vw] right-[20.8vw]' : 'bottom-[4.5vw] right-[20.8vw]';
        return 'bottom-[4.5vw] right-[27.3vw]';
    };

    if (isLayout9) {
        return (
            <>
                {/* Global click-to-close overlay */}
                <div className="fixed inset-0 z-[40] cursor-default" onClick={onClose} />
                <div
                    className="absolute top-[8vh] left-[calc(50%-13.5vw)] -translate-x-[85%] z-[45] animate-in fade-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative flex flex-col">
                        {/* Connector Tab for Bookmark Icon */}
                        <div className="absolute top-[-3.3vw] right-[-0.2vw] w-[5.5vw] h-[3.5vw] z-0">
                            <svg width="100%" height="100%" viewBox="0 0 91 67" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M24.8182 33.0909C24.8182 14.8153 39.6335 0 57.9091 0C76.1847 0 91 14.8153 91 33.0909V67H0C18.7515 67 24.8182 52.7213 24.8182 41.7377V33.0909Z"
                                    fill={getLayoutColor('dropdown-bg', '#575C9C')}
                                    fillOpacity="0.6"
                                />
                            </svg>
                        </div>

                        {/* Popup Container */}
                        <div 
                            className="backdrop-blur-md rounded-[1vw] p-[0.6vw] shadow-lg border border-white/10 w-[14.5vw] min-h-[5vw] relative z-10 flex flex-col justify-center"
                            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.6') }}
                        >
                            <div className="bg-white rounded-[0.6vw] flex flex-col w-full p-[0.3vw]">
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
                                                        className="flex-1 text-[0.85vw] font-medium border-b border-opacity-30 outline-none mr-[0.5vw] bg-transparent"
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
                                                    <span className="text-[0.85vw] font-medium truncate flex-1 mr-[0.5vw]" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>
                                                        {bm.label}
                                                    </span>
                                                )}

                                                <div className="flex items-center gap-[0.7vw] flex-shrink-0">
                                                    {editingId === bm.id ? (
                                                        <button
                                                            className="hover:scale-110 transition-transform"
                                                            style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                                            onClick={(e) => { e.stopPropagation(); handleEditSave(bm.id); }}
                                                        >
                                                            <Icon icon="lucide:check" className="w-[1vw] h-[1vw]" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="hover:scale-110 transition-transform opacity-80 hover:opacity-100"
                                                            style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                                            onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                                        >
                                                            <Icon icon="mdi:pencil" className="w-[1vw] h-[1vw]" />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="text-[#EF4444] hover:scale-110 transition-transform opacity-90 hover:opacity-100"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                                                    >
                                                        <Icon icon="lucide:trash-2" className="w-[1vw] h-[1vw]" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-[1.2vw] text-[0.85vw] font-medium italic opacity-70"
                                            style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                        >
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
                    className={`absolute ${isTablet ? 'right-[3vw] w-[11vw] top-[6vh] bottom-[5vh]' : 'right-[3.5vw] w-[18vw] top-[7vh] bottom-[6vh]'} bg-white z-[120] shadow-[-1vw_0_3vw_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300 border-l`}
                    style={{ borderLeftColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.1') }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full bg-white">
                        {/* Header Section */}
                        <div className="h-[7vh] flex items-center justify-between px-[1.5vw] border-b-[2px] shrink-0"
                            style={{ borderBottomColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.3') }}
                        >
                            <h2 className="text-[1.1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>Bookmarks</h2>
                            <button
                                onClick={onClose}
                                className="transition-all p-[0.4vw] opacity-60 hover:opacity-100"
                                style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
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
                                                style={{ color: getLayoutColor('dropdown-text', '#575C9C'), borderBottomColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.3') }}
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
                                <div className="text-[0.85vw] text-center py-[5vh] font-medium italic opacity-40"
                                    style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
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

    // Sidebar layout (4) remains a sidebar as per user preference, but inside this component
    if (isLayout4) {
        return (
            <>
                <div className="absolute inset-0 z-[99] pointer-events-auto" onClick={onClose} />
                <div
                    className={`absolute top-[7.5vh] bottom-[7.5vh] ${isTablet ? 'left-[3vw] w-[11vw]' : 'left-[4.2vw] w-[18vw]'} bg-white border-r border-gray-200 flex flex-col z-[100] animate-in slide-in-from-left duration-300 pointer-events-auto shadow-2xl`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-[1vw] py-[1.5vh] border-b border-b-[0.15vw]"
                        style={{ borderBottomColor: getLayoutColor('dropdown-text', '#3E4491') }}
                    >
                        <span className="text-[1.1vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Bookmarks</span>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
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
                                    className="flex items-center justify-between py-[1vh] px-[0.5vw] hover:bg-gray-50 rounded-[0.3vw] cursor-pointer group transition-colors"
                                    onClick={() => handleNavigate(bm.pageIndex)}
                                >
                                    {editingId === bm.id ? (
                                        <input
                                            autoFocus
                                            className="flex-1 text-[0.85vw] font-medium border rounded-[0.25vw] px-[0.4vw] py-[0.2vw] outline-none mr-[0.5vw] bg-white"
                                            style={{ color: getLayoutColor('dropdown-text', '#575C9C'), borderColor: getLayoutColorRgba('dropdown-text', '87, 92, 156', '0.4') }}
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
                                        <span className="text-[0.85vw] font-medium truncate flex-1 mr-[0.5vw]" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>{bm.label}</span>
                                    )}
                                    <div className="flex items-center gap-[0.5vw]">
                                        <button
                                            className="hover:scale-110 transition-transform"
                                            style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
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
                            <div className="text-[0.8vw] text-center pt-[10vw] opacity-60 font-medium font-sans"
                                style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                            >
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
                    className="fixed bottom-[8vh] left-[70.6%] -translate-x-[15%] z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200"
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
                                <path d="M0 0L5 20L10 0" stroke={getLayoutColor('dropdown-text', '#575C9C')} strokeOpacity="0.3" strokeWidth="1" />
                            </svg>
                        </div>

                        {/* Popup Content */}
                        <div className="bg-white rounded-[1.2vw] shadow-[0_1.2vw_3.5vw_rgba(0,0,0,0.08)] w-[14vw] p-[1.2vw] flex flex-col relative z-20 overflow-hidden border"
                            style={{ borderColor: getLayoutColorRgba('dropdown-text', '87, 92, 156', '0.3') }}
                        >
                            <h2 className="text-[0.95vw] font-bold text-black mb-[1.2vw] tracking-tight">Bookmark</h2>

                            <div className="flex flex-col gap-[1vw] max-h-[35vh] overflow-y-auto pr-[0.4vw] no-scrollbar">
                                {displayBookmarks.length > 0 ? (
                                    displayBookmarks.map((bm) => (
                                        <div
                                            key={bm.id}
                                            className="flex items-center justify-between group/bm"
                                        >
                                            <span
                                                className="text-[0.85vw] font-medium text-gray-400 hover:text-black cursor-pointer truncate flex-1 pr-[0.8vw] transition-colors"
                                                onClick={() => { handleNavigate(bm.pageIndex); onClose(); }}
                                            >
                                                {bm.label}
                                            </span>
                                            <div className="flex items-center gap-[0.8vw] shrink-0">
                                                <button
                                                    onClick={() => handleEditStart(bm)}
                                                    className="text-gray-400 hover:text-black transition-colors"
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

                        {/* Inline Edit Input (if editing) */}
                        {editingId && (
                            <div className="absolute inset-0 z-30 bg-white/95 flex flex-col items-center justify-center p-[1vw] animate-in fade-in duration-200">
                                <input
                                    autoFocus
                                    className="w-full text-[0.85vw] font-medium border-b-2 outline-none text-center bg-transparent py-[0.5vw]"
                                    style={{ color: getLayoutColor('dropdown-text', '#575C9C'), borderBottomColor: getLayoutColor('dropdown-text', '#575C9C') }}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEditSave(editingId);
                                        if (e.key === 'Escape') setEditingId(null);
                                    }}
                                />
                                <div className="flex gap-[1vw] mt-[1vw]">
                                    <button onClick={() => handleEditSave(editingId)} className="text-[0.75vw] font-bold hover:underline" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>Save</button>
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
                <div className={`absolute bottom-[10.5vh] left-[calc(50%-10.5vw)] -translate-x-1/2 z-[160] pointer-events-auto`}>
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
                                                    className="flex-1 text-[0.75vw] font-medium border-b outline-none mr-[0.5vw] bg-transparent"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleEditSave(bm.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    onBlur={() => handleEditSave(bm.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ color: getLayoutColor('toolbar-bg', '#575C9C'), borderBottomColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.3') }}
                                                />
                                            ) : (
                                                <span
                                                    className="text-[0.75vw] font-medium truncate flex-1 mr-[1vw]"
                                                    style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                                                >
                                                    {bm.label}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-[0.8vw] flex-shrink-0">
                                                {editingId === bm.id ? (
                                                    <button
                                                        className="hover:scale-110 transition-transform"
                                                        onClick={(e) => { e.stopPropagation(); handleEditSave(bm.id); }}
                                                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                                                    >
                                                        <Icon icon="lucide:check" className="w-[1.1vw] h-[1vw]" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="hover:scale-110 transition-transform opacity-70 hover:opacity-100"
                                                        onClick={(e) => { e.stopPropagation(); handleEditStart(bm); }}
                                                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
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
                                    style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
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

    return (
        <>
            <div className="absolute inset-0 z-[99] pointer-events-auto" onClick={onClose} />
            <div className={`absolute ${getPosition()} z-[100] pointer-events-auto`}>
                <div
                    className={`
                        ${isLayout3
                            ? `bg-white rounded-[0.5vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] ${isTablet ? 'p-[0.6vw] w-[11vw]' : 'p-[0.8vw] w-[14vw]'} border border-gray-100`
                            : isLayout2
                                ? `bg-white border border-transparent rounded-[1.2vw] shadow-[0_2vw_5vw_rgba(0,0,0,0.2)]`
                                : isLayout1
                                    ? `${isTablet ? 'rounded-[0.8vw] w-[10vw] p-[0.6vw]' : 'rounded-[1vw] shadow-2xl p-[0.8vw] w-[12vw]'} backdrop-blur-md`
                                    : isLayout4
                                        ? `rounded-[1vw] shadow-2xl p-[0.8vw] w-[13vw] border border-white/10 backdrop-blur-md`
                                        : isLayout7 || isLayout8
                                            ? `rounded-[1vw] shadow-2xl p-[0.8vw] w-[13vw] border border-white/10 backdrop-blur-md`
                                            : `rounded-[1vw] shadow-2xl p-[0.8vw] w-[13vw] backdrop-blur-md`
                        } 
                    `} style={{
                        backgroundColor: isLayout1 ? getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8') : (isLayout2) ? undefined : getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8')
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={isLayout2 ? 'rounded-[1vw] bg-white overflow-hidden' : ''}>
                        <div
                            className={isLayout2 ? `rounded-[0.8vw] ${isTablet ? 'p-[0.8vw] w-[8vw]' : 'p-[1vw] w-[11vw]'} relative flex flex-col` : (isLayout3 ? 'relative rounded-[inherit]' : '')}
                            style={(isLayout2 || isLayout3) ? { backgroundColor: `rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))` } : { backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                        >
                            <div className={isLayout3 ? 'relative z-10 p-[0.8vw]' : ''}>
                                {/* Header Section */}
                                {isLayout3 ? (
                                    <div className="mb-[0.8vw] px-[0.2vw]">
                                        <h2 className="text-[0.85vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}>Bookmark</h2>
                                    </div>
                                ) : isLayout2 ? (
                                    <div className="flex items-center gap-[0.5vw] mb-[0.8vw]">
                                        <h2 className="text-[0.8vw] font-bold whitespace-nowrap" style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }}>
                                            Bookmark
                                        </h2>
                                        <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: "var(--dropdown-text, rgba(255,255,255,0.3))", opacity: "var(--dropdown-text-opacity, 1)" }} />
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
                                                    className={`${isLayout1 ? (isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]') : isLayout2 ? (isTablet ? 'text-[0.7vw]' : 'text-[0.82vw]') : (isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]')} font-medium truncate flex-1`}
                                                    style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}
                                                >
                                                    {bookmark.label}
                                                </span>
                                            )}

                                            <div className="flex items-center gap-[0.6vw] flex-shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditStart(bookmark); }}
                                                    className="hover:scale-110 transition-transform"
                                                >
                                                    <Icon
                                                        icon="mdi:rename"
                                                        className={isLayout2 || isLayout3 ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1vw] h-[1vw]'}
                                                        style={{ color: getLayoutColor('dropdown-text', '#3E4491'), opacity: "var(--dropdown-text-opacity, 1)" }}
                                                    />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(bookmark.id); }}
                                                    className="hover:scale-110 transition-transform"
                                                >
                                                    <Icon
                                                        icon="material-symbols-light:delete-outline-rounded"
                                                        className={isLayout2 || isLayout3 ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}
                                                        style={isLayout3 ? { color: '#FF4D4D' } : isLayout1 ? { color: '#FF5252' } : { color: "var(--dropdown-text, #FFFFFF)", opacity: 0.8 }}
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
                </div>
            </div>
        </>
    );
};

export default ViewBookmarkPopup;
