import React, { useState, useEffect, lazy, Suspense, useRef, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import Sound from '../popups/Sound';
const MobileLayout1 = lazy(() => import('../Mobile/MobileLayouts/MobileLayout1'));


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

const getLayoutColor = (id, defaultColor) => {
    return `var(--${id}, ${defaultColor})`;
};

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
};

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
};

const getLayoutOpacity = (id, defaultOpacity) => {
    return `var(--${id}-opacity, ${defaultOpacity})`;
};

const isLightColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7;
};

const getShade = (hex, weight = 0.6) => {
    if (!hex || hex === 'transparent' || !hex.startsWith('#')) return hex;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return hex;
    let r = parseInt(c.slice(0, 2), 16);
    let g = parseInt(c.slice(2, 4), 16);
    let b = parseInt(c.slice(4, 6), 16);
    r = Math.round(r * (1 - weight));
    g = Math.round(g * (1 - weight));
    b = Math.round(b * (1 - weight));
    const toHex = x => x.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const Grid1Layout = React.memo((props) => {
    const {
        settings,
        bookName,
        hideHeader,
        searchQuery,
        setSearchQuery,
        handleQuickSearch,
        logoSettings,
        logoObjectFit,
        logoCropStyle = {},
        onPageClick,
        currentPage,
        pages,
        bookRef,
        showSoundPopup,
        setShowSoundPopupMemo,
        activeLayout,
        backgroundSettings,
        backgroundStyle,
        children,
        isMuted,
        onToggleAudio,
        setShowGalleryPopupMemo,
        isSidebarOpen,
        isTablet,
        isMobile,
        isMobileLandscape = false,
        // Add missing props
        notes,
        showBookmarkMenu,
        setShowBookmarkMenuMemo,
        showMoreMenu,
        setShowMoreMenuMemo,
        showThumbnailBar,
        setShowThumbnailBarMemo,
        showTOC,
        setShowTOCMemo,
        setShowAddNotesPopupMemo,
        setShowNotesViewerMemo,
        setShowNotesMenuMemo,
        showNotesMenu,
        setShowAddBookmarkPopupMemo,
        setShowViewBookmarkPopup,
        setShowProfilePopup,
        setIsPlaying,
        isAutoFlipping,
        currentZoom,
        handleZoomIn,
        handleZoomOut,
        handleFullScreen,
        handleShare,
        handleDownload,
        offset,
        bookmarks,
        isFullscreen: isFullscreenProp
    } = props;
    // If mobile view is active, delegate entirely to MobileLayout1
    if (isMobile) {
        return (
            <Suspense fallback={<div className="w-full h-full bg-[#DADBE8] flex items-center justify-center">Loading Mobile Layout...</div>}>
                <MobileLayout1
                    {...props}
                    pages={pages}
                    pagesCount={pages?.length || 0}
                    setShowAddNotesPopup={props.setShowAddNotesPopup || props.setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopup={props.setShowAddBookmarkPopup || props.setShowAddBookmarkPopupMemo}
                    setShowNotesViewer={props.setShowNotesViewer || props.setShowNotesViewerMemo}
                    setShowThumbnailBar={props.setShowThumbnailBar || props.setShowThumbnailBarMemo}
                    setShowTOC={props.setShowTOC || props.setShowTOCMemo}
                    onPageClick={onPageClick}
                    currentPage={currentPage}
                    bookRef={bookRef}
                />
            </Suspense>
        );
    }

    const [isFullscreen, setIsFullscreen] = useState(isFullscreenProp || !!document.fullscreenElement);
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);

    useEffect(() => {
        if (isFullscreenProp !== undefined) {
            setIsFullscreen(isFullscreenProp);
            // Reset hover state on fullscreen toggle
            if (!isFullscreenProp) setIsCanvasHovered(false);
        }
    }, [isFullscreenProp]);
    const [activePopup, setActivePopup] = useState(null);


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

    const togglePopup = (popup, e) => {
        if (e) e.stopPropagation();
        const isOpening = activePopup !== popup;
        setActivePopup(isOpening ? popup : null);

        if (isOpening) {
            setShowProfilePopup?.(false);
            setShowSoundPopupMemo?.(false);
            setShowGalleryPopupMemo?.(false);
        }
    };

    const containerRef = React.useRef(null);
    const [responsiveScale, setResponsiveScale] = useState(1);

    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
    const aspectRatio = initialHeight / initialWidth;

    // Reset dimensions to default when tablet mode changes or initial props change
    React.useEffect(() => {
        setDimWidth(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
        setDimHeight(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
    }, [isTablet, isMobileLandscape, initialWidth, initialHeight]);

    // Responsive scaling for Mobile Landscape
    React.useEffect(() => {
        if (!isMobileLandscape) {
            setResponsiveScale(1);
            return;
        }

        const updateScale = () => {
            if (containerRef.current) {
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;

                // Use a safety margin (95% of available space) to prevent clipping
                const availableW = cw * 0.95;
                const availableH = ch * 0.95;

                // Spread dimensions (assuming 2 pages)
                // Use the base dimension factors (0.95 for width, 0.9 for height)
                const baseSpreadW = (initialWidth * 0.95) * 2;
                const baseSpreadH = initialHeight * 0.9;

                const scaleX = availableW / baseSpreadW;
                const scaleY = availableH / baseSpreadH;

                // Take the minimum scale to ensure it fits both width and height
                const fitScale = Math.min(scaleX, scaleY);
                setResponsiveScale(fitScale);
            }
        };

        // Initial update after a short delay to ensure DOM is settled
        const timer = setTimeout(updateScale, 300);

        window.addEventListener('resize', updateScale);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateScale);
        };
    }, [isMobileLandscape, initialWidth, initialHeight]);

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

    // Keyboard and Mouse Wheel Actions
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent interference with search input or other text fields
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            switch (e.key) {
                case 'ArrowRight':
                    setShowSoundPopupMemo?.(false);
                    setActivePopup(null);
                    bookRef.current?.pageFlip()?.flipNext();
                    break;
                case 'ArrowLeft':
                    setShowSoundPopupMemo?.(false);
                    setActivePopup(null);
                    bookRef.current?.pageFlip()?.flipPrev();
                    break;
                case 'ArrowUp':
                case '+':
                    setShowSoundPopupMemo?.(false);
                    zoomIn();
                    break;
                case 'ArrowDown':
                case '-':
                    setShowSoundPopupMemo?.(false);
                    zoomOut();
                    break;
                default:
                    break;
            }
        };

        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) zoomIn();
                else zoomOut();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        };
    }, [zoomIn, zoomOut, bookRef]);

    const [recommendations, setRecommendations] = React.useState([]);
    const scrollRef = React.useRef(null);
    const [hoveredIdx, setHoveredIdx] = React.useState(null);
    const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery || '');
    const [pageInputValue, setPageInputValue] = React.useState(String(currentPage + 1));

    // Toolbar display settings
    const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
    const textFont = settings?.toolbar?.textProperties?.font || 'inherit';

    // Helper: renders an icon button with optional text label below
    const renderToolbarBtn = (iconEl, label, onClick, extraStyle = {}, extraClassName = '') => (
        <button
            className={`transition-all transform hover:scale-110 flex flex-col items-center justify-center relative z-[20] ${extraClassName}`}
            style={{ ...extraStyle, fontFamily: textFont }}
            onClick={onClick}
        >
            {React.cloneElement(iconEl, {
                className: `${iconEl.props.className} ${isMobileLandscape ? '!w-[0.7vw] !h-[0.7vw]' : ''}`
            })}
            {addTextBelowIcons && (
                <span
                    className={`${isMobileLandscape ? 'text-[0.35vw]' : isTablet ? 'text-[0.35vw]' : 'text-[0.55vw]'} font-medium  mt-[0.15vw] leading-none whitespace-nowrap`}
                    style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), fontFamily: textFont, opacity: extraStyle.opacity || 1 }}
                >
                    {label}
                </span>
            )}
        </button>
    );

    React.useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    React.useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const progressRef = React.useRef(null);
    const handleProgressClick = (e) => {
        if (!progressRef.current || pages.length <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pages.length - 1));

        setShowSoundPopupMemo?.(false);
        setActivePopup(null);

        onPageClick(targetIdx);
    };
    const progressPercentage = pages.length > 1 ? (currentPage / (pages.length - 1)) * 100 : 0;

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth * 0.3;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const spreads = React.useMemo(() => {
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

    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);
    const [isOverflowing, setIsOverflowing] = React.useState(false);
    const [visibleIndices, setVisibleIndices] = React.useState([]);

    const [progressHover, setProgressHover] = React.useState({
        visible: false,
        x: 0,
        percentage: 0,
        pageIndex: 0,
        spread: null,
        rectWidth: 0
    });
    const progressHoverRef = React.useRef(null);

    const checkScroll = React.useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

            // Be more sensitive to overflow to ensure the effect kicks in early
            const overflowing = scrollWidth > clientWidth + 5;
            setIsOverflowing(overflowing);

            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

            const containerRect = scrollRef.current.getBoundingClientRect();
            const items = scrollRef.current.querySelectorAll('.thumbnail-item');
            const visible = [];

            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const index = parseInt(item.getAttribute('data-index'));
                // Use a slightly larger margin for visibility detection to prevent flickering
                if (rect.right > containerRect.left + 1 && rect.left < containerRect.right - 1) {
                    visible.push(index);
                }
            });

            if (visible.length > 0) {
                setVisibleIndices(visible.sort((a, b) => a - b));
            }
        }
    }, [spreads.length, isTablet]);

    useEffect(() => {
        if (!scrollRef.current || !showThumbnailBar) return;

        // Perform checks at intervals during transitions to ensure correctness
        const interval = setInterval(checkScroll, 100);

        const resizeObserver = new ResizeObserver(() => {
            checkScroll();
        });

        resizeObserver.observe(scrollRef.current);
        checkScroll();

        return () => {
            clearInterval(interval);
            resizeObserver.disconnect();
        };
    }, [showThumbnailBar, checkScroll]);

    useEffect(() => {
        if (showThumbnailBar && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                // Ensure the active thumbnail stays visible
                activeElem.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
            }
            // Small delay to let scroll happen before final check
            setTimeout(checkScroll, 50);
        }
    }, [currentPage, showThumbnailBar, checkScroll]);

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative" style={{ backgroundColor: backgroundSettings?.color || 'transparent' }}>
            {activePopup && <div className="fixed inset-0 z-[190] bg-transparent" onClick={() => setActivePopup(null)} />}
            <div
                className="absolute inset-0 z-0"
                style={backgroundStyle}
            />
            {/* Top Bar - Revamped */}
            {!hideHeader && (
                <div className={isFullscreen ? 'absolute top-0 left-0 w-full z-[1000]' : 'shrink-0'}>
                <div
                    className={`${isMobileLandscape ? 'h-[5vh] mt-[1vh]' : isTablet ? 'h-[6vh]' : 'h-[8vh]'} flex items-center justify-between px-[2vw] w-full shadow-lg z-[1001] relative transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : ''}`}
                    style={{ backgroundColor: isTablet ? getLayoutColorRgba('bottom-toolbar-bg', '#575C9C') : getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}
                >
                    {/* Search Area */}
                    {settings.interaction.search ? (
                        <div className="relative">
                            <div
                                className={`flex items-center rounded-full px-[0.9vw] py-[0.35vw] ${isMobileLandscape ? 'w-[9vw]' : 'w-[14vw]'} group transition-all shadow-inner`}
                                onClick={(e) => e.stopPropagation()}
                                style={{ backgroundColor: isTablet ? getLayoutColor('search-bg-v1', '#D7D8E8') : getLayoutColorRgba('search-bg-v1', '215, 216, 232', '1') }}
                            >
                                <style>{`
                                    #quick-search-v1-${activeLayout}::placeholder {
                                        color: ${getLayoutColor('search-text-v1', '#575C9C')} !important;
                                        opacity: var(--search-text-v1-opacity, 1);
                                    }
                                `}</style>
                                <Icon
                                    icon="lucide:search"
                                    className={`${isMobileLandscape ? 'w-[0.55vw] h-[0.55vw]' : isTablet ? 'w-[0.7vw] h-[0.7vw]' : 'w-[1vw] h-[1vw]'}`}
                                    style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}
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
                                    id={`quick-search-v1-${activeLayout}`}
                                    placeholder="Quick Search..."
                                    className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ml-[0.6vw] w-full ${isMobileLandscape ? 'text-[0.45vw]' : isTablet ? 'text-[0.55vw]' : 'text-[0.8vw]'} font-normal`}
                                    style={{
                                        color: getLayoutColor('search-text-v1', '#575C9C'),
                                        opacity: 'var(--search-text-v1-opacity, 1)'
                                    }}
                                />
                            </div>

                            {/* Recommendations Dropdown */}
                            {recommendations.length > 0 && (
                                <div
                                    className={`absolute ${isMobileLandscape ? 'top-[1.8vw] w-[9vw]' : isTablet ? 'top-[1.8vw] w-[10vw]' : 'top-[2.4vw] w-[14vw]'} left-0 rounded-[0.8vw] shadow-2xl z-[100] overflow-hidden border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200`}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ backgroundColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8'), backdropFilter: 'blur(8px)' }}
                                >
                                    <div className={`flex flex-col ${isTablet ? 'py-[0.2vw]' : 'py-[0.4vw]'}`}>
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                className={`flex items-center justify-between ${isMobileLandscape ? 'px-[0.4vw] py-[0.3vw]' : isTablet ? 'px-[0.6vw] py-[0.4vw]' : 'px-[0.9vw] py-[0.7vw]'} hover:bg-white/10 transition-colors group`}
                                                style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}
                                                onClick={() => {
                                                    setShowSoundPopupMemo?.(false);
                                                    setActivePopup(null);
                                                    onPageClick(rec.pageNumber - 1);
                                                    const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                    setLocalSearchQuery(fullQuery);
                                                    setSearchQuery(fullQuery);
                                                    setRecommendations([]);
                                                }}
                                            >
                                                <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                    <span className={`${isMobileLandscape ? 'text-[0.5vw]' : isTablet ? 'text-[0.65vw]' : 'text-[0.9vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                        <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                        {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                    </span>
                                                </div>
                                                <span className={`${isMobileLandscape ? 'text-[0.45vw]' : isTablet ? 'text-[0.55vw]' : 'text-[0.8vw]'} font-bold opacity-60 tabular-nums shrink-0`}>{rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Centered Title */}
                    <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <span
                            className={`${isMobileLandscape ? 'text-[1.1vw]' : isTablet ? 'text-[1.2vw]' : 'text-[1.25vw]'} font-medium drop-shadow-sm`}
                            style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                        >{bookName}</span>
                    </div>

                    {/* Logo Area */}
                    {settings.brandingProfile.logo && logoSettings?.src && (
                        <div className="flex items-center gap-[1vw]">
                            {(() => {
                                const adj = logoSettings.adjustments || {};
                                const exposure = adj.exposure || 0;
                                const contrast = adj.contrast || 0;
                                const saturation = adj.saturation || 0;
                                const temperature = adj.temperature || 0;
                                const tint = adj.tint || 0;
                                const highlights = (adj.highlights || 0) / 5;
                                const shadows = (adj.shadows || 0) / 5;
                                const filterStr = `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%) brightness(${100 + highlights}%) contrast(${100 + shadows}%)`;
                                const logoStyle = {
                                    objectFit: logoObjectFit,
                                    filter: filterStr,
                                    opacity: (logoSettings.opacity ?? 100) / 100,
                                    ...logoCropStyle
                                };

                                return logoSettings.url ? (
                                    <a
                                        href={logoSettings.url.startsWith('http') ? logoSettings.url : `https://${logoSettings.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block hover:scale-105 transition-transform"
                                    >
                                        <img
                                            src={logoSettings.src}
                                            alt="Brand Logo"
                                            className={`${isTablet ? 'h-[1.2vw]' : 'h-[2vw]'} w-auto transition-all duration-300`}
                                            style={logoStyle}
                                        />
                                    </a>
                                ) : (
                                    <img
                                        src={logoSettings.src}
                                        alt="Brand Logo"
                                        className={`${isTablet ? 'h-[1.5vw]' : 'h-[2vw]'} w-auto transition-all duration-300`}
                                        style={logoStyle}
                                    />
                                );
                            })()}
                        </div>
                    )}
                </div>
                </div>
            )}

            {/* Canvas Area - Added min-h-0 to allow shrinking in flex layout */}
            <div
                ref={containerRef}
                className={`flex-1 min-h-0 flex items-center justify-center relative ${isFullscreen ? 'p-0' : isMobileLandscape ? 'p-0' : 'py-[6vw] px-[2vw]'} z-[1]`}
                onClick={() => setRecommendations([])}
                onMouseMove={(e) => {
                    if (!isFullscreen) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const EDGE_ZONE = 72;
                    const nearEdge = y < EDGE_ZONE || y > rect.height - EDGE_ZONE;
                    setIsCanvasHovered(!nearEdge);
                }}
                onMouseLeave={() => isFullscreen && setIsCanvasHovered(false)}
            >
                {/* Vertical Centered Navigation Arrows */}
                {settings.navigation.nextPrevButtons && (
                    <>
                        <button
                            className={`absolute left-[2.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'} backdrop-blur-md rounded-[0.25vw] flex items-center justify-center transition-all shadow-lg group z-20`}
                            style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.8'), color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 'var(--toolbar-text-main-opacity, 1)' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSoundPopupMemo?.(false);
                                setActivePopup(null);
                                bookRef.current?.pageFlip()?.flipPrev();
                            }}
                        >
                            <Icon icon="fluent:chevron-left-24-filled" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.25vw] h-[1.25vw]'} group-active:scale-90 transition-transform`} />
                        </button>

                        <button
                            className={`absolute right-[2.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'} backdrop-blur-md rounded-[0.25vw] flex items-center justify-center transition-all shadow-lg group z-20`}
                            style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.8'), color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 'var(--toolbar-text-main-opacity, 1)' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSoundPopupMemo?.(false);
                                setActivePopup(null);
                                bookRef.current?.pageFlip()?.flipNext();
                            }}
                        >
                            <Icon icon="fluent:chevron-right-24-filled" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.25vw] h-[1.25vw]'} group-active:scale-90 transition-transform`} />
                        </button>
                    </>
                )}

                {/* Bottom Corner Navigation Buttons */}
                {settings.navigation.startEndNav && (
                    <>
                        <button
                            className={`absolute left-[9.5vw] bottom-[3vw] ${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'} backdrop-blur-md rounded-[0.25vw] flex items-center justify-center transition-all shadow-lg group z-20`}
                            style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.8'), color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 'var(--toolbar-text-main-opacity, 1)' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSoundPopupMemo?.(false);
                                setActivePopup(null);
                                onPageClick(0);
                            }}
                        >
                            <Icon icon="fluent:previous-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1vw] h-[1vw]'} group-active:scale-90 transition-transform`} />
                        </button>

                        <button
                            className={`absolute right-[9.5vw] bottom-[3vw] ${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'} backdrop-blur-md rounded-[0.25vw] flex items-center justify-center transition-all shadow-lg group z-20`}
                            style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.8'), color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 'var(--toolbar-text-main-opacity, 1)' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSoundPopupMemo?.(false);
                                setActivePopup(null);
                                onPageClick(pages.length - 1);
                            }}
                        >
                            <Icon icon="fluent:next-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1vw] h-[1vw]'} group-active:scale-90 transition-transform`} />
                        </button>
                    </>
                )}

                {/* Page Counter Badge */}
                {settings.navigation.pageQuickAccess && (
                    <div
                        className={`absolute ${isMobileLandscape ? 'left-[3vw]' : 'left-[1vw]'} bottom-[1.25vw] ${isMobileLandscape ? 'rounded-[0.5vw] px-[0.7vw] py-[0.25vw]' : isTablet ? 'rounded-[0.7vw] px-[0.9vw] py-[0.35vw]' : 'rounded-[1vw] px-[1.2vw] py-[0.5vw]'} shadow-[0_4px_15px_rgba(0,0,0,0.1)] z-20 flex items-center transition-all duration-300 backdrop-blur-sm`}
                        style={{
                            backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: 'var(--toolbar-text-main-opacity, 1)'
                        }}
                    >
                        <span
                            className={`${isMobileLandscape ? 'text-[0.65vw]' : isTablet ? 'text-[0.75vw]' : 'text-[0.95vw]'} font-bold transition-colors`}
                            style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        >Page </span>
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
                            className={`${isMobileLandscape ? 'text-[0.65vw]' : isTablet ? 'text-[0.75vw]' : 'text-[0.95vw]'} font-bold bg-transparent border-none outline-none text-center transition-colors`}
                            style={{
                                color: getLayoutColor('toolbar-bg', '#575C9C'),
                                width: `${String(pages.length).length + 0.5}ch`
                            }}
                        />
                        <span
                            className={`${isMobileLandscape ? 'text-[0.65vw]' : isTablet ? 'text-[0.75vw]' : 'text-[0.95vw]'} font-bold transition-colors`}
                            style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        > / {pages.length}</span>
                    </div>
                )}



                <div
                    className="relative flipbook-magazine-wrapper"
                    style={{
                        transform: `translateX(${localOffset}px) scale(${responsiveScale})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.7s ease-out'
                    }}
                >
                    {modifiedChildren}
                </div>
            </div>
            {/* Inline Bottom Toolbar Integration */}
            <div className={isFullscreen ? 'absolute bottom-0 left-0 w-full z-[1000]' : 'shrink-0'}>
            <div
                className={`${isMobileLandscape ? 'h-[2.5vw] mb-[0.8vh] pl-[1.5vw] pr-[0.5vw]' : isTablet ? 'h-[3vw] px-[2vw]' : 'h-[3.8vw] px-[2vw] -mb-px'} flex items-center justify-between w-full z-[1001] shadow-[0_-0.5vw_2vw_rgba(0,0,0,0.2)] transition-all duration-500 ease-in-out ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : ''}`}
                style={{ backgroundColor: isTablet ? getLayoutColor('bottom-toolbar-bg', '#575C9C') : getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1') }}
            >
                {/* Left Controls */}
                <div className={`flex items-center ${isMobileLandscape ? 'ml-[1.5vw] gap-[0.6vw]' : 'gap-[1.2vw]'}`}>
                    {settings.navigation.tableOfContents && renderToolbarBtn(
                        <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                        'TOC',
                        (e) => {
                            e.stopPropagation();
                            const wasOpen = showTOC;
                            setShowTOCMemo(!wasOpen);
                            setShowThumbnailBarMemo(false);
                            setShowBookmarkMenuMemo(false);
                            setShowMoreMenuMemo(false);
                            setShowSoundPopupMemo(false);
                            setShowNotesMenuMemo(false);
                            setActivePopup(null);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: showTOC ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                    )}
                    {settings.navigation.pageThumbnails && renderToolbarBtn(
                        <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                        'Thumbnails',
                        (e) => {
                            e.stopPropagation();
                            const wasOpen = showThumbnailBar;
                            setShowThumbnailBarMemo(!wasOpen);
                            setShowTOCMemo(false);
                            setShowBookmarkMenuMemo(false);
                            setShowMoreMenuMemo(false);
                            setShowSoundPopupMemo(false);
                            setShowNotesMenuMemo(false);
                            setActivePopup(null);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: showThumbnailBar ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                    )}
                </div>

                {/* Center - Playback & Progress */}
                <div className={`flex-1 ${isMobileLandscape ? 'max-w-[15vw] px-[0.2vw] gap-[0.3vw]' : 'max-w-[40vw] px-[2vw] gap-[1vw]'} flex items-center justify-center`}>
                    {renderToolbarBtn(
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                        'First',
                        () => {
                            setShowSoundPopupMemo?.(false);
                            setShowNotesMenuMemo?.(false);
                            setShowBookmarkMenuMemo?.(false);
                            setShowMoreMenuMemo?.(false);
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            onPageClick(0);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                    )}
                    {settings.media.autoFlip && renderToolbarBtn(
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />,
                        isAutoFlipping ? 'Pause' : 'Play',
                        () => {
                            setShowSoundPopupMemo?.(false);
                            setShowNotesMenuMemo?.(false);
                            setShowBookmarkMenuMemo?.(false);
                            setShowMoreMenuMemo?.(false);
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            setIsPlaying(!isAutoFlipping);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                    )}
                    {renderToolbarBtn(
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                        'Last',
                        () => {
                            setShowSoundPopupMemo?.(false);
                            setShowNotesMenuMemo?.(false);
                            setShowBookmarkMenuMemo?.(false);
                            setShowMoreMenuMemo?.(false);
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            onPageClick(pages.length - 1);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                    )}
                    <div
                        ref={progressRef}
                        className={`flex-1 ${isMobileLandscape ? 'h-[0.2vw] min-w-[4vw]' : isTablet ? 'h-[0.2vw] w-[4vw]' : 'h-[0.22vw] w-[6vw]'} relative group cursor-pointer`}
                        onClick={handleProgressClick}
                        onMouseMove={(e) => {
                            if (!progressRef.current || pages.length <= 1) return;
                            const rect = progressRef.current.getBoundingClientRect();
                            const x = e.clientX - rect.left;

                            if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                            progressHoverRef.current = requestAnimationFrame(() => {
                                const boundedX = Math.max(0, Math.min(x, rect.width));
                                const percentage = boundedX / rect.width;
                                let targetIdx = Math.round(percentage * (pages.length - 1));

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
                        }}
                        onMouseLeave={() => {
                            if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                            setProgressHover(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <div className="w-full h-full rounded-full absolute inset-0 overflow-hidden">
                            {/* Track Underlay */}
                            <div className="absolute inset-0 transition-colors duration-300" style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: isTablet ? 0.4 : 0.3 }} />
                            {/* Progress Fill */}
                            <div
                                className="absolute top-0 left-0 h-full transition-all duration-300 ease-out z-10"
                                style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), width: `${progressPercentage}%`, opacity: isTablet ? 1 : 'var(--toolbar-icon-opacity, 1)' }}
                            />
                        </div>

                        {/* Hover Popup */}
                        <AnimatePresence>
                            {progressHover.visible && progressHover.spread && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className={`absolute z-[100] bottom-[calc(100%+0.7vw)] pointer-events-none`}
                                    style={{ left: `${progressHover.x}px` }}
                                >
                                    <div
                                        className={`absolute bottom-0 flex flex-col items-center ${isTablet ? 'p-[0.4vw] rounded-[0.5vw]' : 'p-[0.5vw] rounded-[0.6vw]'} shadow-2xl`}
                                        style={{
                                            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                                            backdropFilter: 'blur(8px)',
                                            border: `1px solid ${getLayoutColorAlpha('dropdown-text', '#FFFFFF', 0.2)}`,
                                            transform: 'translateX(-50%)'
                                        }}
                                    >
                                        <div
                                            className={`flex justify-center ${isTablet ? 'mb-[0.25vw]' : 'mb-[0.3vw]'}`}
                                            style={{ width: `${(400 * (isTablet ? 55 : 90) / 566) * 2 + 1}px` }}
                                        >
                                            <div className="flex gap-[1px] bg-gray-200 overflow-hidden rounded-[0.2vw]">
                                                {progressHover.spread.pages.map((page, pIdx) => {
                                                    const boxHeight = isTablet ? 55 : 90;
                                                    const scale = boxHeight / 566;
                                                    const boxWidth = 400 * scale;
                                                    return (
                                                        <div key={`${progressHover.spread.indices[0]}-${pIdx}`} className="bg-white overflow-hidden relative flex items-center justify-center" style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}>
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

                                        {/* Separating line */}
                                        <div
                                            className={`w-full rounded-full ${isTablet ? 'mb-[0.4vw]' : 'mb-[0.2vw]'}`}
                                            style={{
                                                height: isTablet ? '1px' : '2px',
                                                backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF')
                                            }}
                                        />

                                        <span
                                            className={`font-semibold whitespace-nowrap`}
                                            style={{ fontSize: isTablet ? '0.65vw' : '0.8vw', color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                        >
                                            {progressHover.spread.label}
                                        </span>

                                        {/* Arrow fixed at center of popup */}
                                        <div
                                            className={`absolute top-full w-0 h-0 border-solid border-l-transparent border-r-transparent ${isTablet ? 'border-l-[0.4vw] border-r-[0.4vw] border-t-[1.2vw]' : 'border-l-[0.5vw] border-r-[0.5vw] border-t-[1.5vw]'}`}
                                            style={{
                                                borderTopColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.16))'
                                            }}
                                        ></div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right - Tools & Zoom */}
                <div className={`flex items-center ${isMobileLandscape ? 'mr-[2vw] gap-[0.4vw]' : 'gap-[1.5vw]'}`}>
                    <div className={`flex items-center ${isMobileLandscape ? 'mr-[3vw] gap-[0.3vw]' : 'gap-[1.2vw]'}`}>
                        {/* Notes Icon */}
                        {settings.interaction.notes && renderToolbarBtn(
                            <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Notes',
                            (e) => togglePopup('notes', e),
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}
                        {/* Bookmark Icon */}
                        {(settings.navigation.bookmark || settings.interaction.bookmark) && renderToolbarBtn(
                            <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Bookmark',
                            (e) => togglePopup('bookmarks', e),
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}
                        {/* Music/Sound Icon */}
                        {settings.media.backgroundAudio && renderToolbarBtn(
                            <Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Music',
                            (e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); setActivePopup(null); },
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}



                        {/* More Menu Icon */}
                        <div className="relative">
                            {renderToolbarBtn(
                                <Icon icon="ph:dots-three-bold" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />,
                                'More',
                                (e) => togglePopup('more', e),
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: activePopup === 'more' ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                            )}

                            <AnimatePresence>
                                {activePopup === 'more' && (
                                    <>
                                        <div className="fixed inset-0 z-[10]" onClick={() => setActivePopup(null)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className={`absolute ${isTablet ? 'bottom-[calc(100%+1.2vw)]' : 'bottom-[calc(100%+2.0vw)]'} left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]`}
                                            style={{
                                                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.5'),
                                                backdropFilter: 'blur(10px)',
                                                width: isTablet ? '9vw' : 'auto',
                                                minWidth: isTablet ? '0' : '8vw',
                                                borderRadius: isTablet ? '0.6vw' : '1vw'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {settings.interaction.gallery && (
                                                <button
                                                    className={`flex items-center ${isTablet ? 'gap-[0.6vw] px-[0.9vw] py-[0.6vw]' : 'gap-[0.75vw] px-[1vw] py-[0.6vw]'} hover:bg-white/10 transition-colors text-left group`}
                                                    onClick={() => {
                                                        setShowGalleryPopupMemo(true);
                                                        setActivePopup(null);
                                                    }}
                                                    style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                >
                                                    <Icon
                                                        icon="fluent:image-multiple-24-filled"
                                                        className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                                        style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }}
                                                    />
                                                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Gallery</span>
                                                </button>
                                            )}
                                            <div className="h-[1px] bg-white/10 w-full" />
                                            {settings.brandingProfile.profile && (
                                                <button
                                                    className={`flex items-center ${isTablet ? 'gap-[0.6vw] px-[0.9vw] py-[0.6vw]' : 'gap-[0.75vw] px-[1vw] py-[0.6vw]'} hover:bg-white/10 transition-colors text-left group`}
                                                    onClick={() => {
                                                        setShowProfilePopup(true);
                                                        setActivePopup(null);
                                                    }}
                                                    style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                >
                                                    <Icon
                                                        icon="fluent:person-24-filled"
                                                        className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                                        style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }}
                                                    />
                                                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Profile</span>
                                                </button>
                                            )}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>



                    <div className="w-[1px] h-[1.5vw] bg-white/10" />

                    {settings.viewing.zoom && (
                        <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.1vw]' : 'gap-[0.4vw]'}`}>
                            {renderToolbarBtn(
                                <Icon icon="ph:magnifying-glass-minus" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Zoom Out',
                                (e) => { e.stopPropagation(); zoomOut(); },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                            )}
                            <div className={`${isMobileLandscape ? 'w-[2vw]' : 'w-[6vw]'} ${isMobileLandscape ? 'h-[0.15vw]' : isTablet ? 'h-[0.2vw]' : 'h-[0.25vw]'} rounded-full relative overflow-hidden`}>
                                {/* Track Underlay */}
                                <div className="absolute inset-0 transition-colors duration-300" style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 0.3 }} />
                                {/* Progress Fill */}
                                <div
                                    className="absolute top-0 left-0 h-full transition-all duration-300 z-10"
                                    style={{
                                        backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                        width: `${Math.max(0, Math.min(100, ((dimWidth - initialWidth * 0.5) / (initialWidth * 1.5 - initialWidth * 0.5)) * 100))}%`
                                    }}
                                />
                            </div>
                            {renderToolbarBtn(
                                <Icon icon="ph:magnifying-glass-plus" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Zoom In',
                                (e) => { e.stopPropagation(); zoomIn(); },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                            )}
                        </div>
                    )}

                    <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.3vw]' : 'gap-[1.2vw]'}`}>
                        {settings.shareExport.share && renderToolbarBtn(
                            <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                            'Share',
                            (e) => {
                                e.stopPropagation();
                                setShowSoundPopupMemo?.(false);
                                setActivePopup(null);
                                handleShare();
                            },
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}
                        {settings.shareExport.download && renderToolbarBtn(
                            <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                            'Download',
                            (e) => {
                                e.stopPropagation();
                                setShowSoundPopupMemo?.(false);
                                setActivePopup(null);
                                handleDownload();
                            },
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}
                        {settings.viewing.fullScreen && renderToolbarBtn(
                            <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                            'Full Screen',
                            (e) => {
                                e.stopPropagation();
                                setShowSoundPopupMemo?.(false);
                                setActivePopup?.(null);
                                setShowThumbnailBarMemo?.(false);
                                setShowTOCMemo?.(false);
                                setShowBookmarkMenuMemo?.(false);
                                setShowNotesMenuMemo?.(false);
                                handleFullScreen();
                            },
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}
                    </div>
                </div>
            </div>
            </div>



            {activePopup === 'notes' && (
                <>
                    <div
                        className={`absolute flex flex-col ${isMobileLandscape ? 'rounded-[12px]' : 'rounded-[1vw]'} overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            bottom: isMobileLandscape ? '45px' : isTablet ? '3.2vw' : 'calc(4.5vw + 2.5vh)',
                            right: isMobileLandscape ? '28%' : isTablet ? '20vw' : '23.8vw',
                            width: isMobileLandscape ? '150px' : isTablet ? '10vw' : '12vw',
                            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                            backdropFilter: 'blur(10px)',
                            border: 'none'
                        }}
                    >
                        <button
                            className={`flex items-center ${isMobileLandscape ? 'gap-[10px] px-[12px] py-[8px]' : isTablet ? 'gap-[0.6vw] px-[0.9vw] py-[0.6vw]' : 'gap-[0.75vw] px-[1.25vw] py-[0.85vw]'} hover:bg-white/10 transition-colors text-left group`}
                            onClick={() => {
                                setShowAddNotesPopupMemo(true);
                                setActivePopup(null);
                                setShowSoundPopupMemo?.(false);
                            }}
                            style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', '1') }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={`${isMobileLandscape ? 'w-[16px] h-[16px]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', '1') }}
                            >
                                <path d="M2.75499 14.7146L3.27199 16.6466C3.87599 18.9016 4.17899 20.0296 4.86399 20.7606C5.40464 21.3374 6.10408 21.7411 6.87399 21.9206C7.84999 22.1486 8.97799 21.8466 11.234 21.2426C13.488 20.6386 14.616 20.3366 15.347 19.6516C15.4077 19.5943 15.4663 19.5356 15.523 19.4756C15.1824 19.4449 14.8439 19.3948 14.509 19.3256C13.813 19.1876 12.986 18.9656 12.008 18.7036L11.901 18.6746L11.876 18.6686C10.812 18.3826 9.92299 18.1446 9.21299 17.8886C8.46599 17.6186 7.78799 17.2856 7.21099 16.7456C6.41731 16.002 5.86191 15.0398 5.61499 13.9806C5.43499 13.2116 5.48699 12.4576 5.62699 11.6766C5.76099 10.9276 6.00099 10.0296 6.28899 8.95463L6.82399 6.96062L6.84199 6.89062C4.92199 7.40763 3.91099 7.71362 3.23699 8.34462C2.65949 8.88568 2.25545 9.58588 2.07599 10.3566C1.84799 11.3316 2.14999 12.4596 2.75499 14.7146Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M11.8741 2.07599C12.85 1.84807 13.9778 2.14979 16.2335 2.7547C16.8008 2.90671 17.2972 3.03922 17.7335 3.16388C17.275 3.7184 17.0001 4.43016 17.0001 5.20587C17.0001 6.97649 18.4355 8.41192 20.2061 8.41192C20.6511 8.4119 21.0748 8.32092 21.46 8.15704C21.3339 8.82433 21.1174 9.64216 20.8301 10.7147L20.3116 12.6463C19.7066 14.9013 19.4048 16.0296 18.7198 16.7606C18.1793 17.3377 17.48 17.7419 16.71 17.9217C16.6135 17.9443 16.515 17.9614 16.4151 17.9734C15.5001 18.0864 14.3827 17.788 12.3507 17.244C10.0957 16.639 8.96738 16.3362 8.23639 15.6512C7.65932 15.1105 7.25582 14.4106 7.07624 13.6404C6.84831 12.6645 7.15003 11.5377 7.75495 9.28302L8.27155 7.3504L8.51569 6.4461C8.97069 4.78012 9.27733 3.86314 9.86432 3.23614C10.405 2.65934 11.1042 2.25553 11.8741 2.07599ZM11.1924 12.1736C11.0005 12.1225 10.7961 12.1495 10.6241 12.2488C10.452 12.3482 10.326 12.512 10.2745 12.7039C10.249 12.799 10.2431 12.8983 10.2559 12.9959C10.2687 13.0935 10.3005 13.188 10.3497 13.2733C10.3988 13.3584 10.4641 13.4331 10.5421 13.493C10.6202 13.553 10.7096 13.5973 10.8048 13.6229L13.7032 14.3983C13.7993 14.4276 13.9001 14.438 14.0001 14.4275C14.1002 14.417 14.1981 14.3865 14.2862 14.3377C14.3741 14.289 14.4509 14.2225 14.5128 14.1434C14.5747 14.0641 14.6205 13.973 14.6466 13.8758C14.6726 13.7785 14.6791 13.6767 14.6651 13.577C14.6511 13.4773 14.6174 13.381 14.5655 13.2947C14.5137 13.2086 14.4446 13.1341 14.3633 13.075C14.2819 13.0158 14.189 12.9736 14.0909 12.951L11.1924 12.1736ZM11.6778 9.25567C11.5801 9.26848 11.4858 9.30021 11.4005 9.34942C11.3153 9.39855 11.2407 9.46389 11.1807 9.54181C11.1208 9.6199 11.0764 9.70941 11.0508 9.8045C10.9995 9.99651 11.0267 10.2027 11.126 10.3748C11.2254 10.5467 11.3893 10.6719 11.5811 10.7234L16.4112 12.0174C16.5072 12.0462 16.6084 12.0555 16.7081 12.0447C16.8075 12.0339 16.9038 12.0035 16.9913 11.9549C17.079 11.9061 17.1561 11.8397 17.2178 11.7606C17.2796 11.6814 17.3246 11.5909 17.3507 11.494C17.3767 11.397 17.384 11.2955 17.3702 11.1961C17.3564 11.0968 17.3219 11.001 17.2706 10.9149C17.2192 10.8289 17.1511 10.7544 17.0704 10.6951C16.9895 10.6358 16.8975 10.5933 16.7999 10.5701L11.9698 9.27423C11.8747 9.2487 11.7754 9.24288 11.6778 9.25567Z" fill="currentColor" />
                                <path d="M20.2062 3V6.63111M22.0217 4.81555H18.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className={`${isMobileLandscape ? 'text-[12px]' : isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold whitespace-nowrap`}>Add Notes</span>
                        </button>
 
                        <button
                            className={`flex items-center ${isMobileLandscape ? 'gap-[10px] px-[12px] py-[8px]' : isTablet ? 'gap-[0.6vw] px-[0.9vw] py-[0.6vw]' : 'gap-[0.75vw] px-[1.25vw] py-[0.85vw]'} hover:bg-white/10 transition-colors text-left group`}
                            onClick={() => {
                                setShowNotesViewerMemo(true);
                                setActivePopup(null);
                                setShowSoundPopupMemo?.(false);
                            }}
                            style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', '1') }}
                        >
                            <Icon
                                icon="lets-icons:view-fill"
                                className={`${isMobileLandscape ? 'w-[16px] h-[16px]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', '1') }}
                            />
                            <span className={`${isMobileLandscape ? 'text-[12px]' : isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold whitespace-nowrap`}>View Notes</span>
                        </button>
                    </div>
                </>
            )}

            {activePopup === 'bookmarks' && (
                <>
                    <div
                        className={`absolute flex flex-col ${isMobileLandscape ? 'rounded-[12px]' : 'rounded-[1vw]'} overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            bottom: isMobileLandscape ? '45px' : isTablet ? '3.2vw' : 'calc(4.5vw + 2.5vh)',
                            right: isMobileLandscape ? '25%' : isTablet ? '18vw' : '21.8vw',
                            width: isMobileLandscape ? '150px' : isTablet ? '10vw' : '12vw',
                            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                            backdropFilter: 'blur(10px)',
                            border: 'none'
                        }}
                    >
                        <button
                            className={`flex items-center ${isMobileLandscape ? 'gap-[10px] px-[12px] py-[8px]' : isTablet ? 'gap-[0.6vw] px-[0.9vw] py-[0.6vw]' : 'gap-[0.75vw] px-[1.25vw] py-[0.85vw]'} hover:bg-white/10 transition-colors text-left group`}
                            onClick={() => {
                                setShowAddBookmarkPopupMemo(true);
                                setActivePopup(null);
                                setShowSoundPopupMemo?.(false);
                            }}
                            style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', '1') }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={`${isMobileLandscape ? 'w-[16px] h-[16px]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', '1') }}
                            >
                                <path d="M15.2354 2C15.084 2.37237 15 2.77935 15 3.20605C15 4.97672 16.4354 6.41209 18.2061 6.41211C18.8707 6.41211 19.488 6.20962 20 5.86328V21.0283C19.9998 22.2481 18.6198 22.958 17.6279 22.249L12 18.2285L6.37207 22.249C5.37915 22.959 4.00022 22.2491 4 21.0293V5C4 4.20435 4.3163 3.44152 4.87891 2.87891C5.44152 2.3163 6.20435 2 7 2H15.2354Z" fill="currentColor" />
                                <path d="M18.2062 1V4.63111M20.0217 2.81555H16.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className={`${isMobileLandscape ? 'text-[12px]' : isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold whitespace-nowrap`}>Add Bookmark</span>
                        </button>
 
                        <button
                            className={`flex items-center ${isMobileLandscape ? 'gap-[10px] px-[12px] py-[8px]' : isTablet ? 'gap-[0.6vw] px-[0.9vw] py-[0.6vw]' : 'gap-[0.75vw] px-[1.25vw] py-[0.85vw]'} hover:bg-white/10 transition-colors text-left group`}
                            onClick={() => {
                                setShowViewBookmarkPopup(true);
                                setActivePopup(null);
                                setShowSoundPopupMemo?.(false);
                            }}
                            style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', '1') }}
                        >
                            <Icon
                                icon="lets-icons:view-fill"
                                className={`${isMobileLandscape ? 'w-[16px] h-[16px]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', '1') }}
                            />
                            <span className={`${isMobileLandscape ? 'text-[12px]' : isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold whitespace-nowrap`}>View Bookmark</span>
                        </button>
                    </div>
                </>
            )}


            {/* Isolated Thumbnails Bar Rendering (to prevent layout shifts) */}
            {showThumbnailBar && (
                <div className="absolute inset-0 z-[150] pointer-events-none">
                    <div
                        className="absolute flex items-center group/bar fisto-menu-content pointer-events-auto transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[24px] backdrop-blur-md"
                        style={{
                            width: isMobileLandscape ? '90%' : '96%',
                            maxWidth: '1856px',
                            height: isMobileLandscape ? '55px' : isTablet ? '60px' : '5.8vw',
                            bottom: isMobileLandscape ? '50px' : isTablet ? '50px' : 'calc(4.5vw + 2.5vh)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.8),
                            backdropFilter: 'blur(10px)',
                            borderRadius: isTablet ? '10px' : '20px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            zIndex: 150,
                            display: 'flex',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`absolute ${isMobileLandscape ? 'left-[4px]' : isTablet ? 'left-[4px]' : 'left-[8px]'} inset-y-0 flex items-center z-50`}>
                            <button
                                className={`${isMobileLandscape ? 'w-[28px] h-[28px] rounded-[8px]' : isTablet ? 'w-[30px] h-[30px] rounded-[0.5vw]' : 'w-[40px] h-[40px] rounded-[10px]'} flex items-center justify-center transition-all shadow-xl active:scale-95 opacity-100 transition-colors border border-white/20`}
                                style={{
                                    backgroundColor: getLayoutColorAlpha('thumbnail-inner-v2', '255, 255, 255', 0.2),
                                    color: getLayoutColor('dropdown-text', '#FFFFFF')
                                }}
                                onClick={(e) => { e.stopPropagation(); if (canScrollLeft) scroll('left'); }}
                            >
                                <Icon icon="lucide:chevron-left" className={`${isMobileLandscape ? 'w-[16px] h-[16px]' : isTablet ? 'w-[18px] h-[18px]' : 'w-[24px] h-[24px]'}`} />
                            </button>
                        </div>

                        <div
                            ref={scrollRef}
                            onScroll={checkScroll}
                            className={`flex-1 flex overflow-x-hidden no-scrollbar scroll-smooth items-center h-full ${isMobileLandscape ? 'gap-[5px] mx-[35px]' : isTablet ? 'gap-[6px] mx-[40px] ' : 'gap-[8px] mx-[60px]'} ${isOverflowing ? 'justify-start' : 'justify-center'} rounded-[20px]`}
                        >
                            {spreads.map((spread, idx) => {
                                const isHovered = idx === hoveredIdx;
                                const isSelected = spread.indices.includes(currentPage);
                                const dynamicScale = isHovered ? 1.0 : 1.0;

                                let boxWidth = isMobileLandscape ? 36 : isTablet ? 48 : 72;
                                let boxHeight = isMobileLandscape ? 27 : isTablet ? 36 : 54;

                                if (spreads.length > 5) {
                                    const visiblePos = visibleIndices.indexOf(idx);
                                    if (visiblePos !== -1) {
                                        if (visiblePos === 0 || visiblePos === visibleIndices.length - 1) {
                                            boxWidth = isMobileLandscape ? 24 : isTablet ? 28 : 40;
                                            boxHeight = isMobileLandscape ? 18 : isTablet ? 21 : 30;
                                        } else if (visiblePos === 1 || (visiblePos === visibleIndices.length - 2 && visibleIndices.length > 2)) {
                                            boxWidth = isMobileLandscape ? 30 : isTablet ? 38 : 60;
                                            boxHeight = isMobileLandscape ? 22 : isTablet ? 28 : 46;
                                        }
                                    } else {
                                        if (idx === 0 || idx === spreads.length - 1) {
                                            boxWidth = isMobileLandscape ? 24 : isTablet ? 28 : 40;
                                            boxHeight = isMobileLandscape ? 18 : isTablet ? 21 : 30;
                                        } else if (idx === 1 || (idx === spreads.length - 2 && spreads.length > 2)) {
                                            boxWidth = isMobileLandscape ? 30 : isTablet ? 38 : 60;
                                            boxHeight = isMobileLandscape ? 22 : isTablet ? 28 : 46;
                                        }
                                    }
                                }

                                return (
                                    <div
                                        key={idx}
                                        data-index={idx}
                                        className={`thumbnail-item flex flex-col items-center shrink-0 cursor-pointer group ${isMobileLandscape ? 'rounded-[8px]' : isTablet ? 'rounded-[0.2vw] ' : 'rounded-[12px]'}  ${isSelected ? 'active-thumbnail' : ''}`}
                                        style={{
                                            transform: `scale(${dynamicScale}) translateY(${isHovered ? '-2px' : '0'})`,
                                            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                                            boxShadow: isHovered ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none',
                                            zIndex: isHovered ? 60 : 30,
                                            position: 'relative',
                                            padding: isMobileLandscape ? '3px 4px' : isTablet ? '3px 5px' : '6px 10px',
                                            gap: isMobileLandscape ? '2px' : isTablet ? '0.1vw' : '4px',
                                            backgroundColor: isSelected
                                                ? getLayoutColor('dropdown-text', '#FFFFFF')
                                                : isHovered
                                                    ? getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.15)
                                                    : getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.08),
                                            border: isSelected ? `2px solid ${getLayoutColor('dropdown-text', '#FFFFFF')}` : 'none',
                                        }}
                                        onClick={() => {
                                            onPageClick(spread.indices[0]);
                                            setHoveredIdx(null);
                                        }}
                                        onMouseEnter={() => setHoveredIdx(idx)}
                                        onMouseLeave={() => setHoveredIdx(null)}
                                    >
                                        <div
                                            className={`overflow-hidden border transition-all bg-white relative shadow-xl ${isHovered ? 'border-white ring-4 ring-white/30' : isSelected ? 'border-white' : 'border-transparent group-hover:border-white/20'} rounded-none border-[2px]`}
                                            style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                                        >
                                            <div className="flex w-full h-full gap-[1px] bg-gray-200 justify-center">
                                                {spread.pages.map((page, pIdx) => {
                                                    const pageWidth = 400;
                                                    const pageHeight = 566;
                                                    const availableWidth = boxWidth / 2;
                                                    const availableHeight = boxHeight;
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
                                        </div>
                                        <span className="font-bold tracking-tight transition-colors"
                                            style={{
                                                fontSize: isTablet ? '6px' : '9px',
                                                color: isSelected ? getLayoutColor('dropdown-bg', '#575C9C') : getLayoutColor('dropdown-text', '#FFFFFF'),
                                                opacity: isSelected ? 1 : (isHovered ? 1 : 0.4)
                                            }}>
                                            {spread.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={`absolute ${isMobileLandscape ? 'right-[4px]' : isTablet ? 'right-[4px]' : 'right-[8px]'} inset-y-0 flex items-center z-50`}>
                            <button
                                className={`${isMobileLandscape ? 'w-[28px] h-[28px] rounded-[8px]' : isTablet ? 'w-[30px] h-[30px] rounded-[0.5vw]' : 'w-[40px] h-[40px] rounded-[10px]'} flex items-center justify-center transition-all shadow-xl active:scale-95 opacity-100 transition-colors border border-white/20`}
                                style={{
                                    backgroundColor: getLayoutColorAlpha('thumbnail-inner-v2', '255, 255, 255', 0.2),
                                    color: getLayoutColor('dropdown-text', '#FFFFFF')
                                }}
                                onClick={(e) => { e.stopPropagation(); if (canScrollRight) scroll('right'); }}
                            >
                                <Icon icon="lucide:chevron-right" className={`${isMobileLandscape ? 'w-[16px] h-[16px]' : isTablet ? 'w-[18px] h-[18px]' : 'w-[24px] h-[24px]'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Grid1Layout;
