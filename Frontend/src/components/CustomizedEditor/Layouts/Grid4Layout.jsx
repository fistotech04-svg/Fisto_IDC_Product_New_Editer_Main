import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

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

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

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
    setShowGalleryPopupMemo,
    showSoundPopup,
    setShowSoundPopupMemo,
    activeLayout,
    isTablet
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

    const totalPages = pagesCount;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [showTOC, setShowTOC] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [showLocalBookmarkDropdown, setShowLocalBookmarkDropdown] = useState(false);
    const [showLocalNotesDropdown, setShowLocalNotesDropdown] = useState(false);
    const scrollRef = useRef(null);
    const buttonsRef = useRef(null);
    const sidebarContentRef = useRef(null);

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
            if (showThumbnails || showTOC || showProfile || showBookmarkOptions) {
                const isClickOnButton = buttonsRef.current?.contains(event.target);
                const isClickOnSidebar = sidebarContentRef.current?.contains(event.target);

                if (!isClickOnButton && !isClickOnSidebar) {
                    setShowThumbnails(false);
                    setShowTOC(false);
                    setShowProfile(false);
                    setShowBookmarkOptions(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showThumbnails, showTOC, showProfile, showBookmarkOptions]);


    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans" style={backgroundStyle}>
            {/* Top Bar: Brand - Title - Search */}
            <div className={`${isTablet ? 'h-[5.5vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50 relative border-b border-white/5 shadow-lg`} style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
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

                <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <span className={`text-white ${isTablet ? 'text-[1.1vw]' : 'text-[1.25vw]'} font-medium tracking-tight whitespace-nowrap`}>{bookName}</span>
                </div>

                <div className="relative">
                    <div className={`flex items-center ${isTablet ? 'rounded-[0.35vw] px-[0.6vw] py-[0.3vw] w-[12vw]' : 'rounded-[0.45vw] px-[0.8vw] py-[0.4vw] w-[15vw]'} shadow-inner group transition-all`}
                        style={{ backgroundColor: getLayoutColor('search-bg-v2', '#DDE0F4') }}
                    >
                        <Icon icon="lucide:search" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} style={{ color: getLayoutColor('search-text-v1', '#575C9C') }} />
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
                            className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} ml-[0.6vw] w-full font-medium`}
                            style={{ 
                                color: getLayoutColor('search-text-v1', '#575C9C'),
                                '--placeholder-color': getLayoutColorRgba('search-text-v1', '87, 92, 156', '0.7')
                            }}
                        />
                    </div>

                    {/* Recommendations Dropdown */}
                    {recommendations.length > 0 && (
                        <div className={`absolute ${isTablet ? 'top-[2.5vw] w-[12vw]' : 'top-[3.2vw] w-[15vw]'} left-0 rounded-[0.4vw] shadow-2xl z-[100] overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200`}
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                        >
                            <div className="px-[1vw] py-[1vh] border-b border-gray-100">
                                <span className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Suggestion</span>
                            </div>
                            <div className="flex flex-col py-[0.5vh]">
                                {recommendations.map((rec, idx) => (
                                    <button
                                        key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                        className="flex items-center justify-between px-[1.2vw] py-[0.8vh] hover:bg-black/5 transition-colors group"
                                        style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
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
                        </div>
                    )}
                </div>
            </div>

            {/* Main Middle Container */}
            <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
                {/* Left Sidebar */}
                <div ref={buttonsRef} className={`${isTablet ? 'w-[3vw]' : 'w-[4.2vw]'} flex flex-col items-center py-[2vh] gap-[${isTablet ? '2vh' : '3vh'}] border-r border-white/5 shadow-xl z-40 shrink-0`} style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                    <button
                        onClick={() => {
                            setShowTOC(!showTOC);
                            setShowThumbnails(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            setShowThumbnails(!showThumbnails);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    {/* Notes Icon with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowLocalNotesDropdown(prev => !prev);
                                setShowLocalBookmarkDropdown(false);
                                setShowThumbnails(false);
                                setShowTOC(false);
                                setShowProfile(false);
                                setShowBookmarkOptions(false);
                            }}
                            className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                        >
                            <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        <AnimatePresence>
                            {showLocalNotesDropdown && (
                                <motion.div initial={{ opacity: 0, x: 10, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute left-[calc(100%+0.5vw)] top-1/2 -translate-y-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '9vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowLocalBookmarkDropdown(prev => !prev);
                                setShowLocalNotesDropdown(false);
                                setShowTOC(false);
                                setShowThumbnails(false);
                                setShowProfile(false);
                            }}
                            className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                        >
                            <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                        </button>
                        <AnimatePresence>
                            {showLocalBookmarkDropdown && (
                                <motion.div initial={{ opacity: 0, x: 10, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute left-[calc(100%+0.5vw)] top-1/2 -translate-y-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '10vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                            setShowGalleryPopupMemo(true);
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); }}
                        className="transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: showSoundPopup ? getLayoutColorRgba('toolbar-icon', '255, 255, 255', '0.3') : getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            setShowProfile(!showProfile);
                            setShowTOC(false);
                            setShowThumbnails(false);
                            setShowBookmarkOptions(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            handleShare();
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            handleDownload();
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        onClick={() => {
                            handleFullScreen();
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfile(false);
                            setShowBookmarkOptions(false);
                        }}
                        className="hover:opacity-70 transition-all transform hover:scale-110 p-[0.3vw]"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                </div>

                {/* Vertical Thumbnail Sidebar Integration */}
                {showThumbnails && (
                    <div ref={sidebarContentRef} className={`${isTablet ? 'w-[11vw]' : 'w-[18vw]'} border-r border-gray-200 flex flex-col h-full z-30 animate-in slide-in-from-left duration-300`}
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
                                        <span className={`mt-[0.5vh] ${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-medium transition-colors`}
                                            style={{ color: isSelected ? getLayoutColor('dropdown-text', '#3E4491') : 'gray' }}
                                        >
                                            {spread.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Vertical Table of Contents Sidebar */}
                {showTOC && (
                    <div ref={sidebarContentRef} className={`${isTablet ? 'w-[11vw]' : 'w-[18vw]'} border-r border-gray-200 flex flex-col h-full z-30 animate-in slide-in-from-left duration-300`}
                        style={{ backgroundColor: getLayoutColor('toc-bg', '#FFFFFF') }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-[1vw] py-[1.5vh] border-b" style={{ borderColor: getLayoutColorRgba('toc-text', '87, 92, 156', '0.2') }}>
                            <span className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-semibold`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</span>
                            <button
                                onClick={() => setShowTOC(false)}
                                className="transition-colors opacity-70 hover:opacity-100"
                                style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                            >
                                <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-[1vw] flex flex-col">
                            {settings.tocSettings?.content && settings.tocSettings.content.length > 0 ? (
                                settings.tocSettings.content.map((heading, hIdx) => (
                                    <div key={heading.id} className={`${hIdx > 0 ? 'mt-[1.5vh]' : ''}`}>
                                        <div
                                            className="flex items-center justify-between py-[0.6vh] text-[#575C9C] hover:bg-gray-50 rounded-[0.3vw] cursor-pointer transition-colors"
                                            onClick={() => onPageClick && onPageClick(heading.page - 1)}
                                        >
                                            <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium truncate pr-[0.5vw]`}>{heading.title}</span>
                                            {settings.tocSettings.addPageNumber !== false && (
                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-medium tabular-nums ml-[0.3vw]`}>
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col">
                                            {heading.subheadings?.map((sub) => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center justify-between py-[0.6vh] text-[#575C9C] hover:bg-gray-50 rounded-[0.3vw] cursor-pointer transition-colors"
                                                    onClick={() => onPageClick && onPageClick(sub.page - 1)}
                                                >
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-normal truncate pr-[0.5vw]`}>{sub.title}</span>
                                                    {settings.tocSettings.addPageNumber !== false && (
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
                                <div className="text-[#575C9C] text-[0.8vw] text-center pt-[10vw] opacity-60 font-medium">
                                    No Table Of Content Found
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Vertical Profile Sidebar */}
                {showProfile && (
                    <div ref={sidebarContentRef} className={`${isTablet ? 'w-[11vw]' : 'w-[18vw]'} border-r border-gray-200 flex flex-col h-full z-30 animate-in slide-in-from-left duration-300`}
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
                )}

                {/* Canvas Area */}
                <div className="flex-1 flex flex-col min-w-0 relative bg-[#DADBE8]/20">
                    {/* Navigation Arrows */}
                    <button
                        className={`absolute left-[3vw] top-1/2 -translate-y-1/2 hover:scale-110 transition-all z-20 flex items-center justify-center bg-white/10 hover:bg-white/20 ${isTablet ? 'w-[2.2vw] h-[2.2vw]' : 'w-[2.8vw] h-[2.8vw]'} rounded-full`}
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                    >
                        <Icon icon="lucide:chevron-left" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                    <button
                        className={`absolute right-[3vw] top-1/2 -translate-y-1/2 hover:scale-110 transition-all z-20 flex items-center justify-center bg-white/10 hover:bg-white/20 ${isTablet ? 'w-[2.2vw] h-[2.2vw]' : 'w-[2.8vw] h-[2.8vw]'} rounded-full`}
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
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
            <div className={`${isTablet ? 'h-[5vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[2.5vw] shrink-0 w-full relative z-40 border-t border-white/5`} style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}>
                {/* Left: Playback Icons */}
                <div className="flex items-center gap-[2vw]">
                    <button onClick={() => onPageClick && onPageClick(0)} className="hover:scale-110 transition-all p-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon="lucide:skip-back" className={`${isTablet ? 'w-[1vw]' : 'w-[1.2vw]'} ${isTablet ? 'h-[1vw]' : 'h-[1.2vw]'}`} />
                    </button>
                    <button onClick={() => setIsPlaying(!isAutoFlipping)} className="hover:scale-110 transition-all p-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.2vw]' : 'w-[1.5vw]'} ${isTablet ? 'h-[1.2vw]' : 'h-[1.5vw]'}`} />
                    </button>
                    <button onClick={() => onPageClick && onPageClick(totalPages - 1)} className="hover:scale-110 transition-all p-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon="lucide:skip-forward" className={`${isTablet ? 'w-[1vw]' : 'w-[1.2vw]'} ${isTablet ? 'h-[1vw]' : 'h-[1.2vw]'}`} />
                    </button>
                </div>

                {/* Center: Progress Bar Area */}
                <div className="flex-1 mx-[5vw]">
                    <div className="h-[0.3vh] rounded-full overflow-hidden" style={{ backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.2') }}>
                        <div
                            className="h-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%`, backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        />
                    </div>
                </div>

                {/* Right: Zoom Pill */}
                <div className="flex items-center">
                    <div className="flex items-center rounded-[0.5vw] p-[0.3vw] pl-[0.8vw] gap-[1vw] border shadow-sm"
                        style={{ 
                            backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.1'),
                            borderColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.1')
                        }}
                    >
                        <div className="flex items-center gap-[0.8vw]">
                            <button onClick={(e) => { e.stopPropagation(); zoomOut(); }} className="hover:scale-110" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.8vw]' : 'w-[0.9vw]'} ${isTablet ? 'h-[0.8vw]' : 'h-[0.9vw]'}`} />
                            </button>
                            <span className={`font-bold ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} tabular-nums min-w-[2.5vw] text-center`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); zoomIn(); }} className="hover:scale-110" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.8vw]' : 'w-[0.9vw]'} ${isTablet ? 'h-[0.8vw]' : 'h-[0.9vw]'}`} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold px-[0.8vw] py-[0.35vw] rounded-[0.4vw] active:scale-95 transition-all shadow-sm`}
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
