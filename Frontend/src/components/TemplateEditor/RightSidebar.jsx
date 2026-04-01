import React, { useState, useRef } from 'react';
import { SquarePlay, Image as ImageIcon, CloudUpload, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import ShapeProperties from './ShapeProperties';

const RightSidebar = ({ 
  isDoublePage, 
  setIsDoublePage, 
  activeMainTool,
  activePageIndex,
  pages,
  updatePageBackground,
  selectedLayerId,
  updateElementAttribute
}) => {
  const fileInputRef = useRef(null);

  const presetColors = [
    '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#4b5563', '#1f2937', '#000000',
    '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
    '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857',
    '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c',
    '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'
  ];

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

  const selectedElementProps = (() => {
    if (!selectedLayerId) return null;
    const page = pages[activePageIndex];
    if (page && page.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const el = doc.getElementById(selectedLayerId);
      
      const rootId = doc.querySelector('svg > g')?.id;
      const overlayId = doc.querySelector('[data-name="Overlay"]')?.id;
      const isPageSelected = !selectedLayerId || selectedLayerId === rootId || selectedLayerId === overlayId;
      
      if (el && !isPageSelected) {
        let w = '0', h = '0', x = '0', y = '0', r = '0';
        if (el.tagName === 'rect') {
           w = el.getAttribute('width') || '0';
           h = el.getAttribute('height') || '0';
           x = el.getAttribute('x') || '0';
           y = el.getAttribute('y') || '0';
           r = el.getAttribute('rx') || '0';
        } else if (el.tagName === 'circle') {
           const radius = parseFloat(el.getAttribute('r')) || 0;
           w = (radius * 2).toString();
           h = w;
           x = (parseFloat(el.getAttribute('cx')) - radius).toString() || '0';
           y = (parseFloat(el.getAttribute('cy')) - radius).toString() || '0';
        } else if (el.tagName === 'ellipse') {
           const rx = parseFloat(el.getAttribute('rx')) || 0;
           const ry = parseFloat(el.getAttribute('ry')) || 0;
           w = (rx * 2).toString();
           h = (ry * 2).toString();
           x = (parseFloat(el.getAttribute('cx')) - rx).toString() || '0';
           y = (parseFloat(el.getAttribute('cy')) - ry).toString() || '0';
        } else if (el.tagName === 'text') {
           const bbox = el.getBBox ? el.getBBox() : { width: 0, height: 0, x: 0, y: 0 };
           w = bbox.width.toString();
           h = bbox.height.toString();
           x = el.getAttribute('x') || '0';
           y = el.getAttribute('y') || '0';
        }

        const fillStyle = el.getAttribute('fill') || '#000000';
        const strokeStyle = el.getAttribute('stroke') || 'none';

        const props = {
          id: selectedLayerId,
          tagName: el.tagName,
          fill: fillStyle,
          stroke: strokeStyle,
          strokeWidth: el.getAttribute('stroke-width') || '0',
          strokeDasharray: el.getAttribute('stroke-dasharray') || 'none',
          opacity: el.getAttribute('opacity') || '1',
          fontSize: el.getAttribute('font-size') || '16',
          textAlign: el.getAttribute('text-anchor') || 'start',
          w: Math.round(parseFloat(w)),
          h: Math.round(parseFloat(h)),
          x: Math.round(parseFloat(x)),
          y: Math.round(parseFloat(y)),
          r: Math.round(parseFloat(r)),
          isGradient: fillStyle?.includes('url(#')
        };

        // Extract all custom attributes (gradients, etc.)
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('fill-') || attr.name.startsWith('stroke-') || attr.name.startsWith('data-')) {
            props[attr.name] = attr.value;
          }
        });

        return props;
      }
    }
    return null;
  })();

  return (
    <div 
      className="bg-white border-l border-[#EEEEEE] flex flex-col overflow-hidden select-none flex-shrink-0 h-[92vh]"
      style={{ width: '24vw' }}
    >
      {/* ================= Display Controls (Header Section) ================= */}
      <div className="border-b border-gray-100 bg-gray-50 flex-shrink-0 flex flex-col justify-center px-[1.5vw] space-y-[0.5vh]" style={{ height: '8vh' }}>
         {/* Preview & Double Page Toggle Row (Center aligned in 8vh) */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-[0.6vw]">
                <div 
                   onClick={() => setIsDoublePage(!isDoublePage)}
                   className={`w-[2.6vw] h-[1.4vw] rounded-full relative cursor-pointer transition-colors duration-300 ${isDoublePage ? 'bg-[#5145F6]' : 'bg-gray-200'} border-[0.1vw] border-transparent scale-90`}
                >
                   <div className={`absolute top-[0.1vw] w-[1.1vw] h-[1.1vw] bg-white rounded-full transition-all duration-300 shadow-sm ${isDoublePage ? 'left-[1.3vw]' : 'left-[0.1vw]'}`}></div>
                </div>
                <span className="text-gray-700 font-medium text-[0.8vw]">Double Page</span>
            </div>

            <button className="bg-[#5145F6] text-white flex items-center gap-[0.3vw] px-[0.6vw] py-[0.2vw] rounded-[0.4vw] shadow-sm hover:bg-[#4338CA] transition-all text-[0.75vw] font-medium">
               <Icon icon="ic:baseline-preview" width="0.9vw" height="0.9vw" />
               <span className="">Preview</span>
            </button>
         </div>
      </div>

      {/* Persistent Dimension Section (Common for all) */}
      <div className="bg-[#f6f6f6] px-[1.5vw] py-[0.8vw] border-b border-gray-100 flex-shrink-0">
         <div className="space-y-[0.8vw]">
            <div className="flex items-center gap-[0.4vw]">
               <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Dimension</span>
               <div className="h-px flex-grow bg-gray-200"></div>
            </div>

            <div className="flex items-center justify-center gap-[3vw]">
               {/* Width */}
               <div className="flex items-center gap-[0.4vw]">
                  <span className="text-[0.85vw] font-medium text-gray-700 whitespace-nowrap">W :</span>
                  <div className="flex items-center gap-[0.1vw]">
                     <ChevronLeft 
                        size="0.85vw" 
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                        onClick={() => {
                           if (!selectedElementProps) return;
                           const tag = selectedElementProps.tagName;
                           const attr = tag === 'circle' ? 'r' : 'width';
                           const val = parseFloat(selectedElementProps.w || 0) - 1;
                           const finalVal = tag === 'circle' ? (val/2).toString() : val.toString();
                           updateElementAttribute(activePageIndex, selectedLayerId, attr, finalVal);
                        }}
                     />
                     <div className="w-[3.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] bg-white flex items-center justify-center shadow-sm">
                        <input 
                           className="w-full text-center bg-transparent outline-none text-[#111827] text-[0.85vw] font-semibold"
                           value={selectedElementProps?.w || 793}
                           onChange={(e) => {
                             if (!selectedElementProps) return;
                             const tag = selectedElementProps.tagName;
                             const attr = tag === 'circle' ? 'r' : 'width';
                             const finalVal = tag === 'circle' ? (parseFloat(e.target.value)/2).toString() : e.target.value;
                             updateElementAttribute(activePageIndex, selectedLayerId, attr, finalVal);
                           }}
                        />
                     </div>
                     <ChevronRight 
                        size="0.85vw" 
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                           if (!selectedElementProps) return;
                           const tag = selectedElementProps.tagName;
                           const attr = tag === 'circle' ? 'r' : 'width';
                           const val = parseFloat(selectedElementProps.w || 0) + 1;
                           const finalVal = tag === 'circle' ? (val/2).toString() : val.toString();
                           updateElementAttribute(activePageIndex, selectedLayerId, attr, finalVal);
                        }}
                     />
                  </div>
               </div>

               {/* Height */}
               <div className="flex items-center gap-[0.4vw]">
                  <span className="text-[0.85vw] font-medium text-gray-700 whitespace-nowrap">H :</span>
                  <div className="flex items-center gap-[0.1vw]">
                     <ChevronLeft 
                        size="0.85vw" 
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                           if (!selectedElementProps) return;
                           const tag = selectedElementProps.tagName;
                           const attr = tag === 'circle' ? 'r' : 'height';
                           const val = parseFloat(selectedElementProps.h || 0) - 1;
                           const finalVal = tag === 'circle' ? (val/2).toString() : val.toString();
                           updateElementAttribute(activePageIndex, selectedLayerId, attr, finalVal);
                        }}
                     />
                     <div className="w-[3.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] bg-white flex items-center justify-center shadow-sm">
                        <input 
                           className="w-full text-center bg-transparent outline-none text-[#111827] text-[0.85vw] font-semibold"
                           value={selectedElementProps?.h || 1121}
                           onChange={(e) => {
                             if (!selectedElementProps) return;
                             const tag = selectedElementProps.tagName;
                             const attr = tag === 'circle' ? 'r' : 'height';
                             const finalVal = tag === 'circle' ? (parseFloat(e.target.value)/2).toString() : e.target.value;
                             updateElementAttribute(activePageIndex, selectedLayerId, attr, finalVal);
                           }}
                        />
                     </div>
                     <ChevronRight 
                        size="0.85vw" 
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                           if (!selectedElementProps) return;
                           const tag = selectedElementProps.tagName;
                           const attr = tag === 'circle' ? 'r' : 'height';
                           const val = parseFloat(selectedElementProps.h || 0) + 1;
                           const finalVal = tag === 'circle' ? (val/2).toString() : val.toString();
                           updateElementAttribute(activePageIndex, selectedLayerId, attr, finalVal);
                        }}
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#fbfbfb]">
        {activeMainTool === 'upload' ? (
          <div className="p-[1.5vw] flex flex-col gap-[3.5vh]">
            <div className="flex flex-col gap-[2.5vh]">
              <div className="flex items-center gap-[0.75vw]">
                <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Upload Files</span>
                <div className="h-[0.1vw] flex-1 bg-gray-300 opacity-50"></div>
              </div>
              <div
                onClick={handleUploadClick}
                className="w-full h-[10vw] border-2 border-dashed rounded-[1.25vw] bg-white flex flex-col items-center justify-center p-[1vw] transition-all group shadow-sm border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-md"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <div className="text-[0.75vw] font-semibold text-gray-500 mb-[1.5vw] tracking-tight">
                  Drag & Drop or <span className="text-blue-600 font-bold">Upload</span>
                </div>
                <div className="mb-[1.5vw] transition-colors text-gray-400 group-hover:text-blue-500">
                  <Icon icon="heroicons:arrow-up-tray" width="2vw" />
                </div>
                <div className="text-center">
                  <div className="text-[0.65vw] font-bold text-gray-600 uppercase tracking-wide mb-[0.25vw]">Supported File</div>
                  <div className="text-[0.55vw] text-gray-400 leading-relaxed uppercase max-w-[12vw] font-medium text-center">Image, Video, Audio, GIF, SVG</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-[1.5vw] overflow-y-auto no-scrollbar gap-[1.5vw]">
            {selectedElementProps ? (
                <div className="flex flex-col gap-[1.5vw]">
                   <ShapeProperties 
                      selectedElementProps={selectedElementProps}
                      activePageIndex={activePageIndex}
                      selectedLayerId={selectedLayerId}
                      updateElementAttribute={updateElementAttribute}
                   />
                </div>
            ) : (
               /* Page Properties (Default View) */
               (() => {
                 const page = pages[activePageIndex];
                 const parser = new DOMParser();
                 const doc = parser.parseFromString(page?.html || '', 'image/svg+xml');
                 const overlay = doc.querySelector('[data-name="Overlay"]');
                 const currentBg = overlay?.getAttribute('fill') || '#ffffff';

                 return (
                   <div className="flex flex-col gap-[3vh]">
                     <div className="flex flex-col gap-[1.5vh]">
                       <div className="flex items-center gap-[0.75vw]">
                         <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
                           Page Background
                         </span>
                         <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
                       </div>

                       <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm">
                         <div className="flex items-center justify-between mb-[1.5vh]">
                           <span className="text-[0.75vw] text-gray-500 font-medium">Background Color</span>
                           <div className="flex items-center gap-[0.5vw]">
                             <div className="w-[1.2vw] h-[1.2vw] rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: currentBg }} />
                             <span className="text-[0.7vw] font-mono text-gray-400">{currentBg.toUpperCase()}</span>
                           </div>
                         </div>

                         <div className="grid grid-cols-8 gap-[0.4vw]">
                           {presetColors.map((color) => (
                             <button
                               key={color}
                               onClick={() => updatePageBackground(activePageIndex, color)}
                               className={`w-[1.6vw] h-[1.6vw] rounded-[0.3vw] border border-gray-100 transition-all hover:scale-110 shadow-sm ${currentBg.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-blue-500 scale-110 z-10 ring-offset-1' : 'hover:z-10'}`}
                               style={{ backgroundColor: color }}
                               title={color}
                             />
                           ))}
                         </div>
                       </div>
                     </div>

                     <div className="flex flex-col gap-[1.5vh]">
                       <div className="flex items-center gap-[0.75vw]">
                         <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Document info</span>
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
               })()
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
