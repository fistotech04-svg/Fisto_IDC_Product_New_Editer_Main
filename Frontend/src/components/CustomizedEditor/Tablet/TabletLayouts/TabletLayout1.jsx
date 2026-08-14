import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import TabletTableOfContentsPopup from './TabletTableOfContentsPopup';
import ShareModal from '../../../ShareModal';

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
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        background: white; 
                        width: 400px; 
                        height: 566px; 
                        position: relative;
                    }
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

const TabletLayout1 = ({ children, bookRef, currentPage, pages, offset = 0, settings, showTOC, setShowTOCMemo, showThumbnailBar, setShowThumbnailBarMemo, onPageClick, showSoundPopup, setShowSoundPopupMemo, showProfilePopup, setShowProfilePopupMemo, showGalleryPopup, setShowGalleryPopupMemo, currentBook, activeLayout, handleFullScreen }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState([]);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const progressRef = useRef(null);
    const handleProgressClick = (e) => {
        if (!progressRef.current || !pages || pages.length <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pages.length - 1));

        setShowTOCMemo?.(false);
        setShowThumbnailBarMemo?.(false);
        if (onPageClick) onPageClick(targetIdx);
    };
    let progressPercentage = 0;
    if (pages && pages.length > 1) {
        if (currentPage >= pages.length - 1) {
            progressPercentage = 100;
        } else if (pages.length % 2 !== 0 && currentPage >= pages.length - 2) {
            progressPercentage = 100;
        } else {
            progressPercentage = (currentPage / (pages.length - 1)) * 100;
        }
    }

    const getLayoutColor = (id, defaultColor) => {
        return `var(--${id}, ${defaultColor})`;
    };
    const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
        return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
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

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth * 0.2;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const checkScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const overflowing = scrollWidth > clientWidth + 5;
            setIsOverflowing(overflowing);
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

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

            if (visible.length > 0) {
                setVisibleIndices(visible.sort((a, b) => a - b));
            }
        }
    }, [spreads.length]);

    useEffect(() => {
        if (!scrollRef.current || !showThumbnailBar) return;
        const interval = setInterval(checkScroll, 100);
        const resizeObserver = new ResizeObserver(() => { checkScroll(); });
        resizeObserver.observe(scrollRef.current);
        checkScroll();
        return () => { clearInterval(interval); resizeObserver.disconnect(); };
    }, [showThumbnailBar, checkScroll]);

    useEffect(() => {
        if (showThumbnailBar && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
            }
            setTimeout(checkScroll, 50);
        }
    }, [currentPage, showThumbnailBar, checkScroll]);

    const [localSearchQuery, setLocalSearchQuery] = useState('');

    const {
        addSearch = true,
        addPageNumber = true,
        addSerialNumberHeading = true,
        addSerialNumberSubheading = true,
        content: propContent,
        items: propItems,
        toc: propToc
    } = settings?.tocSettings || settings?.toc || {};

    const [inputPage, setInputPage] = useState(currentPage === 0 ? 1 : (currentPage || 1));

    useEffect(() => {
        setInputPage(currentPage === 0 ? 1 : (currentPage || 1));
    }, [currentPage]);

    const handlePageInputSubmit = (e) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            let targetPage = parseInt(inputPage);
            const totalPages = Array.isArray(pages) ? pages.length : pages || 12;

            if (isNaN(targetPage)) {
                setInputPage(currentPage === 0 ? 1 : (currentPage || 1));
                return;
            }
            if (targetPage < 1) targetPage = 1;
            if (targetPage > totalPages) targetPage = totalPages;

            setInputPage(targetPage);

            if (bookRef?.current?.pageFlip) {
                bookRef.current.pageFlip().turnToPage(targetPage - 1);
            }
        }
    };


    return (
        <div
            className="relative w-full h-full flex flex-col font-sans overflow-hidden bg-[#E6E8ED]"
            style={{ containerType: 'inline-size' }}
        >
            <div id="tablet-download-portal" className="absolute inset-0 z-[60] pointer-events-none"></div>
            {/* Top Bar */}
            <div className="w-full h-[8%] bg-[#5C5898] flex items-center justify-between px-[2cqw] flex-shrink-0 z-10 shadow-md">
                {/* Search Bar */}
                <div className="relative w-[25cqw] h-[60%] bg-[#E6E8ED]/90 rounded-full flex items-center px-[1cqw]">
                    <Icon icon="lucide:search" className="text-gray-500 w-[1.8cqw] h-[1.8cqw]" />
                    <input
                        type="text"
                        placeholder="Quick Search..."
                        className="bg-transparent border-none outline-none w-full h-full text-[1.4cqw] ml-[0.5cqw] text-gray-700 placeholder-gray-500"
                    />
                </div>

                {/* Title */}
                <div className="absolute left-1/2 -translate-x-1/2 text-white font-medium text-[1.8cqw] tracking-wide">
                    Flipbook_20260704100611
                </div>

                {/* Empty space for balance */}
                <div className="w-[25cqw]"></div>
            </div>

            {/* Middle Content Area */}
            <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden">

                {/* Left Chevron */}
                <button
                    onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
                    className={`absolute left-[2cqw] w-[3cqw] h-[4cqw] rounded-[0.3cqw] flex items-center justify-center transition-colors z-10 ${(!currentPage || currentPage === 0)
                        ? 'bg-[#8986B3] opacity-70'
                        : 'bg-[#5C5898] hover:bg-[#4F4A95] shadow-md'
                        }`}
                >
                    <Icon icon="lucide:chevron-left" className="text-white w-[2cqw] h-[2cqw]" />
                </button>

                {/* The Book (Placeholder or Children) */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center z-0">
                    <div
                        style={{ transform: `translateX(${offset}px)`, transition: 'transform 0.5s ease-out' }}
                        className="flex items-center justify-center"
                    >
                        {children ? (
                            children
                        ) : (
                            <div className="h-[90%] aspect-[1/1.4] bg-white shadow-[0_1cqw_3cqw_rgba(0,0,0,0.15)] flex flex-col items-center pt-[5cqw] relative overflow-hidden">
                                <div className="w-full px-[3cqw]">
                                    <div className="w-[10cqw] h-[3cqw] bg-gray-200 mb-[2cqw]"></div>
                                    <div className="w-full h-[8cqw] bg-teal-800 mb-[1cqw]"></div>
                                    <div className="w-2/3 h-[2cqw] bg-gray-300 mb-[4cqw]"></div>

                                    <div className="flex gap-[2cqw] mb-[4cqw]">
                                        <div className="w-1/3 h-[15cqw] bg-gray-100"></div>
                                        <div className="w-2/3 h-[15cqw] bg-gray-200"></div>
                                    </div>

                                    <div className="w-1/2 h-[2cqw] bg-gray-300 mb-[2cqw]"></div>
                                    <div className="w-full h-[10cqw] bg-gray-100"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Chevron */}
                <button
                    onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
                    className={`absolute right-[2cqw] w-[3cqw] h-[4cqw] rounded-[0.3cqw] flex items-center justify-center transition-colors z-10 ${(pages && currentPage >= (Array.isArray(pages) ? pages.length - 1 : pages - 1))
                        ? 'bg-[#8986B3] opacity-70'
                        : 'bg-[#5C5898] hover:bg-[#4F4A95] shadow-md'
                        }`}
                >
                    <Icon icon="lucide:chevron-right" className="text-white w-[2cqw] h-[2cqw]" />
                </button>

                {/* Page Indicator Pill */}
                <div className="absolute bottom-[2cqw] left-[2cqw] bg-white px-[2cqw] py-[0.8cqw] rounded-full shadow-sm text-[#5C5898] font-semibold text-[1.4cqw] flex items-center justify-center z-10">
                    Page
                    <input
                        type="text"
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value)}
                        onKeyDown={handlePageInputSubmit}
                        onBlur={handlePageInputSubmit}
                        className="w-[4cqw] text-center bg-transparent outline-none mx-[0.5cqw]"
                    />
                    / {Array.isArray(pages) ? pages.length : pages || 12}
                </div>
            </div>


            {showThumbnailBar && (
                <div className="absolute inset-0 z-[150] pointer-events-none flex items-end justify-center pb-[10cqw]">
                    <div
                        className="relative flex items-center group/bar fisto-menu-content thumbnail-bar pointer-events-auto transition-all shadow-[0_1cqw_4cqw_rgba(0,0,0,0.3)] backdrop-blur-md overflow-hidden"
                        style={{
                            width: 'fit-content',
                            minWidth: '40cqw',
                            maxWidth: '90cqw',
                            height: '14cqw',
                            backgroundColor: 'rgba(87, 92, 156, 0.8)',
                            borderRadius: '1.5cqw',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {spreads.length > 6 && (
                            <div className="absolute left-[1cqw] inset-y-0 flex items-center z-50">
                                <button
                                    className={`w-[3cqw] h-[5cqw] rounded-[0.5cqw] flex items-center justify-center transition-all shadow-xl transition-colors border border-white/20 ${canScrollLeft ? 'opacity-100 active:scale-95 hover:bg-white/10 cursor-pointer' : 'opacity-30 cursor-default'}`}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        color: '#FFFFFF'
                                    }}
                                    onClick={(e) => { e.stopPropagation(); if (canScrollLeft) scroll('left'); }}
                                >
                                    <Icon icon="lucide:chevron-left" className="w-[2cqw] h-[2cqw]" />
                                </button>
                            </div>
                        )}

                        <div
                            ref={scrollRef}
                            className="flex items-center h-full overflow-x-auto no-scrollbar scroll-smooth relative"
                            style={{
                                paddingLeft: spreads.length > 6 ? '5cqw' : '2cqw',
                                paddingRight: spreads.length > 6 ? '5cqw' : '2cqw',
                                gap: '2cqw'
                            }}
                            onScroll={checkScroll}
                        >
                            {spreads.map((spread, idx) => {
                                const isActive = spread.indices.includes(currentPage - 1);
                                return (
                                    <div
                                        key={idx}
                                        data-index={idx}
                                        className={`thumbnail-item flex flex-col items-center shrink-0 cursor-pointer rounded-[0.5cqw] ${isActive ? 'active-thumbnail' : ''}`}
                                        style={{
                                            padding: '0.6cqw 1cqw',
                                            gap: '0.4cqw',
                                            backgroundColor: isActive ? 'rgba(87, 92, 156, 0.6)' : 'rgba(87, 92, 156, 0.2)',
                                            opacity: 1,
                                            transition: 'all 0.3s ease'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (bookRef?.current?.pageFlip) {
                                                bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                            }
                                        }}
                                    >
                                        <div
                                            className={`relative overflow-hidden transition-all bg-white border-[2px] shadow-xl rounded-none ${isActive ? 'border-white' : 'border-transparent hover:border-white/20'}`}
                                            style={{
                                                width: '10cqw',
                                                height: '7.5cqw'
                                            }}
                                        >
                                            {/* Inner Flex Container for Spread */}
                                            <div className="flex w-full h-full gap-[1px] bg-gray-200 justify-center">
                                                {spread.pages.map((page, pIdx) => (
                                                    <div key={pIdx} className="flex-1 max-w-[50%] h-full relative border-r border-black/10 last:border-r-0 bg-white overflow-hidden flex items-center justify-center">
                                                        {(isActive || visibleIndices.includes(idx) ||
                                                            (visibleIndices.length > 0 && Math.abs(idx - visibleIndices[0]) <= 5) ||
                                                            (visibleIndices.length > 0 && Math.abs(idx - visibleIndices[visibleIndices.length - 1]) <= 5)
                                                        ) ? (
                                                            <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={0.11} />
                                                        ) : (
                                                            <div className="w-full h-full bg-white flex items-center justify-center">
                                                                <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <span
                                            className={`text-[1.2cqw] transition-colors ${isActive ? 'font-bold' : 'font-medium'}`}
                                            style={{ color: '#FFFFFF' }}
                                        >
                                            {spread.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {spreads.length > 6 && (
                            <div className="absolute right-[1cqw] inset-y-0 flex items-center z-50">
                                <button
                                    className={`w-[3cqw] h-[5cqw] rounded-[0.5cqw] flex items-center justify-center transition-all shadow-xl transition-colors border border-white/20 ${canScrollRight ? 'opacity-100 active:scale-95 hover:bg-white/10 cursor-pointer' : 'opacity-30 cursor-default'}`}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        color: '#FFFFFF'
                                    }}
                                    onClick={(e) => { e.stopPropagation(); if (canScrollRight) scroll('right'); }}
                                >
                                    <Icon icon="lucide:chevron-right" className="w-[2cqw] h-[2cqw]" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {showTOC && (
                <TabletTableOfContentsPopup
                    onClose={() => setShowTOCMemo?.(false)}
                    onNavigate={(pageIndex) => bookRef?.current?.pageFlip()?.turnToPage(pageIndex)}
                    settings={settings}
                />
            )}

            {/* The React Portal targets for popups */}
            <div id="tablet-sound-portal" className="absolute inset-0 z-50 pointer-events-none"></div>
            <div id="tablet-profile-portal" className="absolute inset-0 z-50 pointer-events-none"></div>

            {/* Bottom Bar */}
            <div className="w-full h-[8%] bg-[#5C5898] flex items-center justify-between px-[2cqw] flex-shrink-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">

                {/* Left Icons */}
                <div className="flex items-center gap-[1.5cqw]">
                    <button
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setShowTOCMemo?.(!showTOC); }}
                        style={{ opacity: showTOC ? 0.7 : 1 }}
                    >
                        <Icon icon="fluent:text-bullet-list-24-filled" className="w-[1.8cqw] h-[1.8cqw]" />
                    </button>
                    <button
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (showThumbnailBar) {
                                setShowThumbnailBarMemo?.(false);
                            } else {
                                setShowTOCMemo?.(false);
                                setShowThumbnailBarMemo?.(true);
                            }
                        }}
                        style={{ opacity: showThumbnailBar ? 0.7 : 1 }}
                    >
                        <Icon icon="ph:squares-four-fill" className="w-[1.8cqw] h-[1.8cqw]" />
                    </button>
                </div>

                {/* Middle Playback & Scrubber */}
                <div className="flex items-center gap-[1.5cqw] flex-1 max-w-[40cqw] mx-[2cqw]">
                    <button
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={() => {
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            if (onPageClick) onPageClick(0);
                        }}
                    >
                        <Icon icon="ph:skip-back" className="w-[1.8cqw] h-[1.8cqw]" />
                    </button>
                    <button className="text-white hover:text-gray-200 transition-colors">
                        <Icon icon="ph:play-fill" className="w-[1.8cqw] h-[1.8cqw] fill-white" />
                    </button>
                    <button
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={() => {
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            if (onPageClick && pages && Array.isArray(pages)) {
                                onPageClick(pages.length - 1);
                            } else if (onPageClick && pages) {
                                onPageClick(pages - 1);
                            }
                        }}
                    >
                        <Icon icon="ph:skip-forward" className="w-[1.8cqw] h-[1.8cqw]" />
                    </button>

                    <div
                        ref={progressRef}
                        onClick={handleProgressClick}
                        className="flex-1 h-[0.3cqw] bg-white/30 rounded-full relative cursor-pointer ml-[1cqw]"
                    >
                        <div
                            className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-[1cqw] h-[1cqw] bg-white rounded-full shadow-sm transition-all duration-300"
                            style={{ left: `calc(${progressPercentage}% - 0.5cqw)` }}
                        ></div>
                    </div>
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-[1.2cqw]">
                    <div className="relative">
                        <button
                            className="text-white hover:text-gray-200 transition-colors relative"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTOCMemo?.(false);
                                setShowThumbnailBarMemo?.(false);
                                setShowProfilePopupMemo?.(false);
                                setShowGalleryPopupMemo?.(false);
                                setShowSoundPopupMemo?.(!showSoundPopup);
                            }}
                            style={{ opacity: showSoundPopup ? 0.7 : 1 }}
                        >
                            <Icon icon="solar:music-notes-bold" className="w-[1.6cqw] h-[1.6cqw]" />
                        </button>
                    </div>
                    <button
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            setShowSoundPopupMemo?.(false);
                            setShowProfilePopupMemo?.(false);
                            setShowGalleryPopupMemo?.(!showGalleryPopup);
                        }}
                        style={{ opacity: showGalleryPopup ? 0.7 : 1 }}
                    >
                        <Icon icon="clarity:image-gallery-solid" className="w-[1.6cqw] h-[1.6cqw]" />
                    </button>
                    <button
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            setShowSoundPopupMemo?.(false);
                            setShowProfilePopupMemo?.(!showProfilePopup);
                        }}
                        style={{ opacity: showProfilePopup ? 0.7 : 1 }}
                    >
                        <Icon icon="fluent:person-24-filled" className="w-[1.6cqw] h-[1.6cqw]" />
                    </button>

                    {/* Zoom Section */}
                    <div className="flex items-center gap-[0.5cqw] ml-[1cqw]">
                        <button className="text-white hover:text-gray-200 transition-colors">
                            <Icon icon="ph:magnifying-glass-minus" className="w-[1.6cqw] h-[1.6cqw]" />
                        </button>
                        <div className="w-[6cqw] h-[0.3cqw] bg-white/30 rounded-full relative cursor-pointer">
                            <div className="absolute left-0 top-0 h-full w-[30%] bg-white rounded-full"></div>
                            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-[1cqw] h-[1cqw] bg-white rounded-full shadow-sm"></div>
                        </div>
                        <button className="text-white hover:text-gray-200 transition-colors">
                            <Icon icon="ph:magnifying-glass-plus" className="w-[1.6cqw] h-[1.6cqw]" />
                        </button>
                    </div>

                    <button
                        className="text-white hover:text-gray-200 transition-colors ml-[1cqw]"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            setShowSoundPopupMemo?.(false);
                            setShowProfilePopupMemo?.(false);
                            setShowGalleryPopupMemo?.(false);
                            setIsShareOpen(true);
                        }}
                    >
                        <Icon icon="mage:share-fill" className="w-[1.6cqw] h-[1.6cqw]" />
                    </button>
                    <button className="text-white hover:text-gray-200 transition-colors">
                        <Icon icon="meteor-icons:download" className="w-[1.6cqw] h-[1.6cqw]" />
                    </button>
                    <button className="text-white hover:text-gray-200 transition-colors">
                        <Icon icon="lucide:fullscreen" className="w-[1.6cqw] h-[1.6cqw]" />
                    </button>
                </div>

            </div>
            
            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                isTabletLayout={true}
                currentBook={currentBook || settings}
                activeLayout={activeLayout || '1'}
            />
        </div>
    );
};

export default TabletLayout1;
