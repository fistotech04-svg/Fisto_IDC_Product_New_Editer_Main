import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePopup from '../popups/ProfilePopup';
import TableOfContentsPopup from '../popups/TableOfContentsPopup';

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
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: 400px; height: 566px; position: relative; }
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

const Grid6Layout = ({
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
    bookRef,
    pages,
    setIsPlaying,
    isAutoFlipping,
    handleDownload,
    handleShare,
    handleFullScreen,
    setShowViewBookmarkPopup,
    logoSettings,
    currentPage,
    pagesCount,
    currentZoom,
    setCurrentZoom,
    onPageClick,
    offset,
    notes,
    onAddNote,
    bookmarks,
    onAddBookmark,
    onDeleteBookmark,
    onUpdateBookmark,
    profileSettings,
    setShowNotesViewerMemo,
    setShowProfilePopup,
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

    const getLayoutColor = (id, defaultColor) => {
        if (!layoutColors) return `var(--${id}, ${defaultColor})`;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorItem = layoutColors.find(c => c.id === id);
            return colorItem ? colorItem.hex : `var(--${id}, ${defaultColor})`;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[6] && Array.isArray(layoutColors[6])) {
            const colorItem = layoutColors[6].find(c => c.id === id);
            return colorItem ? colorItem.hex : `var(--${id}, ${defaultColor})`;
        }

        return `var(--${id}, ${defaultColor})`;
    };

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
        let hex = null;
        let opacity = defaultOpacity;

        if (layoutColors) {
            let colorItem = null;
            if (Array.isArray(layoutColors)) {
                colorItem = layoutColors.find(c => c.id === id);
            } else if (layoutColors[6] && Array.isArray(layoutColors[6])) {
                colorItem = layoutColors[6].find(c => c.id === id);
            }

            if (colorItem) {
                hex = colorItem.hex;
                opacity = colorItem.opacity !== undefined ? colorItem.opacity / 100 : defaultOpacity;
            }
        }

        if (hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }

        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    const getLayoutOpacity = (id, defaultOpacity) => {
        if (!layoutColors) return defaultOpacity;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorItem = layoutColors.find(c => c.id === id);
            return colorItem ? (colorItem.opacity ?? 100) / 100 : defaultOpacity;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[6] && Array.isArray(layoutColors[6])) {
            const colorItem = layoutColors[6].find(c => c.id === id);
            return colorItem ? (colorItem.opacity ?? 100) / 100 : defaultOpacity;
        }

        return defaultOpacity;
    };

    const [showRadialThumbnails, setShowRadialThumbnails] = useState(false);
    const [showTOCPanel, setShowTOCPanel] = useState(false);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [radialScroll, setRadialScroll] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

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

    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            // Page 1 is always a single page (cover)
            result.push({
                pages: [pages[0]],
                indices: [0],
                label: "Page 1"
            });
            // Subsequent pages are spreads
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

    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    const progressRef = useRef(null);
    const progressHoverRef = useRef(null);

    const [progressHover, setProgressHover] = useState({
        visible: false,
        x: 0,
        percentage: 0,
        pageIndex: 0,
        spread: null,
        rectWidth: 0
    });

    const handleProgressClick = (e) => {
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pagesCount - 1));
        onPageClick(targetIdx);
    };

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
                percentage,
                pageIndex: targetIdx,
                spread: activeSpread,
                rectWidth: rect.width
            });
        });
    };

    const progressPercentage = pagesCount > 1 ? (currentPage / (pagesCount - 1)) * 100 : 0;

    return (
        <div
            className="flex flex-col h-screen w-full overflow-hidden font-sans select-none"
            style={backgroundStyle || { backgroundColor: '#D7D8E8' }}
            onClick={() => {
                setRecommendations([]);
                setShowRadialThumbnails(false);
                setShowTOCPanel(false);
                setTocSearchQuery('');
                setShowBookmarkOptions(false);
                setShowNotesOptions(false);
            }}
        >
            {/* Top Header */}
            <div
                className={`${isTablet ? 'h-[6vh]' : 'h-[7vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50`}
                style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), opacity: getLayoutOpacity('toolbar-bg', 1) }}
            >
                {/* Search Bar */}
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                        <div
                            className={`flex items-center rounded-[0.2vw] ${isTablet ? 'px-[0.5vw] py-[0.4vw] w-[12vw]' : 'px-[0.6vw] py-[0.5vw] w-[16vw]'} shadow-inner`}
                            style={{ backgroundColor: getLayoutColor('search-bg-v2', '#DDE0F4'), opacity: getLayoutOpacity('search-bg-v2', 1) }}
                        >
                            <Icon
                                icon="lucide:search"
                                className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`}
                                style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
                            />
                            <input
                                type="text"
                                value={localSearchQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSearchQuery(val);

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
                                    }
                                }}
                                placeholder="Quick Search..."
                                className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]'} ml-[0.6vw] w-full font-medium`}
                                style={{
                                    color: getLayoutColor('search-text-v1', '#575C9C'),
                                }}
                            />
                        </div>

                        {/* Search Suggestions Dropdown - EXACT UI FROM SCREENSHOT */}
                        <AnimatePresence>
                            {recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`absolute ${isTablet ? 'top-[2.5vw] w-[12vw]' : 'top-[3.2vw] w-[16vw]'} left-0 bg-white rounded-b-[0.4vw] shadow-2xl z-[100] border-x border-b overflow-hidden`}
                                    style={{ borderColor: getLayoutColor('search-bg-v2', '#DDE0F4') }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="px-[1vw] py-[0.8vw] border-b border-gray-50">
                                        <span className={`font-bold ${isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]'}`} style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}>Suggestion</span>
                                    </div>
                                    <div className="flex flex-col py-[0.4vw]">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                className="flex items-center justify-between px-[1vw] py-[0.6vw] transition-colors group"
                                                style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                    setLocalSearchQuery(fullQuery);
                                                    setSearchQuery(fullQuery);
                                                    setRecommendations([]);
                                                }}
                                            >
                                                <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                        <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                        {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                    </span>
                                                </div>
                                                <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-medium opacity-60 tabular-nums shrink-0`}>Pg {rec.pageNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Center: Book Name */}
                <div className={`absolute left-1/2 -translate-x-1/2 text-white ${isTablet ? 'text-[1.1vw]' : 'text-[1.4vw]'} font-normal tracking-wide opacity-90`}>
                    {bookName || "Name of the book"}
                </div>

                {/* Right: Logo */}
                <div className="flex items-center">
                    {logoSettings?.src && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowProfilePopup(true); }}
                            className="transition-opacity hover:opacity-80"
                        >
                            <img
                                src={logoSettings.src}
                                alt="Logo"
                                className={`${isTablet ? 'h-[2vw]' : 'h-[2.5vw]'} w-auto brightness-110`}
                                style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                            />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 relative min-h-0">
                <style>
                    {`
                        .thumbnail-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .thumbnail-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .thumbnail-scrollbar::-webkit-scrollbar-thumb {
                            background: #BABEE4;
                            border-radius: 10px;
                        }
                        .thumbnail-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #575C9C;
                        }
                    `}
                </style>




                {/* Left Navigation Arrows */}
                <div className="absolute left-[1.5vw] top-1/2 -translate-y-1/2 flex items-center gap-[0.5vw] z-30">
                    <button
                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                        onClick={() => onPageClick(0)}
                        title="First Page"
                    >
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                    <button
                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        title="Previous Page"
                    >
                        <Icon icon="ph:caret-left" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                </div>

                {/* Right Navigation Arrows */}
                <div className="absolute right-[5vw] top-1/2 -translate-y-1/2 flex items-center gap-[0.5vw] z-30">
                    <button
                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        title="Next Page"
                    >
                        <Icon icon="ph:caret-right" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                    <button
                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                        onClick={() => onPageClick(pagesCount - 1)}
                        title="Last Page"
                    >
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                </div>



                {/* Page Counter Badge */}
                <div
                    className={`absolute ${isTablet ? 'right-[5.5vw] bottom-[6vh] rounded-[0.4vw]' : 'right-[6.5vw] bottom-[10vh] rounded-[0.6vw]'} px-[1.2vw] py-[0.6vw] shadow-[0_0.4vw_1.5vw_rgba(0,0,0,0.1)] z-30 border`}
                    style={{
                        backgroundColor: getLayoutColor('toolbar-bg', '#FFFFFF'),
                        borderColor: getLayoutColor('toolbar-text-main', 'rgba(0,0,0,0.1)')
                    }}
                >
                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold`} style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}>Page </span>
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
                        className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold bg-transparent border-none outline-none text-center`}
                        style={{
                            width: `${String(pages.length).length + 1}ch`,
                            color: getLayoutColor('toolbar-text-main', '#575C9C')
                        }}
                    />
                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold`} style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}> / {pagesCount}</span>
                </div>

                {/* Book Viewer Container */}
                <div className={`flex-1 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-[4vw] pr-[7.5vw]'} magazine-canvas`}>
                    <div
                        className="relative transition-all duration-600 ease-in-out"
                        style={{
                            transform: `translateX(${localOffset}px) scale(1)`,
                            transformOrigin: 'center center',
                            filter: 'drop-shadow(0 2vw 5vw rgba(0,0,0,0.15))'
                        }}
                    >
                        {modifiedChildren}
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div
                className={`${isTablet ? 'h-[5vh]' : 'h-[6vh] mb-[1.5vh]'} flex items-center px-[2vw] shrink-0 w-full relative z-40 border-t`}
                style={{
                    backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C'),
                    opacity: getLayoutOpacity('bottom-toolbar-bg', 1),
                    borderColor: 'rgba(255,255,255,0.05)'
                }}
            >
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.5vw] mr-[2.5vw]">
                    <button
                        onClick={() => onPageClick && onPageClick(0)}
                        className="transition-all transform active:scale-90"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.8 }}
                    >
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button
                        onClick={() => setIsPlaying(!isAutoFlipping)}
                        className="transition-all transform active:scale-95"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => onPageClick && onPageClick(pagesCount - 1)}
                        className="transition-all transform active:scale-90"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.8 }}
                    >
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                </div>

                {/* Progress Bar Container */}
                <div
                    ref={progressRef}
                    className="flex-1 flex items-center relative h-[2vw] cursor-pointer group"
                    onClick={handleProgressClick}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={() => {
                        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                        setProgressHover(prev => ({ ...prev, visible: false }));
                    }}
                >
                    {/* Continuous Progress Track */}
                    <div className="w-full h-[0.25vw] rounded-full relative overflow-hidden">
                        {/* Track Underlay (After fill) */}
                        <div 
                            className="absolute inset-0 transition-colors duration-300" 
                            style={{ 
                                backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), 
                                opacity: isTablet ? 0.4 : 0.3 
                            }} 
                        />
                        {/* Progress Fill (Before fill) */}
                        <div
                            className="absolute top-0 left-0 h-full transition-all duration-300 ease-out z-10"
                            style={{ 
                                backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), 
                                width: `${progressPercentage}%`, 
                                opacity: isTablet ? 1 : 'var(--toolbar-icon-opacity, 1)' 
                            }}
                        ></div>
                    </div>

                    {/* Hover Popup - Matching Grid4Layout style */}
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
                                    className={`absolute bottom-0 flex flex-col items-center ${isTablet ? 'p-[0.6vw] rounded-[0.6vw]' : 'p-[0.5vw] rounded-[0.8vw]'} shadow-[0_10px_40px_rgba(0,0,0,0.3)]`}
                                    style={{
                                        backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
                                        transform: progressHover.pageIndex === 0 ? 'translateX(-25%)' : 'translateX(-50%)',
                                        minWidth: isTablet ? '7vw' : '9vw'
                                    }}
                                >
                                    <div className="w-full flex flex-col items-center px-[0.3vw]">
                                        <span
                                            className="font-bold whitespace-nowrap"
                                            style={{
                                                fontSize: isTablet ? '0.7vw' : '0.85vw',
                                                color: getLayoutColor('dropdown-text', '#575C9C')
                                            }}
                                        >
                                            {progressHover.spread.label}
                                        </span>

                                        <div
                                            className="w-full rounded-full"
                                            style={{
                                                height: isTablet ? '2px' : '2.5px',
                                                backgroundColor: getLayoutColor('dropdown-text', '#575C9C'),
                                                margin: isTablet ? '0.4vw 0' : '0.5vw 0'
                                            }}
                                        ></div>

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

                                    {/* Arrow with SVG shape from Layout 5 */}
                                    <div
                                        className="absolute top-full left-[38%] -translate-x-1/2 pointer-events-none"
                                        style={{
                                            width: isTablet ? '1vw' : '1.3vw',
                                            height: isTablet ? '1.2vw' : '1.5vw',
                                            filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))'
                                        }}
                                    >
                                        <svg width="100%" height="100%" viewBox="0 0 20 15" preserveAspectRatio="none">
                                            <path
                                                d="M0 0 L10 15 L20 0"
                                                fill={getLayoutColor('dropdown-bg', '#FFFFFF')}
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Sidebar Icons - MOVED TO ROOT FOR FULL HEIGHT */}
            <div
                className={`absolute right-0 top-0 bottom-0 ${isTablet ? 'w-[4.5vw]' : 'w-[5vw]'} flex flex-col items-center justify-start pt-[12vh] gap-[2.5vh] z-50`}
                style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), opacity: getLayoutOpacity('toolbar-bg', 1) }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowTOCPanel(!showTOCPanel);
                        setShowRadialThumbnails(false);
                    }}
                    className="transition-all transform hover:scale-110"
                    style={{
                        color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                        backgroundColor: showTOCPanel ? 'rgba(255,255,255,0.2)' : 'transparent',
                        opacity: showTOCPanel ? 1 : getLayoutOpacity('toolbar-text-main', 0.7)
                    }}
                >
                    <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowRadialThumbnails(!showRadialThumbnails);
                    }}
                    className="transition-all transform hover:scale-110"
                    style={{
                        color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                        backgroundColor: showRadialThumbnails ? 'rgba(255,255,255,0.2)' : 'transparent',
                        opacity: showRadialThumbnails ? 1 : getLayoutOpacity('toolbar-text-main', 0.7)
                    }}
                >
                    <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                </button>
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowNotesOptions(!showNotesOptions);
                            setShowBookmarkOptions(false);
                            setShowRadialThumbnails(false);
                            setShowTOCPanel(false);
                        }}
                        className="transition-all transform hover:scale-110"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            backgroundColor: 'transparent',
                            opacity: showNotesOptions ? 1 : getLayoutOpacity('toolbar-text-main', 0.7)
                        }}
                    >
                        <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                    </button>

                    {showNotesOptions && (
                        <div
                            className={`absolute right-full mr-[2.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[10vw]' : 'w-[11.5vw]'} shadow-[0px_4px_20px_rgba(0,0,0,0.3)] z-[100] animate-in fade-in slide-in-from-right-2 duration-200 py-[1vh]`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                border: '1px solid rgba(255,255,255,0.05)',
                                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.85'),
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <button
                                className="w-full flex items-center px-[1.2vw] py-[0.6vh] hover:opacity-80 transition-opacity gap-[0.6vw] text-left"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAddNotesPopupMemo(true);
                                    setShowNotesOptions(false);
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'} text-white shrink-0`}
                                >
                                    <path d="M2.75499 14.7146L3.27199 16.6466C3.87599 18.9016 4.17899 20.0296 4.86399 20.7606C5.40464 21.3374 6.10408 21.7411 6.87399 21.9206C7.84999 22.1486 8.97799 21.8466 11.234 21.2426C13.488 20.6386 14.616 20.3366 15.347 19.6516C15.4077 19.5943 15.4663 19.5356 15.523 19.4756C15.1824 19.4449 14.8439 19.3948 14.509 19.3256C13.813 19.1876 12.986 18.9656 12.008 18.7036L11.901 18.6746L11.876 18.6686C10.812 18.3826 9.92299 18.1446 9.21299 17.8886C8.46599 17.6186 7.78799 17.2856 7.21099 16.7456C6.41731 16.002 5.86191 15.0398 5.61499 13.9806C5.43499 13.2116 5.48699 12.4576 5.62699 11.6766C5.76099 10.9276 6.00099 10.0296 6.28899 8.95463L6.82399 6.96062L6.84199 6.89062C4.92199 7.40763 3.91099 7.71362 3.23699 8.34462C2.65949 8.88568 2.25545 9.58588 2.07599 10.3566C1.84799 11.3316 2.14999 12.4596 2.75499 14.7146Z" fill="currentColor" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M11.8741 2.07599C12.85 1.84807 13.9778 2.14979 16.2335 2.7547C16.8008 2.90671 17.2972 3.03922 17.7335 3.16388C17.275 3.7184 17.0001 4.43016 17.0001 5.20587C17.0001 6.97649 18.4355 8.41192 20.2061 8.41192C20.6511 8.4119 21.0748 8.32092 21.46 8.15704C21.3339 8.82433 21.1174 9.64216 20.8301 10.7147L20.3116 12.6463C19.7066 14.9013 19.4048 16.0296 18.7198 16.7606C18.1793 17.3377 17.48 17.7419 16.71 17.9217C16.6135 17.9443 16.515 17.9614 16.4151 17.9734C15.5001 18.0864 14.3827 17.788 12.3507 17.244C10.0957 16.639 8.96738 16.3362 8.23639 15.6512C7.65932 15.1105 7.25582 14.4106 7.07624 13.6404C6.84831 12.6645 7.15003 11.5377 7.75495 9.28302L8.27155 7.3504L8.51569 6.4461C8.97069 4.78012 9.27733 3.86314 9.86432 3.23614C10.405 2.65934 11.1042 2.25553 11.8741 2.07599ZM11.1924 12.1736C11.0005 12.1225 10.7961 12.1495 10.6241 12.2488C10.452 12.3482 10.326 12.512 10.2745 12.7039C10.249 12.799 10.2431 12.8983 10.2559 12.9959C10.2687 13.0935 10.3005 13.188 10.3497 13.2733C10.3988 13.3584 10.4641 13.4331 10.5421 13.493C10.6202 13.553 10.7096 13.5973 10.8048 13.6229L13.7032 14.3983C13.7993 14.4276 13.9001 14.438 14.0001 14.4275C14.1002 14.417 14.1981 14.3865 14.2862 14.3377C14.3741 14.289 14.4509 14.2225 14.5128 14.1434C14.5747 14.0641 14.6205 13.973 14.6466 13.8758C14.6726 13.7785 14.6791 13.6767 14.6651 13.577C14.6511 13.4773 14.6174 13.381 14.5655 13.2947C14.5137 13.2086 14.4446 13.1341 14.3633 13.075C14.2819 13.0158 14.189 12.9736 14.0909 12.951L11.1924 12.1736ZM11.6778 9.25567C11.5801 9.26848 11.4858 9.30021 11.4005 9.34942C11.3153 9.39855 11.2407 9.46389 11.1807 9.54181C11.1208 9.6199 11.0764 9.70941 11.0508 9.8045C10.9995 9.99651 11.0267 10.2027 11.126 10.3748C11.2254 10.5467 11.3893 10.6719 11.5811 10.7234L16.4112 12.0174C16.5072 12.0462 16.6084 12.0555 16.7081 12.0447C16.8075 12.0339 16.9038 12.0035 16.9913 11.9549C17.079 11.9061 17.1561 11.8397 17.2178 11.7606C17.2796 11.6814 17.3246 11.5909 17.3507 11.494C17.394 11.397 17.384 11.2955 17.3702 11.1961C17.3564 11.0968 17.3219 11.001 17.2706 10.9149C17.2192 10.8289 17.1511 10.7544 17.0704 10.6951C16.9895 10.6358 16.8975 10.5933 16.7999 10.5701L11.9698 9.27423C11.8747 9.2487 11.7754 9.24288 11.6778 9.25567Z" fill="currentColor" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                    <path d="M20.2062 3V6.63111M22.0217 4.81555H18.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                </svg>
                                <span className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-normal tracking-wide`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Notes</span>
                            </button>
                            <button
                                className="w-full flex items-center px-[1.2vw] py-[0.6vh] hover:opacity-80 transition-opacity gap-[0.6vw] text-left mt-[0.5vh]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowNotesViewerMemo(true);
                                    setShowNotesOptions(false);
                                }}
                            >
                                <Icon icon="lets-icons:view-fill" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'} shrink-0`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                <span className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-normal tracking-wide`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>View Notes</span>
                            </button>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowBookmarkOptions(!showBookmarkOptions);
                            setShowNotesOptions(false);
                            setShowRadialThumbnails(false);
                            setShowTOCPanel(false);
                        }}
                        className="transition-all transform hover:scale-110"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            backgroundColor: 'transparent',
                            opacity: showBookmarkOptions ? 1 : getLayoutOpacity('toolbar-text-main', 0.7)
                        }}
                    >
                        <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                    </button>

                    {showBookmarkOptions && (
                        <div
                            className={`absolute right-full mr-[2.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[11vw]' : 'w-[13.5vw]'} shadow-[0px_4px_20px_rgba(0,0,0,0.3)] z-[100] animate-in fade-in slide-in-from-right-2 duration-200 py-[1vh]`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                border: '1px solid rgba(255,255,255,0.05)',
                                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.85'),
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <button
                                className="w-full flex items-center px-[1.2vw] py-[0.6vh] hover:opacity-80 transition-opacity gap-[0.6vw] text-left"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAddBookmarkPopupMemo(true);
                                    setShowBookmarkOptions(false);
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'} text-white shrink-0`}
                                >
                                    <path d="M15.2354 2C15.084 2.37237 15 2.77935 15 3.20605C15 4.97672 16.4354 6.41209 18.2061 6.41211C18.8707 6.41211 19.488 6.20962 20 5.86328V21.0283C19.9998 22.2481 18.6198 22.958 17.6279 22.249L12 18.2285L6.37207 22.249C5.37915 22.959 4.00022 22.2491 4 21.0293V5C4 4.20435 4.3163 3.44152 4.87891 2.87891C5.44152 2.3163 6.20435 2 7 2H15.2354Z" fill="currentColor" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                    <path d="M18.2062 1V4.63111M20.0217 2.81555H16.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                </svg>
                                <span className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-normal tracking-wide`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Bookmark</span>
                            </button>
                            <button
                                className="w-full flex items-center px-[1.2vw] py-[0.6vh] hover:opacity-80 transition-opacity gap-[0.6vw] text-left mt-[0.5vh]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowViewBookmarkPopup(true);
                                    setShowBookmarkOptions(false);
                                }}
                            >
                                <Icon icon="lets-icons:view-fill" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'} shrink-0`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                <span className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-normal tracking-wide`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>View Bookmark</span>
                            </button>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowGalleryPopupMemo(true)}
                    className="transition-all transform hover:scale-110"
                    style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                >
                    <Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo(true); }}
                    className={`transition-all transform hover:scale-110`}
                    style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showSoundPopup ? 1 : getLayoutOpacity('toolbar-text-main', 0.7) }}
                >
                    <Icon icon={isMuted ? "solar:music-notes-bold" : "solar:music-notes-bold"} className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowProfilePopup(true); }}
                    className="transition-all transform hover:scale-110"
                    style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                >
                    <Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                </button>
                <button
                    onClick={handleShare}
                    className="transition-all transform hover:scale-110"
                    style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                >
                    <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                </button>
                <button
                    onClick={handleDownload}
                    className="transition-all transform hover:scale-110"
                    style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                >
                    <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                </button>
                <button
                    onClick={handleFullScreen}
                    className="transition-all transform hover:scale-110"
                    style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                >
                    <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                </button>
            </div>

            {/* Thumbnail Bar Panel - MOVED TO ROOT FOR FULL HEIGHT */}
            <AnimatePresence>
                {showRadialThumbnails && (
                    <div
                        className={`absolute ${isTablet ? 'right-[4.5vw] top-[6vh] bottom-[5vh] w-[11vw]' : 'right-[5vw] top-[7vh] bottom-[7.5vh] w-[17.5vw]'} z-[60] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)]`}
                        style={{
                            backgroundColor: getLayoutColor('thumbnail-outer-v2', '#FFFFFF'),
                            opacity: getLayoutOpacity('thumbnail-outer-v2', 1)
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className={`${isTablet ? 'h-[6vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b`}
                            style={{ borderColor: 'rgba(0,0,0,0.05)' }}
                        >
                            <span className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.25vw]'} font-medium font-sans`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Thumbnail</span>
                            <button
                                onClick={() => setShowRadialThumbnails(false)}
                                className="transition-colors"
                                style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.6 }}
                            >
                                <Icon icon="lucide:x" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                        </div>

                        {/* Content - Scrollable list of thumbnails */}
                        <div className="flex-1 overflow-y-auto thumbnail-scrollbar py-[2vh] px-[1vw] flex flex-col gap-[3vh]">
                            {spreads.map((spread, idx) => {
                                const isSelected = spread.indices.includes(currentPage);
                                return (
                                    <div
                                        key={idx}
                                        className="flex flex-col items-center cursor-pointer group"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPageClick(spread.indices[0]);
                                            setShowRadialThumbnails(false);
                                        }}
                                    >
                                        <div
                                            className={`
                                                    relative flex p-[0.25vw] rounded-[0.2vw] shadow-[0_4px_12px_rgba(0,0,0,0.08)] 
                                                    border group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300
                                                    ${isSelected ? 'ring-2 ring-offset-2' : ''}
                                                `}
                                            style={{
                                                backgroundColor: getLayoutColor('thumbnail-inner-v2', '#FFFFFF'),
                                                borderColor: isSelected ? getLayoutColor('toolbar-bg', '#575C9C') : 'rgba(0,0,0,0.1)',
                                                '--tw-ring-color': getLayoutColor('toolbar-bg', '#575C9C')
                                            }}
                                        >
                                            <div className={`flex bg-gray-50/30 ${isTablet ? 'w-[7vw]' : 'w-[9vw]'} justify-center`}>
                                                {spread.pages.map((page, pIdx) => (
                                                    <div
                                                        key={pIdx}
                                                        className={`
                                                                ${isTablet ? 'w-[3.5vw] h-[5vw]' : 'w-[4.5vw] h-[6.3vw]'} bg-white overflow-hidden relative
                                                                ${pIdx === 0 && spread.pages.length > 1 ? 'border-r border-gray-100' : ''}
                                                            `}
                                                    >
                                                        <PageThumbnail
                                                            html={page.html || page.content}
                                                            index={spread.indices[pIdx]}
                                                            scale={isTablet ? 0.08 : 0.12}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <span
                                            className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} mt-[1.2vh] font-normal tracking-wide opacity-80 group-hover:opacity-100 transition-opacity`}
                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                        >
                                            {spread.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Table of Contents Panel - MOVED TO ROOT FOR FULL HEIGHT */}
            <AnimatePresence>
                {showTOCPanel && (
                    <div
                        className={`absolute ${isTablet ? 'right-[4.5vw] top-[6vh] bottom-[5vh]' : 'right-[5vw] top-[7vh] bottom-[7.5vh]'} w-[17.5vw] z-[60] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)]`}
                        style={{
                            backgroundColor: getLayoutColor('toc-bg', '#FFFFFF'),
                            opacity: getLayoutOpacity('toc-bg', 1)
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className={`${isTablet ? 'h-[6vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b shrink-0`}
                            style={{ borderColor: 'rgba(0,0,0,0.05)' }}
                        >
                            <span className={`${isTablet ? 'text-[0.85vw]' : 'text-[1.1vw]'} font-medium font-sans`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</span>
                            <button
                                onClick={() => setShowTOCPanel(false)}
                                className="transition-colors"
                                style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.6 }}
                            >
                                <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                            </button>
                        </div>

                        {/* Search Area */}
                        {settings.tocSettings?.addSearch !== false && (
                            <div className="px-[1vw] py-[1.5vh] border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <div
                                    className="flex items-center rounded-[0.4vw] px-[0.6vw] py-[0.4vw] border group transition-all"
                                    style={{
                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                        borderColor: 'rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <Icon icon="lucide:search" className="w-[0.9vw] h-[0.9vw]" style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.5 }} />
                                    <input
                                        type="text"
                                        value={tocSearchQuery}
                                        onChange={(e) => setTocSearchQuery(e.target.value)}
                                        placeholder="Search in TOC..."
                                        className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} ml-[0.4vw] w-full font-sans`}
                                        style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {tocSearchQuery && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTocSearchQuery(''); }}
                                            className="transition-colors"
                                            style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.4 }}
                                        >
                                            <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Content - Dynamic TOC items from settings */}
                        <div className="flex-1 overflow-y-auto thumbnail-scrollbar py-[1.5vh] px-[1vw]">
                            <div className="flex flex-col">
                                {settings.tocSettings?.content && settings.tocSettings.content.length > 0 ? (
                                    settings.tocSettings.content
                                        .filter(heading => {
                                            if (!tocSearchQuery) return true;
                                            const matchesHeading = heading.title.toLowerCase().includes(tocSearchQuery.toLowerCase());
                                            const matchesSubheading = heading.subheadings?.some(sub =>
                                                sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                            );
                                            return matchesHeading || matchesSubheading;
                                        })
                                        .map((heading, hIdx) => {
                                            const filteredSubheadings = heading.subheadings?.filter(sub =>
                                                !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                            ) || [];

                                            return (
                                                <div key={heading.id || hIdx} className={`${hIdx > 0 ? 'mt-[1.2vh]' : ''}`}>
                                                    <div
                                                        className="flex items-center justify-between py-[0.6vh] rounded-[0.3vw] cursor-pointer transition-colors px-[0.5vw] group"
                                                        style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                        onClick={() => {
                                                            onPageClick && onPageClick(heading.page - 1);
                                                            setShowTOCPanel(false);
                                                            setTocSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw]">
                                                            {settings.tocSettings?.addSerialNumberToHeading !== false && (
                                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold opacity-40 tabular-nums shrink-0`}>{hIdx + 1}.</span>
                                                            )}
                                                            <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-semibold opacity-90 truncate`}>{heading.title}</span>
                                                        </div>
                                                        {settings.tocSettings?.addPageNumber !== false && heading.page && (
                                                            <span className="text-[0.8vw] font-medium opacity-50 tabular-nums ml-[0.3vw]">
                                                                {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col ml-[0.5vw]">
                                                        {filteredSubheadings.map((sub, sIdx) => (
                                                            <div
                                                                key={sub.id || sIdx}
                                                                className="flex items-center justify-between py-[0.5vh] rounded-[0.3vw] cursor-pointer transition-colors px-[0.5vw] group"
                                                                style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                                onClick={() => {
                                                                    onPageClick && onPageClick(sub.page - 1);
                                                                    setShowTOCPanel(false);
                                                                    setTocSearchQuery('');
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw] pl-[0.5vw]">
                                                                    {settings.tocSettings?.addSerialNumberToSubheading !== false && (
                                                                        <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-medium opacity-40 tabular-nums shrink-0`}>{hIdx + 1}.{sIdx + 1}</span>
                                                                    )}
                                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-normal opacity-70 group-hover:opacity-100 truncate`}>{sub.title}</span>
                                                                </div>
                                                                {settings.tocSettings?.addPageNumber !== false && sub.page && (
                                                                    <span className="text-[0.75vw] font-normal opacity-40 tabular-nums ml-[0.2vw]">
                                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                ) : (
                                    <div
                                        className="text-[0.85vw] text-center pt-[10vw] opacity-60 font-medium"
                                        style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                    >
                                        No Table Of Content Found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Popups handled by PreviewArea */}

        </div>
    );
};

export default Grid6Layout;
