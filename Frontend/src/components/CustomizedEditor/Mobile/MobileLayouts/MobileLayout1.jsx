import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import AddBookmarkPopup from '../../AddBookmarkPopup';
import AddNotesPopup from '../../AddNotesPopup';
import NotesViewerPopup from '../../NotesViewerPopup';
import ViewBookmarkPopup from '../../ViewBookmarkPopup';
import ProfilePopup from '../../ProfilePopup';
import Sound from '../../Sound';
import Export from '../../Export';
import FlipbookSharePopup from '../../FlipbookSharePopup';
import TableOfContentsPopup from '../../TableOfContentsPopup';

const getLayoutColor = (id, defaultColor) => {
    return `var(--${id}, ${defaultColor})`;
};

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
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
        <Icon icon={icon} className="w-[14px] h-[14px] text-white/90" />
        <span className="text-white text-[11px] font-medium">{label}</span>
    </button>
);

const MobileLayout1 = ({
    children,
    settings,
    bookName,
    activeLayout,
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
    offset = 0,
    showNotesMenu,
    setShowNotesMenu
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const scrollRef = useRef(null);
    const progressRef = useRef(null);
    const [currentZoom, setCurrentZoom] = useState(0.6);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState([]);
    const [showLocalNotesMenu, setShowLocalNotesMenu] = useState(false);
    const [showLocalBookmarkMenu, setShowLocalBookmarkMenu] = useState(false);
    const [showDotMenu, setShowDotMenu] = useState(false);
    const dotBtnRef = useRef(null);

    const handleZoomIn = () => {
        setCurrentZoom(prev => Math.min(prev + 0.1, 2));
    };
    const handleZoomOut = () => {
        setCurrentZoom(prev => Math.max(prev - 0.1, 0.4));
    };

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

    const handleProgressClick = (e) => {
        if (!progressRef.current || pages.length <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pages.length - 1));
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
            '--page-bg': activeLayout?.pageBg || '#BDC3D9',
            '--progress-bar-bg': activeLayout?.progressBarBg || '#FFFFFF',
            '--progress-bar-fill': activeLayout?.progressBarFill || '#575C9C',
            '--play-button-bg': activeLayout?.playButtonBg || '#FFFFFF',
            '--play-button-icon': activeLayout?.playButtonIcon || '#575C9C',
            '--play-button-border': activeLayout?.playButtonBorder || '#FFFFFF',
        };
    }, [activeLayout]);

    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {showThumbnailBar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/5" onClick={() => setShowThumbnailBar(false)} />
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute bottom-10 left-0 right-0 z-[110] px-1 pointer-events-auto">
                            <div 
                                className="rounded-xl overflow-hidden flex items-center h-[55px] relative px-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border backdrop-blur-md" 
                                style={{ 
                                    backgroundColor: getLayoutColorRgba('thumbnail-outer-v2', '87, 92, 156', '0.8'),
                                    borderColor: 'rgba(255,255,255,0.2)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button className={`shrink-0 w-6 h-full flex items-center justify-center text-white transition-opacity ${!canScrollLeft ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('left')}><Icon icon="lucide:chevron-left" className="w-4 h-4" /></button>
                                <div ref={scrollRef} onScroll={checkScroll} className="flex-1 flex overflow-x-auto no-scrollbar gap-1.5 px-1 items-center h-full scroll-smooth">
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        let boxWidth = 48;
                                        let boxHeight = 36;

                                        if (isOverflowing) {
                                            const visiblePos = visibleIndices.indexOf(idx);
                                            if (visiblePos !== -1) {
                                                if (visiblePos === 0 || visiblePos === visibleIndices.length - 1) {
                                                    boxWidth = 32;
                                                    boxHeight = 24;
                                                } else if (visiblePos === 1 || (visiblePos === visibleIndices.length - 2 && visibleIndices.length > 2)) {
                                                    boxWidth = 40;
                                                    boxHeight = 30;
                                                }
                                            } else {
                                                if (idx === 0 || idx === spreads.length - 1) {
                                                    boxWidth = 32;
                                                    boxHeight = 24;
                                                } else if (idx === 1 || (idx === spreads.length - 2 && spreads.length > 2)) {
                                                    boxWidth = 40;
                                                    boxHeight = 30;
                                                }
                                            }
                                        }

                                        return (
                                            <div 
                                                key={idx} 
                                                data-index={idx}
                                                className={`thumbnail-item shrink-0 flex flex-col items-center gap-1 p-1 rounded-md transition-all duration-300 ${isSelected ? 'active-thumbnail ring-1 ring-white/30' : ''}`} 
                                                style={{
                                                    backgroundColor: isSelected ? getLayoutColor('thumbnail-inner-v2', '#BCBEE1') : getLayoutColor('thumbnail-outer-v2', '#575C9C')
                                                }}
                                                onClick={() => onPageClick(spread.indices[0])}
                                            >
                                                <div className="bg-white rounded-[2px] overflow-hidden shadow-sm flex gap-[0.5px] transition-all duration-300" style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}>
                                                    {spread.pages.map((page, pIdx) => (<div key={pIdx} className="flex-1 h-full overflow-hidden transition-all duration-300"><PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={isSelected ? 0.09 : 0.07} /></div>))}
                                                </div>
                                                <span className="text-[7.5px] font-bold text-white/90 truncate w-10 text-center transition-all duration-300">{spread.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button className={`shrink-0 w-6 h-full flex items-center justify-center text-white transition-opacity ${!canScrollRight ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('right')}><Icon icon="lucide:chevron-right" className="w-4 h-4" /></button>
                            </div>
                        </motion.div>
                    </>
                )}
                {showMoreMenu && !isLandscape && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 z-[150] bg-transparent pointer-events-auto" 
                            onClick={() => { setShowMoreMenu(false); setShowLocalNotesMenu(false); setShowLocalBookmarkMenu(false); }} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className="absolute top-[4.5rem] right-6 w-[170px] rounded-xl shadow-2xl z-[160] overflow-hidden border border-white/10 bg-[#575c9c]/90 backdrop-blur-md pointer-events-auto"
                        >
                            <div className="flex flex-col p-1.5 gap-1">
                                <MenuBtn icon="lucide:list" label="Table of Contents" onClick={() => { setShowTOC(true); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:layout-grid" label="Thumbnails" onClick={() => { setShowThumbnailBar(prev => !prev); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:file-text-plus" label="Add Notes" onClick={() => { setShowLocalNotesMenu(prev => !prev); setShowLocalBookmarkMenu(false); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:bookmark" label="Bookmarks" onClick={() => { setShowLocalBookmarkMenu(prev => !prev); setShowLocalNotesMenu(false); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:user" label="Profile" onClick={() => { setShowProfilePopup(true); setShowMoreMenu(false); setShowLocalNotesMenu(false); setShowLocalBookmarkMenu(false); }} />
                                <MenuBtn icon="lucide:music" label="BG Music" onClick={() => { setShowSoundPopup(true); setShowMoreMenu(false); }} />
                                <div className="h-[1px] bg-white/10 my-1 mx-2" />
                                <MenuBtn icon="lucide:share-2" label="Share" onClick={() => { handleShare(); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:download" label="Download" onClick={() => { handleDownload(); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:maximize" label="Fullscreen View" onClick={() => { handleFullScreen(); setShowMoreMenu(false); }} />
                            </div>
                        </motion.div>
                    </>
                )}
                {showDotMenu && isLandscape && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[150] bg-transparent pointer-events-auto"
                            onClick={() => setShowDotMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 6 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute z-[160] pointer-events-auto"
                            style={{
                                bottom: '34px',
                                right: '78px',
                            }}
                        >
                            <div
                                className="rounded-xl overflow-hidden border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md"
                                style={{ backgroundColor: 'rgba(87, 92, 156, 0.95)' }}
                            >
                                <div className="flex flex-col py-1.5 px-0.5">
                                    <MenuBtn
                                        icon="material-symbols:photo-library-rounded"
                                        label="Gallery"
                                        onClick={() => { setShowThumbnailBar(prev => !prev); setShowDotMenu(false); }}
                                    />
                                    <MenuBtn
                                        icon="lucide:user"
                                        label="Profile"
                                        onClick={() => { setShowProfilePopup(true); setShowDotMenu(false); }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
                {showTOC && (
                    <TableOfContentsPopup 
                        onClose={() => setShowTOC(false)}
                        settings={settings.tocSettings || settings.toc}
                        activeLayout={activeLayout || 1}
                        isMobile={true}
                        isLandscape={isLandscape}
                        onNavigate={(pageIndex) => {
                            onPageClick(pageIndex);
                            setShowTOC(false);
                        }}
                    />
                )}
            </AnimatePresence>
            {showLocalNotesMenu && (
                <>
                    <div className="absolute inset-0 z-[165] bg-transparent pointer-events-auto" onClick={() => setShowLocalNotesMenu(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-[170] flex flex-col overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto"
                        style={{
                            ...(isLandscape ? { bottom: '30px', right: '108px' } : { top: '6.5rem', right: '8.5rem' }),
                            width: '130px',
                            backgroundColor: 'rgba(87, 92, 156, 0.95)',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        <div className="flex flex-col p-1.5 gap-1">
                            <MenuBtn icon="material-symbols:note-add-rounded" label="Add Notes" onClick={() => { setShowAddNotesPopup(true); setShowLocalNotesMenu(false); setShowMoreMenu(false); }} />
                            <MenuBtn icon="lucide:eye" label="View Notes" onClick={() => { setShowNotesViewer(true); setShowLocalNotesMenu(false); setShowMoreMenu(false); }} />
                        </div>
                    </motion.div>
                </>
            )}
            {showLocalBookmarkMenu && (
                <>
                    <div className="absolute inset-0 z-[165] bg-transparent pointer-events-auto" onClick={() => setShowLocalBookmarkMenu(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-[170] flex flex-col overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto"
                        style={{
                            ...(isLandscape ? { bottom: '30px', right: '108px' } : { top: '8rem', right: '8.5rem' }),
                            width: '130px',
                            backgroundColor: 'rgba(87, 92, 156, 0.95)',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        <div className="flex flex-col p-1.5 gap-1">
                            <MenuBtn icon="mdi:bookmark-plus-outline" label="Add Bookmark" onClick={() => { setShowAddBookmarkPopup(true); setShowLocalBookmarkMenu(false); setShowMoreMenu(false); }} />
                            <MenuBtn icon="mdi:eye-outline" label="View Bookmark" onClick={() => { setShowViewBookmarkPopup(true); setShowLocalBookmarkMenu(false); setShowMoreMenu(false); }} />
                        </div>
                    </motion.div>
                </>
            )}
            {showAddBookmarkPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <AddBookmarkPopup onClose={() => setShowAddBookmarkPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddBookmark={onAddBookmark} isSidebarOpen={false} bookmarkSettings={bookmarkSettings} isMobile={true} activeLayout={1} isLandscape={isLandscape} isSpread={isSpread} />
                </div>
            )}
            {showAddNotesPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <AddNotesPopup onClose={() => setShowAddNotesPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddNote={onAddNote} isSidebarOpen={false} isMobile={true} activeLayout={1} />
                </div>
            )}
            {showNotesViewer && (
                <NotesViewerPopup onClose={() => setShowNotesViewer(false)} notes={notes} isSidebarOpen={false} isMobile={true} />
            )}
            {showViewBookmarkPopup && (
                <ViewBookmarkPopup onClose={() => setShowViewBookmarkPopup(false)} bookmarks={bookmarks?.filter(b => b.layoutId === 1)} onDelete={onDeleteBookmark} onUpdate={onUpdateBookmark} onNavigate={(pageIndex) => { onPageClick(pageIndex); setShowViewBookmarkPopup(false); }} activeLayout={1} isMobile={true} isLandscape={isLandscape} />
            )}
            {showProfilePopup && (
                <ProfilePopup onClose={() => setShowProfilePopup(false)} profileSettings={profileSettings} activeLayout={1} isMobile={true} />
            )}
            <Sound isOpen={showSoundPopup} onClose={() => setShowSoundPopup(false)} activeLayout={1} otherSetupSettings={otherSetupSettings} onUpdateOtherSetup={onUpdateOtherSetup} isMuted={isMuted} setIsMuted={setIsMuted} isFlipMuted={isFlipMuted} setIsFlipMuted={setIsFlipMuted} flipTrigger={flipTrigger} settings={settings} isMobile={true} />
            {showExportPopup && (
                <div className="absolute inset-0 z-[4000] flex items-center justify-center p-4 pointer-events-auto">
                    <div className="absolute inset-0 bg-transparent" onClick={() => setShowExportPopup(false)} />
                    <div className="relative z-[4001] w-full max-w-[380px]">
                        <Export 
                            isOpen={true} 
                            hideButton={true} 
                            onClose={() => setShowExportPopup(false)} 
                            pages={pages} 
                            bookName={bookName} 
                            currentPage={currentPage}
                            isMobile={true} 
                            isLandscape={isLandscape}
                        />
                    </div>
                </div>
            )}
            {showSharePopup && (
                <div className="absolute inset-0 z-[4000] flex items-center justify-center p-4 pointer-events-auto">
                    <div className="absolute inset-0 bg-transparent" onClick={() => setShowSharePopup(false)} />
                    <div className="relative z-[4001] w-full max-w-[380px]">
                        <FlipbookSharePopup onClose={() => setShowSharePopup(false)} bookName={bookName} url={window.location.href} isMobile={true} isLandscape={isLandscape} />
                    </div>
                </div>
            )}
        </div>
    );

    if (isLandscape) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#DADBE8] pt-[14px] pb-3" style={{ ...layoutVariables }}>
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}
                <header className="z-50 px-14 h-6 flex items-center justify-between shadow-md border-b border-white/10 shrink-0 relative" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '11, 15, 78', '1') }}>
                    <div className={`flex-1 max-w-[150px] relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}>
                        <div className="bg-white/10 rounded px-1.5 py-0.5 flex items-center gap-1 backdrop-blur-sm border border-white/10">
                            <Icon icon="lucide:search" className="text-white/60 w-2.5 h-2.5" />
                            <input 
                                type="text" 
                                placeholder="Quick Search..." 
                                className="bg-transparent text-white placeholder-white/40 text-[7px] outline-none w-full font-medium" 
                                value={localSearchQuery} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSearchQuery(val);
                                    setShowSuggestions(true);
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
                                onFocus={() => { if (recommendations.length > 0) setShowSuggestions(true); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchQuery(localSearchQuery);
                                        handleQuickSearch(localSearchQuery);
                                        setRecommendations([]);
                                        setShowSuggestions(false);
                                    }
                                }}
                            />
                        </div>

                        {/* Recommendations Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 mt-1 w-[180px] bg-[#575C9C]/80 backdrop-blur-md rounded-lg shadow-2xl border border-white/10 z-[100] overflow-hidden"
                                >
                                    <div className="flex flex-col py-1">
                                        {recommendations.map((rec, idx) => (
                                            <button 
                                                key={idx}
                                                className="flex items-center justify-between px-3 py-1.5 hover:bg-white/10 transition-colors text-white"
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setRecommendations([]);
                                                    setShowSuggestions(false);
                                                    setLocalSearchQuery(rec.word);
                                                }}
                                            >
                                                <span className="text-[9px] font-medium">{rec.word}</span>
                                                <span className="text-[8px] opacity-60 font-bold">{rec.pageNumber.toString().padStart(2, '0')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-full max-w-[30%]">
                        <span className="text-white text-[8px] font-bold opacity-90 truncate block">{bookName}</span>
                    </div>
                    <div className="flex-1 flex justify-end" />
                </header>
                <div className="flex-1 flex items-center justify-center relative px-14 overflow-hidden" onClick={() => setShowThumbnailBar(false)}>
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-40">
                        <button onClick={(e) => { e.stopPropagation(); if (bookRef?.current?.pageFlip()) bookRef.current.pageFlip().flipPrev(); }} className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-md p-1.5 text-white active:scale-90 transition-all border border-white/10 shadow-sm"><Icon icon="lucide:chevron-left" className="w-4 h-4" /></button>
                    </div>
                    <div className="absolute right-16 top-1/2 -translate-y-1/2 z-40">
                        <button onClick={(e) => { e.stopPropagation(); if (bookRef?.current?.pageFlip()) bookRef.current.pageFlip().flipNext(); }} className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-md p-1.5 text-white active:scale-90 transition-all border border-white/10 shadow-sm"><Icon icon="lucide:chevron-right" className="w-4 h-4" /></button>
                    </div>
                    <div className="transition-transform duration-500 ease-out flex items-center justify-center w-full h-full" style={{ transform: `translateX(${offset * 0.45 * currentZoom}px) scale(${currentZoom * 0.45})` }}>
                        <div className="relative flex items-center justify-center w-full h-full" style={{ transformOrigin: 'center center' }}>{children}</div>
                    </div>
                </div>
                <footer className="h-7 px-10 flex items-center justify-between shadow-2xl border-t border-white/10 z-[60] shrink-0 font-sans" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}>
                    {/* Left Group */}
                    <div className="flex items-center gap-1 min-w-max">
                        <button onClick={() => { setShowTOC(true); setShowThumbnailBar(false); }} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon="ph:list-bold" className="w-[11px] h-[11px]" /></button>
                        <button onClick={() => setShowThumbnailBar(prev => !prev)} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon="ph:squares-four-fill" className="w-[11px] h-[11px]" /></button>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-1.5 ml-2">
                        <button onClick={() => onPageClick(0)} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon="ph:skip-back" className="w-[10px] h-[10px]" /></button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-[14px] h-[14px]" /></button>
                        <button onClick={() => onPageClick(pages.length - 1)} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon="ph:skip-forward" className="w-[10px] h-[10px]" /></button>
                    </div>

                    {/* Progress Bar (flex-grow with max-w) */}
                    <div className="flex-1 mx-4 flex items-center max-w-[12vw]">
                        <div ref={progressRef} className="h-[1.5px] w-full bg-white/20 rounded-full cursor-pointer relative" onClick={handleProgressClick}>
                            <div className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </div>

                    {/* Tools Group */}
                    <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setShowLocalNotesMenu(prev => !prev); }} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="material-symbols-light:add-notes" className="w-[14px] h-[14px]" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setShowLocalBookmarkMenu(prev => !prev); }} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="ph:bookmark-simple-fill" className="w-[12px] h-[12px]" /></button>
                        <button onClick={() => setShowSoundPopup(true)} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="solar:music-notes-bold" className="w-[12px] h-[12px]" /></button>
                        <button ref={dotBtnRef} onClick={(e) => { e.stopPropagation(); setShowDotMenu(prev => !prev); }} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="ph:dots-three-bold" className="w-[14px] h-[14px]" /></button>
                    </div>

                    {/* Divider */}
                    <div className="w-[1px] h-[10px] bg-white/10 mx-1.5" />

                    {/* Zoom & Actions Group */}
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                            <button onClick={handleZoomOut} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="ph:magnifying-glass-minus" className="w-[10px] h-[10px]" /></button>
                            <div className="w-6 h-[1.5px] bg-white/20 rounded-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-white" style={{ width: `${((currentZoom - 0.4) / (2 - 0.4)) * 100}%` }} />
                            </div>
                            <button onClick={handleZoomIn} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="ph:magnifying-glass-plus" className="w-[10px] h-[10px]" /></button>
                        </div>
                        <button onClick={handleShare} className="text-white/90 hover:text-white active:scale-90 transition-all ml-0.5"><Icon icon="mage:share-fill" className="w-[10px] h-[10px]" /></button>
                        <button onClick={handleDownload} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="meteor-icons:download" className="w-[10px] h-[10px]" /></button>
                        <button onClick={handleFullScreen} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="lucide:fullscreen" className="w-[10px] h-[10px]" /></button>
                    </div>
                </footer>


                {renderPopups()}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative" style={{ ...layoutVariables }}>
            {/* Top Area - Notch Spacer (Increased height) */}
            <div className="h-10 w-full shrink-0" style={{ backgroundColor: '#0B0F4E' }} />

            {/* Combined Header - Blue Background (Removed FIST-O logo) */}
            <header className="z-50 px-5 pt-4 pb-3 flex flex-col gap-4 bg-[#575C9C] shadow-md border-b border-white/5 relative">
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}
                <div className="flex items-center justify-between px-1">
                    <span className="text-white text-[13px] font-semibold opacity-90 truncate w-full">{bookName}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`flex-1 bg-[#D7D8E8] rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 shadow-inner relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}>
                        <Icon icon="lucide:search" className="text-[#575C9C] w-4 h-4 opacity-70" />
                        <input 
                            type="text" 
                            placeholder="Quick Search.." 
                            className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/60 text-[12px] outline-none w-full font-semibold" 
                            value={localSearchQuery} 
                            onChange={(e) => {
                                const val = e.target.value;
                                setLocalSearchQuery(val);
                                setShowSuggestions(true);
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
                            onFocus={() => { if (recommendations.length > 0) setShowSuggestions(true); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setSearchQuery(localSearchQuery);
                                    handleQuickSearch(localSearchQuery);
                                    setRecommendations([]);
                                    setShowSuggestions(false);
                                }
                            }}
                        />

                        {/* Portrait Recommendations Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
                                >
                                    <div className="flex flex-col py-1.5">
                                        {recommendations.map((rec, idx) => (
                                            <button 
                                                key={idx}
                                                className="flex items-center justify-between px-4 py-2 hover:bg-[#575C9C]/5 transition-colors text-[#575C9C]"
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setRecommendations([]);
                                                    setShowSuggestions(false);
                                                    setLocalSearchQuery(rec.word);
                                                }}
                                            >
                                                <span className="text-[13px] font-semibold">{rec.word}</span>
                                                <span className="text-[11px] opacity-60 font-bold">{rec.pageNumber.toString().padStart(2, '0')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }} className="text-white active:scale-90 transition-transform">
                        <Icon icon="ph:list-bold" className="w-[1.6rem] h-[1.6rem]" />
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col bg-[#BDC3D9]">
                {/* Zoom Control Bar */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#D7D8E8]/90 backdrop-blur-md rounded-md px-2 py-1 z-30 shadow-md border border-white/40">
                    <button 
                        onClick={() => setCurrentZoom(prev => Math.max(0.3, prev - 0.1))} 
                        className="text-[#575C9C] hover:scale-110 active:scale-90 transition-all p-0.5"
                    >
                        <Icon icon="lucide:minus" className="w-3 h-3" />
                    </button>
                    <span className="text-[#575C9C] font-bold text-[9px] min-w-[28px] text-center">{Math.round(currentZoom * 100)}%</span>
                    <button 
                        onClick={() => setCurrentZoom(prev => Math.min(2, prev + 0.1))} 
                        className="text-[#575C9C] hover:scale-110 active:scale-90 transition-all p-0.5"
                    >
                        <Icon icon="lucide:plus" className="w-3 h-3" />
                    </button>
                    <div className="w-[1px] h-2.5 bg-[#575C9C]/20 mx-0.5" />
                    <button 
                        onClick={() => setCurrentZoom(0.6)} 
                        className="bg-white px-1.5 py-0.5 rounded border border-[#575C9C]/20 text-[#575C9C] text-[8px] font-bold hover:bg-[#575C9C] hover:text-white transition-colors"
                    >
                        Reset
                    </button>
                </div>

                {/* Flipbook Content */}
                <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="transition-transform duration-500 ease-out" style={{ transform: `scale(${currentZoom * 0.9})`, transformOrigin: 'center center' }}>
                        <div className="relative">
                            {children}
                        </div>
                    </div>
                </div>


            </div>

            {/* Footer Navigation */}
            <footer className="z-[100] bg-[#575C9C] flex flex-col pt-3 pb-5 relative">
                <div className="flex items-center justify-center gap-8 text-white">
                    <button onClick={() => onPageClick(0)} className="active:scale-90 transition-transform">
                        <Icon icon="ph:skip-back-bold" className="w-[1rem] h-[1rem]" />
                    </button>
                    <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="active:scale-90 transition-transform">
                        <Icon icon="ph:caret-left-bold" className="w-[0.85rem] h-[0.85rem]" />
                    </button>
                    <button onClick={() => setIsPlaying(!isAutoFlipping)} className="active:scale-90 transition-transform mx-2">
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-[1rem] h-[1rem]" />
                    </button>
                    <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="active:scale-90 transition-transform">
                        <Icon icon="ph:caret-right-bold" className="w-[0.85rem] h-[0.85rem]" />
                    </button>
                    <button onClick={() => onPageClick(pages.length - 1)} className="active:scale-90 transition-transform">
                        <Icon icon="ph:skip-forward-bold" className="w-[1rem] h-[1rem]" />
                    </button>
                </div>

                {/* Progress Bar Slider */}
                <div className="absolute bottom-1.5 left-0 right-0 px-8">
                    <div ref={progressRef} className="h-[2px] w-full bg-white/20 rounded-full cursor-pointer relative" onClick={handleProgressClick}>
                        <div 
                            className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-300" 
                            style={{ width: `${Math.max(1, progressPercentage)}%` }} 
                        />
                    </div>
                </div>
            </footer>

            {renderPopups()}
        </div>
    );
};

export default MobileLayout1;
