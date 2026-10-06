import { useState } from 'react';
import { Icon } from '@iconify/react';

/**
 * Floating bottom-right widget for navigating between template pages / spreads.
 */
export const PageNavigationControls = ({
  pages = [],
  activePageIndex,
  setActivePageIndex,
  handlePrevPage,
  handleNextPage
}) => {
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInputVal, setPageInputVal] = useState('');

  if (!pages || pages.length === 0) return null;

  return (
    <div className="absolute bottom-[1vw] right-[1vw] z-40 select-none">
      <div className="bg-white border border-gray-200 shadow-sm rounded-full px-[1.1vw] py-[0.5vw] flex items-center gap-[0.8vw]">
        {/* Left Arrow Button */}
        <button
          disabled={activePageIndex === 0}
          onClick={handlePrevPage}
          className={`flex items-center justify-center transition-all duration-200 group ${activePageIndex === 0
            ? 'opacity-25 cursor-not-allowed'
            : 'cursor-pointer hover:scale-110 active:scale-95'
            }`}
          title="Previous Page"
        >
          <Icon icon="ion:caret-up" width="1.4vw" height="1.4vw" className="text-[#6B7280] group-hover:text-[#111827] rotate-[-90deg]" />
        </button>

        {/* Center Page Number Input & Total */}
        <div className="flex items-center text-[#4B5563] text-[0.85vw] font-medium tracking-wide">
          <input
            type="text"
            className="text-center bg-transparent border-b border-transparent hover:border-gray-300 outline-none text-[#111827] font-semibold text-[0.85vw] p-0 transition-all cursor-text select-all"
            style={{
              width: `${Math.max(1.1, String(isEditingPage ? pageInputVal : (activePageIndex + 1)).length * 0.62)}vw`
            }}
            value={isEditingPage ? pageInputVal : (activePageIndex + 1)}
            onFocus={(e) => {
              setIsEditingPage(true);
              setPageInputVal((activePageIndex + 1).toString());
              e.target.select();
            }}
            onBlur={() => {
              setIsEditingPage(false);
              const parsed = parseInt(pageInputVal, 10);
              if (!isNaN(parsed) && parsed >= 1 && parsed <= pages.length) {
                const targetIdx = parsed - 1;
                if (targetIdx !== activePageIndex && typeof setActivePageIndex === 'function') {
                  setActivePageIndex(targetIdx);
                }
              }
            }}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setPageInputVal(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              } else if (e.key === 'Escape') {
                setIsEditingPage(false);
              }
            }}
          />
          <span className="text-[#6B7280] font-normal mx-[0.25vw]">/</span>
          <span className="text-[#4B5563] font-medium">{pages.length}</span>
        </div>

        {/* Right Arrow Button */}
        <button
          disabled={activePageIndex + 1 >= pages.length}
          onClick={handleNextPage}
          className={`flex items-center justify-center transition-all duration-200 group ${activePageIndex + 1 >= pages.length ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
          title="Next Page"
        >
          <Icon icon="ion:caret-up" width="1.4vw" height="1.4vw" className="text-[#6B7280] group-hover:text-[#111827] rotate-[90deg]" />
        </button>
      </div>
    </div>
  );
};

export default PageNavigationControls;
