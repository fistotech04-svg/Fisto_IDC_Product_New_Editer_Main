import React from 'react';
import { 
  ArrowLeft, ChevronDown, ChevronUp, 
  ChevronLeft, ChevronRight, FilePlus, ArrowUpRight, 
  Undo2, Redo2, Layers
} from 'lucide-react';
import { Icon } from '@iconify/react';

/**
 * EditorSkeletonLoader
 * True skeleton loading UI adhering to the exact editor layout:
 * - Content elements (titles, page names, coordinates, text lines, swatches) are rendered as clean animated shimmer/pulse placeholder bars and blocks.
 * - Structure, toolbars, alignment groups, palettes, and inspectors strictly mirror the real editor UI.
 */
const EditorSkeletonLoader = () => {
  return (
    <div className="absolute inset-0 z-[9999] flex h-full w-full bg-[#FAFAFC] overflow-hidden select-none font-sans">
      
      {/* ══════════════════════════════════════════════════════════════════
          1. LEFT SIDEBAR (Width: 16vw / ~240px-300px)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="w-[16vw] min-w-[230px] max-w-[300px] h-full bg-white border-r border-[#EEEEEE] flex flex-col px-[0.8vw] pb-[1.5vh] shrink-0 z-20">
        
        {/* Header: Title Placeholder Input + Back Arrow */}
        <div className="flex items-center justify-between px-[0.2vw] flex-shrink-0" style={{ height: '8vh', gap: '0.8vw' }}>
          <div className="flex-1 min-w-0 flex items-center bg-[#F1F3F4] px-[0.6vw] py-[0.7vh] rounded-[0.5vw]">
            <div className="w-[5.5vw] h-[1.2vh] bg-gray-300 rounded-[0.3vw] animate-pulse" />
          </div>
          <div className="text-[#374151] p-[0.4vw] rounded-full flex items-center justify-center opacity-70">
            <ArrowLeft size="1.2vw" strokeWidth={2.5} />
          </div>
        </div>

        {/* Tabs: Pages (Active) & Layers */}
        <div className="flex bg-[#F1F3F4] p-[0.35vw] rounded-[0.8vw] mb-[1.5vh] gap-[0.4vw] flex-shrink-0">
          <div className="flex-1 py-[0.7vh] rounded-[0.6vw] flex items-center justify-center bg-white shadow-xs">
            <div className="w-[3.2vw] h-[1.2vh] bg-gray-400 rounded-[0.3vw] animate-pulse" />
          </div>
          <div className="flex-1 py-[0.7vh] rounded-[0.6vw] flex items-center justify-center">
            <div className="w-[3.2vw] h-[1.2vh] bg-gray-300 rounded-[0.3vw] animate-pulse" />
          </div>
        </div>

        {/* Page Cards List */}
        <div className="flex-1 flex flex-col gap-[1vh] overflow-y-auto no-scrollbar pr-[0.1vw]">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
            <div 
              key={page}
              className="rounded-[0.6vw] border border-gray-200 bg-[#F4F5F7] flex items-center justify-between px-[0.8vw] py-[1.2vh] shadow-xs shrink-0"
            >
              <div className="w-[3.8vw] h-[1.3vh] bg-gray-300 rounded-[0.3vw] animate-pulse" />
              <div className="flex items-center gap-[0.5vw]">
                <div className="w-[1vw] h-[1vw] rounded bg-gray-300 animate-pulse" />
                <div className="w-[0.4vw] h-[1vw] rounded bg-gray-300 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-[1vh] bg-white flex flex-col gap-[0.9vh] flex-shrink-0">
          <div className="w-full bg-white border border-gray-200 py-[1.1vh] rounded-[0.6vw] flex items-center justify-center gap-[0.6vw] shadow-xs">
            <FilePlus size="1vw" className="text-gray-400" />
            <div className="w-[4.5vw] h-[1.2vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
          </div>
          <div className="w-full bg-black py-[1.1vh] rounded-[0.6vw] flex items-center justify-center gap-[0.8vw] shadow-md">
            <ArrowUpRight size="1.1vw" className="text-white/80" />
            <div className="w-[6vw] h-[1.2vh] bg-white/40 rounded-[0.2vw] animate-pulse" />
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. CENTER AREA: TOP TOOLBAR + CANVAS
         ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden bg-[#F8F9FA] min-w-0">
        
        {/* Top Toolbar (Height: 7vh) */}
        <div 
          className="bg-white border-b border-[#EEEEEE] flex items-center justify-between px-[1.5vw] flex-shrink-0"
          style={{ height: '7vh', width: '100%' }}
        >
          {/* Left: Undo & Redo */}
          <div className="flex items-center gap-[1.2vw]">
            <Undo2 size="1.2vw" className="text-gray-400" />
            <Redo2 size="1.2vw" className="text-gray-400" />
          </div>

          {/* Center: 4 Alignment Groups */}
          <div className="flex items-center gap-[0.8vw]">
            {/* Group 1: Vertical Alignment */}
            <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.25vw] rounded-[0.6vw]">
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="mdi:format-align-top" width="1.1vw" className="text-gray-400" />
              </div>
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="mdi:format-align-middle" width="1.1vw" className="text-gray-400" />
              </div>
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="mdi:format-align-bottom" width="1.1vw" className="text-gray-400" />
              </div>
            </div>

            {/* Group 2: Horizontal Alignment */}
            <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.25vw] rounded-[0.6vw]">
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="line-md:arrow-align-left" width="1.1vw" className="text-gray-400" />
              </div>
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="line-md:arrow-align-center" width="1.1vw" className="text-gray-400" />
              </div>
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="line-md:arrow-align-right" width="1.1vw" className="text-gray-400" />
              </div>
            </div>

            {/* Group 3: Distribute */}
            <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.25vw] rounded-[0.6vw]">
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="icon-park-outline:distribute-vertically" width="1.1vw" className="text-gray-400" />
              </div>
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="icon-park-outline:distribute-horizontally" width="1.1vw" className="text-gray-400" />
              </div>
            </div>

            {/* Group 4: Flip */}
            <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.25vw] rounded-[0.6vw]">
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="vaadin:flip-h" width="1.1vw" height="1.1vw" className="text-gray-400" />
              </div>
              <div className="p-[0.35vw] rounded-[0.4vw]">
                <Icon icon="vaadin:flip-v" width="1.1vw" height="1.1vw" className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Right: Rotate + Zoom Pill */}
          <div className="flex items-center gap-[0.8vw]">
            {/* Rotate Button */}
            <div className="bg-[#F3F4F6] p-[0.25vw] rounded-[0.6vw]">
              <div className="p-[0.35vw] rounded-[0.4vw] text-gray-400">
                <Icon icon="icon-park-outline:rotate" width="1.1vw" height="1.1vw" />
              </div>
            </div>

            {/* Zoom Pill */}
            <div className="flex items-center bg-[#F3F4F6] px-[0.5vw] py-[0.35vw] rounded-full gap-[0.4vw]">
              <span className="text-[0.9vw] font-bold text-gray-400 px-[0.2vw]">-</span>
              <div className="w-[2.2vw] h-[1.1vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
              <span className="text-[0.9vw] font-bold text-gray-400 px-[0.2vw]">+</span>
              <Icon icon="tabler:rotate-rectangle" width="0.95vw" height="0.95vw" className="text-gray-400 ml-[0.2vw]" />
            </div>
          </div>
        </div>

        {/* Main Canvas Workspace */}
        <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden bg-[#FAFAFC]">
          
          {/* Horizontal Ruler Bar */}
          <div className="absolute top-0 left-0 right-0 h-[1.8vh] border-b border-gray-200/80 bg-white/70 flex items-center px-[2vw] text-[0.55vw] text-gray-400 gap-[2.5vw] overflow-hidden pointer-events-none z-10">
            <span>-100</span>
            <span>-50</span>
            <span>0</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>250</span>
            <span>300</span>
            <span>350</span>
            <span>400</span>
            <span>450</span>
            <span>500</span>
            <span>550</span>
          </div>

          {/* Vertical Ruler Bar */}
          <div className="absolute top-0 bottom-0 left-0 w-[1.5vw] border-r border-gray-200/80 bg-white/70 flex flex-col items-center pt-[2vh] text-[0.55vw] text-gray-400 gap-[3.5vh] overflow-hidden pointer-events-none z-10">
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>250</span>
            <span>300</span>
            <span>350</span>
            <span>400</span>
          </div>

          {/* Left Floating Tool Palette */}
          <div className="absolute left-[2vw] top-[4vh] bg-white border border-gray-200/90 rounded-[0.8vw] shadow-md p-[0.35vw] flex flex-col items-center gap-[0.8vh] z-20">
            <div className="w-[2vw] h-[2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="fluent:shapes-24-filled" width="1.2vw" height="1.2vw" />
            </div>
            <div className="w-[2vw] h-[2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="lucide:square" width="1.1vw" height="1.1vw" />
            </div>
            <div className="w-[2vw] h-[2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="solar:palette-bold" width="1.2vw" height="1.2vw" />
            </div>
            <div className="w-[2vw] h-[2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="tabler:icons" width="1.2vw" height="1.2vw" />
            </div>
          </div>

          {/* Right Floating Quick Action / Vector Tools */}
          {/* Top Quick Actions */}
          <div className="absolute right-[1.5vw] top-[3vh] bg-[#F1F3F4] border border-gray-200 rounded-[0.6vw] p-[0.25vw] flex flex-col items-center gap-[0.4vh] shadow-sm z-20">
            <div className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-gray-800 text-white flex items-center justify-center shadow-xs">
              <Icon icon="lucide:pen-line" width="1.1vw" height="1.1vw" />
            </div>
            <div className="w-[2vw] h-[2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="lucide:wand-2" width="1.1vw" height="1.1vw" />
            </div>
            <div className="w-[2vw] h-[2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="lucide:star" width="1.1vw" height="1.1vw" />
            </div>
          </div>

          {/* Main Vector Tool Palette (Right) */}
          <div className="absolute right-[1.5vw] top-[18vh] bg-[#F1F3F4] border border-gray-200 rounded-[0.8vw] p-[0.3vw] flex flex-col items-center gap-[0.8vh] shadow-sm z-20">
            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="lucide:upload" width="1.1vw" height="1.1vw" />
            </div>
            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.4vw] bg-white flex items-center justify-center text-gray-600 shadow-xs">
              <Icon icon="solar:cursor-bold" width="1.1vw" height="1.1vw" />
            </div>
            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="streamline-cyber:pen-tool" width="1.1vw" height="1.1vw" />
            </div>
            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="mi:text" width="1.2vw" height="1.2vw" />
            </div>
            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="lucide:square" width="1.1vw" height="1.1vw" />
            </div>
            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="fluent:shapes-24-filled" width="1.1vw" height="1.1vw" />
            </div>
            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.4vw] flex items-center justify-center text-gray-400">
              <Icon icon="tabler:icons" width="1.1vw" height="1.1vw" />
            </div>
          </div>

          {/* Centered White Book Canvas Sheet */}
          <div className="relative w-[28vw] min-w-[340px] max-w-[480px] aspect-[1/1.414] bg-white rounded-[0.2vw] shadow-[0_10px_35px_rgba(0,0,0,0.08)] border border-gray-200/90 flex flex-col justify-between p-[3vw] overflow-hidden">
            {/* Shimmer sweep animation across the page */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent pointer-events-none" />

            {/* Top Skeleton Text Lines */}
            <div className="flex flex-col items-center justify-center gap-[0.8vh] mt-[8vh]">
              <div className="w-[50%] h-[1.4vh] bg-gray-200 rounded-[0.3vw] animate-pulse" />
              <div className="w-[30%] h-[1vh] bg-gray-100 rounded-[0.2vw] animate-pulse" />
            </div>

            {/* Bottom Skeleton Text Lines */}
            <div className="flex flex-col items-center justify-center gap-[0.8vh] mb-[8vh]">
              <div className="w-[45%] h-[1.4vh] bg-gray-200 rounded-[0.3vw] animate-pulse" />
              <div className="w-[60%] h-[1vh] bg-gray-100 rounded-[0.2vw] animate-pulse" />
            </div>

            {/* Centered Loading Spinner Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/50 backdrop-blur-[1px] z-20">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 border-[3.5px] border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
              </div>
              <div className="flex flex-col items-center gap-0.5 bg-white/95 px-4 py-1.5 rounded-full shadow-md border border-gray-100">
                <span className="text-[0.78vw] font-semibold text-gray-800 tracking-wide">Loading Editor...</span>
                <span className="text-[0.62vw] text-gray-400 font-normal">Preparing canvas and book assets</span>
              </div>
            </div>
          </div>

          {/* Bottom-Right Page Navigation Pill */}
          <div className="absolute bottom-[2vh] right-[14vw] bg-white border border-gray-200 rounded-full px-[0.8vw] py-[0.4vh] flex items-center gap-[0.8vw] shadow-md z-20">
            <ChevronLeft size="1vw" className="text-gray-400" />
            <div className="w-[2.2vw] h-[1.2vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
            <ChevronRight size="1vw" className="text-gray-400" />
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. RIGHT PROPERTIES SIDEBAR (Width: 20vw / ~280px-340px)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="w-[20vw] min-w-[270px] max-w-[340px] h-full bg-[#FAFAFC] border-l border-[#EEEEEE] flex flex-col p-[1.2vw] gap-[1.4vh] overflow-y-auto no-scrollbar shrink-0 z-20">
        
        {/* Top Coordinate Rows: Position & Resizing */}
        <div className="flex flex-col gap-[1vh] pb-[0.5vh]">
          {/* Position Row */}
          <div className="flex items-center justify-between">
            <div className="w-[4.2vw] h-[1.3vh] bg-gray-400 rounded-[0.2vw] animate-pulse" />
            <div className="flex items-center gap-[0.8vw]">
              {/* X Input Box */}
              <div className="flex items-center gap-[0.15vw]">
                <ChevronLeft size="0.75vw" className="text-gray-400" />
                <div className="w-[3.8vw] h-[1.7vw] border border-gray-300 rounded-[0.4vw] bg-white flex items-center px-[0.4vw] shadow-2xs">
                  <span className="text-gray-400 font-medium text-[0.75vw] mr-[0.2vw]">X</span>
                  <div className="w-[1.2vw] h-[1vh] bg-gray-300 rounded-[0.2vw] mx-auto animate-pulse" />
                </div>
                <ChevronRight size="0.75vw" className="text-gray-400" />
              </div>
              {/* Y Input Box */}
              <div className="flex items-center gap-[0.15vw]">
                <ChevronLeft size="0.75vw" className="text-gray-400" />
                <div className="w-[3.8vw] h-[1.7vw] border border-gray-300 rounded-[0.4vw] bg-white flex items-center px-[0.4vw] shadow-2xs">
                  <span className="text-gray-400 font-medium text-[0.75vw] mr-[0.2vw]">Y</span>
                  <div className="w-[1.2vw] h-[1vh] bg-gray-300 rounded-[0.2vw] mx-auto animate-pulse" />
                </div>
                <ChevronRight size="0.75vw" className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Resizing Row */}
          <div className="flex items-center justify-between">
            <div className="w-[4.2vw] h-[1.3vh] bg-gray-400 rounded-[0.2vw] animate-pulse" />
            <div className="flex items-center gap-[0.8vw]">
              {/* W Input Box */}
              <div className="flex items-center gap-[0.15vw]">
                <ChevronLeft size="0.75vw" className="text-gray-400" />
                <div className="w-[3.8vw] h-[1.7vw] border border-gray-300 rounded-[0.4vw] bg-white flex items-center px-[0.4vw] shadow-2xs">
                  <span className="text-gray-400 font-medium text-[0.75vw] mr-[0.2vw]">W</span>
                  <div className="w-[1.6vw] h-[1vh] bg-gray-300 rounded-[0.2vw] mx-auto animate-pulse" />
                </div>
                <ChevronRight size="0.75vw" className="text-gray-400" />
              </div>
              {/* H Input Box */}
              <div className="flex items-center gap-[0.15vw]">
                <ChevronLeft size="0.75vw" className="text-gray-400" />
                <div className="w-[3.8vw] h-[1.7vw] border border-gray-300 rounded-[0.4vw] bg-white flex items-center px-[0.4vw] shadow-2xs">
                  <span className="text-gray-400 font-medium text-[0.75vw] mr-[0.2vw]">H</span>
                  <div className="w-[1.6vw] h-[1vh] bg-gray-300 rounded-[0.2vw] mx-auto animate-pulse" />
                </div>
                <ChevronRight size="0.75vw" className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Section */}
        <div className="space-y-[0.6vw]">
          <div className="flex items-center gap-[0.5vw]">
            <div className="w-[5.5vw] h-[1.3vh] bg-gray-400 rounded-[0.2vw] animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-[0.5vw]">
            <div className="py-[0.7vh] px-[0.6vw] bg-white border border-gray-200 rounded-[0.5vw] flex items-center justify-center shadow-xs">
              <div className="w-[3.5vw] h-[1.1vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
            </div>
            <div className="py-[0.7vh] px-[0.6vw] bg-white border border-gray-200 rounded-[0.5vw] flex items-center justify-center shadow-xs">
              <div className="w-[5vw] h-[1.1vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
            </div>
          </div>
          <div className="w-full py-[0.7vh] px-[0.6vw] bg-white border border-gray-200 rounded-[0.5vw] flex items-center justify-center shadow-xs">
            <div className="w-[5.5vw] h-[1.1vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center gap-[0.8vw] py-[0.4vh] mt-[0.3vh]">
          <div className="w-[3.8vw] h-[1.3vh] bg-gray-400 rounded-[0.2vw] animate-pulse" />
          <div className="flex-1 flex items-center h-[1.5vw] relative">
            <div className="w-full h-[0.2vw] rounded-full bg-gray-200 relative overflow-hidden">
              <div className="h-full bg-indigo-300 rounded-full w-[65%] animate-pulse" />
            </div>
          </div>
          <div className="min-w-[3.2vw] h-[1.8vw] border border-gray-200 rounded-[0.3vw] flex items-center justify-center bg-white shadow-2xs">
            <div className="w-[1.8vw] h-[1vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
          </div>
        </div>

        {/* Colors in this Group Card */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-[0.8vw] py-[1vh] border-b border-gray-100">
            <div className="w-[7.5vw] h-[1.3vh] bg-gray-400 rounded-[0.2vw] animate-pulse" />
            <ChevronUp size="0.9vw" className="text-gray-400" />
          </div>
          
          <div className="p-[0.8vw] flex flex-col gap-[1vh]">
            {/* Color 1 Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[0.6vw]">
                <div className="w-[1.6vw] h-[1.6vw] rounded-[0.35vw] bg-gray-200 animate-pulse shadow-2xs" />
                <div className="w-[4.2vw] h-[1.1vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
              </div>
              <div className="w-[2vw] h-[1.1vh] bg-gray-200 rounded-[0.2vw] animate-pulse" />
            </div>

            {/* Color 2 Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[0.6vw]">
                <div className="w-[1.6vw] h-[1.6vw] rounded-[0.35vw] bg-gray-200 animate-pulse shadow-2xs" />
                <div className="w-[4.2vw] h-[1.1vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
              </div>
              <div className="w-[2vw] h-[1.1vh] bg-gray-200 rounded-[0.2vw] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Effect Accordion Card */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-[0.8vw] py-[1vh]">
            <div className="w-[3.5vw] h-[1.3vh] bg-gray-400 rounded-[0.2vw] animate-pulse" />
            <ChevronDown size="0.9vw" className="text-gray-400" />
          </div>
        </div>

        {/* Additional Properties Card (Fills lower blank space) */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-[0.8vw] py-[1vh] border-b border-gray-100">
            <div className="w-[5.2vw] h-[1.3vh] bg-gray-400 rounded-[0.2vw] animate-pulse" />
            <ChevronDown size="0.9vw" className="text-gray-400" />
          </div>
          <div className="p-[0.8vw] flex flex-col gap-[0.8vh]">
            <div className="flex items-center justify-between">
              <div className="w-[4vw] h-[1.1vh] bg-gray-300 rounded-[0.2vw] animate-pulse" />
              <div className="w-[2.5vw] h-[1.1vh] bg-gray-200 rounded-[0.2vw] animate-pulse" />
            </div>
            <div className="w-full h-[1.6vh] bg-gray-100 rounded-[0.3vw] animate-pulse" />
          </div>
        </div>

        {/* Extra Alignment / Arrangement Preset Card */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-[0.8vw] py-[1vh]">
            <div className="w-[4.5vw] h-[1.3vh] bg-gray-400 rounded-[0.2vw] animate-pulse" />
            <ChevronDown size="0.9vw" className="text-gray-400" />
          </div>
        </div>

      </div>

    </div>
  );
};

export default EditorSkeletonLoader;

