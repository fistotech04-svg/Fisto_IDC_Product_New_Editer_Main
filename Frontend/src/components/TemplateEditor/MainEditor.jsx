import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import TopToolbar from './TopToolbar';

const CurveIcon = ({ width, height, className }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path d="M2.5 22.9995C4 17.5007 10.5 26.5 11.5 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M15.6926 4.29545H7.30629M15.6926 4.29545L17.0904 1.5H5.90856L7.30629 4.29545M15.6926 4.29545L18.954 10.8182L11.4995 22L4.04492 10.8182L7.30629 4.29545" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="round"/>
    <path d="M11.5 21.9989V12.2148" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.897 10.8196L11.4993 9.42188L10.1016 10.8196L11.4993 12.2164L12.897 10.8196Z" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="round"/>
  </svg>
);

const MainEditor = ({ isDoublePage }) => {
  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [showShapesOptions, setShowShapesOptions] = useState(false);
  const [selectedSelectTool, setSelectedSelectTool] = useState('select'); // 'select' or 'direct'
  const [selectedPenTool, setSelectedPenTool] = useState('pen'); // 'pen', 'curve', 'pencil'
  const [selectedShapeTool, setSelectedShapeTool] = useState('rectangle'); // 'rectangle', 'circle', 'polygon', 'line', 'star'
  const [activeMainTool, setActiveMainTool] = useState('select'); // 'upload', 'select', 'pen', 'type', 'shapes', 'grid'
  const [zoom, setZoom] = useState(90);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 10));
  const handleResetZoom = () => setZoom(90);

  const closeAllDropdowns = () => {
    setShowSelectOptions(false);
    setShowPenOptions(false);
    setShowShapesOptions(false);
  };


  return (
    <div 
      className="bg-white flex-1 flex flex-col overflow-hidden h-[92vh]"
      onClick={closeAllDropdowns}
    >
      <TopToolbar 
        zoom={zoom} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        onReset={handleResetZoom} 
      />
      <div className="flex-1 relative flex items-center justify-center p-[1vw] overflow-hidden">
        
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

        {/* Top-Left: Animated Lordicon Card - Vertical Column */}
        <div className="absolute left-[0.8vw] top-[0.8vw] z-50">
          <div className="bg-white rounded-[0.5vw] border border-gray-100/50 p-[0.3vw] shadow-sm flex flex-col items-center gap-[0.5vw]">
            {/* Animated Hotspot Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/erxuunyq.json"
                trigger="loop"
                colors="primary:#E88F23"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>

            {/* Animated Notification/Follow Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/kwnsnjyg.json"
                trigger="loop"
                colors="primary:#00ACEE"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>

            {/* Animated Third Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/shquqxad.json"
                trigger="loop"
                delay="2000"
                colors="primary:#9381FF"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>
          </div>
        </div>

        {/* Bottom Group: Creation & Widgets - Perfected Integrated Design */}
        <div className="absolute right-0 top-[20vh] z-50">
          <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">
            
            {/* Perfect Inverted Corner Top */}
            <div className="absolute -top-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] border-gray-300 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4"/>
                <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#acb0b6ff" strokeWidth="3"/>
              </svg>
            </div>

            {/* Perfect Inverted Corner Bottom */}
            <div className="absolute -bottom-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4"/>
                <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#acb0b6ff" strokeWidth="3"/>
              </svg>
            </div>

            {/* White Upload Button - matching top group size */}
            <div className="pt-[0.1vh] mb-[0.8vh] flex items-center justify-start group gap-[0.3vw]">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('upload');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${activeMainTool === 'upload' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="prime:upload" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>

            {/* Select Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Select Tool Options Dropdown */}
              {showSelectOptions && (
                <div className="absolute right-[4.2vw] top-[-1.5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[1vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'select' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSelectTool('select');
                      setShowSelectOptions(false);
                    }}
                  >
                    <Icon icon="clarity:cursor-arrow-line" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'select' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedSelectTool === 'select' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Select</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'direct' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSelectTool('direct');
                      setShowSelectOptions(false);
                    }}
                  >
                    <Icon icon="clarity:cursor-arrow-solid" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'direct' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedSelectTool === 'direct' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Direct</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('select');
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'select' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon 
                  icon={selectedSelectTool === 'select' ? 'clarity:cursor-arrow-line' : 'clarity:cursor-arrow-solid'} 
                  width="1.2vw" 
                  height="1.2vw" 
                  className="text-[#111827]" 
                />
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSelectOptions(!showSelectOptions);
                  setShowPenOptions(false);
                  setShowShapesOptions(false);
                  setActiveMainTool('select');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showSelectOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Pen Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Pen Tool Options Dropdown */}
              {showPenOptions && (
                <div className="absolute right-[4.2vw] top-[-5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[1vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pen' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('pen');
                      setShowPenOptions(false);
                    }}
                  >
                    <Icon icon="streamline-cyber:pen-tool" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pen' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'pen' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Pen</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.3vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'curve' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('curve');
                      setShowPenOptions(false);
                    }}
                  >
                    <CurveIcon width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'curve' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'curve' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Curve</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pencil' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('pencil');
                      setShowPenOptions(false);
                    }}
                  >
                    <Icon icon="mingcute:pencil-fill" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pencil' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'pencil' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Pencil</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('pen');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'pen' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                {selectedPenTool === 'pencil' ? (
                  <Icon icon="mingcute:pencil-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                ) : selectedPenTool === 'curve' ? (
                  <CurveIcon width="1.2vw" height="1.2vw" className="text-[#111827]" />
                ) : (
                  <Icon icon="streamline-cyber:pen-tool" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                )}
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPenOptions(!showPenOptions);
                  setShowSelectOptions(false);
                  setShowShapesOptions(false);
                  setActiveMainTool('pen');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showPenOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Type Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('type');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'type' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="mi:text" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>

            {/* Shapes Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Shapes Tool Options Dropdown */}
              {showShapesOptions && (
                <div className="absolute right-[4.2vw] top-[-12vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.8vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'rectangle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('rectangle');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:square" width="1vw" height="1vw" className={`${selectedShapeTool === 'rectangle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'rectangle' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Rectangle</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'circle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('circle');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:circle" width="1vw" height="1vw" className={`${selectedShapeTool === 'circle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'circle' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Circle</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'polygon' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('polygon');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:triangle" width="1vw" height="1vw" className={`${selectedShapeTool === 'polygon' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'polygon' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Polygon</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'line' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('line');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="tabler:line" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'line' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827] rotate-[-45deg]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'line' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Line</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'star' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('star');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:star" width="1vw" height="1vw" className={`${selectedShapeTool === 'star' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'star' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Star</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('shapes');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'shapes' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon 
                  icon={
                    selectedShapeTool === 'rectangle' ? 'lucide:square' : 
                    selectedShapeTool === 'circle' ? 'lucide:circle' : 
                    selectedShapeTool === 'polygon' ? 'lucide:triangle' : 
                    selectedShapeTool === 'line' ? 'tabler:line' : 'lucide:star'
                  } 
                  width="1.2vw" 
                  height="1.2vw" 
                  className={`text-[#111827] ${selectedShapeTool === 'line' ? 'rotate-[-45deg]' : ''}`} 
                />
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShapesOptions(!showShapesOptions);
                  setShowSelectOptions(false);
                  setShowPenOptions(false);
                  setActiveMainTool('shapes');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showShapesOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Grid Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] cursor-pointer">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('grid');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'grid' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="tabler:icons" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>
          </div>
        </div>

        {/* Canvas Area container */}
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-white">
          {/* Left Navigation-Button - Positioned relative to visual edge */}
          <button 
            className="absolute rounded-full hover:bg-black/5 transition-all duration-300 group z-20 shrink-0 flex items-center justify-center w-[2.2vw] h-[2.2vw] hover:w-[3.2vw] hover:h-[3.2vw]"
            style={{ 
              left: `calc(50% - ${isDoublePage ? '((78vh / 1.414) * 1.0)' : '((78vh / 1.414) / 2)'} * (${zoom / 100}) - 3vw)`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Icon icon="ion:caret-up" width="1.8vw" height="1.8vw" className="text-[#D1D5DB] group-hover:text-[#4B5563] rotate-[-90deg] cursor-pointer" />
          </button>

          {/* Zoomable Canvas Container with Perimeter Shadow */}
          <div 
            className={`flex items-center justify-center transition-all duration-300 origin-center gap-[0] bg-white border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_0_20px_-5px_rgba(0,0,0,0.05)]`}
            style={{ 
              transform: `scale(${zoom / 100})`,
            }}
          >
            {/* A4 Canvas Page 1 Wrapper */}
            <div className="relative group/page">
              {/* Page Control Button (Floating Above Top) */}
              <button 
                className={`absolute top-[-2.5vw] cursor-pointer z-30 rounded-[0.5vw] bg-[#F3F4F6] transition-all duration-300 flex items-center justify-center w-[2vw] h-[2vw] shadow-sm`}
                style={{
                  [isDoublePage ? 'left' : 'right']: '0vw',
                }}
              >
                <Icon icon={isDoublePage ? "ri:menu-fold-4-fill" : "ri:menu-unfold-4-fill"} width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>

              {/* A4 Canvas Page 1 Inner */}
              <div 
                className="relative z-0 flex flex-col overflow-hidden"
                style={{ 
                  height: '78vh', 
                  aspectRatio: '1 / 1.414',
                  minHeight: '400px',
                }}
              >
                {/* Placeholder for Page Content */}
                <div className="flex-1 w-full bg-[#FFFFFF]">
                   <div className="p-[2vw] h-full flex flex-col">
                      <div className="w-full h-[0.5vh] bg-[#C1272D] mb-[2vh]"></div>
                      <div className="flex justify-between items-start">
                        <div className="bg-[#C1272D] text-white font-bold text-[1.8vw] px-[0.8vw] py-[0.4vw]">01</div>
                        <h1 className="text-[2.2vw] font-bold text-black uppercase tracking-wide">Sipper Glass</h1>
                      </div>
                   </div>
                </div>

                {/* Page Number Indicator */}
                <div className="absolute bottom-[2vh] left-[2vw]">
                   <div className="w-[1.8vw] h-[1.8vw] bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-[0.6vw] font-bold">06</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Subtle Center Divider for Double Page */}
            {isDoublePage && (
              <div className="w-[1px] h-[78vh] bg-gray-100/50 relative z-10 shrink-0"></div>
            )}

            {/* A4 Canvas Page 2 (Visible if Double Page is enabled) */}
            {isDoublePage && (
              <div className="relative group/page">
                {/* Page Control Button (Floating Above Top - Right Side) */}
                <button 
                  className="absolute top-[-2.5vw] cursor-pointer right-[0vw] z-30 rounded-[0.5vw] bg-[#F3F4F6] transition-all duration-300 flex items-center justify-center w-[2vw] h-[2vw] shadow-sm"
                >
                  <Icon icon="ri:menu-unfold-4-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                </button>

                {/* A4 Canvas Page 2 Inner */}
                <div 
                  className="relative z-0 flex flex-col overflow-hidden"
                  style={{ 
                    height: '78vh', 
                    aspectRatio: '1 / 1.414',
                    minHeight: '400px',
                  }}
                >
                  {/* Placeholder for Page Content */}
                  <div className="flex-1 w-full bg-[#FFFFFF]">
                     <div className="p-[2vw] h-full flex flex-col">
                        <div className="w-full h-[0.5vh] bg-[#C1272D] mb-[2vh]"></div>
                        <div className="flex justify-between items-start">
                          <div className="bg-[#C1272D] text-white font-bold text-[1.8vw] px-[0.8vw] py-[0.4vw]">02</div>
                          <h1 className="text-[2.2vw] font-bold text-black uppercase tracking-wide">Sipper Glass</h1>
                        </div>
                     </div>
                  </div>
                  
                  {/* Page Number Indicator */}
                  <div className="absolute bottom-[2vh] right-[2vw]">
                     <div className="w-[1.8vw] h-[1.8vw] bg-black rounded-full flex items-center justify-center">
                        <span className="text-white text-[0.6vw] font-bold">07</span>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Navigation Button - Positioned relative to visual edge */}
          <button 
            className="absolute rounded-full hover:bg-black/5 transition-all duration-300 group z-20 shrink-0 flex items-center justify-center w-[2.2vw] h-[2.2vw] hover:w-[3.2vw] hover:h-[3.2vw]"
            style={{ 
              right: `calc(50% - ${isDoublePage ? '((78vh / 1.414) * 1.0)' : '((78vh / 1.414) / 2)'} * (${zoom / 100}) - 3vw)`,
              top: '50%',
              transform: 'translate(50%, -50%)'
            }}
          >
            <Icon icon="ion:caret-up" width="1.8vw" height="1.8vw" className="text-[#D1D5DB] group-hover:text-[#4B5563] rotate-[90deg] cursor-pointer" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainEditor;
