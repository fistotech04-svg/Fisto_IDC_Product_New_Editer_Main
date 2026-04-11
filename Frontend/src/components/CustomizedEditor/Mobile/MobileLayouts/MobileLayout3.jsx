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
        className="flex items-center gap-2 px-2.5 py-1 hover:bg-white/10 active:bg-white/20 transition-colors text-left"
    >
        <Icon icon={icon} className="w-[14px] h-[14px] text-white/90" />
        <span className="text-white text-[11px] font-medium">{label}</span>
    </button>
);

const MobileLayout3 = ({
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
    setShowNotesMenu,
    currentZoom,
    setCurrentZoom
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const scrollRef = useRef(null);
    const progressRef = useRef(null);
    const [mobileLocalZoom, setMobileLocalZoom] = useState(currentZoom || 1);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState([]);
    const [showLocalNotesMenu, setShowLocalNotesMenu] = useState(false);
    const [showLocalBookmarkMenu, setShowLocalBookmarkMenu] = useState(false);
    const [showHeaderBookmarkMenu, setShowHeaderBookmarkMenu] = useState(false);
    const [showHeaderNotesMenu, setShowHeaderNotesMenu] = useState(false);

    const handleZoomIn = () => {
        setMobileLocalZoom(prev => Math.min(prev + 0.2, 2.5));
    };
    const handleZoomOut = () => {
        setMobileLocalZoom(prev => Math.max(prev - 0.2, 0.5));
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
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setCanScrollLeft(scrollTop > 5);
            setCanScrollRight(scrollTop + clientHeight < scrollHeight - 5);
            setIsOverflowing(scrollHeight > clientHeight);

            const containerRect = scrollRef.current.getBoundingClientRect();
            const items = scrollRef.current.querySelectorAll('.thumbnail-item');
            const visible = [];
            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const index = parseInt(item.getAttribute('data-index'));
                if (rect.bottom > containerRect.top + 1 && rect.top < containerRect.bottom - 1) {
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
                top: direction === 'up' ? -amount : amount,
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
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="absolute right-3 z-[110] w-[84px] pointer-events-auto"
                            style={{ top: isLandscape ? '92px' : '125px', bottom: isLandscape ? '55px' : '75px' }}
                        >
                            <div
                                className="w-full h-full bg-white rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden py-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    className={`shrink-0 h-8 w-full flex items-center justify-center text-[#575C9C] transition-opacity ${!canScrollLeft ? 'opacity-30 cursor-default' : 'opacity-100'}`}
                                    onClick={() => scroll('up')}
                                >
                                    <Icon icon="lucide:chevron-up" className="w-6 h-6 stroke-[2.5px]" />
                                </button>
                                <div
                                    ref={scrollRef}
                                    onScroll={checkScroll}
                                    className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center gap-2.5 px-[7px] scroll-smooth py-1"
                                >
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        return (
                                            <div
                                                key={idx}
                                                data-index={idx}
                                                className={`thumbnail-item shrink-0 flex flex-col items-center w-full gap-[3px] p-[6px] pb-1.5 rounded-[8px] transition-all duration-300 ${isSelected ? 'ring-2 ring-[#575C9C]/20 shadow-sm scale-[1.02]' : ''}`}
                                                style={{
                                                    backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', isSelected ? '0.75' : '0.6')
                                                }}
                                                onClick={() => onPageClick(spread.indices[0])}
                                            >
                                                <div className="bg-white rounded-[3px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex gap-[0.5px] transition-all duration-300 w-full aspect-[4/3]">
                                                    {spread.pages.map((page, pIdx) => (
                                                        <div key={pIdx} className="flex-1 h-full bg-white overflow-hidden transition-all duration-300 flex items-center justify-center">
                                                            <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={isSelected ? 0.09 : 0.08} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-medium text-white tracking-wide truncate w-full text-center mt-0.5 opacity-90">
                                                    {spread.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    className={`shrink-0 h-8 w-full flex items-center justify-center text-[#575C9C] transition-opacity ${!canScrollRight ? 'opacity-30 cursor-default' : 'opacity-100'}`}
                                    onClick={() => scroll('down')}
                                >
                                    <Icon icon="lucide:chevron-down" className="w-6 h-6 stroke-[2.5px]" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
                {showMoreMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[150] bg-transparent pointer-events-auto"
                            onClick={() => { setShowMoreMenu(false); setShowLocalNotesMenu(false); setShowLocalBookmarkMenu(false); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`absolute ${isLandscape ? 'bottom-12 right-1/2 translate-x-1/2' : 'top-[4.5rem] right-6'} w-[170px] rounded-xl shadow-2xl z-[160] overflow-hidden border border-white/10 bg-[#575c9c]/90 backdrop-blur-md pointer-events-auto`}
                        >
                            <div className="flex flex-col p-1.5 gap-1">
                                <MenuBtn icon="lucide:list" label="Table of Contents" onClick={() => { setShowTOC(true); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:layout-grid" label="Thumbnails" onClick={() => { setShowThumbnailBar(prev => !prev); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:file-text-plus" label="Add Notes" onClick={() => { setShowLocalNotesMenu(prev => !prev); setShowLocalBookmarkMenu(false); if (isLandscape) setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:bookmark" label="Bookmarks" onClick={() => { setShowLocalBookmarkMenu(prev => !prev); setShowLocalNotesMenu(false); if (isLandscape) setShowMoreMenu(false); }} />
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
                {showTOC && (
                    <TableOfContentsPopup
                        onClose={() => setShowTOC(false)}
                        settings={settings.tocSettings || settings.toc}
                        activeLayout={activeLayout || 3}
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
                        className="rounded-2xl shadow-xl z-[170] overflow-hidden border border-white/20 pointer-events-auto"
                        style={{
                            ...(isLandscape ? { bottom: '30px', right: '108px' } : { top: '9.5rem', left: '4.5rem' }),
                            width: '110px',
                            backgroundColor: getLayoutColorRgba('dropdown-bg', '212, 193, 125', '1')
                        }}
                    >
                        <div className="flex flex-col py-0.5">
                            <button
                                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 transition-colors text-left w-full group"
                                onClick={() => { setShowAddNotesPopup(true); setShowLocalNotesMenu(false); setShowMoreMenu(false); }}
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                            >
                                <Icon icon="fluent:document-add-24-filled" className="w-[15px] h-[15px] group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold" style={{ opacity: 'var(--dropdown-text-opacity, 1)' }}>Add Notes</span>
                            </button>
                            <div className="h-[1px] bg-white/10 w-[85%] mx-auto" />
                            <button
                                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 transition-colors text-left w-full group"
                                onClick={() => { setShowNotesViewer(true); setShowLocalNotesMenu(false); setShowMoreMenu(false); }}
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                            >
                                <Icon icon="fluent:eye-tracking-24-filled" className="w-[15px] h-[15px] group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold" style={{ opacity: 'var(--dropdown-text-opacity, 1)' }}>View Notes</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
            {/* Mobile Portrait Bookmark Dropdown - New Landscape Style */}
            <AnimatePresence>
                {!isLandscape && showHeaderBookmarkMenu && (
                    <>
                        <div className="absolute inset-0 z-[165] bg-transparent pointer-events-auto" onClick={() => setShowHeaderBookmarkMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute z-[170] flex flex-col overflow-hidden rounded-lg shadow-2xl border border-gray-100 pointer-events-auto"
                            style={{ bottom: '4.5rem', left: '1.25rem', width: '120px', backgroundColor: '#FFFFFF' }}
                        >
                            <div className="flex flex-col py-0.5">
                                <button
                                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-black/5 transition-colors text-left w-full"
                                    onClick={(e) => { e.stopPropagation(); setShowAddBookmarkPopup(true); setShowHeaderBookmarkMenu(false); }}
                                >
                                    <Icon icon="fluent:bookmark-add-24-filled" className="w-3.5 h-3.5 text-[#3E4491]" />
                                    <span className="text-[#3E4491] text-[10px] font-bold">Add Bookmark</span>
                                </button>
                                <div className="h-[1px] bg-black/5 w-full mx-auto" />
                                <button
                                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-black/5 transition-colors text-left w-full"
                                    onClick={(e) => { e.stopPropagation(); setShowViewBookmarkPopup(true); setShowHeaderBookmarkMenu(false); }}
                                >
                                    <Icon icon="lucide:view" className="w-3.5 h-3.5 text-[#3E4491]" />
                                    <span className="text-[#3E4491] text-[10px] font-bold">View Bookmark</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {showAddBookmarkPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <AddBookmarkPopup onClose={() => setShowAddBookmarkPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddBookmark={onAddBookmark} isSidebarOpen={false} bookmarkSettings={bookmarkSettings} isMobile={true} activeLayout={3} isLandscape={isLandscape} />
                </div>
            )}
            {showAddNotesPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <AddNotesPopup onClose={() => setShowAddNotesPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddNote={onAddNote} isSidebarOpen={false} isMobile={true} activeLayout={3} isLandscape={isLandscape} />
                </div>
            )}
            {showNotesViewer && (
                <NotesViewerPopup onClose={() => setShowNotesViewer(false)} notes={notes} isSidebarOpen={false} isMobile={true} />
            )}
            {showViewBookmarkPopup && (
                <ViewBookmarkPopup onClose={() => setShowViewBookmarkPopup(false)} bookmarks={bookmarks?.filter(b => b.layoutId === 3)} onDelete={onDeleteBookmark} onUpdate={onUpdateBookmark} onNavigate={(pageIndex) => { onPageClick(pageIndex); setShowViewBookmarkPopup(false); }} activeLayout={3} isMobile={true} isLandscape={isLandscape} />
            )}
            {showProfilePopup && (
                <ProfilePopup 
                    onClose={() => setShowProfilePopup(false)} 
                    profileSettings={profileSettings} 
                    activeLayout={3} 
                    isMobile={true} 
                    isLandscape={isLandscape} 
                />
            )}
            <Sound isOpen={showSoundPopup} onClose={() => setShowSoundPopup(false)} activeLayout={3} otherSetupSettings={otherSetupSettings} onUpdateOtherSetup={onUpdateOtherSetup} isMuted={isMuted} setIsMuted={setIsMuted} isFlipMuted={isFlipMuted} setIsFlipMuted={setIsFlipMuted} flipTrigger={flipTrigger} settings={settings} isMobile={true} isLandscape={isLandscape} />
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
            <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#DADBE8]" style={{ ...layoutVariables }}>
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}
                {/* Header with Search and All Icons */}
                <header className="z-[100] h-11 mt-1.5 flex items-center justify-between px-6 shrink-0 shadow-lg" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}>

                    {/* Left: Search Bar */}
                    <div className={`flex items-center gap-4 flex-nowrap ml-4 ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}>
                        <div className="relative w-[130px] mt-1">
                            <div className="rounded-full px-3 h-[26px] flex items-center gap-2 shadow-inner border border-white/10 backdrop-blur-md"
                                style={{ backgroundColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '1') }}
                            >
                                <Icon icon="lucide:search" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent text-[10px] outline-none w-full font-medium"
                                    style={{ color: getLayoutColor('search-text-v1', '#575C9C'), opacity: 'var(--search-text-v1-opacity, 1)' }}
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
                                <style>{`
                                    input::placeholder {
                                        color: ${getLayoutColor('search-text-v1', '#575C9C')} !important;
                                        opacity: var(--search-text-v1-opacity, 0.7) !important;
                                    }
                                `}</style>
                            </div>
                            {/* Recommendations Dropdown */}
                            <AnimatePresence>
                                {showSuggestions && recommendations.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-full left-0 mt-1 w-[160px] rounded-lg shadow-2xl border border-white/10 z-[100] overflow-hidden"
                                        style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}
                                    >
                                        <div className="flex flex-col py-1">
                                            {recommendations.map((rec, idx) => (
                                                <button
                                                    key={idx}
                                                    className="flex items-center justify-between px-3 py-1.5 hover:bg-black/5 transition-colors"
                                                    style={{ color: getLayoutColor('dropdown-text', '#575C9C'), opacity: 'var(--dropdown-text-opacity, 1)' }}
                                                    onClick={() => {
                                                        onPageClick(rec.pageNumber - 1);
                                                        setRecommendations([]);
                                                        setShowSuggestions(false);
                                                        setLocalSearchQuery(rec.word);
                                                    }}
                                                >
                                                    <span className="text-[10px] font-medium">{rec.word}</span>
                                                    <span className="text-[9px] opacity-60 font-bold tabular-nums">Pg {rec.pageNumber.toString().padStart(2, '0')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Center: Top Row Icons */}
                    <div className="flex items-center gap-3 px-4 flex-nowrap">
                        <button onClick={() => { setShowTOC(true); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }} className="hover:opacity-70 transition-all hover:scale-110 p-0.5" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="fluent:text-bullet-list-24-filled" className="w-[16px] h-[16px]" />
                        </button>
                        <button onClick={() => { setShowThumbnailBar(prev => !prev); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }} className="hover:opacity-70 transition-all hover:scale-110 p-0.5" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="ph:squares-four-fill" className="w-[17px] h-[17px]" />
                        </button>
                        <div className="relative flex items-center justify-center min-w-[28px] h-full" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowHeaderNotesMenu(!showHeaderNotesMenu); setShowHeaderBookmarkMenu(false); }}
                                className={`hover:opacity-70 transition-all hover:scale-110 p-0.5 rounded-md ${showHeaderNotesMenu ? 'bg-white/20' : ''}`}
                                style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                            >
                                <Icon icon="material-symbols-light:add-notes" className="w-[18px] h-[18px]" />
                            </button>

                            {/* Notes Dropdown - Landscape Header */}
                            <AnimatePresence>
                                {showHeaderNotesMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                        className="absolute top-full mt-2 w-[110px] rounded-2xl shadow-2xl border border-white/20 z-[220] overflow-hidden"
                                        style={{ left: '50%', transform: 'translateX(-58%)', backgroundColor: getLayoutColorRgba('dropdown-bg', '212, 193, 125', '1') }}
                                    >
                                        <div className="flex flex-col py-0.5">
                                            <button
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/10 transition-colors text-left group"
                                                onClick={(e) => { e.stopPropagation(); setShowAddNotesPopup(true); setShowHeaderNotesMenu(false); }}
                                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                            >
                                                <Icon icon="fluent:document-add-24-filled" className="w-[15px] h-[15px] group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold" style={{ opacity: 'var(--dropdown-text-opacity, 1)' }}>Add Notes</span>
                                            </button>
                                            <div className="h-[1px] bg-white/10 w-[85%] mx-auto" />
                                            <button
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/10 transition-colors text-left group"
                                                onClick={(e) => { e.stopPropagation(); setShowNotesViewer(true); setShowHeaderNotesMenu(false); }}
                                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                            >
                                                <Icon icon="fluent:eye-tracking-24-filled" className="w-[15px] h-[15px] group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold" style={{ opacity: 'var(--dropdown-text-opacity, 1)' }}>View Notes</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="relative flex items-center justify-center min-w-[28px] h-full" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowHeaderBookmarkMenu(!showHeaderBookmarkMenu); setShowLocalBookmarkMenu(false); }}
                                className={`hover:opacity-70 transition-all hover:scale-110 p-0.5 rounded-md ${showHeaderBookmarkMenu ? 'bg-white/20' : ''}`}
                                style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                            >
                                <Icon icon="fluent:bookmark-24-filled" className="w-[16px] h-[16px]" />
                            </button>

                            {/* Bookmark Dropdown - Landscape Header */}
                            <AnimatePresence>
                                {showHeaderBookmarkMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                        className="absolute top-full mt-2 w-[120px] bg-white rounded-lg shadow-2xl border border-gray-100 z-[220] overflow-hidden"
                                        style={{ left: '50%', transform: 'translateX(-58%)' }}
                                    >
                                        <div className="flex flex-col py-0.5">
                                            <button
                                                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-black/5 transition-colors text-left"
                                                onClick={(e) => { e.stopPropagation(); setShowAddBookmarkPopup(true); setShowHeaderBookmarkMenu(false); }}
                                            >
                                                <Icon icon="fluent:bookmark-add-24-filled" className="w-3.5 h-3.5 text-[#3E4491]" />
                                                <span className="text-[10px] font-bold text-[#3E4491]">Add Bookmark</span>
                                            </button>
                                            <div className="h-[1px] bg-black/5 w-full mx-auto" />
                                            <button
                                                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-black/5 transition-colors text-left"
                                                onClick={(e) => { e.stopPropagation(); setShowViewBookmarkPopup(true); setShowHeaderBookmarkMenu(false); }}
                                            >
                                                <Icon icon="lucide:view" className="w-3.5 h-3.5 text-[#3E4491]" />
                                                <span className="text-[10px] font-bold text-[#3E4491]">View Bookmark</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button onClick={() => { setShowThumbnailBar(prev => !prev); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }} className="hover:opacity-70 transition-all hover:scale-110 p-0.5" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="clarity:image-gallery-solid" className="w-[16px] h-[16px]" />
                        </button>
                        <button onClick={() => { setShowSoundPopup(true); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }} className="hover:opacity-70 transition-all hover:scale-110 p-0.5" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: isMuted ? '0.3' : 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="solar:music-notes-bold" className="w-[16px] h-[16px]" />
                        </button>
                        <button onClick={() => { setShowProfilePopup(true); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }} className="hover:opacity-70 transition-all hover:scale-110 p-0.5" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="fluent:person-24-filled" className="w-[16px] h-[16px]" />
                        </button>
                        <button onClick={() => { handleShare(); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }} className="hover:opacity-70 transition-all hover:scale-110 p-0.5" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="majesticons:share" className="w-[16px] h-[16px]" />
                        </button>
                        <button onClick={() => { handleDownload(); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }} className="hover:opacity-70 transition-all hover:scale-110 p-0.5" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="meteor-icons:download" className="w-[16px] h-[16px]" />
                        </button>
                        <button onClick={() => { handleFullScreen(); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }} className="hover:opacity-70 transition-all hover:scale-110 p-0.5" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}>
                            <Icon icon="lucide:fullscreen" className="w-[16px] h-[16px]" />
                        </button>
                    </div>

                    {/* Right: Brand Logo / Avatar */}
                    <div className="flex items-center justify-end flex-shrink-0 mr-6 mt-1">
                        <div
                            className="flex items-center justify-center w-6 h-6 rounded-sm bg-white/20 overflow-hidden shadow-sm border border-white/20 cursor-pointer hover:bg-white/30 transition-colors"
                            onClick={() => { setShowProfilePopup(true); setShowHeaderBookmarkMenu(false); setShowHeaderNotesMenu(false); }}
                        >
                            {settings?.brandingProfile?.logo && logoSettings?.src ? (
                                <img src={logoSettings.src} alt="Brand" className="w-full h-full object-cover" />
                            ) : profileSettings?.avatar ? (
                                <img src={profileSettings.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Icon icon="ph:user-fill" className="text-white/80 w-4 h-4" />
                            )}
                        </div>
                    </div>
                </header>

                {/* Book Name Bar */}
                <div className="h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#DADBE8' }}>
                    <span className="text-[#575C9C] text-[13px] font-bold opacity-80">{bookName}</span>
                </div>

                {/* Main Content */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    {/* Floating Interaction Widgets - Compact for Mobile Landscape */}
                    <div className="absolute right-[0.5vw] top-[1.5vh] flex flex-col gap-[1vh] z-[210]">
                        {/* View Interaction */}
                        <div className="w-[8vw] h-[3.5vh] bg-white rounded-[0.8vw] shadow-md flex items-center p-[0.3vw] gap-[0.4vh] cursor-pointer hover:shadow-lg transition-all border border-gray-100 group">
                            <div className="flex-shrink-0 w-[1vw] h-[1vw] flex items-center justify-center">
                                <Icon icon="ph:cursor-click" className="w-[0.8vw] h-[0.8vw] text-[#2D2D2D]" />
                            </div>
                            <span className="text-[0.4vw] font-normal text-[#2D2D2D] leading-[1.1] select-none">
                                interaction
                            </span>
                        </div>

                        {/* Floating Bookmark Widget with Dropdown */}
                        <div className="relative">
                            <div
                                className={`w-[8vw] h-[3.5vh] bg-white rounded-[0.8vw] shadow-md flex items-center p-[0.3vw] gap-[0.4vh] cursor-pointer hover:shadow-lg transition-all border border-gray-100 group relative ${showLocalBookmarkMenu ? 'bg-gray-50' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setShowLocalBookmarkMenu(!showLocalBookmarkMenu); setShowHeaderBookmarkMenu(false); }}
                            >
                                <span className="text-[0.4vw] font-normal text-[#2D2D2D] leading-[1.1] select-none z-10">
                                    Bookmark
                                </span>
                                <div className="absolute right-[0.2vw] top-[0.4vh]">
                                    <Icon icon="emojione:bookmark" className="w-[1.2vw] h-[1.2vw]" flip="horizontal" />
                                </div>
                            </div>

                            {/* Bookmark Dropdown - Floating Widget (Opens to the LEFT) */}
                            <AnimatePresence>
                                {showLocalBookmarkMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, x: 5 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, x: 5 }}
                                        className="absolute top-1/2 -translate-y-1/2 right-[110%] w-[115px] bg-white rounded-lg shadow-2xl border border-gray-100 z-[220] overflow-hidden"
                                    >
                                        <div className="flex flex-col py-0.5">
                                            <button
                                                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-black/5 transition-colors text-left"
                                                onClick={() => { setShowAddBookmarkPopup(true); setShowLocalBookmarkMenu(false); }}
                                            >
                                                <Icon icon="fluent:bookmark-add-24-filled" className="w-3.5 h-3.5 text-[#3E4491]" />
                                                <span className="text-[10px] font-bold text-[#3E4491]">Add Bookmark</span>
                                            </button>
                                            <div className="h-[1px] bg-black/5 w-full mx-auto" />
                                            <button
                                                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-black/5 transition-colors text-left"
                                                onClick={() => { setShowViewBookmarkPopup(true); setShowLocalBookmarkMenu(false); }}
                                            >
                                                <Icon icon="lucide:view" className="w-3.5 h-3.5 text-[#3E4491]" />
                                                <span className="text-[10px] font-bold text-[#3E4491]">View Bookmark</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Book Canvas - Unified transform to prevent scale/translation conflicts */}
                    <div className="transition-transform duration-500 ease-out flex items-center justify-center w-full h-full overflow-visible"
                        style={{ transform: `scale(${mobileLocalZoom * 0.28})`, transformOrigin: 'center center' }}>
                        <div
                            className="relative flex items-center justify-center"
                            style={{
                                transform: `translateX(${offset}px) translateY(-3vh)`,
                                transition: 'transform 0.5s ease-out'
                            }}
                        >
                            {children}
                        </div>
                    </div>

                    {/* Navigation Arrows - Edge positioned */}
                    <button
                        onClick={(e) => { e.stopPropagation(); bookRef.current?.pageFlip()?.flipPrev(); }}
                        className="absolute left-[6vw] top-1/2 -translate-y-1/2 w-[2.5vw] h-[2.5vw] flex items-center justify-center transition-all bg-black/10 hover:bg-black/20 rounded-full z-[300] shadow-md"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                    >
                        <Icon icon="lucide:chevron-left" className="w-[1.2vw] h-[1.2vw]" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); bookRef.current?.pageFlip()?.flipNext(); }}
                        className="absolute right-[6vw] top-1/2 -translate-y-1/2 w-[2.5vw] h-[2.5vw] flex items-center justify-center transition-all bg-black/10 hover:bg-black/20 rounded-full z-[300] shadow-md"
                        style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                    >
                        <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw]" />
                    </button>
                </div>

                {/* Footer - Positioned higher and more compact */}
                <footer className="h-10 flex items-center justify-between px-10 shrink-0 z-[110] relative mb-1.5" style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '62, 68, 145', '1') }}>
                    {/* Constant Progress Line Overlay at very bottom */}
                    <div className="absolute bottom-[2px] left-10 right-10 h-[2px] bg-white/20 overflow-hidden rounded-full pointer-events-none z-50">
                        <div
                            className="h-full bg-white transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    {/* Left: Empty spacer to maintain layout balance */}
                    <div className="flex-1 flex justify-start items-center">
                    </div>

                    {/* Center: Playback Control Group - Reduced Icon Sizes */}
                    <div className="flex-1 flex justify-center items-center gap-[3vw]">
                        <button
                            onClick={() => onPageClick(0)}
                            className="hover:scale-110 active:scale-90 transition-all cursor-pointer p-0.5"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                        >
                            <Icon icon="lucide:skip-back" className="w-[14px] h-[14px]" />
                        </button>
                        <button
                            onClick={() => setIsPlaying(!isAutoFlipping)}
                            className="hover:scale-110 active:scale-90 transition-all cursor-pointer p-0.5"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                        >
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-[18px] h-[18px]" />
                        </button>
                        <button
                            onClick={() => onPageClick(pages.length - 1)}
                            className="hover:scale-110 active:scale-90 transition-all cursor-pointer p-0.5"
                            style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                        >
                            <Icon icon="lucide:skip-forward" className="w-[14px] h-[14px]" />
                        </button>
                    </div>

                    {/* Right: Zoom Pill - Fixed functionality with StopPropagation */}
                    <div className="flex-1 flex justify-end items-center">
                        <div className="bg-[#FFFFFF] rounded-[3px] pl-2 pr-1 py-0.5 flex items-center gap-[0.5vw] shadow-sm h-8 relative z-20">
                            <div className="flex items-center gap-[0.2vw]">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                                    className="text-[#575C9C] hover:scale-110 active:scale-90 cursor-pointer p-1.5 flex items-center justify-center relative z-30"
                                >
                                    <Icon icon="lucide:zoom-out" className="w-[16px] h-[16px]" />
                                </button>
                                <span className="font-bold text-[10px] tabular-nums select-none min-w-[32px] text-center text-[#575C9C]">
                                    {Math.round(mobileLocalZoom * 100)}%
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                                    className="text-[#575C9C] hover:scale-110 active:scale-90 cursor-pointer p-1.5 flex items-center justify-center relative z-30"
                                >
                                    <Icon icon="lucide:zoom-in" className="w-[16px] h-[16px]" />
                                </button>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMobileLocalZoom(1); }}
                                className="text-white text-[9px] font-bold px-2 py-1.5 rounded-[2px] ml-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm relative z-30"
                                style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </footer>

                {renderPopups()}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative" style={{ ...layoutVariables }}>
            {/* Top Area - Notch Spacer */}
            <div className="h-10 w-full shrink-0" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }} />

            {/* Header - Double Row with Search and Toolbar */}
            <header className="z-50 flex flex-col relative" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}>
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}
                {/* Search Row */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
                    <div className={`flex-[0.85] max-w-[210px] bg-[#D7D8E8] rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-inner relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}>
                        <Icon icon="lucide:search" className="text-[#575C9C] w-[12px] h-[12px] opacity-70" />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/60 text-[13px] outline-none w-full font-semibold"
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

                    {/* Portrait Header Branding Logo - Moved next to Search */}
                    <div className="flex items-center justify-end flex-shrink-0 mr-4">
                        <div
                            className="flex items-center justify-center w-7 h-7 rounded-sm bg-white/20 overflow-hidden shadow-sm border border-white/20 cursor-pointer hover:bg-white/30 transition-colors"
                            onClick={() => setShowProfilePopup(true)}
                        >
                            {settings?.brandingProfile?.logo && logoSettings?.src ? (
                                <img src={logoSettings.src} alt="Brand" className="w-full h-full object-cover" />
                            ) : profileSettings?.avatar ? (
                                <img src={profileSettings.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Icon icon="ph:user-fill" className="text-white/80 w-5 h-5" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Toolbar Row */}
                <div className="px-6 py-3 flex items-center justify-between text-white/90" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}>
                    <button onClick={() => setShowTOC(true)} className="active:scale-90 transition-transform"><Icon icon="ph:list-bold" className="w-[1.2rem] h-[1.2rem]" /></button>
                    <button onClick={() => setShowThumbnailBar(prev => !prev)} className="active:scale-90 transition-transform"><Icon icon="ph:squares-four-fill" className="w-[1.2rem] h-[1.2rem]" /></button>
                    <button onClick={() => setShowLocalNotesMenu(!showLocalNotesMenu)} className="active:scale-90 transition-transform"><Icon icon="ph:file-plus-fill" className="w-[1.2rem] h-[1.2rem]" /></button>
                    <button onClick={() => setShowThumbnailBar(prev => !prev)} className="active:scale-90 transition-transform"><Icon icon="ph:image-fill" className="w-[1.2rem] h-[1.2rem]" /></button>
                    <button onClick={() => setShowSoundPopup(true)} className="active:scale-90 transition-transform"><Icon icon="solar:music-notes-bold" className="w-[1.21rem] h-[1.21rem]" /></button>
                    <button onClick={() => setShowProfilePopup(true)} className="active:scale-90 transition-transform"><Icon icon="ph:user-fill" className="w-[1.2rem] h-[1.2rem]" /></button>
                    <button onClick={() => handleShare()} className="active:scale-90 transition-transform"><Icon icon="ph:share-network-fill" className="w-[1.2rem] h-[1.2rem]" /></button>
                    <button onClick={() => handleDownload()} className="active:scale-90 transition-transform"><Icon icon="ph:download-fill" className="w-[1.2rem] h-[1.2rem]" /></button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col bg-[#BDC3D9]">
                {/* Book Info and Zoom Bar */}
                <div className="px-5 pt-4 flex items-center justify-between gap-1 h-8">
                    <span className="text-[#575C9C] text-[12px] font-extrabold truncate max-w-[65%] leading-tight flex-shrink">{bookName}</span>
                    <div className="flex items-center gap-0 bg-[#D7D8E8]/90 backdrop-blur-md rounded-md px-1 py-0.5 shadow-md border border-white/40 flex-shrink-0 overflow-hidden scale-[0.88] origin-right">
                        <button
                            onClick={() => setMobileLocalZoom(prev => Math.max(0.3, prev - 0.1))}
                            className="text-[#575C9C] hover:scale-110 active:scale-90 transition-all p-0 flex-shrink-0"
                        >
                            <Icon icon="lucide:zoom-out" className="w-[9px] h-[9px]" />
                        </button>
                        <span className="text-[#575C9C] font-extrabold text-[7.5px] min-w-[22px] text-center flex-shrink-0 ml-0.5">{Math.round(mobileLocalZoom * 100)}%</span>
                        <button
                            onClick={() => setMobileLocalZoom(prev => Math.min(2, prev + 0.1))}
                            className="text-[#575C9C] hover:scale-110 active:scale-90 transition-all p-0 flex-shrink-0"
                        >
                            <Icon icon="lucide:zoom-in" className="w-[9px] h-[9px]" />
                        </button>
                        <div className="w-[0.5px] h-1.5 bg-[#575C9C]/20 mx-0.5 flex-shrink-0" />
                        <button
                            onClick={() => setMobileLocalZoom(1)}
                            className="bg-white px-1 py-0.5 rounded-[1px] border border-[#575C9C]/20 text-[#575C9C] text-[7.5px] font-bold hover:bg-[#575C9C] hover:text-white transition-colors flex-shrink-0"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Flipbook with Navigation Arrows */}
                <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                    <button
                        onClick={() => onPageClick(Math.max(0, currentPage - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-[40] text-[#4B528C]/60 hover:text-[#4B528C] active:scale-90 transition-all cursor-pointer"
                    >
                        <Icon icon="lucide:chevron-left" className="w-10 h-10" />
                    </button>
                    <button
                        onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-[40] text-[#4B528C]/60 hover:text-[#4B528C] active:scale-90 transition-all cursor-pointer"
                    >
                        <Icon icon="lucide:chevron-right" className="w-10 h-10" />
                    </button>

                    <div className="transition-transform duration-500 ease-out" style={{ transform: `scale(${mobileLocalZoom * 0.95})`, transformOrigin: 'center center' }}>
                        <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-sm overflow-hidden">
                            {children}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <footer className="z-[100] flex flex-col pt-4 pb-7 relative" style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '62, 68, 145', '1') }}>
                <div className="flex items-center justify-between px-10 text-white mb-2">
                    <button onClick={() => { setShowHeaderBookmarkMenu(!showHeaderBookmarkMenu); setShowLocalBookmarkMenu(false); }} className="active:scale-90 transition-transform">
                        <Icon icon="ph:bookmark-simple-fill" className="w-[1.1rem] h-[1.1rem]" />
                    </button>

                    <div className="flex items-center gap-12">
                        <button onClick={() => onPageClick(0)} className="active:scale-90 transition-transform">
                            <Icon icon="ph:skip-back-fill" className="w-[1.1rem] h-[1.1rem]" />
                        </button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="active:scale-90 transition-transform">
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-[1.2rem] h-[1.2rem]" />
                        </button>
                        <button onClick={() => onPageClick(pages.length - 1)} className="active:scale-90 transition-transform">
                            <Icon icon="ph:skip-forward-fill" className="w-[1.1rem] h-[1.1rem]" />
                        </button>
                    </div>

                    <button onClick={handleFullScreen} className="active:scale-90 transition-transform">
                        <Icon icon="ph:corners-out-bold" className="w-[1.1rem] h-[1.1rem]" />
                    </button>
                </div>

                {/* Progress Bar Slider */}
                <div className="px-10 mt-2">
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

export default MobileLayout3;
