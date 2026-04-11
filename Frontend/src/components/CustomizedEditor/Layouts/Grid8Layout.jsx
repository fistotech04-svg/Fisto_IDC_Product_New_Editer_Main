import React, { useState, useEffect, useRef } from 'react';
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
    const [showLocalBookmarkDropdown, setShowLocalBookmarkDropdown] = useState(false);
    const [showLocalNotesDropdown, setShowLocalNotesDropdown] = useState(false);
    const thumbScrollRef = useRef(null);

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

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

    const getLayoutColor = (id, defaultColor) => {
        if (!layoutColors) return `var(--${id}, ${defaultColor})`;
        
        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? colorObj.hex : `var(--${id}, ${defaultColor})`;
        }
        
        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[8] && Array.isArray(layoutColors[8])) {
            const colorObj = layoutColors[8].find(c => c.id === id);
            return colorObj ? colorObj.hex : `var(--${id}, ${defaultColor})`;
        }
        
        return `var(--${id}, ${defaultColor})`;
    };

    const getLayoutOpacity = (id, defaultOpacity) => {
        if (!layoutColors) return defaultOpacity;
        
        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? colorObj.opacity / 100 : defaultOpacity;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[8] && Array.isArray(layoutColors[8])) {
            const colorObj = layoutColors[8].find(c => c.id === id);
            return colorObj ? colorObj.opacity / 100 : defaultOpacity;
        }
        
        return defaultOpacity;
    };

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
        const color = getLayoutColor(id, null);
        if (color && color.startsWith('#')) return color;
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    return (
        <div
            className="flex flex-col h-screen w-full font-sans overflow-hidden relative"
            style={backgroundStyle}
            onClick={() => {
                setShowLocalNotesDropdown(false);
                setShowLocalBookmarkDropdown(false);
            }}
        >
            {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[80] bg-transparent" onClick={() => setShowSuggestions(false)} />}
            {/* Top Overlay Area */}
            <div className={`absolute ${isTablet ? 'top-[2vh]' : 'top-[3vh]'} left-[2vw] right-[2vw] flex justify-between items-start z-50 pointer-events-none`}>

                {/* Left: Search & Zoom */}
                <div className="flex gap-[1vw] pointer-events-auto">
                    <div className={`relative ${showSuggestions && recommendations.length > 0 ? 'z-[90]' : 'z-50'}`}>
                        <div
                            className={`flex items-center rounded-full px-[1vw] py-[0.5vh] ${isTablet ? 'h-[3.2vh]' : 'h-[4vh]'} shadow-sm transition-all duration-300 ${isSidebarOpen ? 'w-[8vw]' : (isTablet ? 'w-[8vw]' : 'w-[12vw]')}`}
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
                                                if (results.length < 6) results.push({ word, pageNumber: index + 1 });
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
                                                    setLocalSearchQuery(rec.word);
                                                    setSearchQuery(rec.word);
                                                    setRecommendations([]);
                                                }}
                                            >
                                                <span className="text-[0.85vw] font-medium opacity-90 group-hover:opacity-100">{rec.word}</span>
                                                <span className="text-[0.8vw] font-medium opacity-50 tabular-nums">Pg {rec.pageNumber}</span>
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
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                            className="hover:scale-110 ml-[0.5vw] transition-transform"
                            style={{ color: getLayoutColor('reset-text', '#FFFFFF') }}
                        >
                            <Icon icon="lucide:zoom-out" className="w-[1vw] h-[1vw]" />
                        </button>
                        <span className={`font-medium ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} min-w-[2.5vw] text-center pt-[0.1vh]`} style={{ color: getLayoutColor('reset-text', '#FFFFFF') }}>
                            {Math.round((dimWidth / initialWidth) * 100)}%
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                            className="hover:scale-110 mr-[0.5vw] transition-transform"
                            style={{ color: getLayoutColor('reset-text', '#FFFFFF') }}
                        >
                            <Icon icon="lucide:zoom-in" className="w-[1vw] h-[1vw]" />
                        </button>
                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`bg-white ${isTablet ? 'text-[0.65vw] px-[1vw]' : 'text-[0.8vw] px-[1.2vw]'} font-medium ${isTablet ? 'h-[2.4vh]' : 'h-[3vh]'} rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm`}
                            style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Center Title */}
                <div className={`${isTablet ?'left-[10vw] ' : 'left-[16vw] '} -translate-x-2 top-[0.5vh] pointer-events-auto flex justify-center w-max max-w-[20vw]`}>
                    <h1 className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-bold tracking-wide truncate`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        {bookName || "Name of the book"}
                    </h1>
                </div>

                {/* Right Logo */}
                <div className="pointer-events-auto flex items-center justify-end shrink-0 min-w-[10vw]">
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
                style={{ color: 'var(--toolbar-bg, #575C9C)' }}
                onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
            >
                <Icon icon="lucide:chevron-left" strokeWidth={1} className={`${isTablet ? 'w-[2.5vw] h-[2.5vw]' : 'w-[3.5vw] h-[3.5vw]'} hover:-translate-x-1 transition-transform`} />
            </button>

            {/* Right Navigate Button */}
            <button
                className={`absolute ${isTablet ? 'right-[4vw]' : 'right-[8vw]'} top-1/2 -translate-y-[calc(50%+4.5vh)] transition-all z-20 pointer-events-auto opacity-70 hover:opacity-100`}
                style={{ color: 'var(--toolbar-bg, #575C9C)' }}
                onClick={() => bookRef.current?.pageFlip()?.flipNext()}
            >
                <Icon icon="lucide:chevron-right" strokeWidth={1} className={`${isTablet ? 'w-[2.5vw] h-[2.5vw]' : 'w-[3.5vw] h-[3.5vw]'} hover:translate-x-1 transition-transform`} />
            </button>

            {/* Main Canvas */}
            <div className="flex-1 flex justify-center items-center w-full z-10 pt-[8vh] pb-[9vh]">
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



            {/* ── Thumbnail Panel — slides up from behind the bottom bar ── */}
            <AnimatePresence>
                {showThumbnails && (
                    <motion.div
                        key="thumb-panel"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 35 }}
                        className={`absolute z-[35] ${isTablet ? 'rounded-t-[0.6vw]' : 'rounded-t-[0.8vw]'} overflow-hidden`}
                        style={{
                            left: isTablet ? '8vw' : '10vw',
                            right: isTablet ? '6vw' : '7.5vw',
                            bottom: isTablet ? '7.5vh' : '9vh',
                            backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
                            boxShadow: '0 -6px 28px rgba(0,0,0,0.22)'
                        }}
                    >
                        {/* Header */}
                        <div
                            className={`flex items-center justify-between ${isTablet ? 'px-[1.2vw] py-[0.6vh]' : 'px-[1.5vw] py-[0.8vh]'} relative`}
                            style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                        >
                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-semibold tracking-wide`} style={{ color: getLayoutColor('toolbar-text', '#FFFFFF') }}>Thumbnails</span>

                            {/* Drag handle */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                                <div className={`${isTablet ? 'w-[2.5vw] h-[0.18vh]' : 'w-[3vw] h-[0.22vh]'} bg-white/30 rounded-full`} />
                            </div>

                            <button
                                onClick={() => setShowThumbnails(false)}
                                className="text-white/70 hover:text-white hover:scale-110 transition-all"
                            >
                                <Icon icon="lucide:x" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />
                            </button>
                        </div>

                        {/* Scrollable thumbnail row */}
                        <div
                            ref={thumbScrollRef}
                            className={`flex flex-wrap ${isTablet ? 'gap-[0.8vw] px-[1vw] py-[1.2vh] pb-[1.5vh]' : 'gap-[1vw] px-[1.2vw] py-[1.5vh] pb-[2vh]'} overflow-y-auto max-h-[35vh]`}
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                                            width: isTablet ? '4.8vw' : '6.5vw',
                                            height: isTablet ? '3.4vw' : '4.5vw',
                                            border: idx === currentPage ? `0.15vw solid ${primaryColor}` : '0.15vw solid transparent',
                                            boxShadow: idx === currentPage ? `0 0 0 0.15vw ${primaryColor}40` : '0 0.2vw 0.5vw rgba(0,0,0,0.08)',
                                            padding: '0.15vw',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <div className="w-full h-full overflow-hidden bg-gray-50 rounded-[0.15vw] relative flex items-center justify-center">
                                            <PageThumbnail
                                                html={page.html || page.content || ''}
                                                index={idx}
                                                scale={isTablet ? 0.085 : 0.11}
                                            />
                                        </div>
                                    </div>
                                    <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.65vw]'} font-medium transition-colors`} style={{ color: primaryColor, opacity: idx === currentPage ? 1 : 0.6 }}>
                                        Page {idx + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Menu Bar — z-40 so it sits on top of the thumbnail panel */}
            <div
                className={`absolute bottom-0 w-full ${isTablet ? 'h-[7.5vh]' : 'h-[9vh]'} flex flex-col justify-center items-center z-40 pointer-events-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)]`}
                style={{ backgroundColor: 'var(--toolbar-bg, #575C9C)' }}
            >
                <div className="flex items-center gap-[1.6vw] mb-[1.2vh]">
                    <button onClick={(e) => { e.stopPropagation(); setShowTOCMemo(true); }} className="hover:scale-110 transition-transform" style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}>
                        <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowThumbnails(prev => !prev); }}
                        className={`hover:scale-110 transition-transform ${showThumbnails ? 'scale-110' : 'opacity-70'}`}
                        style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}
                    >
                        <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowLocalNotesDropdown(prev => !prev);
                                setShowLocalBookmarkDropdown(false);
                            }}
                            className={`hover:scale-110 transition-transform ${showLocalNotesDropdown ? 'opacity-100 scale-110' : 'opacity-90 hover:opacity-100'}`}
                            style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}
                        >
                            <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                        <AnimatePresence>
                            {showLocalNotesDropdown && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute bottom-[2.5vw] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '9vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowLocalBookmarkDropdown(prev => !prev);
                                setShowLocalNotesDropdown(false);
                            }}
                            className={`hover:scale-110 transition-transform ${showLocalBookmarkDropdown ? 'opacity-100 scale-110' : 'opacity-90 hover:opacity-100'}`}
                            style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}
                        >
                            <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                        <AnimatePresence>
                            {showLocalBookmarkDropdown && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute bottom-[2.5vw] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '10vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                    <button onClick={(e) => { e.stopPropagation(); setShowGalleryPopupMemo(true); }} className="hover:scale-110 transition-transform" style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}>
                        <Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>

                    <div className="w-[0.5vw]" />

                    <button onClick={() => onPageClick(0)} className="hover:scale-110 transition-transform" style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}>
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button onClick={() => setIsPlaying(!isAutoFlipping)} className="hover:scale-110 transition-transform" style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}>
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                    </button>
                    <button onClick={() => onPageClick(totalPages - 1)} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>

                    <div className="w-[0.5vw]" />

                    <button onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); }} className={`hover:scale-110 transition-transform ${isMuted ? 'opacity-50' : 'opacity-100'}`} style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}>
                        <Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowProfilePopup(true); }} className="hover:scale-110 transition-transform" style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}>
                        <Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="hover:scale-110 transition-transform" style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}>
                        <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="hover:scale-110 transition-transform" style={{ color: 'var(--toolbar-text-main, #FFFFFF)' }}>
                        <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleFullScreen(); }} className="hover:scale-110 transition-transform" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className={`${isTablet ? 'w-[35vw]' : 'w-[45vw]'} h-[0.5vh] bg-white/30 rounded-full relative`}>
                    <div
                        className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300 pointer-events-none"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Grid8Layout;
