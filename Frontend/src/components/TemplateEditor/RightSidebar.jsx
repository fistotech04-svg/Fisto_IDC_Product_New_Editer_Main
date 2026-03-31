import React, { useState, useRef } from 'react';
import { SquarePlay, Image as ImageIcon, CloudUpload } from 'lucide-react';
import { Icon } from '@iconify/react';

const RightSidebar = ({ 
  isDoublePage, 
  setIsDoublePage, 
  activeMainTool,
  activePageIndex,
  pages,
  updatePageBackground,
  selectedLayerId
}) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Limit raw file size to 15MB
    if (file.size > 15 * 1024 * 1024) {
        alert("File is too large! Please upload images smaller than 15MB.");
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      
      // Compress/Downscale before sending
      const compressedUrl = await compressImage(dataUrl);

      // Dispatch event to MainEditor
      window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
        detail: {
          pageIndex: activePageIndex,
          dataUrl: compressedUrl
        }
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const compressImage = (dataUrl, maxWidth = 1200, maxHeight = 1200) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // If it's already small enough, no need to downscale
        if (width <= maxWidth && height <= maxHeight) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
            return;
        }

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75)); // Compress to 75% quality JPEG
      };
      img.src = dataUrl;
    });
  };

  const bgColor = (() => {
    const page = pages[activePageIndex];
    if (page && page.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const overlay = doc.querySelector('[data-name="Overlay"]');
      return overlay?.getAttribute('fill') || '#ffffff';
    }
    return '#ffffff';
  })();

  const presetColors = [
    '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#4b5563', '#1f2937', '#000000',
    '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
    '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857',
    '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c',
    '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'
  ];

  return (
    <div 
      className="bg-[#FFFFFF] border-l border-[#EEEEEE] flex flex-col overflow-hidden select-none flex-shrink-0"
      style={{ width: '24vw', height: '92vh' }}
    >
      {/* Top Header - 8vh consistent with Layer */}
      <div className="flex items-center justify-between px-[1.5vw] flex-shrink-0" style={{ height: '8vh' }}>
        <div className="flex items-center gap-[1vw]">
          {/* Toggle Switch */}
          <div 
            onClick={() => setIsDoublePage(!isDoublePage)}
            className={`w-[2.4vw] h-[1.2vw] rounded-full relative cursor-pointer transition-colors duration-300 ${isDoublePage ? 'bg-[#5145F6]' : 'bg-[#D1D5DB]'}`}
          >
             <div className={`absolute top-[0.15vw] w-[0.9vw] h-[0.9vw] bg-white rounded-full transition-all duration-300 ${isDoublePage ? 'left-[1.35vw]' : 'left-[0.15vw]'}`}></div>
          </div>
          <span className="text-[0.95vw] font-semibold text-[#111827]">Double Page</span>
        </div>

        <button className="bg-[#5145F6] text-white flex items-center gap-[0.3vw] px-[1.2vw] py-[1vh] rounded-[0.6vw] shadow-md hover:bg-[#4338CA] transition-all">
          <Icon icon="ic:baseline-preview" className='text-white' width="1.5vw" height="1.5vw" />
          <span className="text-[0.9vw] font-semibold">Preview</span>
        </button>
      </div>

      <div className="h-[1px] bg-[#EEEEEE] mx-[-1.5vw]"></div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f6f7]">
        {activeMainTool === 'upload' ? (
          <div className="p-[1.5vw] flex flex-col gap-[3.5vh]">
            {/* Upload Files Section */}
            <div className="flex flex-col gap-[2.5vh]">
              <div className="flex items-center gap-[0.75vw]">
                <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Upload Files</span>
                <div className="h-[0.1vw] flex-1 bg-gray-300 opacity-50"></div>
              </div>

              {/* Upload Box */}
              <div
                onClick={handleUploadClick}
                className="w-full h-[10vw] border-2 border-dashed rounded-[1.25vw] bg-white flex flex-col items-center justify-center p-[1vw] transition-all group shadow-sm border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-md"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
                <div className="text-[0.75vw] font-semibold text-gray-500 mb-[1.5vw] tracking-tight">
                  Drag & Drop or <span className="text-blue-600 font-bold">Upload</span>
                </div>

                <div className="mb-[1.5vw] transition-colors text-gray-400 group-hover:text-blue-500">
                  <Icon icon="heroicons:arrow-up-tray" width="2vw" />
                </div>

                <div className="text-center">
                  <div className="text-[0.65vw] font-bold text-gray-600 uppercase tracking-wide mb-[0.25vw]">
                    Supported File
                  </div>
                  <div className="text-[0.55vw] text-gray-400 leading-relaxed uppercase max-w-[12vw] font-medium text-center">
                    Image, Video, Audio, GIF, SVG
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Button Section */}
            <div className="mt-[1vh]">
              <div 
                className="w-full h-[6vh] rounded-[0.8vw] relative overflow-hidden flex items-center justify-center cursor-pointer shadow-lg group transition-transform"
              >
                {/* Collage Background */}
                <div className="absolute inset-0 flex">
                  <img 
                    src="https://images.unsplash.com/photo-1557683316-973673baf926?w=200&q=80" 
                    className="w-1/3 h-full object-cover brightness-[0.4] transition-all duration-500 group-hover:brightness-[0.6]" 
                    alt=""
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200&q=80" 
                    className="w-1/3 h-full object-cover brightness-[0.4] transition-all duration-500 group-hover:brightness-[0.6]" 
                    alt=""
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=200&q=80" 
                    className="w-1/3 h-full object-cover brightness-[0.4] transition-all duration-500 group-hover:brightness-[0.6]" 
                    alt=""
                  />
                </div>
                
                {/* Center Content */}
                <div className="relative z-10 flex items-center gap-[1vw] text-white">
                  <ImageIcon size="1.4vw" strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[1.1vw] font-bold">Gallery</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-[1.5vw] overflow-y-auto">
             {(() => {
                const rootId = (() => {
                  const page = pages[activePageIndex];
                  if (page && page.html) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(page.html, 'image/svg+xml');
                    return doc.querySelector('svg > g')?.id;
                  }
                  return null;
                })();
                
                const overlayId = (() => {
                  const page = pages[activePageIndex];
                  if (page && page.html) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(page.html, 'image/svg+xml');
                    return doc.querySelector('[data-name="Overlay"]')?.id;
                  }
                  return null;
                })();
                
                const isPageSelected = !selectedLayerId || selectedLayerId === rootId || selectedLayerId === overlayId;
                
                if (isPageSelected) {
                 return (
                   <div className="flex flex-col gap-[3vh]">
                     {/* Page Background Section */}
                     <div className="flex flex-col gap-[1.5vh]">
                       <div className="flex items-center gap-[0.75vw]">
                         <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap uppercase tracking-wider">
                           Page Background - {pages[activePageIndex]?.name || `Page ${activePageIndex + 1}`}
                         </span>
                         <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
                       </div>

                       <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm">
                         <div className="flex items-center justify-between mb-[1.5vh]">
                            <span className="text-[0.75vw] text-gray-500 font-medium">Background Color</span>
                            <div className="flex items-center gap-[0.5vw]">
                              <div 
                                className="w-[1.2vw] h-[1.2vw] rounded-full border border-gray-200 shadow-inner" 
                                style={{ backgroundColor: bgColor }}
                              />
                              <span className="text-[0.7vw] font-mono text-gray-400">{bgColor.toUpperCase()}</span>
                            </div>
                         </div>

                         {/* Color Palette */}
                         <div className="grid grid-cols-8 gap-[0.4vw]">
                            {presetColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => updatePageBackground(activePageIndex, color)}
                                className={`w-[1.6vw] h-[1.6vw] rounded-[0.3vw] border border-gray-100 transition-all hover:scale-110 shadow-sm ${bgColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-blue-500 scale-110 z-10 ring-offset-1' : 'hover:z-10'}`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                         </div>

                         {/* Custom Color Selector */}
                         <div className="mt-[2vh] pt-[2vh] border-t border-gray-100">
                            <div className="flex items-center gap-[1vw]">
                               <div className="relative w-full">
                                  <input 
                                    type="text"
                                    value={bgColor.toUpperCase()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val.startsWith('#') && val.length <= 7) {
                                        updatePageBackground(activePageIndex, val);
                                      }
                                    }}
                                    className="w-full pl-[0.8vw] pr-[2.5vw] py-[0.6vh] bg-gray-50 border border-gray-200 rounded-[0.4vw] text-[0.75vw] font-mono focus:outline-none focus:border-blue-500 transition-colors"
                                  />
                                  <input 
                                    type="color"
                                    value={bgColor}
                                    onChange={(e) => updatePageBackground(activePageIndex, e.target.value)}
                                    className="absolute right-[0.4vw] top-1/2 -translate-y-1/2 w-[1.4vw] h-[1.4vw] opacity-0 cursor-pointer"
                                  />
                                  <div 
                                    className="absolute right-[0.4vw] top-1/2 -translate-y-1/2 w-[1.4vw] h-[1.4vw] rounded-[0.2vw] border border-gray-200 pointer-events-none"
                                    style={{ backgroundColor: bgColor }}
                                  />
                               </div>
                            </div>
                         </div>
                       </div>
                     </div>

                     {/* Document Info Section */}
                     <div className="flex flex-col gap-[1.5vh]">
                       <div className="flex items-center gap-[0.75vw]">
                         <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap uppercase tracking-wider">Document info</span>
                         <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
                       </div>
                       <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm flex flex-col gap-[1vh]">
                          <div className="flex justify-between items-center text-[0.75vw]">
                            <span className="text-gray-500 font-medium">Format</span>
                            <span className="text-gray-900 font-semibold">A4 Sheet</span>
                          </div>
                          <div className="flex justify-between items-center text-[0.75vw]">
                            <span className="text-gray-500 font-medium">Dimensions</span>
                            <span className="text-gray-900 font-semibold">210 x 297 mm</span>
                          </div>
                       </div>
                     </div>
                   </div>
                 );
               } else {
                 return (
                   <div className="flex-1 flex flex-col items-center justify-center text-center">
                     <div className="text-gray-400 mb-[1vw]">
                         <Icon icon="solar:widget-linear" width="3vw" />
                     </div>
                     <p className="text-[0.8vw] text-gray-400 font-medium">Layer properties panel coming soon</p>
                   </div>
                 );
               }
             })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
