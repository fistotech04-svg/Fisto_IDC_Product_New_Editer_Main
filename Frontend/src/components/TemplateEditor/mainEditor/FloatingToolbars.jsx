import { Icon } from '@iconify/react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import HotspotPresetPopup from '../HotspotPresetPopup';
import {
  TemplateIcon,
  ClearIcon,
  DeleteIcon,
  MenuOption
} from './editorIcons';

export const FloatingToolbars = ({
  isPdfProject,
  isPopupEditor,
  pages = [],
  activePageIndex = 0,
  activeTopTool,
  setActiveTopTool,
  activeMainTool,
  setActiveMainTool,
  selectedSelectTool,
  setSelectedSelectTool,
  selectedPenTool,
  setSelectedPenTool,
  selectedShapeTool,
  setSelectedShapeTool,
  showHotspotPopup,
  setShowHotspotPopup,
  showSelectOptions,
  setShowSelectOptions,
  showPenOptions,
  setShowPenOptions,
  showShapesOptions,
  setShowShapesOptions,
  openMenuIndex,
  setOpenMenuIndex,
  closeAllDropdowns,
  onOpenTemplateModal,
  clearPage,
  deletePage
}) => {
  return (
    <>
        {/* Top Group: Selection & Primary Tools - Independent Position */}
        {/* Top Group: Selection & Primary Tools - Independent Position */}
        {!isPdfProject && !isPopupEditor && (
          <div className={`absolute right-[1.05vw] top-[6vh] z-50 ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-[#F1F3F4] rounded-[0.5vw] border border-gray-300 p-[0.3vw] flex flex-col items-center w-[2.7vw] gap-[0.7vh] shadow-sm">
              {/* Black Edit Icon Button */}
              <div className="relative group/tool flex items-center">
                <button
                  onClick={() => setActiveTopTool('editor')}
                  className={`w-[2.1vw] h-[2.1vw] cursor-pointer rounded-[0.4vw] flex items-center justify-center transition-all my-[0.1vh] ${activeTopTool === 'editor' ? 'bg-[#000000]' : 'hover:bg-white text-[#9EA1A7] hover:text-[#111827]'}`}
                >
                  <Icon icon="tabler:edit" width="1.1vw" height="1.1vw" className={activeTopTool === 'editor' ? 'text-white' : ''} />
                </button>
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Edit Mode
                </div>
              </div>

              {/* Hand / Touch Interaction Tool */}
              <div className="relative group/tool flex items-center">
                <button
                  onClick={() => setActiveTopTool('interaction')}
                  className={`w-[2.1vw] h-[2.1vw] cursor-pointer rounded-[0.4vw] flex items-center justify-center transition-all ${activeTopTool === 'interaction' ? 'bg-[#000000] text-white' : 'hover:bg-white text-[#9EA1A7] hover:text-[#111827]'}`}
                >
                  <Icon icon="hugeicons:touch-interaction-01" width="1.2vw" height="1.2vw" />
                </button>
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Touch Interaction
                </div>
              </div>

              {/* Star / Animation Tool */}
              <div className="relative group/tool flex items-center">
                <button
                  onClick={() => setActiveTopTool('animation')}
                  className={`w-[2.1vw] h-[2.1vw] cursor-pointer rounded-[0.4vw] flex items-center justify-center transition-all ${activeTopTool === 'animation' ? 'bg-[#000000] text-white' : 'hover:bg-white text-[#9EA1A7] hover:text-[#111827]'}`}
                >
                  <Icon icon="tdesign:animation-1" width="1.2vw" height="1.2vw" />
                </button>
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Animation & Effects
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Menu Button (Top Right Edge for Popup Editor) */}
        {!isPdfProject && isPopupEditor && activeTopTool !== 'animation' && activeTopTool !== 'interaction' && (
          <div className={`absolute right-0 top-[6.5vh] z-50 ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">
              {/* Cover Top Border */}
              <div className="absolute top-0 right-0 w-[calc(0.8vw+1px)] h-[2px] bg-[#F1F3F4] z-10 pointer-events-none" />
              {/* Perfect Inverted Corner Top */}
              <div className="absolute right-0 w-[0.8vw] h-[0.8vw] pointer-events-none z-20" style={{ top: 'calc(-0.8vw + 0.5px)' }}>
                <svg className="overflow-visible" width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4" />
                  <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#D1D5DB" strokeWidth="6" />
                </svg>
              </div>

              {/* Cover Bottom Border */}
              <div className="absolute bottom-0 right-0 w-[calc(0.8vw+1px)] h-[2px] bg-[#F1F3F4] z-10 pointer-events-none" />
              {/* Perfect Inverted Corner Bottom */}
              <div className="absolute right-0 w-[0.8vw] h-[0.8vw] pointer-events-none z-20" style={{ bottom: 'calc(-0.8vw + 0.5px)' }}>
                <svg className="overflow-visible" width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4" />
                  <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#D1D5DB" strokeWidth="6" />
                </svg>
              </div>

              <div className="flex items-center justify-start group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const displayIdx = activePageIndex;
                    setOpenMenuIndex(openMenuIndex === displayIdx ? null : displayIdx);
                  }}
                  className="w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer bg-white shadow-sm hover:bg-gray-50"
                >
                  <Icon icon="ci:hamburger-md" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                </button>
              </div>

              <AnimatePresence>
                {openMenuIndex === activePageIndex && (
                  <Motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    className="absolute top-0 right-[3.5vw] w-[12vw] bg-white rounded-[0.8vw] shadow-xl border border-gray-100 p-[0.5vw] z-[9999] flex flex-col gap-[0.2vw]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MenuOption
                      icon={<TemplateIcon />}
                      label="Change Template"
                      onClick={() => {
                        onOpenTemplateModal(activePageIndex);
                        setOpenMenuIndex(null);
                      }}
                    />
                    <MenuOption
                      icon={<ClearIcon />}
                      label="Clear"
                      onClick={() => { clearPage(activePageIndex); setOpenMenuIndex(null); }}
                    />
                    <MenuOption
                      icon={<DeleteIcon />}
                      label="Delete"
                      color="text-red-500"
                      hoverColor="hover:bg-red-50"
                      onClick={() => { deletePage(activePageIndex); setOpenMenuIndex(null); }}
                    />
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Interaction Group: Sub Tools */}
        {activeTopTool === 'interaction' && (
          <div className={`absolute right-0 top-[25vh] z-50 ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">

              {/* Cover Top Border */}
              <div className="absolute top-0 right-0 w-[calc(0.8vw+1px)] h-[2px] bg-[#F1F3F4] z-10 pointer-events-none" />
              {/* Perfect Inverted Corner Top */}
              <div className="absolute right-0 w-[0.8vw] h-[0.8vw] pointer-events-none z-20" style={{ top: 'calc(-0.8vw + 0.5px)' }}>
                <svg className="overflow-visible" width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4" />
                  <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#D1D5DB" strokeWidth="6" />
                </svg>
              </div>

              {/* Cover Bottom Border */}
              <div className="absolute bottom-0 right-0 w-[calc(0.8vw+1px)] h-[2px] bg-[#F1F3F4] z-10 pointer-events-none" />
              {/* Perfect Inverted Corner Bottom */}
              <div className="absolute right-0 w-[0.8vw] h-[0.8vw] pointer-events-none z-20" style={{ bottom: 'calc(-0.8vw + 0.5px)' }}>
                <svg className="overflow-visible" width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4" />
                  <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#D1D5DB" strokeWidth="6" />
                </svg>
              </div>

              {/* Select Tool */}
              <div className="pt-[0.1vh] mb-[0.8vh] flex items-center justify-start group gap-[0.3vw] relative group/tool">
                <button
                  onClick={() => {
                    if (setActiveMainTool) setActiveMainTool('select');
                  }}
                  className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${activeMainTool === 'select' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon icon="clarity:cursor-arrow-line" width="1.2vw" height="1.2vw" className={activeMainTool === 'select' ? 'text-[#111827]' : 'text-[#4B5563]'} />
                </button>
                <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Select Tool
                </div>
              </div>

              {/* Frame Tool */}
              <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] relative group/tool">
                <button
                  onClick={() => {
                    if (setActiveMainTool) setActiveMainTool('shapes');
                    setSelectedShapeTool('free-frame');
                  }}
                  className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${activeMainTool === 'shapes' && selectedShapeTool === 'free-frame' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon icon="iconoir:frame-alt" width="1.2vw" height="1.2vw" className={activeMainTool === 'shapes' && selectedShapeTool === 'free-frame' ? 'text-[#111827]' : 'text-[#4B5563]'} />
                </button>
                <div className="w-[0.7vw]"></div>
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Frame Tool
                </div>
              </div>

              {/* Hotspot Tool (Icon Only) */}
              <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] relative group/tool" id="hotspot-trigger-container">
                <button
                  onClick={() => setShowHotspotPopup(!showHotspotPopup)}
                  className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${showHotspotPopup ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon icon="material-symbols:ads-click-rounded" width="1.2vw" height="1.2vw" className={showHotspotPopup ? 'text-[#111827]' : 'text-[#4B5563]'} />
                </button>
                <div className="w-[0.7vw]"></div>
                {!showHotspotPopup && (
                  <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    Hotspot Tool
                  </div>
                )}
                {showHotspotPopup && (
                  <HotspotPresetPopup
                    onClose={() => setShowHotspotPopup(false)}
                    onSelectPreset={() => { }} // No functionality for now as requested
                  />
                )}
              </div>

            </div>
          </div>
        )}

        {/* Bottom Group: Creation & Widgets - HIDDEN for PDF projects */}
        {!isPdfProject && activeTopTool === 'editor' && (
          <div className={`absolute right-0 top-[25vh] z-50 ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">

              {/* Cover Top Border */}
              <div className="absolute top-0 right-0 w-[calc(0.8vw+1px)] h-[2px] bg-[#F1F3F4] z-10 pointer-events-none" />
              {/* Perfect Inverted Corner Top */}
              <div className="absolute right-0 w-[0.8vw] h-[0.8vw] pointer-events-none z-20" style={{ top: 'calc(-0.8vw + 0.5px)' }}>
                <svg className="overflow-visible" width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4" />
                  <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#D1D5DB" strokeWidth="6" />
                </svg>
              </div>

              {/* Cover Bottom Border */}
              <div className="absolute bottom-0 right-0 w-[calc(0.8vw+1px)] h-[2px] bg-[#F1F3F4] z-10 pointer-events-none" />
              {/* Perfect Inverted Corner Bottom */}
              <div className="absolute right-0 w-[0.8vw] h-[0.8vw] pointer-events-none z-20" style={{ bottom: 'calc(-0.8vw + 0.5px)' }}>
                <svg className="overflow-visible" width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4" />
                  <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#D1D5DB" strokeWidth="6" />
                </svg>
              </div>

              {/* White Upload Button - matching top group size */}
              <div className="pt-[0.1vh] mb-[0.8vh] flex items-center justify-start gap-[0.3vw] relative group/tool">
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
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Upload File
                </div>
              </div>

              {/* Select Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                {/* Select Tool Options Dropdown */}
                {showSelectOptions && (
                  <div className="absolute right-[4.2vw] top-[-1.5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.5vh] shadow-lg z-50 w-[2.7vw]">
                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'select' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSelectTool('select');
                          setActiveMainTool('select');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="clarity:cursor-arrow-line" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'select' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Select
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'direct' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSelectTool('direct');
                          setActiveMainTool('select');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="clarity:cursor-arrow-solid" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'direct' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Direct Select
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('select');
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSelectOptions(!showSelectOptions);
                    setShowPenOptions(false);
                    setShowShapesOptions(false);
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
                {!showSelectOptions && (
                  <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    {selectedSelectTool === 'direct' ? 'Direct Select Tool' : 'Select Tool'}
                  </div>
                )}
              </div>

              {/* Pen Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                {/* Pen Tool Options Dropdown */}
                {showPenOptions && (
                  <div className="absolute right-[4.2vw] top-[-5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.5vh] shadow-lg z-50 w-[2.7vw]">
                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pen' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPenTool('pen');
                          setActiveMainTool('pen');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="streamline-cyber:pen-tool" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pen' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Pen
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pencil' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPenTool('pencil');
                          setActiveMainTool('pen');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="mingcute:pencil-fill" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pencil' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Pencil
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('pen');
                    closeAllDropdowns();
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPenOptions(!showPenOptions);
                    setShowSelectOptions(false);
                    setShowShapesOptions(false);
                    setActiveMainTool('pen');
                  }}
                  className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'pen' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
                >
                  {selectedPenTool === 'pencil' ? (
                    <Icon icon="mingcute:pencil-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
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
                {!showPenOptions && (
                  <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    {selectedPenTool === 'pencil' ? 'Pencil Tool' : 'Pen Tool'}
                  </div>
                )}
              </div>

              {/* Type Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
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
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Text Tool
                </div>
              </div>

              {/* Shapes Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                {/* Shapes Tool Options Dropdown */}
                {showShapesOptions && (
                  <div className="absolute right-[4.2vw] top-[-12vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.5vh] shadow-lg z-50 w-[2.7vw]">
                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'rectangle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('rectangle');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="lucide:square" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'rectangle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Rectangle
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'circle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('circle');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="lucide:circle" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'circle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Circle
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'polygon' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('polygon');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="lucide:triangle" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'polygon' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Polygon
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'line' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('line');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="tabler:line" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'line' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827] rotate-[-45deg]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Line
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'star' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('star');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="lucide:star" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'star' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Star
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('shapes');
                    closeAllDropdowns();
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowShapesOptions(!showShapesOptions);
                    setShowSelectOptions(false);
                    setShowPenOptions(false);
                    setActiveMainTool('shapes');
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
                {!showShapesOptions && (
                  <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    Shapes Tool
                  </div>
                )}
              </div>

              {/* Grid Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] cursor-pointer relative group/tool">
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
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Elements & Icons
                </div>
              </div>
            </div>
          </div>
        )}

    </>
  );
};

export default FloatingToolbars;
