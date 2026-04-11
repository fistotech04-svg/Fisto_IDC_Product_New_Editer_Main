import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileLayout1 from '../Mobile/MobileLayouts/MobileLayout1';

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

const Grid1Layout = React.memo(({
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
    setShowAddBookmarkPopupMemo,
    setShowViewBookmarkPopup,
    setShowProfilePopup,
    isAutoFlipping,
    setIsPlaying,
    currentZoom,
    handleZoomIn,
    handleZoomOut,
    handleFullScreen,
    handleShare,
    handleDownload,
    offset,
    isFullscreen,
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
    isMobile
}) => {
    // If mobile view is active, delegate entirely to MobileLayout1
    if (isMobile) {
        return (
            <MobileLayout1
                settings={settings}
                bookName={bookName}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleQuickSearch={handleQuickSearch}
                setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                setShowTOCMemo={setShowTOCMemo}
                setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                setShowNotesViewerMemo={setShowNotesViewerMemo}
                bookRef={bookRef}
                pages={pages}
                setIsPlaying={setIsPlaying}
                isAutoFlipping={isAutoFlipping}
                handleShare={handleShare}
                handleDownload={handleDownload}
                handleFullScreen={handleFullScreen}
                setShowProfilePopup={setShowProfilePopup}
                logoSettings={logoSettings}
                currentPage={currentPage}
                pagesCount={pages?.length || 0}
                currentZoom={currentZoom}
                onPageClick={onPageClick}
                bookmarks={[]} // Assuming Grid1Layout receives filtered bookmarks/notes, but we pass what we have
                notes={[]} // MobileLayout1 handles its own or receives them from PreviewArea
                onAddNote={() => {}} 
                onDeleteBookmark={() => {}}
                onUpdateBookmark={() => {}}
                onAddBookmark={() => {}}
                profileSettings={{}} // Pass correct ones if Grid1Layout had them, wait, Grid1Layout DOES NOT have all of these! Let's just pass props
                // Wait, Grid1Layout is passed all props from PreviewArea! Let's pass the props object
            />
        );
    }
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

    // Keyboard and Mouse Wheel Actions
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent interference with search input or other text fields
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            switch (e.key) {
                case 'ArrowRight':
                    bookRef.current?.pageFlip()?.flipNext();
                    break;
                case 'ArrowLeft':
                    bookRef.current?.pageFlip()?.flipPrev();
                    break;
                case 'ArrowUp':
                case '+':
                    zoomIn();
                    break;
                case 'ArrowDown':
                case '-':
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
    const [showLocalBookmarkDropdown, setShowLocalBookmarkDropdown] = React.useState(false);
    const [showLocalNotesDropdown, setShowLocalNotesDropdown] = React.useState(false);
    const [isCanvasHovered, setIsCanvasHovered] = React.useState(true);
    const savedZoomRef = React.useRef(null);
    const zoomTimerRef = React.useRef(null);
    // Keep a ref mirror of dimWidth so setTimeout closures always read the latest value
    const dimWidthRef = React.useRef(dimWidth);
    React.useEffect(() => { dimWidthRef.current = dimWidth; }, [dimWidth]);

    // Sync isCanvasHovered to true as soon as we enter fullscreen to avoid a 1-frame blink
    const [prevFS, setPrevFS] = React.useState(isFullscreen);
    if (isFullscreen !== prevFS) {
        setPrevFS(isFullscreen);
        if (isFullscreen) {
            setIsCanvasHovered(true);
        }
    }

    // Auto-zoom when toolbar hides in fullscreen, restore when toolbar shows.
    // Debounced (600ms) so rapid hover in/out cancels the pending resize
    // and never triggers a DOM reflow during mouse transitions → no blink.
    React.useEffect(() => {
        // Cancel any pending zoom timer on every state change
        if (zoomTimerRef.current) {
            clearTimeout(zoomTimerRef.current);
            zoomTimerRef.current = null;
        }

        const toolbarHidden = isFullscreen && isCanvasHovered;

        if (toolbarHidden) {
            // Toolbar just hid — wait for the fade-out transition to finish
            // before zooming in, so the resize doesn't overlap the animation.
            if (savedZoomRef.current === null) {
                zoomTimerRef.current = setTimeout(() => {
                    zoomTimerRef.current = null;
                    const current = dimWidthRef.current;
                    savedZoomRef.current = current;
                    const zoomed = Math.min(current + 40, initialWidth * 1.3);
                    setDimWidth(zoomed);
                    setDimHeight(zoomed * aspectRatio);
                }, 600);
            }
        } else {
            // Toolbar just showed — wait for the fade-in to finish
            // before zooming out so the shrink doesn't hit during transition.
            if (savedZoomRef.current !== null) {
                const restored = savedZoomRef.current;
                zoomTimerRef.current = setTimeout(() => {
                    zoomTimerRef.current = null;
                    savedZoomRef.current = null;
                    setDimWidth(restored);
                    setDimHeight(restored * aspectRatio);
                }, 600);
            }
        }

        return () => {
            if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
        };
    }, [isFullscreen, isCanvasHovered]);

    // Toolbar display settings
    const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
    const textFont = settings?.toolbar?.textProperties?.font || 'inherit';

    // Helper: renders an icon button with optional text label below
    const renderToolbarBtn = (iconEl, label, onClick, extraStyle = {}, extraClassName = '') => (
        <button
            className={`transition-all transform hover:scale-110 flex flex-col items-center justify-center ${extraClassName}`}
            style={{ ...extraStyle, fontFamily: textFont }}
            onClick={onClick}
        >
            {iconEl}
            {addTextBelowIcons && (
                <span
                    className={`${isTablet ? 'text-[0.45vw]' : 'text-[0.65vw]'} font-medium mt-[0.15vw] leading-none whitespace-nowrap`}
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

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
            setIsOverflowing(scrollWidth > clientWidth);

            const containerRect = scrollRef.current.getBoundingClientRect();
            const items = scrollRef.current.querySelectorAll('.thumbnail-item');
            const visible = [];
            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const index = parseInt(item.getAttribute('data-index'));
                if (rect.right > containerRect.left + 2 && rect.left < containerRect.right - 2) {
                    visible.push(index);
                }
            });
            setVisibleIndices(visible.sort((a, b) => a - b));
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(checkScroll, 50);
        window.addEventListener('resize', checkScroll);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [spreads, showThumbnailBar]);

    React.useEffect(() => {
        if (showThumbnailBar && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        checkScroll();
    }, [currentPage, showThumbnailBar]);

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative" style={{ backgroundColor: backgroundSettings?.color || 'transparent' }}>
            <div
                className="absolute inset-0 z-0"
                style={backgroundStyle}
            />
            {/* Top Bar - Revamped */}
            {!hideHeader && (
                <div className={isFullscreen ? "absolute top-0 left-0 w-full z-[1000] bg-transparent" : "shrink-0"}>
                    <div
                        className={`${isTablet ? 'h-[6vh]' : 'h-[8vh]'} flex items-center justify-between px-[2vw] w-full shadow-lg z-[1001] transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
                        style={{ backgroundColor: isTablet ? getLayoutColorRgba('bottom-toolbar-bg', '#575C9C') : getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}
                    >
                    {/* Search Area */}
                    {settings.interaction.search ? (
                        <div className="relative">
                            <div
                                className="flex items-center rounded-full px-[0.9vw] py-[0.35vw] w-[14vw] group transition-all shadow-inner"
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
                                    className={`${isTablet ? 'w-[0.7vw] h-[0.7vw]' : 'w-[1vw] h-[1vw]'}`}
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

                                            pages.forEach((page, index) => {
                                                const text = (page.html || page.content || '').replace(/<[^>]*>/g, ' ');
                                                const words = text.split(/\s+/);

                                                // Find unique words on this page that start with query
                                                const pageMatches = new Set();
                                                words.forEach(word => {
                                                    const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
                                                    if (cleanWord.length > 2 && cleanWord.toLowerCase().startsWith(lowerQuery)) {
                                                        pageMatches.add(cleanWord);
                                                    }
                                                });

                                                pageMatches.forEach(word => {
                                                    results.push({ word, pageNumber: index + 1 });
                                                });
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
                                    className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ml-[0.6vw] w-full ${isTablet ? 'text-[0.55vw]' : 'text-[0.8vw]'} font-normal`}
                                    style={{
                                        color: getLayoutColor('search-text-v1', '#575C9C'),
                                        opacity: 'var(--search-text-v1-opacity, 1)'
                                    }}
                                />
                            </div>

                            {/* Recommendations Dropdown */}
                            {recommendations.length > 0 && (
                                <div
                                    className={`absolute ${isTablet ? 'top-[2.2vw] w-[10vw]' : 'top-[2.8vw] w-[14vw]'} left-0 rounded-[0.8vw] shadow-2xl z-[100] overflow-hidden border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200`}
                                    style={{ backgroundColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8'), backdropFilter: 'blur(8px)' }}
                                >
                                    <div className={`flex flex-col ${isTablet ? 'py-[0.2vw]' : 'py-[0.4vw]'}`}>
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                className={`flex items-center justify-between ${isTablet ? 'px-[0.6vw] py-[0.4vw]' : 'px-[0.9vw] py-[0.7vw]'} hover:bg-white/10 transition-colors group`}
                                                style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setLocalSearchQuery(rec.word);
                                                    setSearchQuery(rec.word);
                                                    setRecommendations([]);
                                                }}
                                            >
                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.9vw]'} font-medium opacity-90 group-hover:opacity-100`}>{rec.word}</span>
                                                <span className={`${isTablet ? 'text-[0.55vw]' : 'text-[0.8vw]'} font-bold opacity-60 tabular-nums`}>{rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : <div className="w-[15vw]" />}

                    {/* Centered Title */}
                    <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <span
                            className={`${isTablet ? 'text-[1.2vw]' : 'text-[1.25vw]'} font-medium drop-shadow-sm`}
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
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
                className={`flex-1 min-h-0 flex items-center justify-center relative py-[6vw] px-[2vw] z-[1]`}
                onMouseMove={(e) => {
                    if (!isFullscreen) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    // Near top or bottom edge (toolbar zone) → show toolbar
                    // In the middle canvas area → hide toolbar
                    const EDGE_ZONE = 72; // px — approx toolbar height
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
                        className={`absolute left-[1vw] bottom-[1.25vw] ${isTablet ? 'rounded-[0.7vw] px-[0.9vw] py-[0.35vw]' : 'rounded-[1vw] px-[1.2vw] py-[0.5vw]'} shadow-[0_4px_15px_rgba(0,0,0,0.1)] z-20 flex items-center transition-all duration-300 backdrop-blur-sm`}
                        style={{ 
                            backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: 'var(--toolbar-text-main-opacity, 1)'
                        }}
                    >
                        <span
                            className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.95vw]'} font-bold transition-colors`}
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
                            className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.95vw]'} font-bold bg-transparent border-none outline-none text-center transition-colors`}
                            style={{
                                color: getLayoutColor('toolbar-bg', '#575C9C'),
                                width: `${String(pages.length).length + 0.5}ch`
                            }}
                        />
                        <span
                            className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.95vw]'} font-bold transition-colors`}
                            style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        > / {pages.length}</span>
                    </div>
                )}

                <div
                    className="relative flipbook-magazine-wrapper"
                    style={{
                        transform: `translateX(${localOffset}px) scale(1)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.7s ease-out'
                    }}
                >
                    {modifiedChildren}
                </div>
            </div>

            {/* Thumbnails Bar Integration */}
            {showThumbnailBar && (
                <>
                    <div
                        className="absolute inset-0 z-[140] bg-transparent pointer-events-auto"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowThumbnailBarMemo(false);
                        }}
                    />
                    <div
                        className="absolute z-[150] flex items-center group/bar fisto-menu-content pointer-events-auto transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[24px] backdrop-blur-md"
                        style={{
                            width: '96%',
                            maxWidth: '1856px',
                            height: isTablet ? '60px' : '92px',
                            bottom: isTablet ? '50px' : '68px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: getLayoutColorRgba('thumbnail-outer-v2', '87, 92, 156', '0.8'),
                            borderRadius: isTablet ? '10px' :  '20px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            paddingLeft: '0px',
                            paddingRight: '0px',
                            zIndex: 150,
                            display: 'flex',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`absolute ${isTablet ? 'left-[4px]' : 'left-[8px]'} inset-y-0 flex items-center z-50`}>
                            <button
                                className={`${isTablet ? 'w-[30px] h-[30px] rounded-[0.5vw]' : 'w-[40px] h-[40px] rounded-[10px]'} bg-white/30 hover:bg-white/40 border border-white/20 flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${!canScrollLeft ? 'opacity-20 cursor-default' : 'opacity-100'}`}
                                onClick={(e) => { e.stopPropagation(); if (canScrollLeft) scroll('left'); }}
                            >
                                <Icon icon="lucide:chevron-left" className={`${isTablet ? 'w-[18px] h-[18px]' : 'w-[24px] h-[24px]'}`} />
                            </button>
                        </div>

                        <div
                            ref={scrollRef}
                            onScroll={checkScroll}
                            className={`flex-1 flex overflow-x-hidden no-scrollbar scroll-smooth items-center h-full ${isTablet ? 'gap-[6px] mx-[40px] ' : 'gap-[8px] mx-[60px]'} ${isOverflowing ? 'justify-start' : 'justify-center'} rounded-[20px]`}
                        >
                            {spreads.map((spread, idx) => {
                                const isHovered = idx === hoveredIdx;
                                const isSelected = spread.indices.includes(currentPage);
                                const dynamicScale = isHovered ? 1.0 : 1.0;

                                let boxWidth = isTablet ? 48 : 72;
                                let boxHeight = isTablet ? 36 : 54;

                                if (isOverflowing) {
                                    const visiblePos = visibleIndices.indexOf(idx);
                                    if (visiblePos !== -1) {
                                        if (visiblePos === 0 || visiblePos === visibleIndices.length - 1) {
                                            boxWidth = isTablet ? 28 : 40;
                                            boxHeight = isTablet ? 21 : 30;
                                        } else if (visiblePos === 1 || (visiblePos === visibleIndices.length - 2 && visibleIndices.length > 2)) {
                                            boxWidth = isTablet ? 38 : 60;
                                            boxHeight = isTablet ? 28 : 46;
                                        }
                                    } else {
                                        if (idx === 0 || idx === spreads.length - 1) {
                                            boxWidth = isTablet ? 28 : 40;
                                            boxHeight = isTablet ? 21 : 30;
                                        } else if (idx === 1 || (idx === spreads.length - 2 && spreads.length > 2)) {
                                            boxWidth = isTablet ? 38 : 60;
                                            boxHeight = isTablet ? 28 : 46;
                                        }
                                    }
                                }



                                return (
                                    <div
                                        key={idx}
                                        data-index={idx}
                                        className={`thumbnail-item flex flex-col items-center shrink-0 cursor-pointer group ${isTablet ? 'rounded-[0.2vw] ' : 'rounded-[12px]'}  ${isSelected ? 'active-thumbnail' : ''}`}
                                        style={{
                                            transform: `scale(${dynamicScale})`,
                                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            zIndex: isHovered ? 60 : 30,
                                            position: 'relative',
                                            padding: isTablet ? '3px 5px' : '6px 10px',
                                            gap: isTablet ? '0.1vw' : '0.6vw',
                                            backgroundColor: isSelected ? getLayoutColor('dropdown-text', '#FFFFFF') : getLayoutColor('thumbnail-outer-v2', '#575C9C'),
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
                                        <span className={`font-bold tracking-tight transition-colors ${isSelected ? 'text-[#1A1A1A]' : isHovered ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`} style={{ fontSize: isTablet ? '6px' : '9px' }}>
                                            {spread.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={`absolute ${isTablet ? 'right-[4px]' : 'right-[8px]'} inset-y-0 flex items-center z-50`}>
                            <button
                                className={`${isTablet ? 'w-[30px] h-[30px] rounded-[0.5vw]' : 'w-[40px] h-[40px] rounded-[10px]'} bg-white/30 hover:bg-white/40 border border-white/20 flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${!canScrollRight ? 'opacity-20 cursor-default' : 'opacity-100'}`}
                                onClick={(e) => { e.stopPropagation(); if (canScrollRight) scroll('right'); }}
                            >
                                <Icon icon="lucide:chevron-right" className={`${isTablet ? 'w-[18px] h-[18px]' : 'w-[24px] h-[24px]'}`} />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Inline Bottom Toolbar Integration */}
            <div className={isFullscreen ? "absolute bottom-0 left-0 w-full z-[1000] bg-transparent" : "shrink-0"}>
                <div
                    className={`${isTablet ? 'h-[3vw]' : 'h-[3.8vw]'} flex items-center justify-between px-[2vw] w-full z-[1001] shadow-[0_-0.5vw_2vw_rgba(0,0,0,0.2)] transition-all duration-500 ease-in-out ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
                    style={{ backgroundColor: isTablet ? getLayoutColor('bottom-toolbar-bg', '#575C9C') : getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1') }}
                >
                {/* Left Controls */}
                <div className="flex items-center gap-[1.2vw]">
                    {settings.navigation.tableOfContents && renderToolbarBtn(
                        <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                        'TOC',
                        (e) => {
                            e.stopPropagation();
                            setShowTOCMemo(!showTOC);
                            setShowThumbnailBarMemo(false);
                            setShowBookmarkMenuMemo(false);
                            setShowMoreMenuMemo(false);
                            setShowSoundPopupMemo(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: showTOC ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                    )}
                    {settings.navigation.pageThumbnails && renderToolbarBtn(
                        <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                        'Thumbnails',
                        (e) => {
                            e.stopPropagation();
                            setShowThumbnailBarMemo(!showThumbnailBar);
                            setShowTOCMemo(false);
                            setShowBookmarkMenuMemo(false);
                            setShowMoreMenuMemo(false);
                            setShowSoundPopupMemo(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: showThumbnailBar ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                    )}
                </div>

                {/* Center - Playback & Progress */}
                <div className="flex-1 max-w-[40vw] flex items-center gap-[1vw] px-[2vw]">
                    {renderToolbarBtn(
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                        'First',
                        () => onPageClick(0),
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                    )}
                    {settings.media.autoFlip && renderToolbarBtn(
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />,
                        isAutoFlipping ? 'Pause' : 'Play',
                        () => setIsPlaying(!isAutoFlipping),
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                    )}
                    {renderToolbarBtn(
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                        'Last',
                        () => onPageClick(pages.length - 1),
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                    )}
                    <div
                        ref={progressRef}
                        className={`flex-1 ${isTablet ? 'h-[0.2vw] w-[4vw]' : 'h-[0.22vw] w-[6vw]'} relative group cursor-pointer`}
                        onClick={handleProgressClick}
                    >
                        <div className="w-full h-full rounded-full relative overflow-hidden">
                            {/* Track Underlay */}
                            <div className="absolute inset-0 transition-colors duration-300" style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: isTablet ? 0.4 : 0.3 }} />
                            {/* Progress Fill */}
                            <div
                                className="absolute top-0 left-0 h-full transition-all duration-300 ease-out z-10"
                                style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), width: `${progressPercentage}%`, opacity: isTablet ? 1 : 'var(--toolbar-icon-opacity, 1)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right - Tools & Zoom */}
                <div className="flex items-center gap-[1.5vw]">
                    <div className="flex items-center gap-[1.2vw]">
                        {/* Notes Icon with Dropdown */}
                        {settings.interaction.notes && (
                            <div className="relative">
                                {renderToolbarBtn(
                                    <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                    'Notes',
                                    (e) => {
                                        e.stopPropagation();
                                        setShowLocalNotesDropdown(prev => !prev);
                                        setShowLocalBookmarkDropdown(false);
                                        setShowMoreMenuMemo(false);
                                        setShowBookmarkMenuMemo(false);
                                        setShowTOCMemo(false);
                                        setShowThumbnailBarMemo(false);
                                        setShowSoundPopupMemo(false);
                                    },
                                    { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: showLocalNotesDropdown ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                                )}
                                <AnimatePresence>
                                    {showLocalNotesDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                            className={`absolute bottom-[calc(100%+2vw)] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]`}
                                            style={{
                                                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.5'),
                                                backdropFilter: 'blur(10px)',
                                                width: isTablet ? '8vw' : '9vw',
                                                borderRadius: isTablet ? '0.8vw' : '1vw'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.8vw]'} hover:bg-white/10 transition-colors text-left group`}
                                                onClick={() => { setShowAddNotesPopupMemo(true); setShowLocalNotesDropdown(false); }}
                                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                            >
                                                <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`} style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }} />
                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Add Notes</span>
                                            </button>
                                            <div className="h-[1px] bg-white/10 w-full" />
                                            <button
                                                className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.8vw]'} hover:bg-white/10 transition-colors text-left group`}
                                                onClick={() => { setShowNotesViewerMemo(true); setShowLocalNotesDropdown(false); }}
                                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                            >
                                                <Icon icon="lucide:sticky-note" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`} style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }} />
                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>View Notes</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        {/* Bookmark Icon with Dropdown */}
                        {settings.navigation.bookmark && (
                            <div className="relative">
                                {renderToolbarBtn(
                                    <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                    'Bookmark',
                                    (e) => {
                                        e.stopPropagation();
                                        setShowLocalBookmarkDropdown(prev => !prev);
                                        setShowLocalNotesDropdown(false);
                                        setShowMoreMenuMemo(false);
                                        setShowBookmarkMenuMemo(false);
                                        setShowTOCMemo(false);
                                        setShowThumbnailBarMemo(false);
                                        setShowSoundPopupMemo(false);
                                    },
                                    { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: showLocalBookmarkDropdown ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                                )}
                                <AnimatePresence>
                                    {showLocalBookmarkDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                            className={`absolute bottom-[calc(100%+2vw)] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]`}
                                            style={{
                                                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.5'),
                                                backdropFilter: 'blur(10px)',
                                                width: isTablet ? '9vw' : '10vw',
                                                borderRadius: isTablet ? '0.8vw' : '1vw'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.8vw]'} hover:bg-white/10 transition-colors text-left group`}
                                                onClick={() => { setShowAddBookmarkPopupMemo(true); setShowLocalBookmarkDropdown(false); }}
                                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                            >
                                                <Icon icon="fluent:bookmark-add-24-filled" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`} style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }} />
                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Add Bookmark</span>
                                            </button>
                                            <div className="h-[1px] bg-white/10 w-full" />
                                            <button
                                                className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.8vw]'} hover:bg-white/10 transition-colors text-left group`}
                                                onClick={() => { setShowViewBookmarkPopup(true); setShowLocalBookmarkDropdown(false); }}
                                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                            >
                                                <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`} style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }} />
                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>View Bookmark</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        {/* Music/Sound Icon */}
                        {settings.media.backgroundAudio && renderToolbarBtn(
                            <Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Music',
                            (e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); setShowMoreMenuMemo(false); setShowBookmarkMenuMemo(false); setShowTOCMemo(false); setShowThumbnailBarMemo(false); },
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: showSoundPopup ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                        )}
                        {/* More Menu Icon */}
                        <div className="relative">
                            {renderToolbarBtn(
                                <Icon icon="ph:dots-three-bold" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />,
                                'More',
                                (e) => { e.stopPropagation(); setShowMoreMenuMemo(!showMoreMenu); setShowBookmarkMenuMemo(false); setShowTOCMemo(false); setShowThumbnailBarMemo(false); setShowSoundPopupMemo(false); },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: showMoreMenu ? 'calc(var(--toolbar-icon-opacity, 1) * 0.7)' : 'var(--toolbar-icon-opacity, 1)' }
                            )}

                            <AnimatePresence>
                                {showMoreMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className={`absolute bottom-[calc(100%+2vw)] right-[0vw] flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]`}
                                        style={{ 
                                            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.5'), 
                                            backdropFilter: 'blur(10px)',
                                            width: isTablet ? '8vw' : '9vw',
                                            minWidth: isTablet ? '0' : '9vw',
                                            borderRadius: isTablet ? '0.8vw' : '1vw'
                                            
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {settings.interaction.gallery && (
                                            <button
                                                className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[1vw]'} hover:bg-white/10 transition-colors text-center group`}
                                                onClick={() => { setShowGalleryPopupMemo(true); setShowMoreMenuMemo(false); }}
                                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                            >
                                                <Icon
                                                    icon="fluent:image-multiple-24-filled"
                                                    className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                                    style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }}
                                                />
                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Gallery</span>
                                            </button>
                                        )}
                                        {settings.brandingProfile.profile && (
                                            <>
                                                <div className="h-[1px] bg-white/10 w-full" />
                                                <button
                                                    className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[1vw]'} hover:bg-white/10 transition-colors text-left group`}
                                                    onClick={() => { setShowProfilePopup(true); setShowMoreMenuMemo(false); }}
                                                    style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                >
                                                    <Icon
                                                        icon="fluent:person-24-filled"
                                                        className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                                        style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }}
                                                    />
                                                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Profile</span>
                                                </button>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="w-[1px] h-[1.5vw] bg-white/10" />

                    {settings.viewing.zoom && (
                        <div className="flex items-center gap-[0.4vw]">
                            {renderToolbarBtn(
                                <Icon icon="ph:magnifying-glass-minus" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Zoom Out',
                                (e) => { e.stopPropagation(); zoomOut(); },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                            )}
                            <div className={`w-[6vw] ${isTablet ? 'h-[0.2vw]' : 'h-[0.25vw]'} rounded-full relative overflow-hidden`}>
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

                    <div className="flex items-center gap-[1.2vw]">
                        {settings.shareExport.share && renderToolbarBtn(
                            <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                            'Share',
                            (e) => { e.stopPropagation(); handleShare(); },
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}
                        {settings.shareExport.download && renderToolbarBtn(
                            <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                            'Download',
                            (e) => { e.stopPropagation(); handleDownload(); },
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}
                        {settings.viewing.fullScreen && renderToolbarBtn(
                            <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                            'Full Screen',
                            (e) => { e.stopPropagation(); handleFullScreen(); },
                            { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
});

export default Grid1Layout;
