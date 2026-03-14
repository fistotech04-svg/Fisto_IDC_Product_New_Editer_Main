import React from 'react';
import { Undo2, Redo2, RotateCcw, Plus, Minus } from 'lucide-react';
import { Icon } from '@iconify/react';

const TopToolbar = () => {
  return (
    <div 
      className="bg-[#FFFFFF] border-b border-[#EEEEEE] flex items-center justify-between px-[1.5vw] flex-shrink-0 select-none"
      style={{ height: '7vh', width: '100%' }}
    >
      {/* Left Section: History */}
      <div className="flex items-center gap-[1.5vw]">
        <div className="flex flex-col items-center group cursor-pointer">
          <Undo2 size="1.2vw" className="text-[#374151] group-hover:text-black transition-colors" />
          <span className="text-[0.6vw] text-[#6B7280] font-medium group-hover:text-black">Undo</span>
        </div>
        <div className="flex flex-col items-center group cursor-pointer">
          <Redo2 size="1.2vw" className="text-[#374151] group-hover:text-black transition-colors" />
          <span className="text-[0.6vw] text-[#6B7280] font-medium group-hover:text-black">Redo</span>
        </div>
      </div>

      {/* Center Section: Alignment Groups */}
      <div className="flex items-center gap-[1vw]">
        {/* Group 1 */}
        <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="mdi:format-align-top" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="mdi:format-align-middle" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] bg-white rounded-[0.4vw] cursor-pointer shadow-sm">
            <Icon icon="mdi:format-align-bottom" width="1.1vw" className="text-[#374151]" />
          </div>
        </div>

        {/* Group 2 */}
        <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="line-md:arrow-align-left" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="line-md:arrow-align-center" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="line-md:arrow-align-right" width="1.1vw" className="text-[#374151]" />
          </div>
        </div>

        {/* Group 3 */}
        <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="icon-park-outline:distribute-vertically" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="icon-park-outline:distribute-horizontally" width="1.1vw" className="text-[#374151]" />
          </div>
        </div>
      </div>

      {/* Right Section: Zoom & Extra */}
      <div className="flex items-center gap-[1vw]">
        <div className="p-[0.5vw] bg-[#F3F4F6] hover:bg-white rounded-[0.6vw] cursor-pointer transition-all hover:shadow-sm text-[#374151] hover:text-black">
          <Icon icon="icon-park-outline:rotate" width="1.1vw" height="1.1vw" />
        </div>

        <div className="flex items-center bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw] gap-[0.8vw] px-[0.6vw]">
          <button className="text-[#4B5563] hover:text-black transition-colors">
            <Minus size="0.9vw" strokeWidth={3} />
          </button>
          <span className="text-[0.75vw] font-bold text-[#111827] min-w-[1.5vw] text-center">1x</span>
          <button className="text-[#4B5563] hover:text-black transition-colors">
            <Plus size="0.9vw" strokeWidth={3} />
          </button>
          <button className="bg-white px-[0.6vw] py-[0.3vh] rounded-[0.4vw] text-[0.65vw] font-bold text-[#374151] shadow-sm hover:bg-gray-50 transition-colors">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;
