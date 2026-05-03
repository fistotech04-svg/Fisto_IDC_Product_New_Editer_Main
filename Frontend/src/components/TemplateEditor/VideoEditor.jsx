// VideoEditor.jsx - Context-sensitive video editing panel
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Icon } from "@iconify/react";

import {
  Video as VideoIcon,
  Upload,
  RefreshCw,
  Trash2,
  Sliders,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Replace,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Video,
  X,
} from "lucide-react";
import VideoGalleryModal from "./VideoGalleryModal";
import ColorPicker, { parseGradient } from "./ColorPicker";
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import { createPortal } from "react-dom";

// Switch toggle component (matches SlideshowProperties style)
const Switch = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`group relative inline-flex items-center h-[1vw] w-[2vw] shrink-0 cursor-pointer rounded-[1vw] transition-all duration-200 ease-in-out border outline-none ${
              enabled ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-transparent border-[#4A3AFF]'
            }`}
  >
    <div
      className={`pointer-events-none flex items-center justify-center h-[1.1vw] w-[1.1vw] rounded-full shadow-sm transition-all duration-200 border-[0.01vw] ease-in-out absolute ${
        enabled ? 'left-[1.1vw] bg-white border-[#4A3AFF]' : 'right-[1.1vw] bg-[#4A3AFF] border-[#4A3AFF]'
      }`}
    >
      {enabled && (
        <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] text-indigo-600" />
      )}
    </div>
  </button>
);

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
    return () => { 
      window.removeEventListener('mousemove', handleMove); 
      window.removeEventListener('mouseup', handleUp); 
      document.body.style.cursor = ''; 
    };
  }, [isDragging, onChange, corner]);

  const onMouseDown = (e) => {
    e.preventDefault(); 
    setIsDragging(true);
    startXRef.current = e.clientX; 
    startValRef.current = Number(value) || 0;
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
    return () => { 
      window.removeEventListener('mousemove', handleMove); 
      window.removeEventListener('mouseup', handleUp); 
      document.body.style.cursor = ''; 
    };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); 
    setIsDragging(true);
    startXRef.current = e.clientX; 
    startValRef.current = Number(value);
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
    return () => { 
      window.removeEventListener('mousemove', handleMove); 
      window.removeEventListener('mouseup', handleUp); 
      document.body.style.cursor = ''; 
    };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); 
    setIsDragging(true);
    startXRef.current = e.clientX; 
    startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

const debounce = (fn, delay = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const VideoEditor = ({
  selectedElement,
  selectedLayerId,
  activePageIndex,
  onUpdate,
  onPopupPreviewUpdate,
  currentPageVId,
  flipbookVId,
  folderName,
  flipbookName,
  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  pages
}) => {
  const { v_id: paramVId } = useParams();
  const activeVId = flipbookVId || paramVId;

  const fileInputRef = useRef(null);
  const [openGallery, setOpenGallery] = useState(false);
  const [tab, setTab] = useState("gallery");
  const coverInputRef = useRef(null);
  
  const [previewSrc, setPreviewSrc] = useState(null);
  const [posterSrc, setPosterSrc] = useState(null);
  const [videoType, setVideoType] = useState("fit");
  const [showVideoTypeDropdown, setShowVideoTypeDropdown] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  const [controls, setControls] = useState(true);
  const [controlsSize, setControlsSize] = useState(100);
  
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [coverOption, setCoverOption] = useState("auto"); // "upload" or "auto"
  
  const [bgColor, setBgColor] = useState("#000000");
  const [bgOpacity, setBgOpacity] = useState(100);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  const [radius, setRadius] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });
  const [isRadiusLinked, setIsRadiusLinked] = useState(true);
  const [activeEffects, setActiveEffects] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 8, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 0, y: 0, blur: 10, spread: 0 },
    'Blur': { blur: 5, spread: 0 },
    'Background Blur': { blur: 10, spread: 0 }
  });
  const [openSubSection, setOpenSubSection] = useState(null);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | null

  const [stroke, setStroke] = useState("transparent");
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  const [strokeWeight, setStrokeWeight] = useState(0);
  const [strokeType, setStrokeType] = useState("Solid");
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [strokeDashLength, setStrokeDashLength] = useState(5);
  const [strokeDashGap, setStrokeDashGap] = useState(5);
  const [strokeDashPosition, setStrokeDashPosition] = useState('Center');
  const [strokeLinecap, setStrokeLinecap] = useState('butt');

  const isUpdatingDOM = useRef(false);
  const isUpdatingDOMTimeoutRef = useRef(null);
  const isHydrating = useRef(true);
  const onUpdateTimerRef = useRef(null);

  // Helper to get colors used on the current page
  const colorsOnPage = useMemo(() => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const elements = doc.querySelectorAll('[data-fill-color], [data-stroke-color]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color');
      const stroke = el.getAttribute('data-stroke-color');
      if (fill && fill !== 'none' && fill !== '#' && !fill.includes('gradient')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke !== '#' && !stroke.includes('gradient')) colors.add(stroke.toUpperCase());
    });
    // Add default white and black if not present
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [selectedElement, pages]);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const debouncedUpdate = useMemo(
    () => debounce((...args) => onUpdateRef.current?.(...args), 800),
    [],
  );

  const galleryPreviews = useMemo(
    () => [
      "https://www.abcconsultants.in/wp-content/uploads/2023/07/Industrial.jpg",
      "https://www.shutterstock.com/image-photo/engineers-discussing-project-outdoors-industrial-260nw-2624485537.jpg",
      "https://thumbs.dreamstime.com/b/professional-people-workers-working-modern-technology-robotic-industry-automation-manufacturing-engineer-robot-arm-assembly-413769130.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjnXGV5m5a_3qpSA5aZOiTI2cxP12fiECP7A&s",
    ],
    [],
  );

  const lastElementRef = useRef(null);

  const syncStateFromDOM = useCallback((force = false) => {
    // Re-resolve the live element from the active page container
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;
    
    if (!liveElement) return;
    
    // Only skip if it's the SAME element and we are currently updating the DOM.
    if (isUpdatingDOM.current && !force && liveElement === lastElementRef.current) return;
    lastElementRef.current = liveElement;

    const container = liveElement.tagName === "FOREIGNOBJECT" ? liveElement : (liveElement.querySelector("foreignObject") || liveElement.closest("foreignObject"));
    const target = container ? container.querySelector("video, iframe") : (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME" ? liveElement : liveElement.querySelector("video, iframe"));
    
    if (!target) return;
    const visualTarget = container || target;

    // 1. Dimensions
    const w = parseInt(visualTarget.getAttribute('data-width') || visualTarget.getAttribute('width') || visualTarget.style.width) || 0;
    const h = parseInt(visualTarget.getAttribute('data-height') || visualTarget.getAttribute('height') || visualTarget.style.height) || 0;
    setWidth(w);
    setHeight(h);

    // 2. Opacity
    const op = parseFloat(visualTarget.getAttribute('data-opacity') || visualTarget.style.opacity || visualTarget.getAttribute('opacity') || "1");
    setOpacity(Math.round(op * 100));

    // 3. Colors & Stroke
    const fill = visualTarget.getAttribute('data-bg-color') || visualTarget.style.backgroundColor || visualTarget.getAttribute('fill') || "#000000";
    setBgColor(fill);

    const stColor = visualTarget.getAttribute('data-stroke-color') || visualTarget.style.borderColor || visualTarget.getAttribute('stroke') || "transparent";
    setStroke(stColor);

    const stWeight = parseFloat(visualTarget.getAttribute('data-stroke-width') || visualTarget.style.borderWidth || visualTarget.getAttribute('stroke-width') || "0");
    setStrokeWeight(stWeight);

    const dashData = visualTarget.getAttribute('stroke-dasharray') || 'none';
    const isDashed = dashData !== 'none' && dashData !== '';
    setStrokeType(isDashed ? 'Dashed' : 'Solid');
    
    // 3b. Dashed Stroke Settings
    if (isDashed) {
      const parts = dashData.split(',');
      setStrokeDashLength(parseInt(parts[0]) || 5);
      setStrokeDashGap(parseInt(parts[1] || parts[0]) || 5);
    }
    setStrokeDashPosition(visualTarget.getAttribute('data-stroke-position') || 'Center');
    setStrokeLinecap(visualTarget.getAttribute('stroke-linecap') || 'butt');

    // 4. Radius
    const brData = visualTarget.getAttribute('data-radius');
    if (brData) {
        try { setRadius(JSON.parse(brData)); } catch(e) {}
    } else {
        const br = visualTarget.style.borderRadius || "";
        if (br) {
            const parts = br.split(' ').map(p => parseInt(p) || 0);
            if (parts.length === 1) setRadius({ tl: parts[0], tr: parts[0], br: parts[0], bl: parts[0] });
            else if (parts.length === 4) setRadius({ tl: parts[0], tr: parts[1], br: parts[2], bl: parts[3] });
        }
    }

    // 5. Effects
    const effectsData = visualTarget.getAttribute('data-effects');
    if (effectsData) {
        try {
            const parsed = JSON.parse(effectsData);
            if (parsed.activeEffects) setActiveEffects(parsed.activeEffects);
            if (parsed.effectSettings) setEffectSettings(prev => ({ ...prev, ...parsed.effectSettings }));
        } catch (e) {}
    }

    // 6. Media Specific
    if (target.tagName === "VIDEO") {
      const src = target.currentSrc || target.src || target.querySelector("source")?.src || null;
      setPreviewSrc(src);
      const poster = target.getAttribute('poster') || target.poster || null;
      setPosterSrc(poster || null);
      
      const posterType = target.getAttribute('data-poster-type');
      if (posterType === 'auto' || posterType === 'upload') {
        setCoverOption(posterType);
      } else {
        // Fallback for older elements without the attribute
        setCoverOption(poster ? 'upload' : 'auto');
      }
      setAutoplay(target.autoplay || target.hasAttribute('autoplay'));
      setLoop(target.loop || target.hasAttribute('loop'));
      setControls(target.controls || !target.classList.contains('hide-controls'));
      const rawCtrlSize = target.getAttribute('data-controls-size');
      const ctrlSize = rawCtrlSize ? parseInt(rawCtrlSize) : 100;
      setControlsSize(isNaN(ctrlSize) ? 100 : Math.max(0, Math.min(100, ctrlSize)));
      const rawFit = target.getAttribute('data-object-fit') || target.style.objectFit || 'Fit';
      const reverseMap = { 'contain': 'Fit', 'cover': 'Fill', 'fill': 'Stretch' };
      setVideoType(reverseMap[rawFit] || (rawFit.charAt(0).toUpperCase() + rawFit.slice(1)) || 'Fit');
    } else if (target.tagName === "IFRAME") {
      setPreviewSrc(target.src || null);
      setPosterSrc(null);
      setCoverOption('auto');
    }

    setTimeout(() => { isHydrating.current = false; }, 200);
  }, [selectedElement]);

  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
        if (isUpdatingDOM.current) return;
        const relevantMutation = mutations.some(m => m.type === 'attributes');
        if (relevantMutation) syncStateFromDOM();
    });
    observer.observe(selectedElement, { attributes: true, subtree: true });
    isHydrating.current = true;
    syncStateFromDOM(true);
    return () => {
        observer.disconnect();
        isUpdatingDOM.current = false;
    };
  }, [selectedElement, selectedLayerId, activePageIndex, syncStateFromDOM]);

  // Close pickers/popups on click-outside or Escape (matches ShapeProperties)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeColorPicker || showDetailedPicker || showStrokeSettings) {
          setActiveColorPicker(null);
          setShowDetailedPicker(false);
          setShowStrokeSettings(false);
          setIsStrokeStyleOpen(false);
        }
      }
    };
    const handleClickOutside = (e) => {
      if (activeColorPicker || showStrokeSettings) {
        const isSelector    = e.target.closest('#main-color-selector');
        const isPicker      = e.target.closest('#deep-color-picker');
        const isTrigger     = e.target.closest('.color-field-trigger');
        const isStrokePopup = e.target.closest('#stroke-settings-popup');
        if (!isSelector && !isPicker && !isTrigger && !isStrokePopup) {
          setActiveColorPicker(null);
          setShowDetailedPicker(false);
          setShowStrokeSettings(false);
          setIsStrokeStyleOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeColorPicker, showDetailedPicker, showStrokeSettings]);

  const applyVisuals = useCallback(() => {
    if (isHydrating.current) return;

    // Re-resolve the live element from the active page container to ensure we are 
    // mutating the node that is actually visible in the DOM, skipping stale references.
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;
    
    if (!liveElement) return;

    const container = liveElement.tagName === "FOREIGNOBJECT" ? liveElement : (liveElement.querySelector("foreignObject") || liveElement.closest("foreignObject"));
    const target = container ? container.querySelector("video, iframe") : (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME" ? liveElement : liveElement.querySelector("video, iframe"));
    
    if (!target) return;
    const visualTarget = container || target;

    isUpdatingDOM.current = true;
    try {
        // Dimensions
        visualTarget.setAttribute('width', width);
        visualTarget.setAttribute('height', height);
        visualTarget.setAttribute('data-width', width);
        visualTarget.setAttribute('data-height', height);
        visualTarget.style.width = `${width}px`;
        visualTarget.style.height = `${height}px`;
        if (container) {
            target.setAttribute('width', '100%');
            target.setAttribute('height', '100%');
            target.style.width = '100%';
            target.style.height = '100%';
        }

        // Opacity
        const opVal = opacity / 100;
        visualTarget.style.opacity = opVal;
        visualTarget.setAttribute('opacity', opVal);
        visualTarget.setAttribute('data-opacity', opVal);

        // Styling
        visualTarget.style.backgroundColor = bgColor;
        visualTarget.setAttribute('data-bg-color', bgColor);
        
        visualTarget.style.borderColor = stroke;
        visualTarget.setAttribute('data-stroke-color', stroke);
        
        visualTarget.style.borderWidth = `${strokeWeight}px`;
        visualTarget.setAttribute('stroke-width', strokeWeight);
        visualTarget.setAttribute('data-stroke-width', strokeWeight); // Keep for legacy
        
        if (strokeType === 'Dashed') {
           const dashArray = `${strokeDashLength},${strokeDashGap}`;
           visualTarget.style.borderStyle = 'dashed';
           visualTarget.setAttribute('stroke-dasharray', dashArray);
        } else {
           visualTarget.style.borderStyle = 'solid';
           visualTarget.setAttribute('stroke-dasharray', 'none');
        }

        // Dashed Stroke Attributes aligned with ShapeProperties
        visualTarget.setAttribute('data-stroke-position', strokeDashPosition);
        visualTarget.setAttribute('stroke-linecap', strokeLinecap);
        visualTarget.setAttribute('stroke-linejoin', strokeLinecap === 'round' ? 'round' : 'miter');

        // Radius
        const radiusStr = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;
        visualTarget.style.borderRadius = radiusStr;
        visualTarget.setAttribute('data-radius', JSON.stringify(radius));
        visualTarget.style.overflow = 'hidden';

        // Object Fit
        const fitMap = { 
            'Fit': 'contain', 'Fill': 'cover', 'Stretch': 'fill',
            'fit': 'contain', 'fill': 'cover', 'stretch': 'fill'
        };
        const targetFit = fitMap[videoType] || 'contain';
        target.style.objectFit = targetFit;
        target.setAttribute('data-object-fit', videoType);

        // Metadata & Effects
        let filterStr = '';
        let boxShadowStr = '';
        activeEffects.forEach(eff => {
          const s = effectSettings[eff];
          if (!s) return;
          if (eff === 'Blur') filterStr += `blur(${s.blur}px) `;
          if (eff === 'Drop Shadow') {
             const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
             boxShadowStr += `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}${alpha}, `;
          }
          if (eff === 'Inner Shadow') {
             const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
             boxShadowStr += `inset ${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}${alpha}, `;
          }
        });
        visualTarget.style.filter = filterStr.trim();
        visualTarget.style.boxShadow = boxShadowStr.trim().replace(/,$/, '');
        visualTarget.setAttribute('data-effects', JSON.stringify({ activeEffects, effectSettings }));

        // Media State (preserving attributes)
        if (target.tagName === "VIDEO") {
            if (autoplay) {
                target.setAttribute('autoplay', '');
                target.autoplay = true;
                target.muted = true;
                target.setAttribute('muted', '');
            } else {
                target.removeAttribute('autoplay');
                target.autoplay = false;
            }
            if (loop) {
                target.setAttribute('loop', '');
                target.loop = true;
            } else {
                target.removeAttribute('loop');
                target.loop = false;
            }
            
            // Always keep native controls OFF — custom controls bar handles the UI.
            // Use a data attribute so the custom controls useEffect knows the user preference.
            target.controls = false;
            target.removeAttribute('controls');
            target.setAttribute('data-show-controls', controls ? 'true' : 'false');
            if (controls) {
                target.classList.remove('hide-controls');
            } else {
                target.classList.add('hide-controls');
            }
            // Controls Size
            target.setAttribute('data-controls-size', controlsSize);
        } else if (target.tagName === "IFRAME") {
            try {
                let urlObj = new URL(target.src);
                let changed = false;
                
                if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
                    const currentAutoplay = urlObj.searchParams.get("autoplay") === "1";
                    const currentControls = urlObj.searchParams.get("controls") !== "0"; // default is 1
                    const currentLoop = urlObj.searchParams.get("loop") === "1";
                    
                    if (autoplay && !currentAutoplay) { urlObj.searchParams.set("autoplay", "1"); urlObj.searchParams.set("mute", "1"); changed = true; }
                    if (!autoplay && currentAutoplay) { urlObj.searchParams.delete("autoplay"); urlObj.searchParams.delete("mute"); changed = true; }
                    
                    if (controls && !currentControls) { urlObj.searchParams.delete("controls"); changed = true; } 
                    if (!controls && currentControls) { urlObj.searchParams.set("controls", "0"); changed = true; }
                    
                    if (loop && !currentLoop) { 
                        urlObj.searchParams.set("loop", "1"); 
                        const videoId = urlObj.pathname.split("/").pop();
                        if (videoId) urlObj.searchParams.set("playlist", videoId);
                        changed = true; 
                    }
                    if (!loop && currentLoop) { urlObj.searchParams.delete("loop"); urlObj.searchParams.delete("playlist"); changed = true; }
                }

                if (changed) {
                    target.src = urlObj.toString();
                    target.setAttribute('src', urlObj.toString());
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        }

        // Trigger parent update
        debouncedUpdate();
    } finally {
        if (isUpdatingDOMTimeoutRef.current) clearTimeout(isUpdatingDOMTimeoutRef.current);
        // Keep isUpdatingDOM true for long enough to cover the debouncedUpdate (800ms)
        // plus the subsequent React re-render cycle.
        isUpdatingDOMTimeoutRef.current = setTimeout(() => {
            isUpdatingDOM.current = false;
        }, 1000);
    }
  }, [selectedElement, selectedLayerId, activePageIndex, width, height, opacity, bgColor, stroke, strokeWeight, strokeType, strokeDashLength, strokeDashGap, strokeDashPosition, strokeLinecap, radius, videoType, activeEffects, effectSettings, autoplay, loop, controls, controlsSize, debouncedUpdate]);

  useEffect(() => {
    applyVisuals();
  }, [applyVisuals]);

  // Globally disable native controls on ALL canvas videos via JS.
  // CSS pseudo-elements don't work inside SVG foreignObject — JS is the only reliable approach.
  useEffect(() => {
    const disableNativeControls = () => {
      // Target videos in page containers and SVG foreignObjects
      document.querySelectorAll('[data-page-index] video, foreignObject video').forEach(video => {
        // Skip videos that already have custom controls injected
        if (!video.hasAttribute('data-custom-ctrl-active')) {
          video.controls = false;
          video.removeAttribute('controls');
        }
      });
    };

    // Run immediately on mount
    disableNativeControls();

    // Also watch for any new video elements added to the DOM (e.g. video swap/upload)
    const observer = new MutationObserver((mutations) => {
      const hasNewVideo = mutations.some(m =>
        Array.from(m.addedNodes).some(n =>
          n.nodeName === 'VIDEO' ||
          (n.querySelectorAll && n.querySelectorAll('video').length > 0)
        )
      );
      if (hasNewVideo) disableNativeControls();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Always inject/overwrite the thumb style so hot-reloads pick up the latest values
    const thumbStyleId = 'custom-video-progress-style';
    let ts = document.getElementById(thumbStyleId);
    if (!ts) {
      ts = document.createElement('style');
      ts.id = thumbStyleId;
      document.head.appendChild(ts);
    }
    ts.textContent = `
      input.custom-video-progress {
        -webkit-appearance: none !important;
        appearance: none !important;
        accent-color: transparent !important;
      }
      input.custom-video-progress::-webkit-slider-thumb {
        -webkit-appearance: none !important;
        appearance: none !important;
        width: 6px !important;
        height: 6px !important;
        border-radius: 50% !important;
        background: #ffffff !important;
        cursor: pointer !important;
        box-shadow: none !important;
        border: none !important;
        margin-top: -2.5px !important;
      }
      input.custom-video-progress::-moz-range-thumb {
        width: 6px !important;
        height: 6px !important;
        border-radius: 50% !important;
        background: #ffffff !important;
        cursor: pointer !important;
        border: none !important;
        box-shadow: none !important;
      }
      input.custom-video-progress::-webkit-slider-runnable-track {
        height: 1px !important;
        background: rgba(255,255,255,0.4) !important;
        border-radius: 1px !important;
      }
    `;

    return () => observer.disconnect();
  }, []);

  // Inject scoped CSS to scale native video controls anchored at bottom
  useEffect(() => {
    if (!selectedLayerId) return;
    const styleId = `vctrl-${selectedLayerId}`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const s = controlsSize / 100;
    // Scale from bottom-center; remove the dark gradient shadow behind controls
    styleEl.textContent = `
      /* ── Hide ALL native controls — we use injected custom controls ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls,
      video[id="${selectedLayerId}"]::-webkit-media-controls {
        display: none !important;
      }

      /* ── Enclosure: pin to bottom, flex column so panel sits at the bottom ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-enclosure,
      video[id="${selectedLayerId}"]::-webkit-media-controls-enclosure {
        transform: scale(${s});
        transform-origin: bottom center;
        overflow: hidden;
        background: transparent !important;
        box-shadow: none !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        align-items: stretch !important;
        padding: 0 !important;
      }

      /* ── Panel: single horizontal row — play | timeline | time | mute | fullscreen | 3-dots ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-panel,
      video[id="${selectedLayerId}"]::-webkit-media-controls-panel {
        background: transparent !important;
        background-image: none !important;
        box-shadow: none !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: flex-start !important;
        width: 100% !important;
        padding: 0 4px !important;
        gap: 2px !important;
        flex-wrap: nowrap !important;
      }

      /* ── Hide floating overlay — only bottom bar is shown ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-overlay-enclosure,
      video[id="${selectedLayerId}"]::-webkit-media-controls-overlay-enclosure {
        display: none !important;
      }

      /* ── Progress / seek bar expands to fill remaining width ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-timeline,
      video[id="${selectedLayerId}"]::-webkit-media-controls-timeline {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        margin: 0 2px !important;
      }

      /* ── Play/pause button — inline, no background ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-play-button,
      video[id="${selectedLayerId}"]::-webkit-media-controls-play-button {
        flex-shrink: 0 !important;
        background: none !important;
        background-color: transparent !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 1px !important;
      }

      /* ── Mute button — inline, no background ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-mute-button,
      video[id="${selectedLayerId}"]::-webkit-media-controls-mute-button {
        flex-shrink: 0 !important;
        background: none !important;
        background-color: transparent !important;
        box-shadow: none !important;
        padding: 0 1px !important;
      }

      /* ── Time displays — compact, no wrap ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-current-time-display,
      video[id="${selectedLayerId}"]::-webkit-media-controls-current-time-display,
      [id="${selectedLayerId}"] video::-webkit-media-controls-time-remaining-display,
      video[id="${selectedLayerId}"]::-webkit-media-controls-time-remaining-display {
        flex-shrink: 0 !important;
        white-space: nowrap !important;
        padding: 0 1px !important;
      }

      /* ── Fullscreen button — inline, no background ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-fullscreen-button,
      video[id="${selectedLayerId}"]::-webkit-media-controls-fullscreen-button {
        flex-shrink: 0 !important;
        background: none !important;
        background-color: transparent !important;
        box-shadow: none !important;
        padding: 0 2px !important;
      }

      /* ── 3-dots overflow button — inline, no background ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-overflow-button,
      video[id="${selectedLayerId}"]::-webkit-media-controls-overflow-button {
        flex-shrink: 0 !important;
        background: none !important;
        background-color: transparent !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 3px !important;
      }

      /* ── Loading spinner ── */
      [id="${selectedLayerId}"] video::-webkit-media-controls-loading-spinner,
      video[id="${selectedLayerId}"]::-webkit-media-controls-loading-spinner {
        transform: scale(${s});
        transform-origin: center center;
      }
    `;
  }, [selectedLayerId, controlsSize]);

  // Inject custom inline controls bar — play | progress | 3-dots — all on one row
  useEffect(() => {
    const ctrlId = `custom-ctrl-${selectedLayerId}`;

    const cleanup = () => {
      const old = document.getElementById(ctrlId);
      if (old) old.remove();
    };

    if (!selectedLayerId || !controls) {
      cleanup();
      return cleanup;
    }

    // Resolve the live video element
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveEl =
      pageContainer?.querySelector(`[id="${selectedLayerId}"]`) ||
      document.getElementById(selectedLayerId) ||
      selectedElement;
    if (!liveEl) return cleanup;

    const fo =
      liveEl.tagName === 'FOREIGNOBJECT'
        ? liveEl
        : liveEl.querySelector('foreignObject');
    const video = fo
      ? fo.querySelector('video')
      : liveEl.tagName === 'VIDEO'
      ? liveEl
      : liveEl.querySelector('video');
    if (!video) return cleanup;

    // Disable native browser controls — we draw our own
    video.controls = false;
    video.removeAttribute('controls');
    video.setAttribute('data-custom-ctrl-active', 'true');

    // Mount point: the div/body inside the foreignObject (or the video's direct parent)
    const mountPoint = video.parentElement || fo || liveEl;
    if (!mountPoint) return cleanup;
    if (mountPoint.style) {
      mountPoint.style.position = 'relative';
      // Pass pointer events through to the SVG canvas so dragging still works.
      // Only the explicit control buttons/inputs will capture events (pointerEvents: 'auto').
      mountPoint._prevPointerEvents = mountPoint.style.pointerEvents;
      mountPoint.style.pointerEvents = 'none';
    }

    cleanup(); // remove any stale bar first

    /* ── Build the bar ──────────────────────────────────────────── */
    const bar = document.createElement('div');
    bar.id = ctrlId;
    Object.assign(bar.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      boxSizing: 'border-box',
      background: 'rgba(0,0,0,0.45)',
      zIndex: '9999',
      pointerEvents: 'none',
    });

    /* ── Play / Pause button ── */
    const PLAY_SVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>`;
    const PAUSE_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    const playBtn = document.createElement('button');
    playBtn.innerHTML = PLAY_SVG;
    Object.assign(playBtn.style, {
      background: 'none', border: 'none', color: 'white',
      cursor: 'pointer', padding: '0', display: 'flex',
      alignItems: 'center', flexShrink: '0',
      pointerEvents: 'auto',
    });
    const onPlay  = () => { playBtn.innerHTML = PAUSE_SVG; };
    const onPause = () => { playBtn.innerHTML = PLAY_SVG; };
    video.addEventListener('play',  onPlay);
    video.addEventListener('pause', onPause);
    playBtn.onclick = (e) => {
      e.stopPropagation();
      video.paused ? video.play() : video.pause();
    };

    /* ── Progress / Timeline ── */
    const prog = document.createElement('input');
    prog.type = 'range';
    prog.min = '0'; prog.max = '100'; prog.value = '0';
    prog.className = 'custom-video-progress';
    Object.assign(prog.style, {
      flex: '1 1 auto', minWidth: '0',
      cursor: 'pointer', height: '2px',
      appearance: 'none', WebkitAppearance: 'none',
      background: 'rgba(255,255,255,0.4)',
      borderRadius: '1px', outline: 'none', border: 'none',
      pointerEvents: 'auto',
    });
    const onTimeUpdate = () => {
      if (video.duration) prog.value = (video.currentTime / video.duration) * 100;
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    prog.oninput = () => {
      if (video.duration) video.currentTime = (prog.value / 100) * video.duration;
    };

    /* ── 3-dots button ── */
    const dotsBtn = document.createElement('button');
    dotsBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
    Object.assign(dotsBtn.style, {
      background: 'none', border: 'none', color: 'white',
      cursor: 'pointer', padding: '0', display: 'flex',
      alignItems: 'center', flexShrink: '0',
      pointerEvents: 'auto',
    });

    bar.appendChild(playBtn);
    bar.appendChild(prog);
    bar.appendChild(dotsBtn);
    mountPoint.appendChild(bar);

    return () => {
      video.removeEventListener('play',       onPlay);
      video.removeEventListener('pause',      onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeAttribute('data-custom-ctrl-active');
      // Restore mountPoint pointer events
      if (mountPoint?.style) {
        mountPoint.style.pointerEvents = mountPoint._prevPointerEvents ?? '';
        delete mountPoint._prevPointerEvents;
      }
      bar.remove();
    };
  }, [selectedLayerId, controls, selectedElement, activePageIndex]);

  const updateElementAttribute = (attr, value) => {
    // These update the local state which then triggers applyVisuals
    if (attr === 'width') setWidth(value);
    else if (attr === 'height') setHeight(value);
    else if (attr === 'opacity') setOpacity(value);
    else if (attr === 'backgroundColor') setBgColor(value);
    else if (attr === 'stroke') setStroke(value);
    else if (attr === 'strokeWeight') setStrokeWeight(value);
    else if (attr === 'strokeType') setStrokeType(value);
    else if (attr === 'strokeDashLength') setStrokeDashLength(value);
    else if (attr === 'strokeDashGap') setStrokeDashGap(value);
    else if (attr === 'strokeDashPosition') setStrokeDashPosition(value);
    else if (attr === 'strokeLinecap') setStrokeLinecap(value);
    else if (attr === 'radius') setRadius(value);
    else if (attr === 'videoType') setVideoType(value);
    else if (attr === 'autoplay') setAutoplay(value);
    else if (attr === 'loop') setLoop(value);
    else if (attr === 'controls') setControls(value);
    else if (attr === 'controlsSize') setControlsSize(value);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLayerId) return;

    // Resolve the live element from the DOM to ensure we don't mutate a stale React reference
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;
    
    if (!liveElement) {
      console.error("Could not resolve live element for upload");
      return;
    }

    let target = null;
    if (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME") {
      target = liveElement;
    } else {
      target = liveElement.querySelector("video, iframe");
    }

    if (!target) {
      console.error("No video/iframe target found for upload");
      return;
    }

    if (target.tagName === "IFRAME") {
      // Replace iframe with a video element
      const newVideo = document.createElement("video");
      newVideo.id = target.id || selectedLayerId;
      newVideo.style.cssText = target.style.cssText;
      
      // Preserve existing structural attributes
      Array.from(target.attributes).forEach(attr => {
        if (!["src", "id", "style", "allow", "allowfullscreen"].includes(attr.name)) {
          newVideo.setAttribute(attr.name, attr.value);
        }
      });
      
      newVideo.controls = true;
      target.replaceWith(newVideo);
      target = newVideo;
    }
    
    if (!target) {
      console.error("No video target found for upload");
      return;
    }

    const videoURL = URL.createObjectURL(file);
    target.src = videoURL;
    target.setAttribute("src", videoURL);
    target.setAttribute("data-filename", file.name);
    const source = target.querySelector("source");
    if (source) {
      source.src = videoURL;
      source.setAttribute("src", videoURL);
    }
    if (target.tagName === "VIDEO") target.load();

    setPreviewSrc(videoURL);
    debouncedUpdate({ newElement: isIframe ? target : undefined });

    const storedUser = localStorage.getItem('user');
    if (storedUser && (activeVId || (folderName && flipbookName))) {
        const user = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        if (activeVId) formData.append('v_id', activeVId);
        if (folderName) formData.append('folderName', folderName);
        if (flipbookName) formData.append('flipbookName', flipbookName);
        formData.append('type', 'video');
        formData.append('page_v_id', currentPageVId || 'global');
        formData.append('file', file);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
            if (res.data.url) {
                const serverUrl = `${backendUrl}${res.data.url}`;
                target.src = serverUrl;
                if (source) source.src = serverUrl;
                debouncedUpdate();
            }
        } catch (err) { 
            console.error("Upload error:", err); 
        }
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLayerId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      // Resolve the live element from the DOM
      const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
      const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;
      
      if (!liveElement) return;

      // Find the video: check if it's a foreignObject containing a video, or the video itself
      let target = null;
      if (liveElement.tagName === "VIDEO") {
        target = liveElement;
      } else if (liveElement.tagName === "FOREIGNOBJECT") {
        target = liveElement.querySelector("video");
      } else {
        const fo = liveElement.querySelector("foreignObject") || liveElement.closest("foreignObject");
        target = fo ? fo.querySelector("video") : liveElement.querySelector("video");
      }

      if (target) {
        target.poster = result;
        target.setAttribute("poster", result);
        target.setAttribute("data-poster-type", "upload");
        setPosterSrc(result);
        debouncedUpdate({ poster: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAutoPickThumbnail = useCallback(() => {
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;
    
    let target = null;
    if (liveElement?.tagName === "VIDEO") {
      target = liveElement;
    } else if (liveElement?.tagName === "FOREIGNOBJECT") {
      target = liveElement.querySelector("video");
    } else {
      const fo = liveElement?.querySelector("foreignObject") || liveElement?.closest("foreignObject");
      target = fo ? fo.querySelector("video") : liveElement?.querySelector("video");
    }
    if (!target) return;

    // Always clear any previously uploaded poster first
    target.poster = '';
    target.removeAttribute('poster');
    target.setAttribute('data-poster-type', 'auto');
    setPosterSrc(null);

    // If video has no source or isn't loaded yet, wait for it
    if (!target.src && !target.querySelector?.('source')?.src) {
      // No video source — just clear the poster and done
      debouncedUpdate({ poster: '' });
      return;
    }

    if (target.readyState < 2) {
      // Video not loaded yet — wait until data is available, then capture
      target.onloadeddata = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = target.videoWidth || 320;
          canvas.height = target.videoHeight || 180;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(target, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL("image/png");
          target.poster = thumbnail;
          target.setAttribute("data-poster-type", "auto");
          setPosterSrc(thumbnail);
          debouncedUpdate({ poster: thumbnail });
        } catch (e) {
          // Canvas capture failed (e.g. CORS) — leave poster cleared
          debouncedUpdate({ poster: '' });
        }
      };
      return;
    }

    // Video is ready — capture current frame immediately
    try {
      const canvas = document.createElement("canvas");
      canvas.width = target.videoWidth || 320;
      canvas.height = target.videoHeight || 180;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(target, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL("image/png");
      target.poster = thumbnail;
      target.setAttribute("data-poster-type", "auto");
      setPosterSrc(thumbnail);
      debouncedUpdate({ poster: thumbnail });
    } catch (e) {
      // Canvas capture failed — leave poster cleared
      debouncedUpdate({ poster: '' });
    }
  }, [selectedElement, selectedLayerId, activePageIndex, debouncedUpdate]);

  const replaceTemplateWithUrl = (url) => {
    if (!selectedLayerId || !url) return;
    
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;
    
    if (!liveElement) return;

    // Find the actual target (video or iframe)
    let target = null;
    if (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME") {
      target = liveElement;
    } else {
      target = liveElement.querySelector("video, iframe");
    }

    if (!target) return;

    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    
    // If the target is already the correct type, just update its src
    if ((isYouTube && target.tagName === "IFRAME") || (!isYouTube && target.tagName === "VIDEO")) {
      let finalUrl = url;
      if (isYouTube) {
        if (url.includes("watch?v=")) finalUrl = `https://www.youtube.com/embed/${url.split("v=")[1]}`;
        if (url.includes("youtu.be")) finalUrl = `https://www.youtube.com/embed/${url.split("/").pop()}`;
      }
      target.src = finalUrl;
      target.setAttribute("src", finalUrl);
      debouncedUpdate();
      return;
    }

    // Otherwise, create a new element of the correct type and swap it
    let newElement;
    if (isYouTube) {
      let embedUrl = url;
      if (url.includes("watch?v=")) embedUrl = `https://www.youtube.com/embed/${url.split("v=")[1]}`;
      if (url.includes("youtu.be")) embedUrl = `https://www.youtube.com/embed/${url.split("/").pop()}`;
      newElement = document.createElement("iframe");
      newElement.src = embedUrl;
      newElement.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      newElement.allowFullscreen = true;
    } else {
      newElement = document.createElement("video");
      newElement.src = url;
      newElement.controls = true;
    }

    newElement.id = target.id || selectedLayerId;
    newElement.style.cssText = target.style.cssText;
    
    // Preserve layout and data attributes
    Array.from(target.attributes).forEach(attr => {
      if (!["src", "id", "style", "allow", "allowfullscreen", "controls"].includes(attr.name)) {
        newElement.setAttribute(attr.name, attr.value);
      }
    });

    target.replaceWith(newElement);
    debouncedUpdate();
  };

  if (!selectedElement) {
    return (
      <div className="border border-gray-200 rounded-[0.5vw] overflow-hidden bg-white shadow-sm p-[1vw] text-center text-gray-400 text-[0.75vw]">
        <VideoIcon className="mx-auto mb-[0.5vw]" size="0.9vw" />
        <p className="text-[0.75vw]">Click on a video to edit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full font-sans text-gray-700 space-y-[1.5vw]">
      <style>{`
        input[type='range']::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.4vw; cursor: pointer; transition: box-shadow 0.15s ease; }
        input[type='range']::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        body.is-scrubbing { overflow: hidden !important; }
      `}</style>

      {/* Video Property Section */}
      <div className="space-y-[1.2vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Video Property</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>
        
        {/* Video Fix Type */}
        <div className="flex items-center justify-between relative px-[0.5vw]">
          <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Video Fit type</span>
          <div className="flex-1 mx-[1vw] border-t border-dashed border-gray-300" />
          <div className="relative">
            <button 
              onClick={() => setShowVideoTypeDropdown(!showVideoTypeDropdown)}
              className="flex items-center justify-between w-[6vw] px-[0.75vw] py-[0.55vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-sm hover:bg-gray-50 transition-colors"
            >
              <span className="text-[0.85vw] font-normal text-gray-700 capitalize">{videoType}</span>
              <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showVideoTypeDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showVideoTypeDropdown && (
              <div className="absolute right-0 top-full mt-[0.5vw]  w-full bg-white border border-gray-100 rounded-[0.6vw] shadow-xl z-50 overflow-hidden py-[0.25vw] animate-in fade-in zoom-in-95 duration-150">
                {["Fit", "Fill", "Stretch"].map((type) => (
                  <div 
                    key={type}
                    onClick={() => {
                      updateElementAttribute('videoType', type);
                      setShowVideoTypeDropdown(false);
                    }}
                    className="px-[0.5vw] py-[0.5vw] items-center justify-center text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 cursor-pointer"
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload/Replace Row */}
        <div className="flex items-start gap-[0.75vw] pt-[0.5vw] px-[0.5vw]">
          {/* Current Video Preview */}
          <div className="flex flex-col items-center gap-[0.35vw]">
            <div 
              className="relative w-[5vw] h-[4.4vw] p-[0.2vw] rounded-[0.5vw] overflow-hidden bg-white flex items-center justify-center group" 
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
            >
              {previewSrc ? (
                previewSrc.includes("youtube.com") || previewSrc.includes("youtu.be") ? (
                  <iframe src={previewSrc} className="w-full h-full object-cover rounded-[0.3vw] pointer-events-none" frameBorder="0" allowFullScreen />
                ) : (
                  <video src={previewSrc} className="w-full h-full object-cover rounded-[0.3vw]" muted />
                )
              ) : (
                <VideoIcon size="1.2vw" className="text-gray-300" />
              )}
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-[0.2vw] cursor-pointer rounded-[0.3vw]" 
                onClick={() => fileInputRef.current?.click()}
              >
                <RefreshCw size="1.1vw" className="text-white" />
                <span className="text-[0.5vw] text-white font-semibold">Refresh</span>
              </div>
            </div>
            <span className="text-[0.6vw] font-semibold text-gray-400">Current</span>
          </div>
          
          {/* Replace Icon */}
          <div className="flex items-center justify-center shrink-0 h-[4.4vw] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Icon icon="qlementine-icons:replace-16" className="w-[1.1vw] h-[1.1vw] text-[#9ca3af]" />
          </div>

          {/* Upload Box */}
          <div className="flex flex-col items-center gap-[0.35vw] flex-1">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 w-full h-[5vw] rounded-[0.75vw] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all bg-white py-[0.2vw]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
            >
              <p className="text-[0.65vw] font-medium text-gray-600 text-center mb-[0.2vw]">
                Drag & Drop or <span className="text-indigo-600 font-semibold">Upload</span>
              </p>
              <Upload size="1.1vw" className="text-gray-400 mb-[0.2vw]" />
              <div className="flex flex-col items-center">
                <span className="text-[0.5vw] font-semibold text-gray-500 uppercase tracking-wider">Supported File Format</span>
                <span className="text-[0.5vw] font-semibold text-gray-500">MP4</span>
              </div>
            </div>
            <span className="text-[0.6vw] font-semibold text-gray-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>Replace</span>
          </div>
        </div>

        {/* OR Divider */}
        <div className="flex items-center gap-[1vw] py-[0.25vw]">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[0.7vw] font-bold text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* URL Input */}
        <div className="flex items-center gap-[0.5vw] px-[0.5vw]">
          <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">URL :</span>
          <div className="flex-1 flex items-center border border-gray-300 rounded-[0.6vw] overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            
            <input 
              type="text" 
              placeholder="https://" 
              className="flex-1 px-[0.75vw] py-[0.55vw] text-[0.85vw] text-gray-700 outline-none bg-transparent"
              onBlur={(e) => replaceTemplateWithUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Video Gallery Button */}
        <div 
          onClick={() => setOpenGallery(true)}
          className="relative w-full h-[3.5vw] bg-black rounded-[0.9vw] overflow-hidden group transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg flex items-center justify-center border border-white/5"
        >
          <div className="absolute inset-0 flex gap-[0.2vw] opacity-20 group-hover:opacity-40 transition-opacity">
            {galleryPreviews.slice(0, 3).map((src, i) => (
              <div key={i} className="flex-1 bg-cover bg-center" style={{ backgroundImage: `url('${src}')` }} />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/10 via-gray-900/20 to-gray-900/40 group-hover:via-gray-900/20 transition-all" />
          <div className="relative z-10 flex items-center gap-[0.75vw]">
            <Icon icon="material-symbols:video-library-outline" className="w-[1vw] h-[1.2vw] text-white" />
            <span className="text-[0.95vw] font-semibold text-white">Video Gallery</span>
          </div>
        </div>
      </div>

      {/* Opacity Section */}
      <div className="space-y-[0.5vw]">
                    <div className="flex items-center gap-[0.5vw]">
                      <span className="text-[0.9vw]  font-semibold text-gray-900 whitespace-nowrap">Opacity</span>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
                    </div>
                    <div className="flex items-center gap-[1vw] pb-[0.5vw]">
                      <div className="flex-1 flex items-center h-[0.7vw] rounded-full outline-none">
                         <input 
              type="range" 
              min="0" max="100" 
              value={opacity} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setOpacity(val);
                // Directly manipulate DOM for zero-flicker feedback
                const container = selectedElement.tagName === "FOREIGNOBJECT" ? selectedElement : (selectedElement.querySelector("foreignObject") || selectedElement.closest("foreignObject"));
                const target = container ? container.querySelector("video, iframe") : (selectedElement.tagName === "VIDEO" || selectedElement.tagName === "IFRAME" ? selectedElement : selectedElement.querySelector("video, iframe"));
                const visualTarget = container || target;
                if (visualTarget) {
                    visualTarget.style.opacity = val / 100;
                    visualTarget.setAttribute('opacity', val / 100);
                }
              }}
              onMouseUp={() => debouncedUpdate()}
              className="w-full cursor-pointer"
                          style={{ background: `linear-gradient(to right, indigo 0%, indigo ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }}
                        />
                      </div>
                      <span className="text-[0.85vw] font-medium text-gray-800 w-[2.3vw] text-right">{opacity} %</span>
                    </div>
                  </div>

      {/* Cover Image Upload Options */}
      <div className="space-y-[1.2vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Cover Image Upload Options</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.4vw' }}> </div>
        </div>
        
        <div className="flex items-center justify-between px-[0.5vw]">
          <div className="flex flex-col gap-[1.2vw]">
            <label className="flex items-center gap-[0.8vw] cursor-pointer group">
              <div 
                className={`w-[1.2vw] h-[1.2vw] rounded-full border-[0.1vw] flex items-center justify-center transition-all ${coverOption === 'upload' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-300'}`}
                onClick={() => { setCoverOption('upload'); coverInputRef.current?.click(); }}
              >
                {coverOption === 'upload' && <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-indigo-600" />}
              </div>
              <span className={`text-[0.75vw] font-medium transition-colors ${coverOption === 'upload' ? 'text-gray-900' : 'text-gray-800'}`}>Upload from your File</span>
            </label>
            <label className="flex items-center gap-[0.8vw] cursor-pointer group">
              <div 
                className={`w-[1.2vw] h-[1.2vw] rounded-full border-[0.1vw] flex items-center justify-center transition-all ${coverOption === 'auto' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-300'}`}
                onClick={() => { setCoverOption('auto'); handleAutoPickThumbnail(); }}
              >
                {coverOption === 'auto' && <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-indigo-600" />}
              </div>
              <span className={`text-[0.75vw] font-medium transition-colors ${coverOption === 'auto' ? 'text-gray-900' : 'text-gray-800'}`}>Auto Pick from video</span>
            </label>
          </div>

          <div 
            onClick={() => coverInputRef.current?.click()}
            className="w-[8vw] h-[5vw] border-2 border-dashed border-gray-200 rounded-[0.8vw] flex flex-col items-center justify-center bg-gray-50/30 hover:border-indigo-400 hover:bg-white transition-all overflow-hidden"
          >
            {posterSrc ? (
              <img src={posterSrc} className="w-full h-full object-cover" />
            ) : (
              <>
                <Upload size="1vw" className="text-gray-300 mb-[0.2vw]" />
                <div className="text-[0.6vw] text-gray-400 text-center px-[0.5vw]">File Format : JPG, PNG</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Video Playback Settings */}
      <div className="space-y-[1.2vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Video Playback Settings</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.3vw' }}> </div>
        </div>
        
        <div className="space-y-[0.8vw] px-[0.5vw]">
          {[
            { label: "Disable Video Controls", value: !controls, onChange: (v) => updateElementAttribute('controls', !v) },
            { label: "Autoplay (Play video automatically)", value: autoplay, onChange: (v) => updateElementAttribute('autoplay', v) },
            { label: "Loop (Repeat video continuously)", value: loop, onChange: (v) => updateElementAttribute('loop', v) }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[0.75vw] font-medium text-gray-800">{item.label}</span>
              <Switch enabled={item.value} onChange={item.onChange} />
            </div>
          ))}



        </div>
      </div>

      {/* Compact Accordion Group */}
      <div className="space-y-[0.75vw]">
        {/* Color Accordion — matches ShapeProperties style */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => setOpenSubSection(openSubSection === 'color' ? null : 'color')}
            className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSubSection === 'color' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-semibold text-gray-900 text-[0.85vw]">Color</span>
            </div>
            <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${openSubSection === 'color' ? '' : 'rotate-180'}`} />
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${openSubSection === 'color' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="p-[1vw] pt-[0.75vw] space-y-[0.5vw]">
                <ColorField
                  label="Fill"
                  color={bgColor}
                  opacity={bgOpacity}
                  onColorChange={(val) => updateElementAttribute('backgroundColor', val)}
                  onOpacityChange={(val) => setBgOpacity(val)}
                  onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
                />
                <ColorField
                  label="Stroke"
                  color={stroke}
                  opacity={strokeOpacity}
                  onColorChange={(val) => updateElementAttribute('stroke', val)}
                  onOpacityChange={(val) => setStrokeOpacity(val)}
                  onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')}
                />

                {stroke && stroke !== 'none' && stroke !== 'transparent' && (
                  <div className="flex items-center gap-[0.4vw] py-[0.1vw]">
                    {/* Spacer — aligns with labels above */}
                    <div className="w-[3vw]" />

                    {/* SlidersHorizontal icon — only when Dashed */}
                    <div className="w-[2.5vw] flex items-center justify-center">
                      {strokeType === 'Dashed' && (
                        <div
                          className="flex items-center justify-center h-[2vw] w-[2vw] hover:bg-white rounded-[0.5vw] cursor-pointer transition-colors shadow-sm"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const popupHeight = 250;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const pos = { right: window.innerWidth - rect.right + 50 };
                            if (spaceBelow < popupHeight) {
                              pos.bottom = window.innerHeight - rect.top + 10;
                              pos.top = 'auto';
                            } else {
                              pos.top = rect.bottom + 10;
                              pos.bottom = 'auto';
                            }
                            setStrokeSettingsPos(pos);
                            setShowStrokeSettings(!showStrokeSettings);
                          }}
                        >
                          <Icon icon="tabler:adjustments-horizontal" width="1.1vw" height="1.1vw" className="text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Solid/Dashed dropdown + weight box */}
                    <div className="flex-grow flex items-center gap-[0.4vw]">
                      <div className="relative flex-grow h-[2.5vw]">
                        <div
                          className={`h-full px-[0.7vw] border-[0.1vw] rounded-[0.75vw] flex items-center gap-[0.5vw] cursor-pointer justify-between bg-white transition-all font-semibold ${isStrokeStyleOpen ? 'border-indigo-500 shadow-sm' : 'border-gray-400 hover:border-indigo-400'}`}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownPos({ top: rect.bottom + 5, left: rect.left, width: rect.width });
                            setIsStrokeStyleOpen(!isStrokeStyleOpen);
                          }}
                        >
                          <span className="text-[0.75vw] text-gray-700 whitespace-nowrap overflow-hidden">
                            {strokeType}
                          </span>
                          <ChevronDown size="0.9vw" className={`text-gray-500 transition-transform ${isStrokeStyleOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isStrokeStyleOpen && createPortal(
                          <div
                            className="absolute py-1 bg-white border border-gray-200 rounded-[0.5vw] shadow-xl z-[9999] animate-in fade-in zoom-in duration-200"
                            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
                          >
                            {['Solid', 'Dashed'].map((type) => (
                              <div
                                key={type}
                                className={`px-[1vw] py-[0.5vw] text-[0.8vw] cursor-pointer transition-colors ${
                                  strokeType === type
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 font-semibold'
                                }`}
                                onClick={() => {
                                  updateElementAttribute('strokeType', type);
                                  setIsStrokeStyleOpen(false);
                                  if (type === 'Solid') setShowStrokeSettings(false);
                                }}
                              >
                                {type}
                              </div>
                            ))}
                          </div>,
                          document.body
                        )}
                      </div>

                      {/* Weight box: line-weight icon (scrubber) + number */}
                      <div className="h-[2.5vw] w-[4.5vw] border-[0.1vw] border-gray-400 rounded-[0.75vw] flex items-center px-[0.6vw] gap-[0.3vw] bg-white hover:border-indigo-400 transition-colors flex-shrink-0">
                        <div
                          className="cursor-ew-resize hover:bg-gray-50 p-[0.2vw] rounded-[0.3vw] transition-colors"
                          onPointerDown={(e) => {
                            handleScrubHelper(e, strokeWeight, (val) => {
                              updateElementAttribute('strokeWeight', Math.max(0, parseInt(val)));
                            }, 8);
                          }}
                        >
                          <Icon icon="material-symbols:line-weight" width="1vw" height="1vw" className="text-gray-500 flex-shrink-0" />
                        </div>
                        <input
                          type="number"
                          value={strokeWeight}
                          onChange={(e) => updateElementAttribute('strokeWeight', parseInt(e.target.value) || 0)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full text-[0.8vw] font-semibold outline-none text-right bg-transparent text-gray-700 no-spin"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Corner Radius Accordion */}
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
        <button 
          onClick={() => setOpenSubSection(openSubSection === 'radius' ? null : 'radius')} 
          className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.9vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span>Corner Radius</span>
          <ChevronDown size="1.1vw" className={`text-gray-900 transition-transform duration-200 ${openSubSection === 'radius' ? 'rotate-180' : ''}`} />
        </button>
        {openSubSection === 'radius' && (
          <div className="relative px-[1.5vw] pb-[1.25vw] pt-[1.25vw] border-t border-gray-100">
            <div className="flex flex-col items-center gap-[1.5vw]">
              <div className="flex items-center gap-[1.5vw]">
                <RadiusBox 
                  corner="tl" 
                  value={radius.tl} 
                  onChange={(c, v) => {
                    const next = isRadiusLinked ? { tl: v, tr: v, br: v, bl: v } : { ...radius, [c]: v };
                    setRadius(next);
                    updateElementAttribute('radius', next);
                  }} 
                  radiusStyle="rounded-tl-3xl rounded-tr-md rounded-br-md rounded-bl-md" 
                />
                <RadiusBox 
                  corner="tr" 
                  value={radius.tr} 
                  onChange={(c, v) => {
                    const next = isRadiusLinked ? { tl: v, tr: v, br: v, bl: v } : { ...radius, [c]: v };
                    setRadius(next);
                    updateElementAttribute('radius', next);
                  }} 
                  radiusStyle="rounded-tr-3xl rounded-tl-md rounded-br-md rounded-bl-md" 
                />
              </div>
              <div className="absolute left-1/2 top-[5vw] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <button 
                  onClick={() => setIsRadiusLinked(!isRadiusLinked)} 
                  className="pointer-events-auto p-[0.375vw] transition-colors bg-white rounded-full shadow-md border border-gray-100"
                >
                  <Icon icon={isRadiusLinked ? "lucide:link" : "lucide:link-2-off"} className={`w-[1.2vw] h-[1.2vw] ${isRadiusLinked ? 'text-indigo-600' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="flex items-center gap-[1.5vw]">
                <RadiusBox 
                  corner="bl" 
                  value={radius.bl} 
                  onChange={(c, v) => {
                    const next = isRadiusLinked ? { tl: v, tr: v, br: v, bl: v } : { ...radius, [c]: v };
                    setRadius(next);
                    updateElementAttribute('radius', next);
                  }} 
                  radiusStyle="rounded-bl-3xl rounded-tr-md rounded-br-md rounded-tl-md" 
                />
                <RadiusBox 
                  corner="br" 
                  value={radius.br} 
                  onChange={(c, v) => {
                    const next = isRadiusLinked ? { tl: v, tr: v, br: v, bl: v } : { ...radius, [c]: v };
                    setRadius(next);
                    updateElementAttribute('radius', next);
                  }} 
                  radiusStyle="rounded-br-3xl rounded-tr-md rounded-tl-md rounded-bl-md" 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Effect Accordion */}
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
        <button 
          onClick={() => setOpenSubSection(openSubSection === 'effect' ? null : 'effect')} 
          className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.9vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span>Effect</span>
          <ChevronDown size="1.1vw" className={`text-gray-900 transition-transform duration-200 ${openSubSection === 'effect' ? 'rotate-180' : ''}`} />
        </button>
        {openSubSection === 'effect' && (
          <div className="p-[1vw] space-y-[0.5vw] border-t border-gray-100 bg-white">
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
                  className={`flex items-center justify-between p-[0.6vw] rounded-[0.6vw] border transition-all cursor-pointer ${activePopup === eff ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' : 'bg-gray-50/80 border-gray-100 hover:border-gray-300'}`}
                >
                  <span className="text-[0.8vw] font-bold text-gray-700 flex-1">{eff}</span>
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
                    className="p-[0.25vw] hover:bg-white/50 rounded-[0.4vw] transition-colors"
                  >
                    {activeEffects.includes(eff) ? <Trash2 size="1vw" className="text-red-500" /> : <Icon icon="lucide:plus" size="1vw" className="text-gray-400" />}
                  </button>
                </div>

                {activePopup === eff && (
                  <div className="fixed z-[9999] bg-white rounded-[0.8vw] shadow-2xl border border-gray-100 p-[1.5vw] animate-in slide-in-from-right-4 fade-in duration-200" style={{ width: '18vw', top: '35%', left: '92%', transform: 'translateX(-120%)' }}>
                    <div className="flex items-center mb-[1.2vw]">
                      <span className="text-[0.9vw] font-bold text-gray-800">{eff}</span>
                      <div className="h-[0.1vw] flex-1 mx-[0.75vw] bg-gray-100" />
                      <button onClick={() => setActivePopup(null)} className="p-[0.375vw] rounded-[0.5vw] hover:bg-gray-100 transition"><Icon icon="lucide:x" size="1vw" className="text-gray-500" /></button>
                    </div>
                    <div className="space-y-[1vw]">
                      {eff.includes('Shadow') && (
                        <>
                          <div className="flex items-start gap-[0.75vw]">
                            <div className="relative">
                              <div 
                                className="w-[4.5vw] h-[4.5vw] rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-semibold cursor-pointer overflow-hidden shadow-inner" 
                                style={{ background: `linear-gradient(to right, ${effectSettings[eff].color} 0%, ${effectSettings[eff].color}88 50%, transparent 100%)` }}
                              >
                                <span className="relative z-10">{effectSettings[eff].opacity}%</span>
                                <input 
                                  type="color" 
                                  value={effectSettings[eff].color} 
                                  onChange={(e) => {
                                    const next = { ...effectSettings, [eff]: { ...effectSettings[eff], color: e.target.value } };
                                    setEffectSettings(next);
                                    updateElementAttribute('effects', next);
                                  }} 
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                />
                              </div>
                            </div>
                            <div className="flex-1 space-y-[0.8vw]">
                              <div className="flex items-center gap-[0.5vw]">
                                <span className="text-[0.8vw] text-gray-800 font-medium">Code :</span>
                                <div className="flex-1 relative">
                                  <input 
                                    type="text" 
                                    value={effectSettings[eff].color.toUpperCase()} 
                                    onChange={(e) => {
                                      const next = { ...effectSettings, [eff]: { ...effectSettings[eff], color: e.target.value } };
                                      setEffectSettings(next);
                                      updateElementAttribute('effects', next);
                                    }} 
                                    className="w-full text-[0.85vw] text-gray-800 outline-none bg-white border border-gray-300 rounded-[0.6vw] px-[0.75vw] h-[2.2vw] font-mono font-bold" 
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-[0.5vw]">
                                <DraggableSpan 
                                  label="Opacity :" 
                                  value={effectSettings[eff].opacity} 
                                  onChange={(v) => {
                                    const next = { ...effectSettings, [eff]: { ...effectSettings[eff], opacity: v } };
                                    setEffectSettings(next);
                                    updateElementAttribute('effects', next);
                                  }} 
                                  className="text-[0.8vw] text-gray-800 font-medium whitespace-nowrap" 
                                />
                                <div className="flex-1 flex items-center gap-[0.5vw]">
                                  <input 
                                    type="range" 
                                    min="0" max="100" 
                                    value={effectSettings[eff].opacity} 
                                    onChange={(e) => {
                                      const next = { ...effectSettings, [eff]: { ...effectSettings[eff], opacity: Number(e.target.value) } };
                                      setEffectSettings(next);
                                      updateElementAttribute('effects', next);
                                    }} 
                                    className="flex-1 cursor-pointer h-[0.3vw] accent-indigo-600" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-[0.8vw] pt-[0.4vw]">
                            <EffectControlRow label="X Axis" value={effectSettings[eff].x} onChange={(v) => { const next = { ...effectSettings, [eff]: { ...effectSettings[eff], x: v } }; setEffectSettings(next); updateElementAttribute('effects', next); }} min={-100} max={100} />
                            <EffectControlRow label="Y Axis" value={effectSettings[eff].y} onChange={(v) => { const next = { ...effectSettings, [eff]: { ...effectSettings[eff], y: v } }; setEffectSettings(next); updateElementAttribute('effects', next); }} min={-100} max={100} />
                            <EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => { const next = { ...effectSettings, [eff]: { ...effectSettings[eff], blur: v } }; setEffectSettings(next); updateElementAttribute('effects', next); }} min={0} max={100} />
                            <EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => { const next = { ...effectSettings, [eff]: { ...effectSettings[eff], spread: v } }; setEffectSettings(next); updateElementAttribute('effects', next); }} min={0} max={100} />
                          </div>
                        </>
                      )}
                      {!eff.includes('Shadow') && (
                        <div className="space-y-[1vw]">
                          <EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => { const next = { ...effectSettings, [eff]: { ...effectSettings[eff], blur: v } }; setEffectSettings(next); updateElementAttribute('effects', next); }} min={0} max={100} />
                          <EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => { const next = { ...effectSettings, [eff]: { ...effectSettings[eff], spread: v } }; setEffectSettings(next); updateElementAttribute('effects', next); }} min={0} max={100} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Hidden Inputs */}
      <input ref={fileInputRef} type="file" accept="video/mp4" className="hidden" onChange={handleVideoUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

      {/* Gallery Modal */}
      {openGallery && (
        <VideoGalleryModal
          tab={tab}
          setTab={setTab}
          selectedElement={selectedElement}
          selectedLayerId={selectedLayerId}
          onClose={() => setOpenGallery(false)}
        />
      )}

      {/* UNIFIED COLOR PICKER PORTAL */}
      {activeColorPicker && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[2999] bg-transparent" 
            onClick={() => {
              setActiveColorPicker(null);
              setShowDetailedPicker(false);
            }}
          />
          <div 
            className="fixed z-[3000] animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              top: '50%',
              right: '22vw', 
              transform: 'translateY(-50%)'
            }}
          >
            <ColorPicker 
              color={(() => {
                if (activeColorPicker === 'fill') return bgColor;
                if (activeColorPicker === 'stroke') return stroke;
                return '#000000';
              })()}
              onChange={(newVal) => {
                if (activeColorPicker === 'fill') {
                  updateElementAttribute('backgroundColor', newVal);
                } else if (activeColorPicker === 'stroke') {
                  updateElementAttribute('stroke', newVal);
                }
              }}
              opacity={activeColorPicker === 'fill' ? bgOpacity : strokeOpacity}
              onOpacityChange={(newOpacity) => {
                if (activeColorPicker === 'fill') setBgOpacity(newOpacity);
                else if (activeColorPicker === 'stroke') setStrokeOpacity(newOpacity);
              }}
              onClose={() => setActiveColorPicker(null)}
              colorsOnPage={colorsOnPage}
            />
          </div>
        </>,
        document.body
      )}


      {/* Dashed Stroke Settings Popup — matches ShapeProperties */}
      {showStrokeSettings && createPortal(
        <div
          id="stroke-settings-popup"
          className="fixed z-[4000] w-[15vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col p-[1vw] space-y-[1vw] animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: strokeSettingsPos.top,
            bottom: strokeSettingsPos.bottom,
            right: strokeSettingsPos.right
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.85vw] font-bold text-gray-800">Dashed</span>
            <div className="h-px flex-grow bg-gray-100" />
            <button
              onClick={() => setShowStrokeSettings(false)}
              className="p-[0.3vw] hover:bg-gray-100 rounded-[0.5vw] transition-colors"
            >
              <X size="1vw" className="text-gray-400" />
            </button>
          </div>

          {/* Position */}
          <div className="flex items-center justify-between">
            <span className="text-[0.75vw] font-bold text-gray-600">Position :</span>
            <div className="relative flex-grow ml-[1vw]">
              <div
                className="h-[2vw] px-[0.7vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-between cursor-pointer hover:bg-gray-50 bg-white min-w-[5.5vw]"
                onClick={() => setIsDashPosOpen(!isDashPosOpen)}
              >
                <span className="text-[0.7vw] font-bold text-gray-700 capitalize">{strokeDashPosition}</span>
                <ChevronDown size="0.8vw" className="text-gray-400" />
              </div>
              {isDashPosOpen && (
                <div className="absolute top-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 py-1 overflow-hidden">
                  {['Inside', 'Center', 'Outside'].map(pos => (
                    <div
                      key={pos}
                      onClick={() => { updateElementAttribute('strokeDashPosition', pos); setIsDashPosOpen(false); }}
                      className="px-[1vw] py-[0.4vw] text-[0.7vw] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                    >
                      {pos}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-[0.1vw] bg-gray-50 w-full" />

          {/* Length & Gap */}
          <div className="space-y-[0.75vw]">
            {[
              { label: 'Length', attr: 'strokeDashLength', val: strokeDashLength },
              { label: 'Gap',    attr: 'strokeDashGap',    val: strokeDashGap    }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span
                  className="text-[0.75vw] font-bold text-gray-600 cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                  onPointerDown={(e) => handleScrubHelper(e, item.val, (v) => updateElementAttribute(item.attr, Math.max(0, parseInt(v) || 0)))}
                >
                  {item.label} :
                </span>
                <div className="flex items-center gap-[0.4vw] h-[2vw]">
                  <button onClick={() => updateElementAttribute(item.attr, Math.max(0, item.val - 1))} className="text-gray-400 hover:text-indigo-600">
                    <ChevronLeft size="0.9vw" />
                  </button>
                  <div className="w-[3.5vw] h-full border border-gray-200 rounded-[0.3vw] flex items-center justify-center bg-white shadow-sm">
                    <input
                      type="number"
                      value={item.val}
                      onChange={(e) => updateElementAttribute(item.attr, Math.max(0, parseInt(e.target.value) || 0))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-center text-[0.75vw] font-bold text-gray-700 outline-none no-spin bg-transparent cursor-text"
                    />
                  </div>
                  <button onClick={() => updateElementAttribute(item.attr, item.val + 1)} className="text-gray-400 hover:text-indigo-600">
                    <ChevronRight size="0.9vw" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="h-[0.1vw] bg-gray-50 w-full" />

          {/* Round Corners */}
          <div className="flex items-center justify-between">
            <span className="text-[0.75vw] font-bold text-gray-600">Round Corners :</span>
            <div
              className={`w-[2.4vw] h-[1.2vw] rounded-full relative cursor-pointer transition-colors ${strokeLinecap === 'round' ? 'bg-indigo-500' : 'bg-gray-200'}`}
              onClick={() => updateElementAttribute('strokeLinecap', strokeLinecap === 'round' ? 'butt' : 'round')}
            >
              <div className={`absolute top-[0.1vw] w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-all ${strokeLinecap === 'round' ? 'translate-x-[1.1vw]' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VideoEditor;