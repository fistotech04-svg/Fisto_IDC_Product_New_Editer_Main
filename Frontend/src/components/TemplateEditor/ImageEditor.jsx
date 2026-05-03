import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {
  Image as ImageIcon,
  Upload,
  Replace,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Link2Off,
  Edit3,
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pipette,
  MousePointerClick,
  Sparkles,
  Repeat,
  ArrowLeft,
  ArrowRight,
  Filter,
  Pencil,
  Search,
  Maximize2,
  Check,
  RotateCcw,
  Minus,
  MoreVertical,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import ColorPicker from './ColorPicker';
import GalleryImage from './GalleryImage';
import SlideshowProperties from './SlideshowProperties';



const handleScrubHelper = (e, initialVal, updateFn, sensitivity = 5) => {
  const sValue = parseFloat(initialVal) || 0;
  let accumulatedDelta = 0;
  let virtualX = e.clientX;
  let virtualY = e.clientY;
  document.body.classList.add('is-scrubbing');
  if (e.pointerId !== undefined) {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  }
  const vCursor = document.createElement('div');
  vCursor.className = 'virtual-scrub-cursor';
  vCursor.style.left = `${virtualX}px`;
  vCursor.style.top = `${virtualY}px`;
  vCursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15L21 12L18 9" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  document.body.appendChild(vCursor);
  const onMouseMove = (moveEvent) => {
    const dx = moveEvent.movementX || 0;
    accumulatedDelta += dx;
    virtualX += dx;
    if (virtualX < 0) virtualX = window.innerWidth;
    if (virtualX > window.innerWidth) virtualX = 0;
    vCursor.style.left = `${virtualX}px`;
    const newVal = sValue + Math.round(accumulatedDelta / sensitivity);
    updateFn(newVal.toString());
  };
  const onMouseUp = (moveEvent) => {
    if (moveEvent.pointerId !== undefined) {
        try { moveEvent.target.releasePointerCapture(moveEvent.pointerId); } catch(e) {}
    }
    if (vCursor.parentNode) vCursor.parentNode.removeChild(vCursor);
    document.body.classList.remove('is-scrubbing');
    window.removeEventListener('pointermove', onMouseMove);
    window.removeEventListener('pointerup', onMouseUp);
  };
  window.addEventListener('pointermove', onMouseMove);
  window.addEventListener('pointerup', onMouseUp);
};

const ColorField = ({ label, color, opacity, onColorChange, onOpacityChange, onPickerToggle }) => (
  <div className="flex items-center gap-[0.4vw] py-[0.4vw]">
     <span className="text-[0.85vw] font-semibold text-gray-700 min-w-[3vw]">{label} :</span>
     <div 
       className="w-[2.5vw] h-[2.5vw] rounded-[0.75vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center" 
     >
        <div 
           onClick={onPickerToggle}
           className="w-full h-full border border-gray-200 cursor-pointer color-field-trigger transition-transform flex-shrink-0"
           style={{ background: (color === 'none' || color === 'transparent' || !color) ? 'white' : color }}
        />
       {(color === 'none' || color === 'transparent' || !color) && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
       )}
     </div>
     
     <div className="flex-grow flex items-center border-[0.1vw] border-gray-400 rounded-[0.75vw] overflow-hidden h-[2.5vw] bg-white hover:border-indigo-400 transition-colors px-[0.7vw]">
       <input
         type="text"
         value={color === 'none' || color === 'transparent' ? '#' : color.toUpperCase()}
         onChange={(e) => {
           const val = e.target.value;
           if (val === '' || val === '#') {
             onColorChange('none');
           } else {
             const finalVal = val.startsWith('#') ? val : '#' + val;
             onColorChange(finalVal);
           }
         }}
         className="flex-grow text-[0.75vw] font-medium rounded-full text-gray-700 outline-none bg-transparent min-w-[3vw] font-mono tracking-tight"
         maxLength={7}
       />
        <div 
          className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
          onPointerDown={(e) => {
             handleScrubHelper(e, opacity, (val) => {
                const clamped = Math.min(Math.max(parseInt(val), 0), 100);
                onOpacityChange(clamped);
             });
          }}
        >
          <span className="text-[0.75vw] font-semibold text-gray-700">{opacity}</span>
          <span className="text-[0.75vw] font-medium text-gray-500">%</span>
        </div>
     </div>
  </div>
);

const ImageCropOverlay = ({ imageSrc, onSave, onCancel, element }) => {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  
  const [crop, setCrop] = useState({ top: 15, left: 15, width: 70, height: 70 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); 
  const [startPos, setStartPos] = useState({ x: 0, y: 0, crop: {} });

  useEffect(() => {
    if (element) {
        const insetAttr = element.getAttribute('data-effect-crop-inset');
        const cp = insetAttr || element.style.clipPath || element.style.webkitClipPath || '';
        if (cp.includes('inset')) {
            const m = cp.match(/inset\(([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\)/);
            if (m) {
                const t = parseFloat(m[1]), r = parseFloat(m[2]), b = parseFloat(m[3]), l = parseFloat(m[4]);
                setCrop({ top: t, left: l, width: Math.max(1, 100 - l - r), height: Math.max(1, 100 - t - b) });
            }
        }
    }
  }, [element]);

  const updateDisplaySize = useCallback(() => {
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
            setDisplaySize({ width: rect.width, height: rect.height });
        }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateDisplaySize, 150);
    window.addEventListener('resize', updateDisplaySize);
    return () => { window.removeEventListener('resize', updateDisplaySize); clearTimeout(timer); };
  }, [updateDisplaySize]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    
    // Check if there's already a saved crop from styles
    const cp = element?.style.clipPath || element?.style.webkitClipPath || '';
    if (!cp.includes('inset')) {
      // Set default 213x213 crop
      // We calculate percentage based on natural dimension
      const wPercent = Math.min(90, (250 / naturalWidth) * 100);
      const hPercent = Math.min(90, (250 / naturalHeight) * 100);
      
      setCrop({
        top: (100 - hPercent) / 2,
        left: (100 - wPercent) / 2,
        width: wPercent,
        height: hPercent
      });
    }

    updateDisplaySize();
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true); setDragType(type);
    setStartPos({ x: e.clientX, y: e.clientY, crop: { ...crop } });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !displaySize.width) return;
    const dx = ((e.clientX - startPos.x) / displaySize.width) * 100;
    const dy = ((e.clientY - startPos.y) / displaySize.height) * 100;
    
    // Image aspect ratio (Width / Height)
    const imgAspect = displaySize.width / displaySize.height;  

    setCrop(prev => {
      let next = { ...prev };
      const MIN_SIZE = 5;

      if (dragType === 'move') {
        next.left = Math.max(0, Math.min(100 - prev.width, startPos.crop.left + dx));
        next.top = Math.max(0, Math.min(100 - prev.height, startPos.crop.top + dy));
      } else {
         const MIN_SIZE = 5;
         let newW = startPos.crop.width;
         let newH = startPos.crop.height;
  
         if (dragType === 'br') {
            newW = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.left, startPos.crop.width + dx));
            newH = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.top, startPos.crop.height + dy));
            next.width = newW;
            next.height = newH;
         } 
         else if (dragType === 'bl') {
             let proposedLeft = Math.max(0, Math.min(startPos.crop.left + startPos.crop.width - MIN_SIZE, startPos.crop.left + dx));
             newW = startPos.crop.width + (startPos.crop.left - proposedLeft);
             newH = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.top, startPos.crop.height + dy));
             next.left = proposedLeft;
             next.width = newW;
             next.height = newH;
         }
         else if (dragType === 'tr') {
             newW = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.left, startPos.crop.width + dx));
             let proposedTop = Math.max(0, Math.min(startPos.crop.top + startPos.crop.height - MIN_SIZE, startPos.crop.top + dy));
             newH = startPos.crop.height + (startPos.crop.top - proposedTop);
             next.top = proposedTop;
             next.width = newW;
             next.height = newH;
         }
         else if (dragType === 'tl') {
             let proposedLeft = Math.max(0, Math.min(startPos.crop.left + startPos.crop.width - MIN_SIZE, startPos.crop.left + dx));
             newW = startPos.crop.width + (startPos.crop.left - proposedLeft);
             let proposedTop = Math.max(0, Math.min(startPos.crop.top + startPos.crop.height - MIN_SIZE, startPos.crop.top + dy));
             newH = startPos.crop.height + (startPos.crop.top - proposedTop);
             next.left = proposedLeft;
             next.top = proposedTop;
             next.width = newW;
             next.height = newH;
         }
      }
      return next;
    });
  }, [isDragging, dragType, startPos, displaySize]);

  useEffect(() => {
    const handleMouseUp = () => { setIsDragging(false); setDragType(null); };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, handleMouseMove]);

  const handleApply = useCallback(() => {
    // 1. Inset for clip-path
    const inset = `inset(${crop.top.toFixed(2)}% ${(100 - crop.left - crop.width).toFixed(2)}% ${(100 - crop.top - crop.height).toFixed(2)}% ${crop.left.toFixed(2)}%)`;
    
    // 2. Zoom logic: How much do we need to scale to make the crop area fill the box?
    const scaleX = 100 / Math.max(1, crop.width);
    const scaleY = 100 / Math.max(1, crop.height);
    
    // 3. Offset to center the crop area
    const offX = 50 - (crop.left + (crop.width / 2));
    const offY = 50 - (crop.top + (crop.height / 2));

    onSave({ inset, scale: `${scaleX}, ${scaleY}`, offX, offY, crop, naturalSize });
  }, [crop, onSave, naturalSize]);

  const currentPixelSize = {
    w: Math.round((crop.width / 100) * naturalSize.width) || 0,
    h: Math.round((crop.height / 100) * naturalSize.height) || 0
  };

  return ReactDOM.createPortal(
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[999999] bg-black/95 flex flex-col items-center justify-center p-6 md:p-12 font-sans select-none animate-in fade-in duration-300 backdrop-blur-sm"
      onMouseDown={(e) => e.target === overlayRef.current && onCancel()}
    >
      <style>{`
        .checkerboard {
            background-image: linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            background-color: #111;
        }
      `}</style>

      <div className="w-full max-w-5xl flex items-center justify-end mb-8 text-white px-4">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-[#333] hover:bg-[#444] transition-all font-semibold text-white/90">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2 rounded-lg bg-[#444] hover:bg-[#555] transition-all font-semibold text-white/90">
             Done
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
        <div 
            ref={containerRef} 
            className="relative inline-block shadow-2xl rounded-lg border border-white/20 bg-black/20"
        >
          <img 
            ref={imageRef} 
            src={imageSrc} 
            onLoad={handleImageLoad} 
            className="max-w-full max-h-[65vh] block opacity-90 transition-opacity duration-500" 
            alt="To crop" 
            draggable={false} 
          />
          
          <div 
            className="absolute z-10 cursor-move border-[2px] border-[#0095FF] border-dashed"
            style={{ 
              top: `${crop.top}%`, 
              left: `${crop.left}%`, 
              width: `${crop.width}%`, 
              height: `${crop.height}%`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)' 
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-[#0095FF] text-white text-[12px] font-bold px-4 py-1.5 rounded-full shadow-2xl whitespace-nowrap z-20 transform hover:scale-110 transition-transform">
              {currentPixelSize.w} × {currentPixelSize.h}
            </div>

            {[
              { id: 'tl', pos: '-top-2.5 -left-2.5 cursor-nwse-resize' },
              { id: 'tr', pos: '-top-2.5 -right-2.5 cursor-nesw-resize' },
              { id: 'bl', pos: '-bottom-2.5 -left-2.5 cursor-nesw-resize' },
              { id: 'br', pos: '-bottom-2.5 -right-2.5 cursor-nwse-resize' }
            ].map(h => (
              <div 
                key={h.id} 
                className={`absolute bg-[#0095FF] w-5 h-5 z-20 border-2 border-white shadow-lg active:scale-125 transition-transform rounded-sm ${h.pos}`} 
                onMouseDown={(e) => handleMouseDown(e, h.id)} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const RadiusBox = ({ corner, value, onChange, radiusStyle }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(0, startValRef.current + Math.round(dx));
      onChange(corner, newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, corner]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value) || 0;
  };

  return (
    <div className={`relative flex items-center bg-white border border-gray-200 ${radiusStyle} w-[6vw] h-[3vw] shadow-sm px-[0.5vw]`}>
        <div className="flex items-center justify-between w-full">
            <button onClick={() => onChange(corner, value - 1)} className="text-gray-300 hover:text-indigo-500 transition-colors p-[0.25vw]"><ChevronLeft size="0.9vw" strokeWidth={1.5} /></button>
            <div onMouseDown={onMouseDown} className="flex-1 h-full flex items-center justify-center cursor-ew-resize">
              <span className="text-[0.8vw] font-bold text-gray-800 select-none block w-full text-center">{value}</span>
            </div>
            <button onClick={() => onChange(corner, value + 1)} className="text-gray-300 hover:text-indigo-500 transition-colors p-[0.25vw]"><ChevronRight size="0.9vw" strokeWidth={1.5} /></button>
        </div>
    </div>
  );
};

const EffectControlRow = ({ label, value, onChange, min = -100, max = 100 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <div className="flex items-center gap-[0.5vw]">
      <span className="text-[0.75vw] text-gray-800 w-[3vw] cursor-ew-resize select-none" onMouseDown={onMouseDown}>{label} :</span>
      <div className="flex items-center gap-[0.25vw]">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-[1vw] h-[2vw] flex items-center justify-center text-gray-500 hover:text-gray-600 transition-colors"><ChevronLeft size="1.1vw" strokeWidth={2} /></button>
        <div onMouseDown={onMouseDown} className="w-[3.75vw] h-[2vw] flex items-center justify-center border border-gray-500 rounded-[0.2vw] text-[0.85vw] text-gray-800 bg-white cursor-ew-resize select-none">
           {value}
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-[1vw] h-[2vw] flex items-center justify-center text-gray-500 hover:text-gray-600 transition-colors"><ChevronRight size="1.1vw" strokeWidth={2} /></button>
      </div>
    </div>
  );
};


const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

const ImageEditor = ({
  selectedElement,
  selectedLayerId,
  activePageIndex,
  onUpdate,
  onPopupPreviewUpdate,
  activePopupElement,
  onPopupUpdate,
  pages,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  // Metadata for uploads
  folderName,
  flipbookName,
  flipbookVId,
  currentPageVId
}) => {
  const fileInputRef = useRef(null);
  const getSvgImageEl = useCallback((el) => {
    if (!el) return null;
    const tag = el.tagName?.toLowerCase();
    
    // 1. Check if the element itself is an image
    if (tag === 'image' || tag === 'img') return el;
    
    // 2. Helper to find image inside a pattern fill
    const findInPattern = (node) => {
        const fill = node.getAttribute?.('fill') || '';
        if (fill?.startsWith('url(#')) {
            const patternId = fill.match(/url\(#([^)]+)\)/)?.[1];
            if (patternId) {
                const doc = node.ownerDocument;
                // Try finding within its own SVG root first (best for templates)
                const ownerSvg = node.closest('svg');
                const pattern = ownerSvg?.querySelector(`[id="${patternId}"]`) || doc?.getElementById(patternId);
                
                if (pattern) {
                    // SVG patterns might have an <image> directly or a <use> pointing to one
                    const img = pattern.querySelector('image');
                    if (img) return img;
                    
                    const useEl = pattern.querySelector('use');
                    if (useEl) {
                        const refId = (useEl.getAttribute('href') || useEl.getAttribute('xlink:href'))?.replace('#', '');
                        if (refId) return doc?.getElementById(refId) || ownerSvg?.querySelector(`[id="${refId}"]`);
                    }
                }
            }
        }
        return null;
    };

    // 3. Check for pattern on the element itself
    const patternTarget = findInPattern(el);
    if (patternTarget) return patternTarget;

    // 4. Search within children (if it's a group)
    const childImg = el.querySelector('image, img');
    if (childImg) return childImg;

    // 5. Check children for patterns
    const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
    for (const child of Array.from(childrenWithPatterns)) {
        const target = findInPattern(child);
        if (target) return target;
    }

    return null;
  }, []);;

  const stateRef = useRef({ 
    imageType: 'Fit', 
    opacity: 100, 
    radius: { tl: 12, tr: 12, br: 12, bl: 12 }, 
    previewSrc: selectedElement?.src || (selectedElement instanceof SVGElement ? (selectedElement.getAttribute('href') || selectedElement.getAttribute('xlink:href')) : ''),
    filters: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
    activeEffects: ['effect']
  });
  const isUpdatingDOM = useRef(false);
  const isUpdatingDOMTimeoutRef = useRef(null);
  const isHydrating = useRef(true);
  const onUpdateTimerRef = useRef(null);
  const lastAppliedIdRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  // Sync the ref on every render
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const [activeSection, setActiveSection] = useState('main');
  const isMainPanelOpen = activeSection === 'main';
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [isRadiusLinked, setIsRadiusLinked] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(() => {
    if (!selectedElement) return '';
    const imgEl = getSvgImageEl(selectedElement);
    return imgEl?.getAttribute?.('href') || imgEl?.getAttribute?.('xlink:href') || imgEl?.src || '';
  });
  const [imageType, setImageType] = useState('Fit');
  const [opacity, setOpacity] = useState(100);
  const [isCropping, setIsCropping] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [radius, setRadius] = useState({ tl: 12, tr: 12, br: 12, bl: 12 });
  const [activeEffects, setActiveEffects] = useState(['effect']);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 8, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 0, y: 0, blur: 10, spread: 0 },
    'Blur': { blur: 5, spread: 0 },
    'Background Blur': { blur: 10, spread: 0 }
  });

  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | null
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  const [backgroundColor, setBackgroundColor] = useState(() => {
    if (!selectedElement) return { fill: '#000000', fillOpacity: 100, stroke: 'transparent', strokeOpacity: 100, strokeType: 'Solid', strokeWeight: 0 };
    const fill = selectedElement.getAttribute('fill') || selectedElement.getAttribute('data-fill-color') || '#000000';
    const stroke = selectedElement.getAttribute('stroke') || selectedElement.getAttribute('data-stroke-color') || 'transparent';
    const strokeW = selectedElement.getAttribute('stroke-width') || '0';
    const dash = selectedElement.getAttribute('stroke-dasharray') || 'none';
    return {
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: Math.round(parseFloat(selectedElement.getAttribute('data-fill-opacity') || selectedElement.getAttribute('fill-opacity') || '1') * 100),
      stroke: stroke === 'none' ? 'transparent' : stroke,
      strokeOpacity: Math.round(parseFloat(selectedElement.getAttribute('data-stroke-opacity') || selectedElement.getAttribute('stroke-opacity') || '1') * 100),
      strokeType: dash === 'none' ? 'Solid' : 'Dashed',
      strokeWeight: parseFloat(strokeW)
    };
  });

  const [isSlideshow, setIsSlideshow] = useState(false);
  const lastElementIdRef = useRef(null);
  const [showTransitionDropdown, setShowTransitionDropdown] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);

  // Memoize static gallery previews
  const galleryPreviews = useMemo(
    () => [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda",
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3",
      "https://images.unsplash.com/photo-1533827432537-70133748f5c8",
      "https://images.unsplash.com/photo-1558981806-ec527fa84f3d",
    ],
    [],
  );
  
  // Ref to prevent persistence for one cycle during hydration
  const shouldSkipPersistence = useRef(false);

  // Hydrate Slideshow State from DOM
  useEffect(() => {
    if (selectedElement) {
      const currentId = selectedElement.id || selectedElement.getAttribute('data-id') || selectedElement.getAttribute('data-v-id');
      
      // Only hydrate if we've actually switched to a DIFFERENT element
      if (currentId !== lastElementIdRef.current) {
        const hasSlideshow = selectedElement.dataset.slideshow || 
                             selectedElement.hasAttribute('data-is-slideshow') || 
                             selectedElement.getAttribute('data-is-slideshow') === 'true';
        setIsSlideshow(!!hasSlideshow);
        lastElementIdRef.current = currentId;
      }
    }
  }, [selectedElement]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openContextMenu !== null && !e.target.closest('.context-menu-container')) {
        setOpenContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openContextMenu]);



  useEffect(() => {
    if (!stateRef.current) stateRef.current = {};
    stateRef.current = { ...stateRef.current, imageType, opacity, radius, previewSrc, filters, activeEffects };
  });



  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedLayerId) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }

    // Resolve the live element from the DOM
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

    if (!liveElement) {
      console.error("Could not resolve live element for upload");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const targetImg = getSvgImageEl(liveElement) || liveElement;

    if (targetImg) {
      if (targetImg.tagName?.toLowerCase() === 'image') {
        targetImg.setAttribute('href', imageUrl);
        try { targetImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl); } catch(e) {}
      } else {
        targetImg.src = imageUrl;
        targetImg.setAttribute('src', imageUrl);
      }
      setPreviewSrc(imageUrl);
      liveElement.removeAttribute('data-original-src');
      liveElement.removeAttribute('data-cropped-src');
      if (onUpdate) onUpdate({ shouldRefresh: true });

      // Upload to Backend
      const storedUser = localStorage.getItem('user');
      if (storedUser && (flipbookVId || (folderName && flipbookName))) {
          const user = JSON.parse(storedUser);
          const formData = new FormData();
          formData.append('emailId', user.emailId);
          if (flipbookVId) formData.append('v_id', flipbookVId);
          if (folderName) formData.append('folderName', folderName);
          if (flipbookName) formData.append('flipbookName', flipbookName);
          
          formData.append('type', 'image');
          formData.append('assetType', 'Image');
          formData.append('page_v_id', currentPageVId || 'global');
          
          const existingFileVid = selectedElement.dataset.fileVid;
          if (existingFileVid) {
              formData.append('replacing_file_v_id', existingFileVid);
          }
          formData.append('file', file);

          try {
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);

              if (res.data.url) {
                  const serverUrl = `${backendUrl}${res.data.url}`;
                  const svgImgSrv = getSvgImageEl(selectedElement);
                  if (svgImgSrv) {
                    svgImgSrv.setAttribute('href', serverUrl);
                    try { svgImgSrv.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', serverUrl); } catch(e) {}
                  } else {
                    selectedElement.src = serverUrl;
                  }
                  selectedElement.dataset.fileVid = res.data.file_v_id;
                  setPreviewSrc(serverUrl);
                  if (onUpdate) onUpdate({ shouldRefresh: true });
              }
          } catch (err) {
              console.error("Image upload failed detail:", err.response?.data || err);
          }
      }
    }
    e.target.value = '';
  };

  const syncStateFromDOM = useCallback((force = false) => {
    if (!selectedElement) return;
    
    // Skip syncing if we are currently pushing changes to the DOM, UNLESS forced (e.g. on new element mount)
    if (isUpdatingDOM.current && !force) return;

    isHydrating.current = true;

    // Detect SVG image element (direct <image>, <g> group, or shape with pattern fill)
    const tagLower = selectedElement.tagName?.toLowerCase();
    const svgImageEl = getSvgImageEl(selectedElement);
    const isSvgEl = !!svgImageEl || (selectedElement instanceof SVGElement && tagLower !== 'svg');

    const currentState = stateRef.current; // Use ref for comparisons to avoid dep circle

    // 1. Sync Opacity
    const rawOpacity = isSvgEl
      ? (selectedElement.getAttribute('data-effect-opacity') ? (parseFloat(selectedElement.getAttribute('data-effect-opacity')) / 100).toString() : (selectedElement.getAttribute('opacity') || selectedElement.style.opacity || '1'))
      : (selectedElement.style.opacity || '1');
    const newOpacity = Math.round(parseFloat(rawOpacity) * 100);
    if (Math.abs(newOpacity - currentState.opacity) > 1) {
        currentState.opacity = newOpacity;
        setOpacity(newOpacity);
    }

    // 2. Sync Radius
    if (isSvgEl) {
        // Prioritize data attributes for radius
        if (selectedElement.hasAttribute('data-effect-radius-tl')) {
            setRadius({
                tl: parseFloat(selectedElement.getAttribute('data-effect-radius-tl') || '0'),
                tr: parseFloat(selectedElement.getAttribute('data-effect-radius-tr') || '0'),
                br: parseFloat(selectedElement.getAttribute('data-effect-radius-br') || '0'),
                bl: parseFloat(selectedElement.getAttribute('data-effect-radius-bl') || '0')
            });
        } else {
            const clipStyle = selectedElement.style.clipPath || svgImageEl?.style.clipPath || '';
            const rxMatch = clipStyle.match(/round\s+([.\d]+)px/);
            const radiusVal = rxMatch ? parseFloat(rxMatch[1]) : 0;
            if (currentState.radius.tl !== radiusVal) {
                setRadius({ tl: radiusVal, tr: radiusVal, br: radiusVal, bl: radiusVal });
            }
        }
    } else {
        const domRadius = selectedElement.style.borderRadius || '0px';
        const rxMatch = domRadius.match(/([.\d]+)px/);
        const radiusVal = rxMatch ? parseFloat(rxMatch[1]) : 0;
        if (currentState.radius.tl !== radiusVal) {
            setRadius({ tl: radiusVal, tr: radiusVal, br: radiusVal, bl: radiusVal });
        }
    }

    // 3. Sync Image Type
    const currentHref = svgImageEl
      ? (svgImageEl.getAttribute('href') || svgImageEl.getAttribute('xlink:href') || '')
      : '';
    const currentImgSrc = !isSvgEl ? (selectedElement.getAttribute('src') || '') : '';
    const isCroppedSrc = !!(selectedElement.getAttribute('data-cropped-src') &&
      (currentHref || currentImgSrc) &&
      selectedElement.getAttribute('data-cropped-src') === (currentHref || currentImgSrc));

    let newType;
    if (isSvgEl) {
        const par = svgImageEl?.getAttribute('preserveAspectRatio') || 'xMidYMid meet';
        if (isCroppedSrc || selectedElement.hasAttribute('data-effect-crop-inset')) {
            newType = 'Crop';
        } else if (par.includes('slice')) {
            newType = 'Fill';
        } else if (par === 'none') {
            newType = 'Stretch';
        } else {
            newType = 'Fit';
        }
    } else {
        const inlineFit = selectedElement.style.objectFit;
        const cp = selectedElement.style.clipPath || selectedElement.style.webkitClipPath || '';
        const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'fill': 'Stretch' };
        const currentFit = inlineFit || window.getComputedStyle(selectedElement).objectFit || 'fill';
        const hasCrop = cp.includes('inset') || isCroppedSrc || selectedElement.hasAttribute('data-effect-crop-inset');
        newType = hasCrop ? 'Crop' : (fitMapRev[currentFit] || 'Stretch');
    }
    if (newType !== currentState.imageType) {
        setImageType(newType);
        currentState.imageType = newType;
    }

    // 4. Sync Src
    const currentSrc = isSvgEl
      ? (svgImageEl?.getAttribute('href') || svgImageEl?.getAttribute('xlink:href') || '')
      : (selectedElement.src || '');
    if (currentSrc !== currentState.previewSrc) {
        currentState.previewSrc = currentSrc;
        setPreviewSrc(currentSrc);
    }

    // 5. Sync Active Effects & Settings
    let newEffects = [];
    if (selectedElement.hasAttribute('data-active-effects')) {
        const attrVal = selectedElement.getAttribute('data-active-effects');
        newEffects = attrVal ? attrVal.split(',').filter(Boolean) : [];
    } else {
        // Fallback to CSS parsing if no data attribute exists (e.g. initial load of legacy templates)
        const filterStr = selectedElement.style.filter || '';
        const backdropStr = selectedElement.style.backdropFilter || selectedElement.style.webkitBackdropFilter || '';
        const overlay = selectedElement.parentElement?.querySelector('.inner-shadow-overlay') || selectedElement.parentElement?.querySelector('.svg-inner-shadow-overlay');
        const shadowStr = selectedElement.style.boxShadow || (overlay ? overlay.style.boxShadow : '') || '';
        
        if (/blur\(\d+px\)/.test(filterStr)) newEffects.push('Blur');
        if (filterStr.includes('drop-shadow') || (selectedElement.parentElement?.style.filter || '').includes('drop-shadow')) newEffects.push('Drop Shadow');
        if (backdropStr.includes('blur')) newEffects.push('Background Blur');
        if (shadowStr.includes('inset') || shadowStr.includes('drop-shadow')) newEffects.push('Inner Shadow');
    }

    // Update active effects state
    const currentRealEffects = currentState.activeEffects.filter(e => e !== 'effect');
    const isSameEffects = newEffects.length === currentRealEffects.length && newEffects.every(e => currentRealEffects.includes(e));
    if (!isSameEffects) {
        const nextEffects = currentState.activeEffects.includes('effect') ? ['effect', ...newEffects] : newEffects;
        setActiveEffects(nextEffects);
        currentState.activeEffects = nextEffects;
    }

    // 6. Sync Settings for each effect
    const newSettings = { ...effectSettings };
    let hasSettingsChange = false;
    Object.keys(newSettings).forEach(name => {
        const prefix = `data-effect-${name.toLowerCase().replace(/ /g, '-')}`;
        Object.keys(newSettings[name]).forEach(key => {
            const attr = `${prefix}-${key}`;
            if (selectedElement.hasAttribute(attr)) {
                const val = selectedElement.getAttribute(attr);
                let finalVal = val;
                if (key !== 'color') finalVal = parseFloat(val);
                if (newSettings[name][key] !== finalVal) {
                    newSettings[name][key] = finalVal;
                    hasSettingsChange = true;
                }
            }
        });
    });
    if (hasSettingsChange) {
        setEffectSettings(newSettings);
    }
    
    // 7. Sync Adjustments (Filters) - Prioritize Data Attributes for Precision
    const newFilters = { ...currentState.filters };
    
    if (selectedElement.hasAttribute('data-effect-exposure')) {
        newFilters.exposure = parseFloat(selectedElement.getAttribute('data-effect-exposure') || '0');
        newFilters.contrast = parseFloat(selectedElement.getAttribute('data-effect-contrast') || '0');
        newFilters.saturation = parseFloat(selectedElement.getAttribute('data-effect-saturation') || '0');
        newFilters.temperature = parseFloat(selectedElement.getAttribute('data-effect-temperature') || '0');
        newFilters.tint = parseFloat(selectedElement.getAttribute('data-effect-tint') || '0');
        newFilters.highlights = parseFloat(selectedElement.getAttribute('data-effect-highlights') || '0');
        newFilters.shadows = parseFloat(selectedElement.getAttribute('data-effect-shadows') || '0');
    } else {
        const filterStr = selectedElement.style.filter || '';
        const getVal = (reg, def = 100) => {
            const m = filterStr.match(reg);
            return m ? Math.round(parseFloat(m[1])) : def;
        };
        newFilters.exposure = getVal(/brightness\((\d+)%\)/) - 100;
        newFilters.contrast = getVal(/contrast\((\d+)%\)/) - 100;
        newFilters.saturation = getVal(/saturate\((\d+)%\)/) - 100;
        newFilters.tint = getVal(/hue-rotate\((-?\d+)deg\)/, 0); 
        if (filterStr.includes('sepia')) {
            newFilters.temperature = getVal(/sepia\((\d+)%\)/, 0) * 2;
        }
    }
    
    const hasFilterChange = Object.keys(newFilters).some(k => newFilters[k] !== currentState.filters[k]);
    if (hasFilterChange) {
        currentState.filters = newFilters;
        setFilters(newFilters);
    }

    setActiveEffects(prev => {
        const currentRealEffects = prev.filter(e => e !== 'effect');
        const isSame = newEffects.length === currentRealEffects.length && newEffects.every(e => currentRealEffects.includes(e));
        if (isSame) return prev;
        return prev.includes('effect') ? ['effect', ...newEffects] : newEffects;
    });

    // 8. Sync Background Color
    const fill = selectedElement.getAttribute('fill') || selectedElement.getAttribute('data-fill-color') || '#000000';
    const stroke = selectedElement.getAttribute('stroke') || selectedElement.getAttribute('data-stroke-color') || 'transparent';
    const fillOp = selectedElement.getAttribute('data-fill-opacity') || selectedElement.getAttribute('fill-opacity') || '1';
    const strokeOp = selectedElement.getAttribute('data-stroke-opacity') || selectedElement.getAttribute('stroke-opacity') || '1';
    const strokeW = selectedElement.getAttribute('stroke-width') || '1';
    const strokeArray = selectedElement.getAttribute('stroke-dasharray') || 'none';

    const newBg = {
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: Math.round(parseFloat(fillOp) * 100),
      stroke: stroke === 'none' ? 'transparent' : stroke,
      strokeOpacity: Math.round(parseFloat(strokeOp) * 100),
      strokeType: strokeArray === 'none' ? 'Solid' : 'Dashed',
      strokeWeight: parseFloat(strokeW)
    };
    
    if (JSON.stringify(newBg) !== JSON.stringify(currentState.backgroundColor)) {
        currentState.backgroundColor = newBg;
        setBackgroundColor(newBg);
    }

    setTimeout(() => { isHydrating.current = false; }, 50);
  }, [selectedElement]); 

  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
        if (isUpdatingDOM.current) return;
        const relevantMutation = mutations.some(m => m.type === 'attributes' && (
          m.attributeName === 'src' || m.attributeName === 'href' ||
          m.attributeName === 'opacity' || m.attributeName === 'style' ||
          m.attributeName === 'data-slideshow' || m.attributeName === 'preserveAspectRatio'
        ));
        if (relevantMutation) syncStateFromDOM();
    });
    observer.observe(selectedElement, { attributes: true, attributeFilter: ['style', 'src', 'href', 'opacity', 'preserveAspectRatio', 'xlink:href'] });
    syncStateFromDOM(true); // Force sync on mount/element change
    return () => {
        observer.disconnect();
        isUpdatingDOM.current = false;
    };
  }, [selectedElement, syncStateFromDOM]);

  const applyVisuals = useCallback(() => {
    // 0. Skip if we are still hydrating state from the DOM to avoid overwriting current values with defaults
    if (isHydrating.current) return;

    // 1. Re-resolve the live element from the active page container to ensure we are 
    // mutating the node that is actually visible in the DOM, skipping stale references.
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || (selectedElement?.isConnected ? selectedElement : null);
    
    if (!liveElement) return;

    // Use stateRef for the most up-to-date value during manual calls from onSave
    const effectiveImageType = stateRef.current.imageType || imageType;

    // Detect SVG image element (direct <image>, <g> group, or shape with pattern fill)
    const tagLower = liveElement.tagName?.toLowerCase();
    const svgImageEl = getSvgImageEl(liveElement);
    const isSvgEl = !!svgImageEl || (liveElement instanceof SVGElement && tagLower !== 'svg');

    // Helper: get current src
    const getSrc = (el) => {
      if (!el) return '';
      const t = el.tagName?.toLowerCase();
      if (t === 'image') return el.getAttribute('href') || el.getAttribute('xlink:href') || '';
      return el.getAttribute('src') || el.src || '';
    };
    // Helper: set src
    const setSrc = (el, src) => {
      if (!el) return;
      const t = el.tagName?.toLowerCase();
      if (t === 'image') {
        el.setAttribute('href', src);
        try { el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', src); } catch(e) {}
      } else {
        el.src = src;
        el.setAttribute('src', src);
      }
    };

    isUpdatingDOM.current = true;
    try {
        // Safe access to filters
        const f = filters || { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 };
        
        // Adjustments: Exposure, Contrast, Saturation, Temperature, Tint, Highlights, Shadows
        const exposure = f.exposure || 0;
        const contrast = f.contrast || 0;
        const saturation = f.saturation || 0;
        const temperature = f.temperature || 0;
        const tint = f.tint || 0;
        const h = f.highlights || 0;
        const s = f.shadows || 0;

        let adjustmentFilters = "";
        adjustmentFilters += `brightness(${100 + exposure + (h/5)}%) `;
        adjustmentFilters += `contrast(${100 + contrast + (s/5)}%) `;
        adjustmentFilters += `saturate(${100 + saturation}%) `;
        if (tint !== 0) adjustmentFilters += `hue-rotate(${tint}deg) `;
        if (temperature > 0) adjustmentFilters += `sepia(${temperature/2}%) `;
        else if (temperature < 0) adjustmentFilters += `hue-rotate(180deg) sepia(${Math.abs(temperature)/2}%) hue-rotate(-180deg) `;

        // Apply adjustments
        if (isSvgEl) {
            liveElement.style.setProperty('filter', adjustmentFilters, 'important');
            liveElement.setAttribute('filter', adjustmentFilters);
            liveElement.setAttribute('data-effect-exposure', exposure.toString());
            liveElement.setAttribute('data-effect-contrast', contrast.toString());
            liveElement.setAttribute('data-effect-saturation', saturation.toString());
            liveElement.setAttribute('data-effect-temperature', temperature.toString());
            liveElement.setAttribute('data-effect-tint', tint.toString());
        } else {
            liveElement.style.setProperty('filter', adjustmentFilters, 'important');
        }

        let effectFilters = "";
        if (activeEffects.includes('Blur')) {
            effectFilters += `blur(${effectSettings['Blur'].blur}px) `;
        }
        
        let shadowFilter = "";
        if (activeEffects.includes('Drop Shadow')) {
            const ds = effectSettings['Drop Shadow'];
            const alpha = Math.round((ds.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = ds.color + (ds.color.length === 7 ? alpha : '');
            // drop-shadow(x y blur color)
            shadowFilter = `drop-shadow(${ds.x}px ${ds.y}px ${ds.blur}px ${colorWithAlpha}) `;
        }

        const totalFilter = (adjustmentFilters + effectFilters + shadowFilter).trim() || 'none';
        const adjustOnlyFilter = (adjustmentFilters + effectFilters).trim() || 'none';
        const shadowOnlyFilter = shadowFilter.trim() || 'none';

        // Apply filters to DOM
        if (isSvgEl) {
            const hasClip = (imageType === 'Crop') || (radius.tl || radius.tr || radius.br || radius.bl);
            
            // 1. Apply Adjustments to the actual image content (leaf)
            if (svgImageEl) {
                svgImageEl.style.setProperty('filter', adjustOnlyFilter, 'important');
            }
            
            // 2. Apply Drop Shadow to a sibling caster (best for SVG with clips)
            let shadowCaster = liveElement.parentElement?.querySelector('.svg-drop-shadow-caster');
            if (shadowOnlyFilter !== 'none' && hasClip) {
                if (!shadowCaster && liveElement.parentElement) {
                    shadowCaster = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    shadowCaster.classList.add('svg-drop-shadow-caster');
                    shadowCaster.style.pointerEvents = 'none';
                    liveElement.parentElement.insertBefore(shadowCaster, liveElement);
                }
                if (shadowCaster) {
                    if (shadowCaster.nextSibling !== liveElement && liveElement.parentElement) {
                        liveElement.parentElement.insertBefore(shadowCaster, liveElement);
                    }
                    shadowCaster.setAttribute('x', liveElement.getAttribute('x') || '0');
                    shadowCaster.setAttribute('y', liveElement.getAttribute('y') || '0');
                    shadowCaster.setAttribute('width', liveElement.getAttribute('width') || '100%');
                    shadowCaster.setAttribute('height', liveElement.getAttribute('height') || '100%');
                    shadowCaster.setAttribute('transform', liveElement.getAttribute('transform') || '');
                    
                    // Fix: Correct fill and opacity for shadow casting. 
                    // Intensity of CSS drop-shadow depends on source alpha; use element's opacity.
                    shadowCaster.setAttribute('fill', 'black');
                    shadowCaster.setAttribute('fill-opacity', (opacity / 100).toString());
                    
                    // Reset attributes to prevent stale state
                    shadowCaster.style.removeProperty('clip-path');
                    shadowCaster.removeAttribute('rx');

                    if (imageType === 'Crop') {
                        // Do not apply clip-path to caster as it would clip the shadow itself.
                    } else {
                        // Match the image's rounding for the shadow shape
                        const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
                        if (maxR > 0) {
                            shadowCaster.setAttribute('rx', maxR.toString());
                        }
                    }

                    shadowCaster.style.setProperty('filter', shadowOnlyFilter, 'important');
                    shadowCaster.style.setProperty('display', 'block', 'important');
                }
            } else if (shadowCaster) {
                shadowCaster.style.setProperty('display', 'none', 'important');
            }

            // 3. Apply geometry-level filters to the selection element itself
            if (!hasClip) {
                liveElement.style.setProperty('filter', totalFilter, 'important');
            } else if (svgImageEl === liveElement) {
                // If the selection element IS the image, keep adjustments but exclude shadow (shadow is in caster)
                liveElement.style.setProperty('filter', adjustOnlyFilter, 'important');
            } else {
                liveElement.style.removeProperty('filter');
            }
            if (liveElement.parentElement) liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
        } else {
            // FOR HTML: Use the full filter on the element
            liveElement.style.setProperty('filter', totalFilter, 'important');
            if (liveElement.parentElement) liveElement.parentElement.style.removeProperty('filter');
        }

        // 2. SVG Attributes (to ensure persistence and high-quality rendering via SVG filters)
        if (isSvgEl) {
            // Remove the native filter attribute during live editing to ensure CSS filter precedence
            liveElement.removeAttribute('filter');
            if (svgImageEl) svgImageEl.removeAttribute('filter');

            // Apply persistent data attributes to the primary selection element (source of truth for sync)
            liveElement.setAttribute('data-effect-exposure', exposure.toString());
            liveElement.setAttribute('data-effect-contrast', contrast.toString());
            liveElement.setAttribute('data-effect-saturation', saturation.toString());
            liveElement.setAttribute('data-effect-temperature', temperature.toString());
            liveElement.setAttribute('data-effect-tint', tint.toString());
            liveElement.setAttribute('data-effect-highlights', h.toString());
            liveElement.setAttribute('data-effect-shadows', s.toString());
            
            // Sync active effects list for the SVG filter generator
            const effectsAttr = activeEffects.filter(e => e !== 'effect').join(',');
            liveElement.setAttribute('data-active-effects', effectsAttr);
            
            // Sync individual effect settings
            Object.entries(effectSettings).forEach(([name, settings]) => {
                const prefix = `data-effect-${name.toLowerCase().replace(/ /g, '-')}`;
                Object.entries(settings).forEach(([key, val]) => {
                    liveElement.setAttribute(`${prefix}-${key}`, val.toString());
                });
            });
        }

        // --- Persist isSlideshow mode so hydration survives onUpdate re-renders ---
        if (isSlideshow) {
            liveElement.setAttribute('data-is-slideshow', 'true');
        } else {
            liveElement.removeAttribute('data-is-slideshow');
        }

        // --- Opacity (works for both; also persist via SVG attribute) ---
        const opacityVal = (opacity / 100).toString();
        liveElement.style.setProperty('opacity', opacityVal, 'important');
        if (isSvgEl) {
            liveElement.setAttribute('opacity', opacityVal);
            liveElement.setAttribute('data-effect-opacity', opacity.toString());
            if (svgImageEl && svgImageEl !== liveElement) svgImageEl.setAttribute('opacity', opacityVal);
        }

        if (isSvgEl) {
            // --- SVG: Image fit via preserveAspectRatio ---
            const parMap = { 'Fit': 'xMidYMid meet', 'Fill': 'xMidYMid slice', 'Crop': 'xMidYMid slice', 'Stretch': 'none' };
            if (svgImageEl) svgImageEl.setAttribute('preserveAspectRatio', parMap[effectiveImageType] || 'xMidYMid meet');

            // --- SVG: Corner radius OR Crop via CSS clip-path inset() ---
            const cropData = {
                inset: liveElement.getAttribute('data-effect-crop-inset'),
                scale: liveElement.getAttribute('data-effect-crop-scale'),
                offX: liveElement.getAttribute('data-effect-crop-offx'),
                offY: liveElement.getAttribute('data-effect-crop-offy')
            };

            const anyR = radius.tl || radius.tr || radius.br || radius.bl;
            const maxR = Math.min(Math.max(...Object.values(radius)), 50);
            const radiusStr = anyR ? ` round ${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '';

            if (effectiveImageType === 'Crop' && cropData.inset) {
                // CRITICAL FIX: SVG and HTML need fundamentally different clip-path strategies for crops.
                // HTML uses the percentage inset to clip the visually scaled element.
                // SVG uses inset(0) on the container to clip the transformed child to the original bounding box.
                const htmlClipVal = cropData.inset.replace(')', radiusStr + ')');
                const svgClipVal = `inset(0${radiusStr})`;
                const clipVal = htmlClipVal; // Restored for persistence attribute compatibility
                
                // The order must be translate() THEN scale() to match the percentage offset math.
                const transformVal = `translate(${cropData.offX}%, ${cropData.offY}%) scale(${cropData.scale})`;
                
                if (svgImageEl && svgImageEl !== liveElement) {
                    // --- SVG PATH ---
                    // 1. Transform the inner image using independent properties to avoid conflict with container positioning
                    svgImageEl.style.setProperty('transform-origin', 'center center', 'important');
                    if (svgImageEl instanceof SVGElement) {
                        svgImageEl.style.setProperty('transform-box', 'fill-box', 'important');
                        // Apply as attributes for best compatibility, but prefer CSS for precision
                        svgImageEl.setAttribute('transform', `translate(${cropData.offX}, ${cropData.offY}) scale(${cropData.scale})`);
                    }
                    svgImageEl.style.setProperty('translate', `${cropData.offX}% ${cropData.offY}%`, 'important');
                    svgImageEl.style.setProperty('scale', cropData.scale.toString(), 'important');
                    svgImageEl.style.setProperty('object-fit', 'cover', 'important');
                    svgImageEl.style.removeProperty('clip-path');
                    svgImageEl.style.removeProperty('border-radius');
                    
                    // 2. Clip the container group to its original unscaled bounding box
                    liveElement.style.setProperty('clip-path', svgClipVal, 'important');
                    if (liveElement instanceof SVGElement) {
                        liveElement.style.setProperty('transform-box', 'fill-box', 'important');
                    }
                    if (anyR) {
                        liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
                    } else {
                        liveElement.style.removeProperty('border-radius');
                    }
                    
                    // 3. DO NOT remove 'transform' from liveElement here as it's handled by the editor
                    // liveElement.style.removeProperty('transform');
                } else {
                    // --- HTML PATH or Unified Element ---
                    // Use translate/scale properties to keep 'transform' free for editor positioning
                    liveElement.style.setProperty('transform-origin', 'center center', 'important');
                    liveElement.style.setProperty('translate', `${cropData.offX}% ${cropData.offY}%`, 'important');
                    liveElement.style.setProperty('scale', cropData.scale.toString(), 'important');
                    liveElement.style.setProperty('clip-path', htmlClipVal, 'important');

                    if (anyR) {
                       liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
                    }
                    
                    if (liveElement.tagName.toUpperCase() === 'IMG' || liveElement.tagName.toUpperCase() === 'IMAGE') {
                        liveElement.style.setProperty('object-fit', 'cover', 'important');
                    }
                }
                
                // Persistence attributes
                liveElement.setAttribute('clip-path', clipVal);
                if (anyR) {
                    liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
                    liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
                    liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
                    liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
                }
            } else {
                // FALLBACK: When not cropping, clear crop transforms and check for Radius
                liveElement.style.removeProperty('transform');
                liveElement.style.removeProperty('transform-origin');
                liveElement.style.removeProperty('transform-box');
                
                if (svgImageEl) {
                    svgImageEl.style.removeProperty('transform');
                    svgImageEl.style.removeProperty('transform-origin');
                    svgImageEl.style.removeProperty('transform-box');
                }

                if (anyR) {
                    // Radius logic
                    const clipVal = `inset(0 round ${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px)`;
                    
                    liveElement.style.setProperty('clip-path', clipVal, 'important');
                    liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
                    if (liveElement instanceof SVGElement) {
                        liveElement.style.setProperty('transform-box', 'fill-box', 'important');
                    }
                    if (liveElement.tagName?.toLowerCase() === 'rect') {
                        liveElement.setAttribute('rx', maxR.toString());
                    }
                    
                    if (svgImageEl && svgImageEl !== liveElement) {
                        // Ensure inner image does not duplicate radius clip
                        svgImageEl.style.removeProperty('clip-path');
                        svgImageEl.style.removeProperty('border-radius');
                    }
                    
                    liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
                    liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
                    liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
                    liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
                } else {
                    liveElement.style.removeProperty('clip-path');
                    liveElement.style.removeProperty('border-radius');
                    liveElement.removeAttribute('clip-path');
                    liveElement.removeAttribute('data-effect-radius-tl');
                    liveElement.removeAttribute('data-effect-radius-tr');
                    liveElement.removeAttribute('data-effect-radius-br');
                    liveElement.removeAttribute('data-effect-radius-bl');
                    if (liveElement.tagName?.toLowerCase() === 'rect') {
                        liveElement.removeAttribute('rx');
                        liveElement.removeAttribute('ry');
                    }
                    if (svgImageEl) {
                        svgImageEl.style.removeProperty('clip-path');
                        svgImageEl.style.removeProperty('border-radius');
                        svgImageEl.removeAttribute('clip-path');
                        if (svgImageEl.tagName?.toLowerCase() === 'rect') {
                            svgImageEl.removeAttribute('rx');
                            svgImageEl.removeAttribute('ry');
                        }
                    }
                }
            }
        } else {
            // --- HTML: Background Blur ---
            if (activeEffects.includes('Background Blur')) {
                const s = effectSettings['Background Blur'];
                const blurVal = `blur(${s.blur}px)`;
                liveElement.style.setProperty('backdrop-filter', blurVal, 'important');
                liveElement.style.setProperty('-webkit-backdrop-filter', blurVal, 'important');
                if (liveElement.src) {
                    liveElement.style.setProperty('mask-image', `url(${liveElement.src})`, 'important');
                    liveElement.style.setProperty('-webkit-mask-image', `url(${liveElement.src})`, 'important');
                    liveElement.style.setProperty('mask-repeat', 'no-repeat', 'important');
                    liveElement.style.setProperty('-webkit-mask-repeat', 'no-repeat', 'important');
                    const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
                    liveElement.style.setProperty('mask-size', fitMap[imageType] || 'fill', 'important');
                    liveElement.style.setProperty('-webkit-mask-size', fitMap[imageType] || 'fill', 'important');
                    liveElement.style.setProperty('mask-position', 'center', 'important');
                    liveElement.style.setProperty('-webkit-mask-position', 'center', 'important');
                }
            } else {
                liveElement.style.setProperty('backdrop-filter', 'none', 'important');
                liveElement.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
                liveElement.style.setProperty('mask-image', 'none', 'important');
                liveElement.style.setProperty('-webkit-mask-image', 'none', 'important');
            }
            // --- HTML: object-fit + Crop Transform ---
            const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
            liveElement.style.setProperty('object-fit', fitMap[effectiveImageType] || 'fill', 'important');
            
            const anyR = radius.tl || radius.tr || radius.br || radius.bl;
            const radiusStr = anyR ? ` round ${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '';

            if (effectiveImageType === 'Crop' && liveElement.getAttribute('data-effect-crop-inset')) {
                // Frame-based Selection Alignment Logic:
                // Instead of scaling the container UP (which explodes the selection box), we've resized the container to the crop size.
                // Now we scale and translate the INNER image to show the right part of the original source.
                
                const isSvg = liveElement instanceof SVGElement;
                const cropData = JSON.parse(liveElement.getAttribute('data-crop-data') || '{"left":0,"top":0,"width":100,"height":100}');
                
                // The inner image needs to be scaled up to match its original size relative to the new smaller frame
                const innerScaleX = 100 / Math.max(0.1, cropData.width);
                const innerScaleY = 100 / Math.max(0.1, cropData.height);
                const innerOffX = - (cropData.left * innerScaleX);
                const innerOffY = - (cropData.top * innerScaleY);

                const srcEl = isSvg ? (getSvgImageEl(liveElement) || liveElement) : liveElement;
                
                if (srcEl === liveElement) {
                   // Fallback for unified elements (like HTML <img>)
                   // CRITICAL: We use 'fill' and 'preserveAspectRatio=none' to ensure the image stretches to the box, avoiding "empty spaces" from aspect ratio gaps
                   liveElement.style.setProperty('object-fit', 'fill', 'important');
                   if (liveElement instanceof SVGElement) {
                       liveElement.setAttribute('preserveAspectRatio', 'none');
                   }
                   liveElement.style.setProperty('translate', `${innerOffX}% ${innerOffY}%`, 'important');
                   liveElement.style.setProperty('scale', `${innerScaleX} ${innerScaleY}`, 'important');
                   liveElement.style.setProperty('clip-path', `inset(0${radiusStr})`, 'important');
                } else {
                   // Cleanly separated container (frame) and content (image)
                   // Container handles selection (bbox) and clipping
                   liveElement.style.setProperty('clip-path', `inset(0${radiusStr})`, 'important');
                   liveElement.style.removeProperty('translate');
                   liveElement.style.removeProperty('scale');
                   
                   // Content handles zoom and offset
                   if (srcEl instanceof SVGElement && srcEl.tagName?.toLowerCase() === 'image') {
                       // CRITICAL FIX FOR SVG: Use attributes instead of CSS transforms for zoom.
                       // This is much more reliable in SVG and avoids percentage/pixel mismatch gaps.
                       const zoomW = visualW * innerScaleX;
                       const zoomH = visualH * innerScaleY;
                       const zoomX = (innerOffX / 100) * zoomW;
                       const zoomY = (innerOffY / 100) * zoomH;
                       
                       srcEl.setAttribute('width', zoomW.toString());
                       srcEl.setAttribute('height', zoomH.toString());
                       srcEl.setAttribute('x', zoomX.toString());
                       srcEl.setAttribute('y', zoomY.toString());
                       srcEl.setAttribute('preserveAspectRatio', 'none');
                       srcEl.style.removeProperty('transform');
                   } else {
                       // Fallback for HTML or complex SVG paths
                       srcEl.style.setProperty('object-fit', 'fill', 'important');
                       srcEl.style.setProperty('transform-origin', '0 0', 'important');
                       srcEl.style.setProperty('transform', `translate(${innerOffX}%, ${innerOffY}%) scale(${innerScaleX}, ${innerScaleY})`, 'important');
                       srcEl.style.setProperty('width', '100%', 'important');
                       srcEl.style.setProperty('height', '100%', 'important');
                   }
                }
            } else {
                // If we were cropped, restore original frame bounds
                if (liveElement.hasAttribute('data-crop-orig-w')) {
                    const isSvg = liveElement instanceof SVGElement;
                    const origW = liveElement.getAttribute('data-crop-orig-w');
                    const origH = liveElement.getAttribute('data-crop-orig-h');
                    const origX = liveElement.getAttribute('data-crop-orig-x');
                    const origY = liveElement.getAttribute('data-crop-orig-y');
                    
                    if (isSvg) {
                        liveElement.setAttribute('width', origW);
                        liveElement.setAttribute('height', origH);
                        liveElement.setAttribute('x', origX);
                        liveElement.setAttribute('y', origY);
                    } else {
                        liveElement.style.width = `${origW}px`;
                        liveElement.style.height = `${origH}px`;
                        liveElement.style.left = `${origX}px`;
                        liveElement.style.top = `${origY}px`;
                    }
                    
                    // Clean up crop metadata
                    liveElement.removeAttribute('data-crop-orig-w');
                    liveElement.removeAttribute('data-crop-orig-h');
                    liveElement.removeAttribute('data-crop-orig-x');
                    liveElement.removeAttribute('data-crop-orig-y');
                    liveElement.removeAttribute('data-crop-data');

                    // Restore SVG aspect ratio preservation
                    const srcEl = isSvg ? (getSvgImageEl(liveElement) || liveElement) : null;
                    if (srcEl && srcEl instanceof SVGElement) {
                        srcEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    }
                }

                // FALLBACK for HTML images: Use border-radius if not cropping (better for filters)
                if (!isSvgEl && (radius.tl || radius.tr || radius.br || radius.bl)) {
                    liveElement.style.removeProperty('clip-path');
                    liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
                    liveElement.style.setProperty('overflow', 'hidden', 'important');
                } else {
                    liveElement.style.removeProperty('clip-path');
                    if (!isSvgEl) {
                        liveElement.style.removeProperty('border-radius');
                        liveElement.style.removeProperty('overflow');
                    }
                }
                liveElement.style.removeProperty('transform');
                liveElement.style.removeProperty('translate');
                liveElement.style.removeProperty('scale');
            }
        }

        // --- Source Management (restore original / apply cropped) ---
        const srcEl = isSvgEl ? svgImageEl : liveElement;
        const originalSrc = liveElement.getAttribute('data-original-src');
        const croppedSrc = liveElement.getAttribute('data-cropped-src');

        if (imageType === 'Crop' && croppedSrc) {
            if (getSrc(srcEl) !== croppedSrc) {
                setSrc(srcEl, croppedSrc);
                setPreviewSrc(croppedSrc);
            }
        } else if (originalSrc) {
            if (getSrc(srcEl) !== originalSrc) {
                setSrc(srcEl, originalSrc);
                setPreviewSrc(originalSrc);
            }
            // Clean up CSS crop artifacts when not in Crop mode
            if (!isSvgEl) {
                liveElement.style.removeProperty('clip-path');
                liveElement.style.removeProperty('-webkit-clip-path');
                liveElement.style.removeProperty('transform');
                liveElement.style.removeProperty('translate');
                liveElement.style.removeProperty('scale');
            }
        } else if (imageType !== 'Crop') {
            if (!isSvgEl) {
                liveElement.style.removeProperty('clip-path');
                liveElement.style.removeProperty('-webkit-clip-path');
                liveElement.style.removeProperty('transform');
                liveElement.style.removeProperty('translate');
                liveElement.style.removeProperty('scale');
            }
        }

        // --- Inner Shadow & Slideshow (HTML: overlays; SVG: sibling rect) ---
        let shadowString = '';
        if (activeEffects.includes('Inner Shadow')) {
            const s = effectSettings['Inner Shadow'];
            const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = s.color + (s.color.length === 7 ? alpha : '');
            shadowString += `inset ${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${colorWithAlpha}`;
        }

        if (isSvgEl) {
            // SVG Inner Shadow via foreignObject + div
            let overlay = liveElement.parentElement?.querySelector('.svg-inner-shadow-overlay');
            if (activeEffects.includes('Inner Shadow') && shadowString) {
                if (!overlay && liveElement.parentElement) {
                    overlay = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                    overlay.classList.add('svg-inner-shadow-overlay');
                    overlay.style.pointerEvents = 'none';
                    const div = document.createElement('div');
                    div.className = 'inner-shadow-div';
                    div.style.width = '100%';
                    div.style.height = '100%';
                    overlay.appendChild(div);
                    liveElement.parentElement.appendChild(overlay);
                }
                if (overlay) {
                    overlay.setAttribute('x', liveElement.getAttribute('x') || '0');
                    overlay.setAttribute('y', liveElement.getAttribute('y') || '0');
                    overlay.setAttribute('width', liveElement.getAttribute('width') || '100%');
                    overlay.setAttribute('height', liveElement.getAttribute('height') || '100%');
                    overlay.setAttribute('transform', liveElement.getAttribute('transform') || '');
                    
                    const div = overlay.querySelector('.inner-shadow-div');
                    if (div) {
                        div.style.boxShadow = shadowString;
                        div.style.borderRadius = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;
                    }
                    overlay.style.setProperty('display', 'block', 'important');
                }
            } else if (overlay) {
                overlay.style.setProperty('display', 'none', 'important');
            }
        } else {
            if (selectedElement.tagName !== 'IMG') {
                selectedElement.style.setProperty('box-shadow', shadowString, 'important');
            } else {
                let overlay = selectedElement.parentElement?.querySelector('.inner-shadow-overlay');
                if (activeEffects.includes('Inner Shadow') && shadowString) {
                    if (!overlay && selectedElement.parentElement) {
                        overlay = document.createElement('div');
                        overlay.className = 'inner-shadow-overlay';
                        overlay.style.position = 'absolute';
                        overlay.style.top = '0';
                        overlay.style.left = '0';
                        overlay.style.width = '100%';
                        overlay.style.height = '100%';
                        overlay.style.pointerEvents = 'none';
                        overlay.style.zIndex = '2';
                        if (window.getComputedStyle(selectedElement.parentElement).position === 'static') {
                            selectedElement.parentElement.style.position = 'relative';
                        }
                        selectedElement.parentElement.appendChild(overlay);
                    }
                    if (overlay) {
                        overlay.style.boxShadow = shadowString;
                        const r = radius;
                        overlay.style.borderRadius = `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;
                    }
                } else if (overlay) overlay.remove();

                // Deck Effect for Slideshow (Only for HTML containers, skip for SVG)
                const isSvgParent = selectedElement.parentElement && selectedElement.parentElement instanceof SVGElement;
                if (isSlideshow && selectedElement.parentElement && !isSvgParent) {
                    let stack1 = selectedElement.parentElement.querySelector('.slideshow-stack-1');
                    let stack2 = selectedElement.parentElement.querySelector('.slideshow-stack-2');
                    if (!stack1) {
                        stack1 = document.createElement('div');
                        stack1.className = 'slideshow-stack-1';
                        stack1.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1;background:white;border:1px solid rgba(0,0,0,0.05);box-shadow:0 4px 12px rgba(0,0,0,0.08)';
                        selectedElement.parentElement.insertBefore(stack1, selectedElement);
                    }
                    if (!stack2) {
                        stack2 = document.createElement('div');
                        stack2.className = 'slideshow-stack-2';
                        stack2.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:-2;background:white;border:1px solid rgba(0,0,0,0.05);box-shadow:0 4px 12px rgba(0,0,0,0.08)';
                        selectedElement.parentElement.insertBefore(stack2, selectedElement);
                    }
                    const commonRadius = selectedElement.style.borderRadius || '12px';
                    stack1.style.borderRadius = commonRadius;
                    stack1.style.transform = 'translate(6px, 6px) rotate(1.5deg)';
                    stack1.style.display = 'block';
                    stack2.style.borderRadius = commonRadius;
                    stack2.style.transform = 'translate(12px, 12px) rotate(3deg)';
                    stack2.style.display = 'block';
                    selectedElement.style.setProperty('border', '4px solid white', 'important');
                    selectedElement.style.setProperty('box-shadow', '0 8px 25px rgba(0,0,0,0.12)', 'important');
                    selectedElement.style.setProperty('z-index', '1', 'important');
                    if (window.getComputedStyle(selectedElement.parentElement).position === 'static') {
                        selectedElement.parentElement.style.position = 'relative';
                    }
                    selectedElement.parentElement.style.setProperty('overflow', 'visible', 'important');
                } else if (!isSvgParent) {
                    selectedElement.parentElement?.querySelector('.slideshow-stack-1')?.remove();
                    selectedElement.parentElement?.querySelector('.slideshow-stack-2')?.remove();
                    selectedElement.style.removeProperty('border');
                    selectedElement.style.removeProperty('z-index');
                    if (!activeEffects.includes('Drop Shadow')) selectedElement.style.removeProperty('box-shadow');
                }
            }
        }
        if (activeEffects.includes('Drop Shadow') || activeEffects.includes('Blur')) {
            if (liveElement.parentElement) liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
        }
        // --- Background Color ---
        // Only apply solid fill if it's not a pattern fill, or if explicitly changed to a solid color
        if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none' && !backgroundColor.fill.startsWith('url(')) {
            liveElement.setAttribute('fill', backgroundColor.fill);
            liveElement.setAttribute('data-fill-color', backgroundColor.fill);
            liveElement.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());
            liveElement.setAttribute('data-fill-opacity', (backgroundColor.fillOpacity / 100).toString());
        } else if (backgroundColor.fill === 'transparent' || backgroundColor.fill === 'none') {
            // Only remove fill if we aren't currently using a pattern!
            const currentFill = liveElement.getAttribute('fill') || '';
            if (!currentFill.startsWith('url(')) {
                liveElement.removeAttribute('fill');
                liveElement.removeAttribute('data-fill-color');
            }
        }

        if (backgroundColor.stroke === 'transparent' || backgroundColor.stroke === 'none') {
            liveElement.removeAttribute('stroke');
            liveElement.removeAttribute('data-stroke-color');
        } else {
            liveElement.setAttribute('stroke', backgroundColor.stroke);
            liveElement.setAttribute('data-stroke-color', backgroundColor.stroke);
            liveElement.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
            liveElement.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
            liveElement.setAttribute('data-stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
            if (backgroundColor.strokeType === 'Dashed') {
                liveElement.setAttribute('stroke-dasharray', '5,5');
            } else {
                liveElement.setAttribute('stroke-dasharray', 'none');
            }
        }

        // Debounce onUpdate
        // but we only serialize + commit to page state after the user pauses.
        // This prevents rapid slider drags from causing constant SVG re-renders
        // which would repeatedly destroy/recreate the selected DOM element.
        if (onUpdateRef.current) {
            clearTimeout(onUpdateTimerRef.current);
            onUpdateTimerRef.current = setTimeout(() => {
                onUpdateRef.current();
            }, 400);
        }
    } finally {
        // Clear any existing reset timer to extend the guard period
        if (isUpdatingDOMTimeoutRef.current) clearTimeout(isUpdatingDOMTimeoutRef.current);
        
        // Keep isUpdatingDOM true for long enough to cover the onUpdate debounce (500ms) 
        // plus the subsequent React re-render cycle.
        const resetDelay = onUpdate ? 300 : 300; // Drastically shorter to avoid blocking sync after re-render
        isUpdatingDOMTimeoutRef.current = setTimeout(() => { 
            isUpdatingDOM.current = false; 
            isUpdatingDOMTimeoutRef.current = null;
        }, resetDelay);
    }
  }, [selectedElement, filters, activeEffects, effectSettings, opacity, imageType, radius, isSlideshow, backgroundColor]);

  useEffect(() => { applyVisuals(); }, [applyVisuals]);

  const updateRadius = (corner, value) => {
    const val = Math.max(0, Number(value) || 0);
    const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };
    setRadius(next);
    // applyVisuals handles DOM via dependency array
  };

  const updateEffectSetting = (effect, key, value) => {
    setEffectSettings(prev => ({ ...prev, [effect]: { ...prev[effect], [key]: value } }));
  };

  const handleColorPick = async (effectName) => {
    if (!window.EyeDropper) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      updateEffectSetting(effectName, 'color', result.sRGBHex);
    } catch (e) {
      console.error('Color selection cancelled or failed', e);
    }
  };



  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-[1vw] w-full max-w-[25vw] font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.25vw; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.5vw; }
        input[type='range'] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type='range']::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; }
        input[type='range']::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        
        .image-editor-toggle {
          appearance: none;
          width: 2.75vw;
          height: 1.35vw;
          border-radius: 1vw;
          position: relative;
          cursor: pointer;
          transition: 0.3s;
          background: #E5E7EB;
        }
        .image-editor-toggle:checked {
          background: #4D47FF;
        }
        .image-editor-toggle::before {
          content: "";
          position: absolute;
          width: 1.1vw;
          height: 1.1vw;
          border-radius: 50%;
          top: 50%;
          left: 0.125vw;
          transform: translateY(-50%);
          background: white;
          transition: 0.3s;
          box-shadow: 0 0.1vw 0.2vw rgba(0,0,0,0.2);
        }
        .image-editor-toggle:checked::before {
          left: 1.5vw;
        }
      `}</style>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".jpg, .jpeg, .png" 
        multiple={isSlideshow} 
        className="hidden" 
      />

       

        {isMainPanelOpen && (
            <div className="space-y-[1vw] px-[0.3vw]">

              {isSlideshow ? (
                /* ── SLIDESHOW MODE: show only SlideshowProperties ── */
                <SlideshowProperties
                  selectedElement={selectedElement}
                  activePageIndex={activePageIndex}
                  isOpen={openSubSection === 'slideshow'}
                  onToggle={() => setOpenSubSection(openSubSection === 'slideshow' ? null : 'slideshow')}
                  onUpdate={onUpdate}
                  opacity={opacity}
                  onUpdateOpacity={(v) => setOpacity(v)}
                  setPreviewSrc={setPreviewSrc}
                  setIsUpdatingDOM={(val) => { isUpdatingDOM.current = val; }}
                  currentPageVId={currentPageVId}
                  flipbookVId={flipbookVId}
                  folderName={folderName}
                  flipbookName={flipbookName}
                  onDisableSlideshow={() => {
                    setIsSlideshow(false);
                    if (selectedElement) {
                      const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
                      const liveEl = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;
                      
                      // Remove from both to ensure sync
                      const targets = [selectedElement, liveEl];
                      targets.forEach(el => {
                        el.removeAttribute('data-is-slideshow');
                        el.removeAttribute('data-slideshow');
                        el.removeAttribute('data-active-index');
                        el.removeAttribute('data-slideshow-manual');
                        if (el.dataset) {
                          delete el.dataset.slideshow;
                          delete el.dataset.isSlideshow;
                        }
                      });

                      if (onUpdate) onUpdate({ shouldRefresh: true });
                    }
                  }}
                />
              ) : (
                /* ── IMAGE MODE: full image panel ── */
                <>
                  {/* Header */}
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Image Properties</span>
                    <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.7vw' }}> </div>
                  </div>

                  <div className="flex items-center justify-between py-[0.25vw]">
                    <span className="text-[0.75vw] text-gray-800">Turn on Slideshow to add more images</span>
                    <button
                      onClick={() => {
                        const next = !isSlideshow;
                        setIsSlideshow(next);
                        if (selectedElement) {
                          const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
                          const liveEl = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;

                          if (next) {
                            const initialData = {
                              settings: {
                                imageFitType: imageType === 'Fill' || imageType === 'Crop' ? 'Fill All' : 'Fit All',
                                transitionEffect: 'Linear',
                                showDots: true,
                                showArrows: true,
                                showNav: true,
                                navStyle: 1,
                                navIconColor: '#000000',
                                dotColor: '#4F46E5',
                                dotOpacity: 100,
                                autoSlide: true,
                                autoPlay: true,
                                speed: 3,
                                infiniteLoop: true,
                                dragToSlide: false
                              },
                              images: [{
                                id: Date.now(),
                                url: previewSrc,
                                name: 'Slide 1',
                                isUploading: false
                              }]
                            };
                            const dataStr = JSON.stringify(initialData);

                            // Apply to both to ensure sync
                            [selectedElement, liveEl].forEach(el => {
                              el.setAttribute('data-is-slideshow', 'true');
                              el.setAttribute('data-slideshow', dataStr);
                              el.setAttribute('data-active-index', '0');
                            });
                          } else {
                            // Remove from both
                            [selectedElement, liveEl].forEach(el => {
                              el.removeAttribute('data-is-slideshow');
                              el.removeAttribute('data-slideshow');
                              el.removeAttribute('data-active-index');
                              el.removeAttribute('data-slideshow-manual');
                              if (el.dataset) {
                                delete el.dataset.slideshow;
                                delete el.dataset.isSlideshow;
                              }
                            });
                          }
                          if (onUpdate) onUpdate({ shouldRefresh: true });
                        }
                      }}
                      className={`relative w-[2.5vw] h-[1.3vw] rounded-full transition-colors duration-300 ${isSlideshow ? 'bg-[#4D47FF] border-[0.1vw] border-white' : 'bg-white border-[0.15vw] border-[#4D47FF]'}`}
                    >
                      <div className={`absolute top-1/2 -translate-y-1/2 w-[1.4vw] h-[1.4vw] rounded-full transition-all duration-300 ${isSlideshow ? 'left-[-0.5vw] bg-white' : 'left-[-0.32vw] bg-[#4D47FF]'}`} />
                    </button>
                  </div>

                  {/* Image fix type + single image + upload */}
                  <div className="flex items-center justify-between relative z-20">
                    <div className="flex items-center gap-[0.5vw] flex-1">
                      <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Image fix type</span>
                      <div className="h-[0px] flex-1 border-t border-dashed border-gray-300 mx-[0.25vw]" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowImageTypeDropdown(!showImageTypeDropdown)}
                        className="flex items-center justify-between w-[6.5vw] px-[0.75vw] py-[0.55vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-[0.85vw] font-normal text-gray-700">{imageType}</span>
                        <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showImageTypeDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showImageTypeDropdown && (
                        <>
                          <div className="fixed inset-0 z-[90]" onClick={() => setShowImageTypeDropdown(false)} />
                          <div className="absolute right-0 top-full mt-[0.5vw] w-[6.5vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-2xl overflow-hidden z-[100] flex flex-col py-[0.25vw] animate-in fade-in zoom-in-95 duration-150">
                            {['Fit', 'Fill', 'Stretch', 'Crop'].map((type) => (
                              <button
                                key={type}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setImageType(type);
                                  stateRef.current.imageType = type;
                                  setShowImageTypeDropdown(false);
                                  if (type === 'Crop') setTimeout(() => setIsCropping(true), 50);
                                }}
                                className="px-[1vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-[#4D47FF] transition-colors text-left"
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-[0.75vw] pt-[0.5vw]">
                    {/* Current Image */}
                    <div className="flex flex-col items-center gap-[0.35vw]">
                      <div className="relative w-[5vw] h-[4.4vw] p-[0.2vw] rounded-[0.5vw] overflow-hidden bg-white flex items-center justify-center group" style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}>
                        <img 
                          src={previewSrc || ''} 
                          alt="Thumbnail" 
                          className={`w-full h-full rounded-[0.3vw] ${selectedElement?.hasAttribute('data-effect-crop-inset') ? 'object-cover' : 'object-contain'}`} 
                          style={(() => {
                            const inset = selectedElement?.getAttribute('data-effect-crop-inset');
                            if (!inset) return {};
                            return {
                              clipPath: inset,
                              WebkitClipPath: inset,
                              transform: `translate(${selectedElement.getAttribute('data-effect-crop-offx')}%, ${selectedElement.getAttribute('data-effect-crop-offy')}%) scale(${selectedElement.getAttribute('data-effect-crop-scale')})`,
                              transformOrigin: 'center center'
                            };
                          })()}
                        />
                        <div
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-[0.2vw] cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSrc('');
                            if (selectedElement) {
                              const targetImg = getSvgImageEl(selectedElement) || selectedElement;
                              targetImg.setAttribute('href', '');
                              targetImg.setAttribute('xlink:href', '');
                              if (onUpdate) onUpdate({ shouldRefresh: true });
                            }
                          }}
                        >
                          <Icon icon="lucide:trash-2" className="w-[1.1vw] h-[1.1vw] text-white" />
                          <span className="text-[0.5vw] text-white font-semibold">Remove</span>
                        </div>
                      </div>
                      <span className="text-[0.6vw] font-semibold text-gray-400">Current</span>
                    </div>

                    {/* Replace Arrow */}
                    <div className="flex items-center justify-center shrink-0 h-[5vw] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Icon icon="qlementine-icons:replace-16" className="w-[1.1vw] h-[1.1vw] text-[#9ca3af]" />
                    </div>

                    {/* Upload Box */}
                    <div className="flex flex-col items-center gap-[0.35vw] flex-1">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50/20'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/20'); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/20');
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) handleFileUpload({ target: { files } });
                        }}
                        className="flex-1 w-full h-[5vw] rounded-[0.75vw] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all bg-white py-[0.2vw]"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
                      >
                        <p className="text-[0.65vw] font-medium text-gray-600 text-center mb-[0.2vw]">
                          Drag & Drop or <span className="text-[#4D47FF] font-semibold">Upload</span>
                        </p>
                        <Icon icon="lucide:upload" className="w-[1.1vw] h-[1.1vw] text-gray-400 mb-[0.2vw]" />
                        <div className="flex flex-col items-center">
                          <span className="text-[0.5vw] font-semibold text-gray-500">Supported File Format</span>
                          <span className="text-[0.5vw] font-semibold text-gray-500">JPG, PNG</span>
                        </div>
                      </div>
                      <span className="text-[0.6vw] font-semibold text-gray-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>Replace</span>
                    </div>
                  </div>

                  {/* Opacity */}
                  <div className="space-y-[0.5vw]">
                    <div className="flex items-center gap-[0.5vw]">
                      <span className="text-[0.9vw]  font-semibold text-gray-900 whitespace-nowrap">Opacity</span>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
                    </div>
                    <div className="flex items-center gap-[1vw] pb-[0.5vw]">
                      <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={opacity}
                          onChange={(e) => setOpacity(Number(e.target.value))}
                          className="w-full cursor-pointer"
                          style={{ background: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }}
                        />
                      </div>
                      <span className="text-[0.85vw] font-medium text-gray-800 w-[2.3vw] text-right">{opacity} %</span>
                    </div>
                  </div>

                  {/* Image Gallery */}
                  <div onClick={() => setShowGallery(true)} className="relative w-full h-[3.5vw] bg-black rounded-[0.9vw] overflow-hidden group transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg flex items-center justify-center border border-white/5">
                    <div className="absolute inset-0 flex gap-[0.2vw] opacity-20 group-hover:opacity-40 transition-opacity">
                      <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=300&auto=format&fit=crop')" }} />
                      <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=300&auto=format&fit=crop')" }} />
                      <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=300&auto=format&fit=crop')" }} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray/10 via-gray/20 to-gray/40 group-hover:via-gray/20 transition-all" />
                    <div className="relative z-10 flex items-center gap-[0.75vw]">
                      <Icon icon="clarity:image-gallery-solid" className="w-[1vw] h-[1.2vw] text-white" />
                      <span className="text-[0.95vw] font-semibold text-white">Image Gallery</span>
                    </div>
                  </div>
                </>
              )}

              {/* ── Color / Adjustments / Corner Radius / Effect ── always shown in both modes ── */}
              <div className="space-y-3">
                <div className="border border-gray-100 rounded-[0.75vw] overflow-hidden shadow-sm bg-white">
                  <button onClick={() => setOpenSubSection(openSubSection === 'bg-color' ? null : 'bg-color')} className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.9vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    <span>Color</span>
                    <ChevronDown size="1.1vw" className={`text-gray-900 transition-transform duration-200 ${openSubSection === 'bg-color' ? 'rotate-180' : ''}`} />
                  </button>
                  {openSubSection === 'bg-color' && (
                    <div className="px-[1vw] pb-[1vw] pt-[0.75vw] border-t border-gray-100 space-y-[0.5vw] animate-in slide-in-from-top-2">
                      <ColorField label="Fill" color={backgroundColor.fill} opacity={backgroundColor.fillOpacity} onColorChange={(val) => setBackgroundColor(p => ({ ...p, fill: val }))} onOpacityChange={(val) => setBackgroundColor(p => ({ ...p, fillOpacity: val }))} onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')} />
                      <ColorField label="Stroke" color={backgroundColor.stroke} opacity={backgroundColor.strokeOpacity} onColorChange={(val) => setBackgroundColor(p => ({ ...p, stroke: val }))} onOpacityChange={(val) => setBackgroundColor(p => ({ ...p, strokeOpacity: val }))} onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')} />
                      {backgroundColor.stroke && backgroundColor.stroke !== 'none' && backgroundColor.stroke !== 'transparent' && (
                        <div className="flex items-center gap-[0.4vw] py-[0.1vw] animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="w-[3vw]" />
                          <div className="w-[2.5vw] flex items-center justify-center">
                            <div className="w-[1.1vw] cursor-ew-resize hover:bg-gray-50 p-[0.1vw] rounded transition-colors" onPointerDown={(e) => { handleScrubHelper(e, backgroundColor.strokeWeight, (val) => { setBackgroundColor(p => ({ ...p, strokeWeight: Math.max(0, parseInt(val)) })); }, 8); }}>
                              <Icon icon="material-symbols:line-weight" width="1vw" height="1vw" className="text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-grow flex items-center gap-[0.4vw]">
                            <div className="relative flex-grow h-[2.5vw]">
                              <div className="h-full px-[0.7vw] border-[0.1vw] border-gray-400 rounded-[0.75vw] flex items-center justify-between cursor-pointer bg-white hover:border-indigo-400 transition-colors" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setDropdownPos({ top: rect.bottom + 5, left: rect.left, width: rect.width }); setIsStrokeStyleOpen(!isStrokeStyleOpen); }}>
                                <span className="text-[0.75vw] text-gray-700 font-semibold">{backgroundColor.strokeType}</span>
                                <ChevronDown size="0.9vw" className={`text-gray-500 transition-transform ${isStrokeStyleOpen ? 'rotate-180' : ''}`} />
                              </div>
                              {isStrokeStyleOpen && createPortal(
                                <div className="fixed py-1 bg-white border border-gray-100 shadow-xl z-[9999] rounded-[0.5vw] animate-in fade-in zoom-in-95 duration-200" style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
                                  {['Solid', 'Dashed'].map((type) => (
                                    <div key={type} className={`px-[1vw] py-[0.5vw] text-[0.8vw] font-semibold cursor-pointer hover:bg-gray-50 transition-colors ${backgroundColor.strokeType === type ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`} onClick={() => { setBackgroundColor(p => ({ ...p, strokeType: type })); setIsStrokeStyleOpen(false); }}>{type}</div>
                                  ))}
                                </div>, document.body
                              )}
                            </div>
                            <div className="h-[2.5vw] w-[4.5vw] border-[0.1vw] border-gray-400 rounded-[0.75vw] flex items-center px-[0.6vw] bg-white">
                              <input type="number" value={backgroundColor.strokeWeight} onChange={(e) => setBackgroundColor(p => ({ ...p, strokeWeight: parseInt(e.target.value) || 0 }))} className="w-full text-[0.8vw] font-semibold outline-none text-right bg-transparent text-gray-700 no-spin" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border border-gray-100 rounded-[0.75vw] overflow-hidden shadow-sm bg-white">
                  <button onClick={() => setOpenSubSection(openSubSection === 'adjustments' ? null : 'adjustments')} className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.9vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    <span>Adjustments</span>
                    <ChevronDown size="1.1vw" className={`text-gray-900 transition-transform duration-200 ${openSubSection === 'adjustments' ? 'rotate-180' : ''}`} />
                  </button>
                  {openSubSection === 'adjustments' && (
                    <div className="relative px-[1.5vw] pb-[1.25vw] pt-[1.25vw] border-t border-gray-100">
                      <div className="px-[0.25vw] pb-[0.5vw] space-y-[0.5vw] text-[0.75vw] animate-in slide-in-from-top-2">
                        {[['Exposure','exposure',-100,100],['Contrast','contrast',-100,100],['Saturation','saturation',-100,100],['Temperature','temperature',-100,100],['Tint','tint',-180,180],['Highlights','highlights',-100,100],['Shadows','shadows',-100,100]].map(([label, key, min, max]) => (
                          <div key={key} className="space-y-[0.25vw]">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-[0.5vw]">
                                <DraggableSpan label={label} value={filters[key]} onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))} min={min} max={max} className="text-[0.8vw] font-medium text-gray-700" />
                                <button onClick={() => setFilters((f) => ({ ...f, [key]: 0 }))} className="text-gray-400 hover:text-indigo-600 transition-colors" title={`Reset ${label}`}><Icon icon="ix:reset" className="w-[1vw] h-[1vw]" /></button>
                              </div>
                              <span className="text-[0.75vw] font-bold text-gray-900">{filters[key]}</span>
                            </div>
                            <input type="range" min={min} max={max} value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: +e.target.value }))} className="w-full cursor-pointer" style={{ background: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${((filters[key]-min)/(max-min))*100}%, #E2E8F0 ${((filters[key]-min)/(max-min))*100}%, #E2E8F0 100%)` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-gray-100 rounded-[0.75vw] overflow-hidden shadow-sm bg-white">
                  <button onClick={() => setOpenSubSection(openSubSection === 'radius' ? null : 'radius')} className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.9vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    <span>Corner Radius</span>
                    <ChevronDown size="1.1vw" className={`text-gray-900 transition-transform duration-200 ${openSubSection === 'radius' ? 'rotate-180' : ''}`} />
                  </button>
                  {openSubSection === 'radius' && (
                    <div className="relative px-[1.5vw] pb-[1.25vw] pt-[1.25vw] border-t border-gray-100">
                      <div className="flex flex-col items-center gap-[1.5vw]">
                        <div className="flex items-center gap-[1.5vw]">
                          <RadiusBox onChange={updateRadius} corner="tl" value={radius.tl} radiusStyle="rounded-tl-3xl rounded-tr-md rounded-br-md rounded-bl-md" />
                          <RadiusBox onChange={updateRadius} corner="tr" value={radius.tr} radiusStyle="rounded-tr-3xl rounded-tl-md rounded-br-md rounded-bl-md" />
                        </div>
                        <div className="absolute left-1/2 top-[5vw] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                          <button onClick={() => setIsRadiusLinked(!isRadiusLinked)} className="pointer-events-auto p-[0.375vw] transition-colors bg-white rounded-full">{isRadiusLinked ? <LinkIcon size="1.25vw" className="text-gray-900" /> : <Link2Off size="1.25vw" className="text-gray-400" />}</button>
                        </div>
                        <div className="flex items-center gap-[1.5vw]">
                          <RadiusBox onChange={updateRadius} corner="bl" value={radius.bl} radiusStyle="rounded-bl-3xl rounded-tr-md rounded-br-md rounded-tl-md" />
                          <RadiusBox onChange={updateRadius} corner="br" value={radius.br} radiusStyle="rounded-br-3xl rounded-tr-md rounded-tl-md rounded-bl-md" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-gray-100 rounded-[0.75vw] overflow-hidden shadow-sm bg-white">
                  <button onClick={() => setOpenSubSection(openSubSection === 'effect' ? null : 'effect')} className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.9vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    <span>Effect</span>
                    <ChevronDown size="1.1vw" className={`text-gray-900 transition-transform duration-200 ${openSubSection === 'effect' ? 'rotate-180' : ''}`} />
                  </button>
                  {openSubSection === 'effect' && (
                    <div className="relative px-[1.5vw] pb-[1.25vw] pt-[1.25vw] border-t border-gray-100">
                      <div className="p-0 pt-0 space-y-[0.5vw] bg-white border-t border-gray-50">
                        {['Drop Shadow', 'Inner Shadow', 'Blur', 'Background Blur'].map((eff) => (
                          <div key={eff} className="relative">
                            <div onClick={() => { const isActive = activeEffects.includes(eff); if (!isActive) { setActiveEffects(prev => [...prev, eff]); setActivePopup(eff); } else { setActivePopup(activePopup === eff ? null : eff); } }} className={`flex items-center justify-between p-[0.5vw] rounded-[0.5vw] border transition-all cursor-pointer ${activePopup === eff ? 'border-black-800 bg-indigo-50/20' : 'bg-gray-50/80 border-gray-100 hover:border-gray-300'}`}>
                              <span className="text-[0.75vw] font-bold text-gray-700 flex-1">{eff}</span>
                              <button onClick={(e) => { e.stopPropagation(); const isActive = activeEffects.includes(eff); if (isActive) { setActiveEffects(prev => prev.filter(e => e !== eff)); if (activePopup === eff) setActivePopup(null); } else { setActiveEffects(prev => [...prev, eff]); setActivePopup(eff); } }} className="p-[0.25vw] hover:bg-white/50 rounded-[0.5vw] transition-colors">
                                {activeEffects.includes(eff) ? <Trash2 size="1vw" className="text-red-500" /> : <Plus size="1vw" className="text-gray-400" />}
                              </button>
                            </div>
                            {activePopup === eff && (
                              <div className="fixed z-[50] bg-white rounded-[0.5vw] shadow-2xl border border-gray-100 p-[1.5vw] animate-in slide-in-from-right-4 fade-in duration-200" style={{ width: '18vw', top: '35%', left: '92%', transform: 'translateX(-120%)' }}>
                                <div className="flex items-center mb-[1vw]">
                                  <span className="text-[0.85vw] font-bold text-gray-800">{eff}</span>
                                  <div className="h-[0.1vw] flex-1 mx-[0.75vw] bg-gray-100" />
                                  <button onClick={() => setActivePopup(null)} className="p-[0.375vw] rounded-[0.5vw] hover:bg-gray-100 transition" aria-label="Close"><X size="1vw" className="text-gray-500" /></button>
                                </div>
                                <div className="space-y-[0.75vw]">
                                  {eff.includes('Shadow') && (
                                    <><div className="flex items-start gap-[0.5vw]"><div className="relative"><div className="w-[4vw] h-[4vw] rounded-[0.25vw] flex items-center justify-center text-white text-[0.85vw] font-semibold cursor-pointer overflow-hidden" style={{ background: `linear-gradient(to right, ${effectSettings[eff].color} 0%, ${effectSettings[eff].color}88 50%, transparent 100%)` }}><span className="relative z-10">{effectSettings[eff].opacity} %</span><input type="color" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div></div>
                                    <div className="flex-1 space-y-[0.75vw]">
                                      <div className="flex items-center gap-[0.5vw]"><span className="text-[0.75vw] text-gray-800 font-normal whitespace-nowrap">Code :</span><div className="flex-1 relative"><input type="text" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="w-full text-[0.85vw] text-gray-800 outline-none bg-transparent border border-gray-300 rounded-[0.5vw] px-[0.75vw] pr-[2vw] h-[2.25vw]" /><div className="absolute right-[0.5vw] top-1/2 -translate-y-1/2 w-[1vw] h-[1vw] cursor-pointer"><Pencil size="1vw" className="text-gray-400" strokeWidth={2} />{'EyeDropper' in window ? <button onClick={() => handleColorPick(eff)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /> : <input type="color" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />}</div></div></div>
                                      <div className="flex items-center gap-[0.5vw]"><DraggableSpan label="Opacity :" value={effectSettings[eff].opacity} onChange={(v) => updateEffectSetting(eff, 'opacity', v)} className="text-[0.75vw] text-gray-800 font-normal whitespace-nowrap" /><div className="flex-1 flex items-center gap-[0.5vw]"><input type="range" min="0" max="100" value={effectSettings[eff].opacity} onChange={(e) => updateEffectSetting(eff, 'opacity', Number(e.target.value))} className="flex-1 cursor-pointer" style={{ background: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${effectSettings[eff].opacity}%, #E2E8F0 ${effectSettings[eff].opacity}%, #E2E8F0 100%)` }} /><span className="text-[0.75vw] text-gray-800">{effectSettings[eff].opacity} %</span></div></div>
                                    </div></div>
                                    <div className="space-y-[0.75vw] pt-[0.5vw]"><EffectControlRow label="X Axis" value={effectSettings[eff].x} onChange={(v) => updateEffectSetting(eff, 'x', v)} min={-100} max={100} /><EffectControlRow label="Y Axis" value={effectSettings[eff].y} onChange={(v) => updateEffectSetting(eff, 'y', v)} min={-100} max={100} /><EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} min={0} max={100} /><EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} min={0} max={100} /></div></>
                                  )}
                                  {!eff.includes('Shadow') && (
                                    <div className="space-y-[0.75vw]"><EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} min={0} max={100} /><EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} min={0} max={100} /></div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

      {showGallery && (
        <GalleryImage 
          selectedElement={selectedElement}
          selectedLayerId={selectedLayerId}
          activePageIndex={activePageIndex}
          onUpdate={onUpdateRef.current}
          onClose={() => setShowGallery(false)}
          currentPageVId={currentPageVId}
          flipbookVId={flipbookVId}
          folderName={folderName}
          flipbookName={flipbookName}
          onSelect={async (img) => {
             // 1. Optimistic Update
             const optimisticUrl = img.url;
             
             // Resolve the live element
             const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
             const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

             if (!liveElement) return;

             const targetImg = getSvgImageEl(liveElement) || liveElement;
             if (targetImg.tagName?.toLowerCase() === 'image') {
               targetImg.setAttribute('href', optimisticUrl);
               targetImg.setAttribute('xlink:href', optimisticUrl);
             } else {
               targetImg.src = optimisticUrl;
               targetImg.setAttribute('src', optimisticUrl);
             }
             setPreviewSrc(optimisticUrl);
             liveElement.removeAttribute('data-original-src');
             liveElement.removeAttribute('data-cropped-src');
             if (onUpdate) onUpdate({ shouldRefresh: true });

             // 2. Backend Upload/Associate logic
             const storedUser = localStorage.getItem('user');
             if (!storedUser) {
                 setShowGallery(false);
                 return;
             }
             
             try {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                
                // Prepare File Object
                let fileToUpload = null;
                if (img.file) {
                    fileToUpload = img.file;
                } else {
                    try {
                        const response = await axios.get(img.url, { responseType: 'blob' });
                        const contentType = response.headers['content-type'] || 'image/png';
                        const ext = contentType.split('/')[1] || 'png';
                        const filename = img.name ? (img.name.endsWith('.' + ext) ? img.name : `${img.name}.${ext}`) : `gallery_image.${ext}`;
                        fileToUpload = new File([response.data], filename, { type: contentType });
                    } catch (fetchErr) {
                        console.error("Failed to fetch gallery image for re-upload:", fetchErr);
                    }
                }
                
                if (fileToUpload) {
                    const formData = new FormData();
                    formData.append('emailId', user.emailId);
                    if (flipbookVId) formData.append('v_id', flipbookVId);
                    formData.append('folderName', folderName || 'My Flipbooks');
                    formData.append('flipbookName', flipbookName || 'Untitled Document');
                    formData.append('type', 'image');
                    formData.append('assetType', 'Image');
                    formData.append('page_v_id', currentPageVId || 'global');
                    
                    const existingFileVid = liveElement.dataset.fileVid;
                    if (existingFileVid) {
                        formData.append('replacing_file_v_id', existingFileVid);
                    }
                    
                    formData.append('file', fileToUpload);
                    const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
                    
                    if (res.data.url) {
                        const serverUrl = `${backendUrl}${res.data.url}`;
                        
                        const finalTarget = getSvgImageEl(liveElement) || liveElement;
                        if (finalTarget.tagName?.toLowerCase() === 'image') {
                          finalTarget.setAttribute('href', serverUrl);
                          finalTarget.setAttribute('xlink:href', serverUrl);
                        } else {
                          finalTarget.src = serverUrl;
                          finalTarget.setAttribute('src', serverUrl);
                        }
                        liveElement.dataset.fileVid = res.data.file_v_id;
                        setPreviewSrc(serverUrl);
                        
                        if (onUpdate) onUpdate({ shouldRefresh: true });
                    }
                }
             } catch (err) {
                console.error("Gallery Select Backend Sync Failed:", err);
             }
             
             setShowGallery(false);
          }}
        />
      )}
      {isCropping && (
        <ImageCropOverlay 
            imageSrc={selectedElement.getAttribute('data-original-src') || previewSrc || selectedElement.getAttribute('href') || selectedElement.getAttribute('xlink:href') || selectedElement.src}
            element={selectedElement}
            onSave={({ inset, scale, offX, offY, crop, naturalSize }) => {
                const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
                const liveEl = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || selectedElement;
                if (!liveEl) return;

                isUpdatingDOM.current = true;
                
                // 1. Persist Crop Attributes
                liveEl.setAttribute('data-effect-crop-inset', inset);
                liveEl.setAttribute('data-effect-crop-scale', scale);
                liveEl.setAttribute('data-effect-crop-offx', offX.toString());
                liveEl.setAttribute('data-effect-crop-offy', offY.toString());
                
                // 2. Persist Crop Object for re-opening the editor and applyVisuals
                liveEl.setAttribute('data-crop-data', JSON.stringify(crop));

                // 3. Selection Box Alignment: Resize the container to match the crop
                const isSvg = liveEl instanceof SVGElement;
                
                // If we don't have originals, store them now
                if (!liveEl.hasAttribute('data-crop-orig-w')) {
                    liveEl.setAttribute('data-crop-orig-w', (liveEl.getAttribute('width') || (isSvg ? '100' : liveEl.style.width)).toString());
                    liveEl.setAttribute('data-crop-orig-h', (liveEl.getAttribute('height') || (isSvg ? '100' : liveEl.style.height)).toString());
                    liveEl.setAttribute('data-crop-orig-x', (liveEl.getAttribute('x') || (isSvg ? '0' : liveEl.style.left)).toString());
                    liveEl.setAttribute('data-crop-orig-y', (liveEl.getAttribute('y') || (isSvg ? '0' : liveEl.style.top)).toString());
                }

                const origW = parseFloat(liveEl.getAttribute('data-crop-orig-w'));
                const origH = parseFloat(liveEl.getAttribute('data-crop-orig-h'));
                const origX = parseFloat(liveEl.getAttribute('data-crop-orig-x'));
                const origY = parseFloat(liveEl.getAttribute('data-crop-orig-y'));

                // Calculate the actual visual dimensions of the image within the original container (assuming 'contain' fit)
                const imgAspect = naturalSize.width / naturalSize.height;
                const containerAspect = origW / origH;
                
                let visualW, visualH;
                if (imgAspect > containerAspect) {
                    // Image is wider than container (Fit horizontally)
                    visualW = origW;
                    visualH = origW / imgAspect;
                } else {
                    // Image is taller than container (Fit vertically)
                    visualH = origH;
                    visualW = origH * imgAspect;
                }

                // Calculate new frame bounds relative to the VISUAL area
                const newW = visualW * (crop.width / 100);
                const newH = visualH * (crop.height / 100);
                const newX = origX + ((origW - visualW) / 2) + (crop.left / 100) * visualW;
                const newY = origY + ((origH - visualH) / 2) + (crop.top / 100) * visualH;

                // Update physical frame
                if (isSvg) {
                    liveEl.setAttribute('width', newW.toString());
                    liveEl.setAttribute('height', newH.toString());
                    liveEl.setAttribute('x', newX.toString());
                    liveEl.setAttribute('y', newY.toString());
                } else {
                    liveEl.style.width = `${newW}px`;
                    liveEl.style.height = `${newH}px`;
                    liveEl.style.left = `${newX}px`;
                    liveEl.style.top = `${newY}px`;
                }
                
                // 4. Source Backup
                const currentSrc = previewSrc || liveEl.src || liveEl.getAttribute('href');
                if (!liveEl.hasAttribute('data-original-src')) {
                    liveEl.setAttribute('data-original-src', currentSrc);
                }

                liveEl.style.setProperty('transform-origin', 'center center', 'important');
                if (liveEl instanceof SVGElement) {
                    liveEl.style.setProperty('transform-box', 'fill-box', 'important');
                }

                stateRef.current.imageType = 'Crop';
                setImageType('Crop');
                setIsCropping(false);
                
                // Trigger visual update
                applyVisuals();
                
                // Force sync with page state
                if (onUpdateRef.current) onUpdateRef.current();
                
                setTimeout(() => { isUpdatingDOM.current = false; }, 300);
            }}
            onCancel={() => setIsCropping(false)}
        />
      )}
      {activeColorPicker && createPortal(
        <div 
          className="fixed z-[10000] animate-in fade-in zoom-in-95 duration-200"
          style={{ top: pickerPosition.top, right: pickerPosition.right }}
        >
          <ColorPicker 
            color={activeColorPicker === 'fill' ? backgroundColor.fill : backgroundColor.stroke}
            onChange={(color) => {
              if (activeColorPicker === 'fill') {
                setBackgroundColor(p => ({ ...p, fill: color }));
              } else {
                setBackgroundColor(p => ({ ...p, stroke: color }));
              }
            }}
            onClose={() => setActiveColorPicker(null)}
          />
        </div>,
        document.body
      )}
    </div>
      )}
    </div>
  );
};


export default ImageEditor;

