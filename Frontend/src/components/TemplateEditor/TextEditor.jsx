import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ColorPicker, { parseGradient } from './ColorPicker';
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import ShapeProperties from './ShapeProperties';

import { Icon } from '@iconify/react';
import {
  ChevronDown, PencilLine, AlignLeft, Bold, Minus, List,
  ChevronUp, Settings2, ArrowsUpFromLine,
  AlignCenter, AlignRight, AlignJustify, Italic, Underline,
  Strikethrough, Type, ListOrdered, RotateCcw, X, Pipette,
  ChevronLeft, ChevronRight, Star, Zap, Eye,
  ArrowLeftRight, ArrowUpDown, SlidersHorizontal,
  CaseUpper, CaseLower, Palette, Edit3
} from 'lucide-react';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const fontWeights = [
  { name: 'Thin', value: '50' },
  { name: 'Extra Light', value: '100' },
  { name: 'Light', value: '200' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '800' }
  
];

// Color conversion helpers
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase();
};

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
      default: break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v };
};

const hsvToRgb = (h, s, v) => {
  h /= 360;
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    default: break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};



// Shared mapping for CSS properties
const STYLE_MAP = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  fontStyle: 'fontStyle',
  textDecoration: 'textDecoration',
  textAlign: 'textAlign',
  letterSpacing: 'letterSpacing',
  lineHeight: 'lineHeight',
  textTransform: 'textTransform',
  listStyleType: 'listStyleType',
  fill: 'fill',
  stroke: 'stroke'
};

// Maps React/camelCase property names to SVG presentation attribute names
const SVG_ATTR_MAP = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  fontStyle: 'font-style',
  textDecoration: 'text-decoration',
  textAlign: 'text-anchor',
  letterSpacing: 'letter-spacing',
  lineHeight: 'line-height',
  textTransform: 'text-transform',
  fill: 'fill',
  stroke: 'stroke'
};

// Converts textAlign CSS values to SVG text-anchor values
const TEXT_ALIGN_TO_ANCHOR = {
  left: 'start',
  center: 'middle',
  right: 'end',
  start: 'start',
  middle: 'middle',
  end: 'end',
};

const syncGradient = (doc, element, baseAttr) => {
  const type = element.getAttribute(`${baseAttr}-type`);
  const currentValue = element.getAttribute(baseAttr);
  const isUrl = currentValue && currentValue.toLowerCase().startsWith('url(#');
  const gradType = element.getAttribute(`${baseAttr}-gradient-type`) || 'linear';
  const stopsJson = element.getAttribute(`${baseAttr}-stops`);
  
  console.log(`[syncGradient] id=${element.id}, type=${type}, isUrl=${isUrl}, attr=${baseAttr}`);

  if (type === 'solid' || type === 'none') return;
  
  // If it's a URL, we should at least propagate it to children even if we can't "sync" it from stops
  if (isUrl && !stopsJson) {
     console.log(`[syncGradient] Propagating global URL: ${currentValue}`);
     if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
        Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
           child.setAttribute(baseAttr, currentValue);
           if (child.style) child.style.setProperty(baseAttr, currentValue, 'important');
        });
     }
     return;
  }

  if (!type && !isUrl) return;
  if (!stopsJson) return;

  let stops = [];
  try { stops = JSON.parse(stopsJson); } catch (e) { return; }

  const svgRoot = doc.querySelector('svg') || (doc.tagName?.toLowerCase() === 'svg' ? doc : null);
  if (!svgRoot) return;

  const ownerDoc = doc.ownerDocument || doc;

  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  if (!element.id) {
    element.id = `${element.tagName}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cache-busting: Remove any existing gradients for this element to force a fresh render
  const gradIdPrefix = `grad-${element.id}-${baseAttr}`;
  Array.from(defs.querySelectorAll(`[id^="${gradIdPrefix}"]`)).forEach(oldGrad => oldGrad.remove());

  const gradId = `${gradIdPrefix}-${Math.random().toString(36).substr(2, 4)}`;
  let gradEl = null;
  
  const svgGradType = (gradType === 'angular' || gradType === 'diamond') ? (gradType === 'angular' ? 'linear' : 'radial') : gradType;

  if (gradEl && gradEl.tagName.toLowerCase() !== `${svgGradType}gradient`.toLowerCase()) {
    gradEl.remove();
    gradEl = null;
  }

  if (!gradEl) {
    gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", `${svgGradType}Gradient`);
    gradEl.id = gradId;
    // Calculate angle for linear gradients
    if (svgGradType === 'linear') {
      const angle = parseFloat(element.getAttribute(`${baseAttr}-angle`) || '0');
      // Convert angle to SVG coordinates (0 deg is horizontal left-to-right)
      const angleRad = (angle * Math.PI) / 180;
      const x1 = Math.round(50 - Math.cos(angleRad) * 50) + '%';
      const y1 = Math.round(50 - Math.sin(angleRad) * 50) + '%';
      const x2 = Math.round(50 + Math.cos(angleRad) * 50) + '%';
      const y2 = Math.round(50 + Math.sin(angleRad) * 50) + '%';
      
      gradEl.setAttribute('x1', x1);
      gradEl.setAttribute('y1', y1);
      gradEl.setAttribute('x2', x2);
      gradEl.setAttribute('y2', y2);
    } else {
      const radius = parseFloat(element.getAttribute(`${baseAttr}-radius`) || '50');
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', radius + '%');
    }
    defs.appendChild(gradEl);
  } else if (svgGradType === 'linear') {
    // Update existing linear gradient angle
    const angle = parseFloat(element.getAttribute(`${baseAttr}-angle`) || '0');
    const angleRad = (angle * Math.PI) / 180;
    gradEl.setAttribute('x1', Math.round(50 - Math.cos(angleRad) * 50) + '%');
    gradEl.setAttribute('y1', Math.round(50 - Math.sin(angleRad) * 50) + '%');
    gradEl.setAttribute('x2', Math.round(50 + Math.cos(angleRad) * 50) + '%');
    gradEl.setAttribute('y2', Math.round(50 + Math.sin(angleRad) * 50) + '%');
  } else {
    const radius = parseFloat(element.getAttribute(`${baseAttr}-radius`) || '50');
    gradEl.setAttribute('cx', '50%');
    gradEl.setAttribute('cy', '50%');
    gradEl.setAttribute('r', radius + '%');
  }

  while (gradEl.firstChild) gradEl.removeChild(gradEl.firstChild);
  stops.forEach(s => {
    const stop = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute('offset', `${s.offset}%`);
    stop.setAttribute('stop-color', s.color);
    stop.setAttribute('stop-opacity', (s.opacity !== undefined && s.opacity !== null) ? s.opacity : 1);
    gradEl.appendChild(stop);
  });

  const finalUrl = `url(#${gradId})`;
  element.setAttribute(baseAttr, finalUrl);
  if (element.style) {
    element.style.setProperty(baseAttr, finalUrl, 'important');
  }
  
  // Force inheritance for all nested children
  if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
     Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
        child.setAttribute(baseAttr, finalUrl);
        if (child.style) {
          child.style.setProperty(baseAttr, finalUrl, 'important');
        }
     });
  }
};

const syncTextEffect = (doc, element) => {
  if (!element) return;
  
  // Clear any stale filters on children to prevent double-shadowing
  if (element.tagName.toLowerCase() === 'text' || element.tagName.toLowerCase() === 'g') {
     Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
        child.style.removeProperty('filter');
     });
  }
  
  let filterString = "";
  let backdropFilterString = "";
  
  // 1. Drop Shadow
  if (element.getAttribute('data-effect-drop-shadow') === 'true') {
    const x = element.getAttribute('data-effect-drop-shadow-x') || '0';
    const y = element.getAttribute('data-effect-drop-shadow-y') || '4';
    const blur = element.getAttribute('data-effect-drop-shadow-blur') || '4';
    const color = element.getAttribute('data-effect-drop-shadow-color') || '#000000';
    const opacity = parseFloat(element.getAttribute('data-effect-drop-shadow-opacity') || '35') / 100;
    
    // Basic hex to rgb
    let r = 0, g = 0, b = 0;
    if (color.length === 7) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
    
    filterString += `drop-shadow(${x}px ${y}px ${blur}px rgba(${r}, ${g}, ${b}, ${opacity})) `;
  }
  
  // 2. Blur
  if (element.getAttribute('data-effect-blur') === 'true') {
    const blur = element.getAttribute('data-effect-blur-value') || '4';
    filterString += `blur(${blur}px) `;
  }

  // 3. Background Blur (backdrop-filter)
  if (element.getAttribute('data-effect-background-blur') === 'true') {
    const blur = element.getAttribute('data-effect-background-blur-value') || '4';
    backdropFilterString = `blur(${blur}px)`;
  }
  
  const finalFilter = filterString.trim() || 'none';
  element.style.setProperty('filter', finalFilter, 'important');
  
  if (backdropFilterString) {
      element.style.setProperty('backdrop-filter', backdropFilterString, 'important');
      element.style.setProperty('-webkit-backdrop-filter', backdropFilterString, 'important');
  } else {
      element.style.removeProperty('backdrop-filter');
      element.style.removeProperty('-webkit-backdrop-filter');
  }
};

const TextEditor = ({
  selectedElement,
  selectedElementType,
  onUpdate,
  onPopupPreviewUpdate,
  closePanelsSignal,
  pages,
  setPages,
  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  activePageIndex
}) => {
  // Accordian State: 'main' or 'interaction' or null
  const [activeSection, setActiveSection] = useState('main');
  const isTextOpen = activeSection === 'main';
  const isInteractionOpen = activeSection === 'interaction';
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTextareaEditable, setIsTextareaEditable] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);






  // Guard ref to track current syncing status
  const lastSelectedElementRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Typing debounce refs — prevents canvas re-render on every keystroke
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);

  // Refs
  const [activePanel, setActivePanel] = useState(null);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showWeightDropdown, setShowWeightDropdown] = useState(false);
  const [showBorderStyleDropdown, setShowBorderStyleDropdown] = useState(false);
  const [showStrokePositionDropdown, setShowStrokePositionDropdown] = useState(false);

  const [textContent, setTextContent] = useState('SIPPER GLASS');
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState('600');
  const [textAlign, setTextAlign] = useState('left');
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('none');
  const [textTransform, setTextTransform] = useState('none');
  const [listStyleType, setListStyleType] = useState('none');
  const textareaRef = useRef(null);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

  const strokePositionRef = useRef(null);
  const dropdownRef = useRef(null);
  const weightRef = useRef(null);
  const dashedRef = useRef(null);
  const borderStyleRef = useRef(null);
  const fontSizeRef = useRef(null);
  const alignmentRef = useRef(null);
  const styleRef = useRef(null);
  const caseRef = useRef(null);
  const listRef = useRef(null);

  // --- HELPER FUNCTIONS ---

  const escapeSvg = (str) => {
    return str.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return m;
      }
    });
  };

  const applyDesign = useCallback((shouldNotify = true) => {
    // Logic removed - UI only
  }, []);

  const selectedLayerId = useMemo(() => {
    if (!selectedElement) return null;
    const elWithId = selectedElement.id ? selectedElement : selectedElement.closest('[id]');
    return elWithId?.id;
  }, [selectedElement]);

  // Sync scrollable state from element
  useEffect(() => {
    if (selectedElement) {
      const el = document.getElementById(selectedLayerId);
      if (el) {
        setIsScrollable(el.getAttribute('data-scrollable') === 'true');
      }
    }
  }, [selectedElement, selectedLayerId]);

  const selectedElementProps = useMemo(() => {
    if (!selectedLayerId || !pages[activePageIndex]) return null;
    
    // Find the element in the actual DOM to get computed values if needed
    const el = document.getElementById(selectedLayerId);
    if (!el) return null;

    const props = {
      id: selectedLayerId,
      tagName: 'rect', // Force to 'rect' so ShapeProperties shows Corner Radius accordion
      'data-shape-type': 'rectangle', // Force to 'rectangle' for the same reason
      fill: el.getAttribute('fill') || (el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild ? window.getComputedStyle(el.firstElementChild).color : null) || '#000000',
      stroke: el.getAttribute('stroke') || 'none',
      strokeWidth: el.getAttribute('stroke-width') || '0',
      strokeDasharray: el.getAttribute('stroke-dasharray') || 'none',
      opacity: el.getAttribute('opacity') || '1',
      rx: el.getAttribute('rx') || '0',
      ry: el.getAttribute('ry') || '0',
      'data-tl': el.getAttribute('data-tl') || '0',
      'data-tr': el.getAttribute('data-tr') || '0',
      'data-bl': el.getAttribute('data-bl') || '0',
      'data-br': el.getAttribute('data-br') || '0',
      'data-corner-linked': el.getAttribute('data-corner-linked') || 'true'
    };

    // Extract all data- attributes and fill/stroke extras
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('data-') || attr.name.includes('fill-') || attr.name.includes('stroke-')) {
        props[attr.name] = attr.value;
      }
    });

    return props;
  }, [selectedLayerId, pages, activePageIndex]);

  const updateElementAttributeLocal = (pageIdx, elId, attribute, value) => {
    // Immediate Live Feedback for DOM and Overlay
    const liveEl = document.getElementById(elId);
    const styleProp = STYLE_MAP[attribute];
    const finalVal = (attribute === 'fontSize' || attribute === 'letterSpacing') && !value?.toString().includes('px') && !value?.toString().includes('em') ? `${value}px` : value;

    if (liveEl && styleProp) {
      const liveTag = liveEl.tagName.toLowerCase();
      console.log(`[TextEditor] Live update: tag=${liveTag}, id=${elId}, attr=${attribute}, val=${value}`);
      
      if (liveTag === 'foreignobject') {
        const liveProp = styleProp === 'fill' ? 'color' : styleProp;
        if (liveEl.firstElementChild) {
          liveEl.firstElementChild.style.setProperty(liveProp, finalVal, 'important');
          Array.from(liveEl.firstElementChild.querySelectorAll('*')).forEach(child => {
             child.style.setProperty(liveProp, finalVal, 'important');
          });
        }
      } else {
        liveEl.style.setProperty(styleProp, finalVal, 'important');
        if (attribute === 'fill' || attribute === 'stroke') {
          liveEl.setAttribute(attribute, value);
        }
        if (liveTag === 'text' || liveTag === 'g') {
          Array.from(liveEl.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
            child.style.setProperty(styleProp, finalVal, 'important');
            child.setAttribute(attribute, value);
          });
        }
      }

      // Update active editing overlay
      const svgRoot = liveEl.ownerSVGElement || liveEl.closest('svg');
      const overlay = svgRoot?.querySelector('foreignObject[data-editing="true"] [contenteditable]');
      if (overlay) {
        const overlayProp = styleProp === 'fill' ? 'color' : styleProp;
        overlay.style.setProperty(overlayProp, finalVal, 'important');
      }

      // --- CUSTOM SCROLLABLE & CORNER RADIUS HANDLING ---
      if (liveTag === 'foreignobject' && liveEl.firstElementChild) {
        const isCurrentlyScrollable = liveEl.getAttribute('data-scrollable') === 'true' || attribute === 'data-scrollable' && value === 'true';
        
        if (attribute === 'data-scrollable') {
          if (value === 'true') {
            liveEl.firstElementChild.style.overflowY = 'auto';
            liveEl.firstElementChild.style.height = '100%';
            liveEl.firstElementChild.style.overflowX = 'hidden';
            const rx = liveEl.getAttribute('rx') || '0';
            liveEl.firstElementChild.style.borderRadius = `${rx}px`;
            
            // Apply border to make corner radius visible
            const stroke = liveEl.getAttribute('stroke') || '#6366F1';
            const strokeWidth = liveEl.getAttribute('stroke-width') || '1';
            liveEl.firstElementChild.style.border = `${strokeWidth}px solid ${stroke}`;
          } else {
            liveEl.firstElementChild.style.overflowY = 'visible';
            liveEl.firstElementChild.style.height = 'auto';
            liveEl.firstElementChild.style.borderRadius = '0';
            liveEl.firstElementChild.style.border = 'none';
          }
        }

        if ((attribute === 'rx' || attribute === 'ry') && isCurrentlyScrollable) {
          liveEl.firstElementChild.style.borderRadius = `${value}px`;
        }
        
        if ((attribute === 'stroke' || attribute === 'stroke-width') && isCurrentlyScrollable) {
          const s = attribute === 'stroke' ? value : (liveEl.getAttribute('stroke') || '#6366F1');
          const sw = attribute === 'stroke-width' ? value : (liveEl.getAttribute('stroke-width') || '1');
          liveEl.firstElementChild.style.border = `${sw}px solid ${s}`;
        }
      }
    }

    // Functional State Update (State of Truth)
    setPages(prevPages => {
      const newPages = [...prevPages];
      const page = { ...newPages[pageIdx] };
      if (!page || !page.html) return prevPages;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.getElementById(elId);

      if (element) {
        // Sync text from DOM first
        if (liveEl) {
          const latestContent = getDeepContent(liveEl);
          const tag = element.tagName.toLowerCase();
          if (tag === 'text') {
            // Preserve original tspan x/y so text doesn't drift
            const origFirstTspan = element.querySelector('tspan');
            const origTspanX = origFirstTspan ? origFirstTspan.getAttribute('x') : null;
            const origTspanY = origFirstTspan ? origFirstTspan.getAttribute('y') : null;
            const origTspanDy = origFirstTspan ? origFirstTspan.getAttribute('dy') : null;
            element.innerHTML = '';
            const lines = latestContent.split('\n');
            const x = origTspanX !== null ? origTspanX : (element.getAttribute('x') || '0');
            const lh = element.getAttribute('data-line-height') || '1.2';
            lines.forEach((line, i) => {
              const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
              tspan.textContent = line || '\u00A0';
              tspan.setAttribute('x', x);
              if (i === 0) {
                if (origTspanY !== null) tspan.setAttribute('y', origTspanY);
                if (origTspanDy !== null) tspan.setAttribute('dy', origTspanDy);
              } else {
                tspan.setAttribute('dy', `${parseFloat(lh).toFixed(2)}em`);
              }
              element.appendChild(tspan);
            });
          } else if (tag === 'foreignobject' && element.firstElementChild) {
            element.firstElementChild.innerHTML = latestContent.replace(/\n/g, '<br/>');
          }
        }

        const tag = element.tagName.toLowerCase();
        if (attribute === 'innerText' || attribute === 'innerHTML') {
            // ... (rest of text update logic same as before) ...
            if (tag === 'foreignobject' && element.firstElementChild) {
              element.firstElementChild.innerHTML = value.replace(/\n/g, '<br/>');
            } else if (tag === 'text') {
              // Preserve original tspan x/y so text doesn't drift
              const origFirstTspan2 = element.querySelector('tspan');
              const origTspanX2 = origFirstTspan2 ? origFirstTspan2.getAttribute('x') : null;
              const origTspanY2 = origFirstTspan2 ? origFirstTspan2.getAttribute('y') : null;
              const origTspanDy2 = origFirstTspan2 ? origFirstTspan2.getAttribute('dy') : null;
              element.innerHTML = '';
              const lines = value.split('\n');
              const xVal = origTspanX2 !== null ? origTspanX2 : (element.getAttribute('x') || '0');
              lines.forEach((line, i) => {
                const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.textContent = line || '\u00A0';
                tspan.setAttribute('x', xVal);
                if (i === 0) {
                  if (origTspanY2 !== null) tspan.setAttribute('y', origTspanY2);
                  if (origTspanDy2 !== null) tspan.setAttribute('dy', origTspanDy2);
                } else {
                  tspan.setAttribute('dy', '1.2em');
                }
                element.appendChild(tspan);
              });
            }
        } else if (attribute === 'data-scrollable' && value === 'true' && tag === 'text') {
           const bbox = liveEl?.getBBox() || { x: 0, y: 0, width: 100, height: 50 };
           const x = element.getAttribute('x') || bbox.x;
           const y = element.getAttribute('y') || bbox.y;
           const w = bbox.width || 100;
           const h = bbox.height || 50;
           
           const newFo = doc.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
           newFo.id = element.id;
           newFo.setAttribute('x', x);
           newFo.setAttribute('y', y);
           newFo.setAttribute('width', w);
           newFo.setAttribute('height', h);
           
           // Copy attributes
           Array.from(element.attributes).forEach(attr => {
             if (attr.name !== 'x' && attr.name !== 'y' && attr.name !== 'id') {
               newFo.setAttribute(attr.name, attr.value);
             }
           });
           newFo.setAttribute('data-scrollable', 'true');
           
           const innerDiv = doc.createElement('div');
           innerDiv.style.width = '100%';
           innerDiv.style.height = '100%';
           innerDiv.style.overflowY = 'auto';
           innerDiv.style.overflowX = 'hidden';
           innerDiv.style.wordBreak = 'break-word';
           innerDiv.style.color = element.getAttribute('fill') || '#000000';
           innerDiv.innerHTML = getDeepContent(liveEl).replace(/\n/g, '<br/>');
           
           const rx = element.getAttribute('rx') || '0';
           if (rx !== '0') innerDiv.style.borderRadius = `${rx}px`;
           
           newFo.appendChild(innerDiv);
           element.replaceWith(newFo);
        } else if (attribute === 'data-scrollable' && value === 'false' && tag === 'foreignobject') {
           // Optional: Convert back to text? Usually better to keep as FO for reliability
           element.setAttribute('data-scrollable', 'false');
           if (element.firstElementChild) {
             element.firstElementChild.style.overflowY = 'visible';
             element.firstElementChild.style.height = 'auto';
           }
        } else if (styleProp) {
          const finalProp = (tag === 'foreignobject' && styleProp === 'fill') ? 'color' : styleProp;
          if (tag === 'foreignobject') {
            if (element.firstElementChild) {
              element.firstElementChild.style.setProperty(finalProp, finalVal, 'important');
              
              // --- SCROLLABLE PERSISTENCE ---
              const isScrollable = element.getAttribute('data-scrollable') === 'true';
              if (isScrollable) {
                element.firstElementChild.style.overflowY = 'auto';
                element.firstElementChild.style.height = '100%';
                element.firstElementChild.style.overflowX = 'hidden';
                const rx = element.getAttribute('rx') || '0';
                element.firstElementChild.style.borderRadius = `${rx}px`;
              }
            }
            element.setAttribute(attribute, value);
          } else {
            // For SVG elements (text, g, etc.) set both CSS style and SVG presentation attribute
            element.style.setProperty(styleProp, finalVal, 'important');
            // Use SVG attribute name (e.g., font-size, font-family, text-anchor)
            const svgAttrName = SVG_ATTR_MAP[attribute] || attribute;
            let svgAttrVal = finalVal;
            // Convert textAlign CSS values to SVG text-anchor values
            if (attribute === 'textAlign') {
              svgAttrVal = TEXT_ALIGN_TO_ANCHOR[value] || 'start';
              element.setAttribute('text-anchor', svgAttrVal);
            } else {
              element.setAttribute(svgAttrName, finalVal);
            }
            if (attribute === 'fill' || attribute === 'stroke') {
              element.setAttribute(attribute, value);
            }
            // Propagate to tspan children so they inherit the style
            if (tag === 'text' || tag === 'g') {
              Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
                child.style.setProperty(styleProp, finalVal, 'important');
                if (attribute === 'textAlign') {
                  child.setAttribute('text-anchor', svgAttrVal);
                } else {
                  child.setAttribute(svgAttrName, finalVal);
                }
              });
            }
          }
        } else {
          element.setAttribute(attribute, value);
          
          // Handle scrollable updates for virtual doc
          if (tag === 'foreignobject' && element.firstElementChild) {
            const isScrollable = element.getAttribute('data-scrollable') === 'true';
            if (isScrollable) {
              element.firstElementChild.style.overflowY = 'auto';
              element.firstElementChild.style.height = '100%';
              element.firstElementChild.style.overflowX = 'hidden';
              const rx = element.getAttribute('rx') || '0';
              element.firstElementChild.style.borderRadius = `${rx}px`;
            } else {
              element.firstElementChild.style.overflowY = 'visible';
              element.firstElementChild.style.height = 'auto';
              element.firstElementChild.style.borderRadius = '0';
            }
          }
        }

        // --- GRADIENT SYNC (Virtual Doc) ---
        const isGradientRelated = attribute.includes('-stops') || attribute.includes('-gradient-type') || attribute.includes('-type');
        if (attribute.startsWith('fill') || attribute.startsWith('stroke') || isGradientRelated || attribute.includes('stroke-')) {
          const base = (attribute.startsWith('fill') || attribute.includes('fill-')) ? 'fill' : 'stroke';
          syncGradient(doc, element, base);
          
          // Apply synced gradient to live DOM too
          if (liveEl) {
            const liveSvg = liveEl.ownerSVGElement || liveEl.closest('svg');
            if (liveSvg) {
              syncGradient(liveSvg, liveEl, base);
            }
          }
        }

        // --- EFFECT SYNC ---
        const isEffectRelated = attribute.startsWith('data-effect-');
        if (isEffectRelated) {
          syncTextEffect(doc, element);
          
          // Apply to live DOM too
          if (liveEl) {
             const liveSvg = liveEl.ownerSVGElement || liveEl.closest('svg');
             if (liveSvg) syncTextEffect(liveSvg, liveEl);
             else syncTextEffect(null, liveEl);
          }
        }

        const newHtml = new XMLSerializer().serializeToString(doc.documentElement);
        page.html = newHtml;
        newPages[pageIdx] = page;
        
        // Notify parent of the update
        onUpdate(newHtml);
      }
      return newPages;
    });
  };

  const updateStyle = useCallback((property, value) => {
    if (property === 'fontFamily') setFontFamily(value.replace(/['\"]/g, '').split(',')[0]);
    if (property === 'fontSize') setFontSize(parseInt(value));
    if (property === 'fontWeight') setFontWeight(value.toString());
    if (property === 'fontStyle') setFontStyle(value);
    if (property === 'textDecorationLine' || property === 'textDecoration') setTextDecoration(value);
    if (property === 'textAlign') setTextAlign(value);
    if (property === 'letterSpacing') {
      const numVal = value === 'Auto' || value === '' ? 0 : parseFloat(value);
      setLetterSpacing(numVal);
    }
    if (property === 'lineHeight') {
      const numVal = value === 'Auto' || value === '' ? 1.2 : parseFloat(value);
      setLineHeight(numVal);
      
      // SVG text: line-height is applied via dy attributes on tspan children
      if (selectedLayerId) {
        const el = document.getElementById(selectedLayerId);
        if (el && el.tagName.toLowerCase() === 'text') {
          el.setAttribute('data-line-height', numVal.toString());
          const tspans = Array.from(el.querySelectorAll('tspan'));
          tspans.forEach((tspan, i) => {
            if (i > 0) tspan.setAttribute('dy', `${numVal.toFixed(2)}em`);
          });
          // Persist to pages state
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-line-height', numVal.toString());
          // Also re-serialize tspan dy values into page HTML via a DOM sync
          const svgRoot = el.ownerSVGElement || el.closest('svg');
          if (svgRoot) {
            const container = svgRoot.closest('[data-page-index]');
            if (container) {
              const pageIdx2 = parseInt(container.getAttribute('data-page-index'));
              setPages(prev => {
                const next = [...prev];
                const page = { ...next[pageIdx2] };
                if (!page.html) return prev;
                const parser = new DOMParser();
                const doc = parser.parseFromString(page.html, 'image/svg+xml');
                const docEl = doc.getElementById(selectedLayerId);
                if (docEl) {
                  docEl.setAttribute('data-line-height', numVal.toString());
                  const docTspans = Array.from(docEl.querySelectorAll('tspan'));
                  docTspans.forEach((ts, i) => {
                    if (i > 0) ts.setAttribute('dy', `${numVal.toFixed(2)}em`);
                  });
                  page.html = new XMLSerializer().serializeToString(doc.documentElement);
                  next[pageIdx2] = page;
                  onUpdate(page.html);
                }
                return next;
              });
            }
          }
        } else if (el) {
          // For foreignObject / div elements, CSS line-height works fine
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'lineHeight', numVal.toString());
        }
      }
      return;
    }
    if (property === 'textTransform') setTextTransform(value);
    
    if (property === 'listStyleType') {
      setListStyleType(value);
      // Transform text content to list
      let lines = textContent.split('\n').map(l => l.trim());
      if (value === 'disc') {
        lines = lines.map(line => {
          if (line.startsWith('• ')) return line;
          if (line.match(/^\d+\. /)) return line.replace(/^\d+\. /, '• ');
          return '• ' + line;
        });
      } else if (value === 'decimal') {
        lines = lines.map((line, i) => {
          const prefix = `${i + 1}. `;
          if (line.startsWith('• ')) return line.replace('• ', prefix);
          if (line.match(/^\d+\. /)) return line.replace(/^\d+\. /, prefix);
          return prefix + line;
        });
      } else if (value === 'none') {
        lines = lines.map(line => line.replace(/^(• |\d+\. )/, ''));
      }
      const newText = lines.join('\n');
      setTextContent(newText);
      
      // Live DOM Update for instant feedback
      const el = document.getElementById(selectedLayerId);
      if (el) {
        if (el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild) {
          el.firstElementChild.innerHTML = newText.replace(/\n/g, '<br/>');
        } else if (el.tagName.toLowerCase() === 'text') {
          // Triggering a local update will rebuild tspans
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerText', newText);
        }
      }
      
      if (selectedLayerId && el?.tagName.toLowerCase() !== 'text') {
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerText', newText);
      }
      return; 
    }
    
    if (selectedLayerId) {
      // Direct DOM manipulation for instant feedback during editing
      const el = document.getElementById(selectedLayerId);
      if (el) {
        const styleProp = STYLE_MAP[property];
        if (styleProp) {
          const finalVal = (property === 'fontSize' || property === 'letterSpacing') && !value.toString().includes('px') && !value.toString().includes('em') ? `${value}px` : value;
          
          if (el.tagName.toLowerCase() === 'foreignobject') {
            if (el.firstElementChild) {
              el.firstElementChild.style[styleProp] = finalVal;
            }
          } else {
            // SVG text element — set both CSS style and SVG presentation attribute
            el.style[styleProp] = finalVal;
            const svgAttrName = SVG_ATTR_MAP[property] || property;
            if (property === 'textAlign') {
              const anchorVal = TEXT_ALIGN_TO_ANCHOR[value] || 'start';
              el.setAttribute('text-anchor', anchorVal);
            } else {
              el.setAttribute(svgAttrName, finalVal);
            }
            // Propagate to tspan children
            const elTag = el.tagName.toLowerCase();
            if (elTag === 'text' || elTag === 'g') {
              Array.from(el.querySelectorAll('tspan')).forEach(child => {
                child.style[styleProp] = finalVal;
                if (property === 'textAlign') {
                  child.setAttribute('text-anchor', TEXT_ALIGN_TO_ANCHOR[value] || 'start');
                } else {
                  child.setAttribute(svgAttrName, finalVal);
                }
              });
            }
          }
          
          // Also update the editing overlay if it exists!
          // Search globally within the SVG for the active editing box
          const svgRoot = el.ownerSVGElement || el.closest('svg');
          const overlay = svgRoot?.querySelector('foreignObject[data-editing="true"] [contenteditable]');
          if (overlay) {
            overlay.style[styleProp] = finalVal;
          }
        }
      }

      const { start, end } = selectionRange;
      if (start !== end && (property === 'fontFamily' || property === 'fontSize')) {
        // Partial styling: Wrap selection in a span
        const fullText = textContent;
        const before = fullText.slice(0, start);
        const selected = fullText.slice(start, end);
        const after = fullText.slice(end);

        // This is a simplified approach: we rebuild the innerHTML
        // In a real app, you'd want to handle nested spans properly
        const cssProp = property === 'fontFamily' ? 'font-family' : 'font-size';
        const cssVal = property === 'fontSize' ? `${value}px` : value;
        
        // Find existing innerHTML and wrap selection
        // For now, let's just use spans for simplicity
        const styledText = `${before}<span style="${cssProp}: ${cssVal}">${selected}</span>${after}`;
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerHTML', styledText);
      } else {
        // Whole element styling: apply to container and clear child overrides for this property
        updateElementAttributeLocal(activePageIndex, selectedLayerId, property, value);
        
        // If it's a rich text element, we might need to clear internal spans to let parent style through
        const el = document.getElementById(selectedLayerId);
        if (el && (el.tagName.toLowerCase() === 'div' || el.tagName.toLowerCase() === 'p')) {
          const cssProp = property === 'fontFamily' ? 'font-family' : (property === 'fontSize' ? 'font-size' : null);
          if (cssProp) {
            const spans = el.querySelectorAll('span');
            spans.forEach(span => span.style.removeProperty(cssProp));
            // Sync this change back to the main app
            onUpdate(new XMLSerializer().serializeToString(el.ownerDocument.documentElement));
          }
        }
      }
    }
  }, [selectedLayerId, activePageIndex, updateElementAttributeLocal, selectionRange, textContent, onUpdate]);

  const handleScrub = useCallback((property, startValue, step = 1) => (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialVal = property === 'lineHeight' ? (parseFloat(startValue) || 1.2) : (parseFloat(startValue) || 0);
    
    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaValue = (deltaX / 10) * step;
      let newValue = initialVal + deltaValue;
      
      if (property === 'lineHeight') {
        newValue = Math.max(0.1, parseFloat(newValue.toFixed(2)));
      } else {
        newValue = Math.round(newValue);
      }
      
      updateStyle(property, newValue);
    };
    
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'ew-resize';
  }, [updateStyle]);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const getCurrentStyle = (prop) => {
    if (!selectedElement) return '';
    return window.getComputedStyle(selectedElement)[prop] || '';
  };

  const getDeepStyle = useCallback((el, prop) => {
    if (!el) return '';
    const style = window.getComputedStyle(el);
    let val = style[prop];
    
    // If the container style seems default/inherited, search children for a more specific style
    if (val === 'normal' || val === '400' || val.includes('sans-serif') || val === '0px' || val === '16px') {
      const styledChild = el.querySelector(`span[style*="${prop === 'fontFamily' ? 'font-family' : 'font-size'}"], [style*="${prop}"]`);
      if (styledChild) {
        return window.getComputedStyle(styledChild)[prop];
      }
    }
    return val;
  }, []);

  const calculateLineHeightMultiplier = () => {
    const el = document.getElementById(selectedLayerId);
    if (!el) return 1.2;
    
    const inlineLH = el.getAttribute('data-line-height');
    if (inlineLH && /^[0-9.]+$/.test(inlineLH)) {
      return parseFloat(inlineLH);
    }
    
    const computed = window.getComputedStyle(el);
    const fontSize = parseFloat(computed.fontSize);
    const lh = computed.lineHeight;
    
    if (lh === 'normal') return 1.2;
    const val = parseFloat(lh);
    
    // If computed is in px (most likely), convert to multiplier
    if (fontSize) return val / fontSize;
    return 1.2;
  };

  // --- EFFECTS ---

  useEffect(() => {
    if (selectedElement !== lastSelectedElementRef.current) {
      isSyncingRef.current = true;
      setIsSyncing(true);
      lastSelectedElementRef.current = selectedElement;
    }
  }, [selectedElement]);

  const getDeepContent = useCallback((el) => {
    if (!el) return '';
    
    // 1. Check if there is an active editing overlay for this element
    // Search the whole SVG because MainEditor appends overlays to the root SVG
    const svgRoot = el.ownerSVGElement || el.closest('svg');
    if (svgRoot) {
      const editingOverlay = svgRoot.querySelector('foreignObject[data-editing="true"] [contenteditable]');
      // Ensure this overlay actually corresponds to our element (though usually only one exists)
      if (editingOverlay) {
        return editingOverlay.innerText || editingOverlay.textContent || '';
      }
    }

    const tag = el.tagName.toLowerCase();
    // 2. Handle SVG <text> with <tspan> children
    if (tag === 'text') {
      const tspans = Array.from(el.querySelectorAll('tspan'));
      if (tspans.length > 0) return tspans.map(t => t.textContent).join('\n');
    }
    
    // 3. Handle foreignObject child (div/p) - innerText converts <br/> to \n
    return el.innerText || el.textContent || '';
  }, []);

  // --- CONSOLIDATED SYNCHRONIZATION EFFECT ---
  // This effect handles both the initial load of properties and real-time sync from canvas
  useEffect(() => {
    if (!selectedLayerId) return;

    const syncFromCanvas = () => {
      // Don't sync from canvas if the user is currently typing in the property panel
      if (document.activeElement === textareaRef.current) return;

      const el = document.getElementById(selectedLayerId);
      if (!el) return;

      // Update text content
      // GUARD: Do not overwrite the textarea if the user is currently typing in it
      if (!isTypingRef.current && document.activeElement !== textareaRef.current) {
        const content = getDeepContent(el);
        setTextContent(content);
      }

      // Update styles (only on selection change or if not typing)
      if (!isTypingRef.current) {
        const ff = getDeepStyle(el, 'fontFamily');
        const fs = getDeepStyle(el, 'fontSize');
        const style = window.getComputedStyle(el);

        if (ff) setFontFamily(ff.replace(/['\"]/g, '').split(',')[0]);
        if (fs) setFontSize(parseInt(fs));
        
        const weight = style.fontWeight;
        const normalizedWeight = weight === 'bold' ? '700' : (weight === 'normal' ? '400' : weight);
        if (normalizedWeight) setFontWeight(normalizedWeight.toString());
        
        if (style.fontStyle) setFontStyle(style.fontStyle);
        if (style.textDecoration) setTextDecoration(style.textDecoration);
        if (style.textAlign) setTextAlign(style.textAlign);
        if (style.textTransform) setTextTransform(style.textTransform);
        
        // Sync Letter Spacing
        if (style.letterSpacing && style.letterSpacing !== 'normal') {
          setLetterSpacing(parseFloat(style.letterSpacing));
        } else {
          setLetterSpacing(0);
        }

        // Sync Line Height
        const lh = calculateLineHeightMultiplier();
        setLineHeight(lh);

        // Sync Effects
        syncTextEffect(null, el);
      }
    };

    // Initial sync
    syncFromCanvas();

    // 1. Real-time sync for direct canvas editing (contenteditable)
    const handleGlobalInput = (e) => {
      // If the input happened inside an editing overlay, trigger sync
      if (e.target.closest('foreignObject[data-editing="true"]')) {
        syncFromCanvas();
      }
    };
    
    // 2. Observer for DOM changes (like when MainEditor finishes editing and swaps fo for text)
    const el = document.getElementById(selectedLayerId);
    let observer = null;
    if (el) {
      observer = new MutationObserver((mutations) => {
        // Optimization: only sync if relevant nodes changed
        syncFromCanvas();
      });
      
      // Observe the element itself and its parent (for sibling overlays)
      observer.observe(el, { characterData: true, childList: true, subtree: true });
      if (el.parentNode) {
        observer.observe(el.parentNode, { childList: true, subtree: true });
      }
    }

    window.addEventListener('input', handleGlobalInput, true);
    
    return () => {
      window.removeEventListener('input', handleGlobalInput, true);
      observer?.disconnect();
    };
  }, [selectedLayerId, getDeepContent, getDeepStyle]);

  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current || !selectedElement) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    setSelectionRange({ start: selectionStart, end: selectionEnd });

    // Detection logic: Find the node at selectionStart and fetch its style
    let currentPos = 0;
    const findStyleAtPos = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextPos = currentPos + node.length;
        if (selectionStart >= currentPos && selectionStart < nextPos) {
          const style = window.getComputedStyle(node.parentElement);
          if (style.fontFamily) setFontFamily(style.fontFamily.replace(/['\"]/g, '').split(',')[0]);
          if (style.fontSize) setFontSize(parseInt(style.fontSize));
          return true;
        }
        currentPos = nextPos;
      } else {
        for (const child of node.childNodes) {
          if (findStyleAtPos(child)) return true;
        }
      }
      return false;
    };

    findStyleAtPos(selectedElement);
  }, [selectedElement]);



  // Reset panels when selectedElement or closePanelsSignal changes
  useEffect(() => {
    setShowStrokePositionDropdown(false);
  }, [selectedElement, closePanelsSignal]);


  // Design update logic removed
  useEffect(() => {
    // UI only - no canvas updates
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowFontDropdown(false);
      if (fontSizeRef.current && !fontSizeRef.current.contains(event.target)) setShowFontSizeDropdown(false);
      if (weightRef.current && !weightRef.current.contains(event.target)) setShowWeightDropdown(false);
      if (borderStyleRef.current && !borderStyleRef.current.contains(event.target)) setShowBorderStyleDropdown(false);
      if (strokePositionRef.current && !strokePositionRef.current.contains(event.target)) setShowStrokePositionDropdown(false);
      if (strokePositionRef.current && !strokePositionRef.current.contains(event.target)) setShowStrokePositionDropdown(false);
      
      // Close panels if clicked outside
      if (activePanel) {
        if (activePanel === 'alignment' && alignmentRef.current && !alignmentRef.current.contains(event.target) && !event.target.closest('.alignment-trigger')) setActivePanel(null);
        if (activePanel === 'style' && styleRef.current && !styleRef.current.contains(event.target) && !event.target.closest('.style-trigger')) setActivePanel(null);
        if (activePanel === 'case' && caseRef.current && !caseRef.current.contains(event.target) && !event.target.closest('.case-trigger')) setActivePanel(null);
        if (activePanel === 'list' && listRef.current && !listRef.current.contains(event.target) && !event.target.closest('.list-trigger')) setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePanel, showFontDropdown, showFontSizeDropdown, showWeightDropdown, showBorderStyleDropdown, showStrokePositionDropdown]);  // Auto-focus and sync text when MainEditor enters text edit mode (foreignObject creation)
  // Auto-focus when MainEditor enters text edit mode (foreignObject creation)
  useEffect(() => {
    if (!selectedLayerId) return;
    const el = document.getElementById(selectedLayerId);
    if (!el || !el.parentNode) return;

    const checkAndFocus = () => {
      const editingOverlay = el.parentNode?.querySelector('foreignObject[data-editing="true"] [contenteditable]');
      if (editingOverlay && document.activeElement !== editingOverlay) {
        editingOverlay.focus();
        const range = document.createRange();
        range.selectNodeContents(editingOverlay);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    checkAndFocus();
    const observer = new MutationObserver(checkAndFocus);
    observer.observe(el.parentNode, { childList: true });

    return () => observer.disconnect();
  }, [selectedLayerId]);

  if (!selectedElement) return null;

  return (
    <div className="w-full space-y-[1vw] font-sans text-gray-800">
      {/* Header */}
      <div className="flex items-center gap-[0.75vw]">
        <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Text Property</h2>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
      </div>

      {/* Scrollable Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[0.8vw] font-semibold">Scrollable Text Box Feature</span>
        <div className="flex-1 mx-[1vw] border-b border-dashed border-gray-300"></div>
        <button
          onClick={() => {
            const nextValue = !isScrollable;
            setIsScrollable(nextValue);
            if (selectedLayerId) {
              updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-scrollable', nextValue.toString());
            }
          }}
          className={`w-[2.2vw] h-[1.1vw] rounded-full p-[0.15vw] transition-colors duration-200 ${isScrollable ? 'bg-indigo-600' : 'bg-gray-300'}`}
        >
          <div className={`w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-transform duration-200 ${isScrollable ? 'translate-x-[1.1vw]' : 'translate-x-0'}`}></div>
        </button>
      </div>

      {/* Text Area */}
      <div className="relative border border-gray-400 rounded-[0.75vw] p-[0.75vw]">
        <textarea
          ref={textareaRef}
          value={textContent}
          onChange={(e) => {
            isTypingRef.current = true;
            const newVal = e.target.value;
            setTextContent(newVal);
            
            // 1. Instant DOM Preview: Update the live element or overlay immediately
            if (selectedLayerId) {
              const el = document.getElementById(selectedLayerId);
              const svgRoot = el?.ownerSVGElement || el?.closest('svg');
              const overlay = svgRoot?.querySelector('foreignObject[data-editing="true"] [contenteditable]');
              
              if (overlay) {
                overlay.innerText = newVal;
              } else if (el) {
                // If no overlay, we still want a fast preview on the element itself if possible
                // (Note: updateElementAttributeLocal also does this, but after a React cycle)
                if (el.tagName.toLowerCase() === 'text') {
                  // Rebuilding tspans manually is complex, so we'll let the debounced update handle it
                } else if (el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild) {
                  el.firstElementChild.innerHTML = newVal.replace(/\n/g, '<br/>');
                }
              }
            }

            // 2. Debounced State Sync: Update the underlying state after typing stops
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
              if (selectedLayerId) {
                updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerText', newVal);
              }
              isTypingRef.current = false;
            }, 400); // 400ms debounce for performance
          }}
          onBlur={() => {
            // Ensure final content is saved immediately on blur
            if (selectedLayerId) {
              updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerText', textContent);
            }
            isTypingRef.current = false;
          }}
          onSelect={handleTextSelection}
          onKeyUp={handleTextSelection}
          onMouseUp={handleTextSelection}
          onDoubleClick={(e) => e.target.select()}
          placeholder="Enter text here"
          className="w-full h-[4vw] bg-transparent resize-none outline-none text-[0.85vw] text-gray-400 placeholder-gray-300 "
        />
        <div className="absolute bottom-[0.75vw] right-[0.75vw]">
          <PencilLine size="1vw" className="text-gray-600" />
        </div>
      </div>

      {/* Font Selectors Row 1 */}
      <div className="flex gap-[0.65vw]">
        <div className="relative flex-[1.5]" ref={dropdownRef}>
          <button
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            className="w-full h-[2.5vw] px-[0.75vw] flex items-center justify-between border border-gray-400 rounded-[0.75vw] bg-white"
          >
            <span className="text-[0.85vw] truncate" style={{ fontFamily }}>{fontFamily}</span>
            <ChevronDown size="1vw" className="text-gray-500" />
          </button>
          {showFontDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-[0.75vw] shadow-lg max-h-[12vw] overflow-y-auto">
              {fontFamilies.map(font => (
                <div key={font} onClick={() => { updateStyle('fontFamily', font); setShowFontDropdown(false); }} className="px-[0.75vw] py-[0.4vw] hover:bg-gray-100 cursor-pointer text-[0.85vw]" style={{ fontFamily: font }}>{font}</div>
              ))}
            </div>
          )}
        </div>
        <div className="relative flex-1" ref={fontSizeRef}>
          <button
            onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
            className="w-full h-[2.5vw] px-[0.75vw] flex items-center justify-between border border-gray-400 rounded-[0.75vw] bg-white"
          >
            <span className="text-[0.85vw]">{fontSize}</span>
            <ChevronDown size="1vw" className="text-gray-500" />
          </button>
          {showFontSizeDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-[0.75vw] shadow-lg max-h-[12vw] overflow-y-auto">
              {[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 128].map(size => (
                <div key={size} onClick={() => { updateStyle('fontSize', size); setShowFontSizeDropdown(false); }} className="px-[0.75vw] py-[0.4vw] hover:bg-gray-100 cursor-pointer text-[0.85vw] text-center">{size}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Font Selectors Row 2 */}
      <div className="flex gap-[0.65vw]">
        <div className="relative flex-1" ref={weightRef}>
          <button
            onClick={() => setShowWeightDropdown(!showWeightDropdown)}
            className="w-[8vw] h-[2.5vw] px-[0.75vw] flex items-center justify-between border border-gray-400 rounded-[0.75vw] bg-white"
          >
            <span className="text-[0.85vw] truncate">{fontWeights.find(w => w.value === fontWeight.toString())?.name || 'Regular'}</span>
            <ChevronDown size="1vw" className="text-gray-500" />
          </button>
          {showWeightDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-[0.75vw] shadow-lg max-h-[12vw] overflow-y-auto">
              {fontWeights.map(w => (
                <div key={w.value} onClick={() => { updateStyle('fontWeight', w.value); setShowWeightDropdown(false); }} className="px-[0.75vw] py-[0.4vw] hover:bg-gray-100 cursor-pointer text-[0.85vw]">{w.name}</div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-between border border-gray-400 rounded-[0.75vw] px-[0.6vw] h-[2.5vw] bg-white focus-within:border-indigo-500 transition-colors">
          <input 
            type="text"
            value={letterSpacing === 0 ? 'Auto' : letterSpacing}
            onChange={(e) => {
              const val = e.target.value === 'Auto' || e.target.value === '' ? 0 : parseFloat(e.target.value);
              if (!isNaN(val)) updateStyle('letterSpacing', val);
            }}
            onFocus={(e) => { if(e.target.value === 'Auto') e.target.value = ''; }}
            onBlur={(e) => { if(e.target.value === '') e.target.value = 'Auto'; }}
            className="w-full bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium"
          />
          <div 
            className="flex items-center border-l border-gray-300 pl-[0.4vw] ml-[0.4vw] cursor-ew-resize active:text-indigo-600"
            onMouseDown={handleScrub('letterSpacing', letterSpacing, 1)}
          >
            <Icon icon="solar:paragraph-spacing-bold" className="w-[1.2vw] h-[1.2vw] text-gray-600 rotate-90 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-between border border-gray-400 rounded-[0.75vw] px-[0.6vw] h-[2.5vw] bg-white focus-within:border-indigo-500 transition-colors">
          <input 
            type="text"
            value={lineHeight === 1.2 ? 'Auto' : lineHeight}
            onChange={(e) => {
              const val = e.target.value === 'Auto' || e.target.value === '' ? 1.2 : parseFloat(e.target.value);
              if (!isNaN(val)) updateStyle('lineHeight', val);
            }}
            onFocus={(e) => { if(e.target.value === 'Auto') e.target.value = ''; }}
            onBlur={(e) => { if(e.target.value === '') e.target.value = 'Auto'; }}
            className="w-full bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium"
          />
          <div 
            className="flex items-center border-l border-gray-300 pl-[0.4vw] ml-[0.4vw] cursor-ew-resize active:text-indigo-600"
            onMouseDown={handleScrub('lineHeight', lineHeight, 0.1)}
          >
            <Icon icon="solar:paragraph-spacing-bold" className="w-[1.2vw] h-[1.2vw] text-gray-600 pointer-events-none" /> 
          </div>
        </div>
      </div>

      {/* Toolbar Buttons */}
      <div className="flex gap-[0.8vw] relative">
        {/* Alignment */}
        <div className="relative" ref={alignmentRef}>
          <button
            onClick={() => togglePanel('alignment')}
            className={`w-[3vw] h-[3vw] rounded-[0.8vw] flex items-center justify-center transition-all duration-200 ${
              activePanel === 'alignment' 
                ? 'bg-indigo-600 text-white shadow-lg scale-95' 
                : 'bg-[#F1F3F5] text-[#343A40] hover:bg-[#E9ECEF] hover:shadow-sm'
            }`}
          >
            {textAlign === 'center' ? <AlignCenter size="1.3vw" strokeWidth={2.5} /> :
             textAlign === 'right' ? <AlignRight size="1.3vw" strokeWidth={2.5} /> :
             textAlign === 'justify' ? <AlignJustify size="1.3vw" strokeWidth={2.5} /> :
             <AlignLeft size="1.3vw" strokeWidth={2.5} />}
          </button>
          {activePanel === 'alignment' && (
            <div className="absolute top-[3.5vw] left-0 z-50 p-[0.5vw] bg-white border border-gray-100 rounded-[1vw] flex gap-[0.4vw] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => { updateStyle('textAlign', 'left'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textAlign === 'left' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><AlignLeft size="1.2vw" /></button>
              <button onClick={() => { updateStyle('textAlign', 'center'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textAlign === 'center' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><AlignCenter size="1.2vw" /></button>
              <button onClick={() => { updateStyle('textAlign', 'right'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textAlign === 'right' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><AlignRight size="1.2vw" /></button>
              <button onClick={() => { updateStyle('textAlign', 'justify'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textAlign === 'justify' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><AlignJustify size="1.2vw" /></button>
            </div>
          )}
        </div>

        {/* Style (Bold/Italic/etc) */}
        <div className="relative" ref={styleRef}>
          <button
            onClick={() => togglePanel('style')}
            className={`w-[3vw] h-[3vw] rounded-[0.8vw] flex items-center justify-center transition-all duration-200 ${
              activePanel === 'style' 
                ? 'bg-indigo-600 text-white shadow-lg scale-95' 
                : 'bg-[#F1F3F5] text-[#343A40] hover:bg-[#E9ECEF] hover:shadow-sm'
            }`}
          >
            <Bold size="1.3vw" strokeWidth={2.5} />
          </button>
          {activePanel === 'style' && (
            <div className="absolute top-[3.5vw] left-0 z-50 p-[0.5vw] bg-white border border-gray-100 rounded-[1vw] flex gap-[0.4vw] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => updateStyle('fontWeight', fontWeight === '700' ? '400' : '700')} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center font-semibold transition-all ${fontWeight === '700' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>B</button>
              <button onClick={() => updateStyle('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center italic transition-all ${fontStyle === 'italic' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>I</button>
              <button onClick={() => updateStyle('textDecoration', textDecoration === 'underline' ? 'none' : 'underline')} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center underline transition-all ${textDecoration === 'underline' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>U</button>
              <button onClick={() => updateStyle('textDecoration', textDecoration === 'line-through' ? 'none' : 'line-through')} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textDecoration === 'line-through' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><span className="line-through">S</span></button>
            </div>
          )}
        </div>

        {/* Case */}
        <div className="relative" ref={caseRef}>
          <button
            onClick={() => togglePanel('case')}
            className={`w-[3vw] h-[3vw] rounded-[0.8vw] flex items-center justify-center transition-all duration-200 ${
              activePanel === 'case' 
                ? 'bg-indigo-600 text-white shadow-lg scale-95' 
                : 'bg-[#F1F3F5] text-[#343A40] hover:bg-[#E9ECEF] hover:shadow-sm'
            }`}
          >
            <Minus size="1.3vw" strokeWidth={3} />
          </button>
          {activePanel === 'case' && (
            <div className="absolute top-[3.5vw] left-0 z-50 p-[0.5vw] bg-white border border-gray-100 rounded-[1vw] flex gap-[0.4vw] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => { updateStyle('textTransform', 'none'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textTransform === 'none' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><Minus size="1.1vw" strokeWidth={3}/></button>
              <button onClick={() => { updateStyle('textTransform', 'capitalize'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textTransform === 'capitalize' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>Aa</button>
              <button onClick={() => { updateStyle('textTransform', 'uppercase'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textTransform === 'uppercase' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>AB</button>
              <button onClick={() => { updateStyle('textTransform', 'lowercase'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textTransform === 'lowercase' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>ab</button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="relative" ref={listRef}>
          <button
            onClick={() => togglePanel('list')}
            className={`w-[3vw] h-[3vw] rounded-[0.8vw] flex items-center justify-center transition-all duration-200 ${
              activePanel === 'list' 
                ? 'bg-indigo-600 text-white shadow-lg scale-95' 
                : 'bg-[#F1F3F5] text-[#343A40] hover:bg-[#E9ECEF] hover:shadow-sm'
            }`}
          >
            {listStyleType === 'decimal' ? <ListOrdered size="1.3vw" strokeWidth={2.5} /> : <List size="1.3vw" strokeWidth={2.5} />}
          </button>
          {activePanel === 'list' && (
            <div className="absolute top-[3.5vw] right-0 z-50 p-[0.5vw] bg-white border border-gray-100 rounded-[1vw] flex gap-[0.4vw] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => { updateStyle('listStyleType', listStyleType === 'disc' ? 'none' : 'disc'); togglePanel(null); }} 
                className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${listStyleType === 'disc' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
              >
                <List size="1.2vw" />
              </button>
              <button 
                onClick={() => { updateStyle('listStyleType', listStyleType === 'decimal' ? 'none' : 'decimal'); togglePanel(null); }} 
                className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${listStyleType === 'decimal' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
              >
                <ListOrdered size="1.2vw" />
              </button>
              <button 
                onClick={() => { updateStyle('listStyleType', 'none'); togglePanel(null); }} 
                className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${listStyleType === 'none' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
              >
                <Minus size="1.2vw" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-[0.65vw] mt-[-1vw]">
      {/* Accordions from ShapeProperties */}
      <div className="shape-properties-container">
        <ShapeProperties 
          selectedElementProps={selectedElementProps || { 
            fill: '#000000', 
            opacity: '1', 
            stroke: 'none', 
            strokeWidth: '0', 
            tagName: 'text' 
          }}
          activePageIndex={activePageIndex}
          selectedLayerId={selectedLayerId}
          updateElementAttribute={updateElementAttributeLocal}
        />
      </div>

      <style>{`
        .shape-properties-container > div > div:first-child {
          display: none !important;
        }
      `}</style>
      </div>
    </div>
  );
};

export default TextEditor;
