import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import AddBookmarkPopup from '../AddBookmarkPopup';
import AddNotesPopup from '../AddNotesPopup';
import ViewBookmarkPopup from '../ViewBookmarkPopup';
import ProfilePopup from '../ProfilePopup';
import TableOfContentsPopup from '../TableOfContentsPopup';

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
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

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
    activeLayout
}) => {
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
            const nextFocus = activeSpreadIdx + prev + shift;
            if (nextFocus < 0 || nextFocus >= spreads.length) return prev;
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

    useEffect(() => {
        if (showRadialThumbnails) {
            setRadialScroll(0); // Reset scroll offset when opening
        }
    }, [showRadialThumbnails]);

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative" style={backgroundStyle} onClick={() => { setRecommendations([]); }}>
            {/* Layout 2 Header */}
            <div
                className={`${isTablet ? 'h-[6vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full shadow-lg z-50 relative border-b border-white/5`}
                style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}
            >
                {/* Left: Search Bar */}
                <div className="flex items-center">
                    {settings.interaction.search && (
                        <div className="relative">
                            <div
                                className={`flex items-center rounded-[0.3vw] px-[0.8vw] py-[0.4vw] shadow-inner group transition-all duration-300 ${isSidebarOpen ? 'w-[10vw]' : 'w-[10vw]'}`}
                                style={{ backgroundColor: getLayoutColor('search-bg-v2', '#DDE0F4') }}
                            >
                                <style>{`
                                    #quick-search-v1-${activeLayout}::placeholder {
                                        color: ${getLayoutColor('search-text-v1', '#575C9C')} !important;
                                        opacity: var(--search-text-v1-opacity, 1);
                                    }
                                `}</style>
                                <Icon
                                    icon="lucide:search"
                                    className={`${isTablet ? 'w-[0.7vw] h-[0.7vw]' : 'w-[1.1vw] h-[1.1vw]'}`}
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
                                    className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isTablet ? 'text-[0.55vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                    style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}
                                />
                            </div>

                            {/* Recommendations Dropdown */}
                            {recommendations.length > 0 && (
                                <div className={`absolute top-[3.2vw] left-0 bg-white/40 backdrop-blur-xl rounded-[1.4vw] shadow-[0_2vw_5vw_rgba(0,0,0,0.2)] z-[100] border border-white/50 animate-in fade-in slide-in-from-top-2 duration-200 transition-all duration-300 p-[0.4vw] ${isSidebarOpen ? 'w-[10vw]' : 'w-[14vw]'}`}>
                                    <div className="rounded-[1vw] bg-white overflow-hidden">
                                        <div
                                            className="rounded-[1vw] overflow-hidden"
                                            style={{ backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))" }}
                                        >
                                            <div className="flex flex-col py-[0.4vw]">
                                                {recommendations.map((rec, idx) => (
                                                    <button
                                                        key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                        className="flex items-center justify-between px-[1.2vw] py-[0.7vw] hover:bg-white/10 text-white transition-colors group"
                                                        onClick={() => {
                                                            onPageClick(rec.pageNumber - 1);
                                                            setLocalSearchQuery(rec.word);
                                                            setSearchQuery(rec.word);
                                                            setRecommendations([]);
                                                        }}
                                                    >
                                                        <span
                                                            className="text-[0.9vw] font-medium opacity-90 group-hover:opacity-100"
                                                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 'var(--dropdown-text-opacity, 1)' }}
                                                        >{rec.word}</span>
                                                        <span
                                                            className="text-[0.8vw] font-bold opacity-60 tabular-nums"
                                                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 'var(--dropdown-text-opacity, 1)' }}
                                                        >{rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Center Area: One Long Cluster of Icons (Grouped) */}
                <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center ${isTablet ? 'gap-[1vw]' : 'gap-[1.5vw]'}`}>
                    {/* Tools Group - 5 Icons */}
                    <div className={`flex items-center ${isTablet ? 'gap-[1vw]' : 'gap-[1.5vw]'}`}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowRadialThumbnails(!showRadialThumbnails); }}
                            className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        {settings.navigation.tableOfContents && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowTOCMemo(true); setShowBookmarkOptions(false); }}
                                className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                                style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                            </button>
                        )}
                        {/* Notes Icon with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowLocalNotesDropdown(prev => !prev); setShowLocalBookmarkDropdown(false); }}
                                className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                                style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                            <AnimatePresence>
                                {showLocalNotesDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="absolute top-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]"
                                        style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.85'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '9vw', borderRadius: isTablet ? '0.8vw' : '1vw' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
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
                        {/* Bookmark Icon with Dropdown */}
                        {settings.navigation.bookmark && (
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowLocalBookmarkDropdown(prev => !prev); setShowLocalNotesDropdown(false); }}
                                    className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                                    style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                                >
                                    <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                                </button>
                                <AnimatePresence>
                                    {showLocalBookmarkDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                            className="absolute top-[calc(100%+0.5vw)]  left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]"
                                            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.85'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '10vw', borderRadius: isTablet ? '0.8vw' : '1vw' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
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
                        )}
                        <button
                            onClick={() => setShowGalleryPopupMemo(true)}
                            className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                        </button>
                        {settings.media.backgroundAudio && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); }}
                                className={`transition-all transform hover:scale-110`}
                                style={{ color: showSoundPopup ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.3') : getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                <Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                        )}
                    </div>

                    {/* Navigation Group - 3 Icons (Prev, Play, Next) */}
                    <div className={`flex items-center ${isTablet ? 'gap-[1vw]' : 'gap-[1.5vw]'}`}>
                        <button
                            onClick={() => onPageClick(0)}
                            className="text-white/80 hover:text-white transition-all transform active:scale-90"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                        <button
                            onClick={() => setIsPlaying(!isAutoFlipping)}
                            className="text-white hover:text-indigo-200 transition-all transform active:scale-90"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        <button
                            onClick={() => onPageClick(pagesCount - 1)}
                            className="text-white/80 hover:text-white transition-all transform active:scale-90"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                    </div>

                    <div className={`flex items-center ${isTablet ? 'gap-[1vw]' : 'gap-[1.5vw]'}`}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowProfilePopup(true); }}
                            className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleShare(); }}
                            className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                            className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFullScreen(); }}
                            className="text-white/80 hover:text-white transition-all transform hover:scale-110"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />
                        </button>
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

            {/* Canvas Area */}
            <div className="flex-1 min-h-0 flex flex-col relative z-[1]">
                {/* Centered Book Name */}
                <div className="w-full flex justify-center py-[1.2vh] pointer-events-none z-20">
                    <span
                        className="text-[1.1vw] font-bold tracking-tight opacity-100"
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                    >
                        {bookName}
                    </span>
                </div>

                <div className={`flex-1 w-full flex items-center justify-center relative ${isFullscreen ? 'p-0' : 'p-[2vw]'} min-h-0`}>
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
                                <Icon icon="ph:caret-left" className="w-[2.5vw] h-[2.5vw] group-active:scale-90 transition-transform" />
                            </button>

                            <button
                                className={`absolute right-[2.5vw] top-1/2 -translate-y-1/2 ${isTablet ? 'w-[2vw] h-[2vw] ' : 'w-[3vw] h-[3vw]'} flex items-center justify-center transition-all group z-20`}
                                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    bookRef.current?.pageFlip()?.flipNext();
                                }}
                            >
                                <Icon icon="ph:caret-right" className="w-[2.5vw] h-[2.5vw] group-active:scale-90 transition-transform" />
                            </button>
                        </>
                    )}

                    {/* Page Counter Badge */}
                    {settings.navigation.pageQuickAccess && (
                        <div
                            className={`absolute right-[1.5vw] bottom-[2vh] rounded-[0.5vw] ${isTablet ? 'px-[0.4vw] py-[0.1vw]' : 'px-[1.2vw] py-[0.6vw]'} shadow-sm border border-gray-100 z-20`}
                            style={{
                                backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF')
                            }}
                        >
                            <span
                                className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.9vw]'} font-bold`}
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
                                className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.9vw]'} font-bold bg-transparent border-none outline-none text-center`}
                                style={{
                                    width: `${String(pages.length).length + 1}ch`,
                                    color: getLayoutColor('search-text-v1', '#4B4B4B')
                                }}
                            />
                            <span
                                className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.9vw]'} font-bold`}
                                style={{ color: getLayoutColor('search-text-v1', '#4B4B4B') }}
                            > / {pagesCount}</span>
                        </div>
                    )}

                    {/* Flipbook Container Wrapper with Scaling */}
                    <div
                        className="relative flex items-center justify-center magazine-content-area"
                        style={{
                            transform: `translateX(${localOffset}px) scale(1)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.6s ease-in-out'
                        }}
                    >
                        {modifiedChildren}
                    </div>
                </div>
            </div>

            {/* Layout 2 Footer */}
            <div
                className={`${isTablet ? 'h-[6vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[2vw] shrink-0 w-full relative z-10 border-t border-white/10`}
                style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Continuous Line of Pagination Dots */}
                <div className={`flex-1 flex items-center justify-center gap-[0.5vw] relative ${isTablet ? 'h-[1.2vw]' : 'h-[2vw]'}`}>
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
                                    layout
                                    onClick={() => onPageClick(spread.indices[0])}
                                    className={`relative flex-shrink-0 ${isTablet ? 'h-[0.35vw]' : 'h-[0.5vw]'} rounded-full cursor-pointer overflow-hidden transition-colors duration-300`}
                                    style={{
                                        backgroundColor: isActive
                                            ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.2')
                                            : getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.3'),
                                        width: isActive ? (isTablet ? '1.2vw' : '1.8vw') : (isTablet ? '0.35vw' : '0.5vw')
                                    }}
                                    animate={{
                                        width: isActive ? (isTablet ? '1.2vw' : '1.8vw') : (isTablet ? '0.35vw' : '0.5vw'),
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                        width: { duration: 0.4 }
                                    }}
                                >
                                    {/* Fill Animation */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            width: isActive ? '100%' : '0%'
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            ease: "easeInOut"
                                        }}
                                        className={`absolute inset-y-0 ${direction === 'forward' ? 'left-0' : 'right-0'}`}
                                        style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
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
                                            className={`absolute bottom-[calc(100%+2.2vw)] left-1/2 ${isTablet ? 'w-[7.5vw] rounded-[0.8vw] p-[0.35vw] pb-[0.25vw]' : 'w-[12vw] rounded-[1.4vw] p-[0.5vw] pb-[0.35vw]'} bg-white shadow-[0_1.5vw_4vw_rgba(0,0,0,0.25)] z-[100] pointer-events-none border border-white/60`}
                                        >
                                            <div className={`flex bg-[#F8F9FA] ${isTablet ? 'rounded-[0.6vw] h-[4.5vw] mb-[0.25vw]' : 'rounded-[1vw] h-[7.5vw] mb-[0.4vw]'} overflow-hidden border border-gray-100 shadow-inner items-center justify-center p-[0.3vw] gap-[0.3vw]`}>
                                                {spread.pages.map((p, pIdx) => (
                                                    <div key={pIdx} className="flex-1 max-w-[50%] h-full bg-white rounded-[0.4vw] overflow-hidden relative border border-gray-200 shadow-sm">
                                                        <PageThumbnail html={p?.html || p?.content || ''} index={spread.indices[pIdx]} scale={0.22} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div
                                                className={`text-center ${isTablet ? 'text-[0.55vw]' : 'text-[0.9vw]'} font-medium pb-[0.1vw] whitespace-nowrap`}
                                                style={{ color: '#575C9C' }}
                                            >
                                                {spread.label}
                                            </div>
                                            {/* Tooltip Arrow */}
                                            <div className={`absolute top-[calc(100%-2px)] left-1/2 -translate-x-1/2 ${isTablet ? 'w-[2vw] h-[1vw]' : 'w-[3.5vw] h-[1.8vw]'} flex items-start justify-center`}>
                                                <svg
                                                    viewBox="0 0 60 20"
                                                    className="w-full h-full fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
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
                    <div className="flex items-center gap-[0.7vw] bg-white/20 px-[0.25vw] py-[0.25vw] pl-[0.8vw] rounded-[0.45vw] backdrop-blur-sm border border-white/10 shadow-sm">
                        <div className="flex items-center gap-[0.6vw]">
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                className="hover:scale-110 transition-transform active:scale-95 flex items-center"
                                style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                <Icon icon="fad:zoomin" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} />
                            </button>
                            <span
                                className={`font-bold ${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} tracking-tight tabular-nums select-none min-w-[2.5vw]`}
                                style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                className="hover:scale-110 transition-transform active:scale-95 flex items-center"
                                style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            >
                                <Icon icon="fad:zoomout" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`bg-white hover:bg-white/90 ${isTablet ? 'text-[0.6vw]' : 'text-[0.78vw]'} font-bold px-[0.8vw] py-[0.3vw] rounded-[0.35vw] transition-all shadow-sm active:scale-95 text-[#3E4491]`}
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
                        className="fixed inset-0 z-[200] flex items-center justify-end bg-transparent overflow-hidden pb-[8vh]"
                        onClick={() => setShowRadialThumbnails(false)}
                        onWheel={handleRadialWheel}
                    >
                        {/* Master SVG Definitions */}
                        <svg className="absolute w-0 h-0 invisible">
                            <defs>
                                <filter id="clean-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
                                    border: '14.5vh solid rgba(255,255,255,0.4)',
                                    boxSizing: 'border-box',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    boxShadow: '0 0 10px 0px rgba(0,0,0,0.15), inset 0 0 10px 0px rgba(0,0,0,0.15)',
                                    pointerEvents: 'none',
                                }} />
                                <svg viewBox="0 0 888 888" className="w-full h-full pointer-events-none drop-shadow-2xl" style={{ position: 'absolute' }}>
                                    <defs>
                                        <radialGradient id="ringFillGradient" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                                            <stop offset="0%" stopColor="white" stopOpacity="0" />
                                            <stop offset="56%" stopColor="white" stopOpacity="0" />
                                            <stop offset="60%" stopColor="white" stopOpacity="0.45" />
                                            <stop offset="70%" stopColor="white" stopOpacity="0.15" />
                                            <stop offset="94%" stopColor="white" stopOpacity="0.15" />
                                            <stop offset="98%" stopColor="white" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="white" stopOpacity="0.45" />
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
                                const angleStep = 26; // degrees between each shape
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
                                        {spreads.map((spread, i) => {
                                            const fixedAngleDeg = baseAngle + i * angleStep;
                                            const fixedAngleRad = fixedAngleDeg * (Math.PI / 180);
                                            const x = 50 + orbitRadius * Math.cos(fixedAngleRad);
                                            const y = 50 + orbitRadius * Math.sin(fixedAngleRad);
                                            const isActive = (hoveredIdx !== null ? hoveredIdx : Math.round(focusIndex)) === i;

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
                                                    <svg viewBox="0 0 170 173" className="w-full h-full drop-shadow-md overflow-visible">
                                                        <g transform="rotate(90, 85, 86.5)">
                                                            <path
                                                                d="M9.29472 11.4862C11.1722 3.10828 19.7989 -1.79399 28.0408 0.611489L161.222 39.4818C168.942 41.7352 173.506 49.6146 172.035 57.5216C167.9 79.7315 167.621 96.4086 170.486 118.929C171.485 126.787 166.576 134.264 158.88 136.14L24.4315 168.911C16.05 170.953 7.62316 165.607 6.15266 157.106C-2.91853 104.667 -2.03183 62.0294 9.29472 11.4862Z"
                                                                fill={isActive ? getLayoutColor('toc-bg', '#3E4491') : getLayoutColor('toc-bg', '#575C9C')}
                                                                className="transition-colors duration-300"
                                                                filter="url(#clean-shadow)"
                                                            />
                                                        </g>
                                                        <text
                                                            x="50%"
                                                            y="50%"
                                                            fill="white"
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
                                        <div className="w-[1vw] h-[1vw] bg-white rotate-45 -mr-[0.5vw] shadow-[-2px_2px_5px_rgba(0,0,0,0.1)] rounded-[0.08vw]" />
                                        <div className="w-[10vw] h-[7vw] bg-white rounded-[0.4vw] shadow-[0_12px_35px_rgba(0,0,0,0.22)] p-[0.35vw] flex items-center justify-center border border-gray-100/80">
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center relative overflow-hidden rounded-[0.25vw]">
                                                {(() => {
                                                    const hubSpreadIdx = hoveredIdx ?? Math.max(0, Math.min(spreads.length - 1, activeSpreadIdx + radialScroll));
                                                    const hubSpread = spreads[hubSpreadIdx] || spreads[0];
                                                    return (
                                                        <div className="flex w-full h-full gap-[0.2vw] items-center justify-center bg-gray-50">
                                                            {hubSpread.pages.map((p, pIdx) => (
                                                                <div key={pIdx} className="flex-1 max-w-[50%] h-full bg-white rounded-[0.2vw] overflow-hidden relative border border-gray-200 shadow-sm">
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

                        {/* Functional Cues */}
                        <div className="absolute bottom-[4vh] flex items-center gap-[3vw]">
                            <div className="flex items-center gap-[0.6vw] opacity-40 hover:opacity-100 transition-opacity">
                                <Icon icon="lucide:mouse-wheel" className="text-white w-[1.2vw] h-[1.2vw]" />
                                <span className="text-white text-[0.8vw] font-bold uppercase tracking-widest">Spin Dial</span>
                            </div>
                            <div className="flex items-center gap-[0.6vw] opacity-40 hover:opacity-100 transition-opacity">
                                <Icon icon="lucide:pointer" className="text-white w-[1.2vw] h-[1.2vw]" />
                                <span className="text-white text-[0.8vw] font-bold uppercase tracking-widest">Jump to Page</span>
                            </div>
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

            {/* Popups handled by PreviewArea */}
        </div>
    );
};

export default Grid2Layout;
