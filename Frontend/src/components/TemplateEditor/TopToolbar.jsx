import React, { useState, useEffect, useRef } from 'react';
import { Undo2, Redo2, RotateCcw, Plus, Minus } from 'lucide-react';
import { Icon } from '@iconify/react';

const TopToolbar = ({ zoom, onZoomIn, onZoomOut, onReset }) => {
  const [showRotationOptions, setShowRotationOptions] = useState(false);
  const rotationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rotationRef.current && !rotationRef.current.contains(event.target)) {
        setShowRotationOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="relative" ref={rotationRef}>
          <div 
            onClick={() => setShowRotationOptions(!showRotationOptions)}
            className={`flex items-center bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw] cursor-pointer transition-all ${showRotationOptions ? 'ring-1 ring-gray-300 shadow-sm' : ''}`}
          >
            <div className={`p-[0.4vw] rounded-[0.4vw] transition-all ${showRotationOptions ? 'bg-white shadow-sm text-black' : 'hover:bg-white text-[#374151] hover:text-black'}`}>
              <Icon icon="icon-park-outline:rotate" width="1.1vw" height="1.1vw" />
            </div>
          </div>

          {/* Rotation Options Dropdown */}
          {showRotationOptions && (
            <div className="absolute right-0 top-[3.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.8vw] flex items-center gap-[0.8vw] shadow-lg z-[100] border border-gray-200/50">
              {/* Rotate Tool With Degree */}
              <div className="flex items-center bg-white px-[0.6vw] py-[0.3vw] rounded-[0.6vw] gap-[0.6vw] shadow-sm">
                <Icon icon="icon-park-outline:rotate" width="1vw" height="1vw" className="text-black" />
                <div className="flex items-baseline">
                  <span className="text-[0.85vw] font-semibold text-black">90</span>
                  <span className="text-[0.55vw] font-semibold text-black translate-y-[-0.2vw]">°</span>
                </div>
              </div>

              {/* Flip Horizontal */}
              <div className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-[0.6vw] cursor-pointer transition-all hover:shadow-sm group">
                <Icon icon="vaadin:flip-h" width="1.1vw" height="1.1vw" className="text-[#374151] group-hover:text-black" />
              </div>

              {/* Flip Vertical */}
              <div className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-[0.6vw] cursor-pointer transition-all hover:shadow-sm group">
                <Icon icon="vaadin:flip-v" width="1.1vw" height="1.1vw" className="text-[#374151] group-hover:text-black" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw] gap-[0.1vw]">
          {/* Zoom Out */}
          <button 
            onClick={onZoomOut}
            className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm text-[#374151] hover:text-black group"
          >
            <Minus size="0.9vw" strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Zoom Label */}
          <div className="px-[0.4vw] flex items-center justify-center min-w-[2.2vw]">
            <span className="text-[0.7vw] font-bold text-[#111827]">{zoom}%</span>
          </div>
          
          {/* Zoom In */}
          <button 
            onClick={onZoomIn}
            className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm text-[#374151] hover:text-black group"
          >
            <Plus size="0.9vw" strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Vertical Divider */}
          <div className="w-[1px] h-[1vw] bg-gray-300 mx-[0.3vw]"></div>
          
          {/* Reset Action */}
          <button 
            onClick={onReset}
            className="h-[1.9vw] px-[0.7vw] flex items-center justify-center hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm group"
          >
            <span className="text-[0.55vw] text-[#6B7280] uppercase font-bold tracking-wider group-hover:text-black transition-colors">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;
