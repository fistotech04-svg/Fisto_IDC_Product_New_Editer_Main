import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileLayout1 from '../Mobile/MobileLayouts/MobileLayout1';

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

const hexToRgb = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '255, 255, 255';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `${r}, ${g}, ${b}`;
};

const getLayoutColor = (id, defaultColor) =>
    `rgba(var(--${id}-rgb, ${hexToRgb(defaultColor)}), var(--${id}-opacity, 1))`;

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
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

const Grid4Layout = ({
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
    showSoundPopup,
    setShowSoundPopupMemo,
    setShowGalleryPopupMemo,
    activeLayout,
    isTablet,
    isMobile,
    isMobileLandscape = false
}) => {
    // If mobile view is active, delegate entirely to MobileLayout1 (as fallback)
    if (isMobile && !isMobileLandscape) {
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
                bookmarks={bookmarks}
                onDeleteBookmark={onDeleteBookmark}
                onUpdateBookmark={onUpdateBookmark}
                notes={notes}
                onAddNote={onAddNote}
                profileSettings={profileSettings}
                activeLayout={activeLayout}
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

    const totalPages = pagesCount;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [showTOC, setShowTOC] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const scrollRef = useRef(null);
    const buttonsRef = useRef(null);
    const sidebarContentRef = useRef(null);
    const previewAreaRef = useRef(null);
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
        if (!progressRef.current || totalPages <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (totalPages - 1));
        onPageClick(targetIdx);
    };

    const handleProgressMouseMove = (e) => {
        if (!progressRef.current || totalPages <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
        progressHoverRef.current = requestAnimationFrame(() => {
            const boundedX = Math.max(0, Math.min(x, rect.width));
            const percentage = boundedX / rect.width;
            let targetIdx = Math.round(percentage * (totalPages - 1));

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

    useEffect(() => {
        setLocalSearchQuery(searchQuery);
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



    useEffect(() => {
        if (showThumbnails && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [currentPage, showThumbnails]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showThumbnails || showTOC || showProfile || showBookmarkOptions || showSoundPopup) {
                const isClickOnPreview = previewAreaRef.current?.contains(event.target);

                if (isClickOnPreview) {
                    setShowThumbnails(false);
                    setShowTOC(false);
                    setShowProfile(false);
                    setShowBookmarkOptions(false);
                    setShowSoundPopupMemo?.(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showThumbnails, showTOC, showProfile, showBookmarkOptions, showSoundPopup, setShowSoundPopupMemo]);


    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans" style={backgroundStyle} onClick={() => setRecommendations([])}>
            {/* Top Bar: Brand - Title - Search */}
            <div className={`${isMobileLandscape ? 'h-[12%]' : isTablet ? 'h-[5.5vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50 relative border-b border-white/5 shadow-lg`} style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                <div className="flex items-center">
                    {settings.brandingProfile.logo && logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Logo"
                            className={`${isTablet ? 'h-[1.5vw]' : 'h-[2vw]'} w-auto transition-all`}
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>

                <div className={`absolute left-1/2 -translate-x-1/2 text-center pointer-events-none ${isMobileLandscape ? 'mt-[1.5vh]' : ''}`}>
                    <span className={`text-white ${isMobileLandscape ? 'text-[2.2vw]' : isTablet ? 'text-[1.1vw]' : 'text-[1.25vw]'} font-medium tracking-tight whitespace-nowrap`}>{bookName}</span>
                </div>

                <div className={`relative ${isMobileLandscape ? 'mr-[5vw]' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className={`flex items-center ${isMobileLandscape ? 'px-[1.5vw] py-[1vh] w-[22vw]' : isTablet ? 'px-[0.6vw] py-[0.3vw] w-[13vw]' : 'px-[1vw] py-[0.5vh] w-[16vw]'} shadow-inner border border-gray-100/30 transition-all relative z-[101]`}
                        style={{ backgroundColor: getLayoutColor('search-bg-v2', '#E0E3F5') }}>
                        <Icon icon="lucide:search" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'}`} style={{ color: getLayoutColor('search-text-v1', '#575C9C') }} />
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
                            className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.68vw]' : 'text-[0.9vw]'} ml-[0.8vw] w-full font-medium`}
                            style={{
                                color: getLayoutColor('search-text-v1', '#575C9C'),
                                '--placeholder-color': getLayoutColorRgba('search-text-v1', '87, 92, 156', '0.7')
                            }}
                        />
                    </div>

                    {/* Recommendations Dropdown */}
                    {recommendations.length > 0 && (
                        <div className={`absolute top-full left-0 ${isTablet ? 'w-[13vw]' : 'w-[16vw]'} shadow-2xl z-[100] overflow-hidden -mt-[1px] bg-white animate-in fade-in slide-in-from-top-1 duration-200`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-full h-full border-x border-b border-gray-100"
                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                            >
                                <div className="px-[1.2vw] py-[1.2vh]">
                                    <span className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Suggestion</span>
                                </div>
                                <div className="flex flex-col pb-[1vh]">
                                    {recommendations.map((rec, idx) => (
                                        <div key={`${rec.word}-${rec.pageNumber}-${idx}`}>
                                            <button
                                                className="flex items-center justify-between px-[1.2vw] py-[0.8vh] hover:bg-black/5 transition-colors group w-full text-left"
                                                style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                    setLocalSearchQuery(fullQuery);
                                                    setSearchQuery(fullQuery);
                                                    setRecommendations([]);
                                                }}
                                            >
                                                <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.9vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                        <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                        {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                    </span>
                                                </div>
                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium opacity-80 tabular-nums shrink-0`}>Pg {rec.pageNumber}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Middle Container */}
            <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
                {/* Left Sidebar */}
                <div ref={buttonsRef} className={`${isMobileLandscape ? 'w-[10vw] items-end pr-[1.5vw]' : isTablet ? 'w-[3vw] items-center' : 'w-[4.2vw] items-center'} flex flex-col py-[2vh] gap-[${isMobileLandscape ? '3.5vh' : isTablet ? '2vh' : '3vh'}] border-r border-white/5 shadow-xl z-40 shrink-0`} style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                    <button
                        onClick={() => {
                            setShowTOC(!showTOC);
                            setShowThumbnails(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                            setShowNotesOptions(false);
                            setShowSoundPopupMemo?.(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="fluent:text-bullet-list-24-filled" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            setShowThumbnails(!showThumbnails);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                            setShowNotesOptions(false);
                            setShowSoundPopupMemo?.(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="ph:squares-four-fill" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNotesOptions(!showNotesOptions);
                                setShowBookmarkOptions(false);
                                setShowThumbnails(false);
                                setShowTOC(false);
                                setShowProfile(false);
                                setShowSoundPopupMemo?.(false);
                            }}
                            className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                        >
                            <Icon icon="material-symbols-light:add-notes" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>

                        {showNotesOptions && (
                            <div
                                className={`absolute left-full ml-[0.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[10vw]' : 'w-[12.5vw]'} shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 border border-black/5 bg-white`}
                            >
                                <div
                                    className="w-full h-full"
                                    style={{
                                        backgroundColor: `rgba(var(--dropdown-bg-rgb, 255, 255, 255), max(0.4, var(--dropdown-bg-opacity, 1)))`
                                    }}
                                >
                                    <button
                                        className="w-full flex items-center px-[0.8vw] py-[1vh] transition-all gap-[0.8vw] text-left group hover:bg-black/5 active:bg-black/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAddNotesPopupMemo(true);
                                            setShowNotesOptions(false);
                                        }}
                                    >
                                        <Icon
                                            icon="solar:notes-bold"
                                            className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'} group-hover:scale-110 transition-transform`}
                                            style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                        />
                                        <span
                                            className={`${isMobileLandscape ? 'text-[1.3vw]' : isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]'} font-bold tracking-tight transition-colors`}
                                            style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                        >
                                            Add Notes
                                        </span>
                                    </button>
                                    <button
                                        className="w-full flex items-center px-[0.8vw] py-[1vh] transition-all gap-[0.8vw] text-left group hover:bg-black/5 active:bg-black/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowNotesViewerMemo(true);
                                            setShowNotesOptions(false);
                                        }}
                                    >
                                        <Icon
                                            icon="lets-icons:view-duotone"
                                            className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'} group-hover:scale-110 transition-transform`}
                                            style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                        />
                                        <span
                                            className={`${isMobileLandscape ? 'text-[1.3vw]' : isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]'} font-bold tracking-tight transition-colors`}
                                            style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                        >
                                            View Notes
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowBookmarkOptions(!showBookmarkOptions);
                                setShowTOC(false);
                                setShowThumbnails(false);
                                setShowProfile(false);
                                setShowNotesOptions(false);
                                setShowSoundPopupMemo?.(false);
                            }}
                            className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                        >
                            <Icon icon="fluent:bookmark-24-filled" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>

                        {showBookmarkOptions && (
                            <div
                                className={`absolute left-full ml-[0.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[10vw]' : 'w-[12.5vw]'} shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 border border-black/5 bg-white`}
                            >
                                <div
                                    className="w-full h-full"
                                    style={{
                                        backgroundColor: `rgba(var(--dropdown-bg-rgb, 255, 255, 255), max(0.4, var(--dropdown-bg-opacity, 1)))`
                                    }}
                                >
                                    <button
                                        className="w-full flex items-center px-[0.8vw] py-[1vh] transition-all gap-[0.8vw] text-left group hover:bg-black/5 active:bg-black/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAddBookmarkPopupMemo(true);
                                            setShowBookmarkOptions(false);
                                        }}
                                    >
                                        <Icon
                                            icon="mingcute:bookmark-fill"
                                            className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'} group-hover:scale-110 transition-transform`}
                                            style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                        />
                                        <span
                                            className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]'} font-bold tracking-tight transition-colors`}
                                            style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                        >
                                            Add Bookmark
                                        </span>
                                    </button>
                                    <button
                                        className="w-full flex items-center px-[0.8vw] py-[1vh] transition-all gap-[0.8vw] text-left group hover:bg-black/5 active:bg-black/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowViewBookmarkPopup(true);
                                            setShowBookmarkOptions(false);
                                        }}
                                    >
                                        <Icon
                                            icon="lets-icons:view-duotone"
                                            className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'} group-hover:scale-110 transition-transform`}
                                            style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                        />
                                        <span
                                            className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]'} font-bold tracking-tight transition-colors`}
                                            style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                        >
                                            View Bookmark
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setShowGalleryPopupMemo(true);
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                            setShowNotesOptions(false);
                            setShowSoundPopupMemo?.(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="clarity:image-gallery-solid" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSoundPopupMemo?.(!showSoundPopup);
                            setShowBookmarkOptions(false);
                            setShowNotesOptions(false);
                            setShowTOC(false);
                            setShowThumbnails(false);
                            setShowProfile(false);
                        }}
                        className="transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: isMuted ? getLayoutColorRgba('toolbar-icon', '255, 255, 255', '0.3') : getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="solar:music-notes-bold" className={`${isMobileLandscape ? 'w-[2.2vw] h-[2.2vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            setShowProfile(!showProfile);
                            setShowTOC(false);
                            setShowThumbnails(false);
                            setShowBookmarkOptions(false);
                            setShowNotesOptions(false);
                            setShowSoundPopupMemo?.(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="fluent:person-24-filled" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            handleShare();
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                            setShowNotesOptions(false);
                            setShowSoundPopupMemo?.(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="mage:share-fill" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            handleDownload();
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                            setShowNotesOptions(false);
                            setShowSoundPopupMemo?.(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="meteor-icons:download" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            handleFullScreen();
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                            setShowNotesOptions(false);
                            setShowSoundPopupMemo?.(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                </div>

                {/* Vertical Thumbnail Sidebar Integration */}
                {showThumbnails && (
                    <div className={`absolute ${isMobileLandscape ? 'left-[7.5vw] w-[16vw]' : isTablet ? 'left-[3vw] w-[14vw]' : 'left-[4.2vw] w-[16vw]'} h-full bg-white z-30 border-r border-gray-200`}>
                        <div ref={sidebarContentRef} className="flex flex-col h-full animate-in slide-in-from-left duration-300"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-[1vw] py-[1.5vh] border-b border-gray-100">
                                <span className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Thumbnail</span>
                                <button
                                    onClick={() => setShowThumbnails(false)}
                                    className="transition-colors opacity-60 hover:opacity-100"
                                    style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                >
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                </button>
                            </div>

                            {/* Vertically Scrollable List */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto custom-scrollbar p-[1vw] flex flex-col gap-[2vh]"
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex flex-col items-center cursor-pointer group transition-all ${isSelected ? 'scale-105 active-thumbnail' : 'hover:scale-102'}`}
                                            onClick={() => onPageClick(spread.indices[0])}
                                        >
                                            <div
                                                className={`relative bg-white shadow-md rounded-[0.2vw] overflow-hidden border-[0.15vw] transition-all p-[0.3vw] ${isSelected ? 'shadow-lg active-thumbnail' : 'border-gray-200 group-hover:border-gray-300'}`}
                                                style={{
                                                    width: '9vw',
                                                    height: '6.5vw',
                                                    borderColor: isSelected ? getLayoutColor('thumbnail-inner-v2', '#3E4491') : 'transparent'
                                                }}
                                            >
                                                <div className="flex w-full h-full gap-[1px] bg-gray-100 justify-center">
                                                    {spread.pages.map((page, pIdx) => {
                                                        const pageWidth = 400;
                                                        const pageHeight = 566;
                                                        const availableWidth = (window.innerWidth * 0.045);
                                                        const availableHeight = (window.innerWidth * 0.06);
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
                                            <span className={`mt-[0.5vh] ${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-bold transition-all`}
                                                style={{ color: isSelected ? getLayoutColor('thumbnail-inner-v2', '#3E4491') : getLayoutColor('dropdown-text', '#666666') }}
                                            >
                                                {spread.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vertical Table of Contents Sidebar */}
                {showTOC && (
                    <div className={`absolute ${isMobileLandscape ? 'left-[7.5vw] w-[16vw]' : isTablet ? 'left-[3vw] w-[11vw]' : 'left-[4.2vw] w-[16vw]'} h-full bg-white z-30 border-r border-gray-200`}>
                        <div ref={sidebarContentRef} className="flex flex-col h-full animate-in slide-in-from-left duration-300"
                            style={{ backgroundColor: getLayoutColor('toc-bg', '#FFFFFF') }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-[1vw] py-[1.5vh]">
                                <span className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-semibold`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</span>
                                <button
                                    onClick={() => setShowTOC(false)}
                                    className="transition-colors opacity-70 hover:opacity-100"
                                    style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                >
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                </button>
                            </div>

                            {/* Search Bar */}
                            {(settings.tocSettings?.addSearch !== false) && (
                                <div className="px-[1vw] pb-[1.5vh]">
                                    <div className="relative">
                                        <Icon
                                            icon="lucide:search"
                                            className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 w-[0.85vw] h-[0.85vw]"
                                            style={{ color: getLayoutColor('toc-text', '#575C9C'), opacity: 0.6 }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={tocSearchQuery}
                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                            className="w-full rounded-[0.3vw] pl-[2vw] pr-[0.8vw] py-[0.4vw] text-[0.8vw] outline-none transition-colors border shadow-sm focus:ring-1"
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: getLayoutColor('toc-text', '#575C9C'),
                                                borderColor: getLayoutColorRgba('toc-text', '87, 92, 156', '0.2')
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* List Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-[1vw] flex flex-col">
                                {(() => {
                                    const safeContent = Array.isArray(settings.tocSettings?.content) ? settings.tocSettings.content : [];
                                    const filteredContent = safeContent.map(heading => {
                                        const matchesHeading = (heading?.title || '').toLowerCase().includes((tocSearchQuery || '').toLowerCase());
                                        const filteredSubheadings = heading?.subheadings?.filter(sub =>
                                            (sub?.title || '').toLowerCase().includes((tocSearchQuery || '').toLowerCase())
                                        ) || [];

                                        if (matchesHeading || filteredSubheadings.length > 0) {
                                            return {
                                                ...heading,
                                                subheadings: matchesHeading ? heading.subheadings : filteredSubheadings
                                            };
                                        }
                                        return null;
                                    }).filter(Boolean);

                                    return filteredContent.length > 0 ? (
                                        filteredContent.map((heading, hIdx) => (
                                            <div key={heading.id} className={`${hIdx > 0 ? 'mt-[1.5vh]' : ''}`}>
                                                <div
                                                    className="flex items-center justify-between py-[0.6vh] rounded-[0.3vw] cursor-pointer transition-colors"
                                                    style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                    onClick={() => onPageClick && onPageClick(heading.page - 1)}
                                                >
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium truncate pr-[0.5vw] flex items-center`}>
                                                        {(settings.tocSettings?.addSerialNumberHeading !== false) && <span className="mr-1">{hIdx + 1}.</span>}
                                                        {heading.title}
                                                    </span>
                                                    {settings.tocSettings?.addPageNumber !== false && (
                                                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium tabular-nums ml-[0.3vw]`}>
                                                            {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-col">
                                                    {heading.subheadings?.map((sub, sIdx) => (
                                                        <div
                                                            key={sub.id}
                                                            className="flex items-center justify-between py-[0.6vh] rounded-[0.3vw] cursor-pointer transition-colors pl-[1vw]"
                                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                            onClick={() => onPageClick && onPageClick(sub.page - 1)}
                                                        >
                                                            <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-normal truncate pr-[0.5vw] flex items-center`}>
                                                                {(settings.tocSettings?.addSerialNumberSubheading !== false) && <span className="mr-1">{hIdx + 1}.{sIdx + 1}</span>}
                                                                {sub.title}
                                                            </span>
                                                            {settings.tocSettings?.addPageNumber !== false && (
                                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-normal tabular-nums ml-[0.2vw]`}>
                                                                    {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-[0.8vw] text-center pt-[10vw] opacity-60 font-medium" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                            No Table Of Content Found
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vertical Profile Sidebar */}
                {showProfile && (
                    <div className={`absolute ${isMobileLandscape ? 'left-[7.5vw] w-[16vw]' : isTablet ? 'left-[3vw] w-[14vw]' : 'left-[4.2vw] w-[16vw]'} h-full bg-white z-30 border-r border-gray-200`}>
                        <div ref={sidebarContentRef} className="flex flex-col h-full animate-in slide-in-from-left duration-300"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-[1vw] py-[1.5vh] border-b" style={{ borderColor: getLayoutColorRgba('dropdown-text', '62, 68, 145', '0.2') }}>
                                <span className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-semibold`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Profile</span>
                                <button
                                    onClick={() => setShowProfile(false)}
                                    className="transition-colors opacity-60 hover:opacity-100"
                                    style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                >
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-[1vw] flex flex-col gap-[1.5vh] overflow-y-auto custom-scrollbar">
                                {profileSettings?.name || profileSettings?.about ? (
                                    <>
                                        <div className="flex items-start gap-[0.5vw]">
                                            <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold whitespace-nowrap`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Name :</span>
                                            <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium opacity-80`} style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>{profileSettings?.name}</span>
                                        </div>

                                        <div className="flex flex-col gap-[0.5vh]">
                                            <div className="flex items-start gap-[0.5vw]">
                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold whitespace-nowrap`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>About :</span>
                                                <div className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium leading-relaxed text-justify opacity-80`} style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>
                                                    {profileSettings?.about}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-[1vh]">
                                            <h3 className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-bold mb-[1vh]`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Contact</h3>
                                            <div className="flex items-center gap-[0.75vw] flex-wrap">
                                                {profileSettings?.contacts?.filter(c => c.value).map((contact) => (
                                                    <button
                                                        key={contact.id}
                                                        className={`${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.2vw] h-[2.2vw]'} rounded-[0.5vw] flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${contact.type === 'x' ? 'bg-black' :
                                                            contact.type === 'facebook' ? 'bg-[#3138A9]' :
                                                                contact.type === 'instagram' ? 'bg-gradient-to-tr from-[#FFD600] via-[#FF0100] to-[#D800FF]' :
                                                                    'bg-white border border-gray-300'
                                                            }`}
                                                    >
                                                        {contact.type === 'x' && <Icon icon="ri:twitter-x-fill" className={`text-white ${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />}
                                                        {contact.type === 'facebook' && <Icon icon="ri:facebook-fill" className={`text-white ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />}
                                                        {(contact.type === 'email' || contact.type === 'gmail') && <Icon icon="logos:google-gmail" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />}
                                                        {contact.type === 'instagram' && <Icon icon="ri:instagram-line" className={`text-white ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />}
                                                        {(contact.type === 'phone' || contact.type === 'contact') && <Icon icon="ph:phone-fill" className={`text-[#4B4EFC] ${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'} -rotate-90`} />}
                                                        {contact.type === 'linkedin' && <Icon icon="logos:linkedin-icon" width={isTablet ? '1vw' : '1.3vw'} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-[0.85vw] text-center pt-[10vw] opacity-60 font-medium" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>
                                        No profile found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas Area */}
                <div ref={previewAreaRef} className="flex-1 flex flex-col min-w-0 relative bg-[#DADBE8]/20"
                    onClick={() => {
                        setRecommendations([]);
                        setShowNotesOptions(false);
                        setShowBookmarkOptions(false);
                    }}
                >
                    {/* Navigation Arrows */}
                    <button
                        className={`absolute left-[3vw] top-1/2 -translate-y-1/2 hover:scale-110 transition-all z-20 flex items-center justify-center ${isTablet ? 'w-[2.2vw] h-[2.2vw]' : 'w-[2.8vw] h-[2.8vw]'} rounded-full`}
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.15') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                    >
                        <Icon icon="lucide:chevron-left" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                    <button
                        className={`absolute right-[3vw] top-1/2 -translate-y-1/2 hover:scale-110 transition-all z-20 flex items-center justify-center ${isTablet ? 'w-[2.2vw] h-[2.2vw]' : 'w-[2.8vw] h-[2.8vw]'} rounded-full`}
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.15') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                    >
                        <Icon icon="lucide:chevron-right" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>

                    {/* Page Indicator Badge */}
                    <div className={`absolute left-[1.5vw] bottom-[1.5vw] rounded-[0.4vw] ${isTablet ? 'px-[0.6vw] py-[0.3vw]' : 'px-[0.8vw] py-[0.4vw]'} shadow-md z-20`}
                        style={{ backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF') }}
                    >
                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}>Page </span>
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
                            className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium bg-transparent border-none outline-none text-center p-0`}
                            style={{ width: `${String(pages.length).length + 1}ch`, color: getLayoutColor('search-text-v1', '#575C9C') }}
                        />
                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}> / {totalPages}</span>
                    </div>


                    {/* Book Flip Content */}
                    <div className="flex-1 flex items-center justify-center relative">
                        <div
                            className="transition-transform duration-600 ease-in-out"
                            style={{
                                transform: `translateX(${localOffset}px) scale(1)`,
                                transformOrigin: 'center center'
                            }}
                        >
                            {modifiedChildren}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar: Multi-Region Integration */}
            <div className={`${isMobileLandscape ? 'h-[12%]' : isTablet ? 'h-[5vh]' : 'h-[9vh] mb-[2.5vh]'} flex items-center justify-between px-[2.5vw] shrink-0 w-full relative z-40 border-t border-white/5`} style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}>
                {/* Left: Playback Icons */}
                <div className="flex items-center gap-[1.5vw]">
                    <button onClick={() => onPageClick && onPageClick(0)} className="hover:scale-110 transition-all p-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon="lucide:skip-back" className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />
                    </button>
                    <button onClick={() => setIsPlaying(!isAutoFlipping)} className="hover:scale-110 transition-all p-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isMobileLandscape ? 'w-[1.4vw] h-[1.4vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                    <button onClick={() => onPageClick && onPageClick(totalPages - 1)} className="hover:scale-110 transition-all p-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon="lucide:skip-forward" className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />
                    </button>
                </div>

                {/* Center: Progress Bar Area */}
                <div
                    ref={progressRef}
                    className="flex-1 mx-[5vw] relative group cursor-pointer"
                    onClick={handleProgressClick}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={() => {
                        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                        setProgressHover(prev => ({ ...prev, visible: false }));
                    }}
                >
                    <div className="h-[0.4vh] rounded-full relative overflow-hidden">
                        {/* Track Underlay (before fill) */}
                        <div
                            className="absolute inset-0 transition-colors duration-300"
                            style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: isTablet ? 0.4 : 0.3 }}
                        />
                        {/* Progress Fill (after fill) */}
                        <div
                            className="h-full transition-all duration-300 ease-out relative z-10"
                            style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                opacity: isTablet ? 1 : 'var(--toolbar-icon-opacity, 1)'
                            }}
                        />
                    </div>

                    {/* Hover Popup */}
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
                                        transform: 'translateX(-50%)',
                                        minWidth: isTablet ? '7vw' : '9vw'
                                    }}
                                >
                                    <div className="w-full flex flex-col items-center px-[0.3vw]">
                                        <span
                                            className="font-bold whitespace-nowrap"
                                            style={{
                                                fontSize: isMobileLandscape ? '1.2vw' : isTablet ? '0.7vw' : '0.85vw',
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
                                        />

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

                                    {/* Arrow fixed at center of popup */}
                                    <div
                                        className="absolute top-full w-0 h-0 border-solid border-l-transparent border-r-transparent shadow-xl"
                                        style={{
                                            borderTopWidth: isTablet ? '0.6vw' : '0.8vw',
                                            borderLeftWidth: isTablet ? '0.5vw' : '0.6vw',
                                            borderRightWidth: isTablet ? '0.5vw' : '0.6vw',
                                            borderTopColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            filter: 'drop-shadow(0px 8px 10px rgba(0, 0, 0, 0.2))'
                                        }}
                                    ></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Zoom Pill */}
                <div className="flex items-center">
                    <div className="flex items-center rounded-[0.5vw] p-[0.3vw] pl-[0.8vw] gap-[1vw] border shadow-sm"
                        style={{
                            backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF'),
                            borderColor: getLayoutColorRgba('search-text-v1', '87, 92, 156', '0.1')
                        }}
                    >
                        <div className="flex items-center gap-[0.8vw]">
                            <button onClick={(e) => { e.stopPropagation(); zoomOut(); }} className="hover:scale-110" style={{ color: getLayoutColor('search-text-v1', '#3E4491') }}>
                                <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.8vw]' : 'w-[0.9vw]'} ${isTablet ? 'h-[0.8vw]' : 'h-[0.9vw]'}`} />
                            </button>
                            <span className={`font-bold ${isMobileLandscape ? 'text-[1.2vw]' : isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} tabular-nums min-w-[2.5vw] text-center`} style={{ color: getLayoutColor('search-text-v1', '#3E4491') }}>
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); zoomIn(); }} className="hover:scale-110" style={{ color: getLayoutColor('search-text-v1', '#3E4491') }}>
                                <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.8vw]' : 'w-[0.9vw]'} ${isTablet ? 'h-[0.8vw]' : 'h-[0.9vw]'}`} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`${isMobileLandscape ? 'text-[1.2vw]' : isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold px-[0.8vw] py-[0.35vw] rounded-[0.4vw] active:scale-95 transition-all shadow-sm`}
                            style={{ backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF'), color: getLayoutColor('search-text-v1', '#3E4491') }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Grid4Layout;

