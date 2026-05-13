import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import AddBookmarkPopup from '../../popups/AddBookmarkPopup';
import AddNotesPopup from '../../popups/AddNotesPopup';
import NotesViewerPopup from '../../popups/NotesViewerPopup';
import ViewBookmarkPopup from '../../popups/ViewBookmarkPopup';
import ProfilePopup from '../../popups/ProfilePopup';
import Sound from '../../popups/Sound';
import Export from '../../popups/Export';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';

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
        <div className="w-full h-full relative overflow-hidden bg-white">
            <iframe
                className="absolute top-1/2 left-1/2 border-none pointer-events-none"
                srcDoc={srcDoc}
                title={`Thumb ${index}`}
                style={{
                    width: '400px',
                    height: '566px',
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center',
                    backgroundColor: 'white'
                }}
            />
        </div>
    );
});

const getLayoutColor = (id, defaultColor) => {
    return `var(--${id}, ${defaultColor})`;
};

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
};

const MobileLayout7 = (props) => {
    const {
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
        offset = 0,
        layoutColors = [],
    } = props;

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const progressRef = useRef(null);
    const scrollRef = useRef(null);

    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [localShowTOC, setLocalShowTOC] = useState(false);
    const [localShowProfile, setLocalShowProfile] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        if (showThumbnailBar && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [currentPage, showThumbnailBar]);

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
                {localShowTOC && (
                    <TableOfContentsPopup
                        onClose={() => setLocalShowTOC(false)}
                        settings={settings?.tocSettings}
                        activeLayout={7}
                        isMobile={true}
                        onNavigate={(pageIndex) => {
                            onPageClick(pageIndex);
                            setLocalShowTOC(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {showAddNotesPopup && (
                <AddNotesPopup
                    onClose={() => setShowAddNotesPopup(false)}
                    currentPageIndex={currentPage}
                    totalPages={pages.length}
                    onAddNote={onAddNote}
                    isSidebarOpen={false}
                    isMobile={true}
                    activeLayout={activeLayout}
                />
            )}
            {showNotesViewer && (
                <NotesViewerPopup
                    onClose={() => setShowNotesViewer(false)}
                    notes={notes}
                    isSidebarOpen={false}
                    isMobile={true}
                    activeLayout={7}
                />
            )}
            {showAddBookmarkPopup && (
                <AddBookmarkPopup
                    onClose={() => setShowAddBookmarkPopup(false)}
                    currentPageIndex={currentPage}
                    totalPages={pages.length}
                    onAddBookmark={onAddBookmark}
                    isSidebarOpen={false}
                    bookmarkSettings={bookmarkSettings}
                    isMobile={true}
                    activeLayout={7}
                />
            )}
            {showViewBookmarkPopup && (
                <ViewBookmarkPopup
                    onClose={() => setShowViewBookmarkPopup(false)}
                    bookmarks={bookmarks}
                    onDelete={onDeleteBookmark}
                    onUpdate={onUpdateBookmark}
                    onNavigate={(pageIndex) => {
                        onPageClick(pageIndex);
                        setShowViewBookmarkPopup(false);
                    }}
                    activeLayout={7}
                    isMobile={true}
                />
            )}
            {localShowProfile && (
                <ProfilePopup
                    onClose={() => setLocalShowProfile(false)}
                    profileSettings={settings?.profileSettings}
                    activeLayout={7}
                    isMobile={true}
                />
            )}
            <Sound
                isOpen={showSoundPopup}
                onClose={() => setShowSoundPopup(false)}
                activeLayout={activeLayout}
                otherSetupSettings={otherSetupSettings}
                onUpdateOtherSetup={onUpdateOtherSetup}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                isFlipMuted={isFlipMuted}
                setIsFlipMuted={setIsFlipMuted}
                flipTrigger={flipTrigger}
                settings={settings}
                isMobile={true}
            />

            {showExportPopup && (
                <Export
                    isOpen={true}
                    hideButton={true}
                    onClose={() => setShowExportPopup(false)}
                    pages={pages}
                    bookName={bookName}
                    isMobile={true}
                    currentPage={currentPage}
                />
            )}
            {showSharePopup && (
                <FlipbookSharePopup
                    onClose={() => setShowSharePopup(false)}
                    bookName={bookName}
                    url={window.location.href}
                    isMobile={true}
                />
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-[812px] w-[375px] overflow-hidden select-none relative bg-[#BDC3D9]" style={{ ...layoutVariables }}>
            {renderPopups()}

            {/* Notch Spacer - fills the area near the hardware notch with a dark status bar color */}
            <div className="shrink-0 h-10 z-50 bg-[#0B0F4E]" />

            {/* Header */}
            <header className="z-50 px-4 pt-0 pb-3 flex flex-col gap-3 shadow-sm relative shrink-0" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                <div className="flex items-center justify-between px-1">
                    <span className="text-white text-[13px] font-medium opacity-90 truncate flex-1">{bookName}</span>
                    <div className="flex items-center">
                        {settings?.brandingProfile?.logo && logoSettings?.src && (
                            <img
                                src={logoSettings.src}
                                alt="Logo"
                                className="h-4.5 w-auto transition-all mix-blend-screen"
                                style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                            />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-1">
                    {/* Menu Toggle Button */}
                    <button
                        className="flex items-center justify-center shrink-0 w-10 h-10 bg-white/20 rounded-lg border border-white/20 text-white transition-all active:scale-95"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Icon icon={isMenuOpen ? "lucide:x" : "lucide:menu"} className="w-6 h-6" />
                    </button>

                    <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 flex items-center gap-3 shadow-inner relative border border-white/10"
                    >
                        <Icon icon="lucide:search" className="text-white/70 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent text-white placeholder-white/60 text-[13px] outline-none w-full font-medium"
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
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-100 z-[100] overflow-hidden"
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
            </header>

            <div className="flex-1 relative flex overflow-hidden">
                {/* Vertical Toolbar on Left */}
                {isMenuOpen && (
                    <div
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 flex flex-col items-center justify-center gap-5 py-6 shadow-2xl z-40 rounded-xl"
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                    >
                        <button onClick={() => setShowThumbnails(!showThumbnails)} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="ph:squares-four-fill" className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={() => setLocalShowTOC(!localShowTOC)} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="fluent:text-bullet-list-24-filled" className="w-[18px] h-[18px]" />
                        </button>
                        <div className="relative flex items-center justify-center">
                            <button onClick={() => setShowNotesOptions(!showNotesOptions)} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="material-symbols-light:add-notes" className="w-5 h-5" />
                            </button>
                            <AnimatePresence>
                                {showNotesOptions && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="absolute left-full ml-3 bg-[#575C9C] rounded-[4px] shadow-2xl py-1 px-2 z-[170] flex flex-col gap-1 min-w-[110px] border border-white/10"
                                    >
                                        <button onClick={() => { setShowAddNotesPopup(true); setShowNotesOptions(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 transition-colors w-full text-left">
                                            <Icon icon="fluent:note-add-24-filled" className="w-3.5 h-3.5 text-white" />
                                            <span className="text-white text-[12px] font-medium whitespace-nowrap">Add Notes</span>
                                        </button>
                                        <button onClick={() => { setShowNotesViewer(true); setShowNotesOptions(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 transition-colors w-full text-left">
                                            <Icon icon="lucide:eye" className="w-3.5 h-3.5 text-white" />
                                            <span className="text-white text-[12px] font-medium whitespace-nowrap">View Notes</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="relative flex items-center justify-center">
                            <button onClick={() => setShowBookmarkOptions(!showBookmarkOptions)} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="fluent:bookmark-24-filled" className="w-[18px] h-[18px]" />
                            </button>
                            <AnimatePresence>
                                {showBookmarkOptions && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="absolute left-full ml-3 bg-[#575C9C] rounded-[4px] shadow-2xl py-1 px-2 z-[170] flex flex-col gap-1 min-w-[130px] border border-white/10"
                                    >
                                        <button onClick={() => { setShowAddBookmarkPopup(true); setShowBookmarkOptions(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 transition-colors w-full text-left">
                                            <Icon icon="fluent:bookmark-add-24-filled" className="w-3.5 h-3.5 text-white" />
                                            <span className="text-white text-[12px] font-medium whitespace-nowrap">Add Bookmark</span>
                                        </button>
                                        <button onClick={() => { setShowViewBookmarkPopup(true); setShowBookmarkOptions(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 transition-colors w-full text-left">
                                            <Icon icon="lucide:eye" className="w-3.5 h-3.5 text-white" />
                                            <span className="text-white text-[12px] font-medium whitespace-nowrap">View Bookmark</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button onClick={() => { if (props.setShowGalleryPopup) props.setShowGalleryPopup(true); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="clarity:image-gallery-solid" className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={() => setShowSoundPopup(true)} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="solar:music-notes-bold" className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={() => setLocalShowProfile(!localShowProfile)} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="fluent:person-24-filled" className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={() => handleShare()} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="mage:share-fill" className="w-[17px] h-[17px]" />
                        </button>
                        <button onClick={() => handleDownload()} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="meteor-icons:download" className="w-[17px] h-[17px]" />
                        </button>
                        <button onClick={() => handleFullScreen()} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="lucide:scan" className="w-[17px] h-[17px]" />
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col bg-[#BDC3D9]">
                    {/* Navigation Arrows */}
                    <button
                        className="absolute left-[2%] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 active:scale-90 transition-transform"
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                    >
                        <Icon icon="ph:caret-left-light" strokeWidth="4" className="w-8 h-8 opacity-70" />
                    </button>
                    <button
                        className="absolute right-[2%] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 active:scale-90 transition-transform"
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                    >
                        <Icon icon="ph:caret-right-light" strokeWidth="4" className="w-8 h-8 opacity-70" />
                    </button>

                    {/* Flipbook Canvas */}
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-white/20">
                        <div className="relative shadow-2xl">
                            <div className="transition-transform duration-300" style={{ transform: 'scale(0.85)', transformOrigin: 'center center' }}>
                                {children}
                            </div>
                        </div>
                    </div>

                    {/* Thumbnail Popup (Floating) */}
                    <AnimatePresence>
                        {showThumbnails && (
                            <motion.div
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="absolute right-4 top-[15%] bottom-0 w-[280px] z-[170] flex flex-col shadow-2xl rounded-t-[20px] overflow-hidden border border-white/20 bg-white/50 backdrop-blur-xl"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                            >
                                <div className="flex items-center justify-between px-5 py-4 border-b border-[#575C9C]/10 shrink-0">
                                    <span className="text-[16px] font-extrabold text-[#575C9C] tracking-tight">Thumbnails</span>
                                    <button onClick={() => setShowThumbnails(false)} className="bg-[#575C9C]/10 p-1.5 rounded-full hover:bg-[#575C9C]/20 transition-colors">
                                        <Icon icon="lucide:x" className="w-5 h-5 text-[#575C9C]" />
                                    </button>
                                </div>
                                <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-4">
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 items-start">
                                        {spreads.map((spread, idx) => {
                                            const isSelected = spread.indices.includes(currentPage);
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`bg-white rounded-lg flex flex-col cursor-pointer transition-all p-1.5 shadow-sm border ${isSelected ? 'border-[#575C9C] ring-1 ring-[#575C9C]/30 bg-[#575C9C]/5' : 'border-gray-100 hover:border-[#575C9C]/30'} ${idx % 2 !== 0 ? 'mt-8' : ''}`}
                                                    onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                                >
                                                    <div className="w-full aspect-[1.4/1] rounded-md overflow-hidden bg-gray-50 flex gap-0.5 border border-gray-50">
                                                        {spread.pages.map((page, pIdx) => (
                                                            <div key={pIdx} className="flex-1 h-full relative">
                                                                <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={0.12} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-center mt-1">
                                                        <span className={`text-[9px] font-bold ${isSelected ? 'text-[#575C9C]' : 'text-gray-400'}`}>
                                                            {spread.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <footer className="z-50 shrink-0 flex flex-col pt-3 pb-8 relative" style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}>
                {/* Row 1: Page info and Zoom */}
                <div className="flex items-center justify-between px-6 mb-5">
                    <div className="bg-white/30 rounded-full px-4 py-1.5 text-white text-[12px] font-bold border border-white/10 shadow-sm backdrop-blur-sm">
                        Page {currentPage + 1} / {pages.length}
                    </div>


                </div>

                {/* Row 2: Playback & Slider */}
                <div className="flex items-center px-6 gap-6 w-full">
                    <div className="flex items-center gap-6 shrink-0">
                        <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="active:scale-90 transition-transform text-white">
                            <Icon icon="lucide:skip-back" strokeWidth="3" className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="active:scale-90 transition-transform text-white">
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-8 h-8" />
                        </button>
                        <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="active:scale-90 transition-transform text-white">
                            <Icon icon="lucide:skip-forward" strokeWidth="3" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 flex items-center">
                        <div ref={progressRef} className="h-3 w-full rounded-full cursor-pointer relative overflow-hidden bg-white/20 border border-white/5"
                            onClick={handleProgressClick}>
                            <div
                                className="absolute left-0 top-0 h-full transition-all duration-300 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                                style={{ width: `${Math.max(1, progressPercentage)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default MobileLayout7;
