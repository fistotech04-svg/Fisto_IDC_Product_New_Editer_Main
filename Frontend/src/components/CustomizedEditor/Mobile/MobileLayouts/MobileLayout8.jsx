import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';
import AddNotesPopup from '../../popups/AddNotesPopup';
import NotesViewerPopup from '../../popups/NotesViewerPopup';
import AddBookmarkPopup from '../../popups/AddBookmarkPopup';
import ViewBookmarkPopup from '../../popups/ViewBookmarkPopup';
import ProfilePopup from '../../popups/ProfilePopup';
import Sound from '../../popups/Sound';
import Export from '../../popups/Export';

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

const MobileLayout8 = (props) => {
    const {
        children,
        pages,
        currentPage,
        onPageClick,
        bookName,
        settings,
        logoSettings,
        notes,
        onAddNote,
        onDeleteNote,
        bookmarks,
        onAddBookmark,
        onDeleteBookmark,
        onUpdateBookmark,
        bookmarkSettings,
        isMuted,
        setIsMuted,
        isFlipMuted,
        setIsFlipMuted,
        flipTrigger,
        otherSetupSettings,
        onUpdateOtherSetup,

        activeLayout,
        showTOC,
        setShowTOC,
        showAddNotesPopup,
        setShowAddNotesPopup,
        showNotesViewer,
        setShowNotesViewer,
        showAddBookmarkPopup,
        setShowAddBookmarkPopup,
        showViewBookmarkPopup,
        setShowViewBookmarkPopup,
        showProfilePopup,
        setShowProfilePopup,
        showSoundPopup,
        setShowSoundPopup,
        showExportPopup,
        setShowExportPopup,
        showSharePopup,
        setShowSharePopup,
        setSearchQuery,
        handleQuickSearch,
    } = props;

    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [localShowTOC, setLocalShowTOC] = useState(false);
    const [localShowProfile, setLocalShowProfile] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);

    const scrollRef = useRef(null);
    const bookRef = useRef(null);

    const spreads = useMemo(() => {
        const result = [];
        for (let i = 0; i < pages.length; i += 2) {
            if (i === 0) {
                result.push({
                    pages: [pages[0]],
                    indices: [0],
                    label: 'Page 01'
                });
            } else {
                const p1 = pages[i - 1];
                const p2 = pages[i];
                if (p1 && p2) {
                    result.push({
                        pages: [p1, p2],
                        indices: [i - 1, i],
                        label: `Page ${String(i).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                    });
                } else if (p1) {
                    result.push({
                        pages: [p1],
                        indices: [i - 1],
                        label: `Page ${String(i).padStart(2, '0')}`
                    });
                }
            }
        }
        return result;
    }, [pages]);

    const getLayoutColor = (id, defaultColor) => {
        const colorObj = settings?.layoutColors?.find(c => c.id === id);
        return colorObj ? colorObj.hex : defaultColor;
    };

    const layoutVariables = useMemo(() => {
        return {
            '--toolbar-bg': getLayoutColor('toolbar-bg', '#575C9C'),
            '--toolbar-icon': getLayoutColor('toolbar-icon', '#FFFFFF'),
            '--page-bg': getLayoutColor('page-bg', '#BDC3D9'),
            '--accent-color': getLayoutColor('accent-color', '#575C9C'),
        };
    }, [settings]);

    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {localShowTOC && (
                    <TableOfContentsPopup
                        onClose={() => setLocalShowTOC(false)}
                        settings={settings?.tocSettings}
                        activeLayout={8}
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
                    activeLayout={8}
                />
            )}
            {showNotesViewer && (
                <NotesViewerPopup
                    onClose={() => setShowNotesViewer(false)}
                    notes={notes}
                    isSidebarOpen={false}
                    isMobile={true}
                    activeLayout={8}
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
                    activeLayout={8}
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
            {localShowProfile && (
                <ProfilePopup
                    onClose={() => setLocalShowProfile(false)}
                    profileSettings={settings?.profileSettings}
                    activeLayout={8}
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
            <header className="z-50 px-4 pt-0 pb-4 flex flex-col gap-4 shadow-md shrink-0 bg-white/20 backdrop-blur-sm">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[#575C9C] text-[15px] font-bold truncate flex-1">{bookName || 'Name of the book'}</span>
                    {logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Logo"
                            className="h-5 w-auto"
                        />
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-3 shadow-sm relative border border-gray-100">
                        <Icon icon="lucide:search" className="text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent text-gray-700 placeholder-gray-400 text-[13px] outline-none w-full font-medium"
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
                        />
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
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

            {/* Main Content */}
            <main className="flex-1 relative flex flex-col overflow-hidden">
                {/* Navigation Arrows */}
                <button
                    className="absolute left-[2%] top-1/2 -translate-y-1/2 z-20 text-[#575C9C] active:scale-90 transition-transform"
                    onClick={() => onPageClick(Math.max(0, currentPage - 1))}
                >
                    <Icon icon="ph:caret-left-light" className="w-10 h-10 opacity-60" strokeWidth="4" />
                </button>
                <button
                    className="absolute right-[2%] top-1/2 -translate-y-1/2 z-20 text-[#575C9C] active:scale-90 transition-transform"
                    onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))}
                >
                    <Icon icon="ph:caret-right-light" className="w-10 h-10 opacity-60" strokeWidth="4" />
                </button>

                {/* Flipbook Area */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden px-10 py-8">
                    <div className="relative shadow-2xl">
                        <div className="transition-transform duration-300" style={{ transform: 'scale(0.85)', transformOrigin: 'center center' }}>
                            {children}
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer
                className="z-50 px-4 pt-6 pb-8 flex flex-col gap-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] shrink-0"
                style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
            >
                {/* Icon Row */}
                <div className="flex items-center justify-between px-2">
                    <button onClick={() => setLocalShowTOC(!localShowTOC)} className="text-white/80 hover:text-white transition-colors">
                        <Icon icon="fluent:text-bullet-list-24-filled" className="w-6 h-6" />
                    </button>
                    <button onClick={() => setShowThumbnails(!showThumbnails)} className="text-white/80 hover:text-white transition-colors">
                        <Icon icon="ph:squares-four-fill" className="w-6 h-6" />
                    </button>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowNotesOptions(!showNotesOptions); }}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <Icon icon="material-symbols-light:add-notes" className="w-7 h-7" />
                        </button>

                        {/* Notes Options Popup */}
                        <AnimatePresence>
                            {showNotesOptions && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-[180]"
                                        onClick={() => setShowNotesOptions(false)}
                                    />
                                    <motion.div
                                        key="notes-options-popup"
                                        initial={{ opacity: 0, scale: 0.9, y: 8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 8 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[190] rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.45)] border border-white/15 pointer-events-auto"
                                        style={{
                                            backgroundColor: 'rgba(87, 92, 156, 0.95)',
                                            backdropFilter: 'blur(12px)',
                                            minWidth: '140px'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex flex-col py-1.5 px-1">
                                            <button
                                                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/20 transition-colors text-left w-full rounded-lg"
                                                onClick={() => {
                                                    setShowAddNotesPopup(true);
                                                    setShowNotesOptions(false);
                                                }}
                                            >
                                                <Icon icon="material-symbols-light:add-notes" className="w-4 h-4 text-white" />
                                                <span className="text-white text-[12px] font-semibold whitespace-nowrap">Add Notes</span>
                                            </button>
                                            <button
                                                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/20 transition-colors text-left w-full rounded-lg"
                                                onClick={() => {
                                                    setShowNotesViewer(true);
                                                    setShowNotesOptions(false);
                                                }}
                                            >
                                                <Icon icon="lucide:eye" className="w-4 h-4 text-white" />
                                                <span className="text-white text-[12px] font-semibold whitespace-nowrap">View Notes</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowBookmarkOptions(!showBookmarkOptions); }}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <Icon icon="fluent:bookmark-24-filled" className="w-6 h-6" />
                        </button>

                        {/* Bookmark Options Popup */}
                        <AnimatePresence>
                            {showBookmarkOptions && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-[180]"
                                        onClick={() => setShowBookmarkOptions(false)}
                                    />
                                    <motion.div
                                        key="bookmark-options-popup"
                                        initial={{ opacity: 0, scale: 0.9, y: 8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 8 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[190] rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.45)] border border-white/15 pointer-events-auto"
                                        style={{
                                            backgroundColor: 'rgba(87, 92, 156, 0.95)',
                                            backdropFilter: 'blur(12px)',
                                            minWidth: '150px'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex flex-col py-1.5 px-1">
                                            <button
                                                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/20 transition-colors text-left w-full rounded-lg"
                                                onClick={() => {
                                                    setShowAddBookmarkPopup(true);
                                                    setShowBookmarkOptions(false);
                                                }}
                                            >
                                                <Icon icon="fluent:bookmark-add-24-filled" className="w-4 h-4 text-white" />
                                                <span className="text-white text-[12px] font-semibold whitespace-nowrap">Add Bookmark</span>
                                            </button>
                                            <button
                                                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/20 transition-colors text-left w-full rounded-lg"
                                                onClick={() => {
                                                    setShowViewBookmarkPopup(true);
                                                    setShowBookmarkOptions(false);
                                                }}
                                            >
                                                <Icon icon="lucide:eye" className="w-4 h-4 text-white" />
                                                <span className="text-white text-[12px] font-semibold whitespace-nowrap">View Bookmark</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={() => {/* Media Action */ }} className="text-white/80 hover:text-white transition-colors">
                        <Icon icon="clarity:image-gallery-solid" className="w-6 h-6" />
                    </button>
                    <button onClick={() => setLocalShowProfile(!localShowProfile)} className="text-white/80 hover:text-white transition-colors">
                        <Icon icon="ph:user-fill" className="w-6 h-6" />
                    </button>
                    <button onClick={() => setShowSharePopup(true)} className="text-white/80 hover:text-white transition-colors">
                        <Icon icon="mage:share-fill" className="w-6 h-6" />
                    </button>
                    <button onClick={() => setShowExportPopup(true)} className="text-white/80 hover:text-white transition-colors">
                        <Icon icon="meteor-icons:download" className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Row */}
                <div className="px-2">
                    <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="absolute left-0 top-0 h-full bg-white transition-all duration-300"
                            style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Control Row */}
                <div className="flex items-center justify-between px-2">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/80 hover:text-white transition-colors">
                        <Icon icon={isMuted ? "solar:music-note-broken" : "solar:music-notes-bold"} className="w-7 h-7" />
                    </button>

                    <div className="flex items-center gap-8">
                        <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="text-white hover:scale-110 active:scale-95 transition-all">
                            <Icon icon="fluent:previous-24-filled" className="w-7 h-7" />
                        </button>
                        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#575C9C] shadow-lg hover:scale-110 active:scale-95 transition-all">
                            <Icon icon="fluent:play-24-filled" className="w-7 h-7" />
                        </button>
                        <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="text-white hover:scale-110 active:scale-95 transition-all">
                            <Icon icon="fluent:next-24-filled" className="w-7 h-7" />
                        </button>
                    </div>

                    <button className="text-white/80 hover:text-white transition-colors">
                        <Icon icon="lucide:scan" className="w-6 h-6" />
                    </button>
                </div>
            </footer>

            {/* Thumbnail Sidebar */}
            <AnimatePresence>
                {showThumbnails && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-3 right-3 bottom-[188px] z-[170] flex flex-col shadow-2xl rounded-t-xl overflow-hidden bg-white border border-gray-200/50 border-b-0 max-h-[350px]"
                    >
                        <div
                            className="flex items-center justify-between px-4 py-2.5 shrink-0 relative"
                            style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                        >
                            <span className="text-[12px] font-bold text-white tracking-wide">Thumbnails</span>
                            {/* Drag handle line in center */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white/50 rounded-full" />

                            <button onClick={() => setShowThumbnails(false)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                                <Icon icon="lucide:x" className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 bg-white">
                            <div className="grid grid-cols-4 gap-3">
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    return (
                                        <div
                                            key={idx}
                                            className={`bg-white rounded-md flex flex-col cursor-pointer transition-all p-1 border ${isSelected ? 'border-[#575C9C] shadow-sm bg-[#575C9C]/5' : 'border-gray-100 hover:border-gray-200'}`}
                                            onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                        >
                                            <div className="aspect-[1.4/1] rounded-[3px] overflow-hidden bg-gray-50 flex gap-[1px]">
                                                {spread.pages.map((page, pIdx) => (
                                                    <div key={pIdx} className="flex-1 h-full relative">
                                                        <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={0.1} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-center mt-1.5">
                                                <span className="text-[8px] font-bold text-[#575C9C]">
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
    );
};

export default MobileLayout8;
