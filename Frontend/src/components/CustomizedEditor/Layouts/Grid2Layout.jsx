import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import AddBookmarkPopup from '../popups/AddBookmarkPopup';
import AddNotesPopup from '../popups/AddNotesPopup';
import ViewBookmarkPopup from '../popups/ViewBookmarkPopup';
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
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), calc(var(--${id}-opacity, 1) * ${defaultOpacity}))`;
};

const getLayoutOpacity = (id, defaultOpacity) => `calc(var(--${id}-opacity, 1) * ${defaultOpacity})`;

const Grid2Layout = ({
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
    handleShare,
    handleDownload,
    handleFullScreen,
    isFullscreen = false,
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
    setShowProfilePopup,
    setShowViewBookmarkPopup,
    setShowNotesViewerMemo,
    isSidebarOpen,
    isTablet,
    backgroundSettings,
    backgroundStyle,
    isMuted,
    onToggleAudio,
    showSoundPopup,
    setShowSoundPopupMemo,
    setShowGalleryPopupMemo,
    activeLayout,
    isMobile,
    isMobileLandscape = false,
    ...restProps
}) => {
    // If mobile view is active, delegate entirely to MobileLayout2
    if (isMobile) {
        return (
            <MobileLayout2
                {...restProps}
                settings={settings}
                bookName={bookName}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleQuickSearch={handleQuickSearch}
                setShowThumbnailBar={setShowThumbnailBarMemo}
                setShowTOC={setShowTOCMemo}
                setShowAddNotesPopup={setShowAddNotesPopupMemo}
                setShowAddBookmarkPopup={setShowAddBookmarkPopupMemo}
                setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                setShowNotesViewer={setShowNotesViewerMemo}
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
                bookmarks={bookmarks}
                notes={notes}
                onAddNote={onAddNote}
                onDeleteBookmark={onDeleteBookmark}
                onUpdateBookmark={onUpdateBookmark}
                onAddBookmark={onAddBookmark}
                profileSettings={profileSettings}
                activeLayout={activeLayout}
                showSoundPopup={showSoundPopup}
                setShowSoundPopup={setShowSoundPopupMemo}
                isMuted={isMuted}
                onToggleAudio={onToggleAudio}
                setShowGalleryPopup={setShowGalleryPopupMemo}
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

    const [showRadialThumbnails, setShowRadialThumbnails] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [radialScroll, setRadialScroll] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const containerRef = React.useRef(null);
    const [responsiveScale, setResponsiveScale] = useState(1);

    // --- Fullscreen toolbar hide/show (mirrors Grid1Layout) ---
    const [isCanvasHovered, setIsCanvasHovered] = useState(true);
    const savedZoomRef = React.useRef(null);
    const zoomTimerRef = React.useRef(null);
    const dimWidthRef = React.useRef(dimWidth);
    React.useEffect(() => { dimWidthRef.current = dimWidth; }, [dimWidth]);

    // Sync isCanvasHovered to true as soon as we enter fullscreen
    const [prevFS, setPrevFS] = useState(isFullscreen);
    if (isFullscreen !== prevFS) {
        setPrevFS(isFullscreen);
        if (isFullscreen) setIsCanvasHovered(true);
    }

    // Auto-zoom when toolbar hides in fullscreen, restore when toolbar shows
    React.useEffect(() => {
        if (zoomTimerRef.current) {
            clearTimeout(zoomTimerRef.current);
            zoomTimerRef.current = null;
        }
        const toolbarHidden = isFullscreen && isCanvasHovered;
        if (toolbarHidden) {
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
        return () => { if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current); };
    }, [isFullscreen, isCanvasHovered]);

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
                const baseSpreadW = (initialWidth * (isTablet ? 0.7 : 1)) * 2;
                const baseSpreadH = initialHeight * (isTablet ? 0.7 : 1);

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
    }, [isMobileLandscape, isTablet, initialWidth, initialHeight]);

    // Prevent body scroll when radial dial is open
    React.useEffect(() => {
        if (showRadialThumbnails) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showRadialThumbnails]);

    const handleRadialWheel = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        setRadialScroll(prev => {
            const shift = e.deltaY > 0 ? 1 : -1;
            return prev + shift;
        });
    };

    // Grouping logic for spreads
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

    const closeAllPopups = (except) => {
        if (except !== 'toc') setShowTOCMemo?.(false);
        if (except !== 'thumbnails') setShowRadialThumbnails(false);
        if (except !== 'notes') setShowNotesOptions(false);
        if (except !== 'bookmarks') setShowBookmarkOptions(false);
        if (except !== 'sound') setShowSoundPopupMemo?.(false);
        if (except !== 'gallery') setShowGalleryPopupMemo?.(false);
        if (except !== 'profile') setShowProfilePopup?.(false);
        setRecommendations([]);
    };

    const [hoveredDotIdx, setHoveredDotIdx] = useState(null);
    const [direction, setDirection] = useState('forward');
    const [prevPage, setPrevPage] = useState(currentPage);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    useEffect(() => {
        if (currentPage > prevPage) {
            setDirection('forward');
        } else if (currentPage < prevPage) {
            setDirection('backward');
        }
        setPrevPage(currentPage);
    }, [currentPage]);

    const activeSpreadIdx = useMemo(() => {
        return spreads.findIndex(s => s.indices.includes(currentPage));
    }, [spreads, currentPage]);

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
                    className={`${isMobileLandscape ? 'text-[0.35vw]' : isTablet ? 'text-[0.35vw]' : 'text-[0.6vw]'} font-medium  mt-[0.15vw] leading-none whitespace-nowrap`}
                    style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), fontFamily: textFont, opacity: extraStyle.opacity || 1 }}
                >
                    {label}
                </span>
            )}
        </button>
    );

    // Radial Dial Configuration (Shared between dial and preview)
    // Always use the exact set of spreads — no repetition.
    // Use a fixed compact angle step (26°) so segments stay near each other
    // regardless of how few pages the book has. For large books (many spreads),
    // scale the step down so segments don't overlap.
    const radialConfig = useMemo(() => {
        if (!spreads || spreads.length === 0) return { displaySpreads: [], angleStep: 26 };

        const displaySpreads = [...spreads];
        // Fixed compact step: ~26° keeps segments visually touching.
        // If the book has enough pages to naturally fill the circle, use the even distribution instead.
        const compactStep = 26;
        const angleStep = Math.min(compactStep, 360 / displaySpreads.length);

        return { displaySpreads, angleStep };
    }, [spreads]);

    const { displaySpreads, angleStep } = radialConfig;

    useEffect(() => {
        if (showRadialThumbnails) {
            setRadialScroll(0); // Reset scroll offset when opening
        }
    }, [showRadialThumbnails]);

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative" style={backgroundStyle} onClick={() => closeAllPopups()}>
            {/* Layout 2 Header */}
            <div className={isFullscreen ? 'absolute top-0 left-0 w-full z-[1000] bg-transparent' : 'shrink-0'}>
            <div
                className={`${isMobileLandscape ? 'h-[6.5vh] pt-[1vh]' : isTablet ? 'h-[6.5vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] w-full z-[1001] border-b border-white/5 transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
                style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}
            >
                {/* Left: Search Bar */}
                <div className={`flex items-center ${isMobileLandscape ? 'ml-[1.5vw]' : ''}`}>
                    {settings.interaction.search && (
                        <div className="relative">
                            <div
                                className={`flex items-center transition-all duration-300 border border-transparent ${isMobileLandscape ? 'w-[8vw] h-[1.5vw] px-[0.5vw] mt-[0.5vw]' : isTablet ? 'w-[9vw] px-[0.6vw] py-[0.25vw]' : isSidebarOpen ? 'w-[10.5vw] px-[0.8vw] py-[0.3vw]' : 'w-[14vw] px-[1vw] py-[0.35vw]'} group ${isMobileLandscape ? 'rounded-full' : isTablet ? 'rounded-[0.5vw]' : 'rounded-[0.7vw]'} relative z-20`}
                                onClick={(e) => e.stopPropagation()}
                                style={{ backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF') }}
                            >
                                <style>{`
                                    #quick-search-v1-${activeLayout}::placeholder {
                                        color: ${getLayoutColor('search-text-v1', '#575C9C')} !important;
                                        opacity: 0.7;
                                    }
                                `}</style>
                                <Icon
                                    icon="lucide:search"
                                    className={`${isMobileLandscape ? 'w-[0.6vw] h-[0.6vw] shrink-0' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1.1vw] h-[1.1vw]'}`}
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
                                    className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isMobileLandscape ? 'text-[0.6vw] ml-[0.3vw] p-0' : isTablet ? 'text-[0.6vw] ml-[0.65vw]' : 'text-[0.85vw] ml-[0.65vw]'} w-full font-medium`}
                                    style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}
                                />
                            </div>

                            {/* Detached Recommendations Dropdown with extended top height behind search bar */}
                            {recommendations.length > 0 && (
                                <div
                                    className={`absolute top-[50%] ${isMobileLandscape ? 'left-0 w-[8vw]' : isTablet ? `left-[0.2vw] ${isSidebarOpen ? 'w-[8.5vw]' : 'w-[10vw]'}` : `left-[0.25vw] ${isSidebarOpen ? 'w-[10vw]' : 'w-[13.5vw]'}`} animate-in fade-in slide-in-from-top-1 duration-200 transition-all z-10`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className={`bg-white/60 backdrop-blur-xl ${isMobileLandscape ? 'rounded-[0.8vw] px-[0.4vw] pb-[0.2vw] pt-[1.8vw]' : isTablet ? 'rounded-[0.8vw] px-[0.5vw] pb-[0.25vw] pt-[1.8vw]' : 'rounded-[1.3vw] px-[0.7vw] pb-[0.4vw] pt-[2.8vw]'} border border-white/20`}>
                                        <div className={`${isMobileLandscape ? 'rounded-[0.5vw]' : isTablet ? 'rounded-[0.6vw]' : 'rounded-[0.9vw]'} overflow-hidden`}>
                                            <div
                                                className={`${isMobileLandscape ? 'rounded-[0.5vw]' : isTablet ? 'rounded-[0.6vw]' : 'rounded-[0.9vw]'} overflow-hidden`}
                                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#3E4491') }}
                                            >
                                                <div className={`flex flex-col ${isMobileLandscape ? 'py-[0.2vw]' : isTablet ? 'py-[0.25vw]' : 'py-[0.4vw]'}`}>
                                                    {recommendations.map((rec, idx) => (
                                                        <button
                                                            key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                            className={`flex items-center justify-between ${isMobileLandscape ? 'px-[0.6vw] py-[0.3vw]' : isTablet ? 'px-[0.6vw] py-[0.4vw]' : 'px-[1vw] py-[0.6vw]'} hover:bg-white/10 text-white transition-colors group`}
                                                            onClick={() => {
                                                                onPageClick(rec.pageNumber - 1);
                                                                const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                                setLocalSearchQuery(fullQuery);
                                                                setSearchQuery(fullQuery);
                                                                setRecommendations([]);
                                                            }}
                                                        >
                                                            <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                                <span className={`${isMobileLandscape ? 'text-[0.55vw]' : isTablet ? 'text-[0.55vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                                    <span className="font-bold mr-[0.3vw]" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), fontWeight: 800 }}>{rec.word}</span>
                                                                    {rec.context && <span className="font-normal opacity-70" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{rec.context}</span>}
                                                                </span>
                                                            </div>
                                                            <span
                                                                className={`${isMobileLandscape ? 'text-[0.5vw]' : isTablet ? 'text-[0.5vw]' : 'text-[0.75vw]'} font-bold opacity-60 tabular-nums shrink-0`}
                                                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                            >{rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Center Area: One Long Cluster of Icons (Grouped) */}
                <div className={`${isMobileLandscape ? 'flex flex-1 justify-end pr-[2vw]' : isTablet ? 'flex flex-1 justify-center pr-[9vw]' : 'flex flex-1 justify-center pr-[9vw]'} items-center ${isMobileLandscape ? 'gap-[2.5vw]' : isTablet ? 'gap-[1.2vw]' : 'gap-[2.5vw]'}`}>
                    {/* Tools Group - 5 Icons */}
                    <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.8vw]' : isTablet ? 'gap-[0.8vw]' : 'gap-[1.5vw]'}`}>
                        {settings.navigation.tableOfContents && renderToolbarBtn(
                            <Icon icon="fluent:text-bullet-list-24-filled" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'TOC',
                            (e) => { e.stopPropagation(); closeAllPopups('toc'); setShowTOCMemo(true); },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                        {renderToolbarBtn(
                            <Icon icon="ph:squares-four-fill" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Thumbnails',
                            (e) => { e.stopPropagation(); const current = showRadialThumbnails; closeAllPopups('thumbnails'); setShowRadialThumbnails(!current); },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                        <div className="relative flex items-center justify-center">
                            {renderToolbarBtn(
                                <Icon icon="material-symbols-light:add-notes" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                                'Notes',
                                (e) => { e.stopPropagation(); const current = showNotesOptions; closeAllPopups('notes'); setShowNotesOptions(!current); },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                            )}
                            {showNotesOptions && (
                                <div
                                    className={`absolute left-1/2 -translate-x-1/2 ${isTablet ? 'top-[245%]' : 'top-[255%]'} backdrop-blur-xl border border-white/50 ${isTablet ? 'rounded-[1.2vw]' : 'rounded-[1.5vw]'} z-[100] shadow-[0_8px_30px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-top-2 duration-200 p-1 ${isTablet ? 'w-[10vw]' : 'w-[12vw]'}`}
                                    style={{
                                        backgroundColor: "transparent",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="rounded-[1.1vw] bg-white overflow-hidden">
                                        <div
                                            className="rounded-[1.1vw] overflow-hidden"
                                            style={{ backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.2 + var(--dropdown-bg-opacity, 1) * 0.8))" }}
                                        >
                                            <div className={`flex flex-col ${isTablet ? 'py-[0.25vw]' : 'py-[0.3vw]'}`}>
                                                <button
                                                    className={`w-full flex items-center ${isTablet ? 'px-[0.8vw] py-[0.5vw]' : 'px-[1.2vw] py-[0.7vw]'} hover:bg-black/10 transition-colors ${isTablet ? 'gap-[0.8vw]' : 'gap-[1vw]'} text-left group`}
                                                    onClick={() => {
                                                        setShowAddNotesPopupMemo(true);
                                                        setShowNotesOptions(false);
                                                    }}
                                                >
                                                    <Icon
                                                        icon="solar:notes-bold"
                                                        className={`${isTablet ? 'w-[0.9vw]' : 'w-[1.25vw]'} group-hover:scale-110 transition-transform`}
                                                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                    />
                                                    <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Notes</span>
                                                </button>
                                                <button
                                                    className={`w-full flex items-center ${isTablet ? 'px-[0.8vw] py-[0.5vw]' : 'px-[1.2vw] py-[0.7vw]'} hover:bg-black/10 transition-colors ${isTablet ? 'gap-[0.8vw]' : 'gap-[1vw]'} text-left group`}
                                                    onClick={() => {
                                                        setShowNotesViewerMemo(true);
                                                        setShowNotesOptions(false);
                                                    }}
                                                >
                                                    <Icon
                                                        icon="lets-icons:view-fill"
                                                        className={`${isTablet ? 'w-[0.9vw]' : 'w-[1.25vw]'} group-hover:scale-110 transition-transform`}
                                                        style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                    />
                                                    <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>View Notes</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {settings.navigation.bookmark && (
                            <div className="relative flex items-center justify-center">
                                {renderToolbarBtn(
                                    <Icon icon="fluent:bookmark-24-filled" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                                    'Bookmark',
                                    (e) => { e.stopPropagation(); const current = showBookmarkOptions; closeAllPopups('bookmarks'); setShowBookmarkOptions(!current); },
                                    { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                                )}
                                {showBookmarkOptions && (
                                    <div
                                        className={`absolute left-1/2 -translate-x-1/2 ${isTablet ? 'top-[245%]' : 'top-[255%]'} backdrop-blur-xl border border-white/50 ${isTablet ? 'rounded-[1.2vw]' : 'rounded-[1.5vw]'} z-[100] shadow-[0_8px_30px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-top-2 duration-200 p-1 ${isTablet ? 'w-[10vw]' : 'w-[12vw]'}`}
                                        style={{
                                            backgroundColor: "transparent",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="rounded-[1.1vw] bg-white overflow-hidden">
                                            <div
                                                className="rounded-[1.1vw] overflow-hidden"
                                                style={{ backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.2 + var(--dropdown-bg-opacity, 1) * 0.8))" }}
                                            >
                                                <div className={`flex flex-col ${isTablet ? 'py-[0.25vw]' : 'py-[0.4vw]'}`}>
                                                    <button
                                                        className={`w-full flex items-center ${isTablet ? 'px-[0.8vw] py-[0.5vw]' : 'px-[1.2vw] py-[0.7vw]'} hover:bg-black/10 transition-colors ${isTablet ? 'gap-[0.8vw]' : 'gap-[1vw]'} text-left group`}
                                                        onClick={() => {
                                                            setShowAddBookmarkPopupMemo(true);
                                                            setShowBookmarkOptions(false);
                                                        }}
                                                    >
                                                        <Icon
                                                            icon="mdi:bookmark-plus"
                                                            className={`${isTablet ? 'w-[0.9vw]' : 'w-[1.25vw]'} group-hover:scale-110 transition-transform`}
                                                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                        />
                                                        <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Add Bookmark</span>
                                                    </button>
                                                    <button
                                                        className={`w-full flex items-center ${isTablet ? 'px-[0.8vw] py-[0.5vw]' : 'px-[1.2vw] py-[0.7vw]'} hover:bg-black/10 transition-colors ${isTablet ? 'gap-[0.8vw]' : 'gap-[1vw]'} text-left group`}
                                                        onClick={() => {
                                                            setShowViewBookmarkPopup(true);
                                                            setShowBookmarkOptions(false);
                                                        }}
                                                    >
                                                        <Icon
                                                            icon="mdi:bookmark-multiple"
                                                            className={`${isTablet ? 'w-[0.9vw]' : 'w-[1.25vw]'} group-hover:scale-110 transition-transform`}
                                                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                        />
                                                        <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>View Bookmark</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {renderToolbarBtn(
                            <Icon icon="clarity:image-gallery-solid" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Gallery',
                            (e) => { e.stopPropagation(); closeAllPopups('gallery'); setShowGalleryPopupMemo(true); },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') },
                            'gallery-button'
                        )}
                        {settings.media.backgroundAudio && renderToolbarBtn(
                            <Icon icon="solar:music-notes-bold" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Music',
                            (e) => { e.stopPropagation(); const current = showSoundPopup; closeAllPopups('sound'); setShowSoundPopupMemo(!current); },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                    </div>

                    {/* Navigation Group - 3 Icons (Prev, Play, Next) */}
                    <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.8vw]' : isTablet ? 'gap-[0.6vw]' : 'gap-[0.8vw]'}`}>
                        {renderToolbarBtn(
                            <Icon icon="ph:skip-back" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'First',
                            () => onPageClick(0),
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                        {renderToolbarBtn(
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />,
                            isAutoFlipping ? 'Pause' : 'Play',
                            () => setIsPlaying(!isAutoFlipping),
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                        {renderToolbarBtn(
                            <Icon icon="ph:skip-forward" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Last',
                            () => onPageClick(pagesCount - 1),
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                    </div>

                    <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.8vw]' : isTablet ? 'gap-[0.8vw]' : 'gap-[1.5vw]'}`}>
                        {renderToolbarBtn(
                            <Icon icon="fluent:person-24-filled" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Profile',
                            (e) => { e.stopPropagation(); closeAllPopups('profile'); setShowProfilePopup(true); },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                        {renderToolbarBtn(
                            <Icon icon="mage:share-fill" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Share',
                            (e) => { e.stopPropagation(); handleShare(); },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                        {renderToolbarBtn(
                            <Icon icon="meteor-icons:download" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Download',
                            (e) => { e.stopPropagation(); handleDownload(); },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                        {renderToolbarBtn(
                            <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Full Screen',
                            (e) => { e.stopPropagation(); handleFullScreen(); },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                        )}
                    </div>
                </div>

                {/* Right Section: Brand Logo Container */}
                <div className="flex items-center">
                    {settings.brandingProfile.logo && logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Brand Logo"
                            className={`${isTablet ? 'h-[1.5vw]' : 'h-[2vw]'} w-auto transition-all duration-300`}
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>
            </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 min-h-0 flex flex-col relative z-[1]">
                {/* Centered Book Name */}
                <div className={`w-full flex justify-center ${isMobileLandscape ? 'py-[0.5vh]' : 'py-[1.2vh]'} pointer-events-none z-20`}>
                    <span
                        className={`${isMobileLandscape ? 'text-[0.7vw]' : 'text-[1.1vw]'} font-bold tracking-tight opacity-100`}
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                    >
                        {bookName}
                    </span>
                </div>

                <div
                    ref={containerRef}
                    className={`flex-1 w-full flex items-center justify-center relative ${isFullscreen ? 'p-0' : isMobileLandscape ? 'p-0' : 'p-[2vw]'} min-h-0`}
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
                                className={`absolute left-[2.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[2vw] h-[2vw] ' : 'w-[3vw] h-[3vw]'} flex items-center justify-center transition-all group z-20`}
                                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    bookRef.current?.pageFlip()?.flipPrev();
                                }}
                            >
                                <Icon icon="ph:caret-left" className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : 'w-[2.5vw] h-[2.5vw]'} group-active:scale-90 transition-transform`} />
                            </button>

                            <button
                                className={`absolute right-[2.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[2vw] h-[2vw] ' : 'w-[3vw] h-[3vw]'} flex items-center justify-center transition-all group z-20`}
                                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    bookRef.current?.pageFlip()?.flipNext();
                                }}
                            >
                                <Icon icon="ph:caret-right" className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : 'w-[2.5vw] h-[2.5vw]'} group-active:scale-90 transition-transform`} />
                            </button>
                        </>
                    )}


                    {/* Page Counter Badge */}
                    {settings.navigation.pageQuickAccess && (
                        <div
                            className={`absolute right-[1.5vw] bottom-[2vh] rounded-[0.5vw] ${isMobileLandscape ? 'px-[0.4vw] py-[0.1vw]' : isTablet ? 'px-[0.4vw] py-[0.1vw]' : 'px-[1.2vw] py-[0.6vw]'} border border-gray-100 z-20`}
                            style={{
                                backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF')
                            }}
                        >
                            <span
                                className={`${isMobileLandscape ? 'text-[0.5vw]' : isTablet ? 'text-[0.6vw]' : 'text-[0.9vw]'} font-bold`}
                                style={{ color: getLayoutColor('search-text-v1', '#4B4B4B') }}
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
                                className={`${isMobileLandscape ? 'text-[0.5vw]' : isTablet ? 'text-[0.6vw]' : 'text-[0.9vw]'} font-bold bg-transparent border-none outline-none text-center`}
                                style={{
                                    width: `${String(pages.length).length + 1}ch`,
                                    color: getLayoutColor('search-text-v1', '#4B4B4B')
                                }}
                            />
                            <span
                                className={`${isMobileLandscape ? 'text-[0.5vw]' : isTablet ? 'text-[0.6vw]' : 'text-[0.9vw]'} font-bold`}
                                style={{ color: getLayoutColor('search-text-v1', '#4B4B4B') }}
                            > / {pagesCount}</span>
                        </div>
                    )}

                    {/* Flipbook Container Wrapper with Scaling */}
                    <div
                        className="relative flex items-center justify-center magazine-content-area"
                        style={{
                            transform: `scale(${responsiveScale}) translateX(${localOffset}px)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.6s ease-in-out'
                        }}
                    >
                        {modifiedChildren}
                    </div>
                </div>
            </div>

            {/* Layout 2 Footer */}
            <div className={isFullscreen ? 'absolute bottom-0 left-0 w-full z-[1000] bg-transparent' : 'shrink-0'}>
            <div
                className={`${isMobileLandscape ? 'h-[4.5vh] mb-[1.5vh]' : isTablet ? 'h-[5.5vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[2vw] w-full z-[1001] border-t border-white/10 transition-all duration-500 ease-in-out ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
                style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1') }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Continuous Line of Pagination Dots */}
                <div className={`flex-1 flex items-center justify-center ${isMobileLandscape ? 'gap-[0.3vw]' : 'gap-[0.5vw]'} relative ${isTablet ? 'h-[1.2vw]' : isMobileLandscape ? 'h-[1vw]' : 'h-[2vw]'}`}>
                    {spreads.map((spread, sIdx) => {
                        const isActive = sIdx === activeSpreadIdx;

                        return (
                            <div
                                key={sIdx}
                                className="relative flex items-center justify-center"
                                onMouseEnter={() => setHoveredDotIdx(sIdx)}
                                onMouseLeave={() => setHoveredDotIdx(null)}
                            >
                                <motion.div
                                    onClick={() => onPageClick(spread.indices[0])}
                                    className={`relative flex-shrink-0 ${isTablet ? 'h-[0.35vw]' : isMobileLandscape ? 'h-[0.25vw]' : 'h-[0.5vw]'} rounded-full cursor-pointer overflow-hidden transition-colors duration-300`}
                                    style={{
                                        backgroundColor: isActive
                                            ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.2')
                                            : getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.3'),
                                    }}
                                    animate={{
                                        width: isActive ? (isTablet ? '1.2vw' : isMobileLandscape ? '0.8vw' : '1.8vw') : (isTablet ? '0.35vw' : isMobileLandscape ? '0.25vw' : '0.5vw'),
                                    }}
                                    transition={{ duration: 0 }}
                                >
                                    {/* Fill Animation */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            width: isActive ? '100%' : '0%'
                                        }}
                                        transition={{ duration: 0 }}
                                        className={`absolute inset-y-0 ${direction === 'forward' ? 'left-0' : 'right-0'}`}
                                        style={{ backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                                    />
                                </motion.div>

                                {/* Hover Tooltip - Screenshot Style */}
                                <AnimatePresence>
                                    {hoveredDotIdx === sIdx && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
                                            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                                            exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
                                            transition={{ duration: 0.2 }}
                                            className={`absolute ${isMobileLandscape ? 'bottom-[calc(100%+0.5vw)]' : 'bottom-[calc(100%+2.2vw)]'} left-1/2 ${isTablet ? 'w-[7.5vw] rounded-[0.8vw] p-[0.35vw] pb-[0.25vw]' : isMobileLandscape ? 'w-[5vw] rounded-[0.6vw] p-[0.2vw] pb-[0.1vw]' : 'w-[9vw] rounded-[1vw] p-[0.4vw] pb-[0.3vw]'} z-[100] pointer-events-none border border-white/20`}
                                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                                        >
                                            <div
                                                className={`flex ${isTablet ? 'rounded-[0.6vw] h-[4.5vw] mb-[0.25vw]' : isMobileLandscape ? 'rounded-[0.4vw] h-[3vw] mb-[0.15vw]' : 'rounded-[0.8vw] h-[5.5vw] mb-[0.35vw]'} overflow-hidden border border-gray-100 items-center justify-center p-[0.2vw] gap-[0.25vw]`}
                                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                            >
                                                {spread.pages.map((p, pIdx) => (
                                                    <div key={pIdx} className="flex-1 max-w-[50%] h-full bg-white rounded-[0.4vw] overflow-hidden relative border border-gray-200">
                                                        <PageThumbnail html={p?.html || p?.content || ''} index={spread.indices[pIdx]} scale={isMobileLandscape ? 0.12 : 0.22} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div
                                                className={`text-center ${isTablet ? 'text-[0.55vw]' : isMobileLandscape ? 'text-[0.5vw]' : 'text-[0.9vw]'} font-medium pb-[0.1vw] whitespace-nowrap`}
                                                style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                            >
                                                {spread.label}
                                            </div>
                                            {/* Tooltip Arrow */}
                                            <div className={`absolute top-[calc(100%-2px)] left-1/2 -translate-x-1/2 ${isTablet ? 'w-[2vw] h-[1vw]' : isMobileLandscape ? 'w-[1.2vw] h-[0.6vw]' : 'w-[2.5vw] h-[1.3vw]'} flex items-start justify-center`}>
                                                <svg
                                                    viewBox="0 0 60 20"
                                                    className="w-full h-full"
                                                    style={{ fill: getLayoutColor('dropdown-bg', '#575C9C') }}
                                                    preserveAspectRatio="none"
                                                >
                                                    <path d="M0,0 C15,0 25,2 30,20 C35,2 45,0 60,0 Z" />
                                                </svg>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Zoom Mini-Pill Cluster - Refined Screenshot Style */}
                <div className="flex items-center absolute right-[2vw]">
                    <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.4vw] px-[0.2vw] py-[0.2vw] pl-[0.5vw] rounded-[0.3vw]' : isTablet ? 'gap-[0.5vw] px-[0.2vw] py-[0.2vw] pl-[0.6vw] rounded-[0.4vw]' : 'gap-[0.7vw] px-[0.25vw] py-[0.25vw] pl-[0.8vw] rounded-[0.45vw]'} bg-white/20 backdrop-blur-sm border border-white/10`}>
                        <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.3vw]' : isTablet ? 'gap-[0.4vw]' : 'gap-[0.6vw]'}`}>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                className="hover:scale-110 transition-transform active:scale-95 flex items-center"
                                style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                            >
                                <Icon icon="fad:zoomin" className={`${isMobileLandscape ? 'w-[0.6vw] h-[0.6vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} />
                            </button>
                            <span
                                className={`font-bold ${isMobileLandscape ? 'text-[0.6vw] min-w-[1.5vw]' : isTablet ? 'text-[0.65vw] min-w-[2.5vw]' : 'text-[0.85vw] min-w-[2.5vw]'} tracking-tight tabular-nums select-none`}
                                style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                            >
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                className="hover:scale-110 transition-transform active:scale-95 flex items-center"
                                style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                            >
                                <Icon icon="fad:zoomout" className={`${isMobileLandscape ? 'w-[0.6vw] h-[0.6vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`${isMobileLandscape ? 'text-[0.55vw] px-[0.5vw] py-[0.2vw] rounded-[0.2vw]' : isTablet ? 'text-[0.55vw] px-[0.6vw] py-[0.2vw] rounded-[0.3vw]' : 'text-[0.78vw] px-[0.8vw] py-[0.3vw] rounded-[0.35vw]'} font-bold transition-all active:scale-95`}
                            style={{
                                backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.2'),
                                color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1'),
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* High-Fidelity 360-degree Radial Preview System (SVG Matched - Indigo Theme) */}
            <AnimatePresence>
                {showRadialThumbnails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[200] flex items-center justify-end bg-transparent overflow-hidden pb-[8vh]"
                        onClick={() => setShowRadialThumbnails(false)}
                        onWheel={handleRadialWheel}
                    >
                        {/* Master SVG Definitions */}
                        <svg className="absolute w-0 h-0 invisible">
                            <defs>
                                <filter id="clean-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                                    <feOffset dx="0" dy="4" />
                                    <feComponentTransfer><feFuncA type="linear" slope="0.25" /></feComponentTransfer>
                                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>
                        </svg>

                        {/* Compact Full-Circle System - Sized to fit between Top/Bottom Bars */}
                        <div
                            className="relative w-[70vh] h-[70vh] flex items-center justify-center pointer-events-none"
                            style={{ transform: 'translateX(38%) translateY(8%)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* 1. Transparent Orbit Track (Geometric Reference) */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    border: `14.5vh solid ${getLayoutColorRgba('dropdown-bg', '62, 68, 145', '0.1')}`,
                                    boxSizing: 'border-box',
                                    filter: 'blur(4px)',
                                    pointerEvents: 'none',
                                }} />
                                <svg viewBox="0 0 888 888" className="w-full h-full pointer-events-none" style={{ position: 'absolute' }}>
                                    <defs>
                                        <radialGradient id="ringFillGradient" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                                            <stop offset="0%" stopColor="white" stopOpacity="0" />
                                            <stop offset="56%" stopColor="white" stopOpacity="0" />
                                            <stop offset="60%" stopColor={getLayoutColor('dropdown-bg', '#3E4491')} stopOpacity="0.1" />
                                            <stop offset="70%" stopColor={getLayoutColor('dropdown-bg', '#3E4491')} stopOpacity="0.05" />
                                            <stop offset="94%" stopColor={getLayoutColor('dropdown-bg', '#3E4491')} stopOpacity="0.05" />
                                            <stop offset="98%" stopColor={getLayoutColor('dropdown-bg', '#3E4491')} stopOpacity="0.1" />
                                            <stop offset="100%" stopColor={getLayoutColor('dropdown-bg', '#3E4491')} stopOpacity="0.1" />
                                        </radialGradient>
                                    </defs>
                                    <path
                                        d="M444 0C689.214 0 888 198.786 888 444C888 689.214 689.214 888 444 888C198.786 888 0 689.214 0 444C0 198.786 198.786 0 444 0ZM444 184C300.4 184 184 300.4 184 444C184 587.6 300.4 704 444 704C587.6 704 704 587.6 704 444C704 300.4 587.6 184 444 184Z"
                                        fill="url(#ringFillGradient)"
                                    />
                                </svg>
                            </div>

                            {/* 2. Map All Pages to Circle */}
                            {(() => {
                                const baseAngle = 180; // center of visibility at 9 o'clock
                                const orbitRadius = 39.6; // Midpoint of ring
                                const focusIndex = activeSpreadIdx + radialScroll;

                                const parentRotation = -focusIndex * angleStep;

                                return (
                                    <motion.div
                                        className="absolute inset-0 z-10 pointer-events-none"
                                        animate={{ rotate: parentRotation }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 120,
                                            damping: 20,
                                            mass: 0.8
                                        }}
                                    >
                                        {displaySpreads.map((spread, i) => {
                                            const fixedAngleDeg = baseAngle + i * angleStep;
                                            const fixedAngleRad = fixedAngleDeg * (Math.PI / 180);
                                            const x = 50 + orbitRadius * Math.cos(fixedAngleRad);
                                            const y = 50 + orbitRadius * Math.sin(fixedAngleRad);

                                            // Handle active state with modulo for infinite rotation
                                            const rawFocusedIdx = Math.round(focusIndex);
                                            const mappedFocusedIdx = ((rawFocusedIdx % displaySpreads.length) + displaySpreads.length) % displaySpreads.length;
                                            const isActive = (hoveredIdx !== null ? (hoveredIdx === i) : (mappedFocusedIdx === i));

                                            return (
                                                <motion.div
                                                    key={i}
                                                    className="absolute pointer-events-auto cursor-pointer flex items-center justify-center p-0"
                                                    style={{
                                                        left: `${x}%`,
                                                        top: `${y}%`,
                                                        width: '14vh',
                                                        height: '11vh',
                                                        marginLeft: '-7vh',
                                                        marginTop: '-5.5vh',
                                                        zIndex: isActive ? 50 : 10,
                                                    }}
                                                    animate={{
                                                        rotate: fixedAngleDeg + 90,
                                                        scale: isActive ? 1.05 : 1
                                                    }}
                                                    transition={{ duration: 0 }}
                                                    onMouseEnter={() => setHoveredIdx(i)}
                                                    onMouseLeave={() => setHoveredIdx(null)}
                                                    onClick={() => { onPageClick(spread.indices[0]); setShowRadialThumbnails(false); }}
                                                >
                                                    <svg viewBox="0 0 170 173" className="w-full h-full overflow-visible">
                                                        <g transform="rotate(90, 85, 86.5)">
                                                            <path
                                                                d="M9.29472 11.4862C11.1722 3.10828 19.7989 -1.79399 28.0408 0.611489L161.222 39.4818C168.942 41.7352 173.506 49.6146 172.035 57.5216C167.9 79.7315 167.621 96.4086 170.486 118.929C171.485 126.787 166.576 134.264 158.88 136.14L24.4315 168.911C16.05 170.953 7.62316 165.607 6.15266 157.106C-2.91853 104.667 -2.03183 62.0294 9.29472 11.4862Z"
                                                                fill={getLayoutColor('dropdown-bg', '#3E4491')}
                                                                className="transition-colors duration-300"
                                                            />
                                                        </g>
                                                        <text
                                                            x="50%"
                                                            y="50%"
                                                            fill={getLayoutColor('toc-text', '#FFFFFF')}
                                                            fontSize="20"
                                                            fontWeight="bolder"
                                                            textAnchor="middle"
                                                            alignmentBaseline="middle"
                                                            style={{ letterSpacing: '0.04em' }}
                                                            className="select-none opacity-90"
                                                            transform="rotate(90, 85, 86.5)"
                                                        >
                                                            {spread.label}
                                                        </text>
                                                    </svg>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                );
                            })()}

                            {/* 3. Center hub Preview Area */}
                            <motion.div
                                className="absolute w-[42vh] h-[42vh] z-[100] flex items-center justify-center pointer-events-none"
                            >
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute z-[150] flex items-center" style={{ transform: 'translateX(-5vh)' }}>
                                        <div className="w-[1vw] h-[1vw] bg-white rotate-45 -mr-[0.5vw] rounded-[0.08vw]" />
                                        <div className="w-[10vw] h-[7vw] bg-white rounded-[0.4vw] p-[0.3vw] flex items-center justify-center border border-gray-100/80">
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center relative overflow-hidden rounded-[0.25vw]">
                                                {(() => {
                                                    if (!displaySpreads || displaySpreads.length === 0) return null;
                                                    const rawFocusIdx = Math.round(activeSpreadIdx + radialScroll);
                                                    const mappedFocusIdx = ((rawFocusIdx % displaySpreads.length) + displaySpreads.length) % displaySpreads.length;
                                                    const hubSpreadIdx = hoveredIdx !== null ? (hoveredIdx % spreads.length) : (displaySpreads[mappedFocusIdx] ? (mappedFocusIdx % spreads.length) : 0);
                                                    const hubSpread = spreads[hubSpreadIdx] || spreads[0];
                                                    if (!hubSpread || !hubSpread.pages) return null;
                                                    return (
                                                        <div className="flex w-full h-full gap-[0.2vw] items-center justify-center bg-gray-50">
                                                            {hubSpread.pages.map((p, pIdx) => (
                                                                <div key={pIdx} className="flex-1 max-w-[50%] h-full bg-white rounded-[0.2vw] overflow-hidden relative border border-gray-200">
                                                                    <PageThumbnail html={p?.html || p?.content || ''} index={hubSpread.indices[pIdx]} scale={0.2} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>



                        {/* Exit Button */}
                        <div className="absolute top-[3vh] right-[3vh]">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowRadialThumbnails(false); }}
                                className="w-[3.5vw] h-[3.5vw] flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-all group"
                            >
                                <Icon icon="ph:x-bold" className="w-[1.4vw] h-[1.4vw] group-hover:scale-110" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            </div>
            {/* Popups handled by PreviewArea */}
        </div>
    );
};

export default Grid2Layout;
