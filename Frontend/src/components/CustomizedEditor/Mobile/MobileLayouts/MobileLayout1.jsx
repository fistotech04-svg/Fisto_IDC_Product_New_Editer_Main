import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';



import ProfilePopup from '../../popups/ProfilePopup';
import Sound from '../../popups/Sound';
import Export from '../../popups/Export';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';
import AddNotesPopup from '../../popups/AddNotesPopup';
import AddBookmarkPopup from '../../popups/AddBookmarkPopup';
import ViewBookmarkPopup from '../../popups/ViewBookmarkPopup';
import NotesViewerPopup from '../../popups/NotesViewerPopup';


const getLayoutColor = (id, defaultColor) => {
    return `var(--${id}, ${defaultColor})`;
};

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
};

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
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
    return luminance > 0.6;
};

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

const MenuBtn = ({ icon, label, onClick }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(e); }}
        className="flex items-center gap-2 px-2.5 py-1 hover:bg-white/10 active:bg-white/20 transition-colors text-left"
    >
        <Icon icon={icon} className="w-[14px] h-[14px]" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.9 }} />
        <span className="text-[11px] font-medium" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{label}</span>
    </button>
);

const MobileLayout1 = (props) => {
    const {
        children,
        settings,
        bookName,
        activeLayout,
        currentZoom,
        setCurrentZoom,
        handleZoomIn,
        handleZoomOut,
        searchQuery,
        setSearchQuery,
        handleQuickSearch,
        logoSettings,
        onPageClick,
        currentPage,
        pages = [],
        bookRef,
        showBookmarkMenu,
        setShowBookmarkMenu,
        showMoreMenu,
        setShowMoreMenu,
        showThumbnailBar,
        setShowThumbnailBar,
        showTOC,
        setShowTOC,
        setShowAddNotesPopup,
        showAddNotesPopup,
        onAddNote,
        setShowAddBookmarkPopup,
        showAddBookmarkPopup,
        onAddBookmark,
        bookmarkSettings,
        setShowNotesViewer,
        showNotesViewer,
        notes,
        setShowViewBookmarkPopup,
        showViewBookmarkPopup,
        bookmarks,
        onDeleteBookmark,
        onUpdateBookmark,
        setShowProfilePopup,
        showProfilePopup,
        profileSettings,
        isAutoFlipping,
        setIsPlaying,
        handleFullScreen,
        handleShare,
        handleDownload,
        showSoundPopup,
        setShowSoundPopup,
        otherSetupSettings,
        onUpdateOtherSetup,
        isMuted,
        setIsMuted,
        isFlipMuted,
        setIsFlipMuted,
        flipTrigger,
        showExportPopup,
        setShowExportPopup,
        showSharePopup,
        setShowSharePopup,
        isLandscape,
        showNotesMenu,
        setShowNotesMenu,
        tocSettings,
        layoutColors
    } = props;
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const scrollRef = useRef(null);
    const progressRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState([]);
    const [showLocalNotesMenu, setShowLocalNotesMenu] = useState(false);
    const [showLocalBookmarkMenu, setShowLocalBookmarkMenu] = useState(false);
    const [showDotMenu, setShowDotMenu] = useState(false);
    const dotBtnRef = useRef(null);
    const [hoveredIdx, setHoveredIdx] = useState(null);

    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            result.push({ pages: [pages[0]], indices: [0], label: "Page 1" });
            let spreadNum = 2;
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
                    label: `Page ${spreadNum++}`
                });
            }
        }
        return result;
    }, [pages]);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
            setIsOverflowing(scrollWidth > clientWidth);

            const containerRect = scrollRef.current.getBoundingClientRect();
            const items = scrollRef.current.querySelectorAll('.thumbnail-item');
            const visible = [];
            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const index = parseInt(item.getAttribute('data-index'));
                if (rect.right > containerRect.left + 1 && rect.left < containerRect.right - 1) {
                    visible.push(index);
                }
            });
            setVisibleIndices(visible.sort((a, b) => a - b));
        }
    };

    useEffect(() => {
        if (showThumbnailBar) {
            const timer = setTimeout(checkScroll, 100);
            return () => clearTimeout(timer);
        }
    }, [showThumbnailBar, spreads]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const amount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth'
            });
        }
    };

    const progressPercentage = pages.length > 1 ? (currentPage / (pages.length - 1)) * 100 : 0;

    const togglePopup = (type) => {
        if (type === 'notes') {
            setShowLocalNotesMenu(prev => !prev);
            setShowLocalBookmarkMenu(false);
            setShowDotMenu(false);
        } else if (type === 'bookmarks') {
            setShowLocalBookmarkMenu(prev => !prev);
            setShowLocalNotesMenu(false);
            setShowDotMenu(false);
        } else if (type === 'dots') {
            setShowDotMenu(prev => !prev);
            setShowLocalNotesMenu(false);
            setShowLocalBookmarkMenu(false);
        } else {
            setShowLocalNotesMenu(false);
            setShowLocalBookmarkMenu(false);
            setShowDotMenu(false);
        }
    };

    const closeAllPopups = () => {
        setShowTOC(false);
        setShowThumbnailBar(false);
        setShowMoreMenu(false);
        setShowProfilePopup(false);
        setShowSoundPopup(false);
        setShowAddNotesPopup(false);
        setShowNotesViewer(false);
        setShowAddBookmarkPopup(false);
        setShowViewBookmarkPopup(false);
        setShowLocalNotesMenu(false);
        setShowLocalBookmarkMenu(false);
        setShowDotMenu(false);
    };

    const handleProgressClick = (e) => {
        if (!progressRef.current || pages.length <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pages.length - 1));
        closeAllPopups();
        onPageClick(targetIdx);
    };

    const layoutVariables = useMemo(() => {
        return {
            '--toolbar-bg-rgb': activeLayout?.toolbarBgRgb || '87, 92, 156',
            '--toolbar-bg-opacity': activeLayout?.toolbarBgOpacity || '1',
            '--toolbar-text': activeLayout?.toolbarText || '#FFFFFF',
            '--toolbar-icon': activeLayout?.toolbarIcon || '#FFFFFF',
            '--toolbar-icon-hover': activeLayout?.toolbarIconHover || '#E0E0E0',
            '--toolbar-search-bg': activeLayout?.toolbarSearchBg || '#D7D8E8',
            '--toolbar-search-text': activeLayout?.toolbarSearchText || '#575C9C',
            '--toolbar-search-placeholder': activeLayout?.toolbarSearchPlaceholder || '#575C9C',
            '--toolbar-search-icon': activeLayout?.toolbarSearchIcon || '#575C9C',
            '--page-bg': activeLayout?.pageBg || '#DADBE8', // Matches screenshot
            '--progress-bar-bg': activeLayout?.progressBarBg || 'rgba(255,255,255,0.2)',
            '--progress-bar-fill': activeLayout?.progressBarFill || '#FFFFFF',
            '--play-button-bg': activeLayout?.playButtonBg || '#FFFFFF',
            '--play-button-icon': activeLayout?.playButtonIcon || '#575C9C',
            '--play-button-border': activeLayout?.playButtonBorder || '#FFFFFF',
        };
    }, [activeLayout]);

    // Use tocContent from props or settings
    const tocContent = tocSettings?.content || settings?.toc?.content || [
        { id: 'h1', title: 'Chapter 1', page: 1 },
        { id: 'h2', title: 'Chapter 2', page: 5 }
    ];

    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {showThumbnailBar && !isLandscape && (
                    <div className="absolute inset-0 z-[150] pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] bg-transparent pointer-events-auto"
                            onClick={() => setShowThumbnailBar(false)}
                        />
                        <div
                            className="absolute flex items-center group/bar fisto-menu-content thumbnail-bar pointer-events-auto transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md"
                            style={{
                                width: 'fit-content',
                                minWidth: '280px',
                                maxWidth: '96%',
                                height: '110px',
                                bottom: '100px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.8),
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                zIndex: 150,
                                display: 'flex',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                                overflow: 'hidden'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute left-[8px] inset-y-0 flex items-center z-50">
                                <button
                                    className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all shadow-xl active:scale-95 opacity-100 transition-colors border border-white/20"
                                    style={{
                                        backgroundColor: getLayoutColorAlpha('thumbnail-inner-v2', '255, 255, 255', 0.2),
                                        color: '#FFFFFF'
                                    }}
                                    onClick={(e) => { e.stopPropagation(); if (canScrollLeft) scroll('left'); }}
                                >
                                    <Icon icon="lucide:chevron-left" className="w-[18px] h-[18px]" />
                                </button>
                            </div>

                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className={`flex overflow-x-hidden no-scrollbar scroll-smooth items-center h-full gap-[10px] mx-[50px] ${isOverflowing ? 'justify-start' : 'justify-center'} rounded-[12px]`}
                            >
                                {spreads.map((spread, idx) => {
                                    const isHovered = idx === hoveredIdx;
                                    const isSelected = spread.indices.includes(currentPage);
                                    const dynamicScale = isHovered ? 1.05 : 1.0;

                                    let boxWidth = 72;
                                    let boxHeight = 54;
                                    let itemOpacity = 1;
                                    let isEdge = false;

                                    if (isOverflowing && visibleIndices.length > 0) {
                                        const firstVisible = visibleIndices[0];
                                        const lastVisible = visibleIndices[visibleIndices.length - 1];
                                        if (idx === firstVisible || idx === lastVisible) {
                                            isEdge = true;
                                            boxWidth = 44;
                                            boxHeight = 33;
                                            itemOpacity = isHovered ? 1 : 0.6;
                                        }
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            data-index={idx}
                                            className={`thumbnail-item flex flex-col items-center shrink-0 cursor-pointer group rounded-[12px] ${isSelected ? 'active-thumbnail' : ''}`}
                                            style={{
                                                transform: `scale(${dynamicScale}) translateY(${isHovered ? '-2px' : '0'})`,
                                                transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                                                boxShadow: isHovered ? '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none',
                                                zIndex: isHovered ? 60 : 30,
                                                position: 'relative',
                                                padding: '6px 10px',
                                                gap: '4px',
                                                backgroundColor: isSelected
                                                    ? 'rgba(87, 92, 156, 0.6)'
                                                    : 'rgba(87, 92, 156, 0.2)',
                                                border: 'none',
                                                opacity: itemOpacity,
                                            }}
                                            onClick={() => {
                                                onPageClick(spread.indices[0]);
                                                setHoveredIdx(null);
                                            }}
                                            onMouseEnter={() => setHoveredIdx(idx)}
                                            onMouseLeave={() => setHoveredIdx(null)}
                                        >
                                            <div
                                                className={`overflow-hidden border transition-all bg-white relative shadow-xl ${isHovered ? 'border-white ring-4 ring-white/30' : isSelected ? 'border-white' : 'border-transparent group-hover:border-white/20'} rounded-none border-[2px]`}
                                                style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                                            >
                                                <div className="flex w-full h-full gap-[1px] bg-gray-200 justify-center">
                                                    {spread.pages.map((page, pIdx) => {
                                                        const pageWidth = 400;
                                                        const pageHeight = 566;
                                                        const availableWidth = boxWidth / (spread.pages.length === 1 ? 1 : 2);
                                                        const availableHeight = boxHeight;
                                                        const scaleX = (availableWidth - 2) / pageWidth;
                                                        const scaleY = (availableHeight - 2) / pageHeight;
                                                        const thumbScale = Math.min(scaleX, scaleY);

                                                        return (
                                                            <div key={`${idx}-${pIdx}`} className="flex-1 bg-white overflow-hidden relative flex items-center justify-center">
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
                                            {!isEdge && (
                                                <span className="font-bold tracking-tight transition-all duration-300"
                                                    style={{
                                                        fontSize: '9px',
                                                        color: '#FFFFFF',
                                                        opacity: isSelected ? 1 : (isHovered ? 1 : 0.7)
                                                    }}>
                                                    {spread.label}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="absolute right-[8px] inset-y-0 flex items-center z-50">
                                <button
                                    className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all shadow-xl active:scale-95 opacity-100 transition-colors border border-white/20"
                                    style={{
                                        backgroundColor: getLayoutColorAlpha('thumbnail-inner-v2', '255, 255, 255', 0.2),
                                        color: '#FFFFFF'
                                    }}
                                    onClick={(e) => { e.stopPropagation(); if (canScrollRight) scroll('right'); }}
                                >
                                    <Icon icon="lucide:chevron-right" className="w-[18px] h-[18px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showMoreMenu && !isLandscape && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150] bg-transparent pointer-events-auto" onClick={() => { setShowMoreMenu(false); setShowLocalNotesMenu(false); setShowLocalBookmarkMenu(false); }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="absolute top-[10.8rem] right-3 w-[190px] rounded-xl shadow-2xl z-[160] overflow-hidden border border-white/10 backdrop-blur-md pointer-events-auto" style={{ backgroundColor: getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.95) }}>
                            <div className="flex flex-col p-1.5 gap-1">
                                <MenuBtn icon="mdi:table-of-contents" label="Table of Contents" onClick={() => { closeAllPopups(); setShowTOC(true); }} />
                                <MenuBtn icon="ep:menu" label="Thumbnails" onClick={() => { const wasOpen = showThumbnailBar; closeAllPopups(); if (!wasOpen) setShowThumbnailBar(true); }} />
                                <MenuBtn icon="material-symbols-light:add-notes" label="Add Notes" onClick={() => { setShowLocalNotesMenu(prev => !prev); setShowLocalBookmarkMenu(false); }} />
                                <MenuBtn icon="mingcute:bookmark-fill" label="Bookmarks" onClick={() => { setShowLocalBookmarkMenu(prev => !prev); setShowLocalNotesMenu(false); }} />
                                <MenuBtn icon="solar:user-bold" label="Profile" onClick={() => { closeAllPopups(); setShowProfilePopup(true); }} />
                                <MenuBtn icon="solar:music-notes-bold" label="BG Music" onClick={() => { closeAllPopups(); setShowSoundPopup(true); }} />
                                <MenuBtn icon="mage:share-fill" label="Share" onClick={() => { closeAllPopups(); handleShare(); }} />
                                <MenuBtn icon="meteor-icons:download" label="Download" onClick={() => { closeAllPopups(); handleDownload(); }} />
                                <MenuBtn icon="lucide:fullscreen" label="Fullscreen View" onClick={() => { closeAllPopups(); handleFullScreen(); }} />
                            </div>
                        </motion.div>
                    </>
                )}

                {showLocalNotesMenu && !isLandscape && (
                    <>
                        <div className="absolute inset-0 z-[165] bg-transparent pointer-events-auto" onClick={() => setShowLocalNotesMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute z-[170] flex flex-col overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-md pointer-events-auto"
                            style={{ top: '13.8rem', right: '120px', width: '140px', backgroundColor: getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.95) }}
                        >
                            <div className="flex flex-col p-1.5 gap-1">
                                <MenuBtn icon="material-symbols-light:add-notes" label="Add Notes" onClick={() => { closeAllPopups(); setShowAddNotesPopup(true); }} />
                                <MenuBtn icon="lucide:eye" label="View Notes" onClick={() => { closeAllPopups(); setShowNotesViewer(true); }} />
                            </div>
                        </motion.div>
                    </>
                )}
                {showLocalBookmarkMenu && !isLandscape && (
                    <>
                        <div className="absolute inset-0 z-[165] bg-transparent pointer-events-auto" onClick={() => setShowLocalBookmarkMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute z-[170] flex flex-col overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-md pointer-events-auto"
                            style={{ top: '16.8rem', right: '120px', width: '140px', backgroundColor: getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.95) }}
                        >
                            <div className="flex flex-col p-1.5 gap-1">
                                <MenuBtn icon="mingcute:bookmark-fill" label="Add Bookmark" onClick={() => { closeAllPopups(); setShowAddBookmarkPopup(true); }} />
                                <MenuBtn icon="mdi:eye-outline" label="View Bookmark" onClick={() => { closeAllPopups(); setShowViewBookmarkPopup(true); }} />
                            </div>
                        </motion.div>
                    </>
                )}
                {showTOC && !isLandscape && (
                    <TableOfContentsPopup
                        onClose={() => setShowTOC(false)}
                        onNavigate={(pageIdx) => {
                            onPageClick(pageIdx);
                            setShowTOC(false);
                        }}
                        contents={tocSettings?.content || settings?.tocSettings?.content || settings?.toc?.content || []}
                        settings={tocSettings || props.tocSettings || settings?.tocSettings || settings?.toc || props.settings?.toc}
                        isMobile={true}
                        isLandscape={false}
                        activeLayout={1}
                        layoutColors={layoutColors || props.layoutColors}
                    />
                )}

                {showAddNotesPopup && !isLandscape && (
                    <AddNotesPopup
                        onClose={() => setShowAddNotesPopup(false)}
                        onAddNote={onAddNote}
                        currentPageIndex={currentPage}
                        totalPages={pages.length}
                        isMobile={true}
                        isLandscape={false}
                        activeLayout={activeLayout}
                        layoutColors={layoutColors || props.layoutColors}
                    />
                )}

                {showNotesViewer && !isLandscape && (
                    <NotesViewerPopup
                        onClose={() => setShowNotesViewer(false)}
                        notes={notes}
                        onPageClick={onPageClick}
                        isMobile={true}
                    />
                )}

                {showAddBookmarkPopup && !isLandscape && (
                    <AddBookmarkPopup
                        onClose={() => setShowAddBookmarkPopup(false)}
                        onAddBookmark={onAddBookmark}
                        currentPageIndex={currentPage}
                        totalPages={pages.length}
                        bookmarkSettings={bookmarkSettings}
                        activeLayout={activeLayout}
                        isMobile={true}
                    />
                )}

                {showViewBookmarkPopup && !isLandscape && (
                    <ViewBookmarkPopup
                        onClose={() => setShowViewBookmarkPopup(false)}
                        bookmarks={bookmarks}
                        onDelete={onDeleteBookmark}
                        onUpdate={onUpdateBookmark}
                        onNavigate={onPageClick}
                        isMobile={true}
                        activeLayout={activeLayout}
                        layoutColors={layoutColors || props.layoutColors}
                    />
                )}

                {showProfilePopup && !isLandscape && (
                    <ProfilePopup
                        onClose={() => setShowProfilePopup(false)}
                        profileSettings={profileSettings}
                        activeLayout={1}
                        isMobile={true}
                        isLandscape={false}
                        layoutColors={layoutColors || props.layoutColors}
                    />
                )}

                {showSoundPopup && !isLandscape && (
                    <Sound
                        isOpen={showSoundPopup}
                        onClose={() => setShowSoundPopup(false)}
                        activeLayout={1}
                        isMobile={true}
                        isLandscape={false}
                        isMuted={isMuted}
                        setIsMuted={setIsMuted}
                        isFlipMuted={isFlipMuted}
                        setIsFlipMuted={setIsFlipMuted}
                        otherSetupSettings={otherSetupSettings}
                        onUpdateOtherSetup={onUpdateOtherSetup}
                        settings={settings}
                        flipTrigger={flipTrigger}
                    />
                )}

                {showExportPopup && !isLandscape && (
                    <Export
                        isOpen={showExportPopup}
                        onClose={() => setShowExportPopup(false)}
                        isMobile={true}
                        hideButton={true}
                        pages={pages}
                        bookName={bookName}
                        currentPage={currentPage}
                    />
                )}

                {showSharePopup && !isLandscape && (
                    <FlipbookSharePopup
                        onClose={() => setShowSharePopup(false)}
                        isMobile={true}
                    />
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="flex flex-col h-[812px] w-[375px] overflow-hidden select-none relative" style={{ ...layoutVariables, backgroundColor: getLayoutColor('page-bg', '#DADBE8') }}>
            {/* Notch Spacer - fills the area near the hardware notch with a status bar color */}
            <div className="h-10 w-full shrink-0 z-50 bg-[#0B0F4E]" />
            {/* Search Area */}
            <div className="flex flex-col z-50 pt-0" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                {/* Row 1: Book Name & Logo */}
                <div className="flex items-center justify-between px-6 pt-6 pb-1">
                    <span className="text-[16px] font-light opacity-90 truncate flex-1 mt-[-15px]" style={{ fontFamily: "'Poppins', sans-serif", color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>{bookName || "Name of the book"}</span>
                    {settings?.brandingProfile?.logo && logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Logo"
                            className="h-4 w-auto transition-all mix-blend-screen"
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>

                {/* Row 2: Search Bar and Menu */}
                <div className="px-5 pt-6 pb-6 flex items-center gap-4">
                    <div className="flex-1 rounded-full h-9 px-4 flex items-center gap-2 relative" style={{ backgroundColor: getLayoutColor('search-bg-v1', '#DADBE8') }}>
                        <Icon icon="ph:magnifying-glass" className="w-4.5 h-4.5" style={{ color: getLayoutColor('search-text-v1', '#575C9C') }} />
                        <input
                            type="text"
                            placeholder="Quick Search.."
                            className="bg-transparent placeholder-current text-[11px] outline-none w-full font-bold"
                            style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
                            value={localSearchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setLocalSearchQuery(val);
                                if (val.length >= 1) {
                                    setShowSuggestions(true);
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
                                    setShowSuggestions(false);
                                    setRecommendations([]);
                                }
                            }}
                        />

                        {/* Recommendations Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
                                >
                                    <div className="flex flex-col py-1.5">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={idx}
                                                className="flex items-center justify-between px-4 py-2.5 hover:bg-[#575C9C]/5 transition-colors text-[#575C9C]"
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setRecommendations([]);
                                                    setShowSuggestions(false);
                                                    setLocalSearchQuery(rec.word);
                                                }}
                                            >
                                                <span className="text-[12px] font-semibold">{rec.word}</span>
                                                <span className="text-[10px] opacity-60 font-bold">{rec.pageNumber.toString().padStart(2, '0')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); const wasOpen = showMoreMenu; closeAllPopups(); if (!wasOpen) setShowMoreMenu(true); }}
                        className="active:scale-90 transition-transform"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                    >
                        <Icon icon="ph:list" className="w-7 h-7" />
                    </button>
                </div>
            </div>



            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col overflow-hidden">

                {/* Main Content Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col" style={{ backgroundColor: getLayoutColor('page-bg-v2', '#BDC3D9') }}>
                    {/* Zoom/Reset Box */}
                    <div className="absolute top-3 right-2.5 z-[70] flex items-center gap-2 px-2 py-1.5 rounded-lg backdrop-blur-md border border-white/10"
                        style={{ backgroundColor: getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.45) }}>
                        <button
                            onClick={() => handleZoomOut?.()}
                            className="text-white/90 hover:text-white active:scale-90 transition-all flex items-center justify-center"
                        >
                            <Icon icon="material-symbols-light:zoom-out" className="w-[18px] h-[18px]" />
                        </button>
                        <span className="text-white text-[10px] font-bold min-w-[24px] text-center">
                            {Math.round((currentZoom || 0.85) * 100)}%
                        </span>
                        <button
                            onClick={() => handleZoomIn?.()}
                            className="text-white/90 hover:text-white active:scale-90 transition-all flex items-center justify-center"
                        >
                            <Icon icon="material-symbols-light:zoom-in" className="w-[18px] h-[18px]" />
                        </button>
                        <button
                            onClick={() => setCurrentZoom?.(0.85)}
                            className="bg-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-[4px] active:scale-95 transition-all ml-0.5"
                            style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        >
                            Reset
                        </button>
                    </div>

                    {/* Navigation Arrows inside the main container */}
                    <button
                        className="absolute left-[2%] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 active:scale-90 transition-transform"
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        onClick={() => { closeAllPopups(); bookRef.current?.pageFlip()?.flipPrev(); }}
                    >
                        <Icon icon="ph:caret-left-light" strokeWidth="4" className="w-8 h-8 opacity-80" />
                    </button>

                    <button
                        className="absolute right-[2%] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 active:scale-90 transition-transform"
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        onClick={() => { closeAllPopups(); bookRef.current?.pageFlip()?.flipNext(); }}
                    >
                        <Icon icon="ph:caret-right-light" strokeWidth="4" className="w-8 h-8 opacity-80" />
                    </button>

                    {/* Flipbook Canvas - Scaled down for better mobile fit */}
                    <div className="flex-1 flex items-center justify-center px-10 relative overflow-hidden">
                        <div className="relative transition-transform duration-300" style={{ transform: 'scale(0.8)', transformOrigin: 'center center' }}>
                            {children}
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Navigation */}
            <footer className="z-[60] flex flex-col pt-8 pb-10 relative mb-[-20px]" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                <div className="flex items-center justify-center gap-6 mb-3" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                    <button onClick={() => { closeAllPopups(); onPageClick(0); }} className="active:scale-90 transition-transform">
                        <Icon icon="ph:skip-back-bold" className="w-4 h-4" />
                    </button>
                    <button onClick={() => { closeAllPopups(); onPageClick(Math.max(0, currentPage - 1)); }} className="active:scale-90 transition-transform">
                        <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { closeAllPopups(); setIsPlaying(!isAutoFlipping); }}
                        className="active:scale-90 transition-all"
                    >
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-6 h-6" />
                    </button>
                    <button onClick={() => { closeAllPopups(); onPageClick(Math.min(pages.length - 1, currentPage + 1)); }} className="active:scale-90 transition-transform">
                        <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
                    </button>
                    <button onClick={() => { closeAllPopups(); onPageClick(pages.length - 1); }} className="active:scale-90 transition-transform">
                        <Icon icon="ph:skip-forward-bold" className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6">
                    <div ref={progressRef} className="h-[3px] w-full bg-white/20 rounded-full cursor-pointer relative overflow-hidden" onClick={handleProgressClick}>
                        <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(1, progressPercentage)}%`, backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        />
                    </div>
                </div>
            </footer>

            {renderPopups()}
        </div>
    );
};

export default MobileLayout1;
