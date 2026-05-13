import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Image as ImageIcon, Download, ChevronRight, Edit2, Layout, Sliders, Save } from 'lucide-react';
import { Icon } from '@iconify/react';

const ExportModal = ({ isOpen, onClose, currentBook }) => {
  const [activeTab, setActiveTab] = useState('flipbook');
  const [exportType, setExportType] = useState('entire'); // 'entire' or 'selected'
  const [quality, setQuality] = useState('Medium');
  const [format, setFormat] = useState('JPG');
  const [includeCover, setIncludeCover] = useState(true);
  const [includePoster, setIncludePoster] = useState(true);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  
  // Poster specific states
  const [posterName, setPosterName] = useState('Name of the Poster');
  const [posterWidth, setPosterWidth] = useState(1080);
  const [posterHeight, setPosterHeight] = useState(880);
  const [isEditingPoster, setIsEditingPoster] = useState(false);
  const [activePosterEditTab, setActivePosterEditTab] = useState('templates');

  // Page Selection State
  const totalPages = 12; // This would come from currentBook.pages.length
  const [selectedPages, setSelectedPages] = useState(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));

  if (!isOpen) return null;

  const qualityOptions = [
    { name: 'Low', res: '720px' },
    { name: 'Medium', res: '1024px' },
    { name: 'High', res: '2048px' },
    { name: 'Ultra', res: '4096px' },
  ];

  const formatOptions = ['PNG', 'JPG', 'WEBP', 'PDF'];

  // Higher quality square images for templates
  const posterTemplates = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526170315870-ef5d82f69a9a?w=800&auto=format&fit=crop&q=80"
  ];

  const posterSizes = [
    { label: 'Free size', icon: null },
    { label: '2X2', icon: 'mdi:instagram' },
    { label: '2X4', icon: 'mdi:instagram' },
    { label: '2X3', icon: 'mdi:instagram' },
    { label: '4X4', icon: 'mdi:instagram' },
    { label: 'Free size', icon: null },
    { label: '2X2', icon: 'mdi:instagram' },
    { label: '2X4', icon: 'mdi:instagram' },
    { label: '2X3', icon: 'mdi:instagram' },
    { label: '4X4', icon: 'mdi:instagram' }
  ];

  const togglePage = (id) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPages(newSelected);
  };

  const selectAll = () => {
    setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
    setIsOptionsMenuOpen(false);
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
    setIsOptionsMenuOpen(false);
  };

  const isAllSelected = selectedPages.size === totalPages;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-[2vw]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-[58vw] h-[40vw] rounded-[1.2vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-[1.5vw] py-[1vw] border-b border-gray-100">
          <div className="flex items-center gap-[1vw] flex-1">
            {!isEditingPoster ? (
              <>
                <h2 className="text-[1.3vw] font-bold text-gray-800">Export</h2>
                <div className="flex-1 h-[1px] bg-gray-100"></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-[0.8vw]">
                  <h2 className="text-[1.3vw] font-bold text-gray-400">Export Poster</h2>
                  <ChevronRight size="1.2vw" className="text-gray-300" />
                  <h2 className="text-[1.3vw] font-bold text-gray-800">Edit Poster</h2>
                </div>
                <div className="flex-1 h-[1px] bg-gray-100"></div>
              </>
            )}
          </div>
          <button 
            onClick={onClose}
            className="ml-[1.5vw] w-[2vw] h-[2vw] flex items-center justify-center rounded-[0.5vw] border border-red-100 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <X size="1.1vw" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 py-[0.8vw] px-[1vw] flex flex-col gap-[0.5vw] overflow-hidden">
          
          {/* Sub Header / Tabs */}
          <div className="flex flex-col gap-[0.5vw] px-[0.5vw]">
            {!isEditingPoster ? (
              <>
                <div className="flex gap-[1vw]">
                  <button 
                    onClick={() => setActiveTab('flipbook')}
                    className={`px-[1.5vw] py-[0.6vw] rounded-[0.6vw] font-semibold text-[0.8vw] transition-all cursor-pointer ${activeTab === 'flipbook' ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Export Flipbook
                  </button>
                  <button 
                    onClick={() => setActiveTab('poster')}
                    className={`px-[1.5vw] py-[0.6vw] rounded-[0.6vw] font-semibold text-[0.8vw] transition-all cursor-pointer ${activeTab === 'poster' ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Export Poster
                  </button>
                </div>
                {activeTab === 'poster' && (
                  <p className="text-[0.75vw] text-gray-500 font-medium">Create and export customizable posters for social sharing and promotion.</p>
                )}
              </>
            ) : (
              <p className="text-[0.75vw] text-gray-500 font-medium px-[0.2vw]">Customize your poster design, Content and Branding</p>
            )}
          </div>

          <div className="flex gap-[1.5vw] flex-1 overflow-hidden p-[0.5vw]">
            {!isEditingPoster ? (
              /* STANDARD EXPORT VIEW */
              <>
                {activeTab === 'flipbook' ? (
                  /* Left Column: Flipbook Selection */
                  <div className="flex-1 flex flex-col border border-gray-200 rounded-[1vw] overflow-hidden bg-white shadow-sm h-full">
                    <div className="px-[1vw] py-[0.8vw] border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-[1vw] flex-1">
                            <h3 className="text-[0.95vw] font-bold text-gray-800 whitespace-nowrap">Page Preview</h3>
                            <div className="flex-1 h-[1px] bg-gray-100"></div>
                        </div>
                        <div className="relative ml-[1vw]">
                            <button 
                                onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                                className={`w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-[0.4vw] transition-colors cursor-pointer border shadow-sm ${isOptionsMenuOpen ? 'bg-[#4A3AFF] border-[#4A3AFF] text-white' : 'text-gray-400 hover:bg-gray-50 border-gray-100'}`}
                            >
                                <Icon icon="bi:three-dots-vertical" className="w-[0.9vw] h-[0.9vw]" />
                            </button>
                            {isOptionsMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsOptionsMenuOpen(false)} />
                                    <div className="absolute right-0 mt-[0.5vw] w-[8vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button onClick={selectAll} className="w-full px-[1.2vw] py-[0.7vw] text-left text-[0.75vw] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Select All</button>
                                        <button onClick={deselectAll} className="w-full px-[1.2vw] py-[0.7vw] text-left text-[0.75vw] font-semibold text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50">Deselect All</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="px-[1vw] pt-[0.6vw] text-[0.65vw] text-gray-400 font-medium">Select pages to include in your Export</p>
                    <div className="p-[1vw] grid grid-cols-3 gap-[1vw] flex-1 overflow-y-auto custom-scrollbar">
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const pageId = i + 1;
                          const isSelected = selectedPages.has(pageId);
                          return (
                              <div key={pageId} className="flex flex-col gap-[0.5vw] group">
                                <div onClick={() => togglePage(pageId)} className={`aspect-[3/4] bg-gray-50 rounded-[0.5vw] border-2 transition-all cursor-pointer relative overflow-hidden ${isSelected ? 'border-[#4A3AFF] shadow-md' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                    <div className={`absolute top-[0.5vw] right-[0.5vw] w-[1.2vw] h-[1.2vw] rounded-[0.3vw] border-2 flex items-center justify-center z-10 transition-all ${isSelected ? 'bg-[#4A3AFF] border-[#4A3AFF] text-white shadow-sm' : 'bg-white/80 border-gray-300 text-transparent'}`}><Check size="0.8vw" strokeWidth={4} /></div>
                                    <div className={`absolute inset-0 p-[0.6vw] flex flex-col gap-[0.4vw] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
                                        <div className="w-[60%] h-[0.6vw] bg-gray-200 rounded-full"></div>
                                        <div className="w-[40%] h-[0.4vw] bg-gray-100 rounded-full"></div>
                                        <div className="flex-1 flex flex-col justify-end"><div className="w-full aspect-[4/3] bg-gray-200 rounded-[0.4vw]"></div></div>
                                    </div>
                                </div>
                                <span className={`text-[0.65vw] font-medium text-center transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>Flipbook Na...</span>
                              </div>
                          );
                        })}
                    </div>
                    <div className="mt-auto px-[1vw] py-[0.8vw] bg-gray-100/50 flex justify-between items-center border-t border-gray-100">
                        <span className="text-[0.8vw] font-bold text-gray-700">{currentBook?.name || 'Flipbook Name'}</span>
                        <span className="text-[0.8vw] font-bold text-gray-700">Total Pages : {totalPages}</span>
                    </div>
                  </div>
                ) : (
                  /* Left Column: Poster Preview */
                  <div className="flex-1 flex flex-col bg-[#C4A99F]/20 rounded-[1vw] overflow-hidden relative shadow-sm border border-gray-100 h-full group cursor-pointer">
                    <img src="https://images.pexels.com/photos/35642492/pexels-photo-35642492.jpeg" alt="Poster Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                        <button onClick={() => setIsEditingPoster(true)} className="bg-white/20 backdrop-blur-md border border-white/30 px-[1.2vw] py-[0.6vw] rounded-[0.6vw] flex items-center gap-[0.6vw] text-white shadow-xl hover:bg-white/30 transition-all active:scale-95">
                            <Edit2 size="0.9vw" />
                            <span className="text-[1vw] font-bold">Edit Poster</span>
                        </button>
                    </div>
                    <div className="absolute top-[2vw] left-[2vw] bg-white p-[0.5vw] rounded-[0.3vw] shadow-md z-10">
                        <div className="font-black text-[0.8vw] leading-none text-gray-900">YOUR</div>
                        <div className="font-black text-[0.8vw] leading-none text-gray-900">LOGO</div>
                    </div>
                    <div className="absolute top-[2vw] right-[2vw] flex gap-[0.5vw] z-10">
                        <div className="w-[1.5vw] h-[1.5vw] bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-[0.3vw] flex items-center justify-center text-white shadow-sm"><Icon icon="mdi:instagram" className="w-[1vw] h-[1vw]" /></div>
                        <div className="w-[1.5vw] h-[1.5vw] bg-blue-600 rounded-[0.3vw] flex items-center justify-center text-white shadow-sm"><Icon icon="mdi:facebook" className="w-[1vw] h-[1vw]" /></div>
                        <div className="w-[1.5vw] h-[1.5vw] bg-black rounded-[0.3vw] flex items-center justify-center text-white shadow-sm"><Icon icon="ri:twitter-x-fill" className="w-[1vw] h-[1vw]" /></div>
                        <div className="w-[1.5vw] h-[1.5vw] bg-blue-500 rounded-[0.3vw] flex items-center justify-center text-white shadow-sm"><Icon icon="mdi:linkedin" className="w-[1vw] h-[1vw]" /></div>
                    </div>
                    <div className="absolute bottom-[2vw] left-0 right-0 text-center z-10">
                        <h4 className="text-[1.2vw] font-bold text-white">Smart Night Lamp</h4>
                        <p className="text-[0.6vw] text-white font-medium italic mt-[0.2vw]">"Warm Light for Cozy Nights"</p>
                    </div>
                  </div>
                )}

                {/* Right Column: Settings */}
                <div className="w-[22vw] flex flex-col gap-[1vw]">
                  {activeTab === 'flipbook' ? (
                    <>
                      <div className="flex flex-col gap-[0.6vw]">
                        <h4 className="text-[0.8vw] font-bold text-gray-800 flex items-center gap-[0.5vw]">Export Type<div className="flex-1 h-[1px] bg-gray-100"></div></h4>
                        <div className="flex flex-col gap-[0.6vw]">
                          <label className="flex items-center gap-[0.7vw] cursor-pointer group"><input type="radio" name="exportType" className="w-[1vw] h-[1vw] accent-[#4A3AFF] cursor-pointer" checked={exportType === 'entire'} onChange={() => setExportType('entire')} /><span className={`text-[0.8vw] font-semibold transition-colors ${exportType === 'entire' ? 'text-gray-900' : 'text-gray-500'}`}>Export Entire Book</span></label>
                          <label className="flex items-center gap-[0.7vw] cursor-pointer group"><input type="radio" name="exportType" className="w-[1vw] h-[1vw] accent-[#4A3AFF] cursor-pointer" checked={exportType === 'selected'} onChange={() => setExportType('selected')} /><span className={`text-[0.8vw] font-semibold transition-colors ${exportType === 'selected' ? 'text-gray-900' : 'text-gray-500'}`}>Export Selected Pages</span></label>
                        </div>
                      </div>
                      <div className="flex flex-col gap-[0.6vw]">
                        <h4 className="text-[0.8vw] font-bold text-gray-800 flex items-center gap-[0.5vw]">Include in Export<div className="flex-1 h-[1px] bg-gray-100"></div></h4>
                        <div className="flex flex-col gap-[0.8vw]">
                            <div className="flex items-center justify-between gap-[0.5vw]">
                                <div className="flex items-center gap-[0.6vw] flex-shrink-0"><div className="w-[2.2vw] h-[2.2vw] bg-gray-50 rounded-[0.4vw] flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden"><div className="w-full h-full bg-orange-100 flex items-center justify-center"><ImageIcon size="1vw" className="text-orange-400" /></div></div><div className="flex flex-col gap-[0.2vw]"><span className="text-[0.8vw] font-semibold text-gray-700 leading-tight">Include Cover Image</span><span className="text-[0.55vw] text-gray-400">Customize • Other Setup • Cover Image</span></div></div>
                                <div className="flex-1 h-[1px] border-b border-dashed border-gray-200"></div>
                                <button onClick={() => setIncludeCover(!includeCover)} className={`flex-shrink-0 w-[2vw] h-[1.1vw] rounded-full p-[0.2vw] transition-all duration-300 cursor-pointer shadow-inner ${includeCover ? 'bg-[#4A3AFF]' : 'bg-gray-200'}`}><div className={`w-[0.7vw] h-[0.7vw] bg-white rounded-full transition-all duration-300 shadow-md ${includeCover ? 'translate-x-[0.9vw]' : 'translate-x-0'}`} /></button>
                            </div>
                            <div className="flex items-center justify-between gap-[0.5vw]">
                                <div className="flex items-center gap-[0.6vw] flex-shrink-0"><div className="w-[2.2vw] h-[2.2vw] bg-gray-50 rounded-[0.4vw] flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden"><div className="w-full h-full bg-red-50 flex items-center justify-center"><FileText size="1vw" className="text-red-400" /></div></div><div className="flex flex-col gap-[0.2vw]"><span className="text-[0.8vw] font-semibold text-gray-700 leading-tight">Include Poster Image</span><span className="text-[0.55vw] text-gray-400">Export • Export Poster</span></div></div>
                                <div className="flex-1 h-[1px] border-b border-dashed border-gray-200"></div>
                                <button onClick={() => setIncludePoster(!includePoster)} className={`flex-shrink-0 w-[2vw] h-[1.1vw] rounded-full p-[0.2vw] transition-all duration-300 cursor-pointer shadow-inner ${includePoster ? 'bg-[#4A3AFF]' : 'bg-gray-200'}`}><div className={`w-[0.7vw] h-[0.7vw] bg-white rounded-full transition-all duration-300 shadow-md ${includePoster ? 'translate-x-[0.9vw]' : 'translate-x-0'}`} /></button>
                            </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-[0.6vw]">
                        <h4 className="text-[0.8vw] font-bold text-gray-800 flex items-center gap-[0.5vw]">Poster Details<div className="flex-1 h-[1px] bg-gray-100"></div></h4>
                        <div className="relative group">
                            <input type="text" value={posterName} onChange={(e) => setPosterName(e.target.value)} className="w-full px-[1vw] py-[0.8vw] border border-gray-200 rounded-[0.7vw] text-[0.8vw] font-medium text-gray-700 focus:outline-none focus:border-[#4A3AFF] transition-colors pr-[2.5vw] bg-white shadow-sm" placeholder="Name of the Poster" />
                            <Edit2 size="0.9vw" className="absolute right-[1vw] top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-[0.6vw]">
                        <h4 className="text-[0.8vw] font-bold text-gray-800 flex items-center gap-[0.5vw]">Poster Dimension<div className="flex-1 h-[1px] bg-gray-100"></div></h4>
                        <div className="flex items-center gap-[1.5vw]">
                            <div className="flex items-center gap-[0.6vw]"><span className="text-[0.8vw] font-medium text-gray-500">W :</span><input type="number" value={posterWidth} onChange={(e) => setPosterWidth(e.target.value)} className="w-[5vw] px-[0.8vw] py-[0.6vw] border border-gray-200 rounded-[0.5vw] text-[0.8vw] font-bold text-gray-700 focus:outline-none focus:border-[#4A3AFF] transition-colors bg-white shadow-sm" /></div>
                            <div className="flex items-center gap-[0.6vw]"><span className="text-[0.8vw] font-medium text-gray-500">H :</span><input type="number" value={posterHeight} onChange={(e) => setPosterHeight(e.target.value)} className="w-[5vw] px-[0.8vw] py-[0.6vw] border border-gray-200 rounded-[0.5vw] text-[0.8vw] font-bold text-gray-700 focus:outline-none focus:border-[#4A3AFF] transition-colors bg-white shadow-sm" /></div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-[0.6vw]">
                    <h4 className="text-[0.8vw] font-bold text-gray-800 flex items-center gap-[0.5vw]">Set Quality & Export type<div className="flex-1 h-[1px] bg-gray-100"></div></h4>
                    <div className="grid grid-cols-4 gap-[0.4vw]">
                      {qualityOptions.map((opt) => (
                        <button key={opt.name} onClick={() => setQuality(opt.name)} className={`flex flex-col items-center justify-center py-[0.5vw] rounded-[0.5vw] border transition-all cursor-pointer ${quality === opt.name ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 shadow-sm'}`}><span className="text-[0.65vw] font-semibold">{opt.name}</span><span className={`text-[0.5vw] ${quality === opt.name ? 'text-gray-300' : 'text-gray-400'}`}>({opt.res})</span></button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-[0.4vw]">
                      {formatOptions.map((fmt) => (
                        <button key={fmt} onClick={() => setFormat(fmt)} className={`py-[0.5vw] rounded-[0.5vw] border transition-all cursor-pointer font-semibold text-[0.7vw] ${format === fmt ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 shadow-sm'}`}>{fmt}</button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-[1vw]">
                    {activeTab === 'flipbook' && (
                        <div className="bg-[#EEF2FF] rounded-[0.8vw] border border-indigo-100 overflow-hidden flex shadow-sm">
                            <div className="flex-1 flex items-center gap-[0.6vw] p-[0.6vw] border-r border-indigo-100"><div className="w-[1.6vw] h-[1.6vw] bg-white rounded-[0.4vw] flex items-center justify-center text-[#4A3AFF] shadow-sm"><FileText size="0.9vw" /></div><div className="flex flex-col"><span className="text-[0.7vw] font-bold text-[#373d8a]">Total Content - {selectedPages.size + (includeCover ? 1 : 0) + (includePoster ? 1 : 0)}</span></div></div>
                            <div className="flex-1 flex flex-col items-end p-[0.6vw] bg-white/40"><span className="text-[0.45vw] text-gray-400 font-medium">Estimated Size</span><span className="text-[0.7vw] font-bold text-[#4A3AFF]">{(selectedPages.size * 1.1 + (includeCover ? 1.5 : 0)).toFixed(2)} MB</span></div>
                        </div>
                    )}
                    <div className="flex gap-[0.8vw]">
                      <button onClick={onClose} className="flex-1 flex items-center justify-center gap-[0.5vw] px-[1.2vw] py-[0.7vw] rounded-[0.6vw] border border-gray-200 text-gray-700 font-bold text-[0.8vw] hover:bg-gray-50 transition-all cursor-pointer shadow-sm active:scale-95"><X size="0.9vw" />Cancel</button>
                      <button className="flex-[2] flex items-center justify-center gap-[0.6vw] px-[1.5vw] py-[0.7vw] rounded-[0.6vw] bg-black text-white font-bold text-[0.8vw] hover:bg-gray-900 shadow-[0_4px_15px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-all cursor-pointer active:scale-95"><Download size="0.9vw" />{activeTab === 'flipbook' ? `Export ${selectedPages.size} Pages as ${format}` : `Export poster as ${format}`}</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* POSTER EDIT VIEW - REFINED */
              <div className="flex-1 flex flex-col gap-[1vw] overflow-hidden px-[0.5vw] pb-[0.5vw]">
                <div className="flex gap-[1.5vw] flex-1 overflow-hidden">
                    {/* Left Column: Preview & Sizes */}
                    <div className="w-[22vw] flex flex-col gap-[1.2vw] h-full">
                        {/* Smaller Preview */}
                        <div className="flex-[1.2] bg-gray-50 rounded-[1vw] overflow-hidden relative border border-gray-100 shadow-sm min-h-0">
                            <img src="https://images.pexels.com/photos/35642492/pexels-photo-35642492.jpeg" alt="Poster Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-[0.8vw] left-[0.8vw] bg-white p-[0.3vw] rounded-[0.2vw] shadow-md z-10 scale-75 origin-top-left">
                                <div className="font-black text-[0.8vw] leading-none text-gray-900">YOUR</div>
                                <div className="font-black text-[0.8vw] leading-none text-gray-900">LOGO</div>
                            </div>
                            <div className="absolute top-[0.8vw] right-[0.8vw] flex gap-[0.3vw] z-10 scale-75 origin-top-right">
                                <div className="w-[1.5vw] h-[1.5vw] bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-[0.3vw] flex items-center justify-center text-white"><Icon icon="mdi:instagram" className="w-[1vw] h-[1vw]" /></div>
                                <div className="w-[1.5vw] h-[1.5vw] bg-blue-600 rounded-[0.3vw] flex items-center justify-center text-white"><Icon icon="mdi:facebook" className="w-[1vw] h-[1vw]" /></div>
                            </div>
                            <div className="absolute bottom-[1.2vw] left-0 right-0 text-center z-10 px-[1vw]">
                                <h4 className="text-[0.9vw] font-bold text-white leading-tight drop-shadow-md">Smart Night Lamp</h4>
                                <p className="text-[0.5vw] text-white/90 italic mt-[0.1vw] drop-shadow-sm">"Warm Light for Cozy Nights"</p>
                            </div>
                        </div>

                        {/* Poster Sizes */}
                        <div className="bg-gray-100 rounded-[1.2vw] border border-gray-200 overflow-hidden flex flex-col shrink-0">
                            <div className="px-[1vw] py-[0.8vw] border-b border-gray-200 bg-gray-200/40">
                                <h3 className="text-[0.8vw] font-bold text-gray-700">Poster Size</h3>
                            </div>
                            <div className="p-[0.8vw] grid grid-cols-5 gap-[0.5vw]">
                                {posterSizes.map((size, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-[0.4vw] group cursor-pointer">
                                        <div className="w-full aspect-square border-[1.5px] border-dashed border-gray-300 rounded-[0.5vw] flex items-center justify-center bg-white group-hover:border-[#4A3AFF] transition-all relative">
                                            {size.icon && <Icon icon={size.icon} className="w-[1vw] h-[1vw] text-pink-500 opacity-80" />}
                                            <div className="absolute inset-[0.1vw] border border-gray-100 rounded-[0.3vw]"></div>
                                        </div>
                                        <span className="text-[0.55vw] font-bold text-gray-400 group-hover:text-[#4A3AFF] whitespace-nowrap">{size.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Templates Grid & Tabs */}
                    <div className="flex-1 flex flex-col gap-[1.5vw] h-full overflow-hidden">
                        <div className="flex-1 flex flex-col bg-gray-200/60 rounded-[1.2vw] border border-gray-300 overflow-hidden relative shadow-sm">
                            {/* Tabs Header */}
                            <div className="flex bg-gray-200/90 border-b border-gray-300 shrink-0">
                                <button 
                                    onClick={() => setActivePosterEditTab('templates')}
                                    className={`flex-1 py-[0.7vw] text-[0.85vw] font-bold transition-all relative ${activePosterEditTab === 'templates' ? 'text-gray-900 bg-white/20' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Templates
                                    {activePosterEditTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-[0.2vw] bg-black" />}
                                </button>
                                <button 
                                    onClick={() => setActivePosterEditTab('customize')}
                                    className={`flex-1 py-[0.7vw] text-[0.85vw] font-bold transition-all relative ${activePosterEditTab === 'customize' ? 'text-gray-900 bg-white/20' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Customize
                                    {activePosterEditTab === 'customize' && <div className="absolute bottom-0 left-0 right-0 h-[0.2vw] bg-black" />}
                                </button>
                            </div>

                            {/* White Grid Container */}
                            <div className="flex-1 bg-white overflow-hidden m-[0.1vw] rounded-b-[1.1vw] relative shadow-inner">
                                <div className="h-full p-[1.5vw] grid grid-cols-3 gap-[1vw] overflow-y-auto custom-scrollbar-thick pr-[1.8vw]">
                                    {posterTemplates.map((url, idx) => (
                                        <div key={idx} className="aspect-square rounded-[0.8vw] overflow-hidden border border-gray-100 shadow-sm cursor-pointer group relative hover:shadow-lg transition-all hover:-translate-y-[2px]">
                                            <img src={url} alt={`Template ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Centered and Larger */}
                        <div className="flex gap-[1vw] shrink-0 pt-[0.2vw]">
                            <button 
                                onClick={() => setIsEditingPoster(false)}
                                className="flex-1 flex items-center justify-center gap-[0.6vw] py-[0.6vw] rounded-[0.5vw] border border-gray-300 bg-white text-gray-800 font-bold text-[0.8vw] hover:bg-gray-50 shadow-sm transition-all active:scale-95"
                            >
                                <X size="1vw" />
                                Cancel
                            </button>
                            <button 
                                onClick={() => setIsEditingPoster(false)}
                                className="flex-[1.8] flex items-center justify-center gap-[0.8vw] py-[0.6vw] rounded-[0.5vw] bg-black text-white font-bold text-[0.8vw] hover:bg-gray-900 shadow-xl transition-all active:scale-95"
                            >
                                <Check size="1vw" />
                                Save and go to Export
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
