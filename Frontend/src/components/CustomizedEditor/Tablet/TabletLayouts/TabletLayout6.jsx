import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import TabletTableOfContentsPopup from './TabletTableOfContentsPopup';
import TabletProfilePopup from './TabletProfilePopup';

const hexToRgb = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '255, 255, 255';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `${r}, ${g}, ${b}`;
};

const getLayoutColor = (layoutColors, id, defaultColor) => {
    if (!layoutColors) return `var(--${id}, ${defaultColor})`;
    if (Array.isArray(layoutColors)) {
        const color = layoutColors.find(c => c.id === id || c.name === id);
        if (color && color.value) {
            return `rgba(${hexToRgb(color.value)}, ${(color.opacity ?? 100) / 100})`;
        }
    } else {
        const color = layoutColors[id];
        if (color && color.value) {
            return `rgba(${hexToRgb(color.value)}, ${(color.opacity ?? 100) / 100})`;
        }
    }
    return `var(--${id}, ${defaultColor})`;
};

const SidebarBtn = ({ icon, onClick, active, color }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center w-[4cqw] h-[4cqw] transition-transform hover:scale-110 active:scale-95"
        style={{ opacity: active ? 0.7 : 1, color: color || 'white' }}
    >
        <Icon icon={icon} className="w-[2cqw] h-[2cqw]" />
    </button>
);

const ToolbarBtn = ({ icon, onClick, color }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center p-[0.5cqw] transition-transform hover:scale-110 active:scale-95"
        style={{ color: color || 'white' }}
    >
        <Icon icon={icon} className="w-[1.8cqw] h-[1.8cqw]" />
    </button>
);


const PageThumbnail = React.memo(({ html, index, scale = 0.15 }) => {
    if (!html) return <div className="w-full h-full bg-white flex items-center justify-center text-gray-300">Empty</div>;
    
    let processedHtml = html;
    processedHtml = processedHtml.replace(/<img\b([^>]*src=['"]https:\/\/codia-f2c\.s3\.us-west-1\.amazonaws\.com\/[^'"]*['"])([^>]*)>/gi, '<img $1 crossOrigin="anonymous" $2>');

    const srcDoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: 400px; height: 566px; position: relative; }
                    * { box-sizing: border-box; }
                    img { max-width: 100%; object-fit: contain; }
                </style>
            </head>
            <body>
                <div style="transform: scale(${scale}); transform-origin: top left; width: ${100 / scale}%; height: ${100 / scale}%;">
                    ${processedHtml}
                </div>
            </body>
        </html>
    `;

    return (
        <iframe
            srcDoc={srcDoc}
            title={`Thumbnail ${index + 1}`}
            className="w-full h-full border-none select-none pointer-events-none bg-white"
            scrolling="no"
            sandbox="allow-same-origin"
        />
    );
});
const TabletLayout6 = ({
    children,
    settings,
    bookName,
    searchQuery,
    setSearchQuery,
    handleQuickSearch,
    setShowThumbnailBarMemo,
    setShowTOCMemo,
    setShowProfilePopup,
    showProfilePopup,
    logoSettings,
    currentPage,
    pagesCount,
    pages,
    bookRef,
    showThumbnailBar,
    currentZoom,
    setCurrentZoom,
    onPageClick,
    handleShare,
    handleDownload,
    handleFullScreen,
    isFullscreen,
    isMuted,
    setIsMuted,
    showSoundPopup,
    setShowSoundPopupMemo,
    profileSettings,
    setShowGalleryPopupMemo,
    showGalleryPopup,
    showTOC,
    backgroundStyle,
    showExportPopup,
    setShowExportPopupMemo,
    setIsPlaying,
    isAutoFlipping,
    offset = 0
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const spreads = useMemo(() => {
        if (!pages || !pages.length) return [];
        const result = [];
        result.push({ pages: [pages[0]], indices: [0] });
        for (let i = 1; i < pages.length; i += 2) {
            const spreadPages = [pages[i]];
            const indices = [i];
            if (i + 1 < pages.length) {
                spreadPages.push(pages[i + 1]);
                indices.push(i + 1);
            }
            result.push({ pages: spreadPages, indices });
        }
        return result;
    }, [pages]);

    const [inputPage, setInputPage] = useState(currentPage + 1);

    useEffect(() => {
        setInputPage(currentPage + 1);
    }, [currentPage]);

    const progressRef = useRef(null);

    const handleProgressClick = (e) => {
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pagesCount - 1));
        if (onPageClick) onPageClick(targetIdx);
    };

    const progressPercentage = pagesCount > 1 ? (currentPage / (pagesCount - 1)) * 100 : 0;
    
    // Using settings?.layoutColors to pass to our color getter
    const layoutColors = settings?.layoutColors;

    return (
        <div className="flex flex-col w-full h-full min-h-0 overflow-hidden font-sans relative" style={{ ...backgroundStyle, backgroundColor: '#D7D8E8', containerType: 'size' }}>
            
            {/* Click-away Overlay for Search */}
            {showSuggestions && recommendations.length > 0 && (
                <div 
                    className="absolute inset-0 z-[45] pointer-events-auto" 
                    onClick={() => setShowSuggestions(false)} 
                />
            )}

            {/* Top Header */}
            <div 
                className="w-full flex items-center justify-between px-[2cqw] py-[1.2cqh] shrink-0 z-50 border-b border-white/10" 
                style={{ backgroundColor: getLayoutColor(layoutColors, 'toolbar-bg', '#575C9C') }}
            >
                {/* Search */}
                <div className="w-[30cqw] relative">
                    {(settings?.interaction?.search ?? true) && (
                        <div
                            className="flex items-center px-[1cqw] py-[0.8cqh] rounded-[0.4cqw] relative"
                            style={{ backgroundColor: getLayoutColor(layoutColors, 'search-bg-v2', '#DDE0F4') }}
                        >
                            <Icon
                                icon="lucide:search"
                                className="w-[1.6cqw] h-[1.6cqw]"
                                style={{ color: getLayoutColor(layoutColors, 'search-text-v1', '#575C9C') }}
                            />
                            <input
                                type="text"
                                value={localSearchQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSearchQuery(val);
                                    setShowSuggestions(true);
                                    if (val.trim().length >= 1) {
                                        const results = [];
                                        const lowerQuery = val.trim().toLowerCase();
                                        pages.forEach((page, index) => {
                                            const text = (page.html || page.content || '').replace(/<[^>]*>/g, ' ');
                                            const words = text.split(/\s+/).filter(Boolean);
                                            for (let i = 0; i < words.length; i++) {
                                                const cleanWord = words[i].replace(/[^a-zA-Z0-9-]/g, '');
                                                if (cleanWord.length >= val.trim().length && cleanWord.toLowerCase().startsWith(lowerQuery)) {
                                                    const nextWords = words.slice(i + 1, i + 3).join(' ').replace(/[^a-zA-Z0-9- ]/g, '');
                                                    const greyPart = nextWords.length > 12 ? nextWords.substring(0, 12) + '...' : nextWords + '...';
                                                    results.push({
                                                        boldPart: cleanWord,
                                                        greyPart: ' ' + greyPart,
                                                        pageNumber: index + 1
                                                    });
                                                }
                                            }
                                        });
                                        setRecommendations(results.slice(0, 4));
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
                                placeholder="Quick Search..."
                                className="bg-transparent border-0 outline-none w-full ml-[0.8cqw] font-medium text-[1.4cqw]"
                                style={{ color: getLayoutColor(layoutColors, 'search-text-v1', '#575C9C') }}
                            />
                        </div>
                    )}
                </div>

                {/* Title */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center max-w-[40cqw]">
                    <span
                        className="text-[1.8cqw] font-normal truncate opacity-90"
                        style={{ color: '#FFFFFF' }}
                    >
                        {bookName || 'Flipbook'}
                    </span>
                </div>
                
                <div className="w-[30cqw]"></div>
            </div>

            <div className="flex-1 flex flex-row min-h-0 relative">
                {/* Main Canvas Area */}
                <div className="flex-1 flex items-center justify-center relative p-[4cqw] magazine-canvas">
                    {/* Popups */}
                    {showThumbnailBar && (
                        <div className="absolute right-0 top-0 bottom-0 w-[26cqw] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-[100]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-[2cqw] pb-[1.5cqw]">
                                <h2 className="text-[1.8cqw] font-bold text-[#575C9C]">
                                    Thumbnail
                                </h2>
                                <button onClick={() => setShowThumbnailBarMemo?.(false)} className="text-[#9BA0C9] hover:text-[#575C9C] transition-colors">
                                    <Icon icon="lucide:x" className="w-[1.6cqw] h-[1.6cqw]" />
                                </button>
                            </div>
                            
                            <div className="h-[1px] w-full bg-[#E5E7EB] mb-[1.5cqw]"></div>

                            {/* Thumbnail Items List */}
                            <div className="flex-1 overflow-y-auto px-[2cqw] pb-[2cqw] flex flex-col items-center gap-[2cqw]" style={{ scrollbarWidth: 'none' }}>
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            className="flex flex-col items-center cursor-pointer group"
                                            onClick={() => {
                                                if (bookRef?.current?.pageFlip) {
                                                    bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                                } else if (onPageClick) {
                                                    onPageClick(spread.indices[0]);
                                                }
                                                setShowThumbnailBarMemo?.(false);
                                            }}
                                        >
                                            <div className={`p-[0.3cqw] rounded-[0.4cqw] transition-colors ${isSelected ? 'border-[2px] border-[#575C9C]' : 'border-[2px] border-transparent group-hover:border-[#E5E7EB]'}`}>
                                                <div className="w-[14cqw] h-[9cqw] flex bg-white border border-[#575C9C]/30 rounded-[0.2cqw] overflow-hidden shadow-sm">
                                                    {spread.pages.map((page, pIdx) => (
                                                        <div key={pIdx} className="flex-1 relative border-r border-[#E5E7EB] last:border-r-0 h-full flex items-center justify-center">
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={spread.indices[pIdx]}
                                                                scale={0.08}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-[1.2cqw] text-[#9BA0C9] font-medium mt-[0.5cqw]">
                                                Page {spread.indices.length === 1 ? spread.indices[0] + 1 : `${spread.indices[0] + 1}-${spread.indices[1] + 1}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {showTOC && (
                        <TabletTableOfContentsPopup onClose={() => setShowTOCMemo?.(false)} onNavigate={onPageClick} settings={settings} variant="layout6" />
                    )}

                    {showProfilePopup && (
                        <TabletProfilePopup
                            activeLayout={6}
                            profileSettings={profileSettings}
                            layoutColors={layoutColors}
                            fallbackText="#575C9C"
                            onClose={() => setShowProfilePopup?.(false)}
                        />
                    )}

                    {/* Left Navigation Arrow */}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <button
                            onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
                            className={`absolute left-[2cqw] flex items-center justify-center transition-all z-10 ${currentPage === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100 hover:scale-110 cursor-pointer'}`}
                            style={{ color: getLayoutColor(layoutColors, 'toolbar-text-main', '#575C9C') }}
                            disabled={currentPage === 0}
                        >
                            <Icon icon="ph:caret-left" className="w-[3cqw] h-[3cqw]" />
                        </button>
                    )}

                    {/* The Actual Book Content */}
                    <div 
                        className="w-full h-full flex items-center justify-center z-0 relative"
                        style={{ transform: `translateX(${offset}px)`, transition: 'transform 0.5s ease-out', filter: 'drop-shadow(0 1cqw 3cqw rgba(0,0,0,0.15))' }}
                    >
                        {children}
                    </div>

                    {/* Right Navigation Arrow */}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <button
                            onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
                            className={`absolute right-[2cqw] flex items-center justify-center transition-all z-10 ${currentPage >= pagesCount - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100 hover:scale-110 cursor-pointer'}`}
                            style={{ color: getLayoutColor(layoutColors, 'toolbar-text-main', '#575C9C') }}
                            disabled={currentPage >= pagesCount - 1}
                        >
                            <Icon icon="ph:caret-right" className="w-[3cqw] h-[3cqw]" />
                        </button>
                    )}

                    {/* Page Counter Badge on Bottom Right of Canvas */}
                    {(settings?.navigation?.pageQuickAccess ?? true) && (
                        <div
                            className="absolute right-[4cqw] bottom-[4cqh] px-[2cqw] py-[1cqh] rounded-[0.8cqw] shadow-md z-30 border bg-white flex items-center"
                            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                        >
                            <span className="text-[1.4cqw] font-bold" style={{ color: getLayoutColor(layoutColors, 'toolbar-text-main', '#575C9C') }}>Page </span>
                            <input
                                type="text"
                                value={inputPage}
                                onChange={(e) => setInputPage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        let p = parseInt(inputPage);
                                        if (isNaN(p) || p < 1) p = 1;
                                        if (p > pagesCount) p = pagesCount;
                                        setInputPage(p);
                                        if (p - 1 !== currentPage) onPageClick(p - 1);
                                        e.target.blur();
                                    }
                                }}
                                onBlur={() => {
                                    let p = parseInt(inputPage);
                                    if (isNaN(p) || p < 1) p = 1;
                                    if (p > pagesCount) p = pagesCount;
                                    setInputPage(p);
                                    if (p - 1 !== currentPage) onPageClick(p - 1);
                                }}
                                className="text-[1.4cqw] font-bold bg-transparent border-none outline-none text-center mx-[0.5cqw]"
                                style={{ width: `${String(pagesCount).length + 1}ch`, color: getLayoutColor(layoutColors, 'toolbar-text-main', '#575C9C') }}
                            />
                            <span className="text-[1.4cqw] font-bold" style={{ color: getLayoutColor(layoutColors, 'toolbar-text-main', '#575C9C') }}> / {pagesCount}</span>
                        </div>
                    )}
                </div>

                {/* Right Sidebar Icons */}
                <div 
                    className="flex flex-col items-center py-[2cqh] px-[1cqw] gap-[2cqh] shrink-0 border-l border-white/10"
                    style={{ backgroundColor: getLayoutColor(layoutColors, 'toolbar-bg', '#575C9C') }}
                >
                    <SidebarBtn icon="fluent:text-bullet-list-24-filled" active={showTOC} onClick={() => { setShowTOCMemo?.(!showTOC); setShowThumbnailBarMemo?.(false); setShowProfilePopup?.(false); }} />
                    <SidebarBtn icon="ph:squares-four-fill" active={showThumbnailBar} onClick={() => { setShowThumbnailBarMemo?.(!showThumbnailBar); setShowTOCMemo?.(false); setShowProfilePopup?.(false); }} />
                    <SidebarBtn icon="clarity:image-gallery-solid" active={showGalleryPopup} onClick={() => { setShowGalleryPopupMemo?.(!showGalleryPopup); setShowTOCMemo?.(false); setShowThumbnailBarMemo?.(false); setShowProfilePopup?.(false); }} />
                    {(settings?.media?.backgroundAudio ?? true) && (
                        <SidebarBtn icon="solar:music-notes-bold" active={showSoundPopup} onClick={() => setShowSoundPopupMemo?.(!showSoundPopup)} />
                    )}
                    {(settings?.brandingProfile?.profile ?? true) && (
                        <SidebarBtn icon="fluent:person-24-filled" active={showProfilePopup} onClick={() => { setShowProfilePopup?.(!showProfilePopup); setShowTOCMemo?.(false); setShowThumbnailBarMemo?.(false); }} />
                    )}
                    {(settings?.shareExport?.share ?? true) && (
                        <SidebarBtn icon="mage:share-fill" onClick={() => handleShare && handleShare()} />
                    )}
                    {(settings?.shareExport?.download ?? true) && (
                        <SidebarBtn icon="meteor-icons:download" onClick={() => handleDownload && handleDownload()} />
                    )}
                    <SidebarBtn icon="lucide:fullscreen" onClick={() => handleFullScreen && handleFullScreen()} />
                </div>
            </div>

            {/* Bottom Footer */}
            <div 
                className="w-full flex items-center justify-between px-[2cqw] py-[1.2cqh] shrink-0 z-50 border-t border-white/10"
                style={{ backgroundColor: getLayoutColor(layoutColors, 'bottom-toolbar-bg', '#575C9C') }}
            >
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.5cqw]">
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <ToolbarBtn icon="ph:skip-back" onClick={() => onPageClick && onPageClick(0)} color="white" />
                    )}
                    {(settings?.media?.autoFlip ?? true) && (
                        <ToolbarBtn icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} onClick={() => setIsPlaying(!isAutoFlipping)} color="white" />
                    )}
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <ToolbarBtn icon="ph:skip-forward" onClick={() => onPageClick && onPageClick(pagesCount - 1)} color="white" />
                    )}
                </div>

                {/* Progress Bar Container */}
                <div
                    ref={progressRef}
                    className="flex-1 flex items-center relative h-[3cqh] cursor-pointer group mx-[4cqw]"
                    onClick={handleProgressClick}
                >
                    <div className="w-full h-[0.5cqh] rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/30 transition-colors duration-300" />
                        <div
                            className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-out z-10"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-[1.5cqw]">
                    <ToolbarBtn 
                        icon="ph:magnifying-glass-minus" 
                        onClick={() => setCurrentZoom && setCurrentZoom(Math.max(1, currentZoom - 0.5))} 
                        color="white" 
                    />
                    <div 
                        className="flex items-center gap-[0.5cqw] px-[1.5cqw] py-[0.5cqh] rounded-full"
                        style={{ backgroundColor: '#D7D8E8' }}
                    >
                        <Icon icon="lucide:search" className="w-[1.2cqw] h-[1.2cqw] text-[#575C9C]" />
                        <span className="text-[1.2cqw] font-bold text-[#575C9C]">
                            {Math.round(currentZoom * 100)}%
                        </span>
                        <Icon icon="lucide:search" className="w-[1.2cqw] h-[1.2cqw] text-[#575C9C]" />
                    </div>
                    <button 
                        className="px-[1.5cqw] py-[0.5cqh] rounded-full text-[1.2cqw] font-bold text-[#575C9C]"
                        style={{ backgroundColor: '#D7D8E8' }}
                        onClick={() => setCurrentZoom && setCurrentZoom(1)}
                    >
                        Reset
                    </button>
                </div>
            </div>
            
        </div>
    );
};

export default TabletLayout6;
