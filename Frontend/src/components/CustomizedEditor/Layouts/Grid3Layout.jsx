import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const PageThumbnail = React.memo(({ html, index, scale = 0.15 }) => {
    // Optimization: Strip malicious/heavy scripts
    const cleanHtml = (html || '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<video\b[^<]*(?:(?!<\/video>)<[^<]*)*<\/video>/gi, '<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:20px;color:#9ca3af">Video</div>')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:20px;color:#9ca3af">Frame</div>')
        .replace(/<img\b([^>]*src=['"]https:\/\/codia-f2c\.s3\.us-west-1\.amazonaws\.com\/[^'"]*['"])([^>]*)>/gi, '<img $1 crossOrigin="anonymous" $2>');

    const srcDoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        background: white; 
                        width: 400px; 
                        height: 566px; 
                        position: relative;
                    }
                    * { box-sizing: border-box; }
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                    img { max-width: 100%; height: auto; display: block; }
                </style>
            </head>
            <body>
                 <div style="width: 400px; height: 566px; overflow: hidden; position: relative; background: white;">
                    ${cleanHtml}
                </div>
            </body>
        </html>
    `;

    return (
        <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
            <iframe
                className="border-none pointer-events-none"
                srcDoc={srcDoc}
                title={`Thumb ${index}`}
                loading="lazy"
                style={{
                    width: '400px',
                    height: '566px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    backgroundColor: 'white'
                }}
            />
        </div>
    );
});

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const Grid3TableOfContents = ({ onClose, onNavigate, settings }) => {
    const { content = [] } = settings || {};

    return (
        <>
            <div className="absolute inset-0 z-[99] pointer-events-auto" onClick={onClose} />
            <div className="absolute top-[6.8vh] left-[28.5vw] z-[100] pointer-events-auto">
                <div
                    className="bg-white rounded-[0.5vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] p-[0.8vw] w-[14vw] border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-[0.8vw] px-[0.2vw]">
                        <h2 className="text-[0.85vw] font-bold text-[#3E4491]">Table of Contents</h2>
                    </div>

                    <div className="flex flex-col gap-[0.1vw] overflow-y-auto custom-scrollbar pr-[0.2vw] max-h-[35vh]">
                        {content && content.length > 0 ? (
                            content.map((heading) => (
                                <React.Fragment key={heading.id}>
                                    <div
                                        className="flex items-center justify-between px-[0.6vw] py-[0.4vw] rounded-[0.3vw] transition-colors cursor-pointer group hover:bg-black/5 text-[#575C9C]"
                                        onClick={() => onNavigate && onNavigate(heading.page - 1)}
                                    >
                                        <div className="truncate flex-1 min-w-0">
                                            <span className="text-[0.75vw] font-semibold truncate tracking-tight">
                                                {heading.title}
                                            </span>
                                        </div>
                                        <span className="text-[0.75vw] opacity-80 font-medium flex-shrink-0 ml-[0.4vw] tabular-nums">
                                            {heading.page < 10 ? `0${heading.page}` : heading.page}
                                        </span>
                                    </div>

                                    {heading.subheadings?.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between px-[0.6vw] py-[0.25vw] pl-[1.2vw] rounded-[0.3vw] transition-colors cursor-pointer group hover:bg-black/5 text-[#575C9C]"
                                            onClick={() => onNavigate && onNavigate(sub.page - 1)}
                                        >
                                            <div className="truncate flex-1 min-w-0">
                                                <span className="text-[0.75vw] font-medium truncate opacity-90">
                                                    {sub.title}
                                                </span>
                                            </div>
                                            <span className="text-[0.75vw] opacity-70 font-medium flex-shrink-0 ml-[0.4vw] tabular-nums">
                                                {sub.page < 10 ? `0${sub.page}` : sub.page}
                                            </span>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))
                        ) : (
                            <div className="text-[0.8vw] text-center py-[1vw] opacity-60 font-medium text-[#575C9C]">
                                No Table Of Content Found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};



const Grid3Layout = ({
    children,
    settings,
    bookName,
    searchQuery,
    setSearchQuery,
    handleQuickSearch,
    setShowThumbnailBarMemo,
    setShowTOCMemo,
    setShowAddNotesPopupMemo,
    setShowAddBookmarkPopupMemo,
    setShowViewBookmarkPopup,
    setShowNotesViewerMemo,
    bookRef,
    pages,
    setIsPlaying,
    isAutoFlipping,
    handleShare,
    handleDownload,
    handleFullScreen,
    setShowProfilePopup,
    logoSettings,
    currentPage,
    pagesCount,
    currentZoom,
    setCurrentZoom,
    onPageClick,
    bookmarks,
    onDeleteBookmark,
    onUpdateBookmark,
    notes,
    onAddNote,
    profileSettings,
    isSidebarOpen,
    showViewBookmarkPopup,
    backgroundSettings,
    backgroundStyle,
    isMuted,
    onToggleAudio,
    setShowGalleryPopupMemo,
    showSoundPopup,
    setShowSoundPopupMemo,
    activeLayout,
    isTablet
}) => {
    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isTablet ? initialWidth * 0.7 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isTablet ? initialHeight * 0.7 : initialHeight);
    const aspectRatio = initialHeight / initialWidth;

    // Reset dimensions to default when tablet mode changes or initial props change
    React.useEffect(() => {
        setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
        setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
    }, [isTablet, initialWidth, initialHeight]);

    const zoomIn = () => {
        setDimWidth(prev => {
            const nextWidth = Math.min(prev + 20, initialWidth * 1.3);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    };

    const zoomOut = () => {
        setDimWidth(prev => {
            const nextWidth = Math.max(prev - 10, initialWidth * 0.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    };

    const localOffset = React.useMemo(() => {
        // Shift left to center the front cover, shift right to center the back cover
        if (currentPage === 0) {
            return -(dimWidth / 2);
        } else if (currentPage >= pages.length - 1) {
            return (currentPage % 2 === 0) ? -(dimWidth / 2) : (dimWidth / 2);
        }
        return 0;
    }, [currentPage, pages.length, dimWidth]);

    const originalBuildPageDoc = children && children.props && children.props.buildPageDoc;
    const localBuildPageDoc = React.useCallback((html, pageNum) => {
        const content = originalBuildPageDoc ? originalBuildPageDoc(html, pageNum) : html;
        const zoomFactor = dimWidth / initialWidth;
        // Inject zoom into the body style to ensure fixed-pixel templates scale with the container resolution
        if (typeof content === 'string' && content.includes('<body')) {
            return content.replace('<body', `<body style="zoom: ${zoomFactor};"`);
        }
        return content;
    }, [dimWidth, initialWidth, originalBuildPageDoc]);

    const modifiedChildren = React.useMemo(() => {
        if (!children) return null;
        return React.cloneElement(children, {
            WIDTH: dimWidth,
            HEIGHT: dimHeight,
            buildPageDoc: localBuildPageDoc
        });
    }, [children, dimWidth, dimHeight, localBuildPageDoc]);

    const totalPages = pagesCount;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [showTOC, setShowTOC] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showLocalBookmarkDropdown, setShowLocalBookmarkDropdown] = useState(false);
    const [showLocalNotesDropdown, setShowLocalNotesDropdown] = useState(false);

    const scrollRef = useRef(null);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth * 0.3;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            result.push({ pages: [pages[0]], indices: [0], label: "Page 1" });
            for (let i = 1; i < pages.length; i += 2) {
                const spreadIndices = [i];
                const spreadPages = [pages[i]];
                if (i + 1 < pages.length) {
                    spreadIndices.push(i + 1);
                    spreadPages.push(pages[i + 1]);
                }
                result.push({
                    pages: spreadPages,
                    indices: spreadIndices,
                    label: spreadIndices.length === 1 ? `Page ${spreadIndices[0] + 1}` : `Page ${spreadIndices[0] + 1}-${spreadIndices[1] + 1}`
                });
            }
        }
        return result;
    }, [pages]);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    useEffect(() => {
        const timer = setTimeout(checkScroll, 50);
        window.addEventListener('resize', checkScroll);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [spreads, showThumbnails]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (showThumbnails && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        checkScroll();
    }, [currentPage, showThumbnails]);

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans">
            <div
                className="flex-1 flex flex-col h-full w-full transition-transform duration-500 ease-in-out"
                style={{
                    transform: 'scale(1)',
                    transformOrigin: 'center center'
                }}
            >
                {/* Layout 3 Top Bar - High Fidelity Match */}
                <div className={`${isTablet ? 'h-[6vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50 relative border-b border-white/5 shadow-lg`} style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}>
                    {/* Left: Rounded Search Pill */}
                    <div className="flex items-center">
                        <div className="relative">
                            <div className={`flex items-center rounded-full px-[1vw] py-[0.45vw] shadow-md group transition-all duration-300 ${isSidebarOpen ? 'w-[10vw]' : 'w-[12vw]'}`}
                                style={{ backgroundColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '1') }}
                            >
                                <style>{`
                                    #quick-search-v3::placeholder {
                                        color: ${getLayoutColor('search-text-v1', '#575C9C')} !important;
                                        opacity: var(--search-text-v1-opacity, 1);
                                    }
                                `}</style>
                                <Icon icon="ph:magnifying-glass-bold" className={`${isTablet ? 'w-[0.7vw] h-[0.7vw]' : 'w-[1.1vw] h-[1.1vw]'}`} style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }} />
                                <input
                                    type="text"
                                    id="quick-search-v3"
                                    placeholder="Search..."
                                    value={localSearchQuery}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLocalSearchQuery(val);
                                        if (val.length >= 1) {
                                            const results = [];
                                            const lowerQuery = val.toLowerCase();
                                            pages.forEach((page, index) => {
                                                const text = (page.html || page.content || '').replace(/<[^>]*>/g, ' ');
                                                const words = text.split(/\s+/);
                                                const pageMatches = new Set();
                                                words.forEach(word => {
                                                    const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
                                                    if (cleanWord.length > 2 && cleanWord.toLowerCase().startsWith(lowerQuery)) {
                                                        pageMatches.add(cleanWord);
                                                    }
                                                });
                                                pageMatches.forEach(word => {
                                                    if (results.length < 6) {
                                                        results.push({ word, pageNumber: index + 1 });
                                                    }
                                                });
                                            });
                                            setRecommendations(results);
                                        } else {
                                            setRecommendations([]);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setSearchQuery(localSearchQuery);
                                            handleQuickSearch(localSearchQuery);
                                            setRecommendations([]);
                                        }
                                    }}
                                    className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isTablet ? 'text-[0.55vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                    style={{ 
                                        color: getLayoutColor('search-text-v1', '#575C9C'),
                                        opacity: 'var(--search-text-v1-opacity, 1)'
                                    }}
                                />
                            </div>

                            {/* Search Recommendations Dropdown */}
                            {recommendations.length > 0 && (
                                <div 
                                    className={`absolute top-[3.5vw] left-0 rounded-[1vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.15)] z-[100] overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 transition-all duration-300 ${isSidebarOpen ? 'w-[14vw]' : 'w-[18vw]'}`}
                                    style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                                >
                                    <div className="px-[1.2vw] py-[0.8vw] border-b border-gray-50 bg-gray-50/10">
                                        <span className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>Suggestion</span>
                                    </div>
                                    <div className="flex flex-col py-[0.4vw]">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                className="flex items-center justify-between px-[1.2vw] py-[0.7vw] transition-colors group hover:bg-black/5"
                                                style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setLocalSearchQuery(rec.word);
                                                    setSearchQuery(rec.word);
                                                    setRecommendations([]);
                                                }}
                                            >
                                                <span className="text-[0.85vw] font-medium opacity-90 group-hover:opacity-100">{rec.word}</span>
                                                <span className="text-[0.8vw] font-bold opacity-60 tabular-nums">Pg {rec.pageNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center: Top Row Icons */}
                    <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center ${isTablet ? 'gap-[0.4vw]' : 'gap-[0.8vw]'}`}>
                        {/* List/TOC */}
                        <div className="relative">
                            <button onClick={() => setShowTOC(!showTOC)} className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                                <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                            {showTOC && (
                                <>
                                    <div className="fixed inset-0 z-[99]" onClick={() => setShowTOC(false)} />
                                    <div className="absolute top-[calc(100%+1vh)] left-0 z-[100] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200 shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] rounded-[0.5vw] bg-white overflow-hidden border border-gray-100">
                                        <div 
                                            className="absolute inset-0"
                                            style={{ 
                                                backgroundColor: `rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.4 + var(--toc-bg-opacity, 1) * 0.6))`,
                                            }}
                                        />
                                        <div
                                            className="relative z-10 p-[0.6vw] w-[10vw]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="mb-[0.6vw] px-[0.2vw]">
                                                <h2 className="text-[0.75vw] font-bold" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</h2>
                                            </div>
                                            <div className="flex flex-col gap-[0.1vw] overflow-y-auto custom-scrollbar pr-[0.2vw] max-h-[35vh]">
                                                {(() => {
                                                    const tocContent = (settings?.tocSettings || settings?.tableOfContents)?.content || [];
                                                    return tocContent.length > 0 ? tocContent.map((heading) => (
                                                        <React.Fragment key={heading.id}>
                                                            <div
                                                                className="flex items-center justify-between px-[0.6vw] py-[0.4vw] rounded-[0.3vw] transition-colors cursor-pointer group hover:bg-black/5"
                                                                style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                                onClick={() => { onPageClick(heading.page - 1); setShowTOC(false); }}
                                                            >
                                                                <div className="truncate flex-1 min-w-0">
                                                                    <span className="text-[0.65vw] font-semibold truncate tracking-tight">{heading.title}</span>
                                                                </div>
                                                                <span className="text-[0.65vw] opacity-80 font-medium flex-shrink-0 ml-[0.3vw] tabular-nums">
                                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                                </span>
                                                            </div>
                                                            {heading.subheadings?.map((sub) => (
                                                                <div
                                                                    key={sub.id}
                                                                    className="flex items-center justify-between px-[0.6vw] py-[0.25vw] pl-[1.2vw] rounded-[0.3vw] transition-colors cursor-pointer group hover:bg-black/5"
                                                                    style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                                    onClick={() => { onPageClick(sub.page - 1); setShowTOC(false); }}
                                                                >
                                                                    <div className="truncate flex-1 min-w-0">
                                                                        <span className="text-[0.65vw] font-medium truncate opacity-90">{sub.title}</span>
                                                                    </div>
                                                                    <span className="text-[0.65vw] opacity-70 font-medium flex-shrink-0 ml-[0.3vw] tabular-nums">
                                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </React.Fragment>
                                                    )) : (
                                                        <div className="text-[0.65vw] text-center py-[1vw] opacity-60 font-medium" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                                            No Table Of Content Found
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Squares/Thumbnails */}
                        <button onClick={() => setShowThumbnails(!showThumbnails)} className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                        <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        {/* Notes Icon with Dropdown */}
                        <div className="relative">
                            <button onClick={() => { setShowLocalNotesDropdown(prev => !prev); setShowLocalBookmarkDropdown(false); setShowTOC(false); setShowThumbnails(false); }} className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                                <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                            <AnimatePresence>
                                {showLocalNotesDropdown && (
                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute top-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.85'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '9vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
                                        <button className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.8vw]'} hover:bg-white/10 transition-colors text-left group`} onClick={() => { setShowAddNotesPopupMemo(true); setShowLocalNotesDropdown(false); }} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                            <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`} style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }} />
                                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Add Notes</span>
                                        </button>
                                        <div className="h-[1px] bg-white/10 w-full" />
                                        <button className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.8vw]'} hover:bg-white/10 transition-colors text-left group`} onClick={() => { setShowNotesViewerMemo(true); setShowLocalNotesDropdown(false); }} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                            <Icon icon="lucide:sticky-note" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`} style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }} />
                                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>View Notes</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* Bookmark Icon with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowLocalBookmarkDropdown(prev => !prev);
                                    setShowLocalNotesDropdown(false);
                                    setShowTOC(false);
                                    setShowThumbnails(false);
                                }}
                                className={`transition-all transform hover:scale-110 p-[0.3vw] rounded-[0.5vw] ${showViewBookmarkPopup ? 'bg-white/20 text-white shadow-inner' : 'hover:opacity-70'}`}
                                style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                            >
                                <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                            <AnimatePresence>
                                {showLocalBookmarkDropdown && (
                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute top-[calc(100%+0.5vw)]  left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.85'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '10vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
                                        <button className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.8vw]'} hover:bg-white/10 transition-colors text-left group`} onClick={() => { setShowAddBookmarkPopupMemo(true); setShowLocalBookmarkDropdown(false); }} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                            <Icon icon="fluent:bookmark-add-24-filled" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`} style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }} />
                                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Add Bookmark</span>
                                        </button>
                                        <div className="h-[1px] bg-white/10 w-full" />
                                        <button className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.8vw]'} hover:bg-white/10 transition-colors text-left group`} onClick={() => { setShowViewBookmarkPopup(true); setShowLocalBookmarkDropdown(false); }} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                            <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`} style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }} />
                                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>View Bookmark</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* Image/Gallery */}
                        <button
                            onClick={() => setShowGalleryPopupMemo(true)}
                            className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                            style={{ 
                                color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                opacity: 'var(--toolbar-icon-opacity, 1)'
                            }}
                        >
                            <Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        {/* Music */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); }}
                            className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                            style={{ 
                                color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                opacity: showSoundPopup ? '0.3' : 'var(--toolbar-icon-opacity, 1)'
                            }}
                        >
                            <Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        {/* Profile */}
                        <button 
                            onClick={() => setShowProfilePopup(true)} 
                            className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]" 
                            style={{ 
                                color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                opacity: 'var(--toolbar-icon-opacity, 1)'
                            }}
                        >
                            <Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        {/* Share */}
                        <button onClick={handleShare} className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="majesticons:share" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        {/* Download */}
                        <button onClick={handleDownload} className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        {/* Magnifying Glass */}
                        <button onClick={handleFullScreen} className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                        <Icon icon={isFullScreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                    </div>

                    {/* Right: Brand Logo Container */}
                    <div className="flex items-center">
                        <div className="flex items-center">
                            {settings.brandingProfile.logo && logoSettings?.src && (
                                <img
                                    src={logoSettings.src}
                                    alt="Brand Logo"
                                    className={`${isTablet ? 'h-[1.5vw]' : 'h-[1.8vw]'} w-auto transition-all`}
                                    style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col relative z-[1]" style={{ backgroundColor: backgroundSettings?.color || '#DADBE8', ...backgroundStyle }}>
                    {/* Centered Book Name */}
                    <div className="w-full flex justify-center py-[1.2vh] pointer-events-none z-20">
                        <span className="text-[1.1vw] font-bold tracking-tight" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 'var(--toolbar-text-main-opacity, 1)' }}>{bookName}</span>
                    </div>

                    <div className="flex-1 w-full flex items-center justify-center relative min-h-0">

                        {/* Side Navigation Arrows */}
                        <button
                            className={`absolute  ${isTablet ? 'left-[4vw]' : 'left-[8vw]'} top-1/2 -translate-y-1/2 w-[2.4vw] h-[2.4vw] flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 rounded-full z-20`}
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        >
                            <Icon icon="lucide:chevron-left" className="w-[1.2vw] h-[1.2vw]" />
                        </button>
                        <button
                            className={`absolute ${isTablet ? 'right-[4vw]' : 'right-[8vw]'} top-1/2 -translate-y-1/2 w-[2.4vw] h-[2.4vw] flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 rounded-full z-20`}
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        >
                            <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw]" />
                        </button>



                        {/* Flipbook Magazine Container */}
                        <div
                            className="relative flex items-center justify-center magazine-content-area"
                            style={{
                                transform: `translateX(${localOffset}px) scale(1)`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.6s ease-in-out'
                            }}
                        >
                            {modifiedChildren}
                        </div>
                    </div>
                </div>

                {/* Layout 3 Bottom Bar - Integrated Progress UI */}
                <div className={`${isTablet ? 'h-[6vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[2vw] shrink-0 w-full relative z-40 transition-all`} style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '62, 68, 145', '1') }}>

                    {/* Left: Page Counter Rounded Box */}
                    <div className="flex items-center">
                        <div className={`rounded-[0.5vw] ${isTablet ? 'px-[0.6vw] py-[0.25vw] min-w-[5.5vw]' : 'px-[1vw] py-[0.4vw] min-w-[7.5vw]'} text-center shadow-sm`} style={{ backgroundColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '1') }}>
                            <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-bold select-none whitespace-nowrap`} style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}>Page </span>
                            <input
                                type="text"
                                value={pageInputValue}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setPageInputValue(val);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const pageNum = parseInt(pageInputValue, 10);
                                        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pages.length) {
                                            onPageClick(pageNum - 1);
                                        } else {
                                            setPageInputValue(String(currentPage + 1));
                                        }
                                        e.target.blur();
                                    }
                                }}
                                onBlur={() => {
                                    const pageNum = parseInt(pageInputValue, 10);
                                    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pages.length) {
                                        onPageClick(pageNum - 1);
                                    } else {
                                        setPageInputValue(String(currentPage + 1));
                                    }
                                }}
                                className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-bold bg-transparent border-none outline-none text-center`}
                                style={{ width: `${String(pages.length).length + 1}ch`, color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}
                            />
                            <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-bold select-none whitespace-nowrap`} style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}> / {totalPages}</span>
                        </div>
                    </div>

                    {/* Center: Playback Control Group */}
                    <div className={`flex items-center ${isTablet ? 'gap-[1vw]' : 'gap-[1.5vw]'}`}>
                        {/* Previous Spread */}
                        <button
                            className="hover:scale-110 transition-all transform active:scale-95 p-[0.3vw]"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                            onClick={() => onPageClick(0)}
                        >
                            <Icon icon="lucide:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                        {/* Play/Pause */}
                        <button
                            className="hover:scale-110 transition-all transform active:scale-90 p-[0.3vw]"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                            onClick={() => setIsPlaying(!isAutoFlipping)}
                        >
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                        </button>
                        {/* Next Spread */}
                        <button
                            className="hover:scale-110 transition-all transform active:scale-95 p-[0.3vw]"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                            onClick={() => onPageClick(totalPages - 1)}
                        >
                            <Icon icon="lucide:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                    </div>

                    {/* Right: Zoom Pill with Reset Button */}
                    <div className="flex items-center">
                        <div className={`flex items-center px-[0.4vw] py-[0.3vw] pl-[1vw] rounded-[0.5vw] border shadow-sm transition-all duration-300 ${isSidebarOpen ? 'gap-[0.5vw]' : 'gap-[0.8vw]'}`}
                            style={{ 
                                backgroundColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '1'),
                                borderColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '1')
                            }}
                        >
                            <div className={`flex items-center transition-all duration-300 ${isSidebarOpen ? 'gap-[0.8vw]' : 'gap-[1.2vw]'}`}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                    className="hover:scale-110 transition-transform active:scale-95 flex items-center"
                                    style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}
                                >
                                    <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.7vw] h-[0.7vw]' : 'w-[0.9vw] h-[0.9vw]'}`} />
                                </button>
                                <span className={`font-bold ${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} tracking-tight tabular-nums select-none min-w-[2.5vw]`}
                                    style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}
                                >
                                    {Math.round((dimWidth / initialWidth) * 100)}%
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                    className="hover:scale-110 transition-transform active:scale-95 flex items-center"
                                    style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}
                                >
                                    <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.7vw] h-[0.7vw]' : 'w-[0.9vw] h-[0.9vw]'}`} />
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                    setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                }}
                                className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.78vw]'} font-bold py-[0.3vw] rounded-[0.35vw] transition-all shadow-sm active:scale-95 ${isSidebarOpen ? 'px-[0.5vw]' : 'px-[0.8vw]'}`}
                                style={{ 
                                    backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1'), 
                                    color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                    opacity: 'var(--toolbar-icon-opacity, 1)'
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Constant Progress Line Overlay at very bottom */}
                    <div className="absolute bottom-[0.8vh] left-[2vw] right-[2vw] h-[0.3vh] bg-white/20 overflow-hidden rounded-full">
                        <div
                            className="h-full bg-white transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* In-Layout Thumbnails Bar overlay matching the exact Layout 3 spec */}
                {showThumbnails && (
                    <>
                        <div className="absolute inset-0 z-[100] bg-transparent" onClick={() => setShowThumbnails(false)} />
                        <div
                            className="absolute z-[150] flex items-center pointer-events-auto transition-all top-[calc(6vh+0vw)] left-[4vw] right-[4vw] h-[5vw] rounded-[0.5vw] shadow-[0_0.2vw_1vw_rgba(0,0,0,0.15)] px-[0.4vw] border border-gray-100/50"
                            style={{ 
                                backgroundColor: `rgba(var(--thumbnail-outer-v2-rgb, 255, 255, 255), var(--thumbnail-outer-v2-opacity, 0.8))`,
                                backdropBlur: '12px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="w-[1.6vw] h-[3.2vw] rounded-[0.3vw] hover:opacity-80 flex items-center justify-center transition-all shrink-0 z-20"
                                style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                            >
                                <Icon icon="lucide:chevron-left" className="w-[1.2vw] h-[1.2vw]" />
                            </button>

                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="flex-1 flex overflow-x-hidden no-scrollbar scroll-smooth items-center h-full gap-[0.8vw] px-[1vw]"
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    return (
                                            <div className="thumbnail-item relative flex flex-col items-center shrink-0 cursor-pointer rounded-[0.3vw] p-[0.25vw] border-[0.12vw] transition-all gap-[0.2vw]"
                                                style={{ 
                                                    width: '4.8vw',
                                                    borderColor: getLayoutColor('thumbnail-inner-v2', '#575C9C'),
                                                    backgroundColor: isSelected ? getLayoutColor('thumbnail-inner-v2', '#E2E4F0') : getLayoutColor('thumbnail-outer-v2', '#FFFFFF')
                                                }}
                                                onClick={() => {
                                                    onPageClick(spread.indices[0]);
                                                }}
                                            >
                                                <div className="flex w-full bg-gray-200 gap-[1px] h-[3vw] overflow-hidden rounded-[0.15vw] justify-center">
                                                    {spread.pages.map((page, pIdx) => {
                                                        const pageWidth = 400;
                                                        const pageHeight = 566;
                                                        const availableWidth = 60 / 2; // Scaled down 
                                                        const availableHeight = 45;
                                                        const scaleX = (availableWidth - 2) / pageWidth;
                                                        const scaleY = (availableHeight - 2) / pageHeight;
                                                        const thumbScale = Math.min(scaleX, scaleY);
                                                        return (
                                                            <div key={`${idx}-${pIdx}`} className="flex-1 max-w-[50%] bg-white overflow-hidden relative flex items-center justify-center">
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={spread.indices[pIdx]}
                                                                    scale={thumbScale}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <span className="text-[0.45vw] font-bold tracking-tight relative z-10" style={{ color: isSelected ? getLayoutColor('thumbnail-outer-v2', '#FFFFFF') : getLayoutColor('toc-text', '#575C9C') }}>
                                                    {spread.label}
                                                </span>
                                            </div>
                                    );
                                })}
                            </div>
                            <button
                                className="w-[1.6vw] h-[3.2vw] rounded-[0.3vw] hover:opacity-80 flex items-center justify-center transition-all shrink-0 z-20"
                                style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                            >
                                <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw]" />
                            </button>
                        </div>
                    </>
                )}




            </div>
        </div>
    );
};

export default Grid3Layout;
