import React, { useState, useRef, useEffect } from 'react';
import { SquarePlay, Image as ImageIcon, CloudUpload, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import ShapeProperties from './ShapeProperties';
import ImageEditor from './ImageEditor';
import TextEditor from './TextEditor';
import IconGallery from './icons';
import VideoEditor from './VideoEditor';
import GifEditor from './Gif';
import AnimationPanel from './AnimationPanel';
import InteractionPanel from './InteractionPanel';
import PopupTemplateSelection from './PopupTemplateSelection';
import Model3DEditor from './Model3DEditor';


const RightSidebar = ({ 
  isDoublePage, 
  setIsDoublePage, 
  activeMainTool,
  setActiveMainTool,
  activeTopTool,
  activePageIndex,
  pages,
  setPages,
  updatePageBackground,
  selectedLayerId,
  updateElementAttribute,
  deleteLayer,
  onPreview,
  activePreviewDevice: activePreviewDeviceProp,
  setActivePreviewDevice: setActivePreviewDeviceProp,
  flipbookDimensions = { width: 210, height: 297 },
  isPopupEditor = false,
  onCustomizePopup,
  onApplyPopupChanges,
  onCancelPopupChanges,
  is3DModalOpen, 
  setIs3DModalOpen,
  preview3DDataUrl,
  setCurrent3DItem,
  shadowStrength, setShadowStrength,
  shadowSoftness, setShadowSoftness,
  autoRotate, setAutoRotate,
  autoRotateSpeed, setAutoRotateSpeed,
  lockMaxZoom, setLockMaxZoom,
  maxZoom, setMaxZoom,
  bgType, setBgType,
  bgColor, setBgColor,
  customBg, setCustomBg,
    enableAR, setEnableAR,
  qrText, setQrText, qrColor, setQrColor, qrBgType, setQrBgType, qrBgColor, setQrBgColor, qrLevel, setQrLevel, qrDotType, setQrDotType, qrCornerSquareType, setQrCornerSquareType, qrCornerDotType, setQrCornerDotType, qrLogo, setQrLogo,
  topText, setTopText, bottomText, setBottomText
}) => {
  const isPdfProject = pages.some(p => p.html && p.html.includes('data-name="PDF Background"'));
  const { width: baseWidth, height: baseHeight } = flipbookDimensions;
  // Convert mm to pixels at 96 DPI for the input display if no element selected
  const baseWidthPx = Math.round(baseWidth * 96 / 25.4);
  const baseHeightPx = Math.round(baseHeight * 96 / 25.4);
  const fileInputRef = useRef(null);
  const [activePreviewDevice, setActivePreviewDevice] = useState(localStorage.getItem('previewDevice') || 'Desktop');
  const [dimensionUnit, setDimensionUnit] = useState('px');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const unitRef = useRef(null);
  const [expandedInteraction, setExpandedInteraction] = useState('call-click');
  const [interactionTab, setInteractionTab] = useState('Call');
  const [isInteractionMenuOpen, setIsInteractionMenuOpen] = useState(false);
  const interactionMenuRef = useRef(null);

  const convertValue = (mmValue) => {
     const val = parseFloat(mmValue || 0);
     if (dimensionUnit === 'px') return Math.round(val * 96 / 25.4);
     if (dimensionUnit === 'cm') return (val / 10).toFixed(2);
     return Math.round(val); // mm
  };

  // Close unit dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (unitRef.current && !unitRef.current.contains(e.target)) {
        setIsUnitDropdownOpen(false);
      }
      if (interactionMenuRef.current && !interactionMenuRef.current.contains(e.target)) {
        setIsInteractionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif';
    const isSvg = file.type === 'image/svg+xml';

    if (isVideo) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const videoUrl = event.target.result;
        window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
          detail: { videoUrl, pageIndex: activePageIndex, file }
        }));
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;

      let finalUrl = dataUrl;
      // Skip compression for GIFs and SVGs to preserve animation/vector quality
      if (!isGif && !isSvg) {
        finalUrl = await compressImage(dataUrl);
      }

      // Dispatch event to MainEditor
      window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
        detail: { 
          dataUrl: finalUrl, 
          pageIndex: activePageIndex,
          dataType: isGif ? 'gif' : (isSvg ? 'svg' : 'image')
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
        const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
        const actualEl = editorDoc.getElementById(selectedLayerId);
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
          w: parseFloat(w),
          h: parseFloat(h),
          x: parseFloat(x),
          y: parseFloat(y),
          r: parseFloat(r),
          isGradient: fillStyle?.includes('url(#')
        };

        // Extract all custom attributes (gradients, etc.)
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('fill-') || attr.name.startsWith('stroke-') || attr.name.startsWith('data-') || attr.name === 'href' || attr.name.includes('href')) {
            props[attr.name] = attr.value;
          }
        });

        // Add a flag for image detection
        const dataType = el.getAttribute('data-type');
        const dataName = el.getAttribute('data-name');
        const fillValue = el.getAttribute('fill') || '';
        
        // Detect if it's a shape filled with a pattern containing an image
        let isPatternImage = false;
        if (fillValue.startsWith('url(#')) {
            const patternId = fillValue.match(/url\(#([^)]+)\)/)?.[1];
            if (patternId) {
                // Try finding the pattern in the document
                const pattern = doc.getElementById(patternId) || doc.querySelector(`pattern[id="${patternId}"], [id="${patternId}"]`);
                if (pattern) {
                    // Templates often use <use xlink:href="#imageId"> inside <pattern>
                    const hasUse = pattern.querySelector('use') !== null;
                    const hasImage = pattern.querySelector('image, img') !== null;
                    if (hasImage || hasUse) {
                        isPatternImage = true;
                    }
                }
            }
        }
        
        // Check if it's an image or a group containing an image (very common in templates)
        const hasImageChild = el.querySelector('image, img') !== null;
        const lowerTagName = props.tagName.toLowerCase();
        const lowerId = selectedLayerId?.toLowerCase() || '';
        const lowerDataName = dataName?.toLowerCase() || '';
        const src = el.getAttribute('href') || el.getAttribute('xlink:href') || el.getAttribute('src') || '';
        const isGifFile = src.toLowerCase().endsWith('.gif') || dataType === 'gif';

        const isPdfBackground = lowerDataName.includes('pdf background') || lowerId.includes('background') || dataType === 'pdf-background';
        
        const isImage = (lowerTagName.includes('image') || 
                        lowerTagName === 'img' || 
                        dataType === 'image' ||
                        lowerDataName.includes('image') ||
                        lowerId.includes('image') || 
                        !!(el.getAttribute('href') || el.getAttribute('xlink:href')) ||
                        (lowerTagName === 'g' && hasImageChild) ||
                        isPatternImage) && !isGifFile && !isPdfBackground;

        const isVideo = lowerTagName === 'video' || lowerTagName === 'iframe' || dataType === 'video' || lowerDataName.includes('video') || lowerId.includes('video') || (lowerTagName === 'foreignobject' && el.querySelector('video, iframe'));
        const isGif = isGifFile || lowerDataName.includes('gif') || lowerId.includes('gif');
        const isText = (lowerTagName === 'text' || lowerTagName === 'tspan' || (lowerTagName === 'foreignobject' && !isVideo)) || dataType === 'text' || lowerDataName.includes('text') || lowerId.includes('text');
        const isIcon = dataType === 'icon' || lowerDataName.includes('icon') || lowerId.includes('icon') || lowerTagName.includes('lucide') || el.classList.contains('lucide') || el.classList.contains('iconify');

        props.isImage = isImage;
        props.isText = isText;
        props.isVideo = isVideo;
        props.isGif = isGif;
        props.isIcon = isIcon;
        props.isPdfBackground = isPdfBackground;

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
      {activeMainTool === 'grid' && (
        <IconGallery 
          isOpen={true}
          onClose={() => setActiveMainTool('select')} 
          onSelect={(icon) => {
            window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
              detail: {
                pageIndex: activePageIndex,
                icon: icon
              }
            }));
          }}
        />
      )}
      {/* ================= Popup Apply/Cancel Banner ================= */}
      {isPopupEditor && (
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-[1.5vw] flex items-center justify-between" style={{ height: '8.5vh' }}>
          <span className="text-[0.75vw] text-gray-500 font-medium flex items-center gap-[0.2vw]">
            Click <span className="text-[#22C55E] font-bold text-[0.8vw] mx-[0.1vw]">(✓)</span> to apply changes
          </span>
          <div className="flex items-center gap-[0.5vw]">
            <button
              onClick={onApplyPopupChanges}
              className="flex items-center justify-center w-[2vw] h-[2vw] bg-[#22C55E] hover:bg-[#16a34a] text-white rounded-[0.4vw] transition-colors shadow-sm cursor-pointer"
              title="Apply Changes"
            >
              <Icon icon="lucide:check" width="1.1vw" strokeWidth={3} />
            </button>
            <button
              onClick={onCancelPopupChanges}
              className="flex items-center justify-center w-[2vw] h-[2vw] bg-white border border-[#EF4444] hover:bg-red-50 text-[#EF4444] rounded-[0.4vw] transition-colors shadow-sm cursor-pointer"
              title="Cancel"
            >
              <Icon icon="lucide:x" width="1.1vw" />
            </button>
          </div>
        </div>
      )}
      {/* ================= Display Controls (Header Section) ================= */}
      {!isPopupEditor && !is3DModalOpen && (
      <div className="border-b border-gray-100 bg-gray-50 flex-shrink-0 flex flex-col justify-center px-[1.5vw] space-y-[0.5vh]" style={{ height: '8.5vh' }}>
         {/* Double Page Toggle Row */}
          <div className="flex items-center">
            {!isPdfProject && (
              <div className="flex items-center gap-[0.6vw]">
                  <div 
                     onClick={() => setIsDoublePage(!isDoublePage)}
                     className={`w-[2.6vw] h-[1.4vw] rounded-full relative cursor-pointer transition-colors duration-300 ${isDoublePage ? 'bg-[#5145F6]' : 'bg-gray-200'} border-[0.1vw] border-transparent scale-90`}
                  >
                     <div className={`absolute top-[0.1vw] w-[1.1vw] h-[1.1vw] bg-white rounded-full transition-all duration-300 shadow-sm ${isDoublePage ? 'left-[1.3vw]' : 'left-[0.1vw]'}`}></div>
                  </div>
                  <span className="text-gray-700 font-medium text-[0.8vw]">Double Page</span>
              </div>
            )}
         </div>
      </div>
      )}

      {/* Persistent Dimension Section (Common for all) */}
      {activeTopTool === 'editor' && !is3DModalOpen && (
        <div className="bg-[#f6f6f6] px-[1.5vw] py-[0.8vw] border-b border-gray-100 flex-shrink-0">
          <div className="space-y-[0.8vw]">
            <div className="flex items-center gap-[0.4vw]">
               <div className="relative" ref={unitRef}>
                  <div 
                     onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                     className="flex items-center gap-[0.3vw] cursor-pointer rounded-[0.3vw] transition-colors"
                  >
                     <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Dimension in {dimensionUnit}</span>
                     <Icon icon="lucide:chevron-down" className={`transition-transform duration-200 ${isUnitDropdownOpen ? 'rotate-180' : ''}`} width="0.8vw" />
                  </div>
                  
                  {isUnitDropdownOpen && (
                     <div className="absolute top-full left-0 mt-[0.2vw] bg-white border border-gray-100 shadow-xl rounded-[0.5vw] py-[0.3vw] z-50 w-[5vw]">
                        {['px', 'mm', 'cm'].map(u => (
                           <div 
                              key={u}
                              onClick={() => {
                                 setDimensionUnit(u);
                                 setIsUnitDropdownOpen(false);
                               }}
                               className={`px-[0.8vw] py-[0.4vw] text-[0.75vw] font-semibold cursor-pointer transition-colors ${dimensionUnit === u ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                               {u}
                            </div>
                         ))}
                      </div>
                   )}
                </div>
                <div className="h-px flex-grow bg-gray-200"></div>
             </div>

            <div className="flex items-center justify-center gap-[3vw]">
               {/* Width */}
                <div className="flex items-center gap-[0.4vw]">
                   <span className="text-[0.85vw] font-medium text-gray-700 whitespace-nowrap">W :</span>
                   <div className="flex items-center gap-[0.1vw]">
                      {selectedElementProps && !selectedElementProps.isPdfBackground && (
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
                      )}
                      <div className={`w-[3.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center justify-center shadow-sm ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'bg-gray-100' : 'bg-white'}`}>
                         <input 
                            key={`w-${dimensionUnit}`}
                            className={`w-full text-center bg-transparent outline-none text-[0.85vw] font-semibold ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'text-gray-400 cursor-not-allowed' : 'text-[#111827]'}`}
                            value={convertValue(selectedElementProps?.w || flipbookDimensions.width)}
                            readOnly={!selectedElementProps || selectedElementProps.isPdfBackground}
                            onChange={(e) => {
                               if (!selectedElementProps) return;
                               const tag = selectedElementProps.tagName;
                               const attr = tag === 'circle' ? 'r' : 'width';
                               const finalVal = tag === 'circle' ? (parseFloat(e.target.value)/2).toString() : e.target.value;
                               updateElementAttribute(activePageIndex, selectedLayerId, attr, finalVal);
                            }}
                         />
                      </div>
                      {selectedElementProps && !selectedElementProps.isPdfBackground && (
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
                      )}
                   </div>
                </div>

               {/* Height */}
               <div className="flex items-center gap-[0.4vw]">
                   <span className="text-[0.85vw] font-medium text-gray-700 whitespace-nowrap">H :</span>
                   <div className="flex items-center gap-[0.1vw]">
                      {selectedElementProps && !selectedElementProps.isPdfBackground && (
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
                      )}
                      <div className={`w-[3.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center justify-center shadow-sm ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'bg-gray-100' : 'bg-white'}`}>
                         <input 
                            key={`h-${dimensionUnit}`}
                            className={`w-full text-center bg-transparent outline-none text-[0.85vw] font-semibold ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'text-gray-400 cursor-not-allowed' : 'text-[#111827]'}`}
                            value={convertValue(selectedElementProps?.h || flipbookDimensions.height)}
                            readOnly={!selectedElementProps || selectedElementProps.isPdfBackground}
                            onChange={(e) => {
                               if (!selectedElementProps) return;
                               const tag = selectedElementProps.tagName;
                               const attr = tag === 'circle' ? 'r' : 'height';
                               const finalVal = tag === 'circle' ? (parseFloat(e.target.value)/2).toString() : e.target.value;
                               updateElementAttribute(activePageIndex, selectedLayerId, attr, finalVal);
                            }}
                         />
                      </div>
                      {selectedElementProps && !selectedElementProps.isPdfBackground && (
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
                      )}
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
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*,audio/*,.gif,.svg" 
                    onChange={handleFileChange} 
                  />
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
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
              {is3DModalOpen ? (
                <div className="p-[1.5vw]">
                  <Model3DEditor
                    onClose={() => setIs3DModalOpen(false)}
                    shadowStrength={shadowStrength} setShadowStrength={setShadowStrength}
                    shadowSoftness={shadowSoftness} setShadowSoftness={setShadowSoftness}
                    autoRotate={autoRotate} setAutoRotate={setAutoRotate}
                    autoRotateSpeed={autoRotateSpeed} setAutoRotateSpeed={setAutoRotateSpeed}
                    lockMaxZoom={lockMaxZoom} setLockMaxZoom={setLockMaxZoom}
                    maxZoom={maxZoom} setMaxZoom={setMaxZoom}
                    bgType={bgType} setBgType={setBgType}
                    bgColor={bgColor} setBgColor={setBgColor}
                    customBg={customBg} setCustomBg={setCustomBg}
                    enableAR={enableAR} setEnableAR={setEnableAR}
                    qrText={qrText} setQrText={setQrText} qrColor={qrColor} setQrColor={setQrColor} qrBgType={qrBgType} setQrBgType={setQrBgType} qrBgColor={qrBgColor} setQrBgColor={setQrBgColor} qrLevel={qrLevel} setQrLevel={setQrLevel} qrDotType={qrDotType} setQrDotType={setQrDotType} qrCornerSquareType={qrCornerSquareType} setQrCornerSquareType={setQrCornerSquareType} qrCornerDotType={qrCornerDotType} setQrCornerDotType={setQrCornerDotType} qrLogo={qrLogo} setQrLogo={setQrLogo}
                    topText={topText} setTopText={setTopText} bottomText={bottomText} setBottomText={setBottomText}
                    dataUrl={preview3DDataUrl}
                  />
                </div>
              ) : isPdfProject ? (
                <InteractionPanel 
                  selectedElementProps={selectedElementProps}
                  activePageIndex={activePageIndex}
                  selectedLayerId={selectedLayerId}
                  updateElementAttribute={updateElementAttribute}
                  deleteLayer={deleteLayer}
                  pages={pages}
                  flipbookDimensions={flipbookDimensions}
                  onCustomizePopup={onCustomizePopup}
                  setIs3DModalOpen={setIs3DModalOpen}
                  setCurrent3DItem={setCurrent3DItem}
                />
              ) : (
                <div className="flex flex-col p-[1.5vw] gap-[1.5vw]">
                  {(selectedElementProps || activeMainTool === 'grid') ? (
                    <div className="flex flex-col gap-[1.5vw]">
                      {selectedElementProps?.isImage ? (
                        <ImageEditor 
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          onUpdate={(newHtml) => {
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
                              const svgRoot = pageContainer?.querySelector('svg') || (() => {
                                const el = document.getElementById(selectedLayerId);
                                let node = el;
                                while (node && node.tagName?.toLowerCase() !== 'svg') node = node.parentElement;
                                return node;
                              })();
                              if (svgRoot) {
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(svgRoot);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          currentPageVId={pages[activePageIndex]?.v_id || pages[activePageIndex]?.id || ''}
                          folderName="My Flipbooks"
                          flipbookName="Untitled"
                        />
                      ) : selectedElementProps?.isText ? (
                        <TextEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            const el = editorDoc.getElementById(selectedLayerId);
                            if (!el) return null;
                            const tag = el.tagName?.toLowerCase();
                            // foreignObject wraps the actual HTML text container — drill into it
                            if (tag === 'foreignobject') {
                              return el.querySelector('[contenteditable], div, p, span') || el;
                            }
                            return el;
                          })()}
                          onUpdate={(newHtml) => {
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
                              const svgRoot = pageContainer?.querySelector('svg') || (() => {
                                const el = document.getElementById(selectedLayerId);
                                let node = el;
                                while (node && node.tagName?.toLowerCase() !== 'svg') node = node.parentElement;
                                return node;
                              })();
                              if (svgRoot) {
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(svgRoot);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex);
                              }
                            }
                          }}
                          pages={pages}
                          setPages={setPages}
                          activePageIndex={activePageIndex}
                        />
                      ) : selectedElementProps?.isVideo ? (
                        <VideoEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          onUpdate={(newHtml) => {
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
                              const svgRoot = pageContainer?.querySelector('svg') || (() => {
                                const el = document.getElementById(selectedLayerId);
                                let node = el;
                                while (node && node.tagName?.toLowerCase() !== 'svg') node = node.parentElement;
                                return node;
                              })();
                              if (svgRoot) {
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(svgRoot);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          currentPageVId={pages[activePageIndex]?.v_id || pages[activePageIndex]?.id || ''}
                          folderName="My Flipbooks"
                          flipbookName="Untitled"
                        />
                      ) : selectedElementProps?.isGif ? (
                        <GifEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          onUpdate={(newHtml) => {
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
                              const svgRoot = pageContainer?.querySelector('svg') || (() => {
                                const el = document.getElementById(selectedLayerId);
                                let node = el;
                                while (node && node.tagName?.toLowerCase() !== 'svg') node = node.parentElement;
                                return node;
                              })();
                              if (svgRoot) {
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(svgRoot);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          activePageIndex={activePageIndex}
                        />
                      ) : (
                        <ShapeProperties 
                           selectedElementProps={selectedElementProps || { 
                             fill: '#6366F1', 
                             opacity: '1', 
                             stroke: 'none', 
                             strokeWidth: '0', 
                             tagName: 'g',
                             isIcon: true 
                           }}
                           activePageIndex={activePageIndex}
                           selectedLayerId={selectedLayerId}
                           updateElementAttribute={updateElementAttribute}
                         />
                      )}
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
                                <span className="text-gray-900 font-semibold">Custom Sheet</span>
                              </div>
                              <div className="flex justify-between items-center text-[0.75vw]">
                                <span className="text-gray-500 font-medium">Dimensions</span>
                                <span className="text-gray-900 font-semibold">{Math.round(baseWidth)} x {Math.round(baseHeight)} mm</span>
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
          )
        ) : activeTopTool === 'interaction' ? (
          <InteractionPanel 
            selectedElementProps={selectedElementProps}
            activePageIndex={activePageIndex}
            selectedLayerId={selectedLayerId}
            updateElementAttribute={updateElementAttribute}
            deleteLayer={deleteLayer}
            pages={pages}
            flipbookDimensions={flipbookDimensions}
            onCustomizePopup={onCustomizePopup}
          />

        ) : (
          /* Animation Mode */
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-[1.5vw]">
            <AnimationPanel 
               selectedElement={(() => {
                 if (!selectedLayerId) return null;
                 const container = document.querySelector(`.page-svg-container [id="${selectedLayerId}"]`);
                 if (container) return container;
                 return document.getElementById(selectedLayerId) || null;
               })()}
               onUpdate={(elementId, attr, value) => {
                  if (elementId && attr) {
                      updateElementAttribute(activePageIndex, elementId, attr, value);
                  }
               }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
