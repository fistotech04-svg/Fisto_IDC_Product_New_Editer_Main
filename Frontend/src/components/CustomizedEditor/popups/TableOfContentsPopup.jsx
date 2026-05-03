import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

const TableOfContentsPopup = ({ onClose, onNavigate, settings = {}, activeLayout, isTablet, isMobile, isLandscape, isSidebarOpen, layoutColors, isMobileLandscape }) => {
    // Ensure settings is at least an empty object if it's null
    const safeSettings = settings || {};
    const [searchQuery, setSearchQuery] = useState('');

    if (!onClose) return null;

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
            const c = layoutColors.find(x => x && x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity ?? 100);
        }
        return `var(--${id}, ${defaultColor})`;
    };
    const getLayoutOpacity = (id, defaultOpacity) => `var(--${id}-opacity, ${defaultOpacity})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

    const tocBgHex = layoutColors && Array.isArray(layoutColors) ? layoutColors.find(c => c && c.id === 'toc-bg')?.hex || '#575C9C' : '#575C9C';
    const tocTextHex = layoutColors && Array.isArray(layoutColors) ? layoutColors.find(c => c && c.id === 'toc-text')?.hex || '#FFFFFF' : '#FFFFFF';
    const bodyTextColor = isLightColor(tocBgHex) ? tocTextHex : tocBgHex;

    const {
        addSearch = true,
        addPageNumber = true,
        addSerialNumberHeading = true,
        addSerialNumberSubheading = true,
        content = []
    } = safeSettings;

    const safeContent = Array.isArray(content) ? content : [];

    const filteredContent = useMemo(() => safeContent.map(heading => {
        const matchesHeading = (heading?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const filteredSubheadings = heading?.subheadings?.filter(sub =>
            (sub?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];

        if (matchesHeading || filteredSubheadings.length > 0) {
            return {
                ...heading,
                subheadings: matchesHeading ? heading.subheadings : filteredSubheadings
            };
        }
        return null;
    }).filter(Boolean), [safeContent, searchQuery]);

    const isLayout2 = Number(activeLayout) === 2 || activeLayout === 'Layout2';
    const isLayout1 = Number(activeLayout) === 1 || activeLayout === 'Layout1';
    const isLayout3 = Number(activeLayout) === 3 || activeLayout === 'Layout3';
    const isLayout8 = Number(activeLayout) === 8 || activeLayout === 'Layout8';
    const isLayout9 = Number(activeLayout) === 9 || activeLayout === 'Layout9';
    const isLayout7 = Number(activeLayout) === 7 || activeLayout === 'Layout7';

    const scrollContainerRef = useRef(null);
    const [initialHeight, setInitialHeight] = useState('auto');

    useEffect(() => {
        if (scrollContainerRef.current) {
            const height = scrollContainerRef.current.offsetHeight;
            if (height > 0 && initialHeight === 'auto') {
                setInitialHeight(height);
            }
        }
    }, [initialHeight]);

    const [expandedSections, setExpandedSections] = useState({});

    // Auto-expand matching sections when searching
    useEffect(() => {
        if (searchQuery.trim()) {
            const newExpanded = {};
            filteredContent.forEach(heading => {
                newExpanded[heading.id || heading.title] = true;
            });
            setExpandedSections(newExpanded);
        }
    }, [searchQuery, filteredContent]);

    const toggleSection = (id) => {
        setExpandedSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (isLayout9) {
        return (
            <>
                <div className="fixed inset-0 z-[40] pointer-events-auto bg-transparent" onClick={onClose} />
                <div
                    className={`absolute top-[1.2vh] ${isSidebarOpen ? 'left-[4.0vw]' : 'left-[9.1vw]'} z-[45] pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500 origin-top-right`}
                    style={{ filter: 'drop-shadow(0 1vw 3vw rgba(0,0,0,0.3))', transform: 'scale(0.85)', transformOrigin: 'top left', transition: 'transform 0.3s ease' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`relative w-[13vw] min-h-[15vw] h-fit max-h-[80vh] flex flex-col group`}>
                        {/* New SVG Shape Background */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <svg width="100%" height="100%" viewBox="0 0 250 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <defs>
                                    <clipPath id="toc-shape-clip" clipPathUnits="objectBoundingBox">
                                        <path
                                            transform="scale(0.004, 0.00166667)"
                                            d="M0 100C0 88.95 8.95 80 20 80H155C170 80 175 65 175 45V35C175 15 190 0 210 0C230 0 250 15 250 35V80V580C250 591.05 241.05 600 230 600H20C8.95 600 0 591.05 0 580V100Z"
                                        />
                                    </clipPath>
                                </defs>
                                <path
                                    d="M0 100C0 88.95 8.95 80 20 80H155C170 80 175 65 175 45V35C175 15 190 0 210 0C230 0 250 15 250 35V80V580C250 591.05 241.05 600 230 600H20C8.95 600 0 591.05 0 580V100Z"
                                    fill={getLayoutColor('toc-bg', '#575C9C')}
                                    fillOpacity={getLayoutOpacity('toc-bg', '0.6')}
                                />
                            </svg>
                        </div>

                        {/* Content Layer with Body Background and Styling */}
                        <div
                            className="relative z-10 flex flex-col flex-1 pt-[5vw] px-[1vw] pb-[2.5vw] backdrop-blur-md"
                            style={{ clipPath: 'url(#toc-shape-clip)', WebkitClipPath: 'url(#toc-shape-clip)' }}
                        >
                            {/* Search Bar - Compact */}
                            {addSearch && (
                                <div className="relative mb-[1.5vw] pr-[0.5vw]">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-full border border-white/10 pl-[1.2vw] pr-[2.5vw] py-[0.6vw] text-[0.85vw] placeholder:text-current placeholder:opacity-40 outline-none backdrop-blur-md italic font-medium shadow-inner transition-colors"
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: getLayoutColor('toc-text', '#FFFFFF'), opacity: getLayoutOpacity('toc-text', '1') }}
                                    />
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute right-[1.5vw] top-1/2 -translate-y-1/2 w-[0.9vw] h-[0.9vw] transition-colors"
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.5)` }}
                                    />
                                </div>
                            )}

                            {/* TOC List */}
                            <div
                                className="flex flex-col gap-[0.6vw] overflow-y-auto custom-scrollbar pr-[0.4vw]"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                {(filteredContent.length > 0 ? filteredContent : [
                                    {
                                        id: 'h1', title: 'Content 1', page: 1,
                                        subheadings: [{ id: 's1', title: 'Sub content 1', page: 1 }, { id: 's2', title: 'Sub content 2', page: 2 }]
                                    },
                                    {
                                        id: 'h2', title: 'Content 2', page: 3,
                                        subheadings: [
                                            { id: 's3', title: 'Sub content 1', page: 4 },
                                            { id: 's4', title: 'Sub content 2', page: 4 },
                                            { id: 's5', title: 'Sub content 3', page: 5 }
                                        ]
                                    },
                                    {
                                        id: 'h3', title: 'Content 3', page: 7,
                                        subheadings: [{ id: 's7', title: 'Sub content 1', page: 8 }, { id: 's8', title: 'Sub content 2', page: 9 }]
                                    }
                                ]).map((heading, hIdx) => {
                                    const sectionId = heading.id || heading.title;
                                    const isExpanded = expandedSections[sectionId] || false;
                                    const hasSubItems = heading.subheadings && heading.subheadings.length > 0;

                                    return (
                                        <div key={sectionId} className="flex flex-col gap-[0.35vw]">
                                            {/* Main Heading Pill */}
                                            <div
                                                onClick={() => {
                                                    if (onNavigate) onNavigate(heading.page - 1);
                                                }}
                                                className="rounded-full px-[1vw] py-[0.35vw] flex items-center justify-between cursor-pointer hover:bg-white/30 active:scale-[0.98] transition-all shadow-md group border border-white/10"
                                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                                            >
                                                <div className="flex items-center gap-[0.5vw] truncate">
                                                    <span className="text-[0.88vw] font-bold tracking-tight truncate transition-colors" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: getLayoutOpacity('toc-text', '1') }}>
                                                        {heading.title}
                                                    </span>
                                                </div>
                                                <span className="text-[0.85vw] font-bold tabular-nums transition-colors" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.9)` }}>
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            </div>

                                            {/* Subheadings - Always visible in Layout 9 */}
                                            {hasSubItems && (
                                                <div className="flex flex-col gap-[0.25vw] pl-[0.5vw] animate-in slide-in-from-top-2 duration-300">
                                                    {heading.subheadings.map((sub, sIdx) => (
                                                        <div
                                                            key={sub.id || sIdx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onNavigate) onNavigate(sub.page - 1);
                                                            }}
                                                            className="rounded-full px-[0.8vw] py-[0.3vw] flex items-center justify-between cursor-pointer hover:bg-white/20 active:scale-[0.98] transition-all shadow-sm ml-auto w-[85%] border border-white/10"
                                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                                                        >
                                                            <span className="text-[0.78vw] font-semibold tracking-tight truncate transition-colors" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.9)` }}>
                                                                {sub.title}
                                                            </span>
                                                            <span className="text-[0.75vw] font-bold tabular-nums transition-colors" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.8)` }}>
                                                                {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isLayout7) {
        return (
            <>
                <div className="fixed inset-0 z-[1000] pointer-events-auto bg-transparent" onClick={onClose} />
                <motion.div
                    className={`${isMobile && !isLandscape ? 'fixed right-4 top-[14%] bottom-[125px] w-[230px] rounded-[20px] shadow-2xl' : 'absolute ' + (isTablet ? 'right-[3.1vw] top-[1.5vh] w-[16vw]' : 'right-[4.5vw] top-[2vh] w-[18vw]') + ' bottom-0 rounded-t-[1.5vw] shadow-[-10px_0px_40px_rgba(0,0,0,0.15)]'} z-[1001] flex flex-col overflow-hidden border backdrop-blur-xl pointer-events-auto`}
                    style={{
                        backgroundColor: `rgba(var(--toc-bg-rgb, 255, 255, 255), var(--toc-bg-opacity, 0.6))`,
                        borderColor: getLayoutColor('toc-text', '#575C9C') + '4D'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                >
                    <div className={`${isMobile && !isLandscape ? 'h-[48px]' : (isTablet ? 'h-[7vh]' : 'h-[8vh]')} flex items-center justify-between px-[1.5vw] border-b shrink-0`} style={{ borderColor: getLayoutColor('toc-text', '#575C9C') + '33' }}>
                        <span className={`${isMobile && !isLandscape ? 'text-[14px]' : (isTablet ? 'text-[0.85vw]' : 'text-[1.1vw]')} font-bold`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</span>
                        <button onClick={onClose} className="transition-colors" style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.6 }}>
                            <Icon icon="lucide:x" className={`${isMobile && !isLandscape ? 'w-4 h-4' : (isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]')}`} />
                        </button>
                    </div>

                    {addSearch && (
                        <div className="px-[1vw] py-[1.2vh] border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            <div
                                className="flex items-center rounded-[0.5vw] px-[0.8vw] py-[0.5vw] border group transition-all"
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    borderColor: 'rgba(0,0,0,0.05)'
                                }}
                            >
                                <Icon icon="lucide:search" className="w-[1vw] h-[1vw]" style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.4 }} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search in TOC..."
                                    className={`bg-transparent border-0 outline-none focus:ring-0 ${isMobile && !isLandscape ? 'text-[11px]' : (isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]')} ml-[0.5vw] w-full font-sans`}
                                    style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.4 }}>
                                        <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-[1vw] flex flex-col pt-[1vh]">
                            {filteredContent.length > 0 ? (
                                <div className="flex flex-col gap-[0.5vh]">
                                    {filteredContent.map((item, idx) => (
                                        <div key={idx} className="flex flex-col mb-[0.8vh]">
                                            <div
                                                className={`flex items-center justify-between ${isMobile && !isLandscape ? 'py-1.5 px-2.5' : (isTablet ? 'py-[0.5vh] px-[0.6vw]' : 'py-[0.8vh] px-[0.8vw]')} hover:bg-white/10 rounded-[0.5vw] cursor-pointer transition-all group`}
                                                style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                onClick={() => { onNavigate && onNavigate(item.page - 1); onClose(); }}
                                            >
                                                <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw]">
                                                    {addSerialNumberHeading && (
                                                        <span className={`${isMobile && !isLandscape ? 'text-[12px]' : (isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]')} font-bold opacity-40 shrink-0`}>{idx + 1}.</span>
                                                    )}
                                                    <span className={`${isMobile && !isLandscape ? 'text-[12px]' : (isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]')} font-semibold group-hover:opacity-100 truncate opacity-90`}>
                                                        {item.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className={`${isMobile && !isLandscape ? 'text-[10px]' : (isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]')} font-bold opacity-40 group-hover:opacity-80 tabular-nums`}>
                                                        {item.page < 10 ? `0${item.page}` : item.page}
                                                    </span>
                                                )}
                                            </div>
                                            {item.subheadings && item.subheadings.length > 0 && (
                                                <div className="flex flex-col mt-[0.1vh]">
                                                    {item.subheadings.map((sub, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className={`flex items-center justify-between ${isMobile && !isLandscape ? 'py-1 px-2.5 pl-6' : 'py-[0.6vh] px-[0.8vw] pl-[1.5vw]'} hover:bg-white/10 rounded-[0.5vw] cursor-pointer transition-all group`}
                                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                            onClick={() => { onPageClick(sub.page - 1); onClose(); }}
                                                        >
                                                            <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw]">
                                                                {addSerialNumberSubheading && (
                                                                    <span className="text-[0.8vw] font-bold opacity-30 shrink-0">{idx + 1}.{sIdx + 1}</span>
                                                                )}
                                                                <span className={`${isMobile && !isLandscape ? 'text-[11px]' : (isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]')} font-medium opacity-70 group-hover:opacity-100 truncate`}>
                                                                    {sub.title}
                                                                </span>
                                                            </div>
                                                            {addPageNumber && (
                                                                <span className={`${isMobile && !isLandscape ? 'text-[9px]' : (isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]')} font-semibold opacity-30 group-hover:opacity-60 tabular-nums`}>
                                                                    {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-[10vh] opacity-30 select-none">
                                    <Icon icon="ph:list-bullets-bold" className="w-[3vw] h-[3vw] mb-[1.5vh]" style={{ color: getLayoutColor('toc-icon', '#575C9C') }} />
                                    <span className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>No Table of Contents</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </>
        );
    }

    if (isMobile && !isLandscape && isLayout8) {
        return (
            <>
                <div className="fixed inset-0 z-[1000] pointer-events-auto" onClick={onClose} />
                <div className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-[1001] pointer-events-auto w-[280px]">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div
                            className="w-full px-4 py-3 flex items-center justify-between"
                            style={{ backgroundColor: getLayoutColor('toc-bg', '#575C9C') }}
                        >
                            <h2 className="text-[14px] font-bold tracking-wide" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>Table of Contents</h2>
                            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                                <Icon icon="lucide:x" className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-4 w-full">
                            {addSearch && (
                                <div className="mb-4 relative">
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                        style={{ color: bodyTextColor, opacity: 0.6 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-lg pl-9 pr-3 py-2 text-[13px] outline-none transition-colors border focus:border-opacity-50 shadow-sm"
                                        style={{
                                            backgroundColor: 'white',
                                            color: bodyTextColor,
                                            borderColor: `${bodyTextColor}40`
                                        }}
                                    />
                                </div>
                            )}

                            <div
                                ref={scrollContainerRef}
                                className="flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[35vh]"
                            >
                                {filteredContent.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-[13px] italic">
                                        No items found
                                    </div>
                                ) : (
                                    filteredContent.map((heading, hIdx) => (
                                        <div
                                            key={heading.id}
                                            className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
                                            onClick={() => { if (onNavigate) onNavigate(heading.page - 1); }}
                                        >
                                            <div className="flex items-center gap-3 truncate flex-1 min-w-0">
                                                <span className="text-[13px] font-bold truncate"
                                                    style={{ color: bodyTextColor }}
                                                >
                                                    {addSerialNumberHeading ? `${hIdx + 1}. ` : ''}{heading.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 ml-2">
                                                <span className="text-[11px] font-extrabold opacity-40" style={{ color: bodyTextColor }}>
                                                    {String(heading.page).padStart(2, '0')}
                                                </span>
                                                <Icon
                                                    icon="lucide:chevron-right"
                                                    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ color: bodyTextColor }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isLayout8) {
        return (
            <>
                <div className="fixed inset-0 z-[190] pointer-events-auto bg-transparent" onClick={onClose} />
                <div className="fixed bottom-[10.5vh] left-[38vw] -translate-x-1/2 z-[200] pointer-events-auto">
                    <div
                        className="bg-white rounded-[0.4vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] w-[13vw] overflow-hidden border border-gray-100 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="w-full px-[0.8vw] py-[0.5vw] flex items-center justify-between"
                            style={{ backgroundColor: getLayoutColor('toc-bg', '#575C9C') }}
                        >
                            <h2 className="text-[0.75vw] font-bold tracking-wide" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>Table of Contents</h2>
                        </div>

                        {/* Body */}
                        <div className="p-[0.8vw] w-full">
                            {addSearch && (
                                <div className="mb-[0.8vw] relative">
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 w-[0.7vw] h-[0.7vw]"
                                        style={{ color: bodyTextColor, opacity: 0.6 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-[0.3vw] pl-[1.8vw] pr-[0.6vw] py-[0.3vw] text-[0.7vw] outline-none transition-colors border focus:border-opacity-50 shadow-sm"
                                        style={{
                                            backgroundColor: 'white',
                                            color: bodyTextColor,
                                            borderColor: `${bodyTextColor}40`
                                        }}
                                    />
                                </div>
                            )}

                            <div
                                ref={scrollContainerRef}
                                className="flex flex-col gap-[0.2vw] overflow-y-auto custom-scrollbar max-h-[25vh]"
                                style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                            >
                                {filteredContent.map((heading, hIdx) => (
                                    <React.Fragment key={heading.id}>
                                        <div
                                            className="flex items-center justify-between px-[0.5vw] py-[0.4vw] hover:bg-gray-50 rounded-[0.3vw] transition-colors cursor-pointer group"
                                            onClick={() => { if (onNavigate) onNavigate(heading.page - 1); }}
                                        >
                                            <div className="flex items-center gap-[0.4vw] truncate flex-1 min-w-0">
                                                <span className="text-[0.75vw] font-bold truncate"
                                                    style={{ color: bodyTextColor }}
                                                >
                                                    {addSerialNumberHeading ? `${hIdx + 1}. ` : ''}{heading.title}
                                                </span>
                                            </div>
                                            {addPageNumber && (
                                                <span className="text-[0.68vw] font-bold flex-shrink-0 ml-[0.4vw] tabular-nums"
                                                    style={{ color: bodyTextColor, opacity: 0.8 }}
                                                >
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            )}
                                        </div>

                                        {heading.subheadings?.map((sub, sIdx) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center justify-between px-[0.5vw] py-[0.3vw] hover:bg-gray-50 rounded-[0.3vw] transition-colors cursor-pointer group pl-[1.2vw]"
                                                onClick={() => { if (onNavigate) onNavigate(sub.page - 1); }}
                                            >
                                                <div className="flex items-center gap-[0.4vw] truncate flex-1 min-w-0">
                                                    <span className="text-[0.68vw] font-medium truncate"
                                                        style={{ color: bodyTextColor, opacity: 0.9 }}
                                                    >
                                                        {sub.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className="text-[0.62vw] font-bold flex-shrink-0 ml-[0.4vw] tabular-nums"
                                                        style={{ color: bodyTextColor, opacity: 0.6 }}
                                                    >
                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                                {filteredContent.length === 0 && (
                                    <div className="text-[0.8vw] text-center py-[1vw] font-medium"
                                        style={{ color: getLayoutColor('toc-text', '#575C9C'), opacity: 0.6 }}
                                    >
                                        No Table Of Content Found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const getPositionStyle = () => {
        if (isMobile) {
            if (isLandscape) {
                if (Number(activeLayout) === 1) return { bottom: '35px', left: '25px' };
                if (Number(activeLayout) === 3) return { top: '32px', right: '25%' };
                if (Number(activeLayout) === 2) return { top: '45px', left: '32%' };
                return { top: '6vh', left: '28%' };
            }
            if (Number(activeLayout) === 1) return { top: '16vh', right: '24px' };
            if (Number(activeLayout) === 2) return { top: '135px', left: '18px' };
            if (Number(activeLayout) === 3) return { top: '15rem', right: '4.5rem' };
            if (Number(activeLayout) === 7) return { top: '120px', left: '52px' };
            return { top: '6.5rem', left: '50%', transform: 'translateX(-50%)' };
        }
        if (activeLayout === 1 || activeLayout === 'Layout1') return isTablet ? { bottom: '3.8vw', left: '2.2vw' } : { bottom: 'calc(4.5vw + 2.5vh)', left: '2.2vw' };
        if (activeLayout === 2 || activeLayout === 'Layout2') {
            const leftPos = isSidebarOpen ? 'calc(50% + 1vw)' : 'calc(50% - 6.5vw)';
            return isTablet ? { top: '7.5vh', left: 'calc(50% - 12vw)', transform: 'translateX(-50%)' } : { top: '16.5vh', left: leftPos, transform: 'translateX(-50%)' };
        }
        if (activeLayout === 3 || activeLayout === 'Layout3') {
            const leftPos = isSidebarOpen ? 'calc(50% + 4vw)' : 'calc(50% - 3vw)';
            return { top: '16.5vh', left: leftPos, transform: 'translateX(-50%)' };
        }
        if (activeLayout === 6 || activeLayout === 'Layout6') return { top: '8.5vh', left: '2.2vw' };
        if (activeLayout === 5) return { bottom: '11.5vh', left: 'calc(50% - 1vw)', transform: 'translateX(-50%)' };
        if (activeLayout === 4) return { top: '10.5vh', left: '4.5vw' };
        if (activeLayout === 9) return { top: '8.5vh', left: 'calc(50% - 10vw)', transform: 'translateX(-50%)' };
        return isTablet ? { bottom: '3.8vw', left: '2vw' } : { bottom: 'calc(4.5vw + 2.5vh)', left: '2vw' };
    };

    if (isMobile && isLandscape && isLayout3) {
        return (
            <div
                className="absolute inset-0 z-[3000] flex items-start justify-end pt-[18vh] pr-[15vw] pointer-events-auto"
                onClick={onClose}
            >
                <div
                    className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                    style={{ transform: 'scale(0.6)', transformOrigin: 'top center' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-[1vw] shadow-2xl overflow-hidden w-[13vw]">
                        <div
                            className="rounded-[1vw] p-[0.8vw] w-full relative flex flex-col"
                            style={{ backgroundColor: `rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.2 + var(--toc-bg-opacity, 1) * 0.8))` }}
                        >
                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-center gap-[0.5vw] mb-[0.6vw]">
                                    <h2 className="text-[0.85vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                        Table of Contents
                                    </h2>
                                    <div className="h-[1px] flex-1" style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.3)' }} />
                                </div>

                                {/* Search */}
                                {addSearch && (
                                    <div className="mb-[0.6vw] relative">
                                        <Icon
                                            icon="lucide:search"
                                            className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 w-[0.7vw] h-[0.7vw]"
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.7)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full rounded-full pl-[1.8vw] pr-[0.5vw] py-[0.2vw] text-[0.75vw] outline-none border border-white/10 transition-colors"
                                            style={{
                                                color: getLayoutColor('toc-text', '#FFFFFF'),
                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            }}
                                        />
                                    </div>
                                )}

                                {/* TOC List */}
                                <div
                                    ref={scrollContainerRef}
                                    className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 max-h-[25vh]"
                                    style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                                >
                                    {filteredContent.map((heading, hIdx) => (
                                        <React.Fragment key={heading.id}>
                                            <div
                                                className="flex items-center justify-between px-[0.6vw] py-[0.4vw] hover:bg-white/10 rounded-md transition-colors cursor-pointer group"
                                                onClick={() => onNavigate && onNavigate(heading.page - 1)}
                                            >
                                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                    <span className="text-[0.85vw] font-bold truncate" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                                        {addSerialNumberHeading && <span className="mr-1">{hIdx + 1}.</span>}
                                                        {heading.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className="text-[0.78vw] font-bold flex-shrink-0 ml-2 tabular-nums" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.8)' }}>
                                                        {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                    </span>
                                                )}
                                            </div>
                                            {heading.subheadings?.map((sub, sIdx) => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center justify-between px-[0.6vw] py-[0.3vw] ml-[1.2vw] hover:bg-white/10 rounded-md transition-colors cursor-pointer group"
                                                    onClick={() => onNavigate && onNavigate(sub.page - 1)}
                                                >
                                                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                        <span className="text-[0.78vw] font-semibold truncate" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}>
                                                            {addSerialNumberSubheading && <span className="mr-1">{hIdx + 1}.{sIdx + 1}.</span>}
                                                            {sub.title}
                                                        </span>
                                                    </div>
                                                    {addPageNumber && (
                                                        <span className="text-[0.72vw] font-bold flex-shrink-0 ml-2 tabular-nums" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}>
                                                            {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {filteredContent.length === 0 && (
                                        <div className="text-[0.8vw] text-center py-[1vw] font-medium" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.5 }}>
                                            No Table Of Content Found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isMobile && !isLandscape && isLayout3) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[5000] pointer-events-auto bg-transparent"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="fixed top-[135px] left-4 z-[5001] pointer-events-auto origin-top-left"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden w-[140px] border border-white/50">
                        <div
                            className="p-2 flex flex-col relative"
                            style={{ backgroundColor: "rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.2 + var(--toc-bg-opacity, 1) * 0.85))" }}
                        >
                            {/* Desktop UI Style Header */}
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-[11px] font-bold whitespace-nowrap" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                    Table of Contents
                                </h2>
                                <div className="h-[1px] flex-1" style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.3)' }} />
                            </div>

                            {/* Search */}
                            {addSearch && (
                                <div className="mb-3 relative">
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-full pl-7 pr-2 py-0.5 text-[9px] outline-none border border-white/10 transition-colors placeholder:opacity-50"
                                        style={{
                                            color: getLayoutColor('toc-text', '#FFFFFF'),
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                        }}
                                    />
                                </div>
                            )}

                            {/* TOC List */}
                            <div
                                ref={scrollContainerRef}
                                className="flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[160px] pr-1"
                            >
                                {(() => {
                                    const displayContent = filteredContent.length > 0
                                        ? filteredContent
                                        : (!content?.length && !searchQuery ? [
                                            { id: 'h1', title: 'Landing Page', page: 1 },
                                            {
                                                id: 'h2', title: 'Product Page', page: 2,
                                                subheadings: [
                                                    { id: 's1', title: 'Sub Heading 1', page: 2 },
                                                    { id: 's2', title: 'Sub Heading 2', page: 2 },
                                                    { id: 's3', title: 'Sub Heading 3', page: 3 },
                                                    { id: 's4', title: 'Sub Heading 4', page: 4 },
                                                ]
                                            }
                                        ] : []);

                                    return displayContent.length > 0 ? displayContent.map((heading, hIdx) => (
                                        <React.Fragment key={heading.id || hIdx}>
                                            <div
                                                className="flex items-center justify-between py-2 px-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer group active:opacity-60"
                                                onClick={() => onNavigate && onNavigate(heading.page - 1)}
                                            >
                                                <span className="text-[10px] font-bold truncate flex-1 leading-tight" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                                    {addSerialNumberHeading && <span className="mr-1">{hIdx + 1}.</span>}
                                                    {heading.title}
                                                </span>
                                                {addPageNumber && (
                                                    <span className="text-[9px] font-bold ml-2 tabular-nums opacity-80" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>
                                                        {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                    </span>
                                                )}
                                            </div>
                                            {heading.subheadings?.map((sub, sIdx) => (
                                                <div
                                                    key={sub.id || sIdx}
                                                    className="flex items-center justify-between py-1.5 pl-6 pr-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer active:opacity-60"
                                                    onClick={() => onNavigate && onNavigate(sub.page - 1)}
                                                >
                                                    <span className="text-[9.5px] font-medium truncate flex-1 leading-tight" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}>
                                                        {addSerialNumberSubheading && <span className="mr-1">{hIdx + 1}.{sIdx + 1}.</span>}
                                                        {sub.title}
                                                    </span>
                                                    {addPageNumber && (
                                                        <span className="text-[8.5px] font-bold ml-2 tabular-nums opacity-60" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>
                                                            {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    )) : (
                                        <div className="text-center py-8 font-medium" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.5 }}>
                                            No items found
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </>
        );
    }

    // Layout 1 Desktop: use absolute positioning (fixed breaks inside transformed containers)
    if (isLayout1 && !isMobile) {
        return (
            <>
                <div className="absolute inset-0 z-[1000] pointer-events-auto" onClick={onClose} />
                <div
                    className={`absolute ${isTablet ? 'bottom-[3.8vw] left-[2.2vw]' : 'bottom-[calc(4.5vw_+_2.5vh)] left-[2.2vw]'} z-[1001] pointer-events-auto`}
                >
                    <div
                        className="rounded-[1.2vw] w-[13vw] shadow-2xl overflow-hidden relative backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200"
                        style={{
                            backgroundColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8'),
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-[1vw] w-full relative h-full">
                            {/* Header */}
                            <div className="text-center mb-[0.8vw] px-[0.5vw]">
                                <h2 className="text-[0.95vw] font-bold tracking-tight mb-[0.5vw]"
                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                >
                                    Table of Contents
                                </h2>
                                <div className="h-[1px] w-full"
                                    style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 0.3)' }}
                                />
                            </div>

                            {/* Search */}
                            {addSearch && (
                                <div className="mb-3 relative px-[0.5vw]">
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute left-[1.2vw] top-1/2 -translate-y-1/2 w-[0.85vw] h-[0.85vw]"
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.7)' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="w-full rounded-full pl-[2.2vw] pr-[0.8vw] py-[0.35vw] text-[0.75vw] outline-none border border-white/10 transition-colors placeholder:opacity-50"
                                        style={{
                                            color: getLayoutColor('toc-text', '#FFFFFF'),
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                            opacity: 'var(--toc-text-opacity, 1)',
                                        }}
                                    />
                                </div>
                            )}

                            {/* TOC List */}
                            <div
                                ref={scrollContainerRef}
                                className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 max-h-[18vw]"
                                style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                            >
                                {(() => {
                                    const displayContent = filteredContent.length > 0
                                        ? filteredContent
                                        : (!content?.length && !searchQuery ? [
                                            { id: 'h1', title: 'Landing Page', page: 1 },
                                            {
                                                id: 'h2', title: 'Product Page', page: 2,
                                                subheadings: [
                                                    { id: 's1', title: 'Sub Heading 1', page: 2 },
                                                    { id: 's2', title: 'Sub Heading 2', page: 3 },
                                                ]
                                            }
                                        ] : []);

                                    return (
                                        <>
                                            {displayContent.map((heading, hIdx) => (
                                                <React.Fragment key={heading.id}>
                                                    <div
                                                        className="flex items-center justify-between px-[0.6vw] py-[0.4vw] hover:bg-white/10 rounded-md transition-colors cursor-pointer group"
                                                        onClick={() => onNavigate && onNavigate(heading.page - 1)}
                                                    >
                                                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                            <span className="text-[0.85vw] font-bold truncate"
                                                                style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                                            >
                                                                {addSerialNumberHeading && <span className="mr-1">{hIdx + 1}.</span>}
                                                                {heading.title}
                                                            </span>
                                                        </div>
                                                        {addPageNumber && (
                                                            <span className="text-[10px] font-bold flex-shrink-0 ml-2 tabular-nums"
                                                                style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.8)' }}
                                                            >
                                                                {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {heading.subheadings?.map((sub, sIdx) => (
                                                        <div
                                                            key={sub.id}
                                                            className="flex items-center justify-between px-[0.6vw] py-[0.4vw] ml-[1.2vw] hover:bg-white/10 rounded-md transition-colors cursor-pointer group"
                                                            onClick={() => onNavigate && onNavigate(sub.page - 1)}
                                                        >
                                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                                <span className="text-[10px] font-medium truncate"
                                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}
                                                                >
                                                                    {addSerialNumberSubheading && <span className="mr-1">{hIdx + 1}.{sIdx + 1}</span>}
                                                                    {sub.title}
                                                                </span>
                                                            </div>
                                                            {addPageNumber && (
                                                                <span className="text-[9px] font-bold flex-shrink-0 ml-2 tabular-nums"
                                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}
                                                                >
                                                                    {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                            {displayContent.length === 0 && (
                                                <div className="text-[10px] text-center py-4 font-medium"
                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.5)' }}
                                                >
                                                    No Table Of Content Found
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-[1000] pointer-events-auto" onClick={onClose} />
            <div
                className="fixed z-[9999] pointer-events-auto"
                style={getPositionStyle()}
            >
                <div
                    className={`
                        ${isLayout2 || (isMobile && isLandscape && !isLayout1)
                            ? 'backdrop-blur-xl border border-white/50 p-1 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
                            : isLayout1
                                ? `${isMobile ? `rounded-2xl ${isLandscape ? 'w-[150px]' : 'w-[190px]'}` : 'rounded-[1.2vw] w-[13vw]'} shadow-2xl overflow-hidden relative backdrop-blur-xl`
                                : Number(activeLayout) === 3
                                    ? 'bg-white rounded-[1vw] shadow-2xl relative overflow-hidden'
                                    : `rounded-[1vw] shadow-2xl ${isMobile ? 'p-3 w-[280px]' : 'p-[0.8vw] ' + (Number(activeLayout) === 6 ? 'w-[17.5vw]' : Number(activeLayout) === 4 ? 'w-[18vw]' : 'w-[13vw]')}`
                        } 
                        animate-in fade-in slide-in-from-top-4 duration-200
                        ${isLayout3 ? (isMobile ? (isLandscape ? 'w-[140px]' : 'w-[170px]') : 'w-[13vw]') : ''}
                        ${(isMobile && !isLandscape && Number(activeLayout) === 5) ? 'w-[280px]' : ''}
                    `}
                    style={{
                        backgroundColor: (isLayout1) ? getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8') : (isLayout2 || (isMobile && isLandscape) || Number(activeLayout) === 3 ? undefined : getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8')),
                        border: isLayout1 ? '1px solid rgba(255, 255, 255, 0.2)' : undefined
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={(isLayout2 || (isMobile && isLandscape && !isLayout1)) ? 'rounded-xl bg-white overflow-hidden' : ''}>
                        <div
                            className={(isLayout2 || (isMobile && isLandscape && !isLayout1) || Number(activeLayout) === 3) ? `rounded-xl ${isMobile ? ((isLandscape) ? 'p-[0.5vw] w-[10vw]' : 'p-2.5 w-[170px]') : 'p-3 w-[200px]'} relative flex flex-col` : (isLayout1 ? `${isMobile ? 'p-2' : 'p-[1vw]'} w-full relative h-full` : '')}
                            style={{ backgroundColor: (isLayout2 || (isMobile && isLandscape && !isLayout1) || Number(activeLayout) === 3) ? `rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.2 + var(--toc-bg-opacity, 1) * 0.8))` : 'transparent' }}
                        >
                            <div className={Number(activeLayout) === 3 ? 'relative z-10' : ''}>
                                {/* Header Section */}
                                {(isLayout2 || (isMobile && isLandscape && !isLayout1)) ? (
                                    <div className={`flex items-center gap-2 ${isMobile && isLandscape ? 'mb-[0.5vw]' : 'mb-3'}`}>
                                        <h2 className={`${isMobile && isLandscape ? 'text-[0.7vw]' : 'text-[11px]'} font-bold whitespace-nowrap`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                            Table of Contents
                                        </h2>
                                        <div className="h-[1px] flex-1" style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.3)' }} />
                                    </div>
                                ) : (
                                    <div className={`text-center ${isMobile ? 'mb-2 px-2' : 'mb-[0.8vw] px-[0.5vw]'}`}>
                                        <h2 className={`${isMobile ? 'text-[14px]' : 'text-[0.95vw]'} font-bold tracking-tight ${isMobile ? 'mb-1' : 'mb-[0.5vw]'}`}
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                        >
                                            Table of Contents
                                        </h2>
                                        <div className="h-[1px] w-full"
                                            style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 0.3)' }}
                                        ></div>
                                    </div>
                                )}

                                {addSearch && (
                                    <div className={`mb-3 relative ${isMobile ? 'px-0' : 'px-[0.5vw]'}`}>
                                        <Icon
                                            icon="lucide:search"
                                            className={`absolute ${isMobile ? (isLandscape ? 'left-[1vw]' : 'left-3') : 'left-[1.2vw]'} top-1/2 -translate-y-1/2 ${isMobile ? (isLandscape ? 'w-[0.6vw] h-[0.6vw]' : 'w-3.5 h-3.5') : 'w-[0.85vw] h-[0.85vw]'}`}
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.7)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className={`w-full rounded-full ${isMobile ? (isLandscape ? 'pl-[1.8vw] pr-[0.5vw] py-[0.2vw] text-[0.65vw]' : 'pl-7 pr-3 py-1 text-[10px]') : 'pl-[2.2vw] pr-[0.8vw] py-[0.35vw] text-[0.75vw]'} outline-none border border-white/10 transition-colors placeholder:opacity-50`}
                                            style={{
                                                color: getLayoutColor('toc-text', '#FFFFFF'),
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                                opacity: 'var(--toc-text-opacity, 1)',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                    </div>
                                )}

                                <div
                                    ref={scrollContainerRef}
                                    className={`flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 ${isMobile ? (isLandscape ? 'max-h-[13vh]' : 'max-h-[155px]') : (isLayout2 ? 'max-h-[25vh]' : 'max-h-[18vw]')}`}
                                    style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                                >
                                    {(() => {
                                        const displayContent = filteredContent.length > 0
                                            ? filteredContent
                                            : (!content?.length && !searchQuery ? [
                                                { id: 'h1', title: 'Landing Page', page: 1 },
                                                {
                                                    id: 'h2', title: 'Product Page', page: 2,
                                                    subheadings: [
                                                        { id: 's1', title: 'Sub Heading 1', page: 2 },
                                                        { id: 's2', title: 'Sub Heading 2', page: 2 },
                                                        { id: 's3', title: 'Sub Heading 3', page: 3 },
                                                        { id: 's4', title: 'Sub Heading 4', page: 4 },
                                                    ]
                                                }
                                            ] : []);

                                        return (
                                            <>
                                                {displayContent.map((heading, hIdx) => (
                                                    <React.Fragment key={heading.id}>
                                                        <div
                                                            className={`flex items-center justify-between ${isMobile && isLandscape ? 'px-[0.4vw] py-[0.3vw]' : isMobile ? 'px-2 py-1' : 'px-[0.6vw] py-[0.4vw]'} hover:bg-black/5 rounded-md transition-colors cursor-pointer group`}
                                                            onClick={() => onNavigate && onNavigate(heading.page - 1)}
                                                        >
                                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                                <span className={`${isMobile && isLandscape ? 'text-[0.7vw]' : isMobile ? 'text-[11px]' : 'text-[0.85vw]'} font-bold truncate`}
                                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                                                >
                                                                    {addSerialNumberHeading && (
                                                                        <span className="mr-1">{hIdx + 1}.</span>
                                                                    )}
                                                                    {heading.title}
                                                                </span>
                                                            </div>
                                                            {addPageNumber && (
                                                                <span className={`${isMobile && isLandscape ? 'text-[0.65vw]' : isMobile ? 'text-[10px]' : 'text-[10px]'} font-bold flex-shrink-0 ml-2 tabular-nums opacity-80`}
                                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.8)' }}
                                                                >
                                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {heading.subheadings?.map((sub, sIdx) => (
                                                            <div
                                                                key={sub.id}
                                                                className={`flex items-center justify-between ${isMobile && isLandscape ? 'px-[0.4vw] py-[0.2vw] ml-[1vw]' : isMobile ? 'px-2 py-0.5 ml-4' : 'px-[0.6vw] py-[0.4vw] ml-[1.2vw]'} hover:bg-white/10 rounded-md transition-colors cursor-pointer group`}
                                                                onClick={() => onNavigate && onNavigate(sub.page - 1)}
                                                            >
                                                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                                    <span className={`${isMobile && isLandscape ? 'text-[0.65vw]' : isMobile ? 'text-[10px]' : 'text-[10px]'} font-medium truncate flex items-center`}
                                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}
                                                                    >
                                                                        {addSerialNumberSubheading && (
                                                                            <span className="mr-1">{hIdx + 1}.{sIdx + 1}</span>
                                                                        )}
                                                                        {sub.title}
                                                                    </span>
                                                                </div>
                                                                {addPageNumber && (
                                                                    <span className={`${isMobile && isLandscape ? 'text-[0.6vw]' : isMobile ? 'text-[9px]' : 'text-[9px]'} font-bold flex-shrink-0 ml-2 tabular-nums opacity-60`}
                                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}
                                                                    >
                                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                                {displayContent.length === 0 && (
                                                    <div className="text-[10px] text-center py-4 font-medium"
                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.5)' }}
                                                    >
                                                        No Table Of Content Found
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TableOfContentsPopup;
