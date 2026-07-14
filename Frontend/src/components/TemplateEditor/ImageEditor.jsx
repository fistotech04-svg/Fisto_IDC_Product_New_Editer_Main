import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { getVisualBBox } from './MainEditor';
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
import ColorPicker, { parseGradient } from './ColorPicker';
import GalleryImage from './GalleryImage';
import SlideshowProperties from './SlideshowProperties';
import Color from './Color';
import CornerRadius from './CornerRadius';
import Adjustment from './Adjustment';
import Effect from './Effect';
import { syncGradient, getSvgImageEl } from './editorUtils';
import CropOverlay from './CropOverlay';







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
  const [showCropModal, setShowCropModal] = useState(false);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [isRadiusLinked, setIsRadiusLinked] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(() => {
    if (!selectedElement) return '';
    const imgEl = getSvgImageEl(selectedElement);
    return imgEl?.getAttribute?.('href') || imgEl?.getAttribute?.('xlink:href') || imgEl?.src || '';
  });
  const [imageType, setImageType] = useState('Fit');
  const [opacity, setOpacity] = useState(100);
  const [activePopup, setActivePopup] = useState(null);
  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [radius, setRadius] = useState({ tl: 12, tr: 12, br: 12, bl: 12 });
  const [activeEffects, setActiveEffects] = useState(['effect']);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 1, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 1, spread: 0 },
    'Blur': { blur: 1, spread: 0 }
  });

  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | null
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  const [backgroundColor, setBackgroundColor] = useState(() => {
    if (!selectedElement) return { fill: 'transparent', fillOpacity: 100, stroke: 'transparent', strokeOpacity: 100, strokeType: 'Solid', strokeWeight: 0 };
    let fill = selectedElement.getAttribute('data-fill-color');
    if (!fill) {
      fill = selectedElement.getAttribute('fill');
      if (fill && fill.startsWith('url(')) {
        fill = 'transparent';
      }
    }
    fill = fill || 'transparent';
    const stroke = selectedElement.getAttribute('stroke') || selectedElement.getAttribute('data-stroke-color') || 'transparent';
    const strokeW = selectedElement.getAttribute('stroke-width') || '0';
    const dash = selectedElement.getAttribute('stroke-dasharray') || 'none';
    return {
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: Math.round(parseFloat(selectedElement.getAttribute('data-fill-opacity') || selectedElement.getAttribute('fill-opacity') || '1') * 100),
      stroke: stroke === 'none' ? 'transparent' : stroke,
      strokeOpacity: Math.round(parseFloat(selectedElement.getAttribute('data-stroke-opacity') || selectedElement.getAttribute('stroke-opacity') || '1') * 100),
      strokeType: selectedElement.getAttribute('data-stroke-type') || 'solid',
      strokeDashStyle: dash === 'none' ? 'Solid' : 'Dashed',
      strokeWeight: parseFloat(strokeW)
    };
  });

  const [isSlideshow, setIsSlideshow] = useState(false);
  const lastElementIdRef = useRef(null);
  const [showTransitionDropdown, setShowTransitionDropdown] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [colorsOnPage, setColorsOnPage] = useState([]);

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

  const lastHydratedElementRef = useRef(null);

  // Resolve actual slideshow element if clicked on an inner child
  const actualSlideshowEl = useMemo(() => {
    if (!selectedElement) return null;
    if (selectedElement.hasAttribute('data-is-slideshow') ||
      selectedElement.getAttribute('data-is-slideshow') === 'true') {
      return selectedElement;
    }
    const parent = selectedElement.closest && selectedElement.closest('[data-is-slideshow="true"]');
    if (parent) return parent;
    return selectedElement;
  }, [selectedElement]);

  // Hydrate Slideshow State from DOM
  useEffect(() => {
    if (actualSlideshowEl) {
      if (actualSlideshowEl !== lastHydratedElementRef.current) {
        const hasSlideshow = actualSlideshowEl.hasAttribute('data-is-slideshow') ||
          actualSlideshowEl.getAttribute('data-is-slideshow') === 'true';
        setIsSlideshow(!!hasSlideshow);
        lastHydratedElementRef.current = actualSlideshowEl;
      }
    } else {
      lastHydratedElementRef.current = null;
    }
  }, [actualSlideshowEl]);


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

  // Ctrl + Drag inline crop listener
  useEffect(() => {
    if (!selectedElement) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Control' && !showCropModal && !isSlideshow) {
        setImageType('Crop');
        if (stateRef.current) stateRef.current.imageType = 'Crop';
        setShowCropModal(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, showCropModal, isSlideshow]);



  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedLayerId) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }

    // Resolve the live element from the DOM
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
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
        try { targetImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl); } catch (e) { }

        const patImg = liveElement.querySelector('.internal-crop-image');
        if (patImg) {
          patImg.setAttribute('href', imageUrl);
          try { patImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl); } catch (e) { }
        }

        const origFill = liveElement.getAttribute('data-original-fill');
        if (origFill) {
          const match = origFill.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
          if (match) {
            const origPat = document.getElementById(match[1].trim()) || liveElement.closest('svg')?.querySelector(`pattern[id="${match[1].trim()}"]`);
            if (origPat) {
              const origImg = origPat.querySelector('image');
              if (origImg) {
                origImg.setAttribute('href', imageUrl);
                try { origImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl); } catch (e) { }
              }
            }
          }
        }
      } else {
        targetImg.src = imageUrl;
        targetImg.setAttribute('src', imageUrl);
      }

      setPreviewSrc(imageUrl);
      liveElement.removeAttribute('data-original-src');
      liveElement.removeAttribute('data-cropped-src');

      liveElement.removeAttribute('data-effect-crop-inset');
      liveElement.removeAttribute('data-crop-data');
      setImageType('Fit');
      stateRef.current.imageType = 'Fit';

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
              try { svgImgSrv.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', serverUrl); } catch (e) { }
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
        const parts = (clipStyle.match(/round\s+([.\d\s]+)px/) || ['', '0'])[1].trim().split(/\s+/).map(p => parseFloat(p) || 0);
        let tl = 0, tr = 0, br = 0, bl = 0;
        if (parts.length === 1) { tl = tr = br = bl = parts[0]; }
        else if (parts.length === 2) { tl = br = parts[0]; tr = bl = parts[1]; }
        else if (parts.length === 3) { tl = parts[0]; tr = bl = parts[1]; br = parts[2]; }
        else if (parts.length >= 4) { tl = parts[0]; tr = parts[1]; br = parts[2]; bl = parts[3]; }
        if (currentState.radius.tl !== tl || currentState.radius.tr !== tr || currentState.radius.br !== br || currentState.radius.bl !== bl) {
          setRadius({ tl, tr, br, bl });
        }
      }
    } else {
      const domRadius = selectedElement.style.borderRadius || '0px';
      const parts = domRadius.split(' ').map(p => parseFloat(p) || 0);
      let tl = 0, tr = 0, br = 0, bl = 0;
      if (parts.length === 1) { tl = tr = br = bl = parts[0]; }
      else if (parts.length === 2) { tl = br = parts[0]; tr = bl = parts[1]; }
      else if (parts.length === 3) { tl = parts[0]; tr = bl = parts[1]; br = parts[2]; }
      else if (parts.length >= 4) { tl = parts[0]; tr = parts[1]; br = parts[2]; bl = parts[3]; }
      if (currentState.radius.tl !== tl || currentState.radius.tr !== tr || currentState.radius.br !== br || currentState.radius.bl !== bl) {
        setRadius({ tl, tr, br, bl });
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
        newType = 'Fit';
      } else {
        newType = 'Fit';
      }
    } else {
      const inlineFit = selectedElement.style.objectFit;
      const cp = selectedElement.style.clipPath || selectedElement.style.webkitClipPath || '';
      const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'fill': 'Fit' };
      const currentFit = inlineFit || window.getComputedStyle(selectedElement).objectFit || 'contain';
      const hasCrop = cp.includes('inset') || isCroppedSrc || selectedElement.hasAttribute('data-effect-crop-inset');
      newType = hasCrop ? 'Crop' : (fitMapRev[currentFit] || 'Fit');
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
    let fill = selectedElement.getAttribute('data-fill-color');
    if (!fill) {
      fill = selectedElement.getAttribute('fill');
      if (fill && fill.startsWith('url(')) {
        fill = 'transparent';
      }
    }
    fill = fill || 'transparent';
    const stroke = selectedElement.getAttribute('stroke') || selectedElement.getAttribute('data-stroke-color') || 'transparent';
    const fillOp = selectedElement.getAttribute('data-fill-opacity') || selectedElement.getAttribute('fill-opacity') || '1';
    const strokeOp = selectedElement.getAttribute('data-stroke-opacity') || selectedElement.getAttribute('stroke-opacity') || '1';
    const strokeW = selectedElement.getAttribute('data-stroke-width') || selectedElement.getAttribute('stroke-width') || '0';
    const strokeArray = selectedElement.getAttribute('data-stroke-dasharray') || selectedElement.getAttribute('stroke-dasharray') || 'none';

    let dashLen = 5, dashGap = 5;
    if (strokeArray !== 'none' && strokeArray !== '') {
      const parts = strokeArray.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 5 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }
    const dashPos = selectedElement.getAttribute('data-stroke-position') || 'Center';
    const dashCap = selectedElement.getAttribute('stroke-linecap') || 'butt';

    const existingStrokeType = selectedElement.getAttribute('data-stroke-type') || 'solid';
    const actualStrokeDashStyle = strokeArray === 'none' ? 'Solid' : 'Dashed';

    const newBg = {
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: Math.round(parseFloat(fillOp) * 100),
      stroke: stroke === 'none' ? 'transparent' : stroke,
      strokeOpacity: Math.round(parseFloat(strokeOp) * 100),
      strokeType: existingStrokeType,
      strokeDashStyle: actualStrokeDashStyle,
      strokeGradientType: selectedElement.getAttribute('data-stroke-gradient-type') || 'linear',
      strokeStops: selectedElement.getAttribute('data-stroke-stops'),
      strokeAngle: parseFloat(selectedElement.getAttribute('data-stroke-angle') || '0'),
      strokeRadius: parseFloat(selectedElement.getAttribute('data-stroke-radius') || '100'),
      strokeWeight: parseFloat(strokeW),
      strokeDashLength: dashLen,
      strokeDashGap: dashGap,
      strokePosition: dashPos,
      strokeLinecap: dashCap
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
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    let liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || (selectedElement?.isConnected ? selectedElement : null);

    if (!liveElement) return;

    // Use stateRef for the most up-to-date value during manual calls from onSave
    const effectiveImageType = stateRef.current.imageType || imageType;

    // Detect SVG image element (direct <image>, <g> group, or shape with pattern fill)
    let tagLower = liveElement.tagName?.toLowerCase();
    let svgImageEl = getSvgImageEl(liveElement);
    let isSvgEl = !!svgImageEl || (liveElement instanceof SVGElement && tagLower !== 'svg');

    // --- FORCE IMAGE GROUP STRUCTURE FOR IMAGES ---
    if (isSvgEl && svgImageEl && liveElement.getAttribute('data-is-image-group') !== 'true') {
      if (tagLower === 'image') {
        const parent = liveElement.parentNode;
        const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newGroup.id = liveElement.id; // Keep selection intact
        newGroup.setAttribute('data-type', liveElement.getAttribute('data-type') || 'image');
        newGroup.setAttribute('data-name', 'Image Group');
        newGroup.setAttribute('data-is-image-group', 'true');

        liveElement.removeAttribute('id');
        liveElement.setAttribute('data-name', 'Image');

        if (liveElement.hasAttribute('transform')) {
          newGroup.setAttribute('transform', liveElement.getAttribute('transform'));
          liveElement.removeAttribute('transform');
        }

        if (parent) parent.insertBefore(newGroup, liveElement);
        newGroup.appendChild(liveElement);

        liveElement = newGroup;
        tagLower = 'g';
      } else {
        liveElement.setAttribute('data-is-image-group', 'true');
      }
    }

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
        try { el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', src); } catch (e) { }
      } else {
        el.src = src;
        el.setAttribute('src', src);
      }
    };

    isUpdatingDOM.current = true;
    try {
      const getPathD = (x, y, w, h, tlv, trv, brv, blv) => {
        return `M ${x + tlv},${y} ` +
          `L ${x + w - trv},${y} ` +
          `Q ${x + w},${y} ${x + w},${y + trv} ` +
          `L ${x + w},${y + h - brv} ` +
          `Q ${x + w},${y + h} ${x + w - brv},${y + h} ` +
          `L ${x + blv},${y + h} ` +
          `Q ${x},${y + h} ${x},${y + h - blv} ` +
          `L ${x},${y + tlv} ` +
          `Q ${x},${y} ${x + tlv},${y} Z`;
      };
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
      adjustmentFilters += `brightness(${100 + exposure + (h / 5)}%) `;
      adjustmentFilters += `contrast(${100 + contrast + (s / 5)}%) `;
      adjustmentFilters += `saturate(${100 + saturation}%) `;
      if (tint !== 0) adjustmentFilters += `hue-rotate(${tint}deg) `;
      if (temperature > 0) adjustmentFilters += `sepia(${temperature / 2}%) `;
      else if (temperature < 0) adjustmentFilters += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;

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

        // 1. Apply Adjustments to the actual image content (leaf)
        if (svgImageEl) {
          svgImageEl.style.setProperty('filter', adjustOnlyFilter, 'important');
        }

        // 2. Restore shadowCaster for images with clip-paths (Crop/Radius) to prevent shadow clipping
        const isImageElement = liveElement.tagName?.toLowerCase() === 'image';
        const targetContainer = isImageElement ? (liveElement.parentElement || liveElement) : liveElement;

        if (isImageElement) {
          const buggyCaster = liveElement.querySelector('.svg-drop-shadow-caster');
          if (buggyCaster) buggyCaster.remove();
        }

        let shadowCaster = targetContainer.querySelector('.svg-drop-shadow-caster');
        const effImgType = liveElement.getAttribute('data-object-fit') || imageType;
        // Only images use CSS clip-path which clips shadows. Shapes use native rx/ry.
        const hasClip = isImageElement && ((effImgType === 'Crop') || (radius.tl || radius.tr || radius.br || radius.bl));

        if (shadowOnlyFilter !== 'none' && hasClip) {
          if (!shadowCaster || shadowCaster.tagName.toLowerCase() !== 'path') {
            if (shadowCaster) shadowCaster.remove();
            shadowCaster = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shadowCaster.classList.add('svg-drop-shadow-caster');
            shadowCaster.style.pointerEvents = 'none';
          }

          if (shadowCaster) {
            const targetInsertNode = (effImgType === 'Crop' && liveElement.parentElement?.classList.contains('svg-crop-wrapper'))
              ? liveElement.parentElement
              : liveElement;

            if (liveElement.getAttribute('data-is-image-group') === 'true') {
              liveElement.appendChild(shadowCaster);
            } else if (shadowCaster.nextSibling !== targetInsertNode && targetInsertNode.parentElement) {
              targetInsertNode.parentElement.insertBefore(shadowCaster, targetInsertNode);
            }

            let targetElForShadow = svgImageEl || liveElement;
            if (effImgType === 'Crop' && svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
              targetElForShadow = svgImageEl.parentNode;
            }

            let bb = { x: 0, y: 0, width: 100, height: 100 };
            try { bb = targetElForShadow.getBBox(); } catch (e) { }

            let cxStr = targetElForShadow.getAttribute('x') || '0';
            let cyStr = targetElForShadow.getAttribute('y') || '0';
            let cwStr = targetElForShadow.getAttribute('width') || '100%';
            let chStr = targetElForShadow.getAttribute('height') || '100%';

            let cx = cxStr.includes('%') ? bb.x : parseFloat(cxStr) || 0;
            let cy = cyStr.includes('%') ? bb.y : parseFloat(cyStr) || 0;
            let cw = cwStr.includes('%') ? bb.width : parseFloat(cwStr) || 100;
            let ch = chStr.includes('%') ? bb.height : parseFloat(chStr) || 100;

            const cropStrShadow = targetElForShadow.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
            if (effImgType === 'Crop' && cropStrShadow && cropStrShadow !== 'null') {
              try {
                const crop = JSON.parse(cropStrShadow);
                cx = cx + (parseFloat(crop.left) / 100) * cw;
                cy = cy + (parseFloat(crop.top) / 100) * ch;
                cw = cw * (parseFloat(crop.width) / 100);
                ch = ch * (parseFloat(crop.height) / 100);
              } catch (e) {}
            }

            shadowCaster.setAttribute('transform', targetElForShadow.getAttribute('transform') || '');
            shadowCaster.setAttribute('fill', 'black');
            shadowCaster.setAttribute('fill-opacity', (opacity / 100).toString());
            shadowCaster.style.removeProperty('clip-path');

            if (effImgType === 'Crop') {
              shadowCaster.setAttribute('d', getPathD(cx, cy, Math.max(0, cw), Math.max(0, ch), 0, 0, 0, 0));
            } else {
              const maxR = Math.min(cw, ch) / 2;
              const c_tl = Math.max(0, Math.min((radius.tl || 0), maxR));
              const c_tr = Math.max(0, Math.min((radius.tr || 0), maxR));
              const c_br = Math.max(0, Math.min((radius.br || 0), maxR));
              const c_bl = Math.max(0, Math.min((radius.bl || 0), maxR));
              shadowCaster.setAttribute('d', getPathD(cx, cy, Math.max(0, cw), Math.max(0, ch), c_tl, c_tr, c_br, c_bl));
            }

            shadowCaster.style.setProperty('filter', shadowOnlyFilter, 'important');
            shadowCaster.style.setProperty('display', 'block', 'important');
          }
        } else if (shadowCaster) {
          shadowCaster.style.setProperty('display', 'none', 'important');
        }

        // 3. Apply geometry-level filters
        if (!isImageElement) {
          liveElement.style.setProperty('filter', totalFilter, 'important');
        } else {
          if (hasClip) {
            liveElement.style.setProperty('filter', adjustOnlyFilter, 'important');
          } else {
            liveElement.style.setProperty('filter', totalFilter, 'important');
          }
          if (liveElement.parentElement?.classList.contains('svg-crop-wrapper')) {
            liveElement.parentElement.style.removeProperty('filter');
          }
        }
        if (liveElement.parentElement) {
          if (!liveElement.parentElement.classList.contains('svg-crop-wrapper')) {
            liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
          }
        }
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
      const isImageGroup = isSvgEl && liveElement.getAttribute('data-is-image-group') === 'true';

      if (isImageGroup && svgImageEl) {
        liveElement.style.removeProperty('opacity');
        liveElement.removeAttribute('opacity');
        liveElement.setAttribute('data-effect-opacity', opacity.toString());
        svgImageEl.style.setProperty('opacity', opacityVal, 'important');
        svgImageEl.setAttribute('opacity', opacityVal);
      } else {
        liveElement.style.setProperty('opacity', opacityVal, 'important');
        if (isSvgEl) {
          liveElement.setAttribute('opacity', opacityVal);
          liveElement.setAttribute('data-effect-opacity', opacity.toString());
          if (svgImageEl && svgImageEl !== liveElement) svgImageEl.setAttribute('opacity', opacityVal);
        }
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

        if (effectiveImageType === 'Crop' && (cropData.inset || liveElement.getAttribute('data-effect-crop-inset'))) {
          const cropStr = liveElement.getAttribute('data-crop-data') || '{"left":0,"top":0,"width":100,"height":100}';
          const crop = JSON.parse(cropStr);

          // Find the actual SVG <image> tag
          let svgImageEl = liveElement.tagName?.toLowerCase() === 'image' ? liveElement : liveElement.querySelector('image');
          let patternEl = null;

          if (!svgImageEl && liveElement.hasAttribute('fill')) {
            const fillUrl = liveElement.getAttribute('fill');
            const match = fillUrl?.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
            if (match) {
              const patternId = match[1].trim();
              const rootSvg = liveElement.closest('svg') || document;
              // Try querySelector first, fallback to getElementById for tricky characters
              try {
                patternEl = rootSvg.querySelector(`pattern[id="${patternId}"]`);
              } catch (e) {
                patternEl = null;
              }
              if (!patternEl) {
                patternEl = document.getElementById(patternId);
              }
              if (patternEl) {
                svgImageEl = patternEl.querySelector('image');
              }
            }
          }

          if (patternEl && svgImageEl) {
            // --- PATTERN CROP ---
            svgImageEl.setAttribute('width', '100%');
            svgImageEl.setAttribute('height', '100%');
            svgImageEl.setAttribute('preserveAspectRatio', 'none');

            patternEl.removeAttribute('viewBox');
            patternEl.setAttribute('width', '100%');
            patternEl.setAttribute('height', '100%');

            const insetTop = crop.top;
            const insetRight = 100 - (parseFloat(crop.left) + parseFloat(crop.width));
            const insetBottom = 100 - (parseFloat(crop.top) + parseFloat(crop.height));
            const insetLeft = crop.left;
            const svgClipVal = `inset(${insetTop}% ${insetRight}% ${insetBottom}% ${insetLeft}%${radiusStr})`;
            liveElement.style.setProperty('clip-path', svgClipVal, 'important');

          } else if (svgImageEl && svgImageEl !== liveElement) {
            // --- SVG PATH (Container with inner image) ---
            let targetEl = liveElement;
            let imgEl = svgImageEl;

            // We physically shrink the wrapper and offset the image to fix bounding box issues
            // Clean up old wrapper entirely
            let wrapper = null;
            if (liveElement.tagName?.toLowerCase() === 'svg' && liveElement.classList.contains('svg-crop-wrapper')) {
              wrapper = liveElement;
            } else if (liveElement.parentNode?.tagName?.toLowerCase() === 'svg' && liveElement.parentNode.classList.contains('svg-crop-wrapper')) {
              wrapper = liveElement.parentNode;
            } else {
              wrapper = liveElement.querySelector('.svg-crop-wrapper');
            }
            if (wrapper) {
              const innerImg = wrapper.querySelector('image');
              if (innerImg) {
                wrapper.parentNode.insertBefore(innerImg, wrapper);
                imgEl = innerImg;
                targetEl = liveElement;
              }
              wrapper.remove();
            }

            const origW = liveElement.getAttribute('data-crop-orig-w') || imgEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '100';
            const origH = liveElement.getAttribute('data-crop-orig-h') || imgEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '100';
            const origX = liveElement.getAttribute('data-crop-orig-x') || imgEl.getAttribute('data-crop-orig-x') || imgEl.getAttribute('x') || '0';
            const origY = liveElement.getAttribute('data-crop-orig-y') || imgEl.getAttribute('data-crop-orig-y') || imgEl.getAttribute('y') || '0';

            const panOffX = (parseFloat(origW) * (crop.offX || 0)) / 100;
            const panOffY = (parseFloat(origH) * (crop.offY || 0)) / 100;

            imgEl.style.removeProperty('display');
            // Set width to origW instead of '100%' so Fabric.js bounding box is physically full-size
            imgEl.setAttribute('width', origW);
            imgEl.setAttribute('height', origH);
            imgEl.setAttribute('x', (parseFloat(origX) + panOffX).toString());
            imgEl.setAttribute('y', (parseFloat(origY) + panOffY).toString());

            const insetTop = crop.top - (crop.offY || 0);
            const insetRight = 100 - (parseFloat(crop.left) + parseFloat(crop.width)) + (crop.offX || 0);
            const insetBottom = 100 - (parseFloat(crop.top) + parseFloat(crop.height)) + (crop.offY || 0);
            const insetLeft = crop.left - (crop.offX || 0);
            const svgClipVal = `inset(${insetTop}% ${insetRight}% ${insetBottom}% ${insetLeft}%${radiusStr})`;
            imgEl.style.setProperty('clip-path', svgClipVal, 'important');

            // Clear legacy transforms
            imgEl.style.removeProperty('transform');
            imgEl.style.removeProperty('translate');
            imgEl.style.removeProperty('scale');

            // Clip the container group for border radius
            const containerClipVal = `inset(0% 0% 0% 0%${radiusStr})`;
            liveElement.style.setProperty('clip-path', containerClipVal, 'important');
            if (liveElement instanceof SVGElement) {
              liveElement.style.setProperty('transform-box', 'fill-box', 'important');
            }
            if (anyR) {
              liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
            } else {
              liveElement.style.removeProperty('border-radius');
            }
          } else if (liveElement.hasAttribute('fill') && liveElement.getAttribute('fill')?.toString().includes('url(#')) {
            // --- Pattern Fill Crop Logic ---
            let imgEl = getSvgImageEl(liveElement);
            if (imgEl) {
              if (!liveElement.id) liveElement.id = `el-${Math.random().toString(36).substr(2, 9)}`;

              if (!liveElement.hasAttribute('data-crop-orig-w')) {
                liveElement.setAttribute('data-crop-orig-w', liveElement.getAttribute('width') || liveElement.getBoundingClientRect().width || '100');
                liveElement.setAttribute('data-crop-orig-h', liveElement.getAttribute('height') || liveElement.getBoundingClientRect().height || '100');
                liveElement.setAttribute('data-crop-orig-x', liveElement.getAttribute('x') || '0');
                liveElement.setAttribute('data-crop-orig-y', liveElement.getAttribute('y') || '0');
              }

              const origW = parseFloat(liveElement.getAttribute('data-crop-orig-w'));
              const origH = parseFloat(liveElement.getAttribute('data-crop-orig-h'));
              const origX = parseFloat(liveElement.getAttribute('data-crop-orig-x'));
              const origY = parseFloat(liveElement.getAttribute('data-crop-orig-y'));

              if (!liveElement.hasAttribute('data-original-fill')) {
                liveElement.setAttribute('data-original-fill', liveElement.getAttribute('fill'));
              }

              const rootSvg = liveElement.closest('svg');
              let cropPat = rootSvg?.querySelector(`.internal-crop-pattern[data-for="${liveElement.id}"]`);
              if (!cropPat) {
                cropPat = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
                cropPat.classList.add('internal-crop-pattern');
                cropPat.id = `crop-pat-${Math.random().toString(36).substr(2, 9)}`;
                cropPat.setAttribute('patternUnits', 'userSpaceOnUse');
                cropPat.setAttribute('data-for', liveElement.id);

                let defs = rootSvg?.querySelector('defs');
                if (rootSvg && !defs) {
                  defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                  rootSvg.insertBefore(defs, rootSvg.firstChild);
                }
                if (defs) {
                  defs.appendChild(cropPat);
                } else {
                  liveElement.parentNode.insertBefore(cropPat, liveElement);
                }

                const patImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                patImg.classList.add('internal-crop-image');
                cropPat.appendChild(patImg);
              }

              const panOffX = (parseFloat(origW) * (crop.offX || 0)) / 100;
              const panOffY = (parseFloat(origH) * (crop.offY || 0)) / 100;

              const insetTop = crop.top;
              const insetRight = 100 - (parseFloat(crop.left) + parseFloat(crop.width));
              const insetBottom = 100 - (parseFloat(crop.top) + parseFloat(crop.height));
              const insetLeft = crop.left;
              const svgClipVal = `inset(${insetTop}% ${insetRight}% ${insetBottom}% ${insetLeft}%${radiusStr})`;
              liveElement.style.setProperty('clip-path', svgClipVal, 'important');

              liveElement.setAttribute('width', origW.toString());
              liveElement.setAttribute('height', origH.toString());
              liveElement.setAttribute('x', origX.toString());
              liveElement.setAttribute('y', origY.toString());

              cropPat.setAttribute('width', origW.toString());
              cropPat.setAttribute('height', origH.toString());
              cropPat.setAttribute('x', origX.toString());
              cropPat.setAttribute('y', origY.toString());
              cropPat.removeAttribute('viewBox');

              const patImg = cropPat.querySelector('.internal-crop-image');
              if (patImg) {
                const updatedHref = imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href') || imgEl.src || '';
                patImg.setAttribute('href', updatedHref);
                try { patImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', updatedHref); } catch (e) { }
                patImg.setAttribute('width', origW.toString());
                patImg.setAttribute('height', origH.toString());
                patImg.setAttribute('x', panOffX.toString());
                patImg.setAttribute('y', panOffY.toString());

                // Synchronize original pattern image to prevent reverting on un-crop
                const origFill = liveElement.getAttribute('data-original-fill');
                if (origFill) {
                  const origMatch = origFill.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
                  if (origMatch) {
                    const origPat = liveElement.closest('svg')?.querySelector(`pattern[id="${origMatch[1].trim()}"]`) || document.getElementById(origMatch[1].trim());
                    if (origPat) {
                      const origImg = origPat.querySelector('image');
                      if (origImg) {
                        origImg.setAttribute('href', updatedHref);
                        try { origImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', updatedHref); } catch (e) { }
                      }
                    }
                  }
                }
              }

              liveElement.setAttribute('fill', `url(#${cropPat.id})`);
              const anyR = radius.tl || radius.tr || radius.br || radius.bl;
              if (anyR && (liveElement.tagName?.toLowerCase() === 'rect' || liveElement.tagName?.toLowerCase() === 'image')) {
                liveElement.setAttribute('rx', Math.max(radius.tl, radius.tr, radius.br, radius.bl).toString());
              } else if (liveElement.tagName?.toLowerCase() === 'rect' || liveElement.tagName?.toLowerCase() === 'image') {
                liveElement.removeAttribute('rx');
              }
            }
          } else {
            // --- Unified Element (HTML or direct SVG <image>) ---
            const innerScaleX = 100 / Math.max(0.1, crop.width);
            const innerScaleY = 100 / Math.max(0.1, crop.height);

            if (!(liveElement instanceof SVGElement) && liveElement.tagName?.toLowerCase() === 'img') {
              // --- HTML <img> Element ---
              const bgPosX = (innerScaleX === 1) ? 0 : (crop.left * innerScaleX) / (innerScaleX - 1);
              const bgPosY = (innerScaleY === 1) ? 0 : (crop.top * innerScaleY) / (innerScaleY - 1);

              const origSrc = liveElement.getAttribute('data-original-src') || liveElement.src;
              if (origSrc && !origSrc.startsWith('data:image/gif')) {
                if (!liveElement.hasAttribute('data-original-src')) {
                  liveElement.setAttribute('data-original-src', origSrc);
                }
                liveElement.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // 1x1 transparent
                liveElement.style.setProperty('background-image', `url("${origSrc}")`, 'important');
                liveElement.style.setProperty('background-size', `${innerScaleX * 100}% ${innerScaleY * 100}%`, 'important');
                liveElement.style.setProperty('background-position', `${bgPosX}% ${bgPosY}%`, 'important');
                liveElement.style.setProperty('background-repeat', 'no-repeat', 'important');
              }

              liveElement.style.removeProperty('transform');
              liveElement.style.removeProperty('transform-origin');
              liveElement.style.removeProperty('clip-path');
            } else {
              // --- SVG <image> Element (Native CSS Clip-Path) ---
              const svgClipVal = `inset(${crop.top}% ${100 - crop.left - crop.width}% ${100 - crop.top - crop.height}% ${crop.left}%${radiusStr})`;
              liveElement.style.setProperty('clip-path', svgClipVal, 'important');
              liveElement.style.setProperty('-webkit-clip-path', svgClipVal, 'important');
            }

            // Shared Fallback Cleanup
            liveElement.style.removeProperty('object-view-box');
            liveElement.style.removeProperty('translate');
            liveElement.style.removeProperty('scale');
            if (anyR) {
              liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
            }
          }

          // Persistence attributes
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

          // Clear pattern viewBox
          if (liveElement.hasAttribute('fill')) {
            const fillUrl = liveElement.getAttribute('fill');
            const match = fillUrl?.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
            if (match) {
              const patternId = match[1].trim();
              const rootSvg = liveElement.closest('svg') || document;
              let pEl = null;
              try {
                pEl = rootSvg.querySelector(`pattern[id="${patternId}"]`);
              } catch (e) { }
              if (!pEl) pEl = document.getElementById(patternId);

              if (pEl) {
                if (pEl.classList.contains('internal-crop-pattern')) {
                  const origFill = liveElement.getAttribute('data-original-fill');
                  if (origFill) {
                    liveElement.setAttribute('fill', origFill);
                    pEl.remove();

                    const origMatch = origFill.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
                    if (origMatch) {
                      const origPat = rootSvg.querySelector(`pattern[id="${origMatch[1].trim()}"]`) || document.getElementById(origMatch[1].trim());
                      if (origPat) {
                        const pImg = origPat.querySelector('image');
                        if (pImg) {
                          const parMap = { 'Fit': 'xMidYMid meet', 'Fill': 'xMidYMid slice', 'Crop': 'xMidYMid slice', 'Stretch': 'none' };
                          pImg.setAttribute('preserveAspectRatio', parMap[effectiveImageType] || 'xMidYMid meet');
                        }
                      }
                    }
                  }
                } else {
                  pEl.removeAttribute('viewBox');
                  pEl.removeAttribute('preserveAspectRatio'); // Useless without viewBox

                  const pImg = pEl.querySelector('image');
                  if (pImg) {
                    const parMap = { 'Fit': 'xMidYMid meet', 'Fill': 'xMidYMid slice', 'Crop': 'xMidYMid slice', 'Stretch': 'none' };
                    pImg.setAttribute('preserveAspectRatio', parMap[effectiveImageType] || 'xMidYMid meet');
                  }
                }
              }
            }
          }

          let wrapper = null;
          if (liveElement.tagName?.toLowerCase() === 'svg' && liveElement.classList.contains('svg-crop-wrapper')) {
            wrapper = liveElement;
          } else if (liveElement.parentNode?.tagName?.toLowerCase() === 'svg' && liveElement.parentNode.classList.contains('svg-crop-wrapper')) {
            wrapper = liveElement.parentNode;
          } else {
            wrapper = liveElement.querySelector('.svg-crop-wrapper');
          }

          if (wrapper) {
            const innerImg = wrapper.querySelector('image');
            if (innerImg) {
              const origW = wrapper.getAttribute('data-crop-orig-w') || innerImg.getAttribute('data-crop-orig-w') || liveElement.getAttribute('data-crop-orig-w') || '100';
              const origH = wrapper.getAttribute('data-crop-orig-h') || innerImg.getAttribute('data-crop-orig-h') || liveElement.getAttribute('data-crop-orig-h') || '100';
              const origX = wrapper.getAttribute('data-crop-orig-x') || innerImg.getAttribute('data-crop-orig-x') || liveElement.getAttribute('data-crop-orig-x') || '0';
              const origY = wrapper.getAttribute('data-crop-orig-y') || innerImg.getAttribute('data-crop-orig-y') || liveElement.getAttribute('data-crop-orig-y') || '0';

              wrapper.parentNode.insertBefore(innerImg, wrapper);
              innerImg.style.removeProperty('display');
              innerImg.setAttribute('width', origW);
              innerImg.setAttribute('height', origH);
              innerImg.setAttribute('x', origX);
              innerImg.setAttribute('y', origY);
              innerImg.style.removeProperty('clip-path');
              innerImg.removeAttribute('clip-path');
              const parMap = { 'Fit': 'xMidYMid meet', 'Fill': 'xMidYMid slice', 'Crop': 'xMidYMid slice', 'Stretch': 'none' };
              innerImg.setAttribute('preserveAspectRatio', parMap[effectiveImageType] || 'xMidYMid meet');
              
              if (svgImageEl === wrapper) {
                svgImageEl = innerImg;
              }
            }
            wrapper.remove();
          } else if (svgImageEl) {
             svgImageEl.style.removeProperty('clip-path');
             svgImageEl.removeAttribute('clip-path');
          }

          liveElement.style.removeProperty('background-image');
          liveElement.style.removeProperty('background-size');
          liveElement.style.removeProperty('background-position');
          liveElement.style.removeProperty('background-repeat');
          if (liveElement.hasAttribute('data-original-src') && liveElement.tagName?.toLowerCase() === 'img') {
            liveElement.src = liveElement.getAttribute('data-original-src');
          }

          if (svgImageEl) {
            svgImageEl.style.removeProperty('transform');
            svgImageEl.style.removeProperty('transform-origin');
            svgImageEl.style.removeProperty('transform-box');
          }

          const isCropped = imageType === 'Crop' && (liveElement.getAttribute('data-crop-data') || (selectedElement && selectedElement.getAttribute('data-crop-data')));

          if (isCropped) {
            if (anyR) {
              liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
              liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
              liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
              liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
            } else {
              liveElement.removeAttribute('data-effect-radius-tl');
              liveElement.removeAttribute('data-effect-radius-tr');
              liveElement.removeAttribute('data-effect-radius-br');
              liveElement.removeAttribute('data-effect-radius-bl');
            }
          } else if (anyR) {
            // Radius logic for uncropped images
            const clipVal = `inset(0% 0% 0% 0% round ${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px)`;

            if (liveElement.tagName?.toLowerCase() === 'rect') {
              liveElement.setAttribute('rx', maxR.toString());
              liveElement.style.removeProperty('clip-path');
              liveElement.style.removeProperty('border-radius');
            } else if (svgImageEl && svgImageEl !== liveElement) {
              svgImageEl.style.setProperty('clip-path', clipVal, 'important');
              svgImageEl.style.setProperty('transform-box', 'fill-box', 'important');
              svgImageEl.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
              liveElement.style.removeProperty('clip-path');
              liveElement.style.removeProperty('border-radius');
            } else {
              liveElement.style.setProperty('clip-path', clipVal, 'important');
              if (liveElement instanceof SVGElement) {
                liveElement.style.setProperty('transform-box', 'fill-box', 'important');
              }
              liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
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
        // --- HTML: Background Blur Removed ---
        // (Cleaned up from removal)
        liveElement.style.setProperty('backdrop-filter', 'none', 'important');
        liveElement.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        liveElement.style.setProperty('mask-image', 'none', 'important');
        liveElement.style.setProperty('-webkit-mask-image', 'none', 'important');

        // (We removed the duplicate crop block that was conflicting with the actual crop logic above)
        const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
        if (effectiveImageType !== 'Crop') {
          liveElement.style.setProperty('object-fit', fitMap[effectiveImageType] || 'fill', 'important');
        }

        if (anyR) {
          const radiusStr = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;
          const clipVal = `inset(0% 0% 0% 0% round ${radiusStr})`;
          if (!isSvgEl) {
            liveElement.style.removeProperty('clip-path');
            liveElement.style.setProperty('border-radius', radiusStr, 'important');
            liveElement.style.setProperty('overflow', 'hidden', 'important');
          } else {
            if (svgImageEl && svgImageEl !== liveElement) {
              svgImageEl.style.setProperty('clip-path', clipVal, 'important');
              svgImageEl.style.setProperty('-webkit-clip-path', clipVal, 'important');
              liveElement.style.removeProperty('clip-path');
              liveElement.style.removeProperty('-webkit-clip-path');
            } else {
              liveElement.style.setProperty('clip-path', clipVal, 'important');
              liveElement.style.setProperty('-webkit-clip-path', clipVal, 'important');
            }
            liveElement.style.setProperty('transform-box', 'fill-box', 'important');
            if (liveElement.tagName && liveElement.tagName.toLowerCase() === 'rect') {
              const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
              liveElement.setAttribute('rx', maxR.toString());
            }
          }
        } else {
          if (!isSvgEl) {
            liveElement.style.removeProperty('clip-path');
            liveElement.style.removeProperty('border-radius');
            liveElement.style.removeProperty('overflow');
          } else {
            liveElement.style.removeProperty('clip-path');
            liveElement.style.removeProperty('-webkit-clip-path');
            if (svgImageEl && svgImageEl !== liveElement) {
              svgImageEl.style.removeProperty('clip-path');
              svgImageEl.style.removeProperty('-webkit-clip-path');
            }
            if (liveElement.tagName && liveElement.tagName.toLowerCase() === 'rect') {
              liveElement.removeAttribute('rx');
              liveElement.removeAttribute('ry');
            }
          }
        }
        liveElement.style.removeProperty('transform');
        liveElement.style.removeProperty('translate');
        liveElement.style.removeProperty('scale');
      }

      // --- Source Management (restore original / apply cropped) ---
      const srcEl = isSvgEl ? svgImageEl : liveElement;
      const originalSrc = liveElement.getAttribute('data-original-src');
      const croppedSrc = liveElement.getAttribute('data-cropped-src');

      if (imageType === 'Crop' && croppedSrc) {
        const currentSrc = getSrc(srcEl);
        if (currentSrc !== croppedSrc && !currentSrc?.startsWith('data:image/gif')) {
          setSrc(srcEl, croppedSrc);
          setPreviewSrc(croppedSrc);
        }
      } else if (originalSrc) {
        // Do NOT overwrite the transparent pixel trick used for cropping HTML images
        const currentSrc = getSrc(srcEl);
        if (currentSrc !== originalSrc && !currentSrc?.startsWith('data:image/gif')) {
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
        shadowString = `inset ${ds.x || 0}px ${ds.y || 0}px ${ds.blur || 0}px ${ds.spread || 0}px ${rgbaStr}`;
      }

      if (isSvgEl) {
        const isContainer = ['g', 'svg'].includes(liveElement.tagName?.toLowerCase());
        const targetContainer = isContainer ? liveElement : (liveElement.parentElement || liveElement);
        const ownerId = liveElement.id || selectedLayerId;

        if (!isContainer) {
          const buggyOverlay = liveElement.querySelector('.svg-inner-shadow-rect');
          if (buggyOverlay) buggyOverlay.remove();
        }

        // Use data-owner to find the overlay belonging to THIS specific element
        let overlay = targetContainer.querySelector(`.svg-inner-shadow-rect[data-owner="${ownerId}"]`);
        if (!overlay) {
          // Fallback: find any unowned overlay in container (for backwards compat)
          overlay = isContainer ? targetContainer.querySelector('.svg-inner-shadow-rect') : null;
        }
        let oldOverlay = targetContainer.querySelector('.svg-inner-shadow-overlay');
        if (oldOverlay) oldOverlay.remove(); // Clean up old foreignObject approach

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

          if (!overlay || overlay.tagName.toLowerCase() !== 'path') {
            if (overlay) overlay.remove();
            overlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            overlay.classList.add('svg-inner-shadow-rect');
            overlay.setAttribute('data-owner', ownerId);
            overlay.style.pointerEvents = 'none';
            overlay.setAttribute('fill', 'white'); // Must have solid fill to generate SourceAlpha
            if (!isContainer && liveElement.parentElement) {
              liveElement.parentElement.insertBefore(overlay, liveElement.nextSibling);
            } else {
              targetContainer.appendChild(overlay);
            }
          }

          let targetEl = isContainer ? (svgImageEl || liveElement) : liveElement;
          if (svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
            targetEl = svgImageEl.parentNode;
          }
          let box = { x: 0, y: 0, width: 100, height: 100 };
          try { box = targetEl.getBBox(); } catch (e) { }

          let ixStr = targetEl.getAttribute('x') || '0';
          let iyStr = targetEl.getAttribute('y') || '0';
          let iwStr = targetEl.getAttribute('width') || '100%';
          let ihStr = targetEl.getAttribute('height') || '100%';

          let ix = ixStr.includes('%') ? box.x : parseFloat(ixStr) || 0;
          let iy = iyStr.includes('%') ? box.y : parseFloat(iyStr) || 0;
          let iw = iwStr.includes('%') ? box.width : parseFloat(iwStr) || 100;
          let ih = ihStr.includes('%') ? box.height : parseFloat(ihStr) || 100;

          // Apply crop mathematically to inner shadow dimensions
          const cropStr = targetEl.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
          if (cropStr && cropStr !== 'null') {
            try {
              const crop = JSON.parse(cropStr);
              ix = ix + (parseFloat(crop.left) / 100) * iw;
              iy = iy + (parseFloat(crop.top) / 100) * ih;
              iw = iw * (parseFloat(crop.width) / 100);
              ih = ih * (parseFloat(crop.height) / 100);
            } catch (e) {}
          }

          overlay.setAttribute('transform', targetEl.getAttribute('transform') || '');

          const maxIR = Math.min(iw, ih) / 2;
          const i_tl = Math.max(0, Math.min(radius.tl || 0, maxIR));
          const i_tr = Math.max(0, Math.min(radius.tr || 0, maxIR));
          const i_br = Math.max(0, Math.min(radius.br || 0, maxIR));
          const i_bl = Math.max(0, Math.min(radius.bl || 0, maxIR));

          overlay.setAttribute('d', getPathD(ix, iy, Math.max(0, iw), Math.max(0, ih), i_tl, i_tr, i_br, i_bl));
          overlay.setAttribute('filter', `url(#${filterId})`);
        } else {
          if (overlay) overlay.remove();
          if (filterId && liveElement.ownerSVGElement) {
            const f = liveElement.ownerSVGElement.querySelector(`#${filterId}`);
            if (f) f.remove();
          }
        }
      } else {
        let overlay = liveElement.querySelector('.inner-shadow-overlay') || liveElement.parentElement?.querySelector('.inner-shadow-overlay');
        if (shadowString) {
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
            overlay.style.zIndex = '99999';
            overlay.style.boxSizing = 'border-box';
            if (window.getComputedStyle(targetParent).position === 'static') {
              targetParent.style.position = 'relative';
            }
            targetParent.appendChild(overlay);
          }
          if (overlay) {
            overlay.style.boxShadow = shadowString;
            const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
            overlay.style.borderRadius = anyR ? `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '0px';
          }
        } else if (overlay) {
          overlay.remove();
        }
      }
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
      if (activeEffects.includes('Drop Shadow') || activeEffects.includes('Blur')) {
        if (liveElement.parentElement) liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
      }
      // --- Background Color ---
      let fillLayerParent = liveElement;
      let isPatternShape = false;
      let patternEl = null;

      if (tagLower !== 'g' && liveElement.hasAttribute('fill') && liveElement.getAttribute('fill')?.toString().includes('url(#')) {
        isPatternShape = true;
        const fillUrl = liveElement.getAttribute('fill');
        const match = fillUrl.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
        if (match) {
          patternEl = liveElement.closest('svg')?.querySelector(`pattern[id="${match[1].trim()}"]`) || document.getElementById(match[1].trim());
          if (patternEl) fillLayerParent = patternEl;
        }
      }

      if (liveElement.getAttribute('data-is-image-group') === 'true' || isPatternShape) {
        let fillLayer = fillLayerParent.querySelector('.image-fill-layer');
        if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') {
          if (!fillLayer) {
            fillLayer = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            fillLayer.classList.add('image-fill-layer');
            fillLayer.setAttribute('data-name', 'Fill Color');
            fillLayer.style.pointerEvents = 'none';
          }
          if (fillLayerParent.firstChild !== fillLayer) {
            fillLayerParent.insertBefore(fillLayer, fillLayerParent.firstChild);
          }
          let targetElForFill = svgImageEl || liveElement;
          if (svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
            targetElForFill = svgImageEl.parentNode;
          }

          let bBox = { x: 0, y: 0, width: 100, height: 100 };
          try { bBox = targetElForFill.getBBox(); } catch (e) { }

          let bxStr = targetElForFill.getAttribute('x') || '0';
          let byStr = targetElForFill.getAttribute('y') || '0';
          let bwStr = targetElForFill.getAttribute('width') || '100%';
          let bhStr = targetElForFill.getAttribute('height') || '100%';

          let bx = bxStr.includes('%') ? bBox.x : parseFloat(bxStr) || 0;
          let by = byStr.includes('%') ? bBox.y : parseFloat(byStr) || 0;
          let bw = bwStr.includes('%') ? bBox.width : parseFloat(bwStr) || 100;
          let bh = bhStr.includes('%') ? bBox.height : parseFloat(bhStr) || 100;

          const cropStrFill = targetElForFill.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
          if (cropStrFill && cropStrFill !== 'null') {
            try {
              const crop = JSON.parse(cropStrFill);
              bx = bx + (parseFloat(crop.left) / 100) * bw;
              by = by + (parseFloat(crop.top) / 100) * bh;
              bw = bw * (parseFloat(crop.width) / 100);
              bh = bh * (parseFloat(crop.height) / 100);
            } catch (e) {}
          }

          if (isPatternShape && patternEl) {
            fillLayer.setAttribute('x', '0');
            fillLayer.setAttribute('y', '0');
            fillLayer.setAttribute('width', patternEl.getAttribute('width') || '100%');
            fillLayer.setAttribute('height', patternEl.getAttribute('height') || '100%');
          } else {
            fillLayer.setAttribute('x', bx.toString());
            fillLayer.setAttribute('y', by.toString());
            fillLayer.setAttribute('width', bw.toString());
            fillLayer.setAttribute('height', bh.toString());
          }

          let parsedFill = null;
          if (backgroundColor.fill && backgroundColor.fill.toLowerCase().includes('gradient')) {
            parsedFill = parseGradient(backgroundColor.fill);
          }

          if (parsedFill && parsedFill.stops) {
            fillLayer.setAttribute('data-fill-type', 'gradient');
            fillLayer.setAttribute('data-fill-stops', JSON.stringify(parsedFill.stops));
            fillLayer.setAttribute('data-fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
            fillLayer.setAttribute('data-fill-angle', parsedFill.angle || 90);
            // syncGradient reads non-data-prefixed attributes
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
            fillLayer.removeAttribute('data-fill-type');
            fillLayer.removeAttribute('data-fill-stops');
            fillLayer.removeAttribute('fill-type');
            fillLayer.removeAttribute('fill-stops');
            fillLayer.removeAttribute('fill-gradient-type');
            fillLayer.removeAttribute('fill-angle');
            liveElement.removeAttribute('data-fill-type');
            liveElement.removeAttribute('data-fill-stops');
          }

          fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());

          if (!isPatternShape) {
            const maxR = Math.min(bw, bh) / 2;
            if (radius.tl || radius.tr || radius.br || radius.bl) {
              fillLayer.setAttribute('rx', Math.max(0, Math.min(Math.max(radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0), maxR)).toString());
            } else {
              fillLayer.removeAttribute('rx');
            }
            if (targetElForFill.getAttribute('transform')) fillLayer.setAttribute('transform', targetElForFill.getAttribute('transform'));
          }

          liveElement.setAttribute('data-fill-color', backgroundColor.fill);
          liveElement.setAttribute('data-fill-opacity', (backgroundColor.fillOpacity / 100).toString());
        } else {
          if (fillLayer) fillLayer.remove();
          liveElement.removeAttribute('data-fill-color');
          liveElement.removeAttribute('data-fill-opacity');
        }
      } else if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none' && !backgroundColor.fill.startsWith('url(')) {
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

        if (tagLower === 'image' && liveElement.parentElement) {
          const strokeOverlay = liveElement.parentElement.querySelector('.svg-image-stroke-overlay');
          if (strokeOverlay) strokeOverlay.remove();
        }

        if (!isSvgEl) {
          liveElement.style.borderColor = 'transparent';
          liveElement.style.borderWidth = '0px';
        }
      } else {
        const isShapeNode = ['rect', 'circle', 'ellipse', 'polygon', 'polyline', 'path'].includes(liveElement.tagName?.toLowerCase());
        const isImageNode = !isShapeNode && svgImageEl && (svgImageEl.tagName?.toLowerCase() === 'image' || svgImageEl.tagName?.toLowerCase() === 'foreignobject');

        liveElement.setAttribute('data-stroke-color', backgroundColor.stroke);
        liveElement.setAttribute('data-stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
        liveElement.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
        liveElement.setAttribute('data-stroke-width', backgroundColor.strokeWeight.toString());

        if (backgroundColor.strokeDashStyle === 'Dashed') {
          liveElement.setAttribute('data-stroke-dasharray', `${backgroundColor.strokeDashLength || 5},${backgroundColor.strokeDashGap || 5}`);
        } else {
          liveElement.setAttribute('data-stroke-dasharray', 'none');
        }

        if (!isImageNode) {
          if (backgroundColor.strokeType === 'gradient' && backgroundColor.strokeStops) {
            liveElement.setAttribute('stroke-type', 'gradient');
            liveElement.setAttribute('stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
            liveElement.setAttribute('stroke-stops', backgroundColor.strokeStops || '');
            liveElement.setAttribute('stroke-angle', backgroundColor.strokeAngle || '0');
            liveElement.setAttribute('stroke-radius', backgroundColor.strokeRadius || '100');
            syncGradient(liveElement.ownerDocument || document, liveElement, 'stroke');
          } else {
            liveElement.removeAttribute('stroke-type');
            liveElement.removeAttribute('stroke-gradient-type');
            liveElement.removeAttribute('stroke-stops');
            liveElement.removeAttribute('stroke-angle');
            liveElement.removeAttribute('stroke-radius');
            liveElement.setAttribute('stroke', backgroundColor.stroke);
          }

          liveElement.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
          liveElement.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
          if (backgroundColor.strokeDashStyle === 'Dashed') {
            const dashArray = `${backgroundColor.strokeDashLength || 5},${backgroundColor.strokeDashGap || 5}`;
            liveElement.setAttribute('stroke-dasharray', dashArray);
          } else {
            liveElement.setAttribute('stroke-dasharray', 'none');
          }
        } else {
          liveElement.removeAttribute('stroke');
          liveElement.removeAttribute('stroke-width');
          liveElement.removeAttribute('stroke-dasharray');
        }
        liveElement.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
        liveElement.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

        // Dynamic Stroke Overlay for SVG images and foreignObjects (Slideshows)
        if (svgImageEl && (svgImageEl.tagName?.toLowerCase() === 'image' || svgImageEl.tagName?.toLowerCase() === 'foreignobject')) {
          const isImageElement = liveElement.tagName?.toLowerCase() === 'image';
          const targetContainer = isImageElement ? (liveElement.parentElement || liveElement) : liveElement;

          if (isImageElement) {
            const buggyOverlay = liveElement.querySelector('.svg-image-stroke-overlay');
            if (buggyOverlay) buggyOverlay.remove();
          }

          let strokeOverlay = targetContainer.querySelector('.svg-image-stroke-overlay');
          if (!strokeOverlay || strokeOverlay.tagName.toLowerCase() !== 'path') {
            if (strokeOverlay) strokeOverlay.remove();
            strokeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            strokeOverlay.classList.add('svg-image-stroke-overlay');
            strokeOverlay.style.pointerEvents = 'none';
            if (isImageElement && liveElement.parentElement) {
              liveElement.parentElement.insertBefore(strokeOverlay, liveElement.nextSibling);
            } else {
              targetContainer.appendChild(strokeOverlay);
            }

            const syncOverlay = () => {
              if (!strokeOverlay.isConnected) return;
              const targetEl = svgImageEl || liveElement;
              strokeOverlay.setAttribute('transform', targetEl.getAttribute('transform') || '');
              strokeOverlay.style.transform = targetEl.style.transform;
              strokeOverlay.style.translate = targetEl.style.translate;
              strokeOverlay.style.scale = targetEl.style.scale;
              strokeOverlay.style.rotate = targetEl.style.rotate;
              strokeOverlay.style.transformOrigin = targetEl.style.transformOrigin;
              strokeOverlay.style.opacity = targetEl.style.opacity;
            };
            const obs = new MutationObserver(syncOverlay);
            obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
            if (svgImageEl && svgImageEl !== liveElement) {
              obs.observe(svgImageEl, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
            }
          }

          let targetElForStroke = svgImageEl || liveElement;
          if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
            targetElForStroke = svgImageEl.parentNode;
          }

          let bBox = { x: 0, y: 0, width: 100, height: 100 };
          try { bBox = targetElForStroke.getBBox(); } catch (e) { }

          let bxStr = targetElForStroke.getAttribute('x') || '0';
          let byStr = targetElForStroke.getAttribute('y') || '0';
          let bwStr = targetElForStroke.getAttribute('width') || '100%';
          let bhStr = targetElForStroke.getAttribute('height') || '100%';

          let bx = bxStr.includes('%') ? bBox.x : parseFloat(bxStr) || 0;
          let by = byStr.includes('%') ? bBox.y : parseFloat(byStr) || 0;
          let bw = bwStr.includes('%') ? bBox.width : parseFloat(bwStr) || 100;
          let bh = bhStr.includes('%') ? bBox.height : parseFloat(bhStr) || 100;

          const cropStrStroke = targetElForStroke.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
          if (cropStrStroke && cropStrStroke !== 'null') {
            try {
              const crop = JSON.parse(cropStrStroke);
              bx = bx + (parseFloat(crop.left) / 100) * bw;
              by = by + (parseFloat(crop.top) / 100) * bh;
              bw = bw * (parseFloat(crop.width) / 100);
              bh = bh * (parseFloat(crop.height) / 100);
            } catch (e) {}
          }

          const pos = backgroundColor.strokePosition || 'Center';
          const sw = backgroundColor.strokeWeight || 0;

          let ox = bx, oy = by, ow = bw, oh = bh;
          if (pos === 'Inside') {
            ox += sw / 2; oy += sw / 2; ow -= sw; oh -= sw;
          } else if (pos === 'Outside') {
            ox -= sw / 2; oy -= sw / 2; ow += sw; oh += sw;
          }

          const tl = radius.tl || 0;
          const tr = radius.tr || 0;
          const br = radius.br || 0;
          const bl = radius.bl || 0;

          const maxR = Math.min(ow, oh) / 2;
          const c_tl = Math.max(0, Math.min(tl, maxR));
          const c_tr = Math.max(0, Math.min(tr, maxR));
          const c_br = Math.max(0, Math.min(br, maxR));
          const c_bl = Math.max(0, Math.min(bl, maxR));

          strokeOverlay.setAttribute('d', getPathD(ox, oy, Math.max(0, ow), Math.max(0, oh), c_tl, c_tr, c_br, c_bl));

          strokeOverlay.setAttribute('transform', targetElForStroke.getAttribute('transform') || '');
          strokeOverlay.style.transform = targetElForStroke.style.transform;
          strokeOverlay.style.translate = targetElForStroke.style.translate;
          strokeOverlay.style.scale = targetElForStroke.style.scale;
          strokeOverlay.style.rotate = targetElForStroke.style.rotate;
          strokeOverlay.style.transformOrigin = targetElForStroke.style.transformOrigin;

          strokeOverlay.setAttribute('fill', 'none');

          liveElement.setAttribute('data-stroke-color', backgroundColor.stroke);
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
          }

          strokeOverlay.setAttribute('stroke-width', sw.toString());
          strokeOverlay.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());

          if (backgroundColor.strokeDashStyle === 'Dashed') {
            const dashArray = `${backgroundColor.strokeDashLength || 5},${backgroundColor.strokeDashGap || 5}`;
            strokeOverlay.setAttribute('stroke-dasharray', dashArray);
          } else {
            strokeOverlay.removeAttribute('stroke-dasharray');
          }

          strokeOverlay.setAttribute('data-stroke-position', pos);
          strokeOverlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
          strokeOverlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

          // Apply drop shadow to the stroke overlay so it casts its own shadow seamlessly
          strokeOverlay.style.setProperty('filter', shadowOnlyFilter, 'important');

          // Add clipPath to clip the image to prevent sharp corners from bleeding
          const defsOwner = isImageElement ? (liveElement.ownerSVGElement || liveElement.parentElement || liveElement) : liveElement;

          if (isImageElement) {
            const buggyDefs = liveElement.querySelector('defs');
            if (buggyDefs) buggyDefs.remove();
          }

          let defs = defsOwner.querySelector('defs');
          if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defsOwner.insertBefore(defs, defsOwner.firstChild);
          }
          const clipId = `clip-${liveElement.id || Date.now()}`;
          let clip = defs.querySelector(`clipPath[id="${clipId}"]`);
          if (!clip) {
            clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
            clip.id = clipId;
            const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            clipPathEl.classList.add('svg-image-clip-path');
            clip.appendChild(clipPathEl);
            defs.appendChild(clip);
          }

          const clipPathEl = clip.querySelector('path');
          if (clipPathEl) {
            const innerMaxR = Math.min(bw, bh) / 2;
            const inner_tl = Math.max(0, Math.min(tl, innerMaxR));
            const inner_tr = Math.max(0, Math.min(tr, innerMaxR));
            const inner_br = Math.max(0, Math.min(br, innerMaxR));
            const inner_bl = Math.max(0, Math.min(bl, innerMaxR));
            clipPathEl.setAttribute('d', getPathD(bx, by, Math.max(0, bw), Math.max(0, bh), inner_tl, inner_tr, inner_br, inner_bl));
          }

          const isStrokeCropped = imageType === 'Crop' && (liveElement.getAttribute('data-crop-data') || (selectedElement && selectedElement.getAttribute('data-crop-data')));

          if (targetElForStroke && !isStrokeCropped) {
            targetElForStroke.setAttribute('clip-path', `url(#${clip.id})`);
            targetElForStroke.style.setProperty('clip-path', `url(#${clip.id})`, 'important');
            targetElForStroke.style.removeProperty('-webkit-clip-path');
          }
        }

        if (!isSvgEl) {
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

          if (pos === 'Inside') {
            liveElement.style.borderWidth = `${weight}px`;
            liveElement.style.borderStyle = style;
            liveElement.style.borderColor = color;
            liveElement.style.outline = 'none';
          } else if (pos === 'Outside') {
            liveElement.style.borderWidth = `0px`;
            liveElement.style.outline = `${weight}px ${style} ${color}`;
            liveElement.style.outlineOffset = `0px`;
          } else {
            liveElement.style.borderWidth = `0px`;
            liveElement.style.outline = `${weight}px ${style} ${color}`;
            liveElement.style.outlineOffset = `-${weight / 2}px`;
          }
        }
      }

      // Enforce proper Z-indexing for SVG overlays to prevent the stroke from covering the inner shadow
      const isImgNode = liveElement.tagName?.toLowerCase() === 'image';
      if (isImgNode && liveElement.parentElement) {
        const strokeOl = liveElement.parentElement.querySelector('.svg-image-stroke-overlay');
        const innerShadowOl = liveElement.parentElement.querySelector('.svg-inner-shadow-rect');
        // Ensure inner shadow is drawn on top of the stroke overlay
        if (strokeOl && innerShadowOl) {
          // If inner shadow is physically before the stroke overlay, move it after
          if (innerShadowOl.compareDocumentPosition(strokeOl) & Node.DOCUMENT_POSITION_FOLLOWING) {
            liveElement.parentElement.insertBefore(innerShadowOl, strokeOl.nextSibling);
          }
        }
      }

      // --- STRICT LAYER REORDERING FOR IMAGE GROUPS ---
      if (liveElement.getAttribute('data-is-image-group') === 'true') {
        const dropShadow = liveElement.querySelector('.svg-drop-shadow-caster');
        const fillLayer = liveElement.querySelector('.image-fill-layer');
        const innerShadow = liveElement.querySelector('.svg-inner-shadow-rect') || liveElement.querySelector('.svg-inner-shadow-overlay');
        const stroke = liveElement.querySelector('.svg-image-stroke-overlay');

        if (dropShadow) { dropShadow.setAttribute('data-name', 'Drop Shadow'); liveElement.appendChild(dropShadow); }
        if (fillLayer) { fillLayer.setAttribute('data-name', 'Fill Color'); liveElement.appendChild(fillLayer); }

        // Find the main image content (it could be an <svg> crop wrapper or raw <image> or pattern rect)
        // If there's an image that isn't a child of crop wrapper, append it
        if (svgImageEl) {
          const imageNode = svgImageEl.closest('svg.svg-crop-wrapper') ||
            svgImageEl.closest('rect') ||
            svgImageEl;
          if (imageNode && imageNode.parentNode === liveElement) {
            liveElement.appendChild(imageNode);
          }
        }

        if (innerShadow) { innerShadow.setAttribute('data-name', 'Inner Shadow'); liveElement.appendChild(innerShadow); }
        if (stroke) { stroke.setAttribute('data-name', 'Stroke'); liveElement.appendChild(stroke); }
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
        .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; }
        .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; }
        .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        
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
        <div className="space-y-[0.60vw] px-[0.3vw]">

          {isSlideshow ? (
            /* ── SLIDESHOW MODE: show only SlideshowProperties ── */
            <SlideshowProperties
              selectedElement={actualSlideshowEl}
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
                if (actualSlideshowEl) {
                  const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                  const liveEl = pageContainer?.querySelector(`[id="${actualSlideshowEl.id}"]`) || actualSlideshowEl;

                  let firstImageSrc = null;
                  const rawSlideshow = liveEl.getAttribute('data-slideshow') || actualSlideshowEl.getAttribute('data-slideshow');
                  if (rawSlideshow) {
                    try {
                      const parsed = JSON.parse(rawSlideshow);
                      if (parsed.images && parsed.images.length > 0) {
                        firstImageSrc = parsed.images[0].url || parsed.images[0].src;
                      }
                    } catch (e) { }
                  }

                  // Remove from both to ensure sync
                  const targets = [actualSlideshowEl, liveEl];
                  targets.forEach(el => {
                    el.removeAttribute('data-is-slideshow');
                    el.removeAttribute('data-slideshow');
                    el.removeAttribute('data-active-index');
                    el.removeAttribute('data-slideshow-manual');
                    el.removeAttribute('data-last-slide-time');
                    if (el.dataset) {
                      delete el.dataset.slideshowInitialized;
                    }

                    if (firstImageSrc) {
                      const imgEl = el.tagName?.toLowerCase() === 'image' || el.tagName?.toLowerCase() === 'img' ? el : el.querySelector('image, img');
                      if (imgEl) {
                        imgEl.setAttribute('href', firstImageSrc);
                        if (imgEl.hasAttribute('data-src')) {
                          imgEl.setAttribute('data-src', firstImageSrc);
                        }
                      }
                    }

                    if (el.dataset) {
                      delete el.dataset.isSlideshow;
                    }
                  });

                  // Cleanup DOM artifacts and clones
                  const container = liveEl.parentElement || liveEl;
                  if (container) {
                    const dots = container.querySelectorAll('.ss-dots-container, .editor-ss-dots-wrap');
                    dots.forEach(d => d.remove());
                    const btns = container.querySelectorAll('.ss-nav-btn, .editor-ss-nav');
                    btns.forEach(b => b.remove());
                  }

                  // Aggressively remove any leftover clones that might have been mid-animation
                  const svgRoot = liveEl.closest('svg');
                  if (svgRoot) {
                    svgRoot.querySelectorAll('[data-is-slideshow="true"]').forEach(ghost => {
                      if (ghost !== actualSlideshowEl && ghost !== liveEl) ghost.remove();
                    });
                  }

                  if (pageContainer) {
                    pageContainer.querySelectorAll('.editor-ss-overlay').forEach(el => el.remove());
                  }

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
                <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
              </div>

              <div className="flex items-center justify-between py-[0.25vw]">
                <span className="text-[0.75vw] text-gray-800">Turn on Slideshow to add more images</span>
                <button
                  onClick={() => {
                    const next = !isSlideshow;
                    setIsSlideshow(next);
                    if (actualSlideshowEl) {
                      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                      const liveEl = pageContainer?.querySelector(`[id="${actualSlideshowEl.id}"]`) || actualSlideshowEl;

                      if (next) {
                        let dataStr = liveEl.getAttribute('data-slideshow') || actualSlideshowEl.getAttribute('data-slideshow');

                        if (!dataStr) {
                          const initialData = {
                            settings: {
                              imageFitType: 'Fill All',
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
                          dataStr = JSON.stringify(initialData);
                        }

                        // Apply to both to ensure sync
                        [actualSlideshowEl, liveEl].forEach(el => {
                          // Removed broken crop-baking logic. Slideshow handles patterns correctly.
                          el.setAttribute('data-is-slideshow', 'true');
                          el.setAttribute('data-slideshow', dataStr);
                          el.setAttribute('data-active-index', '0');
                        });
                      } else {
                        let firstImageSrc = null;
                        const rawSlideshow = liveEl.getAttribute('data-slideshow') || actualSlideshowEl.getAttribute('data-slideshow');
                        if (rawSlideshow) {
                          try {
                            const parsed = JSON.parse(rawSlideshow);
                            if (parsed.images && parsed.images.length > 0) {
                              firstImageSrc = parsed.images[0].url || parsed.images[0].src;
                            }
                          } catch (e) { }
                        }

                        // Remove from both
                        [actualSlideshowEl, liveEl].forEach(el => {
                          el.removeAttribute('data-is-slideshow');
                          el.removeAttribute('data-slideshow');
                          el.removeAttribute('data-active-index');
                          el.removeAttribute('data-slideshow-manual');
                          el.removeAttribute('data-last-slide-time');
                          if (el.dataset) {
                            delete el.dataset.slideshowInitialized;
                          }

                          if (firstImageSrc) {
                            const imgEl = el.tagName?.toLowerCase() === 'image' || el.tagName?.toLowerCase() === 'img' ? el : el.querySelector('image, img');
                            if (imgEl) {
                              imgEl.setAttribute('href', firstImageSrc);
                              if (imgEl.hasAttribute('data-src')) {
                                imgEl.setAttribute('data-src', firstImageSrc);
                              }
                            }
                          }

                          if (el.dataset) {
                            delete el.dataset.slideshow;
                            delete el.dataset.isSlideshow;
                          }
                        });

                        // Cleanup DOM artifacts and clones
                        const container = liveEl.parentElement || liveEl;
                        if (container) {
                          const dots = container.querySelectorAll('.ss-dots-container, .editor-ss-dots-wrap');
                          dots.forEach(d => d.remove());
                          const btns = container.querySelectorAll('.ss-nav-btn, .editor-ss-nav');
                          btns.forEach(b => b.remove());
                        }

                        // Aggressively remove any leftover clones
                        const svgRoot = liveEl.closest('svg');
                        if (svgRoot) {
                          svgRoot.querySelectorAll('[data-is-slideshow="true"]').forEach(ghost => {
                            if (ghost !== actualSlideshowEl && ghost !== liveEl) ghost.remove();
                          });
                        }

                        const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                        if (pageContainer) {
                          pageContainer.querySelectorAll('.editor-ss-overlay').forEach(el => el.remove());
                        }
                      }
                      if (onUpdate) onUpdate({ shouldRefresh: true });
                    }
                  }}
                  className={`relative block w-[2.2vw] h-[1.2vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${isSlideshow ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
                >
                  <div className={`absolute top-[0.1vw] w-[1vw] h-[1vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${isSlideshow ? 'left-[1.1vw]' : 'left-[0.1vw]'}`} />
                </button>
              </div>

              {/* Image fix type + single image + upload */}
              <div className="flex items-center justify-between relative z-20">
                <div className="flex items-center gap-[0.5vw] flex-1">
                  <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Image fix type</span>
                  <div className="h-[0px] flex-1 border-t border-dashed border-gray-300 mx-[0.25vw]" />
                </div>
                <div className="relative">
                  <div className="flex gap-[0.25vw] items-center">
                    <button
                      onClick={() => setShowImageTypeDropdown(!showImageTypeDropdown)}
                      className="flex items-center justify-between w-[6.5vw] px-[0.75vw] py-[0.55vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[0.85vw] font-normal text-gray-700">{imageType}</span>
                      <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showImageTypeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {imageType === 'Crop' && (
                      <button onClick={() => setShowCropModal(true)} className="p-[0.55vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-sm hover:bg-gray-50 transition-colors text-gray-600" title="Edit Crop">
                        <Icon icon="lucide:crop" className="w-[0.9vw] h-[0.9vw]" />
                      </button>
                    )}
                  </div>
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
                              setShowImageTypeDropdown(false);
                              if (type === 'Crop') {
                                setShowCropModal(true);
                              } else {
                                setImageType(type);
                                stateRef.current.imageType = type;

                                const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                                const liveEl = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || selectedElement;

                                if (selectedElement) {
                                  selectedElement.removeAttribute('data-effect-crop-inset');
                                  selectedElement.removeAttribute('data-crop-data');
                                }
                                if (liveEl && liveEl !== selectedElement) {
                                  liveEl.removeAttribute('data-effect-crop-inset');
                                  liveEl.removeAttribute('data-crop-data');
                                }
                              }
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
                    {selectedElement?.hasAttribute('data-effect-crop-inset') ? (
                      <svg
                        width="100%"
                        height="100%"
                        viewBox={(() => {
                          try {
                            const c = JSON.parse(selectedElement.getAttribute('data-crop-data') || '{}');
                            return `${c.left || 0} ${c.top || 0} ${c.width || 100} ${c.height || 100}`;
                          } catch (e) { return '0 0 100 100'; }
                        })()}
                        preserveAspectRatio="xMidYMid meet"
                        className="rounded-[0.3vw]"
                      >
                        <image href={previewSrc || ''} width="100" height="100" preserveAspectRatio="none" />
                      </svg>
                    ) : (
                      <img
                        src={previewSrc || ''}
                        alt="Thumbnail"
                        className="w-full h-full rounded-[0.3vw] object-contain"
                      />
                    )}
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
                      className="w-full cursor-pointer custom-range-slider"
                      style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }}
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
          <CornerRadius
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
            radius={radius}
            setRadius={setRadius}
            isRadiusLinked={isRadiusLinked}
            setIsRadiusLinked={setIsRadiusLinked}
            tagName={selectedElement?.tagName?.toLowerCase() || 'image'}
          />
          <Adjustment
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
            filters={filters}
            setFilters={setFilters}
            tagName={selectedElement?.tagName?.toLowerCase() || 'image'}
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
                const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

                if (!liveElement) return;

                const targetImg = getSvgImageEl(liveElement) || liveElement;
                if (targetImg.tagName?.toLowerCase() === 'image') {
                  targetImg.setAttribute('href', optimisticUrl);
                  targetImg.setAttribute('xlink:href', optimisticUrl);

                  const patImg = liveElement.querySelector('.internal-crop-image');
                  if (patImg) {
                    patImg.setAttribute('href', optimisticUrl);
                    patImg.setAttribute('xlink:href', optimisticUrl);
                  }

                  const origFill = liveElement.getAttribute('data-original-fill');
                  if (origFill) {
                    const match = origFill.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
                    if (match) {
                      const origPat = document.getElementById(match[1].trim()) || liveElement.closest('svg')?.querySelector(`pattern[id="${match[1].trim()}"]`);
                      if (origPat) {
                        const origImg = origPat.querySelector('image');
                        if (origImg) {
                          origImg.setAttribute('href', optimisticUrl);
                          origImg.setAttribute('xlink:href', optimisticUrl);
                        }
                      }
                    }
                  }
                } else {
                  targetImg.src = optimisticUrl;
                  targetImg.setAttribute('src', optimisticUrl);
                }

                setPreviewSrc(optimisticUrl);
                liveElement.removeAttribute('data-original-src');
                liveElement.removeAttribute('data-cropped-src');

                liveElement.removeAttribute('data-effect-crop-inset');
                liveElement.removeAttribute('data-crop-data');
                setImageType('Fit');
                stateRef.current.imageType = 'Fit';

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
          {activeColorPicker && createPortal(
            <div
              className="fixed z-[5000]"
              style={{
                top: '50%',
                right: '10vw',
                transform: 'translateY(-50%)'
              }}
            >
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <ColorPicker
                  color={activeColorPicker === 'fill' ? backgroundColor.fill : backgroundColor.stroke}
                  onChange={(color) => {
                    if (activeColorPicker === 'fill') {
                      setBackgroundColor(p => ({ ...p, fill: color }));
                    } else {
                      setBackgroundColor(p => ({ ...p, stroke: color, strokeWeight: (p.strokeWeight === 0 && color !== 'transparent' && color !== 'none') ? 2 : p.strokeWeight }));
                    }
                  }}
                  onClose={() => setActiveColorPicker(null)}
                />
              </div>
            </div>,
            document.body
          )}
        </div>
      )}
      {showCropModal && (
        <CropOverlay
          src={selectedElement?.getAttribute('data-original-src') || previewSrc}
          initialCrop={selectedElement?.getAttribute('data-crop-data')}
          targetElement={document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`)?.querySelector(`[id="${selectedLayerId}"]`) || selectedElement}
          activePageIndex={activePageIndex}
          onCancel={() => setShowCropModal(false)}
          onDone={(newCrop) => {
            setImageType('Crop');
            stateRef.current.imageType = 'Crop';

            const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
            const liveEl = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || selectedElement;

            if (selectedElement) {
              selectedElement.setAttribute('data-effect-crop-inset', 'true');
              selectedElement.setAttribute('data-crop-data', JSON.stringify(newCrop));
            }
            if (liveEl && liveEl !== selectedElement) {
              liveEl.setAttribute('data-effect-crop-inset', 'true');
              liveEl.setAttribute('data-crop-data', JSON.stringify(newCrop));
            }

            setShowCropModal(false);

            setTimeout(() => {
              applyVisuals();
              if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
            }, 0);
          }}
        />
      )}
    </div>
  );
};

export default ImageEditor;
