import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

const SidebarMagneticBtn = ({ iconEl, label, displayLabel, onClick, extraStyle = {}, mousePos, isTablet, addTextBelowIcons = false, textFont }) => {
    const btnRef = React.useRef(null);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const rawScale = useMotionValue(1);
    const scale = useSpring(rawScale, { stiffness: 380, damping: 26, mass: 0.5 });
    const rawGlow = useMotionValue(0);
    const glowOp = useSpring(rawGlow, { stiffness: 380, damping: 26, mass: 0.5 });
    const glowBg = useTransform(glowOp, v => `rgba(255,255,255,${v * 0.12})`);

    React.useEffect(() => {
        if (!mousePos || !btnRef.current) {
            rawScale.set(1);
            rawGlow.set(0);
            setShowTooltip(false);
            return;
        }
        const rect = btnRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(mousePos.x - cx, mousePos.y - cy);
        const isInside = mousePos.x >= rect.left && mousePos.x <= rect.right &&
            mousePos.y >= rect.top && mousePos.y <= rect.bottom;
        setShowTooltip(isInside);
        const maxDist = 52;
        const t = Math.max(0, 1 - dist / maxDist);
        const eased = t * t * (3 - 2 * t);
        const focused = eased * eased;
        rawScale.set(1 + 0.28 * focused);
        rawGlow.set(focused);
    }, [mousePos]);

    return (
        <button
            ref={btnRef}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="relative flex flex-col items-center justify-center"
            style={{ ...extraStyle, fontFamily: textFont, border: 'none', outline: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }}
            onClick={(e) => { setShowTooltip(false); if (onClick) onClick(e); }}
        >
            <motion.div
                style={{ scale, transformOrigin: 'center center', willChange: 'transform' }}
                className="flex flex-col items-center justify-center"
                whileTap={{ scale: 0.88 }}
            >
                <motion.span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.35vw', padding: '0.25vw', background: glowBg }}>
                    {iconEl}
                </motion.span>
                {addTextBelowIcons && (
                    <span
                        className={`${isTablet ? 'text-[0.28vw]' : 'text-[0.45vw]'} font-medium mt-[0.15vw] leading-snug text-center`}
                        style={{ color: extraStyle?.color || '#FFFFFF', fontFamily: textFont, opacity: extraStyle?.opacity || 1 }}
                    >{displayLabel ?? label}</span>
                )}
            </motion.div>

            {/* Tooltip — hidden when label is already shown below icon */}
            {showTooltip && !addTextBelowIcons && (
                <div
                    className="absolute right-[calc(100%+1.3vw)] top-1/2 -translate-y-1/2 whitespace-nowrap"
                    style={{
                        background: 'rgba(10, 10, 12, 0.55)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        transform: 'translateZ(0)',
                        isolation: 'isolate',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        padding: '0.25vw 0.5vw',
                        borderRadius: '0.3vw',
                        fontSize: isTablet ? '0.55vw' : '0.65vw',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                        pointerEvents: 'none',
                        zIndex: 1000
                    }}
                >
                    {label}
                    <div
                        className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-solid border-t-transparent border-b-transparent border-t-[0.35vw] border-b-[0.35vw] border-l-[0.45vw]"
                        style={{ borderLeftColor: '#4a4c52' }}
                    />
                </div>
            )}
        </button>
    );
};

const Grid6Layout = ({
    children,
    settings,
    bookName,
    searchQuery,
    setSearchQuery,
    handleSearchQuick,
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
    showGalleryPopup,
    showSharePopup,
    showExportPopup,
    showSoundPopup,
    setShowSoundPopupMemo,
    layoutColors,
    showTOC,
    isTablet,
    isFullscreen: isFullscreenProp
}) => {
    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isTablet ? initialWidth * 0.9 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isTablet ? initialHeight * 0.9 : initialHeight);
    const aspectRatio = initialHeight / initialWidth;
    const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));

    // Reset dimensions to default when tablet mode changes or initial props change
    React.useEffect(() => {
        setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
        setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
    }, [isTablet, initialWidth, initialHeight]);

    const zoomIn = () => {
        setDimWidth(prev => {
            const nextWidth = Math.min(prev + (initialWidth * 0.01), initialWidth * 1.3);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    };

    const zoomOut = () => {
        setDimWidth(prev => {
            const nextWidth = Math.max(prev - (initialWidth * 0.01), initialWidth * 0.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    };

    const localOffset = React.useMemo(() => {
        if (offset === 0) return 0; // Use offset prop to respect single page mode
        // Shift left to center the front cover, shift right to center the back cover
        if (currentPage === 0) {
            return -(dimWidth / 2);
        } else if (currentPage >= pages.length - 1) {
            return (currentPage % 2 === 0) ? -(dimWidth / 2) : (dimWidth / 2);
        }
        return 0;
    }, [currentPage, pages.length, dimWidth, offset]);

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
    const [sidebarMousePos, setSidebarMousePos] = useState(null);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [radialScroll, setRadialScroll] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const isFullscreen = isFullscreenProp || false;
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);

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
            className="flex flex-col h-full w-full overflow-hidden font-sans select-none"
            style={backgroundStyle || { backgroundColor: '#D7D8E8' }}
            onClick={() => {
                setRecommendations([]);
                setShowRadialThumbnails(false);
                setShowTOCMemo?.(false);
                setTocSearchQuery('');
            }}
        >
            {/* Top Header */}
            <div
                className={`${isTablet ? 'h-[6vh]' : (isFullscreen ? 'h-[7vh]' : 'h-[6vh]')} flex items-center justify-between pl-[1.5vw] ${isTablet ? 'pr-[4.5vw]' : (isFullscreen ? 'pr-[6vw]' : 'pr-[4.5vw]')} shrink-0 w-full z-[100] transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'pointer-events-auto' : 'pointer-events-none'}` : 'relative'}`}
                style={{
                    backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'),
                    opacity: isFullscreen && isCanvasHovered ? 0 : getLayoutOpacity('toolbar-bg', 1)
                }}
            >
                {/* Search Bar */}
                {settings?.interaction?.search && !isPdfProject ? (
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
                ) : <div className="flex items-center" />}

                {/* Center: Book Name */}
                <div className={`absolute left-1/2 -translate-x-1/2 text-white ${isTablet ? 'text-[0.85vw]' : 'text-[1.0vw]'} font-normal tracking-wide opacity-90`}>
                    {bookName || "Name of the book"}
                </div>

                {/* Right: Logo */}
                <div className="flex items-center">
                    {(settings?.brandingProfile?.logo !== false) && logoSettings?.src && (
                        logoSettings.url ? (
                            <a 
                                href={logoSettings.url.startsWith('http') ? logoSettings.url : `https://${logoSettings.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-opacity hover:opacity-80"
                            >
                                <img
                                    src={logoSettings.src}
                                    alt="Logo"
                                    className={`${isTablet ? 'h-[2vw]' : 'h-[2.5vw]'} w-auto brightness-110`}
                                    style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                                />
                            </a>
                        ) : (
                            <button className="transition-opacity hover:opacity-80 cursor-default">
                                <img
                                    src={logoSettings.src}
                                    alt="Logo"
                                    className={`${isTablet ? 'h-[2vw]' : 'h-[2.5vw]'} w-auto brightness-110`}
                                    style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                                />
                            </button>
                        )
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




                {(() => {
                    const scaledPage = dimWidth * currentZoom;
                    const shift = localOffset * currentZoom;
                    
                    let leftBound, rightBound;
                    
                    if (currentPage === 0) {
                        leftBound = shift;
                        rightBound = shift + scaledPage;
                    } else if (currentPage >= pages.length - 1 && currentPage % 2 === 0) {
                        leftBound = shift - scaledPage;
                        rightBound = shift;
                    } else {
                        leftBound = shift - scaledPage;
                        rightBound = shift + scaledPage;
                    }

                    return (
                        <>
                            {/* Left Navigation Arrows */}
                            {(settings?.navigation?.nextPrevButtons ?? true) && (
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-full flex items-center z-30 transition-all duration-500 ease-out"
                                    style={{ left: `calc(50% + ${leftBound}px - ${isTablet ? '3.5vw' : '5.5vw'})` }}
                                >
                                    <button
                                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                                        title="Previous Page"
                                    >
                                        <Icon icon="ph:caret-left" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                                    </button>
                                </div>
                            )}

                            {/* Right Navigation Arrows */}
                            {(settings?.navigation?.nextPrevButtons ?? true) && (
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 flex items-center z-30 transition-all duration-500 ease-out"
                                    style={{ left: `calc(50% + ${rightBound}px + ${isTablet ? '1.5vw' : '1.5vw'})` }}
                                >
                                    <button
                                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                                        title="Next Page"
                                    >
                                        <Icon icon="ph:caret-right" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                                    </button>
                                </div>
                            )}
                        </>
                    );
                })()}



                {/* Page Counter Badge */}
                {(settings?.navigation?.pageQuickAccess ?? true) && (
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
                )}

                {/* Book Viewer Container */}
                <div className={`flex-1 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-[4vw] pr-[7.5vw]'} magazine-canvas`}
                    onMouseMove={(e) => {
                        if (!isFullscreen) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const EDGE_ZONE = 72;
                        // Near edge: left edge, top edge, bottom edge, right edge
                        const nearEdge = x < EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE || x > rect.width - EDGE_ZONE;
                        setIsCanvasHovered(!nearEdge);
                    }}
                    onMouseLeave={() => isFullscreen && setIsCanvasHovered(false)}
                >
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
                className={`${isTablet ? 'h-[5vh]' : (isFullscreen ? 'h-[7vh]' : 'h-[6vh]')} flex items-center px-[1vw] shrink-0 w-full z-[100] border-t transition-all duration-500 ease-in-out ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'pointer-events-auto' : 'pointer-events-none'}` : 'relative'}`}
                style={{
                    backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C'),
                    opacity: isFullscreen && isCanvasHovered ? 0 : getLayoutOpacity('bottom-toolbar-bg', 1),
                    borderColor: 'rgba(255,255,255,0.05)'
                }}
            >
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.5vw] mr-[1vw]">
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <button
                            onClick={() => onPageClick && onPageClick(0)}
                            className="transition-all transform active:scale-90"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.8 }}
                        >
                            <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                    )}
                    {(settings?.media?.autoFlip ?? true) && (
                        <button
                            onClick={() => setIsPlaying(!isAutoFlipping)}
                            className="transition-all transform active:scale-95"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                    )}
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <button
                            onClick={() => onPageClick && onPageClick(pagesCount - 1)}
                            className="transition-all transform active:scale-90"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.8 }}
                        >
                            <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                    )}
                </div>

                {/* Progress Bar Container */}
                <div
                    ref={progressRef}
                    className="flex-1 flex items-center relative h-[2vw] cursor-pointer group mr-[8vw]"
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

                {/* Right: Zoom Pill */}
                {(settings?.viewing?.zoom ?? true) && (
                    <div className={`flex items-center ${isTablet ? 'mr-[4vw]' : 'mr-[5vw]'}`}>
                        <div className={`flex items-center rounded-[0.5vw] ${isTablet ? 'p-[0.2vw] pl-[0.5vw] gap-[0.6vw]' : 'p-[0.3vw] pl-[0.8vw] gap-[1vw]'} border shadow-sm`}
                            style={{
                                backgroundColor: getLayoutColor('search-bg-v2', '#DDE0F4'),
                                borderColor: getLayoutColorRgba('search-text-v1', '87, 92, 156', '0.1')
                            }}
                        >
                            <div className={`flex items-center ${isTablet ? 'gap-[0.4vw]' : 'gap-[0.8vw]'}`}>
                                <button onClick={(e) => { e.stopPropagation(); zoomOut(); }} className="hover:scale-110" style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}>
                                    <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.8vw]' : 'w-[0.9vw]'} ${isTablet ? 'h-[0.8vw]' : 'h-[0.9vw]'}`} />
                                </button>
                                <span className={`font-bold ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} tabular-nums min-w-[2.5vw] text-center`} style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}>
                                    {Math.round((dimWidth / initialWidth) * 100)}%
                                </span>
                                <button onClick={(e) => { e.stopPropagation(); zoomIn(); }} className="hover:scale-110" style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}>
                                    <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.8vw]' : 'w-[0.9vw]'} ${isTablet ? 'h-[0.8vw]' : 'h-[0.9vw]'}`} />
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                    setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                }}
                                className={`${isTablet ? 'text-[0.65vw] px-[0.6vw] py-[0.25vw]' : 'text-[0.8vw] px-[0.8vw] py-[0.35vw]'} rounded-[0.4vw] font-bold active:scale-95 transition-all shadow-sm`}
                                style={{ backgroundColor: getLayoutColor('search-bg-v2', '#DDE0F4'), color: getLayoutColor('search-text-v1', '#575C9C'), filter: 'brightness(0.95)' }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar Icons - MOVED TO ROOT FOR FULL HEIGHT */}
            {(() => {
                const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
                const textFont = settings?.toolbar?.textProperties?.font || 'inherit';
                const sidebarBtnProps = { mousePos: sidebarMousePos, isTablet, addTextBelowIcons, textFont };
                return (
            <div
                onMouseMove={(e) => setSidebarMousePos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setSidebarMousePos(null)}
                className={`absolute right-0 top-0 bottom-0 ${isTablet ? 'w-[3.5vw]' : (isFullscreen ? 'w-[5vw]' : 'w-[3.5vw]')} flex flex-col items-center ${addTextBelowIcons ? 'justify-start pt-[12vh] gap-[2.5vh]' : 'justify-evenly py-[6vh]'} z-[100] transition-all duration-500 ease-in-out ${isFullscreen ? (!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') : 'opacity-100 pointer-events-auto'}`}
                style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}
            >
                {(()  => {
                    const closeOtherPopups = (current) => {
                        if (current !== 'TOC') setShowTOCMemo?.(false);
                        if (current !== 'Thumbnails') setShowRadialThumbnails(false);
                        if (current !== 'Gallery') setShowGalleryPopupMemo?.(false);
                        if (current !== 'Sound') setShowSoundPopupMemo?.(false);
                        if (current !== 'Profile') setShowProfilePopup?.(false);
                    };
                    return (
                        <>
                            {(settings?.navigation?.tableOfContents ?? true) && (
                                <SidebarMagneticBtn
                                    {...sidebarBtnProps}
                                    label="Table of Contents"
                                    displayLabel={<><span style={{ display: 'block' }}>Table of</span><span style={{ display: 'block' }}>Contents</span></>}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeOtherPopups('TOC');
                                        setShowTOCMemo?.(!showTOC);
                                    }}
                                    extraStyle={{ color: '#FFFFFF', backgroundColor: showTOC ? 'rgba(255,255,255,0.2)' : 'transparent' }}
                                    iconEl={<Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[0.95vw] h-[0.95vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                />
                            )}
                            {(settings?.navigation?.pageThumbnails ?? true) && (
                                <SidebarMagneticBtn
                                    {...sidebarBtnProps}
                                    label="Thumbnails"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeOtherPopups('Thumbnails');
                                        setShowRadialThumbnails(!showRadialThumbnails);
                                    }}
                                    extraStyle={{ color: '#FFFFFF', backgroundColor: showRadialThumbnails ? 'rgba(255,255,255,0.2)' : 'transparent' }}
                                    iconEl={<Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[0.95vw] h-[0.95vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                />
                            )}
                            {(settings?.interaction?.gallery ?? true) && (
                                <SidebarMagneticBtn
                                    {...sidebarBtnProps}
                                    label="Gallery"
                                    onClick={(e) => {
                                        closeOtherPopups('Gallery');
                                        setShowGalleryPopupMemo?.(true);
                                    }}
                                    extraStyle={{ color: '#FFFFFF' }}
                                    iconEl={<Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[0.95vw] h-[0.95vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                />
                            )}
                            {(settings?.media?.backgroundAudio ?? true) && (
                                <SidebarMagneticBtn
                                    {...sidebarBtnProps}
                                    label="Sound"
                                    onClick={(e) => { 
                                        closeOtherPopups('Sound');
                                        setShowSoundPopupMemo?.(!showSoundPopup); 
                                    }}
                                    extraStyle={{ color: '#FFFFFF' }}
                                    iconEl={<Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[0.95vw] h-[0.95vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                />
                            )}
                            {(settings?.brandingProfile?.profile ?? true) && (
                                <SidebarMagneticBtn
                                    {...sidebarBtnProps}
                                    label="Profile"
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        closeOtherPopups('Profile');
                                        setShowProfilePopup?.(true); 
                                    }}
                                    extraStyle={{ color: '#FFFFFF' }}
                                    iconEl={<Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[0.95vw] h-[0.95vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                />
                            )}
                            {(settings?.shareExport?.share ?? true) && (
                                <SidebarMagneticBtn
                                    {...sidebarBtnProps}
                                    label="Share"
                                    onClick={(e) => {
                                        closeOtherPopups('Share');
                                        if (handleShare) handleShare(e);
                                    }}
                                    extraStyle={{ color: '#FFFFFF' }}
                                    iconEl={<Icon icon="mage:share-fill" className={`${isTablet ? 'w-[0.95vw] h-[0.95vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                />
                            )}
                            {(settings?.shareExport?.download ?? true) && (
                                <SidebarMagneticBtn
                                    {...sidebarBtnProps}
                                    label="Download"
                                    onClick={(e) => {
                                        closeOtherPopups('Download');
                                        if (handleDownload) handleDownload(e);
                                    }}
                                    extraStyle={{ color: '#FFFFFF' }}
                                    iconEl={<Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[0.95vw] h-[0.95vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                                />
                            )}
                            {(settings?.viewing?.fullScreen ?? true) && <SidebarMagneticBtn
                                {...sidebarBtnProps}
                                label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                onClick={handleFullScreen}
                                extraStyle={{ color: '#FFFFFF' }}
                                iconEl={<Icon icon={isFullscreen ? 'mingcute:fullscreen-exit-fill' : 'lucide:fullscreen'} className={`${isTablet ? 'w-[0.95vw] h-[0.95vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />}
                            />}
                        </>
                    );
                })()}
            </div>
                );
            })()}

            {/* Thumbnail Bar Panel - MOVED TO ROOT FOR FULL HEIGHT */}
            <AnimatePresence>
                {showRadialThumbnails && (
                    <div
                        className={`absolute ${isTablet ? 'right-[4.5vw] top-[6vh] bottom-[5vh] w-[11vw]' : (isFullscreen ? 'right-[5vw] top-[7vh] bottom-[7vh] w-[17.5vw]' : 'right-[3.5vw] top-[6vh] bottom-[6vh] w-[17.5vw]')} z-[60] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)]`}
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
                {showTOC && (
                    <div
                        className={`absolute ${isTablet ? 'right-[4.5vw] top-[6vh] bottom-[5vh]' : (isFullscreen ? 'right-[5vw] top-[7vh] bottom-[7vh]' : 'right-[3.5vw] top-[6vh] bottom-[6vh]')} w-[17.5vw] z-[60] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)]`}
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
                                onClick={() => setShowTOCMemo?.(false)}
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
                                                            setShowTOCMemo?.(false);
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
                                                                    setShowTOCMemo?.(false);
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
