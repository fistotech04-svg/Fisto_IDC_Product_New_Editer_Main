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
        if (layoutColors[9] && Array.isArray(layoutColors[9])) {
            const colorObj = layoutColors[9].find(c => c.id === id);
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
        if (layoutColors[9] && Array.isArray(layoutColors[9])) {
            const colorObj = layoutColors[9].find(c => c.id === id);
            return colorObj ? colorObj.opacity / 100 : defaultOpacity;
        }
        
        return defaultOpacity;
    };

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
        const color = getLayoutColor(id, null);
        if (color && color.startsWith('#')) return color;
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    // Toolbar icon button component
    const ToolbarBtn = ({ icon, onClick, isActive, className = '', isWhiteIconWhenInactive = true }) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
            className={`rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]' : ''} ${isSidebarOpen ? (isTablet ? 'w-[1.6vw] h-[1.6vw]' : 'w-[1.9vw] h-[1.9vw]') : (isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.5vw] h-[2.5vw]')} ${className}`}
            style={{ 
                backgroundColor: isActive ? 'white' : getLayoutColor('toolbar-bg', primaryColor),
                color: isActive ? getLayoutColor('toolbar-bg', primaryColor) : 'white'
            }}
        >
            <Icon icon={icon} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
        </button>
    );

    return (
        <div
            className="flex flex-col h-screen w-full font-sans overflow-hidden relative"
            style={{ backgroundColor: backgroundSettings?.color || baseBgColor, ...backgroundStyle }}
            onClick={() => {
                setShowLocalNotesDropdown(false);
                setShowLocalBookmarkDropdown(false);
            }}
        >
            {/* ═══════════ Top Overlay Area ═══════════ */}
            <div className="absolute top-[2vh] left-[2vw] right-[2vw] flex justify-between items-start z-50 pointer-events-none">

                {/* Left: Quick Search */}
                <div className="flex gap-[1vw] pointer-events-auto">
                    <div className="relative z-50">
                        <div
                            className={`flex items-center rounded-full px-[1vw] py-[0.5vh] ${isTablet ? 'h-[3.2vh]' : 'h-[4vh]'} transition-all duration-300 ${isSidebarOpen ? (isTablet ? 'w-[6vw]' : 'w-[10vw]') : (isTablet ? 'w-[8vw]' : 'w-[14vw]')}`}
                            style={{ backgroundColor: getLayoutColor('search-bg-v2', '#ffffff'), border: `1px solid ${getLayoutColor('search-text-v1', primaryColor)}30` }}
                        >
                            <Icon icon="lucide:search" className={`${isTablet ? 'w-[0.6vw] h-[0.6vw]' : 'w-[1.1vw] h-[1.1vw]'}`} style={{ color: getLayoutColor('search-text-v1', primaryColor) }} />
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
                                    className="absolute top-[5vh] left-0 bg-white rounded-[0.4vw] shadow-2xl w-[14vw] overflow-hidden border border-gray-100"
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
                </div>

                {/* ═══════════ Center: Top Toolbar ═══════════ */}
                <div className={`absolute ${isSidebarOpen ? (isTablet ? 'left-[7.5vw]' : 'left-[13vw]') : (isTablet ? 'left-[7.5vw]' : 'left-[18vw]')} -translate-x-2 pointer-events-auto`}>
                    <div
                        className={`flex items-center ${isTablet ? 'gap-[0.4vw]' : 'gap-[0.6vw]'} rounded-full px-[1.5vw] py-[0.8vh] ${isTablet ? 'h-[3.6vh]' : 'h-[5vh]'}`}
                    >
                        {/* TOC */}
                        <ToolbarBtn
                            icon="fluent:text-bullet-list-24-filled"
                            onClick={() => { setShowTOCMemo(true); }}
                            isActive={showTOC}
                        />
                        {/* Thumbnails */}
                        <ToolbarBtn
                            icon="ph:squares-four-fill"
                            onClick={(e) => { e.stopPropagation(); setShowThumbnails(prev => !prev); }}
                            isActive={showThumbnails}
                        />
                        {/* Notes */}
                        <div className="relative flex items-center justify-center">
                            <ToolbarBtn
                                icon="material-symbols-light:add-notes"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowLocalNotesDropdown(prev => !prev);
                                    setShowLocalBookmarkDropdown(false);
                                }}
                                isActive={showLocalNotesDropdown}
                            />
                            <AnimatePresence>
                                {showLocalNotesDropdown && (
                                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute top-[calc(100%+1vw)] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '9vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                        {/* Bookmarks */}
                        <div className="relative flex items-center justify-center">
                            <ToolbarBtn
                                icon="fluent:bookmark-24-filled"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowLocalBookmarkDropdown(prev => !prev);
                                    setShowLocalNotesDropdown(false);
                                }}
                                isActive={showLocalBookmarkDropdown}
                            />
                            <AnimatePresence>
                                {showLocalBookmarkDropdown && (
                                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute top-[calc(100%+1vw)] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '10vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                        {/* Play/Pause */}
                        <ToolbarBtn
                            icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"}
                            onClick={() => setIsPlaying(!isAutoFlipping)}
                            isActive={isAutoFlipping}
                        />
                        {/* Gallery */}
                        <ToolbarBtn
                            icon="clarity:image-gallery-solid"
                            onClick={() => { setShowGalleryPopupMemo(true); }}
                            isActive={showGalleryPopup}
                        />
                        {/* Music */}
                        <ToolbarBtn
                            icon="solar:music-notes-bold"
                            onClick={() => setShowSoundPopupMemo(!showSoundPopup)}
                            isActive={showSoundPopup}
                            className={isMuted ? 'opacity-50' : ''}
                        />

                        {/* Divider */}
                        <div className="w-[1px] h-[2vh] bg-white mx-[0.2vw] opacity-40" />

                        {/* Search / Zoom controls */}
                        <div className={`flex items-center bg-white/20 rounded-full px-[0.3vw] gap-[0.2vw] ${isTablet ? 'h-[3.6vh]' : 'h-[4.5vh]'}`} style={{ backgroundColor: 'var(--reset-bg, rgba(255,255,255,0.2))' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                className={`${isTablet ? 'w-[1.6vw] h-[1.6vw]' : 'w-[2vw] h-[2vw]'} rounded-full flex items-center justify-center transition-all bg-white shadow-sm`}
                                style={{ color: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} />
                            </button>
                            <span className={`${isTablet ? 'text-[0.65vw] min-w-[2vw]' : 'text-[0.8vw] min-w-[2.5vw]'} font-semibold text-center text-white`} style={{ color: getLayoutColor('toolbar-bg', '#FFFFFF') }}>
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                className={`${isTablet ? 'w-[1.6vw] h-[1.6vw]' : 'w-[2vw] h-[2vw]'} rounded-full flex items-center justify-center transition-all bg-white shadow-sm`}
                                style={{ color: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} />
                            </button>
                            <button
                                onClick={() => {
                                    setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                    setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                }}
                                className={`bg-reset-text ${isTablet ? 'text-[0.6vw] px-[0.6vw] py-[0.4vh]' : 'text-[0.7vw] px-[0.8vw] py-[0.6vh]'} font-bold rounded-full flex items-center justify-center transition-all`}
                                style={{ color: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="w-[1px] h-[2vh] bg-white mx-[0.2vw] opacity-40" />

                        {/* Profile */}
                        <ToolbarBtn
                            icon="fluent:person-24-filled"
                            onClick={() => { setShowProfilePopup(true); }}
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
                <div className="pointer-events-auto flex items-center mr-[0.5vw]">
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
                            <div className="absolute top-[-3.5vw] left-[50%] -translate-x-[calc(50%+16.5vw)] w-[6vw] h-[3.8vw] z-0">
                                <svg width="100%" height="100%" viewBox="0 0 113 67" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M24.8182 33.0909C24.8182 14.8153 39.6335 0 57.9091 0C76.1847 0 91 14.8153 91 33.0909V41.7377C91.0109 60.2573 94.967 66.6391 113 67H0C18.7515 67 24.8182 52.7213 24.8182 41.7377V33.0909Z"
                                        fill={getLayoutColor('toolbar-bg', primaryColor)}
                                        fillOpacity="0.6"
                                    />
                                </svg>
                            </div>

                            <div
                                className={`w-full ${isTablet ? 'h-[10vh]' : 'h-[12vh]'} rounded-[1vw] flex items-center relative px-[1vw] shadow-2xl backdrop-blur-md`}
                                style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.6') }}
                            >
                                {/* Left Arrow */}
                                <button
                                    onClick={() => thumbScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                                    className="z-10 text-white transition-opacity p-[0.5vw] hover:opacity-80"
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
                                                        border: isCurrent ? `0.12vw solid ${getLayoutColor('toolbar-bg', primaryColor)}` : 'none',
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

                                                    {/* Page Label - Inside card at bottom */}
                                                    <div className="w-full flex justify-center py-[0.1vw] border-t border-gray-50">
                                                        <span className="text-[0.6vw] font-bold tracking-tight" style={{ color: getLayoutColor('toolbar-bg', primaryColor) }}>
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
                                    className="z-10 text-white transition-opacity p-[0.5vw] hover:opacity-80"
                                >
                                    <Icon icon="lucide:arrow-right" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══════════ Bottom Navigation Bar ═══════════ */}
            <div className={`absolute bottom-0 w-full ${isTablet ? 'h-[8.5vh]' : 'h-[10vh]'} flex flex-col justify-center items-center z-40 pointer-events-auto`}>
                <div className="flex items-center gap-[1.2vw]">
                    {/* First Page */}
                    <button
                        onClick={() => onPageClick(0)}
                        className="w-[2.6vw] h-[2.6vw] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <Icon icon="ph:skip-back-fill" className="w-[1.1vw] h-[1.1vw] text-white" />
                    </button>

                    {/* Prev Page */}
                    <button
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        className="w-[2.6vw] h-[2.6vw] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <Icon icon="lucide:chevron-left" className="w-[1.2vw] h-[1.2vw] text-white" />
                    </button>

                    {/* Page Info Pill */}
                    <div
                        className="rounded-full px-[1.8vw] py-[0.6vh] flex items-center shadow-md"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <span className={`text-white ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-medium tracking-wide`}>
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
                            className={`text-white ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-medium tracking-wide bg-transparent border-none outline-none text-center ml-[0.3vw]`}
                            style={{ width: `${String(pages.length).length + 1}ch` }}
                        />
                        <span className={`text-white ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-medium tracking-wide`}>
                            / {totalPages}
                        </span>
                    </div>

                    {/* Next Page */}
                    <button
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        className="w-[2.6vw] h-[2.6vw] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw] text-white" />
                    </button>

                    {/* Last Page */}
                    <button
                        onClick={() => onPageClick(totalPages - 1)}
                        className="w-[2.6vw] h-[2.6vw] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                    >
                        <Icon icon="ph:skip-forward-fill" className="w-[1.1vw] h-[1.1vw] text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Grid9Layout;
