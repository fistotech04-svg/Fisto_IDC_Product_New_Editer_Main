import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
const Grid5Layout = lazy(() => import('../../Layouts/Grid5Layout'));
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
                    height: '506px',
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

const MobileLayout5 = (props) => {
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
    } = props;
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const progressRef = useRef(null);
    const scrollRef = useRef(null);
    const [currentZoom, setCurrentZoom] = useState(0.5);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [showNotesSelection, setShowNotesSelection] = useState(false);
    const [tocSearchQuery, setTocSearchQuery] = useState('');

    const [isLandscapeReady, setIsLandscapeReady] = useState(false);
    useEffect(() => {
        if (isLandscape) {
            const timer = setTimeout(() => setIsLandscapeReady(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsLandscapeReady(false);
        }
    }, [isLandscape]);

    const effectiveIsLandscape = isLandscape && isLandscapeReady;

    const currentProfile = (profileSettings && profileSettings[activeLayout]) ? profileSettings[activeLayout] : profileSettings;
    const profileName = currentProfile?.name || '';
    const profileAbout = currentProfile?.about || '';
    const profileContacts = currentProfile?.contacts || [];

    const handleContactClick = (e, contact) => {
        e.preventDefault();
        e.stopPropagation();
        if (!contact?.value) return;

        const value = contact.value.trim();
        const type = contact.type;
        const lowerValue = value.toLowerCase();

        const isEmail = type === 'email' || (value.includes('@') && !lowerValue.startsWith('http'));
        const isPhone = type === 'phone';

        if (isEmail) {
            if (lowerValue.endsWith('@gmail.com')) {
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${value}`, '_blank');
            } else if (lowerValue.endsWith('@outlook.com') || lowerValue.endsWith('@hotmail.com')) {
                window.open(`https://outlook.office.com/mail/deeplink/compose?to=${value}`, '_blank');
            } else {
                window.location.href = `mailto:${value}`;
            }
        } else if (isPhone) {
            window.location.href = `tel:${value}`;
        } else {
            const url = value.startsWith('http') ? value : `https://${value}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
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

    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {/* Table of Contents - Unified for both orientations */}
                {showTOC && !effectiveIsLandscape && (
                    <>
                        <div className="fixed inset-0 z-[150] bg-transparent pointer-events-auto" onClick={() => setShowTOC(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-[160] pointer-events-auto bottom-[100px] left-[52px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative">
                                <div
                                    className="absolute -bottom-[12px] left-[32px] -translate-x-1/2 z-10 pointer-events-none"
                                    style={{ width: '10px', height: '14px' }}
                                >
                                    <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 0L5 20L10 0" fill="#FFFFFF" />
                                        <path d="M0 0L5 20L10 0" fill={getLayoutColor('toc-bg', '#FFFFFF')} />
                                    </svg>
                                </div>

                                {/* Popup Card */}
                                <div
                                    className="rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-[180px] flex flex-col relative z-20 overflow-hidden border border-gray-100"
                                    style={{ backgroundColor: '#FFFFFF' }}
                                >
                                    <div
                                        className="absolute inset-0 z-0"
                                        style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
                                    />
                                    <div className="relative z-10 p-3.5 flex flex-col">
                                        <div className="flex items-center justify-between mb-3 shrink-0">
                                            <h2
                                                className="text-[12px] font-bold tracking-tight"
                                                style={{ color: getLayoutColor('toc-text', '#000000') }}
                                            >Table of Contents</h2>
                                            <button onClick={() => setShowTOC(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Search Bar */}
                                        {settings.tocSettings?.addSearch !== false && (
                                            <div className="mb-3">
                                                <div
                                                    className="flex items-center rounded-lg px-2 py-1.5 border transition-all relative overflow-hidden"
                                                    style={{
                                                        borderColor: getLayoutColor('toc-bg', '#FFFFFF').toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                            ? 'rgba(255,255,255,0.2)'
                                                            : 'rgba(0,0,0,0.08)'
                                                    }}
                                                >
                                                    <div
                                                        className="absolute inset-0 z-0"
                                                        style={{
                                                            backgroundColor: getLayoutColor('toc-bg', '#FFFFFF').toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                                ? getLayoutColor('toc-bg', '#FFFFFF')
                                                                : getLayoutColor('toc-text', '#575C9C'),
                                                            opacity: getLayoutColor('toc-bg', '#FFFFFF').toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                                ? 0.15
                                                                : 0.05
                                                        }}
                                                    />
                                                    <div className="relative z-10 flex items-center w-full">
                                                        <Icon icon="lucide:search" className="w-3 h-3" style={{ color: getLayoutColor('toc-text', '#575C9C'), opacity: 0.4 }} />
                                                        <input
                                                            type="text"
                                                            value={tocSearchQuery}
                                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                                            placeholder="Search..."
                                                            className="bg-transparent border-0 outline-none focus:ring-0 text-[10px] ml-1.5 w-full placeholder:text-gray-400"
                                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1 no-scrollbar text-left">
                                            {settings?.tocSettings?.content?.length > 0 ? (
                                                settings.tocSettings.content
                                                    .filter(item => {
                                                        if (!tocSearchQuery) return true;
                                                        const matchMain = item.title.toLowerCase().includes(tocSearchQuery.toLowerCase());
                                                        const matchSub = item.subheadings?.some(sub => sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase()));
                                                        return matchMain || matchSub;
                                                    })
                                                    .map((item, idx) => {
                                                        const filteredSubheadings = item.subheadings?.filter(sub =>
                                                            !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                                        ) || [];

                                                        return (
                                                            <React.Fragment key={item.id || idx}>
                                                                {/* Main Heading */}
                                                                <div
                                                                    className="flex items-center justify-between group cursor-pointer py-0.5"
                                                                    onClick={() => { onPageClick(item.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                                >
                                                                    <div className="flex items-center gap-1.5 truncate pr-2">
                                                                        {settings.tocSettings?.addSerialNumberToHeading !== false && (
                                                                            <span className="text-[10px] font-bold opacity-50 tabular-nums shrink-0" style={{ color: getLayoutColor('toc-text', '#374151') }}>{idx + 1}.</span>
                                                                        )}
                                                                        <span
                                                                            className="text-[11px] font-semibold transition-colors truncate"
                                                                            style={{ color: getLayoutColor('toc-text', '#374151') }}
                                                                        >
                                                                            {item.title}
                                                                        </span>
                                                                    </div>
                                                                    {settings.tocSettings?.addPageNumber !== false && (
                                                                        <span
                                                                            className="text-[10px] font-semibold transition-colors tabular-nums shrink-0"
                                                                            style={{ color: getLayoutColor('toc-text', '#374151') }}
                                                                        >
                                                                            {String(item.page).padStart(2, '0')}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Child Subheadings */}
                                                                {filteredSubheadings.map((sub, sIdx) => (
                                                                    <div
                                                                        key={sub.id || sIdx}
                                                                        className="flex items-center justify-between group cursor-pointer py-0.5"
                                                                        onClick={() => { onPageClick(sub.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                                    >
                                                                        <div className="flex items-center gap-1.5 truncate pr-2 ml-3">
                                                                            {settings.tocSettings?.addSerialNumberToSubheading !== false && (
                                                                                <span className="text-[9px] font-bold opacity-30 tabular-nums shrink-0" style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '1') }}>{idx + 1}.{sIdx + 1}</span>
                                                                            )}
                                                                            <span
                                                                                className="text-[10px] font-medium transition-colors truncate"
                                                                                style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                            >
                                                                                {sub.title}
                                                                            </span>
                                                                        </div>
                                                                        {settings.tocSettings?.addPageNumber !== false && (
                                                                            <span
                                                                                className="text-[9px] font-medium transition-colors tabular-nums shrink-0"
                                                                                style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                            >
                                                                                {String(sub.page).padStart(2, '0')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </React.Fragment>
                                                        );
                                                    })
                                            ) : (
                                                <div className="text-center py-4 text-gray-400 text-[10px] italic">No content found</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* View Bookmark Sidebar */}
                {showViewBookmarkPopup && (
                    <>
                        <div className="fixed inset-0 z-[150] bg-transparent pointer-events-auto" onClick={() => setShowViewBookmarkPopup(false)} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }} className={`absolute right-0 z-[170] pointer-events-auto flex flex-col shadow-2xl border-l border-white/10 ${effectiveIsLandscape ? 'w-[22%] top-0 bottom-0' : 'w-[70%] top-0 bottom-0'}`} style={{ backgroundColor: '#FFFFFF' }}>
                            <div className="flex items-center justify-between px-5 py-6 border-b shrink-0" style={{ borderColor: 'rgba(87, 92, 156, 0.1)' }}>
                                <span className="text-[18px] font-bold text-[#575C9C]">Saved Bookmarks</span>
                                <button onClick={() => setShowViewBookmarkPopup(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Icon icon="lucide:x" className="w-[20px] h-[20px] text-[#575C9C]" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-3">
                                {bookmarks?.length > 0 ? bookmarks.map((bm, idx) => (
                                    <div key={bm.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group hover:bg-[#575C9C]/5 transition-all">
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onPageClick(bm.pageIndex); setShowViewBookmarkPopup(false); }}>
                                            <span className="text-[14px] font-bold text-gray-700 block truncate group-hover:text-[#575C9C]">{bm.label || `Page ${bm.pageIndex + 1}`}</span>
                                            <span className="text-[11px] text-gray-400 font-medium">Page {bm.pageIndex + 1}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onUpdateBookmark?.(bm)} className="p-2 text-gray-400 hover:text-[#575C9C] transition-colors"><Icon icon="lucide:edit-3" className="w-4 h-4" /></button>
                                            <button onClick={() => onDeleteBookmark?.(bm.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40 gap-3 mt-10">
                                        <Icon icon="lucide:bookmark" className="w-12 h-12" />
                                        <span className="text-[14px] font-medium">No bookmarks saved</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}

                {showAddBookmarkPopup && <AddBookmarkPopup onClose={() => setShowAddBookmarkPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddBookmark={onAddBookmark} bookmarkSettings={bookmarkSettings} isMobile={true} activeLayout={activeLayout || 5} isLandscape={effectiveIsLandscape} isMobileLandscape={effectiveIsLandscape} />}
                {showAddNotesPopup && <AddNotesPopup onClose={() => setShowAddNotesPopup(false)} currentPageIndex={currentPage} totalPages={pages.length} onAddNote={onAddNote} activeLayout={activeLayout || 5} isLandscape={effectiveIsLandscape} isSpread={settings.layoutSettings?.isSpread} isMobile={true} isMobileLandscape={effectiveIsLandscape} />}
                {showNotesViewer && <NotesViewerPopup onClose={() => setShowNotesViewer(false)} notes={notes} onPageClick={onPageClick} isMobile={true} activeLayout={activeLayout || 5} isMobileLandscape={effectiveIsLandscape} />}
                <Sound isOpen={showSoundPopup} onClose={() => setShowSoundPopup(false)} otherSetupSettings={otherSetupSettings} onUpdateOtherSetup={onUpdateOtherSetup} isMuted={isMuted} setIsMuted={setIsMuted} isFlipMuted={isFlipMuted} setIsFlipMuted={setIsFlipMuted} isMobile={true} settings={settings} />
                <Export
                    isOpen={showExportPopup}
                    onClose={() => setShowExportPopup(false)}
                    isMobile={true}
                    hideButton={true}
                    pages={pages}
                    bookName={bookName}
                    currentPage={currentPage}
                    isLandscape={isLandscape}
                />
                {showSharePopup && <FlipbookSharePopup onClose={() => setShowSharePopup(false)} isMobile={true} activeLayout={activeLayout || 5} isLandscape={isLandscape} />}
            </AnimatePresence>
        </div>
    );

    if (effectiveIsLandscape) {
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
                    <Grid5Layout
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
                    {renderPopups()}
                </Suspense>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative" style={{ ...layoutVariables }}>
            {/* Portrait Mobile Layout 5 - Matching Screenshot */}
            <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#BDC3D9]">
                {/* Top dark blue bar */}
                <div className="h-12 w-full shrink-0" style={{ backgroundColor: '#0B0F4E' }} />

                {/* Light Layout Header */}
                <header className="z-50 px-5 pt-4 pb-2 flex flex-col gap-3 relative shrink-0" style={{ backgroundColor: '#BDC3D9' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[#575C9C] text-[15px] font-semibold truncate flex-1 opacity-80">{bookName || "Name of the book"}</span>
                        <div className="flex items-center">
                            {settings?.brandingProfile?.logo && logoSettings?.src ? (
                                <img src={logoSettings.src} alt="Logo" className="h-6 w-auto" style={{ opacity: (logoSettings.opacity ?? 100) / 100 }} />
                            ) : null}
                        </div>
                    </div>

                    {/* Search and Zoom Row */}
                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className={`flex-1 bg-white rounded-full px-4 py-1 flex items-center gap-3 shadow-sm relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}>
                            <Icon icon="lucide:search" className="text-[#575C9C] w-4 h-4 opacity-50" />
                            <input
                                type="text"
                                placeholder="Quick Search..."
                                className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/50 text-[13px] outline-none w-full font-medium"
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
                                        setRecommendations(results.slice(0, 5));
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
                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
                                        <div className="flex flex-col py-1">
                                            {recommendations.map((rec, idx) => (
                                                <button key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-[#575C9C]/5 transition-colors text-[#575C9C]" onClick={() => { onPageClick(rec.pageNumber - 1); setRecommendations([]); setShowSuggestions(false); setLocalSearchQuery(rec.word); }}>
                                                    <span className="text-[12px] font-semibold">{rec.word}</span>
                                                    <span className="text-[10px] opacity-60 font-bold">{rec.pageNumber.toString().padStart(2, '0')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Zoom Reset Control */}
                        <div className="flex items-center shrink-0 bg-[#DDE0F4] rounded-full p-[2px] shadow-sm pr-1">
                            <div className="flex items-center gap-1.5 px-1.5 py-1">
                                <button
                                    onClick={() => setCurrentZoom(prev => Math.max(0.1, prev - 0.05))}
                                    className="text-[#575C9C] active:scale-90 transition-transform"
                                >
                                    <Icon icon="lucide:minus" className="w-[12px] h-[12px]" />
                                </button>
                                <span className="text-[#575C9C] text-[9px] font-bold min-w-[22px] text-center">
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
                                className="bg-white text-[#575C9C] text-[9px] font-bold px-1.5 py-1 rounded-full shadow-sm active:scale-95 transition-all"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 relative flex flex-col px-4 overflow-hidden">
                    {/* Book Area - Centered in the available space above the toolbar */}
                    <div className="flex-1 relative flex items-center justify-center" style={{ marginBottom: '100px' }}>
                        <div className="relative -mt-24">
                            {/* Book Render */}
                            <div className="transition-transform duration-500 ease-out" style={{ transform: `scale(${currentZoom + 0.02})`, transformOrigin: 'center center' }}>
                                <div className="relative">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Arrows - Left Side (Independent of book margin) */}
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 z-[90] flex flex-col gap-6 items-center -mt-10 pointer-events-auto">
                        <button
                            className="p-2 text-[#575C9C] active:scale-95 transition-transform"
                            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        >
                            <Icon icon="ph:caret-left-bold" className="w-5 h-5 opacity-60" />
                        </button>

                        <button
                            className="p-2 text-[#575C9C] active:scale-95 transition-transform"
                            onClick={() => onPageClick(0)}
                        >
                            <div className="flex items-center">
                                <div className="w-[2px] h-4 bg-[#575C9C] opacity-60 mr-1 rounded-full" />
                                <Icon icon="ph:caret-left-bold" className="w-4 h-4 opacity-60" />
                            </div>
                        </button>
                    </div>

                    {/* Navigation Arrows - Right Side (Independent of book margin) */}
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 z-[90] flex flex-col gap-6 items-center -mt-10 pointer-events-auto">
                        <button
                            className="p-2 text-[#575C9C] active:scale-95 transition-transform"
                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        >
                            <Icon icon="ph:caret-right-bold" className="w-5 h-5 opacity-60" />
                        </button>

                        <button
                            className="p-2 text-[#575C9C] active:scale-95 transition-transform"
                            onClick={() => onPageClick(pages.length - 1)}
                        >
                            <div className="flex items-center">
                                <Icon icon="ph:caret-right-bold" className="w-4 h-4 opacity-60" />
                                <div className="w-[2px] h-4 bg-[#575C9C] opacity-60 ml-1 rounded-full" />
                            </div>
                        </button>
                    </div>

                    {/* Bottom Toolbar & Controls Area - Pinned to bottom */}
                    <div className="absolute bottom-0 left-6 right-6 z-50 flex flex-col gap-1.5 pb-4 pt-2">

                        {/* Portrait Thumbnail Bar - Matching Screenshot UI */}
                        <AnimatePresence>
                            {showThumbnailBar && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                    className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-white/40 mb-1 overflow-hidden h-[85px] flex items-center px-1"
                                >
                                    {/* Left Navigation Arrow */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                                        }}
                                        className="absolute left-0 z-30 w-8 h-full flex items-center justify-center text-[#575C9C] active:scale-95 transition-transform bg-gradient-to-r from-white via-white/80 to-transparent"
                                    >
                                        <Icon icon="ph:caret-left-bold" className="w-5 h-5 shadow-sm" />
                                    </button>

                                    {/* Thumbnails Container */}
                                    <div
                                        ref={scrollRef}
                                        className="flex-1 flex items-center gap-3 px-8 overflow-x-auto no-scrollbar h-full py-2"
                                        style={{ scrollBehavior: 'smooth' }}
                                    >
                                        {spreads.map((spread, idx) => {
                                            const isActive = spread.indices.includes(currentPage);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPageClick(spread.indices[0]);
                                                    }}
                                                    className={`relative flex-shrink-0 h-full w-[100px] transition-all duration-300 ${isActive ? 'scale-105 active-thumbnail z-10' : 'scale-95 opacity-70 hover:opacity-100'}`}
                                                >
                                                    <div className={`w-full h-full rounded-lg overflow-hidden border shadow-sm relative ${isActive ? 'border-[#575C9C] ring-2 ring-[#575C9C]/30' : 'border-gray-200'}`}>
                                                        {spread.indices.length === 1 ? (
                                                            <PageThumbnail html={pages[spread.indices[0]].html || pages[spread.indices[0]].content} index={spread.indices[0]} scale={0.12} />
                                                        ) : (
                                                            <div className="flex w-full h-full bg-white">
                                                                <div className="w-1/2 h-full border-r border-gray-100">
                                                                    <PageThumbnail html={pages[spread.indices[0]].html || pages[spread.indices[0]].content} index={spread.indices[0]} scale={0.12} />
                                                                </div>
                                                                <div className="w-1/2 h-full">
                                                                    <PageThumbnail html={pages[spread.indices[1]].html || pages[spread.indices[1]].content} index={spread.indices[1]} scale={0.12} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Active Overlay with Page Indicator */}
                                                        {isActive && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                                                <span className="text-white text-[10px] font-bold tabular-nums drop-shadow-md">
                                                                    Page {spread.indices.length === 1 ? spread.indices[0] + 1 : `${spread.indices[0] + 1}/${spread.indices[1] + 1}`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Right Navigation Arrow */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                                        }}
                                        className="absolute right-0 z-30 w-8 h-full flex items-center justify-center text-[#575C9C] active:scale-95 transition-transform bg-gradient-to-l from-white via-white/80 to-transparent"
                                    >
                                        <Icon icon="ph:caret-right-bold" className="w-5 h-5 shadow-sm" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main Icon Toolbar - Capsule shape */}
                        <div className="bg-[#575C9C] rounded-full px-5 h-[34px] flex items-center justify-between shadow-xl">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const nextState = !showThumbnailBar;
                                setShowThumbnailBar(nextState);
                                if (nextState) {
                                    setShowTOC(false);
                                    setShowNotesOptions(false);
                                    setShowBookmarkOptions(false);
                                    setShowProfilePopup(false);
                                    setShowSoundPopup(false);
                                }
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="ep:menu" className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const nextState = !showTOC;
                                setShowTOC(nextState);
                                if (nextState) {
                                    setShowThumbnailBar(false);
                                    setShowNotesOptions(false);
                                    setShowBookmarkOptions(false);
                                    setShowProfilePopup(false);
                                    setShowSoundPopup(false);
                                }
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="mdi:table-of-contents" className="w-4 h-4" />
                            </button>
                            {/* Notes with Small Popup */}
                            <div className="relative">
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    const nextState = !showNotesOptions;
                                    setShowNotesOptions(nextState);
                                    if (nextState) {
                                        setShowTOC(false);
                                        setShowThumbnailBar(false);
                                        setShowProfilePopup(false);
                                        setShowSoundPopup(false);
                                        setShowAddBookmarkPopup(false);
                                        setShowBookmarkOptions(false);
                                    }
                                }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                    <Icon icon="material-symbols-light:add-notes" className="w-[18px] h-[18px]" />
                                </button>
                                <AnimatePresence>
                                    {showNotesOptions && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 w-[140px] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-[160] overflow-hidden border-2 border-white"
                                            style={{ backgroundColor: getLayoutColor('toc-bg', '#575C9C') }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowAddNotesPopup(true); setShowNotesOptions(false); }}
                                                className="w-full flex items-center px-4 py-3 hover:bg-white/10 transition-colors gap-3 text-left"
                                            >
                                                <div className="w-[18px] h-[18px] flex items-center justify-center" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>
                                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                                        <path d="M2.75499 14.7146L3.27199 16.6466C3.87599 18.9016 4.17899 20.0296 4.86399 20.7606C5.40464 21.3374 6.10408 21.7411 6.87399 21.9206C7.84999 22.1486 8.97799 21.8466 11.234 21.2426C13.488 20.6386 14.616 20.3366 15.347 19.6516C15.4077 19.5943 15.4663 19.5356 15.523 19.4756C15.1824 19.4449 14.8439 19.3948 14.509 19.3256C13.813 19.1876 12.008 18.7036L11.901 18.6746L11.876 18.6686C10.812 18.3826 9.92299 18.1446 9.21299 17.8886C8.46599 17.6186 7.78799 17.2856 7.21099 16.7456C6.41731 16.002 5.86191 15.0398 5.61499 13.9806C5.43499 13.2116 5.48699 12.4576 5.62699 11.6766C5.76099 10.9276 6.00099 10.0296 6.28899 8.95463L6.82399 6.96062L6.84199 6.89062C4.92199 7.40763 3.91099 7.71362 3.23699 8.34462C2.65949 8.88568 2.25545 9.58588 2.07599 10.3566C1.84799 11.3316 2.14999 12.4596 2.75499 14.7146Z" fill="currentColor" />
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M11.8741 2.07599C12.85 1.84807 13.9778 2.14979 16.2335 2.7547C16.8008 2.90671 17.2972 3.03922 17.7335 3.16388C17.275 3.7184 17.0001 4.43016 17.0001 5.20587C17.0001 6.97649 18.4355 8.41192 20.2061 8.41192C20.6511 8.4119 21.0748 8.32092 21.46 8.15704C21.3339 8.82433 21.1174 9.64216 20.8301 10.7147L20.3116 12.6463C19.7066 14.9013 19.4048 16.0296 18.7198 16.7606C18.1793 17.3377 17.48 17.7419 16.71 17.9217C16.6135 17.9443 16.515 17.9614 16.4151 17.9734C15.5001 18.0864 14.3827 17.788 12.3507 17.244C10.0957 16.639 8.96738 16.3362 8.23639 15.6512C7.65932 15.1105 7.25582 14.4106 7.07624 13.6404C6.84831 12.6645 7.15003 11.5377 7.75495 9.28302L8.27155 7.3504L8.51569 6.4461C8.97069 4.78012 9.27733 3.86314 9.86432 3.23614C10.405 2.65934 11.1042 2.25553 11.8741 2.07599ZM11.1924 12.1736C11.0005 12.1225 10.7961 12.1495 10.6241 12.2488C10.452 12.3482 10.326 12.512 10.2745 12.7039C10.249 12.799 10.2431 12.8983 10.2559 12.9959C10.2687 13.0935 10.3005 13.188 10.3497 13.2733C10.3988 13.3584 10.4641 13.4331 10.5421 13.493C10.6202 13.553 10.7096 13.5973 10.8048 13.6229L13.7032 14.3983C13.7993 14.4276 13.9001 14.438 14.0001 14.4275C14.1002 14.417 14.1981 14.3865 14.2862 14.3377C14.3741 14.289 14.4509 14.2225 14.5128 14.1434C14.5747 14.0641 14.6205 13.973 14.6466 13.8758C14.6726 13.7785 14.6791 13.6767 14.6651 13.577C14.6511 13.4773 14.6174 13.381 14.5655 13.2947C14.5137 13.2086 14.4446 13.1341 14.3633 13.075C14.2819 13.0158 14.189 12.9736 14.0909 12.951L11.1924 12.1736ZM11.6778 9.25567C11.5801 9.26848 11.4858 9.30021 11.4005 9.34942C11.3153 9.39855 11.2407 9.46389 11.1807 9.54181C11.1208 9.6199 11.0764 9.70941 11.0508 9.8045C10.9995 9.99651 11.0267 10.2027 11.126 10.3748C11.2254 10.5467 11.3893 10.6719 11.5811 10.7234L16.4112 12.0174C16.5072 12.0462 16.6084 12.0555 16.7081 12.0447C16.8075 12.0339 16.9038 12.0035 16.9913 11.9549C17.079 11.9061 17.1561 11.8397 17.2178 11.7606C17.2796 11.6814 17.3246 11.5909 17.3507 11.494C17.3767 11.397 17.384 11.2955 17.3702 11.1961C17.3564 11.0968 17.3219 11.001 17.2706 10.9149C17.2192 10.8289 17.1511 10.7544 17.0704 10.6951C16.9895 10.6358 16.8975 10.5933 16.7999 10.5701L11.9698 9.27423C11.8747 9.2487 11.7754 9.24288 11.6778 9.25567Z" fill="currentColor" />
                                                        <path d="M20.2062 3V6.63111M22.0217 4.81555H18.3906" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <span className="text-[13px] font-bold" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>Add Notes</span>
                                            </button>
                                            <div className="h-px w-full bg-white/20" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowNotesViewer(true); setShowNotesOptions(false); }}
                                                className="w-full flex items-center px-4 py-3 hover:bg-white/10 transition-colors gap-3 text-left"
                                            >
                                                <Icon icon="lets-icons:view-fill" className="w-[18px] h-[18px]" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }} />
                                                <span className="text-[13px] font-bold" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>View Notes</span>
                                            </button>

                                            {/* Needle Pointer */}
                                            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-1.5 overflow-hidden">
                                                <div
                                                    className="w-2 h-2 rotate-45 translate-y-[-50%] mx-auto"
                                                    style={{ backgroundColor: getLayoutColor('toc-bg', '#575C9C') }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Bookmark with Small Popup */}
                            <div className="relative">
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    setShowBookmarkOptions(!showBookmarkOptions);
                                    setShowNotesOptions(false);
                                    setShowTOC(false);
                                    setShowThumbnailBar(false);
                                    setShowProfilePopup(false);
                                    setShowSoundPopup(false);
                                }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                    <Icon icon="mingcute:bookmark-fill" className="w-[18px] h-[18px]" />
                                </button>
                                <AnimatePresence>
                                    {showBookmarkOptions && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 w-[140px] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-[160] overflow-hidden border-2 border-white"
                                            style={{ backgroundColor: getLayoutColor('toc-bg', '#575C9C') }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="w-full flex items-center px-4 py-3 hover:bg-white/10 transition-colors gap-3 text-left"
                                                onClick={(e) => { e.stopPropagation(); setShowAddBookmarkPopup(true); setShowBookmarkOptions(false); }}
                                            >
                                                <div className="w-[18px] h-[18px] flex items-center justify-center" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>
                                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                                        <path d="M15.2354 2C15.084 2.37237 15 2.77935 15 3.20605C15 4.97672 16.4354 6.41209 18.2061 6.41211C18.8707 6.41211 19.488 6.20962 20 5.86328V21.0283C19.9998 22.2481 18.6198 22.958 17.6279 22.249L12 18.2285L6.37207 22.249C5.37915 22.249C4.00022 22.2491 4 21.0293V5C4 4.20435 4.3163 3.44152 4.87891 2.87891C5.44152 2.3163 6.20435 2 7 2H15.2354Z" fill="currentColor" />
                                                        <path d="M18.2062 1V4.63111M20.0217 2.81555H16.3906" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <span className="text-[13px] font-bold" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>Add Bookmark</span>
                                            </button>
                                            <div className="h-px w-full bg-white/20" />
                                            <button
                                                className="w-full flex items-center px-4 py-3 hover:bg-white/10 transition-colors gap-3 text-left"
                                                onClick={(e) => { e.stopPropagation(); setShowViewBookmarkPopup(true); setShowBookmarkOptions(false); }}
                                            >
                                                <Icon icon="lets-icons:view-fill" className="w-[18px] h-[18px]" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }} />
                                                <span className="text-[13px] font-bold" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>View Bookmark</span>
                                            </button>

                                            {/* Needle Pointer */}
                                            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-1.5 overflow-hidden">
                                                <div
                                                    className="w-2 h-2 rotate-45 translate-y-[-50%] mx-auto"
                                                    style={{ backgroundColor: getLayoutColor('toc-bg', '#575C9C') }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button onClick={() => {
                                setShowThumbnailBar(false);
                                setShowTOC(false);
                                setShowNotesOptions(false);
                                setShowBookmarkOptions(false);
                                setShowProfilePopup(false);
                                setShowSoundPopup(false);
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="clarity:image-gallery-solid" className="w-[18px] h-[18px]" />
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const nextState = !showSoundPopup;
                                setShowSoundPopup(nextState);
                                if (nextState) {
                                    setShowThumbnailBar(false);
                                    setShowTOC(false);
                                    setShowNotesOptions(false);
                                    setShowBookmarkOptions(false);
                                    setShowProfilePopup(false);
                                }
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="solar:music-notes-bold" className="w-[18px] h-[18px]" />
                            </button>
                            <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setShowProfilePopup(!showProfilePopup); setShowNotesOptions(false); setShowBookmarkOptions(false); }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                    <Icon icon="solar:user-bold" className="w-[18px] h-[18px]" />
                                </button>
                                <AnimatePresence>
                                    {showProfilePopup && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-[calc(100%+20px)] left-1/2 -translate-x-1/2 z-[160] pointer-events-auto"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="relative">
                                                {/* needle Pointer */}
                                                <div
                                                    className="absolute -bottom-[12px] left-1/2 -translate-x-1/2 z-10 pointer-events-none"
                                                    style={{ width: '10px', height: '14px' }}
                                                >
                                                    <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M0 0L5 20L10 0" fill="#FFFFFF" />
                                                        <path d="M0 0L5 20L10 0" stroke="rgba(87, 92, 156, 0.1)" strokeWidth="1" />
                                                    </svg>
                                                </div>

                                                {/* Popup Card */}
                                                <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-[170px] flex flex-col border border-gray-100 overflow-hidden text-left">
                                                    <div className="p-3 flex flex-col">
                                                        <div className="flex items-center justify-between mb-3 shrink-0">
                                                            <h2 className="text-[12px] font-bold text-[#374151]">Profile</h2>
                                                            <button onClick={() => setShowProfilePopup(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                                <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        <div className="flex flex-col gap-2.5 overflow-hidden">
                                                            {profileName && (
                                                                <div className="flex items-start gap-1">
                                                                    <span className="text-[11px] font-bold text-[#374151] whitespace-nowrap">Name :</span>
                                                                    <span className="text-[11px] text-gray-500 font-medium">{profileName}</span>
                                                                </div>
                                                            )}
                                                            {profileAbout && (
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[11px] font-bold text-[#374151]">About :</span>
                                                                    <p className="text-[10px] text-gray-500 font-medium leading-[1.5] text-justify">
                                                                        {profileAbout}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {profileContacts?.length > 0 && (
                                                                <div className="pt-2 border-t border-gray-100 mt-1">
                                                                    <span className="text-[11px] font-bold text-[#374151] block mb-2">Contact</span>
                                                                    <div className="flex items-center flex-wrap gap-2">
                                                                        {profileContacts.map((contact) => {
                                                                            const getIconData = (type) => {
                                                                                switch (type) {
                                                                                    case 'x': return { icon: 'ri:twitter-x-fill', bg: 'bg-black', color: 'text-white' };
                                                                                    case 'facebook': return { icon: 'ri:facebook-fill', bg: 'bg-[#3B5998]', color: 'text-white' };
                                                                                    case 'email': return { icon: 'logos:google-gmail', bg: 'bg-white', color: '' };
                                                                                    case 'instagram': return { icon: 'ri:instagram-line', bg: 'bg-gradient-to-tr from-[#FFD600] via-[#FF0144] to-[#0401E5]', color: 'text-white' };
                                                                                    case 'phone': return { icon: 'ph:phone-fill', bg: 'bg-[#575C9C]', color: 'text-white' };
                                                                                    default: return { icon: 'ph:link-bold', bg: 'bg-gray-100', color: 'text-gray-600' };
                                                                                }
                                                                            };
                                                                            const iconStyle = getIconData(contact.type);

                                                                            return (
                                                                                <button
                                                                                    key={contact.id}
                                                                                    onClick={(e) => handleContactClick(e, contact)}
                                                                                    className={`w-[26px] h-[26px] ${iconStyle.bg} rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm border border-gray-50 p-1.5`}
                                                                                    title={contact.value}
                                                                                >
                                                                                    <Icon icon={iconStyle.icon} className={`${iconStyle.color} w-full h-full`} />
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleShare();
                                setShowThumbnailBar(false);
                                setShowTOC(false);
                                setShowNotesOptions(false);
                                setShowBookmarkOptions(false);
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="mage:share-fill" className="w-[18px] h-[18px]" />
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                                setShowThumbnailBar(false);
                                setShowTOC(false);
                                setShowNotesOptions(false);
                                setShowBookmarkOptions(false);
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="meteor-icons:download" className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        {/* Play and Progress Bar Row - Matching Screenshot UI */}
                        <div className="flex items-center gap-2 px-1">
                            <div className="flex-1 bg-[#575C9C] h-[34px] rounded-full px-5 flex items-center gap-4 shadow-xl">
                                <button
                                    onClick={() => setIsPlaying(!isAutoFlipping)}
                                    className="text-white active:scale-90 transition-all shrink-0"
                                >
                                    <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-4 h-4" />
                                </button>

                                {/* Progress Bar */}
                                <div
                                    ref={progressRef}
                                    className="flex-1 bg-white/20 h-[3px] rounded-full cursor-pointer relative overflow-hidden"
                                    onClick={handleProgressClick}
                                >
                                    <div
                                        className="absolute left-0 top-0 h-full transition-all duration-300 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                        style={{ width: `${Math.max(0, progressPercentage)}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleFullScreen()}
                                className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 bg-[#575C9C] text-white active:scale-95 transition-all shadow-xl"
                            >
                                <Icon icon="lucide:fullscreen" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SHARED Sidebars and Popups */}
            <AnimatePresence>
                {/* Global Popups Area handled by renderPopups */}

                {/* Global Popups */}
                {/* Global Popups Area */}
                {renderPopups()}
            </AnimatePresence>
        </div>
    );
};

export default MobileLayout5;
