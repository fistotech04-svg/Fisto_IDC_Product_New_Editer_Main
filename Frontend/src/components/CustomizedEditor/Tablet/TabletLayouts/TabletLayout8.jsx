import React, { useRef } from 'react';
import { Icon } from '@iconify/react';

const TabletLayout8 = ({ 
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
            <div className="absolute top-[2cqw] left-0 w-full px-[3cqw] flex items-center justify-between z-20 pointer-events-none">
                
                {/* Left Controls (Search & Zoom) */}
                <div className="pointer-events-auto flex items-center gap-[1cqw]">
                    {/* Search Bar */}
                    <div className="flex items-center bg-white rounded-full px-[1cqw] py-[0.5cqw] w-[18cqw] shadow-sm">
                        <Icon icon="lucide:search" className="text-[#8986B3] w-[1.4cqw] h-[1.4cqw]" />
                        <input type="text" placeholder="Quick Search..." className="bg-transparent outline-none border-none text-[1.1cqw] ml-[0.5cqw] text-gray-700 w-full placeholder-[#A3A1C6]" />
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center bg-[#DEDDF0]/50 rounded-full px-[1cqw] py-[0.4cqw] gap-[0.8cqw] backdrop-blur-md">
                        <button className="text-[#5C5898] hover:text-[#4F4A95] transition-colors"><Icon icon="ph:magnifying-glass-minus" className="w-[1.2cqw] h-[1.2cqw]" /></button>
                        <span className="text-[#5C5898] font-bold text-[1cqw]">100%</span>
                        <button className="text-[#5C5898] hover:text-[#4F4A95] transition-colors"><Icon icon="ph:magnifying-glass-plus" className="w-[1.2cqw] h-[1.2cqw]" /></button>
                        <button className="bg-white text-[#5C5898] font-bold text-[0.9cqw] px-[1cqw] py-[0.3cqw] rounded-full ml-[0.2cqw] shadow-sm hover:bg-gray-50 transition-colors">Reset</button>
                    </div>
                </div>

                {/* Title (Center Absolute) */}
                <div className="absolute left-1/2 -translate-x-1/2 text-white font-bold text-[1.6cqw] tracking-wide filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] pointer-events-auto">
                    {bookName || "Flipbook_20260704100611"}
                </div>
            </div>

            {/* Middle Content Area */}
            <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden">
                {/* Left Chevron */}
                <button 
                    onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
                    className="absolute left-[3cqw] z-10 p-[1cqw] text-[#A3A1C6] hover:text-[#5C5898] transition-colors"
                >
                    <Icon icon="lucide:chevron-left" className="w-[3.5cqw] h-[4cqw]" />
                </button>

                {/* Flipbook Container */}
                <div className="relative z-0 shadow-[0_15px_30px_rgba(0,0,0,0.15)] flex items-center justify-center transition-transform duration-500" style={{ transform: `translateX(${offset}px) scale(${zoom})` }}>
                    {children}
                </div>

                {/* Right Chevron */}
                <button 
                    onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
                    className="absolute right-[3cqw] z-10 p-[1cqw] text-[#A3A1C6] hover:text-[#5C5898] transition-colors"
                >
                    <Icon icon="lucide:chevron-right" className="w-[3.5cqw] h-[4cqw]" />
                </button>

                {/* Bottom Left Floating Badge */}
                <div className="absolute left-[3cqw] bottom-[2cqw] bg-[#5C5898] rounded-[0.4cqw] px-[1.5cqw] py-[0.6cqw] shadow-lg z-20">
                    <span className="text-white font-bold text-[1.1cqw] tabular-nums">Page <span className="mx-[0.2cqw]">{currentPage + 1}</span> / <span className="mx-[0.2cqw]">{pagesCount}</span></span>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="w-full h-[12%] bg-[#5C5898] flex flex-col justify-center px-[4cqw] py-[1cqw] flex-shrink-0 z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.15)]">
                
                {/* Icons Row */}
                <div className="flex items-center justify-between w-full mb-[1cqw]">
                    
                    {/* Left Icons */}
                    <div className="flex items-center gap-[2.5cqw]">
                        <button className="text-white hover:text-gray-200 active:scale-95 transition-transform"><Icon icon="fluent:text-bullet-list-24-filled" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                        <button className="text-white hover:text-gray-200 active:scale-95 transition-transform"><Icon icon="ph:squares-four-fill" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                        <button className="text-white hover:text-gray-200 active:scale-95 transition-transform"><Icon icon="clarity:image-gallery-solid" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    </div>

                    {/* Center Playback Controls */}
                    <div className="flex items-center gap-[2.5cqw]">
                        <button onClick={() => onPageClick && onPageClick(0)} className="text-white/80 hover:text-white active:scale-95 transition-all"><Icon icon="ph:skip-back" className="w-[1.5cqw] h-[1.5cqw]" /></button>
                        <button className="text-white hover:text-gray-200 active:scale-95 transition-all"><Icon icon="ph:play-fill" className="w-[1.8cqw] h-[1.8cqw]" /></button>
                        <button onClick={() => onPageClick && onPageClick(pagesCount - 1)} className="text-white/80 hover:text-white active:scale-95 transition-all"><Icon icon="ph:skip-forward" className="w-[1.5cqw] h-[1.5cqw]" /></button>
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-[2.5cqw]">
                        {(settings?.media?.backgroundAudio ?? true) && (
                            <button className="text-white hover:text-gray-200 active:scale-95 transition-transform"><Icon icon="solar:music-notes-bold" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                        )}
                        <button className="text-white hover:text-gray-200 active:scale-95 transition-transform"><Icon icon="fluent:person-24-filled" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                        <button className="text-white hover:text-gray-200 active:scale-95 transition-transform"><Icon icon="mage:share-fill" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                        <button className="text-white hover:text-gray-200 active:scale-95 transition-transform"><Icon icon="meteor-icons:download" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                        <button className="text-white hover:text-gray-200 active:scale-95 transition-transform"><Icon icon="lucide:fullscreen" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    </div>
                </div>

                {/* Progress Bar (Full Width Bottom) */}
                <div className="w-full relative flex items-center cursor-pointer h-[2cqw] group" ref={progressRef} onClick={handleProgressClick}>
                    <div className="w-full h-[0.25cqw] bg-white/30 rounded-full overflow-hidden relative">
                        <div className="absolute left-0 top-0 h-full bg-white transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TabletLayout8;
