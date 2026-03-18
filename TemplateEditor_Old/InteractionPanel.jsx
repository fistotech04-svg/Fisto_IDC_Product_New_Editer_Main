import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  MousePointerClick,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Trash2,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  ZoomIn,
  MessageSquare,
  Download,
  Info,
  Check,
  FileText,
  Type,
  Maximize,
  Edit2,
  Zap,
  Eye,
  Upload,
  Video as VideoIcon,
  Image as ImageIcon,
  Compass as IconIcon,
  X,
  RotateCcw,
  Pipette,
  ScanEye,
  SlidersHorizontal,
  Box,
  Layers
} from 'lucide-react';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import PopupTemplateSelection from './PopupTemplateSelection';
import PopupPreview from './PopupPreview';
import ColorPicker from '../ThreedEditor/ColorPicker';

// Helper: Hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Helper: RGB to Hex
const rgbToHex = (r, g, b) => {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Helper: RGB to HSV
const rgbToHsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

// Helper: HSV to RGB
const hsvToRgb = (h, s, v) => {
  h /= 360; s /= 100; v /= 100;
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};


const InteractionPanel = ({
  selectedElement,
  onUpdate,
  onPopupPreviewUpdate,
  isOpen,
  onToggle,

  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  pages,
  isFrame,
  frameLabel,
  forceHidden
}) => {
  const popupFileInputRef = React.useRef(null);
  const downloadFileInputRef = React.useRef(null);
  const updateDebounceRef = React.useRef(null);
  const previewDebounceRef = React.useRef(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isTemplateSelectionOpen, setTemplateSelectionOpen] = useState(false);

  // Determine if open based on prop or internal state
  const isInteractionsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const [interactionType, setInteractionType] = useState('none');
  const [interactionTrigger, setInteractionTrigger] = useState('click');
  const [zoomLevel, setZoomLevel] = useState(2);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showTriggerDropdown, setShowTriggerDropdown] = useState(false);
  const [showFitDropdown, setShowFitDropdown] = useState(false);
  const [dropdownRect, setDropdownRect] = useState(null);
  const dropdownRef = React.useRef(null);

  // Values for inputs
  const [linkUrl, setLinkUrl] = useState('');
  const [navPage, setNavPage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadCustomImage, setDownloadCustomImage] = useState(null);

  // Advanced State for Popup & Tooltip
  const [popupText, setPopupText] = useState('');
  const [popupFont, setPopupFont] = useState('Poppins');
  const [popupSize, setPopupSize] = useState('24');
  const [popupWeight, setPopupWeight] = useState('Semi Bold');
  const [popupFillColor, setPopupFillColor] = useState('#ffffff');
  const [popupFillOpacity, setPopupFillOpacity] = useState(100);
  const [popupStrokeColor, setPopupStrokeColor] = useState('none');
  const [popupStrokeOpacity, setPopupStrokeOpacity] = useState(100);
  const [popupStrokeType, setPopupStrokeType] = useState('dashed');
  const [popupStrokeWidth, setPopupStrokeWidth] = useState(1);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [popupFit, setPopupFit] = useState('Fit');
  const [popupAutoWidth, setPopupAutoWidth] = useState(true);
  const [popupAutoHeight, setPopupAutoHeight] = useState(true);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(true);

  // Dashed Settings
  const [popupStrokeDashLength, setPopupStrokeDashLength] = useState(4);
  const [popupStrokeDashGap, setPopupStrokeDashGap] = useState(4);
  const [popupStrokePosition, setPopupStrokePosition] = useState('center');
  const [popupStrokeRoundCorners, setPopupStrokeRoundCorners] = useState(false);
  const [showDashedSettings, setShowDashedSettings] = useState(false);
  const [showStrokePositionDropdown, setShowStrokePositionDropdown] = useState(false);
  const dashedRef = React.useRef(null);
  const strokePositionRef = React.useRef(null);
  const typeTriggerRef = React.useRef(null);
  const triggerTriggerRef = React.useRef(null);
  // New States for Redesigned Fill/Stroke Pickers
  const [showDetailedFillControls, setShowDetailedFillControls] = useState(false);
  const [showDetailedStrokeControls, setShowDetailedStrokeControls] = useState(false);
  const fillPickerRef = React.useRef(null);
  const strokePickerRef = React.useRef(null);

  // Helper to get colors used on the current page
  const colorsOnPage = React.useMemo(() => {
    if (!selectedElement || !selectedElement.ownerDocument) return [];
    const elements = selectedElement.ownerDocument.querySelectorAll('[data-fill-color], [data-stroke-color], [data-popup-fill], [data-popup-stroke]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color') || el.getAttribute('data-popup-fill');
      const stroke = el.getAttribute('data-stroke-color') || el.getAttribute('data-popup-stroke');
      if (fill && fill !== 'none') colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none') colors.add(stroke.toUpperCase());
    });
    // Add default white and black if not present
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [selectedElement, pages]);

  const handleToggleTypeDropdown = (e) => {
    e.stopPropagation();
    if (!showTypeDropdown && typeTriggerRef.current) {
      setDropdownRect(typeTriggerRef.current.getBoundingClientRect());
    }
    setShowTypeDropdown(!showTypeDropdown);
    setShowTriggerDropdown(false);
  };

  const handleToggleTriggerDropdown = (e) => {
    e.stopPropagation();
    if (!showTriggerDropdown && triggerTriggerRef.current) {
      setDropdownRect(triggerTriggerRef.current.getBoundingClientRect());
    }
    setShowTriggerDropdown(!showTriggerDropdown);
    setShowTypeDropdown(false);
  };


  const [tooltipText, setTooltipText] = useState('');
  const [tooltipTextColor, setTooltipTextColor] = useState('#ffffff');
  const [tooltipFillColor, setTooltipFillColor] = useState('#000000'); // Default black background for tooltip

  // Frames state (for when selectedElement is an image/container)
  const [frames, setFrames] = useState([]);

  useEffect(() => {
    if (!selectedElement || isFrame) return;

    const scanFrames = () => {
      const doc = selectedElement.ownerDocument;
      if (!doc) return;
      const frameEls = doc.querySelectorAll('[data-interaction-type="frame"]');
      setFrames(Array.from(frameEls).map(el => ({
        id: el.id,
        label: el.getAttribute('data-frame-label') || `Frame ${el.id.slice(-2)}`,
        interaction: el.getAttribute('data-interaction') || 'none',
        element: el
      })));
    };

    scanFrames();
    const observer = new MutationObserver(scanFrames);
    observer.observe(selectedElement.ownerDocument.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-interaction', 'id']
    });

    return () => observer.disconnect();
  }, [selectedElement, isFrame]);

  // Sync state with selected element attributes on mount/change
  useEffect(() => {
    if (selectedElement) {
      const type = selectedElement.getAttribute('data-interaction') || 'none';
      const val = selectedElement.getAttribute('data-interaction-value') || '';
      let content = selectedElement.getAttribute('data-interaction-content') || '';

      // Support legacy attribute-based encoding or new prefix-based encoding
      if (
        selectedElement.getAttribute('data-interaction-content-encoded') === 'true' ||
        content.startsWith('ENCODED:::')
      ) {
        try {
          const raw = content.startsWith('ENCODED:::') ? content.substring(10) : content;
          content = decodeURIComponent(raw);
        } catch (e) {
          console.warn('Failed to decode interaction content', e);
          if (content.startsWith('ENCODED:::')) {
            content = content.substring(10);
          }
        }
      }

      setInteractionType(type);
      setInteractionTrigger(selectedElement.getAttribute('data-interaction-trigger') || 'click');
      setIsHighlighted(selectedElement.getAttribute('data-interaction-highlight') !== 'false');

      // Set specific input based on type
      if (type === 'link') setLinkUrl(val);
      else setLinkUrl('');

      if (type === 'navigation') setNavPage(val || '1');
      else setNavPage('');

      if (type === 'call') setPhoneNumber(val);
      else setPhoneNumber('');

      if (type === 'zoom') setZoomLevel(Number(val) || 2);
      else setZoomLevel(2);

      if (type === 'download') {
        setDownloadUrl(val || '');
        setDownloadCustomImage(selectedElement.getAttribute('data-download-custom-image') || null);
      } else {
        setDownloadUrl('');
        setDownloadCustomImage(null);
      }

      if (type === 'popup') {
        setPopupText(content);
        setPopupFont(selectedElement.getAttribute('data-popup-font') || 'Poppins');
        setPopupSize(selectedElement.getAttribute('data-popup-size') || '24');
        setPopupWeight(selectedElement.getAttribute('data-popup-weight') || 'Semi Bold');
        setPopupFillColor(selectedElement.getAttribute('data-popup-fill') || '#ffffff');
        setPopupFillOpacity(parseInt(selectedElement.getAttribute('data-popup-fill-opacity')) || 100);
        setPopupStrokeColor(selectedElement.getAttribute('data-popup-stroke') || 'none');
        setPopupStrokeOpacity(parseInt(selectedElement.getAttribute('data-popup-stroke-opacity')) || 100);
        setPopupStrokeType(selectedElement.getAttribute('data-popup-stroke-type') || 'dashed');
        setPopupStrokeWidth(parseInt(selectedElement.getAttribute('data-popup-stroke-width')) || 1);
        setPopupStrokeDashLength(parseInt(selectedElement.getAttribute('data-popup-stroke-dash-length')) || 4);
        setPopupStrokeDashGap(parseInt(selectedElement.getAttribute('data-popup-stroke-dash-gap')) || 4);
        setPopupStrokePosition(selectedElement.getAttribute('data-popup-stroke-position') || 'center');
        setPopupStrokeRoundCorners(selectedElement.getAttribute('data-popup-stroke-round-corners') === 'true');
        setPopupFit(selectedElement.getAttribute('data-popup-fit') || 'Fit');
        setPopupAutoWidth(selectedElement.getAttribute('data-popup-auto-width') !== 'false');
        setPopupAutoHeight(selectedElement.getAttribute('data-popup-auto-height') !== 'false');
        setPopupImageSrc(selectedElement.getAttribute('data-popup-image-src') || (selectedElement.tagName.toLowerCase() === 'img' ? selectedElement.src : ''));
      } else {
        setPopupText('');
      }

      if (type === 'tooltip') {
        setTooltipText(content);
        setTooltipTextColor(selectedElement.getAttribute('data-tooltip-text-color') || '#ffffff');
        setTooltipFillColor(selectedElement.getAttribute('data-tooltip-fill-color') || '#000000');
      } else {
        setTooltipText('');
      }
    }
  }, [selectedElement]);

  // Memoized element type information to avoid expensive getComputedStyle on every render
  const activeElementInfo = React.useMemo(() => {
    if (!activePopupElement || typeof activePopupElement === 'string') return null;

    const tagName = activePopupElement.tagName.toUpperCase();
    const style = window.getComputedStyle(activePopupElement);
    const hasBgImage = style?.backgroundImage && style.backgroundImage !== 'none';

    const isText = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'B', 'STRONG', 'I', 'EM', 'BUTTON'].includes(tagName)
      || (tagName === 'DIV' && activePopupElement.children?.length === 0 && activePopupElement.textContent.trim().length > 0);

    const isGif = (tagName === 'IMG' || tagName === 'IMAGE') && (activePopupElement.dataset?.mediaType === 'gif' || activePopupElement.src?.toLowerCase().endsWith('.gif') || activePopupElement.getAttribute('xlink:href')?.toLowerCase().endsWith('.gif'));
    const isImage = ((tagName === 'IMG' || tagName === 'IMAGE') && !isGif) || (tagName === 'DIV' && hasBgImage && !isText);
    const isVideo = tagName === 'VIDEO';
    const isIcon = tagName === 'SVG' || tagName === 'PATH' || tagName === 'G' || tagName === 'CIRCLE' || tagName === 'RECT' || (tagName === 'DIV' && activePopupElement.children?.length === 0 && !isText && !isImage && !isGif && !isVideo);

    return { isText, isImage, isGif, isVideo, isIcon };
  }, [activePopupElement]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ignore clicks on triggers
      if (typeTriggerRef.current && typeTriggerRef.current.contains(event.target)) return;
      if (triggerTriggerRef.current && triggerTriggerRef.current.contains(event.target)) return;
      if (dashedRef.current && dashedRef.current.contains(event.target)) return;

      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
        setShowTriggerDropdown(false);
        setShowFitDropdown(false);
      }
      if (dashedRef.current && !dashedRef.current.contains(event.target) && !event.target.closest('.dashed-selector-trigger')) {
        setShowDashedSettings(false);
      }
      if (strokePositionRef.current && !strokePositionRef.current.contains(event.target)) {
        setShowStrokePositionDropdown(false);
      }
      // Close new pickers
      if (fillPickerRef.current && !fillPickerRef.current.contains(event.target) && !event.target.closest('.fill-picker-trigger') && !event.target.closest('.color-picker-container')) setShowFillPicker(false);
      if (strokePickerRef.current && !strokePickerRef.current.contains(event.target) && !event.target.closest('.stroke-picker-trigger') && !event.target.closest('.color-picker-container')) setShowStrokePicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!selectedElement) return null;

  // Helper to get element display name
  const getElementLabel = () => {
    if (!selectedElement) return 'Element';
    const tag = selectedElement.tagName.toLowerCase();

    // Check if it's text-like
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'strong', 'em'].includes(tag)) {
      return 'Text';
    }

    if (tag === 'img') return 'Image';
    if (tag === 'button') return 'Button';
    if (tag === 'a') return 'Link';
    if (tag === 'div') return 'Container';
    return 'Element';
  };

  const formattedElementName = getElementLabel();


  // ================= APPLY INTERACTIONS =================

  const applyInteraction = (type, value, content = '', triggerOverride = null, highlightOverride = null, styleOverrides = {}, forceRefresh = false) => {
    setInteractionType(type);
    const trigger = triggerOverride || interactionTrigger;
    const highlight = highlightOverride !== null ? highlightOverride : isHighlighted;



    if (type === 'none') {
      selectedElement.removeAttribute('data-interaction');
      selectedElement.removeAttribute('data-interaction-value');
      selectedElement.removeAttribute('data-interaction-content');
      selectedElement.removeAttribute('data-interaction-trigger');
      selectedElement.removeAttribute('data-interaction-highlight');
      selectedElement.removeAttribute('data-filename');

      // Remove extra attributes
      selectedElement.removeAttribute('data-popup-font');
      selectedElement.removeAttribute('data-popup-size');
      selectedElement.removeAttribute('data-popup-weight');
      selectedElement.removeAttribute('data-popup-fill');
      selectedElement.removeAttribute('data-tooltip-text-color');
      selectedElement.removeAttribute('data-tooltip-fill-color');
      selectedElement.removeAttribute('data-popup-auto-width');
      selectedElement.removeAttribute('data-popup-auto-height');
      selectedElement.removeAttribute('data-popup-fit');
      selectedElement.removeAttribute('data-popup-fit');
      selectedElement.removeAttribute('data-popup-image-src');
      selectedElement.removeAttribute('data-popup-image-src');
      selectedElement.removeAttribute('data-interaction-content-encoded');
      selectedElement.removeAttribute('data-download-custom-image'); // Cleanup custom download image

      selectedElement.style.cursor = '';
    } else {
      selectedElement.setAttribute('data-interaction', type);
      selectedElement.setAttribute('data-interaction-trigger', trigger);
      selectedElement.setAttribute('data-interaction-highlight', highlight);

      if (value) selectedElement.setAttribute('data-interaction-value', value);
      else selectedElement.removeAttribute('data-interaction-value');

      if (content) {
        // For popups, we encode with a prefix to ensure persistence across save/load
        if (type === 'popup') {
          const encoded = 'ENCODED:::' + encodeURIComponent(content);
          selectedElement.setAttribute('data-interaction-content', encoded);
          // Clean up legacy attribute if present
          selectedElement.removeAttribute('data-interaction-content-encoded');
        } else {
          selectedElement.setAttribute('data-interaction-content', content);
          selectedElement.removeAttribute('data-interaction-content-encoded');
        }
      } else {
        selectedElement.removeAttribute('data-interaction-content');
        selectedElement.removeAttribute('data-interaction-content-encoded');
      }

      // Save filename if it's a download
      if (type === 'download' && value) {
        // Only allow image downloads (ignore text data URLs)
        const isTextDataUrl = typeof value === 'string' && value.startsWith('data:text/plain');

        if (!isTextDataUrl) {
          const isImage = selectedElement.tagName.toLowerCase() === 'img';
          const hasCustom = !!selectedElement.getAttribute('data-download-custom-image');
          let fname = 'image.png';

          if (isImage && !hasCustom) {
            const src = selectedElement.src || '';
            fname = src.startsWith('data:') ? 'image.png' : (src.split('/').pop().split('?')[0] || 'image.png');
          } else if (hasCustom || (typeof value === 'string' && value.startsWith('data:image'))) {
            fname = 'downloaded_image.png';
          }

          selectedElement.setAttribute('data-filename', fname);
          selectedElement.setAttribute('data-interaction-value', value);
        } else {
          // If it was text, remove the values
          selectedElement.removeAttribute('data-interaction-value');
          selectedElement.removeAttribute('data-filename');
        }
      } else if (type === 'download') {
        selectedElement.removeAttribute('data-filename');
      }

      // Save extra attributes for specific types
      if (type === 'popup') {
        selectedElement.setAttribute('data-popup-font', styleOverrides.font || popupFont);
        selectedElement.setAttribute('data-popup-size', styleOverrides.size || popupSize);
        selectedElement.setAttribute('data-popup-weight', styleOverrides.weight || popupWeight);
        selectedElement.setAttribute('data-popup-fill', styleOverrides.fill || popupFillColor);
        selectedElement.setAttribute('data-popup-fill-opacity', styleOverrides.fillOpacity !== undefined ? styleOverrides.fillOpacity : popupFillOpacity);
        selectedElement.setAttribute('data-popup-stroke', styleOverrides.stroke || popupStrokeColor);
        selectedElement.setAttribute('data-popup-stroke-opacity', styleOverrides.strokeOpacity !== undefined ? styleOverrides.strokeOpacity : popupStrokeOpacity);
        selectedElement.setAttribute('data-popup-stroke-type', styleOverrides.strokeType || popupStrokeType);
        selectedElement.setAttribute('data-popup-stroke-width', styleOverrides.strokeWidth !== undefined ? styleOverrides.strokeWidth : popupStrokeWidth);
        selectedElement.setAttribute('data-popup-stroke-dash-length', styleOverrides.strokeDashLength !== undefined ? styleOverrides.strokeDashLength : popupStrokeDashLength);
        selectedElement.setAttribute('data-popup-stroke-dash-gap', styleOverrides.strokeDashGap !== undefined ? styleOverrides.strokeDashGap : popupStrokeDashGap);
        selectedElement.setAttribute('data-popup-stroke-position', styleOverrides.strokePosition || popupStrokePosition);
        selectedElement.setAttribute('data-popup-stroke-round-corners', styleOverrides.strokeRoundCorners !== undefined ? styleOverrides.strokeRoundCorners : popupStrokeRoundCorners);
        selectedElement.setAttribute('data-popup-fit', styleOverrides.fit || popupFit);
        selectedElement.setAttribute('data-popup-auto-width', styleOverrides.autoWidth !== undefined ? styleOverrides.autoWidth : popupAutoWidth);
        selectedElement.setAttribute('data-popup-auto-height', styleOverrides.autoHeight !== undefined ? styleOverrides.autoHeight : popupAutoHeight);

        if (styleOverrides.imageSrc || popupImageSrc) {
          selectedElement.setAttribute('data-popup-image-src', styleOverrides.imageSrc || popupImageSrc);
        }

        if (styleOverrides.templateType) {
          selectedElement.setAttribute('data-popup-type', styleOverrides.templateType);
        } else {
          selectedElement.removeAttribute('data-popup-type');
        }

        if (styleOverrides.templateData) {
          selectedElement.setAttribute('data-popup-template-data', JSON.stringify(styleOverrides.templateData));
        } else {
          selectedElement.removeAttribute('data-popup-template-data');
        }
      }
      if (type === 'tooltip') {
        selectedElement.setAttribute('data-tooltip-text-color', tooltipTextColor);
        selectedElement.setAttribute('data-tooltip-fill-color', tooltipFillColor);
      }

      selectedElement.style.cursor = 'pointer';
    }

    // Debounce the parent state update (heavy)
    if (updateDebounceRef.current) clearTimeout(updateDebounceRef.current);
    updateDebounceRef.current = setTimeout(() => {
      onUpdate(selectedElement.id, {
        interactions: {
          type,
          value,
          content: (type === 'popup' && content) ? ('ENCODED:::' + encodeURIComponent(content)) : content,
          trigger: trigger,
          highlight: highlight
        }
      });
    }, 200);

    // If it's a popup, also update the preview state if it's already open
    if (type === 'popup') {
      const popupStyles = {
        font: styleOverrides.font || popupFont,
        size: styleOverrides.size || popupSize,
        weight: styleOverrides.weight || popupWeight,
        fill: styleOverrides.fill || popupFillColor,
        fillOpacity: styleOverrides.fillOpacity !== undefined ? styleOverrides.fillOpacity : popupFillOpacity,
        stroke: styleOverrides.stroke || popupStrokeColor,
        strokeOpacity: styleOverrides.strokeOpacity !== undefined ? styleOverrides.strokeOpacity : popupStrokeOpacity,
        strokeType: styleOverrides.strokeType || popupStrokeType,
        strokeWidth: styleOverrides.strokeWidth !== undefined ? styleOverrides.strokeWidth : popupStrokeWidth,
        strokeDashLength: styleOverrides.strokeDashLength !== undefined ? styleOverrides.strokeDashLength : popupStrokeDashLength,
        strokeDashGap: styleOverrides.strokeDashGap !== undefined ? styleOverrides.strokeDashGap : popupStrokeDashGap,
        strokePosition: styleOverrides.strokePosition || popupStrokePosition,
        strokeRoundCorners: styleOverrides.strokeRoundCorners !== undefined ? styleOverrides.strokeRoundCorners : popupStrokeRoundCorners,
        fit: styleOverrides.fit || popupFit,
        autoWidth: styleOverrides.autoWidth !== undefined ? styleOverrides.autoWidth : popupAutoWidth,
        autoHeight: styleOverrides.autoHeight !== undefined ? styleOverrides.autoHeight : popupAutoHeight
      };

      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = setTimeout(() => {
        onPopupPreviewUpdate({
          content: content || popupText,
          elementSource: styleOverrides.imageSrc || popupImageSrc,
          styles: popupStyles,
          ...(forceRefresh ? { renderId: Date.now() } : {})
        });
      }, 50); // Small 50ms debounce for smoother preview updates
    }
  };

  // Wrapper to trigger updates when advanced inputs change
  const updateAdvanced = (type, styleOverrides = {}, forceRefresh = false) => {
    let value = null;
    let content = '';
    if (type === 'popup') content = popupText;
    if (type === 'tooltip') content = tooltipText;

    applyInteraction(type, value, content, null, null, styleOverrides, forceRefresh);
  };

  // ================= HANDLE ACTIONS =================

  const handleReset = () => {
    applyInteraction('none');
  };

  const handleDelete = () => {
    if (!selectedElement) return;
    const id = selectedElement.id;
    selectedElement.remove();
    // Use onUpdate to notify parent that the element is gone
    if (onUpdate) onUpdate(id, { deleted: true });
  };


  const handleTypeChange = (newType) => {
    // If we are changing types, we should clear stale state for the NEW type
    // to ensures we start fresh (e.g., empty popup template).
    if (newType !== interactionType) {
      if (newType === 'popup') {
        // UNCONDITIONALLY clear popup state when switching to Popup.
        // This ensures we always show "Choose Template" initially.
        setPopupText('');
        setPopupImageSrc('');
      }
      if (newType === 'tooltip') {
        if (selectedElement.getAttribute('data-interaction') !== 'tooltip') {
          setTooltipText('');
        }
      }
      // We can also clear others if needed, but Popup is the main issue.
    }

    setInteractionType(newType);
    let finalTrigger = interactionTrigger;

    // Reset trigger if switching to restricted types and currently on hover
    if (['link', 'navigation', 'call', 'zoom', 'popup', 'download'].includes(newType) && interactionTrigger === 'hover') {
      finalTrigger = 'click';
      setInteractionTrigger('click');
    }
    if (newType === 'none') {
      // When explicitly setting to None, clear the interaction-specific states for cleanliness
      setPopupText('');
      setTooltipText('');
      setLinkUrl('');
      setNavPage('');
      setPhoneNumber('');
      setDownloadUrl('');

      applyInteraction('none', null);
    } else {
      let currentValue =
        newType === 'link' ? linkUrl :
          newType === 'navigation' ? navPage :
            newType === 'call' ? phoneNumber :
              newType === 'zoom' ? zoomLevel :
                newType === 'download' ? downloadUrl : null;

      // Automatically set download URL if missing
      if (newType === 'download' && !currentValue) {
        if (selectedElement.tagName.toLowerCase() === 'img') {
          currentValue = selectedElement.src;
        } else {
          const textContent = selectedElement.innerText || selectedElement.textContent || '';
          currentValue = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
        }
        setDownloadUrl(currentValue);
        // Immediately apply the interaction with the generated value
        applyInteraction(newType, currentValue, '', null, null, {});
        return;
      }

      // Determine content using the fresh logic
      let currentContent = '';

      if (newType === 'popup') {
        // If we are switching types, FORCE empty content.
        if (newType !== interactionType) {
          currentContent = '';
        } else {
          // If staying on popup (e.g. attribute update or re-click), use current state
          currentContent = popupText;
        }
      } else if (newType === 'tooltip') {
        if (selectedElement.getAttribute('data-interaction') === 'tooltip') {
          currentContent = tooltipText;
        } else {
          currentContent = '';
        }
      }

      const styleOverrides = {};

      if (newType === 'popup') {
        // Auto-inherit styles if not already set
        if (!selectedElement.getAttribute('data-popup-font')) {
          const compStyle = window.getComputedStyle(selectedElement);
          const fFamily = compStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          const fSize = parseInt(compStyle.fontSize) || 24;
          const fWeight = compStyle.fontWeight;

          // Convert weight number or name to label
          let weightLabel = 'Regular';
          const weightVal = String(fWeight).toLowerCase();
          if (weightVal === 'bold' || parseInt(fWeight) >= 700) weightLabel = 'Bold';
          else if (weightVal === 'semibold' || weightVal === '600' || parseInt(fWeight) >= 600) weightLabel = 'Semi Bold';

          const validFonts = ['Poppins', 'Roboto', 'Open Sans'];
          const matchedFont = validFonts.find(f => fFamily.includes(f)) || 'Poppins';

          setPopupFont(matchedFont);
          setPopupSize(String(fSize));
          setPopupWeight(weightLabel);
          setPopupFillColor('#ffffff'); // Default to white for popups

          styleOverrides.font = matchedFont;
          styleOverrides.size = String(fSize);
          styleOverrides.weight = weightLabel;
          styleOverrides.fill = '#ffffff';
        }
      }

      applyInteraction(newType, currentValue, currentContent, 'click', null, styleOverrides, true);
    }
  };

  const handleImageReplace = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newSrc = event.target.result;
      setPopupImageSrc(newSrc);
      applyInteraction('popup', null, popupText, null, null, { imageSrc: newSrc });

      // Clear input so same file can be uploaded again
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };



  const handleDownloadImageReplace = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newSrc = event.target.result;
      setDownloadCustomImage(newSrc);
      setDownloadUrl(newSrc);

      // Persist the custom image override
      selectedElement.setAttribute('data-download-custom-image', newSrc);

      // Update interaction value to point to new image
      // We pass the newSrc as the 'value' which becomes the download href
      applyInteraction('download', newSrc, '', null, null, {});

      // Clear input so same file can be uploaded again
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerChange = (newTrigger) => {
    setInteractionTrigger(newTrigger);
    // Explicitly update the attribute and trigger a full apply
    selectedElement.setAttribute('data-interaction-trigger', newTrigger);

    const currentValue =
      interactionType === 'link' ? linkUrl :
        interactionType === 'navigation' ? navPage :
          interactionType === 'call' ? phoneNumber :
            interactionType === 'zoom' ? zoomLevel :
              interactionType === 'download' ? downloadUrl : null;

    const currentContent =
      interactionType === 'popup' ? popupText :
        interactionType === 'tooltip' ? tooltipText : '';

    applyInteraction(interactionType, currentValue, currentContent, newTrigger, null, {}, true);
  };

  const handleOpenTemplateSelection = () => {
    setTemplateSelectionOpen(true);
  };

  const handleTemplateSelect = (template) => {
    if (template.type === 'html') {
      setPopupText(template.html);
      setPopupImageSrc('');
      setPopupFillColor('#ffffff');
      // Apply HTML template interaction
      applyInteraction('popup', null, template.html, 'click', null, {
        fit: 'Fill',
        autoWidth: false,
        autoHeight: false,
        fill: '#ffffff',
        templateType: 'html'
      }, true);

      onPopupPreviewUpdate({
        isOpen: true,
        content: template.html,
        elementSource: null,
        elementType: 'image',
        mode: 'edit',
        styles: {
          fit: 'Fill',
          autoWidth: false,
          autoHeight: false,
          fill: '#ffffff',
          templateType: 'html'
        }
      });
    } else if (template.type === 'automotive') {
      const defaultText = template.name;
      setPopupText(defaultText);
      setPopupImageSrc(template.image || '');
      setPopupFillColor('#ffffff');

      const tData = {
        description: template.description,
        strengths: template.strengths,
        subImages: template.subImages,
        logo: template.logo
      };

      const automotiveHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
            body { margin: 0; padding: 0; font-family: 'Poppins', sans-serif; color: #333; height: 100vh; display: flex; overflow: hidden; background: transparent; }
            .container { display: flex; width: 100%; height: 100%; }
            
            /* Left Sidebar */
            .sidebar {
              width: 40%;
              background-color: #A83232; /* Deep Red from screenshot */
              padding: 40px 30px;
              display: flex;
              flex-direction: column;
              gap: 15px;
              justify-content: center;
              position: relative;
            }
            .sidebar::after {
              content: '';
              position: absolute;
              top: 20px;
              bottom: 20px;
              right: -10px; /* Slight overlap illusion if needed */
              width: 20px;
              background: transparent; /* Placeholder for potential depth effects */
            }

            .main-image-wrapper {
              width: 100%;
              aspect-ratio: 16/9;
              background: #000;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              position: relative;
              border: 2px solid rgba(255,255,255,0.1);
            }
            .main-image { width: 100%; height: 100%; object-fit: cover; }
            
            /* Video Play Button Overlay */
            .play-overlay {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0,0,0,0.2);
            }
            .play-icon {
              width: 48px;
              height: 48px;
              background: rgba(255,255,255,0.2);
              backdrop-filter: blur(4px);
              border-radius: 50%;
              border: 2px solid #fff;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .play-triangle {
              width: 0; 
              height: 0; 
              border-top: 8px solid transparent;
              border-bottom: 8px solid transparent;
              border-left: 14px solid #fff;
              margin-left: 4px;
            }

            .sub-images-grid {
              display: flex;
              gap: 15px;
              height: 120px;
            }
            .sub-img-box {
              flex: 1;
              background: #000;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.2);
              border: 2px solid rgba(255,255,255,0.1);
            }
            .sub-img-box img { width: 100%; height: 100%; object-fit: cover; }

            /* Right Content */
            .content {
              width: 60%;
              padding: 50px 60px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              background: var(--popup-fill, #fff);
              position: relative;
            }

            h1 {
              font-size: 36px;
              font-weight: 700;
              color: #A83232; /* Matching Red */
              margin: 0 0 20px 0;
              line-height: 1.2;
            }

            p {
              font-size: 14px;
              line-height: 1.8;
              color: #444;
              margin-bottom: 30px;
              max-width: 95%;
            }

            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: #A83232;
              margin-bottom: 15px;
            }

            ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            
            li {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;
              font-size: 14px;
              color: #333;
              font-weight: 500;
            }

            .bullet-icon {
              width: 20px;
              height: 20px;
              min-width: 20px;
              border: 2px solid #A83232;
              border-radius: 50%;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .bullet-icon::after {
              content: '';
              width: 10px;
              height: 10px;
              background: #A83232;
              border-radius: 50%;
            }

            .footer-logo {
              position: absolute;
              bottom: 30px;
              right: 40px;
              width: 50px;
              height: 50px;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Sidebar -->
            <div class="sidebar">
              <div class="main-image-wrapper">
                <img src="${template.image}" class="main-image element-selector" data-media-type="image" />
                <div class="play-overlay">
                   <div class="play-icon"><div class="play-triangle"></div></div>
                </div>
              </div>
              <div class="sub-images-grid">
                ${template.subImages.map(img => `
                  <div class="sub-img-box">
                    <img src="${img}" class="element-selector" />
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Content -->
            <div class="content">
              <h1>${template.name || 'About Our Company'}</h1>
              <p>${template.description || 'We provide premium quality automotive parts and dedicated service for modern vehicles.'}</p>
              
              <div class="section-title">Our Strengths</div>
              <ul>
                ${template.strengths.map(s => `
                  <li><div class="bullet-icon"></div>${s}</li>
                `).join('')}
              </ul>

              <img src="${template.logo}" class="footer-logo" />
            </div>
          </div>
        </body>
        </html>
      `;

      applyInteraction('popup', null, automotiveHtml, 'click', null, {
        imageSrc: template.image,
        templateType: 'automotive',
        templateData: tData,
        fill: '#ffffff'
      }, true);

      onPopupPreviewUpdate({
        isOpen: true,
        content: automotiveHtml,
        elementSource: template.image || null,
        elementType: 'image',
        renderId: Date.now(),
        mode: 'edit',
        styles: {
          font: popupFont,
          size: popupSize,
          weight: popupWeight,
          fill: popupFillColor,
          fit: popupFit,
          autoWidth: popupAutoWidth,
          autoHeight: popupAutoHeight,
          templateType: 'automotive',
          templateData: tData
        }
      });
    } else {
      // Standard template logic
      const defaultText = template.name || "About Our Company";
      setPopupText(defaultText);
      setPopupImageSrc(template.image || '');
      setPopupFillColor('#ffffff');
      applyInteraction('popup', null, defaultText, 'click', null, {
        imageSrc: template.image,
        fill: '#ffffff'
      }, true);

      onPopupPreviewUpdate({
        isOpen: true,
        content: defaultText,
        elementSource: template.image || null,
        elementType: 'image',
        renderId: Date.now(),
        mode: 'edit',
        styles: {
          font: popupFont,
          size: popupSize,
          weight: popupWeight,
          fill: popupFillColor,
          fit: popupFit,
          autoWidth: popupAutoWidth,
          autoHeight: popupAutoHeight,
          templateType: 'standard'
        }
      });
    }
    setTemplateSelectionOpen(false);
  };

  const handleCloseTemplateSelection = () => {
    setTemplateSelectionOpen(false);
  };

  // ================= RENDER INTERFACE =================

  const renderTargetInput = () => {
    // This renders the RIGHT side of the flow (the target input OR visual representation)
    switch (interactionType) {
      case 'none':
        return (
          <div className={`w-[2.5vw] h-[2.5vw] flex items-center justify-center text-gray-400 font-medium bg-white rounded-full border border-gray-300 shadow-sm ${isFrame ? 'scale-110' : ''}`}>
            ?
          </div>
        );

      case 'zoom':
        return (
          <div className="flex items-center gap-[0.5vw]">
            <button
              className="w-[2vw] h-[2vw] flex items-center justify-center text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
              onClick={() => {
                const newZoom = Math.max(1.1, zoomLevel - 0.1);
                setZoomLevel(newZoom);
                applyInteraction('zoom', newZoom);
              }}
            >
              <ChevronLeft size="1.2vw" />
            </button>

            <div className="border border-gray-400 rounded-[0.25vw] px-[0.75vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-900 min-w-[2.6vw] text-center bg-white cursor-default">
              {Number(zoomLevel).toFixed(0)}X
            </div>

            <button
              className="w-[2vw] h-[2vw] flex items-center justify-center text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
              onClick={() => {
                const newZoom = Math.min(5, zoomLevel + 0.1);
                setZoomLevel(newZoom);
                applyInteraction('zoom', newZoom);
              }}
            >
              <ChevronRight size="1.2vw" />
            </button>
          </div>
        );

      case 'link':
        return (
          <div className={`flex flex-col items-end gap-[0.5vw] flex-grow ${isFrame ? 'min-w-[8vw]' : 'min-w-[10.5vw]'}`}>
            <div className="relative w-full">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onBlur={() => applyInteraction('link', linkUrl)}
                placeholder="https://example.com"
                className={`w-full border border-gray-400 rounded-[0.4vw] text-[0.75vw] text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${isFrame ? 'px-[0.6vw] py-[0.3vw]' : 'px-[0.8vw] py-[0.4vw]'}`}
              />
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div className={`border border-gray-400 rounded-[0.4vw] bg-white flex items-center gap-[0.5vw] ${isFrame ? 'pl-[0.8vw] pr-[0.4vw] py-[0.4vw] min-w-[6vw]' : 'px-[0.5vw] py-[0.4vw] min-w-[5.2vw]'}`}>
            <select
              value={navPage}
              onChange={(e) => {
                setNavPage(e.target.value);
                applyInteraction('navigation', e.target.value);
              }}
              className={`appearance-none bg-transparent text-gray-700 font-medium outline-none w-full ${isFrame ? 'text-[0.7vw] pr-[0.2vw]' : 'text-[0.75vw] pr-[1vw]'}`}
              style={{ backgroundImage: 'none' }}
            >
              <option value="" disabled>Select Page</option>
              {pages && pages.length > 0 ? (
                pages.map((page, index) => (
                  <option key={page.id || index} value={index + 1}>
                    {page.name ? (page.name.length > 20 ? page.name.substring(0, 18) + '...' : page.name) : `Page ${index + 1}`}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">Page 1</option>
                  <option value="2">Page 2</option>
                  <option value="3">Page 3</option>
                  <option value="4">Page 4</option>
                </>
              )}
            </select>
            <ChevronDown size="0.9vw" className="text-gray-500 flex-shrink-0" />
          </div>
        );

      case 'call':
        return (
          <div className="flex flex-col items-end gap-[0.5vw]">
            <div className="border border-gray-400 rounded-[0.4vw] flex items-center bg-white overflow-hidden p-[0.25vw]">
              <div className="flex items-center gap-[0.2vw] px-[0.5vw] border-r border-gray-200 bg-gray-50 rounded-[0.2vw] mx-[0.25vw] py-[0.15vw]">
                <span className="text-[0.65vw] text-gray-600 font-medium">+91</span>
                <ChevronDown size="0.7vw" className="text-gray-400" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={() => applyInteraction('call', phoneNumber)}
                placeholder="1234567890"
                className="w-[6vw] px-[0.5vw] py-[0.25vw] text-[0.75vw] text-gray-700 outline-none"
              />
            </div>
            <button
              className="bg-black text-white text-[0.65vw] font-semibold px-[1vw] py-[0.4vw] rounded-[0.4vw] flex items-center gap-[0.3vw] hover:bg-gray-800 transition-colors"
              onClick={() => applyInteraction('call', phoneNumber)}
            >
              <Check size="0.8vw" strokeWidth={3} />
              Done
            </button>
          </div>
        );

      case 'popup':
        // Show template preview if selected, otherwise show placeholder
        return (
          <div className="flex flex-col items-center justify-center">
            <div
              onClick={handleOpenTemplateSelection}
              className="border border-gray-300 rounded-[0.8vw] bg-white shadow-sm overflow-hidden mb-[0.2vw] flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors group relative w-[8.5vw] h-[6vw]"
            >
              {popupText ? (
                // Template Preview
                <div className="w-full h-full relative overflow-hidden bg-gray-50">
                  <div className="absolute inset-0 pointer-events-none transform origin-top-left scale-[0.25] group-hover:blur-sm transition-all duration-200" style={{ width: '400%', height: '400%' }}>
                    <iframe
                      srcDoc={popupText}
                      className="w-full h-full border-none bg-white"
                      title="Template Preview"
                      scrolling="no"
                    />
                  </div>
                  {/* Hover Overlay with Icon in Top-Right */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors">
                    <ArrowRightLeft size="1.5vw" className="opacity-0 group-hover:opacity-100 text-white transition-opacity bg-black p-[0.4vw] rounded-[0.4vw] shadow-md absolute top-[0.4vw] right-[0.4vw]" />
                  </div>
                </div>
              ) : (
                // Placeholder
                <div className="flex flex-col items-center justify-center w-full h-full p-[0.5vw]">
                  <MessageSquare size="2vw" className="text-gray-400 mb-[0.4vw]" />
                  <span className="text-[0.7vw] text-gray-500 font-medium text-center leading-tight">Choose Template</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'download':
        // Download File Card UI - Matching Screenshot + Image Replace
        const isImage = selectedElement.tagName.toLowerCase() === 'img';
        let filename = 'Document.txt';

        if (isImage) {
          const src = selectedElement.src || '';
          if (src.startsWith('data:')) {
            filename = 'image.png';
          } else {
            filename = src.split('/').pop().split('?')[0] || 'image.png';
          }
        } else {
          filename = 'Upload Image';
        }

        const previewSrc = downloadCustomImage || (isImage ? selectedElement.src : null);
        const hasCustom = !!downloadCustomImage;

        return (
          <div className="flex flex-col items-center gap-[0.3vw]">
            <div
              className="border border-gray-400 border-dashed rounded-[0.6vw] p-[0.4vw] bg-white shadow-sm overflow-hidden mb-[0.2vw] flex flex-col items-center cursor-pointer hover:border-indigo-400 group relative transition-colors"
              onClick={() => downloadFileInputRef.current?.click()}
              title="Click to replace download image"
            >
              <div className="w-[3.5vw] h-[3.5vw] bg-gray-50 rounded-[0.4vw] flex items-center justify-center overflow-hidden relative">
                {previewSrc ? (
                  <>
                    <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center text-white">
                        <Upload size="1vw" />
                        <span className="text-[0.6vw] font-medium mt-[0.1vw]">Replace</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-indigo-50 flex items-center justify-center p-[0.3vw] group-hover:bg-indigo-100 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <FileText size="1.3vw" className="text-indigo-400 mb-[0.1vw]" />
                      <span className="text-[0.55vw] text-indigo-600 font-medium opacity-0 group-hover:opacity-100 absolute bottom-[0.1vw]">Upload</span>
                    </div>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={downloadFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleDownloadImageReplace}
              />
            </div>

            <span className="text-[0.65vw] text-gray-500 font-medium uppercase tracking-wider max-w-[5.2vw] truncate" title={hasCustom ? "Custom Image Selected" : filename}>
              {hasCustom ? 'Override' : filename}
            </span>

            {hasCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDownloadCustomImage(null);
                  if (downloadFileInputRef.current) downloadFileInputRef.current.value = '';

                  const defaultVal = isImage ? selectedElement.src : '';
                  const finalVal = defaultVal;

                  setDownloadUrl(finalVal);
                  selectedElement.removeAttribute('data-download-custom-image');
                  applyInteraction('download', finalVal, '', null, null, {});
                }}
                className="text-[0.6vw] text-red-500 hover:text-red-700 font-medium flex items-center gap-[0.1vw] mt-[0.1vw]"
              >
                <X size="0.6vw" /> Reset
              </button>
            )}
          </div>
        );

      case 'tooltip':
        // Tooltip Visual
        return (
          <div className="border border-gray-400 rounded-[0.4vw] p-[0.75vw] min-w-[5.2vw] h-[4.2vw] flex items-center justify-center bg-white relative">
            <div className="relative">
              <MessageSquare size="2vw" className="text-gray-400 fill-gray-100" />
              <div className="absolute top-[0.1vw] right-[0.1vw] w-[0.4vw] h-[0.4vw] bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )

      default:
        return null;
    }
  };

  const renderAdvancedEditor = () => {
    if (interactionType === 'popup') {
      if (activeElementInfo) {
        const { isText, isImage, isGif, isVideo, isIcon } = activeElementInfo;

        if (isText && TextEditorComponent) {
          return (
            <div className="mt-[1vw] border-t border-gray-200 pt-[0.8vw]">
              <div className="flex items-center gap-[0.5vw] mb-[0.8vw]">
                <span className="text-[0.8vw] font-bold text-gray-900">Text Properties</span>
                <div className="h-[0.05vw] flex-grow bg-gray-200"></div>
                <Edit2 size="1vw" className="text-gray-400" />
              </div>
              <TextEditorComponent
                selectedElement={activePopupElement}
                onUpdate={onPopupUpdate}
                onPopupPreviewUpdate={onPopupPreviewUpdate}
                showInteraction={false}
                TextEditorComponent={TextEditorComponent}
                ImageEditorComponent={ImageEditorComponent}
                VideoEditorComponent={VideoEditorComponent}
                GifEditorComponent={GifEditorComponent}
                IconEditorComponent={IconEditorComponent}
              />
            </div>
          );
        } else if (isImage && ImageEditorComponent) {
          return (
            <div className="mt-[1vw] border-t border-gray-200 pt-[0.8vw]">
              <div className="flex items-center gap-[0.5vw] mb-[0.8vw]">
                <span className="text-[0.8vw] font-bold text-gray-900">Image Properties</span>
                <div className="h-[0.05vw] flex-grow bg-gray-200"></div>
                <ImageIcon size="1vw" className="text-gray-400" />
              </div>
              <ImageEditorComponent
                selectedElement={activePopupElement}
                onUpdate={onPopupUpdate}
                onPopupPreviewUpdate={onPopupPreviewUpdate}
                showInteraction={false}
                TextEditorComponent={TextEditorComponent}
                ImageEditorComponent={ImageEditorComponent}
                VideoEditorComponent={VideoEditorComponent}
                GifEditorComponent={GifEditorComponent}
                IconEditorComponent={IconEditorComponent}
              />
            </div>
          );
        } else if (isGif && GifEditorComponent) {
          return (
            <div className="mt-[1vw] border-t border-gray-200 pt-[0.8vw]">
              <div className="flex items-center gap-[0.5vw] mb-[0.8vw]">
                <span className="text-[0.8vw] font-bold text-gray-900">Gif Properties</span>
                <div className="h-[0.05vw] flex-grow bg-gray-200"></div>
                <Zap size="1vw" className="text-gray-400" />
              </div>
              <GifEditorComponent
                selectedElement={activePopupElement}
                onUpdate={onPopupUpdate}
                onPopupPreviewUpdate={onPopupPreviewUpdate}
                showInteraction={false}
                TextEditorComponent={TextEditorComponent}
                ImageEditorComponent={ImageEditorComponent}
                VideoEditorComponent={VideoEditorComponent}
                GifEditorComponent={GifEditorComponent}
                IconEditorComponent={IconEditorComponent}
              />
            </div>
          );
        } else if (isVideo && VideoEditorComponent) {
          return (
            <div className="mt-[1vw] border-t border-gray-200 pt-[0.8vw]">
              <div className="flex items-center gap-[0.5vw] mb-[0.8vw]">
                <span className="text-[0.8vw] font-bold text-gray-900">Video Properties</span>
                <div className="h-[0.05vw] flex-grow bg-gray-200"></div>
                <VideoIcon size="1vw" className="text-gray-400" />
              </div>
              <VideoEditorComponent
                selectedElement={activePopupElement}
                onUpdate={onPopupUpdate}
                onPopupPreviewUpdate={onPopupPreviewUpdate}
                showInteraction={false}
                TextEditorComponent={TextEditorComponent}
                ImageEditorComponent={ImageEditorComponent}
                GifEditorComponent={GifEditorComponent}
                IconEditorComponent={IconEditorComponent}
                VideoEditorComponent={VideoEditorComponent}
              />
            </div>
          );
        } else if (isIcon && IconEditorComponent) {
          return (
            <div className="mt-[1vw] border-t border-gray-200 pt-[0.8vw]">
              <IconEditorComponent
                selectedElement={activePopupElement}
                onUpdate={onPopupUpdate}
                showInteraction={false}
              />
            </div>
          );
        }
      }
      return null;
    }

    if (interactionType === 'tooltip') {
      return (
        <div className="mt-[1vw] pt-[1vw] border-t border-gray-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-[0.8vw]">
            <label className="text-[0.8vw] font-bold text-gray-800">Edit Tooltip</label>
          </div>

          {/* Preview Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-[0.8vw] h-[6vw] flex items-center justify-center mb-[1vw] relative">
            {/* Simulated Tooltip */}
            <div className="relative">
              <div
                className="px-[0.8vw] py-[0.4vw] rounded-[0.2vw] text-[0.7vw] whitespace-nowrap"
                style={{
                  backgroundColor: tooltipFillColor,
                  color: tooltipTextColor
                }}
              >
                {tooltipText || 'Centered Tooltip'}
              </div>
              {/* Triangle pointer */}
              <div
                className="w-0 h-0 border-l-[0.4vw] border-l-transparent border-r-[0.4vw] border-r-transparent border-t-[0.6vw] absolute left-1/2 -translate-x-1/2 top-full"
                style={{ borderTopColor: tooltipFillColor }}
              ></div>
            </div>
          </div>

          {/* Text Input */}
          <div className="relative mb-[0.8vw]">
            <input
              type="text"
              value={tooltipText}
              onChange={(e) => setTooltipText(e.target.value)}
              onBlur={() => updateAdvanced('tooltip')}
              placeholder="Centered Tooltip"
              className="w-full border border-gray-400 rounded-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] text-gray-600 outline-none"
            />
            <Edit2 size="0.9vw" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Colors */}
          <div className="space-y-[0.8vw]">
            {/* Text Color */}
            <div className="flex items-center gap-[0.8vw]">
              <span className="text-[0.75vw] font-medium text-gray-800 w-[3vw]">Text :</span>
              <div className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 relative overflow-hidden">
                <input
                  type="color"
                  value={tooltipTextColor}
                  onChange={(e) => { setTooltipTextColor(e.target.value); }}
                  onBlur={() => updateAdvanced('tooltip')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: tooltipTextColor }}></div>
              </div>
              <div className="flex-grow border border-gray-400 rounded-[0.6vw] px-[0.8vw] py-[0.4vw] flex items-center justify-between bg-white">
                <span className="text-[0.75vw] text-gray-500 uppercase">{tooltipTextColor}</span>
                <span className="text-[0.75vw] text-gray-500">100%</span>
              </div>
            </div>

            {/* Fill Color */}
            <div className="flex items-center gap-[0.8vw]">
              <span className="text-[0.75vw] font-medium text-gray-800 w-[3vw]">Fill :</span>
              <div className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 relative overflow-hidden">
                <input
                  type="color"
                  value={tooltipFillColor}
                  onChange={(e) => { setTooltipFillColor(e.target.value); }}
                  onBlur={() => updateAdvanced('tooltip')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: tooltipFillColor }}></div>
              </div>
              <div className="flex-grow border border-gray-400 rounded-[0.6vw] px-[0.8vw] py-[0.4vw] flex items-center justify-between bg-white">
                <span className="text-[0.75vw] text-gray-500 uppercase">{tooltipFillColor}</span>
                <span className="text-[0.75vw] text-gray-500">80%</span>
              </div>
            </div>
          </div>

        </div>
      )
    }
    return null;
  }

  const getInteractionLabel = () => {
    switch (interactionType) {
      case 'none': return 'None';
      case 'link': return 'Open Link';
      case 'navigation': return 'Navigate to';
      case 'call': return 'Call';
      case 'zoom': return 'Zoom';
      case 'popup': return 'PopUp';
      case 'tooltip': return 'Tooltip';
      case 'download': return 'Download';
      case '3dviewer': return '3D Viewer';
      case 'slideshow': return 'Slideshow';
      default: return 'None';
    }
  }



  const getIconForType = (type) => {
    switch (type) {
      case 'link': return <ExternalLink size="1vw" className="text-gray-600" />;
      case 'navigation': return <Zap size="1vw" className="text-gray-600" />;
      case 'call': return <Phone size="1vw" className="text-gray-600" />;
      case 'zoom': return <ZoomIn size="1vw" className="text-gray-600" />;
      case 'popup': return <MessageSquare size="1vw" className="text-gray-600" />;
      case 'tooltip': return <Info size="1vw" className="text-gray-600" />;
      case 'download': return <Download size="1vw" className="text-gray-600" />;
      case '3dviewer': return <Box size="1vw" className="text-gray-600" />;
      case 'slideshow': return <Layers size="1vw" className="text-gray-600" />;
      default: return <MousePointerClick size="1vw" className="text-gray-600" />;
    }
  }

  const getTriggerLabel = () => {
    return interactionTrigger === 'click' ? 'On Click' : 'On Hover';
  }


  if (forceHidden) return null;


  return (
    <div className={`bg-white border ${isFrame ? 'border-gray-100 shadow-md' : 'border-gray-200 shadow-sm'} ${isFrame ? 'rounded-[0.8vw]' : 'rounded-[0.8vw]'} relative transition-all duration-300 overflow-hidden`}>

      {/* ================= HEADER ================= */}
      <div
        className={`flex items-center justify-between px-[1vw] py-[1vw] cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 group/header ${isInteractionsOpen ? (isFrame ? 'rounded-t-[0.8vw]' : 'rounded-t-[0.8vw]') : (isFrame ? 'rounded-[0.8vw]' : 'rounded-[0.8vw]')}`}
        onClick={() => {
          if (onToggle) onToggle();
          else setInternalIsOpen(!internalIsOpen);
        }}
      >
        <div className="flex items-center gap-[0.5vw]">
          <Sparkles size="1vw" className="text-gray-600" />
          <span className="text-[0.85vw] font-medium text-gray-700">Interaction</span>
        </div>

        <div className="flex items-center gap-[0.5vw]">
          {isFrame && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              className="p-[0.35vw] text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[0.4vw] transition-all"
              title="Reset Interaction"
            >
              <RotateCcw size="0.85vw" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggle) onToggle();
              else setInternalIsOpen(!internalIsOpen);
            }}
            className="rounded-[0.3vw] hover:bg-gray-100 transition-colors"
            aria-label={isInteractionsOpen ? "Collapse" : "Expand"}
          >
            <ChevronUp
              size="1vw"
              className={`text-gray-500 transition-transform duration-200 ${isInteractionsOpen ? '' : 'rotate-180'}`}
            />
          </button>
        </div>
      </div>

      {isInteractionsOpen && (
        <div className="p-[1vw] pt-0 animate-fadeIn space-y-[1vw]">

          {/* ================= TOP SELECTORS ================= */}
          <div className="flex items-center justify-between gap-[0.8vw] mb-[0.25vw] pt-[1vw]">
            {/* Type Selector (Inside Panel Body) */}
            <div className="relative">
              <button
                ref={typeTriggerRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleTypeDropdown(e);
                }}
                className="flex items-center gap-[0.4vw] px-[0.75vw] py-[0.4vw] bg-gray-100 hover:bg-gray-200 rounded-[0.5vw] transition-all group relative border border-gray-200"
              >
                <span className="text-[0.75vw] font-semibold text-gray-700">{getInteractionLabel()}</span>
                <ChevronDown size="0.85vw" className={`text-gray-500 transition-transform duration-300 ${showTypeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTypeDropdown && dropdownRect && ReactDOM.createPortal(
                <>
                  <div className="fixed inset-0 z-[100000] cursor-default" onClick={(e) => {
                    e.stopPropagation();
                    setShowTypeDropdown(false);
                  }} />
                  <div
                    ref={dropdownRef}
                    style={{
                      position: 'fixed',
                      left: Math.min(dropdownRect.left, window.innerWidth - 180),
                      zIndex: 100001,
                      ...(dropdownRect.bottom + 8 + 300 > window.innerHeight
                        ? { bottom: window.innerHeight - dropdownRect.top + 8 }
                        : { top: dropdownRect.bottom + 8 })
                    }}
                      className="w-[10vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl overflow-y-auto max-h-[20vw] flex flex-col py-[0.25vw] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
                    onClick={e => e.stopPropagation()}
                  >
                    {[
                      { id: 'none', label: 'None', icon: X },
                      { id: 'link', label: 'Open Link', icon: ExternalLink },
                      { id: 'navigation', label: 'Navigate to', icon: Zap },
                      { id: 'call', label: 'Call', icon: Phone },
                      { id: 'zoom', label: 'Zoom', icon: ZoomIn },
                      { id: 'popup', label: 'Popup', icon: MessageSquare },
                      { id: 'tooltip', label: 'Tooltip', icon: Info },
                      { id: 'download', label: 'Download', icon: Download }
                    ].map((opt) => {
                      const IconComp = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTypeChange(opt.id);
                            setShowTypeDropdown(false);
                          }}
                          className={`px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium transition-colors text-left w-full flex items-center gap-[0.6vw] ${interactionType === opt.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          <IconComp size="0.85vw" className={interactionType === opt.id ? 'text-indigo-600' : 'text-gray-400'} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </>,
                document.body
              )}
            </div>

            {/* Trigger Selector */}
            {['tooltip'].includes(interactionType) && (
              <div className="relative">
                <button
                  ref={triggerTriggerRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTriggerDropdown(e);
                  }}
                  className="flex items-center gap-[0.4vw] px-[0.75vw] py-[0.4vw] bg-gray-100 hover:bg-gray-200 rounded-[0.5vw] transition-all group relative border border-gray-200"
                >
                  <span className="text-[0.75vw] font-semibold text-gray-700">{getTriggerLabel()}</span>
                  <ChevronDown size="0.85vw" className={`text-gray-500 transition-transform duration-300 ${showTriggerDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showTriggerDropdown && dropdownRect && ReactDOM.createPortal(
                  <>
                    <div className="fixed inset-0 z-[100000] cursor-default" onClick={(e) => {
                      e.stopPropagation();
                      setShowTriggerDropdown(false);
                    }} />
                    <div
                      ref={dropdownRef}
                      style={{
                        position: 'fixed',
                        left: Math.min(dropdownRect.left, window.innerWidth - 180),
                        zIndex: 100001,
                        ...(dropdownRect.bottom + 8 + 300 > window.innerHeight
                          ? { bottom: window.innerHeight - dropdownRect.top + 8 }
                          : { top: dropdownRect.bottom + 8 })
                      }}
                      className="w-[10vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl overflow-y-auto max-h-[20vw] flex flex-col py-[0.25vw] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
                      onClick={e => e.stopPropagation()}
                    >
                      {[
                        { id: 'click', label: 'On Click', icon: MousePointerClick },
                        { id: 'hover', label: 'On Hover', icon: Eye }
                      ].map((opt) => {
                        const IconComp = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerChange(opt.id);
                              setShowTriggerDropdown(false);
                            }}
                            className={`px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium transition-colors text-left w-full flex items-center gap-[0.6vw] ${interactionTrigger === opt.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                          >
                            <IconComp size="0.85vw" className={interactionTrigger === opt.id ? 'text-indigo-600' : 'text-gray-400'} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            )}

            {/* Show Preview Button */}
              {interactionType === 'popup' && popupText && (
                <button
                  onClick={() => {
                    // Decode content if it's encoded
                    let content = selectedElement.getAttribute('data-interaction-content') || '';
                    if (
                      selectedElement.getAttribute('data-interaction-content-encoded') === 'true' ||
                      content.startsWith('ENCODED:::')
                    ) {
                      try {
                        const raw = content.startsWith('ENCODED:::') ? content.substring(10) : content;
                        content = decodeURIComponent(raw);
                      } catch (e) {
                        console.warn('Failed to decode interaction content', e);
                        if (content.startsWith('ENCODED:::')) {
                          content = content.substring(10);
                        }
                      }
                    }

                    onPopupPreviewUpdate({
                      isOpen: true,
                      content: content,
                      elementSource: (selectedElement.tagName.toLowerCase() === 'img' ? selectedElement.src : null),
                      elementType: 'image',
                      renderId: Date.now(),
                      mode: 'preview',
                      styles: {
                        font: popupFont,
                        size: popupSize,
                        weight: popupWeight,
                        fill: popupFillColor,
                        fillOpacity: popupFillOpacity,
                        stroke: popupStrokeColor,
                        strokeOpacity: popupStrokeOpacity,
                        strokeType: popupStrokeType,
                        strokeWidth: popupStrokeWidth,
                        strokeDashLength: popupStrokeDashLength,
                        strokeDashGap: popupStrokeDashGap,
                        strokePosition: popupStrokePosition,
                        strokeRoundCorners: popupStrokeRoundCorners,
                        fit: popupFit,
                        autoWidth: popupAutoWidth,
                        autoHeight: popupAutoHeight
                      }
                    });
                  }}
                  className="flex items-center justify-center w-[2.5vw] h-[2.5vw] bg-indigo-50 border border-indigo-100 rounded-[0.8vw] text-indigo-600 hover:bg-indigo-100 transition-all ml-auto"
                  title="Preview"
                >
                  <ScanEye size="1.2vw" />
                </button>
              )}
            </div>



          {/* ================= SOURCE -> TARGET PREVIEW ================= */}
          <div className={`flex items-center justify-between gap-[1vw] ${isFrame ? 'py-[1vw] mb-[0.5vw] border-b border-gray-50 border-t border-gray-50' : 'py-[0.8vw] mb-[0.5vw]'}`}>
            {/* Source */}
            <div className={`${isFrame ? 'bg-[#F2F4F7] text-[#667085] px-[0.8vw] py-[0.4vw] rounded-[0.5vw] text-[0.8vw] font-medium shadow-sm' : 'bg-gray-100 text-gray-600 px-[0.6vw] py-[0.3vw] rounded-[0.4vw] text-[0.6vw] font-bold uppercase tracking-widest border border-gray-200/50 shadow-sm'} flex-shrink-0`}>
              {isFrame ? (frameLabel || 'Frame') : formattedElementName}
            </div>

            {/* Arrow */}
            <div className="flex-1 flex items-center justify-center pointer-events-none px-[0.5vw]">
              {isFrame ? (
                <div className="w-full h-[0.05vw] border-t border-dashed border-gray-300 relative">
                  <div className="absolute right-[-0.05vw] top-[-0.18vw] border-t-[0.2vw] border-l-[0.3vw] border-b-[0.2vw] border-t-transparent border-b-transparent border-l-gray-300"></div>
                </div>
              ) : (
                <div className="w-full relative py-[1vw]">
                  <div className="w-full h-0 border-t border-dashed border-gray-300"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[0.4vw] h-[0.4vw] border-t-[0.1vw] border-r-[0.1vw] border-gray-300 rotate-45"></div>
                </div>
              )}
            </div>

            {/* Target */}
            <div className="flex-shrink-0">
              {renderTargetInput()}
            </div>
          </div>


          {interactionType === 'popup' && activePopupElement === 'background' && (
            <div className="space-y-[1vw] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-[0.8vw]">
                <h3 className="text-[0.8vw] font-bold text-gray-900 whitespace-nowrap">Background Color</h3>
                <div className="h-[0.05vw] flex-grow bg-gray-200"></div>
              </div>

              {/* Background Color - Fill Row */}
              <div className="flex items-center gap-[0.8vw] relative">
                <span className="text-[0.75vw] font-medium text-gray-600 w-[2vw]">Fill</span>
                <span className="text-[0.75vw] font-medium text-gray-600">:</span>
                <div
                  onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); }}
                  className="w-[2.5vw] h-[2.5vw] rounded-[0.5vw] border border-gray-200 cursor-pointer shadow-sm relative color-picker-trigger fill-picker-trigger"
                  style={{ backgroundColor: popupFillColor }}
                >
                  {popupFillColor === 'none' && <div className="absolute inset-0 bg-white flex items-center justify-center overflow-hidden"><div className="w-[140%] h-[0.05vw] bg-red-500 rotate-45" /></div>}
                </div>
                <div className="flex-1 flex items-center border border-gray-300 rounded-[0.8vw] px-[0.8vw] py-[0.5vw] bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <input
                    type="text"
                    value={popupFillColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPopupFillColor(val);
                      if (/^#[0-9A-F]{6}$/i.test(val)) {
                        applyInteraction('popup', null, popupText, null, null, { fill: val });
                      }
                    }}
                    className="w-full bg-transparent text-[0.75vw] font-medium text-gray-700 outline-none uppercase"
                  />
                  <span
                    className="text-[0.7vw] font-medium text-gray-400 ml-[0.5vw] cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startVal = popupFillOpacity;
                      const handleMove = (moveEvent) => {
                        const diff = Math.round((moveEvent.clientX - startX) / 2);
                        const newVal = Math.min(100, Math.max(0, startVal + diff));
                        setPopupFillOpacity(newVal);
                        applyInteraction('popup', null, popupText, null, null, { fillOpacity: newVal });
                      };
                      const handleUp = () => {
                        window.removeEventListener('mousemove', handleMove);
                        window.removeEventListener('mouseup', handleUp);
                      };
                      window.addEventListener('mousemove', handleMove);
                      window.addEventListener('mouseup', handleUp);
                    }}
                  >{popupFillOpacity}%</span>
                </div>

                {/* Fill Picker Panel */}
                <div ref={fillPickerRef} className={`fixed top-1/2 -translate-y-1/2 right-[22.2vw] w-[19.4vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 z-[300] overflow-hidden flex flex-col max-h-[90vh] ${showFillPicker ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-[1vw] border-b border-gray-50 bg-white">
                    <span className="text-[0.8vw] font-bold text-gray-800">Fill Color</span>
                    <button 
                      onClick={() => {
                        setShowFillPicker(false);
                        setShowDetailedFillControls(false);
                      }}
                      className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                    >
                      <X size="1.1vw" />
                    </button>
                  </div>
                  {/* Body */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {/* Popover for Customize Colors */}
                    {showDetailedFillControls && createPortal(
                      <>
                        <div 
                          className="fixed inset-0 z-[100002] bg-transparent" 
                          onClick={() => setShowDetailedFillControls(false)}
                        ></div>
                        <ColorPicker 
                          className="fixed z-[100003] w-[18vw] color-picker-container"
                          style={{ 
                            top: '50%',
                            right: '6.5vw', 
                            transform: 'translateY(-50%)'
                          }}
                          color={popupFillColor === 'none' ? '#000000' : popupFillColor}
                          onChange={(val) => {
                             setPopupFillColor(val);
                             applyInteraction('popup', null, popupText, null, null, { fill: val });
                          }}
                          opacity={popupFillOpacity}
                          onOpacityChange={(val) => {
                             setPopupFillOpacity(val);
                             applyInteraction('popup', null, popupText, null, null, { fillOpacity: val });
                          }}
                          onClose={() => setShowDetailedFillControls(false)}
                        />
                      </>,
                      document.body
                    )}

                    <div className="p-[1vw] space-y-[1.5vw]">
                      {/* Colors on this page */}
                      <div className="space-y-[0.75vw]">
                        <div className="flex items-center gap-[0.75vw]">
                          <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Colors on this page</span>
                          <div className="h-[1px] flex-grow bg-gray-100"></div>
                        </div>
                        <div className="grid grid-cols-6 gap-[0.5vw]">
                          {colorsOnPage.map((c, i) => (
                            <div
                              key={i}
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                setPopupFillColor(c);
                                applyInteraction('popup', null, popupText, null, null, { fill: c });
                              }}
                              className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Solid Colors */}
                      <div className="space-y-[0.75vw]">
                        <div className="flex items-center gap-[0.75vw]">
                          <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Solid Colors</span>
                          <div className="h-[1px] flex-grow bg-gray-100"></div>
                        </div>
                        <div className="grid grid-cols-6 gap-[0.5vw]">
                          <div 
                            onClick={() => {
                              setPopupFillColor('#ffffff'); // Default to white for none? Or transparent? Usually none means remove.
                              // But logic here expects color. Let's use none string.
                              // Wait, popupFillColor is used in input. 
                              // If 'none', input shows none.
                              // Logic below handles 'none'.
                              setPopupFillColor('#ffffff'); // Reset to white usually on click 'none' button in simple picker? No, simple picker had a 'none' button.
                              // Let's add 'none' button explicitly.
                            }}
                            className="w-full aspect-square rounded-[0.5vw] border border-gray-200 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95 relative bg-white overflow-hidden hidden" 
                          >
                          </div>
                          {[
                            '#FFFFFF', '#000000', '#FF0000', '#FF9500', '#BF2121', '#FFFF00',
                            '#ADFF2F', '#228B22', '#008080', '#40E0D0', '#00CED1', '#008B8B',
                            '#ADD8E6', '#87CEEB', '#0000FF', '#000080', '#E6E6FA', '#FF00FF',
                            '#A9A9A9', '#D3D3D3', '#F5F5F5', '#333333'
                          ].map((c, i) => (
                            <div
                              key={i}
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                setPopupFillColor(c);
                                applyInteraction('popup', null, popupText, null, null, { fill: c });
                              }}
                              className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Toggle */}
                    <div className="mt-auto p-[0.75vw] border-t border-gray-100">
                      <button
                        onClick={() => setShowDetailedFillControls(!showDetailedFillControls)}
                        className="flex items-center gap-[0.75vw] px-[1vw] py-[0.6vw] hover:bg-gray-50 transition-all rounded-[0.75vw] w-full group"
                      >
                        <div className="w-[2vw] h-[2vw] rounded-full shadow-md group-hover:scale-110 transition-transform" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}></div>
                        <span className="text-[0.85vw] font-bold text-gray-600">Customize Colors</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Color - Stroke Row */}
              <div className="flex items-center gap-[0.8vw] relative">
                <span className="text-[0.75vw] font-medium text-gray-600 w-[2vw]">Stroke</span>
                <span className="text-[0.75vw] font-medium text-gray-600">:</span>
                <div
                  onClick={() => { setShowStrokePicker(!showStrokePicker); setShowFillPicker(false); }}
                  className="w-[2.5vw] h-[2.5vw] rounded-[0.5vw] border border-gray-300 cursor-pointer shadow-sm relative overflow-hidden flex items-center justify-center color-picker-trigger stroke-picker-trigger"
                  style={{ backgroundColor: popupStrokeColor === 'none' ? 'transparent' : popupStrokeColor }}
                >
                  {popupStrokeColor === 'none' && <div className="absolute inset-0 bg-white"><div className="w-[140%] h-[0.08vw] bg-red-500 rotate-[-45deg] opacity-80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>}
                </div>
                <div className="flex-1 flex items-center border border-gray-300 rounded-[0.8vw] px-[0.8vw] py-[0.5vw] bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <input
                    type="text"
                    value={popupStrokeColor === 'none' ? '#' : popupStrokeColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPopupStrokeColor(val);
                      if (/^#[0-9A-F]{6}$/i.test(val)) {
                        applyInteraction('popup', null, popupText, null, null, { stroke: val });
                      }
                    }}
                    className="w-full bg-transparent text-[0.75vw] font-medium text-gray-700 outline-none uppercase"
                  />
                  <span
                    className="text-[0.7vw] font-medium text-gray-400 ml-[0.5vw] cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startVal = popupStrokeOpacity;
                      const handleMove = (moveEvent) => {
                        const diff = Math.round((moveEvent.clientX - startX) / 2);
                        const newVal = Math.min(100, Math.max(0, startVal + diff));
                        setPopupStrokeOpacity(newVal);
                        applyInteraction('popup', null, popupText, null, null, { strokeOpacity: newVal });
                      };
                      const handleUp = () => {
                        window.removeEventListener('mousemove', handleMove);
                        window.removeEventListener('mouseup', handleUp);
                      };
                      window.addEventListener('mousemove', handleMove);
                      window.addEventListener('mouseup', handleUp);
                    }}
                  >{popupStrokeOpacity}%</span>
                </div>

                {/* Stroke Picker Panel */}
                <div ref={strokePickerRef} className={`fixed top-1/2 -translate-y-1/2 right-[22.2vw] w-[19.4vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 z-[300] overflow-hidden flex flex-col max-h-[90vh] ${showStrokePicker ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-[1vw] border-b border-gray-50 bg-white">
                    <span className="text-[0.8vw] font-bold text-gray-800">Stroke Color</span>
                    <button 
                      onClick={() => {
                         setPopupStrokeColor('none');
                         applyInteraction('popup', null, popupText, null, null, { stroke: 'none' });
                      }}
                      className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all"
                      title="Reset / None"
                    >
                      <RotateCcw size="1vw" />
                    </button>
                    <button 
                      onClick={() => {
                        setShowStrokePicker(false);
                        setShowDetailedStrokeControls(false);
                      }}
                      className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                    >
                      <X size="1.1vw" />
                    </button>
                  </div>
                  {/* Body */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {/* Popover for Customize Colors */}
                    {showDetailedStrokeControls && createPortal(
                      <>
                        <div 
                          className="fixed inset-0 z-[100002] bg-transparent" 
                          onClick={() => setShowDetailedStrokeControls(false)}
                        ></div>
                        <ColorPicker 
                          className="fixed z-[100003] w-[18vw] color-picker-container"
                          style={{ 
                            top: '50%',
                            right: '6.5vw', 
                            transform: 'translateY(-50%)'
                          }}
                          color={popupStrokeColor === 'none' ? '#000000' : popupStrokeColor}
                          onChange={(val) => {
                             setPopupStrokeColor(val);
                             applyInteraction('popup', null, popupText, null, null, { stroke: val });
                          }}
                          opacity={popupStrokeOpacity}
                          onOpacityChange={(val) => {
                             setPopupStrokeOpacity(val);
                             applyInteraction('popup', null, popupText, null, null, { strokeOpacity: val });
                          }}
                          onClose={() => setShowDetailedStrokeControls(false)}
                        />
                      </>,
                      document.body
                    )}

                    <div className="p-[1vw] space-y-[1.5vw]">
                      {/* Colors on this page */}
                      <div className="space-y-[0.75vw]">
                        <div className="flex items-center gap-[0.75vw]">
                          <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Colors on this page</span>
                          <div className="h-[1px] flex-grow bg-gray-100"></div>
                        </div>
                        <div className="grid grid-cols-6 gap-[0.5vw]">
                          {colorsOnPage.map((c, i) => (
                            <div
                              key={i}
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                setPopupStrokeColor(c);
                                applyInteraction('popup', null, popupText, null, null, { stroke: c });
                              }}
                              className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Solid Colors */}
                      <div className="space-y-[0.75vw]">
                        <div className="flex items-center gap-[0.75vw]">
                          <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Solid Colors</span>
                          <div className="h-[1px] flex-grow bg-gray-100"></div>
                        </div>
                        <div className="grid grid-cols-6 gap-[0.5vw]">
                           <div 
                            onClick={() => {
                              setPopupStrokeColor('none');
                              applyInteraction('popup', null, popupText, null, null, { stroke: 'none' });
                            }}
                            className="w-full aspect-square rounded-[0.5vw] border border-gray-200 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95 relative bg-white overflow-hidden"
                            title="None"
                          >
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45"></div>
                          </div>
                          {[
                            '#FFFFFF', '#000000', '#FF0000', '#FF9500', '#BF2121', '#FFFF00',
                            '#ADFF2F', '#228B22', '#008080', '#40E0D0', '#00CED1', '#008B8B',
                            '#ADD8E6', '#87CEEB', '#0000FF', '#000080', '#E6E6FA', '#FF00FF',
                            '#A9A9A9', '#D3D3D3', '#F5F5F5', '#333333'
                          ].map((c, i) => (
                            <div
                              key={i}
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                setPopupStrokeColor(c);
                                applyInteraction('popup', null, popupText, null, null, { stroke: c });
                              }}
                              className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Toggle */}
                    <div className="mt-auto p-[0.75vw] border-t border-gray-100">
                      <button
                        onClick={() => setShowDetailedStrokeControls(!showDetailedStrokeControls)}
                        className="flex items-center gap-[0.75vw] px-[1vw] py-[0.6vw] hover:bg-gray-50 transition-all rounded-[0.75vw] w-full group"
                      >
                        <div className="w-[2vw] h-[2vw] rounded-full shadow-md group-hover:scale-110 transition-transform" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}></div>
                        <span className="text-[0.85vw] font-bold text-gray-600">Customize Colors</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stroke Options */}
              <div className="flex items-center gap-[0.8vw]">
                <div
                  className="p-[0.5vw] rounded-[0.5vw] hover:bg-indigo-50 transition-colors cursor-pointer group dashed-selector-trigger"
                  onClick={() => setShowDashedSettings(!showDashedSettings)}
                >
                  <SlidersHorizontal size="1.1vw" className={`transition-colors ${showDashedSettings ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                </div>
                <div className="flex-1 relative">
                  <select
                    value={popupStrokeType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPopupStrokeType(val);
                      applyInteraction('popup', null, popupText, null, null, { strokeType: val });
                    }}
                    className="w-full h-[2.5vw] bg-white border border-gray-300 rounded-[0.8vw] px-[0.8vw] text-[0.75vw] font-medium text-gray-700 appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="dashed">Dashed</option>
                    <option value="solid">Solid</option>
                  </select>
                  <ChevronDown size="0.9vw" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div
                  className="w-[4vw] h-[2.5vw] border border-gray-300 rounded-[0.8vw] flex items-center px-[0.5vw] gap-[0.5vw] bg-white hover:border-indigo-400 transition-all cursor-ew-resize select-none shadow-sm"
                  onMouseDown={(e) => {
                    if (e.target.tagName === 'INPUT') return;
                    e.preventDefault();
                    const startX = e.clientX;
                    const startVal = popupStrokeWidth || 0;
                    const handleMove = (moveEvent) => {
                      const diff = Math.round((moveEvent.clientX - startX) / 10);
                      const newVal = Math.max(0, startVal + diff);
                      setPopupStrokeWidth(newVal);
                      applyInteraction('popup', null, popupText, null, null, { strokeWidth: newVal });
                    };
                    const handleUp = () => {
                      window.removeEventListener('mousemove', handleMove);
                      window.removeEventListener('mouseup', handleUp);
                    };
                    window.addEventListener('mousemove', handleMove);
                    window.addEventListener('mouseup', handleUp);
                  }}
                >
                  <Icon icon="material-symbols:line-weight" className="text-gray-400 flex-shrink-0" width="1.1vw" />
                  <input
                    type="number"
                    value={popupStrokeWidth}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setPopupStrokeWidth(val);
                      applyInteraction('popup', null, popupText, null, null, { strokeWidth: val });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-[0.75vw] font-medium text-gray-700 outline-none text-center cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Advanced Dashed Settings Portal */}
              {showDashedSettings && ReactDOM.createPortal(
                <div
                  ref={dashedRef}
                  className="fixed right-[22vw] top-[40%] translate-y-0 w-[18vw] bg-white border border-gray-100 rounded-[2vw] shadow-[0_1.5vw_4vw_rgba(0,0,0,0.2)] z-[100002] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                  style={{ transform: 'translateX(-1.5vw)' }}
                >
                  <div className="p-[1.5vw] space-y-[1.2vw]">
                    <div className="flex items-center gap-[0.8vw]">
                      <span className="font-bold text-[0.9vw] text-[#2D3748]">Dashed</span>
                      <div className="h-[0.05vw] flex-grow bg-gray-100"></div>
                    </div>

                    <div className="space-y-[1vw]">
                      {/* Position */}
                      <div className="flex items-center justify-between">
                        <span className="text-[0.85vw] font-medium text-[#4A5568]">Position :</span>
                        <div className="relative" ref={strokePositionRef}>
                          <div
                            onClick={() => setShowStrokePositionDropdown(!showStrokePositionDropdown)}
                            className="w-[8vw] h-[2.5vw] px-[0.8vw] bg-white border border-gray-200 rounded-[0.8vw] flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all shadow-sm"
                          >
                            <span className="text-[0.8vw] font-bold text-[#2D3748] capitalize">{popupStrokePosition}</span>
                            <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showStrokePositionDropdown ? 'rotate-180' : ''}`} />
                          </div>
                          {showStrokePositionDropdown && (
                            <div className="absolute top-full left-0 w-full mt-[0.2vw] bg-white border border-gray-100 rounded-[0.8vw] shadow-xl z-50 py-[0.2vw] overflow-hidden">
                              {['outside', 'center', 'inside'].map(pos => (
                                <div
                                  key={pos}
                                  onClick={() => {
                                    setPopupStrokePosition(pos);
                                    applyInteraction('popup', null, popupText, null, null, { strokePosition: pos });
                                    setShowStrokePositionDropdown(false);
                                  }}
                                  className={`px-[1vw] py-[0.5vw] text-[0.8vw] hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer capitalize font-bold transition-colors ${popupStrokePosition === pos ? 'text-indigo-600 bg-indigo-50' : 'text-[#4A5568]'}`}
                                >
                                  {pos}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="h-[0.05vw] w-full bg-gray-50"></div>

                      {/* Length */}
                      <div className="flex items-center justify-between">
                        <span className="text-[0.85vw] font-medium text-[#4A5568]">Length :</span>
                        <div className="flex items-center gap-[0.2vw]">
                          <button
                            onClick={() => {
                              const newVal = Math.max(1, popupStrokeDashLength - 1);
                              setPopupStrokeDashLength(newVal);
                              applyInteraction('popup', null, popupText, null, null, { strokeDashLength: newVal });
                            }}
                            className="w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:text-indigo-600 transition-colors text-gray-400"
                          ><ChevronLeft size="1vw" /></button>
                          <div className="w-[3vw] h-[2.2vw] border border-gray-200 rounded-[0.6vw] flex items-center justify-center font-bold text-[0.85vw] text-[#2D3748] bg-white shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.05)]">
                            {popupStrokeDashLength}
                          </div>
                          <button
                            onClick={() => {
                              const newVal = popupStrokeDashLength + 1;
                              setPopupStrokeDashLength(newVal);
                              applyInteraction('popup', null, popupText, null, null, { strokeDashLength: newVal });
                            }}
                            className="w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:text-indigo-600 transition-colors text-gray-400"
                          ><ChevronRight size="1vw" /></button>
                        </div>
                      </div>

                      {/* Gap */}
                      <div className="flex items-center justify-between">
                        <span className="text-[0.85vw] font-medium text-[#4A5568]">Gap :</span>
                        <div className="flex items-center gap-[0.2vw]">
                          <button
                            onClick={() => {
                              const newVal = Math.max(1, popupStrokeDashGap - 1);
                              setPopupStrokeDashGap(newVal);
                              applyInteraction('popup', null, popupText, null, null, { strokeDashGap: newVal });
                            }}
                            className="w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:text-indigo-600 transition-colors text-gray-400"
                          ><ChevronLeft size="1vw" /></button>
                          <div className="w-[3vw] h-[2.2vw] border border-gray-200 rounded-[0.6vw] flex items-center justify-center font-bold text-[0.85vw] text-[#2D3748] bg-white shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.05)]">
                            {popupStrokeDashGap}
                          </div>
                          <button
                            onClick={() => {
                              const newVal = popupStrokeDashGap + 1;
                              setPopupStrokeDashGap(newVal);
                              applyInteraction('popup', null, popupText, null, null, { strokeDashGap: newVal });
                            }}
                            className="w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:text-indigo-600 transition-colors text-gray-400"
                          ><ChevronRight size="1vw" /></button>
                        </div>
                      </div>

                      <div className="h-[0.05vw] w-full bg-gray-50"></div>

                      {/* Round Corners */}
                      <div className="flex items-center justify-between">
                        <span className="text-[0.85vw] font-medium text-[#4A5568]">Round Corners :</span>
                        <div
                          onClick={() => {
                            const newVal = !popupStrokeRoundCorners;
                            setPopupStrokeRoundCorners(newVal);
                            applyInteraction('popup', null, popupText, null, null, { strokeRoundCorners: newVal });
                          }}
                          className={`w-[2.8vw] h-[1.5vw] rounded-full p-[0.2vw] cursor-pointer transition-colors duration-200 ${popupStrokeRoundCorners ? 'bg-indigo-600' : 'bg-gray-200 shadow-inner'}`}
                        >
                          <div className={`w-[1.1vw] h-[1.1vw] bg-white rounded-full transition-transform duration-200 shadow-sm ${popupStrokeRoundCorners ? 'translate-x-[1.3vw]' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}

          {/* ================= ADVANCED EDITOR ================= */}
          {renderAdvancedEditor()}

          {/* ================= FOOTER ================= */}
          {!isFrame ? (
            <div className="pt-[1.5vw] mt-[1vw] border-t border-gray-100 flex items-center gap-[0.8vw]">
              <span className="text-[0.8vw] text-gray-600 font-semibold">
                Highlight the Component
              </span>
              <div
                onClick={() => {
                  const newVal = !isHighlighted;
                  setIsHighlighted(newVal);
                  const currentValue =
                    interactionType === 'link' ? linkUrl :
                      interactionType === 'navigation' ? navPage :
                        interactionType === 'call' ? phoneNumber :
                          interactionType === 'zoom' ? zoomLevel :
                            interactionType === 'download' ? downloadUrl : null;

                  const currentContent =
                    interactionType === 'popup' ? popupText :
                      interactionType === 'tooltip' ? tooltipText : '';

                  setTimeout(() => applyInteraction(interactionType, currentValue, currentContent, null, newVal), 0);
                }}
                className={`relative w-[2vw] h-[1vw] rounded-full transition-colors duration-200 cursor-pointer ${isHighlighted ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-[0.1vw] left-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-transform duration-200 shadow-sm ${isHighlighted ? 'translate-x-[1vw]' : 'translate-x-0'}`} />
              </div>
            </div>
          ) : (
            <div className="pt-[1vw] flex items-center justify-between">
              <div
                className="flex items-center gap-[0.8vw] cursor-pointer group"
                onClick={() => {
                  const newVal = !isHighlighted;
                  setIsHighlighted(newVal);
                  const currentValue =
                    interactionType === 'link' ? linkUrl :
                      interactionType === 'navigation' ? navPage :
                        interactionType === 'call' ? phoneNumber :
                          interactionType === 'zoom' ? zoomLevel :
                            interactionType === 'download' ? downloadUrl : null;

                  const currentContent =
                    interactionType === 'popup' ? popupText :
                      interactionType === 'tooltip' ? tooltipText : '';

                  setTimeout(() => applyInteraction(interactionType, currentValue, currentContent, null, newVal), 0);
                }}
              >
                <div className={`w-[1.2vw] h-[1.2vw] rounded-full border-[0.15vw] flex items-center justify-center transition-all ${isHighlighted ? 'border-indigo-600' : 'border-gray-300'}`}>
                  {isHighlighted && <div className="w-[0.6vw] h-[0.6vw] bg-indigo-600 rounded-full" />}
                </div>
                <span className="text-[0.85vw] font-medium text-gray-700">Highlight the Component</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedElement && selectedElement.remove) {
                    selectedElement.remove();
                    if (onUpdate) onUpdate(selectedElement.id, { isDeleted: true });
                  }
                }}
                className="p-[0.5vw] text-red-500 hover:bg-red-50 rounded-[0.5vw] transition-all"
                title="Delete Frame"
              >
                <Trash2 size="1.2vw" strokeWidth={2.5} />
              </button>
            </div>
          )}

        </div>
      )}

      {isTemplateSelectionOpen && (
        <PopupTemplateSelection
          onClose={handleCloseTemplateSelection}
          onSelect={handleTemplateSelect}
        />
      )}
    </div>
  );
};

export default React.memo(InteractionPanel);