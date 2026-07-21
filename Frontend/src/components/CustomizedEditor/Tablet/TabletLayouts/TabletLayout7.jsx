import React, { useRef } from 'react';
import { Icon } from '@iconify/react';

const TabletLayout7 = ({ 
    children, 
    bookRef, 
    currentPage = 0, 
    pages, 
    offset = 0, 
    bookName,
    onPageClick,
    zoom = 1,
    ...props 
}) => {
    const progressRef = useRef(null);
    
    const pagesCount = pages ? (Array.isArray(pages) ? pages.length : pages) : 12;
    let progressPercentage = 0;
    if (pagesCount > 1) {
        if (currentPage >= pagesCount - 1) {
            progressPercentage = 100;
        } else {
            progressPercentage = (currentPage / (pagesCount - 1)) * 100;
        }
    }

    const handleProgressClick = (e) => {
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pagesCount - 1));
        if (onPageClick) onPageClick(targetIdx);
    };

    return (
        <div className="relative w-full h-full flex flex-col font-sans overflow-hidden bg-[#E6E8ED]" style={{ containerType: 'inline-size' }}>
      <div id="tablet-download-portal" className="absolute inset-0 z-[60] pointer-events-none"></div>
            
            {/* Top Bar - Floating/Transparent */}
            <div className="absolute top-[2cqw] left-[2cqw] right-[2cqw] flex items-center justify-between z-20 pointer-events-none">
                {/* Search Bar */}
                <div className="pointer-events-auto flex items-center bg-[#E6E8ED]/40 border border-[#CBD5E1] rounded-[0.5cqw] px-[1cqw] py-[0.6cqw] w-[20cqw] backdrop-blur-sm shadow-sm">
                    <Icon icon="lucide:search" className="text-[#8492A6] w-[1.5cqw] h-[1.5cqw]" />
                    <input type="text" placeholder="Quick Search..." className="bg-transparent outline-none border-none text-[1.2cqw] ml-[0.5cqw] text-gray-700 w-full placeholder-[#8492A6]" />
                </div>
                {/* Title */}
                <div className="text-white font-bold text-[1.8cqw] tracking-wide filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                    {bookName || "Flipbook_20260704100611"}
                </div>
                {/* Spacer to keep title centered */}
                <div className="w-[20cqw]"></div>
            </div>

            {/* Middle Content Area */}
            <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden pt-[6cqw]">
                {/* Left Chevron */}
                <button 
                    onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
                    className="absolute left-[3cqw] z-10 p-[1cqw] text-[#A3A1C6] hover:text-[#5C5898] transition-colors"
                >
                    <Icon icon="lucide:chevron-left" className="w-[3cqw] h-[4cqw]" />
                </button>

                {/* Flipbook Container */}
                <div className="relative z-0 shadow-[0_15px_30px_rgba(0,0,0,0.15)] flex items-center justify-center transition-transform duration-500" style={{ transform: `translateX(${offset}px) scale(${zoom})` }}>
                    {children}
                </div>

                {/* Right Chevron */}
                <button 
                    onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
                    className="absolute right-[8cqw] z-10 p-[1cqw] text-[#A3A1C6] hover:text-[#5C5898] transition-colors"
                >
                    <Icon icon="lucide:chevron-right" className="w-[3cqw] h-[4cqw]" />
                </button>

                {/* Right Vertical Toolbar */}
                <div className="absolute right-[1.5cqw] top-1/2 -translate-y-1/2 bg-[#5C5898] rounded-[0.8cqw] flex flex-col items-center py-[1.2cqw] gap-[1.2cqw] z-20 shadow-lg px-[0.7cqw]">
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="fluent:text-bullet-list-24-filled" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="ph:squares-four-fill" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="clarity:image-gallery-solid" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="solar:music-notes-bold" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="fluent:person-24-filled" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="mage:share-fill" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="meteor-icons:download" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="lucide:fullscreen" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                </div>

                {/* Bottom Right Badge */}
                <div className="absolute right-[2cqw] bottom-[2cqw] bg-white rounded-[0.4cqw] px-[1cqw] py-[0.5cqw] shadow-md z-20">
                    <span className="text-[#5C5898] font-bold text-[1cqw] tabular-nums">Page {currentPage + 1} / {pagesCount}</span>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="w-full h-[7.5%] bg-[#5C5898] flex items-center justify-between px-[2cqw] flex-shrink-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.5cqw]">
                    <button onClick={() => onPageClick && onPageClick(0)} className="text-white/80 hover:text-white active:scale-95 transition-all"><Icon icon="ph:skip-back" className="w-[1.4cqw] h-[1.4cqw]" /></button>
                    <button className="text-white hover:text-gray-200 active:scale-95 transition-all"><Icon icon="ph:play-fill" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button onClick={() => onPageClick && onPageClick(pagesCount - 1)} className="text-white/80 hover:text-white active:scale-95 transition-all"><Icon icon="ph:skip-forward" className="w-[1.4cqw] h-[1.4cqw]" /></button>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 mx-[4cqw] relative flex items-center cursor-pointer h-[2cqw] group" ref={progressRef} onClick={handleProgressClick}>
                    <div className="w-full h-[0.2cqw] bg-white/30 rounded-full overflow-hidden relative">
                        <div className="absolute left-0 top-0 h-full bg-white transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center bg-[#494582] rounded-[0.4cqw] border border-white/10 pl-[0.8cqw] pr-[0.4cqw] py-[0.4cqw] gap-[0.8cqw]">
                    <button className="text-white/80 hover:text-white"><Icon icon="ph:magnifying-glass-minus" className="w-[1.2cqw] h-[1.2cqw]" /></button>
                    <span className="text-white font-bold text-[1cqw]">100%</span>
                    <button className="text-white/80 hover:text-white"><Icon icon="ph:magnifying-glass-plus" className="w-[1.2cqw] h-[1.2cqw]" /></button>
                    <button className="bg-white text-[#5C5898] font-bold text-[0.9cqw] px-[0.8cqw] py-[0.3cqw] rounded-[0.2cqw] ml-[0.3cqw] hover:bg-gray-100 transition-colors">Reset</button>
                </div>
            </div>
        </div>
    );
};

export default TabletLayout7;
