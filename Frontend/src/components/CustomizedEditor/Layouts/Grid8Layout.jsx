import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

const PageThumbnail = React.memo(({ html, index, scale = 0.15 }) => {
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

const Grid8Layout = ({
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
    notes,
    onUpdateBookmark,
    onDeleteBookmark,
    onNavigate,
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
    layoutColors,
    isTablet
}) => {
    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isTablet ? initialWidth * 0.9 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isTablet ? initialHeight * 0.9 : initialHeight);
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

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const thumbScrollRef = useRef(null);

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);


    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    const spreads = useMemo(() => {
        const s = [];
        if (!pages || pages.length === 0) return s;

        // Page 1 (Front Cover)
        s.push({ label: 'Page 1', indices: [0], pages: [pages[0]] });

        // Middle spreads
        for (let i = 1; i < pages.length - 1; i += 2) {
            const indices = [i];
            const spreadPages = [pages[i]];
            if (i + 1 < pages.length) {
                indices.push(i + 1);
                spreadPages.push(pages[i + 1]);
            }
            s.push({
                label: indices.length > 1 ? `Page ${indices[0] + 1}-${indices[1] + 1}` : `Page ${indices[0] + 1}`,
                indices,
                pages: spreadPages
            });
        }

        // Last page (Back Cover) if not already included
        const lastIdx = pages.length - 1;
        if (lastIdx > 0 && !s.some(spread => spread.indices.includes(lastIdx))) {
            s.push({
                label: `Page ${lastIdx + 1}`,
                indices: [lastIdx],
                pages: [pages[lastIdx]]
            });
        }
        return s;
    }, [pages]);

    const progressHoverRef = useRef(null);
    const progressRef = useRef(null);
    const [progressHover, setProgressHover] = useState({
        visible: false,
        x: 0,
        pageIndex: 0,
        spread: null
    });

    const handleProgressMouseMove = (e) => {
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
        progressHoverRef.current = requestAnimationFrame(() => {
            const boundedX = Math.max(0, Math.min(x, rect.width));
            const percentage = boundedX / rect.width;
            let targetIdx = Math.round(percentage * (pagesCount - 1));

            const activeSpread = spreads.find(s => s.indices.includes(targetIdx)) || spreads[0];

            setProgressHover({
                visible: true,
                x: boundedX,
                pageIndex: targetIdx,
                spread: activeSpread
            });
        });
    };

    const handleProgressClick = (e) => {
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pagesCount - 1));
        onPageClick(targetIdx);
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Scroll active thumbnail into view when panel opens
    useEffect(() => {
        if (showThumbnails && thumbScrollRef.current) {
            const activeEl = thumbScrollRef.current.querySelector(`[data-thumb-index="${currentPage}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [showThumbnails, currentPage]);

    const primaryColor = layoutColors?.primary || '#575C9C';
    const baseBgColor = layoutColors?.secondary || '#E3E4EF';

    const hexToRgba = (hex, opacity = 100) => {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = Math.max(0.4, Math.min(1, opacity / 100));
        return a >= 1 ? hex : `rgba(${r},${g},${b},${a})`;
    };

    const getLayoutColor = (id, defaultColor) => {
        if (!layoutColors) return `var(--${id}, ${defaultColor})`;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            if (!colorObj) return `var(--${id}, ${defaultColor})`;
            return hexToRgba(colorObj.hex, colorObj.opacity ?? 100);
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[8] && Array.isArray(layoutColors[8])) {
            const colorObj = layoutColors[8].find(c => c.id === id);
            if (!colorObj) return `var(--${id}, ${defaultColor})`;
            return hexToRgba(colorObj.hex, colorObj.opacity ?? 100);
        }

        return `var(--${id}, ${defaultColor})`;
    };

    const getLayoutOpacity = (id, defaultOpacity) => {
        if (!layoutColors) return defaultOpacity;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? Math.max(0.4, colorObj.opacity / 100) : defaultOpacity;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[8] && Array.isArray(layoutColors[8])) {
            const colorObj = layoutColors[8].find(c => c.id === id);
            return colorObj ? Math.max(0.4, colorObj.opacity / 100) : defaultOpacity;
        }

        return defaultOpacity;
    };

    return (
        <div
            className="h-screen w-full font-sans overflow-hidden relative"
            style={backgroundStyle}
            onClick={() => {
                setRecommendations([]);
                setShowSuggestions(false);
                setShowBookmarkOptions(false);
                setShowNotesOptions(false);
            }}
        >
            {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[80] bg-transparent" onClick={() => setShowSuggestions(false)} />}
            {/* Top Overlay Area */}
            <div className={`absolute ${isTablet ? 'top-[2vh]' : 'top-[3vh]'} left-[2vw] right-[2vw] flex items-center justify-between z-50 pointer-events-none`}>

                {/* Left: Search & Zoom */}
                <div className="flex-1 flex justify-start items-center gap-[1vw] pointer-events-auto">
                    <div className={`relative ${showSuggestions && recommendations.length > 0 ? 'z-[90]' : 'z-50'}`} onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`flex items-center rounded-full px-[1vw] py-[0.5vh] ${isTablet ? 'h-[3.2vh]' : 'h-[4vh]'} shadow-sm transition-all duration-300 ${isSidebarOpen ? (isTablet ? 'w-[7vw]' : 'w-[9vw]') : (isTablet ? 'w-[13vw]' : 'w-[16vw]')}`}
                            style={{ backgroundColor: getLayoutColor('search-bg-v2', getLayoutColor('toolbar-bg', '#575C9C')) }}
                        >
                            <Icon icon="lucide:search" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`} style={{ color: getLayoutColor('search-text-v1', getLayoutColor('toolbar-text-main', '#FFFFFF')) }} />
                            <input
                                type="text"
                                value={localSearchQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSearchQuery(val);
                                    setShowSuggestions(true);
                                    if (val.length >= 1) {
                                        const results = [];
                                        const lowerQuery = val.toLowerCase();
                                        const uniqueMatches = new Set();
                                        pages.forEach((page, index) => {
                                            const text = (page.html || page.content || '').replace(/<[^>]*>/g, ' ');
                                            const words = text.split(/\s+/).filter(w => w.trim().length > 0);

                                            for (let i = 0; i < words.length; i++) {
                                                const word = words[i];
                                                const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
                                                if (cleanWord.length > 2 && cleanWord.toLowerCase().startsWith(lowerQuery)) {
                                                    const contextWords = words.slice(i + 1, i + 3).join(' ');
                                                    const matchKey = `${cleanWord.toLowerCase()}|${contextWords.toLowerCase()}`;

                                                    if (!uniqueMatches.has(matchKey)) {
                                                        results.push({
                                                            word: word,
                                                            context: contextWords,
                                                            pageNumber: index + 1
                                                        });
                                                        uniqueMatches.add(matchKey);
                                                    }
                                                }
                                                if (results.length > 15) break;
                                            }
                                            if (results.length > 15) return;
                                        });
                                        setRecommendations(results.slice(0, 6));
                                    } else {
                                        setRecommendations([]);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchQuery(localSearchQuery);
                                        handleQuickSearch(localSearchQuery);
                                        setRecommendations([]);
                                        setShowSuggestions(false);
                                    }
                                }}
                                onFocus={() => { if (recommendations.length > 0) setShowSuggestions(true); }}
                                placeholder="Quick Search..."
                                className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                style={{ color: getLayoutColor('search-text-v1', getLayoutColor('toolbar-text-main', '#FFFFFF')) }}
                            />
                        </div>

                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-[5vh] left-0 bg-white rounded-[0.4vw] shadow-2xl w-[16vw] overflow-hidden border border-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="px-[1vw] py-[0.8vh] border-b border-gray-100 bg-gray-50/50">
                                        <span className="text-[0.9vw] font-bold" style={{ color: primaryColor }}>Suggestion</span>
                                    </div>
                                    <div className="flex flex-col py-[0.5vh]">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                className="flex items-center justify-between px-[1.2vw] py-[0.8vh] hover:bg-gray-50 transition-colors group"
                                                style={{ color: primaryColor }}
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                    setLocalSearchQuery(fullQuery);
                                                    setSearchQuery(fullQuery);
                                                    setRecommendations([]);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                        <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                        {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                    </span>
                                                </div>
                                                <span className="text-[0.8vw] font-medium opacity-50 tabular-nums shrink-0">Pg {rec.pageNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Zoom Pill */}
                    <div
                        className={`flex items-center rounded-full px-[0.4vw] py-[0.5vh] ${isTablet ? 'h-[3.2vh]' : 'h-[4vh]'} shadow-sm pointer-events-auto`}
                        style={{ backgroundColor: getLayoutColor('reset-bg', '#B8BBCE') }}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                            className="hover:scale-110 ml-[0.5vw] transition-transform"
                            style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                        >
                            <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[0.8vw] h-[0.8vw]'}`} />
                        </button>
                        <span className={`font-medium ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} min-w-[3vw] text-center pt-[0.1vh]`} style={{ color: getLayoutColor('search-text-v1', primaryColor) }}>
                            {Math.round((dimWidth / initialWidth) * 100)}%
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                            className="hover:scale-110 mr-[0.5vw] transition-transform"
                            style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                        >
                            <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[0.8vw] h-[0.8vw]'}`} />
                        </button>
                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`bg-white ${isTablet ? 'text-[0.65vw] px-[0.6vw]' : 'text-[0.8vw] px-[0.8vw]'} font-bold ${isTablet ? 'h-[2.4vh]' : 'h-[3vh]'} rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm`}
                            style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Center Title */}
                <div className="flex-shrink-0 flex justify-center pointer-events-auto px-[1vw] max-w-[30vw]">
                    <h1 className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-bold tracking-wide truncate`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        {bookName || "Name of the book"}
                    </h1>
                </div>

                {/* Right Logo */}
                <div className="flex-1 flex items-center justify-end pointer-events-auto shrink-0 min-w-[10vw]">
                    {logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Logo"
                            className={`${isTablet ? 'h-[2vw]' : 'h-[2.8vw]'} w-auto transition-opacity mr-[0.5vw]`}
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>
            </div>

            {/* Left Navigate Button */}
            <button
                className={`absolute ${isTablet ? 'left-[4vw]' : 'left-[8vw]'} top-1/2 -translate-y-[calc(50%+4.5vh)] transition-all z-20 pointer-events-auto opacity-70 hover:opacity-100`}
                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
            >
                <Icon icon="lucide:chevron-left" strokeWidth={1} className={`${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.5vw] h-[2.5vw]'} hover:-translate-x-1 transition-transform`} />
            </button>

            {/* Right Navigate Button */}
            <button
                className={`absolute ${isTablet ? 'right-[4vw]' : 'right-[8vw]'} top-1/2 -translate-y-[calc(50%+4.5vh)] transition-all z-20 pointer-events-auto opacity-70 hover:opacity-100`}
                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                onClick={() => bookRef.current?.pageFlip()?.flipNext()}
            >
                <Icon icon="lucide:chevron-right" strokeWidth={1} className={`${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.5vw] h-[2.5vw]'} hover:translate-x-1 transition-transform`} />
            </button>

            {/* Main Canvas */}
            <div className="absolute inset-0 flex justify-center items-center z-10 pt-[8vh] pb-[9vh]">
                <div
                    className="transition-all duration-600 ease-in-out"
                    style={{
                        transform: `translateX(${localOffset}px) scale(1)`,
                        transformOrigin: 'center center'
                    }}
                >
                    {modifiedChildren}
                </div>
            </div>

            {/* Page Info Pill (Bottom Left) */}
            <div className={`absolute left-[3vw] ${isTablet ? 'bottom-[9vh]' : 'bottom-[12vh]'} rounded-[0.4vw] px-[1.2vw] py-[0.6vh] shadow-sm z-20 pointer-events-auto`} style={{ backgroundColor: getLayoutColor('page-number-bg', getLayoutColor('toolbar-bg', '#575C9C')) }}>
                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-medium`} style={{ color: getLayoutColor('page-number-text', getLayoutColor('toolbar-text-main', '#FFFFFF')) }}>Page </span>
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
                    className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-medium bg-transparent border-none outline-none text-center`}
                    style={{ color: getLayoutColor('page-number-text', getLayoutColor('toolbar-text-main', '#FFFFFF')), width: `${String(pages.length).length + 1}ch` }}
                />
                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-medium`} style={{ color: getLayoutColor('page-number-text', getLayoutColor('toolbar-text-main', '#FFFFFF')) }}> / {totalPages}</span>
            </div>




            {/* Bottom Menu Bar — z-40 so it sits on top of the thumbnail panel */}
            <div
                className={`fixed bottom-[2.5vh] left-0 right-0 ${isTablet ? 'h-[7.5vh]' : 'h-[9vh]'} flex flex-col justify-center items-center pt-[2vh] z-[50] pointer-events-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)]`}
                style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), paddingLeft: '18.5vw' }}
            >
                <div className="flex items-center gap-[1.6vw] mb-[0.8vh]">
                    <button onClick={(e) => { e.stopPropagation(); setShowTOCMemo(true); }} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowThumbnails(prev => !prev); }}
                        className={`hover:scale-110 transition-transform ${showThumbnails ? 'scale-110' : ''}`}
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowNotesOptions(!showNotesOptions); setShowBookmarkOptions(false); }}
                            className={`hover:scale-110 transition-transform active:scale-90 ${showNotesOptions ? 'scale-110' : ''}`}
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            title="Notes"
                        >
                            <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        {showNotesOptions && (
                            <div
                                className={`absolute left-1/2 -translate-x-[50%] bottom-[130%] ${isTablet ? 'w-[10vw]' : 'w-[12vw]'} rounded-[1.2vw] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}
                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    className="w-full flex items-center px-[1vw] py-[1vh] hover:brightness-110 transition-all gap-[0.8vw] text-left group"
                                    onClick={() => {
                                        setShowAddNotesPopupMemo(true);
                                        setShowNotesOptions(false);
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`}
                                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                    >
                                        <path d="M2.75499 14.7146L3.27199 16.6466C3.87599 18.9016 4.17899 20.0296 4.86399 20.7606C5.40464 21.3374 6.10408 21.7411 6.87399 21.9206C7.84999 22.1486 8.97799 21.8466 11.234 21.2426C13.488 20.6386 14.616 20.3366 15.347 19.6516C15.4077 19.5943 15.4663 19.5356 15.523 19.4756C15.1824 19.4449 14.8439 19.3948 14.509 19.3256C13.813 19.1876 12.986 18.9656 12.008 18.7036L11.901 18.6746L11.876 18.6686C10.812 18.3826 9.92299 18.1446 9.21299 17.8886C8.46599 17.6186 7.78799 17.2856 7.21099 16.7456C6.41731 16.002 5.86191 15.0398 5.61499 13.9806C5.43499 13.2116 5.48699 12.4576 5.62699 11.6766C5.76099 10.9276 6.00099 10.0296 6.28899 8.95463L6.82399 6.96062L6.84199 6.89062C4.92199 7.40763 3.91099 7.71362 3.23699 8.34462C2.65949 8.88568 2.25545 9.58588 2.07599 10.3566C1.84799 11.3316 2.14999 12.4596 2.75499 14.7146Z" fill="currentColor" />
                                        <path fillRule="evenodd" clipRule="evenodd" d="M11.8741 2.07599C12.85 1.84807 13.9778 2.14979 16.2335 2.7547C16.8008 2.90671 17.2972 3.03922 17.7335 3.16388C17.275 3.7184 17.0001 4.43016 17.0001 5.20587C17.0001 6.97649 18.4355 8.41192 20.2061 8.41192C20.6511 8.4119 21.0748 8.32092 21.46 8.15704C21.3339 8.82433 21.1174 9.64216 20.8301 10.7147L20.3116 12.6463C19.7066 14.9013 19.4048 16.0296 18.7198 16.7606C18.1793 17.3377 17.48 17.7419 16.71 17.9217C16.6135 17.9443 16.515 17.9614 16.4151 17.9734C15.5001 18.0864 14.3827 17.788 12.3507 17.244C10.0957 16.639 8.96738 16.3362 8.23639 15.6512C7.65932 15.1105 7.25582 14.4106 7.07624 13.6404C6.84831 12.6645 7.15003 11.5377 7.75495 9.28302L8.27155 7.3504L8.51569 6.4461C8.97069 4.78012 9.27733 3.86314 9.86432 3.23614C10.405 2.65934 11.1042 2.25553 11.8741 2.07599ZM11.1924 12.1736C11.0005 12.1225 10.7961 12.1495 10.6241 12.2488C10.452 12.3482 10.326 12.512 10.2745 12.7039C10.249 12.799 10.2431 12.8983 10.2559 12.9959C10.2687 13.0935 10.3005 13.188 10.3497 13.2733C10.3988 13.3584 10.4641 13.4331 10.5421 13.493C10.6202 13.553 10.7096 13.5973 10.8048 13.6229L13.7032 14.3983C13.7993 14.4276 13.9001 14.438 14.0001 14.4275C14.1002 14.417 14.1981 14.3865 14.2862 14.3377C14.3741 14.289 14.4509 14.2225 14.5128 14.1434C14.5747 14.0641 14.6205 13.973 14.6466 13.8758C14.6726 13.7785 14.6791 13.6767 14.6651 13.577C14.6511 13.4773 14.6174 13.381 14.5655 13.2947C14.5137 13.2086 14.4446 13.1341 14.3633 13.075C14.2819 13.0158 14.189 12.9736 14.0909 12.951L11.1924 12.1736ZM11.6778 9.25567C11.5801 9.26848 11.4858 9.30021 11.4005 9.34942C11.3153 9.39855 11.2407 9.46389 11.1807 9.54181C11.1208 9.6199 11.0764 9.70941 11.0508 9.8045C10.9995 9.99651 11.0267 10.2027 11.126 10.3748C11.2254 10.5467 11.3893 10.6719 11.5811 10.7234L16.4112 12.0174C16.5072 12.0462 16.6084 12.0555 16.7081 12.0447C16.8075 12.0339 16.9038 12.0035 16.9913 11.9549C17.079 11.9061 17.1561 11.8397 17.2178 11.7606C17.2796 11.6814 17.3246 11.5909 17.3507 11.494C17.3767 11.397 17.384 11.2955 17.3702 11.1961C17.3564 11.0968 17.3219 11.001 17.2706 10.9149C17.2192 10.8289 17.1511 10.7544 17.0704 10.6951C16.9895 10.6358 16.8975 10.5933 16.7999 10.5701L11.9698 9.27423C11.8747 9.2487 11.7754 9.24288 11.6778 9.25567Z" fill="currentColor" />
                                        <path d="M20.2062 3V6.63111M22.0217 4.81555H18.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Notes</span>
                                </button>
                                <button
                                    className="w-full flex items-center px-[1vw] py-[1vh] hover:brightness-110 transition-all gap-[0.8vw] text-left group"
                                    onClick={() => {
                                        setShowNotesViewerMemo(true);
                                        setShowNotesOptions(false);
                                    }}
                                >
                                    <Icon icon="lets-icons:view-fill" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>View Notes</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowBookmarkOptions(!showBookmarkOptions); setShowNotesOptions(false); }}
                            className={`hover:scale-110 transition-transform ${showBookmarkOptions ? 'scale-110' : ''}`}
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                        {showBookmarkOptions && (
                            <div
                                className={`absolute left-1/2 -translate-x-1/2 bottom-[130%] ${isTablet ? 'w-[10vw]' : 'w-[12vw]'} rounded-[1.2vw] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}
                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    className="w-full flex items-center px-[1vw] py-[1vh] hover:brightness-110 transition-all gap-[0.8vw] text-left group"
                                    onClick={() => {
                                        setShowAddBookmarkPopupMemo(true);
                                        setShowBookmarkOptions(false);
                                    }}
                                >
                                    <Icon icon="fluent:bookmark-add-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Bookmark</span>
                                </button>
                                <button
                                    className="w-full flex items-center px-[1vw] py-[1vh] hover:brightness-110 transition-all gap-[0.8vw] text-left group"
                                    onClick={() => {
                                        setShowViewBookmarkPopup(true);
                                        setShowBookmarkOptions(false);
                                    }}
                                >
                                    <Icon icon="lets-icons:view-fill" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>View Bookmark</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowGalleryPopupMemo(true); }} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>

                    <div className="w-[0.5vw]" />

                    <button onClick={() => onPageClick(0)} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button onClick={() => setIsPlaying(!isAutoFlipping)} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                    </button>
                    <button onClick={() => onPageClick(totalPages - 1)} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>

                    <div className="w-[0.5vw]" />

                    <button onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); }} className={`hover:scale-110 transition-transform opacity-100`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowProfilePopup(true); }} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleFullScreen(); }} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div
                    ref={progressRef}
                    className={`${isTablet ? 'w-[35vw]' : 'w-[45vw]'} h-[2vw] flex items-center relative cursor-pointer`}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={() => {
                        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                        setProgressHover(prev => ({ ...prev, visible: false }));
                    }}
                    onClick={handleProgressClick}
                >
                    <div className="w-full h-[0.5vh] rounded-full relative overflow-visible">
                        {/* Track Underlay (before fill) — matches Layout 1 shade */}
                        <div
                            className="absolute inset-0 rounded-full transition-colors duration-300"
                            style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.3 }}
                        />
                        {/* Progress Fill (after fill) — matches Layout 1 */}
                        <div
                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 pointer-events-none z-10"
                            style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), width: `${progressPercentage}%` }}
                        />

                        {/* Hover Popup - Style matches attached screenshot 1 */}
                        <AnimatePresence>
                            {progressHover.visible && progressHover.spread && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className={`absolute z-[100] bottom-[calc(100%+1.5vw)] pointer-events-none`}
                                    style={{ left: `${progressHover.x}px` }}
                                >
                                    <div
                                        className={`absolute bottom-0 flex flex-col items-center shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden`}
                                        style={{
                                            borderRadius: isTablet ? '0.6vw' : '0.8vw',
                                            transform: progressHover.pageIndex === 0 ? 'translateX(-25%)' : 'translateX(-50%)',
                                            minWidth: isTablet ? '7vw' : '9vw',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        {/* Header Bar - Dark Blue as in screenshot 1 */}
                                        <div
                                            className="w-full flex justify-center items-center py-[0.5vh] px-[1vw]"
                                            style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                                        >
                                            <span
                                                className="font-bold whitespace-nowrap text-white"
                                                style={{ fontSize: isTablet ? '0.7vw' : '0.85vw' }}
                                            >
                                                {progressHover.spread.label}
                                            </span>
                                        </div>

                                        {/* Body Area with Thumbnail */}
                                        <div className="p-[0.5vw] flex flex-col items-center">
                                            <div
                                                className="flex justify-center overflow-hidden rounded-[0.3vw] shadow-inner"
                                                style={{
                                                    width: `${(400 * (isTablet ? 50 : 70) / 566) * 2 + 1}px`,
                                                    backgroundColor: '#f3f4f6'
                                                }}
                                            >
                                                <div className="flex gap-[1px] bg-gray-100 p-[1px]">
                                                    {progressHover.spread.pages.map((page, pIdx) => {
                                                        const boxHeight = isTablet ? 50 : 70;
                                                        const scale = boxHeight / 566;
                                                        const boxWidth = 400 * scale;
                                                        return (
                                                            <div
                                                                key={`${progressHover.spread.indices[0]}-${pIdx}`}
                                                                className="bg-white overflow-hidden relative flex items-center justify-center border border-gray-100"
                                                                style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                                                            >
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={progressHover.spread.indices[pIdx]}
                                                                    scale={scale}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Downward Arrow */}
                                        <div
                                            className="absolute top-[99%] left-1/2 -translateX-1/2 pointer-events-none"
                                            style={{
                                                width: isTablet ? '1vw' : '1.3vw',
                                                height: isTablet ? '0.7vw' : '0.9vw',
                                                filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))'
                                            }}
                                        >
                                            <svg width="100%" height="100%" viewBox="0 0 20 15" preserveAspectRatio="none">
                                                <path
                                                    d="M0 0 L10 15 L20 0"
                                                    fill="white"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Thumbnail Panel — moved to end of DOM to prevent flex flow interference ── */}
            <AnimatePresence>
                {showThumbnails && (
                    <motion.div
                        key="thumb-panel"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed z-[40] rounded-t-[0.8vw] overflow-hidden"
                        style={{
                            left: '34vw',
                            right: '16vw',
                            bottom: isTablet ? '7.5vh' : '9vh',
                            backgroundColor: '#FFFFFF',
                            maxHeight: '45vh',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
                            backdropFilter: 'none',
                            opacity: 1
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-[1.5vw] py-[0.8vh] relative"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                        >
                            <span className="text-[0.9vw] font-semibold tracking-wide" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Thumbnails</span>

                            {/* Drag handle */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                                <div className="w-[3vw] h-[0.22vh] rounded-full" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.3 }} />
                            </div>

                            <button
                                onClick={() => setShowThumbnails(false)}
                                className="hover:scale-110 transition-all"
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.7 }}
                            >
                                <Icon icon="lucide:x" className="w-[1.1vw] h-[1.1vw]" />
                            </button>
                        </div>

                        {/* Scrollable thumbnail row */}
                        <div
                            ref={thumbScrollRef}
                            className="flex flex-wrap gap-[1vw] px-[1.2vw] py-[1.5vh] pb-[2vh] overflow-y-auto max-h-[35vh]"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            {pages.map((page, idx) => (
                                <div
                                    key={idx}
                                    data-thumb-index={idx}
                                    onClick={() => { onPageClick(idx); setShowThumbnails(false); }}
                                    className="flex-shrink-0 flex flex-col items-center gap-[0.5vh] cursor-pointer group"
                                >
                                    <div
                                        className="rounded-[0.3vw] overflow-hidden transition-all duration-200"
                                        style={{
                                            width: '6.5vw',
                                            height: '4.5vw',
                                            border: idx === currentPage ? `0.15vw solid ${getLayoutColor('dropdown-bg', '#575C9C')}` : '0.15vw solid transparent',
                                            boxShadow: idx === currentPage ? `0 0 0 0.15vw ${getLayoutColor('dropdown-bg', '#575C9C')}` : '0 0.2vw 0.5vw rgba(0,0,0,0.15)',
                                            padding: '0.15vw',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <div className="w-full h-full overflow-hidden bg-white rounded-[0.15vw] relative flex items-center justify-center">
                                            <PageThumbnail
                                                html={page.html || page.content || ''}
                                                index={idx}
                                                scale={0.11}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[0.65vw] font-medium transition-colors" style={{ color: getLayoutColor('dropdown-bg', '#575C9C'), opacity: idx === currentPage ? 1 : 0.6 }}>
                                        Page {idx + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Grid8Layout;
