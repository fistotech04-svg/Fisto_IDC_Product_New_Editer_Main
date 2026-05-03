import React, { useState, useMemo, useRef, useEffect, Suspense, lazy } from 'react';
const Grid4Layout = lazy(() => import('../../Layouts/Grid4Layout'));
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

const getLayoutColor = (id, defaultColor) => {
    return `var(--${id}, ${defaultColor})`;
};

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
};

const MobileLayout4 = (props) => {
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
        isLandscape,
        offset = 0,
        layoutColors = [],
    } = props;
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const progressRef = useRef(null);
    const scrollRef = useRef(null);
    const [currentZoom, setCurrentZoom] = useState(0.5);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [responsiveScale, setResponsiveScale] = useState(1);
    const containerRef = useRef(null);

    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    // Responsive scaling logic for Mobile Landscape
    useEffect(() => {
        if (!isLandscape) {
            setResponsiveScale(1);
            return;
        }

        const updateScale = () => {
            if (containerRef.current) {
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;
                // Leave a tiny margin
                // Leave a better margin for full visibility - pulling top/bottom inside
                const safeH = ch * 0.85;
                const safeW = cw * 0.88;

                const designWidth = 1440;
                const designHeight = 900;
                const scaleX = safeW / designWidth;
                const scaleY = safeH / designHeight;
                setResponsiveScale(Math.min(scaleX, scaleY));
            }
        };

        const timer = setTimeout(updateScale, 300);
        window.addEventListener('resize', updateScale);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateScale);
        };
    }, [isLandscape]);

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


    if (isLandscape) {
        return (
            <div ref={containerRef} className="w-full h-full bg-[#DADBE8] relative flex items-start justify-start">
                <div
                    style={{
                        width: `${100 / responsiveScale}%`,
                        height: `${100 / responsiveScale}%`,
                        transform: `scale(${responsiveScale}) translateZ(0)`,
                        transformOrigin: 'left top',
                        marginLeft: '1vw',
                        flexShrink: 0,
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'antialiased',
                        textRendering: 'optimizeLegibility'
                    }}
                >
                    <Suspense fallback={
                        <div className="w-full h-full flex items-center justify-center bg-[#DADBE8]">
                            <div className="flex flex-col items-center gap-3">
                                <Icon icon="lucide:loader-2" className="w-8 h-8 text-[#575C9C] animate-spin" />
                                <span className="text-[#575C9C] text-sm font-bold">Scaling Layout...</span>
                            </div>
                        </div>
                    }>
                        <Grid4Layout
                            {...({
                                ...props,
                                children,
                                settings,
                                bookName,
                                searchQuery,
                                setSearchQuery,
                                handleQuickSearch,
                                setShowThumbnailBarMemo: setShowThumbnailBar,
                                setShowTOCMemo: setShowTOC,
                                setShowAddNotesPopupMemo: setShowAddNotesPopup,
                                setShowAddBookmarkPopupMemo: setShowAddBookmarkPopup,
                                setShowViewBookmarkPopup,
                                setShowNotesViewerMemo: setShowNotesViewer,
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
                                pagesCount: pages?.length || 0,
                                currentZoom,
                                setCurrentZoom,
                                onPageClick,
                                bookmarks,
                                notes,
                                onUpdateBookmark,
                                onDeleteBookmark,
                                profileSettings,
                                isSidebarOpen: false,
                                showViewBookmarkPopup,
                                activeLayout,
                                isTablet: false,
                                isMobile: false,
                                isMobileLandscape: true
                            })}
                        />

                        {/* Scaled Desktop-style Popups for Landscape Parity */}
                        <div className="absolute inset-0 pointer-events-none z-[5000]">
                            <AnimatePresence>
                                {showTOC && (
                                    <div className="pointer-events-auto">
                                        <TableOfContentsPopup
                                            onClose={() => setShowTOC(false)}
                                            settings={settings.tocSettings}
                                            activeLayout={activeLayout}
                                            isMobile={false}
                                            isLandscape={false}
                                            onNavigate={(pageIndex) => {
                                                onPageClick(pageIndex);
                                                setShowTOC(false);
                                            }}
                                            isSidebarOpen={false}
                                            layoutColors={layoutColors}
                                            isTablet={false}
                                            isMobileLandscape={true}
                                        />
                                    </div>
                                )}
                                {showAddNotesPopup && (
                                    <div className="pointer-events-auto">
                                        <AddNotesPopup
                                            onClose={() => setShowAddNotesPopup(false)}
                                            currentPageIndex={currentPage}
                                            totalPages={pages.length}
                                            onAddNote={onAddNote}
                                            isSidebarOpen={false}
                                            layoutColors={layoutColors}
                                            activeLayout={activeLayout}
                                            isMobile={false}
                                            isLandscape={false}
                                            isMobileLandscape={true}
                                        />
                                    </div>
                                )}
                                {showNotesViewer && (
                                    <div className="pointer-events-auto">
                                        <NotesViewerPopup
                                            onClose={() => setShowNotesViewer(false)}
                                            notes={notes}
                                            isSidebarOpen={false}
                                            activeLayout={activeLayout}
                                            isTablet={false}
                                            isLandscape={false}
                                            layoutColors={layoutColors}
                                            isMobile={false}
                                            isMobileLandscape={true}
                                        />
                                    </div>
                                )}
                                {showAddBookmarkPopup && (
                                    <div className="pointer-events-auto">
                                        <AddBookmarkPopup
                                            onClose={() => setShowAddBookmarkPopup(false)}
                                            currentPageIndex={currentPage}
                                            totalPages={pages.length}
                                            onAddBookmark={onAddBookmark}
                                            isSidebarOpen={false}
                                            bookmarkSettings={bookmarkSettings}
                                            isMobile={false}
                                            activeLayout={activeLayout}
                                            isLandscape={false}
                                            isMobileLandscape={true}
                                        />
                                    </div>
                                )}
                                {showViewBookmarkPopup && (
                                    <div className="pointer-events-auto">
                                        <ViewBookmarkPopup
                                            onClose={() => setShowViewBookmarkPopup(false)}
                                            bookmarks={bookmarks}
                                            onDelete={onDeleteBookmark}
                                            onUpdate={onUpdateBookmark}
                                            activeLayout={activeLayout}
                                            isSidebarOpen={false}
                                            layoutColors={layoutColors}
                                            isMobile={false}
                                            isLandscape={false}
                                            isMobileLandscape={true}
                                            onNavigate={(pageIndex) => { onPageClick(pageIndex); setShowViewBookmarkPopup(false); }}
                                        />
                                    </div>
                                )}
                                {showProfilePopup && (
                                    <div className="pointer-events-auto">
                                        <ProfilePopup
                                            onClose={() => setShowProfilePopup(false)}
                                            profileSettings={profileSettings}
                                            activeLayout={activeLayout}
                                            isSidebarOpen={false}
                                            layoutColors={layoutColors}
                                            isMobile={false}
                                            isLandscape={false}
                                        />
                                    </div>
                                )}
                                {showSoundPopup && (
                                    <div className="pointer-events-auto">
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
                                            isMobile={false}
                                            isSidebarOpen={false}
                                            isLandscape={false}
                                        />
                                    </div>
                                )}
                                {showSharePopup && (
                                    <div className="pointer-events-auto">
                                        <FlipbookSharePopup
                                            onClose={() => setShowSharePopup(false)}
                                            bookName={bookName}
                                            url={window.location.href}
                                            isMobile={false}
                                            isLandscape={false}
                                        />
                                    </div>
                                )}
                                {showExportPopup && (
                                    <div className="pointer-events-auto">
                                        <Export
                                            isOpen={showExportPopup}
                                            onClose={() => setShowExportPopup(false)}
                                            hideButton={true}
                                            pages={pages}
                                            bookName={bookName}
                                            currentPage={currentPage}
                                            isMobile={false}
                                            isLandscape={false}
                                        />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Suspense>
                </div>
            </div>
        );
    }

    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {showTOC && (
                    <TableOfContentsPopup
                        onClose={() => setShowTOC(false)}
                        settings={settings.tocSettings}
                        activeLayout={activeLayout}
                        isMobile={true}
                        onNavigate={(pageIndex) => {
                            onPageClick(pageIndex);
                            setShowTOC(false);
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
                    activeLayout={activeLayout}
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
                    activeLayout={activeLayout}
                    isMobile={true}
                />
            )}
            {showProfilePopup && (
                <ProfilePopup
                    onClose={() => setShowProfilePopup(false)}
                    profileSettings={profileSettings}
                    activeLayout={activeLayout}
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
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#BDC3D9]" style={{ ...layoutVariables }}>
            {/* Top Area - Spacer layer for dark blue notch area */}
            <div className="h-10 w-full shrink-0" style={{ backgroundColor: '#0B0F4E' }} />

            {/* Header */}
            <header className="z-50 px-4 pt-4 pb-3 flex flex-col gap-3 shadow-sm relative shrink-0" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}

                {/* Top Row: Book Title & Logo */}
                <div className="flex items-center justify-between">
                    <span className="text-white text-[13px] font-medium opacity-90 truncate flex-1">{bookName}</span>
                    <div className="flex items-center">
                        {settings?.brandingProfile?.logo && logoSettings?.src ? (
                            <img
                                src={logoSettings.src}
                                alt="Logo"
                                className="h-5 w-auto transition-all mix-blend-screen"
                                style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                            />
                        ) : (
                            <div className="text-white font-bold opacity-80 text-xl tracking-tighter">FIST-O</div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Search & Hamburger Container */}
                <div className="flex items-center gap-3">
                    <div className={`flex-1 bg-[#EAEAF3] rounded-[2px] px-2.5 py-1.5 flex items-center gap-2 shadow-inner relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}
                        style={{ backgroundColor: getLayoutColor('search-bg-v2', '#DDE0F4') }}
                    >
                        <Icon icon="lucide:search" className="text-[#575C9C] w-4 h-4 opacity-70" style={{ color: getLayoutColor('search-text-v1', '#575C9C') }} />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/70 text-[12px] outline-none w-full font-medium"
                            value={localSearchQuery}
                            style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
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

                        {/* Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md rounded-md shadow-2xl border border-gray-100 z-[100] overflow-hidden"
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

                    <button onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
                        className={`flex items-center justify-center shrink-0 transition-all ${showMoreMenu ? 'w-8 h-8 rounded-none border-[1.5px] shadow-sm' : 'p-1.5 border border-white/50 rounded'}`}
                        style={showMoreMenu ? {
                            backgroundColor: getLayoutColor('search-bg-v2', '#DDE0F4'),
                            color: getLayoutColor('search-text-v1', '#575C9C'),
                            borderColor: getLayoutColor('search-text-v1', '#575C9C')
                        } : {
                            color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                            borderColor: getLayoutColor('toolbar-icon', '#FFFFFF')
                        }}
                    >
                        {showMoreMenu ? (
                            <div className="flex items-center justify-center w-full h-full p-1">
                                <div className="w-full h-full flex items-center justify-center border border-current opacity-80">
                                    <Icon icon="lucide:x" strokeWidth="2" className="w-[16px] h-[16px]" />
                                </div>
                            </div>
                        ) : (
                            <Icon icon="lucide:menu" className="w-[18px] h-[18px]" />
                        )}
                    </button>
                </div>
            </header>

            {/* Wrapper for main content and footer */}
            <div className="flex-1 relative flex flex-col overflow-hidden">

                {/* Main Content Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col" style={{ backgroundColor: getLayoutColor('page-bg', '#BDC3D9') }}>

                    {/* Menu Strip Overlay - Positioned between header and footer */}
                    <AnimatePresence>
                        {showMoreMenu && (
                            <>
                                {/* Click-away overlay - fixed to cover entire viewport */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-transparent z-[150]"
                                    onClick={() => {
                                        setShowBookmarkOptions(false);
                                        setShowNotesOptions(false);
                                        setTocSearchQuery('');
                                    }}
                                />
                                {/* Vertical Icon Strip - Attached to right of content area */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-4 top-[5%] bottom-[5%] z-[160] w-[10%] max-w-[40px] flex flex-col items-center justify-evenly py-6 shadow-2xl"
                                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                                >
                                    <button onClick={() => { setShowThumbnailBar(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="ph:squares-four-fill" className="w-[18px] h-[18px]" />
                                    </button>
                                    <button onClick={() => { setShowTOC(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); setTocSearchQuery(''); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="fluent:text-bullet-list-24-filled" className="w-[17px] h-[17px]" />
                                    </button>

                                    {/* Notes Button with Popup */}
                                    <div className="relative flex items-center justify-center">
                                        <button onClick={() => { setShowNotesOptions(!showNotesOptions); setShowBookmarkOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                            <Icon icon="material-symbols-light:add-notes" className="w-[20px] h-[20px]" />
                                        </button>
                                        <AnimatePresence>
                                            {showNotesOptions && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="absolute right-full mr-3 bg-[#575C9C] rounded-[4px] shadow-2xl py-1 px-2 z-[170] flex flex-col gap-1 min-w-[100px] border border-white/10"
                                                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                                                >
                                                    <button onClick={() => { setShowAddNotesPopup(true); setShowMoreMenu(false); setShowNotesOptions(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 transition-colors w-full text-left">
                                                        <Icon icon="fluent:note-add-24-filled" className="w-4 h-4 text-white" />
                                                        <span className="text-white text-[12px] font-medium whitespace-nowrap">Add Notes</span>
                                                    </button>
                                                    <button onClick={() => { setShowNotesViewer(true); setShowMoreMenu(false); setShowNotesOptions(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 transition-colors w-full text-left">
                                                        <Icon icon="lucide:eye" className="w-4 h-4 text-white" />
                                                        <span className="text-white text-[12px] font-medium whitespace-nowrap">View Notes</span>
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Bookmark Button with Popup */}
                                    <div className="relative flex items-center justify-center">
                                        <button onClick={() => { setShowBookmarkOptions(!showBookmarkOptions); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                            <Icon icon="fluent:bookmark-24-filled" className="w-[17px] h-[17px]" />
                                        </button>
                                        <AnimatePresence>
                                            {showBookmarkOptions && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="absolute right-full mr-3 bg-[#575C9C] rounded-[4px] shadow-2xl py-1 px-2 z-[170] flex flex-col gap-1 min-w-[124px] border border-white/10"
                                                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                                                >
                                                    <button onClick={() => { setShowAddBookmarkPopup(true); setShowMoreMenu(false); setShowBookmarkOptions(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 transition-colors w-full text-left">
                                                        <Icon icon="fluent:bookmark-add-24-filled" className="w-4 h-4 text-white" />
                                                        <span className="text-white text-[12px] font-medium whitespace-nowrap">Add Bookmark</span>
                                                    </button>
                                                    <button onClick={() => { setShowViewBookmarkPopup(true); setShowMoreMenu(false); setShowBookmarkOptions(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 transition-colors w-full text-left">
                                                        <Icon icon="lucide:eye" className="w-4 h-4 text-white" />
                                                        <span className="text-white text-[12px] font-medium whitespace-nowrap">View Bookmark</span>
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button onClick={() => { setShowThumbnailBar(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="clarity:image-gallery-solid" className="w-[18px] h-[18px]" />
                                    </button>
                                    <button onClick={() => { setShowSoundPopup(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="solar:music-notes-bold" className="w-[18px] h-[18px]" />
                                    </button>
                                    <button onClick={() => { setShowProfilePopup(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="fluent:person-24-filled" className="w-[18px] h-[18px]" />
                                    </button>
                                    <button onClick={() => { handleShare(); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="mage:share-fill" className="w-[17px] h-[17px]" />
                                    </button>
                                    <button onClick={() => { handleDownload(); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="meteor-icons:download" className="w-[17px] h-[17px]" />
                                    </button>
                                    <button onClick={() => { handleFullScreen(); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="lucide:fullscreen" className="w-[17px] h-[17px]" />
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Thumbnail Bar Sidebar */}
                    <AnimatePresence>
                        {showThumbnailBar && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.3 }}
                                className="absolute right-0 top-0 bottom-0 z-[170] w-[45%] flex flex-col shadow-2xl border-l border-white/10"
                                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 shrink-0">
                                    <span className="text-[13px] font-bold" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Thumbnail</span>
                                    <button onClick={() => setShowThumbnailBar(false)} className="opacity-60 hover:opacity-100">
                                        <Icon icon="lucide:x" className="w-[16px] h-[16px]" style={{ color: getLayoutColor('dropdown-text', '#3E4491') }} />
                                    </button>
                                </div>

                                {/* Vertically Scrollable List */}
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-6"
                                >
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex flex-col items-center cursor-pointer transition-all ${isSelected ? 'scale-[1.03] active-thumbnail' : ''}`}
                                                onClick={() => {
                                                    onPageClick(spread.indices[0]);
                                                    setShowThumbnailBar(false);
                                                }}
                                            >
                                                <div
                                                    className={`relative bg-white shadow-md rounded-[2px] overflow-hidden border-[1.5px] transition-all p-1 ${isSelected ? 'shadow-lg border-[#3E4491]' : 'border-gray-200'}`}
                                                    style={{ width: '100%', height: '80px', borderColor: isSelected ? getLayoutColor('thumbnail-inner-v2', '#3E4491') : 'transparent' }}
                                                >
                                                    <div className="flex w-full h-full gap-px bg-gray-100 justify-center">
                                                        {spread.pages.map((page, pIdx) => (
                                                            <div key={`${idx}-${pIdx}`} className="flex-1 max-w-[50%] bg-white overflow-hidden relative flex items-center justify-center">
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={spread.indices[pIdx]}
                                                                    scale={0.14}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="mt-1.5 text-[10px] font-bold transition-colors"
                                                    style={{ color: isSelected ? getLayoutColor('dropdown-text', '#3E4491') : '#6B7280' }}
                                                >
                                                    {spread.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Table of Contents Sidebar */}
                    <AnimatePresence>
                        {showTOC && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.3 }}
                                className="absolute right-0 top-0 bottom-0 z-[170] w-[60%] flex flex-col shadow-2xl border-l border-white/10"
                                style={{ backgroundColor: getLayoutColor('toc-bg', '#FFFFFF') }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 shrink-0">
                                    <span className="text-[14px] font-bold" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Table of Contents</span>
                                    <button onClick={() => setShowTOC(false)} className="opacity-60 hover:opacity-100">
                                        <Icon icon="lucide:x" className="w-[18px] h-[18px]" style={{ color: getLayoutColor('toc-text', '#575C9C') }} />
                                    </button>
                                </div>

                                {/* TOC Search Bar */}
                                {settings.tocSettings?.addSearch !== false && (
                                    <div className="px-3 py-2 border-b" style={{ borderColor: getLayoutColorRgba('toc-text', '87, 92, 156', '0.1') }}>
                                        <div className="flex items-center rounded-md px-2 py-1.5" style={{ backgroundColor: getLayoutColorRgba('toc-text', '87, 92, 156', '0.05') }}>
                                            <Icon icon="lucide:search" className="w-3.5 h-3.5 opacity-50" style={{ color: getLayoutColor('toc-text', '#575C9C') }} />
                                            <input
                                                type="text"
                                                placeholder="Search TOC..."
                                                className="bg-transparent border-0 outline-none focus:ring-0 text-[12px] ml-2 w-full"
                                                style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                value={tocSearchQuery}
                                                onChange={(e) => setTocSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Vertically Scrollable List */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col">
                                    {settings.tocSettings?.content && settings.tocSettings.content.length > 0 ? (
                                        settings.tocSettings.content
                                            .filter(item => {
                                                if (!tocSearchQuery) return true;
                                                const query = tocSearchQuery.toLowerCase();
                                                const matchesHeading = item.title.toLowerCase().includes(query);
                                                const matchesSubheading = item.subheadings?.some(sub => sub.title.toLowerCase().includes(query));
                                                return matchesHeading || matchesSubheading;
                                            })
                                            .map((heading, hIdx) => {
                                                const filteredSubheadings = heading.subheadings?.filter(sub =>
                                                    !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                                );

                                                return (
                                                    <div key={heading.id} className={`${hIdx > 0 ? 'mt-4' : ''}`}>
                                                        <div
                                                            className="flex items-center justify-between py-2 px-1 hover:bg-black/5 rounded transition-colors"
                                                            onClick={() => {
                                                                if (onPageClick) onPageClick(heading.page - 1);
                                                                setShowTOC(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center min-w-0 pr-2">
                                                                {settings.tocSettings.addSerialNumberToHeading !== false && (
                                                                    <span className="text-[13px] font-bold mr-2 shrink-0" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                                                        {hIdx + 1}.
                                                                    </span>
                                                                )}
                                                                <span className="text-[13px] font-medium truncate shrink" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>{heading.title}</span>
                                                            </div>
                                                            {settings.tocSettings.addPageNumber !== false && (
                                                                <span className="text-[12px] font-medium tabular-nums shrink-0" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col ml-4">
                                                            {filteredSubheadings?.map((sub, sIdx) => (
                                                                <div
                                                                    key={sub.id}
                                                                    className="flex items-center justify-between py-1.5 px-1 hover:bg-black/5 rounded transition-colors"
                                                                    onClick={() => {
                                                                        if (onPageClick) onPageClick(sub.page - 1);
                                                                        setShowTOC(false);
                                                                    }}
                                                                >
                                                                    <div className="flex items-center min-w-0 pr-2">
                                                                        {settings.tocSettings.addSerialNumberToSubheading !== false && (
                                                                            <span className="text-[12px] font-medium mr-2 shrink-0 opacity-70" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                                                                {hIdx + 1}.{sIdx + 1}.
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[12px] font-normal truncate shrink opacity-90" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>{sub.title}</span>
                                                                    </div>
                                                                    {settings.tocSettings.addPageNumber !== false && (
                                                                        <span className="text-[11px] font-normal tabular-nums shrink-0 opacity-70" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
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
                                        <div className="text-center py-10 opacity-50" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                            No Table Of Content Found
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* View Bookmarks Sidebar */}
                    <AnimatePresence>
                        {showViewBookmarkPopup && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.3 }}
                                className="absolute right-0 top-0 bottom-0 z-[170] w-[60%] flex flex-col shadow-2xl border-l border-white/10"
                                style={{ backgroundColor: getLayoutColor('toc-bg', '#FFFFFF') }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 shrink-0">
                                    <span className="text-[14px] font-bold" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Bookmarks</span>
                                    <button onClick={() => setShowViewBookmarkPopup(false)} className="opacity-60 hover:opacity-100">
                                        <Icon icon="lucide:x" className="w-[18px] h-[18px]" style={{ color: getLayoutColor('toc-text', '#575C9C') }} />
                                    </button>
                                </div>

                                {/* Bookmark List */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
                                    {bookmarks && bookmarks.length > 0 ? (
                                        bookmarks.map((bm, bIdx) => (
                                            <div
                                                key={bm.id || bIdx}
                                                className="flex items-center justify-between py-2 px-2 hover:bg-black/5 rounded-lg transition-colors"
                                            >
                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => {
                                                        if (onPageClick) onPageClick(bm.pageIndex);
                                                        setShowViewBookmarkPopup(false);
                                                    }}
                                                >
                                                    <span className="text-[13px] font-medium truncate block" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                                        {bm.label || `Page ${bm.pageIndex + 1}`}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onUpdateBookmark) onUpdateBookmark(bm);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-black/10 transition-colors"
                                                        style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                    >
                                                        <Icon icon="lucide:edit-3" className="w-[15px] h-[15px] opacity-70" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onDeleteBookmark) onDeleteBookmark(bm.id);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                                                    >
                                                        <Icon icon="lucide:trash-2" className="w-[15px] h-[15px] opacity-70" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 opacity-50 text-[12px] font-medium" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                            No Bookmarks Found
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Arrows inside the main container */}
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
                    <div className="flex-1 flex items-center justify-center px-10 relative overflow-hidden">
                        <div className="transition-transform duration-500 ease-out" style={{ transform: `scale(${currentZoom})`, transformOrigin: 'center center' }}>
                            <div className="relative">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="z-50 shrink-0 flex flex-col pt-3 pb-8 relative" style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', '#575C9C') }}>

                    {/* Top of footer: Zoom Control */}
                    <div className="flex justify-end px-6 mb-4">
                        <div className="flex items-center gap-2 rounded px-2 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.1)] border"
                            style={{
                                backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.15'),
                                borderColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.1')
                            }}
                        >
                            <Icon icon="lucide:zoom-in" className="w-[10px] h-[10px]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                            <span className="font-semibold text-[9px] min-w-[28px] text-center" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>{Math.round(currentZoom * 100)}%</span>
                            <button
                                onClick={() => setCurrentZoom(0.5)}
                                className="bg-white px-[5px] py-[2px] rounded-[3px] text-[8px] font-bold active:scale-95 transition-transform"
                                style={{ color: getLayoutColor('search-text-v1', '#3E4491') }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Bottom of footer: Playback & Scrub Bar */}
                    <div className="flex items-center px-6 gap-4 w-full">
                        {/* Media Controls */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => onPageClick(0)} className="active:scale-90 transition-transform" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="lucide:skip-back" strokeWidth="2" className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsPlaying(!isAutoFlipping)} className="active:scale-90 transition-transform" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-5 h-5" />
                            </button>
                            <button onClick={() => onPageClick(pages.length - 1)} className="active:scale-90 transition-transform" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="lucide:skip-forward" strokeWidth="2" className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Scrub Bar */}
                        <div className="flex-1 flex items-center shrink-0">
                            <div ref={progressRef} className="h-1.5 w-full rounded-full cursor-pointer relative overflow-hidden"
                                style={{ backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.2') }}
                                onClick={handleProgressClick}>
                                <div
                                    className="absolute left-0 top-0 h-full transition-all duration-300 rounded-full"
                                    style={{ width: `${Math.max(1, progressPercentage)}%`, backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                                />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
            {renderPopups()}
        </div>
    );
};

export default MobileLayout4;
