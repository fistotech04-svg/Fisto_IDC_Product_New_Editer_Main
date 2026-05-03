import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import ViewBookmarkPopup from '../popups/ViewBookmarkPopup';

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
    otherSetupSettings,
    setIsMuted,
    isFlipMuted,
    setIsFlipMuted,
    showSoundPopup,
    setShowSoundPopupMemo,
    isTablet,
    isMobileLandscape
}) => {
    // ... rest of the setup logic
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
        if (bgSoundMasterEnabled && setIsMuted) {
            setIsMuted(!isMuted);
        }
    };

    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
    const aspectRatio = initialHeight / initialWidth;

    React.useEffect(() => {
        setDimWidth(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
        setDimHeight(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
    }, [isTablet, isMobileLandscape, initialWidth, initialHeight]);

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
        const opacity = getLayoutOpacity(tokenId, defaultOpacity);
        if (color && typeof color === 'string' && color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16) || 0;
            const g = parseInt(color.slice(3, 5), 16) || 0;
            const b = parseInt(color.slice(5, 7), 16) || 0;
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return `rgba(var(--${tokenId}-rgb, ${defaultRgb}), var(--${tokenId}-opacity, ${defaultOpacity}))`;
    };

    const totalPages = pagesCount;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const previewAreaRef = useRef(null);
    const [responsiveScale, setResponsiveScale] = useState(1);

    // Responsive scaling logic for Mobile Landscape
    React.useEffect(() => {
        if (!isMobileLandscape) {
            setResponsiveScale(1);
            return;
        }

        const updateScale = () => {
            if (previewAreaRef.current) {
                const cw = previewAreaRef.current.clientWidth;
                const ch = previewAreaRef.current.clientHeight;
                const availableW = cw * 0.95;
                const availableH = ch * 0.95;
                const baseSpreadW = (initialWidth * 0.95) * 2;
                const baseSpreadH = initialHeight * 0.9;
                const scaleX = availableW / baseSpreadW;
                const scaleY = availableH / baseSpreadH;
                setResponsiveScale(Math.min(scaleX, scaleY));
            }
        };

        const timer = setTimeout(updateScale, 300);
        window.addEventListener('resize', updateScale);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateScale);
        };
    }, [isMobileLandscape, initialWidth, initialHeight]);

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [showTOC, setShowTOC] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showProfileLocal, setShowProfileLocal] = useState(false);
    const [showBookmarkLocal, setShowBookmarkLocal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [showBottomNotesOptions, setShowBottomNotesOptions] = useState(false);
    const [tocSearchQuery, setTocSearchQuery] = useState('');

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
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans" style={backgroundStyle} onClick={() => {
            setRecommendations([]);
            setShowBookmarkOptions(false);
            setShowNotesOptions(false);
            setShowBottomNotesOptions(false);
            setShowThumbnails(false);
            setShowTOC(false);
            setShowBookmarkLocal(false);
            setShowProfileLocal(false);
            setShowSoundPopupMemo(false);
        }}>
            {/* ── TOP BAR ── White with search | title | logo */}
            <div
                className={`${isMobileLandscape ? 'h-[14%]' : isTablet ? 'h-[5.2vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50 relative`}
            >

                {/* Left: Search Pill */}
                <div className="flex items-center">
                    {settings.interaction.search && (
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <div
                                className={`flex items-center rounded-[0.5vw] ${isTablet ? 'px-[0.8vw] py-[0.35vw]' : 'px-[1vw] py-[0.45vw]'} shadow-inner group transition-all duration-300 ${isSidebarOpen ? (isTablet ? 'w-[9.5vw]' : 'w-[11.5vw]') : (isTablet ? 'w-[11.5vw]' : 'w-[15vw]')}`}
                                style={{ backgroundColor: currentPage === 0 ? '#FFFFFF' : getLayoutColorRgba('search-bg-v2', '221, 224, 244', '1') }}
                            >
                                <Icon
                                    icon="ph:magnifying-glass-bold"
                                    className={`${isMobileLandscape ? 'w-[0.6vw] h-[0.6vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`}
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
                                    className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                    style={{ color: getLayoutColorRgba('search-text-v1', '87, 92, 156', '1') }}
                                />
                            </div>

                            {/* Recommendations Dropdown */}
                            {recommendations.length > 0 && (
                                <div className={`absolute ${isTablet ? 'top-[2.5vw]' : 'top-[3.2vw]'} left-0 rounded-[0.8vw] shadow-2xl z-[100] overflow-hidden border transition-all ${isSidebarOpen ? (isTablet ? 'w-[9.5vw]' : 'w-[11.5vw]') : (isTablet ? 'w-[11.5vw]' : 'w-[15vw]')}`}
                                    style={{
                                        backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1'),
                                        borderColor: getLayoutColor('dropdown-text', '#575C9C')
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="px-[1.2vw] py-[0.6vw]">
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
                                                    const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                    setLocalSearchQuery(fullQuery);
                                                    setSearchQuery(fullQuery);
                                                    setRecommendations([]);
                                                }}
                                            >
                                                <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                        <span className="font-bold mr-[0.3vw]" style={{ color: getLayoutColor('dropdown-text', '#575C9C'), fontWeight: 800 }}>{rec.word}</span>
                                                        {rec.context && <span className="font-normal opacity-70" style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>{rec.context}</span>}
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-[0.8vw] font-bold tabular-nums shrink-0"
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
            <div ref={previewAreaRef} className={`flex-1 flex items-center justify-center ${isFullScreen ? 'p-0' : 'px-[4vw]'} magazine-canvas relative min-h-0`}>

                {/* Far-left navigation: skip-back + prev */}
                <div className="absolute left-[1.5vw] top-1/2 -translate-y-1/2 flex items-center gap-[0.5vw] z-20">
                    <button
                        className="hover:scale-110 transition-all p-[0.5vw] opacity-60 hover:opacity-100"
                        onClick={() => onPageClick(0)}
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                    >
                        <Icon icon="ph:skip-back" className={`${isMobileLandscape ? 'w-[0.8vw] h-[0.8vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        className="hover:scale-110 transition-all p-[0.5vw] opacity-60 hover:opacity-100"
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                    >
                        <Icon icon="ph:caret-left" className={`${isMobileLandscape ? 'w-[0.8vw] h-[0.8vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                </div>

                {/* Far-right navigation: next + skip-forward */}
                <div className="absolute right-[1.5vw] top-1/2 -translate-y-1/2 flex items-center gap-[0.5vw] z-20">
                    <button
                        className="hover:scale-110 transition-all p-[0.5vw] opacity-60 hover:opacity-100"
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                    >
                        <Icon icon="ph:caret-right" className={`${isMobileLandscape ? 'w-[0.8vw] h-[0.8vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button
                        className="hover:scale-110 transition-all p-[0.5vw] opacity-60 hover:opacity-100"
                        onClick={() => onPageClick(pagesCount - 1)}
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                    >
                        <Icon icon="ph:skip-forward" className={`${isMobileLandscape ? 'w-[0.8vw] h-[0.8vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                </div>

                {/* Flipbook Container */}
                <div
                    className="relative transition-all duration-600 ease-in-out magazine-content-area"
                    style={{
                        transform: `translateX(${localOffset}px) scale(${isMobileLandscape ? responsiveScale : 1})`,
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
            <div className={`${isMobileLandscape ? 'h-[11%] mb-[2%]' : isTablet ? 'h-[5.5vh]' : 'h-[8vh] mb-[2.5vh]'} flex items-center px-[1.5vw] justify-between shrink-0 w-full relative z-40 bg-transparent border-t border-gray-200/50`}>
                <div className={`rounded-full flex items-center p-[0.3vw] shadow-[0_0.2vw_1vw_rgba(0,0,0,0.06)] border border-gray-100 shrink-0 ${isMobileLandscape ? 'h-[65%] gap-[0.5vw] px-[0.8vw]' : isTablet ? 'h-[4vh] gap-[0.2vw] px-[0.2vw]' : 'h-[6vh] gap-[0.3vw] px-[0.5vw]'}`}
                    style={{
                        backgroundColor: currentPage === 0
                            ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1')
                            : getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1')
                    }}
                >
                    <span
                        className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.78vw]'} font-bold select-none whitespace-nowrap`}
                        style={{ color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#575C9C') : getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >Page: </span>
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
                        className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.78vw]'} font-bold bg-transparent border-none outline-none text-center`}
                        style={{
                            width: `${String(pages.length).length + 1}ch`,
                            color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#575C9C') : getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: 'var(--toolbar-bg-opacity, 1)'
                        }}
                    />
                    <span
                        className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.78vw]'} font-bold select-none whitespace-nowrap`}
                        style={{ color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#575C9C') : getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    > / {totalPages}</span>
                </div>

                {/* Center: Long Tool Strip */}
                <div
                    className={`flex-1 ${isMobileLandscape ? 'max-w-[80vw] mx-[1vw] h-[65%]' : isTablet ? 'max-w-[75vw] mx-[0.5vw] h-[4vh]' : 'max-w-[78vw] mx-[0.8vw] h-[6vh]'} rounded-full flex items-center ${isTablet ? 'px-[1vw]' : 'px-[1.5vw]'} shadow-[0_0.5vw_2.5vw_rgba(0,0,0,0.15)] border border-white/10 relative`}
                    style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1') }}
                >
                    {/* Functional Icons Group */}
                    <div className={`flex items-center ${isTablet ? 'gap-[0.5vw] mr-[0.2vw]' : 'gap-[0.8vw] mr-[1.5vw]'} shrink-0`}>
                        {renderToolbarBtn(
                            <Icon icon="ph:skip-back" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'First',
                            () => onPageClick(0),
                            { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                        )}
                        {settings.media.autoFlip && renderToolbarBtn(
                            <Icon icon={isAutoFlipping ? 'ph:pause-fill' : 'ph:play-fill'} className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            isAutoFlipping ? 'Pause' : 'Play',
                            () => setIsPlaying(!isAutoFlipping),
                            { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                        )}
                        {renderToolbarBtn(
                            <Icon icon="ph:skip-forward" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]'}`} />,
                            'Last',
                            () => onPageClick(pagesCount - 1),
                            { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div
                        ref={progressRef}
                        className={`flex-1 ${isTablet ? 'h-[0.25vh] mr-[0.5vw] w-[2vw]' : 'h-[0.35vh] mr-[2.5vw]'} relative group cursor-pointer`}
                        onClick={handleProgressClick}
                        onMouseMove={handleProgressMouseMove}
                        onMouseLeave={() => {
                            if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                            setProgressHover(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <div className="w-full h-full rounded-full absolute inset-0 overflow-hidden">
                            {/* Track Underlay */}
                            <div className="absolute inset-0 transition-colors duration-300" style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: isTablet ? 0.4 : 0.3 }} />
                            {/* Progress Fill */}
                            <div
                                className="absolute top-0 left-0 h-full transition-all duration-300 ease-out z-10"
                                style={{
                                    width: `${progressPercentage}%`,
                                    backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                    opacity: 1
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
                                    className={`absolute z-[100] bottom-[calc(100%+2.5vw)] pointer-events-none`}
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

                                        {/* Arrow with border (inlet) effect - shifted further left as requested */}
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

                    {/* Functional Icons Group */}
                    <div className={`flex items-center ${isTablet ? 'gap-[0.9vw]' : 'gap-[1.15vw]'} shrink-0`}>
                        {/* Thumbnails */}
                        {renderToolbarBtn(
                            <Icon icon="ph:squares-four-fill" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Thumbnails',
                            (e) => {
                                e.stopPropagation();
                                setShowThumbnails(!showThumbnails);
                                setShowTOC(false);
                                setShowBookmarkLocal(false);
                                setShowProfileLocal(false);
                                setShowBottomNotesOptions(false);
                                setShowBookmarkOptions(false);
                                setShowSoundPopupMemo(false);
                            },
                            { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showThumbnails ? 0.7 : 1 }
                        )}

                        {/* TOC */}
                        <div className="relative">
                            {renderToolbarBtn(
                                <Icon icon="fluent:text-bullet-list-24-filled" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'TOC',
                                (e) => {
                                    e.stopPropagation();
                                    setShowTOC(!showTOC);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfileLocal(false);
                                    setShowBottomNotesOptions(false);
                                    setShowBookmarkOptions(false);
                                    setShowSoundPopupMemo(false);
                                },
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showTOC ? 0.7 : 1 }
                            )}

                            {showTOC && (
                                <>
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
                                                    <path d="M0 0L5 20L10 0" fill="#FFFFFF" />
                                                    <path d="M0 0L5 20L10 0" fill={getLayoutColor('toc-bg', '#FFFFFF')} />
                                                </svg>
                                            </div>
                                            {/* Popup Content */}
                                            <div
                                                className={`rounded-[1.2vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.1)] ${isTablet ? 'w-[10vw]' : 'w-[15.5vw]'} flex flex-col relative z-20 overflow-hidden`}
                                                style={{
                                                    backgroundColor: '#FFFFFF',
                                                }}
                                            >
                                                <div
                                                    className="absolute inset-0 z-0"
                                                    style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
                                                />
                                                <div className="relative z-10 p-[1.1vw] flex flex-col">
                                                    <h2
                                                        className={`${isTablet ? 'text-[0.8vw]' : 'text-[0.9vw]'} font-bold mb-[0.8vw] tracking-tight`}
                                                        style={{ color: getLayoutColor('toc-text', '#000000') }}
                                                    >Table of Contents</h2>

                                                    {/* Search Bar */}
                                                    {settings.tocSettings?.addSearch !== false && (
                                                        <div className="mb-[1vw]">
                                                            <div
                                                                className="flex items-center rounded-[0.4vw] px-[0.6vw] py-[0.4vw] border transition-all relative overflow-hidden"
                                                                style={{
                                                                    borderColor: getLayoutColor('toc-bg', '#FFFFFF').toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                                        ? 'rgba(255,255,255,0.2)'
                                                                        : 'rgba(0,0,0,0.08)'
                                                                }}
                                                            >
                                                                <div
                                                                    className="absolute inset-0 z-0"
                                                                    style={{
                                                                        backgroundColor: getLayoutColor('toc-bg', '#FFFFFF').toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                                            ? getLayoutColor('toc-bg', '#FFFFFF')
                                                                            : getLayoutColor('toc-text', '#575C9C'),
                                                                        opacity: getLayoutColor('toc-bg', '#FFFFFF').toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                                            ? 0.15
                                                                            : 0.05
                                                                    }}
                                                                />
                                                                <div className="relative z-10 flex items-center w-full">
                                                                    <Icon icon="lucide:search" className="w-[0.9vw] h-[0.9vw]" style={{ color: getLayoutColor('toc-text', '#575C9C'), opacity: 0.4 }} />
                                                                    <input
                                                                        type="text"
                                                                        value={tocSearchQuery}
                                                                        onChange={(e) => setTocSearchQuery(e.target.value)}
                                                                        placeholder="Search..."
                                                                        className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} ml-[0.4vw] w-full placeholder:text-gray-400`}
                                                                        style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    {tocSearchQuery && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setTocSearchQuery(''); }}
                                                                            className="transition-colors"
                                                                            style={{ color: getLayoutColor('toc-text', '#575C9C'), opacity: 0.3 }}
                                                                        >
                                                                            <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col gap-[0.6vw] max-h-[30vh] overflow-y-auto pr-[0.4vw] no-scrollbar">
                                                        {settings?.tocSettings?.content?.length > 0 ? (
                                                            settings.tocSettings.content
                                                                .filter(item => {
                                                                    if (!tocSearchQuery) return true;
                                                                    const matchMain = item.title.toLowerCase().includes(tocSearchQuery.toLowerCase());
                                                                    const matchSub = item.subheadings?.some(sub => sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase()));
                                                                    return matchMain || matchSub;
                                                                })
                                                                .map((item, idx) => {
                                                                    const filteredSubheadings = item.subheadings?.filter(sub =>
                                                                        !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                                                    ) || [];

                                                                    return (
                                                                        <React.Fragment key={item.id || idx}>
                                                                            {/* Main Heading */}
                                                                            <div
                                                                                className="flex items-center justify-between group cursor-pointer py-[0.1vw]"
                                                                                onClick={() => { onPageClick(item.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                                            >
                                                                                <div className="flex items-center gap-[0.3vw] truncate pr-[0.4vw]">
                                                                                    {settings.tocSettings?.addSerialNumberToHeading !== false && (
                                                                                        <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold opacity-50 tabular-nums shrink-0`} style={{ color: getLayoutColor('toc-text', '#374151') }}>{idx + 1}.</span>
                                                                                    )}
                                                                                    <span
                                                                                        className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-semibold transition-colors truncate`}
                                                                                        style={{ color: getLayoutColor('toc-text', '#374151') }}
                                                                                    >
                                                                                        {item.title}
                                                                                    </span>
                                                                                </div>
                                                                                {settings.tocSettings?.addPageNumber !== false && (
                                                                                    <span
                                                                                        className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-semibold transition-colors tabular-nums shrink-0`}
                                                                                        style={{ color: getLayoutColor('toc-text', '#374151') }}
                                                                                    >
                                                                                        {String(item.page).padStart(2, '0')}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Child Subheadings */}
                                                                            {filteredSubheadings.map((sub, sIdx) => (
                                                                                <div
                                                                                    key={sub.id || sIdx}
                                                                                    className="flex items-center justify-between group cursor-pointer py-[0.1vw]"
                                                                                    onClick={() => { onPageClick(sub.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                                                >
                                                                                    <div className="flex items-center gap-[0.3vw] truncate pr-[0.4vw] ml-[0.6vw]">
                                                                                        {settings.tocSettings?.addSerialNumberToSubheading !== false && (
                                                                                            <span className="text-[0.75vw] font-bold opacity-30 tabular-nums shrink-0" style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '1') }}>{idx + 1}.{sIdx + 1}</span>
                                                                                        )}
                                                                                        <span
                                                                                            className="text-[0.75vw] font-medium transition-colors truncate"
                                                                                            style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                                        >
                                                                                            {sub.title}
                                                                                        </span>
                                                                                    </div>
                                                                                    {settings.tocSettings?.addPageNumber !== false && (
                                                                                        <span
                                                                                            className="text-[0.75vw] font-medium transition-colors tabular-nums shrink-0"
                                                                                            style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                                        >
                                                                                            {String(sub.page).padStart(2, '0')}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </React.Fragment>
                                                                    );
                                                                })
                                                        ) : (
                                                            <div className="text-center py-[1.5vw] text-gray-400 text-[0.7vw]">No content</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Add Notes */}
                        <div className="relative">
                            {renderToolbarBtn(
                                <Icon icon="material-symbols-light:add-notes" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />,
                                'Notes',
                                (e) => {
                                    e.stopPropagation();
                                    setShowBottomNotesOptions(!showBottomNotesOptions);
                                    setShowTOC(false);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfileLocal(false);
                                    setShowBookmarkOptions(false);
                                    setShowSoundPopupMemo(false);
                                },
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 1 }
                            )}
                            {showBottomNotesOptions && (
                                <div
                                    className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+1.4vw)] ${isTablet ? 'w-[9vw]' : 'w-[11.5vw]'} rounded-[1vw] shadow-2xl z-[160] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 border-[2px] border-gray-100 bg-white`}
                                >
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}
                                    />
                                    <button
                                        className="relative z-10 w-full flex items-center px-[0.8vw] py-[1.2vh] hover:opacity-70 transition-opacity gap-[0.7vw] text-left"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAddNotesPopupMemo(true);
                                            setShowBottomNotesOptions(false);
                                        }}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`${isMobileLandscape ? 'w-[0.8vw] h-[0.8vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`}
                                            style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                        >
                                            <path d="M2.75499 14.7146L3.27199 16.6466C3.87599 18.9016 4.17899 20.0296 4.86399 20.7606C5.40464 21.3374 6.10408 21.7411 6.87399 21.9206C7.84999 22.1486 8.97799 21.8466 11.234 21.2426C13.488 20.6386 14.616 20.3366 15.347 19.6516C15.4077 19.5943 15.4663 19.5356 15.523 19.4756C15.1824 19.4449 14.8439 19.3948 14.509 19.3256C13.813 19.1876 12.986 18.9656 12.008 18.7036L11.901 18.6746L11.876 18.6686C10.812 18.3826 9.92299 18.1446 9.21299 17.8886C8.46599 17.6186 7.78799 17.2856 7.21099 16.7456C6.41731 16.002 5.86191 15.0398 5.61499 13.9806C5.43499 13.2116 5.48699 12.4576 5.62699 11.6766C5.76099 10.9276 6.00099 10.0296 6.28899 8.95463L6.82399 6.96062L6.84199 6.89062C4.92199 7.40763 3.91099 7.71362 3.23699 8.34462C2.65949 8.88568 2.25545 9.58588 2.07599 10.3566C1.84799 11.3316 2.14999 12.4596 2.75499 14.7146Z" fill="currentColor" />
                                            <path fillRule="evenodd" clipRule="evenodd" d="M11.8741 2.07599C12.85 1.84807 13.9778 2.14979 16.2335 2.7547C16.8008 2.90671 17.2972 3.03922 17.7335 3.16388C17.275 3.7184 17.0001 4.43016 17.0001 5.20587C17.0001 6.97649 18.4355 8.41192 20.2061 8.41192C20.6511 8.4119 21.0748 8.32092 21.46 8.15704C21.3339 8.82433 21.1174 9.64216 20.8301 10.7147L20.3116 12.6463C19.7066 14.9013 19.4048 16.0296 18.7198 16.7606C18.1793 17.3377 17.48 17.7419 16.71 17.9217C16.6135 17.9443 16.515 17.9614 16.4151 17.9734C15.5001 18.0864 14.3827 17.788 12.3507 17.244C10.0957 16.639 8.96738 16.3362 8.23639 15.6512C7.65932 15.1105 7.25582 14.4106 7.07624 13.6404C6.84831 12.6645 7.15003 11.5377 7.75495 9.28302L8.27155 7.3504L8.51569 6.4461C8.97069 4.78012 9.27733 3.86314 9.86432 3.23614C10.405 2.65934 11.1042 2.25553 11.8741 2.07599ZM11.1924 12.1736C11.0005 12.1225 10.7961 12.1495 10.6241 12.2488C10.452 12.3482 10.326 12.512 10.2745 12.7039C10.249 12.799 10.2431 12.8983 10.2559 12.9959C10.2687 13.0935 10.3005 13.188 10.3497 13.2733C10.3988 13.3584 10.4641 13.4331 10.5421 13.493C10.6202 13.553 10.7096 13.5973 10.8048 13.6229L13.7032 14.3983C13.7993 14.4276 13.9001 14.438 14.0001 14.4275C14.1002 14.417 14.1981 14.3865 14.2862 14.3377C14.3741 14.289 14.4509 14.2225 14.5128 14.1434C14.5747 14.0641 14.6205 13.973 14.6466 13.8758C14.6726 13.7785 14.6791 13.6767 14.6651 13.577C14.6511 13.4773 14.6174 13.381 14.5655 13.2947C14.5137 13.2086 14.4446 13.1341 14.3633 13.075C14.2819 13.0158 14.189 12.9736 14.0909 12.951L11.1924 12.1736ZM11.6778 9.25567C11.5801 9.26848 11.4858 9.30021 11.4005 9.34942C11.3153 9.39855 11.2407 9.46389 11.1807 9.54181C11.1208 9.6199 11.0764 9.70941 11.0508 9.8045C10.9995 9.99651 11.0267 10.2027 11.126 10.3748C11.2254 10.5467 11.3893 10.6719 11.5811 10.7234L16.4112 12.0174C16.5072 12.0462 16.6084 12.0555 16.7081 12.0447C16.8075 12.0339 16.9038 12.0035 16.9913 11.9549C17.079 11.9061 17.1561 11.8397 17.2178 11.7606C17.2796 11.6814 17.3246 11.5909 17.3507 11.494C17.3767 11.397 17.384 11.2955 17.3702 11.1961C17.3564 11.0968 17.3219 11.001 17.2706 10.9149C17.2192 10.8289 17.1511 10.7544 17.0704 10.6951C16.9895 10.6358 16.8975 10.5933 16.7999 10.5701L11.9698 9.27423C11.8747 9.2487 11.7754 9.24288 11.6778 9.25567Z" fill="currentColor" />
                                            <path d="M20.2062 3V6.63111M22.0217 4.81555H18.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-semibold`} style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>Add Notes</span>
                                    </button>
                                    <button
                                        className="relative z-10 w-full flex items-center px-[0.8vw] py-[1.2vh] hover:opacity-70 transition-opacity gap-[0.7vw] text-left"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowNotesViewerMemo(true);
                                            setShowBottomNotesOptions(false);
                                        }}
                                    >
                                        <Icon icon="lets-icons:view-fill" className={`${isMobileLandscape ? 'w-[0.8vw] h-[0.8vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} style={{ color: getLayoutColor('dropdown-text', '#575C9C') }} />
                                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-semibold`} style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>View Notes</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Bookmark */}
                        <div className="relative">
                            {renderToolbarBtn(
                                <Icon icon="fluent:bookmark-24-filled" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Bookmarks',
                                (e) => {
                                    e.stopPropagation();
                                    setShowBookmarkOptions(!showBookmarkOptions);
                                    setShowTOC(false);
                                    setShowThumbnails(false);
                                    setShowProfileLocal(false);
                                    setShowBookmarkLocal(false);
                                    setShowBottomNotesOptions(false);
                                    setShowSoundPopupMemo(false);
                                },
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 1 }
                            )}
                            {showBookmarkOptions && (
                                <div
                                    className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+1.4vw)] ${isTablet ? 'w-[8.5vw]' : 'w-[11vw]'} rounded-[1vw] shadow-2xl z-[160] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 border-[2px] border-gray-100 bg-white`}
                                >
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}
                                    />
                                    <button
                                        className="relative z-10 w-full flex items-center px-[0.8vw] py-[1.2vh] hover:opacity-70 transition-opacity gap-[0.7vw] text-left"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAddBookmarkPopupMemo(true);
                                            setShowBookmarkOptions(false);
                                        }}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`${isMobileLandscape ? 'w-[0.8vw] h-[0.8vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`}
                                            style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                                        >
                                            <path d="M15.2354 2C15.084 2.37237 15 2.77935 15 3.20605C15 4.97672 16.4354 6.41209 18.2061 6.41211C18.8707 6.41211 19.488 6.20962 20 5.86328V21.0283C19.9998 22.2481 18.6198 22.958 17.6279 22.249L12 18.2285L6.37207 22.249C5.37915 22.959 4.00022 22.2491 4 21.0293V5C4 4.20435 4.3163 3.44152 4.87891 2.87891C5.44152 2.3163 6.20435 2 7 2H15.2354Z" fill="currentColor" />
                                            <path d="M18.2062 1V4.63111M20.0217 2.81555H16.3906" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-semibold`} style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>Add Bookmark</span>
                                    </button>
                                    <button
                                        className="relative z-10 w-full flex items-center px-[0.8vw] py-[1.2vh] hover:opacity-70 transition-opacity gap-[0.7vw] text-left"
                                        onClick={() => {
                                            setShowBookmarkLocal(true);
                                            setShowBookmarkOptions(false);
                                        }}
                                    >
                                        <Icon icon="lets-icons:view-fill" className={`${isMobileLandscape ? 'w-[0.8vw] h-[0.8vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} style={{ color: getLayoutColor('dropdown-text', '#575C9C') }} />
                                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-semibold`} style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}>View Bookmark</span>
                                    </button>
                                </div>
                            )}

                            {/* Inline Bookmark Popup — always above this icon */}
                            {showBookmarkLocal && (
                                <>
                                    <div
                                        className={`absolute ${isTablet ? 'bottom-[2.8vw] -translate-x-[25%]' : 'bottom-[3.2vw] -translate-x-[20%]'} z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="relative">
                                            {/* Triangle pointer */}
                                            <div
                                                className={`absolute -bottom-[1.3vw] ${isTablet ? 'left-[25%]' : 'left-[20%]'} -translate-x-1/2 z-10 pointer-events-none`}
                                                style={{ width: '0.9vw', height: '1.4vw' }}
                                            >
                                                <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M0 0L5 20L10 0" fill="#FFFFFF" />
                                                    <path d="M0 0L5 20L10 0" fill={getLayoutColorRgba('toc-bg', '255, 255, 255', '1')} />
                                                    <path d="M0 0L5 20L10 0" stroke={getLayoutColorRgba('toc-bg', '87, 92, 156', '0.3')} strokeWidth="1" />
                                                </svg>
                                            </div>
                                            {/* Popup Card */}
                                            <div
                                                className={`rounded-[1.2vw] shadow-[0_1.2vw_3.5vw_rgba(0,0,0,0.08)] ${isTablet ? 'w-[10vw]' : 'w-[16vw]'} flex flex-col relative z-20 border overflow-hidden`}
                                                style={{
                                                    backgroundColor: '#FFFFFF',
                                                    borderColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.3')
                                                }}
                                            >
                                                <div
                                                    className="w-full flex flex-col p-[1.2vw]"
                                                    style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
                                                >
                                                    <h2
                                                        className={`${isTablet ? 'text-[0.8vw]' : 'text-[0.95vw]'} font-bold mb-[1.2vw] tracking-tight`}
                                                        style={{ color: getLayoutColor('toc-text', '#000000') }}
                                                    >Bookmark</h2>

                                                    <div className="flex flex-col gap-[1vw] max-h-[35vh] overflow-y-auto pr-[0.4vw] no-scrollbar">
                                                        {bookmarks && bookmarks.length > 0 ? (
                                                            bookmarks.map((bm) => (
                                                                <div key={bm.id} className="flex items-center justify-between group/bm">
                                                                    {editingId === bm.id ? (
                                                                        <input
                                                                            autoFocus
                                                                            className={`w-[8.5vw] text-[0.85vw] font-medium text-black border-b outline-none mr-[0.5vw] bg-transparent`}
                                                                            style={{ borderBottomColor: getLayoutColorRgba('toc-text', '87, 92, 156', '0.3') }}
                                                                            value={editValue}
                                                                            onChange={(e) => setEditValue(e.target.value)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    if (editValue.trim() && editValue !== bm.label) {
                                                                                        onUpdateBookmark(bm.id, editValue.trim());
                                                                                    }
                                                                                    setEditingId(null);
                                                                                } else if (e.key === 'Escape') {
                                                                                    setEditingId(null);
                                                                                }
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <span
                                                                            className="text-[0.85vw] font-medium cursor-pointer truncate flex-1 pr-[0.8vw] transition-colors"
                                                                            style={{ color: getLayoutColor('toc-text', '#4B5563') }}
                                                                            onClick={() => { onPageClick && onPageClick(bm.pageIndex); setShowBookmarkLocal(false); }}
                                                                        >
                                                                            {bm.label}
                                                                        </span>
                                                                    )}
                                                                    <div className="flex items-center gap-[0.6vw] shrink-0">
                                                                        <button
                                                                            onClick={() => {
                                                                                if (editingId === bm.id) {
                                                                                    if (editValue.trim() && editValue !== bm.label) {
                                                                                        onUpdateBookmark(bm.id, editValue.trim());
                                                                                    }
                                                                                    setEditingId(null);
                                                                                } else {
                                                                                    setEditingId(bm.id);
                                                                                    setEditValue(bm.label);
                                                                                }
                                                                            }}
                                                                            className="text-gray-400 transition-colors"
                                                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                                        >
                                                                            <Icon
                                                                                icon={editingId === bm.id ? "lucide:check" : "mdi:rename"}
                                                                                className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`}
                                                                            />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => onDeleteBookmark && onDeleteBookmark(bm.id)}
                                                                            className="text-red-300 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <Icon icon="material-symbols-light:delete-outline-rounded" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center py-[1.5vw] text-gray-400 text-[0.8vw] font-medium">No bookmark found</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Gallery */}
                        {renderToolbarBtn(
                            <Icon icon="clarity:image-gallery-solid" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Gallery',
                            () => {
                                setShowGalleryPopupMemo(true);
                                setShowTOC(false);
                                setShowThumbnails(false);
                                setShowBookmarkLocal(false);
                                setShowProfileLocal(false);
                                setShowBottomNotesOptions(false);
                                setShowBookmarkOptions(false);
                            },
                            { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                        )}
                        {/* Music */}
                        <div className="relative">
                            {renderToolbarBtn(
                                <Icon icon="solar:music-notes-bold" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Music',
                                (e) => {
                                    e.stopPropagation();
                                    setShowSoundPopupMemo(!showSoundPopup);
                                    setShowTOC(false);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfileLocal(false);
                                    setShowBottomNotesOptions(false);
                                    setShowBookmarkOptions(false);
                                },
                                { color: (showSoundPopup || !isMuted) ? getLayoutColor('toolbar-text-main', '#FFFFFF') : getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.3') }
                            )}

                            {showSoundPopup && (
                                <>
                                    <div
                                        className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+1.2vw)] z-[160] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            backgroundColor: '#FFFFFF',
                                            width: isTablet ? '8.5vw' : '10.5vw',
                                            borderRadius: isTablet ? '0.8vw' : '1vw',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                            overflow: 'hidden',
                                            border: 'none'
                                        }}
                                    >
                                        <div
                                            className="flex flex-col gap-[0.5vw]"
                                            style={{
                                                backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1'),
                                                padding: isTablet ? '1vw' : '1.2vw',
                                            }}
                                        >
                                            {/* Volume / Flip Sound */}
                                            <div className="flex items-center gap-[1.2vw]">
                                                <button
                                                    className={`flex-shrink-0 transition-all duration-300 ${!flipSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                                                    onClick={handleFlipClick}
                                                    disabled={!flipSoundMasterEnabled}
                                                >
                                                    <Icon
                                                        icon="mingcute:volume-line"
                                                        className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'}`}
                                                        style={{ color: getLayoutColor('toc-text', '#000000'), opacity: 1 }}
                                                    />
                                                </button>
                                                <div className="flex-1 h-[2px] rounded-full relative" style={{ backgroundColor: getLayoutColorRgba('toc-text', '0, 0, 0', '0.1') }}>
                                                    <div
                                                        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
                                                        style={{ width: flipWidth, backgroundColor: getLayoutColor('toc-text', '#000000') }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Music / BG Sound */}
                                            <div className="flex items-center gap-[1.2vw]">
                                                <button
                                                    className={`flex-shrink-0 transition-all duration-300 ${!bgSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                                                    onClick={handleBgClick}
                                                    disabled={!bgSoundMasterEnabled}
                                                >
                                                    <svg
                                                        width="100%"
                                                        height="100%"
                                                        viewBox="0 0 21 23"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.8vw] h-[1.8vw]'}`}
                                                        style={{ color: getLayoutColor('toc-text', '#000000'), opacity: 1 }}
                                                    >
                                                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                                                    </svg>
                                                </button>
                                                <div className="flex-1 h-[2px] rounded-full relative" style={{ backgroundColor: getLayoutColorRgba('toc-text', '0, 0, 0', '0.1') }}>
                                                    <div
                                                        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
                                                        style={{ width: bgWidth, backgroundColor: getLayoutColor('toc-text', '#000000') }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Profile */}
                        <div className="relative">
                            {renderToolbarBtn(
                                <Icon icon="fluent:person-24-filled" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                                'Profile',
                                (e) => {
                                    e.stopPropagation();
                                    setShowProfileLocal(!showProfileLocal);
                                    setShowTOC(false);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowBottomNotesOptions(false);
                                    setShowBookmarkOptions(false);
                                    setShowSoundPopupMemo(false);
                                },
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showProfileLocal ? 0.7 : 1 }
                            )}

                            {/* Profile Popup */}
                            {showProfileLocal && (
                                <>
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
                                                    <path d="M0 0L5 20L10 0" fill="#FFFFFF" />
                                                    <path d="M0 0L5 20L10 0" fill={getLayoutColorRgba('toc-bg', '255, 255, 255', '1')} />
                                                    <path d="M0 0L5 20L10 0" stroke={getLayoutColorRgba('toc-bg', '87, 92, 156', '0.3')} strokeWidth="1" />
                                                </svg>
                                            </div>
                                            {/* Card */}
                                            <div
                                                className={`rounded-[1.2vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.15)] ${isTablet ? 'w-[10.5vw]' : 'w-[16vw]'} flex flex-col border relative z-20 overflow-hidden`}
                                                style={{
                                                    backgroundColor: '#FFFFFF',
                                                    borderColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.2')
                                                }}
                                            >
                                                <div
                                                    className="w-full flex flex-col p-[1.2vw] gap-[0.8vw]"
                                                    style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
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
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Share */}
                        {renderToolbarBtn(
                            <Icon icon="mage:share-fill" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Share',
                            handleShare,
                            { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                        )}
                        {/* Download */}
                        {renderToolbarBtn(
                            <Icon icon="meteor-icons:download" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Download',
                            handleDownload,
                            { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                        )}
                        {/* Fullscreen */}
                        {renderToolbarBtn(
                            <Icon icon={isFullScreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
                            'Fullscreen',
                            handleFullScreen,
                            { color: getLayoutColor('toolbar-text-main', '#FFFFFF') }
                        )}
                    </div>
                </div>

                {/* Right: Standardized Zoom Box Matched to Screenshot */}
                {settings.viewing.zoom && (
                    <div className={`rounded-full flex items-center shadow-[0_0.2vw_1vw_rgba(0,0,0,0.06)] border border-gray-100 shrink-0 ${isTablet ? 'h-[3.2vh] gap-[0.3vw] px-[0.4vw]' : 'h-[4.5vh] gap-[0.4vw] px-[0.5vw]'}`}
                        style={{
                            backgroundColor: currentPage === 0
                                ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1')
                                : getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1')
                        }}
                    >
                        {/* Zoom Out Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                            className="hover:scale-110 active:scale-95 transition-transform shrink-0"
                            title="Zoom Out"
                        >
                            <Icon
                                icon="ph:magnifying-glass-minus-bold"
                                className={`${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[1vw] h-[1vw]'}`}
                                style={{ color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#575C9C') : getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            />
                        </button>

                        <span
                            className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-semibold select-none shrink-0 min-w-[2.2vw] text-center`}
                            style={{ color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#575C9C') : getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            {Math.round((dimWidth / initialWidth) * 100)}%
                        </span>

                        {/* Zoom In Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                            className="hover:scale-110 active:scale-95 transition-transform shrink-0"
                            title="Zoom In"
                        >
                            <Icon
                                icon="ph:magnifying-glass-plus-bold"
                                className={`${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[1vw] h-[1vw]'}`}
                                style={{ color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#575C9C') : getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            />
                        </button>

                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`${isTablet ? 'text-[0.55vw] px-[0.5vw] py-[0.25vw]' : 'text-[0.8vw] px-[0.7vw] py-[0.35vw]'} font-bold rounded-[0.8vw] hover:brightness-90 transition-all shadow-sm`}
                            style={{
                                backgroundColor: currentPage === 0
                                    ? getLayoutColor('toolbar-bg', '#575C9C')
                                    : getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                color: currentPage === 0
                                    ? getLayoutColor('toolbar-text-main', '#FFFFFF')
                                    : getLayoutColor('toolbar-bg', '#575C9C')
                            }}
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>

            {/* ── THUMBNAIL BAR ── Exact Match to Screenshot */}
            {showThumbnails && (
                <>
                    {/* Main Container - Rounded Capsule */}
                    <div
                        className={`absolute z-[150] ${isTablet ? 'bottom-[6.5vh] h-[5vw]' : 'bottom-[8.5vh] h-[5.8vw]'} left-[3vw] right-[3vw] rounded-full shadow-[0_0.5vw_2vw_rgba(0,0,0,0.08)] flex items-center border overflow-hidden`}
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderColor: getLayoutColor('dropdown-text', '#575C9C')
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="w-full h-full flex items-center px-[0.5vw]"
                            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}
                        >
                            {/* Left Navigation */}
                            <button
                                className="w-[3vw] h-full flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                                style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                            >
                                <Icon icon="ph:caret-left" className="w-[1.2vw] h-[1.2vw]" />
                            </button>

                            {/* Thumbnails Container */}
                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="flex-1 flex overflow-x-hidden no-scrollbar scroll-smooth items-center h-full gap-[0.5vw] px-[0.2vw]"
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);

                                    return (
                                        <div
                                            key={idx}
                                            className="thumbnail-item relative flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300 group"
                                            style={{ width: '6.5vw' }}
                                            onClick={() => onPageClick(spread.indices[0])}
                                        >
                                            {/* Thumbnail Container with Theme-based Border */}
                                            <div
                                                className="w-full h-[4vw] bg-white border-[1.2px] transition-all rounded-[0.1vw] overflow-hidden relative"
                                                style={{
                                                    borderColor: getLayoutColor('dropdown-text', '#575C9C')
                                                }}
                                            >
                                                <div className="flex w-full h-full gap-0 bg-white justify-center relative">
                                                    {spread.pages.map((page, pIdx) => {
                                                        const pageWidth = 400;
                                                        const pageHeight = 566;
                                                        const availableWidth = 3.25 * (window.innerWidth / 100);
                                                        const availableHeight = 4 * (window.innerWidth / 100);
                                                        const thumbScale = Math.min(availableWidth / pageWidth, availableHeight / pageHeight) * 0.95;

                                                        return (
                                                            <div key={`${idx}-${pIdx}`} className="flex-1 max-w-[50%] bg-white overflow-hidden relative flex items-center justify-center">
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={spread.indices[pIdx]}
                                                                    scale={thumbScale}
                                                                />
                                                                {/* Simple Page Fold/Curl Effect for Visual Match */}
                                                                {pIdx === 1 && (
                                                                    <div className="absolute top-0 right-0 w-[0.8vw] h-[0.8vw] bg-white shadow-[-1px_1px_2px_rgba(0,0,0,0.1)] z-10"
                                                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)', transform: 'rotate(180deg)' }} />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Selected Overlay - Fixed Dark Shade with White Text */}
                                                {isSelected && (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-[0.5px]"
                                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                                                    >
                                                        <span className="text-white text-[0.65vw] font-semibold whitespace-nowrap">
                                                            Page {spread.indices[0] + 1} / {totalPages}
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
                                className="w-[3vw] h-full flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                                style={{ color: getLayoutColor('dropdown-text', '#575C9C') }}
                            >
                                <Icon icon="ph:caret-right" className="w-[1.2vw] h-[1.2vw]" />
                            </button>
                        </div>
                    </div>
                </>
            )}



        </div>
    );
};

export default Grid5Layout;
