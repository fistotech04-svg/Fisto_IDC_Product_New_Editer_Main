import React, { useState, useRef, useEffect } from 'react';
import { SquarePlay, Image as ImageIcon, CloudUpload, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import ShapeProperties from './ShapeProperties';

const RightSidebar = ({ 
  isDoublePage, 
  setIsDoublePage, 
  activeMainTool,
  activeTopTool,
  activePageIndex,
  pages,
  updatePageBackground,
  selectedLayerId,
  updateElementAttribute,
  onPreview,
  activePreviewDevice: activePreviewDeviceProp,
  setActivePreviewDevice: setActivePreviewDeviceProp
}) => {
  const fileInputRef = useRef(null);
  const [activePreviewDevice, setActivePreviewDevice] = useState(localStorage.getItem('previewDevice') || 'Desktop');

  // Sync with prop if provided, otherwise use local/localStorage
  useEffect(() => {
    if (activePreviewDeviceProp) setActivePreviewDevice(activePreviewDeviceProp);
  }, [activePreviewDeviceProp]);

  const handleDeviceChange = (device) => {
    setActivePreviewDevice(device);
    localStorage.setItem('previewDevice', device);
    window.dispatchEvent(new CustomEvent('previewDeviceChange', { detail: device }));
    setActivePreviewDeviceProp?.(device);
  };

  useEffect(() => {
    const handleGlobalDeviceChange = (e) => {
      setActivePreviewDevice(e.detail);
    };
    window.addEventListener('previewDeviceChange', handleGlobalDeviceChange);
    return () => window.removeEventListener('previewDeviceChange', handleGlobalDeviceChange);
  }, []);

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
        
        // --- IMPROVED DIMENSION LOGIC: Try actual DOM first for rendered accuracy ---
        const actualEl = document.getElementById(selectedLayerId);
        if (actualEl && typeof actualEl.getBBox === 'function') {
           try {
              const bbox = actualEl.getBBox();
              w = bbox.width.toString();
              h = bbox.height.toString();
              x = bbox.x.toString();
              y = bbox.y.toString();
              
              // If there's a matrix transform, it usually handles position.
              // In this editor, interact.js uses matrix transforms for movement.
              const transform = actualEl.getAttribute('transform');
              if (transform && transform.includes('matrix')) {
                 const match = transform.match(/matrix\(([^)]+)\)/);
                 if (match) {
                    const m = match[1].split(/[\s,]+/).map(parseFloat);
                    // matrix(a, b, c, d, e, f) -> e, f are translation
                    if (m.length === 6) {
                       x = (parseFloat(x) + m[4]).toString();
                       y = (parseFloat(y) + m[5]).toString();
                       // Width/Height are already "local" to the matrix if we use getBBox(),
                       // but visual width/height should include scaling.
                       w = (parseFloat(w) * Math.abs(m[0])).toString();
                       h = (parseFloat(h) * Math.abs(m[3])).toString();
                    }
                 }
              }
           } catch (e) {
              console.warn("Failed to get BBox for element", e);
           }
        }

        // --- FALLBACK / OVERRIDE: Tags that have preferred source of truth ---
        if (el.tagName === 'rect') {
           // For simple rects, use attributes if transform is NOT present
           if (!el.getAttribute('transform')) {
              w = el.getAttribute('width') || w;
              h = el.getAttribute('height') || h;
              x = el.getAttribute('x') || x;
              y = el.getAttribute('y') || y;
           }
           r = el.getAttribute('rx') || '0';
        } else if (el.tagName === 'circle') {
           const radius = parseFloat(el.getAttribute('r')) || 0;
           w = (radius * 2).toString();
           h = w;
           // Use cx/cy for position if no matrix
           if (!el.getAttribute('transform')) {
              x = (parseFloat(el.getAttribute('cx') || '0') - radius).toString();
              y = (parseFloat(el.getAttribute('cy') || '0') - radius).toString();
           }
        } else if (el.tagName === 'ellipse') {
           const rx = parseFloat(el.getAttribute('rx')) || 0;
           const ry = parseFloat(el.getAttribute('ry')) || 0;
           w = (rx * 2).toString();
           h = (ry * 2).toString();
           if (!el.getAttribute('transform')) {
              x = (parseFloat(el.getAttribute('cx') || '0') - rx).toString();
              y = (parseFloat(el.getAttribute('cy') || '0') - ry).toString();
           }
        } else if (el.tagName === 'text') {
           // x/y on text is start position, bbox handles the rest
           if (!el.getAttribute('transform')) {
              x = el.getAttribute('x') || x;
              y = el.getAttribute('y') || y;
           }
        } else if (el.tagName === 'image' || el.tagName === 'path' || el.tagName === 'g') {
           // Fallback to width/height attributes if bbox failed or were zero
           if (parseFloat(w) === 0) w = el.getAttribute('width') || '0';
           if (parseFloat(h) === 0) h = el.getAttribute('height') || '0';
           if (parseFloat(x) === 0) x = el.getAttribute('x') || '0';
           if (parseFloat(y) === 0) y = el.getAttribute('y') || '0';
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
      <div className="border-b border-gray-100 bg-gray-50 flex-shrink-0 flex flex-col justify-center px-[1.5vw] space-y-[0.5vh]" style={{ height: '8.5vh' }}>
         {/* Preview & Double Page Toggle Row */}
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

            <div className="flex items-center gap-[0.4vw]">
               <button 
                  onClick={onPreview}
                  className="bg-[#5145F6] text-white flex items-center gap-[0.3vw] px-[0.6vw] py-[0.2vw] rounded-[0.4vw] shadow-sm hover:bg-[#4338CA] transition-all text-[0.75vw] font-medium"
               >
                  <Icon icon="ic:baseline-preview" width="0.9vw" height="0.9vw" />
                  <span>Preview</span>
               </button>
            </div>
         </div>
      </div>

      {/* Persistent Dimension Section (Common for all) */}
      {activeTopTool === 'editor' && (
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
      )}

      <div className="flex-1 flex flex-col overflow-hidden bg-[#fbfbfb]">
        {activeTopTool === 'editor' ? (
          activeMainTool === 'upload' ? (
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
          )
        ) : activeTopTool === 'interaction' ? (
          <div className="flex-1 flex flex-col p-[1.5vw] gap-[2.5vw] overflow-y-auto no-scrollbar">
            <div className="flex flex-col gap-[1.5vh]">
              <div className="flex items-center gap-[0.75vw]">
                <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider uppercase">Interaction Settings</span>
                <div className="h-[0.1vw] flex-1 bg-indigo-100"></div>
              </div>
              <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm flex flex-col gap-[1.5vh]">
                <div className="text-[0.7vw] text-gray-400 font-medium italic">Configure interactive behaviors for the selected element.</div>
                
                {!selectedLayerId ? (
                   <div className="p-[1vw] text-center text-[0.75vw] text-gray-400 font-medium bg-gray-50 rounded-[0.6vw] border border-dashed">
                      Select an element to add interactions
                   </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-[0.8vw]">
                      {[
                        { id: 'link', label: 'Link', icon: 'lucide:link' },
                        { id: 'popup', label: 'Popup', icon: 'lucide:external-link' }
                      ].map(type => {
                        const isSelected = selectedElementProps?.['data-interaction'] === type.id;
                        return (
                          <div 
                            key={type.id} 
                            onClick={() => updateElementAttribute(activePageIndex, selectedLayerId, 'data-interaction', isSelected ? 'none' : type.id)}
                            className={`p-[0.8vw] rounded-[0.6vw] border cursor-pointer transition-all flex flex-col items-center gap-[0.5vh] group/type ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'bg-gray-50/50 border-gray-100 hover:border-indigo-300 hover:bg-white'}`}
                          >
                            <Icon icon={type.icon} width="1.2vw" className={`${isSelected ? 'text-indigo-600' : 'text-gray-400 group-hover/type:text-indigo-400'}`} />
                            <span className={`text-[0.7vw] font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-600 group-hover/type:text-indigo-600'}`}>{type.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {selectedElementProps?.['data-interaction'] && selectedElementProps['data-interaction'] !== 'none' && (
                      <div className="mt-[1vw] space-y-[0.8vw] animate-in slide-in-from-top-2 duration-300">
                         <div className="flex flex-col gap-[0.5vh]">
                            <span className="text-[0.65vw] font-bold text-gray-500 uppercase tracking-tight">
                               {selectedElementProps['data-interaction'] === 'link' ? 'URL / Address' : 'Message Content'}
                            </span>
                            <div className="relative">
                               <input 
                                  type="text"
                                  placeholder={selectedElementProps['data-interaction'] === 'link' ? 'https://google.com' : 'Enter message...'}
                                  value={selectedElementProps['data-interaction-value'] || ''}
                                  onChange={(e) => updateElementAttribute(activePageIndex, selectedLayerId, 'data-interaction-value', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-[0.5vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                               />
                               <Icon 
                                  icon={selectedElementProps['data-interaction'] === 'link' ? 'lucide:globe' : 'lucide:message-square'} 
                                  className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-300"
                                  width="1vw"
                               />
                            </div>
                         </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-[1.5vh]">
              <div className="flex items-center gap-[0.75vw]">
                <span className="text-[0.75vw] font-bold text-gray-400 whitespace-nowrap tracking-widest uppercase">Triggers</span>
                <div className="h-[0.1vw] flex-1 bg-gray-100"></div>
              </div>
              {['On Click'].map(trigger => (
                <div key={trigger} className="flex items-center justify-between p-[0.8vw] bg-white border border-indigo-500/20 rounded-[0.6vw] shadow-sm cursor-default">
                  <span className="text-[0.8vw] font-bold text-indigo-700">{trigger}</span>
                  <div className="w-[1.4vw] h-[1.4vw] rounded-full bg-indigo-50 flex items-center justify-center">
                    <Icon icon="lucide:check" width="0.8vw" className="text-indigo-600" />
                  </div>
                </div>
              ))}
              <div className="text-[0.65vw] text-gray-400 text-center italic mt-[0.5vh]">More triggers coming soon</div>
            </div>
          </div>
        ) : (
          /* Animation Mode */
          <div className="flex-1 flex flex-col p-[1.5vw] gap-[2.5vw] overflow-y-auto no-scrollbar">
            <div className="flex flex-col gap-[1.5vh]">
              <div className="flex items-center gap-[0.75vw]">
                <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider uppercase">Animation Effects</span>
                <div className="h-[0.1vw] flex-1 bg-purple-100"></div>
              </div>
              <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm flex flex-col gap-[1.5vh]">
                <div className="text-[0.7vw] text-gray-400 font-medium italic">Add motion presets to breathe life into your page.</div>
                
                {!selectedLayerId ? (
                   <div className="p-[1vw] text-center text-[0.75vw] text-gray-400 font-medium bg-gray-50 rounded-[0.6vw] border border-dashed">
                      Select an element to add animations
                   </div>
                ) : (
                  <div className="space-y-[1vh]">
                    {[
                      { id: 'fade-in', label: 'Fade In', desc: 'Smooth opacity transition' },
                      { id: 'slide-up', label: 'Slide Up', desc: 'Entrance from bottom' },
                      { id: 'zoom-in', label: 'Zoom In', desc: 'Scale from center' },
                      { id: 'bounce-in', label: 'Bounce', desc: 'Playful entry effect' }
                    ].map(anim => {
                      const isSelected = selectedElementProps?.['data-animation-open-type'] === anim.id;
                      return (
                        <div 
                          key={anim.id} 
                          onClick={() => updateElementAttribute(activePageIndex, selectedLayerId, 'data-animation-open-type', isSelected ? 'none' : anim.id)}
                          className={`flex items-center justify-between p-[0.7vw] rounded-[0.6vw] border transition-all cursor-pointer group/anim ${isSelected ? 'border-purple-500 bg-purple-50 shadow-sm' : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-md hover:border-purple-300'}`}
                        >
                          <div className="flex items-center gap-[0.8vw]">
                            <div className={`w-[1.8vw] h-[1.8vw] rounded-full flex items-center justify-center shadow-sm transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-white text-gray-400 group-hover/anim:text-purple-600'}`}>
                              <Icon icon="mdi:motion-play-outline" width="1vw" />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[0.75vw] font-bold ${isSelected ? 'text-purple-900' : 'text-gray-700 group-hover/anim:text-purple-900'}`}>{anim.label}</span>
                              <span className="text-[0.6vw] text-gray-400">{anim.desc}</span>
                            </div>
                          </div>
                          {isSelected && <Icon icon="lucide:check" width="1vw" className="text-purple-600" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {selectedLayerId && selectedElementProps?.['data-animation-open-type'] && selectedElementProps['data-animation-open-type'] !== 'none' && (
               <div className="flex flex-col gap-[1.5vh] animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-[0.7vw]">
                     <span className="text-[0.75vw] font-bold text-gray-400 tracking-widest uppercase">Presets Tuning</span>
                     <div className="h-[0.1vw] flex-1 bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-[1vw]">
                     <div className="flex flex-col gap-[0.5vh]">
                       <span className="text-[0.65vw] font-bold text-gray-500">Duration (s)</span>
                       <input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          value={selectedElementProps?.['data-animation-open-duration'] || 0.5}
                          onChange={(e) => updateElementAttribute(activePageIndex, selectedLayerId, 'data-animation-open-duration', e.target.value)}
                          className="bg-gray-100 rounded-[0.4vw] px-[0.6vw] py-[0.3vw] text-[0.75vw] font-semibold text-gray-700 outline-none focus:bg-purple-50 focus:ring-1 focus:ring-purple-200"
                       />
                     </div>
                     <div className="flex flex-col gap-[0.5vh]">
                       <span className="text-[0.65vw] font-bold text-gray-500">Delay (s)</span>
                       <input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          value={selectedElementProps?.['data-animation-open-delay'] || 0}
                          onChange={(e) => updateElementAttribute(activePageIndex, selectedLayerId, 'data-animation-open-delay', e.target.value)}
                          className="bg-gray-100 rounded-[0.4vw] px-[0.6vw] py-[0.3vw] text-[0.75vw] font-semibold text-gray-700 outline-none focus:bg-purple-50 focus:ring-1 focus:ring-purple-200"
                       />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-[1vw]">
                     <div className="flex flex-col gap-[0.5vh]">
                       <span className="text-[0.65vw] font-bold text-gray-500">Speed (x)</span>
                       <input 
                          type="number" 
                          step="0.1" 
                          min="0.1"
                          max="5"
                          value={selectedElementProps?.['data-animation-open-speed'] || 1}
                          onChange={(e) => updateElementAttribute(activePageIndex, selectedLayerId, 'data-animation-open-speed', e.target.value)}
                          className="bg-gray-100 rounded-[0.4vw] px-[0.6vw] py-[0.3vw] text-[0.75vw] font-semibold text-gray-700 outline-none focus:bg-purple-50 focus:ring-1 focus:ring-purple-200"
                       />
                     </div>
                     <div className="flex flex-col gap-[0.5vh] justify-end">
                       <button 
                          onClick={() => updateElementAttribute(activePageIndex, selectedLayerId, 'data-animation-open-every-visit', selectedElementProps?.['data-animation-open-every-visit'] === 'false' ? 'true' : 'false')}
                          className={`flex items-center justify-between px-[0.6vw] py-[0.3vw] rounded-[0.4vw] border transition-all ${selectedElementProps?.['data-animation-open-every-visit'] !== 'false' ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                       >
                          <span className="text-[0.65vw] font-bold">Every Visit</span>
                          <Icon icon={selectedElementProps?.['data-animation-open-every-visit'] !== 'false' ? 'lucide:check-circle-2' : 'lucide:circle'} width="0.8vw" />
                       </button>
                     </div>
                  </div>

                  <div className="mt-[0.5vh] p-[0.8vw] bg-purple-50/50 border border-purple-100 rounded-[0.6vw]">
                     <div className="flex items-center justify-between">
                        <span className="text-[0.7vw] font-bold text-purple-700">Trigger</span>
                        <span className="text-[0.7vw] font-medium text-purple-600 bg-white px-[0.4vw] py-[0.1vw] rounded shadow-sm">While Opening</span>
                     </div>
                  </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
