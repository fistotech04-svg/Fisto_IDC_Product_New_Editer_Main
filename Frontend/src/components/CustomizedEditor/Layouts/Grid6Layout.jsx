import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
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

const Grid6Layout = ({
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

    const getLayoutColor = (id, defaultColor) => {
        if (!layoutColors) return `var(--${id}, ${defaultColor})`;
        
        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorItem = layoutColors.find(c => c.id === id);
            return colorItem ? colorItem.hex : `var(--${id}, ${defaultColor})`;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[6] && Array.isArray(layoutColors[6])) {
            const colorItem = layoutColors[6].find(c => c.id === id);
            return colorItem ? colorItem.hex : `var(--${id}, ${defaultColor})`;
        }
        
        return `var(--${id}, ${defaultColor})`;
    };

    const getLayoutOpacity = (id, defaultOpacity) => {
        if (!layoutColors) return defaultOpacity;
        
        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorItem = layoutColors.find(c => c.id === id);
            return colorItem ? (colorItem.opacity ?? 100) / 100 : defaultOpacity;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[6] && Array.isArray(layoutColors[6])) {
            const colorItem = layoutColors[6].find(c => c.id === id);
            return colorItem ? (colorItem.opacity ?? 100) / 100 : defaultOpacity;
        }
        
        return defaultOpacity;
    };

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
        const color = getLayoutColor(id, null);
        if (color && color.startsWith('#')) return color;
        return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
    };

    const [showRadialThumbnails, setShowRadialThumbnails] = useState(false);
    const [showTOCPanel, setShowTOCPanel] = useState(false);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [radialScroll, setRadialScroll] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

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
            // Page 1 is always a single page (cover)
            result.push({
                pages: [pages[0]],
                indices: [0],
                label: "Page 1"
            });
            // Subsequent pages are spreads
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

    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));
    const [showLocalBookmarkDropdown, setShowLocalBookmarkDropdown] = useState(false);
    const [showLocalNotesDropdown, setShowLocalNotesDropdown] = useState(false);

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    const progressPercentage = (currentPage / (pagesCount - 1)) * 100;

    return (
        <div
            className="flex flex-col h-screen w-full overflow-hidden font-sans select-none"
            style={backgroundStyle || { backgroundColor: '#D7D8E8' }}
            onClick={() => {
                setRecommendations([]);
                setShowRadialThumbnails(false);
                setShowTOCPanel(false);
                setTocSearchQuery('');
                setShowLocalNotesDropdown(false);
                setShowLocalBookmarkDropdown(false);
            }}
        >
            {/* Top Header */}
            <div 
                className={`${isTablet ? 'h-[6vh]' : 'h-[7vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50`}
                style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), opacity: getLayoutOpacity('toolbar-bg', 1) }}
            >
                {/* Search Bar */}
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                        <div 
                            className={`flex items-center rounded-[0.2vw] ${isTablet ? 'px-[0.5vw] py-[0.4vw] w-[12vw]' : 'px-[0.6vw] py-[0.5vw] w-[16vw]'} shadow-inner`}
                            style={{ backgroundColor: getLayoutColor('search-bg-v2', '#DDE0F4'), opacity: getLayoutOpacity('search-bg-v2', 1) }}
                        >
                            <Icon 
                                icon="lucide:search" 
                                className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} 
                                style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
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
                                placeholder="Quick Search..."
                                className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]'} ml-[0.6vw] w-full font-medium`}
                                style={{ 
                                    color: getLayoutColor('search-text-v1', '#575C9C'),
                                }}
                            />
                        </div>

                        {/* Search Suggestions Dropdown - EXACT UI FROM SCREENSHOT */}
                        <AnimatePresence>
                            {recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`absolute ${isTablet ? 'top-[2.5vw] w-[12vw]' : 'top-[3.2vw] w-[16vw]'} left-0 bg-white rounded-b-[0.4vw] shadow-2xl z-[100] border-x border-b overflow-hidden`}
                                    style={{ borderColor: getLayoutColor('search-bg-v2', '#DDE0F4') }}
                                >
                                    <div className="px-[1vw] py-[0.8vw] border-b border-gray-50">
                                        <span className={`font-bold ${isTablet ? 'text-[0.7vw]' : 'text-[0.9vw]'}`} style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}>Suggestion</span>
                                    </div>
                                    <div className="flex flex-col py-[0.4vw]">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                className="flex items-center justify-between px-[1vw] py-[0.6vw] transition-colors group"
                                                style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setLocalSearchQuery(rec.word);
                                                    setSearchQuery(rec.word);
                                                    setRecommendations([]);
                                                }}
                                            >
                                                <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-medium opacity-80 group-hover:opacity-100`}>{rec.word}</span>
                                                <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-medium opacity-60`}>Pg {rec.pageNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Center: Book Name */}
                <div className={`absolute left-1/2 -translate-x-1/2 text-white ${isTablet ? 'text-[1.1vw]' : 'text-[1.4vw]'} font-normal tracking-wide opacity-90`}>
                    {bookName || "Name of the book"}
                </div>

                {/* Right: Logo */}
                <div className="flex items-center">
                    {logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Logo"
                            className={`${isTablet ? 'h-[2vw]' : 'h-[2.5vw]'} w-auto brightness-110`}
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 relative min-h-0">
                <style>
                    {`
                        .thumbnail-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .thumbnail-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .thumbnail-scrollbar::-webkit-scrollbar-thumb {
                            background: #BABEE4;
                            border-radius: 10px;
                        }
                        .thumbnail-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #575C9C;
                        }
                    `}
                </style>

                {/* Thumbnail Bar Panel - EXACT UI FROM SCREENSHOT */}
                <AnimatePresence>
                    {showRadialThumbnails && (
                        <div
                            className={`absolute ${isTablet ? 'right-[3vw] w-[11vw]' : 'right-[3.5vw] w-[18vw]'} top-0 bottom-0 z-[60] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)]`}
                            style={{ 
                                backgroundColor: getLayoutColor('thumbnail-outer-v2', '#FFFFFF'),
                                opacity: getLayoutOpacity('thumbnail-outer-v2', 1)
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div 
                                className={`${isTablet ? 'h-[6vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b`}
                                style={{ borderColor: 'rgba(0,0,0,0.05)' }}
                            >
                                <span className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.25vw]'} font-medium font-sans`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Thumbnail</span>
                                <button
                                    onClick={() => setShowRadialThumbnails(false)}
                                    className="transition-colors"
                                    style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.6 }}
                                >
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                                </button>
                            </div>

                            {/* Content - Scrollable list of thumbnails */}
                            <div className="flex-1 overflow-y-auto thumbnail-scrollbar py-[2vh] px-[1vw] flex flex-col gap-[3vh]">
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    return (
                                        <div
                                            key={idx}
                                            className="flex flex-col items-center cursor-pointer group"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPageClick(spread.indices[0]);
                                                setShowRadialThumbnails(false);
                                            }}
                                        >
                                            <div 
                                                className={`
                                                    relative flex p-[0.25vw] rounded-[0.2vw] shadow-[0_4px_12px_rgba(0,0,0,0.08)] 
                                                    border group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300
                                                    ${isSelected ? 'ring-2 ring-offset-2' : ''}
                                                `}
                                                style={{ 
                                                    backgroundColor: getLayoutColor('thumbnail-inner-v2', '#FFFFFF'),
                                                    borderColor: isSelected ? getLayoutColor('toolbar-bg', '#575C9C') : 'rgba(0,0,0,0.1)',
                                                    '--tw-ring-color': getLayoutColor('toolbar-bg', '#575C9C')
                                                }}
                                            >
                                                <div className={`flex bg-gray-50/30 ${isTablet ? 'w-[7vw]' : 'w-[9vw]'} justify-center`}>
                                                    {spread.pages.map((page, pIdx) => (
                                                        <div
                                                            key={pIdx}
                                                            className={`
                                                                ${isTablet ? 'w-[3.5vw] h-[5vw]' : 'w-[4.5vw] h-[6.3vw]'} bg-white overflow-hidden relative
                                                                ${pIdx === 0 && spread.pages.length > 1 ? 'border-r border-gray-100' : ''}
                                                            `}
                                                        >
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={spread.indices[pIdx]}
                                                                scale={isTablet ? 0.08 : 0.12}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <span 
                                                className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} mt-[1.2vh] font-normal tracking-wide opacity-80 group-hover:opacity-100 transition-opacity`}
                                                style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                            >
                                                {spread.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Table of Contents Panel - DYNAMIC CONTENT */}
                <AnimatePresence>
                    {showTOCPanel && (
                        <div
                                                            className={`absolute ${isTablet ? 'right-[3vw] w-[11vw]' : 'right-[3.5vw] w-[18vw]'} top-0 bottom-0 z-[60] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)]`}
                                                            style={{ 
                                                                backgroundColor: getLayoutColor('toc-bg', '#FFFFFF'),
                                                                opacity: getLayoutOpacity('toc-bg', 1)
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {/* Header */}
                                                            <div 
                                                                className={`${isTablet ? 'h-[6vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b shrink-0`}
                                                                style={{ borderColor: 'rgba(0,0,0,0.05)' }}
                                                            >
                                                                <span className={`${isTablet ? 'text-[0.85vw]' : 'text-[1.1vw]'} font-medium font-sans`} style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</span>
                                                                <button
                                                                    onClick={() => setShowTOCPanel(false)}
                                                                    className="transition-colors"
                                                                    style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.6 }}
                                                                >
                                                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                                                </button>
                                                            </div>

                            {/* Search Area */}
                            {settings.tocSettings?.addSearch !== false && (
                                <div className="px-[1vw] py-[1.5vh] border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                    <div 
                                        className="flex items-center rounded-[0.4vw] px-[0.6vw] py-[0.4vw] border group transition-all"
                                        style={{ 
                                            backgroundColor: 'rgba(0,0,0,0.02)', 
                                            borderColor: 'rgba(0,0,0,0.05)' 
                                        }}
                                    >
                                        <Icon icon="lucide:search" className="w-[0.9vw] h-[0.9vw]" style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.5 }} />
                                        <input
                                            type="text"
                                            value={tocSearchQuery}
                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                            placeholder="Search in TOC..."
                                            className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} ml-[0.4vw] w-full font-sans`}
                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        {tocSearchQuery && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setTocSearchQuery(''); }}
                                                className="transition-colors"
                                                style={{ color: getLayoutColor('toc-icon', '#575C9C'), opacity: 0.4 }}
                                            >
                                                <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Content - Dynamic TOC items from settings */}
                            <div className="flex-1 overflow-y-auto thumbnail-scrollbar py-[1.5vh] px-[1vw]">
                                <div className="flex flex-col">
                                    {settings.tocSettings?.content && settings.tocSettings.content.length > 0 ? (
                                        settings.tocSettings.content
                                            .filter(heading => {
                                                if (!tocSearchQuery) return true;
                                                const matchesHeading = heading.title.toLowerCase().includes(tocSearchQuery.toLowerCase());
                                                const matchesSubheading = heading.subheadings?.some(sub =>
                                                    sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                                );
                                                return matchesHeading || matchesSubheading;
                                            })
                                            .map((heading, hIdx) => {
                                                const filteredSubheadings = heading.subheadings?.filter(sub =>
                                                    !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                                ) || [];

                                                return (
                                                    <div key={heading.id || hIdx} className={`${hIdx > 0 ? 'mt-[1.2vh]' : ''}`}>
                                                        <div
                                                            className="flex items-center justify-between py-[0.6vh] rounded-[0.3vw] cursor-pointer transition-colors px-[0.5vw] group"
                                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                            onClick={() => {
                                                                onPageClick && onPageClick(heading.page - 1);
                                                                setShowTOCPanel(false);
                                                                setTocSearchQuery('');
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw]">
                                                                {settings.tocSettings?.addSerialNumberToHeading !== false && (
                                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold opacity-40 tabular-nums shrink-0`}>{hIdx + 1}.</span>
                                                                )}
                                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-semibold opacity-90 truncate`}>{heading.title}</span>
                                                            </div>
                                                            {settings.tocSettings?.addPageNumber !== false && heading.page && (
                                                                <span className="text-[0.8vw] font-medium opacity-50 tabular-nums ml-[0.3vw]">
                                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col ml-[0.5vw]">
                                                            {filteredSubheadings.map((sub, sIdx) => (
                                                                <div
                                                                    key={sub.id || sIdx}
                                                                    className="flex items-center justify-between py-[0.5vh] rounded-[0.3vw] cursor-pointer transition-colors px-[0.5vw] group"
                                                                    style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                                    onClick={() => {
                                                                        onPageClick && onPageClick(sub.page - 1);
                                                                        setShowTOCPanel(false);
                                                                        setTocSearchQuery('');
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw] pl-[0.5vw]">
                                                                        {settings.tocSettings?.addSerialNumberToSubheading !== false && (
                                                                            <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-medium opacity-40 tabular-nums shrink-0`}>{hIdx + 1}.{sIdx + 1}</span>
                                                                        )}
                                                                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-normal opacity-70 group-hover:opacity-100 truncate`}>{sub.title}</span>
                                                                    </div>
                                                                    {settings.tocSettings?.addPageNumber !== false && sub.page && (
                                                                        <span className="text-[0.75vw] font-normal opacity-40 tabular-nums ml-[0.2vw]">
                                                                            {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div 
                                            className="text-[0.85vw] text-center pt-[10vw] opacity-60 font-medium"
                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                        >
                                            No Table Of Content Found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Right Sidebar Icons */}
                <div 
                    className={`absolute right-0 top-0 bottom-0 ${isTablet ? 'w-[3vw]' : 'w-[3.5vw]'} flex flex-col items-center py-[2vh] justify-start gap-[3vh] z-40`}
                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), opacity: getLayoutOpacity('toolbar-bg', 1) }}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTOCPanel(!showTOCPanel);
                            setShowRadialThumbnails(false);
                            setShowLocalNotesDropdown(false);
                            setShowLocalBookmarkDropdown(false);
                        }}
                        className={`transition-all transform hover:scale-110 p-[0.4vw] rounded-[0.5vw] shadow-inner`}
                        style={{ 
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            backgroundColor: showTOCPanel ? 'rgba(255,255,255,0.2)' : 'transparent',
                            opacity: showTOCPanel ? 1 : getLayoutOpacity('toolbar-text-main', 0.9)
                        }}
                    >
                        <Icon icon="fluent:text-bullet-list-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowRadialThumbnails(!showRadialThumbnails);
                            setShowTOCPanel(false);
                            setShowLocalNotesDropdown(false);
                            setShowLocalBookmarkDropdown(false);
                        }}
                        className={`transition-all transform hover:scale-110 p-[0.4vw] rounded-[0.5vw] shadow-inner`}
                        style={{ 
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            backgroundColor: showRadialThumbnails ? 'rgba(255,255,255,0.2)' : 'transparent',
                            opacity: showRadialThumbnails ? 1 : getLayoutOpacity('toolbar-text-main', 0.7)
                        }}
                    >
                        <Icon icon="ph:squares-four-fill" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                    <div className="relative w-full flex justify-center">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowLocalNotesDropdown(prev => !prev);
                                setShowLocalBookmarkDropdown(false);
                                setShowTOCPanel(false);
                                setShowRadialThumbnails(false);
                            }} 
                            className="transition-all transform hover:scale-110 p-[0.4vw] rounded-[0.5vw] shadow-inner"
                            style={{ 
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'), 
                                backgroundColor: showLocalNotesDropdown ? 'rgba(255,255,255,0.2)' : 'transparent',
                                opacity: showLocalNotesDropdown ? 1 : getLayoutOpacity('toolbar-text-main', 0.7) 
                            }}
                        >
                            <Icon icon="material-symbols-light:add-notes" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
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
                                setShowLocalBookmarkDropdown(prev => !prev);
                                setShowLocalNotesDropdown(false);
                                setShowTOCPanel(false);
                                setShowRadialThumbnails(false);
                            }} 
                            className="transition-all transform hover:scale-110 p-[0.4vw] rounded-[0.5vw] shadow-inner"
                            style={{ 
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'), 
                                backgroundColor: showLocalBookmarkDropdown ? 'rgba(255,255,255,0.2)' : 'transparent',
                                opacity: showLocalBookmarkDropdown ? 1 : getLayoutOpacity('toolbar-text-main', 0.7) 
                            }}
                        >
                            <Icon icon="fluent:bookmark-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
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
                        onClick={() => setShowGalleryPopupMemo(true)}
                        className="transition-all transform hover:scale-110"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                    >
                        <Icon icon="clarity:image-gallery-solid" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo(!showSoundPopup); }}
                        className={`transition-all transform hover:scale-110`}
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: showSoundPopup ? 0.3 : getLayoutOpacity('toolbar-text-main', 0.7) }}
                    >
                        <Icon icon={isMuted ? "solar:music-notes-bold" : "solar:music-notes-bold"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                    <button 
                        onClick={() => setShowProfilePopup(true)} 
                        className="transition-all transform hover:scale-110"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                    >
                        <Icon icon="fluent:person-24-filled" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                    <button 
                        onClick={handleShare} 
                        className="transition-all transform hover:scale-110"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                    >
                        <Icon icon="mage:share-fill" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                    <button 
                        onClick={handleDownload} 
                        className="transition-all transform hover:scale-110"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                    >
                        <Icon icon="meteor-icons:download" className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                    <button 
                        onClick={handleFullScreen} 
                        className="transition-all transform hover:scale-110"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: getLayoutOpacity('toolbar-text-main', 0.7) }}
                    >
                        <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                    </button>
                </div>

                {/* Left Navigation Arrows */}
                <div className="absolute left-[1.5vw] top-1/2 -translate-y-1/2 flex items-center gap-[0.5vw] z-30">
                    <button
                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                        onClick={() => onPageClick(0)}
                        title="First Page"
                    >
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                    <button
                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        title="Previous Page"
                    >
                        <Icon icon="ph:caret-left" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                </div>

                {/* Right Navigation Arrows */}
                <div className="absolute right-[5vw] top-1/2 -translate-y-1/2 flex items-center gap-[0.5vw] z-30">
                    <button
                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        title="Next Page"
                    >
                        <Icon icon="ph:caret-right" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                    <button
                        className="opacity-60 hover:opacity-100 transition-all hover:scale-110 p-[0.4vw]"
                        style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}
                        onClick={() => onPageClick(pagesCount - 1)}
                        title="Last Page"
                    >
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.8vw] h-[1.8vw]'}`} />
                    </button>
                </div>



                {/* Page Counter Badge */}
                <div 
                    className={`absolute right-[4.5vw] ${isTablet ? 'bottom-[6vh] rounded-[0.4vw]' : 'bottom-[10vh] rounded-[0.6vw]'} px-[1.2vw] py-[0.6vw] shadow-[0_0.4vw_1.5vw_rgba(0,0,0,0.1)] z-30 border`}
                    style={{ 
                        backgroundColor: getLayoutColor('toolbar-bg', '#FFFFFF'), 
                        borderColor: getLayoutColor('toolbar-text-main', 'rgba(0,0,0,0.1)') 
                    }}
                >
                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold`} style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}>Page </span>
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
                        className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold bg-transparent border-none outline-none text-center`}
                        style={{ 
                            width: `${String(pages.length).length + 1}ch`,
                            color: getLayoutColor('toolbar-text-main', '#575C9C')
                        }}
                    />
                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold`} style={{ color: getLayoutColor('toolbar-text-main', '#575C9C') }}> / {pagesCount}</span>
                </div>

                {/* Book Viewer Container */}
                <div className={`flex-1 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-[4vw] pr-[7.5vw]'} magazine-canvas`}>
                    <div
                        className="relative transition-all duration-600 ease-in-out"
                        style={{
                            transform: `translateX(${localOffset}px) scale(1)`,
                            transformOrigin: 'center center',
                            filter: 'drop-shadow(0 2vw 5vw rgba(0,0,0,0.15))'
                        }}
                    >
                        {modifiedChildren}
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div 
                className={`${isTablet ? 'h-[5vh]' : 'h-[6vh]'} flex items-center px-[2vw] shrink-0 w-full relative z-40 border-t`}
                style={{ 
                    backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C'), 
                    opacity: getLayoutOpacity('bottom-toolbar-bg', 1),
                    borderColor: 'rgba(255,255,255,0.05)'
                }}
            >
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.5vw] mr-[2.5vw]">
                    <button 
                        onClick={() => onPageClick && onPageClick(0)} 
                        className="transition-all transform active:scale-90"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.8 }}
                    >
                        <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                    <button 
                        onClick={() => setIsPlaying(!isAutoFlipping)} 
                        className="transition-all transform active:scale-95"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                    >
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                    </button>
                    <button 
                        onClick={() => onPageClick && onPageClick(pagesCount - 1)} 
                        className="transition-all transform active:scale-90"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.8 }}
                    >
                        <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>
                </div>

                {/* Progress Bar Container */}
                <div className="flex-1 flex items-center relative h-[2vw]">
                    {/* Continuous Progress Track */}
                    <div className="w-full h-[0.25vw] bg-white/10 rounded-full relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-white shadow-[0_0_1vw_rgba(255,255,255,0.5)]"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    {/* Circle Indicator on Track */}
                    <div
                        className="absolute h-[1vw] w-[1vw] bg-white rounded-full shadow-lg border border-gray-300 z-10 transition-all duration-300"
                        style={{ left: `calc(${progressPercentage}% - 0.5vw)` }}
                    />
                </div>

                {/* Zoom Cluster - Screenshot Style */}
                <div className="flex items-center ml-[2.5vw] gap-[0.8vw]">
                    <button
                        onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                        className="transition-all transform active:scale-90"
                        title="Zoom Out"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.7 }}
                    >
                        <Icon icon="fad:zoomout" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>

                    <div 
                        className="flex items-center backdrop-blur-sm rounded-[0.4vw] px-[0.8vw] py-[0.35vw] border hover:bg-white/20 transition-all cursor-pointer"
                        style={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            borderColor: 'rgba(255,255,255,0.1)' 
                        }}
                    >
                        <span className={`font-bold ${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} min-w-[2.5vw] text-center`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                            {Math.round((dimWidth / initialWidth) * 100)}%
                        </span>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                        className="transition-all transform active:scale-90"
                        title="Zoom In"
                        style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.7 }}
                    >
                        <Icon icon="fad:zoomin" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                    </button>

                    <button
                        onClick={() => {
                            setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                            setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                        }}
                        className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-bold px-[0.8vw] py-[0.35vw] rounded-full hover:bg-white/20 transition-all ml-[0.2vw] border`}
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: 'rgba(255,255,255,0.1)',
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF')
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>



            {/* Popups handled by PreviewArea */}
        </div>
    );
};

export default Grid6Layout;
