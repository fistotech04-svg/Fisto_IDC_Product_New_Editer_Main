import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { createPortal } from 'react-dom';
import ColorPicker, { parseGradient } from './ColorPicker';
import { generateGradientString } from '../CustomizedEditor/AppearanceShared';
import { syncGradient } from './editorUtils';
import { resolveUploadsPath } from '../../utils/supabaseUtils';

const PRESET_COLORS = [
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#4b5563', '#1f2937', '#000000',
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
  '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857',
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c',
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'
];

/**
 * Resiliently finds the overlay element across diverse template DOM structures.
 */
const getOverlayElement = (pageIndex) => {
  const container =
    document.getElementById(`canvas-content-${pageIndex}`) ||
    document.querySelector(`.page-svg-container[data-page-index="${pageIndex}"]`) ||
    document.querySelector('.page-svg-container') ||
    document;

  let overlay =
    container.querySelector('[data-name="Overlay"]') ||
    container.querySelector('[data-type="background"]') ||
    container.querySelector('svg > g[data-type="frame"] > rect[data-name="Overlay"]') ||
    container.querySelector('svg > rect[data-name="Overlay"]') ||
    container.querySelector('svg > rect:first-of-type');

  if (!overlay && container !== document) {
    overlay =
      document.querySelector(`[id^="canvas-content-"] [data-name="Overlay"]`) ||
      document.querySelector('[data-name="Overlay"]') ||
      document.querySelector('[data-type="background"]');
  }

  return { overlay, container };
};

/**
 * Safely parses float values to prevent NaN propagation.
 */
const safeParseFloat = (val, fallback = 1) => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
};

/**
 * Directly mutates the active canvas SVG overlay element in-place.
 * Provides 0ms instantaneous visual updates at 60 FPS without tearing down the SVG canvas DOM.
 */
const updateLiveCanvasOverlay = (activePageIndex, attrs) => {
  const { overlay, container } = getOverlayElement(activePageIndex);
  if (!overlay) return;

  if (attrs.fill !== undefined) {
    if (attrs['fill-type'] === 'solid') {
      overlay.setAttribute('fill', attrs.fill);
      overlay.setAttribute('fill-type', 'solid');
      overlay.removeAttribute('fill-gradient-type');
      overlay.removeAttribute('fill-stops');
      overlay.removeAttribute('fill-angle');
      overlay.removeAttribute('fill-radius');
      if (overlay.style) {
        overlay.style.setProperty('fill', attrs.fill, 'important');
      }
    } else if (attrs['fill-type'] === 'gradient') {
      Object.entries(attrs).forEach(([k, v]) => overlay.setAttribute(k, v));
      if (overlay.style) {
        overlay.style.removeProperty('fill');
      }
      const svg = overlay.closest('svg') || container?.querySelector('svg');
      if (svg) {
        syncGradient(svg, overlay, 'fill');
      }
    }
  }

  if (attrs['fill-opacity'] !== undefined) {
    overlay.setAttribute('fill-opacity', attrs['fill-opacity'].toString());
    if (overlay.style) {
      overlay.style.setProperty('fill-opacity', attrs['fill-opacity'].toString(), 'important');
    }
  }

  // Stroke / Page Border
  if (
    attrs.stroke !== undefined ||
    attrs['stroke-width'] !== undefined ||
    attrs['data-stroke-position'] !== undefined ||
    attrs['stroke-dasharray'] !== undefined ||
    attrs['stroke-linejoin'] !== undefined ||
    attrs['stroke-opacity'] !== undefined
  ) {
    // Store metadata on overlay for state persistence, but ensure Overlay itself does not render a visual SVG stroke
    if (attrs.stroke !== undefined) {
      overlay.setAttribute('data-stroke-color', attrs.stroke);
      overlay.setAttribute('stroke', attrs.stroke);
    }
    if (attrs['stroke-width'] !== undefined) {
      overlay.setAttribute('data-stroke-width', attrs['stroke-width'].toString());
      overlay.setAttribute('stroke-width', attrs['stroke-width'].toString());
    }
    if (attrs['data-stroke-position'] !== undefined) overlay.setAttribute('data-stroke-position', attrs['data-stroke-position']);
    if (attrs['stroke-dasharray'] !== undefined) overlay.setAttribute('stroke-dasharray', attrs['stroke-dasharray']);
    if (attrs['stroke-linejoin'] !== undefined) overlay.setAttribute('stroke-linejoin', attrs['stroke-linejoin']);
    if (attrs['stroke-opacity'] !== undefined) overlay.setAttribute('stroke-opacity', attrs['stroke-opacity'].toString());

    // Crucial: Clear any inline style or visual SVG stroke on overlay so it never renders a duplicate stroke alongside Page Border
    if (overlay.style) {
      overlay.style.setProperty('stroke', 'none', 'important');
      overlay.style.setProperty('stroke-width', '0px', 'important');
    }

    updateLiveCanvasBorder(activePageIndex, container, overlay, attrs);
  }
};

/**
 * Updates or creates the live Page Border element in the active canvas DOM.
 */
const updateLiveCanvasBorder = (activePageIndex, container, overlay, attrs) => {
  const svg = overlay.closest('svg') || container?.querySelector('svg');
  if (!svg) return;
  let pageBorder = svg.querySelector('[data-name="Page Border"]') || svg.getElementById(`page-border-${activePageIndex}`);

  // Ensure Overlay itself never visually displays a stroke (preventing duplicate strokes)
  if (overlay.style) {
    overlay.style.setProperty('stroke', 'none', 'important');
    overlay.style.setProperty('stroke-width', '0px', 'important');
  }

  const sColor = attrs.stroke !== undefined ? attrs.stroke : (pageBorder?.getAttribute('stroke') || overlay.getAttribute('data-stroke-color') || overlay.getAttribute('stroke') || 'none');
  
  let sWidth;
  if (attrs['stroke-width'] !== undefined) {
    sWidth = safeParseFloat(attrs['stroke-width'], 0);
  } else {
    const existingW = pageBorder?.getAttribute('stroke-width') || overlay.getAttribute('data-stroke-width') || overlay.getAttribute('stroke-width');
    sWidth = existingW ? safeParseFloat(existingW, 0) : (sColor && sColor !== 'none' ? 1 : 0);
  }

  const sDash = attrs['stroke-dasharray'] !== undefined ? attrs['stroke-dasharray'] : (pageBorder?.getAttribute('stroke-dasharray') || overlay.getAttribute('stroke-dasharray') || '');
  const rawOpacity = attrs['stroke-opacity'] !== undefined ? attrs['stroke-opacity'] : (pageBorder?.getAttribute('stroke-opacity') || overlay.getAttribute('stroke-opacity'));
  const sOpacity = rawOpacity !== undefined && rawOpacity !== null ? safeParseFloat(rawOpacity, 1) : null;
  const sJoin = attrs['stroke-linejoin'] !== undefined ? attrs['stroke-linejoin'] : (pageBorder?.getAttribute('stroke-linejoin') || overlay.getAttribute('stroke-linejoin') || 'round');
  const sPos = attrs['data-stroke-position'] !== undefined ? attrs['data-stroke-position'] : (overlay.getAttribute('data-stroke-position') || 'Inside');

  if (!sColor || sColor === 'none' || sWidth <= 0) {
    if (pageBorder) pageBorder.remove();
    return;
  }

  let baseW = parseFloat(svg.getAttribute('width') || overlay.getAttribute('width') || '794');
  let baseH = parseFloat(svg.getAttribute('height') || overlay.getAttribute('height') || '1123');
  if (svg.getAttribute('viewBox')) {
    const vbParts = svg.getAttribute('viewBox').trim().split(/[\s,]+/).map(parseFloat);
    if (vbParts.length >= 4 && !isNaN(vbParts[2]) && !isNaN(vbParts[3])) {
      baseW = vbParts[2];
      baseH = vbParts[3];
    }
  }

  if (!pageBorder) {
    pageBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    pageBorder.setAttribute('id', `page-border-${activePageIndex}`);
    pageBorder.setAttribute('data-name', 'Page Border');
    pageBorder.setAttribute('data-type', 'page-border');
    pageBorder.setAttribute('style', 'pointer-events: none;');
    pageBorder.setAttribute('pointer-events', 'none');
    const bgImg = svg.querySelector('image[data-name="Page Background Image"]') || svg.querySelector('[data-type="page-background-image"]');
    const insertAfter = bgImg || overlay;
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(pageBorder, insertAfter.nextSibling);
    } else {
      svg.appendChild(pageBorder);
    }
  } else {
    // Ensure pageBorder is placed after background image and overlay
    const bgImg = svg.querySelector('image[data-name="Page Background Image"]') || svg.querySelector('[data-type="page-background-image"]');
    const insertAfter = bgImg || overlay;
    if (insertAfter && insertAfter.parentNode && insertAfter.nextSibling !== pageBorder) {
      insertAfter.parentNode.insertBefore(pageBorder, insertAfter.nextSibling);
    }
  }

  if (sPos === 'Inside') {
    pageBorder.setAttribute('x', (sWidth / 2).toString());
    pageBorder.setAttribute('y', (sWidth / 2).toString());
    pageBorder.setAttribute('width', Math.max(0, baseW - sWidth).toString());
    pageBorder.setAttribute('height', Math.max(0, baseH - sWidth).toString());
  } else if (sPos === 'Outside') {
    pageBorder.setAttribute('x', (-sWidth / 2).toString());
    pageBorder.setAttribute('y', (-sWidth / 2).toString());
    pageBorder.setAttribute('width', (baseW + sWidth).toString());
    pageBorder.setAttribute('height', (baseH + sWidth).toString());
  } else {
    pageBorder.setAttribute('x', '0');
    pageBorder.setAttribute('y', '0');
    pageBorder.setAttribute('width', baseW.toString());
    pageBorder.setAttribute('height', baseH.toString());
  }

  pageBorder.setAttribute('fill', 'none');
  pageBorder.setAttribute('stroke', sColor);
  pageBorder.setAttribute('stroke-width', sWidth.toString());
  pageBorder.setAttribute('stroke-linejoin', sJoin);
  pageBorder.setAttribute('shape-rendering', 'geometricPrecision');
  if (pageBorder.style) {
    pageBorder.style.setProperty('fill', 'none', 'important');
    pageBorder.style.setProperty('stroke', sColor, 'important');
    pageBorder.style.setProperty('stroke-width', `${sWidth}px`, 'important');
    pageBorder.style.setProperty('pointer-events', 'none', 'important');
  }
  if (sOpacity !== null && !isNaN(sOpacity)) {
    pageBorder.setAttribute('stroke-opacity', sOpacity.toString());
    if (pageBorder.style) pageBorder.style.setProperty('stroke-opacity', sOpacity.toString(), 'important');
  } else {
    pageBorder.removeAttribute('stroke-opacity');
    if (pageBorder.style) pageBorder.style.removeProperty('stroke-opacity');
  }
  if (sDash && sDash !== 'none') {
    pageBorder.setAttribute('stroke-dasharray', sDash);
    if (pageBorder.style) pageBorder.style.setProperty('stroke-dasharray', sDash, 'important');
  } else {
    pageBorder.removeAttribute('stroke-dasharray');
    if (pageBorder.style) pageBorder.style.removeProperty('stroke-dasharray');
  }
};

const PagePropertiesPanel = React.memo(({
  activePageIndex,
  pages,
  updateElementAttribute,
  setIsPageBgModalOpen,
  canvaWorkspaceColor = '#ffffff',
  setCanvaWorkspaceColor
}) => {
  const page = pages[activePageIndex];

  const cachedPropsRef = useRef(null);
  const lastParsedHtmlRef = useRef(null);
  const lastParsedIndexRef = useRef(null);

  // Memoize extracted attributes from page.html so we never parse SVG during render
  const pageProps = useMemo(() => {
    if (!page || !page.html) {
      return {
        currentBg: '#ffffff',
        fillType: 'solid',
        fillOpacity: 1,
        currentBgStr: '#ffffff',
        bgImageUrl: '',
        bgImageName: 'Background Image.jpg',
        bgImageDim: '1920 X 1080 • 24MB',
        bgImageOpacity: 100,
        bgImageFit: 'Fit',
        strokeColor: 'none',
        strokeOpacity: 1,
        strokeWidth: 1,
        strokePosition: 'Inside',
        strokeDasharray: '',
        strokeLineCorner: 'Sharp',
        lineStyle: 'solid',
        dashLen: 8,
        dashGap: 4
      };
    }

    if (
      lastParsedIndexRef.current === activePageIndex &&
      (page.html === lastParsedHtmlRef.current || (window.__lastCommittedOverlayHtml && page.html === window.__lastCommittedOverlayHtml)) &&
      cachedPropsRef.current
    ) {
      return cachedPropsRef.current;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(page.html, 'image/svg+xml');
    const overlay = doc.querySelector('[data-bg-image]') || doc.querySelector('[data-name="Overlay"]') || doc.querySelector('[data-type="background"]') || doc.querySelector('rect');

    // Background Color
    const currentBg = overlay?.getAttribute('fill') || '#ffffff';
    const fillType = overlay?.getAttribute('fill-type') || 'solid';
    const fillOpacity = safeParseFloat(overlay?.getAttribute('fill-opacity'), 1);

    let currentBgStr = currentBg;
    if (fillType === 'gradient' || currentBg.toLowerCase().includes('url(#')) {
      const stopsJson = overlay?.getAttribute('fill-stops');
      const stops = stopsJson ? JSON.parse(stopsJson) : [];
      const gType = overlay?.getAttribute('fill-gradient-type') || 'linear';
      if (stops.length > 0) {
        currentBgStr = generateGradientString(
          gType.charAt(0).toUpperCase() + gType.slice(1),
          stops.map(s => ({ ...s, opacity: (s.opacity !== undefined ? s.opacity : 1) * 100 })),
          parseInt(overlay?.getAttribute('fill-angle') || '0'),
          parseInt(overlay?.getAttribute('fill-radius') || '100')
        );
      }
    }

    // Background Image on page
    const bgImageEl = doc.querySelector('image[data-name="Page Background Image"]') || doc.querySelector('[data-type="page-background-image"]');
    const rawBgImageUrl = bgImageEl?.getAttribute('href') || bgImageEl?.getAttribute('xlink:href') || overlay?.getAttribute('data-bg-image') || '';
    const bgImageUrl = rawBgImageUrl ? resolveUploadsPath(rawBgImageUrl) : '';

    // Smart filename derivation from URL if data-filename is placeholder or missing
    const getCleanNameFromUrl = (urlStr) => {
      if (!urlStr) return 'Background Image.jpg';
      try {
        const cleanPath = urlStr.split('?')[0].split('#')[0];
        const lastPart = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
        if (lastPart) {
          const decoded = decodeURIComponent(lastPart);
          // Strip timestamp or uuid prefixes if generated like 172938473_filename.png or uuid-filename.png
          const cleanName = decoded.replace(/^[0-9a-fA-F-]+_/, '').replace(/^\d{10,}_/, '');
          return cleanName || decoded;
        }
      } catch (e) {}
      return 'Background Image.jpg';
    };

    let rawName = bgImageEl?.getAttribute('data-filename') || overlay?.getAttribute('data-bg-image-name') || '';
    if (!rawName || rawName === 'Background Image.jpg') {
      rawName = getCleanNameFromUrl(rawBgImageUrl);
    }
    const bgImageName = rawName;

    let rawDim = bgImageEl?.getAttribute('data-dimensions') || overlay?.getAttribute('data-bg-image-dim') || '';
    if (!rawDim || rawDim === '1920 X 1080 • 24MB') {
      rawDim = '';
    }
    const bgImageDim = rawDim;

    let rawOp = 100;
    if (overlay?.getAttribute('data-bg-opacity') !== null && overlay?.getAttribute('data-bg-opacity') !== undefined) {
      rawOp = parseInt(overlay.getAttribute('data-bg-opacity'), 10);
    } else if (overlay?.getAttribute('opacity') !== null && overlay?.getAttribute('opacity') !== undefined) {
      rawOp = Math.round(safeParseFloat(overlay.getAttribute('opacity'), 1) * 100);
    } else if (bgImageEl?.getAttribute('opacity') !== null && bgImageEl?.getAttribute('opacity') !== undefined) {
      rawOp = Math.round(safeParseFloat(bgImageEl.getAttribute('opacity'), 1) * 100);
    }
    const bgImageOpacity = isNaN(rawOp) ? 100 : rawOp;

    const bgImageFit = bgImageEl?.getAttribute('data-fix-type') || overlay?.getAttribute('data-fix-type') || overlay?.getAttribute('data-bg-fit') || 'Fit';

    // Stroke Properties on Overlay & Page Border
    const pageBorder = doc.querySelector('[data-name="Page Border"]') || doc.getElementById(`page-border-${activePageIndex}`);
    const strokeColor = pageBorder?.getAttribute('stroke') || overlay?.getAttribute('data-stroke-color') || overlay?.getAttribute('stroke') || 'none';
    const rawStrokeOp = pageBorder?.getAttribute('stroke-opacity') ?? overlay?.getAttribute('stroke-opacity');
    const strokeOpacity = safeParseFloat(rawStrokeOp, 1);
    const rawStrokeWidth = pageBorder?.getAttribute('stroke-width') ?? overlay?.getAttribute('stroke-width');
    const strokeWidth = safeParseFloat(rawStrokeWidth, 1);
    const strokePosition = overlay?.getAttribute('data-stroke-position') || 'Inside';
    const strokeDasharray = pageBorder?.getAttribute('stroke-dasharray') || overlay?.getAttribute('stroke-dasharray') || '';
    const strokeLineCorner = (pageBorder?.getAttribute('stroke-linejoin') || overlay?.getAttribute('stroke-linejoin')) === 'round' ? 'Rounded' : 'Sharp';

    const isDashDot = strokeDasharray && (strokeDasharray.split(/[\s,]+/).length >= 4 || strokeDasharray.includes('2,'));
    const isDashed = Boolean(strokeDasharray && strokeDasharray !== 'none' && !isDashDot);
    const lineStyle = isDashDot ? 'dash-dot' : (isDashed ? 'dashed' : 'solid');

    let dashLen = 8;
    let dashGap = 4;
    if (strokeDasharray && strokeDasharray !== 'none') {
      const parts = strokeDasharray.split(/[\s,]+/).map(parseFloat);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        dashLen = parts[0];
        dashGap = parts[1];
      }
    }

    const result = {
      currentBg,
      fillType,
      fillOpacity,
      currentBgStr,
      bgImageUrl,
      bgImageName,
      bgImageDim,
      bgImageOpacity,
      bgImageFit,
      strokeColor,
      strokeOpacity,
      strokeWidth,
      strokePosition,
      strokeDasharray,
      strokeLineCorner,
      lineStyle,
      dashLen,
      dashGap
    };

    lastParsedHtmlRef.current = page.html;
    lastParsedIndexRef.current = activePageIndex;
    cachedPropsRef.current = result;
    return result;
  }, [page?.id, page?.html, activePageIndex]);

  // Local state for instant visual feedback during continuous interactions (sliders/color picker)
  const [pageColorAccordionOpen, setPageColorAccordionOpen] = useState(true);
  const [strokeColorAccordionOpen, setStrokeColorAccordionOpen] = useState(true);
  const [canvaColorAccordionOpen, setCanvaColorAccordionOpen] = useState(true);
  const [activePageColorPicker, setActivePageColorPicker] = useState(null); // 'pageColor' | 'strokeColor' | 'canvaColor'

  const [liveBgColor, setLiveBgColor] = useState(pageProps.currentBgStr);
  const [liveStrokeColor, setLiveStrokeColor] = useState(pageProps.strokeColor);
  const [liveStrokeWidth, setLiveStrokeWidth] = useState(pageProps.strokeWidth);
  const [liveBgImageOpacity, setLiveBgImageOpacity] = useState(pageProps.bgImageOpacity);
  const [liveBgImageFit, setLiveBgImageFit] = useState(pageProps.bgImageFit);
  const [naturalDim, setNaturalDim] = useState('');
  const [liveDashLen, setLiveDashLen] = useState(pageProps.dashLen);
  const [liveDashGap, setLiveDashGap] = useState(pageProps.dashGap);
  const [liveLineCorner, setLiveLineCorner] = useState(pageProps.strokeLineCorner);
  const [liveLineStyle, setLiveLineStyle] = useState(pageProps.lineStyle);
  const [liveStrokePosition, setLiveStrokePosition] = useState(pageProps.strokePosition);

  // Load natural image dimensions and content length dynamically if not pre-stored
  useEffect(() => {
    if (!pageProps.bgImageUrl) {
      setNaturalDim('');
      return;
    }

    if (pageProps.bgImageDim && !pageProps.bgImageDim.includes('1920 X 1080 • 24MB')) {
      setNaturalDim(pageProps.bgImageDim);
      return;
    }

    let isCancelled = false;
    const img = new Image();
    img.onload = () => {
      if (isCancelled) return;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (w && h) {
        // Try fetching HEAD to get real file size if possible
        let dimText = `${w} X ${h}`;
        fetch(pageProps.bgImageUrl, { method: 'HEAD' })
          .then(res => {
            const bytes = res.headers.get('content-length');
            if (bytes && !isCancelled) {
              const mb = (parseInt(bytes, 10) / (1024 * 1024)).toFixed(1);
              const kb = (parseInt(bytes, 10) / 1024).toFixed(0);
              const sizeStr = parseFloat(mb) >= 1 ? `${mb}MB` : `${kb}KB`;
              dimText = `${w} X ${h} • ${sizeStr}`;
            }
            if (!isCancelled) setNaturalDim(dimText);
          })
          .catch(() => {
            if (!isCancelled) setNaturalDim(dimText);
          });
      }
    };
    img.src = pageProps.bgImageUrl;

    return () => {
      isCancelled = true;
    };
  }, [pageProps.bgImageUrl, pageProps.bgImageDim]);

  // Synchronize local states whenever external pageProps change
  useEffect(() => {
    setLiveBgColor(pageProps.currentBgStr);
    setLiveStrokeColor(pageProps.strokeColor);
    setLiveStrokeWidth(pageProps.strokeWidth);
    setLiveBgImageOpacity(pageProps.bgImageOpacity);
    setLiveBgImageFit(pageProps.bgImageFit);
    setLiveDashLen(pageProps.dashLen);
    setLiveDashGap(pageProps.dashGap);
    setLiveLineCorner(pageProps.strokeLineCorner);
    setLiveLineStyle(pageProps.lineStyle);
    setLiveStrokePosition(pageProps.strokePosition);
  }, [pageProps]);

  // Debounced commit for Overlay attributes to prevent freezing history & DOM
  const commitTimerRef = useRef(null);
  const pendingAttrsRef = useRef({});

  const flushCommit = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    const attrsToCommit = pendingAttrsRef.current;
    pendingAttrsRef.current = {};
    if (Object.keys(attrsToCommit).length === 0) return;

    window.__skipCanvasUpdateForPage = activePageIndex;

    // Pre-emptively update cachedPropsRef so that when setPages causes a re-render,
    // pageProps returns the SAME cached reference and doesn't re-parse SVG or trigger useEffect!
    if (cachedPropsRef.current) {
      const updated = { ...cachedPropsRef.current };
      if (attrsToCommit.fill !== undefined) {
        updated.currentBg = attrsToCommit.fill;
        updated.currentBgStr = attrsToCommit.fill;
      }
      if (attrsToCommit['fill-type'] !== undefined) updated.fillType = attrsToCommit['fill-type'];
      if (attrsToCommit['fill-opacity'] !== undefined) updated.fillOpacity = safeParseFloat(attrsToCommit['fill-opacity'], 1);
      if (attrsToCommit.stroke !== undefined) updated.strokeColor = attrsToCommit.stroke;
      if (attrsToCommit['stroke-width'] !== undefined) updated.strokeWidth = safeParseFloat(attrsToCommit['stroke-width'], 1);
      if (attrsToCommit['stroke-dasharray'] !== undefined) updated.strokeDasharray = attrsToCommit['stroke-dasharray'];
      if (attrsToCommit['stroke-opacity'] !== undefined) updated.strokeOpacity = safeParseFloat(attrsToCommit['stroke-opacity'], 1);
      if (attrsToCommit['stroke-linejoin'] !== undefined) updated.strokeLineCorner = attrsToCommit['stroke-linejoin'] === 'round' ? 'Rounded' : 'Sharp';
      if (attrsToCommit['data-stroke-position'] !== undefined) updated.strokePosition = attrsToCommit['data-stroke-position'];
      cachedPropsRef.current = updated;
    }

    updateElementAttribute(activePageIndex, 'Overlay', attrsToCommit);
  }, [activePageIndex, updateElementAttribute]);

  const commitOverlayAttrs = useCallback((newAttrs, immediate = false) => {
    pendingAttrsRef.current = { ...pendingAttrsRef.current, ...newAttrs };
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }

    if (immediate) {
      flushCommit();
    } else {
      commitTimerRef.current = setTimeout(flushCommit, 200);
    }
  }, [flushCommit]);

  useEffect(() => {
    window.__flushPageOverlayCommit = flushCommit;
    return () => {
      if (window.__flushPageOverlayCommit === flushCommit) {
        window.__flushPageOverlayCommit = null;
      }
      flushCommit();
    };
  }, [flushCommit]);

  const handleStrokeColorChange = useCallback((newColor, immediate = false) => {
    setLiveStrokeColor(newColor);
    if (!newColor || newColor === 'none') {
      const updates = { stroke: 'none' };
      updateLiveCanvasOverlay(activePageIndex, updates);
      commitOverlayAttrs(updates, immediate);
      return;
    }
    let v = newColor;
    if (v && !v.startsWith('#') && !v.startsWith('rgb')) v = '#' + v;
    const effectiveW = liveStrokeWidth > 0 ? liveStrokeWidth : 1;
    if (liveStrokeWidth <= 0) {
      setLiveStrokeWidth(1);
    }
    const updates = {
      stroke: v,
      'stroke-width': effectiveW.toString()
    };
    updateLiveCanvasOverlay(activePageIndex, updates);
    commitOverlayAttrs(updates, immediate);
  }, [activePageIndex, liveStrokeWidth, commitOverlayAttrs]);

  const handleStrokeWidthChange = useCallback((newWidth, immediate = false) => {
    const nextW = Math.max(0, newWidth);
    setLiveStrokeWidth(nextW);
    const updates = { 'stroke-width': nextW.toString() };
    if (nextW > 0 && (!liveStrokeColor || liveStrokeColor === 'none')) {
      updates['stroke'] = '#000000';
      setLiveStrokeColor('#000000');
    }
    updateLiveCanvasOverlay(activePageIndex, updates);
    commitOverlayAttrs(updates, immediate);
  }, [activePageIndex, liveStrokeColor, commitOverlayAttrs]);

  const handleUpdatePageBgImage = useCallback((updates) => {
    if (updates.fit !== undefined) {
      setLiveBgImageFit(updates.fit);
    }
    // Read starting SVG either from live canvas DOM (most up-to-date) or page?.html
    const liveContainer = document.getElementById(`canvas-content-${activePageIndex}`);
    const liveSvg = liveContainer?.querySelector('svg');
    const sourceHtml = (liveSvg ? liveSvg.outerHTML : page?.html) || '';

    const curDoc = new DOMParser().parseFromString(sourceHtml, 'image/svg+xml');
    const svg = curDoc.querySelector('svg');
    if (!svg) return;
    let ov = curDoc.querySelector('[data-bg-image]') || curDoc.querySelector('[data-name="Overlay"]') || curDoc.querySelector('[data-type="background"]') || curDoc.querySelector('rect');
    let imgNode = curDoc.querySelector('image[data-name="Page Background Image"]') || curDoc.querySelector('[data-type="page-background-image"]');
    let borderNode = curDoc.querySelector('[data-name="Page Border"]');

    const liveImg = liveContainer?.querySelector('image[data-name="Page Background Image"]') || liveContainer?.querySelector('[data-type="page-background-image"]');

    let baseW = parseFloat(svg.getAttribute('width') || ov?.getAttribute('width') || '794');
    let baseH = parseFloat(svg.getAttribute('height') || ov?.getAttribute('height') || '1123');
    if (svg.getAttribute('viewBox')) {
      const vbParts = svg.getAttribute('viewBox').trim().split(/[\s,]+/).map(parseFloat);
      if (vbParts.length >= 4 && !isNaN(vbParts[2]) && !isNaN(vbParts[3])) {
        baseW = vbParts[2];
        baseH = vbParts[3];
      }
    }

    if (updates.remove) {
      if (imgNode) imgNode.remove();
      if (ov) {
        ov.removeAttribute('data-bg-image');
        ov.removeAttribute('data-bg-image-name');
        ov.removeAttribute('data-bg-image-dim');
        ov.removeAttribute('data-bg-opacity');
        ov.removeAttribute('data-bg-fit');
        ov.removeAttribute('data-fix-type');
      }
      if (liveImg) liveImg.remove();
    } else {
      const activeUrl = updates.url !== undefined ? updates.url : (imgNode?.getAttribute('href') || imgNode?.getAttribute('xlink:href') || ov?.getAttribute('data-bg-image') || '');
      const getCleanName = (urlStr, fallback = '') => {
        if (fallback && fallback !== 'Background Image.jpg') return fallback;
        if (!urlStr) return 'Background Image.jpg';
        try {
          const p = urlStr.split('?')[0].split('#')[0];
          const lp = p.substring(p.lastIndexOf('/') + 1);
          return decodeURIComponent(lp).replace(/^[0-9a-fA-F-]+_/, '').replace(/^\d{10,}_/, '') || 'Background Image.jpg';
        } catch (e) { return 'Background Image.jpg'; }
      };
      const rawNameCandidate = imgNode?.getAttribute('data-filename') || ov?.getAttribute('data-bg-image-name');
      const activeName = updates.name !== undefined ? updates.name : getCleanName(activeUrl, rawNameCandidate);
      const rawDimCandidate = imgNode?.getAttribute('data-dimensions') || ov?.getAttribute('data-bg-image-dim') || '';
      const activeDim = updates.dim !== undefined ? updates.dim : (rawDimCandidate === '1920 X 1080 • 24MB' ? '' : rawDimCandidate);
      const activeOpacity = updates.opacity !== undefined ? (updates.opacity / 100).toString() : (imgNode?.getAttribute('opacity') || (ov?.getAttribute('data-bg-opacity') ? (parseFloat(ov.getAttribute('data-bg-opacity')) / 100).toString() : '1'));
      const activeFit = updates.fit !== undefined ? updates.fit : (imgNode?.getAttribute('data-fix-type') || ov?.getAttribute('data-bg-fit') || ov?.getAttribute('data-fix-type') || 'Fit');

      if (!imgNode && activeUrl) {
        imgNode = curDoc.createElementNS('http://www.w3.org/2000/svg', 'image');
        imgNode.setAttribute('id', `page-bg-img-${Date.now()}`);
        imgNode.setAttribute('data-name', 'Page Background Image');
        imgNode.setAttribute('data-type', 'page-background-image');
        imgNode.setAttribute('x', '0');
        imgNode.setAttribute('y', '0');
        imgNode.setAttribute('width', baseW.toString());
        imgNode.setAttribute('height', baseH.toString());
        imgNode.setAttribute('style', 'pointer-events: none;');
        if (borderNode) {
          borderNode.parentNode.insertBefore(imgNode, borderNode);
        } else if (ov && ov.nextSibling) {
          ov.parentNode.insertBefore(imgNode, ov.nextSibling);
        } else if (ov) {
          ov.parentNode.appendChild(imgNode);
        } else {
          svg.insertBefore(imgNode, svg.firstChild);
        }
      }

      if (imgNode) {
        imgNode.setAttribute('width', baseW.toString());
        imgNode.setAttribute('height', baseH.toString());

        if (activeUrl) {
          imgNode.setAttribute('href', activeUrl);
          imgNode.setAttribute('xlink:href', activeUrl);
          if (ov) ov.setAttribute('data-bg-image', activeUrl);
          if (liveImg) {
            liveImg.setAttribute('href', activeUrl);
            liveImg.setAttribute('xlink:href', activeUrl);
            liveImg.setAttribute('width', baseW.toString());
            liveImg.setAttribute('height', baseH.toString());
          }
        }
        imgNode.setAttribute('data-filename', activeName);
        if (ov) ov.setAttribute('data-bg-image-name', activeName);

        imgNode.setAttribute('data-dimensions', activeDim);
        if (ov) ov.setAttribute('data-bg-image-dim', activeDim);

        imgNode.setAttribute('opacity', activeOpacity);
        if (ov) ov.setAttribute('data-bg-opacity', Math.round(parseFloat(activeOpacity) * 100).toString());
        if (liveImg) liveImg.setAttribute('opacity', activeOpacity);

        imgNode.setAttribute('data-fix-type', activeFit);
        if (ov) {
          ov.setAttribute('data-bg-fit', activeFit);
          ov.setAttribute('data-fix-type', activeFit);
        }
        const aspect = activeFit === 'Fit' ? 'xMidYMid meet' : (activeFit === 'Fill' ? 'xMidYMid slice' : 'none');
        imgNode.setAttribute('preserveAspectRatio', aspect);
        if (liveImg) {
          liveImg.setAttribute('data-fix-type', activeFit);
          liveImg.setAttribute('preserveAspectRatio', aspect);
        }
      }
    }

    // Pre-emptively update cachedPropsRef
    if (cachedPropsRef.current) {
      cachedPropsRef.current = {
        ...cachedPropsRef.current,
        ...(updates.fit !== undefined ? { bgImageFit: updates.fit } : {}),
        ...(updates.opacity !== undefined ? { bgImageOpacity: updates.opacity } : {})
      };
    }

    const serializer = new XMLSerializer();
    const newHtml = serializer.serializeToString(curDoc);
    updateElementAttribute(activePageIndex, 'Overlay', '__dom_sync__', newHtml);
  }, [activePageIndex, page?.html, updateElementAttribute]);

  // Debounced wrapper for background image opacity slider
  const bgImgTimerRef = useRef(null);
  const handleBgImageOpacitySlide = useCallback((val) => {
    setLiveBgImageOpacity(val);
    const liveContainer = document.getElementById(`canvas-content-${activePageIndex}`);
    const liveImg = liveContainer?.querySelector('image[data-name="Page Background Image"]');
    if (liveImg) liveImg.setAttribute('opacity', (val / 100).toString());

    if (bgImgTimerRef.current) clearTimeout(bgImgTimerRef.current);
    bgImgTimerRef.current = setTimeout(() => {
      handleUpdatePageBgImage({ opacity: val });
    }, 150);
  }, [activePageIndex, handleUpdatePageBgImage]);

  return (
    <div className="flex flex-col gap-[2.5vh]">
      {/* ================= PAGE PROPERTIES SECTION ================= */}
      <div className="flex flex-col gap-[1.2vh]">
        <div className="flex items-center gap-[0.75vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
            Page Properties
          </span>
          <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
        </div>

        {/* Background Image Upload / Preview Box */}
        {!pageProps.bgImageUrl ? (
          /* Empty State: + Add File dashed container */
          <div
            onClick={() => setIsPageBgModalOpen(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-[0.75vw] bg-[#F9FAFB] hover:bg-white hover:border-[#6366F1] transition-all p-[1.4vw] flex items-center justify-center cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-[0.5vw] text-gray-500 group-hover:text-[#6366F1] font-medium text-[0.85vw]">
              <Plus size="1vw" strokeWidth={2.2} />
              <span>Add File</span>
            </div>
          </div>
        ) : (
          /* Active State: Image Fix Type + Preview Card + Opacity Slider */
          <div className="flex flex-col gap-[1.2vh]">
            {/* Image fix type dropdown */}
            <div className="flex items-center justify-between">
              <span className="text-[0.8vw] font-medium text-gray-700">Image fix type :</span>
              <div className="relative">
                <select
                  value={liveBgImageFit}
                  onChange={(e) => handleUpdatePageBgImage({ fit: e.target.value })}
                  className="appearance-none bg-white border border-gray-200 rounded-[0.5vw] px-[0.8vw] py-[0.4vw] pr-[1.8vw] text-[0.78vw] font-medium text-gray-800 outline-none hover:border-gray-400 cursor-pointer shadow-2xs"
                >
                  <option value="Fit">Fit</option>
                  <option value="Fill">Fill</option>
                  <option value="Stretch">Stretch</option>
                </select>
                <ChevronDown size="0.8vw" className="absolute right-[0.5vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Image Preview Card */}
            <div className="bg-white border border-gray-200 rounded-[0.75vw] p-[0.6vw] flex items-center gap-[0.75vw] shadow-2xs">
              <div className="w-[3.8vw] h-[2.8vw] rounded-[0.4vw] overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                <img src={pageProps.bgImageUrl} alt="Page Background" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className="text-[0.78vw] font-medium text-gray-900 truncate leading-snug">
                  {pageProps.bgImageName}
                </span>
                <span className="text-[0.65vw] text-gray-400 truncate mb-[0.3vh]">
                  {naturalDim || pageProps.bgImageDim || ''}
                </span>
                <div className="flex items-center gap-[0.4vw]">
                  <button
                    onClick={() => setIsPageBgModalOpen(true)}
                    className="text-[0.7vw] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-[0.6vw] py-[0.2vh] rounded-[0.35vw] transition-colors shadow-2xs"
                  >
                    Replace Image
                  </button>
                  <button
                    onClick={() => handleUpdatePageBgImage({ remove: true })}
                    className="p-[0.3vw] text-gray-400 hover:text-red-500 rounded-[0.3vw] hover:bg-red-50 transition-colors"
                    title="Delete Background Image"
                  >
                    <Trash2 size="0.85vw" />
                  </button>
                </div>
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center justify-between gap-[0.8vw]">
              <span className="text-[0.8vw] font-medium text-gray-700 whitespace-nowrap">Opacity :</span>
              <input
                type="range"
                min="0"
                max="100"
                value={liveBgImageOpacity}
                onChange={(e) => handleBgImageOpacitySlide(parseInt(e.target.value))}
                className="flex-1 accent-[#4F46E5] h-[0.3vw] bg-gray-200 rounded-lg cursor-pointer"
              />
              <span className="text-[0.75vw] font-medium text-gray-800 bg-gray-100 px-[0.5vw] py-[0.2vh] rounded-[0.35vw] min-w-[2.2vw] text-center border border-gray-200 shadow-2xs">
                {liveBgImageOpacity} %
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ================= PAGE COLOR ACCORDION ================= */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div
          onClick={() => setPageColorAccordionOpen(!pageColorAccordionOpen)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
        >
          <span className="text-[14px] font-semibold text-gray-900 tracking-tight">Page Color</span>
          {pageColorAccordionOpen ? (
            <ChevronUp size={18} className="text-gray-900" strokeWidth={2.2} />
          ) : (
            <ChevronDown size={18} className="text-gray-900" strokeWidth={2.2} />
          )}
        </div>

        {pageColorAccordionOpen && (
          <div className="p-4 pt-1 border-t border-gray-100/80 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {/* Color Swatch */}
              <div
                onClick={() => setActivePageColorPicker(activePageColorPicker === 'pageColor' ? null : 'pageColor')}
                className="w-10 h-10 rounded-[8px] border border-gray-300/90 shadow-2xs cursor-pointer flex-shrink-0 relative overflow-hidden transition-transform hover:scale-105"
                style={{ background: liveBgColor }}
              />
              {/* Hex Input & Opacity */}
              <div className="flex-1 h-10 border border-gray-200 rounded-[8px] bg-white flex items-center justify-between px-3 shadow-2xs hover:border-gray-300 transition-colors">
                <input
                  type="text"
                  value={liveBgColor.startsWith('#') ? liveBgColor.toUpperCase() : liveBgColor}
                  onChange={(e) => {
                    let v = e.target.value;
                    setLiveBgColor(v);
                    if (v && !v.startsWith('#') && !v.includes('gradient')) v = '#' + v;
                    const attrs = { fill: v, 'fill-type': 'solid' };
                    updateLiveCanvasOverlay(activePageIndex, attrs);
                    commitOverlayAttrs(attrs, false);
                  }}
                  onBlur={() => {
                    let v = liveBgColor;
                    if (v && !v.startsWith('#') && !v.includes('gradient')) v = '#' + v;
                    const attrs = { fill: v, 'fill-type': 'solid' };
                    updateLiveCanvasOverlay(activePageIndex, attrs);
                    commitOverlayAttrs(attrs, true);
                  }}
                  className="text-[13px] font-normal text-gray-800 outline-none uppercase w-20 bg-transparent tracking-wide"
                />
                <span className="text-[13px] text-gray-700 font-normal select-none">
                  {Math.round(pageProps.fillOpacity * 100)}%
                </span>
              </div>
              {/* Format dropdown */}
              <div className="h-10 border border-gray-200 rounded-[8px] bg-white flex items-center gap-1.5 px-3 shadow-2xs cursor-pointer hover:border-gray-300 transition-colors">
                <span className="text-[13px] font-normal text-gray-800 select-none">HEX</span>
                <ChevronDown size={14} className="text-gray-600" strokeWidth={2} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= STROKE COLOR ACCORDION ================= */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div
          onClick={() => setStrokeColorAccordionOpen(!strokeColorAccordionOpen)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
        >
          <span className="text-[14px] font-semibold text-gray-900 tracking-tight">Stoke Color</span>
          {strokeColorAccordionOpen ? (
            <ChevronUp size={18} className="text-gray-900" strokeWidth={2.2} />
          ) : (
            <ChevronDown size={18} className="text-gray-900" strokeWidth={2.2} />
          )}
        </div>

        {strokeColorAccordionOpen && (
          <div className="p-4 pt-1 border-t border-gray-100/80 flex flex-col gap-3.5">
            {/* Row 1: Swatch + Hex/Opacity + HEX */}
            <div className="flex items-center gap-2">
              <div
                onClick={() => setActivePageColorPicker(activePageColorPicker === 'strokeColor' ? null : 'strokeColor')}
                className="w-10 h-10 rounded-[8px] border border-gray-300/90 shadow-2xs cursor-pointer flex-shrink-0 relative overflow-hidden flex items-center justify-center transition-transform hover:scale-105"
                style={{ background: (liveStrokeColor === 'none' || !liveStrokeColor) ? '#FFFFFF' : liveStrokeColor }}
              >
                {(liveStrokeColor === 'none' || !liveStrokeColor) && (
                  <div className="w-[140%] h-[1.5px] bg-red-500 rotate-45 absolute" />
                )}
              </div>
              <div className="flex-1 h-10 border border-gray-200 rounded-[8px] bg-white flex items-center justify-between px-3 shadow-2xs hover:border-gray-300 transition-colors">
                <input
                  type="text"
                  value={liveStrokeColor === 'none' ? '#000000' : (liveStrokeColor.startsWith('#') ? liveStrokeColor.toUpperCase() : liveStrokeColor)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLiveStrokeColor(v);
                    if (v && (v.length === 4 || v.length === 7 || v.startsWith('#'))) {
                      handleStrokeColorChange(v, false);
                    }
                  }}
                  onBlur={() => {
                    handleStrokeColorChange(liveStrokeColor, true);
                  }}
                  className="text-[13px] font-normal text-gray-800 outline-none uppercase w-20 bg-transparent tracking-wide"
                />
                <span className="text-[13px] text-gray-700 font-normal select-none">
                  {Math.round(safeParseFloat(pageProps.strokeOpacity, 1) * 100)}%
                </span>
              </div>
              <div className="h-10 border border-gray-200 rounded-[8px] bg-white flex items-center gap-1.5 px-3 shadow-2xs cursor-pointer hover:border-gray-300 transition-colors">
                <span className="text-[13px] font-normal text-gray-800 select-none">HEX</span>
                <ChevronDown size={14} className="text-gray-600" strokeWidth={2} />
              </div>
            </div>

            {/* Row 2: Alignment & Stoke Width */}
            <div className="grid grid-cols-2 gap-3">
              {/* Alignment */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-gray-500 font-normal select-none">Alignment</span>
                <div className="relative">
                  <select
                    value={liveStrokePosition}
                    onChange={(e) => {
                      const pos = e.target.value;
                      setLiveStrokePosition(pos);
                      const updates = { 'data-stroke-position': pos };
                      updateLiveCanvasOverlay(activePageIndex, updates);
                      commitOverlayAttrs(updates, false);
                    }}
                    className="w-full h-10 appearance-none bg-white border border-gray-200 rounded-[8px] px-3 pr-8 text-[13px] text-gray-800 outline-none cursor-pointer hover:border-gray-300 transition-colors shadow-2xs font-normal"
                  >
                    <option value="Inside">Inside</option>
                    <option value="Center">Center</option>
                    <option value="Outside">Outside</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" strokeWidth={2} />
                </div>
              </div>

              {/* Stoke Width: Separate [-] [ 1 ] [+] buttons */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-gray-500 font-normal select-none">Stoke Width</span>
                <div className="flex items-center gap-1.5 h-10">
                  <button
                    type="button"
                    onClick={() => handleStrokeWidthChange(liveStrokeWidth - 1, false)}
                    className="w-10 h-10 rounded-[8px] bg-[#F3F4F6] hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer flex-shrink-0"
                    title="Decrease stroke width"
                  >
                    <Minus size={14} strokeWidth={2.2} />
                  </button>
                  <div className="flex-1 h-10 border border-gray-200 rounded-[8px] bg-white flex items-center justify-center shadow-2xs hover:border-gray-300 transition-colors">
                    <input
                      type="number"
                      min="0"
                      value={liveStrokeWidth}
                      onChange={(e) => {
                        const nextW = Math.max(0, parseInt(e.target.value) || 0);
                        handleStrokeWidthChange(nextW, false);
                      }}
                      onBlur={() => {
                        handleStrokeWidthChange(liveStrokeWidth, true);
                      }}
                      className="w-full text-center text-[13px] font-normal text-gray-800 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStrokeWidthChange(liveStrokeWidth + 1, false)}
                    className="w-10 h-10 rounded-[8px] bg-[#F3F4F6] hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer flex-shrink-0"
                    title="Increase stroke width"
                  >
                    <Plus size={14} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Line style & Dash Property */}
            <div className="grid grid-cols-2 gap-3">
              {/* Line style */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-gray-500 font-normal select-none">Line style</span>
                <div className="flex items-center gap-1.5 h-10">
                  {/* Solid */}
                  <button
                    type="button"
                    onClick={() => {
                      setLiveLineStyle('solid');
                      const updates = { 'stroke-dasharray': 'none' };
                      if (!liveStrokeColor || liveStrokeColor === 'none') {
                        updates['stroke'] = '#000000';
                        setLiveStrokeColor('#000000');
                      }
                      const effectiveW = liveStrokeWidth > 0 ? liveStrokeWidth : 1;
                      updates['stroke-width'] = effectiveW.toString();
                      if (liveStrokeWidth <= 0) {
                        setLiveStrokeWidth(1);
                      }
                      updateLiveCanvasOverlay(activePageIndex, updates);
                      commitOverlayAttrs(updates, false);
                    }}
                    className={`flex-1 h-10 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                      liveLineStyle === 'solid'
                        ? 'bg-white border border-gray-200 shadow-xs text-gray-800'
                        : 'bg-[#F3F4F6] hover:bg-gray-200 text-gray-500'
                    }`}
                    title="Solid line"
                  >
                    <svg width="26" height="12" viewBox="0 0 26 12" fill="none" className="overflow-visible">
                      <line x1="2" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Dashed */}
                  <button
                    type="button"
                    onClick={() => {
                      setLiveLineStyle('dashed');
                      const effectiveLen = liveDashLen > 0 ? liveDashLen : 8;
                      const effectiveGap = liveDashGap > 0 ? liveDashGap : 4;
                      const updates = { 'stroke-dasharray': `${effectiveLen},${effectiveGap}` };
                      if (!liveStrokeColor || liveStrokeColor === 'none') {
                        updates['stroke'] = '#000000';
                        setLiveStrokeColor('#000000');
                      }
                      const effectiveW = liveStrokeWidth > 0 ? liveStrokeWidth : 1;
                      updates['stroke-width'] = effectiveW.toString();
                      if (liveStrokeWidth <= 0) {
                        setLiveStrokeWidth(1);
                      }
                      updateLiveCanvasOverlay(activePageIndex, updates);
                      commitOverlayAttrs(updates, false);
                    }}
                    className={`flex-1 h-10 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                      liveLineStyle === 'dashed'
                        ? 'bg-white border border-gray-200 shadow-xs text-gray-800'
                        : 'bg-[#F3F4F6] hover:bg-gray-200 text-gray-500'
                    }`}
                    title="Dashed line"
                  >
                    <svg width="26" height="12" viewBox="0 0 26 12" fill="none" className="overflow-visible">
                      <line x1="2" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3.5, 3" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Dash-dot */}
                  <button
                    type="button"
                    onClick={() => {
                      setLiveLineStyle('dash-dot');
                      const effectiveLen = liveDashLen > 0 ? liveDashLen : 8;
                      const effectiveGap = liveDashGap > 0 ? liveDashGap : 4;
                      const updates = { 'stroke-dasharray': `${effectiveLen},${effectiveGap},2,${effectiveGap}` };
                      if (!liveStrokeColor || liveStrokeColor === 'none') {
                        updates['stroke'] = '#000000';
                        setLiveStrokeColor('#000000');
                      }
                      const effectiveW = liveStrokeWidth > 0 ? liveStrokeWidth : 1;
                      updates['stroke-width'] = effectiveW.toString();
                      if (liveStrokeWidth <= 0) {
                        setLiveStrokeWidth(1);
                      }
                      updateLiveCanvasOverlay(activePageIndex, updates);
                      commitOverlayAttrs(updates, false);
                    }}
                    className={`flex-1 h-10 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                      liveLineStyle === 'dash-dot'
                        ? 'bg-white border border-gray-200 shadow-xs text-gray-800'
                        : 'bg-[#F3F4F6] hover:bg-gray-200 text-gray-500'
                    }`}
                    title="Dash-dot line"
                  >
                    <svg width="26" height="12" viewBox="0 0 26 12" fill="none" className="overflow-visible">
                      <line x1="2" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="7, 2.5, 2, 2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Dash Property: [ L    8 ] : [ G    4 ] */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-gray-500 font-normal select-none">Dash Property</span>
                <div className="flex items-center gap-1.5 h-10">
                  {/* Box 1: Length (L) */}
                  <div className="flex-1 h-10 border border-gray-200 rounded-[8px] bg-white flex items-center justify-between px-3 shadow-2xs hover:border-gray-300 transition-colors">
                    <span className="text-[13px] text-gray-500 font-normal select-none">L</span>
                    <input
                      type="number"
                      value={liveDashLen}
                      onChange={(e) => {
                        const l = Math.max(1, parseInt(e.target.value) || 1);
                        setLiveDashLen(l);
                        const updates = {
                          'stroke-dasharray': liveLineStyle === 'dash-dot' ? `${l},${liveDashGap},2,${liveDashGap}` : `${l},${liveDashGap}`
                        };
                        if (!liveStrokeColor || liveStrokeColor === 'none') {
                          updates['stroke'] = '#000000';
                          setLiveStrokeColor('#000000');
                        }
                        const effectiveW = liveStrokeWidth > 0 ? liveStrokeWidth : 1;
                        updates['stroke-width'] = effectiveW.toString();
                        if (liveStrokeWidth <= 0) {
                          setLiveStrokeWidth(1);
                        }
                        updateLiveCanvasOverlay(activePageIndex, updates);
                        commitOverlayAttrs(updates, false);
                      }}
                      onBlur={() => {
                        const updates = {
                          'stroke-dasharray': liveLineStyle === 'dash-dot' ? `${liveDashLen},${liveDashGap},2,${liveDashGap}` : `${liveDashLen},${liveDashGap}`
                        };
                        updateLiveCanvasOverlay(activePageIndex, updates);
                        commitOverlayAttrs(updates, true);
                      }}
                      className="w-8 text-right text-[13px] font-normal text-gray-800 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Colon separator */}
                  <span className="text-gray-500 font-medium text-[13px] select-none">:</span>

                  {/* Box 2: Gap (G) */}
                  <div className="flex-1 h-10 border border-gray-200 rounded-[8px] bg-white flex items-center justify-between px-3 shadow-2xs hover:border-gray-300 transition-colors">
                    <span className="text-[13px] text-gray-500 font-normal select-none">G</span>
                    <input
                      type="number"
                      value={liveDashGap}
                      onChange={(e) => {
                        const g = Math.max(1, parseInt(e.target.value) || 1);
                        setLiveDashGap(g);
                        const updates = {
                          'stroke-dasharray': liveLineStyle === 'dash-dot' ? `${liveDashLen},${g},2,${g}` : `${liveDashLen},${g}`
                        };
                        if (!liveStrokeColor || liveStrokeColor === 'none') {
                          updates['stroke'] = '#000000';
                          setLiveStrokeColor('#000000');
                        }
                        const effectiveW = liveStrokeWidth > 0 ? liveStrokeWidth : 1;
                        updates['stroke-width'] = effectiveW.toString();
                        if (liveStrokeWidth <= 0) {
                          setLiveStrokeWidth(1);
                        }
                        updateLiveCanvasOverlay(activePageIndex, updates);
                        commitOverlayAttrs(updates, false);
                      }}
                      onBlur={() => {
                        const updates = {
                          'stroke-dasharray': liveLineStyle === 'dash-dot' ? `${liveDashLen},${liveDashGap},2,${liveDashGap}` : `${liveDashLen},${liveDashGap}`
                        };
                        updateLiveCanvasOverlay(activePageIndex, updates);
                        commitOverlayAttrs(updates, true);
                      }}
                      className="w-8 text-right text-[13px] font-normal text-gray-800 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Line Corner */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-gray-500 font-normal select-none">Line Corner</span>
              <div className="relative">
                <select
                  value={liveLineCorner}
                  onChange={(e) => {
                    const corner = e.target.value;
                    setLiveLineCorner(corner);
                    const updates = { 'stroke-linejoin': corner === 'Rounded' ? 'round' : 'miter' };
                    updateLiveCanvasOverlay(activePageIndex, updates);
                    commitOverlayAttrs(updates, false);
                  }}
                  className="w-full h-10 appearance-none bg-white border border-gray-200 rounded-[8px] px-3 pr-8 text-[13px] text-gray-800 outline-none cursor-pointer hover:border-gray-300 transition-colors shadow-2xs font-normal"
                >
                  <option value="Rounded">Rounded</option>
                  <option value="Sharp">Sharp</option>
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" strokeWidth={2} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= CANVA PROPERTIES SECTION ================= */}
      <div className="flex flex-col gap-[1.2vh]">
        <div className="flex items-center gap-[0.75vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
            Canva Properties
          </span>
          <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
        </div>

        {/* Canva Color Accordion */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div
            onClick={() => setCanvaColorAccordionOpen(!canvaColorAccordionOpen)}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
          >
            <span className="text-[14px] font-semibold text-gray-900 tracking-tight">Canva Color</span>
            {canvaColorAccordionOpen ? (
              <ChevronUp size={18} className="text-gray-900" strokeWidth={2.2} />
            ) : (
              <ChevronDown size={18} className="text-gray-900" strokeWidth={2.2} />
            )}
          </div>

          {canvaColorAccordionOpen && (
            <div className="p-4 pt-1 border-t border-gray-100/80 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setActivePageColorPicker(activePageColorPicker === 'canvaColor' ? null : 'canvaColor')}
                  className="w-10 h-10 rounded-[8px] border border-gray-300/90 shadow-2xs cursor-pointer flex-shrink-0 relative overflow-hidden transition-transform hover:scale-105"
                  style={{ background: (!canvaWorkspaceColor || canvaWorkspaceColor === 'none' || canvaWorkspaceColor === 'transparent') ? '#FBFBFB' : canvaWorkspaceColor }}
                >
                  {(!canvaWorkspaceColor || canvaWorkspaceColor === 'none' || canvaWorkspaceColor === 'transparent') && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                  )}
                </div>
                <div className="flex-1 h-10 border border-gray-200 rounded-[8px] bg-white flex items-center justify-between px-3 shadow-2xs hover:border-gray-300 transition-colors">
                  <input
                    type="text"
                    value={(!canvaWorkspaceColor || canvaWorkspaceColor === 'none' || canvaWorkspaceColor === 'transparent') ? 'NONE' : canvaWorkspaceColor.toUpperCase()}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.toUpperCase() === 'NONE' || !val) {
                        val = 'none';
                      } else if (val && !val.startsWith('#')) {
                        val = '#' + val;
                      }
                      if (typeof setCanvaWorkspaceColor === 'function') {
                        setCanvaWorkspaceColor(val);
                      }
                      window.dispatchEvent(new CustomEvent('canvas-workspace-color-change', { detail: { color: val } }));
                    }}
                    className="text-[13px] font-normal text-gray-800 outline-none uppercase w-20 bg-transparent tracking-wide"
                  />
                  <span className="text-[13px] text-gray-700 font-normal select-none">100%</span>
                </div>
                <div className="h-10 border border-gray-200 rounded-[8px] bg-white flex items-center gap-1.5 px-3 shadow-2xs cursor-pointer hover:border-gray-300 transition-colors">
                  <span className="text-[13px] font-normal text-gray-800 select-none">HEX</span>
                  <ChevronDown size={14} className="text-gray-600" strokeWidth={2} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= GLOBAL COLOR PICKER PORTAL ================= */}
      {activePageColorPicker && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: '50%',
            right: '19.5vw',
            transform: 'translateY(-50%)'
          }}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200 relative">
            <ColorPicker
              color={
                activePageColorPicker === 'pageColor'
                  ? liveBgColor
                  : activePageColorPicker === 'strokeColor'
                    ? (liveStrokeColor === 'none' ? '#000000' : liveStrokeColor)
                    : canvaWorkspaceColor
              }
              onChange={(newVal, isDragging) => {
                if (activePageColorPicker === 'pageColor') {
                  setLiveBgColor(newVal);
                  let attrs;
                  if (newVal.includes('gradient')) {
                    const parsed = parseGradient(newVal);
                    if (parsed) {
                      attrs = {
                        'fill-type': 'gradient',
                        'fill-gradient-type': parsed.type.toLowerCase(),
                        'fill-stops': JSON.stringify(parsed.stops.map(s => ({
                          color: s.color,
                          offset: s.offset,
                          opacity: s.opacity / 100
                        }))),
                        'fill-angle': (parsed.angle || 0).toString(),
                        'fill-radius': (parsed.radius || 100).toString(),
                        'fill': newVal
                      };
                    } else {
                      attrs = { 'fill-type': 'solid', 'fill': newVal };
                    }
                  } else {
                    attrs = { 'fill-type': 'solid', 'fill': newVal };
                  }
                  // 1. Direct in-place DOM update on canvas (0ms)
                  updateLiveCanvasOverlay(activePageIndex, attrs);
                  // 2. Debounced commit (200ms) so browser paints instantly in milliseconds
                  commitOverlayAttrs(attrs, false);
                } else if (activePageColorPicker === 'strokeColor') {
                  handleStrokeColorChange(newVal, false);
                } else if (activePageColorPicker === 'canvaColor') {
                  if (typeof setCanvaWorkspaceColor === 'function') {
                    setCanvaWorkspaceColor(newVal);
                  }
                  window.dispatchEvent(new CustomEvent('canvas-workspace-color-change', { detail: { color: newVal } }));
                }
              }}
              opacity={
                activePageColorPicker === 'strokeColor'
                  ? Math.round(safeParseFloat(pageProps.strokeOpacity, 1) * 100)
                  : activePageColorPicker === 'pageColor'
                    ? Math.round(safeParseFloat(pageProps.fillOpacity, 1) * 100)
                    : 100
              }
              onOpacityChange={(op) => {
                if (activePageColorPicker === 'strokeColor') {
                  const dec = (op / 100).toString();
                  const updates = { 'stroke-opacity': dec };
                  updateLiveCanvasOverlay(activePageIndex, updates);
                  commitOverlayAttrs(updates, false);
                } else if (activePageColorPicker === 'pageColor') {
                  const dec = (op / 100).toString();
                  const updates = { 'fill-opacity': dec };
                  updateLiveCanvasOverlay(activePageIndex, updates);
                  commitOverlayAttrs(updates, false);
                }
              }}
              disableGradient={activePageColorPicker === 'strokeColor'}
              onClose={() => {
                commitOverlayAttrs({}, true);
                setActivePageColorPicker(null);
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

export default PagePropertiesPanel;
