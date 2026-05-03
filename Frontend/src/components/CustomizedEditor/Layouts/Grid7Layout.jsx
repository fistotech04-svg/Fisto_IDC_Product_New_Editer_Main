import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePopup from '../popups/ProfilePopup';

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

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [showTOC, setShowTOC] = useState(false);
    const [showLocalProfile, setShowLocalProfile] = useState(false);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [editingBookmarkId, setEditingBookmarkId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNoteOptions, setShowNoteOptions] = useState(false);

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
        setEditingBookmarkId(null);
        setShowAddNotesPopupMemo?.(false);
        setShowAddBookmarkPopupMemo?.(false);
        setShowViewBookmarkPopup?.(false);
        setShowNotesViewerMemo?.(false);
        setShowProfilePopup?.(false);
        setShowThumbnailBarMemo?.(false);
        setShowTOCMemo?.(false);
        setShowBookmarkOptions(false);
        setShowNoteOptions(false);
        setShowSoundPopupMemo?.(false);
        setRecommendations([]);
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
            className="flex flex-col h-screen w-full overflow-hidden font-sans select-none relative"
            style={backgroundStyle}
            onClick={() => closeAll()}
        >
            {/* Main Background Overlay to support opacity without affecting children */}
            <div
                className="absolute inset-0 -z-10"
                style={{
                    backgroundColor: getLayoutColor('toolbar-bg', '#D7D8E8'),
                    opacity: getLayoutOpacity('toolbar-bg', 1) * 0.15
                }}
            />
            {/* Top Header - Light themed as in screenshot */}
            <div className={`${isTablet ? 'h-[7vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50`}>
                {/* Search Bar */}
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                        <div
                            className={`flex items-center rounded-[0.4vw] ${isTablet ? 'px-[0.6vw] py-[0.4vh] w-[11vw]' : 'px-[0.8vw] py-[0.5vw] shadow-sm w-[15vw]'} border relative overflow-hidden`}
                            style={{
                                borderColor: 'rgba(0,0,0,0.08)'
                            }}
                        >
                            <div className="absolute inset-0 -z-10" style={{
                                backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF'),
                                opacity: getLayoutOpacity('search-bg-v2', 1)
                            }} />
                            <Icon
                                icon="lucide:search"
                                className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`}
                                style={{
                                    color: getLayoutColor('search-text-v2', '#575C9C'),
                                    opacity: getLayoutOpacity('search-text-v2', 1) * 0.6
                                }}
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
                                style={{
                                    color: getLayoutColor('search-text-v2', '#2D2D2D'),
                                    opacity: getLayoutOpacity('search-text-v2', 1)
                                }}
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
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-col py-[0.3vw]">
                                    {recommendations.map((rec, idx) => (
                                        <button
                                            key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                            className="flex items-center justify-between px-[1vw] py-[0.6vw] hover:bg-white/20 transition-colors group"
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
                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                    <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                    {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                </span>
                                            </div>
                                            <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-bold opacity-60 tabular-nums shrink-0`}>Pg {rec.pageNumber}</span>
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
                            className={`absolute ${isTablet ? 'right-[3.1vw] top-[1.5vh] w-[16vw]' : 'right-[4.5vw] top-[2vh] w-[18vw]'} bottom-0 rounded-t-[1.5vw] z-[60] flex flex-col shadow-[-10px_0px_40px_rgba(0,0,0,0.15)] overflow-hidden border-t-[0.1vw] border-l-[0.1vw] border-r-[0.1vw] backdrop-blur-xl`}
                            style={{
                                backgroundColor: `rgba(var(--toc-bg-rgb, 255, 255, 255), var(--toc-bg-opacity, 0.6))`,
                                opacity: 1,
                                borderColor: getLayoutColor('toc-text', '#575C9C') + '4D' // 30% opacity of theme text color
                            }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <div className={`${isTablet ? 'h-[7vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b shrink-0`} style={{ borderColor: getLayoutColor('toc-text', '#575C9C') + '33' }}> {/* 20% opacity underline */}
                                <span className={`${isTablet ? 'text-[0.85vw]' : 'text-[1.1vw]'} font-bold`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</span>
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
                            className={`absolute ${isTablet ? 'right-[3.1vw] top-[1.5vh] w-[17vw]' : 'right-[4.5vw] top-[2vh] w-[19vw]'} bottom-0 rounded-t-[1.5vw] z-[60] flex flex-col shadow-[-10px_0px_40px_rgba(0,0,0,0.15)] overflow-hidden border-t-[0.1vw] border-l-[0.1vw] border-r-[0.1vw] backdrop-blur-xl`}
                            style={{
                                backgroundColor: `rgba(var(--toc-bg-rgb, 255, 255, 255), var(--toc-bg-opacity, 0.6))`,
                                opacity: 1,
                                borderColor: getLayoutColor('toc-text', '#575C9C') + '4D' // 30% opacity of theme text color
                            }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <div className={`${isTablet ? 'h-[6vh]' : 'h-[6.5vh]'} flex items-center justify-between px-[1.5vw] border-b-[0.1vw] shrink-0`} style={{ borderColor: getLayoutColor('toc-text', '#575C9C') + '33' }}>
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
                    style={{
                        color: getLayoutColor('toolbar-bg', '#575C9C'),
                        opacity: getLayoutOpacity('toolbar-bg', 1) * 0.5 // base 50% * custom opacity
                    }}
                    onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                >
                    <Icon icon="ph:caret-left" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'}`} />
                </button>

                {/* Right Navigation Arrow */}
                <button
                    className="absolute right-[5.5vw] top-1/2 -translate-y-1/2 w-[4vw] h-[4vw] flex items-center justify-center transition-all z-30 opacity-50 hover:opacity-100 hover:scale-110"
                    style={{
                        color: getLayoutColor('toolbar-bg', '#575C9C'),
                        opacity: getLayoutOpacity('toolbar-bg', 1) * 0.5 // base 50% * custom opacity
                    }}
                    onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                >
                    <Icon icon="ph:caret-right" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'}`} />
                </button>

                {/* Right Sidebar - EXACT UI FROM SCREENSHOT */}
                <div
                    className={`absolute ${isTablet ? 'right-[0.5vw] w-[2.4vw] py-[1.2vh] gap-[1.8vh] rounded-[0.5vw]' : 'right-[0.8vw] w-[2.8vw] py-[1.8vh] gap-[2.1vh] rounded-[0.7vw]'} top-[36%] -translate-y-1/2 flex flex-col z-40 shadow-2xl items-center overflow-visible`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute inset-0 -z-10" style={{
                        backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'),
                        opacity: getLayoutOpacity('toolbar-bg', 1),
                        borderRadius: isTablet ? '0.5vw' : '0.7vw'
                    }} />
                    <button
                        onClick={() => {
                            const wasOpen = showTOC;
                            closeAll();
                            if (!wasOpen) setShowTOC(true);
                        }}
                        className={`transition-all transform hover:scale-110 ${showTOC ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
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
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
                    >
                        <Icon icon="ph:squares-four-fill" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showNoteOptions;
                                closeAll();
                                if (!wasOpen) setShowNoteOptions(true);
                            }}
                            className={`transition-all transform hover:scale-110 ${showNoteOptions ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                        </button>
                        {showNoteOptions && (
                            <div
                                className={`absolute right-[calc(100%+0.5vw)] top-0 ${isTablet ? 'w-[10vw]' : 'w-[12vw]'} rounded-[1vw] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200 border backdrop-blur-xl`}
                                style={{
                                    backgroundColor: getLayoutColor('toc-bg', '#575C9C'),
                                    opacity: getLayoutOpacity('toc-bg', 1),
                                    borderColor: getLayoutColor('toc-text', '#FFFFFF') + '33' // 20% opacity border
                                }}
                            >
                                <button
                                    className="w-full flex items-center px-[0.8vw] py-[1.2vh] hover:opacity-80 transition-all gap-[0.8vw] text-left"
                                    onClick={() => {
                                        setShowAddNotesPopupMemo(true);
                                        setShowNoteOptions(false);
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`}
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}
                                    >
                                        <path d="M2.75499 14.7146L3.27199 16.6466C3.87599 18.9016 4.17899 20.0296 4.86399 20.7606C5.40464 21.3374 6.10408 21.7411 6.87399 21.9206C7.84999 22.1486 8.97799 21.8466 11.234 21.2426C13.488 20.6386 14.616 20.3366 15.347 19.6516C15.4077 19.5943 15.4663 19.5356 15.523 19.4756C15.1824 19.4449 14.8439 19.3948 14.509 19.3256C13.813 19.1876 12.986 18.9656 12.008 18.7036L11.901 18.6746L11.876 18.6686C10.812 18.3826 9.92299 18.1446 9.21299 17.8886C8.46599 17.6186 7.78799 17.2856 7.21099 16.7456C6.41731 16.002 5.86191 15.0398 5.61499 13.9806C5.43499 13.2116 5.48699 12.4576 5.62699 11.6766C5.76099 10.9276 6.00099 10.0296 6.28899 8.95463L6.82399 6.96062L6.84199 6.89062C4.92199 7.40763 3.91099 7.71362 3.23699 8.34462C2.65949 8.88568 2.25545 9.58588 2.07599 10.3566C1.84799 11.3316 2.14999 12.4596 2.75499 14.7146Z" fill="currentColor" />
                                        <path fillRule="evenodd" clipRule="evenodd" d="M11.8741 2.07599C12.85 1.84807 13.9778 2.14979 16.2335 2.7547C16.8008 2.90671 17.2972 3.03922 17.7335 3.16388C17.275 3.7184 17.0001 4.43016 17.0001 5.20587C17.0001 6.97649 18.4355 8.41192 20.2061 8.41192C20.6511 8.4119 21.0748 8.32092 21.46 8.15704C21.3339 8.82433 21.1174 9.64216 20.8301 10.7147L20.3116 12.6463C19.7066 14.9013 19.4048 16.0296 18.7198 16.7606C18.1793 17.3377 17.48 17.7419 16.71 17.9217C16.6135 17.9443 16.515 17.9614 16.4151 17.9734C15.5001 18.0864 14.3827 17.788 12.3507 17.244C10.0957 16.639 8.96738 16.3362 8.23639 15.6512C7.65932 15.1105 7.25582 14.4106 7.07624 13.6404C6.84831 12.6645 7.15003 11.5377 7.75495 9.28302L8.27155 7.3504L8.51569 6.4461C8.97069 4.78012 9.27733 3.86314 9.86432 3.23614C10.405 2.65934 11.1042 2.25553 11.8741 2.07599ZM11.1924 12.1736C11.0005 12.1225 10.7961 12.1495 10.6241 12.2488C10.452 12.3482 10.326 12.512 10.2745 12.7039C10.249 12.799 10.2431 12.8983 10.2559 12.9959C10.2687 13.0935 10.3005 13.188 10.3497 13.2733C10.3988 13.3584 10.4641 13.4331 10.5421 13.493C10.6202 13.553 10.7096 13.5973 10.8048 13.6229L13.7032 14.3983C13.7993 14.4276 13.9001 14.438 14.0001 14.4275C14.1002 14.417 14.1981 14.3865 14.2862 14.3377C14.3741 14.289 14.4509 14.2225 14.5128 14.1434C14.5747 14.0641 14.6205 13.973 14.6466 13.8758C14.6726 13.7785 14.6791 13.6767 14.6651 13.577C14.6511 13.4773 14.6174 13.381 14.5655 13.2947C14.5137 13.2086 14.4446 13.1341 14.3633 13.075C14.2819 13.0158 14.189 12.9736 14.0909 12.951L11.1924 12.1736ZM11.6778 9.25567C11.5801 9.26848 11.4858 9.30021 11.4005 9.34942C11.3153 9.39855 11.2407 9.46389 11.1807 9.54181C11.1208 9.6199 11.0764 9.70941 11.0508 9.8045C10.9995 9.99651 11.0267 10.2027 11.126 10.3748C11.2254 10.5467 11.3893 10.6719 11.5811 10.7234L16.4112 12.0174C16.5072 12.0462 16.6084 12.0555 16.7081 12.0447C16.8075 12.0339 16.9038 12.0035 16.9913 11.9549C17.079 11.9061 17.1561 11.8397 17.2178 11.7606C17.2796 11.6814 17.3246 11.5909 17.3507 11.494C17.3767 11.397 17.384 11.2955 17.3702 11.1961C17.3564 11.0968 17.3219 11.001 17.2706 10.9149C17.2192 10.8289 17.1511 10.7544 17.0704 10.6951C16.9895 10.6358 16.8975 10.5933 16.7999 10.5701L11.9698 9.27423C11.8747 9.2487 11.7754 9.24288 11.6778 9.25567Z" fill="currentColor" />
                                        <path d="M20.2062 3V6.63111M22.0217 4.81555H18.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>Add Notes</span>
                                </button>
                                <div className="h-[1px] w-full" style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.1 }} />
                                <button
                                    className="w-full flex items-center px-[0.8vw] py-[1.2vh] hover:opacity-80 transition-all gap-[0.8vw] text-left"
                                    onClick={() => {
                                        setShowNotesViewerMemo(true);
                                        setShowNoteOptions(false);
                                    }}
                                >
                                    <Icon icon="lets-icons:view-fill" className={`${isTablet ? 'w-[1vw]' : 'w-[1.2vw]'}`} style={{ color: getLayoutColor('toc-text', '#FFFFFF') }} />
                                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>View Notes</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showBookmarkOptions;
                                closeAll();
                                if (!wasOpen) setShowBookmarkOptions(true);
                            }}
                            className={`transition-all transform hover:scale-110 ${showBookmarkOptions ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                        </button>
                        {showBookmarkOptions && (
                            <div
                                className={`absolute right-[calc(100%+0.5vw)] top-0 ${isTablet ? 'w-[10vw]' : 'w-[12vw]'} rounded-[1vw] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200 border backdrop-blur-xl`}
                                style={{
                                    backgroundColor: getLayoutColor('toc-bg', '#575C9C'),
                                    opacity: getLayoutOpacity('toc-bg', 1),
                                    borderColor: getLayoutColor('toc-text', '#FFFFFF') + '33'
                                }}
                            >
                                <button
                                    className="w-full flex items-center px-[0.8vw] py-[1.2vh] hover:opacity-80 transition-all gap-[0.8vw] text-left"
                                    onClick={() => {
                                        setShowAddBookmarkPopupMemo(true);
                                        setShowBookmarkOptions(false);
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`}
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}
                                    >
                                        <path d="M15.2354 2C15.084 2.37237 15 2.77935 15 3.20605C15 4.97672 16.4354 6.41209 18.2061 6.41211C18.8707 6.41211 19.488 6.20962 20 5.86328V21.0283C19.9998 22.2481 18.6198 22.958 17.6279 22.249L12 18.2285L6.37207 22.249C5.37915 22.959 4.00022 22.2491 4 21.0293V5C4 4.20435 4.3163 3.44152 4.87891 2.87891C5.44152 2.3163 6.20435 2 7 2H15.2354Z" fill="currentColor" />
                                        <path d="M18.2062 1V4.63111M20.0217 2.81555H16.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>Add Bookmark</span>
                                </button>
                                <div className="h-[1px] w-full" style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.1 }} />
                                <button
                                    className="w-full flex items-center px-[0.8vw] py-[1.2vh] hover:opacity-80 transition-all gap-[0.8vw] text-left"
                                    onClick={() => {
                                        setShowViewBookmarkPopup(true);
                                        setShowBookmarkOptions(false);
                                    }}
                                >
                                    <Icon icon="lets-icons:view-fill" className={`${isTablet ? 'w-[1vw]' : 'w-[1.2vw]'}`} style={{ color: getLayoutColor('toc-text', '#FFFFFF') }} />
                                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-medium`} style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>View Bookmark</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            closeAll();
                            setShowGalleryPopupMemo(true);
                        }}
                        className="transition-all transform hover:scale-110 opacity-90 hover:opacity-100"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
                    >
                        <Icon icon="clarity:image-gallery-solid" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const wasOpen = showSoundPopup;
                            closeAll();
                            if (!wasOpen) setShowSoundPopupMemo?.(true);
                        }}
                        className={`transition-all transform hover:scale-110 ${showSoundPopup ? 'opacity-100' : 'opacity-90 hover:opacity-100'} ${isMuted ? 'opacity-30' : ''}`}
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
                    >
                        <Icon icon="solar:music-notes-bold" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={() => {
                            const wasOpen = showLocalProfile;
                            closeAll();
                            if (!wasOpen) setShowLocalProfile(true);
                        }}
                        className={`transition-all transform hover:scale-110 ${showLocalProfile ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
                    >
                        <Icon icon="fluent:person-24-filled" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="transition-all transform hover:scale-110 opacity-90 hover:opacity-100"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
                    >
                        <Icon icon="mage:share-fill" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="transition-all transform hover:scale-110 opacity-90 hover:opacity-100"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
                    >
                        <Icon icon="meteor-icons:download" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} />
                    </button>
                    <button
                        onClick={handleFullScreen}
                        className="transition-all transform hover:scale-110 border-t pt-[1vh] mt-[0.5vh] w-full flex justify-center hover:opacity-100"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1) * 0.9,
                            borderColor: 'rgba(255,255,255,0.2)'
                        }}
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

            <div
                className={`${isTablet ? 'h-[6vh]' : 'h-[7vh] mb-[1.2vh]'} flex items-center px-[2vw] shrink-0 w-full relative z-40 transition-all duration-300 overflow-visible`}
            >
                <div className="absolute inset-0 -z-10" style={{
                    backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'),
                    opacity: getLayoutOpacity('toolbar-bg', 1)
                }} />
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.2vw] mr-[2vw]">
                    <button
                        onClick={() => onPageClick && onPageClick(0)}
                        className="transition-all transform active:scale-95"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1) * 0.8
                        }}
                    >
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button
                        onClick={() => setIsPlaying(!isAutoFlipping)}
                        className="transition-all transform active:scale-90"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
                    >
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                    </button>
                    <button
                        onClick={() => onPageClick && onPageClick(pagesCount - 1)}
                        className="transition-all transform active:scale-95"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1) * 0.8
                        }}
                    >
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                </div>

                {/* Progress Bar Container */}
                <div
                    ref={progressRef}
                    className="flex-1 flex items-center relative group h-[2vw] cursor-pointer"
                    onClick={handleProgressClick}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={() => {
                        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                        setProgressHover(prev => ({ ...prev, visible: false }));
                    }}
                >
                    <div
                        className={`w-full ${isTablet ? 'h-[0.2vw]' : 'h-[0.22vw]'} rounded-full relative overflow-hidden`}
                    >
                        {/* Track Underlay */}
                        <div className="absolute inset-0 transition-colors duration-300" style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: isTablet ? 0.4 : 0.3 }} />
                        {/* Progress Fill */}
                        <div
                            className="absolute top-0 left-0 h-full transition-all duration-300 ease-out z-10"
                            style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), width: `${progressPercentage}%`, opacity: isTablet ? 1 : 'var(--toolbar-icon-opacity, 1)' }}
                        />
                    </div>

                    {/* Hover Popup - Matching Grid6Layout style */}
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

                                    {/* Arrow with SVG shape from Layout 5/6 */}
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
                                style={{
                                    color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                    opacity: getLayoutOpacity('toolbar-text-main', 1)
                                }}
                            >
                                <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[0.9vw] h-[0.9vw]'}`} />
                            </button>
                            <span
                                className={`font-bold ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} tabular-nums min-w-[2.5vw] text-center`}
                                style={{
                                    color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                    opacity: getLayoutOpacity('toolbar-text-main', 1)
                                }}
                            >
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                className="hover:scale-110 transition-transform"
                                style={{
                                    color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                    opacity: getLayoutOpacity('toolbar-text-main', 1)
                                }}
                            >
                                <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[0.9vw] h-[0.9vw]'}`} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-bold px-[0.8vw] py-[0.35vw] rounded-[0.4vw] hover:opacity-90 active:scale-95 transition-all`}
                            style={{
                                backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                color: getLayoutColor('bottom-toolbar-bg', '#575C9C')
                            }}
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
