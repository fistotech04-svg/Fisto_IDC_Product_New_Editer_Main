import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const Grid2Layout = lazy(() => import('../../Layouts/Grid2Layout'));

import AddBookmarkPopup from '../../popups/AddBookmarkPopup';
import AddNotesPopup from '../../popups/AddNotesPopup';
import NotesViewerPopup from '../../popups/NotesViewerPopup';
import ViewBookmarkPopup from '../../popups/ViewBookmarkPopup';
import ProfilePopup from '../../popups/ProfilePopup';
import Sound from '../../popups/Sound';
import Export from '../../popups/Export';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';

// Color helper utilities
const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

// Page Thumbnail component for the dial and bar
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

// Menu Button for dropdowns
const MenuBtn = ({ icon, label, onClick }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick(e);
        }}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 hover:bg-white/10 active:bg-white/20 transition-all rounded-lg group whitespace-nowrap"
    >
        <Icon icon={icon} className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
        <span className="text-white text-[11.5px] font-semibold">{label}</span>
    </button>
);

// Toolbar Icon Button
const ToolbarIcon = ({ icon, onClick, active = false, className = "" }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick(e);
        }}
        className={`p-1.5 rounded-lg transition-all active:scale-90 ${active ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white'} ${className}`}
    >
        <Icon icon={icon} className="w-4.5 h-4.5" />
    </button>
);

const MobileLayout2 = (props) => {
    const {
        children,
        settings,
        bookName,
        activeLayout,
        searchQuery,
        setSearchQuery,
        handleQuickSearch,
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
        layoutColors = [],
        tocSettings
    } = props;
    // Local State
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showRadialThumbnails, setShowRadialThumbnails] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [radialScroll, setRadialScroll] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const scrollRef = useRef(null);

    // Memoized Spreads for thumbnails
    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            result.push({ pages: [pages[0]], indices: [0], label: "Page 1" });
            for (let i = 1; i < pages.length; i += 2) {
                const indices = [i];
                const spreadPages = [pages[i]];
                if (i + 1 < pages.length) {
                    indices.push(i + 1);
                    spreadPages.push(pages[i + 1]);
                }
                result.push({
                    pages: spreadPages,
                    indices,
                    label: indices.length > 1 ? `Page ${indices[0] + 1}-${indices[1] + 1}` : `Page ${indices[0] + 1}`
                });
            }
        }
        return result;
    }, [pages]);

    const activeSpreadIdx = useMemo(() => {
        return spreads.findIndex(s => s.indices.includes(currentPage));
    }, [spreads, currentPage]);

    // Handle Radial Dial Auto-rotation
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

    // Shared Search Logic
    const handleSearchChange = (val) => {
        setLocalSearchQuery(val);
        setShowSuggestions(true);
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
    };

    const handleSearchSubmit = () => {
        setSearchQuery(localSearchQuery);
        handleQuickSearch(localSearchQuery);
        setRecommendations([]);
        setShowSuggestions(false);
    };

    // Shared Popups Layer
    const renderPopups = () => (
        <div className="fixed inset-0 pointer-events-none z-[5000]">
            <AnimatePresence>
                {/* TOC Popup */}
                {showTOC && (
                    <div className="pointer-events-auto">
                        <TableOfContentsPopup
                            onClose={() => setShowTOC(false)}
                            onNavigate={(pageIndex) => {
                                onPageClick(pageIndex);
                                setShowTOC(false);
                            }}
                            settings={tocSettings || settings?.toc || {}}
                            activeLayout={2}
                            isMobile={true}
                            isLandscape={isLandscape}
                            layoutColors={layoutColors}
                        />
                    </div>
                )}

                {/* More Menu Dropdown */}
                {showMoreMenu && (
                    <>
                        <div className="fixed inset-0 bg-transparent z-[150] pointer-events-auto" onClick={() => setShowMoreMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: isLandscape ? 20 : -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: isLandscape ? 20 : -20 }}
                            className={`fixed ${isLandscape ? 'bottom-14 right-8' : 'top-16 right-4'} w-[220px] rounded-2xl shadow-2xl z-[160] overflow-hidden border border-white/20 bg-[#575C9C]/95 backdrop-blur-xl pointer-events-auto`}
                        >
                            <div className="flex flex-col p-2 gap-1">
                                <MenuBtn icon="ph:list-bold" label="Table of Contents" onClick={() => setShowTOC(true)} />
                                <MenuBtn icon="ph:squares-four-fill" label="Thumbnails" onClick={() => setShowThumbnailBar(true)} />
                                <MenuBtn icon="ph:file-plus-fill" label="Add Notes" onClick={() => setShowAddNotesPopup(true)} />
                                <MenuBtn icon="ph:eye-fill" label="View Notes" onClick={() => setShowNotesViewer(true)} />
                                <MenuBtn icon="ph:bookmark-simple-bold" label="Add Bookmark" onClick={() => setShowAddBookmarkPopup(true)} />
                                <MenuBtn icon="ph:bookmark-simple-fill" label="View Bookmarks" onClick={() => setShowViewBookmarkPopup(true)} />
                                <MenuBtn icon="ph:user-fill" label="Profile" onClick={() => setShowProfilePopup(true)} />
                                <MenuBtn icon="ph:music-notes-simple-bold" label="Background Music" onClick={() => setShowSoundPopup(true)} />
                                <div className="h-[1px] bg-white/20 my-1.5 mx-2" />
                                <MenuBtn icon="ph:share-network-fill" label="Share Flipbook" onClick={() => handleShare()} />
                                <MenuBtn icon="ph:download-fill" label="Download PDF" onClick={() => handleDownload()} />
                                <MenuBtn icon="ph:corners-out-bold" label="Fullscreen View" onClick={() => handleFullScreen()} />
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Notes/Bookmark Sub-menus (Portrait Specific) */}
                {showNotesMenu && !isLandscape && (
                    <>
                        <div className="fixed inset-0 bg-transparent z-[150] pointer-events-auto" onClick={() => setShowNotesMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="fixed top-[140px] left-[15%] z-[160] w-[140px] p-[4px] rounded-[24px] bg-white/60 backdrop-blur-xl shadow-2xl border border-white/20 pointer-events-auto"
                        >
                            <div className="bg-[#575C9C] rounded-[18px] p-1 shadow-inner overflow-hidden">
                                <MenuBtn icon="solar:notes-bold" label="Add Notes" onClick={() => { setShowAddNotesPopup(true); setShowNotesMenu(false); }} />
                                <MenuBtn icon="solar:eye-bold" label="View Notes" onClick={() => { setShowNotesViewer(true); setShowNotesMenu(false); }} />
                            </div>
                        </motion.div>
                    </>
                )}

                {showBookmarkMenu && !isLandscape && (
                    <>
                        <div className="fixed inset-0 bg-transparent z-[150] pointer-events-auto" onClick={() => setShowBookmarkMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="fixed top-[140px] right-[15%] z-[160] w-[140px] p-[4px] rounded-[24px] bg-white/60 backdrop-blur-xl shadow-2xl border border-white/20 pointer-events-auto"
                        >
                            <div className="bg-[#575C9C] rounded-[18px] p-1 shadow-inner overflow-hidden">
                                <MenuBtn icon="mdi:bookmark-plus" label="Add Bookmark" onClick={() => { setShowAddBookmarkPopup(true); setShowBookmarkMenu(false); }} />
                                <MenuBtn icon="mdi:bookmark-multiple" label="View Bookmark" onClick={() => { setShowViewBookmarkPopup(true); setShowBookmarkMenu(false); }} />
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Thumbnail Bar (Bottom Slide) */}
                {showThumbnailBar && (
                    <>
                        <div className="fixed inset-0 bg-black/40 z-[100] pointer-events-auto backdrop-blur-sm" onClick={() => setShowThumbnailBar(false)} />
                        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-0 left-0 right-0 z-[110] px-2 pb-2 pointer-events-auto">
                            <div className="rounded-2xl overflow-hidden flex items-center h-[80px] relative px-1 shadow-2xl border border-white/20 bg-[#575C9C]/95 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
                                <button className={`shrink-0 w-8 h-full flex items-center justify-center text-white transition-opacity ${!canScrollLeft ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('left')}><Icon icon="lucide:chevron-left" className="w-5 h-5" /></button>
                                <div ref={scrollRef} onScroll={checkScroll} className="flex-1 flex overflow-x-auto no-scrollbar gap-2 px-1 items-center h-full scroll-smooth">
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        return (
                                            <div key={idx} className={`shrink-0 flex flex-col items-center gap-1 p-1 rounded-lg transition-all ${isSelected ? 'bg-white/20 ring-1 ring-white/50' : 'hover:bg-white/5'}`} onClick={() => onPageClick(spread.indices[0])}>
                                                <div className="bg-white rounded-sm overflow-hidden shadow-sm flex gap-[1px]" style={{ width: '60px', height: '45px' }}>
                                                    {spread.pages.map((page, pIdx) => (<div key={pIdx} className="flex-1 h-full overflow-hidden"><PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={isSelected ? 0.12 : 0.1} /></div>))}
                                                </div>
                                                <span className="text-[8px] font-bold text-white/90 truncate w-14 text-center">{spread.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button className={`shrink-0 w-8 h-full flex items-center justify-center text-white transition-opacity ${!canScrollRight ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('right')}><Icon icon="lucide:chevron-right" className="w-5 h-5" /></button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Global Popups (Modals) */}
            {showAddBookmarkPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <AddBookmarkPopup
                        onClose={() => setShowAddBookmarkPopup(false)}
                        currentPageIndex={currentPage}
                        totalPages={pages.length}
                        onAddBookmark={onAddBookmark}
                        isSidebarOpen={false}
                        bookmarkSettings={bookmarkSettings}
                        isMobile={!isLandscape}
                        activeLayout={2}
                        isLandscape={isLandscape}
                    />
                </div>
            )}
            {showAddNotesPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <AddNotesPopup onClose={() => setShowAddNotesPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddNote={onAddNote} isSidebarOpen={false} isMobile={true} activeLayout={2} isLandscape={isLandscape} />
                </div>
            )}
            {showNotesViewer && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <NotesViewerPopup onClose={() => setShowNotesViewer(false)} notes={notes} isSidebarOpen={false} isMobile={true} activeLayout={2} isLandscape={isLandscape} />
                </div>
            )}
            {showViewBookmarkPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <ViewBookmarkPopup onClose={() => setShowViewBookmarkPopup(false)} bookmarks={bookmarks?.filter(b => b.layoutId === 2)} onDelete={onDeleteBookmark} onUpdate={onUpdateBookmark} onNavigate={(pageIndex) => { onPageClick(pageIndex); setShowViewBookmarkPopup(false); }} activeLayout={2} isMobile={true} />
                </div>
            )}
            {showProfilePopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    <ProfilePopup onClose={() => setShowProfilePopup(false)} profileSettings={profileSettings} activeLayout={2} isMobile={true} />
                </div>
            )}
            <Sound isOpen={showSoundPopup} onClose={() => setShowSoundPopup(false)} activeLayout={2} otherSetupSettings={otherSetupSettings} onUpdateOtherSetup={onUpdateOtherSetup} isMuted={isMuted} setIsMuted={setIsMuted} isFlipMuted={isFlipMuted} setIsFlipMuted={setIsFlipMuted} flipTrigger={flipTrigger} settings={settings} isMobile={true} />
            {showExportPopup && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 pointer-events-auto">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExportPopup(false)} />
                    <div className="relative z-[4001] w-full max-w-[300px]">
                        <Export isOpen={true} hideButton={true} onClose={() => setShowExportPopup(false)} pages={pages} bookName={bookName} isMobile={true} isLandscape={isLandscape} currentPage={currentPage} />
                    </div>
                </div>
            )}
            {showSharePopup && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 pointer-events-auto">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSharePopup(false)} />
                    <div className="relative z-[4001] w-full max-w-[300px]">
                        <FlipbookSharePopup onClose={() => setShowSharePopup(false)} bookName={bookName} url={window.location.href} isMobile={true} isLandscape={isLandscape} />
                    </div>
                </div>
            )}
        </div>
    );

    // LANDSCAPE VIEW (Desktop-like Scaling)
    if (isLandscape) {
        return (
            <div className="w-full h-full overflow-hidden bg-[#DADBE8]">
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-[#DADBE8]">
                        <div className="flex flex-col items-center gap-3">
                            <Icon icon="lucide:loader-2" className="w-8 h-8 text-[#575C9C] animate-spin" />
                            <span className="text-[#575C9C] text-sm font-bold">Scaling Layout...</span>
                        </div>
                    </div>
                }>
                    <Grid2Layout
                        {...props}
                        isMobile={false}
                        isMobileLandscape={true}
                        pagesCount={pages?.length || 0}
                        setShowAddNotesPopupMemo={props.setShowAddNotesPopup || setShowAddNotesPopup}
                        setShowAddBookmarkPopupMemo={props.setShowAddBookmarkPopup || setShowAddBookmarkPopup}
                        setShowNotesViewerMemo={props.setShowNotesViewer || setShowNotesViewer}
                        setShowThumbnailBarMemo={props.setShowThumbnailBar || setShowThumbnailBar}
                        setShowTOCMemo={props.setShowTOC || setShowTOC}
                        showSoundPopup={props.showSoundPopup || showSoundPopup}
                        setShowSoundPopupMemo={props.setShowSoundPopup || setShowSoundPopup}
                        setShowProfilePopup={props.setShowProfilePopup || setShowProfilePopup}
                        setShowExportPopup={props.setShowExportPopup || setShowExportPopup}
                        setShowSharePopup={props.setShowSharePopup || setShowSharePopup}
                    />
                </Suspense>
            </div>
        );
    }

    // PORTRAIT VIEW (Mobile-centric)
    return (
        <div className="flex flex-col h-[812px] w-[375px] overflow-hidden select-none relative bg-[#BDC3D9]">
            {/* Notch Spacer - fills the area near the hardware notch with a dark status bar color */}
            <div className="h-10 w-full shrink-0 z-50 bg-[#0B0F4E]" />
            <header className="z-40 bg-[#4B528C] shadow-md border-b border-white/10">
                <div className="px-5 pt-3 pb-2 flex items-center justify-start">
                    <div className="w-[70%] max-w-[240px] h-7.5 bg-white/80 rounded-full flex items-center px-3 gap-1.5 relative">
                        <Icon icon="ph:magnifying-glass-bold" className="text-[#575C9C] w-3 h-3" />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/70 text-[11px] outline-none w-full font-semibold"
                            value={localSearchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        />
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                    {recommendations.map((rec, idx) => (
                                        <button
                                            key={idx}
                                            className="flex items-center justify-between w-full px-3 py-1.8 hover:bg-gray-50 text-[#575C9C] border-b border-gray-50 last:border-0 transition-colors"
                                            onClick={() => {
                                                onPageClick(rec.pageNumber - 1);
                                                const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                setLocalSearchQuery(fullQuery);
                                                setSearchQuery(fullQuery);
                                                setRecommendations([]);
                                                setShowSuggestions(false);
                                            }}
                                        >
                                            <div className="flex flex-col items-start overflow-hidden flex-1 mr-2">
                                                <div className="truncate w-full text-left">
                                                    <span className="text-[10.5px] font-bold mr-1.5">{rec.word}</span>
                                                    {rec.context && <span className="text-[9.5px] font-medium opacity-60 italic">{rec.context}</span>}
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold opacity-40 tabular-nums">P.{rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Secondary Icon Toolbar */}
                <div className="px-4 py-2 flex items-center justify-between text-white/80 border-t border-white/5">
                    <ToolbarIcon icon="mdi:table-of-contents" onClick={() => setShowTOC(true)} active={showTOC} className="!p-1.5" />
                    <ToolbarIcon icon="ep:menu" onClick={() => setShowRadialThumbnails(!showRadialThumbnails)} active={showRadialThumbnails} className="!p-1.5" />
                    <ToolbarIcon icon="material-symbols-light:add-notes" onClick={() => setShowNotesMenu(!showNotesMenu)} active={showNotesMenu} className="!p-1.5" />
                    <ToolbarIcon icon="mingcute:bookmark-fill" onClick={() => setShowBookmarkMenu(!showBookmarkMenu)} active={showBookmarkMenu} className="!p-1.5" />
                    <ToolbarIcon icon="clarity:image-gallery-solid" onClick={() => setShowThumbnailBar(true)} active={showThumbnailBar} className="!p-1.5" />
                    <ToolbarIcon icon="solar:user-bold" onClick={() => setShowProfilePopup(true)} active={showProfilePopup} className="!p-1.5" />
                    <ToolbarIcon icon="mage:share-fill" onClick={() => handleShare()} className="!p-1.5" />
                    <ToolbarIcon icon="meteor-icons:download" onClick={() => handleDownload()} className="!p-1.5" />
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {/* Navigation Arrows */}
                <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="absolute left-2 p-3 z-30 text-[#4B528C]/40 active:scale-75 transition-all"><Icon icon="ph:caret-left-bold" className="w-8 h-8" /></button>
                <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="absolute right-2 p-3 z-30 text-[#4B528C]/40 active:scale-75 transition-all"><Icon icon="ph:caret-right-bold" className="w-8 h-8" /></button>

                {/* Page Content - Scaled down to look better on mobile */}
                <div className="flex items-center justify-center">
                    <div className="transition-transform duration-300" style={{ transform: 'scale(0.85)', transformOrigin: 'center center' }}>
                        {children}
                    </div>
                </div>



                {/* Radial Navigation Dial overlay */}
                <div className="absolute top-0 left-0 right-0 z-20 h-0 overflow-visible pointer-events-none">
                    <AnimatePresence>
                        {showRadialThumbnails && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="relative w-full h-[220px] flex justify-center pointer-events-auto touch-none cursor-grab active:cursor-grabbing"
                                onWheel={handleRadialWheel}
                                onPan={(e, info) => {
                                    setRadialScroll(prev => prev + (info.delta.x * 0.4));
                                }}
                            >
                                <div className="absolute top-[10px] left-0 right-0 flex justify-center pointer-events-none">
                                    <div className="relative w-[380px] pointer-events-auto">
                                        <svg viewBox="0 0 379 220" className="overflow-visible">
                                            <circle cx="189.5" cy="0" r="195" fill="white" fillOpacity="0.45" />
                                            <g style={{ transformOrigin: '189.5px 0px', transform: `rotate(${radialScroll}deg)`, transition: 'transform 0.7s cubic-bezier(0.15, 0.85, 0.35, 1)' }}>
                                                {spreads.map((spread, idx) => {
                                                    const isActive = spread.indices.includes(currentPage) || hoveredIdx === idx;
                                                    const spacing = spreads.length > 1 ? Math.min(22, 160 / (spreads.length - 1)) : 22;
                                                    const totalSpan = (spreads.length - 1) * spacing;
                                                    const angle = (idx * spacing) - (totalSpan / 2);
                                                    return (
                                                        <g key={idx} style={{ transformOrigin: '189.5px 0.5px', transform: `rotate(${angle}deg) translateY(8px)` }} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)} onClick={() => onPageClick(spread.indices[0])}>
                                                            <path d="M162.5 181.3C158.7 180.7 156.3 177 157.3 173.3L163.5 149C164.3 145.9 167.2 143.9 170.4 144.1C180.2 144.8 187.4 144.9 197.2 144.4C200.5 144.3 203.5 146.6 204 149.8L208.3 175C209 178.7 206.3 182.2 202.6 182.5C188.3 183.8 178.4 183.6 162.5 181.3Z" fill={isActive ? '#3E4491' : '#4B528C'} />
                                                            <text
                                                                x="183.5"
                                                                y="164"
                                                                fill="white"
                                                                fontSize="7.5"
                                                                fontWeight="700"
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                                style={{
                                                                    transform: `rotate(${- (radialScroll + angle)}deg)`,
                                                                    transformOrigin: '183.5px 164px'
                                                                }}
                                                            >
                                                                {spread.label}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </g>
                                        </svg>
                                        {/* Center Preview */}
                                        {(() => {
                                            const preview = hoveredIdx !== null ? spreads[hoveredIdx] : spreads[activeSpreadIdx];
                                            if (!preview) return null;
                                            return (
                                                <div className="absolute top-[10px] left-0 right-0 flex flex-col items-center">
                                                    <div className="w-20 h-14 bg-white rounded p-1 flex gap-0.5 border border-gray-200">
                                                        {preview.pages.map((p, i) => <div key={i} className="flex-1 h-full bg-gray-50 overflow-hidden"><PageThumbnail html={p?.html || p?.content} index={preview.indices[i]} scale={0.1} /></div>)}
                                                    </div>
                                                    <div className="w-2 h-2 bg-white rotate-45 -translate-y-1 border-b border-r border-gray-200" />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer: Progress and Playback Controls */}
            <footer className="z-40 bg-[#4B528C] px-6 pt-3 pb-6 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
                {/* Slider-style Progress Bar */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-center items-center text-[9px] text-white/60 font-black tracking-widest tabular-nums">
                        <div className="flex gap-1.5 flex-wrap justify-center px-4">
                            {[...Array(pages.length)].map((_, i) => (
                                <div
                                    key={i}
                                    onClick={() => onPageClick(i)}
                                    className={`w-1 h-1 rounded-full cursor-pointer transition-all ${currentPage >= i ? 'bg-white scale-110' : 'bg-white/20 hover:bg-white/40'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Control Row */}
                <div className="flex items-center justify-between text-white">
                    {/* Music Icon on Left */}
                    <button onClick={(e) => { e.stopPropagation(); setShowSoundPopup(true); }} className="active:scale-90 transition-transform"><Icon icon="solar:music-notes-bold" className="w-4.5 h-4.5" /></button>

                    {/* Centered Playback */}
                    <div className="flex items-center gap-10">
                        <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="active:scale-75 transition-all"><Icon icon="ph:skip-back-fill" className="w-4.5 h-4.5" /></button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="active:scale-90 transition-transform"><Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-5.5 h-5.5" /></button>
                        <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="active:scale-75 transition-all"><Icon icon="ph:skip-forward-fill" className="w-4.5 h-4.5" /></button>
                    </div>

                    {/* Fullscreen Icon on Right */}
                    <button onClick={handleFullScreen} className="active:scale-90 transition-transform"><Icon icon="lucide:fullscreen" className="w-4.5 h-4.5" /></button>
                </div>
            </footer>

            {/* Popups Layer */}
            {renderPopups()}
        </div>
    );
};

export default MobileLayout2;
