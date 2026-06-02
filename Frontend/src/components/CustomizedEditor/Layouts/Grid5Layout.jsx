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
    offset,
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
    showTOC,
    isMobileLandscape,
    isFullscreen: isFullscreenProp
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
            const nextWidth = Math.min(prev + (initialWidth * 0.01), initialWidth * 1.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    }, [aspectRatio, initialWidth]);

    const zoomOut = React.useCallback(() => {
        setDimWidth(prev => {
            const nextWidth = Math.max(prev - (initialWidth * 0.01), initialWidth * 0.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    }, [aspectRatio, initialWidth]);

    const localOffset = React.useMemo(() => {
        if (typeof offset === 'undefined' || !offset) return 0;
        return offset * (dimWidth / initialWidth);
    }, [typeof offset !== 'undefined' ? offset : null, dimWidth, initialWidth]);

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

    const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));
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
    const isFullscreen = isFullscreenProp || false;
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showProfileLocal, setShowProfileLocal] = useState(false);
    const [showBookmarkLocal, setShowBookmarkLocal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
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
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

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
            setShowThumbnails(false);
            setShowTOCMemo?.(false);
            setShowBookmarkLocal(false);
            setShowProfileLocal(false);
            setShowSoundPopupMemo(false);
        }}>
            {/* ── TOP BAR ── White with search | title | logo */}
            <div
                className={`magazine-toolbar ${isMobileLandscape ? 'h-[14%]' : isTablet ? 'h-[5.2vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50 transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
            >

                {/* Left: Search Pill */}
                <div className="flex items-center">
                    {settings?.interaction?.search !== false && !isPdfProject && (
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
            <div ref={previewAreaRef} className={`flex-1 flex items-center justify-center ${isFullscreen ? 'p-0' : 'px-[4vw]'} magazine-canvas relative min-h-0`}
                onMouseMove={(e) => {
                    if (!isFullscreen) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const EDGE_ZONE = 72;
                    const nearEdge = x < EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE;
                    setIsCanvasHovered(!nearEdge);
                }}
                onMouseLeave={() => isFullscreen && setIsCanvasHovered(false)}
            >

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
            <div className={`magazine-toolbar ${isMobileLandscape ? 'h-[11%]' : isTablet ? 'h-[5.5vh]' : 'h-[8vh]'} flex items-center px-[1.5vw] justify-between shrink-0 w-full z-40 bg-transparent border-t border-gray-200/50 overflow-visible transition-all duration-500 ease-in-out ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}>
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
                    className={`flex-1 ${isMobileLandscape ? 'max-w-[80vw] mx-[1vw] h-[65%]' : isTablet ? (isSidebarOpen ? 'max-w-[68vw]' : 'max-w-[75vw]') + ' mx-[0.5vw] h-[4vh]' : (isSidebarOpen ? 'max-w-[68vw]' : 'max-w-[78vw]') + ' mx-[0.8vw] h-[6vh]'} rounded-full flex items-center ${isTablet ? 'px-[1vw]' : 'px-[1.5vw]'} shadow-[0_0.5vw_2.5vw_rgba(0,0,0,0.15)] border border-white/10 relative`}
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
                                setShowTOCMemo?.(false);
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
                                    setShowTOCMemo(!showTOC);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfileLocal(false);

                                    setShowSoundPopupMemo(false);
                                },
                                { color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showTOC ? 0.7 : 1 }
                            )}

                            {showTOC && (
                                <>
                                    <div
                                        className={`magazine-popup absolute ${isTablet ? 'bottom-[2.8vw] -translate-x-[20%]' : 'bottom-[3.2vw] -translate-x-[15%]'} z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200`}
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
                                                        {(() => {
                                                            const propContent = settings?.tocSettings?.content;
                                                            const propItems = settings?.tocSettings?.items;
                                                            const propToc = settings?.tocSettings?.toc;
                                                            const content = (Array.isArray(propContent) && propContent.length > 0)
                                                                ? propContent
                                                                : (Array.isArray(propItems) && propItems.length > 0)
                                                                    ? propItems
                                                                    : (Array.isArray(propToc?.items) && propToc.items.length > 0)
                                                                        ? propToc.items
                                                                        : (propContent || propItems || propToc?.items || []);

                                                            return content?.length > 0 ? (
                                                                content
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
                                                                                    onClick={() => { onPageClick(item.page - 1); setShowTOCMemo?.(false); setTocSearchQuery(''); }}
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
                                                                                        onClick={() => { onPageClick(sub.page - 1); setShowTOCMemo?.(false); setTocSearchQuery(''); }}
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
                                                            );
                                                        })()}
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
                                setShowTOCMemo?.(false);
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
                                    setShowTOCMemo?.(false);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfileLocal(false);

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
                                    setShowTOCMemo?.(false);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);

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
                            <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />,
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
