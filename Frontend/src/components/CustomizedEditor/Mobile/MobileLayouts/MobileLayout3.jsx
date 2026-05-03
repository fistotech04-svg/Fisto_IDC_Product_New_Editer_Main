import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const Grid3Layout = lazy(() => import('../../Layouts/Grid3Layout'));

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

const MobileLayout3 = (props) => {
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
        isLandscape,
        isAutoFlipping,
        setIsPlaying,
        handleFullScreen,
        handleShare,
        handleDownload,
        showSoundPopup: propShowSoundPopup,
        setShowSoundPopup,
        isMuted,
        setIsMuted,
        isFlipMuted,
        setIsFlipMuted,
        flipTrigger,
        showExportPopup: propShowExportPopup,
        setShowExportPopup,
        showSharePopup: propShowSharePopup,
        setShowSharePopup,
        profileSettings,
        bookmarkSettings,
        tocSettings,
        notes = [],
        onAddNote,
        onAddBookmark,
        bookmarks = [],
        onDeleteBookmark,
        onUpdateBookmark,
        otherSetupSettings,
        onUpdateOtherSetup,
        activeLayout: layoutInfo,
        layoutColors,
        // Popup states from props
        showTOC: propShowTOC,
        setShowTOC: propSetShowTOC,
        showThumbnailBar: propShowThumbnailBar,
        setShowThumbnailBar: propSetShowThumbnailBar,
        showAddNotesPopup: propShowAddNotesPopup,
        setShowAddNotesPopup: propSetShowAddNotesPopup,
        showAddBookmarkPopup: propShowAddBookmarkPopup,
        setShowAddBookmarkPopup: propSetShowAddBookmarkPopup,
        showNotesViewer: propShowNotesViewer,
        setShowNotesViewer: propSetShowNotesViewer,
        showViewBookmarkPopup: propShowViewBookmarkPopup,
        setShowViewBookmarkPopup: propSetShowViewBookmarkPopup,
        showProfilePopup: propShowProfilePopup,
        setShowProfilePopup: propSetShowProfilePopup,
        // Memoized versions
        setShowTOCMemo,
        setShowThumbnailBarMemo,
        setShowAddNotesPopupMemo,
        setShowAddBookmarkPopupMemo,
        setShowNotesViewerMemo,
        setShowViewBookmarkPopupMemo,
        setShowSoundPopupMemo,
        setShowProfilePopupMemo
    } = props;

    // Internal states for fallback and local sync
    const [localShowTOC, setLocalShowTOC] = useState(false);
    const [localShowThumbnailBar, setLocalShowThumbnailBar] = useState(false);
    const [localShowAddNotesPopup, setLocalShowAddNotesPopup] = useState(false);
    const [localShowAddBookmarkPopup, setLocalShowAddBookmarkPopup] = useState(false);
    const [localShowNotesViewer, setLocalShowNotesViewer] = useState(false);
    const [localShowViewBookmarkPopup, setLocalShowViewBookmarkPopup] = useState(false);
    const [localShowProfilePopup, setLocalShowProfilePopup] = useState(false);
    const [localShowSoundPopup, setLocalShowSoundPopup] = useState(false);
    const [localShowExportPopup, setLocalShowExportPopup] = useState(false);
    const [localShowSharePopup, setLocalShowSharePopup] = useState(false);
    const [showNotesChoicePopup, setShowNotesChoicePopup] = useState(false);
    const [showBookmarkChoicePopup, setShowBookmarkChoicePopup] = useState(false);

    // Actual visibility state (priority: prop > local)
    const showTOC = propShowTOC !== undefined ? propShowTOC : localShowTOC;
    const showThumbnailBar = propShowThumbnailBar !== undefined ? propShowThumbnailBar : localShowThumbnailBar;
    const showAddNotesPopup = propShowAddNotesPopup !== undefined ? propShowAddNotesPopup : localShowAddNotesPopup;
    const showAddBookmarkPopup = propShowAddBookmarkPopup !== undefined ? propShowAddBookmarkPopup : localShowAddBookmarkPopup;
    const showNotesViewer = propShowNotesViewer !== undefined ? propShowNotesViewer : localShowNotesViewer;
    const showViewBookmarkPopup = propShowViewBookmarkPopup !== undefined ? propShowViewBookmarkPopup : localShowViewBookmarkPopup;
    const showProfilePopup = propShowProfilePopup !== undefined ? propShowProfilePopup : localShowProfilePopup;
    const showSoundPopup = propShowSoundPopup !== undefined ? propShowSoundPopup : localShowSoundPopup;
    const showExportPopup = propShowExportPopup !== undefined ? propShowExportPopup : localShowExportPopup;
    const showSharePopup = propShowSharePopup !== undefined ? propShowSharePopup : localShowSharePopup;

    // Unified toggle handlers
    const toggleTOC = (val) => {
        setLocalShowTOC(val);
        (propSetShowTOC || setShowTOCMemo)?.(val);
    };
    const toggleThumbnailBar = (val) => {
        setLocalShowThumbnailBar(val);
        (propSetShowThumbnailBar || setShowThumbnailBarMemo)?.(val);
    };
    const toggleAddNotesPopup = (val) => {
        setLocalShowAddNotesPopup(val);
        if (propSetShowAddNotesPopup) propSetShowAddNotesPopup(val);
        if (setShowAddNotesPopupMemo) setShowAddNotesPopupMemo(val);
        if (val) setShowNotesChoicePopup(false);
    };
    const toggleNotesViewer = (val) => {
        setLocalShowNotesViewer(val);
        if (propSetShowNotesViewer) propSetShowNotesViewer(val);
        if (setShowNotesViewerMemo) setShowNotesViewerMemo(val);
        if (val) setShowNotesChoicePopup(false);
    };
    const toggleAddBookmarkPopup = (val) => {
        setLocalShowAddBookmarkPopup(val);
        if (propSetShowAddBookmarkPopup) propSetShowAddBookmarkPopup(val);
        if (setShowAddBookmarkPopupMemo) setShowAddBookmarkPopupMemo(val);
        if (val) setShowBookmarkChoicePopup(false);
    };
    const toggleViewBookmarkPopup = (val) => {
        setLocalShowViewBookmarkPopup(val);
        if (propSetShowViewBookmarkPopup) propSetShowViewBookmarkPopup(val);
        if (setShowViewBookmarkPopupMemo) setShowViewBookmarkPopupMemo(val);
        if (val) setShowBookmarkChoicePopup(false);
    };
    const toggleProfilePopup = (val) => {
        setLocalShowProfilePopup(val);
        (propSetShowProfilePopup || setShowProfilePopupMemo)?.(val);
    };
    const toggleSoundPopup = (val) => {
        setLocalShowSoundPopup(val);
        (setShowSoundPopup || setShowSoundPopupMemo)?.(val);
    };
    const toggleExportPopup = (val) => {
        setLocalShowExportPopup(val);
        setShowExportPopup?.(val);
    };
    const toggleSharePopup = (val) => {
        setLocalShowSharePopup(val);
        setShowSharePopup?.(val);
    };


    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const scrollRef = useRef(null);
    const progressRef = useRef(null);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState([]);

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

    const progressPercentage = pages && pages.length > 1 ? (currentPage / (pages.length - 1)) * 100 : 0;

    const handleProgressClick = (e) => {
        if (!progressRef.current || !pages || pages.length <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pages.length - 1));
        onPageClick(targetIdx);
    };

    const renderPopups = () => (
        <div className="fixed inset-0 pointer-events-none z-[5000]">
            <AnimatePresence>
                {/* Notes Choice Popup */}
                {showNotesChoicePopup && !isLandscape && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[5000] bg-transparent pointer-events-auto"
                            onClick={() => setShowNotesChoicePopup(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute top-[135px] left-[22%] z-[5001] pointer-events-auto"
                        >
                            <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-black/5 overflow-hidden w-[130px] flex flex-col p-1.5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleAddNotesPopup(true); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <Icon icon="material-symbols-light:add-notes" className="w-4.5 h-4.5 text-[#575C9C]" />
                                    <span className="text-[10px] font-extrabold text-[#575C9C]">Add Notes</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleNotesViewer(true); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <Icon icon="ph:eye-fill" className="w-4.5 h-4.5 text-[#575C9C]" />
                                    <span className="text-[10px] font-extrabold text-[#575C9C]">View Notes</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Bookmark Choice Popup */}
                {showBookmarkChoicePopup && !isLandscape && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[5000] bg-transparent pointer-events-auto"
                            onClick={() => setShowBookmarkChoicePopup(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute bottom-[100px] left-4 z-[5001] pointer-events-auto"
                        >
                            <div className="bg-white rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border border-black/5 overflow-hidden w-[130px] flex flex-col p-1.5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleAddBookmarkPopup(true); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <Icon icon="fluent:bookmark-add-24-filled" className="w-4.5 h-4.5 text-[#575C9C]" />
                                    <span className="text-[9.5px] font-extrabold text-[#575C9C] whitespace-nowrap">Add Bookmark</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleViewBookmarkPopup(true); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <Icon icon="ph:eye-fill" className="w-4.5 h-4.5 text-[#575C9C]" />
                                    <span className="text-[9.5px] font-extrabold text-[#575C9C] whitespace-nowrap">View Bookmark</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}

                {showThumbnailBar && !isLandscape && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/5 pointer-events-auto" onClick={() => toggleThumbnailBar(false)} />
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="absolute top-[80px] bottom-[50px] right-4 w-[75px] z-[110] pointer-events-auto"
                        >
                            <div
                                className="h-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-black/5 relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Up Arrow */}
                                <button
                                    className={`shrink-0 h-8 w-full flex items-center justify-center transition-opacity ${!canScrollLeft ? 'opacity-20 cursor-default' : 'opacity-100'}`}
                                    onClick={() => {
                                        if (scrollRef.current) {
                                            scrollRef.current.scrollBy({ top: -150, behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    <Icon icon="lucide:chevron-up" className="w-5 h-5 text-[#575C9C]" />
                                </button>

                                {/* Vertical Scroll Area */}
                                <div
                                    ref={scrollRef}
                                    onScroll={checkScroll}
                                    className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 px-2 py-2 scroll-smooth"
                                >
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        return (
                                            <div
                                                key={idx}
                                                data-index={idx}
                                                className={`thumbnail-item shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${isSelected ? 'ring-2 ring-[#575C9C] bg-[#575C9C]/5' : 'hover:bg-gray-50'}`}
                                                onClick={() => onPageClick(spread.indices[0])}
                                            >
                                                <div
                                                    className="bg-white rounded-sm overflow-hidden shadow-sm flex gap-[0.5px] border border-gray-100"
                                                    style={{ width: '56px', height: '42px' }}
                                                >
                                                    {spread.pages.map((page, pIdx) => (
                                                        <div key={pIdx} className="flex-1 h-full overflow-hidden border-r last:border-r-0 border-gray-50">
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={spread.indices[pIdx]}
                                                                scale={0.12}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className={`text-[8px] font-bold truncate w-full text-center ${isSelected ? 'text-[#575C9C]' : 'text-gray-500'}`}>
                                                    {spread.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Down Arrow */}
                                <button
                                    className={`shrink-0 h-8 w-full flex items-center justify-center transition-opacity ${!canScrollRight ? 'opacity-20 cursor-default' : 'opacity-100'}`}
                                    onClick={() => {
                                        if (scrollRef.current) {
                                            scrollRef.current.scrollBy({ top: 150, behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    <Icon icon="lucide:chevron-down" className="w-5 h-5 text-[#575C9C]" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
                {showTOC && !isLandscape && (
                    <TableOfContentsPopup
                        onClose={() => toggleTOC(false)}
                        onNavigate={(pageIdx) => {
                            onPageClick(pageIdx);
                            toggleTOC(false);
                        }}
                        settings={tocSettings || settings?.toc}
                        isMobile={true}
                        isLandscape={false}
                        activeLayout={3}
                        layoutColors={layoutColors}
                    />
                )}
                {showAddNotesPopup && !isLandscape && (
                    <AddNotesPopup
                        onClose={() => toggleAddNotesPopup(false)}
                        onAddNote={onAddNote}
                        currentPageIndex={currentPage}
                        totalPages={pages.length}
                        isMobile={true}
                        isLandscape={false}
                        activeLayout={layoutInfo}
                    />
                )}
                {showNotesViewer && !isLandscape && (
                    <NotesViewerPopup
                        onClose={() => toggleNotesViewer(false)}
                        notes={notes}
                        onPageClick={onPageClick}
                        isMobile={true}
                    />
                )}
                {showAddBookmarkPopup && !isLandscape && (
                    <AddBookmarkPopup
                        onClose={() => toggleAddBookmarkPopup(false)}
                        onAddBookmark={onAddBookmark}
                        currentPageIndex={currentPage}
                        totalPages={pages.length}
                        bookmarkSettings={bookmarkSettings}
                        activeLayout={layoutInfo}
                        isMobile={true}
                    />
                )}
                {showViewBookmarkPopup && !isLandscape && (
                    <ViewBookmarkPopup
                        onClose={() => toggleViewBookmarkPopup(false)}
                        bookmarks={bookmarks}
                        onDelete={onDeleteBookmark}
                        onUpdate={onUpdateBookmark}
                        onNavigate={onPageClick}
                        activeLayout={layoutInfo || 3}
                        isMobile={true}
                    />
                )}
                {showProfilePopup && !isLandscape && (
                    <ProfilePopup
                        onClose={() => toggleProfilePopup(false)}
                        profileSettings={profileSettings}
                        activeLayout={3}
                        isMobile={true}
                        isLandscape={false}
                    />
                )}
                {showSoundPopup && !isLandscape && (
                    <Sound
                        isOpen={showSoundPopup}
                        onClose={() => toggleSoundPopup(false)}
                        activeLayout={3}
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
                        onClose={() => toggleExportPopup(false)}
                        isMobile={true}
                        hideButton={true}
                        pages={pages}
                        bookName={bookName}
                        currentPage={currentPage}
                    />
                )}
                {showSharePopup && !isLandscape && (
                    <FlipbookSharePopup
                        onClose={() => toggleSharePopup(false)}
                        isMobile={true}
                    />
                )}
            </AnimatePresence>
        </div>
    );

    if (isLandscape) {
        return (
            <div className="w-full h-full overflow-hidden bg-[#DADBE8] relative">
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-[#DADBE8]">
                        <div className="flex flex-col items-center gap-3">
                            <Icon icon="lucide:loader-2" className="w-8 h-8 text-[#575C9C] animate-spin" />
                            <span className="text-[#575C9C] text-sm font-bold">Scaling Layout...</span>
                        </div>
                    </div>
                }>
                    <Grid3Layout
                        {...props}
                        isMobile={false}
                        isMobileLandscape={isLandscape}
                        pagesCount={pages?.length || 0}
                        setShowAddNotesPopupMemo={toggleAddNotesPopup}
                        setShowAddBookmarkPopupMemo={toggleAddBookmarkPopup}
                        setShowNotesViewerMemo={toggleNotesViewer}
                        setShowThumbnailBarMemo={toggleThumbnailBar}
                        setShowTOCMemo={toggleTOC}
                        setShowViewBookmarkPopup={toggleViewBookmarkPopup}
                        showSoundPopup={showSoundPopup}
                        setShowSoundPopupMemo={toggleSoundPopup}
                        setShowGalleryPopupMemo={toggleThumbnailBar}
                        setShowProfilePopup={toggleProfilePopup}
                        setShowExportPopup={toggleExportPopup}
                        setShowSharePopup={toggleSharePopup}

                        isSidebarOpen={false}
                        isTablet={false}
                        showTOC={showTOC}
                        showViewBookmarkPopup={showViewBookmarkPopup}
                        showProfilePopup={showProfilePopup}
                        showAddBookmarkPopup={showAddBookmarkPopup}
                        showAddNotesPopup={showAddNotesPopup}
                        showNotesViewer={showNotesViewer}
                    />
                    {renderPopups()}
                </Suspense>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[812px] w-[375px] overflow-hidden select-none relative bg-[#DADBE8]">
            {/* Notch Spacer - fills the area near the hardware notch with a dark status bar color */}
            <div className="shrink-0 h-10 z-50 bg-[#0B0F4E]" />

            {/* Header Row 2: Search, Logo and Icons (Medium Blue) */}
            <div className="bg-[#575C9C] z-50 shadow-md pt-0">
                {/* Search and Logo Row */}
                <div className="px-4 pt-2.5 pb-1.5 flex items-center justify-start">
                    <div className="w-[70%] max-w-[300px] bg-[#D9DCEB] rounded-full h-7 px-3 flex items-center gap-2 relative">
                        <Icon icon="ph:magnifying-glass" className="text-[#4B528C] w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[#4B528C] placeholder-[#4B528C]/60 text-[11px] outline-none w-full font-bold"
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
                        {/* Search Recommendations */}
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

                </div>

                {/* Icons Row */}
                <div className="h-9 px-4 flex items-center justify-between border-t border-white/10">
                    <button onClick={(e) => { e.stopPropagation(); toggleTOC(true); }} className="text-white active:scale-90 transition-transform p-1">
                        <Icon icon="fluent:text-bullet-list-24-filled" className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleThumbnailBar(!showThumbnailBar); }} className="text-white active:scale-90 transition-transform p-1">
                        <Icon icon="ph:squares-four-fill" className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowNotesChoicePopup(true); }} className="text-white active:scale-90 transition-transform p-1">
                        <Icon icon="material-symbols-light:add-notes" className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleThumbnailBar(true); }} className="text-white active:scale-90 transition-transform p-1">
                        <Icon icon="clarity:image-gallery-solid" className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleSoundPopup(true); }} className="text-white active:scale-90 transition-transform p-1">
                        <Icon icon="solar:music-notes-bold" className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleProfilePopup(true); }} className="text-white active:scale-90 transition-transform p-1">
                        <Icon icon="fluent:person-24-filled" className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={handleShare} className="text-white active:scale-90 transition-transform p-1">
                        <Icon icon="majesticons:share" className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={handleDownload} className="text-white active:scale-90 transition-transform p-1">
                        <Icon icon="meteor-icons:download" className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>

            {/* Content Sub-Header (Light Blue/Gray) */}
            <div className="bg-[#BDC3D9] h-10 flex items-center justify-between px-5 z-40">
                <span className="text-[#575C9C] text-[12px] font-bold truncate max-w-[50%]">
                    {bookName || "Name of the book"}
                </span>
            </div>

            {/* Main Content Area: Flipbook + Navigation */}
            <div className="flex-1 relative bg-[#BDC3D9] flex flex-col items-center justify-center overflow-hidden">
                {/* Navigation Arrows */}
                <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 active:scale-90 transition-transform"
                    onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                >
                    <Icon icon="ph:caret-left-light" className="w-10 h-10 text-[#575C9C] opacity-60" />
                </button>
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 active:scale-90 transition-transform"
                    onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                >
                    <Icon icon="ph:caret-right-light" className="w-10 h-10 text-[#575C9C] opacity-60" />
                </button>

                {/* Flipbook Canvas - Scaled down for better mobile fit */}
                <div className="flex items-center justify-center overflow-hidden">
                    <div className="transition-transform duration-300" style={{ transform: 'scale(0.85)', transformOrigin: 'center center' }}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Footer Bar (Medium Blue) */}
            <footer className="bg-[#575C9C] flex flex-col pt-3 pb-6 relative shadow-[0_-5px_20px_rgba(0,0,0,0.2)] z-[60]">
                {/* Bottom Icons */}
                <div className="flex items-center justify-center gap-8 text-white mb-3 px-6">
                    <button onClick={(e) => { e.stopPropagation(); setShowBookmarkChoicePopup(true); }} className="active:scale-90 transition-transform p-1">
                        <Icon icon="fluent:bookmark-24-filled" className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="active:scale-90 transition-transform p-1">
                        <Icon icon="lucide:skip-back" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsPlaying(!isAutoFlipping)}
                        className="active:scale-90 transition-all bg-white/10 rounded-full p-1.5"
                    >
                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-5.5 h-5.5" />
                    </button>
                    <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="active:scale-90 transition-transform p-1">
                        <Icon icon="lucide:skip-forward" className="w-4 h-4" />
                    </button>
                    <button onClick={handleFullScreen} className="active:scale-90 transition-transform p-1">
                        <Icon icon="lucide:fullscreen" className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-10">
                    <div
                        ref={progressRef}
                        className="h-[4px] w-full bg-white/20 rounded-full cursor-pointer relative"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
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
