import React from 'react';
import { Icon } from '@iconify/react';
import TopToolbar from './TopToolbar';

const MainEditor = () => {
  return (
    <div 
      className="bg-white flex-1 flex flex-col overflow-hidden h-[92vh]"
    >
      <TopToolbar />
      <div className="flex-1 relative flex items-center justify-center p-[2vw] overflow-hidden">
        
        {/* Top Group: Selection & Primary Tools - Independent Position */}
        <div className="absolute right-[0.9vw] top-[1.9vh] z-50">
          <div className="bg-[#F1F3F4] rounded-[0.5vw] border border-gray-300 p-[0.3vw] flex flex-col items-center w-[2.7vw] gap-[0.7vh] shadow-sm">
            {/* Black Edit Icon Button */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer bg-[#000000] rounded-[0.4vw] flex items-center justify-center transition-all my-[0.1vh]">
              <Icon icon="tabler:edit" width="1.1vw" height="1.1vw" className="text-white" />
            </button>
            
            {/* Hand / Pan Tool */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer hover:bg-white rounded-[0.4vw] flex items-center justify-center text-[#9EA1A7] hover:text-[#111827] transition-all">
              <Icon icon="hugeicons:touch-interaction-01" width="1.2vw" height="1.2vw" />
            </button>
            
            {/* Star / Special Tool */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer hover:bg-white rounded-[0.4vw] flex items-center justify-center text-[#9EA1A7] hover:text-[#111827] transition-all mb-[0.2vh]">
              <Icon icon="tdesign:animation-1" width="1.2vw" height="1.2vw" />
            </button>
          </div>
        </div>

        {/* Bottom Group: Creation & Widgets - Perfected Integrated Design */}
        <div className="absolute right-0 top-[20vh] z-50">
          <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">
            
            {/* Perfect Inverted Corner Top */}
            <div className="absolute -top-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] border-gray-300 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4"/>
                <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#D1D5DB" strokeWidth="2.5"/>
              </svg>
            </div>

            {/* Perfect Inverted Corner Bottom */}
            <div className="absolute -bottom-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4"/>
                <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#D1D5DB" strokeWidth="2.5"/>
              </svg>
            </div>

            {/* White Upload Button - matching top group size */}
            <div className="pt-[0.1vh] mb-[0.8vh] flex items-center justify-start group gap-[0.3vw]">
              <button className="w-[2.1vw] h-[2.1vw] bg-[#FFFFFF] rounded-[0.4vw] flex items-center justify-center border border-gray-200/50 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <Icon icon="solar:upload-linear" className="text-[#111827] w-[1.1vw] h-[1.1vw]" strokeWidth={3} />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>

            {/* Select Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer">
              <button className="w-[2.1vw] h-[2.1vw] flex items-center justify-center hover:bg-[#FFFFFF] rounded-[0.4vw] transition-all cursor-pointer">
                <Icon icon="solar:cursor-linear" className="w-[1.2vw] h-[1.2vw] text-[#111827]" />
              </button>
              <div className="w-[0.7vw] flex justify-center">
                <Icon icon="lucide:chevron-down" className="w-[0.7vw] h-[0.7vw] text-[#4B5563] opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Pen Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer">
              <button className="w-[2.1vw] h-[2.1vw] flex items-center justify-center hover:bg-[#FFFFFF] rounded-[0.4vw] transition-all cursor-pointer">
                <Icon icon="solar:pen-2-linear" className="w-[1.2vw] h-[1.2vw] text-[#111827]" />
              </button>
              <div className="w-[0.7vw] flex justify-center">
                <Icon icon="lucide:chevron-down" className="w-[0.7vw] h-[0.7vw] text-[#4B5563] opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Type Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer">
              <button className="w-[2.1vw] h-[2.1vw] flex items-center justify-center hover:bg-[#FFFFFF] rounded-[0.4vw] transition-all cursor-pointer">
                <Icon icon="solar:text-bold-duotone" className="w-[1.2vw] h-[1.2vw] text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>

            {/* Shapes Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer">
              <button className="w-[2.1vw] h-[2.1vw] flex items-center justify-center hover:bg-[#FFFFFF] rounded-[0.4vw] transition-all cursor-pointer">
                <Icon icon="solar:widget-3-linear" className="w-[1.2vw] h-[1.2vw] text-[#111827]" />
              </button>
              <div className="w-[0.7vw] flex justify-center">
                <Icon icon="lucide:chevron-down" className="w-[0.7vw] h-[0.7vw] text-[#4B5563] opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Grid Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] cursor-pointer">
              <button className="w-[2.1vw] h-[2.1vw] flex items-center justify-center hover:bg-[#FFFFFF] rounded-[0.4vw] transition-all cursor-pointer">
                <Icon icon="solar:grid-2-linear" className="w-[1.2vw] h-[1.2vw] text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>
          </div>
        </div>

        {/* Canvas Area container */}
        <div className="w-full h-full flex items-center justify-center overflow-auto">
            {/* The canvas content will be centered here */}
        </div>
      </div>
    </div>
  );
};

export default MainEditor;
