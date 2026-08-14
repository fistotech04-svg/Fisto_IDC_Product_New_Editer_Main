import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

const TabletLayout3 = ({ children, bookRef, currentPage, pages, offset = 0, onPageClick, settings, bookName = "Name of the Book", showTOC, setShowTOCMemo, showThumbnailBar, setShowThumbnailBarMemo, showGalleryPopup, setShowGalleryPopupMemo, showSoundPopup, setShowSoundPopupMemo, showProfilePopup, setShowProfilePopupMemo, showExportPopup, setShowExportPopupMemo, currentBook, activeLayout }) => {
    const totalPages = Array.isArray(pages) ? pages.length : pages || 12;
    const displayPage = currentPage === 0 ? 1 : (currentPage || 1);
    let progressPercentage = 0;
    const maxPage = totalPages % 2 === 0 ? totalPages - 1 : totalPages;
    if (maxPage > 1) {
        progressPercentage = ((displayPage - 1) / (maxPage - 1)) * 100;
        if (progressPercentage > 100) progressPercentage = 100;
    }

    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    useEffect(() => {
        if (isPlaying && currentPage >= totalPages - 1 && totalPages > 1) {
            setIsPlaying(false);
        }
    }, [currentPage, isPlaying, totalPages]);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                if (bookRef?.current?.pageFlip) {
                    if (currentPage >= totalPages - 1) {
                        setIsPlaying(false);
                    } else {
                        bookRef.current.pageFlip().flipNext();
                    }
                }
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isPlaying, bookRef, currentPage, totalPages]);

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
    }, []);

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

    return (
        <div
            className="relative w-full h-full flex flex-col font-sans overflow-hidden bg-[#E3E4EF]"
            style={{ containerType: 'inline-size' }}
        >
            {/* Top Bar */}
            <div className="w-full h-[7.5%] bg-[#625FA2] flex items-center px-[2cqw] flex-shrink-0 z-20 shadow-sm relative justify-between">

                {/* Left: Search Bar */}
                <div className="flex-none flex items-center h-full py-[1.2cqw]">
                    <div className="relative w-[18cqw] h-[70%] bg-white rounded-full flex items-center px-[1cqw]">
                        <Icon icon="lucide:search" className="text-[#625FA2] w-[1.2cqw] h-[1.2cqw]" />
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="bg-transparent border-none outline-none w-full h-full text-[1cqw] ml-[0.6cqw] text-gray-700 placeholder-[#625FA2]/70 font-medium"
                        />
                    </div>
                </div>

                {/* Center: Icons */}
                <div className="flex-none flex items-center gap-[1.5cqw] text-white absolute left-1/2 -translate-x-1/2">
                    <button
                        className="hover:text-gray-200 transition-colors"
                        onClick={() => {
                            if (setShowTOCMemo) {
                                setShowTOCMemo(!showTOC);
                            }
                        }}
                    >
                        <Icon icon="fluent:text-bullet-list-24-filled" className="w-[1.9cqw] h-[1.9cqw]" />
                    </button>
                    <button
                        className="hover:text-gray-200 transition-colors"
                        onClick={() => {
                            if (setShowThumbnailBarMemo) {
                                setShowThumbnailBarMemo(!showThumbnailBar);
                            }
                        }}
                    >
                        <Icon icon="ph:squares-four-fill" className="w-[1.9cqw] h-[1.9cqw]" />
                    </button>
                    <button
                        className="hover:text-gray-200 transition-colors"
                        onClick={() => {
                            if (setShowGalleryPopupMemo) {
                                setShowGalleryPopupMemo(!showGalleryPopup);
                            }
                        }}
                    >
                        <Icon icon="clarity:image-gallery-solid" className="w-[1.9cqw] h-[1.9cqw]" />
                    </button>
                    <button
                        className="hover:text-gray-200 transition-colors"
                        onClick={() => {
                            if (setShowSoundPopupMemo) {
                                setShowSoundPopupMemo(!showSoundPopup);
                            }
                        }}
                    >
                        <Icon icon="solar:music-notes-bold" className="w-[1.9cqw] h-[1.9cqw]" />
                    </button>
                    <button
                        className="hover:text-gray-200 transition-colors"
                        onClick={() => {
                            if (setShowProfilePopupMemo) {
                                setShowProfilePopupMemo(!showProfilePopup);
                            }
                        }}
                    >
                        <Icon icon="fluent:person-24-filled" className="w-[1.9cqw] h-[1.9cqw]" />
                    </button>
                    <button 
                        className="hover:text-gray-200 transition-colors"
                        onClick={() => {
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            setShowGalleryPopupMemo?.(false);
                            setShowSoundPopupMemo?.(false);
                            setShowProfilePopupMemo?.(false);
                            setShowExportPopupMemo?.(false);
                            setIsShareOpen(true);
                        }}
                    >
                        <Icon icon="mage:share-fill" className="w-[1.9cqw] h-[1.9cqw]" />
                    </button>
                    <button
                        className="hover:text-gray-200 transition-colors"
                        onClick={() => {
                            if (setShowExportPopupMemo) {
                                setShowExportPopupMemo(!showExportPopup);
                            }
                        }}
                    >
                        <Icon icon="meteor-icons:download" className="w-[1.9cqw] h-[1.9cqw]" />
                    </button>
                    <button className="hover:text-gray-200 transition-colors">
                        <Icon icon="lucide:fullscreen" className="w-[1.9cqw] h-[1.9cqw]" />
                    </button>
                </div>

                {/* Right: Book Name */}
                <div className="flex-none text-white font-semibold text-[1.2cqw] truncate max-w-[20cqw]">
                    {bookName}
                </div>
            </div>

            {/* Thumbnail Bar */}
            {showThumbnailBar && (
                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 z-[150] pointer-events-auto">
                    <div
                        className="relative flex items-center bg-white shadow-[0_0.5cqw_2cqw_rgba(0,0,0,0.25)] rounded-[1.5cqw] px-[1cqw] py-[1cqw]"
                        style={{
                            width: 'fit-content',
                            maxWidth: '85cqw',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {spreads.length > 6 && (
                            <button
                                className={`flex items-center justify-center shrink-0 transition-opacity z-20 px-[0.5cqw] ${canScrollLeft ? 'opacity-100 cursor-pointer text-[#4F4A95]' : 'opacity-30 cursor-default text-[#4F4A95]'}`}
                                onClick={(e) => { e.stopPropagation(); if (canScrollLeft) scroll('left'); }}
                            >
                                <Icon icon="lucide:chevron-left" className="w-[2cqw] h-[2cqw]" />
                            </button>
                        )}

                        <div
                            ref={scrollRef}
                            className="flex items-center w-full overflow-x-auto no-scrollbar scroll-smooth relative"
                            style={{
                                maxWidth: '69.5cqw',
                                paddingLeft: spreads.length > 6 ? '1cqw' : '1cqw',
                                paddingRight: spreads.length > 6 ? '1cqw' : '1cqw',
                                gap: '1.5cqw'
                            }}
                            onScroll={checkScroll}
                        >
                            {spreads.map((spread, idx) => {
                                const isActive = spread.indices.includes(currentPage - 1);
                                return (
                                    <div
                                        key={idx}
                                        data-index={idx}
                                        className={`thumbnail-item flex flex-col items-center shrink-0 cursor-pointer rounded-[0.8cqw] p-[0.4cqw] border-[0.3cqw] transition-all gap-[0.3cqw]`}
                                        style={{
                                            width: '10cqw',
                                            borderColor: isActive ? '#4F4A95' : '#E5E7EB',
                                            backgroundColor: isActive ? '#4F4A95' : 'white'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (bookRef?.current?.pageFlip) {
                                                bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                            }
                                        }}
                                    >
                                        <div
                                            className={`relative overflow-hidden w-full h-[6.5cqw] bg-white rounded-[0.4cqw]`}
                                        >
                                            {/* Inner Flex Container for Spread */}
                                            <div className="flex w-full h-full gap-[1px] bg-gray-200 justify-center">
                                                {spread.pages.map((page, pIdx) => (
                                                    <div key={pIdx} className="flex-1 max-w-[50%] h-full relative border-r border-black/10 last:border-r-0 bg-white overflow-hidden flex items-center justify-center">
                                                        {(isActive || visibleIndices.includes(idx) ||
                                                            (visibleIndices.length > 0 && Math.abs(idx - visibleIndices[0]) <= 5) ||
                                                            (visibleIndices.length > 0 && Math.abs(idx - visibleIndices[visibleIndices.length - 1]) <= 5)
                                                        ) ? (
                                                            <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={0.07} />
                                                        ) : (
                                                            <div className="w-full h-full bg-white flex items-center justify-center">
                                                                <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-full flex-1 flex items-center justify-center">
                                            <span
                                                className={`text-[0.95cqw] font-bold tracking-tight pb-[0.2cqw] ${isActive ? 'text-white' : 'text-[#4F4A95]'}`}
                                            >
                                                {spread.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {spreads.length > 6 && (
                            <button
                                className={`flex items-center justify-center shrink-0 transition-opacity z-20 px-[0.5cqw] ${canScrollRight ? 'opacity-100 cursor-pointer text-[#4F4A95]' : 'opacity-30 cursor-default text-[#4F4A95]'}`}
                                onClick={(e) => { e.stopPropagation(); if (canScrollRight) scroll('right'); }}
                            >
                                <Icon icon="lucide:chevron-right" className="w-[2cqw] h-[2cqw]" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Middle Content Area */}
            <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden">
                {/* Navigation Arrows */}
                <button
                    className="absolute left-[3cqw] z-10 w-[3cqw] h-[3cqw] rounded-full bg-[#625FA2] text-white flex items-center justify-center hover:bg-[#504d85] transition-colors shadow-md"
                    onClick={() => {
                        if (bookRef?.current?.pageFlip) {
                            bookRef.current.pageFlip().flipPrev();
                        }
                    }}
                >
                    <Icon icon="ph:caret-left-bold" className="w-[1.5cqw] h-[1.5cqw]" />
                </button>

                <button
                    className="absolute right-[3cqw] z-10 w-[3cqw] h-[3cqw] rounded-full bg-[#625FA2] text-white flex items-center justify-center hover:bg-[#504d85] transition-colors shadow-md"
                    onClick={() => {
                        if (bookRef?.current?.pageFlip) {
                            bookRef.current.pageFlip().flipNext();
                        }
                    }}
                >
                    <Icon icon="ph:caret-right-bold" className="w-[1.5cqw] h-[1.5cqw]" />
                </button>

                <div
                    className="w-[90%] h-[90%] relative flex items-center justify-center transition-transform duration-500 ease-in-out"
                    style={{
                        transform: currentPage <= 1 ? 'translateX(-25%)' :
                            (currentPage >= totalPages - 1 && totalPages % 2 === 0) ? 'translateX(25%)' : 'translateX(0)'
                    }}
                >
                    {children}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="w-full h-[6.5%] bg-[#625FA2] flex flex-col justify-center px-[2cqw] relative flex-shrink-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">

                <div className="flex items-center justify-between w-full -mt-[0.5cqw]">
                    {/* Left: Page Info */}
                    <div className="bg-[#E3E4EF] text-[#625FA2] px-[1cqw] py-[0.4cqw] rounded-[0.4cqw] text-[0.9cqw] font-semibold shadow-sm">
                        Page {displayPage} / {totalPages}
                    </div>

                    {/* Center: Playback Controls */}
                    <div className="flex items-center gap-[1.5cqw] text-white absolute left-1/2 -translate-x-1/2">
                        <button
                            className="hover:text-gray-200 transition-colors"
                            onClick={() => {
                                if (bookRef?.current?.pageFlip) {
                                    bookRef.current.pageFlip().turnToPage(0);
                                }
                            }}
                        >
                            <Icon icon="ph:skip-back" className="w-[1.4cqw] h-[1.4cqw]" />
                        </button>
                        <button
                            className="hover:text-gray-200 transition-colors"
                            onClick={() => {
                                // If we're at the end and they click play, optionally restart from beginning
                                if (!isPlaying && currentPage >= totalPages - 1 && bookRef?.current?.pageFlip) {
                                    bookRef.current.pageFlip().turnToPage(0);
                                }
                                setIsPlaying(!isPlaying);
                            }}
                        >
                            <Icon icon={isPlaying ? "ph:pause-fill" : "ph:play-fill"} className="w-[1.6cqw] h-[1.6cqw]" />
                        </button>
                        <button
                            className="hover:text-gray-200 transition-colors"
                            onClick={() => {
                                if (bookRef?.current?.pageFlip) {
                                    const lastIndex = Array.isArray(pages) ? pages.length - 1 : (pages || 12) - 1;
                                    bookRef.current.pageFlip().turnToPage(lastIndex);
                                }
                            }}
                        >
                            <Icon icon="ph:skip-forward" className="w-[1.4cqw] h-[1.4cqw]" />
                        </button>
                    </div>

                    {/* Right: Zoom Controls */}
                    <div className="bg-[#E3E4EF] rounded-[0.4cqw] flex items-center px-[0.6cqw] py-[0.4cqw] gap-[0.8cqw] shadow-sm">
                        <button className="text-[#625FA2] hover:opacity-80 transition-opacity">
                            <Icon icon="fluent:zoom-out-24-regular" className="w-[1.2cqw] h-[1.2cqw]" />
                        </button>
                        <span className="text-[#625FA2] text-[0.9cqw] font-semibold min-w-[2.5cqw] text-center">100%</span>
                        <button className="text-[#625FA2] hover:opacity-80 transition-opacity">
                            <Icon icon="fluent:zoom-in-24-regular" className="w-[1.2cqw] h-[1.2cqw]" />
                        </button>
                        <button className="bg-[#625FA2] text-white px-[0.8cqw] py-[0.2cqw] rounded-[0.3cqw] text-[0.8cqw] font-semibold hover:bg-[#504d85] transition-colors ml-[0.2cqw]">
                            Reset
                        </button>
                    </div>
                </div>

                {/* Progress Line */}
                <div className="absolute bottom-[0.8cqw] left-[2cqw] right-[2cqw] h-[2px] bg-white/20 rounded-full">
                    <div
                        className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            {showTOC && (
                <TabletTableOfContentsPopup
                    onClose={() => setShowTOCMemo?.(false)}
                    onNavigate={(idx) => {
                        if (onPageClick) {
                            onPageClick(idx);
                        } else if (bookRef?.current?.pageFlip) {
                            bookRef.current.pageFlip().turnToPage(idx + 1);
                        }
                    }}
                    settings={settings}
                    variant="layout3"
                />
            )}

            <div id="tablet-sound-portal" className="absolute inset-0 z-50 pointer-events-none"></div>
            <div id="tablet-profile-portal" className="absolute inset-0 z-[55] pointer-events-none"></div>
            <div id="tablet-download-portal" className="absolute inset-0 z-[60] pointer-events-none"></div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                isTabletLayout={true}
                currentBook={currentBook || settings}
                activeLayout={activeLayout || '3'}
            />
        </div>
    );
};

export default TabletLayout3;
