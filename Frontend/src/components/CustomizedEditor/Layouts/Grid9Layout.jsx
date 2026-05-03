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

const Grid9Layout = ({
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
    showTOC,
    showProfilePopup,
    showGalleryPopup,
    showSoundPopup,
    showThumbnailBar,
    setShowSoundPopupMemo,
    layoutColors,
    isTablet,
    otherSetupSettings,
    isFlipMuted,
    setIsFlipMuted
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
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const thumbScrollRef = useRef(null);
    const showThumbnails = showThumbnailBar;
    const setShowThumbnails = setShowThumbnailBarMemo;

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));
    const [showTopBookmarkOptions, setShowTopBookmarkOptions] = useState(false);
    const [showTopNotesOptions, setShowTopNotesOptions] = useState(false);

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    // Close popup options if user clicks outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (showTopBookmarkOptions) setShowTopBookmarkOptions(false);
            if (showTopNotesOptions) setShowTopNotesOptions(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showTopBookmarkOptions, showTopNotesOptions]);

    // Close localized popups if another main popup is opened
    useEffect(() => {
        if (showTOC || showThumbnails || showGalleryPopup || showProfilePopup || showViewBookmarkPopup || showSoundPopup) {
            setShowTopBookmarkOptions(false);
            setShowTopNotesOptions(false);
        }
    }, [showTOC, showThumbnails, showGalleryPopup, showProfilePopup, showViewBookmarkPopup, showSoundPopup]);

    const handleMenuClick = (setter, currentVal) => {
        const next = !currentVal;
        if (next) {
            // Close local dropdowns
            setShowTopNotesOptions(false);
            setShowTopBookmarkOptions(false);
            // Close main popups (using Memo handlers from parent which already call closeAllPopups)
            setShowTOCMemo(false);
            setShowThumbnailBarMemo(false);
            setShowGalleryPopupMemo(false);
            setShowSoundPopupMemo(false);
            setShowProfilePopup(false);
        }
        setter(next);
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

    const getLayoutColor = (id, defaultColor) => {
        if (!layoutColors) return defaultColor;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? colorObj.hex : defaultColor;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[9] && Array.isArray(layoutColors[9])) {
            const colorObj = layoutColors[9].find(c => c.id === id);
            return colorObj ? colorObj.hex : defaultColor;
        }

        return defaultColor;
    };

    const getLayoutOpacity = (id, defaultOpacity) => {
        if (!layoutColors) return defaultOpacity;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? colorObj.opacity / 100 : defaultOpacity;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[9] && Array.isArray(layoutColors[9])) {
            const colorObj = layoutColors[9].find(c => c.id === id);
            return colorObj ? colorObj.opacity / 100 : defaultOpacity;
        }

        return defaultOpacity;
    };

    const getLayoutColorRgba = (id, defaultHex, defaultOpacity) => {
        let hex = getLayoutColor(id, defaultHex);
        let opacity = getLayoutOpacity(id, defaultOpacity);

        // Convert to rgba string safely
        if (!hex || !hex.startsWith('#')) return `rgba(87, 92, 156, ${opacity})`;

        let c = hex.substring(1).split('');
        if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        if (c.length !== 6) return hex;

        const val = parseInt(c.join(''), 16);
        return `rgba(${(val >> 16) & 255}, ${(val >> 8) & 255}, ${val & 255}, ${opacity})`;
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

    const bodyTextColor = (() => {
        const dropBgHex = getLayoutColor('dropdown-bg', primaryColor);
        const dropTextHex = getLayoutColor('dropdown-text', '#FFFFFF');
        return isLightColor(dropBgHex) ? (dropTextHex === '#FFFFFF' ? '#2D2D2D' : dropTextHex) : dropBgHex;
    })();

    // Sound Popup States
    const flipSoundMasterEnabled = otherSetupSettings?.sound?.flipSoundEnabled !== false;
    const bgSoundMasterEnabled = otherSetupSettings?.sound?.bgSoundEnabled !== false;
    const isFlipActive = flipSoundMasterEnabled && !isFlipMuted;
    const isBgActive = bgSoundMasterEnabled && !isMuted;
    const flipWidth = flipSoundMasterEnabled ? (isFlipActive ? '60%' : '15%') : '0%';
    const bgWidth = bgSoundMasterEnabled ? (isBgActive ? '80%' : '15%') : '0%';

    const handleFlipClick = (e) => {
        e.stopPropagation();
        if (flipSoundMasterEnabled && setIsFlipMuted) {
            setIsFlipMuted(!isFlipMuted);
        }
    };

    const handleBgClick = (e) => {
        e.stopPropagation();
        if (bgSoundMasterEnabled && onToggleAudio) {
            onToggleAudio();
        }
    };

    // Toolbar icon button component
    const ToolbarBtn = ({ icon, onClick, isActive, className = '', isWhiteIconWhenInactive = true }) => {
        const bgColor = isActive ? getLayoutColor('toolbar-text-main', '#FFFFFF') : getLayoutColor('toolbar-bg', primaryColor);
        const iconColor = isActive ? getLayoutColor('toolbar-bg', primaryColor) : getLayoutColor('toolbar-text-main', '#FFFFFF');

        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick(e);
                }}
                className={`rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[101]' : 'z-10'} ${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : (isTablet ? 'w-[2.1vw] h-[2.1vw]' : 'w-[2.3vw] h-[2.3vw]')} ${className}`}
                style={{ backgroundColor: bgColor }}
            >
                <Icon icon={icon} color={iconColor} className={`${isSidebarOpen ? (isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[0.95vw] h-[0.95vw]') : (isTablet ? 'w-[1.0vw] h-[1.0vw]' : 'w-[1.1vw] h-[1.1vw]')}`} />
            </button>
        );
    };

    return (
        <div
            className="flex flex-col h-screen w-full font-sans overflow-hidden relative"
            style={{ backgroundColor: backgroundSettings?.color || baseBgColor, ...backgroundStyle }}
            onClick={() => setRecommendations([])}
        >
            {/* ═══════════ Global Click Overlay Dropdowns ═══════════ */}
            {/* Captures clicks reliably before they hit the flipbook which swallows propagation */}
            {(showTopBookmarkOptions || showTopNotesOptions) && (
                <div
                    className="absolute inset-0 z-[40]"
                    onClick={() => {
                        setShowTopBookmarkOptions(false);
                        setShowTopNotesOptions(false);
                    }}
                />
            )}

            {/* ═══════════ Top Overlay Area ═══════════ */}
            <div className="absolute top-[2vh] left-[2vw] right-[2vw] flex items-center justify-between z-50 pointer-events-none">

                {/* Left: Quick Search */}
                <div className="flex-1 flex justify-start pointer-events-auto">
                    <div className="relative z-50" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`flex items-center rounded-full px-[1vw] py-[0.5vh] ${isTablet ? 'h-[3.6vh]' : 'h-[4.2vh]'} transition-all duration-300 ${isSidebarOpen ? (isTablet ? 'w-[6.5vw]' : 'w-[8.5vw]') : (isTablet ? 'w-[11vw]' : 'w-[14vw]')}`}
                            style={{ backgroundColor: getLayoutColor('search-bg-v2', '#ffffff'), border: `1px solid ${getLayoutColor('search-text-v1', primaryColor)}30` }}
                        >
                            <Icon icon="lucide:search" className={`${isSidebarOpen ? (isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.0vw] h-[1.0vw]') : (isTablet ? 'w-[1.0vw] h-[1.0vw]' : 'w-[1.1vw] h-[1.1vw]')}`} color={getLayoutColor('search-text-v1', primaryColor)} />
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
                                className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                            />
                        </div>

                        <AnimatePresence>
                            {recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className={`absolute top-[5vh] left-0 bg-white rounded-[0.4vw] shadow-2xl ${isSidebarOpen ? (isTablet ? 'w-[10vw]' : 'w-[12vw]') : (isTablet ? 'w-[14vw]' : 'w-[16vw]')} overflow-hidden border border-gray-100`}
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
                </div>

                {/* ═══════════ Center: Top Toolbar ═══════════ */}
                <div className="flex-shrink-0 pointer-events-auto relative z-[4000]">
                    <div
                        className={`flex items-center ${isSidebarOpen ? 'gap-[0.5vw]' : (isTablet ? 'gap-[0.4vw]' : 'gap-[0.8vw]')} rounded-full px-[0.8vw] py-[0.5vh] ${isTablet ? 'h-[3.6vh]' : 'h-[4.2vh]'}`}
                    >
                        {/* TOC */}
                        <ToolbarBtn
                            icon="fluent:text-bullet-list-24-filled"
                            onClick={() => handleMenuClick(setShowTOCMemo, showTOC)}
                            isActive={showTOC}
                        />
                        {/* Thumbnails */}
                        <ToolbarBtn
                            icon="ph:squares-four-fill"
                            onClick={(e) => { e.stopPropagation(); handleMenuClick(setShowThumbnailBarMemo, showThumbnails); }}
                            isActive={showThumbnails}
                        />
                        {/* Notes */}
                        <div className="relative">
                            <AnimatePresence>
                                {showTopNotesOptions && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className={`absolute right-1/2 ${isTablet ? 'translate-x-[1.35vw]' : 'translate-x-[1.5vw]'} top-[-10%] ${isTablet ? 'w-[9vw]' : 'w-[10vw]'} z-[100] cursor-default group`}
                                        style={{ aspectRatio: '250/270', filter: 'drop-shadow(0 1vw 3vw rgba(0,0,0,0.3))' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Unified SVG Background */}
                                        <div className="absolute inset-0 z-0 pointer-events-none">
                                            <svg width="100%" height="100%" viewBox="0 0 250 270" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                                <defs>
                                                    <clipPath id="notes-shape-clip" clipPathUnits="objectBoundingBox">
                                                        <path
                                                            transform="scale(0.004, 0.0037037)"
                                                            d="M0 115 C0 90.16 20.16 70 45 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V225 C250 249.84 229.84 270 205 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                                                        />
                                                    </clipPath>
                                                </defs>
                                                <path
                                                    d="M0 115 C0 90.16 20.16 70 45 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V225 C250 249.84 229.84 270 205 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                                                    fill={getLayoutColor('dropdown-bg', primaryColor)}
                                                    fillOpacity="0.6"
                                                    stroke="rgba(255,255,255,0.1)"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                        </div>

                                        {/* Popup Body Content */}
                                        <div
                                            className="w-full h-full relative z-10 backdrop-blur-md flex flex-col gap-[0.5vw] justify-center pt-[3.6vw] px-[0.8vw]"
                                            style={{ clipPath: 'url(#notes-shape-clip)', WebkitClipPath: 'url(#notes-shape-clip)' }}
                                        >
                                            <button
                                                className="w-full flex items-center justify-start gap-[0.6vw] px-[1vw] py-[0.8vh] bg-white rounded-full transition-all hover:scale-[1.04] active:scale-[0.97] text-left group shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAddNotesPopupMemo(true);
                                                    setShowTopNotesOptions(false);
                                                }}
                                            >
                                                <div className="w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-white transition-colors shrink-0">
                                                    <Icon icon="solar:notes-bold" className={`${isTablet ? 'w-[1vw]' : 'w-[1.1vw]'} transition-transform group-hover:scale-110`} style={{ color: bodyTextColor }} />
                                                </div>
                                                <div className="flex flex-col leading-[1.1]">
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-bold`} style={{ color: bodyTextColor }}>Add</span>
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-bold`} style={{ color: bodyTextColor }}>Notes</span>
                                                </div>
                                            </button>
                                            <button
                                                className="w-full flex items-center justify-start gap-[0.6vw] px-[1vw] py-[0.8vh] bg-white rounded-full transition-all hover:scale-[1.04] active:scale-[0.97] text-left group shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowNotesViewerMemo(true);
                                                    setShowTopNotesOptions(false);
                                                }}
                                            >
                                                <div className="w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-white transition-colors shrink-0">
                                                    <Icon icon="lets-icons:view-duotone" className={`${isTablet ? 'w-[1vw]' : 'w-[1.1vw]'} transition-transform group-hover:scale-110`} style={{ color: bodyTextColor }} />
                                                </div>
                                                <div className="flex flex-col leading-[1.1]">
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-bold`} style={{ color: bodyTextColor }}>View</span>
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-bold`} style={{ color: bodyTextColor }}>Notes</span>
                                                </div>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <ToolbarBtn
                                icon="material-symbols-light:add-notes"
                                onClick={() => handleMenuClick(setShowTopNotesOptions, showTopNotesOptions)}
                                isActive={showTopNotesOptions}
                                className="relative z-[200]"
                            />
                        </div>
                        <div className="relative">
                            <AnimatePresence>
                                {showTopBookmarkOptions && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className={`absolute right-1/2 ${isTablet ? 'translate-x-[1.35vw]' : 'translate-x-[1.5vw]'} top-[-10%] ${isTablet ? 'w-[9vw]' : 'w-[10vw]'} z-[100] cursor-default group`}
                                        style={{ aspectRatio: '250/270', filter: 'drop-shadow(0 1vw 3vw rgba(0,0,0,0.3))' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Unified SVG Background */}
                                        <div className="absolute inset-0 z-0 pointer-events-none">
                                            <svg width="100%" height="100%" viewBox="0 0 250 270" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                                <defs>
                                                    <clipPath id="bookmarks-shape-clip" clipPathUnits="objectBoundingBox">
                                                        <path
                                                            transform="scale(0.004, 0.0037037)"
                                                            d="M0 115 C0 90.16 20.16 70 45 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V225 C250 249.84 229.84 270 205 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                                                        />
                                                    </clipPath>
                                                </defs>
                                                <path
                                                    d="M0 115 C0 90.16 20.16 70 45 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V225 C250 249.84 229.84 270 205 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                                                    fill={getLayoutColor('dropdown-bg', primaryColor)}
                                                    fillOpacity="0.6"
                                                    stroke="rgba(255,255,255,0.1)"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                        </div>

                                        {/* Popup Body Content */}
                                        <div
                                            className="w-full h-full relative z-10 backdrop-blur-md flex flex-col gap-[0.5vw] justify-center pt-[3.6vw] px-[0.8vw]"
                                            style={{ clipPath: 'url(#bookmarks-shape-clip)', WebkitClipPath: 'url(#bookmarks-shape-clip)' }}
                                        >
                                            <button
                                                className="w-full flex items-center justify-start gap-[0.6vw] px-[1vw] py-[0.8vh] bg-white rounded-full transition-all hover:scale-[1.04] active:scale-[0.97] text-left group shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAddBookmarkPopupMemo(true);
                                                    setShowTopBookmarkOptions(false);
                                                }}
                                            >
                                                <div className="w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-white transition-colors shrink-0">
                                                    <Icon icon="fluent:bookmark-add-24-filled" className={`${isTablet ? 'w-[1vw]' : 'w-[1.1vw]'} transition-transform group-hover:scale-110`} style={{ color: bodyTextColor }} />
                                                </div>
                                                <div className="flex flex-col leading-[1.1]">
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-bold`} style={{ color: bodyTextColor }}>Add</span>
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-bold`} style={{ color: bodyTextColor }}>Bookmark</span>
                                                </div>
                                            </button>
                                            <button
                                                className="w-full flex items-center justify-start gap-[0.6vw] px-[1vw] py-[0.8vh] bg-white rounded-full transition-all hover:scale-[1.04] active:scale-[0.97] text-left group shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowViewBookmarkPopup(true);
                                                    setShowTopBookmarkOptions(false);
                                                }}
                                            >
                                                <div className="w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-white transition-colors shrink-0">
                                                    <Icon icon="fluent:eye-24-filled" className={`${isTablet ? 'w-[1vw]' : 'w-[1.1vw]'} transition-transform group-hover:scale-110`} style={{ color: bodyTextColor }} />
                                                </div>
                                                <div className="flex flex-col leading-[1.1]">
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-bold`} style={{ color: bodyTextColor }}>View</span>
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-bold`} style={{ color: bodyTextColor }}>Bookmark</span>
                                                </div>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <ToolbarBtn
                                icon="fluent:bookmark-24-filled"
                                onClick={() => handleMenuClick(setShowTopBookmarkOptions, showTopBookmarkOptions)}
                                isActive={showTopBookmarkOptions}
                                className="relative z-[200]"
                            />
                        </div>
                        {/* Play/Pause */}
                        <ToolbarBtn
                            icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"}
                            onClick={() => setIsPlaying(!isAutoFlipping)}
                            isActive={isAutoFlipping}
                        />
                        {/* Gallery */}
                        <ToolbarBtn
                            icon="clarity:image-gallery-solid"
                            onClick={() => handleMenuClick(setShowGalleryPopupMemo, showGalleryPopup)}
                            isActive={showGalleryPopup}
                        />
                        <div className="relative">
                            <AnimatePresence>
                                {showSoundPopup && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className={`absolute right-1/2 ${isTablet ? 'translate-x-[1.35vw]' : 'translate-x-[1.5vw]'} top-[-10%] ${isTablet ? 'w-[9vw]' : 'w-[10vw]'} z-[10] cursor-default group`}
                                        style={{ aspectRatio: '250/270', filter: 'drop-shadow(0 1vw 3vw rgba(0,0,0,0.3))' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Unified SVG Background */}
                                        <div className="absolute inset-0 z-0 pointer-events-none">
                                            <svg width="100%" height="100%" viewBox="0 0 250 270" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                                <defs>
                                                    <clipPath id="sound-shape-clip-local-" clipPathUnits="objectBoundingBox">
                                                        <path
                                                            transform="scale(0.004, 0.0037037)"
                                                            d="M0 115 C0 90.16 20.16 70 45 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V225 C250 249.84 229.84 270 205 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                                                        />
                                                    </clipPath>
                                                </defs>
                                                <path
                                                    d="M0 115 C0 90.16 20.16 70 45 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V225 C250 249.84 229.84 270 205 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                                                    fill={getLayoutColor('dropdown-bg', primaryColor)}
                                                    fillOpacity="0.6"
                                                    stroke="rgba(255,255,255,0.1)"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                        </div>

                                        <div
                                            className="w-full h-full relative z-10 backdrop-blur-md flex flex-col justify-center gap-[0.5vw] pt-[3.6vw] px-[0.8vw]"
                                            style={{ clipPath: 'url(#sound-shape-clip-local-)', WebkitClipPath: 'url(#sound-shape-clip-local-)' }}
                                        >
                                            <div className={isTablet ? "flex items-center gap-[0.3vw] mb-[0.2vw]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                                                <h2 className={isTablet ? "text-[0.6vw] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Sound</h2>
                                                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.15 }} />
                                            </div>

                                            {/* Flip Sound Control */}
                                            <div className="flex items-center gap-[0.6vw]">
                                                <button
                                                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'bg-white/20 border-white/40 shadow-inner' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                                                    onClick={handleFlipClick}
                                                    disabled={!flipSoundMasterEnabled}
                                                    style={isFlipActive ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                                                >
                                                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[0.8vw] h-[0.8vw]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                                </button>
                                                <div className="flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/10">
                                                    <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: flipWidth }} />
                                                </div>
                                            </div>

                                            {/* Background Sound Control */}
                                            <div className="flex items-center gap-[0.6vw]">
                                                <button
                                                    className={`flex-shrink-0 ${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-white/20 border-white/40 shadow-inner' : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                                                    onClick={handleBgClick}
                                                    disabled={!bgSoundMasterEnabled}
                                                    style={isBgActive ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                                                >
                                                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[0.6vw] h-[0.6vw]" : "w-[0.9vw] h-[0.9vw]"} style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                                </button>
                                                <div className="flex-1 h-[0.15vw] rounded-full relative overflow-hidden bg-white/10">
                                                    <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: bgWidth }} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <ToolbarBtn
                                icon="solar:music-notes-bold"
                                onClick={() => handleMenuClick(setShowSoundPopupMemo, showSoundPopup)}
                                isActive={showSoundPopup}
                                className="relative z-[999]"
                            />
                        </div>

                        {/* Divider */}
                        <div className="w-[1px] h-[2vh] bg-white mx-[0.2vw] opacity-40" />

                        {/* Search / Zoom controls */}
                        <div className={`flex items-center rounded-full px-[0.2vw] ${isSidebarOpen ? 'gap-[0.1vw]' : 'gap-[0.2vw]'} ${isSidebarOpen ? (isTablet ? 'h-[1.7vw]' : 'h-[1.85vw]') : (isTablet ? 'h-[2.1vw]' : 'h-[2.3vw]')}`} style={{ backgroundColor: `${primaryColor}33`, border: `1px solid ${getLayoutColor('toolbar-bg', primaryColor)}20` }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                className={`${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : (isTablet ? 'w-[2.1vw] h-[2.1vw]' : 'w-[2.3vw] h-[2.3vw]')} rounded-full flex items-center justify-center transition-all shadow-sm`}
                                style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                <Icon icon="lucide:zoom-out" className={`${isSidebarOpen ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                            </button>
                            <span className={`${isSidebarOpen ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold ${isSidebarOpen ? 'min-w-[2vw]' : 'min-w-[2.5vw]'} text-center`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                className={`${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : (isTablet ? 'w-[2.1vw] h-[2.1vw]' : 'w-[2.3vw] h-[2.3vw]')} rounded-full flex items-center justify-center transition-all shadow-sm`}
                                style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                <Icon icon="lucide:zoom-in" className={`${isSidebarOpen ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />
                            </button>
                            <button
                                onClick={() => {
                                    setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                    setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                }}
                                className={`text-[0.7vw] font-bold px-[0.8vw] ${isSidebarOpen ? (isTablet ? 'h-[1.3vw]' : 'h-[1.45vw]') : (isTablet ? 'h-[1.7vw]' : 'h-[1.9vw]')} rounded-full flex items-center justify-center transition-all shadow-sm`}
                                style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), color: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="w-[1px] h-[2vh] bg-white mx-[0.2vw] opacity-40" />

                        {/* Profile */}
                        <ToolbarBtn
                            icon="fluent:person-24-filled"
                            onClick={() => handleMenuClick(setShowProfilePopup, showProfilePopup)}
                            isActive={showProfilePopup}
                        />
                        {/* Share */}
                        <ToolbarBtn
                            icon="mage:share-fill"
                            onClick={handleShare}
                        />
                        {/* Download */}
                        <ToolbarBtn
                            icon="meteor-icons:download"
                            onClick={handleDownload}
                        />
                        {/* Fullscreen */}
                        <ToolbarBtn
                            icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"}
                            onClick={handleFullScreen}
                            isActive={isFullscreen}
                        />
                    </div>
                </div>

                {/* Right: Logo */}
                <div className="flex-1 flex justify-end pointer-events-auto">
                    {logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Logo"
                            className={`${isTablet ? 'h-[2vw]' : 'h-[2.8vw]'} w-auto transition-opacity`}
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>
            </div>

            {/* ═══════════ Main Book Canvas ═══════════ */}
            <div className="flex-1 flex justify-center items-center w-full z-10 pt-[8vh] pb-[12vh]">
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

            {/* ═══════════ Page Numbers Below Pages ═══════════ */}
            <div className="absolute bottom-[13vh] left-1/2 -translate-x-1/2 flex items-center gap-[22vw] z-20 pointer-events-none">
                <span className="text-[0.85vw] font-medium" style={{ color: getLayoutColor('toolbar-bg', primaryColor), opacity: 0.7 }}>
                    {currentPage + 1}
                </span>
                {currentPage + 2 <= totalPages && (
                    <span className="text-[0.85vw] font-medium" style={{ color: getLayoutColor('toolbar-bg', primaryColor), opacity: 0.7 }}>
                        {currentPage + 2}
                    </span>
                )}
            </div>

            {/* ═══════════ Floating Action Buttons Removed ═══════════ */}


            {/* ═══════════ Top Thumbnail Bar ═══════════ */}
            <AnimatePresence>
                {showThumbnails && (
                    <>
                        {/* Invisible click-to-close overlay */}
                        <div
                            className="fixed inset-0 z-[44] cursor-default"
                            onClick={() => setShowThumbnails(false)}
                        />
                        <motion.div
                            key="thumb-panel"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-[7.5vh] left-[2vw] right-[2vw] z-[45] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Connector Tab for Thumbnail Icon - Exact geometry from Rectangle 7411.svg */}
                            <div className={`absolute top-[-3.1vw] left-[50%] ${isSidebarOpen ? '-translate-x-[calc(50%+15.7vw)]' : '-translate-x-[calc(50%+20vw)]'} w-[5.2vw] h-[3.4vw] z-0`}>
                                <svg width="100%" height="100%" viewBox="0 0 113 67" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M24.8182 33.0909C24.8182 14.8153 39.6335 0 57.9091 0C76.1847 0 91 14.8153 91 33.0909V41.7377C91.0109 60.2573 94.967 66.6391 113 67H0C18.7515 67 24.8182 52.7213 24.8182 41.7377V33.0909Z"
                                        fill={getLayoutColor('dropdown-bg', primaryColor)}
                                        fillOpacity="1"
                                    />
                                </svg>
                            </div>

                            <div
                                className={`w-full ${isTablet ? 'h-[10vh]' : 'h-[12vh]'} rounded-[1vw] flex items-center relative px-[1vw] shadow-2xl backdrop-blur-md`}
                                style={{ backgroundColor: getLayoutColor('dropdown-bg', primaryColor) }}
                            >
                                {/* Left Arrow */}
                                <button
                                    onClick={() => thumbScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                                    className="z-10 transition-opacity p-[0.5vw] hover:opacity-80"
                                    style={{ color: isLightColor(getLayoutColor('dropdown-bg', primaryColor)) ? bodyTextColor : getLayoutColor('dropdown-text', '#FFFFFF') }}
                                >
                                    <Icon icon="lucide:arrow-left" className="w-[1.8vw] h-[1.8vw]" />
                                </button>

                                {/* Scrollable thumbnail row - Showing Double Spreads */}
                                <div
                                    ref={thumbScrollRef}
                                    className="flex-1 flex gap-[1.5vw] px-[1.5vw] items-center overflow-x-auto custom-scrollbar h-full py-[0.5vh]"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {Array.from({ length: Math.ceil(pages.length / 2) }).map((_, spreadIdx) => {
                                        const p1Idx = spreadIdx * 2;
                                        const p2Idx = p1Idx + 1;
                                        const isCurrent = currentPage === p1Idx || currentPage === p2Idx;

                                        return (
                                            <div
                                                key={spreadIdx}
                                                data-thumb-index={p1Idx}
                                                onClick={() => { onPageClick(p1Idx); }}
                                                className="flex-shrink-0 flex flex-col items-center cursor-pointer group py-[0.5vh]"
                                            >
                                                <div
                                                    className="rounded-[0.5vw] overflow-hidden transition-all duration-300 bg-white shadow-lg flex flex-col items-center px-[0.3vw] pt-[0.3vw] pb-[0.2vw]"
                                                    style={{
                                                        width: '6.3vw',
                                                        height: '4.8vw',
                                                        border: isCurrent ? `0.12vw solid ${getLayoutColor('dropdown-bg', primaryColor)}` : 'none',
                                                        transform: isCurrent ? 'scale(1.04)' : 'scale(1)'
                                                    }}
                                                >
                                                    {/* Pages Spread container */}
                                                    <div className="flex w-full flex-1 gap-[0.1vw] items-center justify-center overflow-hidden">
                                                        <div className="w-[45%] h-[75%] overflow-hidden bg-white shadow-sm flex items-center justify-center rounded-[0.1vw]">
                                                            <PageThumbnail
                                                                html={pages[p1Idx]?.html || pages[p1Idx]?.content || ''}
                                                                index={p1Idx}
                                                                scale={0.045}
                                                            />
                                                        </div>
                                                        {p2Idx < pages.length ? (
                                                            <div className="w-[45%] h-[75%] overflow-hidden bg-white shadow-sm flex items-center justify-center rounded-[0.1vw]">
                                                                <PageThumbnail
                                                                    html={pages[p2Idx]?.html || pages[p2Idx]?.content || ''}
                                                                    index={p2Idx}
                                                                    scale={0.045}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[45%] h-[75%] bg-gray-50 rounded-[0.1vw]" />
                                                        )}
                                                    </div>

                                                    <div className="w-full flex justify-center py-[0.1vw] border-t border-gray-50">
                                                        <span className="text-[0.6vw] font-bold tracking-tight" style={{ color: bodyTextColor }}>
                                                            Page {p1Idx + 1}{p2Idx < pages.length ? `-${p2Idx + 1}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Arrow */}
                                <button
                                    onClick={() => thumbScrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                                    className="z-10 transition-opacity p-[0.5vw] hover:opacity-80"
                                    style={{ color: isLightColor(getLayoutColor('dropdown-bg', primaryColor)) ? bodyTextColor : getLayoutColor('dropdown-text', '#FFFFFF') }}
                                >
                                    <Icon icon="lucide:arrow-right" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══════════ Bottom Navigation Bar ═══════════ */}
            <div className={`absolute bottom-[2.5vh] w-full ${isTablet ? 'h-[8.5vh]' : 'h-[10vh]'} flex flex-col justify-center items-center z-40 pointer-events-auto`}>
                <div className="flex items-center gap-[1.2vw]">
                    {/* First Page */}
                    <button
                        onClick={() => onPageClick(0)}
                        className="w-[2.6vw] h-[2.6vw] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <Icon icon="ph:skip-back-fill" className="w-[1.1vw] h-[1.1vw]" color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                    </button>

                    {/* Prev Page */}
                    <button
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        className="w-[2.6vw] h-[2.6vw] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <Icon icon="lucide:chevron-left" className="w-[1.2vw] h-[1.2vw]" color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                    </button>

                    {/* Page Info Pill */}
                    <div
                        className="rounded-full px-[1.8vw] py-[0.6vh] flex items-center shadow-md"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <span className={`text-[0.75vw] lg:text-[0.85vw] font-medium tracking-wide`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                            Page –
                        </span>
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
                            className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-medium tracking-wide bg-transparent border-none outline-none text-center ml-[0.3vw]`}
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), width: `${String(pages.length).length + 1}ch` }}
                        />
                        <span className={`text-[0.75vw] lg:text-[0.85vw] font-medium tracking-wide`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                            / {totalPages}
                        </span>
                    </div>

                    {/* Next Page */}
                    <button
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        className="w-[2.6vw] h-[2.6vw] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw]" color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                    </button>

                    {/* Last Page */}
                    <button
                        onClick={() => onPageClick(totalPages - 1)}
                        className="w-[2.6vw] h-[2.6vw] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <Icon icon="ph:skip-forward-fill" className="w-[1.1vw] h-[1.1vw]" color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Grid9Layout;
