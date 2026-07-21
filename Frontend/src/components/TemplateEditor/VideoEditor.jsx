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
import Color from './Color';

import Adjustment from './Adjustment';
import Effect from './Effect';
import ColorPicker, { parseGradient } from "./ColorPicker";
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import { syncGradient } from './editorUtils';
import { createPortal } from "react-dom";

// Switch toggle component (matches SlideshowProperties style)
const Switch = ({ enabled, onChange, disabled }) => (
  <button
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) {
        onChange(!enabled);
      }
    }}
    className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${enabled ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
  >
    <div
      className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${enabled ? 'left-[0.9vw]' : 'left-[0.1vw]'}`}
    />
  </button>
);


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
  onDeleteLayer,
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
  const [videoType, setVideoType] = useState("Fill");
  const [showVideoTypeDropdown, setShowVideoTypeDropdown] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  const [controls, setControls] = useState(true);
  const [controlsSize, setControlsSize] = useState(100);

  const [opacity, setOpacity] = useState(100);
  const [coverOption, setCoverOption] = useState("auto"); // "upload" or "auto"
  const [activeSection, setActiveSection] = useState('main');
  const [showGallery, setShowGallery] = useState(false);

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
    'Drop Shadow': { color: '#000000', opacity: 35, x: 2, y: 2, blur: 1, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 2, y: 2, blur: 1, spread: 0 },
    'Blur': { blur: 0.5, spread: 0 }
  });
  const [openSubSection, setOpenSubSection] = useState(null);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | null

  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);

  const [inputUrl, setInputUrl] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [urlAddProgress, setUrlAddProgress] = useState(0);
  const [isUrlAdded, setIsUrlAdded] = useState(false);

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

    // Dimensions state removed to allow interact.js to manage it naturally without reversions

    // 2. Opacity
    const op = parseFloat(target.getAttribute('data-opacity') || target.style.opacity || target.getAttribute('opacity') || visualTarget.getAttribute('data-opacity') || visualTarget.style.opacity || visualTarget.getAttribute('opacity') || "1");
    setOpacity(Math.round(op * 100));

    // 3. Colors & Stroke
    let fill = liveElement.getAttribute('data-fill-color');
    if (!fill) {
      fill = visualTarget.getAttribute('data-bg-color') || visualTarget.style.backgroundColor || visualTarget.getAttribute('fill');
    }
    fill = fill || 'transparent';

    const stColor = liveElement.getAttribute('data-stroke-color') || visualTarget.getAttribute('data-stroke-color') || visualTarget.style.borderColor || visualTarget.getAttribute('stroke') || "transparent";
    const stWeight = parseFloat(liveElement.getAttribute('data-stroke-width') || visualTarget.getAttribute('data-stroke-width') || visualTarget.style.borderWidth || visualTarget.getAttribute('stroke-width') || "0");
    const dashData = liveElement.getAttribute('stroke-dasharray') || visualTarget.getAttribute('stroke-dasharray') || 'none';
    const isDashed = dashData !== 'none' && dashData !== '';

    let dashLen = 10, dashGap = 10;
    if (isDashed) {
      const parts = dashData.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 10 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }
    const dashPos = visualTarget.getAttribute('data-stroke-position') || 'Center';
    const dashCap = visualTarget.getAttribute('stroke-linecap') || 'butt';

    const existingStrokeType = visualTarget.getAttribute('data-stroke-type') || liveElement.getAttribute('data-stroke-type');
    const actualStrokeType = existingStrokeType && existingStrokeType !== 'Dashed' ? existingStrokeType : 'Solid';

    setBackgroundColor(prev => {
      const next = {
        fill: fill === 'none' ? 'transparent' : fill,
        fillOpacity: 100,
        stroke: stColor === 'none' ? 'transparent' : stColor,
        strokeOpacity: 100,
        strokeType: actualStrokeType,
        strokeDashStyle: isDashed ? 'Dashed' : 'Solid',
        strokeGradientType: visualTarget.getAttribute('data-stroke-gradient-type') || 'linear',
        strokeStops: visualTarget.getAttribute('data-stroke-stops'),
        strokeAngle: parseFloat(visualTarget.getAttribute('data-stroke-angle') || '0'),
        strokeRadius: parseFloat(visualTarget.getAttribute('data-stroke-radius') || '100'),
        strokeWeight: stWeight,
        strokeDashLength: dashLen,
        strokeDashGap: dashGap,
        strokePosition: dashPos,
        strokeLinecap: dashCap
      };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });

    // Filters
    setFilters(prev => {
      const next = {
        exposure: parseFloat(visualTarget.getAttribute('data-effect-exposure') || '0'),
        contrast: parseFloat(visualTarget.getAttribute('data-effect-contrast') || '0'),
        saturation: parseFloat(visualTarget.getAttribute('data-effect-saturation') || '0'),
        temperature: parseFloat(visualTarget.getAttribute('data-effect-temperature') || '0'),
        tint: parseFloat(visualTarget.getAttribute('data-effect-tint') || '0'),
        highlights: parseFloat(visualTarget.getAttribute('data-effect-highlights') || '0'),
        shadows: parseFloat(visualTarget.getAttribute('data-effect-shadows') || '0'),
      };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });

    // 4. Radius
    const brData = visualTarget.getAttribute('data-radius');
    if (brData) {
      try {
        const parsed = JSON.parse(brData);
        setRadius(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
      } catch (e) { }
    } else {
      const br = visualTarget.style.borderRadius || "";
      if (br) {
        const parts = br.split(' ').map(p => parseInt(p) || 0);
        let nextRadius = null;
        if (parts.length === 1) nextRadius = { tl: parts[0], tr: parts[0], br: parts[0], bl: parts[0] };
        else if (parts.length === 4) nextRadius = { tl: parts[0], tr: parts[1], br: parts[2], bl: parts[3] };
        if (nextRadius) {
          setRadius(prev => JSON.stringify(prev) === JSON.stringify(nextRadius) ? prev : nextRadius);
        }
      }
    }

    // 5. Effects
    const effectsData = visualTarget.getAttribute('data-effects');
    if (effectsData) {
      try {
        const parsed = JSON.parse(effectsData);
        if (parsed.activeEffects) {
          setActiveEffects(prev => JSON.stringify(prev) === JSON.stringify(parsed.activeEffects) ? prev : parsed.activeEffects);
        }
        if (parsed.effectSettings) {
          setEffectSettings(prev => {
            const next = { ...prev, ...parsed.effectSettings };
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
          });
        }
      } catch (e) { }
    }

    // 6. Media Specific
    if (target.tagName === "VIDEO") {
      const src = target.currentSrc || target.src || target.querySelector("source")?.src || null;
      setPreviewSrc(src);

      if (src && src.startsWith("http") && !src.includes("blob:")) {
        setInputUrl(src);
        setIsUrlAdded(true);
      } else {
        setInputUrl("");
        setIsUrlAdded(false);
      }

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
      const rawFit = target.getAttribute('data-object-fit') || target.style.objectFit || 'Fill';
      const reverseMap = { 'contain': 'Fit', 'cover': 'Fill', 'fill': 'Stretch' };
      setVideoType(reverseMap[rawFit] || (rawFit.charAt(0).toUpperCase() + rawFit.slice(1)) || 'Fill');
    } else if (target.tagName === "IFRAME") {
      setPreviewSrc(target.src || null);
      if (target.src && target.src.startsWith("http")) {
        setInputUrl(target.src);
        setIsUrlAdded(true);
      } else {
        setInputUrl("");
        setIsUrlAdded(false);
      }
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
        const isSelector = e.target.closest('#main-color-selector');
        const isPicker = e.target.closest('#deep-color-picker');
        const isTrigger = e.target.closest('.color-field-trigger');
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
    if (!target) return;
    const visualTarget = container || target;

    let tagLower = liveElement.tagName?.toLowerCase();
    const isSvgEl = liveElement.namespaceURI === "http://www.w3.org/2000/svg";

    // --- FORCE VIDEO GROUP STRUCTURE FOR VIDEOS ---
    if (isSvgEl && liveElement.getAttribute('data-is-video-group') !== 'true') {
      if (tagLower === 'foreignobject' || tagLower === 'video' || tagLower === 'iframe') {
        const parent = liveElement.parentNode;
        const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newGroup.id = liveElement.id; // Keep selection intact
        newGroup.setAttribute('data-type', liveElement.getAttribute('data-type') || 'video');
        newGroup.setAttribute('data-name', 'Video Group');
        newGroup.setAttribute('data-is-video-group', 'true');

        liveElement.removeAttribute('id');
        liveElement.setAttribute('data-name', 'Video');

        if (liveElement.hasAttribute('transform')) {
          newGroup.setAttribute('transform', liveElement.getAttribute('transform'));
          liveElement.removeAttribute('transform');
        }

        if (parent) parent.insertBefore(newGroup, liveElement);
        newGroup.appendChild(liveElement);

        liveElement = newGroup;
        tagLower = 'g';
      } else {
        liveElement.setAttribute('data-is-video-group', 'true');
        liveElement.setAttribute('data-name', 'Video Group');
        if (target) target.setAttribute('data-name', 'Video');
      }
    }

    isUpdatingDOM.current = true;
    try {
      // Dimensions are managed natively by the editor drag-resize logic
      if (container) {
        target.setAttribute('width', '100%');
        target.setAttribute('height', '100%');
        target.style.width = '100%';
        target.style.height = '100%';
      }

      // Opacity
      const opVal = opacity / 100;
      target.style.opacity = opVal;
      target.setAttribute('opacity', opVal);
      target.setAttribute('data-opacity', opVal);

      if (visualTarget !== target) {
        visualTarget.style.opacity = '';
        visualTarget.removeAttribute('opacity');
        visualTarget.removeAttribute('data-opacity');
      }

      // Styling
      let fillLayer = liveElement.querySelector('.video-fill-layer');
      if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') {
        if (!fillLayer) {
          fillLayer = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          fillLayer.classList.add('video-fill-layer');
          fillLayer.setAttribute('data-name', 'Fill Color');
          fillLayer.style.pointerEvents = 'none';
          liveElement.insertBefore(fillLayer, liveElement.firstChild);

          const syncFillOverlay = () => {
            if (!fillLayer.isConnected) return;
            fillLayer.setAttribute('x', visualTarget.getAttribute('x') || '0');
            fillLayer.setAttribute('y', visualTarget.getAttribute('y') || '0');
            fillLayer.setAttribute('width', visualTarget.getAttribute('width') || '100%');
            fillLayer.setAttribute('height', visualTarget.getAttribute('height') || '100%');
            fillLayer.setAttribute('transform', visualTarget.getAttribute('transform') || '');
            fillLayer.style.transform = visualTarget.style.transform;
            fillLayer.style.translate = visualTarget.style.translate;
            fillLayer.style.scale = visualTarget.style.scale;
            fillLayer.style.rotate = visualTarget.style.rotate;
            fillLayer.style.transformOrigin = visualTarget.style.transformOrigin;
          };
          const obsFill = new MutationObserver(syncFillOverlay);
          obsFill.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          if (visualTarget !== liveElement) {
            obsFill.observe(visualTarget, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          }
        }

        fillLayer.setAttribute('x', visualTarget.getAttribute('x') || '0');
        fillLayer.setAttribute('y', visualTarget.getAttribute('y') || '0');
        fillLayer.setAttribute('width', visualTarget.getAttribute('width') || '100%');
        fillLayer.setAttribute('height', visualTarget.getAttribute('height') || '100%');
        fillLayer.setAttribute('transform', visualTarget.getAttribute('transform') || '');
        fillLayer.style.transform = visualTarget.style.transform;
        fillLayer.style.translate = visualTarget.style.translate;
        fillLayer.style.scale = visualTarget.style.scale;
        fillLayer.style.rotate = visualTarget.style.rotate;
        fillLayer.style.transformOrigin = visualTarget.style.transformOrigin;

        let parsedFill = null;
        if (backgroundColor.fill && backgroundColor.fill.toLowerCase().includes('gradient')) {
          parsedFill = parseGradient(backgroundColor.fill);
        }

        if (parsedFill && parsedFill.stops) {
          fillLayer.setAttribute('data-fill-type', 'gradient');
          fillLayer.setAttribute('data-fill-stops', JSON.stringify(parsedFill.stops));
          fillLayer.setAttribute('data-fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
          fillLayer.setAttribute('data-fill-angle', parsedFill.angle || 90);

          fillLayer.setAttribute('fill-type', 'gradient');
          fillLayer.setAttribute('fill-stops', JSON.stringify(parsedFill.stops));
          fillLayer.setAttribute('fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
          fillLayer.setAttribute('fill-angle', parsedFill.angle || 90);

          syncGradient(liveElement.ownerDocument || document, fillLayer, 'fill');
          liveElement.setAttribute('data-fill-type', 'gradient');
          liveElement.setAttribute('data-fill-stops', JSON.stringify(parsedFill.stops));
          liveElement.setAttribute('data-fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
          liveElement.setAttribute('data-fill-angle', parsedFill.angle || 90);
        } else {
          fillLayer.setAttribute('fill', backgroundColor.fill);
          if (fillLayer.style) fillLayer.style.removeProperty('fill');
          fillLayer.removeAttribute('data-fill-type');
          fillLayer.removeAttribute('data-fill-stops');
          fillLayer.removeAttribute('data-fill-gradient-type');
          fillLayer.removeAttribute('data-fill-angle');

          fillLayer.removeAttribute('fill-type');
          fillLayer.removeAttribute('fill-stops');
          fillLayer.removeAttribute('fill-gradient-type');
          fillLayer.removeAttribute('fill-angle');

          liveElement.removeAttribute('data-fill-type');
          liveElement.removeAttribute('data-fill-stops');
          liveElement.removeAttribute('data-fill-gradient-type');
          liveElement.removeAttribute('data-fill-angle');
        }
        fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());

        const maxRFill = Math.max(radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);
        if (maxRFill > 0) {
          fillLayer.setAttribute('rx', maxRFill.toString());
        } else {
          fillLayer.removeAttribute('rx');
        }

        visualTarget.style.backgroundColor = 'transparent'; // clear foreignObject background
        visualTarget.setAttribute('data-bg-color', backgroundColor.fill);
        liveElement.setAttribute('data-fill-color', backgroundColor.fill);
      } else {
        if (fillLayer) fillLayer.remove();
        visualTarget.style.backgroundColor = 'transparent';
        visualTarget.removeAttribute('data-bg-color');
        liveElement.removeAttribute('data-fill-color');
        liveElement.removeAttribute('data-fill-type');
      }

      // Helper to convert hex to rgba for CSS border
      const hexToRgba = (hex, alpha) => {
        if (!hex || hex === 'transparent' || hex === 'none') return 'transparent';
        if (hex.startsWith('rgba')) return hex;
        if (hex.startsWith('#')) {
          let c = hex.substring(1).split('');
          if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
          c = '0x' + c.join('');
          return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
        }
        return hex;
      };

      const pos = backgroundColor.strokePosition || 'Center';
      const color = hexToRgba(backgroundColor.stroke, backgroundColor.strokeOpacity / 100);
      const weight = backgroundColor.strokeWeight;
      const style = backgroundColor.strokeDashStyle === 'Dashed' ? 'dashed' : 'solid';

      visualTarget.setAttribute('data-stroke-color', backgroundColor.stroke);
      liveElement.setAttribute('data-stroke-color', backgroundColor.stroke);

      // Strip stroke from the <g> group so it doesn't cascade down to fillLayer and cause solid border leaks
      liveElement.removeAttribute('stroke');
      liveElement.removeAttribute('stroke-width');
      liveElement.removeAttribute('stroke-dasharray');

      visualTarget.setAttribute('stroke-width', weight);
      visualTarget.setAttribute('data-stroke-width', weight); // Keep for legacy

      if (backgroundColor.strokeDashStyle === 'Dashed') {
        const dashArray = `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
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
            strokeOverlay.setAttribute('transform', visualTarget.getAttribute('transform') || '');
            strokeOverlay.style.transform = visualTarget.style.transform;
            strokeOverlay.style.translate = visualTarget.style.translate;
            strokeOverlay.style.scale = visualTarget.style.scale;
            strokeOverlay.style.rotate = visualTarget.style.rotate;
            strokeOverlay.style.transformOrigin = visualTarget.style.transformOrigin;
          };
          const obs = new MutationObserver(syncOverlay);
          obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          if (visualTarget !== liveElement) {
            obs.observe(visualTarget, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          }
        }

        let bBox = { x: 0, y: 0, width: 100, height: 100 };
        try { bBox = visualTarget.getBBox(); } catch (e) { }

        let bxStr = visualTarget.getAttribute('x') || '0';
        let byStr = visualTarget.getAttribute('y') || '0';
        let bwStr = visualTarget.getAttribute('width') || '100%';
        let bhStr = visualTarget.getAttribute('height') || '100%';

        let bx = bxStr.includes('%') ? bBox.x : parseFloat(bxStr) || 0;
        let by = byStr.includes('%') ? bBox.y : parseFloat(byStr) || 0;
        let bw = bwStr.includes('%') ? bBox.width : parseFloat(bwStr) || 100;
        let bh = bhStr.includes('%') ? bBox.height : parseFloat(bhStr) || 100;

        let scaleX = 1;
        let scaleY = 1;
        try {
          const ctm = visualTarget.getScreenCTM();
          if (ctm) {
            scaleX = Math.abs(ctm.a) || 1;
            scaleY = Math.abs(ctm.d) || 1;
          }
        } catch(e) {}

        const offsetX = (weight / 2) / scaleX;
        const offsetY = (weight / 2) / scaleY;

        let ox = bx, oy = by, ow = bw, oh = bh;
        if (pos === 'Inside') {
          ox += offsetX; oy += offsetY; ow -= offsetX * 2; oh -= offsetY * 2;
        } else if (pos === 'Outside') {
          ox -= offsetX; oy -= offsetY; ow += offsetX * 2; oh += offsetY * 2;
        }

        strokeOverlay.style.setProperty('x', `${ox}px`, 'important');
        strokeOverlay.style.setProperty('y', `${oy}px`, 'important');
        strokeOverlay.style.setProperty('width', `${Math.max(0, ow)}px`, 'important');
        strokeOverlay.style.setProperty('height', `${Math.max(0, oh)}px`, 'important');
        strokeOverlay.setAttribute('transform', visualTarget.getAttribute('transform') || '');
        strokeOverlay.style.transform = visualTarget.style.transform;
        strokeOverlay.style.translate = visualTarget.style.translate;
        strokeOverlay.style.scale = visualTarget.style.scale;
        strokeOverlay.style.rotate = visualTarget.style.rotate;
        strokeOverlay.style.transformOrigin = visualTarget.style.transformOrigin;

        strokeOverlay.setAttribute('fill', 'none');

        liveElement.setAttribute('data-stroke-type', backgroundColor.strokeType);

        if (backgroundColor.strokeType === 'gradient' && backgroundColor.strokeStops) {
          liveElement.setAttribute('data-stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
          liveElement.setAttribute('data-stroke-stops', backgroundColor.strokeStops || '');
          liveElement.setAttribute('data-stroke-angle', backgroundColor.strokeAngle || '0');
          liveElement.setAttribute('data-stroke-radius', backgroundColor.strokeRadius || '100');

          strokeOverlay.setAttribute('stroke-type', 'gradient');
          strokeOverlay.setAttribute('stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
          strokeOverlay.setAttribute('stroke-stops', backgroundColor.strokeStops || '');
          strokeOverlay.setAttribute('stroke-angle', backgroundColor.strokeAngle || '0');
          strokeOverlay.setAttribute('stroke-radius', backgroundColor.strokeRadius || '100');
          syncGradient(liveElement.ownerDocument || document, strokeOverlay, 'stroke');
        } else {
          liveElement.removeAttribute('data-stroke-gradient-type');
          liveElement.removeAttribute('data-stroke-stops');
          liveElement.removeAttribute('data-stroke-angle');
          liveElement.removeAttribute('data-stroke-radius');

          strokeOverlay.removeAttribute('stroke-type');
          strokeOverlay.removeAttribute('stroke-gradient-type');
          strokeOverlay.removeAttribute('stroke-stops');
          strokeOverlay.removeAttribute('stroke-angle');
          strokeOverlay.removeAttribute('stroke-radius');

          strokeOverlay.setAttribute('stroke', backgroundColor.stroke);
          if (strokeOverlay.style) strokeOverlay.style.removeProperty('stroke');
        }
        strokeOverlay.setAttribute('stroke-width', weight.toString());
        if (backgroundColor.strokeDashStyle === 'Dashed') {
          const dashArray = `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
          strokeOverlay.setAttribute('stroke-dasharray', dashArray);
        } else {
          strokeOverlay.setAttribute('stroke-dasharray', 'none');
        }
        strokeOverlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
        strokeOverlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

        const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
        let adjR = maxR;
        if (pos === 'Inside') {
          adjR = Math.max(0, maxR - offsetX);
        } else if (pos === 'Outside') {
          adjR = maxR > 0 ? maxR + offsetX : 0;
        }

        if (adjR > 0) strokeOverlay.setAttribute('rx', adjR.toString());
        else strokeOverlay.removeAttribute('rx');

        strokeOverlay.style.outline = 'none';
        strokeOverlay.style.removeProperty('border-width');
        visualTarget.style.outline = 'none';
        visualTarget.style.borderWidth = '0px';
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
      const anyR = radius.tl || radius.tr || radius.br || radius.bl;
      const forceClip = activeEffects.includes('Blur') && effectSettings['Blur']?.clipContent;
      const radiusStr = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;

      visualTarget.style.borderRadius = radiusStr;
      visualTarget.setAttribute('data-radius', JSON.stringify(radius));
      visualTarget.style.overflow = 'hidden';

      if (anyR || forceClip) {
        visualTarget.style.setProperty('clip-path', `inset(0% 0% 0% 0% round ${radiusStr})`, 'important');
        if (forceClip) {
          if (isSvgEl) {
            let clipId = `clip-content-${liveElement.id || 'video'}`;
            let defs = liveElement.ownerSVGElement?.querySelector('defs');
            if (!defs && liveElement.ownerSVGElement) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              liveElement.ownerSVGElement.prepend(defs);
            }
            if (defs) {
              let clipNode = defs.querySelector(`#${clipId}`);
              if (!clipNode) {
                clipNode = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                clipNode.id = clipId;
                const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                clipNode.appendChild(clipPathEl);
                defs.appendChild(clipNode);
              }
              const rect = clipNode.firstChild;
              rect.setAttribute('x', visualTarget.getAttribute('x') || '0');
              rect.setAttribute('y', visualTarget.getAttribute('y') || '0');
              rect.setAttribute('width', visualTarget.getAttribute('width') || '100%');
              rect.setAttribute('height', visualTarget.getAttribute('height') || '100%');
              rect.setAttribute('transform', visualTarget.getAttribute('transform') || '');
              const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
              if (maxR > 0) rect.setAttribute('rx', maxR.toString());
              else rect.removeAttribute('rx');

              const foreignObj = liveElement.querySelector('foreignObject');
              if (foreignObj) {
                foreignObj.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                foreignObj.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
                liveElement.style.removeProperty('clip-path');
                liveElement.style.removeProperty('-webkit-clip-path');
              } else {
                liveElement.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                liveElement.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
              }
            }
          } else {
            liveElement.style.setProperty('clip-path', `inset(0% 0% 0% 0% round ${radiusStr})`, 'important');
          }
        } else {
          liveElement.style.removeProperty('clip-path');
          liveElement.style.removeProperty('-webkit-clip-path');
          const foreignObj = liveElement.querySelector('foreignObject');
          if (foreignObj) {
            foreignObj.style.removeProperty('clip-path');
            foreignObj.style.removeProperty('-webkit-clip-path');
          }
        }
      } else {
        visualTarget.style.removeProperty('clip-path');
        liveElement.style.removeProperty('clip-path');
        liveElement.style.removeProperty('-webkit-clip-path');
        const foreignObj = liveElement.querySelector('foreignObject');
        if (foreignObj) {
          foreignObj.style.removeProperty('clip-path');
          foreignObj.style.removeProperty('-webkit-clip-path');
        }
      }

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
      filterStr += `brightness(${100 + exposure + (h / 5)}%) `;
      filterStr += `contrast(${100 + contrast + (s / 5)}%) `;
      filterStr += `saturate(${100 + saturation}%) `;
      if (tint !== 0) filterStr += `hue-rotate(${tint}deg) `;
      if (temperature > 0) filterStr += `sepia(${temperature / 2}%) `;
      else if (temperature < 0) filterStr += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;

      let boxShadowStr = '';
      let blurStr = '';
      activeEffects.forEach(eff => {
        const effSet = effectSettings[eff];
        if (!effSet) return;
        if (eff === 'Blur') blurStr = `blur(${effSet.blur}px) `;
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
      let innerShadowString = '';
      if (activeEffects.includes('Inner Shadow')) {
        const ds = effectSettings['Inner Shadow'];
        const alpha = (ds.opacity !== undefined ? ds.opacity : 35) / 100;
        const color = ds.color || '#000000';
        let r = 0, g = 0, b = 0;
        if (color.startsWith('#')) {
          const hex = color.replace('#', '');
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16);
          } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16);
          }
        }
        const rgbaStr = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        innerShadowString = `inset ${ds.x || 0}px ${ds.y || 0}px ${ds.blur || 0}px ${ds.spread || 0}px ${rgbaStr}`;
      }

      if (isSvgEl) {
        let overlay = liveElement.querySelector('.svg-video-inner-shadow-rect');
        let oldOverlay = liveElement.querySelector('.svg-video-inner-shadow');
        if (oldOverlay) oldOverlay.remove();

        let filterId = liveElement.getAttribute('data-inner-shadow-filter-id');

        if (activeEffects.includes('Inner Shadow')) {
          const ds = effectSettings['Inner Shadow'];
          const alpha = (ds.opacity !== undefined ? ds.opacity : 35) / 100;
          const color = ds.color || '#000000';

          if (!filterId) {
            filterId = 'inner-shadow-' + Math.random().toString(36).substr(2, 9);
            liveElement.setAttribute('data-inner-shadow-filter-id', filterId);
          }

          let svgDefs = liveElement.ownerSVGElement?.querySelector('defs');
          if (!svgDefs && liveElement.ownerSVGElement) {
            svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            liveElement.ownerSVGElement.prepend(svgDefs);
          }

          if (svgDefs) {
            let filterEl = svgDefs.querySelector(`#${filterId}`);
            if (!filterEl) {
              filterEl = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
              filterEl.id = filterId;
              svgDefs.appendChild(filterEl);
            }

            while (filterEl.firstChild) filterEl.removeChild(filterEl.firstChild);

            const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
            feOffset.setAttribute('dx', ds.x || 0);
            feOffset.setAttribute('dy', ds.y || 0);

            const feBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feBlur.setAttribute('stdDeviation', (ds.blur || 0) / 2);
            feBlur.setAttribute('result', 'offset-blur');

            const feComp1 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComp1.setAttribute('operator', 'out');
            feComp1.setAttribute('in', 'SourceAlpha');
            feComp1.setAttribute('in2', 'offset-blur');
            feComp1.setAttribute('result', 'inverse');

            const feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
            feFlood.setAttribute('flood-color', color);
            feFlood.setAttribute('flood-opacity', alpha);
            feFlood.setAttribute('result', 'color');

            const feComp2 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComp2.setAttribute('operator', 'in');
            feComp2.setAttribute('in', 'color');
            feComp2.setAttribute('in2', 'inverse');
            feComp2.setAttribute('result', 'shadow');

            filterEl.appendChild(feOffset);
            filterEl.appendChild(feBlur);
            filterEl.appendChild(feComp1);
            filterEl.appendChild(feFlood);
            filterEl.appendChild(feComp2);
          }

          if (!overlay) {
            overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            overlay.classList.add('svg-video-inner-shadow-rect');
            overlay.style.pointerEvents = 'none';
            overlay.setAttribute('fill', 'white');
            liveElement.appendChild(overlay);
          }

          const targetEl = visualTarget;
          let box = { x: 0, y: 0, width: 100, height: 100 };
          try { box = targetEl.getBBox(); } catch (e) {
            box.x = parseFloat(targetEl.getAttribute('x') || 0);
            box.y = parseFloat(targetEl.getAttribute('y') || 0);
            box.width = parseFloat(targetEl.getAttribute('width') || 100);
            box.height = parseFloat(targetEl.getAttribute('height') || 100);
          }

          overlay.setAttribute('x', box.x);
          overlay.setAttribute('y', box.y);
          overlay.setAttribute('width', Math.max(1, box.width));
          overlay.setAttribute('height', Math.max(1, box.height));
          overlay.setAttribute('transform', targetEl.getAttribute('transform') || '');

          const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
          if (anyR) overlay.setAttribute('rx', Math.max(radius.tl, radius.tr, radius.br, radius.bl));
          else overlay.removeAttribute('rx');

          overlay.setAttribute('filter', `url(#${filterId})`);
        } else {
          if (overlay) overlay.remove();
          if (filterId && liveElement.ownerSVGElement) {
            const f = liveElement.ownerSVGElement.querySelector(`#${filterId}`);
            if (f) f.remove();
          }
        }
      } else {
        // Fallback for non-SVG video targets
        activeEffects.forEach(eff => {
          const effSet = effectSettings[eff];
          if (!effSet) return;
          if (eff === 'Drop Shadow') {
            const alpha = Math.round((effSet.opacity / 100) * 255).toString(16).padStart(2, '0');
            boxShadowStr += `${effSet.x}px ${effSet.y}px ${effSet.blur}px ${effSet.spread}px ${effSet.color}${alpha}, `;
          }
        });

        let overlay = liveElement.querySelector('.inner-shadow-overlay') || liveElement.parentElement?.querySelector('.inner-shadow-overlay');
        if (innerShadowString) {
          const targetParent = (['IMG', 'VIDEO', 'IFRAME'].includes(liveElement.tagName)) ? liveElement.parentElement : liveElement;
          if (!overlay && targetParent) {
            overlay = document.createElement('div');
            overlay.className = 'inner-shadow-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '99999'; // High z-index to stay above video
            overlay.style.boxSizing = 'border-box';
            if (window.getComputedStyle(targetParent).position === 'static') {
              targetParent.style.position = 'relative';
            }
            targetParent.appendChild(overlay);
          }
          if (overlay) {
            overlay.style.boxShadow = innerShadowString;
            const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
            overlay.style.borderRadius = anyR ? `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '0px';
          }
        } else if (overlay) {
          overlay.remove();
        }
      }

      visualTarget.style.filter = (filterStr + " " + blurStr).trim() || 'none';
      liveElement.style.removeProperty('filter');
      visualTarget.style.boxShadow = boxShadowStr.trim().replace(/,$/, '');
      visualTarget.setAttribute('data-effects', JSON.stringify({ activeEffects, effectSettings }));
      liveElement.setAttribute('data-active-effects', activeEffects.join(','));

      liveElement.setAttribute('data-effect-blur', activeEffects.includes('Blur') ? 'true' : 'false');
      if (effectSettings['Blur']) {
        liveElement.setAttribute('data-effect-blur-value', effectSettings['Blur'].blur.toString());
        liveElement.setAttribute('data-effect-blur-clip', effectSettings['Blur'].clipContent ? 'true' : 'false');
      }

      liveElement.setAttribute('data-effect-drop-shadow', activeEffects.includes('Drop Shadow') ? 'true' : 'false');
      if (effectSettings['Drop Shadow']) {
        liveElement.setAttribute('data-effect-drop-shadow-color', effectSettings['Drop Shadow'].color);
        liveElement.setAttribute('data-effect-drop-shadow-opacity', effectSettings['Drop Shadow'].opacity.toString());
        liveElement.setAttribute('data-effect-drop-shadow-x', effectSettings['Drop Shadow'].x.toString());
        liveElement.setAttribute('data-effect-drop-shadow-y', effectSettings['Drop Shadow'].y.toString());
        liveElement.setAttribute('data-effect-drop-shadow-blur', effectSettings['Drop Shadow'].blur.toString());
      }

      liveElement.setAttribute('data-effect-inner-shadow', activeEffects.includes('Inner Shadow') ? 'true' : 'false');
      if (effectSettings['Inner Shadow']) {
        liveElement.setAttribute('data-effect-inner-shadow-color', effectSettings['Inner Shadow'].color);
        liveElement.setAttribute('data-effect-inner-shadow-opacity', effectSettings['Inner Shadow'].opacity.toString());
        liveElement.setAttribute('data-effect-inner-shadow-x', effectSettings['Inner Shadow'].x.toString());
        liveElement.setAttribute('data-effect-inner-shadow-y', effectSettings['Inner Shadow'].y.toString());
        liveElement.setAttribute('data-effect-inner-shadow-blur', effectSettings['Inner Shadow'].blur.toString());
      }

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
          target.play().catch(e => console.warn("Video autoplay failed:", e));
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

      // --- STRICT LAYER REORDERING FOR VIDEO GROUPS ---
      if (liveElement.getAttribute('data-is-video-group') === 'true') {
        const dropShadow = liveElement.querySelector('.svg-drop-shadow-caster');
        const fillLayer = liveElement.querySelector('.svg-fill-layer');
        const innerShadows = Array.from(liveElement.querySelectorAll('.svg-inner-shadow-caster'));
        const strokeLayer = liveElement.querySelector('.svg-stroke-layer');
        const videoNode = liveElement.querySelector('foreignObject') || liveElement.querySelector('video') || liveElement.querySelector('iframe');

        // We only move the specific layers to avoid detaching the videoNode itself
        if (dropShadow && videoNode) {
          dropShadow.setAttribute('data-name', 'Drop Shadow');
          if (dropShadow.nextElementSibling !== videoNode) {
            liveElement.insertBefore(dropShadow, videoNode);
          }
        }
        if (fillLayer && videoNode) {
          fillLayer.setAttribute('data-name', 'Fill Color');
          if (fillLayer.nextElementSibling !== videoNode) {
            liveElement.insertBefore(fillLayer, videoNode);
          }
        }
        // Inner shadows and stroke layer must be placed AFTER videoNode.
        innerShadows.forEach(inner => {
          inner.setAttribute('data-name', 'Inner Shadow');
          if (liveElement.lastElementChild !== inner) {
            liveElement.appendChild(inner);
          }
        });
        if (strokeLayer) {
          strokeLayer.setAttribute('data-name', 'Stroke');
          if (liveElement.lastElementChild !== strokeLayer) {
            liveElement.appendChild(strokeLayer);
          }
        }
      }

      // Trigger parent update
      window.__skipCanvasUpdateForPage = activePageIndex;
      debouncedUpdate();
    } catch (e) {
      console.error("Error applying video visuals:", e);
    }
  }, [selectedElement, selectedLayerId, activePageIndex, opacity, backgroundColor, filters, radius, videoType, activeEffects, effectSettings, autoplay, loop, controls, controlsSize, debouncedUpdate]);

  useEffect(() => {
    applyVisuals();
  }, [applyVisuals]);

  // Removed global disableNativeControls and custom-video-progress-style injection (moved to MainEditor.jsx)

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

  // Removed custom inline controls bar injection (moved to MainEditor.jsx)

  const updateElementAttribute = (attr, value) => {
    // These update the local state which then triggers applyVisuals
    if (attr === 'width') setWidth(value);
    else if (attr === 'height') setHeight(value);
    else if (attr === 'opacity') setOpacity(value);
    else if (attr === 'backgroundColor') setBackgroundColor(value);
    else if (attr === 'stroke') setBackgroundColor(prev => ({ ...prev, stroke: value }));
    else if (attr === 'strokeWeight') setBackgroundColor(prev => ({ ...prev, strokeWeight: value }));
    else if (attr === 'strokeType') setBackgroundColor(prev => ({ ...prev, strokeType: value }));
    else if (attr === 'strokeDashLength') setBackgroundColor(prev => ({ ...prev, strokeDashLength: value }));
    else if (attr === 'strokeDashGap') setBackgroundColor(prev => ({ ...prev, strokeDashGap: value }));
    else if (attr === 'strokeDashPosition') setBackgroundColor(prev => ({ ...prev, strokePosition: value }));
    else if (attr === 'strokeLinecap') setBackgroundColor(prev => ({ ...prev, strokeLinecap: value }));
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

    const wasIframe = target.tagName === "IFRAME";

    if (wasIframe) {
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

    const tempVideo = document.createElement('video');
    tempVideo.onloadedmetadata = async () => {
      // Retain the current element's dimension size and don't recalculate based on new aspect ratio.
      // This ensures replacing a video keeps the exact same size and bounding box.

      target.src = videoURL;
      target.setAttribute("src", videoURL);
      target.setAttribute("data-filename", file.name);
      target.autoplay = false;
      target.removeAttribute("autoplay");
      setAutoplay(false);
      const source = target.querySelector("source");
      if (source) {
        source.src = videoURL;
        source.setAttribute("src", videoURL);
      }
      if (target.tagName === "VIDEO") target.load();

      setPreviewSrc(videoURL);
      debouncedUpdate({ newElement: wasIframe ? target : undefined });

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
    tempVideo.src = videoURL;
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
        if (!finalUrl.includes("autoplay=1")) {
          finalUrl += finalUrl.includes("?") ? "&autoplay=1&mute=1" : "?autoplay=1&mute=1";
        }
      }
      target.src = finalUrl;
      target.setAttribute("src", finalUrl);
      if (!isYouTube) {
        target.autoplay = true;
        target.muted = true;
        target.setAttribute("autoplay", "");
        target.setAttribute("muted", "");
      }
      setAutoplay(true);
      debouncedUpdate();
      return;
    }

    // Otherwise, create a new element of the correct type and swap it
    let newElement;
    if (isYouTube) {
      let embedUrl = url;
      if (url.includes("watch?v=")) embedUrl = `https://www.youtube.com/embed/${url.split("v=")[1]}`;
      if (url.includes("youtu.be")) embedUrl = `https://www.youtube.com/embed/${url.split("/").pop()}`;
      if (!embedUrl.includes("autoplay=1")) {
        embedUrl += embedUrl.includes("?") ? "&autoplay=1&mute=1" : "?autoplay=1&mute=1";
      }
      newElement = document.createElement("iframe");
      newElement.src = embedUrl;
      newElement.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      newElement.allowFullscreen = true;
    } else {
      newElement = document.createElement("video");
      newElement.src = url;
      newElement.controls = true;
      newElement.autoplay = true;
      newElement.muted = true;
      newElement.setAttribute("autoplay", "");
      newElement.setAttribute("muted", "");
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
    setAutoplay(true);
    debouncedUpdate();
  };

  const handleAddUrl = () => {
    if (!inputUrl) return;
    setIsAddingUrl(true);
    setUrlAddProgress(0);
    setIsUrlAdded(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUrlAddProgress(100);
        replaceTemplateWithUrl(inputUrl);
        setTimeout(() => {
          setIsAddingUrl(false);
          setIsUrlAdded(true);
        }, 500);
      } else {
        setUrlAddProgress(progress);
      }
    }, 200);
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
        .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.4vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
        .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
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
        <div className="flex items-start gap-[0.75vw] pt-[0.5vw]">
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
                onClick={() => onDeleteLayer && onDeleteLayer()}
              >
                <Icon icon="lucide:trash-2" className="w-[1.1vw] h-[1.1vw] text-white" />
                <span className="text-[0.5vw] text-white font-semibold">Remove</span>
              </div>
            </div>
            <span className="text-[0.6vw] font-semibold text-gray-400">Current</span>
          </div>

          {/* Replace Icon */}
          <div
            className="flex items-center justify-center shrink-0 h-[5vw] cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon icon="qlementine-icons:replace-16" className="w-[1.1vw] h-[1.1vw] text-[#9ca3af]" />
          </div>

          {/* Upload Box */}
          <div className="flex flex-col items-center gap-[0.35vw] flex-1">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 w-full h-[5vw] rounded-[0.75vw] flex flex-col items-center justify-center cursor-pointer bg-white py-[0.2vw] hover:opacity-80 transition-opacity"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  if (file.type === 'video/mp4') {
                    handleVideoUpload({ target: { files: e.dataTransfer.files } });
                  }
                }
              }}
            >
              <p className="text-[0.65vw] font-medium text-gray-600 text-center mb-[0.2vw]">
                Drag & Drop or <span className="text-[#4D47FF] font-semibold">Upload</span>
              </p>
              <Upload size="1.1vw" className="text-gray-400 mb-[0.2vw]" />
              <div className="flex flex-col items-center">
                <span className="text-[0.5vw] font-semibold text-gray-500">Supported File Format</span>
                <span className="text-[0.5vw] font-semibold text-gray-500">MP4</span>
              </div>
            </div>
            <span className="text-[0.6vw] font-semibold text-gray-400 cursor-default">Replace</span>
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
          <div className="flex-1 flex items-center border border-gray-300 rounded-[0.6vw] overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all pr-[0.3vw]">

            <input
              type="text"
              placeholder="https://"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setIsUrlAdded(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddUrl();
              }}
              className="flex-1 px-[0.75vw] py-[0.55vw] text-[0.85vw] text-gray-700 outline-none bg-transparent"
            />
            <button
              onClick={handleAddUrl}
              disabled={isAddingUrl || !inputUrl}
              className={`flex items-center justify-center h-[2vw] px-[0.8vw] rounded-[0.4vw] text-[0.75vw] font-medium transition-all ${isUrlAdded ? 'bg-green-500 text-white' :
                isAddingUrl ? 'bg-indigo-100 text-indigo-600' :
                  'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
              {isUrlAdded ? (
                'Added'
              ) : isAddingUrl ? (
                <div className="flex items-center gap-[0.3vw]">
                  <Icon icon="eos-icons:loading" className="w-[1vw] h-[1vw]" />
                  <span>{urlAddProgress}%</span>
                </div>
              ) : (
                'Add'
              )}
            </button>
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
          <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
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
              className="w-full cursor-pointer custom-range-slider"
              style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }}
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
            { label: "Autoplay (Play video automatically)", value: autoplay, onChange: (v) => {
                updateElementAttribute('autoplay', v);
                if (!v && loop) updateElementAttribute('loop', false);
              }
            },
            { label: "Loop (Repeat video continuously)", value: loop, onChange: (v) => updateElementAttribute('loop', v), disabled: !autoplay }
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between ${item.disabled ? 'opacity-50' : ''}`}>
              <span className="text-[0.75vw] font-medium text-gray-800">{item.label}</span>
              <Switch enabled={item.value} onChange={item.onChange} disabled={item.disabled} />
            </div>
          ))}

        </div>
      </div>

      <div className="space-y-[0.60vw] px-[0.3vw]">
        <Color
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
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

        <Adjustment
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          filters={filters}
          setFilters={setFilters}
          tagName={selectedElement?.tagName?.toLowerCase() || 'video'}
        />
        <Effect
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          activeEffects={activeEffects}
          setActiveEffects={setActiveEffects}
          effectSettings={effectSettings}
          setEffectSettings={setEffectSettings}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showDetailedPicker={showDetailedPicker}
          setShowDetailedPicker={setShowDetailedPicker}
        />
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
    </div>
  );
};

export default VideoEditor;
