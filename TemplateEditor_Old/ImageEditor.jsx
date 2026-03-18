import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Image,
} from 'lucide-react';
import InteractionPanel from './InteractionPanel';
import AnimationPanel from './AnimationPanel';
import GalleryImage from './GalleryImage';
import SlideshowProperties from './SlideshowProperties';
import { Icon } from '@iconify/react';


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
        const cp = element.style.clipPath || element.style.webkitClipPath || '';
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
         // Lock aspect ratio to 1:1 (Square)
         // height% = width% * imgAspect
         
         // Determine new width based on drag direction
         let newW = startPos.crop.width;
         let newH = startPos.crop.height;
  
         if (dragType === 'br') {
            // Dragging Bottom-Right
            // We use the larger of dx/dy relative projection or just dx for simplicity + constraint
            // Let's drive by dx (width change) for smooth feel, or max(dx, dy converted)
            // Simple approach: Use dx to drive width, derive height.
            
            newW = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.left, startPos.crop.width + dx));
            newH = newW * imgAspect;
            
            // If height goes out of bounds, scale back width
            if (startPos.crop.top + newH > 100) {
                newH = 100 - startPos.crop.top;
                newW = newH / imgAspect;
            }
            next.width = newW;
            next.height = newH;
         } 
         else if (dragType === 'bl') {
             // Dragging Bottom-Left: Modifies left and width. Anchor Right.
             // newWidth = startWidth - dx
             // Clamp left
             let proposedLeft = Math.max(0, Math.min(startPos.crop.left + startPos.crop.width - MIN_SIZE, startPos.crop.left + dx));
             newW = startPos.crop.width + (startPos.crop.left - proposedLeft);
             newH = newW * imgAspect;
             
             // Bounds check height (bottom)
             if (startPos.crop.top + newH > 100) {
                 newH = 100 - startPos.crop.top;
                 newW = newH / imgAspect;
                 // Recalculate left based on constrained width
                 proposedLeft = startPos.crop.left + startPos.crop.width - newW;
             }
             
             next.left = proposedLeft;
             next.width = newW;
             next.height = newH;
         }
         else if (dragType === 'tr') {
             // Dragging Top-Right: Modifies top and width(increase). Anchor Bottom-Left.
             // Width driven
             newW = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.left, startPos.crop.width + dx));
             newH = newW * imgAspect;
             
             // Check top bound
             // top = startTop + startHeight - newHeight
             let proposedTop = startPos.crop.top + startPos.crop.height - newH;
             if (proposedTop < 0) {
                 proposedTop = 0;
                 newH = startPos.crop.top + startPos.crop.height; // Max avail height from bottom anchor
                 newW = newH / imgAspect;
             }
             
             next.top = proposedTop;
             next.width = newW;
             next.height = newH;
         }
         else if (dragType === 'tl') {
             // Dragging Top-Left: Modifies top, left, width, height. Anchor Bottom-Right.
             // Drive by dx (inverted)
             let proposedLeft = Math.max(0, Math.min(startPos.crop.left + startPos.crop.width - MIN_SIZE, startPos.crop.left + dx));
             newW = startPos.crop.width + (startPos.crop.left - proposedLeft);
             newH = newW * imgAspect;
             
             let proposedTop = startPos.crop.top + startPos.crop.height - newH;
             
             // Check top bound
             if (proposedTop < 0) {
                 proposedTop = 0;
                 newH = startPos.crop.top + startPos.crop.height;
                 newW = newH / imgAspect;
                 proposedLeft = startPos.crop.left + startPos.crop.width - newW;
             }
             
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
    // Scale = 100 / cropDimension
    const scaleX = 100 / Math.max(1, crop.width);
    const scaleY = 100 / Math.max(1, crop.height);
    const scale = Math.min(scaleX, scaleY);
    
    // 3. Offset to center the crop area
    const offX = -(crop.left + (crop.width / 2) - 50) * scale;
    const offY = -(crop.top + (crop.height / 2) - 50) * scale;

    onSave({ inset, scale, offX, offY, crop });
  }, [crop, onSave]);

  const currentPixelSize = {
    w: Math.round((crop.width / 100) * naturalSize.width) || 0,
    h: Math.round((crop.height / 100) * naturalSize.height) || 0
  };

  return (
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

      <div className="w-full max-w-5xl flex items-center justify-between mb-8 text-white px-4">
        
        <div className="flex items-center gap-3 pl-250">
          <button onClick={onCancel} className="px-6 py-2.5 rounded-xl bg-white/50 hover:bg-white/10 transition-all font-bold text-white-sm border border-white/90">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2.5 rounded-xl bg-white/50 hover:bg-white/10 transition-all font-bold text-white-sm border border-white/90">
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
          
          {/* Removed full overlay to use box-shadow scrim on crop box instead */}
          
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
    </div>
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
  const stateRef = useRef({ imageType: 'Fit', opacity: 100, radius: { tl: 12, tr: 12, br: 12, bl: 12 }, previewSrc: selectedElement?.src });
  const isUpdatingDOM = useRef(false);
  const lastAppliedElementRef = useRef(null);
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
  const [previewSrc, setPreviewSrc] = useState(selectedElement?.src);
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

  const [isSlideshow, setIsSlideshow] = useState(false);
  const [showTransitionDropdown, setShowTransitionDropdown] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);

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
      if (selectedElement.dataset.slideshow || selectedElement.hasAttribute('data-is-slideshow')) {
        setIsSlideshow(true);
      } else {
        setIsSlideshow(false);
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
    stateRef.current = { ...stateRef.current, imageType, opacity, radius, previewSrc };
  });



  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    if (selectedElement) {
      selectedElement.src = imageUrl;
      setPreviewSrc(imageUrl);
      selectedElement.removeAttribute('data-original-src');
      selectedElement.removeAttribute('data-cropped-src');
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
                  selectedElement.src = serverUrl;
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

  const syncStateFromDOM = useCallback(() => {
    if (!selectedElement) return;
    
    const currentState = stateRef.current; // Use ref for comparisons to avoid dep circle

    // 1. Sync Opacity
    const domOpacity = selectedElement.style.opacity || '1';
    const newOpacity = Math.round(parseFloat(domOpacity) * 100);
    if (Math.abs(newOpacity - currentState.opacity) > 1) {
        currentState.opacity = newOpacity; // Update ref immediately
        setOpacity(newOpacity);
    }

    // 2. Sync Radius
    const domRadius = selectedElement.style.borderRadius || '0px';
    const radiusVal = parseFloat(domRadius) || 0;
    if (currentState.radius.tl !== radiusVal) { 
        setRadius({ tl: radiusVal, tr: radiusVal, br: radiusVal, bl: radiusVal });
    }

    // 3. Sync Image Type (Object Fit & Crop)
    const inlineFit = selectedElement.style.objectFit;
    const cp = selectedElement.style.clipPath || selectedElement.style.webkitClipPath || '';
    const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'fill': 'Stretch' };
    const currentFit = inlineFit || window.getComputedStyle(selectedElement).objectFit || 'fill';
    const isCroppedSrc = selectedElement.getAttribute('data-cropped-src') === selectedElement.getAttribute('src');
    const hasCrop = cp.includes('inset') || isCroppedSrc;
    const newType = (isCroppedSrc || hasCrop) ? 'Crop' : (fitMapRev[currentFit] || 'Stretch');
    
    // Only call setState if the DOM actually changed from what we think it is
    if (newType !== currentState.imageType) {
        setImageType(newType);
        currentState.imageType = newType; // Update ref immediately to be safe
    }

    // 4. Sync Src
    if (selectedElement.src !== currentState.previewSrc) {
        currentState.previewSrc = selectedElement.src; // Update ref immediately
        setPreviewSrc(selectedElement.src);
    }

    // 5. Sync Active Effects
    const filterStr = selectedElement.style.filter || '';
    const backdropStr = selectedElement.style.backdropFilter || selectedElement.style.webkitBackdropFilter || '';
    const overlay = selectedElement.parentElement?.querySelector('.inner-shadow-overlay');
    const shadowStr = selectedElement.style.boxShadow || (overlay ? overlay.style.boxShadow : '') || '';
    const newEffects = [];
    if (/blur\(\d+px\)/.test(filterStr)) newEffects.push('Blur');
    if (filterStr.includes('drop-shadow')) newEffects.push('Drop Shadow');
    if (backdropStr.includes('blur')) newEffects.push('Background Blur');
    if (shadowStr.includes('inset')) newEffects.push('Inner Shadow');
    
    // Simple array comparison might be enough, assuming order? 
    // Just force update if length differs or items differ
    // We can't easily check against activeEffects state without dep.
    // But we can check against nothing? Or just setState.
    // Effect syncing is rarely the loop cause (opacity is).
    // Let's rely on setState functional update to avoid dep?
    setActiveEffects(prev => {
        const currentRealEffects = prev.filter(e => e !== 'effect');
        const isSame = newEffects.length === currentRealEffects.length && newEffects.every(e => currentRealEffects.includes(e));
        if (isSame) return prev;
        return prev.includes('effect') ? ['effect', ...newEffects] : newEffects;
    });
  }, [selectedElement]); // ONLY selectedElement

  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
        if (isUpdatingDOM.current) return;
        const relevantMutation = mutations.some(m => m.type === 'attributes' && (m.attributeName === 'src' || m.attributeName === 'style' || m.attributeName === 'data-slideshow'));
        if (relevantMutation) syncStateFromDOM();
    });
    observer.observe(selectedElement, { attributes: true, attributeFilter: ['style', 'src'] });
    syncStateFromDOM();
    return () => {
        observer.disconnect();
        isUpdatingDOM.current = false;
    };
  }, [selectedElement, syncStateFromDOM]);

  const applyVisuals = useCallback(() => {
    if (!selectedElement || !selectedElement.isConnected) return;

    // Guard: Prevent re-applying visuals while an external mutation (like slideshow transition) is in progress
    if (isUpdatingDOM.current) return;

    // Fix: Prevent applying stale state immediately when switching elements
    if (selectedElement !== lastAppliedElementRef.current) {
        lastAppliedElementRef.current = selectedElement;
        isUpdatingDOM.current = false;
        return;
    }

    isUpdatingDOM.current = true;
    try {
        let filterString = `brightness(${100 + filters.exposure}%) contrast(${100 + filters.contrast}%) saturate(${100 + filters.saturation}%) hue-rotate(${filters.tint}deg) sepia(${filters.temperature > 0 ? filters.temperature : 0}%)`;
        const highlightEffect = filters.highlights / 5;
        const shadowEffect = filters.shadows / 5;
        filterString += ` brightness(${100 + highlightEffect}%) contrast(${100 + shadowEffect}%)`;
        if (activeEffects.includes('Blur')) filterString += ` blur(${effectSettings['Blur'].blur}px)`;
        if (activeEffects.includes('Drop Shadow')) {
            const s = effectSettings['Drop Shadow'];
            const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = s.color + (s.color.length === 7 ? alpha : '');
            filterString += ` drop-shadow(${s.x}px ${s.y}px ${s.blur}px ${colorWithAlpha})`;
        }
        selectedElement.style.setProperty('filter', filterString, 'important');
        selectedElement.style.setProperty('opacity', (opacity / 100).toString(), 'important');

        if (activeEffects.includes('Background Blur')) {
            const s = effectSettings['Background Blur'];
            const blurVal = `blur(${s.blur}px)`;
            selectedElement.style.setProperty('backdrop-filter', blurVal, 'important');
            selectedElement.style.setProperty('-webkit-backdrop-filter', blurVal, 'important');
            if (selectedElement.src) {
                selectedElement.style.setProperty('mask-image', `url(${selectedElement.src})`, 'important');
                selectedElement.style.setProperty('-webkit-mask-image', `url(${selectedElement.src})`, 'important');
                selectedElement.style.setProperty('mask-repeat', 'no-repeat', 'important');
                selectedElement.style.setProperty('-webkit-mask-repeat', 'no-repeat', 'important');
                const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
                const objectFit = fitMap[imageType] || 'fill';
                selectedElement.style.setProperty('mask-size', objectFit, 'important');
                selectedElement.style.setProperty('-webkit-mask-size', objectFit, 'important');
                selectedElement.style.setProperty('mask-position', 'center', 'important');
                selectedElement.style.setProperty('-webkit-mask-position', 'center', 'important');
            }
        } else {
            selectedElement.style.setProperty('backdrop-filter', 'none', 'important');
            selectedElement.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
            selectedElement.style.setProperty('mask-image', 'none', 'important');
            selectedElement.style.setProperty('-webkit-mask-image', 'none', 'important');
        }

        const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
        const objectFit = fitMap[imageType] || 'fill';
        selectedElement.style.setProperty('object-fit', objectFit, 'important');
        
        // Manage Source Restoration: Restore original if not in crop mode, otherwise use cropped
        const originalSrc = selectedElement.getAttribute('data-original-src');
        const croppedSrc = selectedElement.getAttribute('data-cropped-src');

        if (imageType === 'Crop' && croppedSrc) {
            if (selectedElement.getAttribute('src') !== croppedSrc) {
                selectedElement.src = croppedSrc;
                selectedElement.setAttribute('src', croppedSrc);
                setPreviewSrc(croppedSrc);
            }
        } else if (originalSrc) {
            if (selectedElement.getAttribute('src') !== originalSrc) {
                selectedElement.src = originalSrc;
                selectedElement.setAttribute('src', originalSrc);
                setPreviewSrc(originalSrc);
            }
            
            // Clean up CSS artifacts when not in Crop mode
            selectedElement.style.removeProperty('clip-path');
            selectedElement.style.removeProperty('-webkit-clip-path');
            selectedElement.style.removeProperty('transform');
        } else if (imageType !== 'Crop') {
            selectedElement.style.removeProperty('clip-path');
            selectedElement.style.removeProperty('-webkit-clip-path');
            selectedElement.style.removeProperty('transform');
        }

        let shadowString = "";
        if (activeEffects.includes('Inner Shadow')) {
            const s = effectSettings['Inner Shadow'];
            const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = s.color + (s.color.length === 7 ? alpha : '');
            shadowString += `inset ${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${colorWithAlpha}`;
        }
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
                    overlay.style.borderRadius = selectedElement.style.borderRadius;
                }
            } else if (overlay) overlay.remove();

            // Deck Effect for Slideshow
            if (isSlideshow && selectedElement.parentElement) {
                let stack1 = selectedElement.parentElement.querySelector('.slideshow-stack-1');
                let stack2 = selectedElement.parentElement.querySelector('.slideshow-stack-2');

                if (!stack1) {
                    stack1 = document.createElement('div');
                    stack1.className = 'slideshow-stack-1';
                    stack1.style.position = 'absolute';
                    stack1.style.top = '0';
                    stack1.style.left = '0';
                    stack1.style.width = '100%';
                    stack1.style.height = '100%';
                    stack1.style.zIndex = '-1';
                    stack1.style.backgroundColor = 'white';
                    stack1.style.border = '1px solid rgba(0,0,0,0.05)';
                    stack1.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    selectedElement.parentElement.insertBefore(stack1, selectedElement);
                }
                
                if (!stack2) {
                    stack2 = document.createElement('div');
                    stack2.className = 'slideshow-stack-2';
                    stack2.style.position = 'absolute';
                    stack2.style.top = '0';
                    stack2.style.left = '0';
                    stack2.style.width = '100%';
                    stack2.style.height = '100%';
                    stack2.style.zIndex = '-2';
                    stack2.style.backgroundColor = 'white';
                    stack2.style.border = '1px solid rgba(0,0,0,0.05)';
                    stack2.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
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
            } else {
                selectedElement.parentElement?.querySelector('.slideshow-stack-1')?.remove();
                selectedElement.parentElement?.querySelector('.slideshow-stack-2')?.remove();
                selectedElement.style.removeProperty('border');
                selectedElement.style.removeProperty('z-index');
                if (!activeEffects.includes('Drop Shadow')) {
                    selectedElement.style.removeProperty('box-shadow');
                }
            }
        }
        if (activeEffects.includes('Drop Shadow') || activeEffects.includes('Blur')) {
            if (selectedElement.parentElement) selectedElement.parentElement.style.setProperty('overflow', 'visible', 'important');
        }
        if (onUpdate) onUpdate();
    } finally {
        setTimeout(() => { isUpdatingDOM.current = false; }, 250);
    }
  }, [selectedElement, filters, activeEffects, effectSettings, opacity, imageType, radius, isSlideshow]);

  useEffect(() => { applyVisuals(); }, [applyVisuals]);

  const updateRadius = (corner, value) => {
    const val = Math.max(0, Number(value) || 0);
    const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };
    setRadius(next);
    selectedElement.style.borderRadius = `${next.tl}px ${next.tr}px ${next.br}px ${next.bl}px`;
    if (onUpdate) onUpdate();
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
    <div className="relative flex flex-col gap-[1vw] w-full max-w-[25vw]">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.25vw; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.5vw; }
        input[type='range'] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type='range']::-webkit-slider-runnable-track { height: 0.25vw; border-radius: 0.1vw; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #6366f1; border: 0.15vw solid #ffffff; box-shadow: 0 0.1vw 0.2vw rgba(0,0,0,0.2); margin-top: -0.35vw; cursor: pointer; }
      `}</style>
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm relative font-sans">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".jpg, .jpeg, .png" 
          multiple={isSlideshow} 
          className="hidden" 
        />

        <div className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${isMainPanelOpen ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`} onClick={() => setActiveSection(activeSection === 'main' ? null : 'main')}>
          <div className="flex items-center gap-[0.6vw]">
            <Image  size="1vw" className="text-gray-800" />
            <span className="font-medium text-gray-700 text-[0.85vw]">Image</span>
          </div>
          <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${isMainPanelOpen ? '' : 'rotate-180'}`} />
        </div>
        

        {isMainPanelOpen && (
          <div className="space-y-[1.25vw] px-[1.25vw] pb-[1.25vw] pt-[1vw]">
            <div className="space-y-[1vw]">
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.85vw] font-bold text-gray-900 whitespace-nowrap">Upload your Image</span>
                <div className="h-[0.1vw] w-full bg-gray-200" />
              </div>

              <div className="flex items-center justify-between py-[0.25vw]">
                <span className="text-[0.75vw] text-gray-700">Turn on Slideshow to add more images</span>
                <button 
                  onClick={() => setIsSlideshow(!isSlideshow)}
                  className={`relative w-[2.75vw] h-[1.5vw] transition-colors duration-200 ease-in-out rounded-full focus:outline-none ${isSlideshow ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute left-[0.125vw] top-[0.125vw] bg-white w-[1.25vw] h-[1.25vw] rounded-full shadow transform transition-transform duration-200 ease-in-out ${isSlideshow ? 'translate-x-[1.25vw]' : 'translate-x-0'}`} />
                </button>
              </div>

              {isSlideshow ? (
                <div className="space-y-[1vw] animate-in fade-in duration-300">
                </div>
              ) : (
                <div className="space-y-[1vw] animate-in fade-in duration-300">
                  <div className="flex items-center justify-between relative z-20">
                    <span className="text-[0.75vw] font-bold text-gray-700">Select the Image type :</span>
                <div className="relative">
                  <button 
                    onClick={() => setShowImageTypeDropdown(!showImageTypeDropdown)} 
                    className="flex items-center justify-between w-[6vw] px-[0.75vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[0.8vw] font-bold text-gray-700">{imageType}</span>
                    <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showImageTypeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showImageTypeDropdown && (
                    <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowImageTypeDropdown(false)} />
                    <div className="absolute right-0 top-full mt-[0.5vw] w-[6vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-2xl overflow-hidden z-[100] flex flex-col py-[0.25vw] animate-in fade-in zoom-in-95 duration-150">
                      {['Fit', 'Fill', 'Stretch', 'Crop'].map((type) => (
                        <button 
                          key={type} 
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation();
                            setImageType(type); 
                            stateRef.current.imageType = type;
                            setShowImageTypeDropdown(false); 
                            if (type === 'Crop') {
                                setTimeout(() => setIsCropping(true), 50);
                            }
                          }} 
                          className={"px-[1vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-center"}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-[0.75vw]">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleFileUpload({ target: { files: files } });
                    }
                  }}
                  className="w-[4.5vw] h-[4.5vw] rounded-[0.75vw] overflow-hidden border-2 border-dashed bg-gray-50 cursor-pointer hover:border-indigo-400 transition-colors"
                >
                  <img src={previewSrc || selectedElement.src} className="w-full h-full object-cover" alt="preview" />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-[0.25vw] hover:bg-gray-100 rounded-[0.5vw] transition-colors"
                >
                  <Replace size="1.2vw" className="text-gray-400 shrink-0" />
                </button>
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleFileUpload({ target: { files: files } });
                    }
                  }}
                  className="flex-1 h-[4.5vw] border-2 border-dashed bg-gray-50 rounded-[0.75vw] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-gray-50 transition-all"
                >
                  <Upload size="1.2vw" className="text-gray-500 mb-[0.25vw]" />
                  <p className="text-[0.6vw] text-gray-400 font-medium text-center">Drag & Drop or <span className="font-bold text-indigo-600">Upload</span></p>
                </div>
              </div>

                </div>
              )}
            </div>

            {!isSlideshow && (
              <div className="space-y-[0.75vw]">
                <div className="flex items-center gap-[0.5vw]">
                  <DraggableSpan label="Opacity" value={opacity} onChange={setOpacity} className="text-[0.85vw] font-bold text-gray-900 whitespace-nowrap" />
                  <div className="h-[0.1vw] w-full bg-gray-200" />
                </div>
                <div className="flex items-center gap-[0.75vw] px-[0.25vw]">
                  <div className="flex-1 space-y-[0.5vw]">
                    <input type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full h-[0.25vw] rounded- appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #f3f4f6 ${opacity}%, #f3f4f6 100%)` }} />
                  </div>
                  <span className="text-[0.75vw] font-bold text-gray-700 w-[2.5vw] text-right self-end mb-[0.25vw]">{opacity}%</span>
                </div>
              </div>
            )}

            {!isSlideshow && (
               /* GALLERY PREVIEW BOX */
               <div
                 onClick={() => setShowGallery(true)}
                 className="relative w-full h-[7vw] border border-gray-200 rounded-[0.5vw] cursor-pointer overflow-hidden bg-gray-100 mt-[0.5vw] mb-[1vw]"
               >
                 {/* Preview thumbnails */}
                 <div className="absolute inset-0 grid grid-cols-3 gap-[0.1vw] p-[0.25vw]">
                   {galleryPreviews.slice(0, 3).map((src, i) => (
                     <div key={i} className="relative overflow-hidden rounded-[0.3vw]">
                       <img
                         src={src}
                         alt=""
                         className="w-full h-full object-cover"
                       />
                       <div className="absolute inset-0 bg-black/40" />
                       <div className="absolute bottom-[0.25vw] left-[0.25vw] right-[0.25vw] text-[0.5vw] text-white text-center truncate">
                         {i === 0
                           ? "Nature"
                           : i === 1
                             ? "Ocean"
                             : "Camping"}
                       </div>
                     </div>
                   ))}
                 </div>

                 {/* Overlay content */}
                 <div className="relative z-10 flex flex-col items-center justify-center h-full bg-gradient-to-t from-black/70 to-black/30">
                   <div className="flex items-center gap-[0.5vw] text-white bg-black/40 px-[1vw] py-[0.5vw] rounded-[0.5vw] backdrop-blur-sm">
                     <ImageIcon size="0.9vw" />
                     <p className="text-[0.8vw] font-semibold">Image Gallery</p>
                   </div>
                 </div>
               </div>
             )}

            <div className="space-y-3">

              {isSlideshow && (
                <SlideshowProperties 
                  selectedElement={selectedElement}
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
                />
              )}

              
              
              <div className="border border-gray-100 rounded-[0.75vw] overflow-hidden shadow-sm bg-white">
                <button onClick={() => setOpenSubSection(openSubSection === 'adjustments' ? null : 'adjustments')} className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.85vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>Adjustments</span>
                  <ChevronDown size="1vw" className={`text-gray-400 transition-transform duration-200 ${openSubSection === 'adjustments' ? 'rotate-180' : ''}`} />
                </button>
                {openSubSection === 'adjustments' && (
                  <div className="relative px-[1.5vw] pb-[1.25vw] pt-[1.25vw] border-t border-gray-100">
                  <div className="px-[0.25vw] pb-[0.5vw] space-y-[0.5vw] text-[0.75vw] animate-in slide-in-from-top-2">
                    {[
                      ['Exposure', 'exposure', -100, 100], ['Contrast', 'contrast', -100, 100], ['Saturation', 'saturation', -100, 100], ['Temperature', 'temperature', -100, 100], ['Tint', 'tint', -180, 180], ['Highlights', 'highlights', -100, 100], ['Shadows', 'shadows', -100, 100],
                    ].map(([label, key, min, max]) => (
                      <div key={key} className="space-y-[0.25vw]">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-[0.5vw]">
                            <DraggableSpan label={label} value={filters[key]} onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))} min={min} max={max} className="text-[0.8vw] font-medium text-gray-700" />
                            <button 
                              onClick={() => setFilters((f) => ({ ...f, [key]: 0 }))} 
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                              title={`Reset ${label}`}
                            >
                              <RotateCcw size="0.75vw" />
                            </button>
                          </div>
                          <span className="text-[0.75vw] font-bold text-gray-900">{filters[key]}</span>
                        </div>
                        <input type="range" min={min} max={max} value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: +e.target.value }))} style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((filters[key] - min) / (max - min)) * 100}%, #f3f4f6 ${((filters[key] - min) / (max - min)) * 100}%, #f3f4f6 100%)` }} />
                      </div>
                    ))}
                  </div>
                  </div>
                )}
              </div>

              <div className="border border-gray-100 rounded-[0.75vw] overflow-hidden shadow-sm bg-white">
                <button onClick={() => setOpenSubSection(openSubSection === 'radius' ? null : 'radius')} className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.85vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>Corner Radius</span>
                  <ChevronDown size="1vw" className={`text-gray-400 transition-transform duration-200 ${openSubSection === 'radius' ? 'rotate-180' : ''}`} />
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
                <button onClick={() => setOpenSubSection(openSubSection === 'effect' ? null : 'effect')} className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.85vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>Effect</span>
                  <ChevronDown size="1vw" className={`text-gray-400 transition-transform duration-200 ${openSubSection === 'effect' ? 'rotate-180' : ''}`} />
                </button>
                {openSubSection === 'effect' && (
                  <div className="relative px-[1.5vw] pb-[1.25vw] pt-[1.25vw] border-t border-gray-100">
                  <div className="p-0 pt-0 space-y-[0.5vw]  bg-white border-t border-gray-50">
                    {['Drop Shadow', 'Inner Shadow', 'Blur', 'Background Blur'].map((eff) => (
                      <div key={eff} className="relative">
                        <div 
                          onClick={() => {
                            const isActive = activeEffects.includes(eff);
                            if (!isActive) {
                              setActiveEffects(prev => [...prev, eff]);
                              setActivePopup(eff);
                            } else {
                              setActivePopup(activePopup === eff ? null : eff);
                            }
                          }}
                          className={`flex items-center justify-between p-[0.5vw] rounded-[0.5vw] border transition-all cursor-pointer ${activePopup === eff ? 'border-black-800 bg-indigo-50/20' : 'bg-gray-50/80 border-gray-100 hover:border-gray-300'}`}
                        >
                          <span className="text-[0.75vw] font-bold text-gray-700 flex-1">{eff}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const isActive = activeEffects.includes(eff);
                              if (isActive) { 
                                setActiveEffects(prev => prev.filter(e => e !== eff)); 
                                if (activePopup === eff) setActivePopup(null); 
                              } else { 
                                setActiveEffects(prev => [...prev, eff]); 
                                setActivePopup(eff); 
                              }
                            }}
                            className="p-[0.25vw] hover:bg-white/50 rounded-[0.5vw] transition-colors"
                          >
                            {activeEffects.includes(eff) ? <Trash2 size="1vw" className="text-red-500" /> : <Plus size="1vw" className="text-gray-400" />}
                          </button>
                        </div>
                        {activePopup === eff && (
                          <div className="fixed z-[50] bg-white rounded-[0.5vw] shadow-2xl border border-gray-100 p-[1.5vw] animate-in slide-in-from-right-4 fade-in duration-200" style={{ width: '18vw', top: '35%', left: '92%', transform: 'translateX(-120%)' }}>
                            <div className="flex items-center mb-[1vw]">
                              <span className="text-[0.85vw] font-bold text-gray-800">{eff}</span>
                              <div className="h-[0.1vw] flex-1 mx-[0.75vw] bg-gray-100" />
                              <button onClick={() => setActivePopup(null)} className="p-[0.375vw] rounded-[0.5vw] hover:bg-gray-100 transition" aria-label="Close"><X size="1vw" className="text-gray-500" /></button></div>
                            <div className="space-y-[0.75vw]">
                              {eff.includes('Shadow') && (
                                <><div className="flex items-start gap-[0.5vw]"><div className="relative"><div className="w-[4vw] h-[4vw] rounded-[0.25vw] flex items-center justify-center text-white text-[0.85vw] font-semibold cursor-pointer overflow-hidden" style={{ background: `linear-gradient(to right, ${effectSettings[eff].color} 0%, ${effectSettings[eff].color}88 50%, transparent 100%)` }}><span className="relative z-10">{effectSettings[eff].opacity} %</span><input type="color" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div></div><div className="flex-1 space-y-[0.75vw]"><div className="flex items-center gap-[0.5vw]"><span className="text-[0.75vw] text-gray-800 font-normal whitespace-nowrap">Code :</span><div className="flex-1 relative"><input type="text" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="w-full text-[0.85vw] text-gray-800 outline-none bg-transparent border border-gray-300 rounded-[0.5vw] px-[0.75vw] pr-[2vw] h-[2.25vw]" />
                                <div className="absolute right-[0.5vw] top-1/2 -translate-y-1/2 w-[1vw] h-[1vw] cursor-pointer"><Pencil size="1vw" className="text-gray-400" strokeWidth={2} />{'EyeDropper' in window ? <button onClick={() => handleColorPick(eff)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /> : <input type="color" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />}</div></div></div>
                                <div className="flex items-center gap-[0.5vw]">
                                  <DraggableSpan label="Opacity :" value={effectSettings[eff].opacity} onChange={(v) => updateEffectSetting(eff, 'opacity', v)} className="text-[0.75vw] text-gray-800 font-normal whitespace-nowrap" />
                                  <div className="flex-1 flex items-center gap-[0.5vw]">
                                  <input type="range" min="0" max="100" value={effectSettings[eff].opacity} onChange={(e) => updateEffectSetting(eff, 'opacity', Number(e.target.value))} className="flex-1 w-[0.25vw] h-[0.25vw] appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${effectSettings[eff].opacity}%, #e5e7eb ${effectSettings[eff].opacity}%, #e5e7eb 100%)` }} />
                                  <span className="text-[0.75vw] text-gray-800">{effectSettings[eff].opacity} %</span></div></div></div></div>
                                  
                                  <div className="space-y-[0.75vw] pt-[0.5vw]"><EffectControlRow label="X Axis" value={effectSettings[eff].x} onChange={(v) => updateEffectSetting(eff, 'x', v)} min={-100} max={100} />
                                    <EffectControlRow label="Y Axis" value={effectSettings[eff].y} onChange={(v) => updateEffectSetting(eff, 'y', v)} min={-100} max={100} />
                                      <EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} min={0} max={100} />
                                        <EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} min={0} max={100} /></div></>
                              )}
                              {!eff.includes('Shadow') && (
                                <div className="space-y-[0.75vw]">
                                  <EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} min={0} max={100} />
                                <EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} min={0} max={100} /></div>
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
          </div>
        )}
      </div>

      {showInteraction && (
        <InteractionPanel
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onPopupPreviewUpdate={onPopupPreviewUpdate}
          pages={pages}
          activePopupElement={activePopupElement}
          onPopupUpdate={onPopupUpdate}
          TextEditorComponent={TextEditorComponent}
          ImageEditorComponent={ImageEditorComponent || ImageEditor}
          VideoEditorComponent={VideoEditorComponent}
          GifEditorComponent={GifEditorComponent}
          IconEditorComponent={IconEditorComponent}
          isOpen={activeSection === 'interaction'}
          onToggle={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')}
        />
      )}
      
      <AnimationPanel selectedElement={selectedElement} onUpdate={onUpdate} isOpen={activeSection === 'animation'} onToggle={() => setActiveSection(activeSection === 'animation' ? null : 'animation')} />


      {showGallery && (
        <GalleryImage 
          selectedElement={selectedElement}
          onUpdate={onUpdateRef.current}
          onClose={() => setShowGallery(false)}
          currentPageVId={currentPageVId}
          flipbookVId={flipbookVId}
          folderName={folderName}
          flipbookName={flipbookName}
          onSelect={async (img) => {
             // 1. Optimistic Update
             const optimisticUrl = img.url;
             selectedElement.src = optimisticUrl;
             setPreviewSrc(optimisticUrl);
             selectedElement.removeAttribute('data-original-src');
             selectedElement.removeAttribute('data-cropped-src');
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
                    // Fetch blob from URL to re-upload as asset
                    // Use axios with blob response type for better compatibility
                    try {
                        const response = await axios.get(img.url, { responseType: 'blob' });
                        const contentType = response.headers['content-type'] || 'image/png';
                        // Extract useful extension or default
                        const ext = contentType.split('/')[1] || 'png';
                        const filename = img.name ? (img.name.endsWith('.' + ext) ? img.name : `${img.name}.${ext}`) : `gallery_image.${ext}`;
                        
                        fileToUpload = new File([response.data], filename, { type: contentType });
                    } catch (fetchErr) {
                        console.error("Failed to fetch gallery image for re-upload:", fetchErr);
                        // If fetch fails (e.g. CORS), we can't upload to backend as a new asset.
                        // We leave the optimistic URL (links to gallery) as fallback.
                    }
                }
                
                if (fileToUpload) {
                    const formData = new FormData();
                    formData.append('emailId', user.emailId);
                    if (flipbookVId) formData.append('v_id', flipbookVId);
                    
                    // Defaults for unsaved books to ensure storage
                    formData.append('folderName', folderName || 'My Flipbooks');
                    formData.append('flipbookName', flipbookName || 'Untitled Document');
                    
                    formData.append('type', 'image');
                    formData.append('assetType', 'Image');
                    formData.append('page_v_id', currentPageVId || 'global');
                    
                    // Handle Replacement
                    const existingFileVid = selectedElement.dataset.fileVid;
                    if (existingFileVid) {
                        formData.append('replacing_file_v_id', existingFileVid);
                    }
                    
                    formData.append('file', fileToUpload);
                    
                    const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
                    
                    if (res.data.url) {
                        const serverUrl = `${backendUrl}${res.data.url}`;
                        
                        // Update DOM with final server URL and new File ID
                        selectedElement.src = serverUrl;
                        selectedElement.dataset.fileVid = res.data.file_v_id;
                        setPreviewSrc(serverUrl);
                        
                        if (onUpdate) onUpdate({ shouldRefresh: true });
                        console.log("Gallery Image successfully stored as Asset:", res.data.filename);
                    }
                }
             } catch (err) {
                console.error("Gallery Select Backend Sync Failed:", err);
             }
             
             setShowGallery(false);
          }}
        />
      )}      {isCropping && (
        <ImageCropOverlay 
            imageSrc={selectedElement.getAttribute('data-original-src') || previewSrc || selectedElement.src}
            element={selectedElement}
            onSave={({ inset, scale, offX, offY, crop }) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        const sw = (crop.width / 100) * img.naturalWidth;
                        const sh = (crop.height / 100) * img.naturalHeight;
                        const sx = (crop.left / 100) * img.naturalWidth;
                        const sy = (crop.top / 100) * img.naturalHeight;
                        
                        canvas.width = sw;
                        canvas.height = sh;
                        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                        
                        const croppedSrc = canvas.toDataURL('image/png');
                        
                        // Temporarily block MutationObserver to prevent sync feedback loops
                        isUpdatingDOM.current = true;
                        
                        // 1. Backup original source if not already backed up
                        const currentSrc = selectedElement.getAttribute('src');
                        const alreadyStoredOriginal = selectedElement.getAttribute('data-original-src');
                        if (!alreadyStoredOriginal || alreadyStoredOriginal === croppedSrc) {
                            // If we don't have a backup, or if the backup is currently the same as the crop (bug prevention),
                            // use the current previewSrc or existing src as the original.
                            selectedElement.setAttribute('data-original-src', previewSrc || currentSrc);
                        }
                        
                        // 2. Definitively replace the source in the template and store backup
                        selectedElement.src = croppedSrc;
                        selectedElement.setAttribute('src', croppedSrc);
                        selectedElement.setAttribute('data-cropped-src', croppedSrc);
                        if (selectedElement.dataset) selectedElement.dataset.src = croppedSrc;
                        
                        // 3. Clear all CSS cropping artifacts
                        selectedElement.style.removeProperty('clip-path');
                        selectedElement.style.removeProperty('-webkit-clip-path');
                        selectedElement.style.removeProperty('transform');
                        selectedElement.style.setProperty('object-fit', 'cover', 'important');
                        
                        // 4. Sync React state
                        setPreviewSrc(croppedSrc);
                        setImageType('Crop');
                        stateRef.current.previewSrc = croppedSrc;
                        stateRef.current.imageType = 'Crop';
                        
                        // 5. Update parent and close
                        setIsCropping(false);
                        if (onUpdate) onUpdate({ shouldRefresh: true });
                        
                        // 5. Release block after DOM and State have settled
                        setTimeout(() => { isUpdatingDOM.current = false; }, 300);
                        
                    } catch (err) {
                        console.error("Critical Crop Error:", err);
                        setIsCropping(false);
                        isUpdatingDOM.current = false;
                    }
                };
                img.onerror = () => {
                    setIsCropping(false);
                    isUpdatingDOM.current = false;
                };
                img.src = selectedElement.getAttribute('data-original-src') || previewSrc || selectedElement.src;
            }}
            onCancel={() => setIsCropping(false)}
        />
      )}
    </div>
  );
};

export default ImageEditor;