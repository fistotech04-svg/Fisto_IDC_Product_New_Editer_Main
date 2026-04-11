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

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

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
        className="flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-white/10 active:bg-white/20 transition-colors text-left"
    >
        <Icon icon={icon} className="w-[18px] h-[18px] text-white/90" />
        <span className="text-white text-[12.5px] font-medium">{label}</span>
    </button>
);

const MobileLayout2 = ({
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
    showNotesMenu,
    setShowNotesMenu,
    isLandscape,
    offset = 0
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const scrollRef = useRef(null);
    const progressRef = useRef(null);
    const [showRadialThumbnails, setShowRadialThumbnails] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [radialScroll, setRadialScroll] = useState(0);
    const [currentZoom, setCurrentZoom] = useState(0.6);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

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
                    label: spreadIndices.length > 1
                        ? `Page ${spreadIndices[0] + 1}-${spreadIndices[1] + 1}`
                        : `Page ${spreadIndices[0] + 1}`
                });
            }
        }
        return result;
    }, [pages]);

    const activeSpreadIdx = useMemo(() => {
        return spreads.findIndex(s => s.indices.includes(currentPage));
    }, [spreads, currentPage]);

    useEffect(() => {
        if (activeSpreadIdx !== -1 && showRadialThumbnails) {
            const spacing = spreads.length > 1 ? Math.min(22, 160 / (spreads.length - 1)) : 22;
            const totalSpan = (spreads.length - 1) * spacing;
            const targetAngle = (activeSpreadIdx * spacing) - (totalSpan / 2);
            setRadialScroll(-targetAngle);
        }
    }, [activeSpreadIdx, spreads.length, showRadialThumbnails]);

    const handleRadialWheel = (e) => {
        e.stopPropagation();
        setRadialScroll(prev => prev + (e.deltaY * -0.12));
    };

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
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
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute bottom-0 left-0 right-0 z-[110] px-1 pb-1 pointer-events-auto">
                            <div className="rounded-lg overflow-hidden flex items-center h-[65px] relative px-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border border-white/20 bg-[#4e558e]/95 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
                                <button className={`shrink-0 w-6 h-full flex items-center justify-center text-white transition-opacity ${!canScrollLeft ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('left')}><Icon icon="lucide:chevron-left" className="w-4 h-4" /></button>
                                <div ref={scrollRef} onScroll={checkScroll} className="flex-1 flex overflow-x-auto no-scrollbar gap-1 px-0.5 items-center h-full scroll-smooth">
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        return (
                                            <div key={idx} className={`shrink-0 flex flex-col items-center gap-0.5 p-0.5 rounded-md transition-all ${isSelected ? 'bg-[#4B528C] ring-1 ring-white/30' : 'hover:bg-white/5'}`} onClick={() => onPageClick(spread.indices[0])}>
                                                <div className="bg-white rounded-[2px] overflow-hidden shadow-sm flex gap-[0.5px]" style={{ width: '52px', height: '39px' }}>
                                                    {spread.pages.map((page, pIdx) => (<div key={pIdx} className="flex-1 h-full overflow-hidden"><PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={isSelected ? 0.1 : 0.08} /></div>))}
                                                </div>
                                                <span className="text-[7px] font-bold text-white/90 truncate w-14 text-center">{spread.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button className={`shrink-0 w-6 h-full flex items-center justify-center text-white transition-opacity ${!canScrollRight ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('right')}><Icon icon="lucide:chevron-right" className="w-4 h-4" /></button>
                            </div>
                        </motion.div>
                    </>
                )}
                {showMoreMenu && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150] bg-transparent" onClick={() => setShowMoreMenu(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`absolute ${isLandscape ? 'bottom-12 right-1/2 translate-x-1/2' : 'top-[4.5rem] right-4'} w-[210px] rounded-xl shadow-2xl z-[160] overflow-hidden border border-white/10 bg-[#575c9c]/90 backdrop-blur-md`}>
                            <div className="flex flex-col p-1.5 gap-1">
                                <MenuBtn icon="lucide:list" label="Table of Contents" onClick={() => { setShowTOC(true); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:layout-grid" label="Thumbnails" onClick={() => { setShowThumbnailBar(true); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:file-text-plus" label="Add Notes" onClick={() => { setShowNotesViewer(true); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:bookmark" label="Bookmarks" onClick={() => { setShowViewBookmarkPopup(true); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:user" label="Profile" onClick={() => { setShowProfilePopup(true); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:music" label="BG Music" onClick={() => { setShowSoundPopup(true); setShowMoreMenu(false); }} />
                                <div className="h-[1px] bg-white/10 my-1 mx-2" />
                                <MenuBtn icon="lucide:share-2" label="Share" onClick={() => { handleShare(); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:download" label="Download" onClick={() => { handleDownload(); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:maximize" label="Fullscreen View" onClick={() => { handleFullScreen(); setShowMoreMenu(false); }} />
                            </div>
                        </motion.div>
                    </>
                )}
                {showNotesMenu && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150] bg-transparent pointer-events-auto" onClick={() => setShowNotesMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className={`absolute ${isLandscape ? 'top-14 left-[54%]' : 'top-[148px] left-5'} z-[160] p-0.5 rounded-[1.2rem] bg-white/60 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-white/40 pointer-events-auto`}
                        >
                            <div
                                className="rounded-[1rem] py-2 px-3 flex flex-col items-start gap-2.5 min-w-[140px]"
                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#575C9C') }}
                            >
                                <button
                                    onClick={() => { setShowAddNotesPopup(true); setShowNotesMenu(false); }}
                                    className="flex items-center gap-2.5 w-full group transition-all"
                                >
                                    <Icon icon="solar:notes-bold" className="w-4 h-4" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                    <span className="text-[13.5px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Add Notes</span>
                                </button>
                                <button
                                    onClick={() => { setShowNotesViewer(true); setShowNotesMenu(false); }}
                                    className="flex items-center gap-2.5 w-full group transition-all"
                                >
                                    <Icon icon="ph:eye-fill" className="w-4 h-4" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                                    <span className="text-[13.5px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 'var(--dropdown-text-opacity, 1)' }}>View Notes</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
                {showBookmarkMenu && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150] bg-transparent pointer-events-auto" onClick={() => setShowBookmarkMenu(false)} />
                        {isLandscape ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                className="absolute top-[3.5rem] right-[10rem] z-[160] p-2 rounded-[1.6rem] bg-white/60 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-white/40 pointer-events-auto"
                            >
                                <div className="bg-[#575C9C] rounded-[1.2rem] py-3 px-5 flex flex-col items-start gap-3.5 min-w-[170px]">
                                    <button
                                        onClick={() => { setShowAddBookmarkPopup(true); setShowBookmarkMenu(false); }}
                                        className="flex items-center gap-3 w-full group transition-all"
                                    >
                                        <Icon icon="ph:bookmark-simple-fill" className="w-6 h-6 text-white hover:scale-110 transition-transform" />
                                        <span className="text-[14px] font-bold text-white">Add Bookmark</span>
                                    </button>
                                    <button
                                        onClick={() => { setShowViewBookmarkPopup(true); setShowBookmarkMenu(false); }}
                                        className="flex items-center gap-3 w-full group transition-all"
                                    >
                                        <Icon icon="ph:eye-fill" className="w-6 h-6 text-white hover:scale-110 transition-transform" />
                                        <span className="text-[14px] font-bold text-white">View Bookmark</span>
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="absolute top-[8rem] right-4 z-[160] p-1 rounded-[1.2rem] bg-white/60 backdrop-blur-md shadow-2xl pointer-events-auto">
                                <div className="bg-[#575C9C] rounded-[1rem] py-1.5 px-3 flex flex-col items-start gap-2 min-w-[125px]">
                                    <MenuBtn icon="ph:bookmark-simple-fill" label="Add Bookmark" onClick={() => { setShowAddBookmarkPopup(true); setShowBookmarkMenu(false); }} />
                                    <MenuBtn icon="ph:eye-fill" label="View Bookmark" onClick={() => { setShowViewBookmarkPopup(true); setShowBookmarkMenu(false); }} />
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
                {showTOC && (
                    <>
                        <div className="fixed inset-0 z-[199] pointer-events-auto" onClick={() => setShowTOC(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={`absolute ${isLandscape ? 'top-12 right-[18rem]' : 'top-[148px] left-5'} z-[200] pointer-events-auto bg-white/60 backdrop-blur-xl p-[5px] rounded-[1.6rem] shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-white/40`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="rounded-[1.3rem] overflow-hidden shadow-inner">
                                <div className="rounded-[1.3rem] p-2.5 w-[170px] relative flex flex-col" style={{ backgroundColor: '#575C9C' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h2 className="text-[10px] font-bold whitespace-nowrap text-white">Table of Contents</h2>
                                        <div className="h-[1px] flex-1 bg-white/30" />
                                    </div>
                                    <div className="mb-2 relative">
                                        <Icon icon="lucide:search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/70" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="w-full rounded-full pl-8 pr-2.5 py-1 text-[9px] outline-none border border-white/10 transition-colors bg-black/20 text-white placeholder:text-white/40"
                                            value={tocSearchQuery}
                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 max-h-[140px]">
                                        {tocContent.map((heading, hIdx) => {
                                            const matchesSearch = (heading?.title || '').toLowerCase().includes((tocSearchQuery || '').toLowerCase());
                                            const filteredSub = heading?.subheadings?.filter(s => (s?.title || '').toLowerCase().includes((tocSearchQuery || '').toLowerCase())) || [];
                                            if (tocSearchQuery && !matchesSearch && filteredSub.length === 0) return null;

                                            return (
                                                <React.Fragment key={hIdx}>
                                                    <div
                                                        className="flex items-center justify-between px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors cursor-pointer group"
                                                        onClick={() => { onPageClick(heading.page - 1); setShowTOC(false); }}
                                                    >
                                                        <span className="text-[10px] font-bold text-white truncate flex-1 min-w-0">{heading.title}</span>
                                                        <span className="text-[9px] font-bold text-white/80 tabular-nums ml-2 flex-shrink-0">{heading.page < 10 ? `0${heading.page}` : heading.page}</span>
                                                    </div>
                                                    {filteredSub.map((sub, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className="flex items-center justify-between px-2 py-1 ml-4 hover:bg-white/10 rounded-md transition-colors cursor-pointer group"
                                                            onClick={() => { onPageClick(sub.page - 1); setShowTOC(false); }}
                                                        >
                                                            <span className="text-[9px] font-semibold text-white/90 truncate flex-1 min-w-0">{sub.title}</span>
                                                            <span className="text-[8px] font-bold text-white/60 tabular-nums ml-2 flex-shrink-0">{sub.page < 10 ? `0${sub.page}` : sub.page}</span>
                                                        </div>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {showAddBookmarkPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <AddBookmarkPopup onClose={() => setShowAddBookmarkPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddBookmark={onAddBookmark} isSidebarOpen={false} bookmarkSettings={bookmarkSettings} isMobile={true} activeLayout={2} isLandscape={isLandscape} />
                </div>
            )}
            {showAddNotesPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <AddNotesPopup onClose={() => setShowAddNotesPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddNote={onAddNote} isSidebarOpen={false} isMobile={true} activeLayout={2} isLandscape={isLandscape} />
                </div>
            )}
            {showNotesViewer && (
                <NotesViewerPopup onClose={() => setShowNotesViewer(false)} notes={notes} isSidebarOpen={false} isMobile={true} />
            )}
            {showViewBookmarkPopup && (
                <ViewBookmarkPopup onClose={() => setShowViewBookmarkPopup(false)} bookmarks={bookmarks?.filter(b => b.layoutId === 2)} onDelete={onDeleteBookmark} onUpdate={onUpdateBookmark} onNavigate={(pageIndex) => { onPageClick(pageIndex); setShowViewBookmarkPopup(false); }} activeLayout={2} isMobile={true} />
            )}
            {showProfilePopup && (
                <ProfilePopup onClose={() => setShowProfilePopup(false)} profileSettings={profileSettings} activeLayout={2} isMobile={true} />
            )}
            <Sound isOpen={showSoundPopup} onClose={() => setShowSoundPopup(false)} activeLayout={2} otherSetupSettings={otherSetupSettings} onUpdateOtherSetup={onUpdateOtherSetup} isMuted={isMuted} setIsMuted={setIsMuted} isFlipMuted={isFlipMuted} setIsFlipMuted={setIsFlipMuted} flipTrigger={flipTrigger} settings={settings} isMobile={true} />
            {showExportPopup && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 h-full w-full pointer-events-auto">
                    <div className="absolute inset-0 bg-transparent" onClick={() => setShowExportPopup(false)} />
                    <div className="relative z-[4001] w-full max-w-[260px]">
                        <Export
                            isOpen={true}
                            hideButton={true}
                            onClose={() => setShowExportPopup(false)}
                            pages={pages}
                            bookName={bookName}
                            isMobile={true}
                            isLandscape={isLandscape}
                            currentPage={currentPage}
                        />
                    </div>
                </div>
            )}
            {showSharePopup && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-transparent" onClick={() => setShowSharePopup(false)} />
                    <div className="relative z-[4001] w-full max-w-[260px]">
                        <FlipbookSharePopup onClose={() => setShowSharePopup(false)} bookName={bookName} url={window.location.href} isMobile={true} isLandscape={isLandscape} />
                    </div>
                </div>
            )}
        </div>
    );

    const tocContent = settings?.tocSettings?.content || settings?.toc?.content || [
        { id: 'h1', title: 'Heading Content 1', page: 1, subheadings: [{ id: 's1', title: 'Content 1', page: 2 }, { id: 's2', title: 'Content 2', page: 2 }, { id: 's3', title: 'Content 3', page: 2 }] },
        { id: 'h2', title: 'Heading Content 2', page: 3, subheadings: [{ id: 's4', title: 'Content 1', page: 3 }, { id: 's5', title: 'Content 2', page: 4 }, { id: 's6', title: 'Content 3', page: 5 }] }
    ];

    if (isLandscape) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#DADBE8]" style={{ ...layoutVariables }}>
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}
                {/* Header with Search and All Icons */}
                <header className="z-[100] h-12 pt-2 flex items-center justify-between px-6 shrink-0 shadow-lg" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}>
                    <div
                        className={`w-[220px] ml-6 h-7 rounded-[4px] flex items-center px-3 gap-2 border border-white/10 backdrop-blur-md translate-y-1 relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}
                        style={{ backgroundColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '0.2') }}
                    >
                        <Icon icon="lucide:search" className="w-3.5 h-3.5" style={{ color: getLayoutColorRgba('search-text-v1', '255, 255, 255', '0.6') }} />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent placeholder-white/50 text-[10px] outline-none w-full font-medium"
                            style={{ color: getLayoutColorRgba('search-text-v1', '255, 255, 255', '1') }}
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

                        {/* Recommendations Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 mt-1 w-[180px] bg-[#575C9C]/90 backdrop-blur-md rounded-lg shadow-2xl border border-white/10 z-[100] overflow-hidden"
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

                    <div className="flex items-center gap-4 pr-2 translate-y-1">
                        <button onClick={() => setShowRadialThumbnails(!showRadialThumbnails)} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:squares-four-fill" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowTOC(true)} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:list-bold" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowNotesMenu(!showNotesMenu)} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:file-plus-fill" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowBookmarkMenu(!showBookmarkMenu)} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:bookmark-simple-fill" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowThumbnailBar(true)} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:image-fill" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowSoundPopup(true)} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:music-notes-simple-bold" className="w-3.5 h-3.5" /></button>

                        <div className="w-[1px] h-4 bg-white/20 mx-1" />

                        <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:skip-back-fill" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-4.5 h-4.5" /></button>
                        <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:skip-forward-fill" className="w-3.5 h-3.5" /></button>

                        <div className="w-[1px] h-4 bg-white/20 mx-1" />

                        <button onClick={() => setShowProfilePopup(true)} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:user-fill" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleShare()} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:share-network-fill" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDownload()} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:download-fill" className="w-3.5 h-3.5" /></button>
                        <button onClick={handleFullScreen} className="hover:text-white transition-all" style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.9') }}><Icon icon="ph:corners-out-bold" className="w-3.5 h-3.5" /></button>
                    </div>
                </header>

                <AnimatePresence>
                    {showRadialThumbnails && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-11 left-0 right-0 z-[100] flex items-start justify-center pointer-events-auto h-0"
                            onWheel={handleRadialWheel}
                        >
                            <div className="fixed inset-0 bg-transparent z-[-1] pointer-events-auto" onClick={() => setShowRadialThumbnails(false)} />
                            <div
                                className="relative w-full max-w-[380px] pointer-events-auto cursor-ns-resize"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg
                                    width="100%"
                                    viewBox="0 0 379 204"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="drop-shadow-[0_8px_25px_rgba(0,0,0,0.2)]"
                                    style={{ transform: 'translateY(-15px)' }}
                                >
                                    <path
                                        d="M6.33815e-07 0.500001C7.02785e-05 -104.158 84.8421 -189 189.5 -189C294.158 -189 379 -104.158 379 0.499985C379 105.158 294.158 190 189.5 190C84.8421 190 5.20856e-06 105.158 6.33815e-07 0.500001ZM50.998 0.500976C50.9982 76.9922 113.007 139.001 189.498 139.001C265.989 139.001 327.998 76.9923 327.998 0.500964C327.998 -75.9905 265.989 -137.999 189.498 -137.999C113.007 -137.999 50.998 -75.9904 50.998 0.500976Z"
                                        fill="white"
                                        fillOpacity="0.4"
                                        className="backdrop-blur-3xl"
                                    />
                                    <g
                                        style={{
                                            transformOrigin: '189.5px 0.5px',
                                            transform: `rotate(${radialScroll}deg)`,
                                            transition: 'transform 0.7s cubic-bezier(0.15, 0.85, 0.35, 1)',
                                        }}
                                    >
                                        {spreads.map((spread, idx) => {
                                            const isActivePage = spread.indices.includes(currentPage);
                                            const isHovered = hoveredIdx === idx;
                                            const isActive = isActivePage || isHovered;
                                            const spacing = spreads.length > 1 ? Math.min(22, 160 / (spreads.length - 1)) : 22;
                                            const totalSpan = (spreads.length - 1) * spacing;
                                            const initialAngle = (idx * spacing) - (totalSpan / 2);
                                            return (
                                                <g
                                                    key={idx}
                                                    style={{ transformOrigin: '189.5px 0.5px', transform: `rotate(${initialAngle}deg)` }}
                                                    className="cursor-pointer pointer-events-auto"
                                                    onMouseEnter={() => setHoveredIdx(idx)}
                                                    onMouseLeave={() => setHoveredIdx(null)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPageClick(spread.indices[0]);
                                                    }}
                                                >
                                                    <g style={{ transformOrigin: '189.5px 0.5px', transform: 'rotate(-180deg) scale(1.1)' }}>
                                                        <path
                                                            d="M162.502 181.278C158.736 180.726 156.318 177.007 157.27 173.322L163.549 149.007C164.34 145.948 167.222 143.912 170.374 144.133C180.163 144.819 187.386 144.87 197.242 144.407C200.542 144.251 203.462 146.56 204.02 149.816L208.333 175.024C208.964 178.716 206.342 182.184 202.612 182.513C188.321 183.77 178.434 183.616 162.502 181.278Z"
                                                            fill={isActive ? '#3E4491' : '#4B528C'}
                                                            className="transition-colors duration-500"
                                                        />
                                                        <text
                                                            x="189.5"
                                                            y="164"
                                                            fill="white"
                                                            fontSize="5.5"
                                                            fontWeight="bold"
                                                            textAnchor="middle"
                                                            className="select-none pointer-events-none"
                                                            style={{ transformOrigin: '189.5px 164px', transform: 'rotate(90deg)' }}
                                                        >
                                                            {spread.label}
                                                        </text>
                                                    </g>
                                                </g>
                                            );
                                        })}
                                    </g>
                                </svg>
                                {(() => {
                                    const previewSpread = hoveredIdx !== null ? spreads[hoveredIdx] : spreads[activeSpreadIdx];
                                    if (!previewSpread) return null;
                                    return (
                                        <div className="absolute top-[4px] left-1/2 -translate-x-1/2 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 pointer-events-none z-[120]">
                                            <div className="w-[100px] h-[68px] bg-white rounded-md shadow-xl p-1 flex items-center justify-center gap-0.5 border border-gray-100/50">
                                                {previewSpread.pages.map((p, pIdx) => (
                                                    <div key={pIdx} className="flex-1 h-full bg-gray-50 overflow-hidden relative shadow-inner flex justify-center items-center rounded-xs">
                                                        <PageThumbnail html={p?.html || p?.content} index={previewSpread.indices[pIdx]} scale={0.12} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="w-2.5 h-2.5 bg-white rotate-45 -translate-y-1.5 shadow-md border-b border-r border-gray-100/50 rounded-xs" />
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    {/* Book Name (Floating) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[39] pointer-events-none">
                        <span className="text-[#575C9C] text-[13px] font-bold opacity-80">{bookName}</span>
                    </div>
                    {/* Navigation Arrows */}
                    <button
                        onClick={(e) => { e.stopPropagation(); if (bookRef?.current?.pageFlip()) bookRef.current.pageFlip().flipPrev(); }}
                        className="absolute left-4 p-2 z-40 text-[#575C9C]/60 hover:text-[#575C9C] transition-all active:scale-90"
                    >
                        <Icon icon="lucide:chevron-left" className="w-8 h-8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); if (bookRef?.current?.pageFlip()) bookRef.current.pageFlip().flipNext(); }}
                        className="absolute right-4 p-2 z-40 text-[#575C9C]/60 hover:text-[#575C9C] transition-all active:scale-90"
                    >
                        <Icon icon="lucide:chevron-right" className="w-8 h-8" />
                    </button>

                    {/* Book Canvas */}
                    <div className="transition-transform duration-500 ease-out flex items-center justify-center w-full h-full" style={{ transform: `translateX(${offset * 0.45 * currentZoom}px) scale(${currentZoom * 0.45})` }}>
                        <div className="bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="relative pointer-events-auto">
                                {children}
                            </div>
                        </div>
                    </div>

                    {/* Floating Page Indicator */}
                    <div className="absolute bottom-6 right-12 z-50 bg-white/70 backdrop-blur-md rounded-lg px-2.5 py-1 border border-white/50 shadow-sm">
                        <span className="text-[#575C9C] text-[10px] font-bold">Page {currentPage + 1} / {pages.length}</span>
                    </div>
                </div>

                {/* Footer */}
                <footer className="h-12 flex items-center justify-between px-10 shrink-0 z-[110]" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}>
                    <div className="flex-1" />

                    {/* Dots Page Indicator */}
                    <div className="flex-1 flex justify-center items-center gap-1.5 overflow-hidden">
                        {[...Array(Math.min(pages.length, 14))].map((_, i) => {
                            const dotPage = Math.floor((i / 13) * (pages.length - 1));
                            const isActive = currentPage === dotPage || (i === 13 && currentPage === pages.length - 1);
                            return (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full cursor-pointer transition-all ${i === 0 ? 'w-6' : 'w-1.5'} ${isActive ? 'bg-white opacity-100' : 'bg-white/30'}`}
                                    onClick={() => onPageClick(dotPage)}
                                />
                            );
                        })}
                    </div>

                    {/* Zoom and Reset */}
                    <div className="flex-1 flex justify-end items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-md rounded-md px-2 py-1 flex items-center gap-3 border border-white/10">
                            <button onClick={() => setCurrentZoom(prev => Math.max(0.4, prev - 0.1))} className="text-white/80 hover:text-white"><Icon icon="fad:zoomout" className="w-3.5 h-3.5" /></button>
                            <span className="text-white text-[11px] font-bold min-w-[28px] text-center">{Math.round(currentZoom * 100)}%</span>
                            <button onClick={() => setCurrentZoom(prev => Math.min(2.0, prev + 0.1))} className="text-white/80 hover:text-white"><Icon icon="fad:zoomin" className="w-3.5 h-3.5" /></button>
                        </div>
                        <button
                            onClick={() => setCurrentZoom(0.6)}
                            className="bg-white text-[#575C9C] text-[10px] font-bold px-3 py-1 rounded-md hover:bg-white/90 active:scale-95 transition-all"
                        >
                            Reset
                        </button>
                    </div>
                </footer>

                {renderPopups()}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative" style={{ ...layoutVariables }}>
            <div className="h-10 w-full shrink-0" style={{ backgroundColor: '#0B0F4E' }} />
            <header className="z-50 flex flex-col shadow-md border-b border-white/10 relative" style={{ backgroundColor: '#4B528C' }}>
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}
                <div className="px-5 pt-3 pb-3 flex items-center justify-between gap-6 relative">
                    <div className={`flex-1 max-w-[175px] bg-white/80 rounded-full h-8 flex items-center px-4 gap-2 relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}>
                        <Icon icon="lucide:search" className="text-[#575C9C] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/70 text-sm outline-none w-full font-medium"
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
                </div>
                <div className="px-6 py-3.5 flex items-center justify-between bg-[#4B528C] text-white/90 relative">
                    <button onClick={() => setShowTOC(true)} className="active:scale-90 transition-transform"><Icon icon="ph:list-bold" className="w-[1.1rem] h-[1.1rem]" /></button>
                    <button onClick={() => setShowRadialThumbnails(!showRadialThumbnails)} className="active:scale-90 transition-transform"><Icon icon="ph:squares-four-fill" className="w-[1.1rem] h-[1.1rem]" /></button>
                    <button onClick={() => setShowNotesMenu(!showNotesMenu)} className="active:scale-90 transition-transform"><Icon icon="ph:file-plus-fill" className="w-[1.1rem] h-[1.1rem]" /></button>
                    <button onClick={() => setShowBookmarkMenu(!showBookmarkMenu)} className="active:scale-90 transition-transform"><Icon icon="ph:bookmark-simple-fill" className="w-[1.1rem] h-[1.1rem]" /></button>
                    <button onClick={() => setShowThumbnailBar(true)} className="active:scale-90 transition-transform"><Icon icon="ph:image-fill" className="w-[1.1rem] h-[1.1rem]" /></button>
                    <button onClick={() => setShowProfilePopup(true)} className="active:scale-90 transition-transform"><Icon icon="ph:user-fill" className="w-[1.1rem] h-[1.1rem]" /></button>
                    <button onClick={() => handleShare()} className="active:scale-90 transition-transform"><Icon icon="ph:share-network-fill" className="w-[1.1rem] h-[1.1rem]" /></button>
                    <button onClick={() => handleDownload()} className="active:scale-90 transition-transform"><Icon icon="ph:download-fill" className="w-[1.1rem] h-[1.1rem]" /></button>
                </div>

                {/* Radial Thumbnail Dial for Mobile Layout 2 */}
                <AnimatePresence>
                    {showRadialThumbnails && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-[100%] left-0 right-0 z-[100] flex items-start justify-center pointer-events-none h-0"
                            onWheel={handleRadialWheel}
                        >
                            {/* Radial Backdrop - Use fixed to cover entire screen */}
                            <div className="fixed inset-0 bg-transparent z-[-1] pointer-events-auto" onClick={() => setShowRadialThumbnails(false)} />

                            {/* Semi-Circle Dial Base - Centered at the top */}
                            <div
                                className="relative w-full max-w-[380px] pointer-events-auto cursor-ns-resize"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg
                                    width="100%"
                                    viewBox="0 0 379 204"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="drop-shadow-[0_8px_25px_rgba(0,0,0,0.2)]"
                                    style={{ transform: 'translateY(-15px)' }}
                                >
                                    {/* Glassy Ring Base from SVG */}
                                    <path
                                        d="M6.33815e-07 0.500001C7.02785e-05 -104.158 84.8421 -189 189.5 -189C294.158 -189 379 -104.158 379 0.499985C379 105.158 294.158 190 189.5 190C84.8421 190 5.20856e-06 105.158 6.33815e-07 0.500001ZM50.998 0.500976C50.9982 76.9922 113.007 139.001 189.498 139.001C265.989 139.001 327.998 76.9923 327.998 0.500964C327.998 -75.9905 265.989 -137.999 189.498 -137.999C113.007 -137.999 50.998 -75.9904 50.998 0.500976Z"
                                        fill="white"
                                        fillOpacity="0.4"
                                        className="backdrop-blur-3xl"
                                    />

                                    {/* Rotatable Segment Container */}
                                    <g
                                        style={{
                                            transformOrigin: '189.5px 0.5px',
                                            transform: `rotate(${radialScroll}deg)`,
                                            transition: 'transform 0.7s cubic-bezier(0.15, 0.85, 0.35, 1)',
                                        }}
                                    >
                                        {spreads.map((spread, idx) => {
                                            const isActivePage = spread.indices.includes(currentPage);
                                            const isHovered = hoveredIdx === idx;
                                            const isActive = isActivePage || isHovered;

                                            const spacing = spreads.length > 1 ? Math.min(22, 160 / (spreads.length - 1)) : 22;
                                            const totalSpan = (spreads.length - 1) * spacing;
                                            const initialAngle = (idx * spacing) - (totalSpan / 2);

                                            return (
                                                <g
                                                    key={idx}
                                                    style={{ transformOrigin: '189.5px 0.5px', transform: `rotate(${initialAngle}deg)` }}
                                                    className="cursor-pointer pointer-events-auto"
                                                    onMouseEnter={() => setHoveredIdx(idx)}
                                                    onMouseLeave={() => setHoveredIdx(null)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPageClick(spread.indices[0]);
                                                    }}
                                                >
                                                    <g style={{ transformOrigin: '189.5px 0.5px', transform: 'rotate(-180deg) scale(1.1)' }}>
                                                        <path
                                                            d="M162.502 181.278C158.736 180.726 156.318 177.007 157.27 173.322L163.549 149.007C164.34 145.948 167.222 143.912 170.374 144.133C180.163 144.819 187.386 144.87 197.242 144.407C200.542 144.251 203.462 146.56 204.02 149.816L208.333 175.024C208.964 178.716 206.342 182.184 202.612 182.513C188.321 183.77 178.434 183.616 162.502 181.278Z"
                                                            fill={isActive ? '#3E4491' : '#4B528C'}
                                                            className="transition-colors duration-500"
                                                            style={{ transformOrigin: '189.5px 0.5px', transform: 'scale(1)' }}
                                                        />
                                                        <text
                                                            x="189.5"
                                                            y="164"
                                                            fill="white"
                                                            fontSize="5.5"
                                                            fontWeight="bold"
                                                            textAnchor="middle"
                                                            className="select-none pointer-events-none"
                                                            style={{ transformOrigin: '189.5px 164px', transform: 'rotate(90deg)' }}
                                                        >
                                                            {spread.label}
                                                        </text>
                                                    </g>
                                                </g>
                                            );
                                        })}
                                    </g>
                                </svg>

                                {/* Center Preview Tooltip */}
                                {(() => {
                                    const previewSpread = hoveredIdx !== null ? spreads[hoveredIdx] : spreads[activeSpreadIdx];
                                    if (!previewSpread) return null;
                                    return (
                                        <div className="absolute top-[4px] left-1/2 -translate-x-1/2 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 pointer-events-none z-[120]">
                                            <div className="w-[100px] h-[68px] bg-white rounded-md shadow-xl p-1 flex items-center justify-center gap-0.5 border border-gray-100/50">
                                                {previewSpread.pages.map((p, pIdx) => (
                                                    <div key={pIdx} className="flex-1 h-full bg-gray-50 overflow-hidden relative shadow-inner flex justify-center items-center rounded-xs">
                                                        <PageThumbnail html={p?.html || p?.content} index={previewSpread.indices[pIdx]} scale={0.12} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="w-2.5 h-2.5 bg-white rotate-45 -translate-y-1.5 shadow-md border-b border-r border-gray-100/50 rounded-xs" />
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>



            <div className="flex-1 relative overflow-hidden flex flex-col bg-[#BDC3D9]">
                <div className="absolute top-4 right-4 flex items-center gap-0.5 bg-white/95 backdrop-blur-md rounded-lg px-1 py-1 z-30 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-[#575C9C] font-semibold text-[9px] border border-white/50">
                    <div className="flex items-center gap-0.5">
                        <button onClick={() => setCurrentZoom(prev => Math.max(0.4, prev - 0.1))} className="w-3.5 h-3.5 flex items-center justify-center rounded-sm hover:bg-gray-100 active:scale-75 transition-all"><Icon icon="lucide:minus" className="w-2.5 h-2.5" /></button>
                        <span className="min-w-[24px] text-center">{Math.round(currentZoom * 100)}%</span>
                        <button onClick={() => setCurrentZoom(prev => Math.min(2.0, prev + 0.1))} className="w-3.5 h-3.5 flex items-center justify-center rounded-sm hover:bg-gray-100 active:scale-75 transition-all"><Icon icon="lucide:plus" className="w-2.5 h-2.5" /></button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                    <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 z-[40] text-[#4B528C] active:scale-90 transition-all cursor-pointer"><Icon icon="lucide:chevron-left" className="w-14 h-14" /></button>
                    <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 z-[40] text-[#4B528C] active:scale-90 transition-all cursor-pointer"><Icon icon="lucide:chevron-right" className="w-14 h-14" /></button>
                    <div className="transition-transform duration-500 ease-out" style={{ transform: `scale(${currentZoom * 0.9})`, transformOrigin: 'center center' }}><div className="bg-white shadow-2xl">{children}</div></div>
                </div>
            </div>

            <footer className="z-50 px-6 pt-3 pb-5 flex flex-col gap-2 shadow-2xl border-t border-white/10" style={{ backgroundColor: '#4B528C' }}>
                <div className="flex justify-center items-center gap-2 px-4">
                    <div className="h-1.5 w-8 bg-white rounded-full cursor-pointer" onClick={() => onPageClick(0)} />
                    <div className="flex items-center gap-2">
                        {[...Array(14)].map((_, i) => {
                            const dotPage = Math.floor((i / 13) * (pages.length - 1));
                            return <div key={i} className={`h-1.5 w-1.5 rounded-full cursor-pointer transition-all ${currentPage >= dotPage ? 'bg-white opacity-100' : 'bg-white/40'}`} onClick={() => onPageClick(dotPage)} />;
                        })}
                    </div>
                </div>
                <div className="flex items-center justify-between text-white/90 px-2">
                    <button onClick={() => setShowSoundPopup(true)} className="active:scale-90 transition-transform cursor-pointer"><Icon icon="ph:music-notes-simple-bold" className="w-5 h-5" /></button>
                    <div className="flex items-center gap-12">
                        <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="active:scale-90 transition-transform cursor-pointer"><Icon icon="ph:skip-back-fill" className="w-4 h-4" /></button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="active:scale-90 transition-transform cursor-pointer"><Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-4 h-4" /></button>
                        <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="active:scale-90 transition-transform cursor-pointer"><Icon icon="ph:skip-forward-fill" className="w-4 h-4" /></button>
                    </div>
                    <button onClick={handleFullScreen} className="active:scale-90 transition-transform cursor-pointer"><Icon icon="ph:corners-out-bold" className="w-5 h-5" /></button>
                </div>
            </footer>
            {renderPopups()}
        </div>
    );
};

export default MobileLayout2;
