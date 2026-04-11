import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

const TableOfContentsPopup = ({ onClose, onNavigate, settings = {}, activeLayout, isTablet, isMobile, isLandscape }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

    const {
        addSearch = true,
        addPageNumber = true,
        addSerialNumberHeading = true,
        addSerialNumberSubheading = true,
        content = []
    } = settings || {};

    const safeContent = Array.isArray(content) ? content : [];

    const filteredContent = safeContent.map(heading => {
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
    }).filter(Boolean);

    const isLayout2 = Number(activeLayout) === 2 || activeLayout === 'Layout2';
    const isLayout1 = Number(activeLayout) === 1 || activeLayout === 'Layout1';
    const isLayout8 = Number(activeLayout) === 8 || activeLayout === 'Layout8';
    const isLayout9 = Number(activeLayout) === 9 || activeLayout === 'Layout9';

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
                    className="absolute top-[8vh] left-[50%] -translate-x-[calc(50%+23.7vw)] z-[45] pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500 origin-top-right"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative w-[13vw] h-[35vw] flex flex-col group">
                        {/* Connector Tab for TOC Icon - Only the round shape SVG code as requested */}
                        <div className="absolute top-[-3.3vw] right-[-0.9vw] w-[7vw] h-[3.8vw] z-0">
                            <svg width="100%" height="100%" viewBox="0 0 91 67" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M24.8182 33.0909C24.8182 14.8153 39.6335 0 57.9091 0C76.1847 0 91 14.8153 91 33.0909V67H0C18.7515 67 24.8182 52.7213 24.8182 41.7377V33.0909Z"
                                    fill={getLayoutColor('toolbar-bg', '#575C9C')}
                                    fillOpacity="0.6"
                                />
                            </svg>
                        </div>

                        {/* Content Layer with Body Background and Styling */}
                        <div
                            className="relative z-10 flex flex-col flex-1 pt-[1.5vw] px-[1vw] pb-[2.5vw] rounded-[1vw] rounded-tr-none shadow-[0_2vw_5vw_rgba(0,0,0,0.4)] backdrop-blur-md"
                            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.6') }}
                        >
                            {/* Search Bar - Compact */}
                            {addSearch && (
                                <div className="relative mb-[1.5vw] pr-[0.5vw]">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-full bg-black/20 border border-white/10 pl-[1.2vw] pr-[2.5vw] py-[0.6vw] text-[0.85vw] placeholder:text-white/40 outline-none backdrop-blur-md italic font-medium text-white shadow-inner"
                                    />
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute right-[1.5vw] top-1/2 -translate-y-1/2 w-[0.9vw] h-[0.9vw] text-white/50"
                                    />
                                </div>
                            )}

                            {/* TOC List */}
                            <div
                                className="flex flex-col gap-[0.8vw] overflow-y-auto custom-scrollbar pr-[0.4vw]"
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
                                        <div key={sectionId} className="flex flex-col gap-[0.5vw]">
                                            {/* Main Heading Pill */}
                                            <div
                                                onClick={() => {
                                                    if (onNavigate) onNavigate(heading.page - 1);
                                                }}
                                                className="bg-white rounded-full px-[1.2vw] py-[0.55vw] flex items-center justify-between cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all shadow-md group"
                                            >
                                                <div className="flex items-center gap-[0.5vw] truncate">
                                                    <span className="text-[0.88vw] font-bold tracking-tight truncate" style={{ color: getLayoutColor('primary-color', '#575C9C') }}>
                                                        {heading.title}
                                                    </span>
                                                </div>
                                                <span className="text-[0.85vw] font-bold tabular-nums" style={{ color: getLayoutColor('primary-color', '#575C9C'), opacity: 0.8 }}>
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            </div>

                                            {/* Subheadings - Always visible in Layout 9 */}
                                            {hasSubItems && (
                                                <div className="flex flex-col gap-[0.4vw] pl-[0.5vw] animate-in slide-in-from-top-2 duration-300">
                                                    {heading.subheadings.map((sub, sIdx) => (
                                                        <div
                                                            key={sub.id || sIdx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onNavigate) onNavigate(sub.page - 1);
                                                            }}
                                                            className="bg-white/95 rounded-full px-[1vw] py-[0.45vw] flex items-center justify-between cursor-pointer hover:bg-white active:scale-[0.98] transition-all shadow-sm ml-auto w-[85%]"
                                                        >
                                                            <span className="text-[0.78vw] font-semibold tracking-tight truncate" style={{ color: getLayoutColor('primary-color', '#575C9C'), opacity: 0.8 }}>
                                                                {sub.title}
                                                            </span>
                                                            <span className="text-[0.75vw] font-bold tabular-nums" style={{ color: getLayoutColor('primary-color', '#575C9C'), opacity: 0.6 }}>
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

    if (isLayout8) {
        return (
            <>
                <div className="fixed inset-0 z-[190] pointer-events-auto bg-transparent" onClick={onClose} />
                <div className={`absolute ${isTablet ? 'bottom-[8.5vh]' : 'bottom-[10.5vh]'} left-[calc(50%-18vw)] -translate-x-1/2 z-[200] pointer-events-auto`}>
                    <div
                        className={`bg-white rounded-[0.4vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] ${isTablet ? 'w-[11vw]' : 'w-[16vw]'} overflow-hidden border border-gray-100 flex flex-col`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className={`w-full ${isTablet ? 'px-[0.8vw] py-[0.5vw]' : 'px-[1vw] py-[0.6vw]'} flex items-center justify-between`}
                            style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                        >
                            <h2 className={`text-white ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-bold tracking-wide`}>Table of Contents</h2>
                        </div>

                        {/* Body */}
                        <div className={`${isTablet ? 'p-[0.8vw]' : 'p-[1vw]'} w-full`}>
                            {addSearch && (
                                <div className={`${isTablet ? 'mb-[0.8vw]' : 'mb-[1vw]'} relative`}>
                                    <Icon
                                        icon="lucide:search"
                                        className={`absolute left-[0.6vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[0.85vw] h-[0.85vw]'}`}
                                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C'), opacity: 0.6 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full rounded-[0.3vw] ${isTablet ? 'pl-[1.8vw] pr-[0.8vw] py-[0.35vw] text-[0.7vw]' : 'pl-[2vw] pr-[0.8vw] py-[0.4vw] text-[0.8vw]'} outline-none transition-colors border focus:border-opacity-50 shadow-sm`}
                                        style={{
                                            backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
                                            color: getLayoutColor('toolbar-bg', '#575C9C'),
                                            borderColor: `${getLayoutColor('toolbar-bg', '#575C9C')}40`
                                        }}
                                    />
                                </div>
                            )}

                            <div
                                ref={scrollContainerRef}
                                className="flex flex-col gap-[0.2vw] overflow-y-auto custom-scrollbar max-h-[30vh]"
                                style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                            >
                                {filteredContent.map((heading, hIdx) => (
                                    <React.Fragment key={heading.id}>
                                        <div
                                            className={`flex items-center justify-between px-[0.6vw] ${isTablet ? 'py-[0.4vw]' : 'py-[0.5vw]'} hover:bg-gray-50 rounded-[0.3vw] transition-colors cursor-pointer group`}
                                            onClick={() => { if (onNavigate) onNavigate(heading.page - 1); }}
                                        >
                                            <div className="flex items-center gap-[0.5vw] truncate flex-1 min-w-0">
                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-bold truncate`}
                                                    style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                                                >
                                                    {addSerialNumberHeading ? `${hIdx + 1}. ` : ''}{heading.title}
                                                </span>
                                            </div>
                                            {addPageNumber && (
                                                <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.78vw]'} font-bold flex-shrink-0 ml-[0.4vw] tabular-nums`}
                                                    style={{ color: getLayoutColor('toolbar-bg', '#575C9C'), opacity: 0.8 }}
                                                >
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            )}
                                        </div>

                                        {heading.subheadings?.map((sub, sIdx) => (
                                            <div
                                                key={sub.id}
                                                className={`flex items-center justify-between px-[0.6vw] ${isTablet ? 'py-[0.3vw]' : 'py-[0.4vw]'} hover:bg-gray-50 rounded-[0.3vw] transition-colors cursor-pointer group pl-[1.5vw]`}
                                                onClick={() => { if (onNavigate) onNavigate(sub.page - 1); }}
                                            >
                                                <div className="flex items-center gap-[0.5vw] truncate flex-1 min-w-0">
                                                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.78vw]'} font-medium truncate`}
                                                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C'), opacity: 0.9 }}
                                                    >
                                                        {sub.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.72vw]'} font-bold flex-shrink-0 ml-[0.4vw] tabular-nums`}
                                                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C'), opacity: 0.6 }}
                                                    >
                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                                {filteredContent.length === 0 && (
                                    <div className={`${isTablet ? 'text-[0.7vw] py-[0.8vw]' : 'text-[0.8vw] py-[1vw]'} text-center font-medium`}
                                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C'), opacity: 0.6 }}
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

    const getPosition = () => {
        if (isMobile) {
            if (Number(activeLayout) === 3) {
                return isLandscape
                    ? 'top-12 left-[15%]'
                    : 'top-[9rem] left-6';
            }
            return isLandscape
                ? 'top-12 right-[18rem]'
                : 'top-[6.5rem] left-1/2 -translate-x-1/2';
        }
        const layout = Number(activeLayout);
        if (layout === 2) return 'top-[8.5vh] left-[calc(50%-14.5vw)] -translate-x-1/2';
        if (layout === 3) return 'top-[8.5vh] left-[calc(50%-10.5vw)] -translate-x-1/2';
        if (layout === 5) return 'bottom-[9vh] left-[calc(50%-1vw)] -translate-x-1/2';
        if (layout === 4) return isTablet ? 'top-[10.5vh] left-[3vw]' : 'top-[10.5vh] left-[4.2vw]';
        if (layout === 6) return isTablet ? 'top-[9vh] right-[3vw]' : 'top-[11.5vh] right-[3.5vw]';
        if (layout === 9) return 'top-[8.5vh] left-[calc(50%-10vw)] -translate-x-1/2';
        return isTablet ? 'bottom-[4vw] left-[2vw]' : 'bottom-[4.2vw] left-[2vw]';
    };

    return (
        <>
            <div className="fixed inset-0 z-[190] pointer-events-auto" onClick={onClose} />
            <div className={`absolute ${getPosition()} z-[200] pointer-events-auto`}>
                <div
                    className={`
                        ${isLayout2 || (isMobile && isLandscape)
                            ? 'backdrop-blur-xl border border-white/50 p-1 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
                            : isLayout1
                                ? `${isMobile ? 'rounded-xl w-[160px]' : (isTablet ? 'rounded-[0.8vw] w-[11vw]' : 'rounded-[1.2vw] w-[16vw]')} shadow-2xl overflow-hidden relative backdrop-blur-sm`
                                : Number(activeLayout) === 3
                                    ? `bg-white rounded-[1vw] shadow-2xl ${isMobile ? (isLandscape ? 'w-[140px]' : 'w-[170px]') : (isTablet ? 'w-[8.5vw]' : 'w-[13vw]')} relative overflow-hidden`
                                    : `rounded-[1vw] shadow-2xl p-[0.8vw] ${(Number(activeLayout) === 6 || Number(activeLayout) === 4) ? (isTablet ? 'w-[11vw]' : 'w-[18vw]') : (isTablet ? 'w-[10vw]' : 'w-[13vw]')}`
                        } 
                        animate-in fade-in slide-in-from-top-4 duration-200
                    `}
                    style={{
                        backgroundColor: (isLayout1 || (isMobile && isLandscape)) ? getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8') : (isLayout2 || Number(activeLayout) === 3 ? undefined : getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8'))
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={(isLayout2 || (isMobile && isLandscape)) ? 'rounded-xl bg-white overflow-hidden' : ''}>
                        <div
                            className={(isLayout2 || (isMobile && isLandscape) || Number(activeLayout) === 3) ? `rounded-xl ${isMobile ? ((isLandscape) ? 'p-2 w-[140px]' : 'p-2.5 w-[170px]') : (isTablet ? 'p-[0.8vw] w-[9vw]' : 'p-3 w-[200px]')} relative flex flex-col` : (isLayout1 ? `${isMobile ? 'p-2' : 'p-[1vw]'} w-full relative` : '')}
                            style={{ backgroundColor: (isLayout2 || (isMobile && isLandscape) || Number(activeLayout) === 3) ? "rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.4 + var(--toc-bg-opacity, 1) * 0.6))" : 'transparent' }}
                        >
                            <div className={Number(activeLayout) === 3 ? 'relative z-10' : ''}>
                                {/* Header Section */}
                                 {(isLayout2 || (isMobile && isLandscape)) ? (
                                    <div className={`flex items-center gap-2 ${isMobile && isLandscape ? 'mb-2' : 'mb-3'}`}>
                                        <h2 className={`${isMobile && isLandscape ? 'text-[9.5px]' : 'text-[11px]'} font-bold whitespace-nowrap`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                            Table of Contents
                                        </h2>
                                        <div className="h-[1px] flex-1" style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.3)' }} />
                                    </div>
                                ) : (
                                    <div className={`text-center ${isMobile ? 'mb-1 px-1' : 'mb-[1vw] px-[0.5vw]'}`}>
                                        <h2 className={`${isMobile ? 'text-[11px]' : 'text-[1.2vw]'} font-medium tracking-wide ${isMobile ? 'mb-0.5' : 'mb-[0.6vw]'}`}
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                        >
                                            Table of Contents
                                        </h2>
                                        <div className="h-[1px] w-full"
                                            style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 0.5)' }}
                                        ></div>
                                    </div>
                                )}

                                 {addSearch && (
                                    <div className={`mb-3 relative ${isMobile ? 'px-0' : 'px-[0.5vw]'}`}>
                                        <style>{`
                                            .toc-search-bar::placeholder {
                                                color: inherit !important;
                                                opacity: 0.5;
                                            }
                                        `}</style>
                                        <Icon
                                            icon="lucide:search"
                                            className={`absolute ${isMobile ? (isLandscape ? 'left-2.5' : 'left-3') : 'left-[1.2vw]'} top-1/2 -translate-y-1/2 ${isMobile ? (isLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5') : 'w-[0.85vw] h-[0.85vw]'}`}
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.7)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={`w-full rounded-full ${isMobile ? (isLandscape ? 'pl-7 pr-2.5 py-1 text-[8.5px]' : 'pl-9 pr-3 py-1.5 text-[10px]') : (isTablet ? 'pl-[2vw] pr-[0.8vw] py-[0.4vw] text-[0.7vw]' : 'pl-[2.2vw] pr-[0.8vw] py-[0.4vw] text-[0.8vw]')} outline-none border border-white/10 transition-colors toc-search-bar`}
                                            style={{ 
                                                color: getLayoutColor('toc-text', '#FFFFFF'),
                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                                opacity: 'var(--toc-text-opacity, 1)',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                            }}
                                        />
                                    </div>
                                )}

                                 <div
                                    ref={scrollContainerRef}
                                    className={`flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 ${isMobile ? (isLandscape ? 'max-h-[115px]' : 'max-h-[155px]') : (isLayout2 ? 'max-h-[25vh]' : 'max-h-[18vw]')}`}
                                    style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                                >
                                 {filteredContent.map((heading, hIdx) => (
                                        <React.Fragment key={heading.id}>
                                             <div
                                                className={`flex items-center justify-between ${isMobile ? 'px-2 py-1.5' : 'px-[0.6vw] py-[0.5vw]'} hover:bg-white/10 rounded-md transition-colors cursor-pointer group`}
                                                onClick={() => onNavigate && onNavigate(heading.page - 1)}
                                            >
                                                 <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                    <span className={`${isMobile && isLandscape ? 'text-[9.5px]' : isTablet ? 'text-[0.8vw]' : 'text-[11px]'} font-bold truncate`}
                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                                    >
                                                        {heading.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className={`${isMobile && isLandscape ? 'text-[8.5px]' : 'text-[10px]'} font-bold flex-shrink-0 ml-2 tabular-nums`}
                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.8)' }}
                                                    >
                                                        {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                    </span>
                                                )}
                                            </div>

                                            {heading.subheadings?.map((sub, sIdx) => (
                                                 <div
                                                    key={sub.id}
                                                    className={`flex items-center justify-between ${isMobile ? 'px-2 py-1 ml-4' : 'px-[0.6vw] py-[0.4vw] ml-[1.2vw]'} hover:bg-white/10 rounded-md transition-colors cursor-pointer group`}
                                                    onClick={() => onNavigate && onNavigate(sub.page - 1)}
                                                >
                                                     <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                        <span className={`${isMobile && isLandscape ? 'text-[8.5px]' : isTablet ? 'text-[0.7vw]' : 'text-[10px]'} font-semibold truncate`}
                                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}
                                                        >
                                                            {sub.title}
                                                        </span>
                                                    </div>
                                                    {addPageNumber && (
                                                        <span className={`${isMobile && isLandscape ? 'text-[8px]' : 'text-[9px]'} font-bold flex-shrink-0 ml-2 tabular-nums`}
                                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}
                                                        >
                                                            {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                     {filteredContent.length === 0 && (
                                        <div className="text-[10px] text-center py-4 font-medium"
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.5)' }}
                                        >
                                            No Table Of Content Found
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

export default TableOfContentsPopup;
