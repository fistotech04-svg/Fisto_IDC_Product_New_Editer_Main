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

const MobileLayout6 = ({
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
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);
    const progressRef = useRef(null);
    const scrollRef = useRef(null);
    const [currentZoom, setCurrentZoom] = useState(0.5);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [showProfilePanel, setShowProfilePanel] = useState(false);

    const closeAllPopups = () => {
        setShowThumbnailBar(false);
        setShowTOC(false);
        setShowAddNotesPopup(false);
        setShowAddBookmarkPopup(false);
        setShowProfilePanel(false);
    };

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
            '--accent-color': '#575C9C',
            '--header-blue': '#0B0F4E',
        };
    }, [activeLayout]);

    // Popup Rendering Logic - Shared by both Landscape and Portrait
    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {/* TOC Popup - Landscape Only (portrait handles TOC inline in the layout) */}
                {showTOC && isLandscape && (
                    <motion.div
                        key="toc-sidebar"
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-12 top-0 bottom-0 w-72 bg-white pointer-events-auto shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col border-l border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="h-14 flex items-center justify-between px-5 border-b shrink-0 border-gray-50">
                            <span className="text-[14px] font-bold text-[#575C9C]">Table of Contents</span>
                            <button onClick={() => setShowTOC(false)} className="text-[#575C9C] opacity-50 hover:opacity-100 transition-opacity">
                                <Icon icon="lucide:x" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Area */}
                        <div className="px-4 py-3 border-b border-gray-50">
                            <div className="flex items-center bg-gray-50/80 rounded-lg px-3 py-2 border border-gray-100 group transition-all focus-within:border-[#575C9C]/30 focus-within:bg-white shadow-sm">
                                <Icon icon="lucide:search" className="w-4 h-4 text-[#575C9C]/40" />
                                <input
                                    type="text"
                                    value={tocSearchQuery}
                                    onChange={(e) => setTocSearchQuery(e.target.value)}
                                    placeholder="Search in TOC..."
                                    className="bg-transparent border-0 outline-none text-[12px] ml-2 w-full text-[#575C9C] font-medium placeholder-[#575C9C]/30"
                                />
                                {tocSearchQuery && (
                                    <button onClick={() => setTocSearchQuery('')} className="text-[#575C9C]/40 hover:text-[#575C9C]">
                                        <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto thumbnail-scrollbar p-3">
                            <div className="flex flex-col gap-1">
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
                                                <div key={hIdx} className={hIdx > 0 ? 'mt-2' : ''}>
                                                    <button
                                                        onClick={() => { onPageClick(heading.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                        className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-all group"
                                                    >
                                                        <div className="flex items-center gap-2 truncate pr-2">
                                                            <span className="text-[12px] font-bold text-[#575C9C]/40 tabular-nums shrink-0">{hIdx + 1}.</span>
                                                            <span className="text-[13px] font-bold text-[#575C9C] truncate">{heading.title}</span>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-[#575C9C]/40 tabular-nums">
                                                            {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                        </span>
                                                    </button>

                                                    {filteredSubheadings.length > 0 && (
                                                        <div className="flex flex-col ml-4 mt-0.5 border-l border-gray-100">
                                                            {filteredSubheadings.map((sub, sIdx) => (
                                                                <button
                                                                    key={sIdx}
                                                                    onClick={() => { onPageClick(sub.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-all group pl-4"
                                                                >
                                                                    <div className="flex items-center gap-2 truncate pr-2">
                                                                        <span className="text-[11px] font-medium text-[#575C9C]/30 tabular-nums shrink-0">{hIdx + 1}.{sIdx + 1}</span>
                                                                        <span className="text-[12px] font-medium text-[#575C9C]/70 group-hover:text-[#575C9C] truncate">{sub.title}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-medium text-[#575C9C]/30 tabular-nums">
                                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                        <Icon icon="ph:list-bullets-bold" className="w-12 h-12 mb-2" />
                                        <span className="text-[12px] font-bold">No Table of Contents</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Thumbnail Bar - Landscape Only (portrait handles thumbnails inline in the layout) */}
                {showThumbnailBar && isLandscape && (
                    <motion.div
                        key="thumbnail-sidebar"
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-12 top-0 bottom-0 w-[240px] bg-white pointer-events-auto shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col border-l border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="h-14 flex items-center justify-between px-5 border-b shrink-0 border-gray-50">
                            <span className="text-[14px] font-bold text-[#575C9C]">Thumbnail</span>
                            <button onClick={() => setShowThumbnailBar(false)} className="text-[#575C9C] opacity-50 hover:opacity-100 transition-opacity">
                                <Icon icon="lucide:x" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto thumbnail-scrollbar py-6 px-4 flex flex-col gap-8">
                            {spreads.map((spread, i) => {
                                const isSelected = spread.indices.includes(currentPage);
                                return (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center gap-2.5 cursor-pointer group"
                                        onClick={() => { onPageClick(spread.indices[0]); setShowThumbnailBar(false); }}
                                    >
                                        <div
                                            className={`
                                                relative flex p-1 rounded-sm shadow-md 
                                                border group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-300
                                                ${isSelected ? 'ring-2 ring-offset-2' : ''}
                                            `}
                                            style={{
                                                backgroundColor: '#FFFFFF',
                                                borderColor: isSelected ? '#575C9C' : 'rgba(0,0,0,0.1)',
                                                '--tw-ring-color': '#575C9C'
                                            }}
                                        >
                                            <div className="flex bg-gray-50/30 gap-0.5">
                                                {spread.pages.map((p, pi) => (
                                                    <div
                                                        key={pi}
                                                        className={`w-[60px] h-[84px] bg-white relative overflow-hidden ${pi === 0 && spread.pages.length > 1 ? 'border-r border-gray-100' : ''}`}
                                                    >
                                                        <PageThumbnail html={p.html || p.content} index={spread.indices[pi]} scale={0.15} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-bold transition-colors ${isSelected ? 'text-[#575C9C]' : 'text-[#575C9C]/60 group-hover:text-[#575C9C]'}`}>
                                            {spread.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Profile Panel - Orientation Aware */}
                {showProfilePanel && (
                    <div className="absolute inset-0 z-[100] pointer-events-auto">
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" onClick={() => setShowProfilePanel(false)} />
                        <ProfilePopup
                            onClose={() => setShowProfilePanel(false)}
                            settings={profileSettings}
                            isMobile={true}
                            activeLayout={activeLayout}
                        />
                    </div>
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
                    isLandscape={isLandscape}
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

    if (isLandscape) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#BDC3D9]" style={{ ...layoutVariables }}>
                <style>
                    {`
                        .thumbnail-scrollbar::-webkit-scrollbar {
                            width: 4px;
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
                        .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                        }
                        .scrollbar-hide {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}
                </style>

                {/* Header - Dark Theme */}
                <header
                    className="z-[70] h-11 flex items-center justify-between px-6 shrink-0 w-full relative border-b border-white/10"
                    style={{ backgroundColor: '#575C9C' }}
                >
                    {/* Left: Search Bar */}
                    <div className="flex items-center w-[140px] relative top-1 ml-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center bg-[#DDE0F4] rounded-[3px] px-2 h-5 w-full shadow-inner border border-white/5">
                            <Icon icon="lucide:search" className="text-[#575C9C] w-2.5 h-2.5 opacity-40" />
                            <input
                                type="text"
                                placeholder="Quick Search..."
                                className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/40 text-[9px] outline-none w-full ml-1.5 font-medium"
                                value={localSearchQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSearchQuery(val);
                                    if (val.length >= 1) {
                                        const results = [];
                                        const lowerQuery = val.toLowerCase();
                                        pages.forEach((page, index) => {
                                            let text = (page.html || page.content || '');
                                            text = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
                                            text = text.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");
                                            text = text.replace(/<[^>]*>/g, ' ');
                                            const words = text.split(/\s+/);
                                            for (let i = 0; i < words.length; i++) {
                                                const word = words[i].replace(/[^a-zA-Z0-9]/g, '');
                                                if (word.length > 2 && word.toLowerCase().includes(lowerQuery)) {
                                                    const context = words.slice(Math.max(0, i - 2), i + 3).join(' ');
                                                    results.push({ word: words[i], context: context.replace(words[i], '').trim(), pageNumber: index + 1 });
                                                    if (results.length > 15) break;
                                                }
                                            }
                                            if (results.length > 15) return;
                                        });
                                        setRecommendations(results.slice(0, 6));
                                    } else {
                                        setRecommendations([]);
                                    }
                                }}
                            />
                        </div>

                        {/* Search Suggestions Dropdown */}
                        <AnimatePresence>
                            {recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-[24px] left-0 right-0 bg-white rounded-b-[3px] shadow-2xl z-[100] border-x border-b border-gray-100 overflow-hidden"
                                >
                                    <div className="px-3 py-1.5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-[#575C9C]">Suggestions</span>
                                        <button onClick={() => setRecommendations([])} className="text-[#575C9C] opacity-50 hover:opacity-100"><Icon icon="lucide:x" className="w-2.5 h-2.5" /></button>
                                    </div>
                                    <div className="max-h-[180px] overflow-y-auto thumbnail-scrollbar">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={idx}
                                                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setRecommendations([]);
                                                    setLocalSearchQuery('');
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[10px] font-bold text-[#575C9C]">{rec.word}</span>
                                                    <span className="text-[8px] font-bold text-[#575C9C]/40 group-hover:text-[#575C9C]/60">Pg {rec.pageNumber}</span>
                                                </div>
                                                <p className="text-[9px] text-gray-400 truncate italic">"...{rec.context}..."</p>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Center: Book Name */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-[11px] font-bold tracking-wide opacity-90 truncate max-w-[200px]">
                            {settings.bookName || "Flipbook"}
                        </span>
                    </div>

                    {/* Right: Logo */}
                    <div className="flex items-center shrink-0">
                        {settings.logo && (
                            <img src={settings.logo} alt="Logo" className="h-6 object-contain" />
                        )}
                    </div>
                </header>

                <div className="flex-1 relative overflow-hidden">
                    {/* Center Book Viewer */}
                    <div className="absolute inset-0 right-12 flex items-center justify-center">
                        {/* Navigation Arrows */}
                        <div className="absolute left-12 z-30 flex items-center gap-4">
                            <button className="text-white/20 hover:text-white transition-colors active:scale-90" onClick={() => onPageClick(0)}>
                                <Icon icon="ph:skip-back-bold" className="w-6 h-6" />
                            </button>
                            <button className="text-white/20 hover:text-white transition-colors active:scale-90" onClick={() => bookRef.current?.pageFlip()?.flipPrev()}>
                                <Icon icon="ph:caret-left-bold" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="absolute right-4 z-30 flex items-center gap-4">
                            <button className="text-white/20 hover:text-white transition-colors active:scale-90" onClick={() => bookRef.current?.pageFlip()?.flipNext()}>
                                <Icon icon="ph:caret-right-bold" className="w-6 h-6" />
                            </button>
                            <button className="text-white/20 hover:text-white transition-colors active:scale-90" onClick={() => onPageClick(pages.length - 1)}>
                                <Icon icon="ph:skip-forward-bold" className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Flipbook with Zoom */}
                        <div className="transition-transform duration-500 ease-out" style={{ transform: `scale(${currentZoom - 0.1})`, transformOrigin: 'center center' }}>
                            {children}
                        </div>

                        {/* Page Indicator Badge */}
                        <div
                            className="absolute bottom-4 right-14 px-3 py-1.5 rounded-md shadow-2xl flex items-center gap-1.5 border border-white/20 backdrop-blur-md z-40"
                            style={{ backgroundColor: '#575C9C' }}
                        >
                            <span className="text-white text-[10px] font-bold">Page </span>
                            <input
                                type="text"
                                value={pageInputValue}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) setPageInputValue(val);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const pageNum = parseInt(pageInputValue, 10);
                                        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pages.length) onPageClick(pageNum - 1);
                                        else setPageInputValue(String(currentPage + 1));
                                        e.target.blur();
                                    }
                                }}
                                className="text-white text-[10px] font-bold bg-transparent border-none outline-none text-center w-5"
                            />
                            <span className="text-white text-[10px] font-bold opacity-60"> / {pages.length}</span>
                        </div>
                    </div>

                    {/* Right Sidebar Toolbar */}
                    <div className="absolute right-3 top-0 bottom-0 w-9 bg-[#575C9C] z-50 flex flex-col items-center py-4 gap-5 border-l border-white/5 shadow-2xl overflow-y-auto scrollbar-hide">
                        <button
                            onClick={() => {
                                if (showTOC) {
                                    setShowTOC(false);
                                } else {
                                    closeAllPopups();
                                    setShowTOC(true);
                                }
                            }}
                            className={`transition-all ${showTOC ? 'text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            <Icon icon="fluent:text-bullet-list-24-filled" className="w-[15px] h-[15px]" />
                        </button>
                        <button
                            onClick={() => {
                                if (showThumbnailBar) {
                                    setShowThumbnailBar(false);
                                } else {
                                    closeAllPopups();
                                    setShowThumbnailBar(true);
                                }
                            }}
                            className={`transition-all ${showThumbnailBar ? 'text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            <Icon icon="ph:squares-four-fill" className="w-[15px] h-[15px]" />
                        </button>
                        <button onClick={() => { closeAllPopups(); setShowAddNotesPopup(true); }} className={`transition-all ${showAddNotesPopup ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                            <Icon icon="material-symbols-light:add-notes" className="w-[15px] h-[15px]" />
                        </button>
                        <button onClick={() => { closeAllPopups(); setShowAddBookmarkPopup(true); }} className={`transition-all ${showAddBookmarkPopup ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                            <Icon icon="fluent:bookmark-24-filled" className="w-[15px] h-[15px]" />
                        </button>
                        <button className="text-white/60 hover:text-white transition-all"><Icon icon="solar:gallery-bold" className="w-[15px] h-[15px]" /></button>
                        <button onClick={() => { closeAllPopups(); setShowSoundPopup(true); }} className={`transition-all ${showSoundPopup ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                            <Icon icon="solar:music-notes-bold" className="w-[15px] h-[15px]" />
                        </button>
                        <button onClick={() => { closeAllPopups(); setShowProfilePanel(true); }} className={`transition-all ${showProfilePanel ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                            <Icon icon="fluent:person-24-filled" className="w-[15px] h-[15px]" />
                        </button>
                        <button onClick={handleShare} className="text-white/60 hover:text-white transition-all"><Icon icon="mage:share-fill" className="w-[15px] h-[15px]" /></button>
                        <button onClick={handleDownload} className="text-white/60 hover:text-white transition-all"><Icon icon="meteor-icons:download" className="w-[15px] h-[15px]" /></button>
                        <button onClick={handleFullScreen} className="text-white/60 hover:text-white transition-all"><Icon icon="lucide:fullscreen" className="w-[15px] h-[15px]" /></button>
                    </div>
                </div>

                {/* Footer - Media Controls & Zoom */}
                <footer
                    className="h-9 shrink-0 z-[70] px-6 flex items-center gap-8 border-t border-white/5 relative -top-1"
                    style={{ backgroundColor: '#575C9C' }}
                >
                    {/* Media Controls */}
                    <div className="flex items-center gap-6 text-white shrink-0 ml-4">
                        <button onClick={() => onPageClick(0)} className="opacity-80 hover:opacity-100 transition-all"><Icon icon="ph:skip-back-bold" className="w-3 h-3" /></button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="hover:scale-110 transition-transform"><Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-4 h-4" /></button>
                        <button onClick={() => onPageClick(pages.length - 1)} className="opacity-80 hover:opacity-100 transition-all"><Icon icon="ph:skip-forward-bold" className="w-3 h-3" /></button>
                    </div>

                    {/* Progress Slider */}
                    <div
                        className="flex-1 flex items-center relative h-6 cursor-pointer group"
                        onClick={handleProgressClick}
                        ref={progressRef}
                    >
                        <div className="w-full h-[2px] bg-white/20 rounded-full relative overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-white transition-all duration-300"
                                style={{ width: `${progressPercentage}%`, boxShadow: '0 0 10px rgba(255,255,255,0.4)' }}
                            />
                        </div>
                        <div
                            className="absolute h-2.5 w-2.5 bg-white rounded-full shadow-lg z-10 transition-all duration-300"
                            style={{ left: `calc(${progressPercentage}% - 5px)` }}
                        />
                    </div>

                    {/* Zoom & Reset */}
                    <div className="flex items-center gap-4 shrink-0 mr-4">
                        <div className="flex items-center bg-white/10 rounded px-1.5 py-0.5 gap-3 border border-white/10">
                            <button onClick={() => setCurrentZoom(prev => Math.max(0.1, prev - 0.05))} className="text-white/60 hover:text-white"><Icon icon="lucide:minus" className="w-3 h-3" /></button>
                            <span className="text-white text-[9px] font-bold min-w-[28px] text-center">{Math.round((currentZoom / 0.5) * 100)}%</span>
                            <button onClick={() => setCurrentZoom(prev => Math.min(1.5, prev + 0.05))} className="text-white/60 hover:text-white"><Icon icon="lucide:plus" className="w-3 h-3" /></button>
                        </div>
                        <button
                            onClick={() => setCurrentZoom(0.5)}
                            className="bg-white text-[#575C9C] text-[9px] font-bold px-2 py-0.5 rounded shadow-lg active:scale-95 transition-all"
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
        /* Portrait Mobile Layout 6 - Matching Screenshot */
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#BDC3D9]" style={{ ...layoutVariables }}>
            {/* Top dark blue area */}
            <div className="h-10 w-full shrink-0" style={{ backgroundColor: '#0B0F4E' }} />

            {/* Header */}
            <header className="z-50 px-4 pt-3 pb-3 flex flex-col gap-3 relative shrink-0" style={{ backgroundColor: '#575C9C' }}>
                {/* Row 1: Book Name & Logo */}
                <div className="flex items-center justify-between">
                    <span className="text-white text-[13px] font-medium truncate opacity-90">{bookName || "Name of the book"}</span>
                </div>

                {/* Row 2: Menu Button & Search Bar */}
                <div className="flex items-center gap-1.5 relative">
                    <button
                        onClick={() => {
                            if (showThumbnailBar || showTOC || showAddNotesPopup || showAddBookmarkPopup || showProfilePanel) {
                                closeAllPopups();
                            } else {
                                setShowSidebar(!showSidebar);
                            }
                        }}
                        className="w-7 h-7 border border-white/30 flex items-center justify-center rounded-[3px] bg-[#DDE0F4] text-[#575C9C] active:scale-95 transition-all shrink-0"
                    >
                        <Icon
                            icon={
                                showThumbnailBar ? "ph:squares-four-fill" :
                                    showTOC ? "fluent:text-bullet-list-24-filled" :
                                        showAddNotesPopup ? "material-symbols-light:add-notes" :
                                            showAddBookmarkPopup ? "fluent:bookmark-24-filled" :
                                                showProfilePanel ? "fluent:person-24-filled" :
                                                    showSoundPopup ? "solar:music-notes-bold" :
                                                        "lucide:menu"
                            }
                            className="w-4 h-4"
                        />
                    </button>
                    <div className="w-[200px] bg-[#DDE0F4] rounded-[3px] px-2.5 h-7 flex items-center gap-2 shadow-inner border border-white/5">
                        <Icon icon="lucide:search" className="text-[#575C9C] w-3 h-3 opacity-40" />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/40 text-[11px] outline-none w-full font-medium"
                            value={localSearchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setLocalSearchQuery(val);
                                if (val.length >= 1) {
                                    const results = [];
                                    const lowerQuery = val.toLowerCase();
                                    pages.forEach((page, index) => {
                                        let text = (page.html || page.content || '');
                                        text = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
                                        text = text.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");
                                        text = text.replace(/<[^>]*>/g, ' ');
                                        const words = text.split(/\s+/);
                                        for (let i = 0; i < words.length; i++) {
                                            const word = words[i].replace(/[^a-zA-Z0-9]/g, '');
                                            if (word.length > 2 && word.toLowerCase().includes(lowerQuery)) {
                                                const context = words.slice(Math.max(0, i - 2), i + 3).join(' ');
                                                results.push({
                                                    word: words[i],
                                                    context: context.replace(words[i], '').trim(),
                                                    pageNumber: index + 1
                                                });
                                                if (results.length > 15) break;
                                            }
                                        }
                                        if (results.length > 15) return;
                                    });
                                    setRecommendations(results.slice(0, 6));
                                } else {
                                    setRecommendations([]);
                                }
                            }}
                        />
                    </div>

                    {/* Search Suggestions Dropdown */}
                    <AnimatePresence>
                        {recommendations.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute top-[32px] left-[34px] w-[200px] bg-white rounded-b-[3px] shadow-2xl z-[100] border-x border-b border-gray-100 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[#575C9C]">Suggestions</span>
                                    <button
                                        onClick={() => setRecommendations([])}
                                        className="text-[#575C9C] opacity-40 hover:opacity-100"
                                    >
                                        <Icon icon="lucide:x" className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="flex flex-col py-1 max-h-[160px] overflow-y-auto thumbnail-scrollbar">
                                    {recommendations.map((rec, idx) => (
                                        <button
                                            key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                            className="flex items-center justify-between px-3 py-1.5 transition-colors hover:bg-gray-50 group text-left"
                                            onClick={() => {
                                                onPageClick(rec.pageNumber - 1);
                                                const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                setLocalSearchQuery(fullQuery);
                                                setSearchQuery(fullQuery);
                                                setRecommendations([]);
                                            }}
                                        >
                                            <div className="flex flex-col items-start overflow-hidden flex-1 mr-2">
                                                <span className="text-[10px] text-[#575C9C] opacity-90 group-hover:opacity-100 truncate w-full">
                                                    <span className="font-bold mr-1">{rec.word}</span>
                                                    {rec.context && <span className="font-normal opacity-60">{rec.context}</span>}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-medium text-[#575C9C] opacity-50 tabular-nums">Pg {rec.pageNumber}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col px-4 overflow-hidden">
                {/* Sidebar Toolbar */}
                {showSidebar && (
                    <div
                        className="absolute left-3.8 top-7 bottom-6.8 w-8 z-[60] flex flex-col items-center py-4 gap-5 shadow-2xl rounded-lg"
                        style={{ backgroundColor: '#575C9C' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                const isCurrentlyOpen = showThumbnailBar;
                                closeAllPopups();
                                setShowThumbnailBar(!isCurrentlyOpen);
                            }}
                            className="text-white hover:scale-110 active:scale-90 transition-all"
                        >
                            <Icon icon="ph:squares-four-fill" className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                const isCurrentlyOpen = showTOC;
                                closeAllPopups();
                                setShowTOC(!isCurrentlyOpen);
                            }}
                            className="text-white hover:scale-110 active:scale-90 transition-all"
                        >
                            <Icon icon="fluent:text-bullet-list-24-filled" className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => {
                                const isCurrentlyOpen = showAddNotesPopup;
                                closeAllPopups();
                                setShowAddNotesPopup(!isCurrentlyOpen);
                            }}
                            className="text-white hover:scale-110 active:scale-90 transition-all"
                        >
                            <Icon icon="material-symbols-light:add-notes" className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => {
                                const isCurrentlyOpen = showAddBookmarkPopup;
                                closeAllPopups();
                                setShowAddBookmarkPopup(!isCurrentlyOpen);
                            }}
                            className="text-white hover:scale-110 active:scale-90 transition-all"
                        >
                            <Icon icon="fluent:bookmark-24-filled" className="w-3 h-3" />
                        </button>
                        <button className="text-white hover:scale-110 active:scale-90 transition-all">
                            <Icon icon="solar:gallery-bold" className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => {
                                const isCurrentlyOpen = showSoundPopup;
                                closeAllPopups();
                                setShowSoundPopup(!isCurrentlyOpen);
                            }}
                            className="text-white hover:scale-110 active:scale-90 transition-all"
                        >
                            <Icon icon="solar:music-notes-bold" className="w-3 h-3" />
                        </button>

                        <button
                            onClick={() => {
                                const isCurrentlyOpen = showProfilePanel;
                                closeAllPopups();
                                setShowProfilePanel(!isCurrentlyOpen);
                            }}
                            className="text-white hover:scale-110 active:scale-90 transition-all"
                        >
                            <Icon icon="fluent:person-24-filled" className="w-3 h-3" />
                        </button>

                        <button onClick={() => handleShare()} className="text-white hover:scale-110 active:scale-90 transition-all">
                            <Icon icon="mage:share-fill" className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDownload()} className="text-white hover:scale-110 active:scale-90 transition-all">
                            <Icon icon="meteor-icons:download" className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleFullScreen()} className="text-white hover:scale-110 active:scale-90 transition-all">
                            <Icon icon="lucide:scan" className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Thumbnail Bar - Portrait View */}
                <AnimatePresence>
                    {showThumbnailBar && (
                        <div
                            className="absolute left-1 top-0 bottom-0 w-36 z-[70] flex flex-col bg-white shadow-2xl border-r border-gray-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pl-6 pr-3 py-2 border-b border-gray-100">
                                <span className="text-[11px] font-semibold text-[#3E4491]">Thumbnail</span>
                                <button
                                    onClick={() => setShowThumbnailBar(false)}
                                    className="opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    <Icon icon="lucide:x" className="w-3 h-3 text-[#3E4491]" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pl-6 pr-3 py-3 flex flex-col gap-5 overflow-y-auto overflow-x-hidden thumbnail-scrollbar">
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    return (
                                        <div
                                            key={idx}
                                            className="flex flex-col items-center cursor-pointer group"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPageClick(spread.indices[0]);
                                                setShowThumbnailBar(false);
                                            }}
                                        >
                                            <div
                                                className={`
                                                    relative flex p-[2px] rounded-[2px] shadow-sm 
                                                    border transition-all duration-300
                                                    ${isSelected ? 'ring-1 ring-[#575C9C] border-[#575C9C]' : 'border-gray-200'}
                                                `}
                                            >
                                                <div className="flex bg-gray-50/30 w-28 justify-center">
                                                    {spread.pages.map((page, pIdx) => (
                                                        <div
                                                            key={pIdx}
                                                            className={`
                                                                w-14 h-20 bg-white overflow-hidden relative
                                                                ${pIdx === 0 && spread.pages.length > 1 ? 'border-r border-gray-50' : ''}
                                                            `}
                                                        >
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={spread.indices[pIdx]}
                                                                scale={0.12}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-[8px] mt-1.5 text-[#575C9C] font-semibold opacity-70">
                                                {spread.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* TOC Panel - Portrait View */}
                <AnimatePresence>
                    {showTOC && !isLandscape && (
                        <div
                            className="absolute left-1 top-0 bottom-0 w-36 z-[70] flex flex-col bg-white shadow-2xl border-r border-gray-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pl-6 pr-3 py-2 border-b border-gray-100">
                                <span className="text-[11px] font-semibold text-[#3E4491]">Table of Contents</span>
                                <button
                                    onClick={() => setShowTOC(false)}
                                    className="opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    <Icon icon="lucide:x" className="w-3 h-3 text-[#3E4491]" />
                                </button>
                            </div>

                            {/* Search Area */}
                            {settings.tocSettings?.addSearch !== false && (
                                <div className="px-3 py-2 border-b border-gray-50">
                                    <div className="flex items-center bg-gray-50/50 rounded-[3px] px-2 py-1 border border-gray-100">
                                        <Icon icon="lucide:search" className="w-2.5 h-2.5 text-[#575C9C]/40" />
                                        <input
                                            type="text"
                                            value={tocSearchQuery}
                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                            placeholder="Search..."
                                            className="bg-transparent border-0 outline-none text-[10px] ml-1.5 w-full text-[#575C9C] placeholder-[#575C9C]/30 font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden thumbnail-scrollbar py-3 px-4">
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
                                            .map((heading, hIdx) => (
                                                <div key={hIdx} className={hIdx > 0 ? 'mt-3' : ''}>
                                                    <div
                                                        className="flex items-center justify-between py-1 cursor-pointer group"
                                                        onClick={() => {
                                                            onPageClick(heading.page - 1);
                                                            setShowTOC(false);
                                                            setTocSearchQuery('');
                                                        }}
                                                    >
                                                        <span className="text-[10px] text-[#575C9C] font-bold truncate pr-2">{heading.title}</span>
                                                        <span className="text-[9px] text-[#575C9C] opacity-50 tabular-nums">{String(heading.page).padStart(2, '0')}</span>
                                                    </div>
                                                    {heading.subheadings?.filter(sub =>
                                                        !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                                    ).map((sub, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className="flex items-center justify-between py-1 pl-3 cursor-pointer opacity-80"
                                                            onClick={() => {
                                                                onPageClick(sub.page - 1);
                                                                setShowTOC(false);
                                                                setTocSearchQuery('');
                                                            }}
                                                        >
                                                            <span className="text-[9px] text-[#575C9C] font-semibold truncate pr-2">{sub.title}</span>
                                                            <span className="text-[8px] text-[#575C9C] opacity-40 tabular-nums">{String(sub.page).padStart(2, '0')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-[9px] text-center pt-8 opacity-40 font-medium text-[#575C9C]">
                                            No contents found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Inline Profile Panel - Grid6/Grid4 style */}
                {showProfilePanel && (
                    <div
                        className="absolute left-1 top-0 bottom-0 w-36 z-[70] flex flex-col bg-white shadow-2xl border-r border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pl-6 pr-3 py-2 border-b border-gray-100">
                            <span className="text-[11px] font-semibold text-[#3E4491]">Profile</span>
                            <button
                                onClick={() => setShowProfilePanel(false)}
                                className="opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <Icon icon="lucide:x" className="w-3 h-3 text-[#3E4491]" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 pl-6 pr-3 py-3 flex flex-col gap-2 overflow-y-auto">
                            {profileSettings?.name || profileSettings?.about ? (
                                <>
                                    <div className="flex items-start gap-1">
                                        <span className="text-[9px] font-bold whitespace-nowrap text-[#3E4491]">Name :</span>
                                        <span className="text-[9px] font-medium opacity-80 text-[#575C9C]">{profileSettings?.name}</span>
                                    </div>

                                    <div className="flex items-start gap-1">
                                        <span className="text-[9px] font-bold whitespace-nowrap text-[#3E4491]">About :</span>
                                        <div className="text-[9px] font-medium leading-relaxed text-justify opacity-80 text-[#575C9C]">
                                            {profileSettings?.about}
                                        </div>
                                    </div>

                                    <div className="mt-1">
                                        <h3 className="text-[10px] font-bold mb-1.5 text-[#3E4491]">Contact</h3>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {profileSettings?.contacts?.filter(c => c.value).map((contact) => (
                                                <button
                                                    key={contact.id}
                                                    className={`w-6 h-6 rounded-[4px] flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${contact.type === 'x' ? 'bg-black' :
                                                        contact.type === 'facebook' ? 'bg-[#3138A9]' :
                                                            contact.type === 'instagram' ? 'bg-gradient-to-tr from-[#FFD600] via-[#FF0100] to-[#D800FF]' :
                                                                'bg-white border border-gray-300'
                                                        }`}
                                                >
                                                    {contact.type === 'x' && <Icon icon="ri:twitter-x-fill" className="text-white w-3 h-3" />}
                                                    {contact.type === 'facebook' && <Icon icon="ri:facebook-fill" className="text-white w-3.5 h-3.5" />}
                                                    {(contact.type === 'email' || contact.type === 'gmail') && <Icon icon="logos:google-gmail" className="w-3 h-3" />}
                                                    {contact.type === 'instagram' && <Icon icon="ri:instagram-line" className="text-white w-3 h-3" />}
                                                    {(contact.type === 'phone' || contact.type === 'contact') && <Icon icon="ph:phone-fill" className="text-[#4B4EFC] w-3 h-3 -rotate-90" />}
                                                    {contact.type === 'linkedin' && <Icon icon="logos:linkedin-icon" width="12" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-[9px] text-center pt-8 opacity-60 font-medium text-[#575C9C]">
                                    No profile found
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation Arrows */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
                    <button
                        className="p-2 text-[#575C9C] active:scale-95 transition-transform"
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                    >
                        <Icon icon="ph:caret-left-bold" className="w-8 h-8 opacity-40" />
                    </button>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                    <button
                        className="p-2 text-[#575C9C] active:scale-95 transition-transform"
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                    >
                        <Icon icon="ph:caret-right-bold" className="w-8 h-8 opacity-40" />
                    </button>
                </div>

                {/* Book Area */}
                <div className="flex-1 relative flex items-center justify-center">
                    <div className="relative -mt-24">
                        <div className="transition-transform duration-500 ease-out" style={{ transform: `scale(${currentZoom + 0.05})`, transformOrigin: 'center center' }}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="z-50 px-4 pb-6 pt-2 flex flex-col gap-4 relative shrink-0" style={{ backgroundColor: '#575C9C' }}>
                {/* Row 1: Zoom Control (Top Right) */}
                <div className="flex justify-end pr-2">
                    <div className="flex items-center shrink-0 bg-[#DDE0F4] rounded-[4px] p-[2px] shadow-sm pr-1">
                        <div className="flex items-center gap-1.5 px-1 pb-1 pt-1">
                            <button
                                onClick={() => setCurrentZoom(prev => Math.max(0.1, prev - 0.05))}
                                className="text-[#575C9C] active:scale-90 transition-transform"
                            >
                                <Icon icon="lucide:minus" className="w-[12px] h-[12px]" />
                            </button>
                            <span className="text-[#575C9C] text-[10px] font-bold min-w-[28px] text-center">
                                {Math.round((currentZoom / 0.5) * 100)}%
                            </span>
                            <button
                                onClick={() => setCurrentZoom(prev => Math.min(1.5, prev + 0.05))}
                                className="text-[#575C9C] active:scale-90 transition-transform"
                            >
                                <Icon icon="lucide:plus" className="w-[12px] h-[12px]" />
                            </button>
                        </div>
                        <button
                            onClick={() => setCurrentZoom(0.5)}
                            className="bg-white text-[#575C9C] text-[10px] font-bold px-2 py-0.5 rounded-[2px] shadow-sm active:scale-95 transition-all ml-1"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Row 2: Media Controls & Progress */}
                <div className="flex items-center gap-4 px-2">
                    <div className="flex items-center gap-6 text-white shrink-0">
                        <button onClick={() => onPageClick(0)} className="active:scale-90 transition-all opacity-80 hover:opacity-100">
                            <Icon icon="ph:skip-back-bold" className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="active:scale-90 transition-all">
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-4.5 h-4.5" />
                        </button>
                        <button onClick={() => onPageClick(pages.length - 1)} className="active:scale-90 transition-all opacity-80 hover:opacity-100">
                            <Icon icon="ph:skip-forward-bold" className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div
                        ref={progressRef}
                        className="flex-1 bg-white/20 h-1.5 rounded-full cursor-pointer relative overflow-hidden"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="absolute left-0 top-0 h-full transition-all duration-300 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </footer>

            {renderPopups()}
        </div>
    );
};

export default MobileLayout6;
