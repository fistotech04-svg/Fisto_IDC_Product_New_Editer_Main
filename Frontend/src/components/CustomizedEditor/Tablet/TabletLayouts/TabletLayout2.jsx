import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import TabletTableOfContentsPopup from './TabletTableOfContentsPopup';
import TabletLayoutSound from './TabletLayoutSound';
import ShareModal from '../../../ShareModal';

const TabletLayout2 = ({ children, bookRef, currentPage, pages, offset = 0, onPageClick, settings, bookName = "Name of the Book", showSoundPopup, setShowSoundPopupMemo, showProfilePopup, setShowProfilePopupMemo, handleDownload, currentBook, activeLayout }) => {
  const [inputPage, setInputPage] = useState(currentPage === 0 ? 1 : (currentPage || 1));
  const [showTOC, setShowTOC] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    setInputPage(currentPage === 0 ? 1 : (currentPage || 1));
  }, [currentPage]);

  const getLayoutColor = (id, defaultColor) => {
    return `var(--${id}, ${defaultColor})`;
  };

  const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
  };

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

  const totalPages = Array.isArray(pages) ? pages.length : pages || 12;

  // Derive active dot index for pagination (assuming 6 dots total)
  const dotCount = 6;
  const activeDotIndex = Math.min(
    Math.floor(((currentPage || 0) / Math.max(1, totalPages - 1)) * (dotCount - 1)),
    dotCount - 1
  );

  return (
    <div
      className="relative w-full h-full flex flex-col font-sans overflow-hidden "
      style={{ containerType: 'inline-size' }}
    >
      <div id="tablet-download-portal" className="absolute inset-0 z-[60] pointer-events-none"></div>
      {/* Top Bar */}
      <div className="w-full h-[7.5%] flex items-center px-[2cqw] flex-shrink-0 z-20 shadow-sm relative" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#625FA2') }}>
        
        {/* Left: Search Bar */}
        <div className="flex-1 flex justify-start h-full items-center">
          <div className="relative w-[22cqw] h-[55%] rounded-[1.5cqw] flex items-center px-[1cqw]" style={{ backgroundColor: getLayoutColor('search-bg-v2', '#F0F0F5') }}>
            <Icon icon="lucide:search" className="w-[1.4cqw] h-[1.4cqw]" style={{ color: getLayoutColor('search-text-v1', '#625FA2') }} />
            <input
              type="text"
              placeholder="Quick Search..."
              className="bg-transparent border-none outline-none w-full h-full text-[1.2cqw] ml-[0.8cqw] font-medium"
              style={{ color: getLayoutColor('search-text-v1', '#333333') }}
            />
          </div>
        </div>

        {/* Center: Icons */}
        <div className="flex-none flex items-center gap-[2cqw] text-white absolute left-1/2 -translate-x-1/2">
            <button 
              className="hover:text-gray-200 transition-colors"
              onClick={() => {
                setShowSoundPopupMemo?.(false);
                setShowProfilePopupMemo?.(false);
                setShowTOC(!showTOC);
              }}
            >
              <Icon icon="fluent:text-bullet-list-24-filled" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button className="hover:text-gray-200 transition-colors">
              <Icon icon="ph:squares-four-fill" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button className="hover:text-gray-200 transition-colors">
              <Icon icon="clarity:image-gallery-solid" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            {(settings?.media?.backgroundAudio ?? true) && (
              <button 
                className="hover:text-gray-200 transition-colors relative"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTOC(false);
                  setShowProfilePopupMemo?.(false);
                  setShowSoundPopupMemo?.(!showSoundPopup);
                }}
                style={{ opacity: showSoundPopup ? 0.7 : 1 }}
              >
                <Icon icon="solar:music-notes-bold" className="w-[1.6cqw] h-[1.6cqw]" />
              </button>
            )}
            <button className="hover:text-gray-200 transition-colors">
              <Icon icon="ph:play-fill" className="w-[1.8cqw] h-[1.8cqw]" />
            </button>
            <button 
              className="hover:text-gray-200 transition-colors relative"
              onClick={(e) => {
                e.stopPropagation();
                setShowTOC(false);
                setShowSoundPopupMemo?.(false);
                setShowProfilePopupMemo?.(!showProfilePopup);
              }}
              style={{ opacity: showProfilePopup ? 0.7 : 1 }}
            >
              <Icon icon="fluent:person-24-filled" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button 
              className="hover:text-gray-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowTOC(false);
                setShowSoundPopupMemo?.(false);
                setShowProfilePopupMemo?.(false);
                setIsShareOpen(true);
              }}
            >
              <Icon icon="mage:share-fill" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button className="hover:text-gray-200 transition-colors" onClick={() => {
              if (handleDownload) {
                setShowTOC(false);
                setShowSoundPopupMemo?.(false);
                setShowProfilePopupMemo?.(false);
                handleDownload();
              }
            }}>
              <Icon icon="meteor-icons:download" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button className="hover:text-gray-200 transition-colors">
              <Icon icon="lucide:fullscreen" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
        </div>

        {/* Right: Empty spacer */}
        <div className="flex-1"></div>
      </div>

      {showTOC && (
        <TabletTableOfContentsPopup 
            variant="layout2" 
            onClose={() => setShowTOC(false)} 
            onNavigate={onPageClick} 
            settings={settings} 
        />
      )}

      {/* The React Portal targets for popups */}
      <div id="tablet-sound-portal" className="absolute inset-0 z-50 pointer-events-none"></div>
      <div id="tablet-profile-portal" className="absolute inset-0 z-50 pointer-events-none"></div>

      {/* Middle Content Area */}
      <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden">
        
        {/* Left Chevron */}
        <button 
          onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
          className={`absolute left-[3cqw] flex items-center justify-center transition-colors z-10 ${
            (!currentPage || currentPage === 0) 
              ? 'opacity-30' 
              : 'hover:opacity-80'
          }`}
          style={{ color: getLayoutColor('search-text-v1', '#625FA2') }}
        >
          <Icon icon="lucide:chevron-left" className="w-[4cqw] h-[4cqw]" strokeWidth={1.5} />
        </button>

        {/* The Book */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center z-0">
           <div 
              style={{ transform: `translateX(${offset}px)`, transition: 'transform 0.5s ease-out' }} 
              className="flex items-center justify-center w-full h-full"
           >
             {children ? (
               children
             ) : (
               <div className="h-[90%] aspect-[1.4/1] bg-white shadow-[0_1cqw_4cqw_rgba(0,0,0,0.1)] flex flex-col items-center relative overflow-hidden">
                  <div className="w-full h-full absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] pointer-events-none"></div>
                  <div className="w-px h-full bg-black/10 absolute left-1/2 -translate-x-1/2 shadow-[-5px_0_15px_rgba(0,0,0,0.1)]"></div>
               </div>
             )}
           </div>
        </div>

        {/* Right Chevron */}
        <button 
          onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
          className={`absolute right-[3cqw] flex items-center justify-center transition-colors z-10 ${
            (currentPage >= totalPages - 1)
              ? 'opacity-30'
              : 'hover:opacity-80'
          }`}
          style={{ color: getLayoutColor('search-text-v1', '#625FA2') }}
        >
          <Icon icon="lucide:chevron-right" className="w-[4cqw] h-[4cqw]" strokeWidth={1.5} />
        </button>

        {/* Page Indicator Pill (Bottom Right) */}
        <div className="absolute bottom-[3cqw] right-[3cqw] px-[2cqw] py-[0.8cqw] rounded-[0.8cqw] shadow-sm font-bold text-[1.2cqw] flex items-center justify-center z-10" style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), color: getLayoutColor('toolbar-bg', '#625FA2') }}>
          Page 
          <input 
            type="text" 
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={handlePageInputSubmit}
            onBlur={handlePageInputSubmit}
            className="w-[2.5cqw] text-center bg-transparent outline-none mx-[0.2cqw]"
          /> 
          / {totalPages}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full h-[6%] flex items-center justify-between px-[2cqw] flex-shrink-0 z-20" style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', getLayoutColor('toolbar-bg', '#625FA2')) }}>
        
        {/* Left Text */}
        <div className="text-white text-[1.2cqw] font-semibold tracking-wide">
          {bookName}
        </div>

        {/* Center Dots */}
        <div className="flex items-center gap-[0.8cqw] absolute left-1/2 -translate-x-1/2">
          {Array.from({ length: dotCount }).map((_, i) => (
             <div 
                key={i} 
                className={`h-[0.6cqw] rounded-full transition-all duration-300 ${
                  i === activeDotIndex ? 'w-[2cqw] bg-white' : 'w-[0.6cqw] bg-white/40'
                }`}
             ></div>
          ))}
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-[1cqw]">
            <div className="flex items-center gap-[1.2cqw] bg-white/10 px-[1.2cqw] py-[0.5cqw] rounded-[0.5cqw]">
                <button className="text-white/80 hover:text-white transition-colors">
                    <Icon icon="ph:magnifying-glass-minus-bold" className="w-[1.2cqw] h-[1.2cqw]" />
                </button>
                <span className="text-white text-[1.1cqw] font-bold">100%</span>
                <button className="text-white/80 hover:text-white transition-colors">
                    <Icon icon="ph:magnifying-glass-plus-bold" className="w-[1.2cqw] h-[1.2cqw]" />
                </button>
            </div>
            <button className="text-white hover:text-gray-200 transition-colors bg-white/20 px-[1.5cqw] py-[0.5cqw] rounded-[0.5cqw] text-[1.1cqw] font-bold">
                Reset
            </button>
        </div>

      </div>

      <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          isTabletLayout={true}
          currentBook={currentBook || settings}
          activeLayout={activeLayout || '2'}
      />
    </div>
  );
};

export default TabletLayout2;
