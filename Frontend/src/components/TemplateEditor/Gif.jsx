import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Image as ImageIcon,
  Upload,
  Replace,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Link2Off,
  Edit3,
  ImagePlay,
  Grid,
  Search,
  X,
  Trash2,
  Repeat,
  Sliders,
  Type,
  Maximize,
  Layout,
  Palette,
  Layers,
  Settings2,
  AlignCenterVertical,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pipette,
  Sparkles,
  RotateCcw,
  Minus,
  Plus,
  Check,
  MousePointerClick,
  Pencil
} from "lucide-react";
import GalleryGif from "./GalleryGif";
import ColorPicker from './ColorPicker';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';

const galleryPreviewImages = [
  "https://convertico.com/samples/download.php?format=gif&file=mesmerizing-motion-gif.gif",
  "https://www.easygifanimator.net/images/samples/video-to-gif-sample.gif",
  "https://cdn.dribbble.com/userupload/21557392/file/original-1dc535a0588f83a40ba90ad05452ce77.gif"
];

// --- Helper Components ---

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

const GifEditor = ({
  selectedElement,
  selectedLayerId: propSelectedLayerId,
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
  pages,
  activePageIndex
}) => {
  const { v_id: paramVId } = useParams();
  const activeVId = flipbookVId || paramVId;
  
  // Use prop if available, fallback to selectedElement.id
  const selectedLayerId = propSelectedLayerId || selectedElement?.id;

  const fileInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState('main');
  const [showGallery, setShowGallery] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [imageType, setImageType] = useState('Fill');
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  
  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [radius, setRadius] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });
  const [isRadiusLinked, setIsRadiusLinked] = useState(false);
  const [activeEffects, setActiveEffects] = useState([]);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 8, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 0, y: 0, blur: 10, spread: 0 },
    'Blur': { blur: 5, spread: 0 },
    'Background Blur': { blur: 10, spread: 0 }
  });

  const [backgroundColor, setBackgroundColor] = useState({ 
    fill: 'transparent', 
    fillOpacity: 100, 
    stroke: 'transparent', 
    strokeOpacity: 100, 
    strokeType: 'Solid', 
    strokeWeight: 0 
  });

  const [activeColorPicker, setActiveColorPicker] = useState(null); 
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);

  const isUpdatingDOM = useRef(false);
  const isHydrating = useRef(false);
  const onUpdateTimerRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const getSvgImageEl = useCallback((el) => {
    if (!el) return null;
    const tag = el.tagName?.toLowerCase();
    
    // 1. Direct hit
    if (tag === 'image' || tag === 'img') return el;
    
    // 2. Child search
    const childImg = el.querySelector('image, img');
    if (childImg) return childImg;

    // 3. Pattern search
    const findInPattern = (node) => {
        const fill = node.getAttribute?.('fill') || '';
        if (fill?.startsWith('url(#')) {
            const patternId = fill.match(/url\(#([^)]+)\)/)?.[1];
            if (patternId) {
                const doc = node.ownerDocument;
                const ownerSvg = node.closest('svg');
                const pattern = ownerSvg?.querySelector(`[id="${patternId}"]`) || doc?.getElementById(patternId);
                if (pattern) {
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
    const patternTarget = findInPattern(el);
    if (patternTarget) return patternTarget;

    return null;
  }, []);

  const syncStateFromDOM = useCallback((force = false) => {
    if (!selectedElement) return;
    if (isUpdatingDOM.current && !force) return;

    // isHydrating is only true briefly during selection change
    const tagLower = selectedElement.tagName?.toLowerCase();
    const svgImageEl = getSvgImageEl(selectedElement);
    const isSvgEl = !!svgImageEl || (selectedElement instanceof SVGElement && tagLower !== 'svg');

    // Opacity
    const rawOpacity = isSvgEl
      ? (selectedElement.getAttribute('data-effect-opacity') ? (parseFloat(selectedElement.getAttribute('data-effect-opacity')) / 100).toString() : (selectedElement.getAttribute('opacity') || selectedElement.style.opacity || '1'))
      : (selectedElement.style.opacity || '1');
    setOpacity(Math.round(parseFloat(rawOpacity) * 100));

    // Radius
    if (selectedElement.hasAttribute('data-effect-radius-tl')) {
        setRadius({
            tl: parseFloat(selectedElement.getAttribute('data-effect-radius-tl') || '0'),
            tr: parseFloat(selectedElement.getAttribute('data-effect-radius-tr') || '0'),
            br: parseFloat(selectedElement.getAttribute('data-effect-radius-br') || '0'),
            bl: parseFloat(selectedElement.getAttribute('data-effect-radius-bl') || '0')
        });
    } else {
        const domRadius = selectedElement.style.borderRadius || '0px';
        const rxMatch = domRadius.match(/([.\d]+)px/);
        let radiusVal = rxMatch ? parseFloat(rxMatch[1]) : 0;
        
        if (radiusVal === 0 && tagLower === 'rect') {
            radiusVal = parseFloat(selectedElement.getAttribute('rx') || '0');
        }
        setRadius({ tl: radiusVal, tr: radiusVal, br: radiusVal, bl: radiusVal });
    }

    // Image Type
    const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'none': 'Crop' };
    const currentFit = (svgImageEl || selectedElement).style.objectFit || 'cover';
    setImageType(fitMapRev[currentFit] || 'Fill');

    // Filters & Effects
    if (selectedElement.hasAttribute('data-active-effects')) {
        const attrVal = selectedElement.getAttribute('data-active-effects');
        setActiveEffects(attrVal ? attrVal.split(',').filter(Boolean) : []);
    }

    if (selectedElement.hasAttribute('data-effect-exposure')) {
        setFilters({
            exposure: parseFloat(selectedElement.getAttribute('data-effect-exposure') || '0'),
            contrast: parseFloat(selectedElement.getAttribute('data-effect-contrast') || '0'),
            saturation: parseFloat(selectedElement.getAttribute('data-effect-saturation') || '0'),
            temperature: parseFloat(selectedElement.getAttribute('data-effect-temperature') || '0'),
            tint: parseFloat(selectedElement.getAttribute('data-effect-tint') || '0'),
            highlights: parseFloat(selectedElement.getAttribute('data-effect-highlights') || '0'),
            shadows: parseFloat(selectedElement.getAttribute('data-effect-shadows') || '0'),
        });
    }

    // Background & Stroke
    const fill = selectedElement.style.backgroundColor || selectedElement.getAttribute('fill') || 'transparent';
    const stroke = selectedElement.style.borderColor || selectedElement.getAttribute('stroke') || 'transparent';
    const strokeW = parseInt(selectedElement.style.borderWidth) || parseInt(selectedElement.getAttribute('stroke-width')) || 0;
    const strokeS = (selectedElement.style.borderStyle === 'dashed' || selectedElement.getAttribute('stroke-dasharray')?.includes(',')) ? 'Dashed' : 'Solid';

    setBackgroundColor({
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: 100,
      stroke: stroke === 'none' ? 'transparent' : stroke,
      strokeOpacity: 100,
      strokeType: strokeS,
      strokeWeight: strokeW
    });
  }, [selectedElement, getSvgImageEl]);

  // Handle selection change
  useEffect(() => {
    if (!selectedElement) return;
    isHydrating.current = true;
    syncStateFromDOM(true);
    // Use a small timeout to let the state settle before allowing applyVisuals to write back to DOM
    setTimeout(() => { isHydrating.current = false; }, 50);
  }, [selectedElement, syncStateFromDOM]);

  // Handle external mutations
  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
        if (isUpdatingDOM.current) return;
        const relevant = mutations.some(m => m.type === 'attributes' && (
          m.attributeName === 'src' || m.attributeName === 'href' ||
          m.attributeName === 'opacity' || m.attributeName === 'style' ||
          m.attributeName === 'rx' || m.attributeName === 'ry'
        ));
        if (relevant) syncStateFromDOM();
    });
    observer.observe(selectedElement, { attributes: true });
    return () => observer.disconnect();
  }, [selectedElement, syncStateFromDOM]);

  const applyVisuals = useCallback(() => {
    if (isHydrating.current) return;

    // Use selectedLayerId if available to find the live element in the DOM
    const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
    const liveElement = (selectedLayerId && pageContainer) 
      ? pageContainer.querySelector(`[id="${selectedLayerId}"]`) 
      : (selectedElement?.isConnected ? selectedElement : null);
    
    if (!liveElement) return;

    isUpdatingDOM.current = true;
    try {
        const svgImageEl = getSvgImageEl(liveElement);
        // Correct SVG detection: only true if it's actually an SVG element
        const isSvgEl = liveElement.namespaceURI === "http://www.w3.org/2000/svg";
        const tagLower = liveElement.tagName.toLowerCase();

        const f = filters;
        const exposure = f.exposure || 0;
        const contrast = f.contrast || 0;
        const saturation = f.saturation || 0;
        const temperature = f.temperature || 0;
        const tint = f.tint || 0;
        const h = f.highlights || 0;
        const s = f.shadows || 0;

        let filterStr = "";
        filterStr += `brightness(${100 + exposure + (h/5)}%) `;
        filterStr += `contrast(${100 + contrast + (s/5)}%) `;
        filterStr += `saturate(${100 + saturation}%) `;
        if (tint !== 0) filterStr += `hue-rotate(${tint}deg) `;
        if (temperature > 0) filterStr += `sepia(${temperature/2}%) `;
        else if (temperature < 0) filterStr += `hue-rotate(180deg) sepia(${Math.abs(temperature)/2}%) hue-rotate(-180deg) `;

        if (activeEffects.includes('Blur')) {
            filterStr += `blur(${effectSettings['Blur'].blur}px) `;
        }
        
        let dsCssString = "";
        if (activeEffects.includes('Drop Shadow')) {
            const ds = effectSettings['Drop Shadow'];
            const alpha = Math.round((ds.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = ds.color + (ds.color.length === 7 ? alpha : '');
            // drop-shadow filter is more robust for images and follows transparency
            dsCssString = `drop-shadow(${ds.x}px ${ds.y}px ${ds.blur}px ${colorWithAlpha})`;
        }

        // --- Opacity ---
        const opacityVal = (opacity / 100).toString();
        liveElement.style.opacity = opacityVal;
        if (isSvgEl) liveElement.setAttribute('opacity', opacityVal);

        // --- Radius & Clip-path ---
        const anyR = radius.tl || radius.tr || radius.br || radius.bl;
        if (anyR) {
            const radiusStr = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;
            const clipVal = `inset(0 round ${radiusStr})`;
            
            if (isSvgEl) {
                // If it's a group or wrapper containing an image, clip the image, not the wrapper.
                // Otherwise, clip the element itself.
                if (svgImageEl && svgImageEl !== liveElement) {
                    svgImageEl.style.clipPath = clipVal;
                    svgImageEl.style.webkitClipPath = clipVal;
                    liveElement.style.clipPath = '';
                    liveElement.style.webkitClipPath = '';
                } else {
                    liveElement.style.clipPath = clipVal;
                    liveElement.style.webkitClipPath = clipVal;
                }
                liveElement.removeAttribute('clip-path');
                liveElement.style.transformBox = 'fill-box';
                
                if (tagLower === 'rect') {
                    const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
                    liveElement.setAttribute('rx', maxR.toString());
                }

                liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
                liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
                liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
                liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
            } else {
                // HTML: Use pure border-radius
                liveElement.style.clipPath = '';
                liveElement.style.webkitClipPath = '';
                liveElement.style.setProperty('border-radius', radiusStr, 'important');
                liveElement.style.setProperty('overflow', 'hidden', 'important');
                if (svgImageEl && svgImageEl !== liveElement) {
                    svgImageEl.style.setProperty('border-radius', radiusStr, 'important');
                }
            }
        } else {
            // Reset radius
            liveElement.style.clipPath = '';
            liveElement.style.webkitClipPath = '';
            liveElement.style.borderRadius = '';
            liveElement.style.overflow = '';
            liveElement.removeAttribute('clip-path');
            liveElement.removeAttribute('data-effect-radius-tl');
            liveElement.removeAttribute('data-effect-radius-tr');
            liveElement.removeAttribute('data-effect-radius-br');
            liveElement.removeAttribute('data-effect-radius-bl');
            if (svgImageEl && svgImageEl !== liveElement) {
                svgImageEl.style.clipPath = '';
                svgImageEl.style.webkitClipPath = '';
                svgImageEl.style.borderRadius = '';
            }
            if (tagLower === 'rect') {
                liveElement.removeAttribute('rx');
                liveElement.removeAttribute('ry');
            }
        }

        // --- Filter Application ---
        const adjustOnlyFilter = filterStr.trim() || 'none';
        const shadowOnlyFilter = dsCssString.trim() || 'none';
        const finalFilter = (filterStr + (dsCssString ? ` ${dsCssString}` : '')).trim() || 'none';

        if (isSvgEl) {
            const hasClip = anyR;
            
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
                    
                    shadowCaster.setAttribute('fill', 'black');
                    shadowCaster.setAttribute('fill-opacity', opacityVal);
                    
                    shadowCaster.style.removeProperty('clip-path');
                    shadowCaster.removeAttribute('rx');

                    const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
                    if (maxR > 0) {
                        shadowCaster.setAttribute('rx', maxR.toString());
                    }

                    shadowCaster.style.setProperty('filter', shadowOnlyFilter, 'important');
                    shadowCaster.style.setProperty('display', 'block', 'important');
                }
            } else if (shadowCaster) {
                shadowCaster.style.setProperty('display', 'none', 'important');
            }

            // 3. Apply geometry-level filters to the selection element itself
            if (!hasClip) {
                liveElement.style.setProperty('filter', finalFilter, 'important');
            } else if (svgImageEl === liveElement) {
                liveElement.style.setProperty('filter', adjustOnlyFilter, 'important');
            } else {
                liveElement.style.removeProperty('filter');
            }
            if (liveElement.parentElement) {
                liveElement.parentElement.style.removeProperty('filter');
                liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
            }
        } else {
            // FOR HTML
            liveElement.style.setProperty('filter', finalFilter, 'important');
            if (liveElement.parentElement) liveElement.parentElement.style.removeProperty('filter');
            
            if (activeEffects.includes('Drop Shadow') || activeEffects.includes('Blur')) {
                if (liveElement.parentElement) liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
            }
        }

        // Always clear box-shadow to ensure we only use the drop-shadow filter
        liveElement.style.boxShadow = 'none';

        // --- Object Fit ---
        const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover' };
        const objectFit = fitMap[imageType] || 'cover';
        if (svgImageEl) {
            svgImageEl.style.objectFit = objectFit;
            const preserveMap = { 'Fit': 'xMidYMid meet', 'Fill': 'xMidYMid slice', 'Crop': 'xMidYMid slice' };
            svgImageEl.setAttribute('preserveAspectRatio', preserveMap[imageType] || 'xMidYMid slice');
        } else {
            liveElement.style.objectFit = objectFit;
        }

        // --- Background & Stroke ---
        if (isSvgEl) {
            if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') liveElement.setAttribute('fill', backgroundColor.fill);
            else liveElement.removeAttribute('fill');
            
            // To support stroke on <image> elements (which ignore stroke attributes natively), we create a <rect> overlay
            if (backgroundColor.stroke !== 'transparent' && backgroundColor.stroke !== 'none') {
                liveElement.setAttribute('stroke', backgroundColor.stroke);
                liveElement.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
                if (backgroundColor.strokeType === 'Dashed') liveElement.setAttribute('stroke-dasharray', '5,5');
                else liveElement.removeAttribute('stroke-dasharray');

                // Dynamic Stroke Overlay for SVG images
                if (tagLower === 'image' && liveElement.parentElement) {
                    let strokeOverlay = liveElement.parentElement.querySelector('.svg-gif-stroke-overlay');
                    if (!strokeOverlay) {
                        strokeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        strokeOverlay.classList.add('svg-gif-stroke-overlay');
                        strokeOverlay.style.pointerEvents = 'none';
                        liveElement.parentElement.appendChild(strokeOverlay);

                        // Attach a mutation observer to keep the overlay perfectly synced with the image's layout
                        const syncOverlay = () => {
                            if (!strokeOverlay.isConnected) return; // Stop if removed
                            strokeOverlay.setAttribute('x', liveElement.getAttribute('x') || '0');
                            strokeOverlay.setAttribute('y', liveElement.getAttribute('y') || '0');
                            strokeOverlay.setAttribute('width', liveElement.getAttribute('width') || '100%');
                            strokeOverlay.setAttribute('height', liveElement.getAttribute('height') || '100%');
                            strokeOverlay.setAttribute('transform', liveElement.getAttribute('transform') || '');
                            strokeOverlay.style.transform = liveElement.style.transform;
                            strokeOverlay.style.translate = liveElement.style.translate;
                            strokeOverlay.style.scale = liveElement.style.scale;
                            strokeOverlay.style.rotate = liveElement.style.rotate;
                            strokeOverlay.style.transformOrigin = liveElement.style.transformOrigin;
                            strokeOverlay.style.opacity = liveElement.style.opacity;
                        };
                        const obs = new MutationObserver(syncOverlay);
                        obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
                    }
                    
                    // Initial sync
                    strokeOverlay.setAttribute('x', liveElement.getAttribute('x') || '0');
                    strokeOverlay.setAttribute('y', liveElement.getAttribute('y') || '0');
                    strokeOverlay.setAttribute('width', liveElement.getAttribute('width') || '100%');
                    strokeOverlay.setAttribute('height', liveElement.getAttribute('height') || '100%');
                    strokeOverlay.setAttribute('transform', liveElement.getAttribute('transform') || '');
                    strokeOverlay.style.transform = liveElement.style.transform;
                    strokeOverlay.style.translate = liveElement.style.translate;
                    strokeOverlay.style.scale = liveElement.style.scale;
                    strokeOverlay.style.rotate = liveElement.style.rotate;
                    strokeOverlay.style.transformOrigin = liveElement.style.transformOrigin;
                    strokeOverlay.style.opacity = liveElement.style.opacity;

                    strokeOverlay.setAttribute('fill', 'none');
                    strokeOverlay.setAttribute('stroke', backgroundColor.stroke);
                    strokeOverlay.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
                    if (backgroundColor.strokeType === 'Dashed') strokeOverlay.setAttribute('stroke-dasharray', '5,5');
                    else strokeOverlay.removeAttribute('stroke-dasharray');
                    if (anyR) strokeOverlay.setAttribute('rx', Math.max(radius.tl, radius.tr, radius.br, radius.bl).toString());
                    else strokeOverlay.removeAttribute('rx');
                }
            } else {
                liveElement.removeAttribute('stroke');
                liveElement.removeAttribute('stroke-width');
                liveElement.parentElement?.querySelector('.svg-gif-stroke-overlay')?.remove();
            }
        } else {
            // HTML Background & Border
            liveElement.style.backgroundColor = backgroundColor.fill;
            liveElement.style.borderColor = backgroundColor.stroke;
            liveElement.style.borderWidth = `${backgroundColor.strokeWeight}px`;
            liveElement.style.borderStyle = backgroundColor.strokeType.toLowerCase();
            // Force solid if valid color but no style selected
            if (backgroundColor.stroke !== 'transparent' && backgroundColor.stroke !== 'none' && (!backgroundColor.strokeType || backgroundColor.strokeType === 'none')) {
                liveElement.style.borderStyle = 'solid';
            }
        }

        // Inner Shadow
        if (isSvgEl && activeEffects.includes('Inner Shadow')) {
            const ds = effectSettings['Inner Shadow'];
            const alpha = Math.round((ds.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = ds.color + (ds.color.length === 7 ? alpha : '');
            const shadowString = `inset ${ds.x}px ${ds.y}px ${ds.blur}px ${ds.spread}px ${colorWithAlpha}`;
            let overlay = liveElement.parentElement?.querySelector('.svg-gif-inner-shadow');
            if (!overlay && liveElement.parentElement) {
                overlay = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                overlay.classList.add('svg-gif-inner-shadow');
                overlay.style.pointerEvents = 'none';
                const div = document.createElement('div');
                div.className = 'inner-shadow-div';
                div.style.width = '100%'; div.style.height = '100%';
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
                    div.style.borderRadius = anyR ? `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '0px';
                }
            }
        } else if (isSvgEl) {
            liveElement.parentElement?.querySelector('.svg-gif-inner-shadow')?.remove();
        }

        // Persistence Data Attributes
        liveElement.setAttribute('data-effect-exposure', exposure.toString());
        liveElement.setAttribute('data-effect-contrast', contrast.toString());
        liveElement.setAttribute('data-effect-saturation', saturation.toString());
        liveElement.setAttribute('data-effect-temperature', temperature.toString());
        liveElement.setAttribute('data-effect-tint', tint.toString());
        liveElement.setAttribute('data-effect-highlights', h.toString());
        liveElement.setAttribute('data-effect-shadows', s.toString());
        liveElement.setAttribute('data-effect-opacity', opacity.toString());
        liveElement.setAttribute('data-active-effects', activeEffects.join(','));

        if (onUpdateRef.current) {
            clearTimeout(onUpdateTimerRef.current);
            onUpdateTimerRef.current = setTimeout(() => { 
                const serializer = new XMLSerializer();
                const svgRoot = pageContainer?.querySelector('svg');
                if (svgRoot) {
                    onUpdateRef.current(serializer.serializeToString(svgRoot)); 
                } else {
                    onUpdateRef.current();
                }
            }, 400);
        }
    } finally {
        isUpdatingDOM.current = false;
    }
  }, [selectedElement, selectedLayerId, activePageIndex, filters, activeEffects, effectSettings, opacity, imageType, radius, backgroundColor, getSvgImageEl]);

  // Trigger applyVisuals when state changes
  useEffect(() => {
    applyVisuals();
  }, [applyVisuals]);

  const updateRadius = (corner, value) => {
    const val = Math.max(0, Number(value) || 0);
    const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };
    setRadius(next);
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

  const getSrc = (el) => {
    if (!el) return "";
    return el.src || el.getAttribute("href") || el.getAttribute("xlink:href") || "";
  };

  const setSrc = (el, url) => {
    if (!el) return;
    if (el.tagName?.toLowerCase() === "image") {
      el.setAttribute("href", url);
      try { el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url); } catch(e) {}
    } else {
      el.src = url;
    }
  };

  const handleGifUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/gif") return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target.result;
      const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
      const liveElement = (selectedLayerId && pageContainer) ? pageContainer.querySelector(`[id="${selectedLayerId}"]`) : selectedElement;
      const targetImg = getSvgImageEl(liveElement) || liveElement;
      setSrc(targetImg, url);
      liveElement.dataset.mediaType = "gif";
      onUpdateRef.current?.({ shouldRefresh: true });

      const storedUser = localStorage.getItem('user');
      if (storedUser && (activeVId || (folderName && flipbookName))) {
          const user = JSON.parse(storedUser);
          const formData = new FormData();
          formData.append('emailId', user.emailId);
          if (activeVId) formData.append('v_id', activeVId);
          formData.append('type', 'gif');
          formData.append('assetType', 'gif');
          formData.append('page_v_id', currentPageVId || 'global');
          formData.append('file', file);
          try {
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
              if (res.data.url) {
                  const serverUrl = `${backendUrl}${res.data.url}`;
                  setSrc(targetImg, serverUrl);
                  liveElement.dataset.fileVid = res.data.file_v_id;
                  onUpdateRef.current?.();
              }
          } catch (err) { console.error("GIF upload failed:", err); }
      }
    };
    reader.readAsDataURL(file);
  };

  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-[1vw] w-full p-[1vw] font-sans h-full overflow-y-auto no-scrollbar">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type='range'] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type='range']::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; }
        input[type='range']::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        .no-spin::-webkit-inner-spin-button, .no-spin::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      <div className="flex items-center gap-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">GIF Property</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
      </div>

      <div className="flex items-center justify-between relative z-20">
        <span className="text-[0.8vw] font-semibold text-gray-800">GIF fix type</span>
        <div className="relative">
          <button onClick={() => setShowImageTypeDropdown(!showImageTypeDropdown)} className="flex items-center justify-between w-[6.5vw] px-[0.75vw] py-[0.55vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-sm hover:bg-gray-50 transition-colors">
            <span className="text-[0.85vw] font-normal text-gray-700">{imageType}</span>
            <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showImageTypeDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showImageTypeDropdown && (
            <div className="absolute right-0 top-full mt-[0.5vw] w-[6.5vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-2xl z-[100] flex flex-col py-[0.2vw]">
              {['Fit', 'Fill', 'Stretch'].map((type) => (
                <button key={type} onClick={() => { setImageType(type); setShowImageTypeDropdown(false); }} className="px-[1vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-[#4D47FF] text-left transition-colors">{type}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-[0.75vw] pt-[0.5vw]">
        <div className="flex flex-col items-center gap-[0.35vw]">
          <div className="relative w-[5vw] h-[4.4vw] p-[0.2vw] rounded-[0.5vw] overflow-hidden bg-white flex items-center justify-center border border-dashed border-gray-300">
            {getSrc(getSvgImageEl(selectedElement) || selectedElement) ? (
              <img src={getSrc(getSvgImageEl(selectedElement) || selectedElement)} className="w-full h-full rounded-[0.3vw] object-contain" alt="Current GIF" />
            ) : ( <ImageIcon size="1.2vw" className="text-gray-300" /> )}
          </div>
          <span className="text-[0.6vw] font-semibold text-gray-400">Current Gif</span>
        </div>
        <div className="flex items-center justify-center shrink-0 h-[5vw] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Icon icon="qlementine-icons:replace-16" className="w-[1.1vw] h-[1.1vw] text-[#9ca3af]" />
        </div>
        <div onClick={() => fileInputRef.current?.click()} className="flex-1 h-[5vw] rounded-[0.75vw] border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 bg-white py-[0.2vw]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}>
          <Upload size="1.1vw" className="text-gray-400 mb-[0.2vw]" />
          <p className="text-[0.65vw] font-medium text-gray-600 text-center">Drag & Drop or <span className="text-[#4D47FF] font-semibold">Upload</span></p>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/gif" onChange={handleGifUpload} className="hidden" />

      <button onClick={() => setShowGallery(true)} className="relative w-full h-[3.5vw] bg-black rounded-[0.9vw] overflow-hidden group shadow-lg flex items-center justify-center border border-white/5 transition-all hover:scale-[1.01]">
        <div className="absolute inset-0 flex gap-[0.2vw] opacity-20 group-hover:opacity-40 transition-opacity">
          {galleryPreviewImages.map((src, i) => ( <div key={i} className="flex-1 bg-cover bg-center" style={{ backgroundImage: `url('${src}')` }} /> ))}
        </div>
        <div className="relative z-10 flex items-center gap-[0.75vw]">
          <Grid size="1vw" className="text-white" />
          <span className="text-[0.95vw] font-semibold text-white">GIF Gallery</span>
        </div>
      </button>

      <div className="flex flex-col gap-[0.5vw]">
        <div className="space-y-[0.5vw]">
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Opacity</span>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
          </div>
          <div className="flex items-center gap-[1vw] pb-[0.5vw]">
            <input type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="flex-1 cursor-pointer" style={{ background: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }} />
            <span className="text-[0.85vw] font-medium text-gray-800 w-[2.3vw] text-right">{opacity}%</span>
          </div>
        </div>

        <div className="border border-gray-100 rounded-[0.75vw] overflow-hidden shadow-sm bg-white">
          <button onClick={() => setOpenSubSection(openSubSection === 'bg-color' ? null : 'bg-color')} className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.9vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
            <span>Color</span>
            <ChevronDown size="1.1vw" className={`text-gray-900 transition-transform duration-200 ${openSubSection === 'bg-color' ? 'rotate-180' : ''}`} />
          </button>
          {openSubSection === 'bg-color' && (
            <div className="px-[1vw] pb-[1vw] pt-[0.75vw] border-t border-gray-100 space-y-[0.5vw] animate-in slide-in-from-top-2">
              <ColorField label="Fill" color={backgroundColor.fill} opacity={backgroundColor.fillOpacity} onColorChange={(val) => setBackgroundColor(p => ({ ...p, fill: val }))} onOpacityChange={(val) => setBackgroundColor(p => ({ ...p, fillOpacity: val }))} onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')} />
              <ColorField label="Stroke" color={backgroundColor.stroke} opacity={backgroundColor.strokeOpacity} onColorChange={(val) => setBackgroundColor(p => ({ ...p, stroke: val }))} onOpacityChange={(val) => setBackgroundColor(p => ({ ...p, strokeOpacity: val }))} onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')} />
              {(backgroundColor.stroke && backgroundColor.stroke !== 'none' && backgroundColor.stroke !== 'transparent') && (
                <div className="flex items-center gap-[0.4vw] py-[0.1vw]">
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
                          {['Solid', 'Dashed'].map((type) => ( <div key={type} className={`px-[1vw] py-[0.5vw] text-[0.8vw] font-semibold cursor-pointer hover:bg-gray-50 transition-colors ${backgroundColor.strokeType === type ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`} onClick={() => { setBackgroundColor(p => ({ ...p, strokeType: type })); setIsStrokeStyleOpen(false); }}>{type}</div> ))}
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
                  <button onClick={() => setIsRadiusLinked(!isRadiusLinked)} className="pointer-events-auto p-[0.375vw] transition-colors bg-white rounded-full shadow-sm border border-gray-100">{isRadiusLinked ? <LinkIcon size="1.25vw" className="text-gray-900" /> : <Link2Off size="1.25vw" className="text-gray-400" />}</button>
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

      {activeColorPicker && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999]" onClick={() => setActiveColorPicker(null)}>
          <div className="absolute z-[100000]" style={{ top: pickerPosition.top || '50%', right: pickerPosition.right || '25vw', transform: 'translateY(-50%)' }} onClick={(e) => e.stopPropagation()}>
            <ColorPicker 
              color={ activeColorPicker === 'fill' ? backgroundColor.fill : backgroundColor.stroke } 
              opacity={ activeColorPicker === 'fill' ? backgroundColor.fillOpacity : backgroundColor.strokeOpacity }
              onChange={(color) => { if (activeColorPicker === 'fill') setBackgroundColor(prev => ({ ...prev, fill: color })); else setBackgroundColor(prev => ({ ...prev, stroke: color })); }} 
              onOpacityChange={(val) => { if (activeColorPicker === 'fill') setBackgroundColor(prev => ({ ...prev, fillOpacity: val })); else setBackgroundColor(prev => ({ ...prev, strokeOpacity: val })); }}
              onClose={() => setActiveColorPicker(null)} 
            />
          </div>
        </div>, document.body
      )}

      {showGallery && (
        <GalleryGif selectedElement={selectedElement} onUpdate={onUpdate} onClose={() => setShowGallery(false)} currentPageVId={currentPageVId} flipbookVId={activeVId} folderName={folderName} flipbookName={flipbookName} onSelect={async (gif) => { const optimisticUrl = gif.url; const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`); const liveElement = (selectedLayerId && pageContainer) ? pageContainer.querySelector(`[id="${selectedLayerId}"]`) : selectedElement; const targetImg = getSvgImageEl(liveElement) || liveElement; setSrc(targetImg, optimisticUrl); liveElement.dataset.mediaType = "gif"; onUpdateRef.current?.({ shouldRefresh: true }); setShowGallery(false); }} />
      )}
    </div>
  );
};

export default GifEditor;
