import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePopup from '../ProfilePopup';

const PageThumbnail = React.memo(({ html, index, scale = 0.2 }) => {
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
            <div style={{ width: `${400 * scale}px`, height: `${566 * scale}px`, position: 'relative', overflow: 'hidden' }}>
                <iframe
                    className="border-none pointer-events-none"
                    srcDoc={srcDoc}
                    title={`Thumb ${index}`}
                    loading="lazy"
                    style={{
                        width: '400px',
                        height: '566px',
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        backgroundColor: '#575C9C',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                />
            </div>
        </div>
    );
});

const Grid7Layout = ({
    children,
    layoutColors,
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
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? colorObj.hex : `var(--${id}, ${defaultColor})`;
        }
        
        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[7] && Array.isArray(layoutColors[7])) {
            const colorObj = layoutColors[7].find(c => c.id === id);
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
        if (layoutColors[7] && Array.isArray(layoutColors[7])) {
            const colorObj = layoutColors[7].find(c => c.id === id);
            return colorObj ? colorObj.opacity / 100 : defaultOpacity;
        }
        
        return defaultOpacity;
    };

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
        const color = getLayoutColor(id, null);
        if (color && color.startsWith('#')) return color;
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [showTOC, setShowTOC] = useState(false);
    const [showLocalProfile, setShowLocalProfile] = useState(false);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [editingBookmarkId, setEditingBookmarkId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [showLocalBookmarkDropdown, setShowLocalBookmarkDropdown] = useState(false);
    const [showLocalNotesDropdown, setShowLocalNotesDropdown] = useState(false);

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

    const closeAll = () => {
        setShowThumbnails(false);
        setShowTOC(false);
        setShowLocalProfile(false);
        setShowBookmarks(false);
        setShowLocalBookmarkDropdown(false);
        setShowLocalNotesDropdown(false);
        setEditingBookmarkId(null);
        setShowAddNotesPopupMemo?.(false);
        setShowAddBookmarkPopupMemo?.(false);
        setShowViewBookmarkPopup?.(false);
        setShowNotesViewerMemo?.(false);
        setShowProfilePopup?.(false);
        setShowThumbnailBarMemo?.(false);
        setShowTOCMemo?.(false);
    };

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

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    const progressPercentage = (currentPage / (pagesCount - 1)) * 100;

    return (
        <div
            className="flex flex-col h-screen w-full overflow-hidden font-sans select-none"
            style={backgroundStyle || { backgroundColor: '#D7D8E8' }}
            onClick={() => closeAll()}
        >
            {/* Top Header - Light themed as in screenshot */}
            <div className={`${isTablet ? 'h-[7vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50`}>
                {/* Search Bar */}
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                        <div 
                            className={`flex items-center rounded-[0.4vw] ${isTablet ? 'px-[0.6vw] py-[0.4vh] w-[11vw]' : 'px-[0.8vw] py-[0.5vw] shadow-sm w-[15vw]'} border`}
                            style={{ 
                                backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF'), 
                                borderColor: 'rgba(0,0,0,0.05)' 
                            }}
                        >
                            <Icon 
                                icon="lucide:search" 
                                className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`} 
                                style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 0.6 }}
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
                                onFocus={() => closeAll()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchQuery(localSearchQuery);
                                        handleQuickSearch(localSearchQuery);
                                        setRecommendations([]);
                                    }
                                }}
                                placeholder="Quick Search..."
                                className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                style={{ color: getLayoutColor('search-text-v1', '#2D2D2D') }}
                            />
                        </div>

                        {/* Search Suggestions Dropdown */}
                        {recommendations.length > 0 && (
                            <div
                                className="absolute top-full left-0 w-full rounded-b-[0.8vw] shadow-2xl z-[100] border backdrop-blur-md overflow-hidden"
                                style={{ 
                                    backgroundColor: getLayoutColor('dropdown-bg', 'rgba(255,255,255,0.4)'), 
                                    opacity: getLayoutOpacity('dropdown-bg', 1),
                                    borderColor: 'rgba(255,255,255,0.2)'
                                }}
                            >
                                <div className="flex flex-col py-[0.3vw]">
                                    {recommendations.map((rec, idx) => (
                                        <button
                                            key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                            className="flex items-center justify-between px-[1vw] py-[0.6vw] hover:bg-white/20 transition-colors group"
                                            style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                            onClick={() => {
                                                onPageClick(rec.pageNumber - 1);
                                                setLocalSearchQuery(rec.word);
                                                setSearchQuery(rec.word);
                                                setRecommendations([]);
                                            }}
                                        >
                                            <span className="text-[0.8vw] font-medium opacity-80 group-hover:opacity-100">{rec.word}</span>
                                            <span className="text-[0.7vw] font-bold opacity-60">Pg {rec.pageNumber}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: Book Name - Screenshot style */}
                <div 
                    className={`absolute left-1/2 -translate-x-1/2 ${isTablet ? 'text-[1.1vw]' : 'text-[1.2vw]'} font-semibold tracking-wide`}
                    style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                >
                    {bookName || "Name of the book"}
                </div>

                {/* Right: Logo */}
                <div className="flex items-center">
                    {logoSettings?.src && (
                        <div className="bg-transparent p-[0.4vw]">
                            <img
                                src={logoSettings.src}
                                alt="Logo"
                                className={`${isTablet ? 'h-[1.8vw]' : 'h-[2.2vw]'} w-auto`}
                                style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 relative min-h-0">
                {/* TOC Panel */}
                <AnimatePresence>
                    {showTOC && (
                        <motion.div
                            className={`absolute ${isTablet ? 'right-[3.1vw] top-[1.5vh] w-[16vw]' : 'right-[4.5vw] top-[2vh] w-[18vw]'} bottom-0 rounded-t-[1.5vw] z-[60] flex flex-col shadow-[-10px_0px_40px_rgba(0,0,0,0.15)] overflow-hidden border-t-[0.1vw] border-l-[0.1vw] border-r-[0.1vw]`}
                            style={{ 
                                backgroundColor: getLayoutColorRgba('toc-bg', '255,255,255', '0.4'), 
                                opacity: getLayoutOpacity('toc-bg', 1),
                                borderColor: 'rgba(255,255,255,0.2)' 
                            }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <div className={`${isTablet ? 'h-[7vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b shrink-0`} style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className={`${isTablet ? 'text-[1vw]' : 'text-[1.4vw]'} font-bold`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</span>
                                <button onClick={() => { setShowTOC(false); setTocSearchQuery(''); }} className="transition-colors" style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.6 }}>
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                                </button>
                            </div>

                            {/* Search Box */}
                            {settings.tocSettings?.addSearch !== false && (
                                <div className="px-[1vw] py-[1.2vh] border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                    <div 
                                        className="flex items-center rounded-[0.5vw] px-[0.8vw] py-[0.5vw] border group transition-all"
                                        style={{ 
                                            backgroundColor: 'rgba(0,0,0,0.05)', 
                                            borderColor: 'rgba(0,0,0,0.05)' 
                                        }}
                                    >
                                        <Icon icon="lucide:search" className="w-[1vw] h-[1vw]" style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.4 }} />
                                        <input
                                            type="text"
                                            value={tocSearchQuery}
                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                            placeholder="Search in TOC..."
                                            className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} ml-[0.5vw] w-full font-sans`}
                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                        />
                                        {tocSearchQuery && (
                                            <button onClick={() => setTocSearchQuery('')} style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.4 }}>
                                                <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-[1vw] flex flex-col pt-[1vh]">
                                    {settings.tocSettings?.content?.length > 0 ? (
                                        <div className="flex flex-col gap-[0.5vh]">
                                            {settings.tocSettings.content
                                                .filter(item => {
                                                    if (!tocSearchQuery) return true;
                                                    const matchMain = item.title.toLowerCase().includes(tocSearchQuery.toLowerCase());
                                                    const matchSub = item.subheadings?.some(sub => sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase()));
                                                    return matchMain || matchSub;
                                                })
                                                .map((item, idx) => (
                                                    <div key={idx} className="flex flex-col mb-[0.8vh]">
                                                        <div
                                                            className={`flex items-center justify-between ${isTablet ? 'py-[0.5vh] px-[0.6vw]' : 'py-[0.8vh] px-[0.8vw]'} hover:bg-white/10 rounded-[0.5vw] cursor-pointer transition-all group`}
                                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                            onClick={() => { onPageClick(item.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                        >
                                                            <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw]">
                                                                {settings.tocSettings?.addSerialNumberToHeading !== false && (
                                                                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold opacity-40 shrink-0`}>{idx + 1}.</span>
                                                                )}
                                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-semibold group-hover:opacity-100 truncate opacity-90`}>
                                                                    {item.title}
                                                                </span>
                                                            </div>
                                                            {settings.tocSettings?.addPageNumber !== false && (
                                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold opacity-40 group-hover:opacity-80 tabular-nums`}>
                                                                    {item.page < 10 ? `0${item.page}` : item.page}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.subheadings && item.subheadings.length > 0 && (
                                                            <div className="flex flex-col mt-[0.1vh]">
                                                                {item.subheadings
                                                                    .filter(sub => !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase()))
                                                                    .map((sub, sIdx) => (
                                                                        <div
                                                                            key={sIdx}
                                                                            className="flex items-center justify-between py-[0.6vh] px-[0.8vw] hover:bg-white/10 rounded-[0.5vw] cursor-pointer transition-all group"
                                                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                                            onClick={() => { onPageClick(sub.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                                        >
                                                                            <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw] pl-[0.5vw]">
                                                                                {settings.tocSettings?.addSerialNumberToSubheading !== false && (
                                                                                    <span className="text-[0.8vw] font-bold opacity-30 shrink-0">{idx + 1}.{sIdx + 1}</span>
                                                                                )}
                                                                                <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-medium opacity-70 group-hover:opacity-100 truncate`}>
                                                                                    {sub.title}
                                                                                </span>
                                                                            </div>
                                                                            {settings.tocSettings?.addPageNumber !== false && (
                                                                                <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-semibold opacity-30 group-hover:opacity-60 tabular-nums`}>
                                                                                    {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-[10vh] opacity-30 select-none">
                                            <Icon icon="ph:list-bullets-bold" className="w-[3vw] h-[3vw] mb-[1.5vh]" style={{ color: getLayoutColor('toc-icon', '#575C9C') }} />
                                            <span className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>No Table of Contents</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Thumbnails Panel */}
                <AnimatePresence>
                    {showThumbnails && (
                        <motion.div
                            className={`absolute ${isTablet ? 'right-[3.1vw] top-[1.5vh] w-[17vw]' : 'right-[4.5vw] top-[2vh] w-[19vw]'} bottom-0 rounded-t-[1.5vw] z-[60] flex flex-col shadow-[-10px_0px_40px_rgba(0,0,0,0.15)] overflow-hidden border-t-[0.1vw] border-l-[0.1vw] border-r-[0.1vw]`}
                            style={{ 
                                backgroundColor: getLayoutColorRgba('toc-bg', '255,255,255', '0.4'), 
                                opacity: getLayoutOpacity('toc-bg', 1),
                                borderColor: 'rgba(255,255,255,0.2)' 
                            }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <div className={`${isTablet ? 'h-[6vh]' : 'h-[6.5vh]'} flex items-center justify-between px-[1.5vw] border-b-[0.1vw] shrink-0`} style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className={`${isTablet ? 'text-[1vw]' : 'text-[1.2vw]'} font-bold`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Thumbnails</span>
                                <button onClick={() => setShowThumbnails(false)} className="transition-colors" style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.8 }}>
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-[1.2vw] py-[1.5vh] custom-scrollbar">
                                <div className="flex gap-[0.8vw]">
                                    {/* Left Column */}
                                    <div className="flex-1 flex flex-col gap-[0.8vw] min-w-0">
                                        {spreads.filter((_, i) => i % 2 === 0).map((spread, idx) => {
                                            const isSelected = spread.indices.includes(currentPage);
                                            return (
                                                <div
                                                    key={`l-${idx}`}
                                                    className={`w-full bg-white rounded-[0.6vw] flex flex-col cursor-pointer transition-all p-[0.3vw] shadow-[0_0.2vw_0.6vw_rgba(0,0,0,0.08)] hover:shadow-[0_0.4vw_1vw_rgba(0,0,0,0.15)] ${isSelected ? 'ring-[0.15vw] ring-white' : 'ring-[0.1vw] ring-transparent'}`}
                                                    onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                                >
                                                    <div className="aspect-[1.4/1] rounded-[0.4vw] overflow-hidden bg-gray-50/50 mb-[0.2vw] ring-1 ring-gray-100/50">
                                                        <div className="flex gap-0 w-full h-full justify-center">
                                                            {spread.pages.map((page, pIdx) => (
                                                                <div key={pIdx} className="flex-1 max-w-[50%] flex min-w-0">
                                                                    <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={isTablet ? 0.09 : 0.13} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-center pb-[0.2vh]">
                                                        <span className="text-[0.65vw] font-medium" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                                            {spread.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Right Column */}
                                    <div className="flex-1 flex flex-col gap-[0.8vw] min-w-0 pt-[3.5vh]">
                                        {spreads.filter((_, i) => i % 2 !== 0).map((spread, idx) => {
                                            const isSelected = spread.indices.includes(currentPage);
                                            return (
                                                <div
                                                    key={`r-${idx}`}
                                                    className={`w-full bg-white rounded-[0.6vw] flex flex-col cursor-pointer transition-all p-[0.3vw] shadow-[0_0.2vw_0.6vw_rgba(0,0,0,0.08)] hover:shadow-[0_0.4vw_1vw_rgba(0,0,0,0.15)] ${isSelected ? 'ring-[0.15vw] ring-white' : 'ring-[0.1vw] ring-transparent'}`}
                                                    onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                                >
                                                    <div className="aspect-[1.4/1] rounded-[0.4vw] overflow-hidden bg-gray-50/50 mb-[0.2vw] ring-1 ring-gray-100/50">
                                                        <div className="flex gap-0 w-full h-full justify-center">
                                                            {spread.pages.map((page, pIdx) => (
                                                                <div key={pIdx} className="flex-1 max-w-[50%] flex min-w-0">
                                                                    <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={isTablet ? 0.09 : 0.13} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-center pb-[0.2vh]">
                                                        <span className="text-[0.65vw] font-medium" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                                            {spread.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bookmark Panel */}
                <AnimatePresence>
                    {showBookmarks && (
                        <motion.div
                            className={`absolute ${isTablet ? 'right-[3.1vw] top-[1.5vh] w-[16vw]' : 'right-[4.5vw] top-[2vh] w-[18vw]'} bottom-0 rounded-t-[1.5vw] z-[60] flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.15)] overflow-hidden border-t-[0.1vw] border-l-[0.1vw] border-r-[0.1vw]`}
                            style={{ 
                                backgroundColor: getLayoutColor('toc-bg', 'rgba(255,255,255,0.4)'), 
                                opacity: getLayoutOpacity('toc-bg', 1),
                                borderColor: 'rgba(255,255,255,0.2)' 
                            }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <div className={`${isTablet ? 'h-[7vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b shrink-0`} style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className={`${isTablet ? 'text-[1vw]' : 'text-[1.4vw]'} font-bold`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Bookmarks</span>
                                <button onClick={() => setShowBookmarks(false)} className="transition-colors" style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.6 }}>
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-[1vw]">
                                {bookmarks && bookmarks.length > 0 ? (
                                    <div className="flex flex-col gap-[0.5vh]">
                                        {bookmarks.map((bookmark, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between py-[1vh] px-[1vw] group"
                                            >
                                                {editingBookmarkId === (bookmark.id || idx) ? (
                                                    <input
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                onUpdateBookmark?.(bookmark.id || idx, editValue);
                                                                setEditingBookmarkId(null);
                                                            }
                                                            if (e.key === 'Escape') setEditingBookmarkId(null);
                                                        }}
                                                        onBlur={() => {
                                                            onUpdateBookmark?.(bookmark.id || idx, editValue);
                                                            setEditingBookmarkId(null);
                                                        }}
                                                        className="flex-1 rounded-[0.3vw] px-[0.4vw] py-[0.1vh] text-[0.9vw] font-semibold outline-none border"
                                                        style={{ 
                                                            backgroundColor: 'rgba(0,0,0,0.05)', 
                                                            borderColor: 'rgba(0,0,0,0.05)',
                                                            color: getLayoutColor('toc-text', '#575C9C')
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <span
                                                        className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-semibold cursor-pointer truncate flex-1`}
                                                        style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                        onClick={() => {
                                                            const pageNum = parseInt(bookmark.pageIndex);
                                                            if (!isNaN(pageNum)) {
                                                                onPageClick(pageNum);
                                                                setShowBookmarks(false);
                                                            }
                                                        }}
                                                    >
                                                        {bookmark.label || `Page ${(parseInt(bookmark.pageIndex) || 0) + 1}`}
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-[0.8vw] shrink-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingBookmarkId(bookmark.id || idx);
                                                            setEditValue(bookmark.label || `Page ${(parseInt(bookmark.pageIndex) || 0) + 1}`);
                                                        }}
                                                        className="transition-colors"
                                                        style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.6 }}
                                                    >
                                                        <Icon icon="mdi:rename" className="w-[1.1vw] h-[1.1vw]" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteBookmark?.(bookmark.id || idx);
                                                        }}
                                                        className="text-red-300/60 hover:text-red-400 transition-colors"
                                                    >
                                                        <Icon icon="material-symbols-light:delete-outline-rounded" className="w-[1.2vw] h-[1.2vw]" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-[10vh] opacity-30 select-none">
                                        <Icon icon="ph:bookmark-bold" className="w-[3vw] h-[3vw] mb-[1.5vh]" style={{ color: getLayoutColor('toc-icon', '#575C9C') }} />
                                        <span className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>No Bookmarks</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Left Navigation Arrow */}
                <button
                    className="absolute left-[2vw] top-1/2 -translate-y-1/2 w-[4vw] h-[4vw] flex items-center justify-center transition-all z-30 opacity-50 hover:opacity-100 hover:scale-110"
                    style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                    onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                >
                    <Icon icon="ph:caret-left" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'}`} />
                </button>

                {/* Right Navigation Arrow */}
                <button
                    className="absolute right-[5.5vw] top-1/2 -translate-y-1/2 w-[4vw] h-[4vw] flex items-center justify-center transition-all z-30 opacity-50 hover:opacity-100 hover:scale-110"
                    style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                    onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                >
                    <Icon icon="ph:caret-right" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'}`} />
                </button>

                {/* Right Sidebar - EXACT UI FROM SCREENSHOT */}
                <div
                    className={`absolute ${isTablet ? 'right-[0.5vw] w-[2.4vw] py-[1.2vh] gap-[1.8vh] rounded-[0.8vw]' : 'right-[0.8vw] w-[2.8vw] py-[1.8vh] gap-[2.1vh] rounded-[1vw]'} top-[36%] -translate-y-1/2 flex flex-col z-40 shadow-2xl items-center`}
                    style={{ 
                        backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'),
                        opacity: getLayoutOpacity('toolbar-bg', 1)
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            const wasOpen = showTOC;
                            closeAll();
                            if (!wasOpen) setShowTOC(true);
                        }}
                        className={`transition-all transform hover:scale-110 ${showTOC ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon="fluent:text-bullet-list-24-filled" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={() => {
                            const wasOpen = showThumbnails;
                            closeAll();
                            if (!wasOpen) setShowThumbnails(true);
                        }}
                        className={`transition-all transform hover:scale-110 ${showThumbnails ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon="ph:squares-four-fill" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <div className="relative w-full flex justify-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showLocalNotesDropdown;
                                closeAll();
                                if (!wasOpen) setShowLocalNotesDropdown(true);
                            }}
                            className={`transition-all transform hover:scale-110 ${showLocalNotesDropdown ? 'opacity-100 bg-white/20 p-[0.2vw] rounded-[0.4vw]' : 'opacity-90 hover:opacity-100'}`}
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="material-symbols-light:add-notes" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                        </button>
                        <AnimatePresence>
                            {showLocalNotesDropdown && (
                                <motion.div initial={{ opacity: 0, x: 10, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute right-[calc(100%+1vw)] top-1/2 -translate-y-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '9vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                    
                    <div className="relative w-full flex justify-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showLocalBookmarkDropdown;
                                closeAll();
                                if (!wasOpen) setShowLocalBookmarkDropdown(true);
                            }}
                            className={`transition-all transform hover:scale-110 ${showLocalBookmarkDropdown ? 'opacity-100 bg-white/20 p-[0.2vw] rounded-[0.4vw]' : 'opacity-90 hover:opacity-100'}`}
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="fluent:bookmark-24-filled" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                        </button>
                        <AnimatePresence>
                            {showLocalBookmarkDropdown && (
                                <motion.div initial={{ opacity: 0, x: 10, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute right-[calc(100%+1vw)] top-1/2 -translate-y-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '10vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                    <button
                        onClick={() => {
                            closeAll();
                            setShowGalleryPopupMemo(true);
                        }}
                        className="transition-all transform hover:scale-110 opacity-90 hover:opacity-100"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon="clarity:image-gallery-solid" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); }}
                        className={`transition-all transform hover:scale-110 ${showSoundPopup ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon={isMuted ? "solar:music-notes-bold" : "solar:music-notes-bold"} width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={() => {
                            const wasOpen = showLocalProfile;
                            closeAll();
                            if (!wasOpen) setShowLocalProfile(true);
                        }}
                        className={`transition-all transform hover:scale-110 ${showLocalProfile ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon="fluent:person-24-filled" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="transition-all transform hover:scale-110 opacity-90 hover:opacity-100"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon="mage:share-fill" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="transition-all transform hover:scale-110 opacity-90 hover:opacity-100"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon="meteor-icons:download" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={handleFullScreen}
                        className="transition-all transform hover:scale-110 border-t pt-[1vh] mt-[0.5vh] w-full flex justify-center opacity-90 hover:opacity-100"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), borderColor: 'rgba(255,255,255,0.2)' }}
                    >
                        <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                </div>



                {/* Page Counter Badge - Floating above footer */}
                <div 
                    className={`absolute right-[0.8vw] ${isTablet ? 'bottom-[4vh] rounded-[0.3vw]' : 'bottom-[2.5vh] rounded-[0.4vw]'} px-[0.8vw] py-[0.4vh] shadow-lg z-30 border min-w-[5vw] flex items-center justify-center transition-all duration-300`}
                    style={{ 
                        backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                        opacity: getLayoutOpacity('toolbar-text-main', 1),
                        borderColor: 'rgba(0,0,0,0.05)'
                    }}
                >
                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold`} style={{ color: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}>Page </span>
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
                        className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold bg-transparent border-none outline-none text-center`}
                        style={{ width: `${String(pages.length).length + 1}ch`, color: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}
                    />
                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold`} style={{ color: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}> / {pagesCount}</span>
                </div>

                {/* Book Viewer Container */}
                <div className={`flex-1 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-[2vw] pr-[5vw]'} select-none`}>
                    <div
                        className="relative transition-all duration-600 ease-in-out"
                        style={{
                            transform: `translateX(${localOffset}px) scale(1)`,
                            transformOrigin: 'center center',
                            filter: 'drop-shadow(0 2vw 4vw rgba(0,0,0,0.1))'
                        }}
                    >
                        {modifiedChildren}
                    </div>
                </div>

                {/* Profile Popup */}
                <AnimatePresence>
                    {showLocalProfile && (
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <ProfilePopup
                                onClose={() => setShowLocalProfile(false)}
                                profileSettings={profileSettings}
                                activeLayout={7}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Footer - EXACT MATCH TO SCREENSHOT */}
            <div 
                className={`${isTablet ? 'h-[6vh]' : 'h-[7vh]'} flex items-center px-[2vw] shrink-0 w-full relative z-40 transition-all duration-300`}
                style={{ 
                    backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C'),
                    opacity: getLayoutOpacity('bottom-toolbar-bg', 1)
                }}
            >
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.2vw] mr-[2vw]">
                    <button 
                        onClick={() => onPageClick && onPageClick(0)} 
                        className="transition-all transform active:scale-95"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.8 }}
                    >
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button 
                        onClick={() => setIsPlaying(!isAutoFlipping)} 
                        className="transition-all transform active:scale-90"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                    </button>
                    <button 
                        onClick={() => onPageClick && onPageClick(pagesCount - 1)} 
                        className="transition-all transform active:scale-95"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.8 }}
                    >
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                </div>

                {/* Progress Bar Container */}
                <div className="flex-1 flex items-center relative group h-[2vw]">
                    <div 
                        className="w-full h-[0.3vw] rounded-full relative overflow-visible"
                        style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.2 }}
                    >
                        <div
                            className="absolute top-0 left-0 h-full rounded-full shadow-[0_0_0.8vw_rgba(255,255,255,0.4)]"
                            style={{ 
                                width: `${progressPercentage}%`,
                                backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF')
                            }}
                        />
                        {/* Circle Indicator */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-[0.8vw] h-[0.8vw] rounded-full shadow-lg border border-gray-200"
                            style={{ 
                                left: `calc(${progressPercentage}% - 0.4vw)`,
                                backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF')
                            }}
                        />
                    </div>
                </div>

                {/* Zoom & Reset Cluster */}
                <div className="flex items-center ml-[2vw]">
                    <div 
                        className="flex items-center rounded-[0.5vw] p-[0.3vw] pl-[0.8vw] gap-[1vw] border"
                        style={{ 
                            backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') + '1A', // 10% opacity
                            borderColor: getLayoutColor('toolbar-text-main', '#FFFFFF') + '1A'
                        }}
                    >
                        <div className="flex items-center gap-[0.8vw]">
                            <button 
                                onClick={(e) => { e.stopPropagation(); zoomOut(); }} 
                                className="hover:scale-110 transition-transform"
                                style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[0.9vw] h-[0.9vw]'}`} />
                            </button>
                            <span 
                                className={`font-bold ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} tabular-nums min-w-[2.5vw] text-center`}
                                style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); zoomIn(); }} 
                                className="hover:scale-110 transition-transform"
                                style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[0.9vw] h-[0.9vw]'}`} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`bg-white ${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-bold px-[0.8vw] py-[0.35vw] rounded-[0.4vw] hover:bg-white/90 active:scale-95 transition-all`}
                            style={{ color: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${getLayoutColor('toolbar-bg', '#575C9C')}20;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${getLayoutColor('toolbar-bg', '#575C9C')}40;
                }
            `}</style>
        </div>
    );
};

export default Grid7Layout;
