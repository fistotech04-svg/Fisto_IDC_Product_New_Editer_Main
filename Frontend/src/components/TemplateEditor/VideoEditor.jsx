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
import { renderToString } from "react-dom/server";

// Switch toggle component (matches SlideshowProperties style)
const Switch = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${enabled ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
  >
    <div
      className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${enabled ? 'left-[0.9vw]' : 'left-[0.1vw]'}`}
    />
  </button>
);

import SubComponent from './SubComponent';

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
  
  const [backgroundColor, setBackgroundColor] = useState({ 
    fill: '#000000', fillOpacity: 100, stroke: 'transparent', strokeOpacity: 100, strokeType: 'Solid', strokeWeight: 0 
  });
  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  const [radius, setRadius] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });
  const [isRadiusLinked, setIsRadiusLinked] = useState(true);
  const [activeEffects, setActiveEffects] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 8, spread: 0 },
    'Inner Shadow': { color: '#FFFFFF', opacity: 100, x: 4, y: 4, blur: 1, spread: 0 },
    'Blur': { blur: 5, spread: 0 },
    'Background Blur': { blur: 10, spread: 0 }
  });
  const [openSubSection, setOpenSubSection] = useState(null);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | null

  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);

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
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
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
    const fill = visualTarget.getAttribute('data-bg-color') || visualTarget.style.backgroundColor || visualTarget.getAttribute('fill') || "transparent";
    const stColor = visualTarget.getAttribute('data-stroke-color') || visualTarget.style.borderColor || visualTarget.getAttribute('stroke') || "transparent";
    const stWeight = parseFloat(visualTarget.getAttribute('data-stroke-width') || visualTarget.style.borderWidth || visualTarget.getAttribute('stroke-width') || "0");
    const dashData = visualTarget.getAttribute('stroke-dasharray') || 'none';
    const isDashed = dashData !== 'none' && dashData !== '';
    
    let dashLen = 5, dashGap = 5;
    if (isDashed) {
      const parts = dashData.split(',');
      dashLen = parseInt(parts[0]) || 5;
      dashGap = parseInt(parts[1] || parts[0]) || 5;
    }
    const dashPos = visualTarget.getAttribute('data-stroke-position') || 'Center';
    const dashCap = visualTarget.getAttribute('stroke-linecap') || 'butt';
    
    setBackgroundColor({
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: 100,
      stroke: stColor === 'none' ? 'transparent' : stColor,
      strokeOpacity: 100,
      strokeType: isDashed ? 'Dashed' : 'Solid',
      strokeWeight: stWeight,
      strokeDashLength: dashLen,
      strokeDashGap: dashGap,
      strokePosition: dashPos,
      strokeLinecap: dashCap
    });

    // Filters
    setFilters({
      exposure: parseFloat(visualTarget.getAttribute('data-effect-exposure') || '0'),
      contrast: parseFloat(visualTarget.getAttribute('data-effect-contrast') || '0'),
      saturation: parseFloat(visualTarget.getAttribute('data-effect-saturation') || '0'),
      temperature: parseFloat(visualTarget.getAttribute('data-effect-temperature') || '0'),
      tint: parseFloat(visualTarget.getAttribute('data-effect-tint') || '0'),
      highlights: parseFloat(visualTarget.getAttribute('data-effect-highlights') || '0'),
      shadows: parseFloat(visualTarget.getAttribute('data-effect-shadows') || '0'),
    });

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
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    let liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;
    
    if (!liveElement) return;

    const container = liveElement.tagName === "FOREIGNOBJECT" ? liveElement : (liveElement.querySelector("foreignObject") || liveElement.closest("foreignObject"));
    const target = container ? container.querySelector("video, iframe") : (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME" ? liveElement : liveElement.querySelector("video, iframe"));
    
    if (!target) return;
    const visualTarget = container || target;

    let tagLower = liveElement.tagName?.toLowerCase();
    const isSvgEl = liveElement.namespaceURI === "http://www.w3.org/2000/svg";

    // --- GROUP WITHIN VIDEO FIX ---
    if (isSvgEl && tagLower === 'foreignobject') {
        const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newGroup.id = liveElement.id;
        liveElement.removeAttribute('id');
        
        Array.from(liveElement.attributes).forEach(attr => {
            if (attr.name.startsWith('data-') || attr.name === 'class' || attr.name === 'style') {
                newGroup.setAttribute(attr.name, attr.value);
                liveElement.removeAttribute(attr.name);
            }
        });
        
        liveElement.parentNode.insertBefore(newGroup, liveElement);
        newGroup.appendChild(liveElement);
        liveElement = newGroup;
        
        tagLower = 'g';
        
        if (onUpdateRef.current) setTimeout(() => onUpdateRef.current({ shouldRefresh: true }), 0);
    }

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
        visualTarget.style.backgroundColor = backgroundColor.fill;
        visualTarget.setAttribute('data-bg-color', backgroundColor.fill);
        
        // Helper to convert hex to rgba for CSS border
        const hexToRgba = (hex, alpha) => {
            if (!hex || hex === 'transparent' || hex === 'none') return 'transparent';
            if (hex.startsWith('rgba')) return hex;
            if (hex.startsWith('#')) {
                let c = hex.substring(1).split('');
                if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                c = '0x' + c.join('');
                return `rgba(${[(c>>16)&255, (c>>8)&255, c&255].join(',')},${alpha})`;
            }
            return hex;
        };
        
        const pos = backgroundColor.strokePosition || 'Center';
        const color = hexToRgba(backgroundColor.stroke, backgroundColor.strokeOpacity / 100);
        const weight = backgroundColor.strokeWeight;
        const style = backgroundColor.strokeType === 'Dashed' ? 'dashed' : 'solid';

        visualTarget.setAttribute('data-stroke-color', backgroundColor.stroke);
        visualTarget.setAttribute('stroke-width', weight);
        visualTarget.setAttribute('data-stroke-width', weight); // Keep for legacy
        
        if (backgroundColor.strokeType === 'Dashed') {
           const dashArray = `${backgroundColor.strokeDashLength || 5},${backgroundColor.strokeDashGap || 5}`;
           visualTarget.setAttribute('stroke-dasharray', dashArray);
        } else {
           visualTarget.setAttribute('stroke-dasharray', 'none');
        }

        // Dashed Stroke Attributes
        visualTarget.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
        visualTarget.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
        visualTarget.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

        // Dynamic Stroke Overlay for SVG Video
        if (isSvgEl && weight > 0) {
            let strokeOverlay = liveElement.querySelector('.svg-video-stroke-overlay');
            if (!strokeOverlay) {
                strokeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                strokeOverlay.classList.add('svg-video-stroke-overlay');
                strokeOverlay.style.pointerEvents = 'none';
                liveElement.appendChild(strokeOverlay);

                const syncOverlay = () => {
                    if (!strokeOverlay.isConnected) return;
                    strokeOverlay.setAttribute('x', visualTarget.getAttribute('x') || '0');
                    strokeOverlay.setAttribute('y', visualTarget.getAttribute('y') || '0');
                    strokeOverlay.setAttribute('width', visualTarget.getAttribute('width') || '100%');
                    strokeOverlay.setAttribute('height', visualTarget.getAttribute('height') || '100%');
                    strokeOverlay.setAttribute('transform', visualTarget.getAttribute('transform') || '');
                    strokeOverlay.style.transform = visualTarget.style.transform;
                    strokeOverlay.style.translate = visualTarget.style.translate;
                    strokeOverlay.style.scale = visualTarget.style.scale;
                    strokeOverlay.style.rotate = visualTarget.style.rotate;
                    strokeOverlay.style.transformOrigin = visualTarget.style.transformOrigin;
                    strokeOverlay.style.opacity = visualTarget.style.opacity;
                };
                const obs = new MutationObserver(syncOverlay);
                obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
                if (visualTarget !== liveElement) {
                    obs.observe(visualTarget, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
                }
            }

            let bx = visualTarget.getAttribute('x') || '0';
            let by = visualTarget.getAttribute('y') || '0';
            let bw = visualTarget.getAttribute('width') || '100%';
            let bh = visualTarget.getAttribute('height') || '100%';

            if (!bx.includes('%') && !bx.includes('px')) bx = `${bx}px`;
            if (!by.includes('%') && !by.includes('px')) by = `${by}px`;
            if (!bw.includes('%') && !bw.includes('px')) bw = `${bw}px`;
            if (!bh.includes('%') && !bh.includes('px')) bh = `${bh}px`;

            strokeOverlay.style.setProperty('x', bx, 'important');
            strokeOverlay.style.setProperty('y', by, 'important');
            strokeOverlay.style.setProperty('width', bw, 'important');
            strokeOverlay.style.setProperty('height', bh, 'important');
            strokeOverlay.setAttribute('transform', visualTarget.getAttribute('transform') || '');
            strokeOverlay.style.transform = visualTarget.style.transform;
            strokeOverlay.style.translate = visualTarget.style.translate;
            strokeOverlay.style.scale = visualTarget.style.scale;
            strokeOverlay.style.rotate = visualTarget.style.rotate;
            strokeOverlay.style.transformOrigin = visualTarget.style.transformOrigin;
            strokeOverlay.style.opacity = visualTarget.style.opacity;

            strokeOverlay.setAttribute('fill', 'none');
            strokeOverlay.setAttribute('stroke', backgroundColor.stroke);
            strokeOverlay.setAttribute('stroke-width', weight.toString());
            if (backgroundColor.strokeType === 'Dashed') {
               const dashArray = `${backgroundColor.strokeDashLength || 5},${backgroundColor.strokeDashGap || 5}`;
               strokeOverlay.setAttribute('stroke-dasharray', dashArray);
            } else {
               strokeOverlay.setAttribute('stroke-dasharray', 'none');
            }
            strokeOverlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
            strokeOverlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

            const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
            if (maxR > 0) strokeOverlay.setAttribute('rx', maxR.toString());
            else strokeOverlay.removeAttribute('rx');

            if (pos === 'Inside') {
               strokeOverlay.style.outline = 'none';
               strokeOverlay.style.borderWidth = `${weight}px`;
               visualTarget.style.outline = 'none';
               visualTarget.style.borderWidth = '0px';
            } else {
               strokeOverlay.style.outline = 'none';
               strokeOverlay.style.borderWidth = '0px';
               visualTarget.style.outline = 'none';
               visualTarget.style.borderWidth = '0px';
            }
            strokeOverlay.style.display = 'block';
        } else {
            liveElement.querySelector('.svg-video-stroke-overlay')?.remove();
            
            // HTML styling fallback
            if (pos === 'Inside') {
                visualTarget.style.borderWidth = `${weight}px`;
                visualTarget.style.borderStyle = style;
                visualTarget.style.borderColor = color;
                visualTarget.style.outline = 'none';
            } else if (pos === 'Outside') {
                visualTarget.style.borderWidth = `0px`;
                visualTarget.style.outline = `${weight}px ${style} ${color}`;
                visualTarget.style.outlineOffset = `0px`;
            } else {
                // Center
                visualTarget.style.borderWidth = `0px`;
                visualTarget.style.outline = `${weight}px ${style} ${color}`;
                visualTarget.style.outlineOffset = `-${weight / 2}px`;
            }
        }

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

        let boxShadowStr = '';
        activeEffects.forEach(eff => {
          const effSet = effectSettings[eff];
          if (!effSet) return;
          if (eff === 'Blur') filterStr += `blur(${effSet.blur}px) `;
          if (eff === 'Background Blur') filterStr += `blur(${effSet.blur}px) `;
        });

        // 2. Drop Shadow Caster
        let shadowCaster = liveElement.querySelector('.svg-drop-shadow-caster');
        let hasDropShadow = activeEffects.includes('Drop Shadow');
        
        if (hasDropShadow && isSvgEl) {
            const effSet = effectSettings['Drop Shadow'];
            if (!shadowCaster) {
                shadowCaster = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shadowCaster.classList.add('svg-drop-shadow-caster');
                shadowCaster.style.pointerEvents = 'none';
                liveElement.insertBefore(shadowCaster, liveElement.firstChild);
            }
            if (shadowCaster) {
                if (shadowCaster !== liveElement.firstChild) {
                    liveElement.insertBefore(shadowCaster, liveElement.firstChild);
                }
                shadowCaster.setAttribute('x', visualTarget.getAttribute('x') || '0');
                shadowCaster.setAttribute('y', visualTarget.getAttribute('y') || '0');
                shadowCaster.setAttribute('width', visualTarget.getAttribute('width') || '100%');
                shadowCaster.setAttribute('height', visualTarget.getAttribute('height') || '100%');
                shadowCaster.setAttribute('transform', visualTarget.getAttribute('transform') || '');

                shadowCaster.setAttribute('fill', 'black');
                shadowCaster.setAttribute('fill-opacity', opacity / 100);

                const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
                if (maxR > 0) shadowCaster.setAttribute('rx', maxR.toString());
                else shadowCaster.removeAttribute('rx');

                const alpha = Math.round((effSet.opacity / 100) * 255).toString(16).padStart(2, '0');
                const shadowOnlyFilter = `drop-shadow(${effSet.x}px ${effSet.y}px ${effSet.blur}px ${effSet.color}${alpha})`;
                shadowCaster.style.setProperty('filter', shadowOnlyFilter, 'important');
                shadowCaster.style.setProperty('display', 'block', 'important');
            }
        } else if (shadowCaster) {
            shadowCaster.style.setProperty('display', 'none', 'important');
        }

        // Inner Shadow
        if (isSvgEl && activeEffects.includes('Inner Shadow')) {
            const ds = effectSettings['Inner Shadow'];
            const alpha = Math.round((ds.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = ds.color + (ds.color.length === 7 ? alpha : '');
            const shadowString = `inset ${ds.x}px ${ds.y}px ${ds.blur}px ${ds.spread}px ${colorWithAlpha}`;
            let overlay = liveElement.querySelector('.svg-video-inner-shadow');
            if (!overlay) {
                overlay = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                overlay.classList.add('svg-video-inner-shadow');
                overlay.style.pointerEvents = 'none';
                const div = document.createElement('div');
                div.className = 'inner-shadow-div';
                div.style.width = '100%'; div.style.height = '100%';
                overlay.appendChild(div);
                liveElement.appendChild(overlay);
            }
            if (overlay) {
                overlay.setAttribute('x', visualTarget.getAttribute('x') || '0');
                overlay.setAttribute('y', visualTarget.getAttribute('y') || '0');
                overlay.setAttribute('width', visualTarget.getAttribute('width') || '100%');
                overlay.setAttribute('height', visualTarget.getAttribute('height') || '100%');
                overlay.setAttribute('transform', visualTarget.getAttribute('transform') || '');
                const div = overlay.querySelector('.inner-shadow-div');
                if (div) {
                    div.style.boxShadow = shadowString;
                    const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
                    div.style.borderRadius = anyR ? `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '0px';
                }
            }
        } else if (isSvgEl) {
            liveElement.querySelector('.svg-video-inner-shadow')?.remove();
        }

        // Fallback for non-SVG video targets
        if (!isSvgEl) {
            activeEffects.forEach(eff => {
              const effSet = effectSettings[eff];
              if (!effSet) return;
              if (eff === 'Drop Shadow') {
                 const alpha = Math.round((effSet.opacity / 100) * 255).toString(16).padStart(2, '0');
                 boxShadowStr += `${effSet.x}px ${effSet.y}px ${effSet.blur}px ${effSet.spread}px ${effSet.color}${alpha}, `;
              }
              if (eff === 'Inner Shadow') {
                 const alpha = Math.round((effSet.opacity / 100) * 255).toString(16).padStart(2, '0');
                 boxShadowStr += `inset ${effSet.x}px ${effSet.y}px ${effSet.blur}px ${effSet.spread}px ${effSet.color}${alpha}, `;
              }
            });
        }

        visualTarget.style.filter = filterStr.trim() || 'none';
        visualTarget.style.boxShadow = boxShadowStr.trim().replace(/,$/, '');
        visualTarget.setAttribute('data-effects', JSON.stringify({ activeEffects, effectSettings }));
        
        visualTarget.setAttribute('data-effect-exposure', exposure.toString());
        visualTarget.setAttribute('data-effect-contrast', contrast.toString());
        visualTarget.setAttribute('data-effect-saturation', saturation.toString());
        visualTarget.setAttribute('data-effect-temperature', temperature.toString());
        visualTarget.setAttribute('data-effect-tint', tint.toString());
        visualTarget.setAttribute('data-effect-highlights', h.toString());
        visualTarget.setAttribute('data-effect-shadows', s.toString());

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
  }, [selectedElement, selectedLayerId, activePageIndex, width, height, opacity, backgroundColor, filters, radius, videoType, activeEffects, effectSettings, autoplay, loop, controls, controlsSize, debouncedUpdate]);

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
        width: 10px !important;
        height: 10px !important;
        border-radius: 50% !important;
        background: #ffffff !important;
        cursor: pointer !important;
        box-shadow: 0 0 4px rgba(255,255,255,0.5) !important;
        border: none !important;
        margin-top: -3.5px !important;
      }
      input.custom-video-progress::-moz-range-thumb {
        width: 10px !important;
        height: 10px !important;
        border-radius: 50% !important;
        background: #ffffff !important;
        cursor: pointer !important;
        border: none !important;
        box-shadow: 0 0 4px rgba(255,255,255,0.5) !important;
      }
      input.custom-video-progress::-webkit-slider-runnable-track {
        height: 3px !important;
        background: transparent !important;
        border-radius: 2px !important;
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

  // Inject custom video controls — centered rewind/play/forward + bottom progress bar + time
  // All sizes scale proportionally to the container dimensions.
  useEffect(() => {
    const ctrlId = `custom-ctrl-${selectedLayerId}`;

    const cleanup = () => {
      const old = document.getElementById(ctrlId);
      if (old) old.remove();
      // Remove scoped thumb style
      document.getElementById(`custom-video-thumb-${selectedLayerId}`)?.remove();
    };

    if (!selectedLayerId || !controls) {
      cleanup();
      return cleanup;
    }

    // Resolve the live video element
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
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
      mountPoint.style.overflow = 'hidden';
      // Ensure mount point has explicit dimensions matching the foreignObject
      if (fo) {
        const foW = fo.getAttribute('width');
        const foH = fo.getAttribute('height');
        if (foW) mountPoint.style.width = foW.includes('%') ? foW : `${parseInt(foW)}px`;
        if (foH) mountPoint.style.height = foH.includes('%') ? foH : `${parseInt(foH)}px`;
      }
      mountPoint._prevPointerEvents = mountPoint.style.pointerEvents;
      mountPoint.style.pointerEvents = 'none';
    }

    cleanup(); // remove any stale bar first

    /* ── Compute scale factor from internal coordinate dimensions ── */
    // Use foreignObject attributes or element layout sizes (NOT getBoundingClientRect
    // which returns screen-scaled coords that differ inside SVG foreignObject).
    const foW = fo ? (parseInt(fo.getAttribute('width')) || fo.clientWidth) : 0;
    const foH = fo ? (parseInt(fo.getAttribute('height')) || fo.clientHeight) : 0;
    const containerW = foW || video.offsetWidth || mountPoint.offsetWidth || mountPoint.clientWidth || 300;
    const containerH = foH || video.offsetHeight || mountPoint.offsetHeight || mountPoint.clientHeight || 200;
    const baseRef = Math.min(containerW, containerH);
    // Scale factor: 1.0 at 300px reference. Clamp to a usable range.
    const s = Math.max(0.35, Math.min(1.6, baseRef / 300));

    /* ── Helper: format seconds → MM:SS ── */
    const fmtTime = (sec) => {
      if (!sec || isNaN(sec)) return '00:00';
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const ss = Math.floor(sec % 60).toString().padStart(2, '0');
      return `${m}:${ss}`;
    };

    /* ── Scaled sizes ── */
    const gapCenter = Math.round(14 * s);      // gap between center buttons
    const fontSize = Math.max(7, Math.round(9 * s));  // time label font size
    const barPadX = Math.round(6 * s);         // horizontal padding in bottom bar
    const barPadBot = Math.round(4 * s);       // bottom padding
    const trackH = Math.max(2, Math.round(3.5 * s));  // progress track height (reduced)
    const thumbSize = Math.max(4, Math.round(8 * s));  // progress thumb size
    const borderW = Math.max(1, Math.round(1.2 * s)); // button border width
    const blurAmt = Math.round(3 * s);         // backdrop blur

    /* ── Root overlay — tightly wraps the actual rendered video content ── */
    const root = document.createElement('div');
    root.id = ctrlId;
    Object.assign(root.style, {
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      zIndex: '9999',
      pointerEvents: 'none',
      overflow: 'hidden',
      boxSizing: 'border-box',
    });

    const updateOverlayBounds = () => {
      const vW = video.videoWidth || 16;
      const vH = video.videoHeight || 9;
      const cW = mountPoint.clientWidth || containerW;
      const cH = mountPoint.clientHeight || containerH;
      
      const vRatio = vW / vH;
      const cRatio = cW / cH;
      
      let renderW = cW;
      let renderH = cH;
      
      if (vRatio > cRatio) {
        // Video is wider than container ratio -> limited by width (letterbox top/bottom)
        renderH = cW / vRatio;
      } else {
        // Video is taller than container ratio -> limited by height (pillarbox left/right)
        renderW = cH * vRatio;
      }
      
      const topOff = (cH - renderH) / 2;
      const leftOff = (cW - renderW) / 2;
      
      root.style.width = `${renderW}px`;
      root.style.height = `${renderH}px`;
      root.style.top = `${topOff}px`;
      root.style.left = `${leftOff}px`;
    };

    // Calculate initial bounds
    updateOverlayBounds();

    /* ── Top Bar: Volume/Music Icon ── */
    const volIconSize = Math.round(20 * s);
    const topPad = Math.round(12 * s);
    const volBtn = document.createElement('button');
    Object.assign(volBtn.style, {
      position: 'absolute',
      top: `${topPad}px`,
      right: `${topPad}px`,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto',
      transition: 'opacity 0.2s, transform 0.15s',
      opacity: '0.85',
      zIndex: '10',
      color: 'white',
    });
    
    // lucide-react components rendered directly
    const VOL_ON_SVG = renderToString(<Volume2 size={volIconSize} color="white" strokeWidth={0.1} className="lucide lucide-volume-2" />);
    const VOL_OFF_SVG = renderToString(<VolumeX size={volIconSize} color="white" strokeWidth={0.1} className="lucide lucide-volume-x" />);

    const syncVolume = () => {
      volBtn.innerHTML = video.muted ? VOL_OFF_SVG : VOL_ON_SVG;
    };
    syncVolume();

    volBtn.onmouseenter = () => { volBtn.style.opacity = '1'; volBtn.style.transform = 'scale(1.1)'; };
    volBtn.onmouseleave = () => { volBtn.style.opacity = '0.85'; volBtn.style.transform = 'scale(1)'; };
    volBtn.onclick = (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      syncVolume();
    };
    video.addEventListener('volumechange', syncVolume);
    root.appendChild(volBtn);

    /* ── Center playback controls: rewind 10 | play/pause | forward 10 ── */
    const centerRow = document.createElement('div');
    Object.assign(centerRow.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      alignItems: 'center',
      gap: `${gapCenter}px`,
      pointerEvents: 'none',
    });

    // Icon sizes
    const skipIconSize = Math.round(28 * s);   // rewind/forward icon size
    const playCircleSize = Math.round(42 * s); // play button circle diameter
    const playTriSize = Math.round(18 * s);    // play triangle inside circle

    // Rewind 10s SVG — outline arrow with "10" inside (no bg circle)
    const REWIND_10_SVG = `<svg width="${skipIconSize}" height="${skipIconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="white" fill-opacity="0.9"/>
      <text x="7.5" y="16" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="white" fill-opacity="0.9" text-anchor="start">10</text>
    </svg>`;

    // Forward 10s SVG — outline arrow with "10" inside (no bg circle)
    const FORWARD_10_SVG = `<svg width="${skipIconSize}" height="${skipIconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="white" fill-opacity="0.9"/>
      <text x="7.5" y="16" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="white" fill-opacity="0.9" text-anchor="start">10</text>
    </svg>`;

    // Play/Pause SVGs (just the triangle/bars, rendered inside the circle button)
    const PLAY_SVG = `<svg width="${playTriSize}" height="${playTriSize}" viewBox="0 0 24 24" fill="white" fill-opacity="0.95"><path d="M8 5v14l11-7z"/></svg>`;
    const PAUSE_SVG = `<svg width="${playTriSize}" height="${playTriSize}" viewBox="0 0 24 24" fill="white" fill-opacity="0.95"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    // ── Rewind 10s button (icon only, no background)
    const rwBtn = document.createElement('button');
    rwBtn.innerHTML = REWIND_10_SVG;
    Object.assign(rwBtn.style, {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto',
      flexShrink: '0',
      transition: 'opacity 0.2s, transform 0.15s',
      opacity: '0.9',
    });
    rwBtn.onmouseenter = () => { rwBtn.style.opacity = '1'; rwBtn.style.transform = 'scale(1.1)'; };
    rwBtn.onmouseleave = () => { rwBtn.style.opacity = '0.9'; rwBtn.style.transform = 'scale(1)'; };
    rwBtn.onclick = (e) => {
      e.stopPropagation();
      video.currentTime = Math.max(0, video.currentTime - 10);
    };

    // ── Play / Pause button (semi-transparent circle background)
    const playBtn = document.createElement('button');
    playBtn.innerHTML = PLAY_SVG;
    Object.assign(playBtn.style, {
      background: 'rgba(255,255,255,0.2)',
      backdropFilter: `blur(${blurAmt}px)`,
      WebkitBackdropFilter: `blur(${blurAmt}px)`,
      border: `${borderW}px solid rgba(255,255,255,0.3)`,
      borderRadius: '50%',
      width: `${playCircleSize}px`,
      height: `${playCircleSize}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: '0',
      transition: 'background 0.2s, transform 0.15s',
      pointerEvents: 'auto',
      flexShrink: '0',
    });
    playBtn.onmouseenter = () => { playBtn.style.background = 'rgba(255,255,255,0.35)'; playBtn.style.transform = 'scale(1.08)'; };
    playBtn.onmouseleave = () => { playBtn.style.background = 'rgba(255,255,255,0.2)'; playBtn.style.transform = 'scale(1)'; };
    const onPlay  = () => { playBtn.innerHTML = PAUSE_SVG; };
    const onPause = () => { playBtn.innerHTML = PLAY_SVG; };
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    if (!video.paused) playBtn.innerHTML = PAUSE_SVG;
    playBtn.onclick = (e) => {
      e.stopPropagation();
      video.paused ? video.play() : video.pause();
    };

    // ── Forward 10s button (icon only, no background)
    const fwBtn = document.createElement('button');
    fwBtn.innerHTML = FORWARD_10_SVG;
    Object.assign(fwBtn.style, {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto',
      flexShrink: '0',
      transition: 'opacity 0.2s, transform 0.15s',
      opacity: '0.9',
    });
    fwBtn.onmouseenter = () => { fwBtn.style.opacity = '1'; fwBtn.style.transform = 'scale(1.1)'; };
    fwBtn.onmouseleave = () => { fwBtn.style.opacity = '0.9'; fwBtn.style.transform = 'scale(1)'; };
    fwBtn.onclick = (e) => {
      e.stopPropagation();
      video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
    };

    centerRow.appendChild(rwBtn);
    centerRow.appendChild(playBtn);
    centerRow.appendChild(fwBtn);

    /* ── Bottom bar: progress + time ── */
    const bottomBarPadX = Math.round(14 * s);
    const bottomBar = document.createElement('div');
    Object.assign(bottomBar.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '0px',
      padding: `0 ${bottomBarPadX}px ${barPadBot}px ${bottomBarPadX}px`,
      boxSizing: 'border-box',
      background: 'transparent', // No dark gradient in the reference
      pointerEvents: 'none',
      width: '100%',
    });

    // Time display row
    const timeRow = document.createElement('div');
    Object.assign(timeRow.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: `0 0 ${Math.round(4 * s)}px 0`, // Slight gap above the bar
      pointerEvents: 'none',
      width: '100%',
    });
    const timeLabel = document.createElement('span');
    Object.assign(timeLabel.style, {
      color: 'rgba(255,255,255,1)',
      fontSize: `${fontSize}px`,
      fontFamily: 'Inter, Arial, sans-serif',
      fontWeight: '400',
      letterSpacing: '0.3px',
      pointerEvents: 'none',
      userSelect: 'none',
    });
    timeLabel.textContent = `${fmtTime(video.currentTime)} / ${fmtTime(video.duration)}`;
    timeRow.appendChild(timeLabel);

    // Progress bar
    // Progress bar wrapper
    const progWrapper = document.createElement('div');
    Object.assign(progWrapper.style, {
      position: 'relative',
      width: '100%',
      height: `${trackH}px`,
      pointerEvents: 'auto',
    });

    // Unfilled background track
    const progTrack = document.createElement('div');
    Object.assign(progTrack.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(255,255,255,0.35)',
      borderRadius: `${Math.round(trackH / 2)}px`,
      pointerEvents: 'none',
    });

    // Filled white progress
    const progFill = document.createElement('div');
    Object.assign(progFill.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      bottom: '0',
      width: '0%',
      background: '#ffffff',
      borderRadius: `${Math.round(trackH / 2)}px`,
      pointerEvents: 'none',
    });

    // Circular pointer/thumb
    const thumbRadius = Math.max(3, Math.round(4.5 * s));
    const progThumb = document.createElement('div');
    Object.assign(progThumb.style, {
      position: 'absolute',
      top: '50%',
      left: '0%',
      width: `${thumbRadius * 2}px`,
      height: `${thumbRadius * 2}px`,
      background: '#ffffff',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      boxShadow: `0 1px ${Math.round(3 * s)}px rgba(0,0,0,0.4)`,
    });

    // Invisible native range input for interaction
    const prog = document.createElement('input');
    prog.type = 'range';
    prog.min = '0';
    prog.max = '1000';
    prog.value = '0';
    Object.assign(prog.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      opacity: '0',
      cursor: 'pointer',
      margin: '0',
      padding: '0',
    });

    progWrapper.appendChild(progTrack);
    progWrapper.appendChild(progFill);
    progWrapper.appendChild(progThumb);
    progWrapper.appendChild(prog);

    const updateProgress = () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 1000;
      prog.value = pct;
      const pctPercent = (pct / 1000) * 100;
      progFill.style.width = `${pctPercent}%`;
      progThumb.style.left = `${pctPercent}%`;
      timeLabel.textContent = `${fmtTime(video.currentTime)} / ${fmtTime(video.duration)}`;
    };

    const onTimeUpdate = () => updateProgress();
    const onLoadedMeta = () => {
      updateProgress();
      updateOverlayBounds();
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMeta);

    prog.oninput = (e) => {
      e.stopPropagation();
      if (video.duration) {
        video.currentTime = (prog.value / 1000) * video.duration;
        updateProgress();
      }
    };

    // Initial sync
    updateProgress();

    bottomBar.appendChild(timeRow);
    bottomBar.appendChild(progWrapper);

    root.appendChild(centerRow);
    root.appendChild(bottomBar);
    mountPoint.appendChild(root);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('volumechange', syncVolume);
      video.removeAttribute('data-custom-ctrl-active');
      if (mountPoint?.style) {
        mountPoint.style.pointerEvents = mountPoint._prevPointerEvents ?? '';
        mountPoint.style.overflow = '';
        delete mountPoint._prevPointerEvents;
      }
      root.remove();
    };
  }, [selectedLayerId, controls, selectedElement, activePageIndex, width, height]);

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
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
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
      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
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
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
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
    
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
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
          <span className="text-[0.7vw] font-semibold text-gray-400">OR</span>
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
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
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
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
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

      <SubComponent 
        openSubSection={openSubSection}
        setOpenSubSection={setOpenSubSection}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        filters={filters}
        setFilters={setFilters}
        radius={radius}
        setRadius={setRadius}
        isRadiusLinked={isRadiusLinked}
        setIsRadiusLinked={setIsRadiusLinked}
        activeEffects={activeEffects}
        setActiveEffects={setActiveEffects}
        effectSettings={effectSettings}
        setEffectSettings={setEffectSettings}
        activeColorPicker={activeColorPicker}
        setActiveColorPicker={setActiveColorPicker}
        showStrokeSettings={showStrokeSettings}
        setShowStrokeSettings={setShowStrokeSettings}
        isStrokeStyleOpen={isStrokeStyleOpen}
        setIsStrokeStyleOpen={setIsStrokeStyleOpen}
        dropdownPos={dropdownPos}
        setDropdownPos={setDropdownPos}
        strokeSettingsPos={strokeSettingsPos}
        setStrokeSettingsPos={setStrokeSettingsPos}
        isDashPosOpen={isDashPosOpen}
        setIsDashPosOpen={setIsDashPosOpen}
        activePopup={activePopup}
        setActivePopup={setActivePopup}
        colorsOnPage={colorsOnPage}
        showDetailedPicker={showDetailedPicker}
        setShowDetailedPicker={setShowDetailedPicker}
      />

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
    </div>
  );
};

export default VideoEditor;
