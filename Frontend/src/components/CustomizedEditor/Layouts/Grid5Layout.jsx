import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import ViewBookmarkPopup from '../ViewBookmarkPopup';

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

const Grid5Layout = ({
    children,
    settings,
    bookName,
    layoutColors,
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
    onDeleteBookmark,
    onUpdateBookmark,
    notes,
    onAddNote,
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

    const zoomIn = React.useCallback(() => {
        setDimWidth(prev => {
            const nextWidth = Math.min(prev + 20, initialWidth * 1.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    }, [aspectRatio, initialWidth]);

    const zoomOut = React.useCallback(() => {
        setDimWidth(prev => {
            const nextWidth = Math.max(prev - 20, initialWidth * 0.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    }, [aspectRatio, initialWidth]);

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

    const getLayoutColor = (tokenId, defaultColor) => {
        return layoutColors?.[5]?.[tokenId] || `var(--${tokenId}, ${defaultColor})`;
    };

    const getLayoutOpacity = (tokenId, defaultOpacity) => {
        return layoutColors?.[5]?.[`${tokenId}-opacity`] || 1;
    };

    const getLayoutColorRgba = (tokenId, defaultRgb, defaultOpacity) => {
        const color = getLayoutColor(tokenId, null);
        if (color && color.startsWith('#')) return color;
        return `rgba(var(--${tokenId}-rgb, ${defaultRgb}), var(--${tokenId}-opacity, ${defaultOpacity}))`;
    };

    const totalPages = pagesCount;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [showTOC, setShowTOC] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showProfileLocal, setShowProfileLocal] = useState(false);
    const [showBookmarkLocal, setShowBookmarkLocal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showLocalBookmarkDropdown, setShowLocalBookmarkDropdown] = useState(false);
    const [showLocalNotesDropdown, setShowLocalNotesDropdown] = useState(false);

    const hasProfileData = profileSettings && (
        (profileSettings.name && profileSettings.name !== 'Name' && profileSettings.name.trim() !== '') ||
        (profileSettings.about && profileSettings.about.trim() !== '') ||
        profileSettings.twitter ||
        profileSettings.facebook ||
        profileSettings.email ||
        profileSettings.instagram ||
        profileSettings.phone
    );

    const scrollRef = useRef(null);

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

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
                        className={`${isTablet ? 'text-[0.4vw]' : 'text-[0.65vw]'} font-medium mt-[0.1vw] leading-none whitespace-nowrap`}
                        style={{ 
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'), 
                            fontFamily: textFont, 
                            opacity: getLayoutOpacity('toolbar-text-main', 1) 
                        }}
                    >
                        {label}
                    </span>
            )}
        </button>
    );

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            result.push({ pages: [pages[0]], indices: [0], label: 'Page 1' });
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

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [spreads, showThumbnails]);

    useEffect(() => {
        if (showThumbnails && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentPage, showThumbnails]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth * 0.3;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans" style={backgroundStyle}>
            {/* ── TOP BAR ── White with search | title | logo */}
                <div
                    className={`${isTablet ? 'h-[5.2vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50 relative`}
                >

                    {/* Left: Search Pill */}
                    <div className="flex items-center">
                        {settings.interaction.search && (
                            <div className="relative">
                                <div
                                    className={`flex items-center rounded-full ${isTablet ? 'px-[0.8vw] py-[0.35vw]' : 'px-[1vw] py-[0.45vw]'} shadow-inner group transition-all duration-300 ${isSidebarOpen ? (isTablet ? 'w-[11vw]' : 'w-[14vw]') : (isTablet ? 'w-[14vw]' : 'w-[18vw]')}`}
                                    style={{ backgroundColor: getLayoutColorRgba('search-bg-v2', '221, 224, 244', '1') }}
                                >
                                    <Icon
                                        icon="ph:magnifying-glass-bold"
                                        className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`}
                                        style={{ color: getLayoutColor('search-text-v1', '#9BA0C9') }}
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
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setSearchQuery(localSearchQuery);
                                                handleQuickSearch(localSearchQuery);
                                                setRecommendations([]);
                                            }
                                        }}
                                        placeholder="Quick Search..."
                                        className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                        style={{ color: getLayoutColorRgba('search-text-v1', '87, 92, 156', '1') }}
                                    />
                                </div>

                                {/* Recommendations Dropdown */}
                                {recommendations.length > 0 && (
                                    <div className={`absolute ${isTablet ? 'top-[2.5vw]' : 'top-[3.2vw]'} left-0 rounded-[0.8vw] shadow-2xl z-[100] overflow-hidden border transition-all ${isSidebarOpen ? (isTablet ? 'w-[11vw]' : 'w-[14vw]') : (isTablet ? 'w-[14vw]' : 'w-[18vw]')}`}
                                        style={{
                                            backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1'),
                                            borderColor: getLayoutColorRgba('dropdown-bg', '243, 244, 246', '0.2')
                                        }}
                                    >
                                        <div className="px-[1.2vw] py-[0.6vw] border-b border-gray-50 bg-gray-50/50">
                                            <span
                                                className="text-[0.8vw] font-bold"
                                                style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                            >Suggestion</span>
                                        </div>
                                        <div className="flex flex-col py-[0.4vw]">
                                            {recommendations.map((rec, idx) => (
                                                <button
                                                    key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                    className="flex items-center justify-between px-[1.2vw] py-[0.7vw] hover:bg-black/5 transition-colors group"
                                                    onClick={() => {
                                                        onPageClick(rec.pageNumber - 1);
                                                        setLocalSearchQuery(rec.word);
                                                        setSearchQuery(rec.word);
                                                        setRecommendations([]);
                                                    }}
                                                >
                                                    <span
                                                        className="text-[0.85vw] font-medium"
                                                        style={{ color: getLayoutColor('dropdown-text', '#575C9C'), opacity: 'var(--dropdown-text-opacity, 0.9)' }}
                                                    >{rec.word}</span>
                                                    <span
                                                        className="text-[0.8vw] font-bold tabular-nums"
                                                        style={{ color: getLayoutColor('dropdown-text', '#575C9C'), opacity: 'var(--dropdown-text-opacity, 0.5)' }}
                                                    >Pg {rec.pageNumber}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Center: Book Title */}
                    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
                        <span
                            className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-semibold tracking-tight`}
                            style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        >{bookName}</span>
                    </div>

                    {/* Right: Brand Logo */}
                    <div className="flex items-center">
                        {settings.brandingProfile.logo && logoSettings?.src && (
                            <img
                                src={logoSettings.src}
                                alt="Brand Logo"
                                className={`${isTablet ? 'h-[1.6vw]' : 'h-[2.2vw]'} w-auto transition-all`}
                                style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                            />
                        )}
                    </div>
                </div>

                {/* ── MAIN CONTENT AREA ── */}
                {/* Book Viewer Container */}
                <div className={`flex-1 flex items-center justify-center ${isFullScreen ? 'p-0' : 'px-[4vw]'} magazine-canvas relative min-h-0`}>

                        {/* Far-left navigation: skip-back + prev */}
                        <div className="absolute left-[1.5vw] top-1/2 -translate-y-1/2 flex items-center gap-[0.5vw] z-20">
                            <button
                                className="hover:scale-110 transition-all p-[0.5vw] opacity-60 hover:opacity-100"
                                onClick={() => onPageClick(0)}
                                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                            >
                                <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                            <button
                                className="hover:scale-110 transition-all p-[0.5vw] opacity-60 hover:opacity-100"
                                onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                            >
                                <Icon icon="ph:caret-left" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                        </div>

                        {/* Far-right navigation: next + skip-forward */}
                        <div className="absolute right-[1.5vw] top-1/2 -translate-y-1/2 flex items-center gap-[0.5vw] z-20">
                            <button
                                className="hover:scale-110 transition-all p-[0.5vw] opacity-60 hover:opacity-100"
                                onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                            >
                                <Icon icon="ph:caret-right" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                            <button
                                className="hover:scale-110 transition-all p-[0.5vw] opacity-60 hover:opacity-100"
                                onClick={() => onPageClick(pagesCount - 1)}
                                style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                            >
                                <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                            </button>
                        </div>
                  


                        {/* Flipbook Container */}
                        <div
                            className="relative transition-all duration-600 ease-in-out magazine-content-area"
                            style={{
                                transform: `translateX(${localOffset}px) scale(1)`,
                                transformOrigin: 'center center',
                                width: dimWidth * 2,
                                height: dimHeight,
                                filter: 'drop-shadow(0 2vw 5vw rgba(0,0,0,0.15))'
                            }}
                        >
                            {modifiedChildren}
                        </div>
                    </div>

                {/* ── BOTTOM BAR ── UI Match to Screenshot */}
                <div className={`${isTablet ? 'h-[5.5vh]' : 'h-[8vh]'} flex items-center px-[1.5vw] justify-between shrink-0 w-full relative z-40 bg-transparent`}>
                        <div className={`rounded-full flex items-center p-[0.6vw] shadow-[0_0.2vw_1vw_rgba(0,0,0,0.06)] border border-gray-100 shrink-0 ${isTablet ? 'gap-[0.3vw] px-[0.6vw]' : 'gap-[0.2vw] px-[1.2vw]'}`}
                            style={{ backgroundColor: getLayoutColorRgba('search-bg-v2', '221, 224, 244', '1') }}
                        >
                            <span
                                className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold select-none whitespace-nowrap`}
                                style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
                            >Page : </span>
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
                                className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold bg-transparent border-none outline-none text-center`}
                                style={{
                                    width: `${String(pages.length).length + 1}ch`,
                                    color: getLayoutColor('search-text-v1', '#575C9C'),
                                    opacity: 'var(--search-text-v1-opacity, 1)'
                                }}
                            />
                            <span
                                className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.78vw]'} font-bold select-none whitespace-nowrap`}
                                style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
                            > / {totalPages}</span>
                        </div>

                    {/* Center: Long Tool Strip */}
                    <div
                        className={`flex-1 ${isTablet ? 'max-w-[75vw] mx-[1vw] h-[4vh]' : 'max-w-[72vw] mx-[1.5vw] h-[6vh]'} rounded-full flex items-center ${isTablet ? 'px-[1vw]' : 'px-[1.5vw]'} shadow-[0_0.5vw_2.5vw_rgba(0,0,0,0.15)] border border-white/10 relative`}
                        style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1') }}
                    >
                        {/* Functional Icons Group */}
                        <div className={`flex items-center ${isTablet ? 'gap-[0.5vw] mr-[0.2vw]' : 'gap-[0.8vw] mr-[1.5vw]'} shrink-0`}>
                            
                            {settings.media.autoFlip && renderToolbarBtn(
                                <Icon icon={isAutoFlipping ? 'ph:pause-fill' : 'ph:play-fill'} className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                isAutoFlipping ? 'Pause' : 'Play',
                                () => setIsPlaying(!isAutoFlipping),
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                            )}
                           
                        </div>

                        {/* Progress Bar */}
                        <div className={`flex-1 ${isTablet ? 'h-[0.25vh] mr-[0.5vw] w-[2vw]' : 'h-[0.35vh] mr-[2.5vw]'} bg-white/20 rounded-full overflow-hidden relative`}>
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${progressPercentage}%`,
                                    backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF')
                                }}
                            />
                        </div>

                        {/* Functional Icons Group */}
                        <div className={`flex items-center ${isTablet ? 'gap-[0.9vw]' : 'gap-[1.15vw]'} shrink-0`}>
                             {/* Thumbnails */}
                            {renderToolbarBtn(
                                <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Thumbnails',
                                () => {
                                    setShowThumbnails(!showThumbnails);
                                    setShowTOC(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfileLocal(false);
                                },
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showThumbnails ? 0.7 : 1 }
                            )}

                            {/* TOC */}
                            <div className="relative">
                                {renderToolbarBtn(
                                    <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                    'TOC',
                                    (e) => {
                                        e.stopPropagation();
                                        setShowTOC(!showTOC);
                                        setShowThumbnails(false);
                                        setShowBookmarkLocal(false);
                                        setShowProfileLocal(false);
                                    },
                                    { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showTOC ? 0.7 : 1 }
                                )}

                                {showTOC && (
                                    <>
                                        <div className="fixed inset-0 z-[150]" onClick={() => setShowTOC(false)} />
                                        <div
                                            className={`absolute ${isTablet ? 'bottom-[2.8vw] -translate-x-[20%]' : 'bottom-[3.2vw] -translate-x-[15%]'} z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="relative">
                                                {/* Triangle Pointer */}
                                                {/* Needle Pointer */}
                                                <div
                                                    className={`absolute -bottom-[1.3vw] ${isTablet ? 'left-[20%]' : 'left-[15%]'} -translate-x-1/2 z-10 pointer-events-none`}
                                                    style={{ width: '0.9vw', height: '1.4vw' }}
                                                >
                                                    <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M0 0L5 20L10 0" fill={getLayoutColor('toc-bg', '#FFFFFF')} />
                                                        <path d="M0 0L5 20L10 0" stroke={getLayoutColor('toc-bg', '#575C9C')} strokeOpacity="0.3" strokeWidth="1" />
                                                    </svg>
                                                </div>
                                                {/* Popup Content */}
                                                <div
                                                    className={`rounded-[1.2vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.1)] ${isTablet ? 'w-[10vw]' : 'w-[13vw]'} p-[1.1vw] flex flex-col relative z-20 overflow-hidden border`}
                                                    style={{
                                                        backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1'),
                                                        borderColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.3')
                                                    }}
                                                >
                                                    <h2
                                                        className={`${isTablet ? 'text-[0.8vw]' : 'text-[0.9vw]'} font-bold mb-[0.8vw] tracking-tight`}
                                                        style={{ color: getLayoutColor('toc-text', '#000000') }}
                                                    >Table of Contents</h2>

                                                    <div className="flex flex-col gap-[0.6vw] max-h-[30vh] overflow-y-auto pr-[0.4vw] no-scrollbar">
                                                        {settings?.tocSettings?.content?.length > 0 ? (
                                                            settings.tocSettings.content.map((item, idx) => (
                                                                <React.Fragment key={item.id || idx}>
                                                                    {/* Main Heading */}
                                                                    <div
                                                                        className="flex items-center justify-between group cursor-pointer"
                                                                        onClick={() => { onPageClick(item.page - 1); setShowTOC(false); }}
                                                                    >
                                                                        <span
                                                                            className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-semibold transition-colors truncate pr-[0.4vw]`}
                                                                            style={{ color: getLayoutColor('toc-text', '#374151') }}
                                                                        >
                                                                            {item.title}
                                                                        </span>
                                                                        <span
                                                                            className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-semibold transition-colors tabular-nums shrink-0`}
                                                                            style={{ color: getLayoutColor('toc-text', '#374151') }}
                                                                        >
                                                                            {String(item.page).padStart(2, '0')}
                                                                        </span>
                                                                    </div>

                                                                    {/* Child Subheadings */}
                                                                    {item.subheadings?.map((sub, sIdx) => (
                                                                        <div
                                                                            key={sub.id || sIdx}
                                                                            className="flex items-center justify-between group cursor-pointer"
                                                                            onClick={() => { onPageClick(sub.page - 1); setShowTOC(false); }}
                                                                        >
                                                                            <span
                                                                                className="text-[0.75vw] font-medium transition-colors truncate pr-[0.4vw]"
                                                                                style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                            >
                                                                                {sub.title}
                                                                            </span>
                                                                            <span
                                                                                className="text-[0.75vw] font-medium transition-colors tabular-nums shrink-0"
                                                                                style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                            >
                                                                                {String(sub.page).padStart(2, '0')}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </React.Fragment>
                                                            ))
                                                        ) : (
                                                            <div className="text-center py-[1.5vw] text-gray-400 text-[0.7vw]">No content</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* Notes Icon with Dropdown */}
                            <div className="relative">
                                {renderToolbarBtn(
                                    <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />,
                                    'Notes',
                                    (e) => {
                                        e.stopPropagation();
                                        setShowLocalNotesDropdown(prev => !prev);
                                        setShowLocalBookmarkDropdown(false);
                                        setShowTOC(false);
                                        setShowThumbnails(false);
                                        setShowBookmarkLocal(false);
                                        setShowProfileLocal(false);
                                    },
                                    { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showLocalNotesDropdown ? 0.7 : 1 }
                                )}
                                <AnimatePresence>
                                    {showLocalNotesDropdown && (
                                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute bottom-[calc(100%+1vw)] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '9vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                                {renderToolbarBtn(
                                    <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                    'Bookmarks',
                                    (e) => {
                                        e.stopPropagation();
                                        setShowLocalBookmarkDropdown(prev => !prev);
                                        setShowLocalNotesDropdown(false);
                                        setShowTOC(false);
                                        setShowThumbnails(false);
                                        setShowProfileLocal(false);
                                    },
                                    { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showLocalBookmarkDropdown ? 0.7 : 1 }
                                )}
                                <AnimatePresence>
                                    {showLocalBookmarkDropdown && (
                                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute bottom-[calc(100%+1vw)] left-1/2 -translate-x-1/2 flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-[100]" style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.9'), backdropFilter: 'blur(10px)', width: isTablet ? '8vw' : '10vw', borderRadius: isTablet ? '0.8vw' : '1vw' }} onClick={(e) => e.stopPropagation()}>
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
                            {/* Gallery */}
                            {renderToolbarBtn(
                                <Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Gallery',
                                () => {
                                    setShowGalleryPopupMemo(true);
                                    setShowTOC(false);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfileLocal(false);
                                },
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                            )}
                            {/* Music */}
                            {renderToolbarBtn(
                                <Icon icon="solar:music-notes-bold" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Music',
                                (e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); },
                                { color: showSoundPopup ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.3') : getLayoutColor('toolbar-text-main', '#FFFFFF') }
                            )}
                            {/* Profile */}
                            <div className="relative">
                                {renderToolbarBtn(
                                    <Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                    'Profile',
                                    (e) => {
                                        e.stopPropagation();
                                        setShowProfileLocal(!showProfileLocal);
                                        setShowTOC(false);
                                        setShowThumbnails(false);
                                        setShowBookmarkLocal(false);
                                    },
                                    { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showProfileLocal ? 0.7 : 1 }
                                )}

                                {/* Profile Popup */}
                                {showProfileLocal && (
                                    <>
                                        <div className="fixed inset-0 z-[150]" onClick={() => setShowProfileLocal(false)} />
                                        <div
                                            className={`absolute ${isTablet ? 'bottom-[2.8vw] -translate-x-[75%]' : 'bottom-[3.2vw] -translate-x-[80%]'} z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="relative">
                                                {/* Triangle pointer */}
                                                <div
                                                    className={`absolute -bottom-[1.3vw] ${isTablet ? 'left-[75%]' : 'left-[80%]'} -translate-x-1/2 z-10 pointer-events-none`}
                                                    style={{ width: '0.9vw', height: '1.4vw' }}
                                                >
                                                    <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M0 0L5 20L10 0" fill={getLayoutColor('toc-bg', '#FFFFFF')} />
                                                        <path d="M0 0L5 20L10 0" stroke={getLayoutColor('toc-bg', '#575C9C')} strokeOpacity="0.3" strokeWidth="1" />
                                                    </svg>
                                                </div>
                                                {/* Card */}
                                                <div
                                                    className={`rounded-[1.2vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.15)] ${isTablet ? 'w-[10.5vw]' : 'w-[16vw]'} p-[1.2vw] flex flex-col gap-[0.8vw] border relative z-20`}
                                                    style={{
                                                        backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1'),
                                                        borderColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.2')
                                                    }}
                                                >
                                                    {/* Title */}
                                                    <h2
                                                        className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-bold tracking-tight`}
                                                        style={{ color: getLayoutColor('toc-text', '#000000') }}
                                                    >Profile</h2>

                                                    {!hasProfileData ? (
                                                        <div className="text-gray-400 text-[0.8vw] text-center py-[2vw] italic font-medium">
                                                            No profile found
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Name */}
                                                            <div className="flex gap-[0.3vw]">
                                                                <span
                                                                    className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold whitespace-nowrap`}
                                                                    style={{ color: getLayoutColor('toc-text', '#000000') }}
                                                                >Name :</span>
                                                                <span
                                                                    className="text-[0.8vw]"
                                                                    style={{ color: getLayoutColorRgba('toc-text', '55, 65, 81', '0.8') }}
                                                                >{profileSettings?.name || 'Name'}</span>
                                                            </div>

                                                            {/* About */}
                                                            <div className="flex gap-[0.3vw]">
                                                                <span
                                                                    className="text-[0.8vw] font-bold whitespace-nowrap"
                                                                    style={{ color: getLayoutColor('toc-text', '#000000') }}
                                                                >About :</span>
                                                                <span
                                                                    className="text-[0.78vw] leading-[1.5] text-justify"
                                                                    style={{ color: getLayoutColorRgba('toc-text', '75, 85, 99', '0.8') }}
                                                                >{profileSettings?.about || ''}</span>
                                                            </div>

                                                            {/* Divider */}
                                                            <div
                                                                className="h-[1px] opacity-10"
                                                                style={{ backgroundColor: getLayoutColor('toc-text', '#000000') }}
                                                            />

                                                            {/* Contact */}
                                                            <div className="flex flex-col gap-[0.5vw]">
                                                                <span
                                                                    className="text-[0.85vw] font-bold"
                                                                    style={{ color: getLayoutColor('toc-text', '#000000') }}
                                                                >Contact</span>
                                                                <div className="flex items-center gap-[0.5vw]">
                                                                    {profileSettings?.twitter && (
                                                                        <a href={profileSettings.twitter} target="_blank" rel="noreferrer"
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-black flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                        >
                                                                            <Icon icon="ri:twitter-x-fill" className="w-[1.1vw] h-[1.1vw] text-white" />
                                                                        </a>
                                                                    )}
                                                                    {profileSettings?.facebook && (
                                                                        <a href={profileSettings.facebook} target="_blank" rel="noreferrer"
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                        >
                                                                            <Icon icon="logos:facebook" className="w-[1.2vw] h-[1.2vw]" />
                                                                        </a>
                                                                    )}
                                                                    {profileSettings?.email && (
                                                                        <a href={`mailto:${profileSettings.email}`}
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-white border border-gray-200 flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                        >
                                                                            <Icon icon="logos:google-gmail" className="w-[1.2vw] h-[1.2vw]" />
                                                                        </a>
                                                                    )}
                                                                    {profileSettings?.instagram && (
                                                                        <a href={profileSettings.instagram} target="_blank" rel="noreferrer"
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                            style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%)' }}
                                                                        >
                                                                            <Icon icon="skill-icons:instagram" className="w-[1.2vw] h-[1.2vw]" />
                                                                        </a>
                                                                    )}
                                                                    {profileSettings?.phone && (
                                                                        <a href={`tel:${profileSettings.phone}`}
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-[#25D366] flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                        >
                                                                            <Icon icon="fluent:call-24-filled" className="w-[1.1vw] h-[1.1vw] text-white" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* Share */}
                            {renderToolbarBtn(
                                <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Share',
                                handleShare,
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                            )}
                            {/* Download */}
                            {renderToolbarBtn(
                                <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Download',
                                handleDownload,
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                            )}
                            {/* Fullscreen */}
                            {renderToolbarBtn(
                                <Icon icon={isFullScreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Fullscreen',
                                handleFullScreen,
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                            )}
                        </div>
                    </div>

                    {/* Right: Standardized Zoom Slider */}
                    {settings.viewing.zoom && (
                        <div className={`rounded-full flex items-center p-[0.3vw] shadow-[0_0.2vw_1vw_rgba(0,0,0,0.06)] border border-gray-100 shrink-0 ${isTablet ? 'gap-[0.3vw] px-[0.3vw]' : 'gap-[1.2vw] px-[1.2vw]'}`}
                            style={{ backgroundColor: getLayoutColorRgba('search-bg-v2', '221, 224, 244', '1') }}
                        >
                            <div className="flex items-center gap-[0.5vw]">
                                {renderToolbarBtn(
                                    <Icon icon="fad:zoomout" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />,
                                    'Zoom Out',
                                    (e) => { e.stopPropagation(); zoomOut(); },
                                    { color: getLayoutColor('search-text-v1', '#575C9C') }
                                )}
                                <div className={`hidden w-[2vw] ${isTablet ? 'h-[0.2vw]' : 'h-[0.25vw]'} rounded-full relative overflow-hidden bg-black/10`}>
                                    <div
                                        className="absolute top-0 left-0 h-full transition-all duration-300 z-10"
                                        style={{ 
                                            backgroundColor: getLayoutColor('search-text-v1', '#575C9C'), 
                                            width: `${Math.max(0, Math.min(100, ((dimWidth - initialWidth * 0.5) / (initialWidth * 1.5 - initialWidth * 0.5)) * 100))}%` 
                                        }}
                                    />
                                </div>
                                
                            
                            <span
                                className={`${isTablet ? 'text-[0.65vw] min-w-[0.2vw]' : 'text-[0.78vw] min-w-[2.2vw]'} font-bold  text-center select-none`}
                                style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
                            >
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            {renderToolbarBtn(
                                    <Icon icon="fad:zoomin" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />,
                                    'Zoom In',
                                    (e) => { e.stopPropagation(); zoomIn(); },
                                    { color: getLayoutColor('search-text-v1', '#575C9C') }
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                    setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                }}
                                className={`${isTablet ? 'text-[0.6vw] px-[0.4vw] py-[0.25vw]' : 'text-[0.75vw] px-[0.5vw] py-[0.35vw]'} font-bold rounded-full hover:brightness-95 transition-all bg-white/50`}
                                style={{
                                    backgroundColor: getLayoutColorRgba('search-bg-v2', '221, 224, 244', '1'),
                                    color: getLayoutColor('search-text-v1', '#575C9C')
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* ── THUMBNAIL BAR ── Exact Match to Screenshot (Compact Version) */}
                {showThumbnails && (
                    <>
                        {/* Dim Backdrop */}
                        <div className="absolute inset-0 z-[100] bg-black/5" onClick={() => setShowThumbnails(false)} />

                        {/* Main Container - More Compact */}
                        <div
                            className={`absolute z-[150] ${isTablet ? 'bottom-[6.5vh] h-[5vw] border' : 'bottom-[8.5vh] h-[6.2vw] border-[2px]'} left-[2.5vw] right-[2.5vw] rounded-full shadow-[0_0.8vw_2.5vw_rgba(0,0,0,0.12)] flex items-center px-[0.6vw]`}
                            style={{
                                backgroundColor: getLayoutColor('search-bg-v2', '#ffffff'),
                                borderColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.3')
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Left Navigation */}
                            <button
                                className="w-[2.8vw] h-full flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                                style={{ color: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.6') }}
                            >
                                <Icon icon="lucide:chevron-left" className="w-[1.4vw] h-[1.4vw] stroke-[3px]" />
                            </button>

                            {/* Thumbnails Container */}
                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="flex-1 flex overflow-x-hidden no-scrollbar scroll-smooth items-center h-full gap-[0.8vw] px-[0.5vw]"
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);

                                    return (
                                        <div
                                            key={idx}
                                            className="thumbnail-item relative flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300 group"
                                            style={{ width: '7vw' }}
                                            onClick={() => onPageClick(spread.indices[0])}
                                        >
                                            {/* Thumbnail Container with Border */}
                                            <div
                                                className={`w-full h-[4.2vw] bg-white border-[1.5px] transition-all rounded-[0.2vw] overflow-hidden relative shadow-sm`}
                                                style={{
                                                    borderColor: isSelected ? getLayoutColor('toolbar-bg', '#575C9C') : '#D1D5DB',
                                                    boxShadow: isSelected ? `0 0 0 1px ${getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.2')}` : 'none'
                                                }}
                                            >
                                                <div className="flex w-full h-full gap-[1px] bg-gray-100 justify-center">
                                                    {spread.pages.map((page, pIdx) => {
                                                        const pageWidth = 400;
                                                        const pageHeight = 566;
                                                        const availableWidth = 3.5 * (window.innerWidth / 100);
                                                        const availableHeight = 4.2 * (window.innerWidth / 100);
                                                        const thumbScale = Math.min(availableWidth / pageWidth, availableHeight / pageHeight) * 0.85;

                                                        return (
                                                            <div key={`${idx}-${pIdx}`} className="flex-1 max-w-[50%] bg-white overflow-hidden relative flex items-center justify-center border-r last:border-r-0 border-gray-100">
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={spread.indices[pIdx]}
                                                                    scale={thumbScale}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Selected Overlay - Page Number text */}
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                                        <span className="text-white text-[0.6vw] font-bold">
                                                            {spread.indices.length === 1 ? `Page ${spread.indices[0] + 1}` : `Page ${spread.indices[0] + 1} / ${spread.indices[1] + 1}`}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Navigation */}
                            <button
                                className="w-[2.8vw] h-full flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                                style={{ color: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.6') }}
                            >
                                <Icon icon="lucide:chevron-right" className="w-[1.4vw] h-[1.4vw] stroke-[3px]" />
                            </button>
                        </div>
                    </>
                )}
            </div>
    );
};

export default Grid5Layout;
